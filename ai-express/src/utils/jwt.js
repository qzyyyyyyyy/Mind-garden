import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

// 对应 JwtTokenUtil.java
// claims: userId / username / roleType；issuer mental-health-assistant；24h 过期
// 注意：原 Spring 代码中 roleType 可能是字符串或数字，这里统一用 Number，签发时存数字

export function generateToken(userId, username, roleType) {
  return jwt.sign(
    { userId, username, roleType: Number(roleType) },
    env.jwt.secret,
    {
      expiresIn: env.jwt.expiration,
      issuer: env.jwt.issuer,
    }
  );
}

// 校验 token，返回 claims 或抛错
export function verifyToken(token) {
  return jwt.verify(token, env.jwt.secret, { issuer: env.jwt.issuer });
}

// 从请求头取 token（对应 extractTokenFromRequest）
export function extractTokenFromRequest(req) {
  const token = req.headers['token'];
  if (token && typeof token === 'string' && token.trim().length > 0) {
    return token;
  }
  return null;
}
