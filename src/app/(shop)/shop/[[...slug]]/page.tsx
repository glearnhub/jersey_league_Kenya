import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSelfAndDescendantIds } from '@/lib/categories';
import { PRODUCT_VERSIONS } from '@/lib/constants';
import { ProductCard } from '@/components/ProductCard';
import { ShopFilters } from '@/components/ShopFilters';
import { Pagination } from '@/components/Pagination';
import { Reveal } from '@/components/ScrollReveal';

export const dynamic = 'force-dynamic';

export default async function ShopIndexPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const categorySlug = slug?.[0] || null;

  let category = null;
  if (categorySlug) {
    category = await prisma.category.findUnique({
      where: { slug: categorySlug },
      include: {
        parent: {
          include: { parent: true },
        },
      },
    });
    if (!category || !category.isActive) {
      notFound();
    }
  }

  const categoryIds = category ? await getSelfAndDescendantIds(category.id) : null;
  const q = typeof sp.q === 'string' ? sp.q.trim() : '';
  const team = typeof sp.team === 'string' ? sp.team.trim() : '';
  const version =
    typeof sp.version === 'string' && PRODUCT_VERSIONS[sp.version] ? sp.version : '';
  const size = typeof sp.size === 'string' ? sp.size.trim() : '';
  const sale = sp.sale === '1' || sp.sale === 'true';
  const sort = typeof sp.sort === 'string' ? sp.sort : '';
  const page = Math.max(1, Number(sp.page) || 1);
  const perPage = 12;

  const allCategoryProducts = await prisma.product.findMany({
    where: {
      isActive: true,
      ...(categoryIds ? { categoryId: { in: categoryIds } } : {}),
    },
    include: {
      images: { orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] },
      variants: true,
    },
    orderBy:
      sort === 'price_asc'
        ? { price: 'asc' }
        : sort === 'price_desc'
          ? { price: 'desc' }
          : { createdAt: 'desc' },
  });

  const teams = Array.from(
    new Set(allCategoryProducts.map((p) => p.team).filter((t): t is string => Boolean(t)))
  ).sort();
  const versions = Array.from(
    new Set(allCategoryProducts.map((p) => p.version).filter((v): v is string => Boolean(v)))
  );

  const filteredProducts = allCategoryProducts.filter((p) => {
    if (q) {
      const ql = q.toLowerCase();
      const matchName = p.name.toLowerCase().includes(ql);
      const matchTeam = (p.team || '').toLowerCase().includes(ql);
      if (!matchName && !matchTeam) return false;
    }
    if (team && p.team !== team) return false;
    if (version && p.version !== version) return false;
    if (size) {
      const hasSize = p.variants.some((v) => v.size === size && v.stock > v.reserved);
      if (!hasSize) return false;
    }
    if (sale) {
      if (!p.compareAtPrice || p.compareAtPrice <= p.price) return false;
    }
    return true;
  });

  const totalItems = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  const currentPage = Math.min(page, totalPages);
  const pageProducts = filteredProducts.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  const children = category
    ? await prisma.category.findMany({
        where: { parentId: category.id, isActive: true },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      })
    : await prisma.category.findMany({
        where: { parentId: null, isActive: true },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      });

  const title = category ? category.name : q ? `Search: ${q}` : 'All jerseys';
  const crumbs = [category?.parent?.parent, category?.parent].filter(
    (c): c is NonNullable<typeof c> => Boolean(c)
  );
  const basePath = category ? `/shop/${category.slug}` : '/shop';

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Reveal variant="up">
        <nav className="mb-2 text-sm text-slate-500">
          <Link href="/" className="hover:text-black hover:underline">
            Home
          </Link>
          {category ? (
            <>
              {crumbs.map((c) => (
                <span key={c.id}>
                  {' '}
                  /{' '}
                  <Link href={`/shop/${c.slug}`} className="hover:text-black hover:underline">
                    {c.name}
                  </Link>
                </span>
              ))}
              {' / '}
              <span className="text-slate-700">{category.name}</span>
            </>
          ) : (
            <>
              {' / '}
              <span className="text-slate-700">Shop</span>
            </>
          )}
        </nav>

        <h1 className="text-3xl font-extrabold">{title}</h1>

        {children.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {children.map((child) => (
              <Link
                key={child.id}
                href={`/shop/${child.slug}`}
                className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm font-medium transition-all duration-300 hover:-translate-y-0.5 hover:border-black hover:bg-electric hover:shadow-sm"
              >
                {child.name}
              </Link>
            ))}
          </div>
        )}

        <ShopFilters teams={teams} versions={versions} q={q} />

        <p className="mt-4 text-sm text-slate-500">
          {totalItems} {totalItems === 1 ? 'jersey' : 'jerseys'}
        </p>
      </Reveal>

      {pageProducts.length === 0 ? (
        <Reveal
          variant="up"
          className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center"
        >
          <p className="font-semibold">Nothing matches that yet.</p>
          <Link
            href="/shop"
            className="mt-2 inline-block text-black underline decoration-electric decoration-4 underline-offset-4"
          >
            See all jerseys
          </Link>
        </Reveal>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {pageProducts.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            perPage={perPage}
            basePath={basePath}
            searchParams={{
              q: q || undefined,
              team: team || undefined,
              version: version || undefined,
              size: size || undefined,
              sort: sort || undefined,
              sale: sale ? '1' : undefined,
            }}
            itemLabel="jerseys"
          />
        </>
      )}
    </div>
  );
}
