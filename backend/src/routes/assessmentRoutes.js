import { Router } from 'express';
import { Result } from '../common/result.js';
import * as assessmentService from '../services/assessmentService.js';
import * as assessmentDao from '../dao/assessmentDao.js';

const router = Router();

// GET /api/assessment/scales 可测评量表列表
router.get('/assessment/scales', async (req, res, next) => {
  try {
    res.json(Result.ok(await assessmentDao.listActiveScales()));
  } catch (e) {
    next(e);
  }
});

// GET /api/assessment/scale/:code 量表详情（题目+选项+分级说明）
router.get('/assessment/scale/:code', async (req, res, next) => {
  try {
    const data = await assessmentDao.getScaleByCode(req.params.code);
    res.json(Result.ok(data));
  } catch (e) {
    next(e);
  }
});

// POST /api/assessment/submit 提交答案（body: { scaleCode, answers: number[] }）
router.post('/assessment/submit', async (req, res, next) => {
  try {
    res.json(Result.ok(await assessmentService.submitAssessment(req.user.userId, req.body)));
  } catch (e) {
    next(e);
  }
});

// GET /api/assessment/records 我的测评历史（分页）
router.get('/assessment/records', async (req, res, next) => {
  try {
    const { pageNum = 1, pageSize = 10 } = req.query;
    res.json(
      Result.ok(
        await assessmentDao.listRecords(req.user.userId, {
          pageNum: Number(pageNum),
          pageSize: Number(pageSize),
        })
      )
    );
  } catch (e) {
    next(e);
  }
});

export default router;
