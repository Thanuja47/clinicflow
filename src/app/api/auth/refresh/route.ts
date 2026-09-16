export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { verifyRefreshToken, signAccessToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const refreshToken = request.headers.get('cookie')
      ?.split('; ')
      .find((row) => row.startsWith('refreshToken='))
      ?.split('=')[1];

    if (!refreshToken) {
      return NextResponse.json({ error: 'Refresh token missing' }, { status: 401 });
    }

    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid or expired refresh token' }, { status: 401 });
    }

    const newAccessToken = signAccessToken({
      userId: payload.userId,
      clinicId: payload.clinicId,
      branchId: payload.branchId,
      email: payload.email,
      name: payload.name,
      role: payload.role,
    });

    const response = NextResponse.json({ accessToken: newAccessToken });

    response.cookies.set('token', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
