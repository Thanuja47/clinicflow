'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Stethoscope,
  Plus,
  Trash2,
  Printer,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowLeft,
  FileText,
  BookmarkPlus
} from 'lucide-react';

interface Patient {
  id: string;
  fullName: string;
  phone: string;
  nic?: string;
  dob?: string;
  gender?: string;
  address?: string;
  allergies?: string;
}

interface Appointment {
  id: string;
  scheduledAt: string;
  status: string;
  queueNumber: number;
  doctor: { name: string };
  branch: { name: string };
}

interface Visit {
  id: string;
  diagnosis?: string;
  notes?: string;
  visitDate: string;
  doctor?: { name: string };
  prescriptions: {
    id: string;
    medicineName: string;
    dosage: string;
    duration: string;
    instructions?: string;
  }[];
  appointment?: { queueNumber: number; scheduledAt: string };
}

interface MedicineItem {
  medicineName: string;
  dosage: string;
  duration: string;
  instructions: string;
}

interface PrescriptionTemplate {
  id: string;
  name: string;
  itemsJson: string;
}

export default function DoctorPatientConsultationPage() {
  const params = useParams();
  const patientId = params.id as string;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [templates, setTemplates] = useState<PrescriptionTemplate[]>([]);

  const [activeTab, setActiveTab] = useState<'consultation' | 'history'>('consultation');
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string>('');

  // Consultation Form State
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [medicines, setMedicines] = useState<MedicineItem[]>([
    { medicineName: '', dosage: '1 tab', duration: '5 days', instructions: 'After meals (1-0-1)' },
  ]);

  const [templateName, setTemplateName] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [savingVisit, setSavingVisit] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchPatientData = useCallback(async () => {
    try {
      const [pRes, vRes, tRes] = await Promise.all([
        fetch(`/api/patients/${patientId}`),
        fetch(`/api/visits?patientId=${patientId}`),
        fetch('/api/prescriptions/templates'),
      ]);

      if (pRes.ok) {
        const pData = await pRes.json();
        setPatient(pData);
        if (pData.appointments) {
          setAppointments(pData.appointments);
          const pending = pData.appointments.find(
            (a: Appointment) => a.status === 'IN_PROGRESS' || a.status === 'CHECKED_IN' || a.status === 'BOOKED'
          );
          if (pending) setSelectedAppointmentId(pending.id);
        }
      }

      if (vRes.ok) {
        const vData = await vRes.json();
        if (Array.isArray(vData)) setVisits(vData);
      }

      if (tRes.ok) {
        const tData = await tRes.json();
        if (Array.isArray(tData)) setTemplates(tData);
      }
    } catch (err) {
      console.error(err);
    }
  }, [patientId]);

  useEffect(() => {
    if (patientId) fetchPatientData();
  }, [patientId, fetchPatientData]);

  function addMedicineRow() {
    setMedicines([
      ...medicines,
      { medicineName: '', dosage: '1 tab', duration: '5 days', instructions: 'After meals (1-0-1)' },
    ]);
  }

  function removeMedicineRow(index: number) {
    setMedicines(medicines.filter((_, i) => i !== index));
  }

  function updateMedicine(index: number, field: keyof MedicineItem, value: string) {
    const updated = [...medicines];
    updated[index][field] = value;
    setMedicines(updated);
  }

  function loadTemplate(templateId: string) {
    const t = templates.find((tmp) => tmp.id === templateId);
    if (t) {
      try {
        const parsed = JSON.parse(t.itemsJson);
        if (Array.isArray(parsed)) {
          setMedicines(parsed);
        }
      } catch (err) {
        console.error('Failed to parse template JSON', err);
      }
    }
  }

  async function handleSaveTemplate() {
    if (!templateName.trim()) {
      setErrorMsg('Please enter a template name');
      return;
    }
    setSavingTemplate(true);
    try {
      const res = await fetch('/api/prescriptions/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: templateName, items: medicines }),
      });
      if (res.ok) {
        setSuccessMsg(`Template "${templateName}" saved successfully!`);
        setTemplateName('');
        const tRes = await fetch('/api/prescriptions/templates');
        const tData = await tRes.json();
        if (Array.isArray(tData)) setTemplates(tData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingTemplate(false);
    }
  }

  async function handleSaveVisit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedAppointmentId) {
      setErrorMsg('Please select an active appointment for this visit.');
      return;
    }

    const validMeds = medicines.filter((m) => m.medicineName.trim() !== '');

    setSavingVisit(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: selectedAppointmentId,
          patientId,
          diagnosis,
          notes,
          medicines: validMeds,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save visit record');

      setSuccessMsg('Consultation & Prescription saved successfully!');
      fetchPatientData();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Failed to save consultation');
      }
    } finally {
      setSavingVisit(false);
    }
  }

  const age = patient?.dob
    ? Math.floor((Date.now() - new Date(patient.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  return (
    <div className="p-6 space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/doctor"
          className="inline-flex items-center gap-2 text-sm text-apple-muted hover:text-apple-text transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Doctor Dashboard
        </Link>
        <button
          onClick={() => window.print()}
          className="no-print apple-btn-secondary text-xs flex items-center gap-2"
        >
          <Printer className="w-4 h-4" /> Print Prescription
        </button>
      </div>

      {/* Printable Area (Visible during printing) */}
      <div className="print-only hidden print:block p-8 text-black bg-white">
        <div className="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold uppercase">LankaCare Private Clinic</h1>
            <p className="text-sm">Colombo Main Branch · Tel: +94 11 234 5678</p>
          </div>
          <div className="text-right">
            <h2 className="text-lg font-bold">PRESCRIPTION</h2>
            <p className="text-xs">Date: {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {patient && (
          <div className="mb-6 grid grid-cols-2 gap-4 text-sm border-b pb-4">
            <div>
              <p><strong>Patient Name:</strong> {patient.fullName}</p>
              <p><strong>Phone:</strong> {patient.phone}</p>
            </div>
            <div>
              {patient.nic && <p><strong>NIC:</strong> {patient.nic}</p>}
              {age && <p><strong>Age:</strong> {age} yrs</p>}
            </div>
          </div>
        )}

        {diagnosis && (
          <div className="mb-6">
            <p className="text-sm font-bold">Diagnosis / Notes:</p>
            <p className="text-sm italic">{diagnosis}</p>
          </div>
        )}

        <div className="mb-8">
          <h3 className="text-lg font-bold font-serif mb-3">Rx</h3>
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-black">
                <th className="py-2">#</th>
                <th className="py-2">Medicine</th>
                <th className="py-2">Dosage</th>
                <th className="py-2">Frequency / Instructions</th>
                <th className="py-2">Duration</th>
              </tr>
            </thead>
            <tbody>
              {medicines.filter((m) => m.medicineName.trim() !== '').map((m, i) => (
                <tr key={i} className="border-b border-gray-200">
                  <td className="py-2.5 font-bold">{i + 1}</td>
                  <td className="py-2.5 font-semibold">{m.medicineName}</td>
                  <td className="py-2.5">{m.dosage}</td>
                  <td className="py-2.5">{m.instructions}</td>
                  <td className="py-2.5">{m.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-16 flex justify-between items-end text-xs pt-8 border-t border-gray-300">
          <div>Doctor Signature & Stamp</div>
          <div className="text-right">Thank you for visiting LankaCare Clinic</div>
        </div>
      </div>

      {/* On Screen View */}
      {patient && (
        <div className="no-print space-y-6">
          {/* Patient Profile Card */}
          <div className="apple-card p-6 flex flex-wrap items-center justify-between gap-6">
            <div className="space-y-1">
              <span className="apple-pill apple-pill-blue text-xs font-semibold">
                PATIENT RECORD
              </span>
              <h1 className="text-2xl font-bold text-apple-text mt-1">{patient.fullName}</h1>
              <div className="flex flex-wrap gap-4 text-xs text-apple-muted pt-1">
                <span>Phone: <strong className="text-apple-text">{patient.phone}</strong></span>
                {patient.nic && <span>NIC: <strong className="text-apple-text">{patient.nic}</strong></span>}
                {age && <span>Age: <strong className="text-apple-text">{age} yrs</strong></span>}
                {patient.gender && <span>Gender: <strong className="text-apple-text">{patient.gender}</strong></span>}
              </div>
            </div>

            {patient.allergies && (
              <div className="p-3.5 bg-apple-orange/10 border border-apple-orange/20 rounded-apple-md text-apple-orange text-xs flex items-center gap-2 max-w-md font-medium">
                <AlertCircle className="w-5 h-5 shrink-0 text-apple-orange" />
                <div>
                  <strong>Allergy Warning:</strong> {patient.allergies}
                </div>
              </div>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-apple-border gap-6">
            <button
              onClick={() => setActiveTab('consultation')}
              className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === 'consultation'
                  ? 'border-apple-blue text-apple-blue'
                  : 'border-transparent text-apple-muted hover:text-apple-text'
              }`}
            >
              <Stethoscope className="w-4 h-4" /> New Consultation & Prescription
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === 'history'
                  ? 'border-apple-blue text-apple-blue'
                  : 'border-transparent text-apple-muted hover:text-apple-text'
              }`}
            >
              <Clock className="w-4 h-4" /> Medical History ({visits.length})
            </button>
          </div>

          {/* Notifications */}
          {successMsg && (
            <div className="p-4 bg-apple-green/10 border border-apple-green/20 rounded-apple-md text-apple-green text-sm flex items-center gap-3 font-medium">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
          {errorMsg && (
            <div className="p-4 bg-apple-red/10 border border-apple-red/20 rounded-apple-md text-apple-red text-sm flex items-center gap-3 font-medium">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TAB 1: CONSULTATION & PRESCRIPTION WRITER */}
          {activeTab === 'consultation' && (
            <form onSubmit={handleSaveVisit} className="space-y-6">
              {/* Appointment Link Selector */}
              <div className="apple-card p-4 space-y-2">
                <label className="block apple-caption font-medium">
                  Select associated today&apos;s appointment *
                </label>
                <select
                  value={selectedAppointmentId}
                  onChange={(e) => setSelectedAppointmentId(e.target.value)}
                  className="w-full apple-input"
                  required
                >
                  <option value="">-- Select Appointment --</option>
                  {appointments.map((a) => (
                    <option key={a.id} value={a.id}>
                      Queue #{a.queueNumber} - {new Date(a.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({a.status})
                    </option>
                  ))}
                </select>
              </div>

              {/* Diagnosis & Clinical Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="apple-card p-5 space-y-2">
                  <label className="block apple-caption font-medium">
                    Diagnosis / chief complaint
                  </label>
                  <textarea
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    placeholder="e.g. Acute Upper Respiratory Tract Infection..."
                    className="w-full apple-input resize-none"
                    rows={3}
                  />
                </div>

                <div className="apple-card p-5 space-y-2">
                  <label className="block apple-caption font-medium">
                    Clinical notes / vitals
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. BP: 120/80, Temp: 98.6°F, Advice rest..."
                    className="w-full apple-input resize-none"
                    rows={3}
                  />
                </div>
              </div>

              {/* Prescription Builder */}
              <div className="apple-card p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-apple-border pb-4">
                  <div>
                    <h3 className="text-base font-semibold text-apple-text flex items-center gap-2">
                      <FileText className="w-4 h-4 text-apple-blue" /> Prescription Builder (Rx)
                    </h3>
                    <p className="apple-caption mt-0.5">Add medications and dosage instructions for patient</p>
                  </div>

                  {/* Template Quick-Load Dropdown */}
                  {templates.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="apple-caption">Quick Template:</span>
                      <select
                        onChange={(e) => {
                          if (e.target.value) loadTemplate(e.target.value);
                        }}
                        className="apple-input text-xs"
                      >
                        <option value="">Load Saved Template...</option>
                        {templates.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Medicine Items List */}
                <div className="space-y-3">
                  {medicines.map((med, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-3 bg-apple-secondary/50 border border-apple-border rounded-apple-md items-center"
                    >
                      <div className="sm:col-span-4">
                        <input
                          type="text"
                          placeholder="Medicine Name (e.g. Paracetamol)"
                          value={med.medicineName}
                          onChange={(e) => updateMedicine(index, 'medicineName', e.target.value)}
                          className="w-full apple-input"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          placeholder="Dosage (e.g. 500mg)"
                          value={med.dosage}
                          onChange={(e) => updateMedicine(index, 'dosage', e.target.value)}
                          className="w-full apple-input"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <input
                          type="text"
                          placeholder="Instructions (e.g. 1-0-1 after meals)"
                          value={med.instructions}
                          onChange={(e) => updateMedicine(index, 'instructions', e.target.value)}
                          className="w-full apple-input"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          placeholder="Duration (e.g. 5 days)"
                          value={med.duration}
                          onChange={(e) => updateMedicine(index, 'duration', e.target.value)}
                          className="w-full apple-input"
                        />
                      </div>
                      <div className="sm:col-span-1 text-right">
                        <button
                          type="button"
                          onClick={() => removeMedicineRow(index)}
                          className="text-apple-muted hover:text-apple-red p-1.5 transition-colors"
                          title="Remove row"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                  <button
                    type="button"
                    onClick={addMedicineRow}
                    className="apple-btn-secondary text-xs flex items-center gap-1.5 text-apple-blue"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Medicine Row
                  </button>

                  {/* Save as Template modal/form inline */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Template name..."
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      className="apple-input text-xs py-1.5"
                    />
                    <button
                      type="button"
                      onClick={handleSaveTemplate}
                      disabled={savingTemplate}
                      className="apple-btn-secondary text-xs py-1.5 flex items-center gap-1"
                    >
                      <BookmarkPlus className="w-3.5 h-3.5 text-apple-orange" /> Save Template
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit Consultation */}
              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="submit"
                  disabled={savingVisit}
                  className="apple-btn-primary py-3 px-6 text-sm flex items-center gap-2 shadow-lg disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {savingVisit ? 'Saving Consultation...' : 'Complete Consultation & Save Rx'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: MEDICAL HISTORY TIMELINE */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              {visits.length === 0 ? (
                <div className="apple-card p-8 text-center apple-caption">
                  No previous consultation records found for this patient.
                </div>
              ) : (
                visits.map((v) => (
                  <div key={v.id} className="apple-card p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-apple-border pb-3">
                      <div>
                        <div className="font-semibold text-apple-text text-sm">
                          Visit Date: {new Date(v.visitDate).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-apple-muted">
                          Dr. {v.doctor?.name || 'Doctor'} {v.appointment ? `· Queue #${v.appointment.queueNumber}` : ''}
                        </div>
                      </div>
                    </div>

                    {v.diagnosis && (
                      <div>
                        <div className="apple-caption font-semibold">Diagnosis</div>
                        <p className="text-sm text-apple-text mt-1">{v.diagnosis}</p>
                      </div>
                    )}

                    {v.notes && (
                      <div>
                        <div className="apple-caption font-semibold">Clinical notes</div>
                        <p className="text-sm text-apple-muted mt-1">{v.notes}</p>
                      </div>
                    )}

                    {v.prescriptions && v.prescriptions.length > 0 && (
                      <div>
                        <div className="apple-caption font-semibold mb-2">Prescribed medicines</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {v.prescriptions.map((rx) => (
                            <div key={rx.id} className="p-2.5 bg-apple-secondary/50 border border-apple-border rounded-apple-md text-xs">
                              <div className="font-semibold text-apple-blue">{rx.medicineName} ({rx.dosage})</div>
                              <div className="text-apple-muted mt-0.5">{rx.instructions} · {rx.duration}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
