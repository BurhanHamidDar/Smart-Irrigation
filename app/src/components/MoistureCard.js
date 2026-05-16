import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { Droplets } from 'lucide-react-native';

export default function MoistureCard({ moisture }) {
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? darkTheme : lightTheme;

  // Calculate true percentage based purely on the 10-bit analog scale (0 - 1024)
  // Sensor logic: 0 is completely dry (0%), 1024 is completely wet (100%)
  let percent = 0;
  if (moisture && moisture > 0) {
    percent = Math.max(0, Math.min(100, Math.round((moisture / 1024) * 100)));
  }

  return (
    <View style={[styles.card, { backgroundColor: theme.cardBg }]}>
      <View style={styles.content}>
        <Droplets color="#3b82f6" size={48} strokeWidth={1.5} />
        <Text style={[styles.percentText, { color: theme.text }]}>{percent}%</Text>
        <Text style={[styles.rawText, { color: theme.subText }]}>Raw Sensor: {moisture}</Text>
      </View>
    </View>
  );
}

const lightTheme = {
  cardBg: '#ffffff',
  text: '#1e3a8a', // Navy
  subText: '#475569',
  border: '#cbd5e1'
};

const darkTheme = {
  cardBg: '#1e293b',
  text: '#f8fafc',
  subText: '#94a3b8',
  border: '#334155'
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 4, // Sharp
    borderWidth: 1,
    padding: 30,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 2, // Minor shadow
  },
  content: {
    alignItems: 'center',
  },
  percentText: {
    fontSize: 64,
    fontWeight: '800',
    marginTop: 12,
    marginBottom: 4,
  },
  rawText: {
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'uppercase',
  }
});
