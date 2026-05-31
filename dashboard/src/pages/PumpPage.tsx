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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
      
      {/* COLUMN 1: LIVE OVERRIDES CONTROL */}
      <div className="lg:col-span-1 space-y-6">
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
          className="border rounded-2xl p-6 shadow-xl flex flex-col justify-between transition-all duration-300"
          style={{ backgroundColor: theme.cardBg, borderColor: theme.border, color: theme.text }}
        >
          <div 
            className="flex items-center gap-3 mb-4 pb-2 border-b"
            style={{ borderBottomColor: theme.border }}
          >
            <Timer className="w-5 h-5 shrink-0" style={{ color: theme.primary }} />
            <div>
              <h3 className="text-xs font-black tracking-wider uppercase">
                Motor Safety Limits
              </h3>
              <p className="text-[10px] mt-0.5 font-semibold" style={{ color: theme.subText }}>
                Toggles automated trip if continuous duration exceeds limit
              </p>
            </div>
          </div>

          <div className="py-1">
            <label className="block text-[10px] font-black uppercase mb-2" style={{ color: theme.subText }}>
              Continuous Limit (Minutes)
            </label>
            <div className="flex gap-2">
              <input 
                type="number"
                value={runtime}
                onChange={(e) => setRuntime(e.target.value)}
                min="1"
                max="120"
                className="flex-1 h-10 px-3 rounded-lg focus:outline-none text-sm font-bold border"
                style={{ 
                  backgroundColor: theme.inputBg, 
                  borderColor: theme.border, 
                  color: theme.text 
                }}
              />
              <button
                onClick={handleSaveRuntime}
                className="h-10 px-4 rounded-lg text-white font-extrabold text-xs tracking-wider uppercase border transition-all"
                style={{ 
                  backgroundColor: theme.primary, 
                  borderColor: theme.primary 
                }}
              >
                SAVE
              </button>
            </div>
            
            <div className="h-6 flex justify-end items-center mt-3">
              {runtimeSuccess && (
                <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Protection Updated
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* COLUMN 2: TARGETED PUMP HISTORY LOGS */}
      <div 
        className="lg:col-span-2 border rounded-2xl p-6 shadow-xl flex flex-col relative overflow-hidden transition-all duration-300 h-[480px]"
        style={{ 
          backgroundColor: theme.cardBg, 
          borderColor: theme.border,
          color: theme.text 
        }}
      >
        <div 
          className="w-full flex items-center justify-between mb-4 pb-3 border-b"
          style={{ borderBottomColor: theme.border }}
        >
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5" style={{ color: theme.primary }} />
            <h2 className="text-sm font-bold tracking-widest uppercase">Pump Activity logs</h2>
          </div>
          <span className="text-[10px] font-black tracking-widest uppercase" style={{ color: theme.subText }}>
            Overrides History
          </span>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto pr-1">
          {pumpLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20" style={{ color: theme.subText }}>
              <ShieldAlert className="w-12 h-12 mb-3 opacity-60" strokeWidth={1} />
              <p className="text-xs font-bold uppercase tracking-widest">No pump logs found</p>
              <span className="text-[10px] opacity-75 mt-1">Manual and schedule runs will appear here</span>
            </div>
          ) : (
            pumpLogs.map((log) => (
              <div 
                key={log.id} 
                className="p-3.5 rounded-xl border flex gap-3 transition-all duration-300"
                style={{ 
                  backgroundColor: log.type === 'alert' ? 'rgba(239, 68, 68, 0.08)' : theme.inputBg, 
                  borderColor: theme.border,
                  color: theme.text
                }}
              >
                <Power className="w-5 h-5 shrink-0" style={{ color: log.type === 'alert' ? theme.primary : '#10b981' }} />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline gap-2">
                    <h4 className="text-xs font-black tracking-wide uppercase truncate">
                      {log.title}
                    </h4>
                    <span className="text-[9px] font-semibold shrink-0" style={{ color: theme.subText }}>
                      {new Date(log.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed mt-1 font-semibold" style={{ color: theme.subText }}>
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
