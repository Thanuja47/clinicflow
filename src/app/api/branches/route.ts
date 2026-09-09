import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';

export async function GET() {
  const session = getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const branches = await prisma.branch.findMany({
    where: { clinicId: session.clinicId },
    include: {
      _count: {
        select: { users: true, appointments: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(branches);
}

export async function POST(request: Request) {
  const session = getSessionUser();
  if (!session || (session.role !== 'CLINIC_ADMIN' && session.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, address, phone } = body;

    if (!name) {
      return NextResponse.json({ error: 'Branch name is required' }, { status: 400 });
    }

    const branch = await prisma.branch.create({
      data: {
        clinicId: session.clinicId,
        name,
        address,
        phone,
      },
    });

    return NextResponse.json(branch, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create branch' }, { status: 500 });
  }
}
