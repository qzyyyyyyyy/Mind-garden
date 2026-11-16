import * as diaryDao from '../dao/diaryDao.js';
import { chatCompletion, parseJsonResponse } from '../ai/llmClient.js';
import { EMOTION_ANALYSIS_SYSTEM_PROMPT } from '../ai/prompts.js';
import { BusinessException } from '../exceptions/businessException.js';
import { ResultCode } from '../common/result.js';

// 保存情绪日记（对应 POST /api/emotion-diary）
// 同步触发 LLM 分析 → 写 ai_emotion_analysis + 在 ai_analysis_task 落一条 COMPLETED 记录
export async function saveEmotionDiary(userId, dto) {
  const {
    diaryDate,
    moodScore,
    dominantEmotion,
    emotionTriggers,
    diaryContent,
    sleepQuality,
    stressLevel,
  } = dto || {};

  if (!diaryDate) {
    throw new BusinessException('日记日期不能为空', ResultCode.PARAM_MISSING.code);
  }

  // 1. UPSERT 日记
  const diary = await diaryDao.upsertDiary(userId, {
    diaryDate,
    moodScore,
    dominantEmotion,
    emotionTriggers,
    diaryContent,
    sleepQuality,
    stressLevel,
  });

  // 2. LLM 结构化情绪分析
  let analysis = null;
  let analysisError = null;
  try {
    const userPrompt = `请对以下情绪日记进行情绪分析，输出 JSON：\n\n主要情绪：${dominantEmotion || ''}\n触发因素：${emotionTriggers || ''}\n日记内容：${diaryContent || ''}\n情绪评分(1-10)：${moodScore}\n睡眠质量(1-5)：${sleepQuality ?? '未填'}\n压力水平(1-5)：${stressLevel ?? '未填'}`;
    const text = await chatCompletion([
      { role: 'system', content: EMOTION_ANALYSIS_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ]);
    analysis = parseJsonResponse(text);
    if (analysis && !analysis.timestamp) analysis.timestamp = Date.now();
    if (analysis) {
      await diaryDao.updateDiaryAiAnalysis(diary.id, analysis);
    }
  } catch (e) {
    analysisError = e.message;
  }

  // 3. 落 ai_analysis_task 记录（COMPLETED）
  await diaryDao.recordAiAnalysisTask(diary.id, userId, analysisError || null);

  return {
    diary: { id: diary.id, diaryDate },
    aiAnalysis: analysis,
    analysisError: analysisError || undefined,
  };
}
