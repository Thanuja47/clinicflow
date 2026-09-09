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
    const patientId = searchParams.get('patientId');
    const doctorId = searchParams.get('doctorId');
    const appointmentId = searchParams.get('appointmentId');

    const where: Prisma.VisitWhereInput = {
      clinicId: user.clinicId,
    };

    if (patientId) where.patientId = patientId;
    if (doctorId) where.doctorId = doctorId;
    if (appointmentId) where.appointmentId = appointmentId;

    const visits = await prisma.visit.findMany({
      where,
      include: {
        patient: { select: { id: true, fullName: true, phone: true } },
        doctor: { select: { id: true, name: true } },
        prescriptions: true,
        appointment: { select: { id: true, scheduledAt: true, queueNumber: true } },
      },
      orderBy: { visitDate: 'desc' },
    });

    return NextResponse.json(visits);
  } catch (error) {
    console.error('GET /api/visits error:', error);
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
    const { appointmentId, patientId, doctorId, diagnosis, notes, medicines } = body;

    if (!appointmentId || !patientId) {
      return NextResponse.json(
        { error: 'Appointment ID and Patient ID are required' },
        { status: 400 }
      );
    }

    const docId = doctorId || user.userId;

    // Use interactive transaction to create visit, prescriptions, and update appointment
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create or upsert visit
      const visit = await tx.visit.upsert({
        where: { appointmentId },
        create: {
          clinicId: user.clinicId,
          appointmentId,
          patientId,
          doctorId: docId,
          diagnosis: diagnosis || '',
          notes: notes || '',
        },
        update: {
          diagnosis: diagnosis || '',
          notes: notes || '',
        },
      });

      // 2. Delete existing prescriptions for this visit if updating
      await tx.prescription.deleteMany({
        where: { visitId: visit.id },
      });

      // 3. Create new prescriptions if provided
      if (Array.isArray(medicines) && medicines.length > 0) {
        await tx.prescription.createMany({
          data: medicines.map((med: { medicineName: string; dosage: string; duration: string; instructions?: string }) => ({
            clinicId: user.clinicId,
            visitId: visit.id,
            medicineName: med.medicineName,
            dosage: med.dosage,
            duration: med.duration,
            instructions: med.instructions || '',
          })),
        });
      }

      // 4. Update appointment status to COMPLETED
      await tx.appointment.update({
        where: { id: appointmentId },
        data: { status: 'COMPLETED' },
      });

      return tx.visit.findUnique({
        where: { id: visit.id },
        include: {
          patient: true,
          doctor: { select: { id: true, name: true, email: true } },
          prescriptions: true,
          appointment: true,
        },
      });
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('POST /api/visits error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
