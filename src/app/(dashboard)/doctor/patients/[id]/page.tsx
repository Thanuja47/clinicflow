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
    <div className="space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/doctor"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Doctor Dashboard
        </Link>
        <button
          onClick={() => window.print()}
          className="no-print bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors border border-slate-700"
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
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-6">
            <div className="space-y-1">
              <span className="text-xs font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">
                PATIENT RECORD
              </span>
              <h1 className="text-2xl font-bold text-slate-100">{patient.fullName}</h1>
              <div className="flex flex-wrap gap-4 text-xs text-slate-400 pt-1">
                <span>Phone: <strong className="text-slate-200">{patient.phone}</strong></span>
                {patient.nic && <span>NIC: <strong className="text-slate-200">{patient.nic}</strong></span>}
                {age && <span>Age: <strong className="text-slate-200">{age} yrs</strong></span>}
                {patient.gender && <span>Gender: <strong className="text-slate-200">{patient.gender}</strong></span>}
              </div>
            </div>

            {patient.allergies && (
              <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-3.5 text-amber-300 text-xs flex items-center gap-2 max-w-md">
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <strong>Allergy Warning:</strong> {patient.allergies}
                </div>
              </div>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-800 gap-6">
            <button
              onClick={() => setActiveTab('consultation')}
              className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === 'consultation'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Stethoscope className="w-4 h-4" /> New Consultation & Prescription
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === 'history'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Clock className="w-4 h-4" /> Medical History ({visits.length})
            </button>
          </div>

          {/* Notifications */}
          {successMsg && (
            <div className="p-4 bg-emerald-950/60 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
          {errorMsg && (
            <div className="p-4 bg-rose-950/60 border border-rose-500/30 rounded-xl text-rose-400 text-sm flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TAB 1: CONSULTATION & PRESCRIPTION WRITER */}
          {activeTab === 'consultation' && (
            <form onSubmit={handleSaveVisit} className="space-y-6">
              {/* Appointment Link Selector */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
                  Select Associated Today&apos;s Appointment *
                </label>
                <select
                  value={selectedAppointmentId}
                  onChange={(e) => setSelectedAppointmentId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
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
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
                  <label className="block text-xs font-semibold text-slate-300 uppercase">
                    Diagnosis / Chief Complaint
                  </label>
                  <textarea
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    placeholder="e.g. Acute Upper Respiratory Tract Infection..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                    rows={3}
                  />
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
                  <label className="block text-xs font-semibold text-slate-300 uppercase">
                    Clinical Notes / Vitals
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. BP: 120/80, Temp: 98.6°F, Advice rest..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                    rows={3}
                  />
                </div>
              </div>

              {/* Prescription Builder */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-400" /> Prescription Builder (Rx)
                    </h3>
                    <p className="text-xs text-slate-400">Add medications and dosage instructions for patient</p>
                  </div>

                  {/* Template Quick-Load Dropdown */}
                  {templates.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">Quick Template:</span>
                      <select
                        onChange={(e) => {
                          if (e.target.value) loadTemplate(e.target.value);
                        }}
                        className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-500"
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
                      className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl items-center"
                    >
                      <div className="sm:col-span-4">
                        <input
                          type="text"
                          placeholder="Medicine Name (e.g. Paracetamol)"
                          value={med.medicineName}
                          onChange={(e) => updateMedicine(index, 'medicineName', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          placeholder="Dosage (e.g. 500mg)"
                          value={med.dosage}
                          onChange={(e) => updateMedicine(index, 'dosage', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <input
                          type="text"
                          placeholder="Instructions (e.g. 1-0-1 after meals)"
                          value={med.instructions}
                          onChange={(e) => updateMedicine(index, 'instructions', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          placeholder="Duration (e.g. 5 days)"
                          value={med.duration}
                          onChange={(e) => updateMedicine(index, 'duration', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div className="sm:col-span-1 text-right">
                        <button
                          type="button"
                          onClick={() => removeMedicineRow(index)}
                          className="text-slate-400 hover:text-rose-400 p-1.5 transition-colors"
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
                    className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-medium bg-emerald-950/40 border border-emerald-500/30 px-3 py-2 rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Medicine Row
                  </button>

                  {/* Save as Template modal/form inline */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Template Name..."
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={handleSaveTemplate}
                      disabled={savingTemplate}
                      className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                    >
                      <BookmarkPlus className="w-3.5 h-3.5 text-amber-400" /> Save Template
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit Consultation */}
              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="submit"
                  disabled={savingVisit}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-colors shadow-lg shadow-emerald-900/30 disabled:opacity-50 flex items-center gap-2"
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
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-500 text-sm">
                  No previous consultation records found for this patient.
                </div>
              ) : (
                visits.map((v) => (
                  <div key={v.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <div className="font-semibold text-slate-100 text-sm">
                          Visit Date: {new Date(v.visitDate).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-slate-400">
                          Dr. {v.doctor?.name || 'Doctor'} {v.appointment ? `· Queue #${v.appointment.queueNumber}` : ''}
                        </div>
                      </div>
                    </div>

                    {v.diagnosis && (
                      <div>
                        <div className="text-xs font-semibold text-slate-400 uppercase">Diagnosis</div>
                        <p className="text-sm text-slate-200 mt-1">{v.diagnosis}</p>
                      </div>
                    )}

                    {v.notes && (
                      <div>
                        <div className="text-xs font-semibold text-slate-400 uppercase">Clinical Notes</div>
                        <p className="text-sm text-slate-300 mt-1">{v.notes}</p>
                      </div>
                    )}

                    {v.prescriptions && v.prescriptions.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold text-slate-400 uppercase mb-2">Prescribed Medicines</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {v.prescriptions.map((rx) => (
                            <div key={rx.id} className="p-2.5 bg-slate-800/60 border border-slate-700/60 rounded-lg text-xs">
                              <div className="font-semibold text-emerald-400">{rx.medicineName} ({rx.dosage})</div>
                              <div className="text-slate-300 mt-0.5">{rx.instructions} · {rx.duration}</div>
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
