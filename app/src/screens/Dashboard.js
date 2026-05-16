import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, useColorScheme, ActivityIndicator, Alert, ScrollView, Image, TouchableOpacity, ImageBackground, Platform } from 'react-native';
import { ref, onValue, set, push, get } from 'firebase/database';
import { database } from '../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LogOut, CloudRain, CloudSun, MapPinOff, Thermometer } from 'lucide-react-native';
import * as Location from 'expo-location';

import MoistureCard from '../components/MoistureCard';
import RelayControl from '../components/RelayControl';
import AutoToggle from '../components/AutoToggle';
import ThresholdSlider from '../components/ThresholdSlider';

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
    maxRuntimeMinutes: 20
  });

  const [currentEpoch, setCurrentEpoch] = useState(Math.floor(Date.now() / 1000));

  useEffect(() => {
    const timer = setInterval(() => setCurrentEpoch(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(timer);
  }, []);

  // Track if we've already alerted the user to avoid spamming
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

        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=precipitation_probability%2Ctemperature_2m%2Cweathercode&forecast_hours=12`;
        const res = await fetch(url);
        
        if (!res.ok) {
          throw new Error(`HTTP Error: ${res.status}`);
        }
        
        const json = await res.json();
        
        const probabilities = json.hourly?.precipitation_probability || [0];
        const maxChance = Math.max(...probabilities);
        const rainPredicted = maxChance > 40; // 40% threshold for prediction

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

      } catch (error) {
        console.error("Error fetching weather:", error);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 3600000); // 1 hour
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Listen for Firebase connection state (Online/Offline)
    const connectedRef = ref(database, '.info/connected');
    const unsubscribeConnected = onValue(connectedRef, (snap) => {
      setConnected(snap.val() === true);
    });

    // Listen for all data at the state node
    const stateRef = ref(database, 'state');
    const unsubscribeData = onValue(stateRef, (snapshot) => {
      const val = snapshot.val() || {}; // Handle empty state
      
      setData({
        moisture: val.moisture || 0,
        relay: val.relay || 0,
        auto: val.auto || 0,
        threshold: val.threshold || 600,
        pumpProtection: val.pumpProtection || { triggered: false },
        pumpStartTimeEpoch: val.pumpStartTimeEpoch || 0,
        maxRuntimeMinutes: val.maxRuntimeMinutes || 20
      });

      if (val.weather) {
        setWeatherData(val.weather);
      }

      setLoading(false);
      
      // Push Real Notifications to Firebase
      // Drier = Lower number. Trigger alert if below 300.
      if (val.moisture < 300 && val.auto === 0 && !hasAlertedDry) {
        Alert.alert(
          "Orchard is Dry! 🍎", 
          "Moisture levels are critical. Please turn on the pump or enable Auto Mode."
        );
        setHasAlertedDry(true);
        
        // Log to database
        const notifsRef = ref(database, 'notifications');
        push(notifsRef, {
          type: 'alert',
          title: 'Critical Moisture Alert',
          desc: `Moisture reached critical level (${val.moisture}). Auto-mode is OFF.`,
          timestamp: Date.now()
        });
      } else if (val.moisture > 500) {
        // Reset alert flag once watered (moisture > 500)
        setHasAlertedDry(false);
      }
    }, (error) => {
      console.error("Firebase error: ", error);
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
    if (data.auto === 1) return; // Prevent manual toggle in auto mode
    if (data.pumpProtection?.triggered) {
      Alert.alert("Protection Active", "Cannot start pump while motor protection is active. Please reset the protection first.");
      return;
    }

    if (data.relay === 0 && weatherData?.rainPredicted) {
      Alert.alert(
        "Rain Predicted 🌧️",
        `There is a ${weatherData.rainChance}% chance of rain in the next ${weatherData.forecastWindowHours} hours.\n\nAre you sure you want to start manual irrigation?`,
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Continue", 
            onPress: () => togglePump(1),
            style: "destructive"
          }
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
    
    // Log auto mode change
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

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Logout", 
        style: "destructive", 
        onPress: async () => {
          await AsyncStorage.removeItem('isLoggedIn');
          navigation.replace('Login');
        }
      }
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center, { backgroundColor: theme.bg }]}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={[styles.loadingText, { color: theme.subText }]}>Connecting to AgroFlow...</Text>
      </SafeAreaView>
    );
  }

  return (
    <ImageBackground 
      source={require('../../assets/orchard_bg.png')} 
      style={styles.background}
      blurRadius={Platform.OS === 'ios' ? 8 : 4}
    >
      <View style={[styles.overlay, { backgroundColor: theme.overlayBg }]} />
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        
        <View style={styles.header}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <Image 
              source={require('../../assets/icon.png')} 
              style={{ width: 32, height: 32, borderRadius: 8, marginRight: 10, borderWidth: 1, borderColor: theme.primary }} 
            />
            <Text style={[styles.title, { color: theme.text }]}>AGROFLOW</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={[styles.statusContainer, { backgroundColor: theme.cardBg, borderColor: theme.headerBorder }]}>
              <View style={[styles.statusDot, { backgroundColor: connected ? '#34d399' : '#ef4444' }]} />
              <Text style={[styles.statusText, { color: theme.text }]}>
                {connected ? 'Online' : 'Offline'}
              </Text>
            </View>
            <TouchableOpacity onPress={handleLogout} style={{ marginLeft: 16 }}>
              <LogOut color={theme.text} size={22} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 30 }}>
          
          <TouchableOpacity 
            style={[styles.weatherCard, { backgroundColor: theme.cardBg, borderColor: theme.headerBorder }]}
            onPress={() => weatherData && !weatherData.unconfigured && navigation.navigate('Weather')}
            activeOpacity={0.8}
          >
            {weatherData ? (
               weatherData.unconfigured ? (
                  <View style={styles.weatherInner}>
                    <MapPinOff color="#ea580c" size={32} style={{marginRight: 16}} />
                    <View style={{flex: 1}}>
                      <Text style={[styles.weatherTitle, {color: '#ea580c'}]}>
                        Location Not Set
                      </Text>
                      <Text style={[styles.weatherSubtitle, {color: theme.text}]}>
                        Tap to configure in Settings.
                      </Text>
                    </View>
                  </View>
               ) : (
                  <View style={styles.weatherInner}>
                    {weatherData.rainPredicted ? (
                      <CloudRain color={theme.primary} size={32} style={{marginRight: 16}} />
                    ) : (
                      <CloudSun color="#15803d" size={32} style={{marginRight: 16}} />
                    )}
                    <View style={{flex: 1}}>
                      <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                        <Text style={[styles.weatherTitle, {color: weatherData.rainPredicted ? theme.primary : '#15803d'}]}>
                          {weatherData.rainPredicted ? `Rain Predicted (${weatherData.rainChance}%)` : 'No Rain Expected'}
                        </Text>
                        <View style={{flexDirection: 'row', alignItems: 'center'}}>
                          <Thermometer color={theme.text} size={16} />
                          <Text style={{color: theme.text, fontWeight: '900', fontSize: 16}}>
                            {weatherData.currentTemp !== undefined ? `${Math.round(weatherData.currentTemp)}°` : '--°'}
                          </Text>
                        </View>
                      </View>
                      {weatherData.rainPredicted && data.auto === 1 ? (
                        <Text style={[styles.weatherSubtitle, {color: theme.text}]}>
                          Auto watering & schedules skipped.
                        </Text>
                      ) : (
                        <Text style={[styles.weatherSubtitle, {color: theme.text}]}>
                          Tap for detailed orchard forecast.
                        </Text>
                      )}
                    </View>
                  </View>
               )
            ) : (
               <View style={styles.weatherInner}>
                 <ActivityIndicator color={theme.text} size="small" style={{marginRight: 12}} />
                 <Text style={{color: theme.text, fontWeight: 'bold'}}>Fetching weather...</Text>
               </View>
            )}
          </TouchableOpacity>

          <MoistureCard moisture={data.moisture} />
          
          {data.pumpProtection?.triggered && (
            <View style={{backgroundColor: 'rgba(254, 242, 242, 0.9)', borderColor: theme.danger, borderWidth: 1, padding: 16, borderRadius: 8, marginBottom: 16}}>
              <Text style={{color: theme.danger, fontWeight: 'bold', fontSize: 16, marginBottom: 4}}>⚠️ Pump Protection Triggered</Text>
              <Text style={{color: '#7f1d1d', marginBottom: 12}}>Pump stopped automatically to prevent motor damage after running continuously for {data.maxRuntimeMinutes} minutes.</Text>
              <TouchableOpacity style={{backgroundColor: theme.danger, padding: 10, borderRadius: 6, alignItems: 'center'}} onPress={handleResetProtection}>
                <Text style={{color: 'white', fontWeight: 'bold', letterSpacing: 1}}>RESET PROTECTION</Text>
              </TouchableOpacity>
            </View>
          )}

          {!data.pumpProtection?.triggered && data.relay === 1 && data.pumpStartTimeEpoch > 0 && (
             <View style={{backgroundColor: 'rgba(236, 253, 245, 0.9)', borderColor: '#10b981', borderWidth: 1, padding: 16, borderRadius: 8, marginBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
                <View>
                  <Text style={{color: '#065f46', fontWeight: 'bold', fontSize: 16, marginBottom: 2}}>Pump is Running</Text>
                  <Text style={{color: '#047857', fontWeight: '600'}}>
                    Auto-shutdown in: {Math.max(0, Math.floor(((data.maxRuntimeMinutes * 60) - (currentEpoch - data.pumpStartTimeEpoch)) / 60))}m {Math.max(0, ((data.maxRuntimeMinutes * 60) - (currentEpoch - data.pumpStartTimeEpoch)) % 60)}s
                  </Text>
                </View>
                <ActivityIndicator color="#10b981" />
             </View>
          )}

          <ThresholdSlider 
            threshold={data.threshold} 
            onValueChange={handleThresholdChange} 
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
      </SafeAreaView>
    </ImageBackground>
  );
}

const lightTheme = {
  overlayBg: 'rgba(240, 253, 244, 0.85)',
  cardBg: 'rgba(255, 255, 255, 0.95)',
  text: '#14532d',
  subText: '#166534',
  headerBorder: '#bbf7d0',
  primary: '#dc2626'
};

const darkTheme = {
  overlayBg: 'rgba(2, 44, 34, 0.85)',
  cardBg: 'rgba(2, 44, 34, 0.95)',
  text: '#f0fdf4',
  subText: '#a7f3d0',
  headerBorder: '#065f46',
  primary: '#ef4444'
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    borderBottomWidth: 4,
    borderBottomColor: '#dc2626', // Apple red trim
    backgroundColor: 'rgba(255, 255, 255, 0.8)', // Translucent
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weatherCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherTitle: {
    fontSize: 16,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  weatherSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  }
});
