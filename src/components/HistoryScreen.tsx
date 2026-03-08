import { useState, useMemo } from 'react';
import { SensorReading, LoadUnit } from '@/types/sensor';
import { format } from 'date-fns';
import { Calendar, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';

interface Props {
  readings: SensorReading[];
  unit: LoadUnit;
}

export default function HistoryScreen({ readings, unit }: Props) {
  const [dateFilter, setDateFilter] = useState('');

  const filtered = useMemo(() => {
    if (!dateFilter) return readings.slice(-100).reverse();
    return readings
      .filter(r => r.timestamp.startsWith(dateFilter))
      .slice(-100)
      .reverse();
  }, [readings, dateFilter]);

  const stats = useMemo(() => {
    if (filtered.length === 0) return null;
    const loads = filtered.map(r => r.load_value);
    return {
      max: Math.max(...loads).toFixed(1),
      min: Math.min(...loads).toFixed(1),
      avg: (loads.reduce((a, b) => a + b, 0) / loads.length).toFixed(1),
    };
  }, [filtered]);

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      <div>
        <h1 className="text-lg font-bold text-foreground">History</h1>
        <p className="text-xs text-muted-foreground">{readings.length} total readings stored</p>
      </div>

      {/* Date Filter */}
      <div className="flex items-center gap-2">
        <Calendar size={16} className="text-muted-foreground" />
        <input
          type="date"
          value={dateFilter}
          onChange={e => setDateFilter(e.target.value)}
          className="flex-1 bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground"
        />
        {dateFilter && (
          <button onClick={() => setDateFilter('')} className="text-xs text-primary hover:underline">Clear</button>
        )}
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card rounded-lg border border-border p-3 text-center">
            <TrendingUp size={14} className="mx-auto text-danger mb-1" />
            <p className="font-mono text-sm font-bold text-foreground">{stats.max}</p>
            <p className="text-[10px] text-muted-foreground">Max {unit}</p>
          </div>
          <div className="bg-card rounded-lg border border-border p-3 text-center">
            <TrendingDown size={14} className="mx-auto text-success mb-1" />
            <p className="font-mono text-sm font-bold text-foreground">{stats.min}</p>
            <p className="text-[10px] text-muted-foreground">Min {unit}</p>
          </div>
          <div className="bg-card rounded-lg border border-border p-3 text-center">
            <BarChart3 size={14} className="mx-auto text-primary mb-1" />
            <p className="font-mono text-sm font-bold text-foreground">{stats.avg}</p>
            <p className="text-[10px] text-muted-foreground">Avg {unit}</p>
          </div>
        </div>
      )}

      {/* Readings Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="grid grid-cols-4 gap-2 px-4 py-2.5 border-b border-border text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          <span>Time</span>
          <span className="text-right">Load</span>
          <span className="text-center">Status</span>
          <span className="text-right">Device</span>
        </div>
        <div className="max-h-96 overflow-y-auto divide-y divide-border">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No readings found</div>
          ) : (
            filtered.map(r => (
              <div key={r.id} className="grid grid-cols-4 gap-2 px-4 py-2.5 text-xs">
                <span className="font-mono text-muted-foreground">
                  {format(new Date(r.timestamp), 'HH:mm:ss')}
                </span>
                <span className="font-mono text-right text-foreground font-medium">
                  {r.load_value} {unit}
                </span>
                <span className="text-center">
                  <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                    r.status === 'Overload' ? 'bg-danger/10 text-danger' :
                    r.status === 'Warning' ? 'bg-warning/10 text-warning' :
                    'bg-success/10 text-success'
                  }`}>
                    {r.status}
                  </span>
                </span>
                <span className="font-mono text-right text-muted-foreground truncate">{r.device_id}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
