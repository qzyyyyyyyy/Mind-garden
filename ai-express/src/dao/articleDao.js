import { randomUUID } from 'crypto';
import { prisma } from '../config/database.js';
import { format } from '../services/convert/userConvert.js';

const CATEGORY_INCLUDE = { category: { select: { categoryName: true } } };

// 分页查询文章（带分类名）
export async function pageArticles({ pageNum = 1, pageSize = 10, categoryId, keyword, status }) {
  const offset = (pageNum - 1) * pageSize;
  const where = {};
  if (categoryId) where.categoryId = BigInt(Number(categoryId));
  if (keyword) {
    where.OR = [
      { title: { contains: keyword } },
      { summary: { contains: keyword } },
    ];
  }
  if (status !== undefined && status !== null && status !== '') {
    where.status = Number(status);
  }

  const [total, rows] = await Promise.all([
    prisma.knowledgeArticle.count({ where }),
    prisma.knowledgeArticle.findMany({
      where,
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      skip: offset,
      take: pageSize,
      include: CATEGORY_INCLUDE,
    }),
  ]);

  const records = rows.map((r) => toArticleDto(r));
  return { records, total, pageNum: Number(pageNum), pageSize: Number(pageSize) };
}

// 文章详情（read_count + 1；与原实现一致：不改 updated_at、不存在返回 null）
export async function getArticleById(id) {
  // 用 raw 绕过 @updatedAt，避免阅读时改动 updated_at
  await prisma.$executeRawUnsafe(
    'UPDATE knowledge_article SET read_count = COALESCE(read_count, 0) + 1 WHERE id = ?',
    id
  );
  const row = await prisma.knowledgeArticle.findUnique({
    where: { id },
    include: CATEGORY_INCLUDE,
  });
  return toArticleDto(row);
}

// 新建文章（UUID 主键，author_id 取 token，published_at = now，tags 数组转逗号串）
export async function createArticle(userId, dto) {
  const id = randomUUID();
  const { categoryId, title, summary, content, coverImage, tags, status = 1 } = dto || {};

  await prisma.knowledgeArticle.create({
    data: {
      id,
      categoryId: BigInt(Number(categoryId)),
      title,
      summary: summary || null,
      content,
      coverImage: coverImage || '',
      tags: Array.isArray(tags) ? tags.join(',') : (tags || ''),
      authorId: userId ? BigInt(userId) : null,
      readCount: 0,
      status: Number(status),
      publishedAt: new Date(),
    },
  });

  // 与原实现一致：create 后返回 getArticleById（read_count + 1）
  return getArticleById(id);
}

// 更新文章
export async function updateArticle(id, dto) {
  const data = {};
  if (dto.categoryId !== undefined) data.categoryId = BigInt(Number(dto.categoryId));
  if (dto.title !== undefined) data.title = dto.title;
  if (dto.summary !== undefined) data.summary = dto.summary;
  if (dto.content !== undefined) data.content = dto.content;
  if (dto.coverImage !== undefined) data.coverImage = dto.coverImage;
  if (dto.status !== undefined) data.status = Number(dto.status);
  if (Array.isArray(dto.tags)) data.tags = dto.tags.join(',');

  if (Object.keys(data).length > 0) {
    await prisma.knowledgeArticle.updateMany({ where: { id }, data });
  }
  // 与原实现一致：update 后返回 getArticleById
  return getArticleById(id);
}

// 切换文章状态
export async function updateArticleStatus(id, status) {
  await prisma.knowledgeArticle.updateMany({
    where: { id },
    data: { status: Number(status) },
  });
  return getArticleById(id);
}

// 删除文章
export async function deleteArticleById(id) {
  const r = await prisma.knowledgeArticle.deleteMany({ where: { id } });
  return r.count;
}

// DTO 转换（读取 Prisma camelCase + 嵌套 category）
function toArticleDto(r) {
  if (!r) return null;
  return {
    id: r.id,
    categoryId: Number(r.categoryId),
    categoryName: r.category?.categoryName || null,
    title: r.title,
    summary: r.summary,
    content: r.content,
    coverImage: r.coverImage,
    tags: r.tags ? r.tags.split(',').filter(Boolean) : [],
    authorId: r.authorId == null ? null : Number(r.authorId),
    readCount: r.readCount || 0,
    status: r.status,
    publishedAt: format.dateTime(r.publishedAt),
    createdAt: format.dateTime(r.createdAt),
    updatedAt: format.dateTime(r.updatedAt),
  };
}
