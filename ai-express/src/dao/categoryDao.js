import { prisma } from '../config/database.js';

// Prisma 行 → snake_case 行（getCategoryTree 零改动）
function mapCategory(c) {
  if (!c) return null;
  return {
    id: Number(c.id),
    parent_id: c.parentId == null ? null : Number(c.parentId),
    category_name: c.categoryName,
    category_code: c.categoryCode,
    description: c.description,
    sort_order: c.sortOrder,
    status: c.status,
  };
}

// 全部分类
export async function listCategories() {
  const rows = await prisma.knowledgeCategory.findMany({
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
  });
  return rows.map(mapCategory);
}

// 按 parent_id 构建分类树
export async function getCategoryTree() {
  const rows = await listCategories();
  const map = new Map();
  rows.forEach((r) => {
    map.set(r.id, {
      id: r.id,
      parentId: r.parent_id,
      categoryName: r.category_name,
      categoryCode: r.category_code,
      description: r.description,
      sortOrder: r.sort_order,
      status: r.status,
      children: [],
    });
  });

  const tree = [];
  map.forEach((node) => {
    if (node.parentId && map.has(node.parentId)) {
      map.get(node.parentId).children.push(node);
    } else {
      tree.push(node);
    }
  });
  return tree;
}
