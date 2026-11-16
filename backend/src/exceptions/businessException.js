import { ResultCode } from '../common/result.js';

// 业务异常（对应 BusinessException.java）
// code 默认 BUSINESS_ERROR，msg 可自定义
export class BusinessException extends Error {
  constructor(message, code = ResultCode.BUSINESS_ERROR.code) {
    super(message);
    this.name = 'BusinessException';
    this.code = code;
    this.msg = message;
  }

  // 用 ResultCode 枚举项构造
  static fromCode(resultCode, msg) {
    return new BusinessException(msg || resultCode.msg, resultCode.code);
  }
}
