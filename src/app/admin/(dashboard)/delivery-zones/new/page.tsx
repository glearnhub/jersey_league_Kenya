import { AdminDeliveryZoneForm } from '@/components/AdminDeliveryZoneForm';

export default function AdminNewDeliveryZonePage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-extrabold">Create Delivery Zone</h1>
      <AdminDeliveryZoneForm
        initial={{
          name: '',
          method: 'standard',
          fee: 0,
          freeOver: null,
          estimate: '',
          note: '',
          sortOrder: 0,
          isActive: true,
        }}
      />
    </div>
  );
}
