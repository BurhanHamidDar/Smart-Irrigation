import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, useColorScheme, ActivityIndicator, Alert, ScrollView, Image, TouchableOpacity, Platform } from 'react-native';
import { ref, onValue, set, push, get } from 'firebase/database';
import { database } from '../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LogOut, CloudRain, CloudSun, MapPinOff, Thermometer, Bot, Leaf } from 'lucide-react-native';

import MoistureCard from '../components/MoistureCard';
import RelayControl from '../components/RelayControl';
import AutoToggle from '../components/AutoToggle';
import ThresholdSlider from '../components/ThresholdSlider';
import KashmirSeasonalToggle from '../components/KashmirSeasonalToggle';

const getKashmirSeasonInfo = () => {
  const month = new Date().getMonth() + 1; // 1-12
  if (month === 12 || month <= 2) {
    return { name: 'Dormant / Wand', recommendedThreshold: 780 };
  } else if (month >= 3 && month <= 4) {
    return { name: 'Bud Break / Bahaar', recommendedThreshold: 640 };
  } else if (month >= 5 && month <= 6) {
    return { name: 'Fruit Set / Phal Lagna', recommendedThreshold: 580 };
  } else if (month >= 7 && month <= 8) {
    return { name: 'Fruit Development', recommendedThreshold: 520 };
  } else {
    return { name: 'Maturation / Harud', recommendedThreshold: 670 };
  }
};

export default function Dashboard({ navigation }) {
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? darkTheme : lightTheme;

  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [weatherData, setWeatherData] = useState(null);
  
  const [data, setData] = useState({
    moisture: 0,
    relay: 0,
    auto: 0,
    threshold: 600,
    pumpProtection: { triggered: false },
    pumpStartTimeEpoch: 0,
    maxRuntimeMinutes: 20,
    seasonalAuto: 0
  });

  const [currentEpoch, setCurrentEpoch] = useState(Math.floor(Date.now() / 1000));

  useEffect(() => {
    const timer = setInterval(() => setCurrentEpoch(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(timer);
  }, []);

  const [hasAlertedDry, setHasAlertedDry] = useState(false);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const locSnap = await get(ref(database, 'settings/location'));
        const locData = locSnap.val();
        
        if (!locData || !locData.latitude || !locData.longitude) {
          setWeatherData({ unconfigured: true });
          return;
        }

        const lat = locData.latitude;
        const lon = locData.longitude;

        // 10-second timeout to avoid hanging on poor connectivity
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        try {
          const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=precipitation_probability%2Ctemperature_2m%2Cweathercode&forecast_hours=12`;
          const res = await fetch(url, { signal: controller.signal });
          clearTimeout(timeoutId);

          if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
          
          const json = await res.json();
          const probabilities = json.hourly?.precipitation_probability || [0];
          const maxChance = Math.max(...probabilities);
          const rainPredicted = maxChance > 40;

          const newWeather = {
            rainPredicted,
            rainChance: maxChance,
            forecastWindowHours: 12,
            currentTemp: json.current_weather?.temperature ?? 0,
            weatherCode: json.current_weather?.weathercode ?? 0,
            latitude: lat,
            longitude: lon
          };

          set(ref(database, 'state/weather'), newWeather);
          setWeatherData(newWeather);
        } catch (fetchError) {
          clearTimeout(timeoutId);
          // Network failed — fall back to last known Firebase weather data
          const cachedSnap = await get(ref(database, 'state/weather'));
          if (cachedSnap.exists()) {
            setWeatherData(cachedSnap.val());
          } else {
            setWeatherData({ unconfigured: true });
          }
        }
      } catch (error) {
        console.warn('Weather fetch skipped:', error.message);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 3600000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const connectedRef = ref(database, '.info/connected');
    const unsubscribeConnected = onValue(connectedRef, (snap) => {
      setConnected(snap.val() === true);
    });

    const stateRef = ref(database, 'state');
    const unsubscribeData = onValue(stateRef, (snapshot) => {
      const val = snapshot.val() || {};
      const seasonalVal = val.seasonalAuto || 0;
      const thresholdVal = val.threshold || 600;

      if (seasonalVal === 1) {
        const seasonInfo = getKashmirSeasonInfo();
        if (thresholdVal !== seasonInfo.recommendedThreshold) {
          set(ref(database, 'state/threshold'), seasonInfo.recommendedThreshold);
        }
      }

      setData({
        moisture: val.moisture || 0,
        relay: val.relay || 0,
        auto: val.auto || 0,
        threshold: val.threshold || 600,
        pumpProtection: val.pumpProtection || { triggered: false },
        pumpStartTimeEpoch: val.pumpStartTimeEpoch || 0,
        maxRuntimeMinutes: val.maxRuntimeMinutes || 20,
        seasonalAuto: seasonalVal
      });

      if (val.weather) {
        setWeatherData(val.weather);
      }
      setLoading(false);

      if (val.moisture > 700 && val.auto === 0 && !hasAlertedDry) {
        Alert.alert(
          "Orchard is Dry! 🍎", 
          "Moisture levels are critical. Turn on the pump or enable Auto Mode."
        );
        setHasAlertedDry(true);
        push(ref(database, 'notifications'), {
          type: 'alert',
          title: 'Critical Moisture Alert',
          desc: `Soil moisture is critically low (raw sensor: ${val.moisture}). Auto-mode is OFF.`,
          timestamp: Date.now()
        });
      } else if (val.moisture < 500) {
        setHasAlertedDry(false);
      }
    }, (error) => {
      Alert.alert("Connection Error", "Failed to sync with Firebase.");
    });

    return () => {
      unsubscribeConnected();
      unsubscribeData();
    };
  }, [hasAlertedDry]);

  const handleResetProtection = () => {
    set(ref(database, 'state/pumpProtection/triggered'), false);
    push(ref(database, 'notifications'), {
      type: 'info',
      title: `Protection Reset`,
      desc: `Administrator reset the pump runtime protection.`,
      timestamp: Date.now()
    });
  };

  const togglePump = (newState) => {
    setData(prev => ({ ...prev, relay: newState }));
    set(ref(database, 'state/relay'), newState);
    push(ref(database, 'notifications'), {
      type: 'info',
      title: `Pump Status: ${newState === 1 ? 'ACTIVE' : 'INACTIVE'}`,
      desc: `Manual override engaged by Administrator.`,
      timestamp: Date.now()
    });
  };

  const handleToggleRelay = () => {
    if (data.auto === 1) return;
    if (data.pumpProtection?.triggered) {
      Alert.alert("Protection Active", "Cannot start pump while motor protection is active. Reset the protection first.");
      return;
    }

    if (data.relay === 0 && weatherData?.rainPredicted) {
      Alert.alert(
        "Rain Predicted 🌧️",
        `There is a ${weatherData.rainChance}% chance of rain in the next ${weatherData.forecastWindowHours} hours.\n\nAre you sure you want to start manual irrigation?`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Continue", onPress: () => togglePump(1), style: "destructive" }
        ]
      );
    } else {
      togglePump(data.relay === 1 ? 0 : 1);
    }
  };

  const handleToggleAuto = (value) => {
    const newState = value ? 1 : 0;
    setData(prev => ({ ...prev, auto: newState }));
    set(ref(database, 'state/auto'), newState);
    push(ref(database, 'notifications'), {
      type: 'info',
      title: `Automation: ${newState === 1 ? 'ON' : 'OFF'}`,
      desc: `System automation was toggled.`,
      timestamp: Date.now()
    });
  };

  const handleThresholdChange = (value) => {
    setData(prev => ({ ...prev, threshold: value }));
    set(ref(database, 'state/threshold'), value);
  };

  const handleToggleSeasonal = (value) => {
    const newState = value ? 1 : 0;
    setData(prev => ({ ...prev, seasonalAuto: newState }));
    set(ref(database, 'state/seasonalAuto'), newState);
    
    if (newState === 1) {
      const seasonInfo = getKashmirSeasonInfo();
      set(ref(database, 'state/threshold'), seasonInfo.recommendedThreshold);
    }
    
    push(ref(database, 'notifications'), {
      type: 'info',
      title: `Seasonal Auto: ${newState === 1 ? 'ON' : 'OFF'}`,
      desc: `Kashmir seasonal automatic adjustment was toggled.`,
      timestamp: Date.now()
    });
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Logout", 
        style: "destructive", 
        onPress: async () => {
            await AsyncStorage.removeItem('isLoggedIn');
            await AsyncStorage.removeItem('cachedCredentials');
            navigation.replace('Login');
        }
      }
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center, { backgroundColor: theme.pageBg }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.subText }]}>Connecting to AgroFlow...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.pageBg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.cardBg} />
      
      <View style={[styles.header, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <View style={[styles.logoContainer, { backgroundColor: theme.primaryLight }]}>
            <Leaf color={theme.primary} size={18} />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>AgroFlow</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={[styles.statusContainer, { backgroundColor: theme.pageBg, borderColor: theme.border }]}>
            <View style={[styles.statusDot, { backgroundColor: connected ? '#2e7d52' : '#c0392b' }]} />
            <Text style={[styles.statusText, { color: theme.text }]}>
              {connected ? 'Online' : 'Offline'}
            </Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={{ marginLeft: 14 }}>
            <LogOut color={theme.text} size={20} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 90 }}>
        
        <TouchableOpacity 
          style={[styles.weatherCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
          onPress={() => weatherData && !weatherData.unconfigured && navigation.navigate('Weather')}
          activeOpacity={0.8}
        >
          {weatherData ? (
             weatherData.unconfigured ? (
                <View style={styles.weatherInner}>
                  <MapPinOff color="#ea580c" size={24} style={{marginRight: 12}} />
                  <View style={{flex: 1}}>
                    <Text style={[styles.weatherTitle, {color: '#ea580c'}]}>
                      Location Not Set
                    </Text>
                    <Text style={[styles.weatherSubtitle, {color: theme.subText}]}>
                      Tap to configure in Settings.
                    </Text>
                  </View>
                </View>
             ) : (
                <View style={styles.weatherInner}>
                  {weatherData.rainPredicted ? (
                    <CloudRain color={theme.danger} size={28} style={{marginRight: 12}} />
                  ) : (
                    <CloudSun color="#2e7d52" size={28} style={{marginRight: 12}} />
                  )}
                  <View style={{flex: 1}}>
                    <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                      <Text style={[styles.weatherTitle, {color: weatherData.rainPredicted ? theme.danger : '#2e7d52'}]}>
                        {weatherData.rainPredicted ? `Rain Predicted (${weatherData.rainChance}%)` : 'Clear Sky Outlook'}
                      </Text>
                      <View style={{flexDirection: 'row', alignItems: 'center'}}>
                        <Thermometer color={theme.text} size={14} />
                        <Text style={{color: theme.text, fontWeight: '600', fontSize: 14}}>
                          {weatherData.currentTemp !== undefined ? `${Math.round(weatherData.currentTemp)}°C` : '--°C'}
                        </Text>
                      </View>
                    </View>
                    {weatherData.rainPredicted && data.auto === 1 ? (
                      <Text style={[styles.weatherSubtitle, {color: theme.subText}]}>
                        Auto watering suspended to save water.
                      </Text>
                    ) : (
                      <Text style={[styles.weatherSubtitle, {color: theme.subText}]}>
                        Tap for detailed orchard forecast.
                      </Text>
                    )}
                  </View>
                </View>
             )
          ) : (
             <View style={styles.weatherInner}>
               <ActivityIndicator color={theme.text} size="small" style={{marginRight: 10}} />
               <Text style={{color: theme.text, fontWeight: '500'}}>Fetching weather...</Text>
             </View>
          )}
        </TouchableOpacity>

        <MoistureCard moisture={data.moisture} />
        
        {data.pumpProtection?.triggered && (
          <View style={[styles.alertContainer, { backgroundColor: '#fef2f2', borderColor: '#fecaca' }]}>
            <Text style={{color: '#c0392b', fontWeight: '700', fontSize: 14, marginBottom: 4}}>⚠️ Pump Protection Engaged</Text>
            <Text style={{color: '#7f1d1d', fontSize: 12, marginBottom: 12}}>Pump stopped automatically to prevent motor damage after running continuously for {data.maxRuntimeMinutes} minutes.</Text>
            <TouchableOpacity style={{backgroundColor: '#c0392b', padding: 10, borderRadius: 8, alignItems: 'center'}} onPress={handleResetProtection}>
              <Text style={{color: 'white', fontWeight: '600', fontSize: 13}}>Reset Motor Protection</Text>
            </TouchableOpacity>
          </View>
        )}

        {!data.pumpProtection?.triggered && data.relay === 1 && data.pumpStartTimeEpoch > 0 && (
           <View style={[styles.alertContainer, { backgroundColor: '#eaf7f0', borderColor: '#bbf7d0', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
              <View>
                <Text style={{color: '#2e7d52', fontWeight: '700', fontSize: 14, marginBottom: 2}}>Pump is Running</Text>
                <Text style={{color: '#2e7d52', fontSize: 12}}>
                  Shutdown in: {Math.max(0, Math.floor(((data.maxRuntimeMinutes * 60) - (currentEpoch - data.pumpStartTimeEpoch)) / 60))}m {Math.max(0, ((data.maxRuntimeMinutes * 60) - (currentEpoch - data.pumpStartTimeEpoch)) % 60)}s
                </Text>
              </View>
              <ActivityIndicator color="#2e7d52" />
           </View>
        )}

        <KashmirSeasonalToggle 
          seasonalState={data.seasonalAuto} 
          onToggle={handleToggleSeasonal} 
        />

        <ThresholdSlider 
          threshold={data.threshold} 
          onValueChange={handleThresholdChange} 
          disabled={data.seasonalAuto === 1}
        />
        
        <View style={styles.row}>
          <AutoToggle 
            autoState={data.auto} 
            onToggle={handleToggleAuto} 
          />
          <RelayControl 
            relayState={data.relay} 
            onToggle={handleToggleRelay} 
            disabled={data.auto === 1}
          />
        </View>
      </ScrollView>

      {/* Floating Action Button for AI Advisor */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.primary }]}
        onPress={() => navigation.navigate('Advisor')}
        activeOpacity={0.8}
      >
        <Bot color="#ffffff" size={24} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const lightTheme = {
  pageBg: '#f4f6f0',
  cardBg: '#ffffff',
  text: '#1a2e1c',
  subText: '#6b7b6e',
  primary: '#4a7c59',
  primaryLight: '#eaf2ec',
  border: '#e8eceb',
  danger: '#c0392b'
};

const darkTheme = {
  pageBg: '#141a15',
  cardBg: '#1e2720',
  text: '#e8ede9',
  subText: '#8a9e8d',
  primary: '#5a9469',
  primaryLight: '#1a2e1c',
  border: '#2a3a2d',
  danger: '#e74c3c'
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '550',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  logoContainer: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  weatherCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  weatherInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  weatherSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  alertContainer: {
    borderWidth: 1,
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  }
});
