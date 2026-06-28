import React from 'react';
import { View, Text, StyleSheet, Switch, useColorScheme } from 'react-native';
import { CalendarRange } from 'lucide-react-native';

const getKashmirSeasonInfo = () => {
  const month = new Date().getMonth() + 1; // 1-12
  if (month === 12 || month <= 2) {
    return {
      name: 'Dormant / Wand',
      months: 'Dec – Feb',
      recommendedThreshold: 780,
      description: 'Minimal winter rest irrigation.'
    };
  } else if (month >= 3 && month <= 4) {
    return {
      name: 'Bud Break / Bahaar',
      months: 'Mar – Apr',
      recommendedThreshold: 640,
      description: 'Buds awakening. Moderate moisture.'
    };
  } else if (month >= 5 && month <= 6) {
    return {
      name: 'Fruit Set / Phal Lagna',
      months: 'May – Jun',
      recommendedThreshold: 580,
      description: 'Critical. Consistent moisture.'
    };
  } else if (month >= 7 && month <= 8) {
    return {
      name: 'Fruit Development',
      months: 'Jul – Aug',
      recommendedThreshold: 520,
      description: 'Peak demand. Keep monitored.'
    };
  } else {
    return {
      name: 'Maturation / Harud',
      months: 'Sep – Nov',
      recommendedThreshold: 670,
      description: 'Harvest prep. Taper water.'
    };
  }
};

export default function KashmirSeasonalToggle({ seasonalState, onToggle }) {
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? darkTheme : lightTheme;

  const isSeasonal = seasonalState === 1;
  const currentSeason = getKashmirSeasonInfo();

  return (
    <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: isSeasonal ? '#eaf7f0' : theme.inputBg }]}>
          <CalendarRange color={isSeasonal ? '#2e7d52' : theme.icon} size={20} />
        </View>
        <Text style={[styles.title, { color: theme.text }]}>Kashmir Seasonal Mode</Text>
        <Switch
          value={isSeasonal}
          onValueChange={onToggle}
          trackColor={{ false: theme.switchOff, true: theme.primary }}
          thumbColor={'#ffffff'}
          ios_backgroundColor={theme.switchOff}
        />
      </View>
      
      <View style={[styles.divider, { backgroundColor: theme.border }]} />
      
      <View style={styles.content}>
        <Text style={[styles.statusText, { color: isSeasonal ? '#2e7d52' : theme.subText }]}>
          {isSeasonal ? 'Active — Auto Season Adjust' : 'Manual Threshold Mode'}
        </Text>
        
        <View style={styles.infoRow}>
          <Text style={[styles.label, { color: theme.subText }]}>Current Season:</Text>
          <Text style={[styles.value, { color: theme.text }]}>{currentSeason.name}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={[styles.label, { color: theme.subText }]}>Duration:</Text>
          <Text style={[styles.value, { color: theme.text }]}>{currentSeason.months}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={[styles.label, { color: theme.subText }]}>Outlook:</Text>
          <Text style={[styles.value, { color: theme.text, fontSize: 11 }]}>{currentSeason.description}</Text>
        </View>
        
        {isSeasonal && (
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: theme.primaryLight, borderColor: theme.primary }]}>
              <Text style={[styles.badgeText, { color: theme.primary }]}>Auto Threshold: {currentSeason.recommendedThreshold} ADC</Text>
            </View>
          </View>
        )}
      </View>
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
  primaryLight: '#eaf2ec',
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
  primaryLight: '#1a2e1c',
  switchOff: '#2a3a2d'
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
    justifyContent: 'space-between',
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
  divider: {
    height: 1,
    marginVertical: 12,
  },
  content: {
    flexDirection: 'column',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
  },
  value: {
    fontSize: 12,
    fontWeight: '600',
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: 10,
  },
  badge: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  }
});
