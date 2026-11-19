'use client';

import { useState } from 'react';

export function ProductGallery({
  productName,
  images,
}: {
  productName: string;
  images: Array<{ id: number; url: string; alt: string | null }>;
}) {
  const [active, setActive] = useState(images[0] ?? null);

  return (
    <div>
      <div className="aspect-[4/5] overflow-hidden rounded-2xl bg-slate-100">
        {active ? (
          <img
            src={active.url}
            alt={active.alt || productName}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-300">
            <svg viewBox="0 0 64 64" className="h-40 w-40" fill="currentColor" aria-hidden="true">
              <path d="M22 6 6 14l6 14 8-3v33h24V25l8 3 6-14-16-8c-1 5-5 8-10 8s-9-3-10-8Z" />
            </svg>
          </div>
        )}
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {images.map((img) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActive(img)}
              className={`h-20 w-16 shrink-0 overflow-hidden rounded-lg border ${
                active?.id === img.id ? 'border-black ring-2 ring-black' : 'border-slate-200'
              }`}
            >
              <img
                src={img.url}
                alt={img.alt || productName}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
