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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      
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
        className="lg:col-span-1 border rounded-xl p-5 flex flex-col relative overflow-hidden"
        style={{ 
          backgroundColor: theme.cardBg, 
          borderColor: theme.cardBorder,
          boxShadow: theme.cardShadow,
          color: theme.text 
        }}
      >
        <div 
          className="w-full flex items-center justify-between mb-5 pb-3 border-b"
          style={{ borderBottomColor: theme.cardBorder }}
        >
          <div className="flex items-center gap-2">
            <CalendarRange className="w-4 h-4" style={{ color: theme.primary }} />
            <h2 className="text-sm font-semibold">Irrigation Timeline</h2>
          </div>
          <span className="text-xs" style={{ color: theme.subText }}>
            Chronological
          </span>
        </div>

        {/* TIMELINE LIST */}
        <div className="flex-1 space-y-4">
          {sortedTimeline.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16" style={{ color: theme.subText }}>
              <Clock className="w-10 h-10 mb-3 opacity-50" strokeWidth={1.5} />
              <p className="text-xs font-semibold uppercase tracking-wider">No active timers</p>
              <span className="text-xs opacity-65 mt-1">Timeline updates upon creating schedules</span>
            </div>
          ) : (
            sortedTimeline.map((sched, index) => {
              const startTotal = sched.startHour * 60 + sched.startMinute;
              const stopTotal = sched.stopHour * 60 + sched.stopMinute;
              const duration = stopTotal >= startTotal ? stopTotal - startTotal : (24 * 60 - startTotal) + stopTotal;

              return (
                <div key={index} className="relative pl-5 border-l last:border-l-0 pb-1" style={{ borderColor: theme.cardBorder }}>
                  {/* Timeline circle node */}
                  <span 
                    className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full border transition-colors"
                    style={{ 
                      backgroundColor: sched.enabled ? theme.primary : theme.inputBg,
                      borderColor: sched.enabled ? theme.primary : theme.cardBorder 
                    }}
                  ></span>

                  <div className="space-y-1">
                    <span 
                      className="text-xs font-semibold block"
                      style={{ color: sched.enabled ? theme.text : theme.subText }}
                    >
                      {formatTime(sched.startHour, sched.startMinute)}
                    </span>
                    <p className="text-xs font-medium" style={{ color: theme.subText }}>
                      Runs for <span className="font-semibold" style={{ color: theme.text }}>{duration} mins</span> (stops at {formatTime(sched.stopHour, sched.stopMinute)})
                    </p>
                    <span className="text-[10px] font-medium block" style={{ color: sched.enabled ? '#2e7d52' : theme.subText }}>
                      {sched.enabled ? '● Active Scheduled' : '○ Suspended'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          
          {sortedTimeline.length > 0 && (
            <div 
              className="border rounded-lg p-3 flex gap-2.5 mt-5"
              style={{ backgroundColor: '#eaf7f0', borderColor: '#bbf7d0', color: '#2e7d52' }}
            >
              <Sparkles className="w-4.5 h-4.5 text-amber-600 shrink-0" />
              <p className="text-xs leading-relaxed">
                Timers run locally on the ESP8266 processor even if network connections are lost. Fail-safe logic ensures the pump turns OFF automatically.
              </p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
