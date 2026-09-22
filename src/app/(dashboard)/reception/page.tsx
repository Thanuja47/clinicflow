'use client';
import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Stethoscope, CheckCircle, AlertCircle, Activity } from 'lucide-react';

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
    <div className="p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="apple-title flex items-center gap-2.5">
            Live Queue Board
            <span className="apple-pill apple-pill-green flex items-center gap-1.5 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-apple-green animate-pulse" />
              Live 10s Polling
            </span>
          </h1>
          <p className="apple-caption mt-1">Real-time patient flow & queue management</p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="apple-input text-xs"
          />
          <select
            value={selectedDoctor}
            onChange={(e) => setSelectedDoctor(e.target.value)}
            className="apple-input text-xs"
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
            className="apple-btn-secondary p-2 flex items-center justify-center"
            title="Refresh Queue"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="apple-card p-4">
          <div className="apple-caption">Total today</div>
          <div className="text-2xl font-bold text-apple-text mt-1">{counts.total}</div>
        </div>
        <div className="apple-card p-4">
          <div className="apple-caption font-medium text-apple-blue">Booked</div>
          <div className="text-2xl font-bold text-apple-blue mt-1">{counts.booked}</div>
        </div>
        <div className="apple-card p-4">
          <div className="apple-caption font-medium text-apple-orange">Waiting in clinic</div>
          <div className="text-2xl font-bold text-apple-orange mt-1">{counts.waiting}</div>
        </div>
        <div className="apple-card p-4">
          <div className="apple-caption font-medium text-apple-purple">In consultation</div>
          <div className="text-2xl font-bold text-apple-purple mt-1">{counts.inProgress}</div>
        </div>
        <div className="apple-card p-4">
          <div className="apple-caption font-medium text-apple-green">Completed</div>
          <div className="text-2xl font-bold text-apple-green mt-1">{counts.completed}</div>
        </div>
        <div className="apple-card p-4">
          <div className="apple-caption font-medium text-apple-red">Cancelled</div>
          <div className="text-2xl font-bold text-apple-red mt-1">{counts.cancelled}</div>
        </div>
      </div>

      {/* Queue List Table */}
      <div className="apple-card overflow-hidden">
        <div className="p-4 border-b border-apple-border flex justify-between items-center bg-apple-secondary/30">
          <h2 className="text-sm font-semibold text-apple-text flex items-center gap-2">
            <Activity className="w-4 h-4 text-apple-blue" /> Patient Sequence List
          </h2>
          <span className="apple-caption text-xs">
            Ordered by Queue Number
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-apple-text">
            <thead>
              <tr className="border-b border-apple-border text-apple-muted text-xs font-semibold">
                <th className="px-6 py-3.5">Q#</th>
                <th className="px-6 py-3.5">Patient</th>
                <th className="px-6 py-3.5">Scheduled Time</th>
                <th className="px-6 py-3.5">Doctor</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-apple-border">
              {queue.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center apple-caption">
                    No appointments in queue for selected filters.
                  </td>
                </tr>
              ) : (
                queue.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-apple-secondary/40 transition-colors"
                  >
                    <td className="px-6 py-4 font-mono font-bold text-base text-apple-blue">
                      #{item.queueNumber}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-apple-text">{item.patient.fullName}</div>
                      <div className="text-xs text-apple-muted">{item.patient.phone}</div>
                      {item.patient.allergies && (
                        <span className="apple-pill apple-pill-red text-[10px] mt-1 inline-flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Allergy: {item.patient.allergies}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-apple-muted text-xs">
                      {new Date(item.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4 font-medium text-apple-text text-xs">
                      Dr. {item.doctor.name}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`apple-pill ${
                          item.status === 'BOOKED'
                            ? 'apple-pill-blue'
                            : item.status === 'CHECKED_IN'
                            ? 'apple-pill-orange'
                            : item.status === 'IN_PROGRESS'
                            ? 'apple-pill-purple'
                            : item.status === 'COMPLETED'
                            ? 'apple-pill-green'
                            : 'apple-pill-red'
                        }`}
                      >
                        {item.status === 'CHECKED_IN' ? 'Waiting' : item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {item.status === 'BOOKED' && (
                          <button
                            onClick={() => updateStatus(item.id, 'CHECKED_IN')}
                            disabled={updatingId === item.id}
                            className="apple-btn-secondary text-xs py-1 px-3 text-apple-orange"
                          >
                            Check In
                          </button>
                        )}

                        {item.status === 'CHECKED_IN' && (
                          <button
                            onClick={() => updateStatus(item.id, 'IN_PROGRESS')}
                            disabled={updatingId === item.id}
                            className="apple-btn-primary text-xs py-1 px-3 flex items-center gap-1"
                          >
                            <Stethoscope className="w-3.5 h-3.5" /> Call In
                          </button>
                        )}

                        {item.status === 'IN_PROGRESS' && (
                          <button
                            onClick={() => updateStatus(item.id, 'COMPLETED')}
                            disabled={updatingId === item.id}
                            className="apple-btn-secondary text-xs py-1 px-3 text-apple-green flex items-center gap-1"
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> Complete
                          </button>
                        )}

                        {item.status !== 'COMPLETED' && item.status !== 'CANCELLED' && (
                          <button
                            onClick={() => updateStatus(item.id, 'CANCELLED')}
                            disabled={updatingId === item.id}
                            className="apple-btn-secondary text-xs py-1 px-2.5 text-apple-red hover:bg-apple-red/10"
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
