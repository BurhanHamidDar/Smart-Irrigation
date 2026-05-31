import React, { useState, useEffect } from 'react';
import { Settings2, MapPin, Navigation, Timer, Shield, Key, Loader2, Check } from 'lucide-react';
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
      className="rounded-2xl p-6 border shadow-xl flex flex-col relative overflow-hidden transition-all duration-300 lg:col-span-2"
      style={{ 
        backgroundColor: theme.cardBg, 
        borderColor: theme.border,
        color: theme.text 
      }}
    >
      <div 
        className="w-full flex items-center justify-between mb-6 pb-3 border-b transition-all duration-300"
        style={{ borderBottomColor: theme.border }}
      >
        <div className="flex items-center gap-2">
          <Settings2 className="w-5 h-5" style={{ color: theme.primary }} />
          <h2 className="text-sm font-bold tracking-widest uppercase">System settings</h2>
        </div>
        <span className="text-[10px] font-black tracking-widest uppercase" style={{ color: theme.subText }}>
          Control Panel
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* ROW 1: MOISTURE THRESHOLD CONTROLLER */}
        <div 
          className="border rounded-xl p-4 flex flex-col justify-between transition-all"
          style={{ backgroundColor: theme.inputBg + '40', borderColor: theme.border }}
        >
          <div 
            className="flex items-center gap-3 mb-4 pb-2 border-b transition-all"
            style={{ borderBottomColor: theme.border }}
          >
            <Settings2 className="w-5 h-5 shrink-0" style={{ color: theme.primary }} />
            <div>
              <h3 className="text-xs font-black tracking-wider uppercase" style={{ color: theme.text }}>
                Moisture Threshold Settings
              </h3>
              <p className="text-[10px] mt-0.5 font-semibold" style={{ color: theme.subText }}>
                Auto starts pump when sensor falls below threshold
              </p>
            </div>
          </div>

          <div className="flex-1 py-2">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold" style={{ color: theme.subText }}>Moisture Limit (ADC)</span>
              <span 
                className="border text-xs font-black px-2.5 py-0.5 rounded transition-all"
                style={{ 
                  backgroundColor: theme.inputBg, 
                  borderColor: theme.border, 
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
              className="w-full h-2 bg-emerald-950 rounded-lg appearance-none cursor-pointer accent-red-500"
              style={{ accentColor: theme.primary }}
            />
            <div className="flex justify-between text-[9px] font-black mt-1 uppercase" style={{ color: theme.subText }}>
              <span>Critical (300)</span>
              <span>Damp (600)</span>
              <span>Saturated (900)</span>
            </div>
          </div>

          <div className="h-6 flex justify-end items-center mt-3">
            {thresholdSuccess && (
              <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Threshold Updated
              </span>
            )}
          </div>
        </div>

        {/* ROW 2: PUMP MOTOR PROTECTION CONTROLLER */}
        <div 
          className="border rounded-xl p-4 flex flex-col justify-between transition-all"
          style={{ backgroundColor: theme.inputBg + '40', borderColor: theme.border }}
        >
          <div 
            className="flex items-center gap-3 mb-4 pb-2 border-b transition-all"
            style={{ borderBottomColor: theme.border }}
          >
            <Timer className="w-5 h-5 shrink-0" style={{ color: theme.primary }} />
            <div>
              <h3 className="text-xs font-black tracking-wider uppercase" style={{ color: theme.text }}>
                Motor Overrun Protection
              </h3>
              <p className="text-[10px] mt-0.5 font-semibold" style={{ color: theme.subText }}>
                Maximum allowed irrigation duration before auto-trip
              </p>
            </div>
          </div>

          <div className="flex-1 py-1">
            <label className="block text-[10px] font-black uppercase mb-2" style={{ color: theme.subText }}>
              Continuous Limit (Minutes)
            </label>
            <div className="flex gap-2">
              <input 
                type="number"
                value={runtime}
                onChange={(e) => setRuntime(e.target.value)}
                min="1"
                max="120"
                className="flex-1 h-10 px-3 rounded-lg focus:outline-none text-sm font-bold border"
                style={{ 
                  backgroundColor: theme.inputBg, 
                  borderColor: theme.border, 
                  color: theme.text 
                }}
              />
              <button
                onClick={handleSaveRuntime}
                className="h-10 px-4 rounded-lg text-white font-extrabold text-xs tracking-wider uppercase border transition-all"
                style={{ 
                  backgroundColor: theme.primary, 
                  borderColor: theme.primary 
                }}
              >
                SAVE
              </button>
            </div>
          </div>

          <div className="h-6 flex justify-end items-center mt-3">
            {runtimeSuccess && (
              <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Protection Updated
              </span>
            )}
          </div>
        </div>

        {/* ROW 3: ORCHARD GEOLOCATION SETTINGS */}
        <div 
          className="border rounded-xl p-4 flex flex-col justify-between transition-all"
          style={{ backgroundColor: theme.inputBg + '40', borderColor: theme.border }}
        >
          <div 
            className="flex items-center gap-3 mb-4 pb-2 border-b transition-all"
            style={{ borderBottomColor: theme.border }}
          >
            <MapPin className="w-5 h-5 shrink-0" style={{ color: theme.primary }} />
            <div>
              <h3 className="text-xs font-black tracking-wider uppercase" style={{ color: theme.text }}>
                Orchard Coordinates (GPS)
              </h3>
              <p className="text-[10px] mt-0.5 font-semibold" style={{ color: theme.subText }}>
                Coordinates are queried hourly for Open-Meteo rain reports
              </p>
            </div>
          </div>

          <div className="flex-1 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[9px] font-black uppercase mb-1" style={{ color: theme.subText }}>Latitude</label>
                <input 
                  type="text"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  placeholder="e.g. 34.0837"
                  className="w-full h-10 px-3 rounded-lg focus:outline-none text-xs font-semibold border"
                  style={{ 
                    backgroundColor: theme.inputBg, 
                    borderColor: theme.border, 
                    color: theme.text 
                  }}
                />
              </div>
              <div>
                <label className="block text-[9px] font-black uppercase mb-1" style={{ color: theme.subText }}>Longitude</label>
                <input 
                  type="text"
                  value={lon}
                  onChange={(e) => setLon(e.target.value)}
                  placeholder="e.g. 74.7973"
                  className="w-full h-10 px-3 rounded-lg focus:outline-none text-xs font-semibold border"
                  style={{ 
                    backgroundColor: theme.inputBg, 
                    borderColor: theme.border, 
                    color: theme.text 
                  }}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSaveLocation}
                className="flex-1 h-10 rounded-lg text-white font-extrabold text-xs tracking-wider uppercase border transition-all"
                style={{ 
                  backgroundColor: theme.primary, 
                  borderColor: theme.primary 
                }}
              >
                SAVE LOCATION
              </button>
              
              <button
                onClick={handleGetCurrentLocation}
                disabled={locating}
                className="h-10 px-3.5 rounded-lg border font-extrabold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 shrink-0"
                style={{ 
                  backgroundColor: theme.inputBg, 
                  borderColor: theme.border, 
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
              <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Coordinates Synced
              </span>
            )}
          </div>
        </div>

        {/* ROW 4: ADMIN PASSWORD UPDATE */}
        <div 
          className="border rounded-xl p-4 flex flex-col justify-between transition-all"
          style={{ backgroundColor: theme.inputBg + '40', borderColor: theme.border }}
        >
          <div 
            className="flex items-center gap-3 mb-4 pb-2 border-b transition-all"
            style={{ borderBottomColor: theme.border }}
          >
            <Key className="w-5 h-5 shrink-0" style={{ color: theme.primary }} />
            <div>
              <h3 className="text-xs font-black tracking-wider uppercase" style={{ color: theme.text }}>
                Update Officer Password
              </h3>
              <p className="text-[10px] mt-0.5 font-semibold" style={{ color: theme.subText }}>
                Modifies the password for the active "mudasir" officer
              </p>
            </div>
          </div>

          <form onSubmit={handleUpdatePassword} className="flex-1 space-y-3">
            <div>
              <label className="block text-[9px] font-black uppercase mb-1" style={{ color: theme.subText }}>New Security Password</label>
              <div className="flex gap-2">
                <input 
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="flex-1 h-10 px-3 rounded-lg focus:outline-none text-xs font-semibold border"
                  style={{ 
                    backgroundColor: theme.inputBg, 
                    borderColor: theme.border, 
                    color: theme.text 
                  }}
                />
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="h-10 px-4 rounded-lg text-white font-extrabold text-xs tracking-wider uppercase border transition-all shrink-0"
                  style={{ 
                    backgroundColor: theme.primary, 
                    borderColor: theme.primary 
                  }}
                >
                  {passwordLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'UPDATE'}
                </button>
              </div>
            </div>
          </form>

          <div className="h-6 flex justify-end items-center mt-3">
            {passwordSuccess && (
              <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Password Saved
              </span>
            )}
          </div>
        </div>

      </div>

      {/* SYSTEM META CAROUSEL & CREDITS */}
      <div 
        className="border-t mt-6 pt-5 grid grid-cols-2 md:grid-cols-4 gap-4 tracking-wider text-[10px] font-bold transition-all duration-300"
        style={{ borderTopColor: theme.border, color: theme.subText }}
      >
        <div className="flex flex-col">
          <span className="uppercase font-black">Authorized Officer</span>
          <span className="font-extrabold text-xs mt-1" style={{ color: theme.text }}>mudasir</span>
        </div>
        <div className="flex flex-col">
          <span className="uppercase font-black">Clearance Class</span>
          <span className="font-extrabold text-xs mt-1 flex items-center gap-1" style={{ color: theme.text }}>
            <Shield className="w-3.5 h-3.5 shrink-0 animate-pulse text-emerald-500" /> Administrator
          </span>
        </div>
        <div className="flex flex-col">
          <span className="uppercase font-black">System Version</span>
          <span className="font-extrabold text-xs mt-1" style={{ color: theme.text }}>AgroFlow v1.0</span>
        </div>
        <div className="flex flex-col">
          <span className="uppercase font-black">Lead Engineer</span>
          <span className="font-extrabold text-xs mt-1" style={{ color: theme.text }}>Burhan Hamid</span>
        </div>
      </div>
    </div>
  );
}
