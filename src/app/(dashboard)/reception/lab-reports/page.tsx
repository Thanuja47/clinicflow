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
        const res = await fetch(`/api/patients?q=${encodeURIComponent(patientSearch)}&limit=10`);
        const data = await res.json();
        if (data?.patients && Array.isArray(data.patients)) setPatientResults(data.patients);
        else setPatientResults([]);
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
    <div className="p-6 space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="apple-title flex items-center gap-2">
          Lab Reports Vault
        </h1>
        <p className="apple-caption mt-1">Upload, attach, and view patient diagnostic lab reports (PDF/Images)</p>
      </div>

      {/* Upload Card */}
      <div className="apple-card p-6 space-y-4">
        <h2 className="apple-section-header flex items-center gap-2">
          <FileUp className="w-4 h-4 text-apple-blue" /> Upload new lab report
        </h2>

        <form onSubmit={handleUpload} className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Patient Selector */}
          <div className="space-y-2">
            <label className="block apple-caption font-medium">
              Select patient *
            </label>
            {selectedPatient ? (
              <div className="flex items-center justify-between p-3.5 bg-apple-secondary border border-apple-green/40 rounded-apple-md">
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
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-apple-muted pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search patient by name, phone, or NIC..."
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  className="w-full apple-input apple-input-has-icon"
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
                          setPatientSearch('');
                        }}
                        className="w-full text-left p-3 hover:bg-apple-secondary/60 transition-colors"
                      >
                        <div className="font-semibold text-apple-text text-sm">{p.fullName}</div>
                        <div className="text-xs text-apple-muted">{p.phone}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* File Picker */}
          <div className="space-y-2">
            <label className="block apple-caption font-medium">
              Attach PDF / Image file *
            </label>
            <div className="border-2 border-dashed border-apple-border hover:border-apple-blue rounded-apple-md p-4 text-center transition-colors bg-apple-secondary/30">
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
                <FileText className="w-8 h-8 mx-auto text-apple-blue" />
                <span className="text-xs font-semibold text-apple-text block">
                  {file ? file.name : 'Click to select PDF or image file'}
                </span>
                <span className="text-[11px] text-apple-muted block">PDF, PNG, JPG up to 10MB</span>
              </label>
            </div>
          </div>

          <div className="md:col-span-2 flex justify-between items-center pt-2">
            <div>
              {successMsg && (
                <span className="text-xs text-apple-green font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> {successMsg}
                </span>
              )}
              {errorMsg && (
                <span className="text-xs text-apple-red font-medium flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> {errorMsg}
                </span>
              )}
            </div>
            <button
              type="submit"
              disabled={uploading}
              className="apple-btn-primary disabled:opacity-50 flex items-center gap-2"
            >
              <FileUp className="w-4 h-4" />
              {uploading ? 'Uploading...' : 'Upload & Attach Report'}
            </button>
          </div>
        </form>
      </div>

      {/* Lab Reports Directory Table */}
      <div className="apple-card overflow-hidden">
        <div className="p-4 border-b border-apple-border bg-apple-secondary/30">
          <h2 className="text-sm font-semibold text-apple-text">Recent Lab Uploads ({reports.length})</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-apple-text">
            <thead>
              <tr className="border-b border-apple-border text-apple-muted text-xs font-semibold">
                <th className="px-6 py-3.5">Uploaded Date</th>
                <th className="px-6 py-3.5">Patient Name</th>
                <th className="px-6 py-3.5">Contact</th>
                <th className="px-6 py-3.5 text-right">View / Download</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-apple-border">
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center apple-caption">
                    No lab reports uploaded yet.
                  </td>
                </tr>
              ) : (
                reports.map((r) => (
                  <tr key={r.id} className="hover:bg-apple-secondary/40 transition-colors">
                    <td className="px-6 py-4 text-xs text-apple-muted">
                      {new Date(r.uploadedAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-semibold text-apple-text">
                      {r.patient.fullName}
                    </td>
                    <td className="px-6 py-4 text-apple-muted text-xs">
                      {r.patient.phone}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <a
                        href={r.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="apple-btn-secondary text-xs py-1 px-3 text-apple-blue inline-flex items-center gap-1.5"
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
