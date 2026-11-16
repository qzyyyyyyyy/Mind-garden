import { Router } from 'express';
import { Result } from '../common/result.js';
import * as userService from '../services/userService.js';

// 用户路由（对应 UserController + TestController + 部分登录态接口）
const router = Router();

// GET /api/test
router.get('/test', (req, res) => {
  res.json(Result.ok('hello world'));
});

// POST /api/user/login
router.post('/user/login', async (req, res, next) => {
  try {
    const data = await userService.login(req.body || {});
    res.json(Result.ok(data));
  } catch (e) {
    next(e);
  }
});

// POST /api/user/add（注册）
router.post('/user/add', async (req, res, next) => {
  try {
    const data = await userService.register(req.body || {});
    res.json(Result.ok(data));
  } catch (e) {
    next(e);
  }
});

// GET /api/user/current
router.get('/user/current', async (req, res, next) => {
  try {
    const data = await userService.getCurrentUser(req.user.userId);
    res.json(Result.ok(data));
  } catch (e) {
    next(e);
  }
});

// POST /api/user/logout
router.post('/user/logout', (req, res) => {
  res.json(Result.ok(null));
});

export default router;
