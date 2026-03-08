import { useState, useCallback } from 'react';
import { SensorReading } from '@/types/sensor';

const STORAGE_KEY = 'loadsense-readings';

function loadReadings(): SensorReading[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [];
}

function saveReadings(readings: SensorReading[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(readings));
}

export function useDataStore() {
  const [readings, setReadings] = useState<SensorReading[]>(loadReadings);

  const addReading = useCallback((reading: SensorReading) => {
    setReadings(prev => {
      const next = [...prev, reading];
      // Keep last 10000 readings
      const trimmed = next.length > 10000 ? next.slice(-10000) : next;
      saveReadings(trimmed);
      return trimmed;
    });
  }, []);

  const clearReadings = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setReadings([]);
  }, []);

  const getReadingsInRange = useCallback((start: Date, end: Date) => {
    return readings.filter(r => {
      const t = new Date(r.timestamp);
      return t >= start && t <= end;
    });
  }, [readings]);

  return { readings, addReading, clearReadings, getReadingsInRange };
}

