export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { Sidebar } from '@/components/layout/Sidebar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = getSessionUser();
  if (!session) {
    redirect('/login');
  }

  let clinicName = 'ClinicFlow';
  if (session?.clinicId) {
    try {
      const clinic = await prisma.clinic.findUnique({
        where: { id: session.clinicId },
        select: { name: true },
      });
      if (clinic?.name) clinicName = clinic.name;
    } catch (err) {
      console.error('Prisma query skipped in layout:', err);
    }
  }

  return (
    <div className="min-h-screen bg-apple-bg text-apple-text flex transition-colors duration-200">
      <Sidebar
        userRole={session.role}
        userName={session.name}
        clinicName={clinicName}
      />
      <main className="flex-1 overflow-y-auto min-w-0">{children}</main>
    </div>
  );
}
