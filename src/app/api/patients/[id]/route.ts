import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';

interface RouteParams {
  params: { id: string };
}

export async function GET(_request: Request, { params }: RouteParams) {
  const session = getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const patient = await prisma.patient.findFirst({
    where: { id: params.id, clinicId: session.clinicId },
    include: {
      appointments: {
        orderBy: { scheduledAt: 'desc' },
        include: {
          doctor: { select: { id: true, name: true } },
          branch: { select: { id: true, name: true } },
          visit: {
            include: {
              prescriptions: true,
              labReports: true,
            },
          },
          invoices: true,
        },
      },
    },
  });

  if (!patient) {
    return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
  }

  return NextResponse.json(patient);
}

export async function PUT(request: Request, { params }: RouteParams) {
  const session = getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { fullName, nic, phone, dob, gender, address, allergies } = body;

    const updated = await prisma.patient.updateMany({
      where: { id: params.id, clinicId: session.clinicId },
      data: {
        fullName,
        nic: nic || null,
        phone,
        dob: dob ? new Date(dob) : null,
        gender: gender || null,
        address: address || null,
        allergies: allergies || null,
      },
    });

    if (updated.count === 0) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to update patient' }, { status: 500 });
  }
}
