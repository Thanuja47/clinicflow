'use client';
import { useState, useEffect, useCallback } from 'react';
import { Users, RefreshCw, Stethoscope, CheckCircle, AlertCircle } from 'lucide-react';

interface QueueItem {
  id: string;
  queueNumber: number;
  scheduledAt: string;
  status: string;
  notes?: string;
  patient: {
    id: string;
    fullName: string;
    phone: string;
    nic?: string;
    dob?: string;
    gender?: string;
    allergies?: string;
  };
  doctor: { id: string; name: string };
  branch: { id: string; name: string };
}

interface QueueCounts {
  total: number;
  booked: number;
  waiting: number;
  inProgress: number;
  completed: number;
  cancelled: number;
}

export default function ReceptionQueuePage() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [counts, setCounts] = useState<QueueCounts>({
    total: 0,
    booked: 0,
    waiting: 0,
    inProgress: 0,
    completed: 0,
    cancelled: 0,
  });

  const [doctors, setDoctors] = useState<{ id: string; name: string }[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchQueue = useCallback(async (showLoadingSpinner = true) => {
    if (showLoadingSpinner) setLoading(true);
    try {
      let url = `/api/queue?date=${selectedDate}`;
      if (selectedDoctor) url += `&doctorId=${selectedDoctor}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.queue) {
        setQueue(data.queue);
        setCounts(data.counts);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (showLoadingSpinner) setLoading(false);
    }
  }, [selectedDate, selectedDoctor]);

  useEffect(() => {
    fetchQueue(true);
    const interval = setInterval(() => {
      fetchQueue(false);
    }, 10000); // 10s polling
    return () => clearInterval(interval);
  }, [fetchQueue]);

  async function fetchDoctors() {
    try {
      const res = await fetch('/api/staff?role=DOCTOR');
      const data = await res.json();
      if (Array.isArray(data)) setDoctors(data);
    } catch (err) {
      console.error(err);
    }
  }

  async function updateStatus(appointmentId: string, newStatus: string) {
    setUpdatingId(appointmentId);
    try {
      const res = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchQueue(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            Live Queue Board
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-1.5" />
              Live 10s Polling
            </span>
          </h1>
          <p className="text-slate-400 text-sm">Real-time patient queue management for receptionists</p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
          />
          <select
            value={selectedDoctor}
            onChange={(e) => setSelectedDoctor(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Doctors</option>
            {doctors.map((doc) => (
              <option key={doc.id} value={doc.id}>
                Dr. {doc.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => fetchQueue(true)}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
            title="Refresh Queue"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 font-medium">Total Today</div>
          <div className="text-2xl font-bold text-slate-100 mt-1">{counts.total}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-blue-400 font-medium">Booked</div>
          <div className="text-2xl font-bold text-blue-400 mt-1">{counts.booked}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-amber-400 font-medium">Waiting in Clinic</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">{counts.waiting}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-purple-400 font-medium">In Consultation</div>
          <div className="text-2xl font-bold text-purple-400 mt-1">{counts.inProgress}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-emerald-400 font-medium">Completed</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{counts.completed}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-rose-400 font-medium">Cancelled</div>
          <div className="text-2xl font-bold text-rose-400 mt-1">{counts.cancelled}</div>
        </div>
      </div>

      {/* Queue List Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
          <h2 className="text-base font-semibold text-slate-200 flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" /> Patient Flow Sequence
          </h2>
          <span className="text-xs text-slate-400">
            Ordered by Queue Number
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-slate-400 text-xs uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Q#</th>
                <th className="px-6 py-4">Patient</th>
                <th className="px-6 py-4">Scheduled Time</th>
                <th className="px-6 py-4">Doctor</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {queue.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No appointments in queue for selected filters.
                  </td>
                </tr>
              ) : (
                queue.map((item) => (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-800/50 transition-colors ${
                      item.status === 'IN_PROGRESS'
                        ? 'bg-purple-950/20'
                        : item.status === 'CHECKED_IN'
                        ? 'bg-amber-950/20'
                        : ''
                    }`}
                  >
                    <td className="px-6 py-4 font-mono font-bold text-lg text-emerald-400">
                      #{item.queueNumber}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-100">{item.patient.fullName}</div>
                      <div className="text-xs text-slate-400">{item.patient.phone}</div>
                      {item.patient.allergies && (
                        <span className="inline-flex items-center text-[10px] text-amber-400 bg-amber-950/50 px-1.5 py-0.5 rounded mt-1 border border-amber-500/20">
                          <AlertCircle className="w-3 h-3 mr-1" /> Allergies: {item.patient.allergies}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-200">
                      {new Date(item.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      Dr. {item.doctor.name}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          item.status === 'BOOKED'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : item.status === 'CHECKED_IN'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                            : item.status === 'IN_PROGRESS'
                            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20 animate-pulse'
                            : item.status === 'COMPLETED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {item.status === 'CHECKED_IN' ? 'Waiting in Clinic' : item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {item.status === 'BOOKED' && (
                          <button
                            onClick={() => updateStatus(item.id, 'CHECKED_IN')}
                            disabled={updatingId === item.id}
                            className="bg-amber-600 hover:bg-amber-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                          >
                            Check In
                          </button>
                        )}

                        {item.status === 'CHECKED_IN' && (
                          <button
                            onClick={() => updateStatus(item.id, 'IN_PROGRESS')}
                            disabled={updatingId === item.id}
                            className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                          >
                            <Stethoscope className="w-3.5 h-3.5" /> Call In
                          </button>
                        )}

                        {item.status === 'IN_PROGRESS' && (
                          <button
                            onClick={() => updateStatus(item.id, 'COMPLETED')}
                            disabled={updatingId === item.id}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> Complete
                          </button>
                        )}

                        {item.status !== 'COMPLETED' && item.status !== 'CANCELLED' && (
                          <button
                            onClick={() => updateStatus(item.id, 'CANCELLED')}
                            disabled={updatingId === item.id}
                            className="bg-slate-800 hover:bg-rose-950 hover:text-rose-400 text-slate-400 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
