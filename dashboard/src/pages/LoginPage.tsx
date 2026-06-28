import React, { useState, useEffect } from 'react';
import { ref, get, set } from 'firebase/database';
import { database } from '../config/firebase';
import { Lock, User, Eye, EyeOff, Leaf, Sun, Moon } from 'lucide-react';
import { AppTheme } from '../App';

interface LoginPageProps {
  onLoginSuccess: () => void;
  theme: AppTheme;
  isDark: boolean;
  toggleTheme: () => void;
}

export default function LoginPage({ onLoginSuccess, theme, isDark, toggleTheme }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => { setErrorMsg(''); }, [username, password]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = password.trim();
    if (!cleanUsername || !cleanPassword) { setErrorMsg('Please enter both username and password.'); return; }

    setLoading(true);
    setErrorMsg('');
    try {
      const credsRef = ref(database, 'credentials');
      const snapshot = await get(credsRef);
      if (!snapshot.exists()) {
        if (cleanUsername === 'mudasir' && cleanPassword === 'mudasir@123') {
          await set(credsRef, { username: cleanUsername, password: cleanPassword });
          localStorage.setItem('isLoggedIn', 'true');
          onLoginSuccess();
        } else {
          setErrorMsg('No credentials found. Use default credentials for first-time setup.');
        }
      } else {
        const data = snapshot.val();
        if (data.username === cleanUsername && data.password === cleanPassword) {
          localStorage.setItem('isLoggedIn', 'true');
          onLoginSuccess();
        } else {
          setErrorMsg('Incorrect username or password.');
        }
      }
    } catch (err) {
      setErrorMsg('Network error. Could not connect to the database.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: theme.pageBg }}>
      {/* Left panel — decorative */}
      <div
        className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 p-10"
        style={{ backgroundColor: theme.sidebarBg }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: theme.primary }}>
            <Leaf className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-bold" style={{ color: theme.sidebarText }}>AgroFlow</span>
        </div>

        <div>
          <h2 className="text-3xl font-bold leading-snug mb-4" style={{ color: theme.sidebarText }}>
            Smart Irrigation<br />for Kashmir Orchards
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: theme.sidebarSubText }}>
            Real-time soil monitoring, automated pump control, weather-based irrigation, and AI-powered farming advice — all in one place.
          </p>
        </div>

        <p className="text-xs" style={{ color: theme.sidebarSubText }}>
          Developed by Burhan Hamid · AgroFlow v1.0
        </p>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="absolute top-6 right-6 w-9 h-9 rounded-lg border flex items-center justify-center transition-colors"
          style={{ borderColor: theme.cardBorder, backgroundColor: theme.cardBg, color: theme.subText }}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: theme.primary }}>
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold" style={{ color: theme.text }}>AgroFlow</span>
          </div>

          <h1 className="text-2xl font-bold mb-1" style={{ color: theme.text }}>Welcome back</h1>
          <p className="text-sm mb-8" style={{ color: theme.subText }}>Sign in to your orchard dashboard</p>

          <form onSubmit={handleLogin} className="space-y-4">
            {errorMsg && (
              <div
                className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm"
                style={{ backgroundColor: '#fef2f2', color: '#c0392b', border: '1px solid #fecaca' }}
              >
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: theme.subText }}>Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: theme.subText }} />
                <input
                  type="text"
                  placeholder="Enter username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  disabled={loading}
                  className="w-full h-11 pl-10 pr-4 rounded-lg border text-sm font-medium focus:outline-none transition-colors"
                  style={{ backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: theme.subText }}>Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: theme.subText }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full h-11 pl-10 pr-10 rounded-lg border text-sm font-medium focus:outline-none transition-colors"
                  style={{ backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: theme.subText }}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-lg text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-60"
              style={{ backgroundColor: theme.primary }}
            >
              {loading
                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : 'Sign In'
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
