import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { Sidebar } from '@/components/layout/Sidebar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = getSessionUser();
  if (!session) redirect('/login');

  const clinic = await prisma.clinic.findUnique({
    where: { id: session.clinicId },
    select: { name: true },
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      <Sidebar
        userRole={session.role}
        userName={session.name}
        clinicName={clinic?.name || 'ClinicFlow'}
      />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
