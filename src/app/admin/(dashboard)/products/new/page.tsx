import { prisma } from '@/lib/prisma';
import { AdminProductForm } from '@/components/AdminProductForm';

export const dynamic = 'force-dynamic';

export default async function AdminNewProductPage() {
  const categories = await prisma.category.findMany({
    include: { parent: { include: { parent: true } } },
    orderBy: { id: 'asc' },
  });

  const formattedCategories = categories.map((c) => {
    const parts = [c.parent?.parent?.name, c.parent?.name, c.name].filter(Boolean);
    return { id: c.id, fullName: parts.join(' > ') };
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-extrabold">Create Product</h1>
      <AdminProductForm
        categories={formattedCategories}
        initial={{
          name: '',
          categoryId: null,
          team: '',
          season: '26/27',
          kit: 'home',
          version: 'fan',
          description: '',
          careNotes: '',
          price: 1300,
          compareAtPrice: null,
          badge: '',
          isActive: true,
          isFeatured: false,
          allowsPrinting: true,
          allowsSleeveBadge: false,
          images: [],
          variants: [
            { size: 'S', stock: 5 },
            { size: 'M', stock: 5 },
            { size: 'L', stock: 5 },
            { size: 'XL', stock: 5 },
          ],
        }}
      />
    </div>
  );
}
