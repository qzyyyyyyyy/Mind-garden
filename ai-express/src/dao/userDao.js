import { prisma } from '../config/database.js';

// Prisma 行 → snake_case 行（与原 mysql2 返回结构一致，service 层零改动）
function mapUser(u) {
  if (!u) return null;
  return {
    id: Number(u.id),
    username: u.username,
    email: u.email,
    phone: u.phone,
    password: u.password,
    nickname: u.nickname,
    avatar: u.avatar,
    gender: u.gender,
    birthday: u.birthday,
    user_type: u.userType,
    status: u.status,
    created_at: u.createdAt,
    updated_at: u.updatedAt,
  };
}

// 按 username 或 email 查询用户（login 用）
export async function findUserByUsernameOrEmail(usernameOrEmail) {
  const row = await prisma.user.findFirst({
    where: { OR: [{ username: usernameOrEmail }, { email: usernameOrEmail }] },
  });
  return mapUser(row);
}

export async function findUserByUsername(username) {
  const row = await prisma.user.findFirst({ where: { username } });
  return mapUser(row);
}

export async function findUserByEmail(email) {
  const row = await prisma.user.findFirst({ where: { email } });
  return mapUser(row);
}

export async function findUserById(id) {
  const row = await prisma.user.findUnique({ where: { id: BigInt(id) } });
  return mapUser(row);
}

export async function countByUsername(username) {
  return prisma.user.count({ where: { username } });
}

export async function countByEmail(email) {
  return prisma.user.count({ where: { email } });
}

// 新建用户（created_at/updated_at 由 Prisma @default(now())/@updatedAt 自动写入）
export async function createUser(user) {
  const created = await prisma.user.create({
    data: {
      username: user.username,
      email: user.email || null,
      phone: user.phone || null,
      password: user.password,
      nickname: user.nickname || null,
      avatar: user.avatar || null,
      gender: user.gender ?? null,
      birthday: user.birthday || null,
      userType: user.userType ?? 1,
      status: user.status ?? 1,
    },
  });
  return mapUser(created);
}

// 更新用户头像
export async function updateUserAvatar(id, avatar) {
  await prisma.user.update({
    where: { id: BigInt(id) },
    data: { avatar },
  });
  return findUserById(id);
}
