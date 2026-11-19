import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { DELIVERY_METHODS, formatKes } from '@/lib/constants';
import { AdminOrderStatusForm } from '@/components/AdminOrderStatusForm';

export const dynamic = 'force-dynamic';

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id: Number(id) },
    include: { items: true },
  });
  if (!order) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Order {order.number}</h1>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-bold">Order</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Order number</p>
            <p className="mt-1 font-bold">{order.number}</p>
          </div>
          <div>
            <AdminOrderStatusForm orderId={order.id} currentStatus={order.status} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Total</p>
            <p className="mt-1 text-lg font-extrabold">{formatKes(order.total)}</p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-bold">Customer and delivery</h2>
        <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Name</p>
            <p className="mt-1 font-medium">{order.customerName}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Phone</p>
            <p className="mt-1 font-medium">{order.phone}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Email</p>
            <p className="mt-1 font-medium">{order.email || '-'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Method</p>
            <p className="mt-1 font-medium">
              {DELIVERY_METHODS[order.deliveryMethod] || order.deliveryMethod}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Area</p>
            <p className="mt-1 font-medium">{order.deliveryZoneName || '-'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Delivery fee</p>
            <p className="mt-1 font-medium">{formatKes(order.deliveryFee)}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs font-semibold uppercase text-slate-500">Address</p>
            <p className="mt-1 font-medium">{order.address || '-'}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs font-semibold uppercase text-slate-500">Notes</p>
            <p className="mt-1 font-medium">{order.notes || '-'}</p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-bold">Items</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="py-2">Jersey</th>
                <th className="py-2">Size</th>
                <th className="py-2">Quantity</th>
                <th className="py-2">Print: name</th>
                <th className="py-2">Print: number</th>
                <th className="py-2">Sleeve badge</th>
                <th className="py-2 text-right">Line total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td className="py-3 font-medium">{item.productName}</td>
                  <td className="py-3">{item.size}</td>
                  <td className="py-3">{item.quantity}</td>
                  <td className="py-3">{item.printName || '-'}</td>
                  <td className="py-3">{item.printNumber || '-'}</td>
                  <td className="py-3">{item.sleeveBadge ? 'Yes' : 'No'}</td>
                  <td className="py-3 text-right font-semibold">{formatKes(item.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
