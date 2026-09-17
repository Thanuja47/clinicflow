'use client';
import { useState, useEffect, useCallback } from 'react';
import { Calendar, Plus, Search, CheckCircle2 } from 'lucide-react';

interface Patient {
  id: string;
  fullName: string;
  phone: string;
  nic?: string;
}

interface Doctor {
  id: string;
  name: string;
}

interface Branch {
  id: string;
  name: string;
}

interface Appointment {
  id: string;
  queueNumber: number;
  scheduledAt: string;
  status: string;
  notes?: string;
  patient: { id: string; fullName: string; phone: string };
  doctor: { id: string; name: string };
  branch: { id: string; name: string };
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);

  const [searchPatient, setSearchPatient] = useState('');
  const [patientResults, setPatientResults] = useState<Patient[]>([]);

  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [doctorId, setDoctorId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [notes, setNotes] = useState('');

  // Filters
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterStatus, setFilterStatus] = useState('');

  const fetchAppointments = useCallback(async () => {
    try {
      let url = `/api/appointments?date=${filterDate}`;
      if (filterStatus) url += `&status=${filterStatus}`;
      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data)) setAppointments(data);
    } catch (err) {
      console.error(err);
    }
  }, [filterDate, filterStatus]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  async function fetchInitialData() {
    try {
      const [docRes, branchRes] = await Promise.all([
        fetch('/api/staff?role=DOCTOR'),
        fetch('/api/branches'),
      ]);
      const docData = await docRes.json();
      const branchData = await branchRes.json();
      if (Array.isArray(docData)) setDoctors(docData);
      if (Array.isArray(branchData)) {
        setBranches(branchData);
        if (branchData.length > 0) setBranchId(branchData[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  }

  // Handle patient search debounce
  useEffect(() => {
    if (!searchPatient.trim()) {
      setPatientResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/patients?search=${encodeURIComponent(searchPatient)}`);
        const data = await res.json();
        if (Array.isArray(data)) setPatientResults(data);
      } catch (err) {
        console.error(err);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchPatient]);

  async function handleBookAppointment(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPatient) {
      setErrorMsg('Please select a patient');
      return;
    }
    if (!doctorId) {
      setErrorMsg('Please select a doctor');
      return;
    }
    if (!branchId) {
      setErrorMsg('Please select a branch');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const scheduledAt = `${scheduledDate}T${scheduledTime}:00`;

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: selectedPatient.id,
          doctorId,
          branchId,
          scheduledAt,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to book appointment');
      }

      setSuccessMsg(`Appointment booked successfully! Queue #${data.queueNumber}`);
      setShowModal(false);
      resetForm();
      fetchAppointments();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setSelectedPatient(null);
    setSearchPatient('');
    setNotes('');
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Appointments Management</h1>
          <p className="text-slate-400 text-sm">Schedule and manage patient appointments</p>
        </div>
        <button
          onClick={() => {
            setShowModal(true);
            setSuccessMsg('');
            setErrorMsg('');
          }}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> Book Appointment
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Statuses</option>
            <option value="BOOKED">Booked</option>
            <option value="CHECKED_IN">Checked In</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Appointments List */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-slate-400 text-xs uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Queue #</th>
                <th className="px-6 py-4">Time</th>
                <th className="px-6 py-4">Patient</th>
                <th className="px-6 py-4">Doctor</th>
                <th className="px-6 py-4">Branch</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {appointments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No appointments scheduled for this date.
                  </td>
                </tr>
              ) : (
                appointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-emerald-400">#{apt.queueNumber}</td>
                    <td className="px-6 py-4 text-slate-200">
                      {new Date(apt.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-100">{apt.patient.fullName}</div>
                      <div className="text-xs text-slate-400">{apt.patient.phone}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-300">Dr. {apt.doctor.name}</td>
                    <td className="px-6 py-4 text-slate-400">{apt.branch.name}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          apt.status === 'BOOKED'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : apt.status === 'CHECKED_IN'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : apt.status === 'IN_PROGRESS'
                            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                            : apt.status === 'COMPLETED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {apt.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Book Appointment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-slate-100">Book New Appointment</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-200 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBookAppointment} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-rose-950/60 border border-rose-500/30 rounded-lg text-rose-400 text-sm">
                  {errorMsg}
                </div>
              )}

              {/* Patient Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">
                  Select Patient *
                </label>
                {selectedPatient ? (
                  <div className="flex items-center justify-between p-3 bg-slate-800 border border-emerald-500/40 rounded-lg">
                    <div>
                      <div className="font-medium text-slate-100">{selectedPatient.fullName}</div>
                      <div className="text-xs text-slate-400">{selectedPatient.phone} {selectedPatient.nic ? `| NIC: ${selectedPatient.nic}` : ''}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedPatient(null)}
                      className="text-xs text-rose-400 hover:underline"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search patient by Name, Phone, or NIC..."
                      value={searchPatient}
                      onChange={(e) => setSearchPatient(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                    {patientResults.length > 0 && (
                      <div className="absolute z-10 w-full bg-slate-800 border border-slate-700 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-xl">
                        {patientResults.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setSelectedPatient(p);
                              setPatientResults([]);
                              setSearchPatient('');
                            }}
                            className="w-full text-left p-3 hover:bg-slate-700/50 border-b border-slate-700/50 last:border-0"
                          >
                            <div className="font-medium text-slate-200 text-sm">{p.fullName}</div>
                            <div className="text-xs text-slate-400">{p.phone} {p.nic ? `| NIC: ${p.nic}` : ''}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Branch Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">
                  Branch *
                </label>
                <select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  required
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Doctor Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">
                  Doctor *
                </label>
                <select
                  value={doctorId}
                  onChange={(e) => setDoctorId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  required
                >
                  <option value="">-- Select Doctor --</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      Dr. {d.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">
                    Time *
                  </label>
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Reason for visit, symptoms..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {loading ? 'Booking...' : 'Confirm Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
