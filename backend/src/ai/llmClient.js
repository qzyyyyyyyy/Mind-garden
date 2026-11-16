import OpenAI from 'openai';
import { env } from '../config/env.js';

// OpenAI 兼容客户端（对应 ChatClientConfig + spring-ai openai）
let client = null;

export function getClient() {
  if (!client) {
    client = new OpenAI({
      baseURL: env.llm.baseURL,
      apiKey: env.llm.apiKey,
    });
  }
  return client;
}

// 判断是否已配置可用 API Key（未填 key 时给前端友好错误而非崩溃）
export function isLlmConfigured() {
  const key = env.llm.apiKey;
  return !!key && key.trim() !== '' && key.trim() !== 'you-key';
}

// 聊天补全：流式
// messages: [{role:'system'|'user'|'assistant', content:'...'}]
// onChunk: async (deltaText) => void
// 返回：完整文本
export async function streamChatCompletion(messages, onChunk) {
  if (!isLlmConfigured()) {
    const err = new Error('LLM API Key 未配置：请在 .env 中设置 LLM_API_KEY');
    err.code = 'LLM_NOT_CONFIGURED';
    throw err;
  }

  const openai = getClient();
  let full = '';

  const stream = await openai.chat.completions.create({
    model: env.llm.model,
    messages,
    stream: true,
  });

  for await (const chunk of stream) {
    const delta = chunk.choices?.[0]?.delta?.content || '';
    if (delta) {
      full += delta;
      if (onChunk) await onChunk(delta);
    }
  }

  return full;
}

// 聊天补全：非流式（情绪分析用）
export async function chatCompletion(messages) {
  if (!isLlmConfigured()) {
    const err = new Error('LLM API Key 未配置：请在 .env 中设置 LLM_API_KEY');
    err.code = 'LLM_NOT_CONFIGURED';
    throw err;
  }

  const openai = getClient();
  const response = await openai.chat.completions.create({
    model: env.llm.model,
    messages,
    stream: false,
  });

  return response.choices?.[0]?.message?.content || '';
}

// 解析 LLM 输出为 JSON（容错：剥离 ```json 围栏 / 截取首个 JSON 对象）
export function parseJsonResponse(text) {
  if (!text) return null;
  let t = text.trim();

  // 去掉 ```json ... ``` 围栏
  const fenceMatch = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    t = fenceMatch[1].trim();
  }

  // 直接尝试
  try {
    return JSON.parse(t);
  } catch (_) {
    // 失败则截取首个 { 到末尾 } 之间
    const start = t.indexOf('{');
    const end = t.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      try {
        return JSON.parse(t.slice(start, end + 1));
      } catch (_) {
        return null;
      }
    }
    return null;
  }
}
