import { useEffect, useRef, useCallback, useState } from 'react';
import { SensorReading, getStatus, AppSettings } from '@/types/sensor';

export function useSimulator(
  settings: AppSettings,
  onReading: (reading: SensorReading) => void,
) {
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const baseLoadRef = useRef(50);
  const trendRef = useRef(0);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
  }, []);

  const start = useCallback(() => {
    stop();
    setIsRunning(true);

    intervalRef.current = setInterval(() => {
      // Simulate realistic load cell drift + noise + occasional spikes
      trendRef.current += (Math.random() - 0.5) * 2;
      trendRef.current = Math.max(-20, Math.min(20, trendRef.current));

      const noise = (Math.random() - 0.5) * 5;
      const spike = Math.random() > 0.95 ? (Math.random() * 40 + 20) : 0;
      const load = Math.max(0, baseLoadRef.current + trendRef.current + noise + spike);
      const roundedLoad = Math.round(load * 10) / 10;

      const status = getStatus(roundedLoad, settings.warningThreshold, settings.overloadThreshold);

      const reading: SensorReading = {
        id: crypto.randomUUID(),
        load_value: roundedLoad,
        timestamp: new Date().toISOString(),
        device_id: settings.deviceName,
        status,
        unit: settings.loadUnit,
      };

      onReading(reading);
    }, 1000);
  }, [settings, onReading, stop]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return { isRunning, start, stop };
}
