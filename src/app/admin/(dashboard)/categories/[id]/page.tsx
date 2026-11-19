import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { AdminCategoryForm } from '@/components/AdminCategoryForm';

export const dynamic = 'force-dynamic';

export default async function AdminEditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [category, categories] = await Promise.all([
    prisma.category.findUnique({ where: { id: Number(id) } }),
    prisma.category.findMany({
      include: { parent: { include: { parent: true } } },
      orderBy: { id: 'asc' },
    }),
  ]);

  if (!category) notFound();

  const parents = categories.map((c) => ({
    id: c.id,
    slug: c.slug,
    fullName: [c.parent?.parent?.name, c.parent?.name, c.name].filter(Boolean).join(' > '),
  }));

  return (
    <div>
      <h1 className="mb-6 text-2xl font-extrabold">Edit Category: {category.name}</h1>
      <AdminCategoryForm
        parents={parents}
        initial={{
          id: category.id,
          name: category.name,
          slug: category.slug,
          parentId: category.parentId,
          sortOrder: category.sortOrder,
          isActive: category.isActive,
        }}
      />
    </div>
  );
}
