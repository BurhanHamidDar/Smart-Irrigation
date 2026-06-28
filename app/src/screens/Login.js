import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, useColorScheme, ActivityIndicator, KeyboardAvoidingView, Platform, Alert, Image, StatusBar } from 'react-native';
import { database, DATABASE_URL } from '../config/firebase';
import { Lock, User, Eye, EyeOff, Leaf } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Login({ navigation }) {
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? darkTheme : lightTheme;

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanUsername || !cleanPassword) {
      Alert.alert('Error', 'Please enter both username and password.');
      return;
    }

    setLoading(true);
    try {
      const cachedRaw = await AsyncStorage.getItem('cachedCredentials');
      if (cachedRaw) {
        const cached = JSON.parse(cachedRaw);
        if (cached.username === cleanUsername && cached.password === cleanPassword) {
          await AsyncStorage.setItem('isLoggedIn', 'true');
          navigation.replace('Dashboard');
          return;
        }
      }

      const dbUrl = DATABASE_URL;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      let response;
      try {
        response = await fetch(`${dbUrl}/credentials.json`, {
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      if (!response.ok) {
        throw new Error(`HTTP_${response.status}`);
      }

      const data = await response.json();

      if (!data) {
        if (cleanUsername === 'mudasir' && cleanPassword === 'mudasir@123') {
          await fetch(`${dbUrl}/credentials.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: cleanUsername, password: cleanPassword }),
          });
          await AsyncStorage.setItem('cachedCredentials', JSON.stringify({ username: cleanUsername, password: cleanPassword }));
          await AsyncStorage.setItem('isLoggedIn', 'true');
          navigation.replace('Dashboard');
        } else {
          Alert.alert('Error', 'Invalid initial credentials. Use default admin access.');
        }
      } else if (data.username === cleanUsername && data.password === cleanPassword) {
        await AsyncStorage.setItem('cachedCredentials', JSON.stringify({ username: cleanUsername, password: cleanPassword }));
        await AsyncStorage.setItem('isLoggedIn', 'true');
        navigation.replace('Dashboard');
      } else {
        Alert.alert('Authentication Failed', 'Incorrect username or password.');
      }

    } catch (error) {
      if (error.name === 'AbortError') {
        Alert.alert(
          'Cannot Reach Server',
          'Connection timed out. Please check your internet connection and try again.'
        );
      } else {
        Alert.alert('Error', `Could not connect: ${error.message}`);
        console.error('Login error:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.pageBg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.pageBg} />
      <KeyboardAvoidingView 
        style={styles.keyboardContainer} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <View style={[styles.logoContainer, { backgroundColor: theme.primaryLight }]}>
            <Leaf color={theme.primary} size={32} />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>AgroFlow</Text>
          <Text style={[styles.subtitle, { color: theme.subText }]}>Smart Orchard System</Text>
        </View>

        <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Sign In</Text>
          <Text style={[styles.cardSubtitle, { color: theme.subText }]}>Access orchard controllers</Text>

          <View style={styles.space} />

          <View style={styles.inputLabelContainer}>
            <Text style={[styles.inputLabel, { color: theme.subText }]}>Username</Text>
          </View>
          <View style={[styles.inputContainer, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
            <User color={theme.subText} size={18} style={styles.inputIconLeft} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Enter username"
              placeholderTextColor={theme.subText}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputLabelContainer}>
            <Text style={[styles.inputLabel, { color: theme.subText }]}>Password</Text>
          </View>
          <View style={[styles.inputContainer, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
            <Lock color={theme.subText} size={18} style={styles.inputIconLeft} />
            <TextInput
              style={[styles.input, { color: theme.text, paddingRight: 48 }]}
              placeholder="Enter password"
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
                <EyeOff color={theme.subText} size={18} />
              ) : (
                <Eye color={theme.subText} size={18} />
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[styles.button, { backgroundColor: theme.primary }, loading && styles.buttonDisabled]} 
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.9}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={[styles.developerCredit, { color: theme.subText }]}>
          Developed by Burhan Hamid · Solo Developer
        </Text>
      </KeyboardAvoidingView>
    </View>
  );
}

const lightTheme = {
  pageBg: '#f4f6f0',
  cardBg: '#ffffff',
  text: '#1a2e1c',
  subText: '#6b7b6e',
  inputBg: '#f4f6f0',
  inputBorder: '#dde3de',
  primary: '#4a7c59',
  primaryLight: '#eaf2ec',
  border: '#e8eceb'
};

const darkTheme = {
  pageBg: '#141a15',
  cardBg: '#1e2720',
  text: '#e8ede9',
  subText: '#8a9e8d',
  inputBg: '#162019',
  inputBorder: '#2a3a2d',
  primary: '#5a9469',
  primaryLight: '#1a2e1c',
  border: '#2a3a2d'
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  card: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  cardSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  space: {
    height: 8,
  },
  inputLabelContainer: {
    marginTop: 14,
    marginBottom: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
  },
  inputIconLeft: {
    position: 'absolute',
    left: 14,
    zIndex: 1,
  },
  inputIconRight: {
    position: 'absolute',
    right: 14,
    zIndex: 1,
    padding: 4,
  },
  input: {
    flex: 1,
    height: '100%',
    paddingLeft: 44,
    paddingRight: 14,
    fontSize: 14,
    fontWeight: '500',
  },
  button: {
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  developerCredit: {
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 32,
  }
});
