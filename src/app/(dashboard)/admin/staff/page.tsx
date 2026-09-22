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
      <Topbar title="Staff Directory" userName="Admin" />

      <div className="p-6 space-y-6">
        <div className="apple-card p-6 space-y-4">
          <h2 className="apple-section-header">Create staff account</h2>

          {error && <div className="bg-apple-red/10 border border-apple-red/20 text-apple-red text-xs p-3 rounded-apple-md font-medium">{error}</div>}

          <form onSubmit={handleCreateStaff} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block apple-caption mb-1 font-medium">Full name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dr. John Doe"
                className="w-full apple-input"
              />
            </div>

            <div>
              <label className="block apple-caption mb-1 font-medium">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@clinic.lk"
                className="w-full apple-input"
              />
            </div>

            <div>
              <label className="block apple-caption mb-1 font-medium">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full apple-input"
              />
            </div>

            <div>
              <label className="block apple-caption mb-1 font-medium">System role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full apple-input"
              >
                <option value="DOCTOR">DOCTOR</option>
                <option value="RECEPTIONIST">RECEPTIONIST</option>
                <option value="CLINIC_ADMIN">CLINIC_ADMIN</option>
              </select>
            </div>

            <div>
              <label className="block apple-caption mb-1 font-medium">Assign branch</label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="w-full apple-input"
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
              <label className="block apple-caption mb-1 font-medium">Phone number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+94..."
                className="w-full apple-input"
              />
            </div>

            <div className="md:col-span-3 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="apple-btn-primary disabled:opacity-50"
              >
                {loading ? 'Registering...' : '+ Create Account'}
              </button>
            </div>
          </form>
        </div>

        <div className="apple-card p-6 space-y-4">
          <h2 className="apple-section-header">Registered staff accounts</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-apple-text">
              <thead>
                <tr className="border-b border-apple-border text-apple-muted text-xs font-semibold">
                  <th className="py-3.5 px-4">Staff Name</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Branch</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-apple-border">
                {staffList.map((member) => (
                  <tr key={member.id} className="hover:bg-apple-secondary/40 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-apple-text">{member.name}</td>
                    <td className="py-3.5 px-4 text-apple-muted">{member.email}</td>
                    <td className="py-3.5 px-4">
                      <span className="apple-pill apple-pill-blue">
                        {member.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-apple-muted">{member.branch?.name || 'All Branches'}</td>
                    <td className="py-3.5 px-4">
                      {member.isActive ? (
                        <span className="apple-pill apple-pill-green">
                          Active
                        </span>
                      ) : (
                        <span className="apple-pill apple-pill-red">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleToggleActive(member)}
                        className={`apple-btn-secondary text-xs py-1 px-3 ${
                          member.isActive ? 'text-apple-red hover:bg-apple-red/10' : 'text-apple-green hover:bg-apple-green/10'
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
