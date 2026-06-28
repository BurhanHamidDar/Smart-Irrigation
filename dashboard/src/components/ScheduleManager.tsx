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
      className="rounded-xl p-5 border flex flex-col"
      style={{ 
        backgroundColor: theme.cardBg, 
        borderColor: theme.cardBorder,
        boxShadow: theme.cardShadow,
        color: theme.text 
      }}
    >
      <div 
        className="w-full flex items-center justify-between mb-4 pb-3 border-b"
        style={{ borderBottomColor: theme.cardBorder }}
      >
        <div className="flex items-center gap-2">
          <CalendarClock className="w-4 h-4" style={{ color: theme.primary }} />
          <h2 className="text-sm font-semibold">Automation Schedules</h2>
        </div>
        
        <button
          onClick={() => setModalVisible(true)}
          className="p-1 rounded-lg text-white transition-colors cursor-pointer"
          style={{ backgroundColor: theme.primary }}
          title="Add New Schedule"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* TODAY'S UPCOMING / ACTIVE HIGHLIGHT */}
      {upcomingList.length > 0 && (
        <div 
          className="border rounded-lg p-3.5 mb-4 flex flex-col gap-2"
          style={{ 
            backgroundColor: theme.inputBg, 
            borderColor: theme.cardBorder 
          }}
        >
          <h4 className="text-[10px] font-semibold uppercase" style={{ color: theme.primary }}>
            Next Irrigation Cycle
          </h4>
          {upcomingList.slice(0, 1).map((s, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" style={{ color: s.active ? theme.primary : theme.subText }} />
                <span className="text-xs font-semibold animate-none" style={{ color: theme.text }}>
                  {formatTime(s.startHour, s.startMinute)}
                </span>
                <span className="text-xs" style={{ color: theme.subText }}>to {formatTime(s.stopHour, s.stopMinute)}</span>
              </div>
              <span 
                className="text-[10px] font-semibold px-2 py-0.5 rounded border"
                style={{ 
                  backgroundColor: s.active ? '#eaf7f0' : theme.cardBg, 
                  borderColor: s.active ? '#bbf7d0' : theme.cardBorder, 
                  color: s.active ? '#2e7d52' : theme.subText 
                }}
              >
                {s.active ? 'Watering Active' : `In ${Math.floor(s.remainingMins / 60)}h ${s.remainingMins % 60}m`}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* SCHEDULES LIST */}
      <div className="flex-1 space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
        {schedules.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10" style={{ color: theme.subText }}>
            <CalendarClock className="w-10 h-10 mb-2 opacity-50" strokeWidth={1.5} />
            <p className="text-xs font-semibold uppercase tracking-wider">No schedules configured</p>
            <span className="text-[10px] opacity-70 mt-0.5">Maximum of 5 schedules allowed</span>
          </div>
        ) : (
          schedules.map((sched, index) => (
            <div 
              key={index}
              className="flex items-center justify-between p-3 border rounded-lg"
              style={{ 
                backgroundColor: theme.inputBg, 
                borderColor: theme.cardBorder,
                color: sched.enabled ? theme.text : theme.subText
              }}
            >
              <div className="flex items-center gap-3">
                <Clock className="w-4.5 h-4.5 shrink-0" style={{ color: sched.enabled ? theme.primary : theme.subText }} />
                <div>
                  <span className="text-sm font-semibold block">
                    {formatTime(sched.startHour, sched.startMinute)}
                  </span>
                  <span className="text-xs opacity-75 block mt-0.5">
                    until {formatTime(sched.stopHour, sched.stopMinute)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Switch Toggle */}
                <button
                  type="button"
                  onClick={() => handleToggleSchedule(index, !sched.enabled)}
                  className="relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                  style={{ backgroundColor: sched.enabled ? theme.primary : theme.cardBorder }}
                >
                  <span
                    className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                      sched.enabled ? 'translate-x-4.5' : 'translate-x-0'
                    }`}
                  />
                </button>

                {/* Delete button */}
                <button
                  onClick={() => handleDeleteSchedule(index)}
                  className="p-1 hover:text-red-600 transition-colors"
                  style={{ color: theme.subText }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ADD SCHEDULE MODAL */}
      {modalVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-fadeIn">
          <div 
            className="max-w-sm w-full rounded-xl p-5 border shadow-lg"
            style={{ 
              backgroundColor: theme.cardBg, 
              borderColor: theme.cardBorder,
              color: theme.text 
            }}
          >
            <div 
              className="flex items-center justify-between mb-4 pb-2 border-b"
              style={{ borderBottomColor: theme.cardBorder }}
            >
              <h3 className="text-sm font-semibold uppercase" style={{ color: theme.primary }}>
                New Irrigation Schedule
              </h3>
              <button onClick={() => setModalVisible(false)} style={{ color: theme.subText }} className="hover:text-red-500">
                <X className="w-4 h-4" />
              </button>
            </div>

            {showError || schedules.length >= 5 ? (
              <div 
                className="border text-xs p-2.5 rounded-lg flex items-center gap-2 mb-4"
                style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca', color: '#c0392b' }}
              >
                <AlertOctagon className="w-4 h-4 shrink-0 text-red-600" />
                <span>Limit Reached! Maximum 5 automated schedules are allowed.</span>
              </div>
            ) : null}

            <form onSubmit={handleAddSchedule} className="space-y-4">
              {/* Start Time Selectors */}
              <div>
                <label 
                  className="block text-[11px] font-semibold uppercase mb-1.5"
                  style={{ color: theme.subText }}
                >
                  Start Time
                </label>
                <div className="flex gap-2">
                  <select
                    value={startHour}
                    onChange={(e) => setStartHour(e.target.value)}
                    className="flex-1 h-10 px-2.5 rounded-lg focus:outline-none text-sm font-semibold border"
                    style={{ 
                      backgroundColor: theme.inputBg, 
                      borderColor: theme.inputBorder, 
                      color: theme.text 
                    }}
                  >
                    {hoursList.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                  <span className="font-semibold self-center" style={{ color: theme.primary }}>:</span>
                  <select
                    value={startMinute}
                    onChange={(e) => setStartMinute(e.target.value)}
                    className="flex-1 h-10 px-2.5 rounded-lg focus:outline-none text-sm font-semibold border"
                    style={{ 
                      backgroundColor: theme.inputBg, 
                      borderColor: theme.inputBorder, 
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
                  className="block text-[11px] font-semibold uppercase mb-1.5"
                  style={{ color: theme.subText }}
                >
                  Stop Time
                </label>
                <div className="flex gap-2">
                  <select
                    value={stopHour}
                    onChange={(e) => setStopHour(e.target.value)}
                    className="flex-1 h-10 px-2.5 rounded-lg focus:outline-none text-sm font-semibold border"
                    style={{ 
                      backgroundColor: theme.inputBg, 
                      borderColor: theme.inputBorder, 
                      color: theme.text 
                    }}
                  >
                    {hoursList.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                  <span className="font-semibold self-center" style={{ color: theme.primary }}>:</span>
                  <select
                    value={stopMinute}
                    onChange={(e) => setStopMinute(e.target.value)}
                    className="flex-1 h-10 px-2.5 rounded-lg focus:outline-none text-sm font-semibold border"
                    style={{ 
                      backgroundColor: theme.inputBg, 
                      borderColor: theme.inputBorder, 
                      color: theme.text 
                    }}
                  >
                    {minutesList.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalVisible(false)}
                  className="flex-1 py-2 rounded-lg border font-medium text-xs transition-colors"
                  style={{ 
                    borderColor: theme.cardBorder, 
                    color: theme.subText 
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={schedules.length >= 5}
                  className="flex-1 py-2 rounded-lg text-white font-medium text-xs border disabled:opacity-50 disabled:pointer-events-none transition-colors"
                  style={{ 
                    backgroundColor: theme.primary, 
                    borderColor: theme.primary 
                  }}
                >
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
