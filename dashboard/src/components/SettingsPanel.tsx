import React, { useState, useEffect } from 'react';
import { Settings2, MapPin, Navigation, Timer, Shield, Key, Loader2, Check, Bot } from 'lucide-react';
import { ref, set } from 'firebase/database';
import { database } from '../config/firebase';
import { LocationSettings } from '../hooks/useFirebaseSync';
import { AppTheme } from '../App';

interface SettingsPanelProps {
  location: LocationSettings | null;
  maxRuntimeMinutes: number;
  currentThreshold: number;
  setOrchardLocation: (lat: number, lon: number) => void;
  setMaxRuntimeMinutes: (min: number) => void;
  setMoistureThreshold: (threshold: number) => void;
  theme: AppTheme;
}

export default function SettingsPanel({
  location,
  maxRuntimeMinutes,
  currentThreshold,
  setOrchardLocation,
  setMaxRuntimeMinutes,
  setMoistureThreshold,
  theme
}: SettingsPanelProps) {
  // Geolocation states
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const [locating, setLocating] = useState(false);
  const [locationSuccess, setLocationSuccess] = useState(false);

  // Runtime states
  const [runtime, setRuntime] = useState('20');
  const [runtimeSuccess, setRuntimeSuccess] = useState(false);

  // Threshold states
  const [threshold, setThreshold] = useState(600);
  const [thresholdSuccess, setThresholdSuccess] = useState(false);

  // Password update states
  const [newPassword, setNewPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // AI API Key states
  const [aiApiKey, setAiApiKey] = useState('');
  const [aiKeySuccess, setAiKeySuccess] = useState(false);

  useEffect(() => {
    const savedKey = localStorage.getItem('openRouterApiKey');
    setAiApiKey(savedKey || '');
  }, []);

  const handleSaveAiKey = () => {
    const trimmed = aiApiKey.trim();
    if (!trimmed.startsWith('sk-or-')) {
      alert('Invalid Key: OpenRouter API keys must start with "sk-or-".');
      return;
    }
    localStorage.setItem('openRouterApiKey', trimmed);
    setAiKeySuccess(true);
    setTimeout(() => setAiKeySuccess(false), 3000);
  };

  // Load baseline fields on mount or sync changes
  useEffect(() => {
    if (location) {
      setLat(location.latitude.toString());
      setLon(location.longitude.toString());
    }
  }, [location]);

  useEffect(() => {
    setRuntime(maxRuntimeMinutes.toString());
  }, [maxRuntimeMinutes]);

  useEffect(() => {
    setThreshold(currentThreshold);
  }, [currentThreshold]);

  const handleSaveLocation = () => {
    const l1 = parseFloat(lat);
    const l2 = parseFloat(lon);
    if (isNaN(l1) || isNaN(l2)) {
      alert("Invalid Coordinates!\nPlease enter valid decimal coordinate numbers.");
      return;
    }
    setOrchardLocation(l1, l2);
    setLocationSuccess(true);
    setTimeout(() => setLocationSuccess(false), 3000);
  };

  const handleGetCurrentLocation = () => {
    if (!('geolocation' in navigator)) {
      alert("Error: Geolocation is not supported by your browser.");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latitude = pos.coords.latitude;
        const longitude = pos.coords.longitude;
        setLat(latitude.toString());
        setLon(longitude.toString());
        setOrchardLocation(latitude, longitude);
        setLocating(false);
        setLocationSuccess(true);
        setTimeout(() => setLocationSuccess(false), 3000);
      },
      (err) => {
        console.error("GPS Fetch error: ", err);
        alert("GPS Fetch Error: Could not retrieve coordinates. Check site location permissions.");
        setLocating(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleSaveRuntime = () => {
    const r = parseInt(runtime, 10);
    if (isNaN(r) || r < 1 || r > 120) {
      alert("Invalid Limit!\nEnter a continuous runtime limit between 1 and 120 minutes.");
      return;
    }
    setMaxRuntimeMinutes(r);
    setRuntimeSuccess(true);
    setTimeout(() => setRuntimeSuccess(false), 3000);
  };

  const handleSaveThreshold = (val: number) => {
    setThreshold(val);
    setMoistureThreshold(val);
    setThresholdSuccess(true);
    setTimeout(() => setThresholdSuccess(false), 3000);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim()) {
      alert("Invalid Input: Password cannot be blank.");
      return;
    }

    setPasswordLoading(true);
    try {
      await set(ref(database, 'credentials/password'), newPassword.trim());
      setPasswordSuccess(true);
      setNewPassword('');
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (e) {
      alert("Failed to update credentials password.");
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div 
      className="rounded-xl p-6 border flex flex-col relative overflow-hidden lg:col-span-2"
      style={{ 
        backgroundColor: theme.cardBg, 
        borderColor: theme.cardBorder,
        boxShadow: theme.cardShadow,
        color: theme.text 
      }}
    >
      <div 
        className="w-full flex items-center justify-between mb-6 pb-3 border-b"
        style={{ borderBottomColor: theme.cardBorder }}
      >
        <div className="flex items-center gap-2">
          <Settings2 className="w-5 h-5" style={{ color: theme.primary }} />
          <h2 className="text-sm font-semibold">System Settings</h2>
        </div>
        <span className="text-xs font-medium" style={{ color: theme.subText }}>
          Control Panel
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* MOISTURE THRESHOLD CONTROLLER */}
        <div 
          className="border rounded-lg p-4 flex flex-col justify-between"
          style={{ backgroundColor: theme.inputBg, borderColor: theme.cardBorder }}
        >
          <div 
            className="flex items-center gap-3 mb-4 pb-2 border-b"
            style={{ borderBottomColor: theme.cardBorder }}
          >
            <Settings2 className="w-5 h-5 shrink-0" style={{ color: theme.primary }} />
            <div>
              <h3 className="text-sm font-semibold" style={{ color: theme.text }}>
                Moisture Threshold
              </h3>
              <p className="text-xs mt-0.5" style={{ color: theme.subText }}>
                Auto starts pump when sensor falls below threshold
              </p>
            </div>
          </div>

          <div className="flex-1 py-2">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-medium" style={{ color: theme.subText }}>Moisture Limit (ADC)</span>
              <span 
                className="border text-xs font-semibold px-2.5 py-0.5 rounded-lg"
                style={{ 
                  backgroundColor: theme.inputBg, 
                  borderColor: theme.cardBorder, 
                  color: theme.primary 
                }}
              >
                {threshold}
              </span>
            </div>
            
            <input 
              type="range"
              min="300"
              max="900"
              step="10"
              value={threshold}
              onChange={(e) => handleSaveThreshold(parseInt(e.target.value, 10))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer"
              style={{ accentColor: theme.primary }}
            />
            <div className="flex justify-between text-[10px] font-medium mt-1" style={{ color: theme.subText }}>
              <span>Critical (300)</span>
              <span>Damp (600)</span>
              <span>Saturated (900)</span>
            </div>
          </div>

          <div className="h-6 flex justify-end items-center mt-3">
            {thresholdSuccess && (
              <span className="text-xs font-medium flex items-center gap-1" style={{ color: '#16a34a' }}>
                <Check className="w-3.5 h-3.5" /> Threshold Updated
              </span>
            )}
          </div>
        </div>

        {/* PUMP MOTOR PROTECTION CONTROLLER */}
        <div 
          className="border rounded-lg p-4 flex flex-col justify-between"
          style={{ backgroundColor: theme.inputBg, borderColor: theme.cardBorder }}
        >
          <div 
            className="flex items-center gap-3 mb-4 pb-2 border-b"
            style={{ borderBottomColor: theme.cardBorder }}
          >
            <Timer className="w-5 h-5 shrink-0" style={{ color: theme.primary }} />
            <div>
              <h3 className="text-sm font-semibold" style={{ color: theme.text }}>
                Motor Overrun Protection
              </h3>
              <p className="text-xs mt-0.5" style={{ color: theme.subText }}>
                Maximum allowed irrigation duration before auto-trip
              </p>
            </div>
          </div>

          <div className="flex-1 py-1">
            <label className="block text-xs font-medium mb-2" style={{ color: theme.subText }}>
              Continuous limit (minutes)
            </label>
            <div className="flex gap-2">
              <input 
                type="number"
                value={runtime}
                onChange={(e) => setRuntime(e.target.value)}
                min="1"
                max="120"
                className="flex-1 h-10 px-3 rounded-lg focus:outline-none text-sm font-medium border"
                style={{ 
                  backgroundColor: theme.inputBg, 
                  borderColor: theme.inputBorder, 
                  color: theme.text 
                }}
              />
              <button
                onClick={handleSaveRuntime}
                className="h-10 px-4 rounded-lg text-white text-sm font-medium transition-colors"
                style={{ 
                  backgroundColor: theme.primary 
                }}
              >
                Save
              </button>
            </div>
          </div>

          <div className="h-6 flex justify-end items-center mt-3">
            {runtimeSuccess && (
              <span className="text-xs font-medium flex items-center gap-1" style={{ color: '#16a34a' }}>
                <Check className="w-3.5 h-3.5" /> Protection Updated
              </span>
            )}
          </div>
        </div>

        {/* ORCHARD GEOLOCATION SETTINGS */}
        <div 
          className="border rounded-lg p-4 flex flex-col justify-between"
          style={{ backgroundColor: theme.inputBg, borderColor: theme.cardBorder }}
        >
          <div 
            className="flex items-center gap-3 mb-4 pb-2 border-b"
            style={{ borderBottomColor: theme.cardBorder }}
          >
            <MapPin className="w-5 h-5 shrink-0" style={{ color: theme.primary }} />
            <div>
              <h3 className="text-sm font-semibold" style={{ color: theme.text }}>
                Orchard Coordinates (GPS)
              </h3>
              <p className="text-xs mt-0.5" style={{ color: theme.subText }}>
                Coordinates are queried hourly for Open-Meteo rain reports
              </p>
            </div>
          </div>

          <div className="flex-1 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: theme.subText }}>Latitude</label>
                <input 
                  type="text"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  placeholder="e.g. 34.0837"
                  className="w-full h-10 px-3 rounded-lg focus:outline-none text-sm font-medium border"
                  style={{ 
                    backgroundColor: theme.inputBg, 
                    borderColor: theme.inputBorder, 
                    color: theme.text 
                  }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: theme.subText }}>Longitude</label>
                <input 
                  type="text"
                  value={lon}
                  onChange={(e) => setLon(e.target.value)}
                  placeholder="e.g. 74.7973"
                  className="w-full h-10 px-3 rounded-lg focus:outline-none text-sm font-medium border"
                  style={{ 
                    backgroundColor: theme.inputBg, 
                    borderColor: theme.inputBorder, 
                    color: theme.text 
                  }}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSaveLocation}
                className="flex-1 h-10 rounded-lg text-white text-sm font-medium transition-colors"
                style={{ 
                  backgroundColor: theme.primary 
                }}
              >
                Save Location
              </button>
              
              <button
                onClick={handleGetCurrentLocation}
                disabled={locating}
                className="h-10 px-3.5 rounded-lg border text-sm font-medium transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 shrink-0"
                style={{ 
                  backgroundColor: theme.inputBg, 
                  borderColor: theme.cardBorder, 
                  color: theme.text 
                }}
                title="Fetch Browser Geolocation"
              >
                {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                GPS
              </button>
            </div>
          </div>

          <div className="h-6 flex justify-end items-center mt-3">
            {locationSuccess && (
              <span className="text-xs font-medium flex items-center gap-1" style={{ color: '#16a34a' }}>
                <Check className="w-3.5 h-3.5" /> Coordinates Synced
              </span>
            )}
          </div>
        </div>

        {/* ADMIN PASSWORD UPDATE */}
        <div 
          className="border rounded-lg p-4 flex flex-col justify-between"
          style={{ backgroundColor: theme.inputBg, borderColor: theme.cardBorder }}
        >
          <div 
            className="flex items-center gap-3 mb-4 pb-2 border-b"
            style={{ borderBottomColor: theme.cardBorder }}
          >
            <Key className="w-5 h-5 shrink-0" style={{ color: theme.primary }} />
            <div>
              <h3 className="text-sm font-semibold" style={{ color: theme.text }}>
                Update Officer Password
              </h3>
              <p className="text-xs mt-0.5" style={{ color: theme.subText }}>
                Modifies the password for the active "mudasir" officer
              </p>
            </div>
          </div>

          <form onSubmit={handleUpdatePassword} className="flex-1 space-y-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: theme.subText }}>New security password</label>
              <div className="flex gap-2">
                <input 
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="flex-1 h-10 px-3 rounded-lg focus:outline-none text-sm font-medium border"
                  style={{ 
                    backgroundColor: theme.inputBg, 
                    borderColor: theme.inputBorder, 
                    color: theme.text 
                  }}
                />
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="h-10 px-4 rounded-lg text-white text-sm font-medium transition-colors shrink-0"
                  style={{ 
                    backgroundColor: theme.primary 
                  }}
                >
                  {passwordLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update'}
                </button>
              </div>
            </div>
          </form>

          <div className="h-6 flex justify-end items-center mt-3">
            {passwordSuccess && (
              <span className="text-xs font-medium flex items-center gap-1" style={{ color: '#16a34a' }}>
                <Check className="w-3.5 h-3.5" /> Password Saved
              </span>
            )}
          </div>
        </div>

        {/* OPENROUTER AI API KEY */}
        <div 
          className="border rounded-lg p-4 flex flex-col justify-between md:col-span-2"
          style={{ backgroundColor: theme.inputBg, borderColor: theme.cardBorder }}
        >
          <div 
            className="flex items-center gap-3 mb-4 pb-2 border-b"
            style={{ borderBottomColor: theme.cardBorder }}
          >
            <Bot className="w-5 h-5 shrink-0" style={{ color: theme.primary }} />
            <div>
              <h3 className="text-sm font-semibold" style={{ color: theme.text }}>
                AgroBot Advisor — OpenRouter API Key
              </h3>
              <p className="text-xs mt-0.5" style={{ color: theme.subText }}>
                Used by the AI farming advisor. Free OpenRouter keys start with sk-or-
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <input 
              type="password"
              value={aiApiKey}
              onChange={(e) => setAiApiKey(e.target.value)}
              placeholder="sk-or-v1-..."
              className="flex-1 h-10 px-3 rounded-lg focus:outline-none text-sm font-medium border"
              style={{ 
                backgroundColor: theme.inputBg, 
                borderColor: theme.inputBorder, 
                color: theme.text 
              }}
            />
            <button
              onClick={handleSaveAiKey}
              className="h-10 px-4 rounded-lg text-white text-sm font-medium transition-colors shrink-0"
              style={{ backgroundColor: theme.primary }}
            >
              Save
            </button>
          </div>

          <div className="h-6 flex justify-end items-center mt-3">
            {aiKeySuccess && (
              <span className="text-xs font-medium flex items-center gap-1" style={{ color: '#16a34a' }}>
                <Check className="w-3.5 h-3.5" /> API Key Saved
              </span>
            )}
          </div>
        </div>

      </div>

      {/* SYSTEM META & CREDITS */}
      <div 
        className="border-t mt-6 pt-5 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs"
        style={{ borderTopColor: theme.cardBorder, color: theme.subText }}
      >
        <div className="flex flex-col">
          <span className="text-[11px] font-medium" style={{ color: theme.subText }}>Orchard Owner</span>
          <span className="font-semibold mt-1" style={{ color: theme.text }}>mudasir</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] font-medium" style={{ color: theme.subText }}>Clearance</span>
          <span className="font-semibold mt-1 flex items-center gap-1" style={{ color: theme.text }}>
            <Shield className="w-3.5 h-3.5 shrink-0" style={{ color: theme.primary }} /> Administrator
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] font-medium" style={{ color: theme.subText }}>System Version</span>
          <span className="font-semibold mt-1" style={{ color: theme.text }}>AgroFlow v1.0</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] font-medium" style={{ color: theme.subText }}>Lead Engineer</span>
          <span className="font-semibold mt-1" style={{ color: theme.text }}>Burhan Hamid</span>
        </div>
      </div>
    </div>
  );
}
