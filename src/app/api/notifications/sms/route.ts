import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { sendSMS } from '@/lib/smsgo';
import { NotificationType } from '@prisma/client';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { to, message, patientId, type = 'REMINDER' } = body;

    if (!to || !message) {
      return NextResponse.json({ error: 'Recipient phone and message are required' }, { status: 400 });
    }

    const result = await sendSMS({
      to,
      message,
      clinicId: user.clinicId,
      patientId,
      type: type as NotificationType,
      channel: 'SMS',
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('POST /api/notifications/sms error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
