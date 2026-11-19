import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Pagination } from '@/components/Pagination';

export const dynamic = 'force-dynamic';

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === 'string' ? sp.q.trim() : '';
  const page = Math.max(1, Number(sp.page) || 1);
  const perPage = 15;

  const allCategories = await prisma.category.findMany({
    include: {
      parent: { include: { parent: true } },
      _count: { select: { products: true } },
    },
    orderBy: { id: 'asc' },
  });

  const filtered = allCategories.filter((c) => {
    if (!q) return true;
    const fullName = [c.parent?.parent?.name, c.parent?.name, c.name]
      .filter(Boolean)
      .join(' > ')
      .toLowerCase();
    return fullName.includes(q.toLowerCase()) || c.slug.toLowerCase().includes(q.toLowerCase());
  });

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-extrabold">Categories</h1>
        <Link
          href="/admin/categories/new"
          className="rounded-xl bg-electric px-4 py-2.5 text-sm font-bold text-black hover:brightness-90"
        >
          New category
        </Link>
      </div>

      <form method="get" className="mt-4 flex max-w-sm gap-2">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search categories..."
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black"
        >
          Filter
        </button>
      </form>

      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-600">
            <tr>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Products</th>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Shown</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {pageItems.map((c) => {
              const fullName = [c.parent?.parent?.name, c.parent?.name, c.name]
                .filter(Boolean)
                .join(' > ');
              return (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{fullName}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{c.slug}</td>
                  <td className="px-4 py-3">{c._count.products}</td>
                  <td className="px-4 py-3">{c.sortOrder}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                        c.isActive
                          ? 'bg-electric text-black'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {c.isActive ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/categories/${c.id}`}
                      className="font-semibold text-black underline decoration-electric decoration-2 underline-offset-4"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              );
            })}
            {pageItems.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  No categories found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        perPage={perPage}
        basePath="/admin/categories"
        searchParams={{ q: q || undefined }}
        itemLabel="categories"
      />
    </div>
  );
}
