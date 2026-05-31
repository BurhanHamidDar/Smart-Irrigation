import React, { useState } from 'react';
import { CalendarClock, Clock, Plus, Trash2, X, AlertOctagon } from 'lucide-react';
import { Schedule } from '../hooks/useFirebaseSync';
import { AppTheme } from '../App';

interface ScheduleManagerProps {
  schedules: Schedule[];
  setSchedulesList: (schedules: Schedule[]) => void;
  theme: AppTheme;
}

export default function ScheduleManager({ schedules, setSchedulesList, theme }: ScheduleManagerProps) {
  const [modalVisible, setModalVisible] = useState(false);
  
  // New schedule form state
  const [startHour, setStartHour] = useState('08');
  const [startMinute, setStartMinute] = useState('00');
  const [stopHour, setStopHour] = useState('08');
  const [stopMinute, setStopMinute] = useState('30');
  
  const [showError, setShowError] = useState(false);

  const formatTime = (hour: number, min: number) => {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h = hour % 12 || 12;
    return `${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')} ${ampm}`;
  };

  const handleToggleSchedule = (index: number, val: boolean) => {
    const updated = [...schedules];
    updated[index].enabled = val;
    setSchedulesList(updated);
  };

  const handleDeleteSchedule = (index: number) => {
    if (confirm("Delete Schedule?\nAre you sure you want to remove this watering schedule?")) {
      const updated = schedules.filter((_, i) => i !== index);
      setSchedulesList(updated);
    }
  };

  const handleAddSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (schedules.length >= 5) {
      setShowError(true);
      return;
    }

    const newSched: Schedule = {
      startHour: parseInt(startHour, 10),
      startMinute: parseInt(startMinute, 10),
      stopHour: parseInt(stopHour, 10),
      stopMinute: parseInt(stopMinute, 10),
      enabled: true
    };

    const updated = [...schedules, newSched];
    setSchedulesList(updated);
    
    // Close modal & reset
    setModalVisible(false);
    setShowError(false);
  };

  const getUpcomingSchedules = () => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    return schedules
      .filter(s => s.enabled)
      .map((s, index) => {
        const startMin = s.startHour * 60 + s.startMinute;
        const stopMin = s.stopHour * 60 + s.stopMinute;
        const active = currentMinutes >= startMin && currentMinutes < stopMin;
        
        let remainingMins = startMin - currentMinutes;
        if (remainingMins < 0) {
          remainingMins += 24 * 60;
        }

        return {
          ...s,
          originalIndex: index,
          active,
          remainingMins,
        };
      })
      .sort((a, b) => a.remainingMins - b.remainingMins);
  };

  const upcomingList = getUpcomingSchedules();

  const hoursList = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutesList = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  return (
    <div 
      className="rounded-2xl p-6 border shadow-xl flex flex-col relative overflow-hidden group transition-all duration-300"
      style={{ 
        backgroundColor: theme.cardBg, 
        borderColor: theme.border,
        color: theme.text 
      }}
    >
      <div 
        className="w-full flex items-center justify-between mb-4 pb-3 border-b transition-all duration-300"
        style={{ borderBottomColor: theme.border }}
      >
        <div className="flex items-center gap-2">
          <CalendarClock className="w-5 h-5" style={{ color: theme.primary }} />
          <h2 className="text-sm font-bold tracking-widest uppercase">Automation Schedules</h2>
        </div>
        
        <button
          onClick={() => setModalVisible(true)}
          className="p-1 rounded-lg text-white transition-all transform hover:scale-[1.05]"
          style={{ backgroundColor: theme.primary }}
          title="Add New Schedule"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* TODAY'S UPCOMING / ACTIVE HIGHLIGHT */}
      {upcomingList.length > 0 && (
        <div 
          className="border rounded-xl p-4 mb-5 flex flex-col gap-2.5 transition-all duration-300"
          style={{ 
            backgroundColor: theme.inputBg, 
            borderColor: theme.border 
          }}
        >
          <h4 className="text-[10px] font-black tracking-widest uppercase" style={{ color: theme.primary }}>
            Next Irrigation Cycle
          </h4>
          {upcomingList.slice(0, 1).map((s, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className={`w-4 h-4 ${s.active ? 'animate-pulse' : ''}`} style={{ color: s.active ? theme.primary : theme.subText }} />
                <span className="text-sm font-extrabold" style={{ color: theme.text }}>
                  {formatTime(s.startHour, s.startMinute)}
                </span>
                <span className="text-xs opacity-80" style={{ color: theme.subText }}>to {formatTime(s.stopHour, s.stopMinute)}</span>
              </div>
              <span 
                className="text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded border transition-all"
                style={{ 
                  backgroundColor: s.active ? theme.primary + '20' : theme.cardBg, 
                  borderColor: s.active ? theme.primary : theme.border, 
                  color: s.active ? theme.primary : theme.subText 
                }}
              >
                {s.active ? 'Watering Active' : `In ${Math.floor(s.remainingMins / 60)}h ${s.remainingMins % 60}m`}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* SCHEDULES LIST */}
      <div className="flex-1 space-y-3 max-h-[260px] overflow-y-auto pr-1">
        {schedules.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10" style={{ color: theme.subText }}>
            <CalendarClock className="w-12 h-12 mb-3 opacity-60" strokeWidth={1} />
            <p className="text-xs font-bold uppercase tracking-widest">No schedules configured</p>
            <span className="text-[10px] lowercase opacity-85 mt-1">Maximum of 5 schedules allowed</span>
          </div>
        ) : (
          schedules.map((sched, index) => (
            <div 
              key={index}
              className="flex items-center justify-between p-3.5 border rounded-xl transition-all duration-300"
              style={{ 
                backgroundColor: sched.enabled ? theme.inputBg : theme.inputBg + '30', 
                borderColor: theme.border,
                color: sched.enabled ? theme.text : theme.subText
              }}
            >
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 shrink-0" style={{ color: sched.enabled ? theme.primary : theme.subText }} />
                <div>
                  <span className="text-base font-extrabold tracking-wide block">
                    {formatTime(sched.startHour, sched.startMinute)}
                  </span>
                  <span className="text-[11px] font-medium opacity-80 block mt-0.5">
                    until {formatTime(sched.stopHour, sched.stopMinute)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Switch Toggle */}
                <button
                  type="button"
                  onClick={() => handleToggleSchedule(index, !sched.enabled)}
                  className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                  style={{ backgroundColor: sched.enabled ? theme.primary : theme.border }}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      sched.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>

                {/* Delete button */}
                <button
                  onClick={() => handleDeleteSchedule(index)}
                  className="p-1 hover:text-red-500 transition-colors"
                  style={{ color: theme.subText }}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ADD SCHEDULE MODAL */}
      {modalVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div 
            className="max-w-sm w-full rounded-2xl p-6 border shadow-2xl animate-scaleUp transition-all duration-300"
            style={{ 
              backgroundColor: theme.cardBg, 
              borderColor: theme.border,
              color: theme.text 
            }}
          >
            <div 
              className="flex items-center justify-between mb-5 pb-2 border-b transition-all duration-300"
              style={{ borderBottomColor: theme.border }}
            >
              <h3 className="text-sm font-black tracking-widest uppercase" style={{ color: theme.primary }}>
                New Irrigation Schedule
              </h3>
              <button onClick={() => setModalVisible(false)} style={{ color: theme.subText }} className="hover:text-red-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            {showError || schedules.length >= 5 ? (
              <div className="bg-red-950/20 border border-red-500/30 text-red-200 text-xs p-3 rounded-lg flex items-center gap-2 mb-4 animate-pulse">
                <AlertOctagon className="w-5 h-5 shrink-0 text-red-500" />
                <span>Limit Reached! Maximum 5 automated schedules are allowed.</span>
              </div>
            ) : null}

            <form onSubmit={handleAddSchedule} className="space-y-4">
              {/* Start Time Selectors */}
              <div>
                <label 
                  className="block text-[10px] font-black uppercase tracking-wider mb-2"
                  style={{ color: theme.subText }}
                >
                  Start Time
                </label>
                <div className="flex gap-2">
                  <select
                    value={startHour}
                    onChange={(e) => setStartHour(e.target.value)}
                    className="flex-1 h-10 px-3 rounded-lg focus:outline-none text-sm font-bold border"
                    style={{ 
                      backgroundColor: theme.inputBg, 
                      borderColor: theme.border, 
                      color: theme.text 
                    }}
                  >
                    {hoursList.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                  <span className="font-bold self-center" style={{ color: theme.primary }}>:</span>
                  <select
                    value={startMinute}
                    onChange={(e) => setStartMinute(e.target.value)}
                    className="flex-1 h-10 px-3 rounded-lg focus:outline-none text-sm font-bold border"
                    style={{ 
                      backgroundColor: theme.inputBg, 
                      borderColor: theme.border, 
                      color: theme.text 
                    }}
                  >
                    {minutesList.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>

              {/* Stop Time Selectors */}
              <div>
                <label 
                  className="block text-[10px] font-black uppercase tracking-wider mb-2"
                  style={{ color: theme.subText }}
                >
                  Stop Time
                </label>
                <div className="flex gap-2">
                  <select
                    value={stopHour}
                    onChange={(e) => setStopHour(e.target.value)}
                    className="flex-1 h-10 px-3 rounded-lg focus:outline-none text-sm font-bold border"
                    style={{ 
                      backgroundColor: theme.inputBg, 
                      borderColor: theme.border, 
                      color: theme.text 
                    }}
                  >
                    {hoursList.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                  <span className="font-bold self-center" style={{ color: theme.primary }}>:</span>
                  <select
                    value={stopMinute}
                    onChange={(e) => setStopMinute(e.target.value)}
                    className="flex-1 h-10 px-3 rounded-lg focus:outline-none text-sm font-bold border"
                    style={{ 
                      backgroundColor: theme.inputBg, 
                      borderColor: theme.border, 
                      color: theme.text 
                    }}
                  >
                    {minutesList.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalVisible(false)}
                  className="flex-1 py-2 rounded-lg border font-bold text-xs tracking-wider uppercase transition-all"
                  style={{ 
                    borderColor: theme.border, 
                    color: theme.subText 
                  }}
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={schedules.length >= 5}
                  className="flex-1 py-2 rounded-lg text-white font-extrabold text-xs tracking-wider uppercase border disabled:opacity-50 disabled:pointer-events-none transition-all"
                  style={{ 
                    backgroundColor: theme.primary, 
                    borderColor: theme.primary 
                  }}
                >
                  SAVE SCHEDULE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
