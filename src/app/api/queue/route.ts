import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const doctorId = searchParams.get('doctorId');
    const branchId = searchParams.get('branchId');

    const startDate = new Date(dateStr);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(dateStr);
    endDate.setHours(23, 59, 59, 999);

    const where: Prisma.AppointmentWhereInput = {
      clinicId: user.clinicId,
      scheduledAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (doctorId) {
      where.doctorId = doctorId;
    } else if (user.role === 'DOCTOR') {
      where.doctorId = user.userId;
    }

    if (branchId) {
      where.branchId = branchId;
    }

    const queue = await prisma.appointment.findMany({
      where,
      include: {
        patient: {
          select: { id: true, fullName: true, phone: true, nic: true, dob: true, gender: true, allergies: true },
        },
        doctor: {
          select: { id: true, name: true },
        },
        branch: {
          select: { id: true, name: true },
        },
      },
      orderBy: { queueNumber: 'asc' },
    });

    const counts = {
      total: queue.length,
      booked: queue.filter((q) => q.status === 'BOOKED' || q.status === 'CONFIRMED').length,
      waiting: queue.filter((q) => q.status === 'CHECKED_IN').length,
      inProgress: queue.filter((q) => q.status === 'IN_PROGRESS').length,
      completed: queue.filter((q) => q.status === 'COMPLETED').length,
      cancelled: queue.filter((q) => q.status === 'CANCELLED' || q.status === 'NO_SHOW').length,
    };

    return NextResponse.json({ queue, counts });
  } catch (error) {
    console.error('GET /api/queue error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
