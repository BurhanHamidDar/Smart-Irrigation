import React from 'react';
import { Cpu, ToggleLeft, ToggleRight, Droplet, Power, CloudSun, Calendar, Wifi, BellRing, ArrowRight } from 'lucide-react';
import { AppTheme } from '../App';
import { SystemState, SystemLog } from '../hooks/useFirebaseSync';

interface OverviewPageProps {
  state: SystemState;
  deviceConnected: boolean;
  lastCommunication: Date | null;
  logs: SystemLog[];
  theme: AppTheme;
  setAutoMode: (mode: number) => void;
  setPage: (page: string) => void;
}

export default function OverviewPage({
  state,
  deviceConnected,
  lastCommunication,
  logs,
  theme,
  setAutoMode,
  setPage
}: OverviewPageProps) {
  
  const handleToggleAuto = () => {
    setAutoMode(state.auto === 1 ? 0 : 1);
  };

  // Convert raw moisture (0-1024) to percentage
  const moisturePercent = state.moisture > 0 ? Math.max(0, Math.min(100, Math.round((state.moisture / 1024) * 100))) : 0;
  
  let moistureLevel = 'DRY';
  let moistureColor = theme.primary;
  if (state.moisture >= 400 && state.moisture <= 700) {
    moistureLevel = 'MODERATE';
    moistureColor = '#f59e0b';
  } else if (state.moisture > 700) {
    moistureLevel = 'WET';
    moistureColor = '#10b981';
  }

  const formatTime = (date: Date | null) => {
    if (!date) return 'Never';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get active schedule text
  const activeSchedulesCount = state.schedules.filter(s => s.enabled).length;

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* SECTION 1: MASTER MODE SWITCHER */}
      <div 
        className="rounded-2xl p-5 border shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 transition-all duration-300"
        style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}
      >
        <div className="flex items-center gap-3">
          <Cpu 
            className="w-8 h-8 shrink-0 transition-colors"
            style={{ color: state.auto === 1 ? theme.primary : theme.subText }}
          />
          <div>
            <h2 className="text-sm font-black tracking-widest uppercase" style={{ color: theme.text }}>
              Orchard Controller Mode: <span style={{ color: state.auto === 1 ? theme.primary : '#ea580c' }}>
                {state.auto === 1 ? 'AUTOMATION ON' : 'MANUAL OVERRIDE'}
              </span>
            </h2>
            <p className="text-xs mt-1 leading-relaxed max-w-2xl font-semibold" style={{ color: theme.subText }}>
              {state.auto === 1 
                ? 'System is fully automated. Sensor reads moisture levels continuously and triggers the pump dynamically. Scheduled overrides are engaged.'
                : 'System is running on manual directives. Toggle the pump using override switch controllers. Weather overrides are disabled.'}
            </p>
          </div>
        </div>

        <button
          onClick={handleToggleAuto}
          className="flex items-center justify-center shrink-0 p-1 rounded-xl transition-all duration-300 focus:outline-none"
          style={{ color: theme.primary }}
        >
          {state.auto === 1 ? (
            <ToggleRight className="w-16 h-10 stroke-1 cursor-pointer" />
          ) : (
            <ToggleLeft className="w-16 h-10 stroke-1 cursor-pointer" />
          )}
        </button>
      </div>

      {/* SECTION 2: TELEMETRY OVERVIEW MINI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        
        {/* moisture status */}
        <div 
          onClick={() => setPage('moisture')}
          className="border rounded-2xl p-5 shadow-lg flex items-center justify-between cursor-pointer transition-all duration-300 hover:scale-[1.02]"
          style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}
        >
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: theme.subText }}>Soil Moisture</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black">{moisturePercent}%</span>
              <span className="text-[10px] font-extrabold uppercase" style={{ color: moistureColor }}>{moistureLevel}</span>
            </div>
            <span className="text-[10px] block opacity-75" style={{ color: theme.subText }}>Raw ADC: {state.moisture}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Droplet className="w-6 h-6" />
          </div>
        </div>

        {/* pump control status */}
        <div 
          onClick={() => setPage('pump')}
          className="border rounded-2xl p-5 shadow-lg flex items-center justify-between cursor-pointer transition-all duration-300 hover:scale-[1.02]"
          style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}
        >
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: theme.subText }}>Pump Status</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black">{state.relay === 1 ? 'ACTIVE' : 'OFF'}</span>
              <span className="text-[9px] font-black tracking-widest uppercase px-1.5 py-0.5 rounded border"
                style={{ 
                  backgroundColor: state.relay === 1 ? 'rgba(16,185,129,0.1)' : 'transparent',
                  borderColor: state.relay === 1 ? '#10b981' : theme.border,
                  color: state.relay === 1 ? '#10b981' : theme.subText
                }}
              >
                {state.relay === 1 ? 'Pumping' : 'Idle'}
              </span>
            </div>
            <span className="text-[10px] block opacity-75" style={{ color: theme.subText }}>
              {state.pumpProtection.triggered ? '⚠️ Protection Engaged' : `Continuous Limit: ${state.maxRuntimeMinutes}m`}
            </span>
          </div>
          <div 
            className="p-3.5 rounded-xl border transition-colors"
            style={{ 
              backgroundColor: state.relay === 1 ? theme.primary + '15' : theme.inputBg, 
              borderColor: state.relay === 1 ? theme.primary : theme.border,
              color: state.relay === 1 ? theme.primary : theme.subText
            }}
          >
            <Power className="w-6 h-6" />
          </div>
        </div>

        {/* weather forecast summary */}
        <div 
          onClick={() => setPage('weather')}
          className="border rounded-2xl p-5 shadow-lg flex items-center justify-between cursor-pointer transition-all duration-300 hover:scale-[1.02]"
          style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}
        >
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: theme.subText }}>Weather Forecast</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black">
                {state.weather ? `${Math.round(state.weather.currentTemp)}°C` : '--°C'}
              </span>
              <span className="text-[10px] font-extrabold uppercase" style={{ color: state.weather?.rainPredicted ? theme.primary : '#10b981' }}>
                {state.weather?.rainPredicted ? 'Rain Predicted' : 'Dry & Clear'}
              </span>
            </div>
            <span className="text-[10px] block opacity-75" style={{ color: theme.subText }}>
              {state.weather ? `Rain Chance: ${state.weather.rainChance}%` : 'Location coords missing'}
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
            <CloudSun className="w-6 h-6" />
          </div>
        </div>

        {/* schedules summary */}
        <div 
          onClick={() => setPage('schedules')}
          className="border rounded-2xl p-5 shadow-lg flex items-center justify-between cursor-pointer transition-all duration-300 hover:scale-[1.02]"
          style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}
        >
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: theme.subText }}>Active Schedules</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black">{activeSchedulesCount} <span className="text-xs font-bold" style={{ color: theme.subText }}>/ 5</span></span>
            </div>
            <span className="text-[10px] block opacity-75" style={{ color: theme.subText }}>
              {state.schedules.length === 0 ? 'No automated schedules' : 'Timers actively listening'}
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        {/* Device Online Status */}
        <div 
          className="border rounded-2xl p-5 shadow-lg flex items-center justify-between transition-all duration-300"
          style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}
        >
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: theme.subText }}>Device Status</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black" style={{ color: deviceConnected ? '#10b981' : theme.primary }}>
                {deviceConnected ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>
            <span className="text-[10px] block opacity-75" style={{ color: theme.subText }}>
              Last updated: {formatTime(lastCommunication)}
            </span>
          </div>
          <div 
            className="p-3.5 rounded-xl border transition-colors"
            style={{ 
              backgroundColor: deviceConnected ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', 
              borderColor: deviceConnected ? '#10b981' : theme.primary,
              color: deviceConnected ? '#10b981' : theme.primary
            }}
          >
            <Wifi className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* SECTION 3: RECENT ALERTS */}
      <div 
        className="rounded-2xl p-6 border shadow-xl flex flex-col relative transition-all duration-300"
        style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}
      >
        <div 
          className="w-full flex items-center justify-between mb-4 pb-3 border-b"
          style={{ borderBottomColor: theme.border }}
        >
          <div className="flex items-center gap-2">
            <BellRing className="w-5 h-5 animate-bounce" style={{ color: theme.primary }} />
            <h2 className="text-sm font-bold tracking-widest uppercase">Recent System Alerts</h2>
          </div>
          
          <button 
            onClick={() => setPage('logs')}
            className="text-[10px] font-black tracking-widest uppercase flex items-center gap-1 hover:opacity-80 transition-opacity"
            style={{ color: theme.primary }}
          >
            VIEW ALL LOGS <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-3">
          {logs.slice(0, 3).map((log) => (
            <div 
              key={log.id} 
              className="p-3 rounded-xl border text-xs flex justify-between items-center transition-all"
              style={{ 
                backgroundColor: theme.inputBg, 
                borderColor: theme.border,
                color: theme.text 
              }}
            >
              <div className="flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full ${
                  log.type === 'alert' ? 'bg-red-500 animate-pulse' : log.type === 'success' ? 'bg-emerald-400' : 'bg-blue-400'
                }`}></span>
                <span className="font-extrabold uppercase tracking-wide">{log.title}</span>
                <span className="opacity-75 font-semibold hidden md:inline">— {log.desc}</span>
              </div>
              <span className="text-[9px] font-black opacity-75" style={{ color: theme.subText }}>
                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}

          {logs.length === 0 && (
            <p className="text-xs font-bold text-center py-6" style={{ color: theme.subText }}>
              No critical telemetry triggers recorded.
            </p>
          )}
        </div>
      </div>

    </div>
  );
}
