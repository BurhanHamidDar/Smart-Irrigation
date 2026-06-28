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
        <View style={[styles.iconContainer, { backgroundColor: isOn ? '#eaf7f0' : theme.inputBg }]}>
          <Power color={isOn ? '#2e7d52' : theme.icon} size={20} />
        </View>
        <Text style={[styles.title, { color: theme.text }]}>Pump Switch</Text>
      </View>
      
      <TouchableOpacity 
        style={[styles.button, isOn ? { backgroundColor: '#c0392b' } : { backgroundColor: theme.primary }]}
        onPress={onToggle}
        disabled={disabled}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>{isOn ? 'Turn Off' : 'Turn On'}</Text>
      </TouchableOpacity>
      
      {disabled && (
        <Text style={[styles.helperText, { color: theme.subText }]}>Locked by Auto</Text>
      )}
    </View>
  );
}

const lightTheme = {
  cardBg: '#ffffff',
  text: '#1a2e1c',
  icon: '#6b7b6e',
  subText: '#6b7b6e',
  border: '#e8eceb',
  inputBg: '#f4f6f0',
  primary: '#4a7c59'
};

const darkTheme = {
  cardBg: '#1e2720',
  text: '#e8ede9',
  icon: '#8a9e8d',
  subText: '#8a9e8d',
  border: '#2a3a2d',
  inputBg: '#162019',
  primary: '#5a9469'
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  disabled: {
    opacity: 0.5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
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
  },
  button: {
    width: '100%',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  helperText: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
    textTransform: 'uppercase',
  }
});
