import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;

  const publicPaths = ['/login', '/register-clinic', '/api/auth/login', '/api/auth/refresh'];
  if (publicPaths.some((p) => pathname.startsWith(p)) || pathname === '/') {
    return NextResponse.next();
  }

  if (!token) {
    if (pathname.startsWith('/api')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/doctor/:path*',
    '/reception/:path*',
    '/reports/:path*',
    '/api/clinics/:path*',
    '/api/branches/:path*',
    '/api/staff/:path*',
    '/api/patients/:path*',
    '/api/appointments/:path*',
    '/api/queue/:path*',
    '/api/visits/:path*',
    '/api/prescriptions/:path*',
    '/api/invoices/:path*',
    '/api/reports/:path*',
  ],
};
