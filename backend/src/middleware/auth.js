import { extractTokenFromRequest, verifyToken } from '../utils/jwt.js';
import { Result, ResultCode } from '../common/result.js';
import { env, PUBLIC_PATHS } from '../config/env.js';
import { pathToRegexp } from './pathMatcher.js';

// 对应 SecurityConfig.isPublicPATH + JwtAuthticationFilter
function isPublicPath(requestPath) {
  return PUBLIC_PATHS.some((p) => pathToRegexp(p).test(requestPath));
}

// JWT 鉴权中间件
// 公开路径直接放行；其余缺 token → 401 + A0301；token 无效 → 401 + A0230
export function authMiddleware(req, res, next) {
  if (isPublicPath(req.path)) {
    return next();
  }

  const token = extractTokenFromRequest(req);
  if (!token) {
    return res.status(401).json(Result.fromCode(ResultCode.ACCESS_UNAUTHORIZED));
  }

  try {
    const claims = verifyToken(token);
    // 注入到 req.user，供后续 handler 使用
    req.user = {
      userId: claims.userId,
      username: claims.username,
      roleType: Number(claims.roleType),
    };
    return next();
  } catch (err) {
    // token 过期或无效都返回 A0230
    return res.status(401).json(Result.fromCode(ResultCode.TOKEN_INVALID));
  }
}

// 仅管理员可访问
export function requireAdmin(req, res, next) {
  if (!req.user || req.user.roleType !== 2) {
    return res.status(200).json(Result.fromCode(ResultCode.ACCESS_UNAUTHORIZED, '需要管理员权限'));
  }
  return next();
}
