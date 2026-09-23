'use client';

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

interface DoctorPerf {
  name: string;
  visits: number;
}

interface ReportChartsProps {
  doctorPerf: DoctorPerf[];
  appointmentPieData: { name: string; value: number }[];
  colors: string[];
}

export default function ReportCharts({ doctorPerf, appointmentPieData, colors }: ReportChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Doctor Consultation Performance Chart */}
      <div className="apple-card p-6 space-y-4">
        <h2 className="apple-section-header flex items-center gap-2">
          Doctor Consultation Volume
        </h2>
        <div className="h-64 w-full pt-2">
          {doctorPerf.length === 0 ? (
            <div className="h-full flex items-center justify-center apple-caption">
              No consultation data for this period.
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
          Appointment Status Distribution
        </h2>
        <div className="h-64 w-full flex items-center justify-center">
          {appointmentPieData.length === 0 ? (
            <div className="apple-caption">
              No appointment data to chart.
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
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
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
  );
}
