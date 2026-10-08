import bcrypt from 'bcryptjs';
import {
  findUserByUsernameOrEmail,
  findUserById,
  findUserByUsername,
  findUserByEmail,
  countByUsername,
  countByEmail,
  createUser,
} from '../dao/userDao.js';
import { generateToken } from '../utils/jwt.js';
import { BusinessException } from '../exceptions/businessException.js';
import { ResultCode } from '../common/result.js';
import { toUserDetail } from './convert/userConvert.js';

// 登录（对应 UserService.login）
export async function login({ username, password }) {
  if (!username || !password) {
    throw new BusinessException('用户名和密码不能为空', ResultCode.PARAM_MISSING.code);
  }

  // username 字段可能是用户名或邮箱
  const user = await findUserByUsernameOrEmail(username.trim());
  if (!user) {
    throw new BusinessException('用户不存在', ResultCode.USER_NOT_EXIST.code);
  }

  // bcryptjs 兼容现有 $2a$ 哈希
  const inputPassword = String(password).trim();
  const ok = await bcrypt.compare(inputPassword, user.password);
  if (!ok) {
    throw new BusinessException('密码错误');
  }

  // 状态检查：0=禁用
  if (user.status !== 1) {
    throw new BusinessException('用户已被禁用，请联系管理员');
  }

  // 生成 token
  const token = generateToken(user.id, user.username, user.user_type);
  const userInfo = toUserDetail(user);

  // roleType 字段是字符串（与原 entityToLoginResponse 保持一致）
  return {
    token,
    roleType: String(user.user_type),
    userInfo,
  };
}

// 注册（对应 UserService.register）
export async function register(dto) {
  const {
    username,
    email,
    phone,
    password,
    confirmPassword,
    nickname,
    gender,
    birthday,
    userType = 1,
  } = dto || {};

  // 密码一致性
  if (password !== confirmPassword) {
    throw new BusinessException('两次输入密码不一致');
  }

  // 用户名校验：正则 + 长度
  const usernameRegex = /^[a-zA-Z0-9_]+$/;
  if (!username || username.length < 3 || username.length > 50 || !usernameRegex.test(username)) {
    throw new BusinessException('用户名只能包含字母、数字和下划线，长度 3-50', ResultCode.PARAM_INVALID.code);
  }

  // 邮箱校验（基础格式）
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email) || email.length > 100) {
    throw new BusinessException('邮箱格式不正确', ResultCode.PARAM_INVALID.code);
  }

  // 手机号校验
  if (phone) {
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      throw new BusinessException('手机号格式不正确', ResultCode.PARAM_INVALID.code);
    }
  }

  // 密码长度
  if (!password || password.length < 6 || password.length > 50) {
    throw new BusinessException('密码长度必须在6到50个字符之间', ResultCode.PARAM_INVALID.code);
  }

  // 用户名重复
  if ((await countByUsername(username)) > 0) {
    throw new BusinessException('用户名已存在', ResultCode.ACCOUNT_SAME.code);
  }

  // 邮箱重复
  if ((await countByEmail(email)) > 0) {
    throw new BusinessException('邮箱已存在', ResultCode.ACCOUNT_SAME.code);
  }

  // userType 校验
  if (userType !== 1 && userType !== 2) {
    throw new BusinessException('无效的用户类型');
  }

  // 创建用户（哈希密码）
  const encodedPassword = await bcrypt.hash(String(password).trim(), 10);
  const created = await createUser({
    username,
    email,
    phone: phone || null,
    password: encodedPassword,
    nickname: nickname || null,
    avatar: null,
    gender: gender ?? null,
    birthday: birthday || null,
    userType,
    status: 1,
  });

  return toUserDetail(created);
}

// 当前用户（对应 UserService.getUserById）
export async function getCurrentUser(userId) {
  const user = await findUserById(userId);
  if (!user) {
    throw new BusinessException('用户不存在', ResultCode.USER_NOT_EXIST.code);
  }
  return toUserDetail(user);
}

// 登出（无副作用，原 Spring 后端也未实现，前端调用即可）
export async function logout() {
  return null;
}

export async function findUserByIdInternal(userId) {
  return findUserById(userId);
}
