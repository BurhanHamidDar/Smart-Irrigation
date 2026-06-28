import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, useColorScheme, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Splash({ navigation }) {
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? darkTheme : lightTheme;
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 60,
        useNativeDriver: true,
      })
    ]).start();

    const checkAuth = async () => {
      try {
        const loggedIn = await AsyncStorage.getItem('isLoggedIn');
        setTimeout(() => {
          if (loggedIn === 'true') {
            navigation.replace('Dashboard');
          } else {
            navigation.replace('Login');
          }
        }, 2200);
      } catch (error) {
        setTimeout(() => { navigation.replace('Login'); }, 2200);
      }
    };

    checkAuth();
  }, [navigation]);

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }], alignItems: 'center' }}>
        <View style={[styles.iconContainer, { backgroundColor: theme.iconBg, borderColor: theme.border }]}>
          <Image 
            source={require('../../assets/icon.png')} 
            style={{ width: 88, height: 88, borderRadius: 14 }} 
            resizeMode="contain"
          />
        </View>
        <Text style={[styles.title, { color: theme.text }]}>AgroFlow</Text>
        <Text style={[styles.subtitle, { color: theme.sub }]}>Apple Orchard System</Text>
      </Animated.View>

      <View style={styles.footer}>
        <Text style={[styles.creditText, { color: theme.sub }]}>Developed by Burhan Hamid</Text>
      </View>
    </View>
  );
}

const lightTheme = {
  bg: '#f4f6f0',
  iconBg: '#ffffff',
  text: '#1a2e1c',
  sub: '#6b7b6e',
  border: '#e8eceb',
};

const darkTheme = {
  bg: '#141a15',
  iconBg: '#1e2720',
  text: '#e8ede9',
  sub: '#8a9e8d',
  border: '#2a3a2d',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 20,
    borderWidth: 1,
    borderRadius: 18,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    position: 'absolute',
    bottom: 32,
  },
  creditText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
