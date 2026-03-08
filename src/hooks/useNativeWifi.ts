import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { isNativePlatform, isAndroid } from '@/lib/nativeCapabilities';

export interface WifiNetwork {
  id: string;
  name: string;
  type: 'wifi';
  rssi?: number;
  ip?: string;
  ssid?: string;
  frequency?: number;
}

export function useNativeWifi() {
  const [scanning, setScanning] = useState(false);
  const [networks, setNetworks] = useState<WifiNetwork[]>([]);

  const scan = useCallback(async () => {
    setScanning(true);
    setNetworks([]);

    if (isNativePlatform() && isAndroid()) {
      // Use @capgo/capacitor-wifi for real WiFi scanning on Android
      try {
        const { CapacitorWifi } = await import('@capgo/capacitor-wifi');

        // Get available networks (the plugin handles scanning internally)
        const result = await CapacitorWifi.getAvailableNetworks();

        const discovered: WifiNetwork[] = (result.networks || []).map((network: any, index: number) => ({
          id: `wifi-${network.ssid || index}-${index}`,
          name: network.ssid || `Hidden Network ${index + 1}`,
          type: 'wifi' as const,
          rssi: network.level ?? network.rssi,
          ssid: network.ssid,
          frequency: network.frequency,
        }));

        setNetworks(discovered);

        if (discovered.length === 0) {
          toast.info('No WiFi networks found. Ensure WiFi and location are enabled.');
        } else {
          toast.success(`Found ${discovered.length} WiFi network(s)`);
        }
      } catch (err: any) {
        console.error('WiFi scan error:', err);
        toast.error('WiFi scan failed: ' + (err.message || 'Unknown error. Ensure location permissions are granted.'));
      }
    } else {
      // Simulation fallback for web preview or iOS
      const platform = isNativePlatform() ? 'iOS (WiFi scanning not supported)' : 'Web browser';
      toast.info(`${platform} — showing simulated networks`);
      await new Promise(r => setTimeout(r, 2500));

      const simulated: WifiNetwork[] = [
        { id: 'wifi-1', name: 'LoadCell-ESP32.local', type: 'wifi', rssi: -35, ip: '192.168.1.50:80' },
        { id: 'wifi-2', name: 'HX711-Sensor.local', type: 'wifi', rssi: -52, ip: '192.168.1.105:8080' },
        { id: 'wifi-3', name: 'LoadMonitor-RPi.local', type: 'wifi', rssi: -68, ip: '10.0.0.42:5000' },
      ];
      setNetworks(simulated);
      toast.success(`Found ${simulated.length} simulated networks`);
    }

    setScanning(false);
  }, []);

  return { scanning, networks, scan };
}
