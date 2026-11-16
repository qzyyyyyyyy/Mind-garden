import { prisma } from '../config/database.js';
import { format } from '../services/convert/userConvert.js';

// Prisma 行 → snake_case 行（toMessageDto 与 chatService/emotionService 零改动）
function mapMessage(m) {
  if (!m) return null;
  return {
    id: Number(m.id),
    session_id: Number(m.sessionId),
    sender_type: m.senderType,
    message_type: m.messageType,
    content: m.content,
    emotion_tag: m.emotionTag,
    ai_model: m.aiModel,
    created_at: m.createdAt,
  };
}

// 保存用户消息（对应 ConsultationMessageService.saveUserMessage）
export async function saveUserMessage(sessionId, content, emotionTag = null) {
  const created = await prisma.consultationMessage.create({
    data: {
      sessionId: BigInt(sessionId),
      senderType: 1,
      messageType: 1,
      content,
      emotionTag,
    },
  });
  return getMessageById(created.id);
}

// 保存 AI 消息（对应 ConsultationMessageService.saveAimessage）
export async function saveAiMessage(sessionId, content, aiModel = 'openai') {
  const created = await prisma.consultationMessage.create({
    data: {
      sessionId: BigInt(sessionId),
      senderType: 2,
      messageType: 1,
      content,
      aiModel,
    },
  });
  return getMessageById(created.id);
}

export async function getMessageById(id) {
  const row = await prisma.consultationMessage.findUnique({ where: { id: BigInt(id) } });
  return mapMessage(row);
}

// 获取会话消息数
export async function getMessageCountBySessionId(sessionId) {
  return prisma.consultationMessage.count({ where: { sessionId: BigInt(sessionId) } });
}

// 获取最后一条消息
export async function getLastMessageBySessionId(sessionId) {
  const row = await prisma.consultationMessage.findFirst({
    where: { sessionId: BigInt(sessionId) },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
  });
  return mapMessage(row);
}

// 取会话全部消息（按时间正序）
export async function listMessagesBySessionId(sessionId) {
  const rows = await prisma.consultationMessage.findMany({
    where: { sessionId: BigInt(sessionId) },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  });
  return rows.map(mapMessage);
}

// 把数据库行转为前端期望的 ConsultationMessageResponseDTO
export function toMessageDto(row) {
  if (!row) return null;
  return {
    id: row.id,
    sessionId: row.session_id,
    senderType: row.sender_type,
    senderTypeDesc: row.sender_type === 1 ? '用户' : 'AI助手',
    messageType: row.message_type,
    messageTypeDesc: row.message_type === 1 ? '文本' : '未知',
    content: row.content,
    emotionTag: row.emotion_tag,
    aiModel: row.ai_model,
    contentLength: row.content ? row.content.length : 0,
    createdAt: format.dateTime(row.created_at),
  };
}
