export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSessionUser();
  if (!session || (session.role !== 'CLINIC_ADMIN' && session.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { isActive, name, role, branchId, phone } = body;

    const dataToUpdate: Record<string, unknown> = {};
    if (typeof isActive === 'boolean') dataToUpdate.isActive = isActive;
    if (name) dataToUpdate.name = name;
    if (role) dataToUpdate.role = role;
    if (branchId !== undefined) dataToUpdate.branchId = branchId || null;
    if (phone !== undefined) dataToUpdate.phone = phone;

    const user = await prisma.user.updateMany({
      where: {
        id: params.id,
        clinicId: session.clinicId,
      },
      data: dataToUpdate,
    });

    if (user.count === 0) {
      return NextResponse.json({ error: 'Staff account not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Staff account updated' });
  } catch (error) {
    console.error('PATCH /api/staff/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update staff account' }, { status: 500 });
  }
}
