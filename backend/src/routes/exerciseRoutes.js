import { Router } from 'express';
import { Result } from '../common/result.js';
import * as exerciseService from '../services/exerciseService.js';
import * as exerciseDao from '../dao/exerciseDao.js';

const router = Router();

// GET /api/emotion-exercise/list 练习库列表
router.get('/emotion-exercise/list', async (req, res, next) => {
  try {
    res.json(Result.ok(await exerciseDao.listActiveExercises()));
  } catch (e) {
    next(e);
  }
});

// GET /api/emotion-exercise/recommend?emotion=焦虑&moodScore=3 规则推荐
router.get('/emotion-exercise/recommend', async (req, res, next) => {
  try {
    res.json(Result.ok(await exerciseService.recommend(req.user.userId, req.query)));
  } catch (e) {
    next(e);
  }
});

// POST /api/emotion-exercise/record 打卡
router.post('/emotion-exercise/record', async (req, res, next) => {
  try {
    res.json(Result.ok(await exerciseService.punchIn(req.user.userId, req.body)));
  } catch (e) {
    next(e);
  }
});

// GET /api/emotion-exercise/records 打卡历史（分页）
router.get('/emotion-exercise/records', async (req, res, next) => {
  try {
    const { pageNum = 1, pageSize = 10 } = req.query;
    res.json(
      Result.ok(
        await exerciseDao.listRecords(req.user.userId, {
          pageNum: Number(pageNum),
          pageSize: Number(pageSize),
        })
      )
    );
  } catch (e) {
    next(e);
  }
});

// GET /api/emotion-exercise/stats 效果统计
router.get('/emotion-exercise/stats', async (req, res, next) => {
  try {
    res.json(Result.ok(await exerciseService.getStats(req.user.userId)));
  } catch (e) {
    next(e);
  }
});

export default router;
