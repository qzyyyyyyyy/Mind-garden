import { Router } from 'express';
import { Result } from '../common/result.js';
import { requireAdmin } from '../middleware/auth.js';
import * as analyticsDao from '../dao/analyticsDao.js';

const router = Router();

// GET /api/data-analytics/overview（仅管理员）
router.get('/data-analytics/overview', requireAdmin, async (req, res, next) => {
  try {
    const [systemOverview, consultationStats, emotionTrend, userActivity] = await Promise.all([
      analyticsDao.getSystemOverview(),
      analyticsDao.getConsultationStats(),
      analyticsDao.getEmotionTrend(),
      analyticsDao.getUserActivity(),
    ]);

    res.json(
      Result.ok({
        systemOverview,
        consultationStats,
        emotionTrend,
        userActivity,
      })
    );
  } catch (e) {
    next(e);
  }
});

export default router;
