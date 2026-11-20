'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function OrderClientView({
  order,
  sig,
  initialState,
  explanation,
  mpesaReceipt,
  fake,
  initialError,
  shopAddress,
}: {
  order: {
    number: string;
    status: string;
    customerName: string;
    phone: string;
    subtotal: number;
    deliveryFee: number;
    total: number;
    deliveryMethod: string;
    deliveryZoneName: string | null;
    address: string | null;
    expiresAtFormatted: string | null;
    items: Array<{
      id: number;
      productName: string;
      size: string;
      quantity: number;
      printName: string | null;
      printNumber: string | null;
      lineTotal: number;
    }>;
  };
  sig: string;
  initialState: 'paid' | 'waiting' | 'retry' | 'expired';
  explanation: string;
  mpesaReceipt: string | null;
  fake: boolean;
  initialError: string | null;
  shopAddress: string;
}) {
  const router = useRouter();
  const [phone, setPhone] = useState(order.phone);
  const [error, setError] = useState<string | null>(initialError);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (initialState !== 'waiting') return;
    const timer = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/orders/${encodeURIComponent(order.number)}/status?sig=${encodeURIComponent(sig)}`,
          { headers: { Accept: 'application/json' } }
        );
        const data = await res.json();
        if (data.state && data.state !== 'waiting') {
          router.refresh();
        }
      } catch {
        // ignore network blip during poll
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [initialState, order.number, sig, router]);

  async function handleRetryPay(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/orders/${encodeURIComponent(order.number)}/pay?sig=${encodeURIComponent(sig)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not start payment.');
      } else {
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleFake(outcome: 'success' | 'cancel') {
    setBusy(true);
    try {
      await fetch(
        `/api/orders/${encodeURIComponent(order.number)}/fake?sig=${encodeURIComponent(sig)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ outcome }),
        }
      );
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const firstName = order.customerName.split(' ')[0] || order.customerName;

  const isPickup = order.deliveryMethod === 'pickup';
  const steps = isPickup
    ? [
        { key: 'paid', label: 'Paid' },
        { key: 'processing', label: 'Processing' },
        { key: 'ready', label: 'Ready for pickup' },
        { key: 'delivered', label: 'Picked up' },
      ]
    : [
        { key: 'paid', label: 'Paid' },
        { key: 'processing', label: 'Processing' },
        { key: 'out_for_delivery', label: 'Out for delivery' },
        { key: 'delivered', label: 'Delivered' },
      ];

  const statusOrder: Record<string, number> = {
    paid: 0,
    processing: 1,
    ready: 2,
    out_for_delivery: 2,
    delivered: 3,
  };
  const currentStepIdx = statusOrder[order.status] ?? 0;

  const paidHeadline =
    order.status === 'delivered'
      ? isPickup
        ? `Order picked up, ${firstName}!`
        : `Order delivered, ${firstName}!`
      : order.status === 'out_for_delivery'
        ? `Your order is on the way, ${firstName}!`
        : order.status === 'ready'
          ? `Your order is ready for pickup, ${firstName}!`
          : order.status === 'processing'
            ? `We are preparing your order, ${firstName}.`
            : `Thank you, ${firstName}! Payment received.`;

  const paidSubtext =
    order.status === 'delivered'
      ? 'Thank you for shopping with Jersey League Kenya.'
      : order.status === 'out_for_delivery'
        ? 'Our rider is out for delivery with your jersey.'
        : order.status === 'ready'
          ? `You can pick up your order from our shop${shopAddress ? `: ${shopAddress}` : ''}.`
          : order.status === 'processing'
            ? 'Your jerseys are being prepared and packed.'
            : 'We have your order and will start preparing it now.';

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <p className="text-sm font-semibold text-slate-500">Order {order.number}</p>

      {error && (
        <p className="mt-3 rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm font-semibold text-rose-700">
          {error}
        </p>
      )}

      {initialState === 'paid' ? (
        <div className="mt-2 space-y-4">
          <div className="rounded-2xl bg-electric p-6 text-black">
            <h1 className="text-3xl font-extrabold">{paidHeadline}</h1>
            <p className="mt-2 font-medium">
              {paidSubtext}
              {mpesaReceipt && (
                <>
                  {' '}
                  M-Pesa receipt: <strong>{mpesaReceipt}</strong>.
                </>
              )}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
              Order progress
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {steps.map((step, idx) => {
                const done = idx <= currentStepIdx;
                const active = idx === currentStepIdx;
                return (
                  <div
                    key={step.key}
                    className={`rounded-xl border p-3 text-center text-xs font-bold transition ${
                      done
                        ? active
                          ? 'border-black bg-electric text-black shadow-xs'
                          : 'border-emerald-300 bg-emerald-50 text-emerald-900'
                        : 'border-slate-200 bg-slate-50 text-slate-400'
                    }`}
                  >
                    <span className="block text-[10px] uppercase opacity-70">
                      Step {idx + 1}
                    </span>
                    <span className="mt-0.5 block">{step.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : initialState === 'waiting' ? (
        <>
          <div className="mt-2 rounded-2xl border-2 border-black bg-white p-6 text-center">
            <div
              className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-black"
              aria-hidden="true"
            />
            <h1 className="mt-4 text-2xl font-extrabold">Check your phone</h1>
            <p className="mt-2">
              We sent an M-Pesa prompt for{' '}
              <strong>KES {order.total.toLocaleString('en-KE')}</strong> to{' '}
              <strong>{order.phone}</strong>. Enter your M-Pesa PIN to pay.
            </p>
            <p className="mt-1 text-sm text-slate-500">
              This page updates by itself when the payment arrives. Please keep it open.
            </p>
          </div>

          <details className="mt-4 rounded-xl border border-slate-200 bg-white p-4 text-sm">
            <summary className="cursor-pointer font-semibold">No prompt on your phone?</summary>
            <form onSubmit={handleRetryPay} className="mt-3 flex flex-wrap items-end gap-2">
              <label className="text-sm font-semibold">
                M-Pesa number
                <input
                  type="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 block w-48 rounded-lg border border-slate-300 px-3 py-2 text-base font-normal"
                />
              </label>
              <button
                type="submit"
                disabled={busy}
                className="rounded-lg bg-electric px-4 py-2 font-bold text-black hover:brightness-90"
              >
                Send it again
              </button>
            </form>
          </details>
        </>
      ) : initialState === 'retry' ? (
        <div className="mt-2 rounded-2xl border-2 border-rose-300 bg-white p-6">
          <h1 className="text-2xl font-extrabold">Payment not completed</h1>
          <p className="mt-2">
            {explanation}{' '}
            {order.expiresAtFormatted && (
              <>Your order is held until {order.expiresAtFormatted}. </>
            )}
            You can try again.
          </p>
          <form onSubmit={handleRetryPay} className="mt-4 flex flex-wrap items-end gap-2">
            <label className="text-sm font-semibold">
              M-Pesa number
              <input
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 block w-48 rounded-lg border border-slate-300 px-3 py-2 text-base font-normal"
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-electric px-5 py-2.5 font-bold text-black hover:brightness-90"
            >
              Pay KES {order.total.toLocaleString('en-KE')} again
            </button>
          </form>
        </div>
      ) : (
        <div className="mt-2 rounded-2xl border-2 border-slate-300 bg-white p-6">
          <h1 className="text-2xl font-extrabold">This order has expired</h1>
          <p className="mt-2">
            It was not paid in time, so the jerseys were released. No money was taken. If you paid
            and see this, please contact us with your M-Pesa message.
          </p>
          <Link
            href="/shop"
            className="mt-4 inline-block rounded-lg bg-electric px-5 py-2.5 font-bold text-black hover:brightness-90"
          >
            Back to the shop
          </Link>
        </div>
      )}

      {fake && initialState === 'waiting' && (
        <div className="mt-6 rounded-xl border-2 border-dashed border-amber-400 bg-amber-50 p-4 text-sm">
          <p className="font-bold">Test mode: M-Pesa is not connected</p>
          <p className="mt-1">
            No real prompt was sent. Use these buttons in place of the customer&apos;s phone.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => handleFake('success')}
              className="rounded-lg bg-electric px-4 py-2 font-bold text-black"
            >
              Customer pays
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => handleFake('cancel')}
              className="rounded-lg border border-slate-400 bg-white px-4 py-2 font-semibold"
            >
              Customer cancels
            </button>
          </div>
        </div>
      )}

      <section className="mt-8 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="font-bold">Your order</h2>
        <ul className="mt-3 divide-y divide-slate-100 text-sm">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-3 py-2">
              <span>
                {item.quantity} &times; {item.productName}
                <span className="block text-xs text-slate-500">
                  Size {item.size}
                  {item.printName || item.printNumber
                    ? `, print ${[item.printName, item.printNumber].filter(Boolean).join(' ')}`
                    : ''}
                </span>
              </span>
              <span className="shrink-0 font-semibold">
                KES {item.lineTotal.toLocaleString('en-KE')}
              </span>
            </li>
          ))}
        </ul>
        <dl className="mt-3 space-y-1 border-t border-slate-200 pt-3 text-sm">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>KES {order.subtotal.toLocaleString('en-KE')}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Delivery ({order.deliveryZoneName})</dt>
            <dd>
              {order.deliveryFee
                ? `KES ${order.deliveryFee.toLocaleString('en-KE')}`
                : 'Free'}
            </dd>
          </div>
          <div className="flex justify-between text-base font-extrabold">
            <dt>Total</dt>
            <dd>KES {order.total.toLocaleString('en-KE')}</dd>
          </div>
        </dl>
        <p className="mt-4 text-sm text-slate-600">
          {order.deliveryMethod === 'pickup'
            ? `Pick up from our shop${shopAddress ? `: ${shopAddress}` : ''}.`
            : `Delivery to: ${order.address}`}
        </p>
      </section>

      <Link
        href="/shop"
        className="mt-6 inline-block text-sm font-semibold text-black underline decoration-electric decoration-4 underline-offset-4"
      >
        Keep shopping
      </Link>
    </div>
  );
}
