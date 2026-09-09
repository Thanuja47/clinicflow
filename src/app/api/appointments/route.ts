import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { AppointmentSchema } from '@/lib/validators';
import { Prisma } from '@prisma/client';
import { sendSMS } from '@/lib/smsgo';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get('date');
    const doctorId = searchParams.get('doctorId');
    const branchId = searchParams.get('branchId');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const where: Prisma.AppointmentWhereInput = {
      clinicId: user.clinicId,
    };

    if (doctorId) {
      where.doctorId = doctorId;
    }

    if (branchId) {
      where.branchId = branchId;
    }

    if (status) {
      where.status = status as Prisma.EnumAppointmentStatusFilter;
    }

    if (dateStr) {
      const startDate = new Date(dateStr);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(dateStr);
      endDate.setHours(23, 59, 59, 999);
      where.scheduledAt = {
        gte: startDate,
        lte: endDate,
      };
    }

    if (search) {
      where.patient = {
        OR: [
          { fullName: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
          { nic: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        patient: {
          select: { id: true, fullName: true, phone: true, nic: true },
        },
        doctor: {
          select: { id: true, name: true, email: true },
        },
        branch: {
          select: { id: true, name: true },
        },
      },
      orderBy: [
        { scheduledAt: 'asc' },
        { queueNumber: 'asc' },
      ],
    });

    return NextResponse.json(appointments);
  } catch (error) {
    console.error('GET /api/appointments error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validated = AppointmentSchema.parse(body);

    const scheduledDate = new Date(validated.scheduledAt);
    const startDate = new Date(scheduledDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(scheduledDate);
    endDate.setHours(23, 59, 59, 999);

    // Calculate queue number for the doctor on that day
    const countForDay = await prisma.appointment.count({
      where: {
        clinicId: user.clinicId,
        doctorId: validated.doctorId,
        scheduledAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const queueNumber = countForDay + 1;

    const appointment = await prisma.appointment.create({
      data: {
        clinicId: user.clinicId,
        branchId: validated.branchId,
        patientId: validated.patientId,
        doctorId: validated.doctorId,
        scheduledAt: scheduledDate,
        queueNumber,
        notes: validated.notes || null,
        status: 'BOOKED',
      },
      include: {
        patient: true,
        doctor: true,
        branch: true,
      },
    });

    // Trigger automated SMS booking confirmation
    sendSMS({
      to: appointment.patient.phone,
      message: `Dear ${appointment.patient.fullName}, your appointment with Dr. ${appointment.doctor.name} at LankaCare Clinic is confirmed for ${new Date(appointment.scheduledAt).toLocaleDateString()} at ${new Date(appointment.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Your Queue Number is #${appointment.queueNumber}.`,
      clinicId: user.clinicId,
      patientId: appointment.patient.id,
      type: 'CONFIRMATION',
    }).catch((err) => console.error('Automated SMS Trigger Error:', err));

    return NextResponse.json(appointment, { status: 201 });
  } catch (error) {
    console.error('POST /api/appointments error:', error);
    if (error instanceof Error && 'issues' in error) {
      return NextResponse.json({ error: 'Validation Error', details: error }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
