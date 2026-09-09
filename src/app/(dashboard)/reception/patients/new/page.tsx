'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Topbar } from '@/components/layout/Topbar';

export default function NewPatientPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: '',
    nic: '',
    phone: '',
    dob: '',
    gender: '',
    address: '',
    allergies: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to register patient');

      router.push(`/reception/patients`);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar title="Register New Patient" userName="Reception" />

      <div className="p-6 max-w-2xl space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">Patient Registration Form</h2>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3 rounded-lg">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs uppercase text-slate-400 font-semibold mb-1">Full Name *</label>
                <input
                  type="text"
                  name="fullName"
                  required
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="Patient's full name"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm focus:border-sky-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs uppercase text-slate-400 font-semibold mb-1">NIC Number</label>
                <input
                  type="text"
                  name="nic"
                  value={form.nic}
                  onChange={handleChange}
                  placeholder="e.g. 901234567V"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm focus:border-sky-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs uppercase text-slate-400 font-semibold mb-1">Phone Number *</label>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+94771234567"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm focus:border-sky-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs uppercase text-slate-400 font-semibold mb-1">Date of Birth</label>
                <input
                  type="date"
                  name="dob"
                  value={form.dob}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm focus:border-sky-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs uppercase text-slate-400 font-semibold mb-1">Gender</label>
                <select
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm focus:border-sky-500 outline-none transition"
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs uppercase text-slate-400 font-semibold mb-1">Address</label>
                <input
                  type="text"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Street address, city"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm focus:border-sky-500 outline-none transition"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs uppercase text-slate-400 font-semibold mb-1">Known Allergies</label>
                <textarea
                  name="allergies"
                  value={form.allergies}
                  onChange={handleChange}
                  rows={3}
                  placeholder="List any known drug or food allergies..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm focus:border-sky-500 outline-none transition resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 text-sm text-slate-400 hover:text-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-sky-600 hover:bg-sky-500 text-white font-medium px-5 py-2 rounded-lg text-sm transition disabled:opacity-50"
              >
                {loading ? 'Registering...' : 'Register Patient'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
