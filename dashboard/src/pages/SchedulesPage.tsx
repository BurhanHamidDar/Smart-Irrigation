import React from 'react';
import { CalendarRange, Clock, Sparkles } from 'lucide-react';
import { AppTheme } from '../App';
import { SystemState, Schedule } from '../hooks/useFirebaseSync';
import ScheduleManager from '../components/ScheduleManager';

interface SchedulesPageProps {
  state: SystemState;
  theme: AppTheme;
  setSchedulesList: (schedules: Schedule[]) => void;
}

export default function SchedulesPage({ state, theme, setSchedulesList }: SchedulesPageProps) {
  
  const formatTime = (hour: number, min: number) => {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h = hour % 12 || 12;
    return `${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')} ${ampm}`;
  };

  // Sort schedules by start hour and minute
  const sortedTimeline = [...state.schedules].sort((a, b) => {
    const startA = a.startHour * 60 + a.startMinute;
    const startB = b.startHour * 60 + b.startMinute;
    return startA - startB;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
      
      {/* COLUMN 1: SCHEDULE MANAGER PANEL */}
      <div className="lg:col-span-2">
        <ScheduleManager 
          schedules={state.schedules}
          setSchedulesList={setSchedulesList}
          theme={theme}
        />
      </div>

      {/* COLUMN 2: IRRIGATION TIMELINE OVERVIEW */}
      <div 
        className="lg:col-span-1 border rounded-2xl p-6 shadow-xl flex flex-col relative overflow-hidden transition-all duration-300"
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
            <CalendarRange className="w-5 h-5" style={{ color: theme.primary }} />
            <h2 className="text-sm font-bold tracking-widest uppercase">Irrigation Timeline</h2>
          </div>
          <span className="text-[10px] font-black tracking-widest uppercase" style={{ color: theme.subText }}>
            Chronological
          </span>
        </div>

        {/* TIMELINE LIST */}
        <div className="flex-1 space-y-4">
          {sortedTimeline.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20" style={{ color: theme.subText }}>
              <Clock className="w-12 h-12 mb-3 opacity-60" strokeWidth={1} />
              <p className="text-xs font-bold uppercase tracking-widest">No active timers</p>
              <span className="text-[10px] opacity-75 mt-1">Timeline updates upon creating schedules</span>
            </div>
          ) : (
            sortedTimeline.map((sched, index) => {
              const startTotal = sched.startHour * 60 + sched.startMinute;
              const stopTotal = sched.stopHour * 60 + sched.stopMinute;
              const duration = stopTotal >= startTotal ? stopTotal - startTotal : (24 * 60 - startTotal) + stopTotal;

              return (
                <div key={index} className="relative pl-6 border-l-2 last:border-l-0 pb-1" style={{ borderColor: theme.border }}>
                  {/* Timeline circle node */}
                  <span 
                    className="absolute -left-1.5 top-1.5 w-3.5 h-3.5 rounded-full border transition-all"
                    style={{ 
                      backgroundColor: sched.enabled ? theme.primary : theme.inputBg,
                      borderColor: sched.enabled ? 'rgba(255,255,255,0.4)' : theme.border 
                    }}
                  ></span>

                  <div className="space-y-1">
                    <span 
                      className="text-xs font-extrabold tracking-widest uppercase block"
                      style={{ color: sched.enabled ? theme.text : theme.subText }}
                    >
                      {formatTime(sched.startHour, sched.startMinute)}
                    </span>
                    <p className="text-xs font-semibold" style={{ color: theme.subText }}>
                      Runs for <span className="font-extrabold" style={{ color: theme.text }}>{duration} mins</span> (stops at {formatTime(sched.stopHour, sched.stopMinute)})
                    </p>
                    <span className="text-[9px] font-bold uppercase tracking-wider block" style={{ color: sched.enabled ? '#10b981' : theme.subText }}>
                      {sched.enabled ? '● Active Scheduled' : '○ Suspended'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          
          {sortedTimeline.length > 0 && (
            <div 
              className="bg-emerald-950/10 border rounded-xl p-4 flex gap-2.5 mt-6 animate-pulse transition-all duration-300"
              style={{ borderColor: theme.border }}
            >
              <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
              <p className="text-[10px] leading-relaxed font-semibold" style={{ color: theme.subText }}>
                Timers run locally on the ESP8266 processor even if network connections are lost. Fail-safe logic ensures the pump turns OFF automatically.
              </p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
