import { useState } from 'react';
import { AppSettings, ConnectionType } from '@/types/sensor';
import { Wifi, Bluetooth, Cpu, CheckCircle2, Search, Loader2, AlertCircle, X, Signal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useNativeBluetooth, DiscoveredDevice } from '@/hooks/useNativeBluetooth';
import { useNativeWifi, WifiNetwork } from '@/hooks/useNativeWifi';
import { isNativePlatform } from '@/lib/nativeCapabilities';

interface Props {
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => void;
  isRunning: boolean;
}

const connections: { id: ConnectionType; label: string; description: string; icon: React.ReactNode }[] = [
  { id: 'simulated', label: 'Simulated Sensor', description: 'Demo mode with generated data', icon: <Cpu size={20} /> },
  { id: 'bluetooth', label: 'Bluetooth', description: 'Scan and connect via BLE', icon: <Bluetooth size={20} /> },
  { id: 'wifi', label: 'WiFi / HTTP', description: 'Connect via network IP address', icon: <Wifi size={20} /> },
];

function getRssiLabel(rssi?: number) {
  if (rssi === undefined) return null;
  if (rssi >= -50) return 'Excellent';
  if (rssi >= -60) return 'Good';
  if (rssi >= -70) return 'Fair';
  return 'Weak';
}

export default function DeviceScreen({ settings, updateSettings, isRunning }: Props) {
  const [selectedDevice, setSelectedDevice] = useState<DiscoveredDevice | WifiNetwork | null>(null);
  const [wifiIp, setWifiIp] = useState('');
  const [wifiPort, setWifiPort] = useState('80');
  const [wifiConnecting, setWifiConnecting] = useState(false);
  const [expandedType, setExpandedType] = useState<ConnectionType | null>(null);

  const bluetooth = useNativeBluetooth();
  const wifi = useNativeWifi();

  const handleSelectConnection = (id: ConnectionType) => {
    if (isRunning) return;
    if (id === 'simulated') {
      updateSettings({ connectionType: id });
      setExpandedType(null);
      setSelectedDevice(null);
    } else {
      setExpandedType(expandedType === id ? null : id);
    }
  };

  const connectBluetoothDevice = (device: DiscoveredDevice) => {
    setSelectedDevice(device);
    updateSettings({ connectionType: 'bluetooth', deviceName: device.name });
    toast.success(`Connected to ${device.name}`);
  };

  const connectWifiDevice = (device: WifiNetwork) => {
    setSelectedDevice(device);
    updateSettings({ connectionType: 'wifi', deviceName: device.name });
    toast.success(`Connected to ${device.name}`);
  };

  const connectWifi = async () => {
    if (!wifiIp.trim()) { toast.error('Please enter an IP address'); return; }
    setWifiConnecting(true);
    try {
      const url = `http://${wifiIp.trim()}:${wifiPort}/`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      try { await fetch(url, { signal: controller.signal, mode: 'no-cors' }); clearTimeout(timeout); }
      catch { clearTimeout(timeout); }

      const device: WifiNetwork = { id: `wifi-${wifiIp}`, name: `Device@${wifiIp}:${wifiPort}`, type: 'wifi', ip: `${wifiIp}:${wifiPort}` };
      setSelectedDevice(device);
      updateSettings({ connectionType: 'wifi', deviceName: device.name });
      toast.success(`Connected to ${wifiIp}:${wifiPort}`);
    } catch { toast.error('Connection failed. Check IP and port.'); }
    setWifiConnecting(false);
  };

  const disconnectDevice = () => {
    setSelectedDevice(null);
    updateSettings({ connectionType: 'simulated', deviceName: 'LoadCell-ESP32' });
    setExpandedType(null);
    toast.info('Device disconnected');
  };

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      <div>
        <h1 className="text-lg font-bold text-foreground">Device Connection</h1>
        <p className="text-xs text-muted-foreground">
          Select data source for monitoring
          {isNativePlatform() && <span className="ml-1 text-primary">(Native mode)</span>}
        </p>
      </div>

      {/* Connected Device Banner */}
      {selectedDevice && (
        <div className="bg-primary/10 border border-primary rounded-xl p-4 flex items-center gap-3">
          <CheckCircle2 size={20} className="text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{selectedDevice.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{selectedDevice.type} connection</p>
          </div>
          <Button variant="ghost" size="icon" onClick={disconnectDevice} disabled={isRunning} className="shrink-0 h-8 w-8">
            <X size={16} />
          </Button>
        </div>
      )}

      {/* Connection Options */}
      <div className="space-y-3">
        {connections.map(conn => {
          const selected = settings.connectionType === conn.id && (conn.id === 'simulated' || selectedDevice?.type === conn.id);
          const expanded = expandedType === conn.id;
          return (
            <div key={conn.id} className="space-y-2">
              <button
                disabled={isRunning}
                onClick={() => handleSelectConnection(conn.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                  selected ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/50'
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
                {conn.id !== 'simulated' && !selected && <Search size={18} className="text-muted-foreground" />}
              </button>

              {/* Bluetooth Scan Panel */}
              {conn.id === 'bluetooth' && expanded && (
                <div className="bg-card border border-border rounded-xl p-4 space-y-3 ml-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Bluetooth Devices</p>
                    <Button size="sm" variant="outline" onClick={bluetooth.scan} disabled={bluetooth.scanning} className="h-8 text-xs">
                      {bluetooth.scanning ? <Loader2 size={14} className="animate-spin mr-1" /> : <Search size={14} className="mr-1" />}
                      {bluetooth.scanning ? 'Scanning...' : 'Scan'}
                    </Button>
                  </div>

                  {bluetooth.devices.length === 0 && !bluetooth.scanning && (
                    <div className="flex flex-col items-center py-6 text-center">
                      <Bluetooth size={32} className="text-muted-foreground/40 mb-2" />
                      <p className="text-xs text-muted-foreground">Tap "Scan" to search for nearby Bluetooth devices</p>
                    </div>
                  )}

                  {bluetooth.scanning && bluetooth.devices.length === 0 && (
                    <div className="flex flex-col items-center py-6">
                      <Loader2 size={28} className="text-primary animate-spin mb-2" />
                      <p className="text-xs text-muted-foreground">Searching for devices...</p>
                    </div>
                  )}

                  {bluetooth.devices.map(device => (
                    <button
                      key={device.id}
                      onClick={() => connectBluetoothDevice(device)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30 hover:bg-primary/5 hover:border-primary/50 transition-all text-left"
                    >
                      <Bluetooth size={16} className="text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{device.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{device.id}</p>
                      </div>
                      {device.rssi !== undefined && (
                        <div className="text-right shrink-0">
                          <p className="text-xs text-muted-foreground font-mono">{device.rssi} dBm</p>
                          <p className="text-[10px] text-muted-foreground">{getRssiLabel(device.rssi)}</p>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* WiFi Connection Panel */}
              {conn.id === 'wifi' && expanded && (
                <div className="bg-card border border-border rounded-xl p-4 space-y-3 ml-2">
                  {/* Auto-Discovery Section */}
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {isNativePlatform() ? 'WiFi Networks' : 'Network Discovery'}
                    </p>
                    <Button size="sm" variant="outline" onClick={wifi.scan} disabled={wifi.scanning} className="h-8 text-xs">
                      {wifi.scanning ? <Loader2 size={14} className="animate-spin mr-1" /> : <Search size={14} className="mr-1" />}
                      {wifi.scanning ? 'Scanning...' : 'Scan Network'}
                    </Button>
                  </div>

                  {wifi.networks.length === 0 && !wifi.scanning && (
                    <div className="flex flex-col items-center py-4 text-center">
                      <Wifi size={28} className="text-muted-foreground/40 mb-2" />
                      <p className="text-xs text-muted-foreground">Tap "Scan Network" to discover available WiFi networks</p>
                    </div>
                  )}

                  {wifi.scanning && wifi.networks.length === 0 && (
                    <div className="flex flex-col items-center py-4">
                      <Loader2 size={24} className="text-primary animate-spin mb-2" />
                      <p className="text-xs text-muted-foreground">Scanning for WiFi networks...</p>
                    </div>
                  )}

                  {wifi.networks.map(network => (
                    <button
                      key={network.id}
                      onClick={() => connectWifiDevice(network)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30 hover:bg-primary/5 hover:border-primary/50 transition-all text-left"
                    >
                      <Wifi size={16} className="text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{network.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {network.ip || network.ssid || 'WiFi Network'}
                          {network.frequency ? ` · ${network.frequency >= 5000 ? '5 GHz' : '2.4 GHz'}` : ''}
                        </p>
                      </div>
                      {network.rssi !== undefined && (
                        <div className="text-right shrink-0">
                          <Signal size={14} className="text-muted-foreground" />
                          <p className="text-[10px] text-muted-foreground">{getRssiLabel(network.rssi)}</p>
                        </div>
                      )}
                    </button>
                  ))}

                  {/* Manual Connection Divider */}
                  <div className="relative py-1">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-card px-2 text-muted-foreground">or connect manually</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground">Device IP Address</label>
                    <Input placeholder="192.168.1.100" value={wifiIp} onChange={e => setWifiIp(e.target.value)} className="h-9 text-sm font-mono" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground">Port</label>
                    <Input placeholder="80" value={wifiPort} onChange={e => setWifiPort(e.target.value)} className="h-9 text-sm font-mono" />
                  </div>

                  <div className="flex items-start gap-2 p-2 rounded-lg bg-muted/50">
                    <AlertCircle size={14} className="text-muted-foreground shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground">
                      Ensure your device is on the same network and serving data at the expected endpoint.
                    </p>
                  </div>

                  <Button onClick={connectWifi} disabled={wifiConnecting || !wifiIp.trim()} className="w-full h-9 text-sm">
                    {wifiConnecting ? <Loader2 size={14} className="animate-spin mr-2" /> : <Wifi size={14} className="mr-2" />}
                    {wifiConnecting ? 'Connecting...' : 'Connect Manually'}
                  </Button>
                </div>
              )}
            </div>
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
          <span className="text-muted-foreground">Platform</span>
          <span className="font-mono text-foreground">{isNativePlatform() ? 'Native' : 'Web'}</span>
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
