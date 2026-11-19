import { redirect } from 'next/navigation';
import { getAdminUser } from '@/lib/auth';
import { AdminSidebar } from '@/components/AdminSidebar';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getAdminUser();
  if (!admin) {
    redirect('/admin/login');
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminSidebar admin={admin} />
      <div className="lg:pl-64">
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
