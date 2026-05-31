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
      className="rounded-2xl p-6 border shadow-xl flex flex-col relative overflow-hidden group transition-all duration-300"
      style={{ 
        backgroundColor: theme.cardBg, 
        borderColor: theme.border,
        color: theme.text 
      }}
    >
      {/* Background active glow */}
      {isPumpActive && (
        <div 
          className="absolute w-64 h-64 rounded-full blur-3xl -top-20 -right-20 animate-pulse opacity-15"
          style={{ backgroundColor: theme.primary }}
        ></div>
      )}
      {pumpProtection.triggered && (
        <div className="absolute w-64 h-64 rounded-full bg-red-600/10 blur-3xl -top-20 -right-20 animate-pulse"></div>
      )}

      <div 
        className="w-full flex items-center justify-between mb-4 pb-3 border-b transition-all duration-300"
        style={{ borderBottomColor: theme.border }}
      >
        <div className="flex items-center gap-2">
          <Activity 
            className={`w-5 h-5 transition-colors ${isPumpActive ? 'animate-spin' : ''}`}
            style={{ color: isPumpActive ? theme.primary : theme.subText }}
          />
          <h2 className="text-sm font-bold tracking-widest uppercase">Pump Control</h2>
        </div>
        
        <span 
          className="text-[10px] font-black tracking-widest uppercase px-2.5 py-0.5 rounded-full border transition-all duration-300"
          style={{ 
            backgroundColor: theme.inputBg, 
            borderColor: isPumpActive ? theme.primary : theme.border, 
            color: isPumpActive ? theme.primary : theme.subText
          }}
        >
          {isPumpActive ? 'Running' : 'Standby'}
        </span>
      </div>

      {/* MOTOR PROTECTION TRIGGERED BANNER */}
      {pumpProtection.triggered && (
        <div className="bg-red-950/20 border border-red-500/30 rounded-xl p-4 mb-5 flex flex-col gap-3">
          <div className="flex gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-xs font-black tracking-wider uppercase text-red-200">
                Pump Protection Engaged
              </h3>
              <p className="text-xs text-red-300 mt-1 leading-relaxed">
                Pump shut down automatically to prevent motor damage after running continuously for {maxRuntimeMinutes} minutes.
              </p>
            </div>
          </div>
          <button
            onClick={resetPumpProtection}
            className="w-full py-2 text-white font-extrabold text-xs tracking-widest rounded-lg transition-all shadow-lg shadow-red-950/50 uppercase border border-red-500/20"
            style={{ backgroundColor: theme.primary }}
          >
            RESET MOTOR PROTECTION
          </button>
        </div>
      )}

      {/* ACTIVE RUNNING COUNTDOWN TIMER */}
      {!pumpProtection.triggered && isPumpActive && pumpStartTimeEpoch > 0 && (
        <div 
          className="border rounded-xl p-4 mb-5 flex justify-between items-center animate-pulse transition-all duration-300"
          style={{ 
            backgroundColor: theme.inputBg, 
            borderColor: theme.border 
          }}
        >
          <div className="flex items-center gap-2.5">
            <Timer className="w-5 h-5" style={{ color: theme.primary }} />
            <div>
              <h4 
                className="text-[10px] font-black tracking-widest uppercase"
                style={{ color: theme.subText }}
              >
                Auto-Shutdown Timer
              </h4>
              <span className="font-bold text-xs" style={{ color: theme.text }}>
                Active Cycle Protection
              </span>
            </div>
          </div>
          <span 
            className="text-xl font-black font-mono tracking-wider"
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
          className={`w-32 h-32 rounded-full border-4 flex flex-col items-center justify-center gap-2 shadow-2xl transition-all duration-300 select-none cursor-pointer focus:outline-none ${
            autoMode === 1 || pumpProtection.triggered
              ? 'opacity-40 cursor-not-allowed'
              : 'hover:scale-[1.03] active:scale-[0.98]'
          }`}
          style={{
            backgroundColor: isPumpActive ? theme.primary : theme.inputBg,
            borderColor: isPumpActive ? 'rgba(255,255,255,0.4)' : theme.border,
            color: isPumpActive ? '#ffffff' : theme.text
          }}
        >
          <Power className="w-10 h-10" strokeWidth={2.5} />
          <span className="text-xs font-black tracking-widest uppercase">
            {isPumpActive ? 'TURN OFF' : 'TURN ON'}
          </span>
        </button>

        {autoMode === 1 && (
          <p 
            className="text-[10px] font-extrabold tracking-wider uppercase text-center mt-5"
            style={{ color: theme.subText }}
          >
            Manual override disabled in Auto mode
          </p>
        )}
      </div>

      {/* RAIN WARNING MODAL DIALOG */}
      {showConfirm && (
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
              className="flex items-center gap-3 mb-4 pb-2 border-b transition-all"
              style={{ 
                color: theme.primary, 
                borderBottomColor: theme.border 
              }}
            >
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-black tracking-wider uppercase">
                Rain Forecast Warning!
              </h3>
            </div>
            
            <p className="text-xs leading-relaxed opacity-90 mb-6">
              There is a <span className="font-extrabold" style={{ color: theme.primary }}>{rainChance}%</span> chance of rainfall predicted within the next <span className="font-bold">{forecastWindowHours} hours</span> in your orchard area. 
              <br/><br/>
              Are you sure you want to engage the manual irrigation override?
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 rounded-lg border font-bold text-xs tracking-wider uppercase transition-all"
                style={{ 
                  borderColor: theme.border, 
                  color: theme.subText 
                }}
              >
                CANCEL
              </button>
              <button
                onClick={confirmWatering}
                className="flex-1 py-2.5 rounded-lg text-white font-extrabold text-xs tracking-wider uppercase shadow-lg border transition-all"
                style={{ 
                  backgroundColor: theme.primary,
                  borderColor: theme.primary 
                }}
              >
                CONTINUE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
