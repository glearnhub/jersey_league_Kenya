'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ALL_SIZES,
  PRODUCT_BADGES,
  PRODUCT_KITS,
  PRODUCT_VERSIONS,
} from '@/lib/constants';

export interface ProductFormInitial {
  id?: number;
  name: string;
  categoryId: number | null;
  team: string;
  season: string;
  kit: string;
  version: string;
  description: string;
  careNotes: string;
  price: number;
  compareAtPrice: number | null;
  badge: string;
  isActive: boolean;
  isFeatured: boolean;
  allowsPrinting: boolean;
  allowsSleeveBadge: boolean;
  images: Array<{ path: string; alt: string }>;
  variants: Array<{ size: string; stock: number; reserved?: number }>;
}

export function AdminProductForm({
  categories,
  initial,
}: {
  categories: Array<{ id: number; fullName: string }>;
  initial: ProductFormInitial;
}) {
  const router = useRouter();
  const [form, setForm] = useState<ProductFormInitial>(initial);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const url = initial.id ? `/api/admin/products/${initial.id}` : '/api/admin/products';
    const method = initial.id ? 'PATCH' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || 'Could not save product');
      return;
    }
    router.push('/admin/products');
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
        <h2 className="text-lg font-bold">Jersey</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-semibold sm:col-span-2">
            Name
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Arsenal Home 26/27 Fan Jersey"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal"
            />
          </label>

          <label className="block text-sm font-semibold">
            Category
            <select
              value={form.categoryId || ''}
              onChange={(e) =>
                setForm({
                  ...form,
                  categoryId: e.target.value ? Number(e.target.value) : null,
                })
              }
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal"
            >
              <option value="">No category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-semibold">
            Team
            <input
              type="text"
              value={form.team}
              onChange={(e) => setForm({ ...form, team: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal"
            />
          </label>

          <label className="block text-sm font-semibold">
            Season
            <input
              type="text"
              value={form.season}
              onChange={(e) => setForm({ ...form, season: e.target.value })}
              placeholder="26/27"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal"
            />
          </label>

          <label className="block text-sm font-semibold">
            Kit
            <select
              value={form.kit}
              onChange={(e) => setForm({ ...form, kit: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal"
            >
              <option value="">-</option>
              {Object.entries(PRODUCT_KITS).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-semibold">
            Version
            <select
              value={form.version}
              onChange={(e) => setForm({ ...form, version: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal"
            >
              <option value="">-</option>
              {Object.entries(PRODUCT_VERSIONS).map(([v, label]) => (
                <option key={v} value={v}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-semibold sm:col-span-2">
            Description
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal"
            />
          </label>

          <label className="block text-sm font-semibold sm:col-span-2">
            Care notes
            <textarea
              rows={3}
              value={form.careNotes}
              onChange={(e) => setForm({ ...form, careNotes: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal"
            />
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-bold">Price</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <label className="block text-sm font-semibold">
            Price (KES)
            <input
              type="number"
              min={0}
              required
              value={form.price}
              onChange={(e) => setForm({ ...form, price: Number(e.target.value) || 0 })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal"
            />
          </label>

          <label className="block text-sm font-semibold">
            Old price (KES, optional)
            <input
              type="number"
              min={0}
              value={form.compareAtPrice ?? ''}
              onChange={(e) =>
                setForm({
                  ...form,
                  compareAtPrice: e.target.value ? Number(e.target.value) : null,
                })
              }
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal"
            />
          </label>

          <label className="block text-sm font-semibold">
            Badge
            <select
              value={form.badge}
              onChange={(e) => setForm({ ...form, badge: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal"
            >
              <option value="">No badge</option>
              {Object.entries(PRODUCT_BADGES).map(([b, label]) => (
                <option key={b} value={b}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Photos</h2>
          <button
            type="button"
            onClick={() =>
              setForm({
                ...form,
                images: [...form.images, { path: '', alt: '' }],
              })
            }
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold hover:bg-slate-100"
          >
            Add a photo
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {form.images.map((img, idx) => (
            <div key={idx} className="grid gap-2 sm:grid-cols-5">
              <input
                type="text"
                placeholder="Image URL or /storage/products/..."
                value={img.path}
                onChange={(e) => {
                  const next = [...form.images];
                  next[idx] = { ...next[idx], path: e.target.value };
                  setForm({ ...form, images: next });
                }}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-3"
              />
              <input
                type="text"
                placeholder="Describe the photo"
                value={img.alt}
                onChange={(e) => {
                  const next = [...form.images];
                  next[idx] = { ...next[idx], alt: e.target.value };
                  setForm({ ...form, images: next });
                }}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() =>
                  setForm({
                    ...form,
                    images: form.images.filter((_, i) => i !== idx),
                  })
                }
                className="text-sm font-semibold text-rose-600 hover:underline"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Sizes and stock</h2>
          <button
            type="button"
            onClick={() =>
              setForm({
                ...form,
                variants: [...form.variants, { size: 'M', stock: 5, reserved: 0 }],
              })
            }
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold hover:bg-slate-100"
          >
            Add a size
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {form.variants.map((v, idx) => (
            <div key={idx} className="grid items-center gap-3 sm:grid-cols-4">
              <select
                value={v.size}
                onChange={(e) => {
                  const next = [...form.variants];
                  next[idx] = { ...next[idx], size: e.target.value };
                  setForm({ ...form, variants: next });
                }}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                {ALL_SIZES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={0}
                value={v.stock}
                onChange={(e) => {
                  const next = [...form.variants];
                  next[idx] = { ...next[idx], stock: Number(e.target.value) || 0 };
                  setForm({ ...form, variants: next });
                }}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="Stock"
              />
              <span className="text-xs text-slate-500">Reserved: {v.reserved ?? 0}</span>
              <button
                type="button"
                onClick={() =>
                  setForm({
                    ...form,
                    variants: form.variants.filter((_, i) => i !== idx),
                  })
                }
                className="text-left text-sm font-semibold text-rose-600 hover:underline"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-bold">Options</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            Show in the shop
          </label>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={form.isFeatured}
              onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
            />
            Feature on the home page
          </label>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={form.allowsPrinting}
              onChange={(e) => setForm({ ...form, allowsPrinting: e.target.checked })}
            />
            Customers can add a name and number
          </label>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={form.allowsSleeveBadge}
              onChange={(e) => setForm({ ...form, allowsSleeveBadge: e.target.checked })}
            />
            Customers can add a sleeve badge
          </label>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          type="submit"
          disabled={busy}
          className="rounded-xl bg-electric px-6 py-3 font-bold text-black hover:brightness-90 disabled:opacity-60"
        >
          {busy ? 'Saving...' : 'Save product'}
        </button>

        {initial.id && (
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              if (!confirm('Delete this product?')) return;
              setBusy(true);
              await fetch(`/api/admin/products/${initial.id}`, { method: 'DELETE' });
              router.push('/admin/products');
              router.refresh();
            }}
            className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 hover:bg-rose-100"
          >
            Delete product
          </button>
        )}
      </div>
    </form>
  );
}
