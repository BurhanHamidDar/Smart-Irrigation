import React from 'react';
import { AppTheme } from '../App';
import { SystemLog } from '../hooks/useFirebaseSync';
import NotificationFeed from '../components/NotificationFeed';

interface LogsPageProps {
  logs: SystemLog[];
  theme: AppTheme;
}

export default function LogsPage({ logs, theme }: LogsPageProps) {
  return (
    <div className="space-y-6 animate-fadeIn">
      <NotificationFeed 
        logs={logs}
        theme={theme}
      />
    </div>
  );
}
