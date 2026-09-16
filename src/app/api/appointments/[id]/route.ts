export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const appointment = await prisma.appointment.findFirst({
      where: {
        id: params.id,
        clinicId: user.clinicId,
      },
      include: {
        patient: true,
        doctor: { select: { id: true, name: true, email: true } },
        branch: { select: { id: true, name: true } },
        visit: true,
      },
    });

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    return NextResponse.json(appointment);
  } catch (error) {
    console.error('GET /api/appointments/[id] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { status, notes, doctorId, scheduledAt } = body;

    const existing = await prisma.appointment.findFirst({
      where: {
        id: params.id,
        clinicId: user.clinicId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    const updateData: Prisma.AppointmentUpdateInput = {};
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (doctorId) updateData.doctor = { connect: { id: doctorId } };
    if (scheduledAt) updateData.scheduledAt = new Date(scheduledAt);

    const updated = await prisma.appointment.update({
      where: { id: params.id },
      data: updateData,
      include: {
        patient: true,
        doctor: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('PUT /api/appointments/[id] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
