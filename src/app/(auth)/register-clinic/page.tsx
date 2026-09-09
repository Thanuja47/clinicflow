'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterClinicPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    clinicName: '',
    slug: '',
    address: '',
    phone: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/clinics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to register clinic');

      router.push('/login?registered=true');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Something went wrong');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex justify-center items-center p-4">
      <div className="w-full max-w-lg bg-slate-800 border border-slate-700 rounded-xl p-8 space-y-6">
        <h1 className="text-xl font-bold text-sky-400">Onboard New Clinic Tenant</h1>

        {error && <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3 rounded-lg">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Clinic Name</label>
              <input
                type="text"
                required
                value={formData.clinicName}
                onChange={(e) => setFormData({ ...formData, clinicName: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Slug</label>
              <input
                type="text"
                required
                placeholder="my-clinic"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Admin Email</label>
            <input
              type="email"
              required
              value={formData.adminEmail}
              onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Admin Password</label>
            <input
              type="password"
              required
              value={formData.adminPassword}
              onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sky-600 hover:bg-sky-500 text-white font-medium py-2 rounded-lg text-sm transition"
          >
            {loading ? 'Creating Tenant...' : 'Create Clinic Tenant'}
          </button>
        </form>
      </div>
    </div>
  );
}
