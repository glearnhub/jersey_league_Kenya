'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DELIVERY_METHODS } from '@/lib/constants';

export interface DeliveryZoneFormInitial {
  id?: number;
  name: string;
  method: string;
  fee: number;
  freeOver: number | null;
  estimate: string;
  note: string;
  sortOrder: number;
  isActive: boolean;
}

export function AdminDeliveryZoneForm({
  initial,
}: {
  initial: DeliveryZoneFormInitial;
}) {
  const router = useRouter();
  const [form, setForm] = useState<DeliveryZoneFormInitial>(initial);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const url = initial.id
      ? `/api/admin/delivery-zones/${initial.id}`
      : '/api/admin/delivery-zones';
    const method = initial.id ? 'PATCH' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setBusy(false);

    if (!res.ok) {
      setError(data.error || 'Could not save delivery zone.');
      return;
    }

    router.push('/admin/delivery-zones');
    router.refresh();
  }

  async function handleDelete() {
    if (!initial.id || !confirm('Delete this delivery zone?')) return;
    setBusy(true);
    await fetch(`/api/admin/delivery-zones/${initial.id}`, { method: 'DELETE' });
    router.push('/admin/delivery-zones');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <p className="rounded-lg bg-rose-50 p-3 text-sm font-semibold text-rose-700">
          {error}
        </p>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-semibold">
            Name
            <input
              type="text"
              required
              maxLength={120}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder='e.g. "Nairobi CBD"'
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal"
            />
            <span className="mt-1 block text-xs font-normal text-slate-500">
              What the customer chooses at checkout.
            </span>
          </label>

          <label className="block text-sm font-semibold">
            Method
            <select
              value={form.method}
              onChange={(e) => setForm({ ...form, method: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal"
            >
              {Object.entries(DELIVERY_METHODS).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-semibold">
            Fee (KES)
            <input
              type="number"
              min={0}
              required
              value={form.fee}
              onChange={(e) => setForm({ ...form, fee: Number(e.target.value) || 0 })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal"
            />
            <span className="mt-1 block text-xs font-normal text-slate-500">
              Pickup is always free.
            </span>
          </label>

          <label className="block text-sm font-semibold">
            Free for orders above (KES)
            <input
              type="number"
              min={0}
              value={form.freeOver ?? ''}
              onChange={(e) =>
                setForm({
                  ...form,
                  freeOver: e.target.value !== '' ? Number(e.target.value) : null,
                })
              }
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal"
            />
            <span className="mt-1 block text-xs font-normal text-slate-500">
              Leave empty if delivery is never free here.
            </span>
          </label>

          <label className="block text-sm font-semibold">
            Estimate
            <input
              type="text"
              maxLength={80}
              placeholder="Same day"
              value={form.estimate}
              onChange={(e) => setForm({ ...form, estimate: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal"
            />
          </label>

          <label className="block text-sm font-semibold">
            Sort order
            <input
              type="number"
              value={form.sortOrder}
              onChange={(e) =>
                setForm({ ...form, sortOrder: Number(e.target.value) || 0 })
              }
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal"
            />
          </label>

          <label className="block text-sm font-semibold sm:col-span-2">
            Note
            <textarea
              rows={2}
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="For pickup: the shop address. Shown to the customer at checkout."
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal"
            />
          </label>

          <div className="sm:col-span-2">
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="h-4 w-4 accent-black"
              />
              Available at checkout
            </label>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={busy}
            className="rounded-xl bg-electric px-6 py-3 text-sm font-bold text-black hover:brightness-90 disabled:opacity-60"
          >
            {busy ? 'Saving...' : 'Save delivery zone'}
          </button>
          <Link
            href="/admin/delivery-zones"
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Link>
        </div>

        {initial.id && (
          <button
            type="button"
            disabled={busy}
            onClick={handleDelete}
            className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 hover:bg-rose-100"
          >
            Delete zone
          </button>
        )}
      </div>
    </form>
  );
}
