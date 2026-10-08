import { prisma } from '../config/database.js';
import { format } from '../services/convert/userConvert.js';

// 启用状态的量表列表（列表页不返回题目，减少数据量）
export async function listActiveScales() {
  const rows = await prisma.psychologicalScale.findMany({
    where: { status: 1 },
    orderBy: { sortOrder: 'asc' },
    select: {
      id: true,
      code: true,
      name: true,
      description: true,
      instruction: true,
      durationMinutes: true,
      questions: true,
    },
  });
  return rows.map((s) => ({
    id: Number(s.id),
    code: s.code,
    name: s.name,
    description: s.description,
    instruction: s.instruction,
    durationMinutes: s.durationMinutes,
    questionCount: parseJson(s.questions)?.length || 0,
  }));
}

// 按 code 获取量表完整内容（题目、选项、分级）
export async function getScaleByCode(code) {
  const r = await prisma.psychologicalScale.findFirst({
    where: { code, status: 1 },
  });
  return r ? mapScale(r) : null;
}

export async function getScaleById(id) {
  const r = await prisma.psychologicalScale.findUnique({ where: { id: BigInt(id) } });
  return r ? mapScale(r) : null;
}

// 保存测评记录
export async function createRecord(data) {
  const {
    userId,
    scaleId,
    scaleCode,
    scaleName,
    totalScore,
    level,
    levelIndex,
    advice,
    answers,
    helpMode,
  } = data;

  const r = await prisma.assessmentRecord.create({
    data: {
      userId: BigInt(userId),
      scaleId: BigInt(scaleId),
      scaleCode,
      scaleName,
      totalScore,
      level,
      levelIndex,
      advice: advice || null,
      answers,
      helpMode: !!helpMode,
    },
  });
  return mapRecord(r);
}

// 分页查询当前用户的测评历史
export async function listRecords(userId, { pageNum = 1, pageSize = 10 }) {
  const offset = (pageNum - 1) * pageSize;
  const [total, rows] = await Promise.all([
    prisma.assessmentRecord.count({ where: { userId: BigInt(userId) } }),
    prisma.assessmentRecord.findMany({
      where: { userId: BigInt(userId) },
      orderBy: { completedAt: 'desc' },
      skip: offset,
      take: pageSize,
    }),
  ]);
  return {
    records: rows.map(mapRecord),
    total,
    pageNum: Number(pageNum),
    pageSize: Number(pageSize),
  };
}

function mapScale(r) {
  return {
    id: Number(r.id),
    code: r.code,
    name: r.name,
    description: r.description,
    instruction: r.instruction,
    questions: parseJson(r.questions),
    options: parseJson(r.options),
    levels: parseJson(r.levels),
    durationMinutes: r.durationMinutes,
  };
}

function mapRecord(r) {
  return {
    id: Number(r.id),
    userId: Number(r.userId),
    scaleId: Number(r.scaleId),
    scaleCode: r.scaleCode,
    scaleName: r.scaleName,
    totalScore: r.totalScore,
    level: r.level,
    levelIndex: r.levelIndex,
    advice: r.advice,
    answers: parseJson(r.answers),
    helpMode: r.helpMode,
    completedAt: format.dateTime(r.completedAt),
  };
}

function parseJson(v) {
  if (!v) return null;
  if (typeof v === 'object') return v;
  try {
    return JSON.parse(v);
  } catch (_) {
    return null;
  }
}
