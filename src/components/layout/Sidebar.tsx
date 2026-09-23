'use client';

import { useState } from 'react';
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
  Activity,
  Menu,
  X,
} from 'lucide-react';

interface SidebarProps {
  userRole: string;
  userName: string;
  clinicName: string;
}

export function Sidebar({ userRole, userName, clinicName }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const navItems = [
    // Admin links
    { label: 'Overview', href: '/admin', roles: ['CLINIC_ADMIN', 'SUPER_ADMIN'], icon: LayoutDashboard },
    { label: 'Branches', href: '/admin/branches', roles: ['CLINIC_ADMIN', 'SUPER_ADMIN'], icon: Building2 },
    { label: 'Staff Accounts', href: '/admin/staff', roles: ['CLINIC_ADMIN', 'SUPER_ADMIN'], icon: Users },
    { label: 'Clinic Settings', href: '/admin/settings', roles: ['CLINIC_ADMIN', 'SUPER_ADMIN'], icon: Settings },

    // Doctor links
    { label: 'Doctor Queue', href: '/doctor', roles: ['DOCTOR', 'CLINIC_ADMIN'], icon: Stethoscope },

    // Receptionist links
    { label: 'Live Queue Board', href: '/reception', roles: ['RECEPTIONIST', 'CLINIC_ADMIN'], icon: Activity },
    { label: 'Appointments', href: '/reception/appointments', roles: ['RECEPTIONIST', 'CLINIC_ADMIN'], icon: Calendar },
    { label: 'Patient Directory', href: '/reception/patients', roles: ['RECEPTIONIST', 'CLINIC_ADMIN'], icon: Users },
    { label: 'New Patient', href: '/reception/patients/new', roles: ['RECEPTIONIST', 'CLINIC_ADMIN'], icon: UserPlus },
    { label: 'Billing & Receipts', href: '/reception/billing', roles: ['RECEPTIONIST', 'CLINIC_ADMIN'], icon: Receipt },

    // Reports link
    { label: 'Analytics & Reports', href: '/reports', roles: ['CLINIC_ADMIN', 'DOCTOR'], icon: FileBarChart },
  ];

  const filteredNav = navItems.filter((item) => item.roles.includes(userRole));

  const sidebarContent = (
    <div className="flex flex-col justify-between h-full">
      <div>
        {/* Clinic Header */}
        <div className="p-4 border-b border-apple-border flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 shrink-0 rounded-apple-md bg-apple-blue/10 text-apple-blue flex items-center justify-center font-bold text-base border border-apple-blue/20">
              🏥
            </div>
            <div className="overflow-hidden">
              <h2 className="font-semibold text-apple-text text-sm leading-snug truncate">{clinicName}</h2>
              <span className="text-[11px] font-medium text-apple-blue bg-apple-blue/10 px-2 py-0.5 rounded-apple-pill inline-block mt-0.5">
                {userRole.replace('_', ' ')}
              </span>
            </div>
          </div>
          {/* Close button for mobile drawer */}
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-2 rounded-apple-sm text-apple-muted hover:text-apple-text min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close Sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="p-3 space-y-1">
          <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-apple-tertiary">
            System Menu
          </div>
          {filteredNav.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 min-h-[44px] rounded-apple-sm text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-apple-blue/10 text-apple-blue font-semibold'
                    : 'text-apple-muted hover:text-apple-text hover:bg-apple-secondary'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-apple-blue' : 'text-apple-muted'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Profile & Footer */}
      <div className="p-4 border-t border-apple-border space-y-3">
        <div className="flex items-center justify-between text-xs text-apple-muted px-1">
          <span className="truncate font-semibold text-apple-text">{userName}</span>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 bg-apple-secondary hover:bg-apple-red/10 hover:text-apple-red text-apple-muted text-xs font-medium py-2.5 min-h-[44px] rounded-apple-sm border border-apple-border transition-all duration-150"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Bar Hamburger Trigger */}
      <div className="md:hidden fixed top-3 left-4 z-50">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2.5 rounded-apple-sm bg-apple-surface/90 backdrop-blur border border-apple-border text-apple-text shadow-apple-subtle min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Open Mobile Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Desktop Sticky Sidebar */}
      <aside className="hidden md:flex w-64 bg-apple-surface border-r border-apple-border flex-col justify-between shrink-0 h-screen sticky top-0 transition-colors duration-200">
        {sidebarContent}
      </aside>

      {/* Mobile Slide-Over Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-72 max-w-[80vw] bg-apple-surface h-full shadow-apple-modal z-10 flex flex-col justify-between">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
