import { Router } from 'express';
import { Result } from '../common/result.js';
import * as reportService from '../services/reportService.js';
import * as reportDao from '../dao/reportDao.js';

const router = Router();

// POST /api/emotion-weekly-report/generate
// 生成情绪周报（body: { weekStart? } 可选，默认本周）
router.post('/emotion-weekly-report/generate', async (req, res, next) => {
  try {
    const { weekStart } = req.body || {};
    const data = await reportService.generateWeeklyReport(req.user.userId, weekStart);
    res.json(Result.ok(data));
  } catch (e) {
    next(e);
  }
});

// GET /api/emotion-weekly-report/list?pageNum&pageSize
// 获取当前用户的周报列表
router.get('/emotion-weekly-report/list', async (req, res, next) => {
  try {
    const { pageNum = 1, pageSize = 10 } = req.query;
    const data = await reportDao.listWeeklyReports(req.user.userId, {
      pageNum: Number(pageNum),
      pageSize: Number(pageSize),
    });
    res.json(Result.ok(data));
  } catch (e) {
    next(e);
  }
});

// GET /api/emotion-weekly-report/:id
// 获取周报详情
router.get('/emotion-weekly-report/:id', async (req, res, next) => {
  try {
    const data = await reportDao.getWeeklyReportById(Number(req.params.id));
    res.json(Result.ok(data));
  } catch (e) {
    next(e);
  }
});

export default router;
