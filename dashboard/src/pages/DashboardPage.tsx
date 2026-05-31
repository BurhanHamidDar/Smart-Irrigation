import React, { useState } from 'react';
import { 
  LogOut, Sun, Moon, Home, Droplet, Power, Calendar, 
  CloudSun, BarChart3, Bell, Settings, Wifi, WifiOff, Menu, X 
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

interface DashboardPageProps {
  onLogout: () => void;
  theme: AppTheme;
  isDark: boolean;
  toggleTheme: () => void;
}

type TabPage = 'overview' | 'moisture' | 'pump' | 'schedules' | 'weather' | 'analytics' | 'logs' | 'settings';

export default function DashboardPage({ onLogout, theme, isDark, toggleTheme }: DashboardPageProps) {
  const [activePage, setActivePage] = useState<TabPage>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    setWeatherState
  } = useFirebaseSync();

  const handleLogoutClick = () => {
    if (confirm("Terminate Session?\nAre you sure you want to securely log out?")) {
      localStorage.removeItem('isLoggedIn');
      onLogout();
    }
  };

  if (loading) {
    return (
      <div 
        className="min-h-screen flex flex-col items-center justify-center bg-cover bg-center bg-no-repeat relative"
        style={{ backgroundImage: `url('/orchard_bg.png')` }}
      >
        <div 
          className="absolute inset-0 transition-all duration-300"
          style={{ backgroundColor: theme.overlayBg, backdropFilter: 'blur(6px)' }}
        ></div>
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
          <span 
            className="text-sm font-black tracking-widest uppercase mt-4 animate-pulse"
            style={{ color: theme.text }}
          >
            Syncing AgroFlow Core...
          </span>
        </div>
      </div>
    );
  }

  // Render active page module dynamically
  const renderActivePageContent = () => {
    switch (activePage) {
      case 'moisture':
        return (
          <MoisturePage 
            state={state}
            deviceConnected={deviceConnected}
            lastCommunication={lastCommunication}
            theme={theme}
            setMoistureThreshold={setMoistureThreshold}
          />
        );
      case 'pump':
        return (
          <PumpPage 
            state={state}
            logs={logs}
            theme={theme}
            setPumpState={setPumpState}
            resetPumpProtection={resetPumpProtection}
            setMaxRuntimeMinutes={setMaxRuntimeMinutes}
          />
        );
      case 'schedules':
        return (
          <SchedulesPage 
            state={state}
            theme={theme}
            setSchedulesList={setSchedulesList}
          />
        );
      case 'weather':
        return (
          <WeatherPage 
            state={state}
            location={location}
            theme={theme}
            setOrchardLocation={setOrchardLocation}
            setWeatherState={setWeatherState}
          />
        );
      case 'analytics':
        return (
          <AnalyticsPage 
            state={state}
            logs={logs}
            theme={theme}
          />
        );
      case 'logs':
        return (
          <LogsPage 
            logs={logs}
            theme={theme}
          />
        );
      case 'settings':
        return (
          <SettingsPage 
            state={state}
            location={location}
            theme={theme}
            setOrchardLocation={setOrchardLocation}
            setMaxRuntimeMinutes={setMaxRuntimeMinutes}
            setMoistureThreshold={setMoistureThreshold}
          />
        );
      case 'overview':
      default:
        return (
          <OverviewPage 
            state={state}
            deviceConnected={deviceConnected}
            lastCommunication={lastCommunication}
            logs={logs}
            theme={theme}
            setAutoMode={setAutoMode}
            setPage={(p) => setActivePage(p as TabPage)}
          />
        );
    }
  };

  const navItems = [
    { id: 'overview', name: 'Overview', icon: Home },
    { id: 'moisture', name: 'Moisture', icon: Droplet },
    { id: 'pump', name: 'Pump Control', icon: Power, statusDot: state.relay === 1 },
    { id: 'schedules', name: 'Schedules', icon: Calendar },
    { id: 'weather', name: 'Weather', icon: CloudSun },
    { id: 'analytics', name: 'Analytics', icon: BarChart3 },
    { id: 'logs', name: 'Activity Logs', icon: Bell },
    { id: 'settings', name: 'Settings', icon: Settings },
  ] as const;

  const getPageTitle = () => {
    const activeItem = navItems.find(item => item.id === activePage);
    return activeItem ? activeItem.name : 'Dashboard';
  };

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat relative text-white flex flex-col transition-all duration-300 md:flex-row"
      style={{ 
        backgroundImage: `url('/orchard_bg.png')`,
        color: theme.text 
      }}
    >
      {/* Blurred background overlay tint */}
      <div 
        className="fixed inset-0 z-0 backdrop-blur-[5px] transition-all duration-300"
        style={{ backgroundColor: theme.overlayBg }}
      ></div>

      {/* MOBILE HEADER */}
      <header 
        className="relative z-20 w-full border-b-2 px-4 py-3.5 shadow-md flex items-center justify-between md:hidden transition-all duration-300 shrink-0"
        style={{ 
          backgroundColor: theme.cardBg, 
          borderBottomColor: theme.primary 
        }}
      >
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="AgroFlow Icon" className="w-8 h-8 rounded-lg border object-cover" style={{ borderColor: theme.primary }} />
          <h1 className="text-base font-black tracking-widest uppercase">AGROFLOW</h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg border transition-all"
            style={{ backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button 
            onClick={() => setSidebarOpen(prev => !prev)}
            className="p-1.5 rounded-lg border focus:outline-none transition-all"
            style={{ backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }}
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* COLLAPSIBLE SIDEBAR DRAWER (Desktop/Tablet & Mobile Menu Overlay) */}
      <aside 
        className={`fixed md:sticky top-0 left-0 h-full w-64 border-r shrink-0 z-30 flex flex-col justify-between transition-all duration-300 ease-in-out transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } md:translate-x-0`}
        style={{ 
          backgroundColor: theme.cardBg, 
          borderColor: theme.border 
        }}
      >
        <div className="flex flex-col flex-1 min-h-0">
          
          {/* Sidebar branding */}
          <div 
            className="hidden md:flex items-center gap-3 px-6 py-6 border-b"
            style={{ borderBottomColor: theme.border }}
          >
            <img 
              src="/logo.png" 
              alt="AgroFlow Icon" 
              className="w-9 h-9 rounded-xl shadow-md object-cover border"
              style={{ borderColor: theme.primary }}
            />
            <div>
              <h1 className="text-lg font-black tracking-wider uppercase" style={{ color: theme.text }}>
                AGROFLOW
              </h1>
              <span className="text-[9px] tracking-widest font-extrabold uppercase block" style={{ color: theme.subText }}>
                Orchard System
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto select-none">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActivePage(item.id);
                    setSidebarOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold text-xs tracking-wider uppercase transition-all duration-200 border cursor-pointer focus:outline-none"
                  style={{
                    backgroundColor: isActive ? theme.primary : 'transparent',
                    borderColor: isActive ? theme.primary : 'transparent',
                    color: isActive ? '#ffffff' : theme.text
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.name}</span>
                  </div>
                  
                  {/* Status dot indicator (for active pump Control tab) */}
                  {'statusDot' in item && item.statusDot && (
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse border border-white/20"></span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer and Officer status */}
        <div 
          className="p-4 border-t flex flex-col gap-3 shrink-0"
          style={{ borderTopColor: theme.border }}
        >
          {/* Officer clearance profile */}
          <div className="flex items-center gap-2.5 px-2 py-1">
            <div className="w-7 h-7 rounded-full text-xs font-black flex items-center justify-center text-white shrink-0 shadow-md" style={{ backgroundColor: theme.primary }}>
              M
            </div>
            <div className="min-w-0">
              <span className="text-xs font-black uppercase tracking-wider block truncate" style={{ color: theme.text }}>
                mudasir
              </span>
              <span className="text-[9px] font-bold uppercase tracking-widest opacity-80 block truncate" style={{ color: theme.subText }}>
                Administrator
              </span>
            </div>
          </div>

          <button
            onClick={handleLogoutClick}
            className="w-full h-10 rounded-xl font-black text-xs tracking-widest uppercase flex items-center justify-center gap-2 text-white border hover:opacity-90 transition-all shrink-0 cursor-pointer"
            style={{ 
              backgroundColor: theme.primary, 
              borderColor: theme.primary 
            }}
          >
            <LogOut className="w-4 h-4" /> LOGOUT
          </button>
        </div>
      </aside>

      {/* MOBILE OVERLAY SHADOW BACKGROUND */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-20 md:hidden"
        ></div>
      )}

      {/* MAIN VIEWPORT BODY CONTAINER */}
      <div className="relative z-10 flex-1 flex flex-col min-w-0 overflow-y-auto h-full">
        
        {/* GLOBAL HEADER (Desktop only) */}
        <header 
          className="hidden md:flex items-center justify-between px-8 py-5 border-b shadow-md transition-all duration-300 shrink-0 select-none"
          style={{ 
            backgroundColor: theme.cardBg, 
            borderBottomColor: theme.border 
          }}
        >
          {/* Page title indicator */}
          <h2 className="text-base font-black tracking-widest uppercase" style={{ color: theme.text }}>
            {getPageTitle()}
          </h2>

          <div className="flex items-center gap-4">
            {/* Database Connection */}
            <div 
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border text-[10px] tracking-wider uppercase font-black transition-all ${
                firebaseConnected ? 'text-emerald-400' : 'text-red-400 animate-pulse'
              }`}
              style={{ backgroundColor: theme.inputBg, borderColor: theme.border }}
            >
              <span className={`w-2 h-2 rounded-full ${firebaseConnected ? 'bg-emerald-400' : 'bg-red-500'}`}></span>
              DB: {firebaseConnected ? 'Online' : 'Offline'}
            </div>

            {/* ESP Device Connection */}
            <div 
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border text-[10px] tracking-wider uppercase font-black transition-all ${
                deviceConnected ? 'text-emerald-400' : 'text-red-400 animate-pulse'
              }`}
              style={{ backgroundColor: theme.inputBg, borderColor: theme.border }}
            >
              {deviceConnected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              ESP: {deviceConnected ? 'Connected' : 'Disconnected'}
            </div>

            {/* Light/Dark Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border transition-all duration-200 shadow-md shrink-0 cursor-pointer"
              style={{ 
                backgroundColor: theme.inputBg, 
                borderColor: theme.border, 
                color: theme.text 
              }}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* PRIMARY MAIN VIEWPANE PAGE */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8 overflow-y-auto">
          {renderActivePageContent()}
        </main>

        {/* BOTTOM FIXED TABS BAR (Mobile only) */}
        <nav 
          className="sticky bottom-0 left-0 w-full border-t flex items-center justify-around md:hidden py-2 px-1 z-25 shrink-0 shadow-2xl transition-all duration-300"
          style={{ 
            backgroundColor: theme.cardBg, 
            borderColor: theme.border 
          }}
        >
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className="flex flex-col items-center justify-center gap-1 focus:outline-none p-1.5"
                style={{ color: isActive ? theme.primary : theme.subText }}
              >
                <div className="relative">
                  <Icon className="w-5 h-5 shrink-0" />
                  {'statusDot' in item && item.statusDot && (
                    <span className="absolute -top-1.5 -right-1.5 w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  )}
                </div>
                <span className="text-[8px] font-black uppercase tracking-wider scale-90">{item.name.split(' ')[0]}</span>
              </button>
            );
          })}
          
          {/* More menu drawer trigger */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex flex-col items-center justify-center gap-1 focus:outline-none p-1.5"
            style={{ color: theme.subText }}
          >
            <Menu className="w-5 h-5 shrink-0" />
            <span className="text-[8px] font-black uppercase tracking-wider scale-90">More</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
