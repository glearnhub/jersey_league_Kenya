'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { ALL_SIZES, PRODUCT_VERSIONS } from '@/lib/constants';

export function ShopFilters({
  teams,
  versions,
  q,
}: {
  teams: string[];
  versions: string[];
  q: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('page');
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}${params.toString() ? `?${params.toString()}` : ''}`);
  }

  return (
    <div className="mt-6 grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-5">
      {q && <input type="hidden" name="q" value={q} />}
      <select
        value={searchParams.get('team') || ''}
        onChange={(e) => updateParam('team', e.target.value)}
        className="rounded-lg border border-slate-300 px-2 py-2.5 text-base sm:text-sm"
      >
        <option value="">All teams</option>
        {teams.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>

      <select
        value={searchParams.get('version') || ''}
        onChange={(e) => updateParam('version', e.target.value)}
        className="rounded-lg border border-slate-300 px-2 py-2.5 text-base sm:text-sm"
      >
        <option value="">Any version</option>
        {versions.map((v) => (
          <option key={v} value={v}>
            {PRODUCT_VERSIONS[v] || v}
          </option>
        ))}
      </select>

      <select
        value={searchParams.get('size') || ''}
        onChange={(e) => updateParam('size', e.target.value)}
        className="rounded-lg border border-slate-300 px-2 py-2.5 text-base sm:text-sm"
      >
        <option value="">Any size</option>
        {ALL_SIZES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <select
        value={searchParams.get('sort') || ''}
        onChange={(e) => updateParam('sort', e.target.value)}
        className="rounded-lg border border-slate-300 px-2 py-2.5 text-base sm:text-sm"
      >
        <option value="">Newest</option>
        <option value="price_asc">Price: low to high</option>
        <option value="price_desc">Price: high to low</option>
      </select>

      <label className="flex items-center gap-2 px-1 text-sm">
        <input
          type="checkbox"
          checked={searchParams.get('sale') === '1'}
          onChange={(e) => updateParam('sale', e.target.checked ? '1' : '')}
        />
        On sale only
      </label>
    </div>
  );
}
