'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Trash2, ArrowLeft, ArrowRight, ImagePlus } from 'lucide-react';
import {
  ADULT_SIZES,
  ALL_SIZES,
  imageUrlFor,
  KIDS_SIZES,
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

/**
 * Resizes large phone/camera photos client-side (max 1000x1250) and compresses to JPEG
 * so uploads stay fast and well below serverless payload limits.
 */
async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const maxW = 1000;
      const maxH = 1250;
      let { width, height } = img;

      if (width > maxW || height > maxH) {
        const ratio = Math.min(maxW / width, maxH / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          const baseName = file.name.replace(/\.[^.]+$/, '') || 'jersey';
          resolve(new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' }));
        },
        'image/jpeg',
        0.84
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };
    img.src = objectUrl;
  });
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
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);

  async function uploadSingleFile(file: File): Promise<string> {
    const prepared = await compressImage(file);
    const body = new FormData();
    body.append('file', prepared);

    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      body,
    });
    const data = await res.json();
    if (!res.ok || !data.path) {
      throw new Error(data.error || 'Failed to upload image.');
    }
    return data.path as string;
  }

  async function handleAddFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    setUploadError(null);
    try {
      const uploaded: Array<{ path: string; alt: string }> = [];
      for (const file of Array.from(fileList)) {
        const uploadedPath = await uploadSingleFile(file);
        uploaded.push({ path: uploadedPath, alt: '' });
      }
      setForm((prev) => ({ ...prev, images: [...prev.images, ...uploaded] }));
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  }

  async function handleReplaceFile(idx: number, fileList: FileList | null) {
    if (!fileList || !fileList[0]) return;
    setUploading(true);
    setUploadError(null);
    try {
      const uploadedPath = await uploadSingleFile(fileList[0]);
      setForm((prev) => {
        const next = [...prev.images];
        next[idx] = { ...next[idx], path: uploadedPath };
        return { ...prev, images: next };
      });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  }

  function moveImage(idx: number, dir: -1 | 1) {
    const target = idx + dir;
    if (target < 0 || target >= form.images.length) return;
    const next = [...form.images];
    [next[idx], next[target]] = [next[target], next[idx]];
    setForm({ ...form, images: next });
  }

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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">Photos</h2>
            <p className="text-xs text-slate-500">
              Choose image files from your device. The first photo is shown in the shop.
            </p>
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-electric px-4 py-2 text-xs font-bold text-black transition hover:brightness-90">
            <ImagePlus className="h-4 w-4" />
            <span>{uploading ? 'Uploading...' : 'Choose photo(s)'}</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              disabled={uploading}
              onChange={(e) => {
                handleAddFiles(e.target.files);
                e.target.value = '';
              }}
              className="sr-only"
            />
          </label>
        </div>

        {uploadError && (
          <p className="mt-3 rounded-lg bg-rose-50 p-2.5 text-xs font-semibold text-rose-700">
            {uploadError}
          </p>
        )}

        {form.images.length === 0 ? (
          <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center transition hover:border-black hover:bg-slate-100">
            <Upload className="h-8 w-8 text-slate-400" />
            <span className="mt-2 text-sm font-semibold text-slate-700">
              {uploading ? 'Uploading photo...' : 'Click to choose a jersey photo'}
            </span>
            <span className="mt-1 text-xs text-slate-500">
              JPEG, PNG, WebP or GIF (max 5 MB)
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              disabled={uploading}
              onChange={(e) => {
                handleAddFiles(e.target.files);
                e.target.value = '';
              }}
              className="sr-only"
            />
          </label>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {form.images.map((img, idx) => {
              const previewUrl = imageUrlFor(img.path);
              return (
                <div
                  key={idx}
                  className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
                >
                  <div className="relative aspect-[4/5] bg-slate-100">
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt={img.alt || form.name || 'Product photo'}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-slate-400">
                        No preview
                      </div>
                    )}
                    {idx === 0 && (
                      <span className="absolute left-2 top-2 rounded-full bg-electric px-2.5 py-0.5 text-[11px] font-bold text-black shadow-xs">
                        Main photo
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 p-3">
                    <input
                      type="text"
                      placeholder="Describe the photo (optional)"
                      value={img.alt}
                      onChange={(e) => {
                        const next = [...form.images];
                        next[idx] = { ...next[idx], alt: e.target.value };
                        setForm({ ...form, images: next });
                      }}
                      className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
                    />

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => moveImage(idx, -1)}
                          title="Move earlier"
                          className="rounded-lg border border-slate-300 bg-white p-1.5 text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                        >
                          <ArrowLeft className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === form.images.length - 1}
                          onClick={() => moveImage(idx, 1)}
                          title="Move later"
                          className="rounded-lg border border-slate-300 bg-white p-1.5 text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                        >
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="cursor-pointer rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100">
                          Replace
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            disabled={uploading}
                            onChange={(e) => {
                              handleReplaceFile(idx, e.target.files);
                              e.target.value = '';
                            }}
                            className="sr-only"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            setForm({
                              ...form,
                              images: form.images.filter((_, i) => i !== idx),
                            })
                          }
                          title="Remove photo"
                          className="rounded-lg border border-rose-200 bg-rose-50 p-1.5 text-rose-600 hover:bg-rose-100"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold">Sizes and stock</h2>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                setForm({
                  ...form,
                  variants: KIDS_SIZES.map((size) => {
                    const existing = form.variants.find((v) => v.size === size);
                    return existing ?? { size, stock: 5, reserved: 0 };
                  }),
                })
              }
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold hover:bg-slate-100"
            >
              Use kids sizes
            </button>
            <button
              type="button"
              onClick={() =>
                setForm({
                  ...form,
                  variants: ADULT_SIZES.slice(1).map((size) => {
                    const existing = form.variants.find((v) => v.size === size);
                    return existing ?? { size, stock: 5, reserved: 0 };
                  }),
                })
              }
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold hover:bg-slate-100"
            >
              Use adult sizes
            </button>
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
                {!ALL_SIZES.includes(v.size as (typeof ALL_SIZES)[number]) && (
                  <option value={v.size}>{v.size}</option>
                )}
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
          disabled={busy || uploading}
          className="rounded-xl bg-electric px-6 py-3 font-bold text-black hover:brightness-90 disabled:opacity-60"
        >
          {busy ? 'Saving...' : uploading ? 'Uploading photo...' : 'Save product'}
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
