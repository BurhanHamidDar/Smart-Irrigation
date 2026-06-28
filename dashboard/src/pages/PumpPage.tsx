import React, { useState } from 'react';
import { Power, Timer, Bell, ShieldAlert, Check } from 'lucide-react';
import { AppTheme } from '../App';
import { SystemState, SystemLog } from '../hooks/useFirebaseSync';
import PumpControlCard from '../components/PumpControlCard';

interface PumpPageProps {
  state: SystemState;
  logs: SystemLog[];
  theme: AppTheme;
  setPumpState: (state: number) => void;
  resetPumpProtection: () => void;
  setMaxRuntimeMinutes: (min: number) => void;
}

export default function PumpPage({
  state,
  logs,
  theme,
  setPumpState,
  resetPumpProtection,
  setMaxRuntimeMinutes
}: PumpPageProps) {
  const [runtime, setRuntime] = useState(state.maxRuntimeMinutes.toString());
  const [runtimeSuccess, setRuntimeSuccess] = useState(false);

  // Sync state changes to local input
  React.useEffect(() => {
    setRuntime(state.maxRuntimeMinutes.toString());
  }, [state.maxRuntimeMinutes]);

  const handleSaveRuntime = () => {
    const r = parseInt(runtime, 10);
    if (isNaN(r) || r < 1 || r > 120) {
      alert("Invalid Limit!\nEnter a continuous runtime limit between 1 and 120 minutes.");
      return;
    }
    setMaxRuntimeMinutes(r);
    setRuntimeSuccess(true);
    setTimeout(() => setRuntimeSuccess(false), 3000);
  };

  // Filter logs relating specifically to the pump
  const pumpLogs = logs.filter(l => 
    l.title.toUpperCase().includes('PUMP') || 
    l.title.toUpperCase().includes('PROTECTION')
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      
      {/* COLUMN 1: LIVE OVERRIDES CONTROL */}
      <div className="lg:col-span-1 space-y-5">
        <PumpControlCard 
          relay={state.relay}
          autoMode={state.auto}
          pumpProtection={state.pumpProtection}
          pumpStartTimeEpoch={state.pumpStartTimeEpoch}
          maxRuntimeMinutes={state.maxRuntimeMinutes}
          rainPredicted={state.weather?.rainPredicted || false}
          rainChance={state.weather?.rainChance || 0}
          forecastWindowHours={state.weather?.forecastWindowHours || 12}
          setPumpState={setPumpState}
          resetPumpProtection={resetPumpProtection}
          theme={theme}
        />

        {/* RUNTIME PROTECTION CONFIGURATION */}
        <div 
          className="border rounded-xl p-5"
          style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder, boxShadow: theme.cardShadow, color: theme.text }}
        >
          <div 
            className="flex items-center gap-2 mb-4 pb-2 border-b"
            style={{ borderBottomColor: theme.cardBorder }}
          >
            <Timer className="w-4 h-4 shrink-0" style={{ color: theme.primary }} />
            <div>
              <h3 className="text-sm font-semibold">
                Motor Safety Limits
              </h3>
              <p className="text-xs" style={{ color: theme.subText }}>
                Auto turns off pump if running limit is exceeded
              </p>
            </div>
          </div>

          <div className="py-1">
            <label className="block text-xs font-semibold mb-2" style={{ color: theme.subText }}>
              Continuous Limit (Minutes)
            </label>
            <div className="flex gap-2">
              <input 
                type="number"
                value={runtime}
                onChange={(e) => setRuntime(e.target.value)}
                min="1"
                max="120"
                className="flex-1 h-10 px-3 rounded-lg focus:outline-none text-sm font-semibold border"
                style={{ 
                  backgroundColor: theme.inputBg, 
                  borderColor: theme.inputBorder, 
                  color: theme.text 
                }}
              />
              <button
                onClick={handleSaveRuntime}
                className="h-10 px-4 rounded-lg text-white font-medium text-xs border transition-colors cursor-pointer"
                style={{ 
                  backgroundColor: theme.primary, 
                  borderColor: theme.primary 
                }}
              >
                Save
              </button>
            </div>
            
            <div className="h-6 flex justify-end items-center mt-2">
              {runtimeSuccess && (
                <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Protection Updated
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* COLUMN 2: TARGETED PUMP HISTORY LOGS */}
      <div 
        className="lg:col-span-2 border rounded-xl p-5 flex flex-col h-[480px]"
        style={{ 
          backgroundColor: theme.cardBg, 
          borderColor: theme.cardBorder,
          boxShadow: theme.cardShadow,
          color: theme.text 
        }}
      >
        <div 
          className="w-full flex items-center justify-between mb-4 pb-3 border-b"
          style={{ borderBottomColor: theme.cardBorder }}
        >
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4" style={{ color: theme.primary }} />
            <h2 className="text-sm font-semibold">Pump Activity Logs</h2>
          </div>
          <span className="text-xs" style={{ color: theme.subText }}>
            Overrides History
          </span>
        </div>

        <div className="flex-1 space-y-2.5 overflow-y-auto pr-1">
          {pumpLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20" style={{ color: theme.subText }}>
              <ShieldAlert className="w-10 h-10 mb-2 opacity-50 animate-none" strokeWidth={1.5} />
              <p className="text-xs font-semibold uppercase tracking-wider">No pump logs found</p>
              <span className="text-xs opacity-70 mt-0.5">Manual and schedule runs will appear here</span>
            </div>
          ) : (
            pumpLogs.map((log) => (
              <div 
                key={log.id} 
                className="p-3 rounded-lg border flex gap-3"
                style={{ 
                  backgroundColor: log.type === 'alert' ? '#fef2f2' : theme.inputBg, 
                  borderColor: log.type === 'alert' ? '#fecaca' : theme.cardBorder,
                  color: theme.text
                }}
              >
                <Power className="w-4.5 h-4.5 shrink-0" style={{ color: log.type === 'alert' ? theme.danger : '#2e7d52' }} />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline gap-2">
                    <h4 className="text-xs font-semibold truncate" style={{ color: log.type === 'alert' ? '#c0392b' : theme.text }}>
                      {log.title}
                    </h4>
                    <span className="text-[10px] font-semibold shrink-0" style={{ color: theme.subText }}>
                      {new Date(log.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: theme.subText }}>
                    {log.desc}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
