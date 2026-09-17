export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const channel = searchParams.get('channel');
    const status = searchParams.get('status');

    const where: Prisma.NotificationLogWhereInput = {
      clinicId: user.clinicId,
    };

    if (channel) where.channel = channel as Prisma.EnumNotificationChannelFilter;
    if (status) where.status = status;

    const logs = await prisma.notificationLog.findMany({
      where,
      include: {
        patient: { select: { id: true, fullName: true, phone: true } },
      },
      orderBy: { sentAt: 'desc' },
      take: 100,
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error('GET /api/notifications/logs error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
