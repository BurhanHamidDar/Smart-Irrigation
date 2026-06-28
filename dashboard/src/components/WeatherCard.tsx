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
    if (code === 0) return <Sun className="text-amber-500" size={size} />;
    if (code >= 1 && code <= 3) return <CloudSun className="text-blue-400" size={size} />;
    if (code >= 45 && code <= 48) return <Cloud style={{ color: theme.subText }} size={size} />;
    if (code >= 51 && code <= 67) return <CloudRain className="text-blue-400" size={size} />;
    if (code >= 71 && code <= 77) return <Cloud className="text-blue-200" size={size} />; // Snow
    if (code >= 80 && code <= 82) return <CloudRain className="text-blue-400" size={size} />;
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
        className="rounded-xl p-6 border flex flex-col items-center justify-center text-center py-12"
        style={{ 
          backgroundColor: theme.cardBg, 
          borderColor: theme.cardBorder,
          boxShadow: theme.cardShadow,
          color: theme.text 
        }}
      >
        <NavigationOff className="w-10 h-10 mb-3 opacity-55" style={{ color: theme.primary }} />
        <h2 className="text-sm font-semibold uppercase">Location Unconfigured</h2>
        <p className="text-xs max-w-xs mt-2 leading-relaxed" style={{ color: theme.subText }}>
          Orchard location coordinates (GPS) are not set. Configure coordinates in settings to load forecast overrides.
        </p>
      </div>
    );
  }

  const isRainForecast = weather?.rainPredicted;

  return (
    <div 
      className="rounded-xl p-5 border flex flex-col relative overflow-hidden"
      style={{ 
        backgroundColor: theme.cardBg, 
        borderColor: theme.cardBorder,
        boxShadow: theme.cardShadow,
        color: theme.text 
      }}
    >
      <div 
        className="w-full flex items-center justify-between mb-4 pb-3 border-b"
        style={{ borderBottomColor: theme.cardBorder }}
      >
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4" style={{ color: theme.primary }} />
          <h2 className="text-sm font-semibold">Orchard Forecast</h2>
        </div>
        
        {fetching ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: theme.primary }} />
        ) : (
          <span className="text-xs font-medium" style={{ color: theme.subText }}>
            {location.latitude.toFixed(4)}N, {location.longitude.toFixed(4)}E
          </span>
        )}
      </div>

      {weather ? (
        <div className="flex flex-col gap-4">
          {/* Main Weather Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              {getWeatherIcon(weather.weatherCode, 44)}
              <div>
                <h3 className="text-base font-semibold leading-none" style={{ color: theme.text }}>
                  {getWeatherCondition(weather.weatherCode)}
                </h3>
                <span className="text-[10px] uppercase font-medium mt-1 block" style={{ color: theme.subText }}>
                  Outlook Conditions
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 text-2xl font-bold">
              <Thermometer className="w-5 h-5 shrink-0" style={{ color: theme.primary }} />
              <span>{Math.round(weather.currentTemp)}°<span className="text-sm font-semibold" style={{ color: theme.primary }}>C</span></span>
            </div>
          </div>

          {/* Core Weather grid metrics */}
          <div 
            className="grid grid-cols-2 gap-3 border-t border-b py-3 my-1"
            style={{ 
              borderColor: theme.cardBorder 
            }}
          >
            <div 
              className="border rounded-lg p-2.5 flex flex-col items-center"
              style={{ 
                backgroundColor: theme.inputBg, 
                borderColor: theme.cardBorder 
              }}
            >
              <CloudRain className="w-4 h-4 text-blue-400 shrink-0" />
              <span className="text-[9px] font-semibold uppercase mt-1.5" style={{ color: theme.subText }}>Rain Probability</span>
              <span className="text-sm font-semibold mt-0.5" style={{ color: theme.text }}>{weather.rainChance}%</span>
            </div>

            <div 
              className="border rounded-lg p-2.5 flex flex-col items-center"
              style={{ 
                backgroundColor: theme.inputBg, 
                borderColor: theme.cardBorder 
              }}
            >
              <Wind className="w-4 h-4 text-teal-450 shrink-0" />
              <span className="text-[9px] font-semibold uppercase mt-1.5" style={{ color: theme.subText }}>Forecast Window</span>
              <span className="text-sm font-semibold mt-0.5" style={{ color: theme.text }}>Next {weather.forecastWindowHours} hrs</span>
            </div>
          </div>

          {/* Automatic weather blocks alerts */}
          {isRainForecast ? (
            <div 
              className="border text-xs p-3 rounded-lg flex items-start gap-2.5"
              style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca', color: '#c0392b' }}
            >
              <Droplets className="w-4.5 h-4.5 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <span className="font-semibold">Rain Predicted ({weather.rainChance}%).</span> 
                {autoMode === 1 ? ' Auto irrigation rules & timers are suspended to conserve water.' : ' Manual override is recommended to stay off.'}
              </p>
            </div>
          ) : (
            <div 
              className="border text-xs p-3 rounded-lg flex items-start gap-2.5"
              style={{ backgroundColor: '#eaf7f0', borderColor: '#bbf7d0', color: '#2e7d52' }}
            >
              <CloudSun className="w-4.5 h-4.5 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <span className="font-semibold">Dry & Clear Outlook.</span> Scheduled timers and automatic threshold controllers are actively operating.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-10" style={{ color: theme.subText }}>
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: theme.primary }} />
          <p className="text-xs font-semibold uppercase tracking-wider mt-2">Retrieving forecast data...</p>
        </div>
      )}
    </div>
  );
}
