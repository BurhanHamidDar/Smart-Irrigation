import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { Droplets } from 'lucide-react-native';

const SENSOR_DRY = 900;
const SENSOR_WET = 300;

export default function MoistureCard({ moisture }) {
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? darkTheme : lightTheme;

  let percent = 0;
  if (moisture && moisture > 0) {
    const clamped = Math.max(SENSOR_WET, Math.min(SENSOR_DRY, moisture));
    percent = Math.round(((SENSOR_DRY - clamped) / (SENSOR_DRY - SENSOR_WET)) * 100);
  }

  let label, color, bg;
  if (percent >= 70) {
    label = 'Well Moistened';
    color = '#2e7d52';
    bg = '#eaf7f0';
  } else if (percent >= 40) {
    label = 'Adequate';
    color = '#d97706';
    bg = '#fffbeb';
  } else if (percent >= 20) {
    label = 'Low';
    color = '#ea580c';
    bg = '#fff7ed';
  } else {
    label = 'Critical Dry';
    color = '#c0392b';
    bg = '#fef2f2';
  }

  return (
    <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: bg }]}>
          <Droplets color={color} size={36} strokeWidth={1.8} />
        </View>
        <Text style={[styles.percentText, { color: theme.text }]}>{percent}%</Text>
        <Text style={[styles.labelText, { color: color, backgroundColor: bg }]}>{label}</Text>
        <Text style={[styles.rawText, { color: theme.subText }]}>Raw Sensor: {moisture}</Text>
      </View>
    </View>
  );
}

const lightTheme = {
  cardBg: '#ffffff',
  text: '#1a2e1c',
  subText: '#6b7b6e',
  border: '#e8eceb'
};

const darkTheme = {
  cardBg: '#1e2720',
  text: '#e8ede9',
  subText: '#8a9e8d',
  border: '#2a3a2d'
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  content: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  percentText: {
    fontSize: 48,
    fontWeight: '700',
    marginBottom: 6,
  },
  labelText: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 10,
  },
  rawText: {
    fontSize: 12,
    fontWeight: '550',
  }
});
