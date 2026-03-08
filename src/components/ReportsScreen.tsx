import { useState, useMemo } from 'react';
import { SensorReading, LoadUnit } from '@/types/sensor';
import { generateReportData, exportCSV, exportPDF } from '@/lib/reportUtils';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { FileDown, FileText, AlertTriangle, BarChart3, TrendingUp, TrendingDown, Hash } from 'lucide-react';

interface Props {
  readings: SensorReading[];
  unit: LoadUnit;
}

export default function ReportsScreen({ readings, unit }: Props) {
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  const report = useMemo(() => {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    return generateReportData(readings, start, end);
  }, [readings, startDate, endDate]);

  const chartData = useMemo(() => {
    // Sample down for the chart
    const data = report.readings;
    const step = Math.max(1, Math.floor(data.length / 100));
    return data.filter((_, i) => i % step === 0).map(r => ({
      time: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      load: r.load_value,
    }));
  }, [report]);

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      <div>
        <h1 className="text-lg font-bold text-foreground">Reports</h1>
        <p className="text-xs text-muted-foreground">Generate and export load reports</p>
      </div>

      {/* Date Range */}
      <div className="bg-card rounded-xl border border-border p-4 space-y-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Date Range</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-muted-foreground">From</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground" />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground">To</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground" />
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3">
        <SummaryCard icon={<TrendingUp size={14} />} label="Max Load" value={`${report.max} ${unit}`} color="text-danger" />
        <SummaryCard icon={<TrendingDown size={14} />} label="Min Load" value={`${report.min} ${unit}`} color="text-success" />
        <SummaryCard icon={<BarChart3 size={14} />} label="Average" value={`${report.average} ${unit}`} color="text-primary" />
        <SummaryCard icon={<Hash size={14} />} label="Readings" value={`${report.totalReadings}`} color="text-muted-foreground" />
      </div>

      {/* Overload Events */}
      <div className={`flex items-center gap-3 p-4 rounded-xl border ${
        report.overloadCount > 0 ? 'bg-danger/5 border-danger/30' : 'bg-card border-border'
      }`}>
        <AlertTriangle size={18} className={report.overloadCount > 0 ? 'text-danger' : 'text-muted-foreground'} />
        <div>
          <p className="text-sm font-semibold text-foreground">{report.overloadCount} Overload Events</p>
          <p className="text-xs text-muted-foreground">During selected period</p>
        </div>
      </div>

      {/* Trend Chart */}
      {chartData.length > 1 && (
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Load Trend</p>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="reportGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(187, 80%, 50%)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(187, 80%, 50%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                <Area type="monotone" dataKey="load" stroke="hsl(187, 80%, 50%)" strokeWidth={2} fill="url(#reportGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Export Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => exportPDF(report, unit)}
          disabled={report.totalReadings === 0}
          className="flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50 hover:bg-primary/90 transition-colors"
        >
          <FileText size={16} /> Export PDF
        </button>
        <button
          onClick={() => exportCSV(report, unit)}
          disabled={report.totalReadings === 0}
          className="flex items-center justify-center gap-2 py-3 rounded-xl bg-secondary text-secondary-foreground font-semibold text-sm disabled:opacity-50 hover:bg-secondary/80 transition-colors"
        >
          <FileDown size={16} /> Export CSV
        </button>
      </div>
    </div>
  );
}

function SummaryCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="bg-card rounded-lg border border-border p-3">
      <div className={`${color} mb-1`}>{icon}</div>
      <p className="font-mono text-sm font-bold text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}
