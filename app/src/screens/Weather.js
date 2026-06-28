import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, useColorScheme, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import { ref, onValue } from 'firebase/database';
import { database } from '../config/firebase';
import { CloudRain, CloudSun, Cloud, Sun, Wind, Droplets, Thermometer, ArrowLeft } from 'lucide-react-native';

export default function Weather({ navigation }) {
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
    if (code === 0) return <Sun color={color} size={size} />;
    if (code >= 1 && code <= 3) return <CloudSun color={color} size={size} />;
    if (code >= 45 && code <= 48) return <Cloud color={color} size={size} />;
    if (code >= 51 && code <= 67) return <CloudRain color={color} size={size} />;
    if (code >= 71 && code <= 77) return <Cloud color={color} size={size} />;
    if (code >= 80 && code <= 82) return <CloudRain color={color} size={size} />;
    if (code >= 95 && code <= 99) return <CloudRain color={color} size={size} />;
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
      <View style={[styles.container, styles.center, { backgroundColor: theme.pageBg }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.pageBg }]}>
      <View style={[styles.header, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft color={theme.text} size={20} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Orchard Weather</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {weatherData && !weatherData.unconfigured ? (
          <>
            <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <View style={styles.mainInfo}>
                <View style={[styles.iconContainer, { backgroundColor: theme.primaryLight }]}>
                  {getWeatherIcon(weatherData.weatherCode, theme.primary, 48)}
                </View>
                <Text style={[styles.tempText, { color: theme.text }]}>
                  {weatherData.currentTemp !== undefined ? Math.round(weatherData.currentTemp) : '--'}°C
                </Text>
                <Text style={[styles.conditionText, { color: theme.text }]}>
                  {getWeatherCondition(weatherData.weatherCode)}
                </Text>
              </View>
            </View>

            <View style={styles.grid}>
              <View style={[styles.gridItem, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                <View style={[styles.itemIcon, { backgroundColor: '#eff6ff' }]}>
                  <CloudRain color="#3b82f6" size={20} />
                </View>
                <Text style={[styles.gridTitle, { color: theme.subText }]}>Rain Chance</Text>
                <Text style={[styles.gridValue, { color: theme.text }]}>{weatherData.rainChance}%</Text>
              </View>

              <View style={[styles.gridItem, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                <View style={[styles.itemIcon, { backgroundColor: '#eaf7f0' }]}>
                  <Thermometer color="#2e7d52" size={20} />
                </View>
                <Text style={[styles.gridTitle, { color: theme.subText }]}>Temperature</Text>
                <Text style={[styles.gridValue, { color: theme.text }]}>{weatherData.currentTemp}°C</Text>
              </View>

              <View style={[styles.gridItem, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                <View style={[styles.itemIcon, { backgroundColor: weatherData.rainPredicted ? '#fef2f2' : '#eaf7f0' }]}>
                  <Droplets color={weatherData.rainPredicted ? theme.danger : '#2e7d52'} size={20} />
                </View>
                <Text style={[styles.gridTitle, { color: theme.subText }]}>Rain Override</Text>
                <Text style={[styles.gridValue, { color: theme.text, fontSize: 13, marginTop: 4 }]}>
                  {weatherData.rainPredicted ? 'Triggered' : 'Inactive'}
                </Text>
              </View>

              <View style={[styles.gridItem, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                <View style={[styles.itemIcon, { backgroundColor: theme.primaryLight }]}>
                  <Wind color={theme.primary} size={20} />
                </View>
                <Text style={[styles.gridTitle, { color: theme.subText }]}>Outlook Period</Text>
                <Text style={[styles.gridValue, { color: theme.text, fontSize: 13, marginTop: 4 }]}>Next {weatherData.forecastWindowHours} hrs</Text>
              </View>
            </View>

            {weatherData.rainPredicted && (
              <View style={[styles.alertContainer, { backgroundColor: '#fef2f2', borderColor: '#fecaca' }]}>
                <Text style={{ color: '#c0392b', fontSize: 12, lineHeight: 18, fontWeight: '500' }}>
                  {'🌧️ Rain predicted within 12 hours. Auto irrigation has been suspended to conserve resources.'}
                </Text>
              </View>
            )}
          </>
        ) : (
          <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border, padding: 30 }]}>
            <Text style={[styles.errorText, { color: theme.subText }]}>
              Weather coordinates unconfigured. Please enter lat/lon settings to load forecast override rules.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const lightTheme = {
  pageBg: '#f4f6f0',
  cardBg: '#ffffff',
  text: '#1a2e1c',
  subText: '#6b7b6e',
  border: '#e8eceb',
  primary: '#4a7c59',
  primaryLight: '#eaf2ec',
  danger: '#c0392b'
};

const darkTheme = {
  pageBg: '#141a15',
  cardBg: '#1e2720',
  text: '#e8ede9',
  subText: '#8a9e8d',
  border: '#2a3a2d',
  primary: '#5a9469',
  primaryLight: '#1a2e1c',
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    padding: 16,
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    alignItems: 'center',
  },
  mainInfo: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  tempText: {
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 4,
  },
  conditionText: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
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
    padding: 14,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  gridTitle: {
    fontSize: 11,
    fontWeight: '550',
    marginBottom: 2,
  },
  gridValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  alertContainer: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginTop: 4,
  },
  errorText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  }
});
