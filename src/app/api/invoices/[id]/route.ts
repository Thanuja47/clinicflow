export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { Prisma, $Enums } from '@prisma/client';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const invoice = await prisma.invoice.findFirst({
      where: {
        id: params.id,
        clinicId: user.clinicId,
      },
      include: {
        patient: true,
        clinic: { select: { name: true, address: true, phone: true } },
        appointment: {
          select: {
            scheduledAt: true,
            queueNumber: true,
            doctor: { select: { name: true } },
            branch: { select: { name: true } },
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('GET /api/invoices/[id] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { status, consultationFee, labCharges, otherCharges } = body;

    const existing = await prisma.invoice.findFirst({
      where: {
        id: params.id,
        clinicId: user.clinicId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const updateData: Prisma.InvoiceUpdateInput = {};
    if (status) updateData.status = status as $Enums.InvoiceStatus;

    let cFee = existing.consultationFee;
    let lFee = existing.labCharges;
    let oFee = existing.otherCharges;

    if (consultationFee !== undefined) {
      cFee = parseFloat(consultationFee) || 0;
      updateData.consultationFee = cFee;
    }
    if (labCharges !== undefined) {
      lFee = parseFloat(labCharges) || 0;
      updateData.labCharges = lFee;
    }
    if (otherCharges !== undefined) {
      oFee = parseFloat(otherCharges) || 0;
      updateData.otherCharges = oFee;
    }

    updateData.totalAmount = cFee + lFee + oFee;

    const updated = await prisma.invoice.update({
      where: { id: params.id },
      data: updateData,
      include: {
        patient: true,
        appointment: { select: { doctor: { select: { name: true } } } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('PUT /api/invoices/[id] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
