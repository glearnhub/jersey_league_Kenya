import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { DELIVERY_METHODS, formatKes } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export default async function AdminDeliveryZonesPage() {
  const zones = await prisma.deliveryZone.findMany({
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-extrabold">Delivery Zones</h1>
        <Link
          href="/admin/delivery-zones/new"
          className="rounded-xl bg-electric px-4 py-2.5 text-sm font-bold text-black hover:brightness-90"
        >
          New delivery zone
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-600">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Method</th>
              <th className="px-4 py-3">Fee</th>
              <th className="px-4 py-3">Free above</th>
              <th className="px-4 py-3">Estimate</th>
              <th className="px-4 py-3">Available</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {zones.map((z) => (
              <tr key={z.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-semibold">{z.name}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold">
                    {DELIVERY_METHODS[z.method] || z.method}
                  </span>
                </td>
                <td className="px-4 py-3 font-semibold">{formatKes(z.fee)}</td>
                <td className="px-4 py-3">
                  {z.freeOver !== null ? formatKes(z.freeOver) : '-'}
                </td>
                <td className="px-4 py-3 text-slate-600">{z.estimate || '-'}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                      z.isActive
                        ? 'bg-electric text-black'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {z.isActive ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/delivery-zones/${z.id}`}
                    className="font-semibold text-black underline decoration-electric decoration-2 underline-offset-4"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {zones.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  No delivery zones yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
