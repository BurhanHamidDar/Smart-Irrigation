import React from 'react';
import { Bell, AlertTriangle, Droplets, CheckCircle2, Trash2, ShieldAlert } from 'lucide-react';
import { ref, remove } from 'firebase/database';
import { database } from '../config/firebase';
import { SystemLog } from '../hooks/useFirebaseSync';
import { AppTheme } from '../App';

interface NotificationFeedProps {
  logs: SystemLog[];
  theme: AppTheme;
}

export default function NotificationFeed({ logs, theme }: NotificationFeedProps) {
  
  const handleClearLogs = async () => {
    if (logs.length === 0) return;
    
    if (confirm("Clear System Logs?\nAre you sure you want to permanently delete all activity logs from the database?")) {
      try {
        await remove(ref(database, 'notifications'));
      } catch (e) {
        alert("Failed to clear system logs: network error.");
      }
    }
  };

  const formatRelativeTime = (timestamp: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getLogIcon = (type: 'info' | 'alert' | 'success') => {
    switch (type) {
      case 'alert':
        return <AlertTriangle className="w-5 h-5 shrink-0" style={{ color: theme.primary }} />;
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
      case 'info':
      default:
        return <Droplets className="w-5 h-5 text-blue-400 shrink-0" />;
    }
  };

  const getDotColor = (type: 'info' | 'alert' | 'success') => {
    switch (type) {
      case 'alert':
        return '#ef4444'; // red-500
      case 'success':
        return '#10b981'; // emerald-500
      case 'info':
      default:
        return '#60a5fa'; // blue-400
    }
  };

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
          <Bell className="w-5 h-5" style={{ color: theme.primary }} />
          <h2 className="text-sm font-semibold" style={{ color: theme.text }}>Activity Logs</h2>
        </div>

        {logs.length > 0 && (
          <button
            onClick={handleClearLogs}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors hover:opacity-80"
            style={{ 
              borderColor: theme.cardBorder, 
              color: theme.subText,
              backgroundColor: 'transparent'
            }}
            title="Clear All Logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </button>
        )}
      </div>

      {/* LOG FEED CONTROLLER */}
      <div className="flex-1 max-h-[360px] overflow-y-auto pr-1">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16" style={{ color: theme.subText }}>
            <ShieldAlert className="w-10 h-10 mb-3 opacity-50" strokeWidth={1.5} />
            <p className="text-sm font-medium">No activity logs recorded</p>
            <span className="text-xs opacity-60 mt-1">Telemetry triggers will appear here</span>
          </div>
        ) : (
          logs.map((log, index) => (
            <div 
              key={log.id} 
              className="flex items-start gap-3 py-3"
              style={{
                borderBottom: index < logs.length - 1 ? `1px solid ${theme.cardBorder}` : 'none',
              }}
            >
              <div 
                className="w-2 h-2 rounded-full shrink-0 mt-1.5"
                style={{ backgroundColor: getDotColor(log.type) }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline gap-2">
                  <h4 className="text-sm font-medium truncate" style={{ color: theme.text }}>
                    {log.title}
                  </h4>
                  <span className="text-[10px] font-medium shrink-0" style={{ color: theme.subText }}>
                    {formatRelativeTime(log.timestamp)}
                  </span>
                </div>
                <p 
                  className="text-xs leading-relaxed mt-0.5"
                  style={{ color: theme.subText }}
                >
                  {log.desc}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
