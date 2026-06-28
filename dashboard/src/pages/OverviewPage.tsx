import React from 'react';
import { Cpu, ToggleLeft, ToggleRight, Droplet, Power, CloudSun, Calendar, Wifi, Bell, ArrowRight, Leaf } from 'lucide-react';
import { AppTheme } from '../App';
import { SystemState, SystemLog, getKashmirSeasonInfo } from '../hooks/useFirebaseSync';

interface OverviewPageProps {
  state: SystemState;
  deviceConnected: boolean;
  lastCommunication: Date | null;
  logs: SystemLog[];
  theme: AppTheme;
  setAutoMode: (mode: number) => void;
  setSeasonalAuto: (mode: number) => void;
  setPage: (page: string) => void;
}

// Shared card style helper
const card = (theme: AppTheme) => ({
  backgroundColor: theme.cardBg,
  border: `1px solid ${theme.cardBorder}`,
  boxShadow: theme.cardShadow,
});

export default function OverviewPage({ state, deviceConnected, lastCommunication, logs, theme, setAutoMode, setSeasonalAuto, setPage }: OverviewPageProps) {
  const season = getKashmirSeasonInfo();

  // Inverted moisture %
  const SENSOR_DRY = 900, SENSOR_WET = 300;
  let moisturePercent = 0;
  if (state.moisture > 0) {
    const clamped = Math.max(SENSOR_WET, Math.min(SENSOR_DRY, state.moisture));
    moisturePercent = Math.round(((SENSOR_DRY - clamped) / (SENSOR_DRY - SENSOR_WET)) * 100);
  }

  let moistureLevel = 'Critical Dry', moistureColor = '#e74c3c';
  if (moisturePercent >= 70) { moistureLevel = 'Well Moistened'; moistureColor = '#2e7d52'; }
  else if (moisturePercent >= 40) { moistureLevel = 'Adequate'; moistureColor = '#d97706'; }
  else if (moisturePercent >= 20) { moistureLevel = 'Low'; moistureColor = '#ea580c'; }

  const formatTime = (d: Date | null) => d ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never';
  const activeSchedulesCount = state.schedules.filter(s => s.enabled).length;

  return (
    <div className="space-y-5">

      {/* Row 1: Kashmir Seasonal + Auto Mode */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Kashmir Seasonal Auto-Adjust */}
        <div className="rounded-xl p-5" style={card(theme)}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: '#eaf7f0' }}>
                <Leaf className="w-4 h-4" style={{ color: '#2e7d52' }} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: theme.text }}>Kashmir Seasonal Mode</p>
                <p className="text-xs mt-0.5" style={{ color: theme.subText }}>
                  {state.seasonalAuto === 1 ? `${season.name} · Threshold locked at ${season.threshold}` : season.name}
                </p>
                <p className="text-xs mt-1" style={{ color: theme.subText }}>{season.description}</p>
              </div>
            </div>
            <button
              onClick={() => setSeasonalAuto(state.seasonalAuto === 1 ? 0 : 1)}
              className="shrink-0"
              style={{ color: state.seasonalAuto === 1 ? '#2e7d52' : theme.subText }}
            >
              {state.seasonalAuto === 1
                ? <ToggleRight className="w-12 h-7 stroke-[1.5]" />
                : <ToggleLeft className="w-12 h-7 stroke-[1.5]" />}
            </button>
          </div>
        </div>

        {/* Automation mode */}
        <div className="rounded-xl p-5" style={card(theme)}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: state.auto === 1 ? '#eaf7f0' : theme.inputBg }}
              >
                <Cpu className="w-4 h-4" style={{ color: state.auto === 1 ? '#2e7d52' : theme.subText }} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: theme.text }}>
                  {state.auto === 1 ? 'Automation Active' : 'Manual Mode'}
                </p>
                <p className="text-xs mt-0.5" style={{ color: theme.subText }}>
                  {state.auto === 1
                    ? 'Pump triggers automatically based on moisture threshold.'
                    : 'Use the pump control page to water manually.'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setAutoMode(state.auto === 1 ? 0 : 1)}
              className="shrink-0"
              style={{ color: state.auto === 1 ? '#2e7d52' : theme.subText }}
            >
              {state.auto === 1
                ? <ToggleRight className="w-12 h-7 stroke-[1.5]" />
                : <ToggleLeft className="w-12 h-7 stroke-[1.5]" />}
            </button>
          </div>
        </div>
      </div>

      {/* Row 2: Stat mini cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Moisture */}
        <button onClick={() => setPage('moisture')} className="rounded-xl p-5 text-left hover:opacity-90 transition-opacity" style={card(theme)}>
          <div className="flex items-center justify-between mb-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#eff6ff' }}>
              <Droplet className="w-4 h-4 text-blue-500" />
            </div>
            <ArrowRight className="w-3.5 h-3.5" style={{ color: theme.subText }} />
          </div>
          <p className="text-2xl font-bold" style={{ color: theme.text }}>{moisturePercent}%</p>
          <p className="text-xs font-medium mt-0.5" style={{ color: moistureColor }}>{moistureLevel}</p>
          <p className="text-[10px] mt-1" style={{ color: theme.subText }}>ADC: {state.moisture}</p>
        </button>

        {/* Pump */}
        <button onClick={() => setPage('pump')} className="rounded-xl p-5 text-left hover:opacity-90 transition-opacity" style={card(theme)}>
          <div className="flex items-center justify-between mb-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: state.relay === 1 ? '#eaf7f0' : theme.inputBg }}>
              <Power className="w-4 h-4" style={{ color: state.relay === 1 ? '#2e7d52' : theme.subText }} />
            </div>
            <ArrowRight className="w-3.5 h-3.5" style={{ color: theme.subText }} />
          </div>
          <p className="text-2xl font-bold" style={{ color: theme.text }}>{state.relay === 1 ? 'ON' : 'OFF'}</p>
          <p className="text-xs font-medium mt-0.5" style={{ color: state.relay === 1 ? '#2e7d52' : theme.subText }}>
            {state.relay === 1 ? 'Pumping' : 'Idle'}
          </p>
          <p className="text-[10px] mt-1" style={{ color: theme.subText }}>
            {state.pumpProtection.triggered ? '⚠ Protection On' : `Limit: ${state.maxRuntimeMinutes}m`}
          </p>
        </button>

        {/* Weather */}
        <button onClick={() => setPage('weather')} className="rounded-xl p-5 text-left hover:opacity-90 transition-opacity" style={card(theme)}>
          <div className="flex items-center justify-between mb-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#fffbeb' }}>
              <CloudSun className="w-4 h-4 text-amber-500" />
            </div>
            <ArrowRight className="w-3.5 h-3.5" style={{ color: theme.subText }} />
          </div>
          <p className="text-2xl font-bold" style={{ color: theme.text }}>
            {state.weather ? `${Math.round(state.weather.currentTemp)}°C` : '—'}
          </p>
          <p className="text-xs font-medium mt-0.5" style={{ color: state.weather?.rainPredicted ? '#2563eb' : '#2e7d52' }}>
            {state.weather?.rainPredicted ? 'Rain Predicted' : 'Clear'}
          </p>
          <p className="text-[10px] mt-1" style={{ color: theme.subText }}>
            {state.weather ? `Rain: ${state.weather.rainChance}%` : 'No location set'}
          </p>
        </button>

        {/* Schedules + Device */}
        <div className="space-y-4">
          <button onClick={() => setPage('schedules')} className="w-full rounded-xl p-4 text-left hover:opacity-90 transition-opacity" style={card(theme)}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#f5f3ff' }}>
                <Calendar className="w-4 h-4 text-purple-500" />
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: theme.text }}>{activeSchedulesCount} <span className="text-xs font-normal text-gray-400">/ 5</span></p>
                <p className="text-[10px]" style={{ color: theme.subText }}>Schedules active</p>
              </div>
            </div>
          </button>

          <div className="rounded-xl p-4" style={card(theme)}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: deviceConnected ? '#eaf7f0' : '#fef2f2' }}>
                <Wifi className="w-4 h-4" style={{ color: deviceConnected ? '#2e7d52' : '#c0392b' }} />
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: deviceConnected ? '#2e7d52' : '#c0392b' }}>
                  {deviceConnected ? 'Online' : 'Offline'}
                </p>
                <p className="text-[10px]" style={{ color: theme.subText }}>{formatTime(lastCommunication)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Recent logs */}
      <div className="rounded-xl p-5" style={card(theme)}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4" style={{ color: theme.primary }} />
            <span className="text-sm font-semibold" style={{ color: theme.text }}>Recent Activity</span>
          </div>
          <button
            onClick={() => setPage('logs')}
            className="flex items-center gap-1 text-xs font-medium"
            style={{ color: theme.primary }}
          >
            View all <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="space-y-2">
          {logs.slice(0, 4).map(log => (
            <div
              key={log.id}
              className="flex items-center gap-3 py-2.5 border-b last:border-0"
              style={{ borderColor: theme.cardBorder }}
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${
                log.type === 'alert' ? 'bg-red-500' : log.type === 'success' ? 'bg-emerald-500' : 'bg-blue-400'
              }`} />
              <p className="flex-1 text-xs font-medium truncate" style={{ color: theme.text }}>{log.title}</p>
              <p className="text-[10px] shrink-0" style={{ color: theme.subText }}>
                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          ))}
          {logs.length === 0 && (
            <p className="text-xs text-center py-6" style={{ color: theme.subText }}>No recent activity logged.</p>
          )}
        </div>
      </div>

    </div>
  );
}
