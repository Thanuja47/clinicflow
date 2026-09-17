'use client';
import { useState, useEffect } from 'react';
import { Topbar } from '@/components/layout/Topbar';

interface Branch {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  createdAt: string;
  _count?: { users: number; appointments: number };
}

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchBranches = async () => {
    const res = await fetch('/api/branches');
    if (res.ok) {
      const data = await res.json();
      setBranches(data);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, address, phone }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create branch');
      }

      setName('');
      setAddress('');
      setPhone('');
      fetchBranches();
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar title="Branch Management" userName="Admin" />

      <div className="p-6 space-y-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">Add New Clinic Branch</h2>

          {error && <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3 rounded-lg">{error}</div>}

          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs uppercase text-slate-400 font-semibold mb-1">Branch Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Kandy Branch"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm focus:border-sky-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs uppercase text-slate-400 font-semibold mb-1">Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Address"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm focus:border-sky-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs uppercase text-slate-400 font-semibold mb-1">Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+94..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm focus:border-sky-500 outline-none"
              />
            </div>
            <div className="md:col-span-3 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="bg-sky-600 hover:bg-sky-500 text-white font-medium px-4 py-2 rounded-lg text-sm transition"
              >
                {loading ? 'Creating...' : '+ Add Branch'}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">Active Branches</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {branches.map((b) => (
              <div key={b.id} className="bg-slate-950 border border-slate-800 p-4 rounded-lg space-y-2">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-slate-100">{b.name}</h3>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono">
                    Active
                  </span>
                </div>
                <p className="text-xs text-slate-400">{b.address || 'No address specified'}</p>
                <p className="text-xs text-slate-400">Phone: {b.phone || 'N/A'}</p>
                <div className="pt-2 flex gap-4 text-[11px] text-slate-500 border-t border-slate-800/60">
                  <span>Assigned Staff: {b._count?.users || 0}</span>
                  <span>Appointments: {b._count?.appointments || 0}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
