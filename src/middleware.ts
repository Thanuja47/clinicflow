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

  // Decode JWT payload for edge RBAC check
  try {
    const payloadBase64 = token.split('.')[1];
    if (payloadBase64) {
      const decodedJson = JSON.parse(atob(payloadBase64));
      const userRole = decodedJson.role;

      // Role-Based Route Protection
      if (pathname.startsWith('/admin') && userRole !== 'CLINIC_ADMIN' && userRole !== 'SUPER_ADMIN') {
        const fallbackUrl = userRole === 'DOCTOR' ? '/doctor' : '/reception';
        return NextResponse.redirect(new URL(fallbackUrl, request.url));
      }

      if (pathname.startsWith('/doctor') && userRole !== 'DOCTOR' && userRole !== 'CLINIC_ADMIN' && userRole !== 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/reception', request.url));
      }

      if (pathname.startsWith('/reception') && userRole !== 'RECEPTIONIST' && userRole !== 'CLINIC_ADMIN' && userRole !== 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/doctor', request.url));
      }
    }
  } catch {
    // If token parsing fails, clear cookie and redirect to login
    const loginUrl = new URL('/login', request.url);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete('token');
    return response;
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
