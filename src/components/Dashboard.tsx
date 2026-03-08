import { SensorReading, AppSettings } from '@/types/sensor';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, ReferenceLine, Area, AreaChart } from 'recharts';
import { Play, Square, AlertTriangle } from 'lucide-react';

interface Props {
  latestReading: SensorReading | null;
  liveData: SensorReading[];
  isRunning: boolean;
  onStart: () => void;
  onStop: () => void;
  settings: AppSettings;
}

export default function Dashboard({ latestReading, liveData, isRunning, onStart, onStop, settings }: Props) {
  const load = latestReading?.load_value ?? 0;
  const status = latestReading?.status ?? 'Normal';
  const unit = settings.loadUnit;

  const statusColor = status === 'Overload' ? 'text-danger' : status === 'Warning' ? 'text-warning' : 'text-success';
  const glowClass = status === 'Overload' ? 'glow-danger' : status === 'Warning' ? 'glow-warning' : 'glow-primary';
  const statusBg = status === 'Overload' ? 'bg-danger/10 border-danger/30' : status === 'Warning' ? 'bg-warning/10 border-warning/30' : 'bg-success/10 border-success/30';

  const chartData = liveData.map(r => ({
    time: new Date(r.timestamp).toLocaleTimeString([], { minute: '2-digit', second: '2-digit' }),
    load: r.load_value,
  }));

  const strokeColor = status === 'Overload' ? 'hsl(0, 72%, 55%)' : status === 'Warning' ? 'hsl(38, 92%, 50%)' : 'hsl(187, 80%, 50%)';

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-foreground">SLMRS</h1>
          <p className="text-[10px] text-muted-foreground">Smart Load Monitoring and Reporting System</p>
          <p className="text-xs text-muted-foreground">{settings.deviceName}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-success status-pulse' : 'bg-muted-foreground'}`} />
          <span className="text-xs text-muted-foreground">{isRunning ? 'Connected' : 'Offline'}</span>
        </div>
      </div>

      {/* Main Load Display */}
      <div className={`rounded-xl border p-6 text-center ${statusBg} ${glowClass} transition-all duration-500`}>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Current Load</p>
        <div className="font-mono text-5xl font-bold tracking-tight text-foreground">
          {load.toFixed(1)}
        </div>
        <p className="text-sm text-muted-foreground mt-1">{unit}</p>
        <div className={`inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full text-xs font-semibold ${statusColor} ${statusBg}`}>
          {status === 'Overload' && <AlertTriangle size={12} />}
          {status}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Threshold" value={`${settings.overloadThreshold}`} sub={unit} />
        <StatCard label="Warning" value={`${settings.warningThreshold}`} sub={unit} />
        <StatCard label="Readings" value={`${liveData.length}`} sub="total" />
      </div>

      {/* Live Chart */}
      <div className="bg-card rounded-xl border border-border p-4">
        <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">Load vs Time</p>
        <div className="h-48">
          {chartData.length > 1 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="loadGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={strokeColor} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" domain={[0, 'auto']} />
                <ReferenceLine y={settings.overloadThreshold} stroke="hsl(0, 72%, 55%)" strokeDasharray="4 4" />
                <ReferenceLine y={settings.warningThreshold} stroke="hsl(38, 92%, 50%)" strokeDasharray="4 4" />
                <Area type="monotone" dataKey="load" stroke={strokeColor} strokeWidth={2} fill="url(#loadGradient)" dot={false} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Start monitoring to see live data
            </div>
          )}
        </div>
      </div>

      {/* Start/Stop Button */}
      <button
        onClick={isRunning ? onStop : onStart}
        className={`w-full py-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
          isRunning
            ? 'bg-danger text-danger-foreground hover:bg-danger/90'
            : 'bg-primary text-primary-foreground hover:bg-primary/90'
        }`}
      >
        {isRunning ? <><Square size={16} /> Stop Monitoring</> : <><Play size={16} /> Start Monitoring</>}
      </button>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-card rounded-lg border border-border p-3 text-center">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="font-mono text-lg font-bold text-foreground mt-1">{value}</p>
      <p className="text-[10px] text-muted-foreground">{sub}</p>
    </div>
  );
}
