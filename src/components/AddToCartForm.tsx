'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cart';
import { cleanPrintName, cleanPrintNumber } from '@/lib/constants';

export function AddToCartForm({
  product,
  sizes,
  printFee,
  badgeFee,
  maxQuantity,
}: {
  product: {
    id: number;
    name: string;
    price: number;
    allowsPrinting: boolean;
    allowsSleeveBadge: boolean;
  };
  sizes: Array<{ id: number; size: string; available: number }>;
  printFee: number;
  badgeFee: number;
  maxQuantity: number;
}) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const cartItems = useCartStore((s) => s.items);

  const [size, setSize] = useState<string>('');
  const [wantsPrint, setWantsPrint] = useState(false);
  const [printName, setPrintName] = useState('');
  const [printNumber, setPrintNumber] = useState('');
  const [sleeveBadge, setSleeveBadge] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const inStock = sizes.some((s) => s.available > 0);
  const total =
    (product.price + (wantsPrint ? printFee : 0) + (sleeveBadge ? badgeFee : 0)) * quantity;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!size) {
      setError('Choose a size.');
      return;
    }

    const variant = sizes.find((v) => v.size === size);
    if (!variant || variant.available < 1) {
      setError(`Size ${size} is sold out.`);
      return;
    }

    const cleanedName =
      product.allowsPrinting && wantsPrint ? cleanPrintName(printName) : null;
    const cleanedNumber =
      product.allowsPrinting && wantsPrint ? cleanPrintNumber(printNumber) : null;

    if (wantsPrint && !cleanedName && !cleanedNumber) {
      setError('Type the name or the number to print, or untick "Add name and number".');
      return;
    }

    const inCartForSize = cartItems
      .filter((i) => i.productId === product.id && i.size === size)
      .reduce((sum, i) => sum + i.quantity, 0);

    const limit = Math.min(maxQuantity, variant.available - inCartForSize);
    if (quantity > limit) {
      setError(
        limit < 1
          ? `You already have all the size ${size} we have in your cart.`
          : `Only ${limit} of size ${size} can be added.`
      );
      return;
    }

    addItem({
      productId: product.id,
      size,
      quantity,
      printName: cleanedName,
      printNumber: cleanedNumber,
      sleeveBadge: Boolean(product.allowsSleeveBadge && sleeveBadge),
    });

    router.push('/cart');
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-6">
      {error && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Size</legend>
        <div className="flex flex-wrap gap-2">
          {sizes.map((variant) => (
            <label key={variant.id} className="relative">
              <input
                type="radio"
                name="size"
                value={variant.size}
                checked={size === variant.size}
                onChange={() => setSize(variant.size)}
                disabled={variant.available < 1}
                className="peer sr-only"
              />
              <span className="block min-w-[3rem] cursor-pointer rounded-lg border border-slate-300 px-3 py-2 text-center text-sm font-medium peer-checked:border-black peer-checked:bg-electric peer-checked:text-black peer-checked:ring-2 peer-checked:ring-black peer-disabled:cursor-not-allowed peer-disabled:bg-slate-100 peer-disabled:text-slate-400 peer-disabled:line-through">
                {variant.size}
              </span>
            </label>
          ))}
        </div>
        {(sizes.length === 0 || !inStock) && (
          <p className="mt-2 text-sm font-semibold text-rose-600">Sold out</p>
        )}
      </fieldset>

      {(product.allowsPrinting || product.allowsSleeveBadge) && (
        <fieldset className="rounded-xl border border-slate-200 bg-white p-4">
          <legend className="px-1 text-sm font-semibold">Customise your jersey</legend>
          {product.allowsPrinting && (
            <>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={wantsPrint}
                  onChange={(e) => setWantsPrint(e.target.checked)}
                  className="h-4 w-4 accent-black"
                />
                <span>
                  Add name and number{' '}
                  <span className="block font-normal text-slate-500 sm:inline">
                    (+ KES {printFee.toLocaleString('en-KE')} per jersey)
                  </span>
                </span>
              </label>
              {wantsPrint && (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <input
                    value={printName}
                    onChange={(e) => setPrintName(e.target.value)}
                    maxLength={14}
                    placeholder="NAME"
                    className="col-span-2 rounded-lg border border-slate-300 px-3 py-2.5 text-base uppercase sm:text-sm"
                  />
                  <input
                    value={printNumber}
                    onChange={(e) => setPrintNumber(e.target.value)}
                    maxLength={2}
                    inputMode="numeric"
                    placeholder="No."
                    className="rounded-lg border border-slate-300 px-3 py-2.5 text-base sm:text-sm"
                  />
                </div>
              )}
            </>
          )}
          {product.allowsSleeveBadge && (
            <label className="mt-3 flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={sleeveBadge}
                onChange={(e) => setSleeveBadge(e.target.checked)}
                className="h-4 w-4 accent-black"
              />
              Add sleeve badge{' '}
              {badgeFee > 0 && (
                <span className="text-slate-500">
                  (+ KES {badgeFee.toLocaleString('en-KE')})
                </span>
              )}
            </label>
          )}
        </fieldset>
      )}

      <div className="flex items-center gap-4">
        <label className="text-sm font-semibold" htmlFor="quantity">
          Quantity
        </label>
        <input
          id="quantity"
          type="number"
          min={1}
          max={maxQuantity}
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, Math.min(maxQuantity, Number(e.target.value) || 1)))}
          className="w-20 rounded-lg border border-slate-300 px-3 py-2.5 text-base sm:text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={!inStock}
        className="w-full rounded-xl bg-electric px-6 py-4 text-base font-bold text-black hover:brightness-90 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        Add to cart - KES {total.toLocaleString('en-KE')}
      </button>
    </form>
  );
}
