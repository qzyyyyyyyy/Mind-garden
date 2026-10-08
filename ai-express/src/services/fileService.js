import { prisma } from '../config/database.js';
import { env } from '../config/env.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

// 业务类型 → 子目录（与原 sys_file_info 中的路径一致）
const BUSINESS_DIR_MAP = {
  USER_AVATAR: 'bussiness/user_avatar',
  ARTICLE: 'bussiness/article',
};

// 文件类型识别（基于扩展名）
const EXT_TYPE_MAP = {
  '.jpg': 'IMG', '.jpeg': 'IMG', '.png': 'IMG', '.gif': 'IMG', '.webp': 'IMG', '.bmp': 'IMG',
  '.pdf': 'PDF',
  '.txt': 'TXT',
  '.doc': 'DOC', '.docx': 'DOC',
  '.xls': 'XLS', '.xlsx': 'XLS',
  '.ppt': 'PPT', '.pptx': 'PPT',
};

export function detectFileType(originalName) {
  const ext = path.extname(originalName || '').toLowerCase();
  return EXT_TYPE_MAP[ext] || 'OTHER';
}

// 保存上传文件到磁盘 + 写入 sys_file_info
// 返回：{ id, originalName, filePath, fileSize, fileType, businessType, businessId, businessField }
export async function saveUploadFile({ file, businessType = 'ARTICLE', businessId = null, businessField = null, userId }) {
  if (!file) {
    const err = new Error('文件不能为空');
    err.code = 'LIMIT_UNEXPECTED_FILE';
    throw err;
  }

  const subDir = BUSINESS_DIR_MAP[businessType] || 'bussiness/other';
  const targetDir = path.join(projectRoot, env.uploadDir, subDir);
  fs.mkdirSync(targetDir, { recursive: true });

  const ext = path.extname(file.originalname).toLowerCase();
  const fileName = `${Date.now()}${ext || ''}`;
  const targetPath = path.join(targetDir, fileName);

  // multer 已把文件写入 diskstorage，这里只是复制/移动到目标位置
  // 为简单起见，使用 fs.copyFile + unlink
  fs.copyFileSync(file.path, targetPath);
  try {
    fs.unlinkSync(file.path);
  } catch (_) {
    // ignore
  }

  // 访问路径：/files/bussiness/article/xxx.png
  const filePath = `/files/${subDir}/${fileName}`;
  const fileType = detectFileType(file.originalname);

  const created = await prisma.sysFileInfo.create({
    data: {
      originalName: file.originalname,
      filePath,
      fileSize: BigInt(file.size),
      fileType,
      businessType,
      businessId: businessId || null,
      businessField: businessField || null,
      uploadUserId: userId ? BigInt(userId) : null,
      isTemp: 0,
      status: 1,
    },
    select: { id: true },
  });
  const id = Number(created.id);

  return {
    id,
    originalName: file.originalname,
    filePath,
    fileSize: file.size,
    fileType,
    businessType,
    businessId,
    businessField,
  };
}
