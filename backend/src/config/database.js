import { PrismaClient } from '@prisma/client';

// Prisma 全局实例（ORM）
// 通过 DATABASE_URL 连接 MySQL，datetime 字段读取为本地时区 Date 对象
export const prisma = new PrismaClient();

// 兼容工具：用于 analyticsDao 等 MySQL 日期函数/聚合的原始 SQL 兜底
// $queryRawUnsafe(sql, ...params) 返回行数组；$executeRawUnsafe 返回受影响行数
export const queryRaw = (sql, params = []) => prisma.$queryRawUnsafe(sql, ...params);
export const queryRawOne = async (sql, params = []) => {
  const rows = await queryRaw(sql, params);
  return rows[0] || null;
};
