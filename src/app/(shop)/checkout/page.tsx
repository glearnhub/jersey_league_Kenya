'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useCartStore } from '@/store/cart';
import { DELIVERY_METHODS } from '@/lib/constants';

interface ValidatedLine {
  key: string;
  productId: number;
  productName: string;
  size: string;
  quantity: number;
  printName: string | null;
  printNumber: string | null;
  sleeveBadge: boolean;
  lineTotal: number;
  enoughStock: boolean;
}

interface ZoneOption {
  id: number;
  name: string;
  method: string;
  estimate: string | null;
  note: string | null;
  computedFee: number;
}

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clear);

  const [lines, setLines] = useState<ValidatedLine[]>([]);
  const [zones, setZones] = useState<ZoneOption[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [paymentWindowMinutes, setPaymentWindowMinutes] = useState(15);
  const [selectedZoneId, setSelectedZoneId] = useState<number>(0);

  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [topError, setTopError] = useState<string | null>(null);
  const redirectingRef = useRef(false);

  useEffect(() => {
    if (redirectingRef.current) return;
    let active = true;
    async function load() {
      const res = await fetch('/api/cart/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      const data = await res.json();
      if (!active || redirectingRef.current) return;

      const validatedLines: ValidatedLine[] = data.lines || [];
      if (validatedLines.length === 0 || validatedLines.some((l) => !l.enoughStock)) {
        router.replace('/cart');
        return;
      }
      setLines(validatedLines);
      setSubtotal(data.subtotal || 0);
      setZones(data.zones || []);
      setPaymentWindowMinutes(data.paymentWindowMinutes ?? 15);
      if (data.zones?.length) {
        setSelectedZoneId((prev) => prev || data.zones[0].id);
      }
      setLoading(false);
    }
    load();
    return () => {
      active = false;
    };
  }, [items, router]);

  const activeZone = zones.find((z) => z.id === selectedZoneId);
  const fee = activeZone?.computedFee ?? 0;
  const isPickup = activeZone?.method === 'pickup';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    setTopError(null);

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          phone,
          email: email || null,
          deliveryZoneId: selectedZoneId,
          address: isPickup ? null : address,
          notes: notes || null,
          lines: items,
        }),
      });
      const data = await res.json();
      if (res.status === 422 && data.errors) {
        setErrors(data.errors);
        setBusy(false);
        return;
      }
      if (!res.ok) {
        if (data.cartError) {
          router.push('/cart');
          return;
        }
        setTopError(data.error || 'Could not place order.');
        setBusy(false);
        return;
      }

      redirectingRef.current = true;
      clearCart();
      router.replace(data.redirectUrl);
    } catch {
      setTopError('Could not connect to the server. Please try again.');
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 text-sm text-slate-500">
        Loading checkout...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-extrabold">Checkout</h1>
      <p className="mt-1 text-sm text-slate-600">
        You pay with M-Pesa. We send a prompt to your phone and you enter your PIN.
      </p>

      {(Object.keys(errors).length > 0 || topError) && (
        <p className="mt-4 rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm font-semibold text-rose-700">
          {topError || 'Please fix the items marked below.'}
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]"
      >
        <div className="space-y-8">
          <section>
            <h2 className="text-lg font-bold">1. Your details</h2>
            <div className="mt-3 space-y-4">
              <label className="block text-sm font-semibold">
                Full name
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  autoComplete="name"
                  required
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base font-normal"
                />
                {errors.customerName && (
                  <span className="mt-1 block text-sm font-normal text-rose-600">
                    {errors.customerName}
                  </span>
                )}
              </label>

              <label className="block text-sm font-semibold">
                M-Pesa phone number
                <input
                  type="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0712 345 678"
                  autoComplete="tel"
                  required
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base font-normal"
                />
                <span className="mt-1 block text-xs font-normal text-slate-500">
                  The payment prompt goes to this number.
                </span>
                {errors.phone && (
                  <span className="mt-1 block text-sm font-normal text-rose-600">
                    {errors.phone}
                  </span>
                )}
              </label>

              <label className="block text-sm font-semibold">
                Email <span className="font-normal text-slate-500">(optional)</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base font-normal"
                />
              </label>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold">2. Delivery or pick up</h2>
            {errors.deliveryZoneId && (
              <p className="mt-2 text-sm text-rose-600">{errors.deliveryZoneId}</p>
            )}
            <div className="mt-3 space-y-2">
              {zones.map((z) => (
                <label key={z.id} className="relative block">
                  <input
                    type="radio"
                    name="delivery_zone_id"
                    value={z.id}
                    checked={selectedZoneId === z.id}
                    onChange={() => setSelectedZoneId(z.id)}
                    className="peer sr-only"
                  />
                  <span className="flex cursor-pointer items-start justify-between gap-3 rounded-xl border border-slate-300 bg-white p-3 text-sm peer-checked:border-black peer-checked:bg-electric/20 peer-checked:ring-2 peer-checked:ring-black">
                    <span>
                      <span className="block font-semibold">{z.name}</span>
                      <span className="block text-slate-600">
                        {DELIVERY_METHODS[z.method] || z.method}
                        {z.estimate ? `, ${z.estimate}` : ''}
                      </span>
                      {z.note && <span className="block text-xs text-slate-500">{z.note}</span>}
                    </span>
                    <span className="shrink-0 font-bold">
                      {z.computedFee === 0 ? 'Free' : `KES ${z.computedFee.toLocaleString('en-KE')}`}
                    </span>
                  </span>
                </label>
              ))}
            </div>

            {!isPickup && (
              <label className="mt-4 block text-sm font-semibold">
                Delivery address
                <textarea
                  rows={3}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Estate, street, building and any landmark"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base font-normal"
                />
                {errors.address && (
                  <span className="mt-1 block text-sm font-normal text-rose-600">
                    {errors.address}
                  </span>
                )}
              </label>
            )}

            <label className="mt-4 block text-sm font-semibold">
              Note for us <span className="font-normal text-slate-500">(optional)</span>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base font-normal"
              />
            </label>
          </section>
        </div>

        <aside className="h-fit rounded-xl border border-slate-200 bg-white p-5 lg:sticky lg:top-32">
          <h2 className="font-bold">Your order</h2>
          <ul className="mt-3 divide-y divide-slate-100 text-sm">
            {lines.map((line) => (
              <li key={line.key} className="flex justify-between gap-3 py-2">
                <span className="min-w-0">
                  {line.quantity} &times; {line.productName}
                  <span className="block text-xs text-slate-500">
                    Size {line.size}
                    {line.printName || line.printNumber
                      ? `, print ${[line.printName, line.printNumber].filter(Boolean).join(' ')}`
                      : ''}
                  </span>
                </span>
                <span className="shrink-0 font-semibold">
                  KES {line.lineTotal.toLocaleString('en-KE')}
                </span>
              </li>
            ))}
          </ul>
          <dl className="mt-3 space-y-2 border-t border-slate-200 pt-3 text-sm">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd className="font-semibold">KES {subtotal.toLocaleString('en-KE')}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Delivery</dt>
              <dd className="font-semibold">
                {fee === 0 ? 'Free' : `KES ${fee.toLocaleString('en-KE')}`}
              </dd>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-extrabold">
              <dt>Total</dt>
              <dd>KES {(subtotal + fee).toLocaleString('en-KE')}</dd>
            </div>
          </dl>
          <button
            type="submit"
            disabled={busy}
            className="mt-5 w-full rounded-xl bg-electric px-4 py-3 font-bold text-black hover:brightness-90 disabled:opacity-60"
          >
            {busy ? 'Sending the prompt...' : 'Pay with M-Pesa'}
          </button>
          <p className="mt-2 text-center text-xs text-slate-500">
            Your sizes are held for {paymentWindowMinutes} minutes while you pay.
          </p>
          <Link
            href="/cart"
            className="mt-3 block text-center text-sm text-slate-600 hover:underline"
          >
            Back to the cart
          </Link>
        </aside>
      </form>
    </div>
  );
}
