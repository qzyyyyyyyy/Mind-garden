import * as reportDao from '../dao/reportDao.js';
import { chatCompletion, parseJsonResponse } from '../ai/llmClient.js';
import { WEEKLY_REPORT_SYSTEM_PROMPT } from '../ai/prompts.js';
import { BusinessException } from '../exceptions/businessException.js';

/**
 * 计算某日期所在周的周一和周日（周一为一周起点）
 * @param {Date|string} date
 * @returns {{ weekStart: Date, weekEnd: Date }}
 */
export function getWeekRange(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0=周日, 1=周一 ...
  // 周一 = 当前 - (day===0 ? 6 : day-1)
  const diffToMonday = day === 0 ? 6 : day - 1;
  const monday = new Date(d);
  monday.setDate(d.getDate() - diffToMonday);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return { weekStart: monday, weekEnd: sunday };
}

/**
 * 聚合一周日记数据，计算统计指标
 * 返回：日均心情、情绪分布、触发因素词频、睡眠/压力均值、每日趋势
 */
function aggregateWeeklyData(diaries) {
  if (!diaries || diaries.length === 0) {
    return null;
  }

  const moodScores = diaries.map((d) => d.moodScore).filter((v) => v != null);
  const sleepScores = diaries.map((d) => d.sleepQuality).filter((v) => v != null);
  const stressScores = diaries.map((d) => d.stressLevel).filter((v) => v != null);

  // 情绪分布统计
  const emotionCount = {};
  diaries.forEach((d) => {
    if (d.dominantEmotion) {
      emotionCount[d.dominantEmotion] = (emotionCount[d.dominantEmotion] || 0) + 1;
    }
  });

  // 触发因素词频（简单按逗号/顿号/空格切分）
  const triggerCount = {};
  diaries.forEach((d) => {
    if (!d.emotionTriggers) return;
    const parts = d.emotionTriggers
      .split(/[,，、\s;；]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    parts.forEach((p) => {
      triggerCount[p] = (triggerCount[p] || 0) + 1;
    });
  });

  // 触发因素 Top3
  const topTriggers = Object.entries(triggerCount)
    .map(([trigger, count]) => ({ trigger, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  // 每日心情趋势
  const dailyTrend = diaries.map((d) => ({
    date: d.diaryDate,
    moodScore: d.moodScore,
    dominantEmotion: d.dominantEmotion,
  }));

  const avg = (arr) =>
    arr.length > 0
      ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10
      : null;

  return {
    recordCount: diaries.length,
    avgMoodScore: avg(moodScores),
    avgSleepQuality: avg(sleepScores),
    avgStressLevel: avg(stressScores),
    emotionDistribution: emotionCount,
    topTriggers,
    dailyTrend,
  };
}

/**
 * 生成情绪周报
 * @param {number} userId
 * @param {string} [weekStartStr] 可选，指定周一日期 'YYYY-MM-DD'，默认本周
 */
export async function generateWeeklyReport(userId, weekStartStr) {
  // 1. 确定周范围
  const refDate = weekStartStr ? new Date(weekStartStr) : new Date();
  const { weekStart, weekEnd } = getWeekRange(refDate);

  // 2. 查询该周日记
  const diaries = await reportDao.getDiariesByDateRange(userId, weekStart, weekEnd);
  if (!diaries || diaries.length === 0) {
    throw new BusinessException('本周还没有情绪日记，先去记录几条吧～');
  }

  // 3. 聚合统计
  const stats = aggregateWeeklyData(diaries);

  // 4. 构造 LLM 输入
  const diarySummary = diaries
    .map((d, i) => {
      return `【第${i + 1}天 ${d.diaryDate}】心情:${d.moodScore ?? '未填'} 情绪:${d.dominantEmotion || '未填'} 触发:${d.emotionTriggers || '无'} 睡眠:${d.sleepQuality ?? '未填'} 压力:${d.stressLevel ?? '未填'} 内容:${d.diaryContent || '无'}`;
    })
    .join('\n');

  const statsText = `
本周统计：
- 记录天数：${stats.recordCount} 天
- 平均心情分：${stats.avgMoodScore ?? '暂无'}（1-10）
- 平均睡眠质量：${stats.avgSleepQuality ?? '暂无'}（1-5）
- 平均压力水平：${stats.avgStressLevel ?? '暂无'}（1-5）
- 情绪分布：${JSON.stringify(stats.emotionDistribution)}
- 高频触发因素Top3：${JSON.stringify(stats.topTriggers)}
`;

  const userPrompt = `以下是用户本周（${formatDate(weekStart)} 至 ${formatDate(weekEnd)}）的情绪日记：\n\n${diarySummary}\n\n${statsText}\n\n请基于以上数据生成本周情绪周报。`;

  // 5. 调用 LLM
  let reportContent = null;
  try {
    const text = await chatCompletion([
      { role: 'system', content: WEEKLY_REPORT_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ]);
    reportContent = parseJsonResponse(text);
  } catch (e) {
    // LLM 失败时用兜底内容
    reportContent = buildFallbackReport(stats);
  }

  if (!reportContent) {
    reportContent = buildFallbackReport(stats);
  }

  // 6. 保存周报
  const saved = await reportDao.upsertWeeklyReport(userId, weekStart, {
    weekEnd,
    reportContent,
    moodTrend: stats.dailyTrend,
    triggerStats: stats.topTriggers,
    avgMoodScore: stats.avgMoodScore,
    avgSleepQuality: stats.avgSleepQuality,
    avgStressLevel: stats.avgStressLevel,
  });

  return saved;
}

/**
 * LLM 不可用时的兜底周报内容
 */
function buildFallbackReport(stats) {
  const topTriggerText =
    stats.topTriggers && stats.topTriggers.length > 0
      ? stats.topTriggers.map((t) => t.trigger).join('、')
      : '暂未记录明显触发因素';

  return {
    summary: `本周你记录了 ${stats.recordCount} 天的情绪，平均心情分为 ${stats.avgMoodScore ?? '暂无'}。继续保持记录的习惯，能更好地觉察自己的情绪变化。`,
    moodTrend: {
      label: '已记录',
      description: `本周共记录 ${stats.recordCount} 天，平均心情 ${stats.avgMoodScore ?? '暂无'} 分。`,
    },
    topTriggers: stats.topTriggers.map((t) => ({
      trigger: t.trigger,
      count: t.count,
      insight: `${t.trigger} 本周出现了 ${t.count} 次，可以试着留意它出现时的情境。`,
    })),
    improvementSuggestions: [
      '保持每日记录情绪的习惯，有助于自我觉察。',
      '尝试在情绪波动时做几次深呼吸，让自己平静下来。',
      '保证充足睡眠，良好的休息有助于情绪稳定。',
    ],
    nextWeekGoals: [
      '每天花 3 分钟记录自己的情绪',
      '尝试一件让自己开心的小事',
    ],
    warmMessage: '每一次记录，都是在温柔地照顾自己。',
  };
}

function formatDate(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
