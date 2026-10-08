import { prisma } from '../config/database.js';
import { format } from '../services/convert/userConvert.js';

// snake_case 映射（diaryService 读取 diary.id）
function mapDiary(d) {
  if (!d) return null;
  return {
    id: Number(d.id),
    user_id: Number(d.userId),
    diary_date: d.diaryDate,
    mood_score: d.moodScore,
    dominant_emotion: d.dominantEmotion,
    emotion_triggers: d.emotionTriggers,
    diary_content: d.diaryContent,
    sleep_quality: d.sleepQuality,
    stress_level: d.stressLevel,
    ai_emotion_analysis: d.aiEmotionAnalysis,
    ai_analysis_updated_at: d.aiAnalysisUpdatedAt,
    created_at: d.createdAt,
    updated_at: d.updatedAt,
  };
}

// 保存或更新情绪日记（user_id + diary_date 唯一 → UPSERT）
export async function upsertDiary(userId, diary) {
  const {
    diaryDate,
    moodScore,
    dominantEmotion,
    emotionTriggers,
    diaryContent,
    sleepQuality,
    stressLevel,
  } = diary;

  const data = {
    userId: BigInt(userId),
    diaryDate: new Date(diaryDate),
    moodScore,
    dominantEmotion: dominantEmotion || null,
    emotionTriggers: emotionTriggers || null,
    diaryContent: diaryContent || null,
    sleepQuality: sleepQuality ?? null,
    stressLevel: stressLevel ?? null,
  };

  const result = await prisma.emotionDiary.upsert({
    where: { user_date_unique: { userId: BigInt(userId), diaryDate: new Date(diaryDate) } },
    create: data,
    update: {
      moodScore,
      dominantEmotion: dominantEmotion || null,
      emotionTriggers: emotionTriggers || null,
      diaryContent: diaryContent || null,
      sleepQuality: sleepQuality ?? null,
      stressLevel: stressLevel ?? null,
    },
  });
  return mapDiary(result);
}

export async function getDiaryById(id) {
  const row = await prisma.emotionDiary.findUnique({ where: { id: BigInt(id) } });
  return mapDiary(row);
}

// 写入 AI 分析结果到日记（ai_emotion_analysis 是 text 列，存 JSON 串）
export async function updateDiaryAiAnalysis(id, analysisJson) {
  const r = await prisma.emotionDiary.updateMany({
    where: { id: BigInt(id) },
    data: {
      aiEmotionAnalysis: JSON.stringify(analysisJson),
      aiAnalysisUpdatedAt: new Date(),
    },
  });
  return r.count;
}

// 管理端分页：联 user 表返回 nickname/avatar + AI 分析结果
export async function pageDiaries({ pageNum = 1, pageSize = 10 }) {
  const offset = (pageNum - 1) * pageSize;
  const where = {};

  const [total, rows] = await Promise.all([
    prisma.emotionDiary.count({ where }),
    prisma.emotionDiary.findMany({
      where,
      orderBy: [{ diaryDate: 'desc' }, { id: 'desc' }],
      skip: offset,
      take: pageSize,
      include: { user: { select: { username: true, nickname: true, avatar: true } } },
    }),
  ]);

  const records = rows.map((d) => ({
    id: Number(d.id),
    userId: Number(d.userId),
    username: d.user?.username,
    nickname: d.user?.nickname,
    avatar: d.user?.avatar,
    diaryDate: format.date(d.diaryDate),
    moodScore: d.moodScore,
    dominantEmotion: d.dominantEmotion,
    emotionTriggers: d.emotionTriggers,
    diaryContent: d.diaryContent,
    sleepQuality: d.sleepQuality,
    stressLevel: d.stressLevel,
    aiEmotionAnalysis: parseJsonField(d.aiEmotionAnalysis),
    aiAnalysisUpdatedAt: format.dateTime(d.aiAnalysisUpdatedAt),
    createdAt: format.dateTime(d.createdAt),
    updatedAt: format.dateTime(d.updatedAt),
  }));

  return { records, total, pageNum: Number(pageNum), pageSize: Number(pageSize) };
}

// 删除日记
export async function deleteDiaryById(id) {
  const r = await prisma.emotionDiary.deleteMany({ where: { id: BigInt(id) } });
  return r.count;
}

// 写入一条 COMPLETED 的 AI 分析任务记录（供 diaryService 调用，替代原手写 INSERT）
export async function recordAiAnalysisTask(diaryId, userId, errorMessage) {
  const now = new Date();
  const created = await prisma.aiAnalysisTask.create({
    data: {
      diaryId: BigInt(diaryId),
      userId: BigInt(userId),
      status: 'COMPLETED',
      taskType: 'AUTO',
      priority: 2,
      retryCount: 0,
      maxRetryCount: 3,
      errorMessage: errorMessage || null,
      startedAt: now,
      completedAt: now,
    },
  });
  return Number(created.id);
}

function parseJsonField(raw) {
  if (!raw) return null;
  if (typeof raw === 'object') return raw;
  try {
    return JSON.parse(raw);
  } catch (_) {
    return null;
  }
}
