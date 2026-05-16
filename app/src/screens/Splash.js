import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, useColorScheme, Image, ImageBackground } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Splash({ navigation }) {
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? darkTheme : lightTheme;
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start();

    // Check auth status while splash animation plays
    const checkAuth = async () => {
      try {
        const loggedIn = await AsyncStorage.getItem('isLoggedIn');
        setTimeout(() => {
          if (loggedIn === 'true') {
            navigation.replace('Dashboard');
          } else {
            navigation.replace('Login');
          }
        }, 2500); // Maintain the splash screen presentation time
      } catch (error) {
        setTimeout(() => { navigation.replace('Login'); }, 2500);
      }
    };

    checkAuth();

  }, [navigation]);

  return (
    <ImageBackground 
      source={require('../../assets/orchard_bg.png')} 
      style={styles.background}
    >
      <View style={[styles.overlay, { backgroundColor: theme.overlayBg }]} />
      <View style={styles.container}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }], alignItems: 'center' }}>
          <View style={[styles.iconContainer, { borderColor: theme.primary }]}>
            <Image 
              source={require('../../assets/icon.png')} 
              style={{ width: 100, height: 100, borderRadius: 16 }} 
              resizeMode="contain"
            />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>AGROFLOW</Text>
          <Text style={[styles.subtitle, { color: theme.subText }]}>Apple Orchard System</Text>
          <Text style={[styles.creditText, { color: theme.subText }]}>Developed by Burhan Hamid</Text>
        </Animated.View>
      </View>
    </ImageBackground>
  );
}

const lightTheme = {
  overlayBg: 'rgba(240, 253, 244, 0.85)',
  text: '#14532d',
  subText: '#166534',
  primary: '#dc2626'
};

const darkTheme = {
  overlayBg: 'rgba(2, 44, 34, 0.85)',
  text: '#f0fdf4',
  subText: '#a7f3d0',
  primary: '#ef4444'
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
    elevation: 12,
    shadowColor: "#dc2626",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    borderWidth: 3,
    borderRadius: 18,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  creditText: {
    position: 'absolute',
    bottom: -150,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
    opacity: 0.8,
  }
});
