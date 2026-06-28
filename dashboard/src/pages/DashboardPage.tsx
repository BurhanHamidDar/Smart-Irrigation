import React, { useState } from 'react';
import { 
  LogOut, Sun, Moon, Home, Droplet, Power, Calendar, 
  CloudSun, BarChart3, Bell, Settings, Wifi, WifiOff, Bot, Leaf, Menu, X
} from 'lucide-react';
import { useFirebaseSync } from '../hooks/useFirebaseSync';
import { AppTheme } from '../App';

import OverviewPage from './OverviewPage';
import MoisturePage from './MoisturePage';
import PumpPage from './PumpPage';
import SchedulesPage from './SchedulesPage';
import WeatherPage from './WeatherPage';
import AnalyticsPage from './AnalyticsPage';
import LogsPage from './LogsPage';
import SettingsPage from './SettingsPage';
import AdvisorPage from './AdvisorPage';

interface DashboardPageProps {
  onLogout: () => void;
  theme: AppTheme;
  isDark: boolean;
  toggleTheme: () => void;
}

type TabPage = 'overview' | 'moisture' | 'pump' | 'schedules' | 'weather' | 'analytics' | 'logs' | 'settings' | 'advisor';

const navItems = [
  { id: 'overview',   name: 'Overview',       icon: Home },
  { id: 'moisture',   name: 'Moisture',        icon: Droplet },
  { id: 'pump',       name: 'Pump Control',    icon: Power },
  { id: 'schedules',  name: 'Schedules',       icon: Calendar },
  { id: 'weather',    name: 'Weather',         icon: CloudSun },
  { id: 'analytics',  name: 'Analytics',       icon: BarChart3 },
  { id: 'logs',       name: 'Activity Logs',   icon: Bell },
  { id: 'advisor',    name: 'AgroBot Advisor', icon: Bot },
  { id: 'settings',   name: 'Settings',        icon: Settings },
] as const;

export default function DashboardPage({ onLogout, theme, isDark, toggleTheme }: DashboardPageProps) {
  const [activePage, setActivePage] = useState<TabPage>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const {
    loading,
    firebaseConnected,
    deviceConnected,
    lastCommunication,
    state,
    location,
    logs,
    setPumpState,
    setAutoMode,
    setMoistureThreshold,
    setMaxRuntimeMinutes,
    resetPumpProtection,
    setSchedulesList,
    setOrchardLocation,
    setWeatherState,
    setSeasonalAuto,
  } = useFirebaseSync();

  const handleLogout = () => {
    if (confirm('Are you sure you want to log out?')) {
      localStorage.removeItem('isLoggedIn');
      onLogout();
    }
  };

  const activeNav = navItems.find(n => n.id === activePage);

  const renderPage = () => {
    switch (activePage) {
      case 'moisture':
        return <MoisturePage state={state} deviceConnected={deviceConnected} lastCommunication={lastCommunication} theme={theme} setMoistureThreshold={setMoistureThreshold} setSeasonalAuto={setSeasonalAuto} />;
      case 'pump':
        return <PumpPage state={state} logs={logs} theme={theme} setPumpState={setPumpState} resetPumpProtection={resetPumpProtection} setMaxRuntimeMinutes={setMaxRuntimeMinutes} />;
      case 'schedules':
        return <SchedulesPage state={state} theme={theme} setSchedulesList={setSchedulesList} />;
      case 'weather':
        return <WeatherPage state={state} location={location} theme={theme} setOrchardLocation={setOrchardLocation} setWeatherState={setWeatherState} />;
      case 'analytics':
        return <AnalyticsPage state={state} logs={logs} theme={theme} />;
      case 'logs':
        return <LogsPage logs={logs} theme={theme} />;
      case 'settings':
        return <SettingsPage state={state} location={location} theme={theme} setOrchardLocation={setOrchardLocation} setMaxRuntimeMinutes={setMaxRuntimeMinutes} setMoistureThreshold={setMoistureThreshold} />;
      case 'advisor':
        return <AdvisorPage theme={theme} isDark={isDark} />;
      case 'overview':
      default:
        return <OverviewPage state={state} deviceConnected={deviceConnected} lastCommunication={lastCommunication} logs={logs} theme={theme} setAutoMode={setAutoMode} setSeasonalAuto={setSeasonalAuto} setPage={(p) => setActivePage(p as TabPage)} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.pageBg }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: theme.primary, borderTopColor: 'transparent' }}></div>
          <span className="text-sm font-medium" style={{ color: theme.subText }}>Syncing AgroFlow...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: theme.pageBg }}>

      {/* ── SIDEBAR ─────────────────────────────────── */}
      <>
        {/* Mobile overlay */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        <aside
          className={`
            fixed md:static inset-y-0 left-0 z-30
            flex flex-col w-60 shrink-0 h-screen
            transition-transform duration-300 ease-in-out
            ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          `}
          style={{ backgroundColor: theme.sidebarBg }}
        >
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-6 shrink-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: theme.primary }}>
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-wide" style={{ color: theme.sidebarText }}>AgroFlow</span>
              <span className="block text-[10px] font-medium" style={{ color: theme.sidebarSubText }}>Orchard System</span>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto py-2">
            {navItems.map(({ id, name, icon: Icon }) => {
              const isActive = activePage === id;
              return (
                <button
                  key={id}
                  onClick={() => { setActivePage(id as TabPage); setMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 text-left"
                  style={{
                    backgroundColor: isActive ? theme.sidebarActiveBg : 'transparent',
                    color: isActive ? theme.sidebarActive : theme.sidebarSubText,
                  }}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{name}</span>
                  {/* Pump running dot */}
                  {id === 'pump' && state.relay === 1 && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Sidebar footer */}
          <div className="px-3 py-4 shrink-0 border-t" style={{ borderColor: '#2a3a2d' }}>
            <div className="flex items-center gap-3 px-3 py-2 mb-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ backgroundColor: theme.primary }}>
                M
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate" style={{ color: theme.sidebarText }}>mudasir</p>
                <p className="text-[10px]" style={{ color: theme.sidebarSubText }}>Orchard Owner</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all hover:bg-white/5"
              style={{ color: theme.sidebarSubText }}
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </aside>
      </>

      {/* ── MAIN AREA ───────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <header
          className="shrink-0 flex items-center justify-between px-6 py-4 border-b"
          style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
        >
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 rounded-lg md:hidden"
              style={{ color: theme.subText }}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base font-semibold" style={{ color: theme.text }}>
                {activeNav?.name ?? 'Dashboard'}
              </h1>
              <p className="text-xs" style={{ color: theme.subText }}>AgroFlow Irrigation System</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* DB status */}
            <div
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
              style={{
                backgroundColor: firebaseConnected ? '#eaf7f0' : '#fef2f2',
                color: firebaseConnected ? '#2e7d52' : '#c0392b',
              }}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${firebaseConnected ? 'bg-emerald-500' : 'bg-red-500'}`} />
              {firebaseConnected ? 'Database Online' : 'Database Offline'}
            </div>

            {/* ESP status */}
            <div
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
              style={{
                backgroundColor: deviceConnected ? '#eaf7f0' : '#fef2f2',
                color: deviceConnected ? '#2e7d52' : '#c0392b',
              }}
            >
              {deviceConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              ESP {deviceConnected ? 'Online' : 'Offline'}
            </div>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="w-8 h-8 rounded-lg flex items-center justify-center border transition-colors"
              style={{ borderColor: theme.cardBorder, backgroundColor: theme.inputBg, color: theme.subText }}
              title={isDark ? 'Light mode' : 'Dark mode'}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto animate-fadeIn">
            {renderPage()}
          </div>
        </main>
      </div>
    </div>
  );
}
