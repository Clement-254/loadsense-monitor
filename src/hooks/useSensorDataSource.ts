import { useEffect, useRef, useCallback, useState } from 'react';
import { SensorReading, SensorData, getStatus, AppSettings, convertLoad } from '@/types/sensor';
import { isNativePlatform } from '@/lib/nativeCapabilities';

/**
 * Unified data source hook that reads from the connected device
 * (Bluetooth BLE or WiFi/HTTP) or falls back to simulation.
 */
export function useSensorDataSource(
  settings: AppSettings,
  onReading: (reading: SensorReading) => void,
) {
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bleCharRef = useRef<any>(null);
  const abortRef = useRef<AbortController | null>(null);

  // --- Simulation fallback refs ---
  const baseLoadRef = useRef(50);
  const trendRef = useRef(0);

  const processRawData = useCallback((data: SensorData) => {
    // Convert load to the user's chosen unit if needed
    const loadInUnit = data.unit !== settings.loadUnit
      ? convertLoad(data.load, data.unit, settings.loadUnit)
      : data.load;
    const rounded = Math.round(loadInUnit * 10) / 10;
    const status = getStatus(rounded, settings.warningThreshold, settings.overloadThreshold);

    const reading: SensorReading = {
      id: crypto.randomUUID(),
      load_value: rounded,
      timestamp: data.timestamp || new Date().toISOString(),
      device_id: settings.deviceName,
      status,
      unit: settings.loadUnit,
    };
    onReading(reading);
  }, [settings, onReading]);

  // ──────────────── Bluetooth BLE data stream ────────────────
  const startBluetooth = useCallback(async () => {
    if (isNativePlatform()) {
      try {
        const { BleClient } = await import('@capacitor-community/bluetooth-le');
        await BleClient.initialize();

        // Request device — user picks from the native dialog
        const device = await BleClient.requestDevice({ services: [] });

        // Connect and discover services
        await BleClient.connect(device.deviceId);

        // Try common UART/custom service UUIDs for load cell data
        // Typical ESP32 custom service
        const SERVICE_UUID = '0000ffe0-0000-1000-8000-00805f9b34fb';
        const CHAR_UUID = '0000ffe1-0000-1000-8000-00805f9b34fb';

        await BleClient.startNotifications(device.deviceId, SERVICE_UUID, CHAR_UUID, (value) => {
          try {
            const decoder = new TextDecoder();
            const jsonStr = decoder.decode(value.buffer);
            const data: SensorData = JSON.parse(jsonStr);
            processRawData(data);
          } catch (err) {
            console.warn('BLE parse error:', err);
          }
        });

        bleCharRef.current = { deviceId: device.deviceId, SERVICE_UUID, CHAR_UUID };
        setIsRunning(true);
      } catch (err: any) {
        console.error('BLE connection error:', err);
        throw new Error('Bluetooth connection failed: ' + (err.message || 'Unknown error'));
      }
    } else if ('bluetooth' in navigator) {
      // Web Bluetooth fallback
      try {
        const device = await (navigator as any).bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: ['0000ffe0-0000-1000-8000-00805f9b34fb'],
        });
        const server = await device.gatt.connect();
        const service = await server.getPrimaryService('0000ffe0-0000-1000-8000-00805f9b34fb');
        const char = await service.getCharacteristic('0000ffe1-0000-1000-8000-00805f9b34fb');
        await char.startNotifications();
        char.addEventListener('characteristicvaluechanged', (event: any) => {
          try {
            const decoder = new TextDecoder();
            const jsonStr = decoder.decode(event.target.value.buffer);
            const data: SensorData = JSON.parse(jsonStr);
            processRawData(data);
          } catch (err) {
            console.warn('BLE parse error:', err);
          }
        });
        bleCharRef.current = { webChar: char, server };
        setIsRunning(true);
      } catch (err: any) {
        throw new Error('Web Bluetooth failed: ' + (err.message || 'Unknown error'));
      }
    } else {
      throw new Error('Bluetooth is not available on this platform');
    }
  }, [processRawData]);

  // ──────────────── WiFi / HTTP polling ────────────────
  const startWifi = useCallback(() => {
    // Extract IP from deviceName (format: "Device@ip:port" or "name.local")
    // The actual endpoint is stored via settings
    const deviceName = settings.deviceName;
    let url = '';

    // Try to extract IP:port from device name
    const atMatch = deviceName.match(/@(.+)$/);
    if (atMatch) {
      url = `http://${atMatch[1]}/`;
    } else {
      // Try common patterns
      url = `http://${deviceName}/`;
    }

    abortRef.current = new AbortController();

    // Poll the device every second
    intervalRef.current = setInterval(async () => {
      try {
        const response = await fetch(url, {
          signal: abortRef.current?.signal,
          headers: { 'Accept': 'application/json' },
        });
        if (response.ok) {
          const data: SensorData = await response.json();
          processRawData(data);
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.warn('WiFi poll error:', err.message);
        }
      }
    }, 1000);

    setIsRunning(true);
  }, [settings.deviceName, processRawData]);

  // ──────────────── Simulated data ────────────────
  const startSimulated = useCallback(() => {
    intervalRef.current = setInterval(() => {
      trendRef.current += (Math.random() - 0.5) * 2;
      trendRef.current = Math.max(-20, Math.min(20, trendRef.current));

      const noise = (Math.random() - 0.5) * 5;
      const spike = Math.random() > 0.95 ? (Math.random() * 40 + 20) : 0;
      const load = Math.max(0, baseLoadRef.current + trendRef.current + noise + spike);

      processRawData({
        load: Math.round(load * 10) / 10,
        unit: settings.loadUnit,
        timestamp: new Date().toISOString(),
      });
    }, 1000);

    setIsRunning(true);
  }, [settings.loadUnit, processRawData]);

  // ──────────────── Start / Stop ────────────────
  const stop = useCallback(async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    if (bleCharRef.current) {
      try {
        if (bleCharRef.current.deviceId) {
          const { BleClient } = await import('@capacitor-community/bluetooth-le');
          await BleClient.stopNotifications(
            bleCharRef.current.deviceId,
            bleCharRef.current.SERVICE_UUID,
            bleCharRef.current.CHAR_UUID,
          );
          await BleClient.disconnect(bleCharRef.current.deviceId);
        } else if (bleCharRef.current.server) {
          bleCharRef.current.server.disconnect();
        }
      } catch (err) {
        console.warn('BLE disconnect error:', err);
      }
      bleCharRef.current = null;
    }
    setIsRunning(false);
  }, []);

  const start = useCallback(async () => {
    await stop();

    switch (settings.connectionType) {
      case 'bluetooth':
        await startBluetooth();
        break;
      case 'wifi':
        startWifi();
        break;
      case 'simulated':
      default:
        startSimulated();
        break;
    }
  }, [settings.connectionType, stop, startBluetooth, startWifi, startSimulated]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  return { isRunning, start, stop };
}
