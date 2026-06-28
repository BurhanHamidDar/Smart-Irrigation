import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ComposedChart, Line } from 'recharts';
import { Droplet, Settings2, Layers, Leaf, ToggleLeft, ToggleRight } from 'lucide-react';
import { AppTheme } from '../App';
import { SystemState, getKashmirSeasonInfo } from '../hooks/useFirebaseSync';
import MoistureGauge from '../components/MoistureGauge';

interface MoisturePageProps {
  state: SystemState;
  deviceConnected: boolean;
  lastCommunication: Date | null;
  theme: AppTheme;
  setMoistureThreshold: (threshold: number) => void;
  setSeasonalAuto: (mode: number) => void;
}

export default function MoisturePage({ state, deviceConnected, lastCommunication, theme, setMoistureThreshold, setSeasonalAuto }: MoisturePageProps) {
  const season = getKashmirSeasonInfo();

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
      data.push({ time: timeKey, Moisture: moistureValue, Threshold: state.threshold });
    }
    return data;
  }, [state.moisture, state.threshold]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

      {/* Column 1: Gauge + Threshold */}
      <div className="lg:col-span-1 space-y-5">
        <MoistureGauge
          moisture={state.moisture}
          deviceConnected={deviceConnected}
          lastCommunication={lastCommunication}
          theme={theme}
        />

        {/* Threshold control */}
        <div className="rounded-xl p-5 border" style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder, boxShadow: theme.cardShadow }}>
          <div className="flex items-center gap-2 mb-4">
            <Settings2 className="w-4 h-4" style={{ color: theme.primary }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: theme.text }}>Threshold Settings</p>
              <p className="text-xs mt-0.5" style={{ color: theme.subText }}>
                {state.seasonalAuto === 1 ? 'Managed by Kashmir seasonal profile' : 'Pump activates when moisture exceeds threshold'}
              </p>
            </div>
          </div>

          <div className={`transition-opacity ${state.seasonalAuto === 1 ? 'opacity-40 pointer-events-none' : ''}`}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium" style={{ color: theme.subText }}>ADC Limit</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ backgroundColor: theme.inputBg, color: theme.primary }}>
                {state.threshold}
              </span>
            </div>
            <input
              type="range" min="300" max="900" step="10"
              value={state.threshold}
              onChange={e => setMoistureThreshold(parseInt(e.target.value, 10))}
              disabled={state.seasonalAuto === 1}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
              style={{ backgroundColor: theme.inputBg, accentColor: theme.primary }}
            />
            <div className="flex justify-between text-[10px] mt-1" style={{ color: theme.subText }}>
              <span>Wet (300)</span>
              <span>Moderate (600)</span>
              <span>Dry (900)</span>
            </div>
          </div>

          {/* Seasonal toggle */}
          <div className="mt-4 pt-4 border-t flex items-center justify-between" style={{ borderColor: theme.cardBorder }}>
            <div className="flex items-center gap-2">
              <Leaf className="w-4 h-4" style={{ color: '#2e7d52' }} />
              <div>
                <p className="text-xs font-semibold" style={{ color: theme.text }}>Kashmir Seasonal</p>
                <p className="text-[10px]" style={{ color: theme.subText }}>
                  {state.seasonalAuto === 1 ? `${season.name} — ${season.threshold} ADC` : 'Auto-adjust by season'}
                </p>
              </div>
            </div>
            <button onClick={() => setSeasonalAuto(state.seasonalAuto === 1 ? 0 : 1)} style={{ color: state.seasonalAuto === 1 ? '#2e7d52' : theme.subText }}>
              {state.seasonalAuto === 1 ? <ToggleRight className="w-10 h-6 stroke-[1.5]" /> : <ToggleLeft className="w-10 h-6 stroke-[1.5]" />}
            </button>
          </div>
        </div>
      </div>

      {/* Column 2: Chart */}
      <div
        className="lg:col-span-2 rounded-xl p-5 border flex flex-col h-[480px]"
        style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder, boxShadow: theme.cardShadow }}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4" style={{ color: theme.primary }} />
            <span className="text-sm font-semibold" style={{ color: theme.text }}>Moisture Telemetry</span>
          </div>
          <span className="text-xs" style={{ color: theme.subText }}>12-hour tracking</span>
        </div>

        <div className="flex-1 w-full text-xs">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={moistureHistoryData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <XAxis dataKey="time" stroke={theme.subText} tickLine={false} />
              <YAxis stroke={theme.subText} tickLine={false} domain={[0, 1024]} />
              <Tooltip contentStyle={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder, borderRadius: '8px', color: theme.text }} />
              <CartesianGrid stroke={theme.cardBorder} strokeDasharray="3 3" opacity={0.5} />
              <Area type="monotone" dataKey="Moisture" name="ADC Moisture" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} strokeWidth={2} />
              <Line type="monotone" dataKey="Threshold" name="Auto Threshold" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
