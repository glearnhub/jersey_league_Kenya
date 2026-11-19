'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ORDER_STATUSES } from '@/lib/constants';

export function AdminOrderStatusForm({
  orderId,
  currentStatus,
}: {
  orderId: number;
  currentStatus: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSave(newVal: string) {
    setStatus(newVal);
    setSaving(true);
    setMessage(null);
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newVal }),
    });
    setSaving(false);
    if (res.ok) {
      setMessage('Saved');
      router.refresh();
    } else {
      const data = await res.json();
      setMessage(data.error || 'Error saving');
    }
  }

  return (
    <div>
      <label className="block text-xs font-semibold uppercase text-slate-500">
        Status
        <select
          value={status}
          disabled={saving}
          onChange={(e) => handleSave(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal text-black"
        >
          {Object.entries(ORDER_STATUSES).map(([val, label]) => {
            const disabled =
              (val === 'paid' && currentStatus !== 'paid') ||
              (val === 'pending_payment' && currentStatus !== 'pending_payment');
            return (
              <option key={val} value={val} disabled={disabled}>
                {label}
              </option>
            );
          })}
        </select>
      </label>
      <p className="mt-1 text-xs text-slate-500">
        &ldquo;Paid&rdquo; is set by M-Pesa, not by hand.
      </p>
      {message && <p className="mt-1 text-xs font-semibold text-black">{message}</p>}
    </div>
  );
}
