'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useCartStore } from '@/store/cart';

export interface RootCategory {
  id: number;
  name: string;
  slug: string;
  children: Array<{ id: number; name: string; slug: string }>;
}

export function ShopHeader({
  shopName,
  roots,
}: {
  shopName: string;
  roots: RootCategory[];
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [openRootId, setOpenRootId] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const totalCount = useCartStore((s) => s.totalCount());

  useEffect(() => {
    setMounted(true);
    function onScroll() {
      setScrolled(window.scrollY > 24);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const cartCount = mounted ? totalCount : 0;

  return (
    <header
      className={`sticky top-0 z-30 border-b text-slate-900 transition-all duration-300 ${
        scrolled
          ? 'border-slate-200/80 bg-white/90 shadow-md backdrop-blur-xl'
          : 'border-slate-200 bg-white shadow-xs'
      }`}
    >
      <div
        className={`mx-auto flex max-w-7xl flex-wrap items-center gap-x-2 gap-y-2 px-3 transition-all duration-300 sm:gap-x-3 sm:px-4 ${
          scrolled ? 'py-1.5 sm:py-2' : 'py-2 sm:py-3'
        }`}
      >
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-expanded={menuOpen}
          aria-label="Menu"
          className="order-1 rounded-lg border border-slate-300 p-2 transition-all duration-200 hover:border-electric hover:bg-electric sm:hidden"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            {!menuOpen ? (
              <path d="M4 7h16M4 12h16M4 17h16" />
            ) : (
              <path d="M6 6l12 12M18 6 6 18" />
            )}
          </svg>
        </button>

        <Link href="/" className="order-2 shrink-0" aria-label={`${shopName}: home`}>
          <img
            src="/images/logo-horizontal.png"
            alt={shopName}
            width={465}
            height={100}
            className={`w-auto transition-all duration-300 ${
              scrolled
                ? 'h-5 min-[400px]:h-6 sm:h-8'
                : 'h-6 min-[400px]:h-7 sm:h-10'
            }`}
          />
        </Link>

        <button
          type="button"
          onClick={() => setSearchOpen(!searchOpen)}
          aria-expanded={searchOpen}
          aria-label="Search"
          className="order-3 ml-auto rounded-lg border border-slate-300 p-2 transition-all duration-200 hover:border-electric hover:bg-electric sm:hidden"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
        </button>

        <Link
          href="/cart"
          className="relative order-4 shrink-0 rounded-lg border border-slate-300 p-2 text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:border-electric hover:bg-electric hover:shadow-sm sm:px-3 sm:py-2"
          aria-label={`Cart${cartCount ? `, ${cartCount} items` : ''}`}
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5 sm:hidden"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 6h15l-1.5 9h-12z" />
            <path d="M6 6 5 3H2" />
            <circle cx="9" cy="20" r="1.2" />
            <circle cx="18" cy="20" r="1.2" />
          </svg>
          <span className="hidden sm:inline">Cart</span>
          {cartCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 min-w-[1.25rem] rounded-full bg-electric px-1.5 text-center text-xs font-bold leading-5 text-black sm:static sm:ml-1 sm:inline-block sm:px-2 sm:py-0.5 sm:leading-normal">
              {cartCount}
            </span>
          )}
        </Link>

        <form
          action="/shop"
          method="get"
          onSubmit={() => setSearchOpen(false)}
          className={`${
            searchOpen ? 'flex' : 'hidden sm:flex'
          } order-5 w-full min-w-0 sm:order-3 sm:ml-auto sm:max-w-md sm:flex-1`}
        >
          <input
            type="search"
            name="q"
            placeholder="Search team or jersey"
            className="w-full min-w-0 rounded-l-lg border border-r-0 border-slate-300 bg-white px-3 py-2 text-base text-black transition-shadow placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-electric sm:text-sm"
          />
          <button
            type="submit"
            className="rounded-r-lg bg-electric px-4 text-sm font-bold text-black transition-all duration-200 hover:brightness-90"
          >
            Go
          </button>
        </form>
      </div>

      {/* Category pill row: horizontally scrollable on mobile, wrapping row on desktop */}
      <nav className="border-t border-slate-200/80">
        <div className="no-scrollbar mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-3 py-2 text-xs font-medium sm:flex-wrap sm:px-4 sm:text-sm">
          <Link
            href="/shop?sale=1"
            className="shrink-0 rounded-full bg-electric px-3.5 py-1.5 font-bold text-black shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:shadow-electric/30"
          >
            Sale
          </Link>
          <Link
            href="/shop"
            className="shrink-0 rounded-full border border-slate-300 bg-white/80 px-3.5 py-1.5 transition-all duration-300 hover:-translate-y-0.5 hover:border-electric hover:bg-electric hover:shadow-sm"
          >
            All
          </Link>
          {roots.map((root) => (
            <Link
              key={root.id}
              href={`/shop/${root.slug}`}
              className="shrink-0 rounded-full border border-slate-300 bg-white/80 px-3.5 py-1.5 transition-all duration-300 hover:-translate-y-0.5 hover:border-electric hover:bg-electric hover:shadow-sm"
            >
              {root.name}
            </Link>
          ))}
        </div>
      </nav>

      {/* Mobile full category accordion menu */}
      {menuOpen && (
        <>
          <div
            className="fixed inset-0 top-24 z-20 bg-black/30 sm:hidden"
            onClick={() => setMenuOpen(false)}
          />
          <nav
            aria-label="Categories"
            className="absolute inset-x-0 top-full z-30 max-h-[calc(100vh-4rem)] overflow-y-auto border-t border-slate-200 bg-white shadow-2xl sm:hidden"
          >
            <ul className="divide-y divide-slate-200 text-base">
              <li>
                <Link
                  href="/shop?sale=1"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between px-4 py-3.5 font-bold text-black"
                >
                  Sale{' '}
                  <span className="rounded-full bg-electric px-2 py-0.5 text-xs text-black">
                    Offers
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  href="/shop"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-3.5 font-medium"
                >
                  All jerseys
                </Link>
              </li>
              {roots.map((root) => {
                const isOpen = openRootId === root.id;
                return (
                  <li key={root.id}>
                    <div className="flex items-stretch">
                      <Link
                        href={`/shop/${root.slug}`}
                        onClick={() => setMenuOpen(false)}
                        className="flex-1 px-4 py-3.5 font-medium"
                      >
                        {root.name}
                      </Link>
                      {root.children.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setOpenRootId(isOpen ? null : root.id)}
                          className="px-4 text-slate-500 hover:text-black"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            className={`h-5 w-5 transition ${isOpen ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="m6 9 6 6 6-6" />
                          </svg>
                        </button>
                      )}
                    </div>
                    {isOpen && root.children.length > 0 && (
                      <ul className="bg-slate-50 text-sm">
                        {root.children.map((child) => (
                          <li key={child.id}>
                            <Link
                              href={`/shop/${child.slug}`}
                              onClick={() => setMenuOpen(false)}
                              className="block py-3 pl-8 pr-4 text-slate-700 decoration-electric decoration-2 underline-offset-4 hover:text-black hover:underline"
                            >
                              {child.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>
        </>
      )}
    </header>
  );
}
