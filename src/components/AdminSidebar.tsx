'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  ShoppingBag,
  Banknote,
  Tag,
  Layers,
  Truck,
  ExternalLink,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/admin', label: 'Orders', icon: ShoppingBag, exact: true, matchPrefix: '/admin/orders' },
  { href: '/admin/payments', label: 'Payments', icon: Banknote },
  { href: '/admin/products', label: 'Products', icon: Tag },
  { href: '/admin/categories', label: 'Categories', icon: Layers },
  { href: '/admin/delivery-zones', label: 'Delivery Zones', icon: Truck },
];

export function AdminSidebar({
  admin,
}: {
  admin: { name: string; email: string };
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  }

  function isActive(item: (typeof NAV_ITEMS)[number]) {
    if (item.exact) {
      return pathname === item.href || (item.matchPrefix && pathname.startsWith(item.matchPrefix));
    }
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-white">
      <div>
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
          <Link href="/admin" onClick={() => setMobileOpen(false)} className="shrink-0">
            <img
              src="/images/logo-horizontal.png"
              alt="Jersey League Kenya"
              className="h-8 w-auto"
            />
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-3 py-4">
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Shop Management
          </p>
          <nav className="mt-2 space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isActive(item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                    active
                      ? 'bg-electric text-black shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-black'
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="border-t border-slate-200 p-4">
        <Link
          href="/"
          target="_blank"
          className="mb-3 flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-black hover:bg-slate-50"
        >
          <span>Open Storefront</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
        <div className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 p-3">
          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-slate-900">{admin.name}</p>
            <p className="truncate text-[11px] text-slate-500">{admin.email}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            title="Sign out"
            className="shrink-0 rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="rounded-lg border border-slate-300 p-2 text-slate-700 hover:bg-slate-100"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link href="/admin">
          <img
            src="/images/logo-horizontal.png"
            alt="Jersey League Kenya"
            className="h-7 w-auto"
          />
        </Link>
        <Link href="/" className="text-xs font-semibold underline">
          Shop
        </Link>
      </div>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative z-50 w-64 max-w-[80vw] border-r border-slate-200 bg-white">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Desktop fixed left sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:block lg:w-64 lg:border-r lg:border-slate-200 lg:bg-white">
        {sidebarContent}
      </aside>
    </>
  );
}
