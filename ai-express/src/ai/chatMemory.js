// 对话记忆管理（对应 MessageWindowChatMemory + CONVERSATION_ID）
// 内存实现：每个 conversationId 保留最近 30 条消息
// 消息格式：{ role: 'user' | 'assistant', content: '...' }

const WINDOW_SIZE = 30;
const memoryStore = new Map();

function getMessages(conversationId) {
  if (!memoryStore.has(conversationId)) {
    memoryStore.set(conversationId, []);
  }
  return memoryStore.get(conversationId);
}

// 添加一条消息（按 OpenAI role）
export function addMessage(conversationId, role, content) {
  const list = getMessages(conversationId);
  list.push({ role, content });
  // 滑动窗口：保留末尾 WINDOW_SIZE 条
  if (list.length > WINDOW_SIZE) {
    memoryStore.set(conversationId, list.slice(list.length - WINDOW_SIZE));
  }
}

// 兼容 spring-ai 用法：批量添加（messages: [{role, content}]）
export function addMessages(conversationId, messages) {
  const list = getMessages(conversationId);
  for (const m of messages) {
    list.push({ role: m.role, content: m.content });
  }
  if (list.length > WINDOW_SIZE) {
    memoryStore.set(conversationId, list.slice(list.length - WINDOW_SIZE));
  }
}

// 取出当前记忆消息
export function get(conversationId) {
  return getMessages(conversationId).slice();
}

// 清空
export function clear(conversationId) {
  memoryStore.delete(conversationId);
}
