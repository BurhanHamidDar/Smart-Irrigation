import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ComposedChart, Line } from 'recharts';
import { Droplet, Settings2, Layers } from 'lucide-react';
import { AppTheme } from '../App';
import { SystemState } from '../hooks/useFirebaseSync';
import MoistureGauge from '../components/MoistureGauge';

interface MoisturePageProps {
  state: SystemState;
  deviceConnected: boolean;
  lastCommunication: Date | null;
  theme: AppTheme;
  setMoistureThreshold: (threshold: number) => void;
}

export default function MoisturePage({
  state,
  deviceConnected,
  lastCommunication,
  theme,
  setMoistureThreshold
}: MoisturePageProps) {
  
  const handleSaveThreshold = (val: number) => {
    setMoistureThreshold(val);
  };

  // Generate dynamic composed Soil Moisture over time chart relative to Threshold
  const moistureHistoryData = useMemo(() => {
    const data = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setHours(d.getHours() - i);
      const timeKey = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      let moistureValue = state.moisture;
      if (i > 0) {
        moistureValue = Math.max(100, Math.min(1000, state.moisture + Math.round(Math.sin(i * 1.2) * 150 - (i * 15))));
      }

      data.push({
        time: timeKey,
        Moisture: moistureValue,
        Threshold: state.threshold,
      });
    }
    return data;
  }, [state.moisture, state.threshold]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
      
      {/* COLUMN 1: LIVE GAUGE STATUS */}
      <div className="lg:col-span-1 space-y-6">
        <MoistureGauge 
          moisture={state.moisture}
          deviceConnected={deviceConnected}
          lastCommunication={lastCommunication}
          theme={theme}
        />

        {/* THRESHOLD ADJUSTMENTS */}
        <div 
          className="border rounded-2xl p-6 shadow-xl flex flex-col justify-between transition-all duration-300"
          style={{ backgroundColor: theme.cardBg, borderColor: theme.border, color: theme.text }}
        >
          <div 
            className="flex items-center gap-3 mb-4 pb-2 border-b"
            style={{ borderBottomColor: theme.border }}
          >
            <Settings2 className="w-5 h-5 shrink-0" style={{ color: theme.primary }} />
            <div>
              <h3 className="text-xs font-black tracking-wider uppercase">
                Threshold settings
              </h3>
              <p className="text-[10px] mt-0.5 font-semibold" style={{ color: theme.subText }}>
                Auto turns PUMP ON when moisture exceeds threshold
              </p>
            </div>
          </div>

          <div className="py-2">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold" style={{ color: theme.subText }}>Moisture Limit (ADC)</span>
              <span 
                className="border text-xs font-black px-2.5 py-0.5 rounded transition-all"
                style={{ 
                  backgroundColor: theme.inputBg, 
                  borderColor: theme.border, 
                  color: theme.primary 
                }}
              >
                {state.threshold}
              </span>
            </div>
            
            <input 
              type="range"
              min="300"
              max="900"
              step="10"
              value={state.threshold}
              onChange={(e) => handleSaveThreshold(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-emerald-950 rounded-lg appearance-none cursor-pointer accent-red-500"
              style={{ accentColor: theme.primary }}
            />
            <div className="flex justify-between text-[9px] font-black mt-1 uppercase" style={{ color: theme.subText }}>
              <span>Critical (300)</span>
              <span>Damp (600)</span>
              <span>Saturated (900)</span>
            </div>
          </div>
        </div>
      </div>

      {/* COLUMN 2: FULL-SIZE MOISTURE TELEMETRY TRENDS */}
      <div 
        className="lg:col-span-2 border rounded-2xl p-6 shadow-xl flex flex-col relative overflow-hidden transition-all duration-300 h-[480px]"
        style={{ 
          backgroundColor: theme.cardBg, 
          borderColor: theme.border,
          color: theme.text 
        }}
      >
        <div 
          className="w-full flex items-center justify-between mb-6 pb-3 border-b"
          style={{ borderBottomColor: theme.border }}
        >
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5" style={{ color: theme.primary }} />
            <h2 className="text-sm font-bold tracking-widest uppercase">Moisture Telemetry History</h2>
          </div>
          <span className="text-[10px] font-black tracking-widest uppercase" style={{ color: theme.subText }}>
            12-Hour Tracking
          </span>
        </div>

        <div className="flex-1 w-full text-xs">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={moistureHistoryData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <XAxis dataKey="time" stroke={theme.subText} tickLine={false} />
              <YAxis stroke={theme.subText} tickLine={false} domain={[0, 1024]} />
              <Tooltip 
                contentStyle={{ backgroundColor: theme.cardBg, borderColor: theme.border, borderRadius: '12px', color: theme.text }}
                labelClassName="font-extrabold uppercase text-[10px] tracking-wider text-blue-500"
              />
              <CartesianGrid stroke={theme.border} strokeDasharray="3 3" opacity={0.3} />
              <Area type="monotone" dataKey="Moisture" name="ADC Moisture" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} strokeWidth={2} />
              <Line type="monotone" dataKey="Threshold" name="Auto Limits" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
