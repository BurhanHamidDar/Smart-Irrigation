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
        <View style={[styles.iconContainer, { backgroundColor: isAuto ? '#eaf7f0' : theme.inputBg }]}>
          <Activity color={isAuto ? '#2e7d52' : theme.icon} size={20} />
        </View>
        <Text style={[styles.title, { color: theme.text }]}>Automation</Text>
      </View>
      
      <View style={styles.switchContainer}>
        <Switch
          value={isAuto}
          onValueChange={onToggle}
          trackColor={{ false: theme.switchOff, true: theme.primary }}
          thumbColor={'#ffffff'}
          ios_backgroundColor={theme.switchOff}
        />
      </View>
      
      <Text style={[styles.helperText, { color: isAuto ? '#2e7d52' : theme.subText }]}>
        {isAuto ? 'Sensors Active' : 'Manual Override'}
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
  icon: '#6b7b6e',
  primary: '#4a7c59',
  switchOff: '#dde3de'
};

const darkTheme = {
  cardBg: '#1e2720',
  text: '#e8ede9',
  subText: '#8a9e8d',
  border: '#2a3a2d',
  inputBg: '#162019',
  icon: '#8a9e8d',
  primary: '#5a9469',
  switchOff: '#2a3a2d'
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
  switchContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  helperText: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  }
});
