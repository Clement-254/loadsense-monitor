import { Activity, Wifi, History, FileText, Settings } from 'lucide-react';

type Screen = 'dashboard' | 'device' | 'history' | 'reports' | 'settings';

interface Props {
  current: Screen;
  onChange: (s: Screen) => void;
}

const tabs: { id: Screen; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <Activity size={20} /> },
  { id: 'device', label: 'Device', icon: <Wifi size={20} /> },
  { id: 'history', label: 'History', icon: <History size={20} /> },
  { id: 'reports', label: 'Reports', icon: <FileText size={20} /> },
  { id: 'settings', label: 'Settings', icon: <Settings size={20} /> },
];

export default function AppNavigation({ current, onChange }: Props) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border backdrop-blur-lg bg-opacity-95 z-50">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors ${
              current === tab.id
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.icon}
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
