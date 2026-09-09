import { cookies } from 'next/headers';
import { verifyAccessToken, UserSessionPayload } from '@/lib/auth';

export function getSessionUser(): UserSessionPayload | null {
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  return verifyAccessToken(token);
}
