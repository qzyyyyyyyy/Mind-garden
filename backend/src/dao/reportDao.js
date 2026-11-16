import { prisma } from '../config/database.js';
import { format } from '../services/convert/userConvert.js';

// 查询用户某时间段内的情绪日记（用于周报生成）
// start/end 为 Date 对象，返回原始日记数据（含 aiEmotionAnalysis）
export async function getDiariesByDateRange(userId, start, end) {
  const rows = await prisma.emotionDiary.findMany({
    where: {
      userId: BigInt(userId),
      diaryDate: {
        gte: start,
        lte: end,
      },
    },
    orderBy: { diaryDate: 'asc' },
  });

  return rows.map((d) => ({
    id: Number(d.id),
    diaryDate: format.date(d.diaryDate),
    moodScore: d.moodScore,
    dominantEmotion: d.dominantEmotion,
    emotionTriggers: d.emotionTriggers,
    diaryContent: d.diaryContent,
    sleepQuality: d.sleepQuality,
    stressLevel: d.stressLevel,
    aiEmotionAnalysis: parseJsonField(d.aiEmotionAnalysis),
  }));
}

// 保存或更新周报（user_id + week_start 唯一 → UPSERT）
export async function upsertWeeklyReport(userId, weekStart, data) {
  const {
    weekEnd,
    reportContent,
    moodTrend,
    triggerStats,
    avgMoodScore,
    avgSleepQuality,
    avgStressLevel,
  } = data;

  const payload = {
    userId: BigInt(userId),
    weekStart: new Date(weekStart),
    weekEnd: new Date(weekEnd),
    reportContent,
    moodTrend: moodTrend || null,
    triggerStats: triggerStats || null,
    avgMoodScore: avgMoodScore ?? null,
    avgSleepQuality: avgSleepQuality ?? null,
    avgStressLevel: avgStressLevel ?? null,
  };

  const result = await prisma.emotionWeeklyReport.upsert({
    where: { user_week_unique: { userId: BigInt(userId), weekStart: new Date(weekStart) } },
    create: payload,
    update: {
      weekEnd: new Date(weekEnd),
      reportContent,
      moodTrend: moodTrend || null,
      triggerStats: triggerStats || null,
      avgMoodScore: avgMoodScore ?? null,
      avgSleepQuality: avgSleepQuality ?? null,
      avgStressLevel: avgStressLevel ?? null,
    },
  });

  return mapReport(result);
}

// 获取用户周报列表（分页，按周起始倒序）
export async function listWeeklyReports(userId, { pageNum = 1, pageSize = 10 }) {
  const offset = (pageNum - 1) * pageSize;

  const [total, rows] = await Promise.all([
    prisma.emotionWeeklyReport.count({ where: { userId: BigInt(userId) } }),
    prisma.emotionWeeklyReport.findMany({
      where: { userId: BigInt(userId) },
      orderBy: { weekStart: 'desc' },
      skip: offset,
      take: pageSize,
    }),
  ]);

  return {
    records: rows.map(mapReport),
    total,
    pageNum: Number(pageNum),
    pageSize: Number(pageSize),
  };
}

// 获取周报详情
export async function getWeeklyReportById(id) {
  const row = await prisma.emotionWeeklyReport.findUnique({ where: { id: BigInt(id) } });
  return mapReport(row);
}

// 获取用户某周的周报（用于判断是否已生成）
export async function getWeeklyReportByWeek(userId, weekStart) {
  const row = await prisma.emotionWeeklyReport.findUnique({
    where: { user_week_unique: { userId: BigInt(userId), weekStart: new Date(weekStart) } },
  });
  return mapReport(row);
}

function mapReport(r) {
  if (!r) return null;
  return {
    id: Number(r.id),
    userId: Number(r.userId),
    weekStart: format.date(r.weekStart),
    weekEnd: format.date(r.weekEnd),
    reportContent: parseJsonField(r.reportContent),
    moodTrend: parseJsonField(r.moodTrend),
    triggerStats: parseJsonField(r.triggerStats),
    avgMoodScore: r.avgMoodScore,
    avgSleepQuality: r.avgSleepQuality,
    avgStressLevel: r.avgStressLevel,
    createdAt: format.dateTime(r.createdAt),
    updatedAt: format.dateTime(r.updatedAt),
  };
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
