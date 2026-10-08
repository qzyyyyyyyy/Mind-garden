import { Result, ResultCode } from './result.js';
import { BusinessException } from '../exceptions/businessException.js';

// 404 兜底
export function notFoundHandler(req, res) {
  res.status(404).json(Result.error(ResultCode.BUSINESS_ERROR.code, '请求资源不存在', null));
}

// 全局异常处理（对应 GlobalExceptionHandler）
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof BusinessException) {
    return res.status(200).json(Result.error(err.code, err.msg, null));
  }

  // multer 文件上传错误
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(200).json(Result.fromCode(ResultCode.FILE_SIZE_EXCEEDED));
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(200).json(Result.fromCode(ResultCode.FILE_TYPE_NOT_SUPPORTED, err.message));
  }

  console.error('[Unhandled Error]', err);
  return res.status(500).json(Result.fromCode(ResultCode.SYSTEM_ERROR, err.message));
}
