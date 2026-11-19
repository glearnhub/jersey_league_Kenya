import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { DELIVERY_METHODS, formatKes, ORDER_STATUSES } from '@/lib/constants';
import { Pagination } from '@/components/Pagination';

export const dynamic = 'force-dynamic';

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === 'string' ? sp.q.trim() : '';
  const status = typeof sp.status === 'string' ? sp.status : '';
  const page = Math.max(1, Number(sp.page) || 1);
  const perPage = 15;

  const allOrders = await prisma.order.findMany({
    where: {
      ...(status && ORDER_STATUSES[status] ? { status } : {}),
    },
    orderBy: { id: 'desc' },
  });

  const filtered = allOrders.filter((o) => {
    if (!q) return true;
    const ql = q.toLowerCase();
    return (
      o.number.toLowerCase().includes(ql) ||
      o.customerName.toLowerCase().includes(ql) ||
      o.phone.toLowerCase().includes(ql)
    );
  });

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  const currentPage = Math.min(page, totalPages);
  const orders = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Orders</h1>
      </div>

      <form
        method="get"
        className="mt-4 flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-3"
      >
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search order #, customer or phone..."
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <select
          name="status"
          defaultValue={status}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          {Object.entries(ORDER_STATUSES).map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </select>
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
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Placed</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Method</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-bold">{order.number}</td>
                <td className="px-4 py-3 text-slate-500">
                  {order.createdAt.toLocaleString('en-KE', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </td>
                <td className="px-4 py-3">{order.customerName}</td>
                <td className="px-4 py-3">{order.phone}</td>
                <td className="px-4 py-3">
                  {DELIVERY_METHODS[order.deliveryMethod] || order.deliveryMethod}
                </td>
                <td className="px-4 py-3 font-semibold">{formatKes(order.total)}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold">
                    {ORDER_STATUSES[order.status] || order.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="font-semibold text-black underline decoration-electric decoration-2 underline-offset-4"
                  >
                    Open
                  </Link>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                  No orders yet.
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
        basePath="/admin"
        searchParams={{ q: q || undefined, status: status || undefined }}
        itemLabel="orders"
      />
    </div>
  );
}
