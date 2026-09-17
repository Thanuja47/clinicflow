export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';


export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'month'; // 'today' | 'week' | 'month' | 'all'

    let startDate = new Date();
    if (period === 'today') {
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate.setDate(startDate.getDate() - 30);
    } else {
      startDate = new Date('2020-01-01');
    }

    // Parallel aggregations
    const [patientCount, appointments, invoices, visits] = await Promise.all([
      prisma.patient.count({
        where: { clinicId: user.clinicId, createdAt: { gte: startDate } },
      }),
      prisma.appointment.findMany({
        where: { clinicId: user.clinicId, scheduledAt: { gte: startDate } },
        include: { doctor: { select: { name: true } } },
      }),
      prisma.invoice.findMany({
        where: { clinicId: user.clinicId, createdAt: { gte: startDate } },
      }),
      prisma.visit.findMany({
        where: { clinicId: user.clinicId, visitDate: { gte: startDate } },
        include: { doctor: { select: { name: true } } },
      }),
    ]);

    const totalRevenue = invoices
      .filter((i) => i.status === 'PAID')
      .reduce((sum, i) => sum + i.totalAmount, 0);

    const pendingRevenue = invoices
      .filter((i) => i.status === 'UNPAID')
      .reduce((sum, i) => sum + i.totalAmount, 0);

    const completedAppointments = appointments.filter((a) => a.status === 'COMPLETED').length;
    const cancelledAppointments = appointments.filter((a) => a.status === 'CANCELLED' || a.status === 'NO_SHOW').length;

    // Doctor performance grouping
    const doctorStats: Record<string, { visits: number; revenue: number }> = {};
    visits.forEach((v) => {
      const dName = v.doctor?.name || 'Unknown Doctor';
      if (!doctorStats[dName]) doctorStats[dName] = { visits: 0, revenue: 0 };
      doctorStats[dName].visits += 1;
    });

    const doctorPerformance = Object.keys(doctorStats).map((name) => ({
      name: `Dr. ${name}`,
      visits: doctorStats[name].visits,
    }));

    return NextResponse.json({
      summary: {
        totalPatients: patientCount,
        totalAppointments: appointments.length,
        completedAppointments,
        cancelledAppointments,
        totalRevenue,
        pendingRevenue,
      },
      doctorPerformance,
    });
  } catch (error) {
    console.error('GET /api/reports error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
