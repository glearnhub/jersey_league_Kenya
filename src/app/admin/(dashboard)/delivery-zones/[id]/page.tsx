import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { AdminDeliveryZoneForm } from '@/components/AdminDeliveryZoneForm';

export const dynamic = 'force-dynamic';

export default async function AdminEditDeliveryZonePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const zone = await prisma.deliveryZone.findUnique({
    where: { id: Number(id) },
  });
  if (!zone) notFound();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-extrabold">Edit Delivery Zone: {zone.name}</h1>
      <AdminDeliveryZoneForm
        initial={{
          id: zone.id,
          name: zone.name,
          method: zone.method,
          fee: zone.fee,
          freeOver: zone.freeOver,
          estimate: zone.estimate || '',
          note: zone.note || '',
          sortOrder: zone.sortOrder,
          isActive: zone.isActive,
        }}
      />
    </div>
  );
}
