'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { UserCheck, Stethoscope, AlertCircle, ArrowRight, Phone, Calendar } from 'lucide-react';

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
  branch: { id: string; name: string };
}

export default function DoctorDashboard() {
  const [queue, setQueue] = useState<QueueItem[]>([]);

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(() => {
      fetchQueue();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  async function fetchQueue() {
    try {
      const res = await fetch('/api/queue');
      const data = await res.json();
      if (data.queue) {
        setQueue(data.queue);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function startConsultation(appointmentId: string) {
    try {
      await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'IN_PROGRESS' }),
      });
      fetchQueue();
    } catch (err) {
      console.error(err);
    }
  }

  const activePatient = queue.find((q) => q.status === 'IN_PROGRESS');
  const waitingPatients = queue.filter((q) => q.status === 'CHECKED_IN');
  const upcomingPatients = queue.filter((q) => q.status === 'BOOKED' || q.status === 'CONFIRMED');

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-900/40 via-slate-900 to-slate-900 border border-emerald-500/20 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              Doctor Consultation Desk
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Manage your clinic consultations, prescriptions, and patient history records.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2 text-right">
              <div className="text-xs text-slate-400">Total Today</div>
              <div className="text-xl font-bold text-emerald-400">{queue.length}</div>
            </div>
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2 text-right">
              <div className="text-xs text-slate-400">Waiting</div>
              <div className="text-xl font-bold text-amber-400">{waitingPatients.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Currently In Consultation (Active Card) */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
          <Stethoscope className="w-4 h-4 text-purple-400" /> Active Consultation
        </h2>

        {activePatient ? (
          <div className="bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-900 border border-purple-500/30 rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="bg-purple-500/20 text-purple-300 font-mono font-bold text-lg px-3 py-1 rounded-lg border border-purple-500/30">
                    Queue #{activePatient.queueNumber}
                  </span>
                  <span className="bg-purple-500/10 text-purple-400 text-xs px-2.5 py-1 rounded-full font-medium border border-purple-500/20 animate-pulse">
                    IN CONSULTATION
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-slate-100">{activePatient.patient.fullName}</h3>
                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-slate-500" /> {activePatient.patient.phone}
                  </span>
                  {activePatient.patient.nic && (
                    <span>NIC: {activePatient.patient.nic}</span>
                  )}
                  {activePatient.patient.gender && (
                    <span>Gender: {activePatient.patient.gender}</span>
                  )}
                </div>

                {activePatient.patient.allergies && (
                  <div className="p-3 bg-amber-950/40 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex items-center gap-2 max-w-lg mt-2">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span><strong>Known Allergies:</strong> {activePatient.patient.allergies}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                <Link
                  href={`/doctor/patients/${activePatient.patient.id}`}
                  className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors shadow-lg shadow-purple-900/30"
                >
                  Open Medical Record & Write Rx <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
            <p className="text-slate-400 text-sm">No patient is currently in consultation.</p>
            {waitingPatients.length > 0 && (
              <p className="text-emerald-400 text-xs mt-1">
                {waitingPatients.length} patient(s) waiting in the lobby. Call next patient below.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Waiting Room Queue & Upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Waiting Room (Checked In) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-amber-400" /> Waiting Room ({waitingPatients.length})
            </h3>
            <span className="text-xs text-amber-400">Checked In</span>
          </div>

          <div className="space-y-3">
            {waitingPatients.length === 0 ? (
              <p className="text-slate-500 text-xs py-4 text-center">No patients waiting in lobby.</p>
            ) : (
              waitingPatients.map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-slate-800/60 border border-slate-700/60 rounded-xl flex items-center justify-between gap-4 hover:border-slate-600 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-amber-400 text-base bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-500/20">
                      #{item.queueNumber}
                    </span>
                    <div>
                      <div className="font-semibold text-slate-100 text-sm">{item.patient.fullName}</div>
                      <div className="text-xs text-slate-400">{item.patient.phone}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => startConsultation(item.id)}
                      className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                    >
                      Call In <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Booked / Upcoming */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" /> Booked / Scheduled Today ({upcomingPatients.length})
            </h3>
            <span className="text-xs text-blue-400">Not Yet Arrived</span>
          </div>

          <div className="space-y-3">
            {upcomingPatients.length === 0 ? (
              <p className="text-slate-500 text-xs py-4 text-center">No upcoming appointments remaining today.</p>
            ) : (
              upcomingPatients.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-slate-800/40 border border-slate-800 rounded-xl flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-slate-400 text-xs bg-slate-800 px-2 py-1 rounded">
                      #{item.queueNumber}
                    </span>
                    <div>
                      <div className="font-medium text-slate-200 text-sm">{item.patient.fullName}</div>
                      <div className="text-xs text-slate-400">
                        Scheduled: {new Date(item.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/doctor/patients/${item.patient.id}`}
                    className="text-xs text-slate-400 hover:text-slate-200 underline"
                  >
                    View History
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
