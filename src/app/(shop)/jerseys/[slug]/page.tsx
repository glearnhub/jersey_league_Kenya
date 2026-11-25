import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import {
  ALL_SIZES,
  formatKes,
  imageUrlFor,
  PRODUCT_VERSIONS,
  shopConfig,
} from '@/lib/constants';
import { ProductGallery } from '@/components/ProductGallery';
import { AddToCartForm } from '@/components/AddToCartForm';
import { ProductCard } from '@/components/ProductCard';
import { Reveal } from '@/components/ScrollReveal';

export const dynamic = 'force-dynamic';

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      images: { orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] },
      variants: true,
      category: {
        include: {
          parent: {
            include: { parent: true },
          },
        },
      },
    },
  });

  if (!product || !product.isActive) {
    notFound();
  }

  const cfg = shopConfig();
  const related = await prisma.product.findMany({
    where: {
      isActive: true,
      id: { not: product.id },
      ...(product.team ? { team: product.team } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 4,
    include: {
      images: { orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] },
      variants: true,
    },
  });

  const sortedVariants = [...product.variants].sort((a, b) => {
    const ia = ALL_SIZES.indexOf(a.size as (typeof ALL_SIZES)[number]);
    const ib = ALL_SIZES.indexOf(b.size as (typeof ALL_SIZES)[number]);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });

  const sizes = sortedVariants.map((v) => ({
    id: v.id,
    size: v.size,
    available: Math.max(0, v.stock - v.reserved),
  }));

  const galleryImages = product.images
    .map((img) => ({
      id: img.id,
      url: imageUrlFor(img.path) || '',
      alt: img.alt,
    }))
    .filter((img) => Boolean(img.url));

  const crumbs = [
    product.category?.parent?.parent,
    product.category?.parent,
    product.category,
  ].filter((c): c is NonNullable<typeof c> => Boolean(c));

  const onSale = Boolean(product.compareAtPrice && product.compareAtPrice > product.price);
  const careLines = (product.careNotes || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <nav className="mb-4 text-sm text-slate-500">
        <Link href="/" className="hover:text-black hover:underline">
          Home
        </Link>
        {crumbs.map((crumb) => (
          <span key={crumb.id}>
            {' / '}
            <Link href={`/shop/${crumb.slug}`} className="hover:text-black hover:underline">
              {crumb.name}
            </Link>
          </span>
        ))}
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        <Reveal variant="left">
          <ProductGallery productName={product.name} images={galleryImages} />
        </Reveal>

        <Reveal variant="right" delay={100}>
          <p className="text-sm font-semibold uppercase tracking-wide text-black">
            {product.team}
            {product.version
              ? ` · ${PRODUCT_VERSIONS[product.version] || product.version}`
              : ''}
          </p>
          <h1 className="mt-1 text-3xl font-extrabold leading-tight">{product.name}</h1>
          <p className="mt-3 flex items-baseline gap-3">
            <span className="text-3xl font-extrabold">{formatKes(product.price)}</span>
            {onSale && product.compareAtPrice && (
              <span className="text-lg text-slate-400 line-through">
                {formatKes(product.compareAtPrice)}
              </span>
            )}
          </p>

          <AddToCartForm
            product={{
              id: product.id,
              name: product.name,
              price: product.price,
              allowsPrinting: product.allowsPrinting,
              allowsSleeveBadge: product.allowsSleeveBadge,
            }}
            sizes={sizes}
            printFee={cfg.printFee}
            badgeFee={cfg.sleeveBadgeFee}
            maxQuantity={cfg.maxQuantityPerLine}
          />

          {product.description && (
            <div className="mt-8">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                About this jersey
              </h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700">
                {product.description}
              </p>
            </div>
          )}

          {careLines.length > 0 && (
            <div className="mt-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Washing and care
              </h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                {careLines.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </div>
          )}
        </Reveal>
      </div>

      {related.length > 0 && (
        <section className="mt-14">
          <Reveal variant="up">
            <h2 className="mb-4 text-2xl font-extrabold">More {product.team}</h2>
          </Reveal>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {related.map((item, i) => (
              <ProductCard key={item.id} product={item} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
