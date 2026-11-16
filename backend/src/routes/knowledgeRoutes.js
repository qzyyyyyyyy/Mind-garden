import { Router } from 'express';
import { Result } from '../common/result.js';
import { requireAdmin } from '../middleware/auth.js';
import * as categoryDao from '../dao/categoryDao.js';
import * as articleDao from '../dao/articleDao.js';

const router = Router();

// GET /api/knowledge/category/tree
router.get('/knowledge/category/tree', async (req, res, next) => {
  try {
    const data = await categoryDao.getCategoryTree();
    res.json(Result.ok(data));
  } catch (e) {
    next(e);
  }
});

// GET /api/knowledge/article/page
router.get('/knowledge/article/page', async (req, res, next) => {
  try {
    const { pageNum = 1, pageSize = 10, categoryId, keyword, status } = req.query;
    const data = await articleDao.pageArticles({
      pageNum: Number(pageNum),
      pageSize: Number(pageSize),
      categoryId,
      keyword,
      status,
    });
    res.json(Result.ok(data));
  } catch (e) {
    next(e);
  }
});

// GET /api/knowledge/article/:id
router.get('/knowledge/article/:id', async (req, res, next) => {
  try {
    const data = await articleDao.getArticleById(req.params.id);
    res.json(Result.ok(data));
  } catch (e) {
    next(e);
  }
});

// POST /api/knowledge/article（仅管理员）
router.post('/knowledge/article', requireAdmin, async (req, res, next) => {
  try {
    const data = await articleDao.createArticle(req.user.userId, req.body || {});
    res.json(Result.ok(data));
  } catch (e) {
    next(e);
  }
});

// PUT /api/knowledge/article/:id（仅管理员）
router.put('/knowledge/article/:id', requireAdmin, async (req, res, next) => {
  try {
    const data = await articleDao.updateArticle(req.params.id, req.body || {});
    res.json(Result.ok(data));
  } catch (e) {
    next(e);
  }
});

// PUT /api/knowledge/article/:id/status（仅管理员）
router.put('/knowledge/article/:id/status', requireAdmin, async (req, res, next) => {
  try {
    const { status } = req.body || {};
    const data = await articleDao.updateArticleStatus(req.params.id, status);
    res.json(Result.ok(data));
  } catch (e) {
    next(e);
  }
});

// DELETE /api/knowledge/article/:id（仅管理员）
router.delete('/knowledge/article/:id', requireAdmin, async (req, res, next) => {
  try {
    await articleDao.deleteArticleById(req.params.id);
    res.json(Result.ok(null));
  } catch (e) {
    next(e);
  }
});

export default router;
