export type LoadUnit = 'kg' | 'N' | 'lb';
export type LoadStatus = 'Normal' | 'Warning' | 'Overload';
export type ConnectionType = 'simulated' | 'bluetooth' | 'wifi';

export interface SensorReading {
  id: string;
  load_value: number;
  timestamp: string;
  device_id: string;
  status: LoadStatus;
  unit: LoadUnit;
}

export interface SensorData {
  load: number;
  unit: LoadUnit;
  timestamp: string;
}

export interface AppSettings {
  loadUnit: LoadUnit;
  overloadThreshold: number;
  warningThreshold: number;
  deviceName: string;
  connectionType: ConnectionType;
}

export interface ReportData {
  startDate: string;
  endDate: string;
  average: number;
  max: number;
  min: number;
  overloadCount: number;
  totalReadings: number;
  readings: SensorReading[];
}

export const DEFAULT_SETTINGS: AppSettings = {
  loadUnit: 'kg',
  overloadThreshold: 100,
  warningThreshold: 80,
  deviceName: 'LoadCell-ESP32',
  connectionType: 'simulated',
};

export function convertLoad(value: number, from: LoadUnit, to: LoadUnit): number {
  // Convert to kg first
  let kg = value;
  if (from === 'N') kg = value / 9.80665;
  if (from === 'lb') kg = value * 0.453592;
  // Convert from kg to target
  if (to === 'kg') return kg;
  if (to === 'N') return kg * 9.80665;
  if (to === 'lb') return kg / 0.453592;
  return kg;
}

export function getStatus(load: number, warning: number, overload: number): LoadStatus {
  if (load >= overload) return 'Overload';
  if (load >= warning) return 'Warning';
  return 'Normal';
}
