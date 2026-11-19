import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { formatKes, imageUrlFor, PRODUCT_VERSIONS } from '@/lib/constants';
import { Pagination } from '@/components/Pagination';

export const dynamic = 'force-dynamic';

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === 'string' ? sp.q.trim() : '';
  const version = typeof sp.version === 'string' ? sp.version : '';
  const categoryId = typeof sp.categoryId === 'string' && sp.categoryId ? Number(sp.categoryId) : null;
  const status = typeof sp.status === 'string' ? sp.status : '';
  const perPage = [5, 10, 25, 50].includes(Number(sp.perPage)) ? Number(sp.perPage) : 10;
  const page = Math.max(1, Number(sp.page) || 1);

  const [allProducts, categories] = await Promise.all([
    prisma.product.findMany({
      where: {
        ...(version ? { version } : {}),
        ...(categoryId ? { categoryId } : {}),
        ...(status === 'active' ? { isActive: true } : status === 'hidden' ? { isActive: false } : {}),
      },
      orderBy: { id: 'desc' },
      include: {
        images: { orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] },
        variants: true,
        category: true,
      },
    }),
    prisma.category.findMany({
      include: { parent: { include: { parent: true } } },
      orderBy: { id: 'asc' },
    }),
  ]);

  const filtered = allProducts.filter((p) => {
    if (!q) return true;
    const ql = q.toLowerCase();
    return (
      p.name.toLowerCase().includes(ql) ||
      (p.team || '').toLowerCase().includes(ql)
    );
  });

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  const currentPage = Math.min(page, totalPages);
  const products = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-extrabold">Products</h1>
        <Link
          href="/admin/products/new"
          className="rounded-xl bg-electric px-4 py-2.5 text-sm font-bold text-black hover:brightness-90"
        >
          New product
        </Link>
      </div>

      <form
        method="get"
        className="mt-4 grid grid-cols-1 gap-2 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-6"
      >
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search name or team..."
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
        />

        <select
          name="categoryId"
          defaultValue={categoryId ?? ''}
          className="rounded-lg border border-slate-300 px-2 py-2 text-sm"
        >
          <option value="">All categories</option>
          {categories.map((c) => {
            const fullName = [c.parent?.parent?.name, c.parent?.name, c.name]
              .filter(Boolean)
              .join(' > ');
            return (
              <option key={c.id} value={c.id}>
                {fullName}
              </option>
            );
          })}
        </select>

        <select
          name="version"
          defaultValue={version}
          className="rounded-lg border border-slate-300 px-2 py-2 text-sm"
        >
          <option value="">All versions</option>
          {Object.entries(PRODUCT_VERSIONS).map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </select>

        <select
          name="perPage"
          defaultValue={String(perPage)}
          className="rounded-lg border border-slate-300 px-2 py-2 text-sm"
        >
          <option value="5">5 per page</option>
          <option value="10">10 per page</option>
          <option value="25">25 per page</option>
          <option value="50">50 per page</option>
        </select>

        <button
          type="submit"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black"
        >
          Apply
        </button>
      </form>

      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-600">
            <tr>
              <th className="px-4 py-3"></th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Version</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">In stock</th>
              <th className="px-4 py-3">Featured</th>
              <th className="px-4 py-3">Shown</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {products.map((p) => {
              const imgUrl = imageUrlFor(p.images[0]?.path);
              const totalStock = p.variants.reduce(
                (sum, v) => sum + Math.max(0, v.stock - v.reserved),
                0
              );
              return (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2">
                    <div className="h-10 w-10 overflow-hidden rounded bg-slate-100">
                      {imgUrl && (
                        <img src={imgUrl} alt="" className="h-full w-full object-cover" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold">{p.name}</td>
                  <td className="px-4 py-3 text-slate-600">{p.category?.name || '-'}</td>
                  <td className="px-4 py-3">
                    {p.version ? (
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold">
                        {PRODUCT_VERSIONS[p.version] || p.version}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-4 py-3 font-semibold">{formatKes(p.price)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        totalStock > 0
                          ? 'bg-electric text-black'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {totalStock}
                    </span>
                  </td>
                  <td className="px-4 py-3">{p.isFeatured ? 'Yes' : 'No'}</td>
                  <td className="px-4 py-3">{p.isActive ? 'Yes' : 'No'}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/products/${p.id}`}
                      className="font-semibold text-black underline decoration-electric decoration-2 underline-offset-4"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              );
            })}
            {products.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                  No products found.
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
        basePath="/admin/products"
        searchParams={{
          q: q || undefined,
          categoryId: categoryId ? String(categoryId) : undefined,
          version: version || undefined,
          status: status || undefined,
          perPage: perPage !== 10 ? String(perPage) : undefined,
        }}
        itemLabel="products"
      />
    </div>
  );
}
