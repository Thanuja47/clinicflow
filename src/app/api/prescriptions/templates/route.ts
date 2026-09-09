import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const templates = await prisma.prescriptionTemplate.findMany({
      where: {
        clinicId: user.clinicId,
        doctorId: user.userId,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error('GET /api/prescriptions/templates error:', error);
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
    const { name, items } = body;

    if (!name || !items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Template name and prescription items are required' },
        { status: 400 }
      );
    }

    const template = await prisma.prescriptionTemplate.create({
      data: {
        clinicId: user.clinicId,
        doctorId: user.userId,
        name,
        itemsJson: JSON.stringify(items),
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error('POST /api/prescriptions/templates error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
