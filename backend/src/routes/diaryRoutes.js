import { Router } from 'express';
import { Result } from '../common/result.js';
import { requireAdmin } from '../middleware/auth.js';
import * as diaryService from '../services/diaryService.js';
import * as diaryDao from '../dao/diaryDao.js';

const router = Router();

// POST /api/emotion-diary
router.post('/emotion-diary', async (req, res, next) => {
  try {
    const data = await diaryService.saveEmotionDiary(req.user.userId, req.body || {});
    res.json(Result.ok(data));
  } catch (e) {
    next(e);
  }
});

// GET /api/emotion-diary/admin/page（仅管理员）
router.get('/emotion-diary/admin/page', requireAdmin, async (req, res, next) => {
  try {
    const { pageNum = 1, pageSize = 10 } = req.query;
    const data = await diaryDao.pageDiaries({
      pageNum: Number(pageNum),
      pageSize: Number(pageSize),
    });
    res.json(Result.ok(data));
  } catch (e) {
    next(e);
  }
});

// DELETE /api/emotion-diary/admin/:id（仅管理员）
router.delete('/emotion-diary/admin/:id', requireAdmin, async (req, res, next) => {
  try {
    await diaryDao.deleteDiaryById(Number(req.params.id));
    res.json(Result.ok(null));
  } catch (e) {
    next(e);
  }
});

export default router;
