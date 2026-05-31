import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Loader2, Check } from 'lucide-react';
import { AppTheme } from '../App';
import { SystemState, LocationSettings, WeatherData } from '../hooks/useFirebaseSync';
import WeatherCard from '../components/WeatherCard';

interface WeatherPageProps {
  state: SystemState;
  location: LocationSettings | null;
  theme: AppTheme;
  setOrchardLocation: (lat: number, lon: number) => void;
  setWeatherState: (weather: WeatherData) => void;
}

export default function WeatherPage({
  state,
  location,
  theme,
  setOrchardLocation,
  setWeatherState
}: WeatherPageProps) {
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const [locating, setLocating] = useState(false);
  const [locationSuccess, setLocationSuccess] = useState(false);

  // Sync state coordinates to inputs
  useEffect(() => {
    if (location) {
      setLat(location.latitude.toString());
      setLon(location.longitude.toString());
    }
  }, [location]);

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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
      
      {/* COLUMN 1: LIVE WEATHER DISPLAY */}
      <div className="lg:col-span-2">
        <WeatherCard 
          location={location}
          weather={state.weather}
          autoMode={state.auto}
          setWeatherState={setWeatherState}
          theme={theme}
        />
      </div>

      {/* COLUMN 2: LOCATION COORDINATES SYSTEM CONFIG */}
      <div 
        className="lg:col-span-1 border rounded-2xl p-6 shadow-xl flex flex-col justify-between transition-all duration-300"
        style={{ 
          backgroundColor: theme.cardBg, 
          borderColor: theme.border,
          color: theme.text 
        }}
      >
        <div>
          <div 
            className="flex items-center gap-3 mb-5 pb-2 border-b"
            style={{ borderBottomColor: theme.border }}
          >
            <MapPin className="w-5 h-5 shrink-0" style={{ color: theme.primary }} />
            <div>
              <h3 className="text-xs font-black tracking-wider uppercase">
                Location Settings (GPS)
              </h3>
              <p className="text-[10px] mt-0.5 font-semibold" style={{ color: theme.subText }}>
                Configures coordinates for hourly rain overlays
              </p>
            </div>
          </div>

          <div className="space-y-4">
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

            <div className="flex gap-2 pt-2">
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
        </div>

        <div className="h-6 flex justify-end items-center mt-6">
          {locationSuccess && (
            <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Coordinates Synced
            </span>
          )}
        </div>
      </div>

    </div>
  );
}
