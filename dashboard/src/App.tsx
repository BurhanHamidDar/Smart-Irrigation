import React, { useState, useEffect } from 'react';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';

export interface AppTheme {
  overlayBg: string;
  cardBg: string;
  text: string;
  subText: string;
  border: string;
  primary: string;
  danger: string;
  inputBg: string;
}

export const lightTheme: AppTheme = {
  overlayBg: 'rgba(240, 253, 244, 0.85)',
  cardBg: 'rgba(255, 255, 255, 0.95)',
  text: '#14532d',
  subText: '#166534',
  border: '#bbf7d0',
  primary: '#dc2626',
  danger: '#ef4444',
  inputBg: '#f0fdf4',
};

export const darkTheme: AppTheme = {
  overlayBg: 'rgba(2, 44, 34, 0.85)',
  cardBg: 'rgba(2, 44, 34, 0.95)',
  text: '#f0fdf4',
  subText: '#a7f3d0',
  border: '#065f46',
  primary: '#ef4444',
  danger: '#ef4444',
  inputBg: '#064e3b',
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  
  // Theme state: initialized from localStorage or system preference
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Authenticate & retrieve active session from LocalStorage
  useEffect(() => {
    const session = localStorage.getItem('isLoggedIn');
    if (session === 'true') {
      setIsLoggedIn(true);
    }
    setCheckingSession(false);
  }, []);

  // Request browser permission for system push notifications
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          console.log("Browser push notification access approved by officer.");
        }
      });
    }
  }, []);

  // Sync theme changes to localStorage
  useEffect(() => {
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const theme = isDark ? darkTheme : lightTheme;

  if (checkingSession) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center transition-colors duration-300"
        style={{ backgroundColor: theme.cardBg }}
      >
        <div className="w-10 h-10 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
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
