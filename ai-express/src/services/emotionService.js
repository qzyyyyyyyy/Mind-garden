import * as messageDao from '../dao/messageDao.js';
import * as sessionDao from '../dao/sessionDao.js';
import { chatCompletion, parseJsonResponse } from '../ai/llmClient.js';
import { EMOTION_ANALYSIS_SYSTEM_PROMPT } from '../ai/prompts.js';
import { extractSessionId } from '../services/chatService.js';
import { BusinessException } from '../exceptions/businessException.js';

// 分析会话情绪（对应 GET /api/psychological-chat/session/:sessionId/emotion）
// 流程：取会话全部消息 → LLM 结构化 JSON → 存 last_emotion_analysis → 返回
export async function analyzeSessionEmotion(sessionId) {
  const dbSessionId = extractSessionId(sessionId);
  if (dbSessionId == null) {
    throw new BusinessException('会话ID格式错误');
  }

  const rows = await messageDao.listMessagesBySessionId(dbSessionId);
  if (!rows || rows.length === 0) {
    throw new BusinessException('会话暂无消息，无法进行情绪分析');
  }

  // 把会话拼接为对话文本
  const dialogue = rows
    .map((m) => {
      const role = m.sender_type === 1 ? '用户' : 'AI';
      return `${role}：${m.content}`;
    })
    .join('\n');

  const userPrompt = `请对以下用户与AI助手的对话内容进行情绪分析，输出 JSON：\n\n${dialogue}`;

  const text = await chatCompletion([
    { role: 'system', content: EMOTION_ANALYSIS_SYSTEM_PROMPT },
    { role: 'user', content: userPrompt },
  ]);

  let parsed = parseJsonResponse(text);
  if (!parsed) {
    // 兜底：构造一个默认结果
    parsed = {
      primaryEmotion: '未知',
      emotionScore: 50,
      isNegative: false,
      riskLevel: 0,
      suggestion: '情绪分析失败，请稍后重试',
      improvementSuggestions: [],
      riskDescription: '情绪稳定',
      icon: '😐',
      label: '未知',
      keywords: [],
      timestamp: Date.now(),
    };
  }

  // 保证 timestamp 字段存在
  if (!parsed.timestamp) parsed.timestamp = Date.now();

  // 落库
  await sessionDao.updateSessionEmotion(dbSessionId, parsed);

  return parsed;
}
