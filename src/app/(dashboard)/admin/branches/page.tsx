'use client';
import { useState, useEffect } from 'react';
import { Topbar } from '@/components/layout/Topbar';
import { Edit2, Trash2, Building2 } from 'lucide-react';

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

  // Edit Modal State
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

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

  const handleOpenEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setEditName(branch.name);
    setEditAddress(branch.address || '');
    setEditPhone(branch.phone || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBranch) return;

    setSavingEdit(true);
    setError('');
    try {
      const res = await fetch(`/api/branches/${editingBranch.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, address: editAddress, phone: editPhone }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update branch');
      }

      setEditingBranch(null);
      fetchBranches();
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (id: string, branchName: string) => {
    if (!confirm(`Are you sure you want to delete branch "${branchName}"?`)) return;

    setError('');
    try {
      const res = await fetch(`/api/branches/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete branch');
      }

      fetchBranches();
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar title="Branch Management" userName="Admin" />

      <div className="p-6 space-y-6">
        <div className="apple-card p-6 space-y-4">
          <h2 className="apple-section-header flex items-center gap-2">
            <Building2 className="w-5 h-5 text-apple-blue" /> Add new clinic branch
          </h2>

          {error && <div className="bg-apple-red/10 border border-apple-red/20 text-apple-red text-xs p-3 rounded-apple-md font-medium">{error}</div>}

          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block apple-caption mb-1 font-medium">Branch name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Kandy Branch"
                className="w-full apple-input"
              />
            </div>
            <div>
              <label className="block apple-caption mb-1 font-medium">Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street address, city"
                className="w-full apple-input"
              />
            </div>
            <div>
              <label className="block apple-caption mb-1 font-medium">Phone</label>
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
                {loading ? 'Creating...' : '+ Add Branch'}
              </button>
            </div>
          </form>
        </div>

        <div className="apple-card p-6 space-y-4">
          <h2 className="apple-section-header">Active clinic branches</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {branches.map((b) => (
              <div key={b.id} className="apple-card p-4 space-y-2.5 bg-apple-secondary/30">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-apple-text text-base">{b.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="apple-pill apple-pill-green">
                      Active
                    </span>
                    <button
                      onClick={() => handleOpenEdit(b)}
                      className="text-apple-muted hover:text-apple-blue p-1 transition-colors"
                      title="Edit Branch"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(b.id, b.name)}
                      className="text-apple-muted hover:text-apple-red p-1 transition-colors"
                      title="Delete Branch"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-apple-muted">{b.address || 'No address specified'}</p>
                <p className="text-xs text-apple-muted">Phone: {b.phone || 'N/A'}</p>
                <div className="pt-2 flex gap-4 text-xs text-apple-tertiary border-t border-apple-border">
                  <span>Assigned Staff: {b._count?.users || 0}</span>
                  <span>Appointments: {b._count?.appointments || 0}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingBranch && (
        <div className="fixed inset-0 apple-modal-overlay flex items-center justify-center p-4 z-50">
          <div className="apple-modal-card w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="apple-section-header">Edit Branch</h3>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block apple-caption mb-1 font-medium">Branch name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full apple-input"
                />
              </div>
              <div>
                <label className="block apple-caption mb-1 font-medium">Address</label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full apple-input"
                />
              </div>
              <div>
                <label className="block apple-caption mb-1 font-medium">Phone</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full apple-input"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingBranch(null)}
                  className="apple-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="apple-btn-primary disabled:opacity-50"
                >
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
