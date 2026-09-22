'use client';
import { useState, useEffect, useCallback } from 'react';
import { Topbar } from '@/components/layout/Topbar';
import { TrendingUp, Users, Calendar, DollarSign, CheckCircle2, RefreshCw } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

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

const COLORS = ['#34C759', '#FF9500', '#FF3B30', '#007AFF'];

export default function ReportsAnalyticsPage() {
  const [mounted, setMounted] = useState(false);
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

  useEffect(() => {
    setMounted(true);
  }, []);

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
    <div className="flex flex-col min-h-screen">
      <Topbar title="Analytics & Reports" userName="Admin" />

      <div className="p-6 space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="apple-title">Executive Analytics</h1>
            <p className="apple-caption mt-1">Real-time consultation metrics and revenue insights</p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as 'today' | 'week' | 'month' | 'all')}
              className="apple-input text-xs font-medium"
            >
              <option value="today">Today</option>
              <option value="week">Past 7 Days</option>
              <option value="month">Past 30 Days</option>
              <option value="all">All Time</option>
            </select>

            <button
              onClick={fetchReports}
              className="apple-btn-secondary p-2 flex items-center justify-center"
              title="Refresh analytics"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="apple-card p-5 space-y-2">
            <div className="flex items-center justify-between apple-caption font-medium">
              <span>Collected revenue</span>
              <DollarSign className="w-4 h-4 text-apple-green" />
            </div>
            <div className="text-2xl font-bold text-apple-green mt-1">
              LKR {summary.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-apple-muted mt-1">
              Pending: LKR {summary.pendingRevenue.toLocaleString('en-US')}
            </div>
          </div>

          <div className="apple-card p-5 space-y-2">
            <div className="flex items-center justify-between apple-caption font-medium">
              <span>Total appointments</span>
              <Calendar className="w-4 h-4 text-apple-blue" />
            </div>
            <div className="text-2xl font-bold text-apple-text mt-1">{summary.totalAppointments}</div>
            <div className="text-xs text-apple-green mt-1 flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> {summary.completedAppointments} Completed
            </div>
          </div>

          <div className="apple-card p-5 space-y-2">
            <div className="flex items-center justify-between apple-caption font-medium">
              <span>New patients</span>
              <Users className="w-4 h-4 text-apple-orange" />
            </div>
            <div className="text-2xl font-bold text-apple-orange mt-1">{summary.totalPatients}</div>
            <div className="text-xs text-apple-muted mt-1">Registered in period</div>
          </div>

          <div className="apple-card p-5 space-y-2">
            <div className="flex items-center justify-between apple-caption font-medium">
              <span>Completion rate</span>
              <TrendingUp className="w-4 h-4 text-apple-purple" />
            </div>
            <div className="text-2xl font-bold text-apple-purple mt-1">
              {summary.totalAppointments > 0
                ? Math.round((summary.completedAppointments / summary.totalAppointments) * 100)
                : 0}%
            </div>
            <div className="text-xs text-apple-muted mt-1">
              {summary.cancelledAppointments} Cancelled
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Doctor Consultation Performance Chart */}
          <div className="apple-card p-6 space-y-4">
            <h2 className="apple-section-header flex items-center gap-2">
              <Users className="w-4 h-4 text-apple-blue" /> Doctor Consultation Volume
            </h2>

            <div className="h-64 w-full pt-2">
              {!mounted || doctorPerf.length === 0 ? (
                <div className="h-full flex items-center justify-center apple-caption">
                  {!mounted ? 'Loading chart...' : 'No consultation data for this period.'}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={doctorPerf}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                    <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} />
                    <YAxis stroke="var(--text-secondary)" fontSize={12} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)', borderRadius: '10px' }}
                      itemStyle={{ color: 'var(--accent-blue)' }}
                    />
                    <Bar dataKey="visits" fill="#007AFF" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Appointment Status Breakdown Chart */}
          <div className="apple-card p-6 space-y-4">
            <h2 className="apple-section-header flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-apple-purple" /> Appointment Status Distribution
            </h2>

            <div className="h-64 w-full flex items-center justify-center">
              {!mounted || appointmentPieData.length === 0 ? (
                <div className="apple-caption">
                  {!mounted ? 'Loading chart...' : 'No appointment data to chart.'}
                </div>
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
                      contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)', borderRadius: '10px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
