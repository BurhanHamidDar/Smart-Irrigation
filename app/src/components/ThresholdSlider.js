import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import Slider from '@react-native-community/slider';
import { Settings2 } from 'lucide-react-native';

export default function ThresholdSlider({ threshold, onValueChange, disabled }) {
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? darkTheme : lightTheme;

  return (
    <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border, opacity: disabled ? 0.55 : 1 }]}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: theme.inputBg }]}>
          <Settings2 color={theme.primary} size={18} />
        </View>
        <Text style={[styles.title, { color: theme.text }]}>Moisture Threshold</Text>
        <Text style={[
          styles.valueBadge,
          { backgroundColor: theme.primaryLight, color: theme.primary, borderColor: theme.primaryLight }
        ]}>
          {threshold}
        </Text>
      </View>
      
      <Slider
        style={styles.slider}
        minimumValue={300}
        maximumValue={900}
        step={10}
        value={threshold}
        onSlidingComplete={onValueChange}
        disabled={disabled}
        minimumTrackTintColor={disabled ? theme.border : theme.primary}
        maximumTrackTintColor={isDark ? '#2a3a2d' : '#e8eceb'}
        thumbTintColor={disabled ? theme.subText : theme.primary}
      />
      
      <View style={styles.ticksContainer}>
        <Text style={[styles.tickLabel, { color: theme.subText }]}>Wet (300)</Text>
        <Text style={[styles.tickLabel, { color: theme.subText }]}>Dry (900)</Text>
      </View>

      <Text style={[styles.helperText, { color: theme.subText }]}>
        {disabled 
          ? "Locked: Controlled by Kashmir Seasonal Mode" 
          : `Auto starts pump when sensor exceeds threshold`
        }
      </Text>
    </View>
  );
}

const lightTheme = {
  cardBg: '#ffffff',
  text: '#1a2e1c',
  subText: '#6b7b6e',
  border: '#e8eceb',
  inputBg: '#f4f6f0',
  primary: '#4a7c59',
  primaryLight: '#eaf2ec'
};

const darkTheme = {
  cardBg: '#1e2720',
  text: '#e8ede9',
  subText: '#8a9e8d',
  border: '#2a3a2d',
  inputBg: '#162019',
  primary: '#5a9469',
  primaryLight: '#1a2e1c'
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  valueBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderRadius: 6,
    fontSize: 12,
    fontWeight: '600',
    overflow: 'hidden',
  },
  slider: {
    width: '100%',
    height: 36,
  },
  ticksContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  tickLabel: {
    fontSize: 10,
    fontWeight: '550',
  },
  helperText: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '500',
  }
});
