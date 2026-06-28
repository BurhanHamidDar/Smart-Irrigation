import React from 'react';
import { Droplet, Wifi, WifiOff } from 'lucide-react';
import { AppTheme } from '../App';

interface MoistureGaugeProps {
  moisture: number;
  deviceConnected: boolean;
  lastCommunication: Date | null;
  theme: AppTheme;
}

export default function MoistureGauge({ moisture, deviceConnected, lastCommunication, theme }: MoistureGaugeProps) {
  // Inverted capacitive sensor: 300 = wet (100%), 900 = dry (0%)
  const SENSOR_DRY = 900;
  const SENSOR_WET = 300;
  let percent = 0;
  if (moisture && moisture > 0) {
    const clamped = Math.max(SENSOR_WET, Math.min(SENSOR_DRY, moisture));
    percent = Math.round(((SENSOR_DRY - clamped) / (SENSOR_DRY - SENSOR_WET)) * 100);
  }

  let level = 'Critical Dry';
  let color = '#e74c3c';
  let trackColor = '#fecaca';

  if (percent >= 70) { level = 'Well Moistened'; color = '#2e7d52'; trackColor = '#bbf7d0'; }
  else if (percent >= 40) { level = 'Adequate'; color = '#d97706'; trackColor = '#fde68a'; }
  else if (percent >= 20) { level = 'Low'; color = '#ea580c'; trackColor = '#fed7aa'; }

  const radius = 72;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (percent / 100) * circumference;

  const formatTime = (date: Date | null) =>
    date ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Never';

  return (
    <div
      className="rounded-xl p-5 border"
      style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder, boxShadow: theme.cardShadow }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Droplet className="w-4 h-4" style={{ color: theme.primary }} />
          <span className="text-sm font-semibold" style={{ color: theme.text }}>Soil Moisture</span>
        </div>
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
          style={{
            backgroundColor: deviceConnected ? '#eaf7f0' : '#fef2f2',
            color: deviceConnected ? '#2e7d52' : '#c0392b',
          }}
        >
          {deviceConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          {deviceConnected ? 'Live' : 'Offline'}
        </div>
      </div>

      {/* SVG Gauge */}
      <div className="flex items-center justify-center my-4 select-none">
        <div className="relative">
          <svg width="180" height="180" className="-rotate-90">
            <circle cx="90" cy="90" r={radius} stroke={trackColor} strokeWidth={strokeWidth} fill="transparent" />
            <circle
              cx="90" cy="90" r={radius}
              stroke={color}
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold" style={{ color: theme.text }}>{percent}<span className="text-xl font-semibold">%</span></span>
            <span className="text-xs font-medium mt-1" style={{ color: theme.subText }}>Moisture</span>
          </div>
        </div>
      </div>

      {/* Status + raw */}
      <div className="grid grid-cols-2 gap-3 mt-2">
        <div className="rounded-lg p-3 text-center" style={{ backgroundColor: theme.inputBg }}>
          <p className="text-[10px] font-medium mb-1" style={{ color: theme.subText }}>Condition</p>
          <p className="text-sm font-semibold" style={{ color }}>{level}</p>
        </div>
        <div className="rounded-lg p-3 text-center" style={{ backgroundColor: theme.inputBg }}>
          <p className="text-[10px] font-medium mb-1" style={{ color: theme.subText }}>Raw ADC</p>
          <p className="text-sm font-semibold" style={{ color: theme.text }}>{moisture || '—'}</p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center mt-4 pt-4 border-t text-xs" style={{ borderColor: theme.cardBorder }}>
        <span style={{ color: theme.subText }}>Last ping</span>
        <span className="font-medium" style={{ color: theme.text }}>{formatTime(lastCommunication)}</span>
      </div>
    </div>
  );
}
