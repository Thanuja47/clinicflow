'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  CheckCircle2,
  Printer,
  Receipt,
  DollarSign,
  AlertCircle
} from 'lucide-react';

interface Patient {
  id: string;
  fullName: string;
  phone: string;
  nic?: string;
}

interface Doctor {
  id: string;
  name: string;
  branch?: { id: string; name: string } | null;
}

interface Branch {
  id: string;
  name: string;
}

interface Invoice {
  id: string;
  consultationFee: number;
  labCharges: number;
  otherCharges: number;
  totalAmount: number;
  status: 'UNPAID' | 'PAID' | 'PARTIAL';
  createdAt: string;
  patient: { id: string; fullName: string; phone: string; nic?: string };
  appointment?: {
    id: string;
    queueNumber: number;
    scheduledAt: string;
    doctor: { name: string };
  };
}

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Modal & Form state
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  const [patientResults, setPatientResults] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const [consultationFee, setConsultationFee] = useState('1500');
  const [labCharges, setLabCharges] = useState('0');
  const [otherCharges, setOtherCharges] = useState('0');
  const [paymentStatus, setPaymentStatus] = useState<'UNPAID' | 'PAID' | 'PARTIAL'>('PAID');

  // Walk-in context: doctor + branch (required for auto-appointment creation)
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('');

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchInvoices = useCallback(async () => {
    try {
      let url = `/api/invoices?search=${encodeURIComponent(search)}`;
      if (filterStatus) url += `&status=${filterStatus}`;
      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data)) setInvoices(data);
    } catch (err) {
      console.error(err);
    }
  }, [search, filterStatus]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

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
        if (data?.patients && Array.isArray(data.patients)) {
          setPatientResults(data.patients);
        } else {
          setPatientResults([]);
        }
      } catch (err) {
        console.error(err);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [patientSearch]);

  // Fetch doctors and branches when modal opens
  useEffect(() => {
    if (!showModal) return;
    fetch('/api/staff?role=DOCTOR')
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setDoctors(data); })
      .catch(console.error);
    fetch('/api/branches')
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setBranches(data); })
      .catch(console.error);
  }, [showModal]);

  async function handleCreateInvoice(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPatient) {
      setErrorMsg('Please select a patient');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: selectedPatient.id,
          consultationFee: parseFloat(consultationFee) || 0,
          labCharges: parseFloat(labCharges) || 0,
          otherCharges: parseFloat(otherCharges) || 0,
          status: paymentStatus,
          doctorId: selectedDoctorId || undefined,
          branchId: selectedBranchId || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create invoice');

      setSuccessMsg('Invoice generated successfully!');
      setShowModal(false);
      resetForm();
      fetchInvoices();
      
      // Auto open receipt in new tab
      if (data?.id) {
        window.open(`/reception/billing/${data.id}/receipt?autoprint=true`, '_blank');
      }
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

  async function updateInvoiceStatus(id: string, newStatus: 'PAID' | 'UNPAID') {
    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) fetchInvoices();
    } catch (err) {
      console.error(err);
    }
  }

  function printReceipt(inv: Invoice) {
    window.open(`/reception/billing/${inv.id}/receipt?autoprint=true`, '_blank');
  }

  function resetForm() {
    setSelectedPatient(null);
    setPatientSearch('');
    setConsultationFee('1500');
    setLabCharges('0');
    setOtherCharges('0');
    setPaymentStatus('PAID');
    setSelectedDoctorId('');
    setSelectedBranchId('');
  }

  const cFee = parseFloat(consultationFee) || 0;
  const lFee = parseFloat(labCharges) || 0;
  const oFee = parseFloat(otherCharges) || 0;
  const calculatedTotal = cFee + lFee + oFee;

  // Stats
  const totalRevenue = invoices
    .filter((i) => i.status === 'PAID')
    .reduce((sum, i) => sum + i.totalAmount, 0);

  const pendingRevenue = invoices
    .filter((i) => i.status === 'UNPAID')
    .reduce((sum, i) => sum + i.totalAmount, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="apple-title flex items-center gap-2">
            Billing & Receipts
          </h1>
          <p className="apple-caption mt-1">Issue receipts, collect payments, and track clinic revenue</p>
        </div>
        <button
          onClick={() => {
            setShowModal(true);
            setErrorMsg('');
            setSuccessMsg('');
          }}
          className="apple-btn-primary flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Create New Invoice
        </button>
      </div>

      {/* Success Alert */}
      {successMsg && (
        <div className="p-4 bg-apple-green/10 border border-apple-green/20 rounded-apple-lg text-apple-green text-sm flex items-center gap-3 font-medium">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="apple-card p-5 space-y-2">
          <div className="apple-caption font-medium text-apple-green flex items-center justify-between">
            <span>Total collected (Paid)</span>
            <DollarSign className="w-4 h-4 text-apple-green" />
          </div>
          <div className="text-2xl font-bold text-apple-text">
            LKR {totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="apple-card p-5 space-y-2">
          <div className="apple-caption font-medium text-apple-orange flex items-center justify-between">
            <span>Pending unpaid invoices</span>
            <AlertCircle className="w-4 h-4 text-apple-orange" />
          </div>
          <div className="text-2xl font-bold text-apple-text">
            LKR {pendingRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="apple-card p-5 space-y-2">
          <div className="apple-caption font-medium text-apple-blue flex items-center justify-between">
            <span>Total invoices issued</span>
            <Receipt className="w-4 h-4 text-apple-blue" />
          </div>
          <div className="text-2xl font-bold text-apple-text">{invoices.length}</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="apple-card p-4 flex flex-wrap gap-4 items-center justify-between">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-apple-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Search patient name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full apple-input apple-input-has-icon"
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="apple-caption">Payment status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="apple-input text-xs"
          >
            <option value="">All statuses</option>
            <option value="PAID">Paid</option>
            <option value="UNPAID">Unpaid</option>
          </select>
        </div>
      </div>

      {/* Invoice Directory Table */}
      <div className="apple-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-apple-text">
            <thead>
              <tr className="border-b border-apple-border text-apple-muted text-xs font-semibold">
                <th className="px-6 py-3.5">Receipt #</th>
                <th className="px-6 py-3.5">Date</th>
                <th className="px-6 py-3.5">Patient</th>
                <th className="px-6 py-3.5">Fee Breakdown</th>
                <th className="px-6 py-3.5">Total Amount</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-apple-border">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center apple-caption">
                    No invoices found.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-apple-secondary/40 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-bold text-apple-text">
                      #{inv.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-6 py-4 text-xs text-apple-muted">
                      {new Date(inv.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-apple-text">{inv.patient.fullName}</div>
                      <div className="text-xs text-apple-muted">{inv.patient.phone}</div>
                    </td>
                    <td className="px-6 py-4 text-xs text-apple-muted space-y-0.5">
                      <div>Doctor: LKR {inv.consultationFee}</div>
                      {inv.labCharges > 0 && <div>Lab: LKR {inv.labCharges}</div>}
                      {inv.otherCharges > 0 && <div>Other: LKR {inv.otherCharges}</div>}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-apple-text text-base">
                      LKR {inv.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`apple-pill ${
                          inv.status === 'PAID' ? 'apple-pill-green' : 'apple-pill-red'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {inv.status === 'UNPAID' && (
                          <button
                            onClick={() => updateInvoiceStatus(inv.id, 'PAID')}
                            className="apple-btn-secondary text-xs py-1 px-3 text-apple-green"
                          >
                            Mark Paid
                          </button>
                        )}
                        <button
                          onClick={() => printReceipt(inv)}
                          className="apple-btn-secondary text-xs py-1 px-3 flex items-center gap-1"
                        >
                          <Printer className="w-3.5 h-3.5" /> Print Receipt
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* APPLE 16PX BACKDROP-BLUR MODAL */}
      {showModal && (
        <div className="fixed inset-0 apple-modal-overlay flex items-center justify-center p-4 z-50 transition-all duration-200">
          <div className="apple-modal-card w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-5">
            <div className="flex justify-between items-center border-b border-apple-border pb-3">
              <h2 className="apple-section-header">Create New Invoice</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-apple-muted hover:text-apple-text text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-4">
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
                      <div className="text-xs text-apple-muted">{selectedPatient.phone}</div>
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
                      placeholder="Search patient name or phone..."
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

              {/* Walk-in Context: Doctor + Branch (auto-creates appointment record) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block apple-caption mb-1 font-medium">
                    Consulting doctor *
                  </label>
                  <select
                    value={selectedDoctorId}
                    onChange={(e) => setSelectedDoctorId(e.target.value)}
                    required
                    className="w-full apple-input text-sm"
                  >
                    <option value="">Select doctor...</option>
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>Dr. {d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block apple-caption mb-1 font-medium">
                    Branch *
                  </label>
                  <select
                    value={selectedBranchId}
                    onChange={(e) => setSelectedBranchId(e.target.value)}
                    required
                    className="w-full apple-input text-sm"
                  >
                    <option value="">Select branch...</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Charges Input */}
              <div className="space-y-3">
                <div>
                  <label className="block apple-caption mb-1 font-medium">
                    Doctor consultation fee (LKR)
                  </label>
                  <input
                    type="number"
                    value={consultationFee}
                    onChange={(e) => setConsultationFee(e.target.value)}
                    className="w-full apple-input"
                  />
                </div>

                <div>
                  <label className="block apple-caption mb-1 font-medium">
                    Lab test charges (LKR)
                  </label>
                  <input
                    type="number"
                    value={labCharges}
                    onChange={(e) => setLabCharges(e.target.value)}
                    className="w-full apple-input"
                  />
                </div>

                <div>
                  <label className="block apple-caption mb-1 font-medium">
                    Other / Pharmacy charges (LKR)
                  </label>
                  <input
                    type="number"
                    value={otherCharges}
                    onChange={(e) => setOtherCharges(e.target.value)}
                    className="w-full apple-input"
                  />
                </div>
              </div>

              {/* Calculated Total Display */}
              <div className="p-4 bg-apple-secondary border border-apple-border rounded-apple-md flex justify-between items-center">
                <span className="apple-caption font-semibold">Total invoice amount:</span>
                <span className="text-lg font-mono font-bold text-apple-green">
                  LKR {calculatedTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Payment Status Option */}
              <div>
                <label className="block apple-caption mb-1 font-medium">
                  Payment status
                </label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value as 'UNPAID' | 'PAID' | 'PARTIAL')}
                  className="w-full apple-input"
                >
                  <option value="PAID">Paid (Cash/Card Received)</option>
                  <option value="UNPAID">Unpaid (Pending)</option>
                </select>
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
                  {loading ? 'Generating...' : 'Issue Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
