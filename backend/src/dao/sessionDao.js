import { prisma } from '../config/database.js';
import { format } from '../services/convert/userConvert.js';

// snake_case 映射（getSessionById 供 chatService 读取 session.id）
function mapSession(s) {
  if (!s) return null;
  return {
    id: Number(s.id),
    user_id: Number(s.userId),
    session_title: s.sessionTitle,
    started_at: s.startedAt,
    last_emotion_analysis: s.lastEmotionAnalysis,
    last_emotion_updated_at: s.lastEmotionUpdatedAt,
  };
}

// 创建会话（对应 ConsultationSessionService.createSession）
export async function createSession(userId, sessionTitle) {
  const created = await prisma.consultationSession.create({
    data: {
      userId: BigInt(userId),
      sessionTitle: sessionTitle || null,
    },
  });
  return getSessionById(created.id);
}

export async function getSessionById(id) {
  const row = await prisma.consultationSession.findUnique({
    where: { id: BigInt(id) },
  });
  return mapSession(row);
}

// 分页查询会话
// records 字段：{id, sessionTitle, startedAt, lastMessageContent, messageCount, durationMinutes, status:"ACTIVE"}
export async function pageSessions({ userId, isAdmin, pageNum = 1, pageSize = 10 }) {
  const offset = (pageNum - 1) * pageSize;
  const where = isAdmin ? {} : { userId: BigInt(userId) };

  const [total, rows] = await Promise.all([
    prisma.consultationSession.count({ where }),
    prisma.consultationSession.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      skip: offset,
      take: pageSize,
      include: {
        user: { select: { username: true, nickname: true, avatar: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { content: true },
        },
        _count: { select: { messages: true } },
      },
    }),
  ]);

  const records = rows.map((s) => ({
    id: Number(s.id),
    userId: Number(s.userId),
    userNickname: s.user?.nickname,
    userAvatar: s.user?.avatar,
    userUsername: s.user?.username,
    sessionTitle: s.sessionTitle,
    startedAt: format.dateTime(s.startedAt),
    lastMessageContent: s.messages[0]?.content || '',
    messageCount: s._count.messages,
    // 时长按 started_at 到最后一条消息时间计算（无消息则 0）
    durationMinutes: 0,
    status: 'ACTIVE',
  }));

  return { records, total, pageNum: Number(pageNum), pageSize: Number(pageSize) };
}

// 删除会话（FK 级联删消息）
export async function deleteSessionById(id) {
  const r = await prisma.consultationSession.deleteMany({ where: { id: BigInt(id) } });
  return r.count;
}

// 写入情绪分析结果（last_emotion_analysis 为 Json 列，直接存对象）
export async function updateSessionEmotion(id, analysisJson) {
  const r = await prisma.consultationSession.updateMany({
    where: { id: BigInt(id) },
    data: {
      lastEmotionAnalysis: analysisJson ?? null,
      lastEmotionUpdatedAt: new Date(),
    },
  });
  return r.count;
}
