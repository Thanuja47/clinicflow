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
        const res = await fetch(`/api/patients?q=${encodeURIComponent(searchPatient)}&limit=10`);
        const data = await res.json();
        if (data?.patients && Array.isArray(data.patients)) setPatientResults(data.patients);
        else setPatientResults([]);
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
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="apple-title">Appointments Management</h1>
          <p className="apple-caption mt-1">Schedule and manage patient appointments</p>
        </div>
        <button
          onClick={() => {
            setShowModal(true);
            setSuccessMsg('');
            setErrorMsg('');
          }}
          className="apple-btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Book Appointment
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-apple-green/10 border border-apple-green/20 rounded-apple-lg text-apple-green text-sm flex items-center gap-3 font-medium">
          <CheckCircle2 className="w-5 h-5 text-apple-green shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="apple-card p-4 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-apple-muted" />
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="apple-input text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="apple-caption">Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="apple-input text-xs"
          >
            <option value="">All statuses</option>
            <option value="BOOKED">Booked</option>
            <option value="CHECKED_IN">Checked In</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Appointments List */}
      <div className="apple-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-apple-text">
            <thead>
              <tr className="border-b border-apple-border text-apple-muted text-xs font-semibold">
                <th className="px-6 py-3.5">Queue #</th>
                <th className="px-6 py-3.5">Time</th>
                <th className="px-6 py-3.5">Patient</th>
                <th className="px-6 py-3.5">Doctor</th>
                <th className="px-6 py-3.5">Branch</th>
                <th className="px-6 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-apple-border">
              {appointments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center apple-caption">
                    No appointments scheduled for this date.
                  </td>
                </tr>
              ) : (
                appointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-apple-secondary/40 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-apple-blue">#{apt.queueNumber}</td>
                    <td className="px-6 py-4 text-apple-muted text-xs">
                      {new Date(apt.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-apple-text">{apt.patient.fullName}</div>
                      <div className="text-xs text-apple-muted">{apt.patient.phone}</div>
                    </td>
                    <td className="px-6 py-4 text-apple-text text-xs">Dr. {apt.doctor.name}</td>
                    <td className="px-6 py-4 text-apple-muted text-xs">{apt.branch.name}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`apple-pill ${
                          apt.status === 'BOOKED'
                            ? 'apple-pill-blue'
                            : apt.status === 'CHECKED_IN'
                            ? 'apple-pill-orange'
                            : apt.status === 'IN_PROGRESS'
                            ? 'apple-pill-purple'
                            : apt.status === 'COMPLETED'
                            ? 'apple-pill-green'
                            : 'apple-pill-red'
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
        <div className="fixed inset-0 apple-modal-overlay flex items-center justify-center p-4 z-50">
          <div className="apple-modal-card w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-apple-border pb-3">
              <h2 className="apple-section-header">Book New Appointment</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-apple-muted hover:text-apple-text text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBookAppointment} className="space-y-4">
              {errorMsg && (
                <div className="p-3 bg-apple-red/10 border border-apple-red/20 rounded-apple-md text-apple-red text-xs font-medium">
                  {errorMsg}
                </div>
              )}

              {/* Patient Selector */}
              <div>
                <label className="block apple-caption mb-1 font-medium">
                  Select patient *
                </label>
                {selectedPatient ? (
                  <div className="flex items-center justify-between p-3 bg-apple-secondary border border-apple-green/40 rounded-apple-md">
                    <div>
                      <div className="font-semibold text-apple-text text-sm">{selectedPatient.fullName}</div>
                      <div className="text-xs text-apple-muted">{selectedPatient.phone} {selectedPatient.nic ? `| NIC: ${selectedPatient.nic}` : ''}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedPatient(null)}
                      className="text-xs text-apple-red font-medium hover:underline"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-apple-muted" />
                    <input
                      type="text"
                      placeholder="Search patient by name, phone, or NIC..."
                      value={searchPatient}
                      onChange={(e) => setSearchPatient(e.target.value)}
                      className="w-full apple-input pl-9"
                    />
                    {patientResults.length > 0 && (
                      <div className="absolute z-10 w-full bg-apple-surface border border-apple-border rounded-apple-md mt-1 max-h-48 overflow-y-auto shadow-xl divide-y divide-apple-border">
                        {patientResults.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setSelectedPatient(p);
                              setPatientResults([]);
                              setSearchPatient('');
                            }}
                            className="w-full text-left p-3 hover:bg-apple-secondary/60 transition-colors"
                          >
                            <div className="font-semibold text-apple-text text-sm">{p.fullName}</div>
                            <div className="text-xs text-apple-muted">{p.phone} {p.nic ? `| NIC: ${p.nic}` : ''}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Branch Selector */}
              <div>
                <label className="block apple-caption mb-1 font-medium">
                  Branch *
                </label>
                <select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  className="w-full apple-input"
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
                <label className="block apple-caption mb-1 font-medium">
                  Doctor *
                </label>
                <select
                  value={doctorId}
                  onChange={(e) => setDoctorId(e.target.value)}
                  className="w-full apple-input"
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
                  <label className="block apple-caption mb-1 font-medium">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full apple-input"
                    required
                  />
                </div>
                <div>
                  <label className="block apple-caption mb-1 font-medium">
                    Time *
                  </label>
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full apple-input"
                    required
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block apple-caption mb-1 font-medium">
                  Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Reason for visit, symptoms..."
                  className="w-full apple-input resize-none"
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="apple-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="apple-btn-primary disabled:opacity-50"
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
