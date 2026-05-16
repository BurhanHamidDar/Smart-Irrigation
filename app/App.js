import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, useColorScheme } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import NetInfo from '@react-native-community/netinfo';
import { WifiOff } from 'lucide-react-native';

export default function App() {
  const [isConnected, setIsConnected] = useState(true); // Default to true to prevent flash
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? darkTheme : lightTheme;

  useEffect(() => {
    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener(state => {
      // isInternetReachable is more strict than isConnected
      // but isConnected is faster. We'll use isConnected as the primary gate.
      setIsConnected(state.isConnected === true);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  if (!isConnected) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
        <View style={styles.center}>
          <WifiOff color={theme.primary} size={80} strokeWidth={1.5} />
          <Text style={[styles.title, { color: theme.text }]}>No Internet</Text>
          <Text style={[styles.subtitle, { color: theme.subText }]}>
            AgroFlow requires an active internet connection to communicate with your irrigation system.
          </Text>
          <Text style={[styles.subtitle, { color: theme.subText, marginTop: 24, fontWeight: 'bold' }]}>
            Waiting for connection...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  );
}

const lightTheme = {
  bg: '#f1f5f9',
  text: '#1e3a8a',
  subText: '#475569',
  primary: '#ef4444' // Red for offline
};

const darkTheme = {
  bg: '#0f172a',
  text: '#f8fafc',
  subText: '#94a3b8',
  primary: '#ef4444' // Red for offline
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginTop: 24,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  }
});
