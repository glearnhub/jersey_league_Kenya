import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { formatKes } from '@/lib/constants';
import { Pagination } from '@/components/Pagination';
import { AdminReconcileButton } from '@/components/AdminReconcileButton';

export const dynamic = 'force-dynamic';

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === 'string' ? sp.q.trim() : '';
  const status = typeof sp.status === 'string' ? sp.status : '';
  const page = Math.max(1, Number(sp.page) || 1);
  const perPage = 15;

  const allPayments = await prisma.payment.findMany({
    where: {
      ...(status ? { status } : {}),
    },
    orderBy: { id: 'desc' },
    include: { order: true },
  });

  const filtered = allPayments.filter((p) => {
    if (!q) return true;
    const ql = q.toLowerCase();
    return (
      p.order.number.toLowerCase().includes(ql) ||
      p.phone.toLowerCase().includes(ql) ||
      (p.mpesaReceipt || '').toLowerCase().includes(ql)
    );
  });

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  const currentPage = Math.min(page, totalPages);
  const payments = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-extrabold">M-Pesa Payments</h1>
        <AdminReconcileButton />
      </div>

      <form
        method="get"
        className="mt-4 flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-3"
      >
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search order #, phone or M-Pesa receipt..."
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <select
          name="status"
          defaultValue={status}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
          <option value="cancelled">Cancelled</option>
          <option value="timeout">Timed out</option>
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
              <th className="px-4 py-3">Sent</th>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">M-Pesa receipt</th>
              <th className="px-4 py-3">Result</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {payments.map((payment) => (
              <tr key={payment.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-500">
                  {payment.createdAt.toLocaleString('en-KE', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </td>
                <td className="px-4 py-3 font-bold">
                  <Link
                    href={`/admin/orders/${payment.orderId}`}
                    className="hover:underline decoration-electric decoration-2 underline-offset-4"
                  >
                    {payment.order.number}
                  </Link>
                </td>
                <td className="px-4 py-3">{payment.phone}</td>
                <td className="px-4 py-3 font-semibold">{formatKes(payment.amount)}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                      payment.status === 'success'
                        ? 'bg-electric text-black'
                        : payment.status === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {payment.status}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono font-bold">
                  {payment.mpesaReceipt || '-'}
                </td>
                <td className="px-4 py-3 text-slate-600">{payment.resultDesc || '-'}</td>
              </tr>
            ))}
            {payments.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  No payments recorded yet.
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
        basePath="/admin/payments"
        searchParams={{ q: q || undefined, status: status || undefined }}
        itemLabel="payments"
      />
    </div>
  );
}
