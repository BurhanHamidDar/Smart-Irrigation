import React from 'react';
import { Droplet, Wifi } from 'lucide-react';
import { AppTheme } from '../App';

interface MoistureGaugeProps {
  moisture: number;
  deviceConnected: boolean;
  lastCommunication: Date | null;
  theme: AppTheme;
}

export default function MoistureGauge({ moisture, deviceConnected, lastCommunication, theme }: MoistureGaugeProps) {
  // Convert 10-bit analog scale (0-1024) to percentage
  const percent = moisture > 0 ? Math.max(0, Math.min(100, Math.round((moisture / 1024) * 100))) : 0;

  // Classify moisture levels
  let level: 'DRY' | 'MODERATE' | 'WET' = 'DRY';
  let strokeColor = theme.primary; // Red
  let statusBg = 'rgba(239, 68, 68, 0.1)';
  let statusBorder = 'rgba(239, 68, 68, 0.3)';
  let statusText = theme.primary;
  
  if (moisture >= 400 && moisture <= 700) {
    level = 'MODERATE';
    strokeColor = '#f59e0b'; // Amber
    statusBg = 'rgba(245, 158, 11, 0.1)';
    statusBorder = 'rgba(245, 158, 11, 0.3)';
    statusText = '#f59e0b';
  } else if (moisture > 700) {
    level = 'WET';
    strokeColor = '#10b981'; // Emerald Green
    statusBg = 'rgba(16, 185, 129, 0.1)';
    statusBorder = 'rgba(16, 185, 129, 0.3)';
    statusText = '#10b981';
  }

  // SVG Gauge calculations
  const radius = 80;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  // Offset represents percentage filled (unfilled arc goes counter-clockwise)
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  const formatTime = (date: Date | null) => {
    if (!date) return 'Never';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div 
      className="rounded-2xl p-6 border shadow-xl flex flex-col items-center relative overflow-hidden group transition-all duration-300"
      style={{ 
        backgroundColor: theme.cardBg, 
        borderColor: theme.border,
        color: theme.text 
      }}
    >
      {/* Visual glowing aura behind the gauge */}
      <div 
        className="absolute w-48 h-48 rounded-full blur-3xl opacity-10 -top-10 -left-10 transition-all duration-700 group-hover:scale-125"
        style={{ backgroundColor: strokeColor }}
      ></div>

      <div 
        className="w-full flex items-center justify-between mb-4 pb-3 border-b transition-all duration-300"
        style={{ borderBottomColor: theme.border }}
      >
        <div className="flex items-center gap-2">
          <Droplet className="w-5 h-5 text-blue-400" />
          <h2 
            className="text-sm font-bold tracking-widest uppercase"
            style={{ color: theme.text }}
          >
            Soil Moisture
          </h2>
        </div>
        
        {/* Sensor Online Status */}
        <div 
          className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] tracking-widest uppercase font-extrabold transition-all duration-300"
          style={{ 
            backgroundColor: theme.inputBg, 
            borderColor: theme.border,
            color: deviceConnected ? '#10b981' : theme.primary
          }}
        >
          <Wifi className={`w-3 h-3 ${deviceConnected ? 'animate-pulse' : ''}`} />
          {deviceConnected ? 'Sensor Live' : 'Sensor Offline'}
        </div>
      </div>

      {/* SVG Arc Gauge */}
      <div className="relative flex items-center justify-center my-4 select-none">
        <svg className="w-48 h-48 transform -rotate-90">
          {/* Background track circle */}
          <circle
            cx="96"
            cy="96"
            r={radius}
            stroke={theme.inputBg}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Animated dynamic progress arc */}
          <circle
            cx="96"
            cy="96"
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Text inside the circle */}
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span 
            className="text-5xl font-black leading-none tracking-tight"
            style={{ color: theme.text }}
          >
            {percent}<span className="text-2xl font-bold opacity-80">%</span>
          </span>
          <span 
            className="text-[10px] tracking-widest font-extrabold uppercase mt-2"
            style={{ color: theme.subText }}
          >
            Moisture Ratio
          </span>
        </div>
      </div>

      {/* Moisture Status Level Badge */}
      <div className="w-full grid grid-cols-2 gap-3 mt-4 text-center">
        <div 
          className="border rounded-xl p-3 flex flex-col items-center justify-center transition-all"
          style={{ 
            backgroundColor: statusBg, 
            borderColor: statusBorder, 
            color: statusText 
          }}
        >
          <span className="text-[9px] font-black tracking-widest uppercase opacity-75">Condition</span>
          <span className="text-sm font-extrabold tracking-wider uppercase mt-1">{level}</span>
        </div>

        <div 
          className="border rounded-xl p-3 flex flex-col items-center justify-center transition-all duration-300"
          style={{ 
            backgroundColor: theme.inputBg, 
            borderColor: theme.border, 
            color: theme.text 
          }}
        >
          <span 
            className="text-[9px] font-black tracking-widest uppercase opacity-85"
            style={{ color: theme.subText }}
          >
            Raw ADC Value
          </span>
          <span className="text-sm font-extrabold tracking-wider mt-1">{moisture}</span>
        </div>
      </div>

      {/* Footnote */}
      <div 
        className="w-full text-center mt-4 pt-3 border-t text-[10px] font-semibold tracking-wider flex justify-between items-center transition-all duration-300"
        style={{ borderTopColor: theme.border, color: theme.subText }}
      >
        <span>Last Ping:</span>
        <span style={{ color: theme.text }} className="font-bold">{formatTime(lastCommunication)}</span>
      </div>
    </div>
  );
}
