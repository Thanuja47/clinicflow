export const dynamic = 'force-dynamic';

import { getSessionUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { Topbar } from '@/components/layout/Topbar';
import { Building2, Users, UserCheck, Calendar } from 'lucide-react';

export default async function AdminOverviewPage() {
  const session = getSessionUser();
  if (!session) return null;

  let branchesCount = 0;
  let staffCount = 0;
  let patientsCount = 0;
  let todayAppointmentsCount = 0;
  let recentStaff: Array<{ id: string; name: string; email: string; role: string; createdAt: Date }> = [];

  try {
    const [bCount, sCount, pCount, aCount] = await Promise.all([
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
    branchesCount = bCount;
    staffCount = sCount;
    patientsCount = pCount;
    todayAppointmentsCount = aCount;

    recentStaff = await prisma.user.findMany({
      where: { clinicId: session.clinicId },
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
  } catch (err) {
    console.error('Prisma query skipped in admin overview page:', err);
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar title="Clinic Overview" userName={session.name} />

      <div className="p-6 space-y-6">
        {/* KPI Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="apple-card p-5 space-y-3">
            <div className="flex items-center justify-between text-apple-muted">
              <span className="apple-caption">Active branches</span>
              <div className="w-8 h-8 rounded-apple-sm bg-apple-blue/10 text-apple-blue flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-bold text-apple-text">{branchesCount}</p>
          </div>

          <div className="apple-card p-5 space-y-3">
            <div className="flex items-center justify-between text-apple-muted">
              <span className="apple-caption">Total staff</span>
              <div className="w-8 h-8 rounded-apple-sm bg-apple-green/10 text-apple-green flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-bold text-apple-text">{staffCount}</p>
          </div>

          <div className="apple-card p-5 space-y-3">
            <div className="flex items-center justify-between text-apple-muted">
              <span className="apple-caption">Registered patients</span>
              <div className="w-8 h-8 rounded-apple-sm bg-apple-purple/10 text-apple-purple flex items-center justify-center">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-bold text-apple-text">{patientsCount}</p>
          </div>

          <div className="apple-card p-5 space-y-3">
            <div className="flex items-center justify-between text-apple-muted">
              <span className="apple-caption">Today&apos;s appointments</span>
              <div className="w-8 h-8 rounded-apple-sm bg-apple-orange/10 text-apple-orange flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-bold text-apple-text">{todayAppointmentsCount}</p>
          </div>
        </div>

        {/* Recent Staff Table */}
        <div className="apple-card p-6 space-y-4">
          <h2 className="apple-section-header">Recently added staff members</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-apple-text">
              <thead>
                <tr className="border-b border-apple-border text-apple-muted text-xs font-semibold">
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-apple-border">
                {recentStaff.map((member) => (
                  <tr key={member.id} className="hover:bg-apple-secondary/50 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-apple-text">{member.name}</td>
                    <td className="py-3.5 px-4 text-apple-muted">{member.email}</td>
                    <td className="py-3.5 px-4">
                      <span className="apple-pill apple-pill-blue">
                        {member.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-apple-muted">{new Date(member.createdAt).toLocaleDateString()}</td>
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
