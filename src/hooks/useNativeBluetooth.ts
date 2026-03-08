import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { isNativePlatform } from '@/lib/nativeCapabilities';

export interface DiscoveredDevice {
  id: string;
  name: string;
  type: 'bluetooth' | 'wifi';
  rssi?: number;
  ip?: string;
}

export function useNativeBluetooth() {
  const [scanning, setScanning] = useState(false);
  const [devices, setDevices] = useState<DiscoveredDevice[]>([]);

  const scan = useCallback(async () => {
    setScanning(true);
    setDevices([]);

    if (isNativePlatform()) {
      // Use Capacitor BLE plugin on native
      try {
        const { BleClient } = await import('@capacitor-community/bluetooth-le');
        await BleClient.initialize();

        const found: DiscoveredDevice[] = [];

        await BleClient.requestLEScan({}, (result) => {
          const existing = found.find(d => d.id === result.device.deviceId);
          if (!existing) {
            const device: DiscoveredDevice = {
              id: result.device.deviceId,
              name: result.device.name || result.localName || 'Unknown Device',
              type: 'bluetooth',
              rssi: result.rssi,
            };
            found.push(device);
            setDevices([...found]);
          }
        });

        // Scan for 5 seconds then stop
        await new Promise(r => setTimeout(r, 5000));
        await BleClient.stopLEScan();

        if (found.length === 0) {
          toast.info('No Bluetooth devices found');
        } else {
          toast.success(`Found ${found.length} Bluetooth device(s)`);
        }
      } catch (err: any) {
        console.error('BLE scan error:', err);
        toast.error('Bluetooth scan failed: ' + (err.message || 'Unknown error'));
      }
    } else if ('bluetooth' in navigator) {
      // Web Bluetooth API fallback
      try {
        const device = await (navigator as any).bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: ['generic_access', 'battery_service'],
        });
        const discovered: DiscoveredDevice = {
          id: device.id,
          name: device.name || 'Unknown Device',
          type: 'bluetooth',
        };
        setDevices(prev => [...prev, discovered]);
        toast.success(`Found: ${discovered.name}`);
      } catch (err: any) {
        if (err.name !== 'NotFoundError') {
          toast.error('Bluetooth scan failed: ' + (err.message || 'Unknown error'));
        }
      }
    } else {
      // Simulation fallback for web preview
      toast.info('Bluetooth not available — showing simulated devices');
      await new Promise(r => setTimeout(r, 2000));
      const simulated: DiscoveredDevice[] = [
        { id: 'bt-esp32-001', name: 'LoadCell-ESP32', type: 'bluetooth', rssi: -45 },
        { id: 'bt-esp32-002', name: 'ESP32-LoadSensor', type: 'bluetooth', rssi: -62 },
        { id: 'bt-arduino-001', name: 'Arduino-HX711', type: 'bluetooth', rssi: -78 },
      ];
      setDevices(simulated);
      toast.success(`Found ${simulated.length} simulated devices`);
    }

    setScanning(false);
  }, []);

  return { scanning, devices, scan };
}
