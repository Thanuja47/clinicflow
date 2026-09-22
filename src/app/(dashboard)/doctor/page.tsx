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
    <div className="p-6 space-y-6">
      {/* Top Welcome Banner */}
      <div className="apple-card p-6 bg-gradient-to-r from-apple-blue/10 via-apple-surface to-apple-surface border-apple-blue/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="apple-title flex items-center gap-2">
              Doctor Workspace
            </h1>
            <p className="apple-caption mt-1">
              Manage consultations, clinical notes, and digital prescriptions
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-apple-surface border border-apple-border rounded-apple-md px-4 py-2 text-right shadow-sm">
              <div className="apple-caption">Total today</div>
              <div className="text-xl font-bold text-apple-blue">{queue.length}</div>
            </div>
            <div className="bg-apple-surface border border-apple-border rounded-apple-md px-4 py-2 text-right shadow-sm">
              <div className="apple-caption">Waiting</div>
              <div className="text-xl font-bold text-apple-orange">{waitingPatients.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Currently In Consultation (Active Card) */}
      <div>
        <h2 className="apple-caption font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
          <Stethoscope className="w-4 h-4 text-apple-purple" /> Active consultation
        </h2>

        {activePatient ? (
          <div className="apple-card p-6 border-apple-purple/30 bg-gradient-to-r from-apple-purple/10 via-apple-surface to-apple-surface">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-lg text-apple-purple bg-apple-purple/10 px-3 py-1 rounded-apple-pill border border-apple-purple/20">
                    Queue #{activePatient.queueNumber}
                  </span>
                  <span className="apple-pill apple-pill-purple animate-pulse">
                    IN CONSULTATION
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-apple-text">{activePatient.patient.fullName}</h3>
                <div className="flex flex-wrap items-center gap-4 text-sm text-apple-muted">
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-apple-muted" /> {activePatient.patient.phone}
                  </span>
                  {activePatient.patient.nic && (
                    <span>NIC: {activePatient.patient.nic}</span>
                  )}
                  {activePatient.patient.gender && (
                    <span>Gender: {activePatient.patient.gender}</span>
                  )}
                </div>

                {activePatient.patient.allergies && (
                  <div className="p-3 bg-apple-orange/10 border border-apple-orange/20 rounded-apple-md text-apple-orange text-xs flex items-center gap-2 max-w-lg mt-2 font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span><strong>Known Allergies:</strong> {activePatient.patient.allergies}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                <Link
                  href={`/doctor/patients/${activePatient.patient.id}`}
                  className="apple-btn-primary py-3 px-5 text-sm flex items-center justify-center gap-2 shadow-md"
                >
                  Open Record & Write Rx <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="apple-card p-8 text-center">
            <p className="apple-caption">No patient is currently in consultation.</p>
            {waitingPatients.length > 0 && (
              <p className="text-apple-green text-xs font-semibold mt-1">
                {waitingPatients.length} patient(s) waiting in lobby. Call next patient below.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Waiting Room Queue & Upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Waiting Room (Checked In) */}
        <div className="apple-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-apple-border pb-3">
            <h3 className="text-sm font-semibold text-apple-text flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-apple-orange" /> Waiting Room ({waitingPatients.length})
            </h3>
            <span className="apple-pill apple-pill-orange text-[11px]">Checked In</span>
          </div>

          <div className="space-y-3">
            {waitingPatients.length === 0 ? (
              <p className="apple-caption py-4 text-center">No patients waiting in lobby.</p>
            ) : (
              waitingPatients.map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-apple-secondary/50 border border-apple-border rounded-apple-md flex items-center justify-between gap-4 hover:border-apple-border-hover transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-apple-orange text-base bg-apple-orange/10 px-2.5 py-1 rounded-apple-pill border border-apple-orange/20">
                      #{item.queueNumber}
                    </span>
                    <div>
                      <div className="font-semibold text-apple-text text-sm">{item.patient.fullName}</div>
                      <div className="text-xs text-apple-muted">{item.patient.phone}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => startConsultation(item.id)}
                      className="apple-btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
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
        <div className="apple-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-apple-border pb-3">
            <h3 className="text-sm font-semibold text-apple-text flex items-center gap-2">
              <Calendar className="w-4 h-4 text-apple-blue" /> Scheduled Today ({upcomingPatients.length})
            </h3>
            <span className="apple-pill apple-pill-blue text-[11px]">Upcoming</span>
          </div>

          <div className="space-y-3">
            {upcomingPatients.length === 0 ? (
              <p className="apple-caption py-4 text-center">No upcoming appointments remaining today.</p>
            ) : (
              upcomingPatients.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-apple-secondary/30 border border-apple-border rounded-apple-md flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-apple-muted text-xs bg-apple-secondary px-2 py-1 rounded">
                      #{item.queueNumber}
                    </span>
                    <div>
                      <div className="font-semibold text-apple-text text-sm">{item.patient.fullName}</div>
                      <div className="text-xs text-apple-muted">
                        Scheduled: {new Date(item.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/doctor/patients/${item.patient.id}`}
                    className="text-xs text-apple-blue font-medium hover:underline"
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
