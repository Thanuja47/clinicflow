'use client';

import { LanguageToggle } from '@/components/LanguageToggle';

interface TopbarProps {
  title: string;
  userName: string;
}

export function Topbar({ title, userName }: TopbarProps) {
  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-10">
      <h1 className="text-lg font-bold text-slate-100">{title}</h1>
      <div className="flex items-center gap-4">
        <LanguageToggle />
        <div className="text-right">
          <p className="text-xs font-semibold text-slate-200">{userName}</p>
          <p className="text-[10px] text-slate-400">Fillex360 Solutions</p>
        </div>
      </div>
    </header>
  );
}
