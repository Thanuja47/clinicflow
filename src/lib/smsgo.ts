import { prisma } from '@/lib/prisma';
import { NotificationChannel, NotificationType } from '@prisma/client';

export interface SendSMSOptions {
  to: string;
  message: string;
  clinicId: string;
  patientId?: string;
  type?: NotificationType;
  channel?: NotificationChannel;
}

export async function sendSMS({
  to,
  message,
  clinicId,
  patientId,
  type = 'CONFIRMATION',
  channel = 'SMS',
}: SendSMSOptions) {
  const apiKey = process.env.SMSGO_API_KEY;
  const senderId = process.env.SMSGO_SENDER_ID || 'LankaCare';

  let status: 'SENT' | 'FAILED' = 'SENT';
  let responseData = '';

  // Clean phone number (format: +947XXXXXXXX or 07XXXXXXXX -> 947XXXXXXXX)
  let formattedPhone = to.trim().replace(/[^0-9]/g, '');
  if (formattedPhone.startsWith('0')) {
    formattedPhone = '94' + formattedPhone.substring(1);
  } else if (!formattedPhone.startsWith('94')) {
    formattedPhone = '94' + formattedPhone;
  }

  try {
    if (apiKey && apiKey !== 'dummy_key' && apiKey !== 'your-smsgo-api-key') {
      // Real SMSGo.lk API Call
      const res = await fetch('https://smsgo.lk/api/v1/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          recipient: formattedPhone,
          sender_id: senderId,
          message: message,
        }),
      });

      const json = await res.json();
      responseData = JSON.stringify(json);
      if (!res.ok) status = 'FAILED';
    } else {
      // Development Mock
      console.log(`[SMS/WhatsApp MOCK SENT via ${channel}] To: ${formattedPhone} | Msg: ${message}`);
      responseData = 'MOCKED_SUCCESS';
    }
  } catch (err) {
    console.error('SMS Provider Error:', err);
    status = 'FAILED';
    responseData = err instanceof Error ? err.message : 'Unknown error';
  }

  // Record log in Database
  try {
    await prisma.notificationLog.create({
      data: {
        clinicId,
        patientId: patientId || null,
        channel,
        type,
        status,
      },
    });
  } catch (dbErr) {
    console.error('Failed to save NotificationLog to database:', dbErr);
  }

  return { status, responseData };
}
