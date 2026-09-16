export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // Alias for /api/lab-reports
  return NextResponse.redirect(new URL('/api/lab-reports', req.url));
}
