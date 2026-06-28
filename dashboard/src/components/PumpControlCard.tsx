import React, { useState, useEffect } from 'react';
import { Power, AlertTriangle, Activity, Timer } from 'lucide-react';
import { PumpProtection } from '../hooks/useFirebaseSync';
import { AppTheme } from '../App';

interface PumpControlCardProps {
  relay: number;
  autoMode: number;
  pumpProtection: PumpProtection;
  pumpStartTimeEpoch: number;
  maxRuntimeMinutes: number;
  rainPredicted: boolean;
  rainChance: number;
  forecastWindowHours: number;
  setPumpState: (state: number) => void;
  resetPumpProtection: () => void;
  theme: AppTheme;
}

export default function PumpControlCard({
  relay,
  autoMode,
  pumpProtection,
  pumpStartTimeEpoch,
  maxRuntimeMinutes,
  rainPredicted,
  rainChance,
  forecastWindowHours,
  setPumpState,
  resetPumpProtection,
  theme
}: PumpControlCardProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [currentEpoch, setCurrentEpoch] = useState(Math.floor(Date.now() / 1000));

  // Live timer tick
  useEffect(() => {
    let interval: any;
    if (relay === 1 && pumpStartTimeEpoch > 0) {
      interval = setInterval(() => {
        setCurrentEpoch(Math.floor(Date.now() / 1000));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [relay, pumpStartTimeEpoch]);

  const handleToggleClick = () => {
    if (autoMode === 1) return; // Prevent manual action when auto mode is engaged
    if (pumpProtection.triggered) return;

    if (relay === 0) {
      // Trying to turn ON
      if (rainPredicted) {
        setShowConfirm(true); // Open warning dialog
      } else {
        setPumpState(1);
      }
    } else {
      // Turn OFF
      setPumpState(0);
    }
  };

  const confirmWatering = () => {
    setPumpState(1);
    setShowConfirm(false);
  };

  // Calculate dynamic auto-shutdown countdown
  let timeRemainingSecs = 0;
  if (relay === 1 && pumpStartTimeEpoch > 0) {
    const totalAllowedSecs = maxRuntimeMinutes * 60;
    const elapsedSecs = currentEpoch - pumpStartTimeEpoch;
    timeRemainingSecs = Math.max(0, totalAllowedSecs - elapsedSecs);
  }

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return `${m}m ${s.toString().padStart(2, '0')}s`;
  };

  const isPumpActive = relay === 1;

  return (
    <div 
      className="rounded-xl p-5 border flex flex-col relative overflow-hidden"
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
          <Activity 
            className={`w-4 h-4 ${isPumpActive ? 'animate-spin' : ''}`}
            style={{ color: isPumpActive ? theme.primary : theme.subText }}
          />
          <h2 className="text-sm font-semibold">Pump Control</h2>
        </div>
        
        <span 
          className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
          style={{ 
            backgroundColor: isPumpActive ? '#eaf7f0' : theme.inputBg, 
            color: isPumpActive ? '#2e7d52' : theme.subText
          }}
        >
          {isPumpActive ? 'Running' : 'Standby'}
        </span>
      </div>

      {/* MOTOR PROTECTION TRIGGERED BANNER */}
      {pumpProtection.triggered && (
        <div 
          className="border rounded-lg p-4 mb-4 flex flex-col gap-3"
          style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca', color: '#c0392b' }}
        >
          <div className="flex gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
            <div>
              <h3 className="text-xs font-semibold uppercase">
                Pump Protection Engaged
              </h3>
              <p className="text-xs mt-1 leading-relaxed">
                Pump shut down automatically to prevent motor damage after running continuously for {maxRuntimeMinutes} minutes.
              </p>
            </div>
          </div>
          <button
            onClick={resetPumpProtection}
            className="w-full py-2 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
            style={{ backgroundColor: theme.primary }}
          >
            Reset Motor Protection
          </button>
        </div>
      )}

      {/* ACTIVE RUNNING COUNTDOWN TIMER */}
      {!pumpProtection.triggered && isPumpActive && pumpStartTimeEpoch > 0 && (
        <div 
          className="border rounded-lg p-3 mb-4 flex justify-between items-center"
          style={{ 
            backgroundColor: theme.inputBg, 
            borderColor: theme.cardBorder 
          }}
        >
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4" style={{ color: theme.primary }} />
            <div>
              <h4 
                className="text-[10px] font-semibold uppercase"
                style={{ color: theme.subText }}
              >
                Auto-Shutdown Timer
              </h4>
              <span className="font-medium text-xs" style={{ color: theme.text }}>
                Active Cycle Protection
              </span>
            </div>
          </div>
          <span 
            className="text-lg font-bold font-mono"
            style={{ color: theme.primary }}
          >
            {formatCountdown(timeRemainingSecs)}
          </span>
        </div>
      )}

      {/* PUMP BUTTON LOGIC */}
      <div className="flex flex-col items-center justify-center py-4">
        <button
          onClick={handleToggleClick}
          disabled={autoMode === 1 || pumpProtection.triggered}
          className={`w-28 h-28 rounded-full border-2 flex flex-col items-center justify-center gap-2 shadow-sm transition-all select-none cursor-pointer focus:outline-none ${
            autoMode === 1 || pumpProtection.triggered
              ? 'opacity-40 cursor-not-allowed'
              : 'hover:opacity-90 active:scale-95'
          }`}
          style={{
            backgroundColor: isPumpActive ? theme.primary : theme.inputBg,
            borderColor: isPumpActive ? theme.primary : theme.cardBorder,
            color: isPumpActive ? '#ffffff' : theme.text
          }}
        >
          <Power className="w-8 h-8" strokeWidth={2.5} />
          <span className="text-xs font-semibold">
            {isPumpActive ? 'Turn Off' : 'Turn On'}
          </span>
        </button>

        {autoMode === 1 && (
          <p 
            className="text-[11px] font-medium text-center mt-4"
            style={{ color: theme.subText }}
          >
            Manual override disabled in Auto mode
          </p>
        )}
      </div>

      {/* RAIN WARNING MODAL DIALOG */}
      {showConfirm && (
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
              className="flex items-center gap-2.5 mb-3 pb-2 border-b"
              style={{ 
                color: theme.primary, 
                borderBottomColor: theme.cardBorder 
              }}
            >
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-semibold uppercase">
                Rain Forecast Warning
              </h3>
            </div>
            
            <p className="text-xs leading-relaxed mb-5" style={{ color: theme.subText }}>
              There is a <span className="font-semibold" style={{ color: theme.text }}>{rainChance}%</span> chance of rain forecast within the next {forecastWindowHours} hours in your orchard area. 
              <br/><br/>
              Are you sure you want to turn on manual watering?
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2 rounded-lg border font-medium text-xs transition-colors"
                style={{ 
                  borderColor: theme.cardBorder, 
                  color: theme.subText 
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmWatering}
                className="flex-1 py-2 rounded-lg text-white font-medium text-xs transition-colors"
                style={{ 
                  backgroundColor: theme.primary,
                  borderColor: theme.primary 
                }}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
