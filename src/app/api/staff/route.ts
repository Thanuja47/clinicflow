import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';
import { hashPassword } from '@/lib/auth';
import { Prisma } from '@prisma/client';

export async function GET(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const role = searchParams.get('role');

  const where: Prisma.UserWhereInput = { clinicId: session.clinicId };
  if (role) {
    where.role = role as Prisma.EnumRoleFilter;
  }

  const staff = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      createdAt: true,
      branch: { select: { id: true, name: true } },
    },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json(staff);
}

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session || (session.role !== 'CLINIC_ADMIN' && session.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, email, password, role, branchId, phone } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);

    const newStaff = await prisma.user.create({
      data: {
        clinicId: session.clinicId,
        branchId: branchId || null,
        name,
        email: email.toLowerCase().trim(),
        phone,
        passwordHash,
        role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        branchId: true,
      },
    });

    return NextResponse.json(newStaff, { status: 201 });
  } catch (error) {
    console.error('Error creating staff:', error);
    return NextResponse.json({ error: 'Failed to create staff account' }, { status: 500 });
  }
}
