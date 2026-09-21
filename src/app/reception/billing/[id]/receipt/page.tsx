'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { Printer, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

interface Invoice {
  id: string;
  consultationFee: number;
  labCharges: number;
  otherCharges: number;
  totalAmount: number;
  status: 'UNPAID' | 'PAID' | 'PARTIAL';
  createdAt: string;
  patient: {
    id: string;
    fullName: string;
    phone: string;
    nic?: string;
  };
  clinic?: {
    name?: string;
    address?: string;
    phone?: string;
  };
  appointment?: {
    scheduledAt?: string;
    queueNumber?: number;
    doctor?: { name?: string };
    branch?: { name?: string };
  };
}

export default function ReceiptPrintPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const invoiceId = params.id as string;
  const autoPrint = searchParams.get('autoprint') === 'true';

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchInvoice = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to load invoice receipt');
      }
      const data = await res.json();
      setInvoice(data);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError('Failed to load invoice receipt');
    } finally {
      setLoading(false);
    }
  }, [invoiceId]);

  useEffect(() => {
    if (invoiceId) {
      fetchInvoice();
    }
  }, [invoiceId, fetchInvoice]);

  // Auto trigger print if requested via query param
  useEffect(() => {
    if (invoice && autoPrint) {
      const timer = setTimeout(() => {
        window.print();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [invoice, autoPrint]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading receipt details...</span>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-slate-950 p-6 flex flex-col items-center justify-center space-y-4">
        <div className="bg-rose-950/60 border border-rose-500/30 text-rose-400 p-4 rounded-xl text-sm max-w-md w-full text-center flex items-center justify-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error || 'Receipt not found'}</span>
        </div>
        <Link
          href="/reception/billing"
          className="text-sm text-slate-400 hover:text-slate-200 flex items-center gap-2 underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Billing Desk
        </Link>
      </div>
    );
  }

  const clinicName = invoice.clinic?.name || 'LankaCare Private Clinic';
  const branchName = invoice.appointment?.branch?.name || 'Colombo Main Branch';
  const clinicAddress = invoice.clinic?.address || '123 Hospital Road, Colombo 03';
  const clinicPhone = invoice.clinic?.phone || '+94 11 234 5678';

  const receiptNumber = `#INV-${invoice.id.slice(0, 8).toUpperCase()}`;
  const formattedDate = new Date(invoice.createdAt).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center p-4 sm:p-8">
      {/* Control Topbar (Hidden when printing) */}
      <div className="no-print w-full max-w-xl mb-6 flex items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl">
        <Link
          href="/reception/billing"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-100 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Billing Desk
        </Link>

        <button
          onClick={() => window.print()}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all shadow-lg shadow-emerald-900/30"
        >
          <Printer className="w-4 h-4" /> Print Receipt
        </button>
      </div>

      {/* ISOLATED THERMAL / A4 RECEIPT CONTAINER */}
      <div className="w-full max-w-md bg-white text-slate-900 rounded-2xl shadow-2xl p-6 sm:p-8 border border-slate-200 font-sans text-sm print:max-w-none print:shadow-none print:border-none print:p-0 print:m-0 print:rounded-none">
        {/* Clinic Branding Header */}
        <div className="text-center border-b-2 border-slate-900 pb-4 mb-5">
          <h1 className="text-xl font-extrabold uppercase tracking-wide text-slate-900">{clinicName}</h1>
          <p className="text-xs font-semibold text-slate-600 mt-0.5">{branchName}</p>
          <p className="text-[11px] text-slate-500 mt-1">{clinicAddress} · Tel: {clinicPhone}</p>
        </div>

        {/* Receipt Header Information */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 mb-5 space-y-1.5 text-xs print:bg-transparent print:border-slate-300">
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">RECEIPT NUMBER:</span>
            <span className="font-mono font-bold text-slate-900">{receiptNumber}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">DATE & TIME:</span>
            <span className="text-slate-800 font-medium">{formattedDate}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">PATIENT NAME:</span>
            <span className="font-semibold text-slate-900">{invoice.patient.fullName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">PHONE NUMBER:</span>
            <span className="text-slate-800">{invoice.patient.phone}</span>
          </div>
          {invoice.appointment?.doctor?.name && (
            <div className="flex justify-between items-center pt-1 border-t border-slate-200">
              <span className="text-slate-500 font-medium">ATTENDING DOCTOR:</span>
              <span className="font-medium text-slate-900">Dr. {invoice.appointment.doctor.name}</span>
            </div>
          )}
        </div>

        {/* Itemized Fee Breakdown Table */}
        <div className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 border-b border-slate-200 pb-1">
            Payment Breakdown
          </h3>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-300 text-slate-600 uppercase font-semibold">
                <th className="py-2">Item Description</th>
                <th className="py-2 text-right">Amount (LKR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-2.5 text-slate-800 font-medium">Doctor Consultation Fee</td>
                <td className="py-2.5 text-right font-mono text-slate-900">{invoice.consultationFee.toFixed(2)}</td>
              </tr>
              {invoice.labCharges > 0 && (
                <tr>
                  <td className="py-2.5 text-slate-800 font-medium">Lab Test Charges</td>
                  <td className="py-2.5 text-right font-mono text-slate-900">{invoice.labCharges.toFixed(2)}</td>
                </tr>
              )}
              {invoice.otherCharges > 0 && (
                <tr>
                  <td className="py-2.5 text-slate-800 font-medium">Pharmacy / Other Charges</td>
                  <td className="py-2.5 text-right font-mono text-slate-900">{invoice.otherCharges.toFixed(2)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Total & Payment Status */}
        <div className="border-t-2 border-slate-900 pt-4 mb-6 space-y-3">
          <div className="flex justify-between items-center text-base font-bold text-slate-900">
            <span>TOTAL AMOUNT PAID:</span>
            <span className="font-mono text-lg text-slate-950">
              LKR {invoice.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="flex justify-between items-center pt-2">
            <span className="text-xs text-slate-500 font-semibold uppercase">Payment Status:</span>
            <span
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${
                invoice.status === 'PAID'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  : 'bg-rose-50 text-rose-700 border-rose-300'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {invoice.status}
            </span>
          </div>
        </div>

        {/* Receipt Footer */}
        <div className="text-center text-xs text-slate-500 border-t border-dashed border-slate-300 pt-4 space-y-1">
          <p className="font-semibold text-slate-700">Thank you for choosing {clinicName}!</p>
          <p className="text-[10px] text-slate-400">This is a computer-generated official receipt. Valid without signature.</p>
        </div>
      </div>
    </div>
  );
}
