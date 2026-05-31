import React from 'react';
import { AppTheme } from '../App';
import { SystemState, LocationSettings } from '../hooks/useFirebaseSync';
import SettingsPanel from '../components/SettingsPanel';

interface SettingsPageProps {
  state: SystemState;
  location: LocationSettings | null;
  theme: AppTheme;
  setOrchardLocation: (lat: number, lon: number) => void;
  setMaxRuntimeMinutes: (min: number) => void;
  setMoistureThreshold: (threshold: number) => void;
}

export default function SettingsPage({
  state,
  location,
  theme,
  setOrchardLocation,
  setMaxRuntimeMinutes,
  setMoistureThreshold
}: SettingsPageProps) {
  return (
    <div className="space-y-6 animate-fadeIn">
      <SettingsPanel 
        location={location}
        maxRuntimeMinutes={state.maxRuntimeMinutes}
        currentThreshold={state.threshold}
        setOrchardLocation={setOrchardLocation}
        setMaxRuntimeMinutes={setMaxRuntimeMinutes}
        setMoistureThreshold={setMoistureThreshold}
        theme={theme}
      />
    </div>
  );
}
