'use client';

import { useRouter } from 'next/navigation';

export function AdminLogoutButton() {
  const router = useRouter();
  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  }
  return (
    <button
      type="button"
      onClick={logout}
      className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium hover:bg-slate-100"
    >
      Sign out
    </button>
  );
}
