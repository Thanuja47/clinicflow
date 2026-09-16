'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  CheckCircle2,
  Printer
} from 'lucide-react';

interface Patient {
  id: string;
  fullName: string;
  phone: string;
  nic?: string;
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

  const [printableInvoice, setPrintableInvoice] = useState<Invoice | null>(null);
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
        const res = await fetch(`/api/patients?search=${encodeURIComponent(patientSearch)}`);
        const data = await res.json();
        if (Array.isArray(data)) setPatientResults(data);
      } catch (err) {
        console.error(err);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [patientSearch]);

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
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create invoice');

      setSuccessMsg('Invoice generated successfully!');
      setShowModal(false);
      resetForm();
      fetchInvoices();
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
    setPrintableInvoice(inv);
    setTimeout(() => {
      window.print();
    }, 100);
  }

  function resetForm() {
    setSelectedPatient(null);
    setPatientSearch('');
    setConsultationFee('1500');
    setLabCharges('0');
    setOtherCharges('0');
    setPaymentStatus('PAID');
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
    <div className="space-y-6">
      {/* Printable Thermal Receipt (Hidden on Screen, Visible on Print) */}
      {printableInvoice && (
        <div className="print-only hidden print:block p-6 text-black bg-white max-w-xs mx-auto border font-mono text-xs">
          <div className="text-center border-b pb-3 mb-3">
            <h2 className="text-base font-bold uppercase">LankaCare Clinic</h2>
            <p className="text-[10px]">Colombo Main Branch</p>
            <p className="text-[10px]">Tel: +94 11 234 5678</p>
          </div>

          <div className="mb-3 space-y-0.5">
            <p><strong>Receipt #:</strong> {printableInvoice.id.slice(0, 8).toUpperCase()}</p>
            <p><strong>Date:</strong> {new Date(printableInvoice.createdAt).toLocaleDateString()}</p>
            <p><strong>Patient:</strong> {printableInvoice.patient.fullName}</p>
            <p><strong>Phone:</strong> {printableInvoice.patient.phone}</p>
          </div>

          <div className="border-t border-b py-2 my-2 space-y-1">
            <div className="flex justify-between">
              <span>Consultation Fee:</span>
              <span>LKR {printableInvoice.consultationFee.toFixed(2)}</span>
            </div>
            {printableInvoice.labCharges > 0 && (
              <div className="flex justify-between">
                <span>Lab Test Charges:</span>
                <span>LKR {printableInvoice.labCharges.toFixed(2)}</span>
              </div>
            )}
            {printableInvoice.otherCharges > 0 && (
              <div className="flex justify-between">
                <span>Other / Pharmacy:</span>
                <span>LKR {printableInvoice.otherCharges.toFixed(2)}</span>
              </div>
            )}
          </div>

          <div className="flex justify-between font-bold text-sm pt-1">
            <span>TOTAL AMOUNT:</span>
            <span>LKR {printableInvoice.totalAmount.toFixed(2)}</span>
          </div>

          <div className="mt-2 text-center">
            <span className="inline-block border border-black px-2 py-0.5 font-bold uppercase text-[10px]">
              STATUS: {printableInvoice.status}
            </span>
          </div>

          <div className="mt-6 text-center text-[10px] border-t pt-2">
            Thank you for choosing LankaCare Clinic!
          </div>
        </div>
      )}

      {/* Screen View */}
      <div className="no-print space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              Billing & Invoicing Desk
            </h1>
            <p className="text-slate-400 text-sm">Issue receipts, collect payments, and track clinic revenue</p>
          </div>
          <button
            onClick={() => {
              setShowModal(true);
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> Create New Invoice
          </button>
        </div>

        {/* Success / Error Alerts */}
        {successMsg && (
          <div className="p-4 bg-emerald-950/60 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Revenue Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="text-xs text-slate-400 font-medium">Total Collected (Paid)</div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">
              LKR {totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="text-xs text-amber-400 font-medium">Pending Unpaid Invoices</div>
            <div className="text-2xl font-bold text-amber-400 mt-1">
              LKR {pendingRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="text-xs text-blue-400 font-medium">Total Invoices Issued</div>
            <div className="text-2xl font-bold text-blue-400 mt-1">{invoices.length}</div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap gap-4 items-center justify-between">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Patient Name or Phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400">Payment Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="">All Statuses</option>
              <option value="PAID">Paid</option>
              <option value="UNPAID">Unpaid</option>
            </select>
          </div>
        </div>

        {/* Invoice Directory Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-slate-400 text-xs uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Receipt #</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Patient</th>
                  <th className="px-6 py-4">Fee Breakdown</th>
                  <th className="px-6 py-4">Total Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                      No invoices found.
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs font-bold text-slate-300">
                        #{inv.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400">
                        {new Date(inv.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-100">{inv.patient.fullName}</div>
                        <div className="text-xs text-slate-400">{inv.patient.phone}</div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400">
                        <div>Doctor: LKR {inv.consultationFee}</div>
                        {inv.labCharges > 0 && <div>Lab: LKR {inv.labCharges}</div>}
                        {inv.otherCharges > 0 && <div>Other: LKR {inv.otherCharges}</div>}
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-slate-100 text-base">
                        LKR {inv.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            inv.status === 'PAID'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
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
                              className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                            >
                              Mark Paid
                            </button>
                          )}
                          <button
                            onClick={() => printReceipt(inv)}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors border border-slate-700"
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

        {/* Create Invoice Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-slate-100">Create New Invoice</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-slate-400 hover:text-slate-200 text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateInvoice} className="p-6 space-y-4">
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
                        <div className="text-xs text-slate-400">{selectedPatient.phone}</div>
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
                        placeholder="Search patient by Name or Phone..."
                        value={patientSearch}
                        onChange={(e) => setPatientSearch(e.target.value)}
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

                {/* Charges Input */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                      Doctor Consultation Fee (LKR)
                    </label>
                    <input
                      type="number"
                      value={consultationFee}
                      onChange={(e) => setConsultationFee(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                      Lab Test Charges (LKR)
                    </label>
                    <input
                      type="number"
                      value={labCharges}
                      onChange={(e) => setLabCharges(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                      Other / Pharmacy Charges (LKR)
                    </label>
                    <input
                      type="number"
                      value={otherCharges}
                      onChange={(e) => setOtherCharges(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Calculated Total Display */}
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex justify-between items-center">
                  <span className="text-sm font-semibold text-slate-300">TOTAL RECEIPT AMOUNT:</span>
                  <span className="text-xl font-mono font-bold text-emerald-400">
                    LKR {calculatedTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Payment Status Option */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">
                    Payment Status
                  </label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value as 'UNPAID' | 'PAID' | 'PARTIAL')}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="PAID">Paid (Cash/Card Received)</option>
                    <option value="UNPAID">Unpaid (Pending)</option>
                  </select>
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
                    {loading ? 'Generating...' : 'Issue Invoice & Receipt'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
