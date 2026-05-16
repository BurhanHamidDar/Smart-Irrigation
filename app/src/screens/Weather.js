import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, useColorScheme, ActivityIndicator, ImageBackground, Platform, ScrollView } from 'react-native';
import { ref, onValue } from 'firebase/database';
import { database } from '../config/firebase';
import { CloudRain, CloudSun, Cloud, Sun, Wind, Droplets, Thermometer } from 'lucide-react-native';

export default function Weather() {
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? darkTheme : lightTheme;

  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stateRef = ref(database, 'state/weather');
    const unsubscribe = onValue(stateRef, (snapshot) => {
      if (snapshot.exists()) {
        setWeatherData(snapshot.val());
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const getWeatherIcon = (code, color, size) => {
    if (code === undefined) return <Cloud color={color} size={size} />;
    // WMO Weather interpretation codes
    if (code === 0) return <Sun color={color} size={size} />;
    if (code >= 1 && code <= 3) return <CloudSun color={color} size={size} />;
    if (code >= 45 && code <= 48) return <Cloud color={color} size={size} />;
    if (code >= 51 && code <= 67) return <CloudRain color={color} size={size} />;
    if (code >= 71 && code <= 77) return <Cloud color={color} size={size} />; // Snow
    if (code >= 80 && code <= 82) return <CloudRain color={color} size={size} />;
    if (code >= 95 && code <= 99) return <CloudRain color={color} size={size} />; // Thunderstorm
    return <Cloud color={color} size={size} />;
  };

  const getWeatherCondition = (code) => {
    if (code === undefined) return "Unknown";
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

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: theme.bg }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
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
        <ScrollView contentContainerStyle={styles.content}>
          {weatherData && !weatherData.unconfigured ? (
            <>
              <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                <View style={styles.mainInfo}>
                  {getWeatherIcon(weatherData.weatherCode, theme.primary, 80)}
                  <Text style={[styles.tempText, { color: theme.text }]}>
                    {weatherData.currentTemp !== undefined ? Math.round(weatherData.currentTemp) : '--'}°
                  </Text>
                  <Text style={[styles.conditionText, { color: theme.subText }]}>
                    {getWeatherCondition(weatherData.weatherCode)}
                  </Text>
                </View>
              </View>

              <View style={styles.grid}>
                <View style={[styles.gridItem, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                  <CloudRain color={theme.primary} size={28} />
                  <Text style={[styles.gridTitle, { color: theme.subText }]}>Rain Chance</Text>
                  <Text style={[styles.gridValue, { color: theme.text }]}>{weatherData.rainChance}%</Text>
                </View>

                <View style={[styles.gridItem, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                  <Thermometer color={theme.primary} size={28} />
                  <Text style={[styles.gridTitle, { color: theme.subText }]}>Temperature</Text>
                  <Text style={[styles.gridValue, { color: theme.text }]}>{weatherData.currentTemp}°C</Text>
                </View>

                <View style={[styles.gridItem, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                  <Droplets color={theme.primary} size={28} />
                  <Text style={[styles.gridTitle, { color: theme.subText }]}>Rain Forecast</Text>
                  <Text style={[styles.gridValue, { color: theme.text, fontSize: 16 }]}>
                    {weatherData.rainPredicted ? 'Incoming' : 'None Expected'}
                  </Text>
                </View>

                <View style={[styles.gridItem, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                  <Wind color={theme.primary} size={28} />
                  <Text style={[styles.gridTitle, { color: theme.subText }]}>Forecast Window</Text>
                  <Text style={[styles.gridValue, { color: theme.text }]}>Next {weatherData.forecastWindowHours} hrs</Text>
                </View>
              </View>
            </>
          ) : (
            <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border, padding: 30 }]}>
              <Text style={[styles.conditionText, { color: theme.text, textAlign: 'center' }]}>
                Weather data is not available. Ensure orchard location is configured in Settings.
              </Text>
            </View>
          )}
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
  border: '#bbf7d0',
  primary: '#dc2626'
};

const darkTheme = {
  overlayBg: 'rgba(2, 44, 34, 0.85)',
  cardBg: 'rgba(2, 44, 34, 0.95)',
  text: '#f0fdf4',
  subText: '#a7f3d0',
  border: '#065f46',
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
  content: {
    padding: 16,
    paddingTop: 32,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    elevation: 4,
    alignItems: 'center',
  },
  mainInfo: {
    alignItems: 'center',
  },
  tempText: {
    fontSize: 64,
    fontWeight: '900',
    marginTop: 10,
  },
  conditionText: {
    fontSize: 18,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    elevation: 2,
  },
  gridTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 12,
    marginBottom: 4,
  },
  gridValue: {
    fontSize: 20,
    fontWeight: '900',
  }
});
