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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, NIC or phone..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm focus:border-sky-500 outline-none transition"
            />
          </div>
          <Link
            href="/reception/patients/new"
            className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            <UserPlus className="w-4 h-4" />
            New Patient
          </Link>
        </div>

        <p className="text-xs text-slate-400">
          {loading ? 'Searching...' : `${total} patient${total !== 1 ? 's' : ''} found`}
        </p>

        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/50 uppercase text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3">Patient Name</th>
                <th className="p-3">NIC</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Gender</th>
                <th className="p-3">Registered</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {patients.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    {query ? `No patients found matching "${query}"` : 'No patients registered yet.'}
                  </td>
                </tr>
              )}
              {patients.map((p) => (
                <tr key={p.id} className="hover:bg-slate-800/30 transition">
                  <td className="p-3 font-medium text-slate-100">{p.fullName}</td>
                  <td className="p-3 font-mono text-slate-400">{p.nic || '—'}</td>
                  <td className="p-3 text-slate-300">{p.phone}</td>
                  <td className="p-3 text-slate-400">{p.gender || '—'}</td>
                  <td className="p-3 text-slate-400">{new Date(p.createdAt).toLocaleDateString()}</td>
                  <td className="p-3">
                    <Link
                      href={`/doctor/patients/${p.id}`}
                      className="text-sky-400 hover:text-sky-300 font-medium text-xs underline underline-offset-2 transition"
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
