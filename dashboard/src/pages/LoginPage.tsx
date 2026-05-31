import React, { useState, useEffect } from 'react';
import { ref, get, set } from 'firebase/database';
import { database } from '../config/firebase';
import { Lock, User, Eye, EyeOff, ShieldAlert, Sun, Moon } from 'lucide-react';
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

  // Clear errors when typing
  useEffect(() => {
    setErrorMsg('');
  }, [username, password]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanUsername || !cleanPassword) {
      setErrorMsg('Please enter both username and password.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const credsRef = ref(database, 'credentials');
      const snapshot = await get(credsRef);

      if (!snapshot.exists()) {
        // First-time setup: push default credentials if matches mudasir/mudasir@123
        if (cleanUsername === 'mudasir' && cleanPassword === 'mudasir@123') {
          await set(credsRef, { username: cleanUsername, password: cleanPassword });
          localStorage.setItem('isLoggedIn', 'true');
          onLoginSuccess();
        } else {
          setErrorMsg('No credentials found in database. To perform first-time setup, use default credentials.');
        }
      } else {
        const data = snapshot.val();
        if (data.username === cleanUsername && data.password === cleanPassword) {
          localStorage.setItem('isLoggedIn', 'true');
          onLoginSuccess();
        } else {
          setErrorMsg('Authentication failed. Incorrect username or password.');
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Network error. Failed to connect to Firebase database.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat relative p-4 transition-all duration-300"
      style={{ backgroundImage: `url('/orchard_bg.png')` }}
    >
      {/* Dynamic blurred overlay tint matching overlayBg */}
      <div 
        className="absolute inset-0 backdrop-blur-[4px] transition-all duration-300"
        style={{ backgroundColor: theme.overlayBg }}
      ></div>

      {/* Floating Theme Switcher */}
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 z-20 p-2.5 rounded-xl border backdrop-blur-md transition-all duration-200"
        style={{ 
          backgroundColor: theme.cardBg, 
          borderColor: theme.border, 
          color: theme.text 
        }}
        title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      >
        {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

      <div className="relative z-10 w-full max-w-md">
        <div 
          className="rounded-2xl overflow-hidden p-8 md:p-10 shadow-2xl border transition-all duration-300"
          style={{ 
            backgroundColor: theme.cardBg, 
            borderColor: theme.border 
          }}
        >
          <div className="flex flex-col items-center mb-8">
            <img 
              src="/logo.png" 
              alt="AgroFlow Logo" 
              className="w-[72px] h-[72px] rounded-2xl shadow-lg object-cover mb-4 border-2"
              style={{ borderColor: theme.primary }}
            />
            <h1 
              className="text-2xl font-black tracking-widest uppercase mt-2"
              style={{ color: theme.text }}
            >
              AGROFLOW
            </h1>
            <p 
              className="text-xs font-bold tracking-widest uppercase mt-1"
              style={{ color: theme.subText }}
            >
              Apple Orchard System
            </p>
            <span 
              className="text-[10px] tracking-wider font-semibold mt-1 opacity-80"
              style={{ color: theme.subText }}
            >
              Developed by Burhan Hamid
            </span>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {errorMsg && (
              <div className="flex items-start gap-2 bg-red-950/20 border border-red-500/30 text-red-200 text-sm p-3 rounded-lg animate-pulse">
                <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label 
                className="block text-xs font-bold uppercase tracking-widest mb-2"
                style={{ color: theme.subText }}
              >
                Operator Username
              </label>
              <div className="relative">
                <User 
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none" 
                  style={{ color: theme.subText }}
                />
                <input 
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  className="w-full h-12 pl-12 pr-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all font-semibold"
                  style={{ 
                    backgroundColor: theme.inputBg, 
                    borderColor: theme.border, 
                    color: theme.text 
                  }}
                />
              </div>
            </div>

            <div>
              <label 
                className="block text-xs font-bold uppercase tracking-widest mb-2"
                style={{ color: theme.subText }}
              >
                Security Password
              </label>
              <div className="relative">
                <Lock 
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none" 
                  style={{ color: theme.subText }}
                />
                <input 
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full h-12 pl-12 pr-12 rounded-xl border focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all font-semibold"
                  style={{ 
                    backgroundColor: theme.inputBg, 
                    borderColor: theme.border, 
                    color: theme.text 
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 focus:outline-none p-1"
                  style={{ color: theme.subText }}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 mt-6 rounded-xl text-white font-black tracking-widest uppercase shadow-lg transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
              style={{ backgroundColor: theme.primary }}
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'SECURE LOGIN'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
