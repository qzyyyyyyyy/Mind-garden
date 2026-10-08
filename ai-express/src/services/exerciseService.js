import * as exerciseDao from '../dao/exerciseDao.js';
import { BusinessException } from '../exceptions/businessException.js';

// 高风险求助模式阈值：练前心情分 ≤ 2 时触发
const HELP_MODE_MOOD_THRESHOLD = 2;

// 紧急求助信息（展示用，不构成医疗建议）
const HOTLINE = {
  title: '全国统一心理援助热线',
  phone: '12356',
  backupTitle: '希望24热线',
  backupPhone: '400-161-9995',
  message:
    '看起来你现在非常难受。练习可以等你准备好了再进行，如果此刻感到难以承受，请优先联系身边信任的人或专业援助。',
};

/**
 * 规则版推荐：根据情绪标签匹配练习的 suitableEmotions，按匹配度排序
 * @param {number} userId
 * @param {{ emotion?: string, moodScore?: number|string }} query
 */
export async function recommend(userId, { emotion, moodScore }) {
  const exercises = await exerciseDao.listActiveExercises();

  const mood = Number(moodScore);
  const helpMode = Number.isFinite(mood) && mood > 0 && mood <= HELP_MODE_MOOD_THRESHOLD;

  // 规则打分：匹配当前情绪 +2，通用练习 +0.5；同分按 sortOrder 稳定排序
  const scored = exercises.map((ex) => {
    let score = 0.5;
    if (emotion && Array.isArray(ex.suitableEmotions) && ex.suitableEmotions.includes(emotion)) {
      score = 2;
    }
    return { ex, score };
  });
  scored.sort((a, b) => b.score - a.score || a.ex.sortOrder - b.ex.sortOrder);

  const recommendations = scored.slice(0, 4).map((s) => s.ex);

  return {
    helpMode,
    hotline: helpMode ? HOTLINE : null,
    reason: emotion
      ? `针对「${emotion}」情绪，为你挑选了以下调节练习`
      : '为你挑选了以下日常调节练习',
    recommendations,
  };
}

/**
 * 打卡：校验练习存在与评分范围，写入记录并返回即时改善反馈
 * @param {number} userId
 * @param {{ exerciseId: number|string, moodBefore?: number, moodAfter?: number, reflection?: string, durationSeconds?: number, sourceEmotion?: string }} body
 */
export async function punchIn(userId, body) {
  const { exerciseId, moodBefore, moodAfter, reflection, durationSeconds, sourceEmotion } = body || {};

  if (!exerciseId) {
    throw new BusinessException('缺少练习 ID');
  }

  const exercise = await exerciseDao.getExerciseById(exerciseId);
  if (!exercise) {
    throw new BusinessException('练习不存在或已下架');
  }

  const before = clampMood(moodBefore);
  const after = clampMood(moodAfter);

  const record = await exerciseDao.createRecord({
    userId,
    exerciseId,
    sourceEmotion,
    moodBefore: before,
    moodAfter: after,
    reflection,
    durationSeconds,
  });

  const improvement = before != null && after != null ? Math.round((after - before) * 10) / 10 : null;

  return {
    record,
    improvement,
    encourage: buildEncourage(improvement, exercise.name),
  };
}

// 统计（dao 结果 + 最有效练习）
export async function getStats(userId) {
  const stats = await exerciseDao.getRecordStats(userId);
  const effective = [...stats.perExercise]
    .filter((p) => p.count >= 1 && p.avgImprovement > 0)
    .sort((a, b) => b.avgImprovement - a.avgImprovement)[0];

  return {
    ...stats,
    mostEffective: effective
      ? { name: effective.name, avgImprovement: effective.avgImprovement }
      : null,
  };
}

function clampMood(v) {
  if (v == null || v === '') return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.min(10, Math.max(1, Math.round(n)));
}

function buildEncourage(improvement, exerciseName) {
  if (improvement == null) {
    return `已完成「${exerciseName}」，为自己留出这段照顾情绪的时间，本身就很有意义。`;
  }
  if (improvement > 0) {
    return `情绪分提升了 ${improvement} 分！「${exerciseName}」对你很有效，下次情绪波动时可以再用它。`;
  }
  if (improvement === 0) {
    return `情绪保持平稳，「${exerciseName}」帮你稳住了状态，也是一种收获。`;
  }
  return `谢谢你完成「${exerciseName}」。情绪有时需要时间流动，不带评判地记录它，就是照顾自己的开始。`;
}
