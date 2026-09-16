export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';

export async function GET(request: Request) {
  const session = getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const skip = (page - 1) * limit;

  const where = {
    clinicId: session.clinicId,
    ...(q && {
      OR: [
        { fullName: { contains: q, mode: 'insensitive' as const } },
        { nic: { contains: q, mode: 'insensitive' as const } },
        { phone: { contains: q } },
      ],
    }),
  };

  const [patients, total] = await Promise.all([
    prisma.patient.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.patient.count({ where }),
  ]);

  return NextResponse.json({ patients, total, page, limit });
}

export async function POST(request: Request) {
  const session = getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { fullName, nic, phone, dob, gender, address, allergies } = body;

    if (!fullName || !phone) {
      return NextResponse.json({ error: 'Full name and phone number are required' }, { status: 400 });
    }

    const patient = await prisma.patient.create({
      data: {
        clinicId: session.clinicId,
        fullName,
        nic: nic || null,
        phone,
        dob: dob ? new Date(dob) : null,
        gender: gender || null,
        address: address || null,
        allergies: allergies || null,
      },
    });

    return NextResponse.json(patient, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to register patient' }, { status: 500 });
  }
}
