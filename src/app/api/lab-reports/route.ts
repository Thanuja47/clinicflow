export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { uploadLabReportFile } from '@/lib/supabaseStorage';
import { Prisma } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get('patientId');
    const visitId = searchParams.get('visitId');

    const where: Prisma.LabReportWhereInput = {
      clinicId: user.clinicId,
    };

    if (patientId) where.patientId = patientId;
    if (visitId) where.visitId = visitId;

    const reports = await prisma.labReport.findMany({
      where,
      include: {
        patient: { select: { id: true, fullName: true, phone: true } },
        visit: { select: { id: true, diagnosis: true, visitDate: true } },
      },
      orderBy: { uploadedAt: 'desc' },
    });

    return NextResponse.json(reports);
  } catch (error) {
    console.error('GET /api/lab-reports error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const patientId = formData.get('patientId') as string | null;
    const visitId = formData.get('visitId') as string | null;

    if (!file || !patientId) {
      return NextResponse.json(
        { error: 'File and Patient ID are required' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const fileUrl = await uploadLabReportFile(buffer, file.name, file.type);

    const report = await prisma.labReport.create({
      data: {
        clinicId: user.clinicId,
        patientId,
        visitId: visitId || null,
        fileUrl,
      },
      include: {
        patient: true,
      },
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error('POST /api/lab-reports error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
