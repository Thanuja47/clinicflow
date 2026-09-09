import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';
import { hashPassword } from '@/lib/auth';

export async function GET() {
  const session = getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const clinic = await prisma.clinic.findUnique({
    where: { id: session.clinicId },
    include: {
      branches: true,
      users: {
        select: { id: true, name: true, email: true, role: true, branchId: true, isActive: true },
      },
    },
  });

  return NextResponse.json(clinic);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { clinicName, slug, address, phone, adminName, adminEmail, adminPassword } = body;

    const existingSlug = await prisma.clinic.findUnique({ where: { slug } });
    if (existingSlug) {
      return NextResponse.json({ error: 'Clinic slug already in use' }, { status: 400 });
    }

    const passwordHash = await hashPassword(adminPassword || 'Password123!');

    const result = await prisma.$transaction(async (tx) => {
      const clinic = await tx.clinic.create({
        data: {
          name: clinicName,
          slug,
          address,
          phone,
        },
      });

      const branch = await tx.branch.create({
        data: {
          clinicId: clinic.id,
          name: `${clinicName} Main Branch`,
          address,
          phone,
        },
      });

      const adminUser = await tx.user.create({
        data: {
          clinicId: clinic.id,
          branchId: branch.id,
          name: adminName || 'Clinic Admin',
          email: adminEmail.toLowerCase().trim(),
          passwordHash,
          role: 'CLINIC_ADMIN',
        },
      });

      return { clinic, branch, adminUser };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error creating clinic:', error);
    return NextResponse.json({ error: 'Failed to create clinic' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = getSessionUser();
  if (!session || (session.role !== 'CLINIC_ADMIN' && session.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { name, address, phone, logoUrl } = body;

  const updatedClinic = await prisma.clinic.update({
    where: { id: session.clinicId },
    data: { name, address, phone, logoUrl },
  });

  return NextResponse.json(updatedClinic);
}
