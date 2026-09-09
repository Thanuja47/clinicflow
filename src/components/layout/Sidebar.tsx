'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Building2,
  Calendar,
  UserPlus,
  Receipt,
  FileBarChart,
  Settings,
  LogOut,
  Stethoscope,
} from 'lucide-react';

interface SidebarProps {
  userRole: string;
  userName: string;
  clinicName: string;
}

export function Sidebar({ userRole, userName, clinicName }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const navItems = [
    // Admin links
    { label: 'Admin Overview', href: '/admin', roles: ['CLINIC_ADMIN', 'SUPER_ADMIN'], icon: LayoutDashboard },
    { label: 'Branches', href: '/admin/branches', roles: ['CLINIC_ADMIN', 'SUPER_ADMIN'], icon: Building2 },
    { label: 'Staff Directory', href: '/admin/staff', roles: ['CLINIC_ADMIN', 'SUPER_ADMIN'], icon: Users },
    { label: 'Clinic Settings', href: '/admin/settings', roles: ['CLINIC_ADMIN', 'SUPER_ADMIN'], icon: Settings },

    // Doctor links
    { label: 'Doctor Queue', href: '/doctor', roles: ['DOCTOR', 'CLINIC_ADMIN'], icon: Stethoscope },

    // Receptionist links
    { label: 'Live Queue Board', href: '/reception', roles: ['RECEPTIONIST', 'CLINIC_ADMIN'], icon: LayoutDashboard },
    { label: 'Appointments', href: '/reception/appointments', roles: ['RECEPTIONIST', 'CLINIC_ADMIN'], icon: Calendar },
    { label: 'Patient Directory', href: '/reception/patients', roles: ['RECEPTIONIST', 'CLINIC_ADMIN'], icon: Users },
    { label: 'New Patient', href: '/reception/patients/new', roles: ['RECEPTIONIST', 'CLINIC_ADMIN'], icon: UserPlus },
    { label: 'Billing & Receipts', href: '/reception/billing', roles: ['RECEPTIONIST', 'CLINIC_ADMIN'], icon: Receipt },

    // Reports link
    { label: 'Executive Reports', href: '/reports', roles: ['CLINIC_ADMIN', 'DOCTOR'], icon: FileBarChart },
  ];

  const filteredNav = navItems.filter((item) => item.roles.includes(userRole));

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 h-screen sticky top-0">
      <div>
        <div className="p-4 border-b border-slate-800 flex items-center gap-3">
          <div className="bg-sky-500/20 text-sky-400 p-2 rounded-lg border border-sky-500/30 text-xl font-bold">
            🏥
          </div>
          <div>
            <h2 className="font-bold text-slate-100 text-sm leading-tight truncate">{clinicName}</h2>
            <span className="text-[10px] uppercase font-semibold text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded">
              {userRole.replace('_', ' ')}
            </span>
          </div>
        </div>

        <nav className="p-3 space-y-1">
          {filteredNav.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                  isActive
                    ? 'bg-sky-600 text-white font-semibold shadow-md'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-800 space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="truncate font-medium text-slate-300">{userName}</span>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 text-xs font-medium py-2 rounded-lg border border-slate-700 transition"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
