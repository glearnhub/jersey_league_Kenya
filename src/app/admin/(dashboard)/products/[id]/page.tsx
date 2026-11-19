import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { AdminProductForm } from '@/components/AdminProductForm';

export const dynamic = 'force-dynamic';

export default async function AdminEditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id: Number(id) },
      include: {
        images: { orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] },
        variants: true,
      },
    }),
    prisma.category.findMany({
      include: { parent: { include: { parent: true } } },
      orderBy: { id: 'asc' },
    }),
  ]);

  if (!product) notFound();

  const formattedCategories = categories.map((c) => {
    const parts = [c.parent?.parent?.name, c.parent?.name, c.name].filter(Boolean);
    return { id: c.id, fullName: parts.join(' > ') };
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-extrabold">Edit {product.name}</h1>
      <AdminProductForm
        categories={formattedCategories}
        initial={{
          id: product.id,
          name: product.name,
          categoryId: product.categoryId,
          team: product.team || '',
          season: product.season || '',
          kit: product.kit || '',
          version: product.version || '',
          description: product.description || '',
          careNotes: product.careNotes || '',
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          badge: product.badge || '',
          isActive: product.isActive,
          isFeatured: product.isFeatured,
          allowsPrinting: product.allowsPrinting,
          allowsSleeveBadge: product.allowsSleeveBadge,
          images: product.images.map((i) => ({ path: i.path, alt: i.alt || '' })),
          variants: product.variants.map((v) => ({
            size: v.size,
            stock: v.stock,
            reserved: v.reserved,
          })),
        }}
      />
    </div>
  );
}
