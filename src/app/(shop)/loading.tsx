export default function ShopLoading() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse px-4 py-8">
      <div className="h-7 w-48 rounded-lg bg-slate-200" />
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="aspect-[4/5] bg-slate-100" />
            <div className="space-y-2 p-3.5">
              <div className="h-4 w-3/4 rounded bg-slate-200" />
              <div className="h-3 w-1/2 rounded bg-slate-100" />
              <div className="h-4 w-1/3 rounded bg-slate-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
