'use client';

import { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';
import { Language } from '@/lib/i18n';

export function LanguageToggle() {
  const [lang, setLang] = useState<Language>('en');

  useEffect(() => {
    const saved = localStorage.getItem('clinicflow_lang') as Language;
    if (saved && (saved === 'en' || saved === 'si')) {
      setLang(saved);
    }
  }, []);

  function toggleLanguage(newLang: Language) {
    setLang(newLang);
    localStorage.setItem('clinicflow_lang', newLang);
    window.dispatchEvent(new Event('languageChange'));
  }

  return (
    <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-lg p-1 text-xs">
      <Globe className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
      <button
        onClick={() => toggleLanguage('en')}
        className={`px-2 py-1 rounded font-semibold transition-colors ${
          lang === 'en'
            ? 'bg-emerald-600 text-white'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => toggleLanguage('si')}
        className={`px-2 py-1 rounded font-semibold transition-colors ${
          lang === 'si'
            ? 'bg-emerald-600 text-white'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        සිංහල
      </button>
    </div>
  );
}
