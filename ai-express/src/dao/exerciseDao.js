import { prisma } from '../config/database.js';
import { format } from '../services/convert/userConvert.js';

// 查询所有启用状态的练习（按 sort_order 排序）
export async function listActiveExercises() {
  const rows = await prisma.emotionExercise.findMany({
    where: { status: 1 },
    orderBy: { sortOrder: 'asc' },
  });
  return rows.map(mapExercise);
}

// 按 ID 查询练习
export async function getExerciseById(id) {
  const row = await prisma.emotionExercise.findUnique({ where: { id: BigInt(id) } });
  return row ? mapExercise(row) : null;
}

// 新增打卡记录
export async function createRecord({ userId, exerciseId, sourceEmotion, moodBefore, moodAfter, reflection, durationSeconds }) {
  const row = await prisma.emotionExerciseRecord.create({
    data: {
      userId: BigInt(userId),
      exerciseId: BigInt(exerciseId),
      sourceEmotion: sourceEmotion || null,
      moodBefore: moodBefore ?? null,
      moodAfter: moodAfter ?? null,
      reflection: reflection || null,
      durationSeconds: durationSeconds ?? null,
    },
  });
  return mapRecord(row);
}

// 分页查询打卡历史（带练习信息）
export async function listRecords(userId, { pageNum = 1, pageSize = 10 }) {
  const offset = (pageNum - 1) * pageSize;
  const [total, rows] = await Promise.all([
    prisma.emotionExerciseRecord.count({ where: { userId: BigInt(userId) } }),
    prisma.emotionExerciseRecord.findMany({
      where: { userId: BigInt(userId) },
      orderBy: { completedAt: 'desc' },
      skip: offset,
      take: pageSize,
      include: { exercise: { select: { name: true, category: true, icon: true } } },
    }),
  ]);
  return {
    records: rows.map(mapRecord),
    total,
    pageNum: Number(pageNum),
    pageSize: Number(pageSize),
  };
}

// 统计：总打卡数、连续打卡天数、整体平均改善、每个练习的效果均值
export async function getRecordStats(userId) {
  const uid = BigInt(userId);
  const total = await prisma.emotionExerciseRecord.count({ where: { userId: uid } });

  // 按练习聚合：打卡次数、练前后情绪均值（仅统计有前后对比的记录）
  const groups = await prisma.emotionExerciseRecord.groupBy({
    by: ['exerciseId'],
    where: { userId: uid, moodBefore: { not: null }, moodAfter: { not: null } },
    _count: { _all: true },
    _avg: { moodBefore: true, moodAfter: true },
  });

  const exerciseIds = groups.map((g) => g.exerciseId);
  const exercises = exerciseIds.length
    ? await prisma.emotionExercise.findMany({
        where: { id: { in: exerciseIds } },
        select: { id: true, name: true, category: true, icon: true },
      })
    : [];
  const exMap = new Map(exercises.map((e) => [e.id.toString(), e]));

  const perExercise = groups
    .map((g) => {
      const ex = exMap.get(g.exerciseId.toString());
      const avgBefore = round1(g._avg.moodBefore);
      const avgAfter = round1(g._avg.moodAfter);
      return {
        exerciseId: g.exerciseId.toString(),
        name: ex?.name || '未知练习',
        category: ex?.category || '',
        icon: ex?.icon || '',
        count: g._count._all,
        avgBefore,
        avgAfter,
        avgImprovement: round1((avgAfter ?? 0) - (avgBefore ?? 0)),
      };
    })
    .sort((a, b) => b.count - a.count);

  // 整体平均改善（按次数加权）
  const effCount = perExercise.reduce((s, p) => s + p.count, 0);
  const avgImprovement = effCount
    ? round1(perExercise.reduce((s, p) => s + p.avgImprovement * p.count, 0) / effCount)
    : null;

  // 连续打卡天数：取最近 90 天打卡日期去重，从今天（或昨天）往回数
  const since = new Date();
  since.setDate(since.getDate() - 90);
  const rows = await prisma.emotionExerciseRecord.findMany({
    where: { userId: uid, completedAt: { gte: since } },
    select: { completedAt: true },
  });
  const daySet = new Set(rows.map((r) => format.date(r.completedAt)));
  const cursor = new Date();
  if (!daySet.has(format.date(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (daySet.has(format.date(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return { total, streak, avgImprovement, perExercise };
}

function mapExercise(r) {
  return {
    id: Number(r.id),
    name: r.name,
    category: r.category,
    description: r.description,
    steps: parseJson(r.steps),
    durationMinutes: r.durationMinutes,
    suitableEmotions: parseJson(r.suitableEmotions),
    icon: r.icon,
    sortOrder: r.sortOrder,
  };
}

function mapRecord(r) {
  return {
    id: Number(r.id),
    userId: Number(r.userId),
    exerciseId: Number(r.exerciseId),
    sourceEmotion: r.sourceEmotion,
    moodBefore: r.moodBefore,
    moodAfter: r.moodAfter,
    reflection: r.reflection,
    durationSeconds: r.durationSeconds,
    completedAt: format.dateTime(r.completedAt),
    exercise: r.exercise
      ? { name: r.exercise.name, category: r.exercise.category, icon: r.exercise.icon }
      : undefined,
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

function round1(n) {
  return n == null ? null : Math.round(n * 10) / 10;
}
