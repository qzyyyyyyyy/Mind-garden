import * as assessmentDao from '../dao/assessmentDao.js';
import { BusinessException } from '../exceptions/businessException.js';

// 高危求助信息（与情绪急救箱保持一致）
const HOTLINE = {
  title: '全国统一心理援助热线',
  phone: '12356',
  backupTitle: '希望24热线',
  backupPhone: '400-161-9995',
  message:
    '测评结果显示你可能正承受较大的心理压力。量表仅用于自我觉察，不能替代专业诊断。请优先联系信任的家人朋友，或拨打心理援助热线、前往专业机构寻求帮助。',
};

/**
 * 提交测评答案并计分
 * 计分全部在后端完成，避免前端篡改
 * @param {number} userId
 * @param {{ scaleCode: string, answers: number[] }} body
 */
export async function submitAssessment(userId, body) {
  const { scaleCode, answers } = body || {};

  if (!scaleCode) {
    throw new BusinessException('缺少量表标识');
  }
  const scale = await assessmentDao.getScaleByCode(scaleCode);
  if (!scale) {
    throw new BusinessException('量表不存在或已下架');
  }

  const { questions, options, levels } = scale;

  // 校验答案
  if (!Array.isArray(answers) || answers.length !== questions.length) {
    throw new BusinessException(`需要回答全部 ${questions.length} 道题`);
  }
  const maxOptionScore = Math.max(...options.map((o) => o.score));
  const minOptionScore = Math.min(...options.map((o) => o.score));

  let totalScore = 0;
  let criticalHit = false;
  let criticalTip = '';

  questions.forEach((q, i) => {
    const raw = Number(answers[i]);
    if (!Number.isInteger(raw) || raw < minOptionScore || raw > maxOptionScore) {
      throw new BusinessException(`第 ${i + 1} 题答案无效`);
    }
    // 反向计分题（如 PSS-10 第 4/5/7/8 题）
    const score = q.reverse ? maxOptionScore - raw : raw;
    totalScore += score;

    // 关键题预警（如 PHQ-9 第 9 题：自伤念头）
    if (q.critical && raw >= (q.criticalScore ?? 1)) {
      criticalHit = true;
      criticalTip = q.criticalTip || '';
    }
  });

  // 匹配分级
  const level = levels.find((l) => totalScore >= l.min && totalScore <= l.max);
  if (!level) {
    throw new BusinessException('计分失败：未匹配到分级');
  }

  const helpMode = criticalHit || level.helpMode === true;

  const record = await assessmentDao.createRecord({
    userId,
    scaleId: scale.id,
    scaleCode: scale.code,
    scaleName: scale.name,
    totalScore,
    level: level.label,
    levelIndex: level.index,
    advice: level.advice,
    answers,
    helpMode,
  });

  return {
    record,
    scoreRange: { min: levels[0].min, max: levels[levels.length - 1].max },
    level,
    criticalHit,
    criticalTip,
    helpMode,
    hotline: helpMode ? HOTLINE : null,
    disclaimer: '本测评是标准化的自我筛查工具，结果仅供参考，不构成医学诊断。',
  };
}
