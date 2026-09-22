'use client';
import { useState, useEffect } from 'react';
import { Topbar } from '@/components/layout/Topbar';

export default function SettingsPage() {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
      })
      .catch((err) => console.error('Failed to load clinic settings', err));
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch('/api/clinics', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, address, phone, logoUrl }),
      });

      if (res.ok) {
        setStatus({ type: 'success', text: 'Clinic settings updated successfully!' });
      } else {
        const data = await res.json();
        setStatus({ type: 'error', text: data.error || 'Failed to update settings' });
      }
    } catch (err: unknown) {
      if (err instanceof Error) setStatus({ type: 'error', text: err.message });
      else setStatus({ type: 'error', text: 'Failed to update settings' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar title="Clinic Settings" userName="Admin" />

      <div className="p-6 space-y-6 max-w-2xl">
        <div className="apple-card p-6 space-y-4">
          <h2 className="apple-section-header">General clinic profile</h2>

          {status && (
            <div
              className={`text-xs p-3 rounded-apple-md font-medium border ${
                status.type === 'success'
                  ? 'bg-apple-green/10 border-apple-green/20 text-apple-green'
                  : 'bg-apple-red/10 border-apple-red/20 text-apple-red'
              }`}
            >
              {status.text}
            </div>
          )}

          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="block apple-caption mb-1 font-medium">Clinic name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full apple-input"
              />
            </div>

            <div>
              <label className="block apple-caption mb-1 font-medium">Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full apple-input"
              />
            </div>

            <div>
              <label className="block apple-caption mb-1 font-medium">Phone number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full apple-input"
              />
            </div>

            <div>
              <label className="block apple-caption mb-1 font-medium">Logo image URL</label>
              <input
                type="text"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://..."
                className="w-full apple-input"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="apple-btn-primary disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
