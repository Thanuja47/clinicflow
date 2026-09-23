'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

interface TopbarProps {
  title: string;
  userName: string;
}

export function Topbar({ title, userName }: TopbarProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = savedTheme === 'dark' || (!savedTheme && systemPrefersDark);
    
    if (isDark) {
      setTheme('dark');
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      setTheme('light');
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      localStorage.setItem('theme', 'dark');
    } else {
      setTheme('light');
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <header className="h-16 bg-apple-surface/80 backdrop-blur-md border-b border-apple-border px-6 flex items-center justify-between sticky top-0 z-10 transition-colors duration-200">
      <div>
        <h1 className="text-lg font-bold text-apple-text tracking-tight">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-apple-sm bg-apple-secondary border border-apple-border text-apple-muted hover:text-apple-text hover:border-apple-blue/30 transition-all duration-150"
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>

        <div className="text-right pl-2 border-l border-apple-border">
          <p className="text-xs font-semibold text-apple-text">{userName}</p>
          <p className="text-[11px] text-apple-muted">ClinicFlow Enterprise</p>
        </div>
      </div>
    </header>
  );
}
