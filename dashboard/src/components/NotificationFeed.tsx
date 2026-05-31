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

  const getLogCardStyles = (type: 'info' | 'alert' | 'success') => {
    switch (type) {
      case 'alert':
        return {
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderColor: 'rgba(239, 68, 68, 0.25)',
          color: theme.text
        };
      case 'success':
        return {
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderColor: 'rgba(16, 185, 129, 0.25)',
          color: theme.text
        };
      case 'info':
      default:
        return {
          backgroundColor: theme.inputBg,
          borderColor: theme.border,
          color: theme.text
        };
    }
  };

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
          <Bell className="w-5 h-5" style={{ color: theme.primary }} />
          <h2 className="text-sm font-bold tracking-widest uppercase">System Activity Logs</h2>
        </div>

        {logs.length > 0 && (
          <button
            onClick={handleClearLogs}
            className="p-1.5 rounded-lg hover:opacity-85 transition-all text-white border"
            style={{ 
              backgroundColor: theme.primary, 
              borderColor: theme.primary 
            }}
            title="Clear All Logs"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* LOG FEED CONTROLLER */}
      <div className="flex-1 space-y-3 max-h-[360px] overflow-y-auto pr-1">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20" style={{ color: theme.subText }}>
            <ShieldAlert className="w-12 h-12 mb-3 opacity-60" strokeWidth={1} />
            <p className="text-xs font-bold uppercase tracking-widest">No activity logs recorded</p>
            <span className="text-[10px] opacity-75 mt-1">Telemetry triggers will appear here</span>
          </div>
        ) : (
          logs.map((log) => (
            <div 
              key={log.id} 
              className="p-3.5 rounded-xl border flex gap-3 transition-all duration-300 hover:scale-[1.005]"
              style={getLogCardStyles(log.type)}
            >
              {getLogIcon(log.type)}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline gap-2">
                  <h4 className="text-xs font-black tracking-wide uppercase truncate">
                    {log.title}
                  </h4>
                  <span className="text-[9px] font-semibold shrink-0" style={{ color: theme.subText }}>
                    {formatRelativeTime(log.timestamp)}
                  </span>
                </div>
                <p 
                  className="text-xs leading-relaxed mt-1 font-semibold"
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
