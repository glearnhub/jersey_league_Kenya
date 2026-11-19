import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { shopConfig } from '@/lib/constants';
import { ProductCard } from '@/components/ProductCard';
import { Reveal } from '@/components/ScrollReveal';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const cfg = shopConfig();

  // Single parallel fetch of all active categories and active products (2 queries total instead of N+1!)
  const [allCategories, allProducts] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    }),
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      include: {
        images: { orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] },
        variants: true,
      },
    }),
  ]);

  const featured = allProducts.filter((p) => p.isFeatured).slice(0, 12);
  const arrivals = allProducts.filter((p) => p.badge === 'new').slice(0, 8);

  // Build in-memory parent->children map
  const byParent = new Map<number, number[]>();
  for (const cat of allCategories) {
    if (cat.parentId !== null) {
      const list = byParent.get(cat.parentId) ?? [];
      list.push(cat.id);
      byParent.set(cat.parentId, list);
    }
  }

  function descendantIds(rootId: number): Set<number> {
    const ids = new Set<number>();
    const stack = [rootId];
    while (stack.length > 0) {
      const curr = stack.pop()!;
      ids.add(curr);
      for (const childId of byParent.get(curr) ?? []) {
        stack.push(childId);
      }
    }
    return ids;
  }

  const roots = allCategories.filter((c) => c.parentId === null);
  const sports = roots
    .map((sport) => {
      const catIds = descendantIds(sport.id);
      const latestProducts = allProducts
        .filter((p) => p.categoryId !== null && catIds.has(p.categoryId))
        .slice(0, 8);
      return { ...sport, latestProducts };
    })
    .filter((s) => s.latestProducts.length > 0);

  return (
    <>
      <section className="hero-bg overflow-hidden text-slate-900">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:py-20">
          <Reveal variant="left">
            <p className="inline-flex items-center gap-2 rounded-full bg-electric px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-black shadow-xs sm:text-sm">
              <span className="h-2 w-2 animate-pulse rounded-full bg-black" />
              New season kits
            </p>
            <h1 className="mt-3 max-w-2xl text-3xl font-extrabold leading-tight sm:mt-4 sm:text-5xl lg:text-6xl">
              Wear your team.{' '}
              <span className="box-decoration-clone rounded bg-electric px-2 text-black">
                Pay with M-Pesa.
              </span>
            </h1>
            <p className="mt-3 max-w-xl text-sm font-medium text-slate-800 sm:mt-4 sm:text-base">
              Fan and player version jerseys, kids kits and retro classics. Add your name and
              number for KES {cfg.printFee.toLocaleString('en-KE')}. Delivered to you, or pick up
              in store.
            </p>
            <div className="mt-6 flex flex-col gap-3 min-[420px]:flex-row sm:mt-8">
              <Link
                href="/shop"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-electric px-7 py-3.5 text-center font-bold text-black shadow-lg shadow-electric/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-electric/45"
              >
                <span>Shop all jerseys</span>
                <span className="transition-transform duration-300 group-hover:translate-x-1">
                  &rarr;
                </span>
              </Link>
              <Link
                href="/shop?sale=1"
                className="inline-flex items-center justify-center rounded-full border-2 border-slate-900 bg-white/85 px-7 py-3.5 text-center font-semibold backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
              >
                See the sale
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-12 px-3 py-8 sm:space-y-14 sm:px-4 sm:py-10">
        {featured.length > 0 && (
          <section>
            <Reveal variant="up" className="mb-4 flex items-end justify-between sm:mb-5">
              <h2 className="text-xl font-extrabold sm:text-2xl">Featured</h2>
              <Link
                href="/shop"
                className="group inline-flex items-center gap-1 text-sm font-semibold text-black underline decoration-electric decoration-4 underline-offset-4"
              >
                <span>View all</span>
                <span className="transition-transform duration-300 group-hover:translate-x-1">
                  &rarr;
                </span>
              </Link>
            </Reveal>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
              {featured.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          </section>
        )}

        {arrivals.length > 0 && (
          <section>
            <Reveal variant="up">
              <h2 className="mb-4 text-xl font-extrabold sm:mb-5 sm:text-2xl">New arrivals</h2>
            </Reveal>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
              {arrivals.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          </section>
        )}

        {sports.map((sport) => (
          <section key={sport.id}>
            <Reveal variant="up" className="mb-4 flex items-end justify-between sm:mb-5">
              <h2 className="text-xl font-extrabold sm:text-2xl">{sport.name}</h2>
              <Link
                href={`/shop/${sport.slug}`}
                className="group inline-flex items-center gap-1 text-sm font-semibold text-black underline decoration-electric decoration-4 underline-offset-4"
              >
                <span>View all</span>
                <span className="transition-transform duration-300 group-hover:translate-x-1">
                  &rarr;
                </span>
              </Link>
            </Reveal>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
              {sport.latestProducts.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
