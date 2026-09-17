'use client';
import { useState, useEffect, useCallback } from 'react';
import { FileUp, Search, FileText, ExternalLink, CheckCircle2, AlertCircle } from 'lucide-react';

interface Patient {
  id: string;
  fullName: string;
  phone: string;
  nic?: string;
}

interface LabReport {
  id: string;
  fileUrl: string;
  uploadedAt: string;
  patient: { id: string; fullName: string; phone: string };
  visit?: { id: string; diagnosis?: string; visitDate: string };
}

export default function LabReportsPage() {
  const [reports, setReports] = useState<LabReport[]>([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [patientResults, setPatientResults] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchReports = useCallback(async () => {
    try {
      const res = await fetch('/api/lab-reports');
      const data = await res.json();
      if (Array.isArray(data)) setReports(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Debounced patient search
  useEffect(() => {
    if (!patientSearch.trim()) {
      setPatientResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/patients?search=${encodeURIComponent(patientSearch)}`);
        const data = await res.json();
        if (Array.isArray(data)) setPatientResults(data);
      } catch (err) {
        console.error(err);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [patientSearch]);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPatient) {
      setErrorMsg('Please select a patient first');
      return;
    }
    if (!file) {
      setErrorMsg('Please select a PDF or Image lab report file');
      return;
    }

    setUploading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('patientId', selectedPatient.id);

      const res = await fetch('/api/lab-reports', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload lab report');

      setSuccessMsg(`Lab report uploaded successfully for ${selectedPatient.fullName}!`);
      setSelectedPatient(null);
      setFile(null);
      setPatientSearch('');
      fetchReports();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Failed to upload file');
      }
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          Lab Reports Vault
        </h1>
        <p className="text-slate-400 text-sm">Upload, attach, and view patient diagnostic lab reports (PDF/Images)</p>
      </div>

      {/* Upload Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
          <FileUp className="w-4 h-4 text-emerald-400" /> Upload New Lab Report
        </h2>

        <form onSubmit={handleUpload} className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Patient Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase">
              Select Patient *
            </label>
            {selectedPatient ? (
              <div className="flex items-center justify-between p-3.5 bg-slate-800 border border-emerald-500/40 rounded-xl">
                <div>
                  <div className="font-semibold text-slate-100">{selectedPatient.fullName}</div>
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
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                />
                {patientResults.length > 0 && (
                  <div className="absolute z-10 w-full bg-slate-800 border border-slate-700 rounded-xl mt-1 max-h-48 overflow-y-auto shadow-xl">
                    {patientResults.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSelectedPatient(p);
                          setPatientResults([]);
                          setPatientSearch('');
                        }}
                        className="w-full text-left p-3 hover:bg-slate-700/50 border-b border-slate-700/50 last:border-0"
                      >
                        <div className="font-medium text-slate-200 text-sm">{p.fullName}</div>
                        <div className="text-xs text-slate-400">{p.phone}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* File Picker */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase">
              Attach PDF / Image File *
            </label>
            <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-xl p-4 text-center transition-colors bg-slate-800/40">
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) setFile(e.target.files[0]);
                }}
                className="hidden"
                id="lab-file-input"
              />
              <label htmlFor="lab-file-input" className="cursor-pointer space-y-1 block">
                <FileText className="w-8 h-8 mx-auto text-emerald-400" />
                <span className="text-xs font-medium text-slate-200 block">
                  {file ? file.name : 'Click to select PDF or image file'}
                </span>
                <span className="text-[10px] text-slate-400 block">PDF, PNG, JPG up to 10MB</span>
              </label>
            </div>
          </div>

          <div className="md:col-span-2 flex justify-between items-center pt-2">
            <div>
              {successMsg && (
                <span className="text-xs text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> {successMsg}
                </span>
              )}
              {errorMsg && (
                <span className="text-xs text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> {errorMsg}
                </span>
              )}
            </div>
            <button
              type="submit"
              disabled={uploading}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <FileUp className="w-4 h-4" />
              {uploading ? 'Uploading to Storage...' : 'Upload & Attach Report'}
            </button>
          </div>
        </form>
      </div>

      {/* Lab Reports Directory Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 bg-slate-950/50">
          <h2 className="text-sm font-semibold text-slate-200">Recent Lab Uploads ({reports.length})</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-slate-400 text-xs uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Uploaded Date</th>
                <th className="px-6 py-4">Patient Name</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4 text-right">View / Download</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                    No lab reports uploaded yet.
                  </td>
                </tr>
              ) : (
                reports.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {new Date(r.uploadedAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-100">
                      {r.patient.fullName}
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">
                      {r.patient.phone}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <a
                        href={r.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-700 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> View Report
                      </a>
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
