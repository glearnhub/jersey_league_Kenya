import { prisma } from '@/lib/prisma';
import { AdminCategoryForm } from '@/components/AdminCategoryForm';

export const dynamic = 'force-dynamic';

export default async function AdminNewCategoryPage() {
  const categories = await prisma.category.findMany({
    include: { parent: { include: { parent: true } } },
    orderBy: { id: 'asc' },
  });

  const parents = categories.map((c) => ({
    id: c.id,
    slug: c.slug,
    fullName: [c.parent?.parent?.name, c.parent?.name, c.name].filter(Boolean).join(' > '),
  }));

  return (
    <div>
      <h1 className="mb-6 text-2xl font-extrabold">Create Category</h1>
      <AdminCategoryForm
        parents={parents}
        initial={{
          name: '',
          slug: '',
          parentId: null,
          sortOrder: 0,
          isActive: true,
        }}
      />
    </div>
  );
}
