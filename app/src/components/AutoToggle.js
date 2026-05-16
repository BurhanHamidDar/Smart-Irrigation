import React from 'react';
import { View, Text, StyleSheet, Switch, useColorScheme } from 'react-native';
import { Activity } from 'lucide-react-native';

export default function AutoToggle({ autoState, onToggle }) {
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? darkTheme : lightTheme;

  const isAuto = autoState === 1;

  return (
    <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
      <View style={styles.header}>
        <Activity color={theme.primary} size={24} />
        <Text style={[styles.title, { color: theme.text }]}>Automation</Text>
      </View>
      
      <View style={styles.switchContainer}>
        <Switch
          value={isAuto}
          onValueChange={onToggle}
          trackColor={{ false: theme.switchOff, true: theme.primary }}
          thumbColor={'#ffffff'}
          ios_backgroundColor={theme.switchOff}
          style={{ transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }] }}
        />
      </View>
      
      <Text style={[styles.helperText, { color: theme.subText }]}>
        {isAuto ? 'SENSORS ACTIVE' : 'MANUAL OVERRIDE'}
      </Text>
    </View>
  );
}

const lightTheme = {
  cardBg: '#ffffff',
  text: '#1e3a8a', // Navy
  subText: '#475569',
  border: '#cbd5e1',
  primary: '#ea580c', // Saffron
  switchOff: '#cbd5e1'
};

const darkTheme = {
  cardBg: '#1e293b',
  text: '#f8fafc',
  subText: '#94a3b8',
  border: '#334155',
  primary: '#ea580c',
  switchOff: '#475569'
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
  switchContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  helperText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
    fontWeight: '600',
  }
});
