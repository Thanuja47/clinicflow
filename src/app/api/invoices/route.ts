export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { Prisma, $Enums } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get('patientId');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const where: Prisma.InvoiceWhereInput = {
      clinicId: user.clinicId,
    };

    if (patientId) where.patientId = patientId;
    if (status) where.status = status as $Enums.InvoiceStatus;

    if (search) {
      where.patient = {
        OR: [
          { fullName: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        patient: { select: { id: true, fullName: true, phone: true, nic: true } },
        appointment: {
          select: {
            id: true,
            scheduledAt: true,
            queueNumber: true,
            doctor: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(invoices);
  } catch (error) {
    console.error('GET /api/invoices error:', error);
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
    const {
      patientId,
      appointmentId,
      consultationFee = 0,
      labCharges = 0,
      otherCharges = 0,
      status = 'UNPAID',
      // Walk-in fields (required when appointmentId is not provided)
      doctorId,
      branchId,
    } = body;

    if (!patientId) {
      return NextResponse.json({ error: 'Patient ID is required' }, { status: 400 });
    }

    const cFee = parseFloat(consultationFee) || 0;
    const lFee = parseFloat(labCharges) || 0;
    const oFee = parseFloat(otherCharges) || 0;
    const totalAmount = cFee + lFee + oFee;

    let resolvedAppointmentId: string | null = appointmentId || null;

    // Walk-in billing: if no existing appointment is linked, auto-create one
    // so the visit shows up in queue/reports/dashboard stats.
    if (!resolvedAppointmentId) {
      if (!doctorId || !branchId) {
        return NextResponse.json(
          { error: 'Walk-in billing requires a doctor and branch to be selected.' },
          { status: 400 }
        );
      }

      // Auto-assign queue number: count today's appointments for this clinic + 1
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayCount = await prisma.appointment.count({
        where: { clinicId: user.clinicId, scheduledAt: { gte: todayStart } },
      });

      const walkInAppt = await prisma.appointment.create({
        data: {
          clinicId: user.clinicId,
          branchId,
          patientId,
          doctorId,
          scheduledAt: new Date(),
          status: 'CHECKED_IN',
          queueNumber: todayCount + 1,
          notes: 'Walk-in billing — auto-created',
        },
      });
      resolvedAppointmentId = walkInAppt.id;
    }

    const invoice = await prisma.invoice.create({
      data: {
        clinicId: user.clinicId,
        patientId,
        appointmentId: resolvedAppointmentId,
        consultationFee: cFee,
        labCharges: lFee,
        otherCharges: oFee,
        totalAmount,
        status: status as $Enums.InvoiceStatus,
      },
      include: {
        patient: true,
        appointment: { select: { doctor: { select: { name: true } } } },
      },
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error('POST /api/invoices error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
