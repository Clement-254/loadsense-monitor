import { AppSettings, ConnectionType } from '@/types/sensor';
import { Wifi, Bluetooth, Cpu, CheckCircle2 } from 'lucide-react';

interface Props {
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => void;
  isRunning: boolean;
}

const connections: { id: ConnectionType; label: string; description: string; icon: React.ReactNode }[] = [
  { id: 'simulated', label: 'Simulated Sensor', description: 'Demo mode with generated data', icon: <Cpu size={20} /> },
  { id: 'bluetooth', label: 'Bluetooth', description: 'Connect via BLE (not available in web)', icon: <Bluetooth size={20} /> },
  { id: 'wifi', label: 'WiFi / HTTP', description: 'Connect via network (not available in web)', icon: <Wifi size={20} /> },
];

export default function DeviceScreen({ settings, updateSettings, isRunning }: Props) {
  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      <div>
        <h1 className="text-lg font-bold text-foreground">Device Connection</h1>
        <p className="text-xs text-muted-foreground">Select data source for monitoring</p>
      </div>

      <div className="space-y-3">
        {connections.map(conn => {
          const selected = settings.connectionType === conn.id;
          const disabled = conn.id !== 'simulated';
          return (
            <button
              key={conn.id}
              disabled={disabled || isRunning}
              onClick={() => updateSettings({ connectionType: conn.id })}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                selected
                  ? 'border-primary bg-primary/5'
                  : disabled
                  ? 'border-border bg-card opacity-50 cursor-not-allowed'
                  : 'border-border bg-card hover:border-primary/50'
              }`}
            >
              <div className={`p-2 rounded-lg ${selected ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                {conn.icon}
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm text-foreground">{conn.label}</p>
                <p className="text-xs text-muted-foreground">{conn.description}</p>
              </div>
              {selected && <CheckCircle2 size={20} className="text-primary" />}
            </button>
          );
        })}
      </div>

      {/* Data Format Info */}
      <div className="bg-card rounded-xl border border-border p-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Expected Data Format</p>
        <pre className="text-xs font-mono bg-muted/50 rounded-lg p-3 text-foreground overflow-x-auto">
{`{
  "load": 52.4,
  "unit": "kg",
  "timestamp": "2026-03-08T10:20:00"
}`}
        </pre>
      </div>

      {/* Device Info */}
      <div className="bg-card rounded-xl border border-border p-4 space-y-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Device Info</p>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Name</span>
          <span className="font-mono text-foreground">{settings.deviceName}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Connection</span>
          <span className="font-mono text-foreground capitalize">{settings.connectionType}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Status</span>
          <span className={`font-mono ${isRunning ? 'text-success' : 'text-muted-foreground'}`}>
            {isRunning ? 'Active' : 'Idle'}
          </span>
        </div>
      </div>
    </div>
  );
}
