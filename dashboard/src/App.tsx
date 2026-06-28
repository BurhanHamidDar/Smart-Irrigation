import React, { useState, useEffect } from 'react';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';

export interface AppTheme {
  // Page background
  pageBg: string;
  // Sidebar
  sidebarBg: string;
  sidebarText: string;
  sidebarSubText: string;
  sidebarActive: string;
  sidebarActiveBg: string;
  // Cards
  cardBg: string;
  cardBorder: string;
  cardShadow: string;
  // Content
  text: string;
  subText: string;
  inputBg: string;
  inputBorder: string;
  // Accent
  primary: string;
  primaryHover: string;
  primaryLight: string;
  danger: string;
  // Legacy compat
  border: string;
  overlayBg: string;
}

export const lightTheme: AppTheme = {
  pageBg: '#f4f6f0',
  sidebarBg: '#1e2420',
  sidebarText: '#e8ede9',
  sidebarSubText: '#8a9e8d',
  sidebarActive: '#ffffff',
  sidebarActiveBg: '#4a7c59',
  cardBg: '#ffffff',
  cardBorder: '#e8eceb',
  cardShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
  text: '#1a2e1c',
  subText: '#6b7b6e',
  inputBg: '#f4f6f0',
  inputBorder: '#dde3de',
  primary: '#4a7c59',
  primaryHover: '#3d6a4a',
  primaryLight: '#eaf2ec',
  danger: '#c0392b',
  border: '#e8eceb',
  overlayBg: '#f4f6f0',
};

export const darkTheme: AppTheme = {
  pageBg: '#141a15',
  sidebarBg: '#0e1410',
  sidebarText: '#e8ede9',
  sidebarSubText: '#6b7b6e',
  sidebarActive: '#ffffff',
  sidebarActiveBg: '#4a7c59',
  cardBg: '#1e2720',
  cardBorder: '#2a3a2d',
  cardShadow: '0 1px 3px rgba(0,0,0,0.3)',
  text: '#e8ede9',
  subText: '#8a9e8d',
  inputBg: '#162019',
  inputBorder: '#2a3a2d',
  primary: '#5a9469',
  primaryHover: '#4a7c59',
  primaryLight: '#1a2e1c',
  danger: '#e74c3c',
  border: '#2a3a2d',
  overlayBg: '#1e2720',
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const session = localStorage.getItem('isLoggedIn');
    if (session === 'true') setIsLoggedIn(true);
    setCheckingSession(false);
  }, []);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    document.body.style.backgroundColor = isDark ? '#141a15' : '#f4f6f0';
  }, [isDark]);

  const theme = isDark ? darkTheme : lightTheme;

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.pageBg }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: theme.primary, borderTopColor: 'transparent' }}></div>
          <span className="text-sm font-medium" style={{ color: theme.subText }}>Loading AgroFlow...</span>
        </div>
      </div>
    );
  }

  const toggleTheme = () => setIsDark(prev => !prev);

  return (
    <>
      {isLoggedIn ? (
        <DashboardPage 
          onLogout={() => setIsLoggedIn(false)} 
          theme={theme}
          isDark={isDark}
          toggleTheme={toggleTheme}
        />
      ) : (
        <LoginPage 
          onLoginSuccess={() => setIsLoggedIn(true)} 
          theme={theme}
          isDark={isDark}
          toggleTheme={toggleTheme}
        />
      )}
    </>
  );
}
