'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export interface CategoryFormInitial {
  id?: number;
  name: string;
  slug: string;
  parentId: number | null;
  sortOrder: number;
  isActive: boolean;
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function AdminCategoryForm({
  parents,
  initial,
}: {
  parents: Array<{ id: number; fullName: string; slug: string }>;
  initial: CategoryFormInitial;
}) {
  const router = useRouter();
  const [form, setForm] = useState<CategoryFormInitial>(initial);
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.slug));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function updateName(name: string) {
    const parent = parents.find((p) => p.id === form.parentId);
    const autoSlug = slugify((parent ? `${parent.slug}-` : '') + name);
    setForm({
      ...form,
      name,
      slug: slugTouched ? form.slug : autoSlug,
    });
  }

  function updateParent(parentId: number | null) {
    const parent = parents.find((p) => p.id === parentId);
    const autoSlug = form.name
      ? slugify((parent ? `${parent.slug}-` : '') + form.name)
      : '';
    setForm({
      ...form,
      parentId,
      slug: slugTouched ? form.slug : autoSlug,
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const url = initial.id
      ? `/api/admin/categories/${initial.id}`
      : '/api/admin/categories';
    const method = initial.id ? 'PATCH' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setBusy(false);

    if (!res.ok) {
      setError(data.error || 'Could not save category.');
      return;
    }

    router.push('/admin/categories');
    router.refresh();
  }

  async function handleDelete() {
    if (!initial.id || !confirm('Delete this category?')) return;
    setBusy(true);
    await fetch(`/api/admin/categories/${initial.id}`, { method: 'DELETE' });
    router.push('/admin/categories');
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
              onChange={(e) => updateName(e.target.value)}
              placeholder="e.g. English Premier League"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal"
            />
          </label>

          <label className="block text-sm font-semibold">
            Slug
            <input
              type="text"
              required
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                setForm({ ...form, slug: e.target.value });
              }}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm font-normal"
            />
            <span className="mt-1 block text-xs font-normal text-slate-500">
              The web address of the category.
            </span>
          </label>

          <label className="block text-sm font-semibold sm:col-span-2">
            Inside (Parent Category)
            <select
              value={form.parentId ?? ''}
              onChange={(e) =>
                updateParent(e.target.value ? Number(e.target.value) : null)
              }
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal"
            >
              <option value="">None (Root sport: Football, Rugby...)</option>
              {parents
                .filter((p) => p.id !== initial.id)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName}
                  </option>
                ))}
            </select>
            <span className="mt-1 block text-xs font-normal text-slate-500">
              Leave empty for a sport (Football, Rugby ...). Choose one to make a competition or
              collection.
            </span>
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

          <div className="flex items-center pt-6">
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="h-4 w-4 accent-black"
              />
              Show in the shop
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
            {busy ? 'Saving...' : 'Save category'}
          </button>
          <Link
            href="/admin/categories"
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
            Delete category
          </button>
        )}
      </div>
    </form>
  );
}
