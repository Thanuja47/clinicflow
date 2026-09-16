export const dynamic = 'force-dynamic';

import { getSessionUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { Topbar } from '@/components/layout/Topbar';

export default async function AdminOverviewPage() {
  const session = getSessionUser();
  if (!session) return null;

  const [branchesCount, staffCount, patientsCount, todayAppointmentsCount] = await Promise.all([
    prisma.branch.count({ where: { clinicId: session.clinicId } }),
    prisma.user.count({ where: { clinicId: session.clinicId } }),
    prisma.patient.count({ where: { clinicId: session.clinicId } }),
    prisma.appointment.count({
      where: {
        clinicId: session.clinicId,
        scheduledAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lt: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      },
    }),
  ]);

  const recentStaff = await prisma.user.findMany({
    where: { clinicId: session.clinicId },
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar title="Clinic Administration Overview" userName={session.name} />

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Branches</span>
            <p className="text-3xl font-bold text-sky-400 mt-2">{branchesCount}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Staff</span>
            <p className="text-3xl font-bold text-emerald-400 mt-2">{staffCount}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Registered Patients</span>
            <p className="text-3xl font-bold text-indigo-400 mt-2">{patientsCount}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Today&apos;s Appointments</span>
            <p className="text-3xl font-bold text-amber-400 mt-2">{todayAppointmentsCount}</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">Recently Added Staff Members</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/50 uppercase text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3">Name</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {recentStaff.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-800/30">
                    <td className="p-3 font-medium text-slate-100">{member.name}</td>
                    <td className="p-3 text-slate-400">{member.email}</td>
                    <td className="p-3">
                      <span className="bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded font-mono text-[10px]">
                        {member.role}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400">{new Date(member.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
