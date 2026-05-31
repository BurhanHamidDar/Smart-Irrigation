import React from 'react';
import { AppTheme } from '../App';
import { SystemState, SystemLog } from '../hooks/useFirebaseSync';
import AnalyticsCharts from '../components/AnalyticsCharts';

interface AnalyticsPageProps {
  state: SystemState;
  logs: SystemLog[];
  theme: AppTheme;
}

export default function AnalyticsPage({ state, logs, theme }: AnalyticsPageProps) {
  return (
    <div className="space-y-6 animate-fadeIn">
      <AnalyticsCharts 
        logs={logs}
        currentMoisture={state.moisture}
        currentThreshold={state.threshold}
        theme={theme}
      />
    </div>
  );
}
