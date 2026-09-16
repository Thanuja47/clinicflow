'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { Topbar } from '@/components/layout/Topbar';

export default function SettingsPage() {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/clinics')
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setName(data.name || '');
          setAddress(data.address || '');
          setPhone(data.phone || '');
          setLogoUrl(data.logoUrl || '');
        }
      });
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/clinics', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, address, phone, logoUrl }),
      });

      if (res.ok) {
        setMessage('Clinic settings updated successfully!');
      }
    } catch {
      setMessage('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar title="Clinic Settings" userName="Admin" />

      <div className="p-6 space-y-6 max-w-2xl">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">General Clinic Profile</h2>

          {message && <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-3 rounded-lg">{message}</div>}

          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="block text-xs uppercase text-slate-400 font-semibold mb-1">Clinic Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm focus:border-sky-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs uppercase text-slate-400 font-semibold mb-1">Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm focus:border-sky-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs uppercase text-slate-400 font-semibold mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm focus:border-sky-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs uppercase text-slate-400 font-semibold mb-1">Logo Image URL</label>
              <input
                type="text"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm focus:border-sky-500 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-sky-600 hover:bg-sky-500 text-white font-medium px-4 py-2 rounded-lg text-sm transition"
            >
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
