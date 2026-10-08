import { Router } from 'express';
import { Result } from '../common/result.js';
import * as chatService from '../services/chatService.js';
import { analyzeSessionEmotion } from '../services/emotionService.js';
import * as sessionDao from '../dao/sessionDao.js';
import * as messageDao from '../dao/messageDao.js';

const router = Router();

// POST /api/psychological-chat/session/start
router.post('/psychological-chat/session/start', async (req, res, next) => {
  try {
    const data = await chatService.startSession(req.user.userId, req.body || {});
    res.json(Result.ok(data));
  } catch (e) {
    next(e);
  }
});

// POST /api/psychological-chat/stream（SSE）
// Content-Type 必须精确为 text/event-stream；前端 onopen 强校验
router.post('/psychological-chat/stream', async (req, res) => {
  // 设置 SSE 头
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const { sessionId, userMessage } = req.body || {};

  // 发送一帧 SSE 数据
  const send = (event, data) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    if (!sessionId || !userMessage) {
      send('error', { code: '4001', msg: '缺少必要参数: sessionId / userMessage', data: null });
      return res.end();
    }

    // 逐 chunk 推送，每条间隔 50ms（与原 Spring 行为一致）
    await chatService.streamChat(sessionId, userMessage, async (delta) => {
      send('message', {
        code: '200',
        msg: '操作成功',
        data: { content: delta, type: 'normal' },
      });
      await sleep(50);
    });

    // 完成帧
    send('done', {});
    return res.end();
  } catch (e) {
    // 友好错误帧（key 未配置时不崩溃）
    const msg = e && e.message ? e.message : '服务器内部错误';
    send('error', { code: '500', msg, data: null });
    return res.end();
  }
});

// GET /api/psychological-chat/sessions?pageNum&pageSize
// 管理员查全部、普通用户查自己
router.get('/psychological-chat/sessions', async (req, res, next) => {
  try {
    const { pageNum = 1, pageSize = 10 } = req.query;
    const data = await sessionDao.pageSessions({
      userId: req.user.userId,
      isAdmin: req.user.roleType === 2,
      pageNum: Number(pageNum),
      pageSize: Number(pageSize),
    });
    res.json(Result.ok(data));
  } catch (e) {
    next(e);
  }
});

// DELETE /api/psychological-chat/sessions/:id
router.delete('/psychological-chat/sessions/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    await sessionDao.deleteSessionById(id);
    res.json(Result.ok(null));
  } catch (e) {
    next(e);
  }
});

// GET /api/psychological-chat/sessions/:id/messages
router.get('/psychological-chat/sessions/:id/messages', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const rows = await messageDao.listMessagesBySessionId(id);
    res.json(Result.ok(rows.map(messageDao.toMessageDto)));
  } catch (e) {
    next(e);
  }
});

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// GET /api/psychological-chat/session/:sessionId/emotion
// LLM 结构化情绪分析：取会话全部消息 → LLM JSON → 存 session.last_emotion_analysis → 返回
router.get('/psychological-chat/session/:sessionId/emotion', async (req, res, next) => {
  try {
    const data = await analyzeSessionEmotion(req.params.sessionId);
    res.json(Result.ok(data));
  } catch (e) {
    next(e);
  }
});

export default router;
