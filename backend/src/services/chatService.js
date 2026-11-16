import * as sessionDao from '../dao/sessionDao.js';
import * as messageDao from '../dao/messageDao.js';
import { streamChatCompletion } from '../ai/llmClient.js';
import { PSYCHOLOGICAL_SUPPORT_SYSTEM_PROMPT } from '../ai/prompts.js';
import * as chatMemory from '../ai/chatMemory.js';
import { BusinessException } from '../exceptions/businessException.js';

// 本地时间格式化（对应 DateUtil.format(now, "MM-dd HH:mm")）
function formatNow(pattern) {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return pattern
    .replace('MM', pad(d.getMonth() + 1))
    .replace('dd', pad(d.getDate()))
    .replace('HH', pad(d.getHours()))
    .replace('mm', pad(d.getMinutes()))
    .replace('yyyy', d.getFullYear());
}

// 从 "session_123" 提取数字 id（对应 PsychologicalSupportService.extractSessionId）
export function extractSessionId(sessionId) {
  if (sessionId && typeof sessionId === 'string' && sessionId.startsWith('session_')) {
    const idStr = sessionId.substring('session_'.length);
    const id = Number(idStr);
    if (!Number.isNaN(id) && id > 0) return id;
  }
  return null;
}

// 开始会话（对应 PsychologicalSupportService.startSession）
export async function startSession(userId, dto) {
  const { sessionTitle, initialMessage } = dto || {};
  // 与 Spring 一致：未提供标题时用默认 "宁渡AI助手 - MM-dd HH:mm"
  const finalTitle = sessionTitle && sessionTitle.trim().length > 0
    ? sessionTitle
    : `宁渡AI助手 - ${formatNow('MM-dd HH:mm')}`;
  const session = await sessionDao.createSession(userId, finalTitle);

  // 保存初始用户消息
  if (initialMessage) {
    await messageDao.saveUserMessage(session.id, initialMessage, null);
  }

  const now = Date.now();
  return {
    sessionId: `session_${session.id}`,
    userHash: userId,
    initialMessage,
    startTime: now,
    expiryTime: now + 86400000,
    messageCount: 1,
    status: 'ACTIVE',
  };
}

// SSE 流式对话（对应 streamPsychologicalChat）
// 参数：sessionId(session_xxx), userMessage, onChunk(deltaText)
// 返回：完整 AI 回复
export async function streamChat(sessionId, userMessage, onChunk) {
  const dbSessionId = extractSessionId(sessionId);
  if (dbSessionId == null) {
    throw new BusinessException('会话ID格式错误');
  }

  // 是否为初始消息，避免重复保存（与 Spring 逻辑一致）
  let isInitialMessage = false;
  const messageCount = await messageDao.getMessageCountBySessionId(dbSessionId);
  if (messageCount === 1) {
    const last = await messageDao.getLastMessageBySessionId(dbSessionId);
    if (last && last.sender_type === 1 && userMessage === last.content) {
      isInitialMessage = true;
    }
  }

  if (!isInitialMessage) {
    await messageDao.saveUserMessage(dbSessionId, userMessage, null);
  }

  // 记忆 key：conversation_session_{id}
  const conversationId = `conversation_${sessionId}`;
  chatMemory.addMessage(conversationId, 'user', userMessage);

  // 构造 LLM 请求消息：system + 历史记忆
  const memory = chatMemory.get(conversationId);
  const messages = [
    { role: 'system', content: PSYCHOLOGICAL_SUPPORT_SYSTEM_PROMPT },
    ...memory,
  ];

  // 流式补全
  const fullResponse = await streamChatCompletion(messages, onChunk);

  // AI 回复落库
  await messageDao.saveAiMessage(dbSessionId, fullResponse, 'openai');
  // 写入记忆
  chatMemory.addMessage(conversationId, 'assistant', fullResponse);

  return fullResponse;
}
