import Link from 'next/link';

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  perPage,
  basePath,
  searchParams,
  itemLabel = 'items',
}: {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  perPage: number;
  basePath: string;
  searchParams?: Record<string, string | undefined>;
  itemLabel?: string;
}) {
  if (totalItems === 0) return null;

  const start = (currentPage - 1) * perPage + 1;
  const end = Math.min(totalItems, currentPage * perPage);

  function pageHref(page: number) {
    const params = new URLSearchParams();
    if (searchParams) {
      for (const [k, v] of Object.entries(searchParams)) {
        if (v !== undefined && v !== '' && k !== 'page') {
          params.set(k, v);
        }
      }
    }
    if (page > 1) {
      params.set('page', String(page));
    }
    const qs = params.toString();
    return `${basePath}${qs ? `?${qs}` : ''}`;
  }

  const pages: number[] = [];
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2) {
      pages.push(p);
    }
  }

  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
      <p className="text-slate-600">
        Showing <span className="font-semibold text-black">{start}</span> to{' '}
        <span className="font-semibold text-black">{end}</span> of{' '}
        <span className="font-semibold text-black">{totalItems}</span> {itemLabel}
      </p>

      {totalPages > 1 && (
        <nav className="flex items-center gap-1" aria-label="Pagination">
          {currentPage > 1 ? (
            <Link
              href={pageHref(currentPage - 1)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium hover:border-black hover:bg-slate-50"
            >
              Previous
            </Link>
          ) : (
            <span className="cursor-not-allowed rounded-lg border border-slate-200 px-3 py-1.5 text-slate-400">
              Previous
            </span>
          )}

          {pages.map((p, idx) => {
            const prev = pages[idx - 1];
            const showEllipsis = prev !== undefined && p - prev > 1;
            return (
              <span key={p} className="flex items-center gap-1">
                {showEllipsis && <span className="px-1 text-slate-400">...</span>}
                <Link
                  href={pageHref(p)}
                  className={`min-w-[2.25rem] rounded-lg border px-2.5 py-1.5 text-center font-semibold ${
                    p === currentPage
                      ? 'border-black bg-electric text-black'
                      : 'border-slate-300 bg-white text-slate-700 hover:border-black hover:bg-slate-50'
                  }`}
                >
                  {p}
                </Link>
              </span>
            );
          })}

          {currentPage < totalPages ? (
            <Link
              href={pageHref(currentPage + 1)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium hover:border-black hover:bg-slate-50"
            >
              Next
            </Link>
          ) : (
            <span className="cursor-not-allowed rounded-lg border border-slate-200 px-3 py-1.5 text-slate-400">
              Next
            </span>
          )}
        </nav>
      )}
    </div>
  );
}
