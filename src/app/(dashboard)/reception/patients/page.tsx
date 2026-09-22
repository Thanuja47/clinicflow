'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Topbar } from '@/components/layout/Topbar';
import { Search, UserPlus } from 'lucide-react';

interface Patient {
  id: string;
  fullName: string;
  nic?: string;
  phone: string;
  dob?: string;
  gender?: string;
  createdAt: string;
}

export default function PatientsListPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [query, setQuery] = useState('');
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchPatients = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/patients?q=${encodeURIComponent(q)}&limit=30`);
      if (res.ok) {
        const data = await res.json();
        setPatients(data.patients);
        setTotal(data.total);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchPatients('');
  }, [fetchPatients]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPatients(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, fetchPatients]);

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar title="Patient Directory" userName="Reception" />

      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-apple-muted pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name, NIC or phone..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full apple-input apple-input-has-icon"
            />
          </div>
          <Link
            href="/reception/patients/new"
            className="apple-btn-primary flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            New Patient
          </Link>
        </div>

        <p className="apple-caption text-xs">
          {loading ? 'Searching...' : `${total} patient${total !== 1 ? 's' : ''} found`}
        </p>

        <div className="apple-card overflow-hidden">
          <table className="w-full text-left text-sm text-apple-text">
            <thead>
              <tr className="border-b border-apple-border text-apple-muted text-xs font-semibold">
                <th className="py-3.5 px-4">Patient Name</th>
                <th className="py-3.5 px-4">NIC</th>
                <th className="py-3.5 px-4">Phone</th>
                <th className="py-3.5 px-4">Gender</th>
                <th className="py-3.5 px-4">Registered</th>
                <th className="py-3.5 px-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-apple-border">
              {patients.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="p-8 text-center apple-caption">
                    {query ? `No patients found matching "${query}"` : 'No patients registered yet.'}
                  </td>
                </tr>
              )}
              {patients.map((p) => (
                <tr key={p.id} className="hover:bg-apple-secondary/40 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-apple-text">{p.fullName}</td>
                  <td className="py-3.5 px-4 font-mono text-xs text-apple-muted">{p.nic || '—'}</td>
                  <td className="py-3.5 px-4 text-apple-text text-xs">{p.phone}</td>
                  <td className="py-3.5 px-4 text-apple-muted text-xs">{p.gender || '—'}</td>
                  <td className="py-3.5 px-4 text-apple-muted text-xs">{new Date(p.createdAt).toLocaleDateString()}</td>
                  <td className="py-3.5 px-4">
                    <Link
                      href={`/doctor/patients/${p.id}`}
                      className="text-apple-blue font-medium text-xs hover:underline"
                    >
                      View History
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
