import { useState, useCallback, useMemo } from 'react';
import { SensorReading } from '@/types/sensor';
import { useSettings } from '@/hooks/useSettings';
import { useDataStore } from '@/hooks/useDataStore';
import { useSensorDataSource } from '@/hooks/useSensorDataSource';
import { ThemeProvider } from '@/hooks/useTheme';
import Dashboard from '@/components/Dashboard';
import HistoryScreen from '@/components/HistoryScreen';
import ReportsScreen from '@/components/ReportsScreen';
import SettingsScreen from '@/components/SettingsScreen';
import DeviceScreen from '@/components/DeviceScreen';
import AppNavigation from '@/components/AppNavigation';

type Screen = 'dashboard' | 'device' | 'history' | 'reports' | 'settings';

function AppContent() {
  const [screen, setScreen] = useState<Screen>('dashboard');
  const { settings, updateSettings, resetSettings } = useSettings();
  const { readings, addReading, clearReadings, getReadingsInRange } = useDataStore();
  const [liveData, setLiveData] = useState<SensorReading[]>([]);

  const handleReading = useCallback((reading: SensorReading) => {
    addReading(reading);
    setLiveData(prev => {
      const next = [...prev, reading];
      return next.length > 60 ? next.slice(-60) : next;
    });
  }, [addReading]);

  const { isRunning, start, stop } = useSensorDataSource(settings, handleReading);

  const latestReading = liveData.length > 0 ? liveData[liveData.length - 1] : null;

  const content = useMemo(() => {
    switch (screen) {
      case 'dashboard':
        return (
          <Dashboard
            latestReading={latestReading}
            liveData={liveData}
            isRunning={isRunning}
            onStart={start}
            onStop={stop}
            settings={settings}
          />
        );
      case 'device':
        return (
          <DeviceScreen
            settings={settings}
            updateSettings={updateSettings}
            isRunning={isRunning}
          />
        );
      case 'history':
        return (
          <HistoryScreen
            readings={readings}
            unit={settings.loadUnit}
          />
        );
      case 'reports':
        return (
          <ReportsScreen
            readings={readings}
            unit={settings.loadUnit}
          />
        );
      case 'settings':
        return (
          <SettingsScreen
            settings={settings}
            updateSettings={updateSettings}
            resetSettings={resetSettings}
            clearData={clearReadings}
          />
        );
    }
  }, [screen, latestReading, liveData, isRunning, start, stop, settings, readings, updateSettings, resetSettings, clearReadings]);

  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="flex-1 overflow-y-auto pb-20">
        {content}
      </div>
      <AppNavigation current={screen} onChange={setScreen} />
    </div>
  );
}

const Index = () => (
  <ThemeProvider>
    <AppContent />
  </ThemeProvider>
);

export default Index;
