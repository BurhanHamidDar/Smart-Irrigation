import React, { useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid, ComposedChart, Line 
} from 'recharts';
import { BarChart3, LineChart, Timer, RefreshCw, Layers } from 'lucide-react';
import { SystemLog } from '../hooks/useFirebaseSync';
import { AppTheme } from '../App';

interface AnalyticsChartsProps {
  logs: SystemLog[];
  currentMoisture: number;
  currentThreshold: number;
  theme: AppTheme;
}

export default function AnalyticsCharts({ logs, currentMoisture, currentThreshold, theme }: AnalyticsChartsProps) {
  // Parse logs to extract watering run times and cycles
  const stats = useMemo(() => {
    const dailyData: { [key: string]: { duration: number; cycles: number; date: Date } } = {};
    
    // Initialize last 7 days with 0
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
      dailyData[dateKey] = { duration: 0, cycles: 0, date: d };
    }

    let totalCycles = 0;
    let todayDuration = 0;
    let weekDuration = 0;
    let monthDuration = 0;

    const now = new Date();
    const todayStr = now.toLocaleDateString([], { month: 'short', day: 'numeric' });

    logs.forEach(log => {
      const logDate = new Date(log.timestamp);
      const dateKey = logDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
      const diffDays = Math.floor((now.getTime() - log.timestamp) / (1000 * 60 * 60 * 24));

      if (log.title === 'Pump Status: ACTIVE') {
        totalCycles++;
        if (dailyData[dateKey]) {
          dailyData[dateKey].cycles++;
        }
      }

      if (log.title === 'Pump Status: INACTIVE') {
        const match = log.desc.match(/Duration:\s+(\d+)m\s+(\d+)s/);
        if (match) {
          const mins = parseInt(match[1], 10);
          const secs = parseInt(match[2], 10);
          const durationMins = mins + (secs / 60);

          if (dailyData[dateKey]) {
            dailyData[dateKey].duration += Math.round(durationMins * 10) / 10;
          }

          if (diffDays === 0 && dateKey === todayStr) {
            todayDuration += durationMins;
          }
          if (diffDays < 7) {
            weekDuration += durationMins;
          }
          if (diffDays < 30) {
            monthDuration += durationMins;
          }
        }
      }
    });

    const chartData = Object.keys(dailyData).map(key => ({
      name: key,
      duration: Math.round(dailyData[key].duration * 10) / 10,
      cycles: dailyData[key].cycles,
    }));

    return {
      chartData,
      todayDuration: Math.round(todayDuration),
      weekDuration: Math.round(weekDuration),
      monthDuration: Math.round(monthDuration),
      totalCycles,
    };
  }, [logs]);

  // Generate real composed Soil Moisture session telemetry trends (saved in localStorage)
  const moistureData = useMemo(() => {
    const historyKey = 'agroflow_moisture_history';
    let saved: { time: string; Moisture: number; Threshold: number }[] = [];
    try {
      const raw = localStorage.getItem(historyKey);
      if (raw) saved = JSON.parse(raw);
    } catch (e) {}

    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const lastItem = saved[saved.length - 1];

    // Capture actual updates if value changes or on first load
    if (!lastItem || lastItem.Moisture !== currentMoisture || lastItem.Threshold !== currentThreshold) {
      saved.push({
        time: nowStr,
        Moisture: currentMoisture,
        Threshold: currentThreshold
      });
      if (saved.length > 20) saved.shift(); // Keep last 20 real data points
      try {
        localStorage.setItem(historyKey, JSON.stringify(saved));
      } catch (e) {}
    }

    // Build base timeline with current level if list is small
    if (saved.length < 5) {
      const basePoints = [];
      for (let i = 4; i >= 0; i--) {
        const d = new Date();
        d.setMinutes(d.getMinutes() - i * 10);
        basePoints.push({
          time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          Moisture: currentMoisture,
          Threshold: currentThreshold
        });
      }
      return basePoints;
    }

    return saved;
  }, [currentMoisture, currentThreshold]);

  return (
    <div 
      className="rounded-2xl p-6 border shadow-xl flex flex-col relative overflow-hidden transition-all duration-300 lg:col-span-2"
      style={{ 
        backgroundColor: theme.cardBg, 
        borderColor: theme.border,
        color: theme.text 
      }}
    >
      <div 
        className="w-full flex items-center justify-between mb-6 pb-3 border-b transition-all duration-300"
        style={{ borderBottomColor: theme.border }}
      >
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" style={{ color: theme.primary }} />
          <h2 className="text-sm font-bold tracking-widest uppercase">Irrigation Analytics</h2>
        </div>
        <span className="text-[10px] font-black tracking-widest uppercase" style={{ color: theme.subText }}>
          Telemetry Insights
        </span>
      </div>

      {/* OVERVIEW STATS ROW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div 
          className="border rounded-xl p-4 flex flex-col relative transition-all"
          style={{ backgroundColor: theme.inputBg, borderColor: theme.border }}
        >
          <span className="text-[9px] font-black tracking-widest uppercase" style={{ color: theme.subText }}>Today's Watering</span>
          <span className="text-2xl font-black mt-1.5" style={{ color: theme.text }}>{stats.todayDuration} <span className="text-xs font-bold" style={{ color: theme.primary }}>mins</span></span>
          <Timer className="absolute w-4 h-4 top-4 right-4 opacity-55" style={{ color: theme.text }} />
        </div>

        <div 
          className="border rounded-xl p-4 flex flex-col relative transition-all"
          style={{ backgroundColor: theme.inputBg, borderColor: theme.border }}
        >
          <span className="text-[9px] font-black tracking-widest uppercase" style={{ color: theme.subText }}>This Week</span>
          <span className="text-2xl font-black mt-1.5" style={{ color: theme.text }}>{stats.weekDuration} <span className="text-xs font-bold" style={{ color: theme.primary }}>mins</span></span>
          <Timer className="absolute w-4 h-4 top-4 right-4 opacity-55" style={{ color: theme.text }} />
        </div>

        <div 
          className="border rounded-xl p-4 flex flex-col relative transition-all"
          style={{ backgroundColor: theme.inputBg, borderColor: theme.border }}
        >
          <span className="text-[9px] font-black tracking-widest uppercase" style={{ color: theme.subText }}>This Month</span>
          <span className="text-2xl font-black mt-1.5" style={{ color: theme.text }}>{stats.monthDuration} <span className="text-xs font-bold" style={{ color: theme.primary }}>mins</span></span>
          <Timer className="absolute w-4 h-4 top-4 right-4 opacity-55" style={{ color: theme.text }} />
        </div>

        <div 
          className="border rounded-xl p-4 flex flex-col relative transition-all"
          style={{ backgroundColor: theme.inputBg, borderColor: theme.border }}
        >
          <span className="text-[9px] font-black tracking-widest uppercase" style={{ color: theme.subText }}>Watering Cycles</span>
          <span className="text-2xl font-black mt-1.5" style={{ color: theme.text }}>{stats.totalCycles} <span className="text-xs font-bold" style={{ color: theme.primary }}>cycles</span></span>
          <RefreshCw className="absolute w-4 h-4 top-4 right-4 opacity-55" style={{ color: theme.text }} />
        </div>
      </div>

      {/* CHARTS CONTAINER GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* CHART 1: WATERING TRENDS */}
        <div 
          className="border rounded-xl p-4 flex flex-col h-[280px] transition-all"
          style={{ backgroundColor: theme.inputBg + '40', borderColor: theme.border }}
        >
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-black tracking-wider uppercase" style={{ color: theme.text }}>Daily Irrigation Duration</h3>
            <LineChart className="w-4 h-4" style={{ color: theme.primary }} />
          </div>
          <div className="flex-1 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDuration" cx="0" cy="0" r="1" fx="0" fy="0">
                    <stop offset="5%" stopColor={theme.primary} stopOpacity={0.4}/>
                    <stop offset="95%" stopColor={theme.primary} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke={theme.subText} tickLine={false} />
                <YAxis stroke={theme.subText} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: theme.cardBg, borderColor: theme.border, borderRadius: '12px', color: theme.text }} 
                  labelClassName="font-extrabold uppercase text-[10px] tracking-wider text-red-500"
                />
                <Area type="monotone" dataKey="duration" name="Duration (min)" stroke={theme.primary} strokeWidth={3} fillOpacity={1} fill="url(#colorDuration)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: MOISTURE VS THRESHOLD */}
        <div 
          className="border rounded-xl p-4 flex flex-col h-[280px] transition-all"
          style={{ backgroundColor: theme.inputBg + '40', borderColor: theme.border }}
        >
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-black tracking-wider uppercase" style={{ color: theme.text }}>Moisture vs Auto Threshold</h3>
            <Layers className="w-4 h-4" style={{ color: theme.primary }} />
          </div>
          <div className="flex-1 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={moistureData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
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
    </div>
  );
}
