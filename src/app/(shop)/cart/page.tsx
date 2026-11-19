'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useCartStore } from '@/store/cart';

interface ValidatedLine {
  key: string;
  productId: number;
  productSlug: string;
  productName: string;
  imageUrl: string | null;
  size: string;
  quantity: number;
  printName: string | null;
  printNumber: string | null;
  sleeveBadge: boolean;
  unitPrice: number;
  printFee: number;
  lineTotal: number;
  available: number;
  enoughStock: boolean;
}

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  const [lines, setLines] = useState<ValidatedLine[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [printFee, setPrintFee] = useState(400);
  const [loading, setLoading] = useState(true);
  const [draftQty, setDraftQty] = useState<Record<string, number>>({});

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch('/api/cart/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items }),
        });
        const data = await res.json();
        if (active && data.lines) {
          setLines(data.lines);
          setSubtotal(data.subtotal || 0);
          setPrintFee(data.printFee ?? 400);
          const drafts: Record<string, number> = {};
          for (const l of data.lines) {
            drafts[l.key] = l.quantity;
          }
          setDraftQty(drafts);
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [items]);

  const anyShortage = lines.some((l) => !l.enoughStock);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-extrabold">Your cart</h1>

      {loading ? (
        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          Loading your cart...
        </div>
      ) : lines.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="font-semibold">Your cart is empty.</p>
          <Link
            href="/shop"
            className="mt-3 inline-block rounded-lg bg-electric px-5 py-2 font-semibold text-black hover:brightness-90"
          >
            Shop jerseys
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <ul className="space-y-4">
            {lines.map((line) => (
              <li
                key={line.key}
                className="flex gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:gap-4"
              >
                <Link
                  href={`/jerseys/${line.productSlug}`}
                  className="h-24 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100 sm:h-28 sm:w-24"
                >
                  {line.imageUrl && (
                    <img src={line.imageUrl} alt="" className="h-full w-full object-cover" />
                  )}
                </Link>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/jerseys/${line.productSlug}`}
                    className="font-semibold leading-snug hover:text-black hover:underline"
                  >
                    {line.productName}
                  </Link>
                  <p className="mt-1 text-sm text-slate-500">Size {line.size}</p>
                  {(line.printName || line.printNumber) && (
                    <p className="text-sm text-slate-500">
                      Print: {[line.printName, line.printNumber].filter(Boolean).join(' ')} (+ KES{' '}
                      {printFee.toLocaleString('en-KE')})
                    </p>
                  )}
                  {line.sleeveBadge && <p className="text-sm text-slate-500">Sleeve badge</p>}
                  {!line.enoughStock && (
                    <p className="mt-1 text-sm font-semibold text-rose-600">
                      Only {line.available} left in this size: lower the quantity.
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        setQuantity(line.key, draftQty[line.key] ?? line.quantity);
                      }}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={draftQty[line.key] ?? line.quantity}
                        onChange={(e) =>
                          setDraftQty({
                            ...draftQty,
                            [line.key]: Number(e.target.value) || 1,
                          })
                        }
                        className="w-16 rounded-lg border border-slate-300 px-2 py-1.5 text-base sm:text-sm"
                        aria-label="Quantity"
                      />
                      <button
                        type="submit"
                        className="text-sm font-semibold text-black underline decoration-electric decoration-4 underline-offset-4"
                      >
                        Update
                      </button>
                    </form>
                    <button
                      type="button"
                      onClick={() => removeItem(line.key)}
                      className="text-sm text-rose-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <p className="shrink-0 font-bold">
                  KES {line.lineTotal.toLocaleString('en-KE')}
                </p>
              </li>
            ))}
          </ul>

          <aside className="h-fit rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="font-bold">Summary</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd className="font-semibold">KES {subtotal.toLocaleString('en-KE')}</dd>
              </div>
              <div className="flex justify-between text-slate-500">
                <dt>Delivery</dt>
                <dd>Chosen at checkout</dd>
              </div>
            </dl>
            {anyShortage ? (
              <p className="mt-4 text-sm text-rose-600">
                Fix the items marked above to continue.
              </p>
            ) : (
              <Link
                href="/checkout"
                className="mt-5 block rounded-xl bg-electric px-4 py-3 text-center font-bold text-black hover:brightness-90"
              >
                Checkout
              </Link>
            )}
            <Link
              href="/shop"
              className="mt-3 block text-center text-sm text-slate-600 hover:underline"
            >
              Keep shopping
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}
