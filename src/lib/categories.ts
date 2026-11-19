import { prisma } from './prisma';

export async function getSelfAndDescendantIds(categoryId: number): Promise<number[]> {
  const allActive = await prisma.category.findMany({
    where: { isActive: true },
    select: { id: true, parentId: true },
  });

  const byParent = new Map<number, number[]>();
  for (const cat of allActive) {
    if (cat.parentId !== null) {
      const list = byParent.get(cat.parentId) ?? [];
      list.push(cat.id);
      byParent.set(cat.parentId, list);
    }
  }

  const ids: number[] = [];
  const stack = [categoryId];
  while (stack.length > 0) {
    const current = stack.pop()!;
    ids.push(current);
    const children = byParent.get(current) ?? [];
    for (const childId of children) {
      stack.push(childId);
    }
  }

  return ids;
}

export async function getHeaderCategories() {
  return prisma.category.findMany({
    where: { isActive: true, parentId: null },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    include: {
      children: {
        where: { isActive: true },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      },
    },
  });
}
