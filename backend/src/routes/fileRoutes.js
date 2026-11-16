import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { Result } from '../common/result.js';
import { saveUploadFile } from '../services/fileService.js';

const router = Router();

// multer 配置：先写到 os.tmpdir()，再由 fileService 复制到目标目录
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const tmp = path.join(os.tmpdir(), 'ai-express-uploads');
      fs.mkdirSync(tmp, { recursive: true });
      cb(null, tmp);
    },
    filename: (req, file, cb) => {
      // 保留原始扩展名，临时名用时间戳
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
    },
  }),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

// POST /api/file/upload
// 前端 (admin.js) 用 FormData 提交：file + businessType + businessId + businessField
router.post('/file/upload', upload.single('file'), async (req, res, next) => {
  try {
    const { businessType = 'ARTICLE', businessId = null, businessField = null } = req.body || {};
    const data = await saveUploadFile({
      file: req.file,
      businessType,
      businessId,
      businessField,
      userId: req.user?.userId,
    });
    res.json(Result.ok(data));
  } catch (e) {
    next(e);
  }
});

export default router;
