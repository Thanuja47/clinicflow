'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { TrendingUp, Users, Calendar, DollarSign, CheckCircle2, RefreshCw } from 'lucide-react';

interface ReportSummary {
  totalPatients: number;
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  totalRevenue: number;
  pendingRevenue: number;
}

interface DoctorPerf {
  name: string;
  visits: number;
}

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

export default function ReportsAnalyticsPage() {
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('month');
  const [summary, setSummary] = useState<ReportSummary>({
    totalPatients: 0,
    totalAppointments: 0,
    completedAppointments: 0,
    cancelledAppointments: 0,
    totalRevenue: 0,
    pendingRevenue: 0,
  });
  const [doctorPerf, setDoctorPerf] = useState<DoctorPerf[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?period=${period}`);
      const data = await res.json();
      if (data.summary) setSummary(data.summary);
      if (Array.isArray(data.doctorPerformance)) setDoctorPerf(data.doctorPerformance);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const appointmentPieData = [
    { name: 'Completed', value: summary.completedAppointments },
    { name: 'Cancelled / No Show', value: summary.cancelledAppointments },
    { name: 'Scheduled / Other', value: Math.max(0, summary.totalAppointments - summary.completedAppointments - summary.cancelledAppointments) },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            Reports & Analytics Dashboard
          </h1>
          <p className="text-slate-400 text-sm">Real-time performance metrics, consultation volume, and revenue analytics</p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as 'today' | 'week' | 'month' | 'all')}
            className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 font-medium"
          >
            <option value="today">Today</option>
            <option value="week">Past 7 Days</option>
            <option value="month">Past 30 Days</option>
            <option value="all">All Time</option>
          </select>

          <button
            onClick={fetchReports}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
            title="Refresh analytics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Collected Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-2">
            LKR {summary.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Pending: LKR {summary.pendingRevenue.toLocaleString('en-US')}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Total Appointments</span>
            <Calendar className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 mt-2">{summary.totalAppointments}</div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> {summary.completedAppointments} Completed
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>New Patients</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-2">{summary.totalPatients}</div>
          <div className="text-[11px] text-slate-400 mt-1">Registered in period</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Completion Rate</span>
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-400 mt-2">
            {summary.totalAppointments > 0
              ? Math.round((summary.completedAppointments / summary.totalAppointments) * 100)
              : 0}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {summary.cancelledAppointments} Cancelled
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Doctor Consultation Performance Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" /> Doctor Consultation Volume
          </h2>

          <div className="h-64 w-full pt-2">
            {doctorPerf.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                No consultation data for this period.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={doctorPerf}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                    itemStyle={{ color: '#10b981' }}
                  />
                  <Bar dataKey="visits" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Appointment Status Breakdown Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-purple-400" /> Appointment Status Distribution
          </h2>

          <div className="h-64 w-full flex items-center justify-center">
            {appointmentPieData.length === 0 ? (
              <div className="text-slate-500 text-sm">No appointment data to chart.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={appointmentPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {appointmentPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
