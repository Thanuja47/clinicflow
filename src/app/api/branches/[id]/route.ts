export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSessionUser();
  if (!session || (session.role !== 'CLINIC_ADMIN' && session.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, address, phone } = body;

    if (!name) {
      return NextResponse.json({ error: 'Branch name is required' }, { status: 400 });
    }

    const branch = await prisma.branch.updateMany({
      where: {
        id: params.id,
        clinicId: session.clinicId,
      },
      data: { name, address, phone },
    });

    if (branch.count === 0) {
      return NextResponse.json({ error: 'Branch not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Branch updated successfully' });
  } catch (error) {
    console.error('PUT /api/branches/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update branch' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSessionUser();
  if (!session || (session.role !== 'CLINIC_ADMIN' && session.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const result = await prisma.branch.deleteMany({
      where: {
        id: params.id,
        clinicId: session.clinicId,
      },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: 'Branch not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Branch deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/branches/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete branch. Ensure it has no assigned staff or appointments.' }, { status: 500 });
  }
}
