'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function AdminReconcileButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function handleReconcile() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch('/api/cron/reconcile');
      const data = await res.json();
      if (data.ok) {
        setMsg(`Checked with Safaricom (${data.settled} settled, ${data.expired} expired)`);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {msg && <span className="text-xs font-semibold text-slate-600">{msg}</span>}
      <button
        type="button"
        disabled={busy}
        onClick={handleReconcile}
        className="rounded-xl bg-electric px-4 py-2 text-xs font-bold text-black transition hover:brightness-90 disabled:opacity-60"
      >
        {busy ? 'Checking Safaricom...' : 'Reconcile with M-Pesa'}
      </button>
    </div>
  );
}
