export type Role = 'SUPER_ADMIN' | 'CLINIC_ADMIN' | 'DOCTOR' | 'RECEPTIONIST';

export const ROLE_HIERARCHY: Record<Role, number> = {
  SUPER_ADMIN: 4,
  CLINIC_ADMIN: 3,
  DOCTOR: 2,
  RECEPTIONIST: 1,
};

export function hasMinimumRole(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function canAccessPath(userRole: Role, path: string): boolean {
  if (userRole === 'SUPER_ADMIN') return true;

  if (path.startsWith('/admin')) {
    return userRole === 'CLINIC_ADMIN';
  }
  if (path.startsWith('/doctor')) {
    return userRole === 'CLINIC_ADMIN' || userRole === 'DOCTOR';
  }
  if (path.startsWith('/reception')) {
    return userRole === 'CLINIC_ADMIN' || userRole === 'RECEPTIONIST';
  }
  if (path.startsWith('/reports')) {
    return userRole === 'CLINIC_ADMIN' || userRole === 'DOCTOR';
  }

  return true;
}
