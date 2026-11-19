import Link from 'next/link';
import { formatKes, imageUrlFor, PRODUCT_BADGES } from '@/lib/constants';
import { Reveal } from './ScrollReveal';

export interface ProductCardData {
  id: number;
  name: string;
  slug: string;
  team: string | null;
  price: number;
  compareAtPrice: number | null;
  badge: string | null;
  images: Array<{ path: string; alt: string | null }>;
  variants: Array<{ stock: number; reserved: number }>;
}

export function ProductCard({
  product,
  index = 0,
}: {
  product: ProductCardData;
  index?: number;
}) {
  const badgeLabel = product.badge ? PRODUCT_BADGES[product.badge] : null;
  const totalAvailable = product.variants.reduce(
    (sum, v) => sum + Math.max(0, v.stock - v.reserved),
    0
  );
  const soldOut = totalAvailable <= 0;
  const onSale = Boolean(product.compareAtPrice && product.compareAtPrice > product.price);
  const imgUrl = imageUrlFor(product.images[0]?.path);

  return (
    <Reveal variant="up" delay={(index % 4) * 60}>
      <Link
        href={`/jerseys/${product.slug}`}
        className="group relative block overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] before:absolute before:inset-x-0 before:top-0 before:z-20 before:h-1 before:origin-left before:scale-x-0 before:bg-electric before:transition-transform before:duration-300 hover:-translate-y-1.5 hover:border-slate-900/25 hover:shadow-xl hover:shadow-slate-900/10 hover:before:scale-x-100"
      >
        <div className="relative aspect-[4/5] overflow-hidden bg-slate-100">
          {imgUrl ? (
            <img
              src={imgUrl}
              alt={product.images[0]?.alt || product.name}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-300 transition-transform duration-500 group-hover:scale-105">
              <svg viewBox="0 0 64 64" className="h-24 w-24" fill="currentColor" aria-hidden="true">
                <path d="M22 6 6 14l6 14 8-3v33h24V25l8 3 6-14-16-8c-1 5-5 8-10 8s-9-3-10-8Z" />
              </svg>
            </div>
          )}
          {badgeLabel && (
            <span
              className={`absolute left-2.5 top-2.5 rounded-full ${
                product.badge === 'clearance'
                  ? 'bg-slate-200 text-slate-800'
                  : 'bg-electric text-black'
              } px-2.5 py-0.5 text-[11px] font-bold shadow-xs transition-transform duration-300 group-hover:scale-105`}
            >
              {badgeLabel}
            </span>
          )}
          {soldOut && (
            <span className="absolute inset-x-0 bottom-0 bg-slate-900/80 py-1 text-center text-xs font-semibold text-white backdrop-blur-xs">
              Sold out
            </span>
          )}
        </div>
        <div className="p-3.5">
          <p className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-slate-900 transition-colors duration-200 group-hover:text-black">
            {product.name}
          </p>
          <p className="mt-1 text-xs font-medium text-slate-500">{product.team}</p>
          <div className="mt-2.5 flex items-center justify-between gap-2">
            <p className="flex items-baseline gap-2">
              <span className="font-extrabold text-black">{formatKes(product.price)}</span>
              {onSale && product.compareAtPrice && (
                <span className="text-xs text-slate-400 line-through">
                  {formatKes(product.compareAtPrice)}
                </span>
              )}
            </p>
            <span className="inline-flex items-center text-xs font-bold text-slate-400 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-black">
              &rarr;
            </span>
          </div>
        </div>
      </Link>
    </Reveal>
  );
}
