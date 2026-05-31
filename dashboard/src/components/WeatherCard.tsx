import React, { useEffect, useState } from 'react';
import { CloudRain, CloudSun, Cloud, Sun, Wind, Droplets, Thermometer, MapPin, Loader2, NavigationOff } from 'lucide-react';
import { WeatherData, LocationSettings } from '../hooks/useFirebaseSync';
import { AppTheme } from '../App';

interface WeatherCardProps {
  location: LocationSettings | null;
  weather: WeatherData | undefined;
  autoMode: number;
  setWeatherState: (weather: WeatherData) => void;
  theme: AppTheme;
}

export default function WeatherCard({ location, weather, autoMode, setWeatherState, theme }: WeatherCardProps) {
  const [fetching, setFetching] = useState(false);

  const fetchWeather = async (lat: number, lon: number) => {
    setFetching(true);
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=precipitation_probability%2Ctemperature_2m%2Cweathercode&forecast_hours=12`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
      const json = await res.json();

      const probabilities = json.hourly?.precipitation_probability || [0];
      const maxChance = Math.max(...probabilities);
      const rainPredicted = maxChance > 40; // 40% threshold

      const newWeather: WeatherData = {
        rainPredicted,
        rainChance: maxChance,
        forecastWindowHours: 12,
        currentTemp: json.current_weather?.temperature ?? 0,
        weatherCode: json.current_weather?.weathercode ?? 0,
        latitude: lat,
        longitude: lon
      };

      setWeatherState(newWeather);
    } catch (e) {
      console.error("Error fetching weather in web card:", e);
    } finally {
      setFetching(false);
    }
  };

  // Fetch weather on mount / location update
  useEffect(() => {
    if (location) {
      fetchWeather(location.latitude, location.longitude);
      const interval = setInterval(() => {
        fetchWeather(location.latitude, location.longitude);
      }, 3600000);
      return () => clearInterval(interval);
    }
  }, [location]);

  // WMO Weather interpretation codes
  const getWeatherIcon = (code: number | undefined, size = 32) => {
    if (code === undefined) return <Cloud style={{ color: theme.primary }} size={size} />;
    if (code === 0) return <Sun className="animate-spin text-amber-500" style={{ animationDuration: '30s' }} size={size} />;
    if (code >= 1 && code <= 3) return <CloudSun className="text-blue-400" size={size} />;
    if (code >= 45 && code <= 48) return <Cloud style={{ color: theme.subText }} size={size} />;
    if (code >= 51 && code <= 67) return <CloudRain className="text-blue-400" size={size} />;
    if (code >= 71 && code <= 77) return <Cloud className="text-blue-100" size={size} />; // Snow
    if (code >= 80 && code <= 82) return <CloudRain className="text-blue-400 animate-bounce" size={size} />;
    if (code >= 95 && code <= 99) return <CloudRain style={{ color: theme.primary }} size={size} />; // Thunderstorm
    return <Cloud style={{ color: theme.primary }} size={size} />;
  };

  const getWeatherCondition = (code: number | undefined) => {
    if (code === undefined) return "Loading Conditions";
    if (code === 0) return "Clear sky";
    if (code === 1) return "Mainly clear";
    if (code === 2) return "Partly cloudy";
    if (code === 3) return "Overcast";
    if (code >= 45 && code <= 48) return "Fog";
    if (code >= 51 && code <= 55) return "Drizzle";
    if (code >= 61 && code <= 65) return "Rain";
    if (code >= 80 && code <= 82) return "Rain showers";
    if (code >= 95) return "Thunderstorm";
    return "Cloudy";
  };

  if (!location) {
    return (
      <div 
        className="rounded-2xl p-6 border shadow-xl flex flex-col items-center justify-center text-center relative py-12 transition-all duration-300"
        style={{ 
          backgroundColor: theme.cardBg, 
          borderColor: theme.border,
          color: theme.text 
        }}
      >
        <NavigationOff className="w-12 h-12 mb-3 opacity-60 animate-bounce" style={{ color: theme.primary }} />
        <h2 className="text-sm font-black uppercase">Location Unconfigured</h2>
        <p className="text-xs max-w-xs mt-2 leading-relaxed font-semibold" style={{ color: theme.subText }}>
          Orchard location coordinates (GPS) are not set. Configure coordinates in the system settings pane to load live forecast overrides.
        </p>
      </div>
    );
  }

  const isRainForecast = weather?.rainPredicted;

  return (
    <div 
      className="rounded-2xl p-6 border shadow-xl flex flex-col relative overflow-hidden group transition-all duration-300"
      style={{ 
        backgroundColor: theme.cardBg, 
        borderColor: theme.border,
        color: theme.text 
      }}
    >
      {/* Background weather card glowing border */}
      {isRainForecast && (
        <div 
          className="absolute w-64 h-64 rounded-full blur-3xl -bottom-20 -left-20 opacity-10"
          style={{ backgroundColor: theme.primary }}
        ></div>
      )}

      <div 
        className="w-full flex items-center justify-between mb-4 pb-3 border-b transition-all duration-300"
        style={{ borderBottomColor: theme.border }}
      >
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5" style={{ color: theme.primary }} />
          <h2 className="text-sm font-bold tracking-widest uppercase">Orchard Forecast</h2>
        </div>
        
        {fetching ? (
          <Loader2 className="w-4 h-4 animate-spin" style={{ color: theme.primary }} />
        ) : (
          <span className="text-[9px] font-black tracking-widest uppercase" style={{ color: theme.subText }}>
            {location.latitude.toFixed(4)}N, {location.longitude.toFixed(4)}E
          </span>
        )}
      </div>

      {weather ? (
        <div className="flex flex-col gap-4">
          {/* Main Weather Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {getWeatherIcon(weather.weatherCode, 52)}
              <div>
                <h3 className="text-lg font-black leading-none" style={{ color: theme.text }}>
                  {getWeatherCondition(weather.weatherCode)}
                </h3>
                <span className="text-[10px] tracking-wider font-extrabold uppercase mt-1 block" style={{ color: theme.subText }}>
                  Outlook Conditions
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-3xl font-black">
              <Thermometer className="w-6 h-6 shrink-0" style={{ color: theme.primary }} />
              <span>{Math.round(weather.currentTemp)}°<span className="text-sm font-bold" style={{ color: theme.primary }}>C</span></span>
            </div>
          </div>

          {/* Core Weather grid metrics */}
          <div 
            className="grid grid-cols-2 gap-3 border-t border-b py-4 my-1 transition-all duration-300"
            style={{ 
              borderTopColor: theme.border, 
              borderBottomColor: theme.border 
            }}
          >
            <div 
              className="border rounded-xl p-3 flex flex-col items-center transition-all duration-300"
              style={{ 
                backgroundColor: theme.inputBg, 
                borderColor: theme.border 
              }}
            >
              <CloudRain className="w-5 h-5 text-blue-400 shrink-0" />
              <span className="text-[9px] font-black tracking-widest uppercase mt-2" style={{ color: theme.subText }}>Rain Probability</span>
              <span className="text-base font-black mt-1" style={{ color: theme.text }}>{weather.rainChance}%</span>
            </div>

            <div 
              className="border rounded-xl p-3 flex flex-col items-center transition-all duration-300"
              style={{ 
                backgroundColor: theme.inputBg, 
                borderColor: theme.border 
              }}
            >
              <Wind className="w-5 h-5 text-teal-400 shrink-0" />
              <span className="text-[9px] font-black tracking-widest uppercase mt-2" style={{ color: theme.subText }}>Forecast Window</span>
              <span className="text-base font-black mt-1" style={{ color: theme.text }}>Next {weather.forecastWindowHours} hrs</span>
            </div>
          </div>

          {/* Automatic weather blocks alerts */}
          {isRainForecast ? (
            <div className="bg-red-950/20 border border-red-500/30 text-red-200 text-xs p-3 rounded-lg flex items-start gap-2.5">
              <Droplets className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed font-semibold">
                <span className="font-extrabold text-red-400">Rain Predicted ({weather.rainChance}%).</span> 
                {autoMode === 1 ? ' Auto irrigation rules & timers are suspended to conserve water.' : ' Manual override is recommended to stay off.'}
              </p>
            </div>
          ) : (
            <div className="bg-emerald-950/20 border border-emerald-500/30 text-emerald-200 text-xs p-3 rounded-lg flex items-start gap-2.5">
              <CloudSun className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed font-semibold">
                <span className="font-extrabold text-emerald-400">Dry & Clear Outlook.</span> Scheduled timers and automatic threshold controllers are actively operating.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-10" style={{ color: theme.subText }}>
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: theme.primary }} />
          <p className="text-xs font-bold uppercase tracking-widest mt-2">Retrieving forecast data...</p>
        </div>
      )}
    </div>
  );
}
