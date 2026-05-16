import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import Slider from '@react-native-community/slider';
import { Settings2 } from 'lucide-react-native';

export default function ThresholdSlider({ threshold, onValueChange }) {
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? darkTheme : lightTheme;

  return (
    <View style={[styles.card, { backgroundColor: theme.cardBg }]}>
      <View style={styles.header}>
        <Settings2 color="#f59e0b" size={24} />
        <Text style={[styles.title, { color: theme.text }]}>Moisture Threshold</Text>
        <Text style={styles.valueBadge}>{threshold}</Text>
      </View>
      
      <Slider
        style={styles.slider}
        minimumValue={300}
        maximumValue={900}
        step={10}
        value={threshold}
        onSlidingComplete={onValueChange}
        minimumTrackTintColor="#f59e0b"
        maximumTrackTintColor={isDark ? '#374151' : '#e5e7eb'}
        thumbTintColor="#f59e0b"
      />
      
      <Text style={[styles.helperText, { color: theme.subText }]}>
        Auto turns PUMP ON when sensor exceeds {threshold}
      </Text>
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
    padding: 24,
    marginBottom: 20,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginLeft: 8,
    flex: 1,
  },
  valueBadge: {
    backgroundColor: '#ffedd5', // Light orange
    color: '#ea580c', // Saffron
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#fdba74',
    borderRadius: 4, // Sharp
    fontWeight: 'bold',
    overflow: 'hidden',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  helperText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 10,
    fontWeight: '600',
    textTransform: 'uppercase'
  }
});
