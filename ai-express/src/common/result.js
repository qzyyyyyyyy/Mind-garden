// 响应码沿用 ResultCode.java（仅保留实际用到的）
export const ResultCode = {
  SUCCESS: { code: '200', msg: '操作成功' },
  ERROR: { code: '-1', msg: '操作失败' },
  UNAUTHORIZED: { code: '401', msg: '暂未登录或token已经过期' },
  SYSTEM_ERROR: { code: '500', msg: '系统错误' },

  PARAM_ERROR: { code: '400', msg: '参数错误' },
  PARAM_MISSING: { code: '4001', msg: '缺少必要参数' },
  PARAM_INVALID: { code: '4002', msg: '参数格式不正确' },

  FILE_NOT_FOUND: { code: '5001', msg: '文件不存在' },
  FILE_UPLOAD_FAILED: { code: '5002', msg: '文件上传失败' },
  FILE_SIZE_EXCEEDED: { code: '5004', msg: '文件大小超过限制' },
  FILE_TYPE_NOT_SUPPORTED: { code: '5005', msg: '不支持的文件类型' },

  BUSINESS_ERROR: { code: '6000', msg: '业务处理失败' },
  ACCOUNT_SAME: { code: '6001', msg: '用户名已存在' },
  USER_NOT_EXIST: { code: '6002', msg: '用户不存在' },

  TOKEN_INVALID: { code: 'A0230', msg: 'token无效' },
  TOKEN_EXPIRED: { code: 'A0230', msg: 'token已过期' },
  ACCESS_UNAUTHORIZED: { code: 'A0301', msg: '访问未授权' },
};

// 统一响应体（对应 Result.java）
export class Result {
  static ok(data = undefined) {
    return {
      code: ResultCode.SUCCESS.code,
      msg: ResultCode.SUCCESS.msg,
      data: data === undefined ? null : data,
    };
  }

  static error(code = ResultCode.ERROR.code, msg = ResultCode.ERROR.msg, data = null) {
    return { code, msg, data };
  }

  // 用 ResultCode 枚举项构造错误
  static fromCode(resultCode, data = null) {
    return { code: resultCode.code, msg: resultCode.msg, data };
  }
}
