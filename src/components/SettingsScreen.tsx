import { AppSettings, LoadUnit } from '@/types/sensor';
import { useTheme } from '@/hooks/useTheme';
import { Sun, Moon, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface Props {
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => void;
  resetSettings: () => void;
  clearData: () => void;
}

const units: LoadUnit[] = ['kg', 'N', 'lb'];

export default function SettingsScreen({ settings, updateSettings, resetSettings, clearData }: Props) {
  const { theme, toggleTheme } = useTheme();
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      <div>
        <h1 className="text-lg font-bold text-foreground">Settings</h1>
        <p className="text-xs text-muted-foreground">Configure monitoring preferences</p>
      </div>

      {/* Theme Toggle */}
      <div className="bg-card rounded-xl border border-border p-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">Theme</p>
          <p className="text-xs text-muted-foreground">{theme === 'dark' ? 'Dark mode' : 'Light mode'}</p>
        </div>
        <button onClick={toggleTheme} className="p-2 rounded-lg bg-muted text-foreground hover:bg-accent transition-colors">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      {/* Load Unit */}
      <div className="bg-card rounded-xl border border-border p-4 space-y-3">
        <p className="text-sm font-medium text-foreground">Load Unit</p>
        <div className="grid grid-cols-3 gap-2">
          {units.map(u => (
            <button
              key={u}
              onClick={() => updateSettings({ loadUnit: u })}
              className={`py-2 rounded-lg text-sm font-mono font-semibold transition-colors ${
                settings.loadUnit === u
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {u}
            </button>
          ))}
        </div>
      </div>

      {/* Thresholds */}
      <div className="bg-card rounded-xl border border-border p-4 space-y-4">
        <p className="text-sm font-medium text-foreground">Thresholds</p>
        <div>
          <label className="text-xs text-muted-foreground">Overload Threshold ({settings.loadUnit})</label>
          <input
            type="number"
            value={settings.overloadThreshold}
            onChange={e => updateSettings({ overloadThreshold: Number(e.target.value) })}
            className="w-full mt-1 bg-muted border border-border rounded-lg px-3 py-2 text-sm font-mono text-foreground"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Warning Threshold ({settings.loadUnit})</label>
          <input
            type="number"
            value={settings.warningThreshold}
            onChange={e => updateSettings({ warningThreshold: Number(e.target.value) })}
            className="w-full mt-1 bg-muted border border-border rounded-lg px-3 py-2 text-sm font-mono text-foreground"
          />
        </div>
      </div>

      {/* Device Name */}
      <div className="bg-card rounded-xl border border-border p-4">
        <label className="text-sm font-medium text-foreground">Device Name</label>
        <input
          type="text"
          value={settings.deviceName}
          onChange={e => updateSettings({ deviceName: e.target.value })}
          className="w-full mt-2 bg-muted border border-border rounded-lg px-3 py-2 text-sm font-mono text-foreground"
        />
      </div>

      {/* Clear Data */}
      <div className="space-y-3">
        {!showConfirm ? (
          <button
            onClick={() => setShowConfirm(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-danger/30 text-danger text-sm font-semibold hover:bg-danger/5 transition-colors"
          >
            <Trash2 size={16} /> Clear All Data
          </button>
        ) : (
          <div className="bg-danger/5 border border-danger/30 rounded-xl p-4 space-y-3">
            <p className="text-sm text-foreground font-medium">Are you sure? This will delete all readings.</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => { clearData(); resetSettings(); setShowConfirm(false); }}
                className="py-2 rounded-lg bg-danger text-danger-foreground text-sm font-semibold"
              >
                Yes, Clear
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="py-2 rounded-lg bg-muted text-foreground text-sm font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
