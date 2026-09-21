'use client';
import { useState, useEffect } from 'react';
import { Topbar } from '@/components/layout/Topbar';

interface Branch {
  id: string;
  name: string;
}

interface StaffUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  isActive: boolean;
  branch?: { id: string; name: string };
}

export default function StaffPage() {
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('DOCTOR');
  const [branchId, setBranchId] = useState('');
  const [phone, setPhone] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchData = async () => {
    const [staffRes, branchRes] = await Promise.all([
      fetch('/api/staff'),
      fetch('/api/branches'),
    ]);

    if (staffRes.ok) setStaffList(await staffRes.json());
    if (branchRes.ok) setBranches(await branchRes.json());
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role, branchId: branchId || undefined, phone }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create staff account');
      }

      setName('');
      setEmail('');
      setPassword('');
      setPhone('');
      fetchData();
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (user: StaffUser) => {
    setError('');
    try {
      const res = await fetch(`/api/staff/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !user.isActive }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update status');
      }

      fetchData();
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar title="Staff Account Directory" userName="Admin" />

      <div className="p-6 space-y-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">Create Staff Account (Doctor / Receptionist)</h2>

          {error && <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3 rounded-lg">{error}</div>}

          <form onSubmit={handleCreateStaff} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs uppercase text-slate-400 font-semibold mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dr. John Doe"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm focus:border-sky-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs uppercase text-slate-400 font-semibold mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@clinic.lk"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm focus:border-sky-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs uppercase text-slate-400 font-semibold mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm focus:border-sky-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs uppercase text-slate-400 font-semibold mb-1">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm focus:border-sky-500 outline-none"
              >
                <option value="DOCTOR">DOCTOR</option>
                <option value="RECEPTIONIST">RECEPTIONIST</option>
                <option value="CLINIC_ADMIN">CLINIC_ADMIN</option>
              </select>
            </div>

            <div>
              <label className="block text-xs uppercase text-slate-400 font-semibold mb-1">Assign Branch</label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm focus:border-sky-500 outline-none"
              >
                <option value="">Unassigned / All Branches</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs uppercase text-slate-400 font-semibold mb-1">Phone Number</label>
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
                className="bg-sky-600 hover:bg-sky-500 text-white font-medium px-4 py-2 rounded-lg text-sm transition disabled:opacity-50"
              >
                {loading ? 'Registering...' : '+ Create Account'}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">Staff Accounts</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/50 uppercase text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3">Staff Name</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Branch</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {staffList.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-800/30">
                    <td className="p-3 font-medium text-slate-100">{member.name}</td>
                    <td className="p-3 text-slate-400">{member.email}</td>
                    <td className="p-3">
                      <span className="bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded font-mono text-[10px]">
                        {member.role}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400">{member.branch?.name || 'All Branches'}</td>
                    <td className="p-3">
                      {member.isActive ? (
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px]">
                          Active
                        </span>
                      ) : (
                        <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded text-[10px]">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleToggleActive(member)}
                        className={`text-[11px] font-medium px-2.5 py-1 rounded transition border ${
                          member.isActive
                            ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30'
                            : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        }`}
                      >
                        {member.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
