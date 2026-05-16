import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { Power } from 'lucide-react-native';

export default function RelayControl({ relayState, onToggle, disabled }) {
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? darkTheme : lightTheme;

  const isOn = relayState === 1;

  return (
    <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }, disabled && styles.disabled]}>
      <View style={styles.header}>
        <Power color={isOn ? '#16a34a' : theme.icon} size={24} />
        <Text style={[styles.title, { color: theme.text }]}>Pump Switch</Text>
      </View>
      
      <TouchableOpacity 
        style={[styles.button, isOn ? styles.buttonOn : styles.buttonOff]}
        onPress={onToggle}
        disabled={disabled}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>{isOn ? 'PUMP IS ON' : 'PUMP IS OFF'}</Text>
      </TouchableOpacity>
      
      {disabled && (
        <Text style={[styles.helperText, { color: theme.subText }]}>LOCKED BY AUTO</Text>
      )}
    </View>
  );
}

const lightTheme = {
  cardBg: '#ffffff',
  text: '#1e3a8a', // Navy
  icon: '#94a3b8',
  subText: '#475569',
  border: '#cbd5e1'
};

const darkTheme = {
  cardBg: '#1e293b',
  text: '#f8fafc',
  icon: '#6b7280',
  subText: '#94a3b8',
  border: '#334155'
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 4, // Sharp
    borderWidth: 1,
    padding: 20,
    marginHorizontal: 8,
    elevation: 2,
  },
  disabled: {
    opacity: 0.6,
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
  },
  button: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 4, // Sharp
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  buttonOff: {
    backgroundColor: '#b91c1c', // Formal Red
  },
  buttonOn: {
    backgroundColor: '#15803d', // Formal Green
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  helperText: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 12,
  }
});
