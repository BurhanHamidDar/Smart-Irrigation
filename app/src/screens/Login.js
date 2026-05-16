import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, useColorScheme, ActivityIndicator, KeyboardAvoidingView, Platform, Alert, Image, ImageBackground } from 'react-native';
import { ref, get, set } from 'firebase/database';
import { database } from '../config/firebase';
import { Lock, User, Eye, EyeOff } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Login({ navigation }) {
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? darkTheme : lightTheme;

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    // Trim whitespace to prevent accidental failed logins
    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanUsername || !cleanPassword) {
      Alert.alert('Error', 'Please enter both username and password.');
      return;
    }

    setLoading(true);
    try {
      const credsRef = ref(database, 'credentials');
      const snapshot = await get(credsRef);
      
      if (!snapshot.exists()) {
        // First time setup - pushing default credentials to Firebase
        if (cleanUsername === 'mudasir' && cleanPassword === 'mudasir@123') {
          await set(credsRef, { username: cleanUsername, password: cleanPassword });
          await AsyncStorage.setItem('isLoggedIn', 'true');
          navigation.replace('Dashboard');
        } else {
          Alert.alert('Error', 'Invalid initial credentials. Use default admin access.');
        }
      } else {
        // Validate against existing credentials
        const data = snapshot.val();
        if (data.username === cleanUsername && data.password === cleanPassword) {
          await AsyncStorage.setItem('isLoggedIn', 'true');
          navigation.replace('Dashboard');
        } else {
          Alert.alert('Authentication Failed', 'Incorrect username or password.');
        }
      }
    } catch (error) {
      Alert.alert('Network Error', 'Could not connect to Firebase.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground 
      source={require('../../assets/orchard_bg.png')} 
      style={styles.background}
      blurRadius={Platform.OS === 'ios' ? 8 : 4}
    >
      <View style={[styles.overlay, { backgroundColor: theme.overlayBg }]} />
      
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.card, { backgroundColor: theme.cardBg }]}>
          <View style={styles.header}>
            <Image 
              source={require('../../assets/icon.png')} 
              style={{ width: 72, height: 72, borderRadius: 16, marginBottom: 16, borderWidth: 2, borderColor: theme.primary }} 
            />
            <Text style={[styles.title, { color: theme.text }]}>AGROFLOW</Text>
            <Text style={[styles.subtitle, { color: theme.subText }]}>Apple Orchard System</Text>
            <Text style={[styles.creditText, { color: theme.subText, marginTop: 8 }]}>Developed by Burhan Hamid</Text>
          </View>

          <View style={styles.inputContainer}>
            <User color={theme.icon} size={20} style={styles.inputIconLeft} />
            <TextInput
              style={[styles.input, { color: theme.text, backgroundColor: theme.inputBg }]}
              placeholder="Username"
              placeholderTextColor={theme.subText}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Lock color={theme.icon} size={20} style={styles.inputIconLeft} />
            <TextInput
              style={[styles.input, { color: theme.text, backgroundColor: theme.inputBg, paddingRight: 48 }]}
              placeholder="Password"
              placeholderTextColor={theme.subText}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity 
              style={styles.inputIconRight} 
              onPress={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff color={theme.icon} size={20} />
              ) : (
                <Eye color={theme.icon} size={20} />
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[styles.button, { backgroundColor: theme.primary }, loading && styles.buttonDisabled]} 
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>SECURE LOGIN</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const lightTheme = {
  overlayBg: 'rgba(240, 253, 244, 0.85)', // Light green tint
  cardBg: 'rgba(255, 255, 255, 0.95)',
  text: '#14532d', // Deep Forest Green
  subText: '#166534',
  inputBg: '#f0fdf4',
  icon: '#15803d',
  primary: '#dc2626', // Apple Red
  border: '#bbf7d0'
};

const darkTheme = {
  overlayBg: 'rgba(2, 44, 34, 0.85)', // Dark forest tint
  cardBg: 'rgba(2, 44, 34, 0.95)',
  text: '#f0fdf4',
  subText: '#a7f3d0',
  inputBg: '#064e3b',
  icon: '#34d399',
  primary: '#ef4444', // Apple Red
  border: '#065f46'
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
    padding: 24,
  },
  card: {
    padding: 32,
    borderRadius: 16, // Softer Apple aesthetic
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  creditText: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.8,
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  inputIconLeft: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  inputIconRight: {
    position: 'absolute',
    right: 16,
    zIndex: 1,
    padding: 4,
  },
  input: {
    flex: 1,
    height: 60,
    borderRadius: 12, 
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    paddingLeft: 48,
    paddingRight: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  button: {
    height: 60,
    borderRadius: 12, 
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    elevation: 4,
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
  }
});
