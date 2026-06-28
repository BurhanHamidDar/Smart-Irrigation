import { useState, useEffect, useRef } from 'react';
import { ref, onValue, set, push, query, limitToLast, get } from 'firebase/database';
import { database } from '../config/firebase';

export interface Schedule {
  startHour: number;
  startMinute: number;
  stopHour: number;
  stopMinute: number;
  enabled: boolean;
}

export interface PumpProtection {
  triggered: boolean;
  reason?: string;
}

export interface WeatherData {
  rainPredicted: boolean;
  rainChance: number;
  forecastWindowHours: number;
  currentTemp: number;
  weatherCode: number;
  latitude: number;
  longitude: number;
  unconfigured?: boolean;
}

export interface SystemState {
  moisture: number;
  relay: number;
  auto: number;
  threshold: number;
  seasonalAuto: number;
  pumpProtection: PumpProtection;
  pumpStartTimeEpoch: number;
  maxRuntimeMinutes: number;
  schedules: Schedule[];
  weather?: WeatherData;
}

// Kashmir orchard seasonal thresholds (raw ADC — higher = drier)
const KASHMIR_SEASONS = [
  { name: 'Dormant / Wand', months: [12, 1, 2], threshold: 780, description: 'Deep winter rest. Minimal irrigation required.' },
  { name: 'Bud Break / Bahaar', months: [3, 4], threshold: 640, description: 'Buds awakening. Moderate moisture needed.' },
  { name: 'Fruit Set / Phal Lagna', months: [5, 6], threshold: 580, description: 'Critical growth phase. Consistent moisture essential.' },
  { name: 'Fruit Development', months: [7, 8], threshold: 520, description: 'Peak demand season. Daily irrigation monitoring.' },
  { name: 'Maturation / Harud', months: [9, 10, 11], threshold: 670, description: 'Pre-harvest. Taper water to improve fruit quality.' },
];

export function getKashmirSeasonInfo() {
  const month = new Date().getMonth() + 1;
  return KASHMIR_SEASONS.find(s => s.months.includes(month)) || KASHMIR_SEASONS[0];
}

export interface SystemLog {
  id: string;
  type: 'info' | 'alert' | 'success';
  title: string;
  desc: string;
  timestamp: number;
}

export interface LocationSettings {
  latitude: number;
  longitude: number;
}

export function useFirebaseSync() {
  const [loading, setLoading] = useState(true);
  const [firebaseConnected, setFirebaseConnected] = useState(false);
  const [deviceConnected, setDeviceConnected] = useState(false);
  const [lastCommunication, setLastCommunication] = useState<Date | null>(null);

  const [state, setState] = useState<SystemState>({
    moisture: 0,
    relay: 0,
    auto: 0,
    threshold: 600,
    seasonalAuto: 0,
    pumpProtection: { triggered: false },
    pumpStartTimeEpoch: 0,
    maxRuntimeMinutes: 20,
    schedules: [],
  });

  const [location, setLocation] = useState<LocationSettings | null>(null);
  const [logs, setLogs] = useState<SystemLog[]>([]);

  // Keep a reference to the active state to detect transitions
  const prevRelayRef = useRef<number | null>(null);
  const prevMoistureRef = useRef<number | null>(null);
  const lastStateRef = useRef<SystemState | null>(null);

  useEffect(() => {
    lastStateRef.current = state;
  }, [state]);

  // Handle Firebase connection state
  useEffect(() => {
    const connectedRef = ref(database, '.info/connected');
    const unsubscribe = onValue(connectedRef, (snap) => {
      setFirebaseConnected(snap.val() === true);
    });
    return () => unsubscribe();
  }, []);

  // Sync System State
  useEffect(() => {
    const stateRef = ref(database, 'state');
    const unsubscribe = onValue(stateRef, (snapshot) => {
      const val = snapshot.val() || {};
      
      const parsedState: SystemState = {
        moisture: typeof val.moisture === 'number' ? val.moisture : 0,
        relay: typeof val.relay === 'number' ? val.relay : 0,
        auto: typeof val.auto === 'number' ? val.auto : 0,
        threshold: typeof val.threshold === 'number' ? val.threshold : 600,
        seasonalAuto: typeof val.seasonalAuto === 'number' ? val.seasonalAuto : 0,
        pumpProtection: val.pumpProtection || { triggered: false },
        pumpStartTimeEpoch: typeof val.pumpStartTimeEpoch === 'number' ? val.pumpStartTimeEpoch : 0,
        maxRuntimeMinutes: typeof val.maxRuntimeMinutes === 'number' ? val.maxRuntimeMinutes : 20,
        schedules: Array.isArray(val.schedules) ? val.schedules : val.schedules ? Object.values(val.schedules) : [],
        weather: val.weather || undefined,
      };

      // If seasonal auto mode is ON, apply the recommended Kashmir threshold automatically
      if (parsedState.seasonalAuto === 1) {
        const season = getKashmirSeasonInfo();
        if (parsedState.threshold !== season.threshold) {
          set(ref(database, 'state/threshold'), season.threshold);
        }
      }

      // Set last communication to now
      const now = new Date();
      setLastCommunication(now);
      setDeviceConnected(true);

      // Detect state transitions and handle logging
      handleStateTransitions(parsedState);

      setState(parsedState);
      setLoading(false);
    }, (error) => {
      console.error("Firebase sync error: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sync Location Settings
  useEffect(() => {
    const locRef = ref(database, 'settings/location');
    const unsubscribe = onValue(locRef, (snap) => {
      const val = snap.val();
      if (val && typeof val.latitude === 'number' && typeof val.longitude === 'number') {
        setLocation({
          latitude: val.latitude,
          longitude: val.longitude,
        });
      } else {
        setLocation(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Sync Logs (Last 50)
  useEffect(() => {
    const logsQuery = query(ref(database, 'notifications'), limitToLast(50));
    const unsubscribe = onValue(logsQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const parsedLogs = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        })).sort((a, b) => b.timestamp - a.timestamp);
        setLogs(parsedLogs as SystemLog[]);
      } else {
        setLogs([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // Monitor device connection offline status
  useEffect(() => {
    const interval = setInterval(() => {
      if (lastCommunication) {
        const secondsSinceCommunication = (Date.now() - lastCommunication.getTime()) / 1000;
        // ESP updates moisture every 10 seconds. If no update in 25 seconds, mark device as offline
        setDeviceConnected(secondsSinceCommunication < 25);
      } else {
        setDeviceConnected(false);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [lastCommunication]);

  // Helper to detect relay transitions and push duplicate-safe logs
  const handleStateTransitions = async (newState: SystemState) => {
    const prevRelay = prevRelayRef.current;
    prevRelayRef.current = newState.relay;

    const prevMoisture = prevMoistureRef.current;
    prevMoistureRef.current = newState.moisture;

    if (prevRelay === null) return; // Skip initial load

    const currentEpoch = Math.floor(Date.now() / 1000);

    // 1. Pump started transition
    if (prevRelay === 0 && newState.relay === 1) {
      let desc = 'Irrigation active. ';
      
      // Determine trigger cause
      if (newState.auto === 1) {
        desc += `Automation engaged automatically. (Moisture: ${newState.moisture}, Threshold: ${newState.threshold})`;
      } else {
        // Check if there is a schedule matching the current time
        const now = new Date();
        const curMin = now.getHours() * 60 + now.getMinutes();
        const matchesSchedule = newState.schedules.some(s => {
          if (!s.enabled) return false;
          const start = s.startHour * 60 + s.startMinute;
          const stop = s.stopHour * 60 + s.stopMinute;
          if (start <= stop) {
            return curMin >= start && curMin < stop;
          } else {
            return curMin >= start || curMin < stop;
          }
        });
        
        if (matchesSchedule) {
          desc += 'Activated by system schedule.';
        } else {
          desc += 'Manual override engaged by Administrator.';
        }
      }

      await pushLogIfUnique({
        type: 'info',
        title: 'Pump Status: ACTIVE',
        desc,
        timestamp: Date.now(),
      });
      triggerBrowserNotification('Pump Started 💧', desc);
    }

    // 2. Pump stopped transition
    if (prevRelay === 1 && newState.relay === 0) {
      let durationStr = '';
      if (newState.pumpStartTimeEpoch > 0) {
        const durSecs = currentEpoch - newState.pumpStartTimeEpoch;
        const mins = Math.floor(durSecs / 60);
        const secs = durSecs % 60;
        durationStr = ` Duration: ${mins}m ${secs}s.`;
      }

      let desc = `Irrigation stopped.${durationStr}`;
      
      if (newState.pumpProtection?.triggered) {
        desc = `Pump stopped automatically to prevent motor damage after running for ${newState.maxRuntimeMinutes} minutes.`;
        triggerBrowserNotification('⚠️ Pump Protection Triggered', desc);
      } else {
        triggerBrowserNotification('Pump Stopped 🛑', desc);
      }

      await pushLogIfUnique({
        type: newState.pumpProtection?.triggered ? 'alert' : 'info',
        title: newState.pumpProtection?.triggered ? 'Pump Protection Triggered' : 'Pump Status: INACTIVE',
        desc,
        timestamp: Date.now(),
      });
    }

    // 3. Pump Protection Triggered log (if protection value changes to triggered)
    // Handled in relay transition stop above

    // 4. Critical dry moisture alert (raw ADC above 700 = critically dry soil)
    if ((prevMoisture === null || prevMoisture <= 700) && newState.moisture > 700 && newState.auto === 0) {
      const desc = `Soil moisture is critically low (raw sensor: ${newState.moisture}). Auto-mode is OFF — manual action required.`;
      await pushLogIfUnique({
        type: 'alert',
        title: 'Critical Dry Soil Alert',
        desc,
        timestamp: Date.now(),
      });
      triggerBrowserNotification('Critical Dry Soil Alert 🍎', desc);
    }
  };

  // Duplicate-safe log pushing. Checks last 5 notifications to ensure no double-writing
  const pushLogIfUnique = async (logData: Omit<SystemLog, 'id'>) => {
    try {
      const notifsRef = query(ref(database, 'notifications'), limitToLast(5));
      const snap = await get(notifsRef);
      let duplicate = false;

      if (snap.exists()) {
        const recentLogs = Object.values(snap.val()) as Omit<SystemLog, 'id'>[];
        duplicate = recentLogs.some(l => 
          l.title === logData.title && 
          Math.abs(l.timestamp - logData.timestamp) < 6000 // Less than 6 seconds apart
        );
      }

      if (!duplicate) {
        await push(ref(database, 'notifications'), logData);
      }
    } catch (e) {
      console.error("Error writing sync log: ", e);
    }
  };

  // Dynamic state updates (Firebase Writes)
  const setPumpState = (newState: number) => {
    set(ref(database, 'state/relay'), newState);
  };

  const setAutoMode = (newState: number) => {
    set(ref(database, 'state/auto'), newState);
  };

  const setMoistureThreshold = (newThreshold: number) => {
    set(ref(database, 'state/threshold'), newThreshold);
  };

  const setMaxRuntimeMinutes = (newLimit: number) => {
    set(ref(database, 'state/maxRuntimeMinutes'), newLimit);
  };

  const resetPumpProtection = () => {
    set(ref(database, 'state/pumpProtection/triggered'), false);
    push(ref(database, 'notifications'), {
      type: 'info',
      title: 'Protection Reset',
      desc: 'Administrator reset the pump runtime protection.',
      timestamp: Date.now(),
    });
  };

  const setSchedulesList = (newSchedules: Schedule[]) => {
    set(ref(database, 'state/schedules'), newSchedules);
  };

  const setOrchardLocation = (lat: number, lon: number) => {
    set(ref(database, 'settings/location'), { latitude: lat, longitude: lon });
  };

  const setWeatherState = (weather: WeatherData) => {
    set(ref(database, 'state/weather'), weather);
  };

  const setSeasonalAuto = (newState: number) => {
    set(ref(database, 'state/seasonalAuto'), newState);
    if (newState === 1) {
      const season = getKashmirSeasonInfo();
      set(ref(database, 'state/threshold'), season.threshold);
    }
  };

  const triggerBrowserNotification = (title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
      });
    }
  };

  return {
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
    setWeatherState,
    setSeasonalAuto,
  };
}
