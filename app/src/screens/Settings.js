import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, useColorScheme, Alert, Platform, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { User, Shield, Info, LogOut, MapPin, Navigation, Timer, Key, ArrowLeft, Lock, Eye, EyeOff } from 'lucide-react-native';
import { ref, onValue, set } from 'firebase/database';
import { database } from '../config/firebase';
import { DATABASE_URL } from '../config/firebase';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Settings({ navigation }) {
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? darkTheme : lightTheme;

  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const [isLocating, setIsLocating] = useState(false);

  const [runtime, setRuntime] = useState('20');
  const [openRouterKey, setOpenRouterKey] = useState('');

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    const loadOpenRouterKey = async () => {
      try {
        const val = await AsyncStorage.getItem('openRouterApiKey');
        if (val) setOpenRouterKey(val);
      } catch (err) {
        console.error(err);
      }
    };
    loadOpenRouterKey();
  }, []);

  useEffect(() => {
    const locRef = ref(database, 'settings/location');
    const unsubscribeLoc = onValue(locRef, (snap) => {
      const data = snap.val();
      if (data) {
        setLat(data.latitude ? data.latitude.toString() : '');
        setLon(data.longitude ? data.longitude.toString() : '');
      }
    });

    const runRef = ref(database, 'state/maxRuntimeMinutes');
    const unsubscribeRun = onValue(runRef, (snap) => {
      if (snap.exists()) setRuntime(snap.val().toString());
    });

    return () => {
      unsubscribeLoc();
      unsubscribeRun();
    };
  }, []);

  const handleSaveLocation = () => {
    const l1 = parseFloat(lat);
    const l2 = parseFloat(lon);
    if (isNaN(l1) || isNaN(l2)) {
      Alert.alert("Invalid Input", "Please enter valid coordinates.");
      return;
    }
    set(ref(database, 'settings/location'), { latitude: l1, longitude: l2 });
    Alert.alert("Success", "Orchard location saved!");
  };

  const handleGetCurrentLocation = async () => {
    setIsLocating(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permission Denied", "Location permissions are required to use this feature.");
        setIsLocating(false);
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      setLat(location.coords.latitude.toString());
      setLon(location.coords.longitude.toString());
      set(ref(database, 'settings/location'), { 
        latitude: location.coords.latitude, 
        longitude: location.coords.longitude 
      });
      Alert.alert("Success", "Device location fetched and saved as Orchard location!");
    } catch (error) {
      Alert.alert("Error", "Could not fetch location.");
    }
    setIsLocating(false);
  };

  const handleSaveRuntime = () => {
    const r = parseInt(runtime, 10);
    if (isNaN(r) || r < 1 || r > 120) {
      Alert.alert("Invalid Input", "Please enter a valid runtime between 1 and 120 minutes.");
      return;
    }
    set(ref(database, 'state/maxRuntimeMinutes'), r);
    Alert.alert("Success", "Pump protection limit updated!");
  };

  const handleSaveOpenRouterKey = async () => {
    try {
      await AsyncStorage.setItem('openRouterApiKey', openRouterKey.trim());
      Alert.alert("Success", "OpenRouter API Key saved successfully!");
    } catch (err) {
      Alert.alert("Error", "Failed to save API key.");
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Missing Fields', 'Please fill in all password fields.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Too Short', 'New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Mismatch', 'New password and confirm password do not match.');
      return;
    }

    setPwLoading(true);
    try {
      // Use REST API exactly like Login.js — Firebase rules allow this
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      let readRes;
      try {
        readRes = await fetch(`${DATABASE_URL}/credentials.json`, {
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      if (!readRes.ok) throw new Error(`Read failed: HTTP ${readRes.status}`);
      const data = await readRes.json();

      if (!data || data.password !== currentPassword) {
        Alert.alert('Incorrect Password', 'The current password you entered is wrong.');
        setPwLoading(false);
        return;
      }

      // Write new password via REST PUT (same as Login.js credential bootstrap)
      const writeRes = await fetch(`${DATABASE_URL}/credentials.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: data.username, password: newPassword }),
      });

      if (!writeRes.ok) throw new Error(`Write failed: HTTP ${writeRes.status}`);

      // Clear local credential cache so next login uses new password
      await AsyncStorage.removeItem('cachedCredentials');

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      Alert.alert(
        'Password Updated',
        'Your password has been changed. Please log in again with your new password.',
        [{ text: 'OK', onPress: () => {
          AsyncStorage.setItem('isLoggedIn', 'false');
          navigation.replace('Login');
        }}]
      );
    } catch (err) {
      if (err.name === 'AbortError') {
        Alert.alert('Connection Timeout', 'Could not reach the server. Please check your internet and try again.');
      } else {
        Alert.alert('Error', `Failed to update password: ${err.message}`);
      }
    }
    setPwLoading(false);
  };

  const handleLogout = () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to securely log out of the system?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Log Out", 
          style: "destructive",
          onPress: () => navigation.replace('Login') 
        }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.pageBg }]}>
      <View style={[styles.header, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft color={theme.text} size={20} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Settings</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* ORCHARD LOCATION */}
        <View style={[styles.section, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <View style={styles.sectionHeader}>
            <MapPin color={theme.primary} size={20} />
            <View style={styles.sectionHeaderDetails}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Orchard Location</Text>
              <Text style={[styles.sectionSubtitle, { color: theme.subText }]}>Used for weather forecasting</Text>
            </View>
          </View>
          
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          
          <View style={styles.sectionBody}>
            <Text style={[styles.inputLabel, { color: theme.subText }]}>Latitude</Text>
            <TextInput 
              style={[styles.input, { borderColor: theme.inputBorder, backgroundColor: theme.inputBg, color: theme.text }]}
              value={lat}
              onChangeText={setLat}
              keyboardType="numeric"
              placeholder="e.g. 34.0522"
              placeholderTextColor={theme.subText}
            />
            
            <Text style={[styles.inputLabel, { color: theme.subText, marginTop: 12 }]}>Longitude</Text>
            <TextInput 
              style={[styles.input, { borderColor: theme.inputBorder, backgroundColor: theme.inputBg, color: theme.text }]}
              value={lon}
              onChangeText={setLon}
              keyboardType="numeric"
              placeholder="e.g. 74.7973"
              placeholderTextColor={theme.subText}
            />
            
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <TouchableOpacity 
                style={[styles.button, { backgroundColor: theme.primary, flex: 1 }]}
                onPress={handleSaveLocation}
                activeOpacity={0.9}
              >
                <Text style={styles.buttonText}>Save Location</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, { backgroundColor: theme.primaryLight, borderColor: theme.border, borderWidth: 1, paddingHorizontal: 16 }]}
                onPress={handleGetCurrentLocation}
                disabled={isLocating}
                activeOpacity={0.8}
              >
                {isLocating ? (
                  <ActivityIndicator color={theme.primary} size="small" />
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Navigation color={theme.primary} size={15} />
                    <Text style={{ color: theme.primary, fontWeight: '600', fontSize: 13 }}>GPS</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* MOTOR PROTECTION */}
        <View style={[styles.section, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <View style={styles.sectionHeader}>
            <Timer color={theme.primary} size={20} />
            <View style={styles.sectionHeaderDetails}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Motor Overrun Protection</Text>
              <Text style={[styles.sectionSubtitle, { color: theme.subText }]}>Maximum allowed duration (minutes)</Text>
            </View>
          </View>
          
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          
          <View style={styles.sectionBody}>
            <TextInput 
              style={[styles.input, { borderColor: theme.inputBorder, backgroundColor: theme.inputBg, color: theme.text }]}
              value={runtime}
              onChangeText={setRuntime}
              keyboardType="numeric"
              placeholder="e.g. 20"
              placeholderTextColor={theme.subText}
            />
            
            <TouchableOpacity 
              style={[styles.button, { backgroundColor: theme.primary, marginTop: 14 }]}
              onPress={handleSaveRuntime}
              activeOpacity={0.9}
            >
              <Text style={styles.buttonText}>Save Runtime Limit</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* OPENROUTER AI KEY */}
        <View style={[styles.section, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <View style={styles.sectionHeader}>
            <Key color={theme.primary} size={20} />
            <View style={styles.sectionHeaderDetails}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>AgroBot Advisor Key</Text>
              <Text style={[styles.sectionSubtitle, { color: theme.subText }]}>OpenRouter API Key (sk-or-...)</Text>
            </View>
          </View>
          
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          
          <View style={styles.sectionBody}>
            <TextInput 
              style={[styles.input, { borderColor: theme.inputBorder, backgroundColor: theme.inputBg, color: theme.text }]}
              value={openRouterKey}
              onChangeText={setOpenRouterKey}
              placeholder="Enter OpenRouter API Key"
              placeholderTextColor={theme.subText}
              secureTextEntry={true}
              autoCapitalize="none"
              autoCorrect={false}
            />
            
            <TouchableOpacity 
              style={[styles.button, { backgroundColor: theme.primary, marginTop: 14 }]}
              onPress={handleSaveOpenRouterKey}
              activeOpacity={0.9}
            >
              <Text style={styles.buttonText}>Save API Key</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* CHANGE PASSWORD */}
        <View style={[styles.section, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <View style={styles.sectionHeader}>
            <Lock color={theme.primary} size={20} />
            <View style={styles.sectionHeaderDetails}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Change Password</Text>
              <Text style={[styles.sectionSubtitle, { color: theme.subText }]}>Update your account login password</Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={styles.sectionBody}>
            <Text style={[styles.inputLabel, { color: theme.subText }]}>Current Password</Text>
            <View style={[styles.passwordRow, { borderColor: theme.inputBorder, backgroundColor: theme.inputBg }]}>
              <TextInput
                style={[styles.passwordInput, { color: theme.text }]}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Enter current password"
                placeholderTextColor={theme.subText}
                secureTextEntry={!showCurrentPw}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowCurrentPw(!showCurrentPw)}>
                {showCurrentPw
                  ? <EyeOff color={theme.subText} size={18} />
                  : <Eye color={theme.subText} size={18} />}
              </TouchableOpacity>
            </View>

            <Text style={[styles.inputLabel, { color: theme.subText, marginTop: 12 }]}>New Password</Text>
            <View style={[styles.passwordRow, { borderColor: theme.inputBorder, backgroundColor: theme.inputBg }]}>
              <TextInput
                style={[styles.passwordInput, { color: theme.text }]}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password (min 6 chars)"
                placeholderTextColor={theme.subText}
                secureTextEntry={!showNewPw}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowNewPw(!showNewPw)}>
                {showNewPw
                  ? <EyeOff color={theme.subText} size={18} />
                  : <Eye color={theme.subText} size={18} />}
              </TouchableOpacity>
            </View>

            <Text style={[styles.inputLabel, { color: theme.subText, marginTop: 12 }]}>Confirm New Password</Text>
            <View style={[styles.passwordRow, { borderColor: theme.inputBorder, backgroundColor: theme.inputBg }]}>
              <TextInput
                style={[styles.passwordInput, { color: theme.text }]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Re-enter new password"
                placeholderTextColor={theme.subText}
                secureTextEntry={!showConfirmPw}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowConfirmPw(!showConfirmPw)}>
                {showConfirmPw
                  ? <EyeOff color={theme.subText} size={18} />
                  : <Eye color={theme.subText} size={18} />}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.primary, marginTop: 14 }]}
              onPress={handleChangePassword}
              disabled={pwLoading}
              activeOpacity={0.9}
            >
              {pwLoading
                ? <ActivityIndicator color="#ffffff" size="small" />
                : <Text style={styles.buttonText}>Update Password</Text>}
            </TouchableOpacity>
          </View>
        </View>

        {/* SYSTEM DETAILS & CREDITS */}
        <View style={[styles.section, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <View style={styles.infoRow}>
            <User color={theme.primary} size={18} />
            <View style={styles.infoDetails}>
              <Text style={[styles.infoLabel, { color: theme.subText }]}>Orchard Owner</Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>mudasir</Text>
            </View>
          </View>
          
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          
          <View style={styles.infoRow}>
            <Shield color={theme.primary} size={18} />
            <View style={styles.infoDetails}>
              <Text style={[styles.infoLabel, { color: theme.subText }]}>Security Clearance</Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>Administrator</Text>
            </View>
          </View>
          
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          
          <View style={styles.infoRow}>
            <Info color={theme.primary} size={18} />
            <View style={styles.infoDetails}>
              <Text style={[styles.infoLabel, { color: theme.subText }]}>System Version</Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>AgroFlow v1.0</Text>
            </View>
          </View>
          
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          
          <View style={styles.infoRow}>
            <User color={theme.primary} size={18} />
            <View style={styles.infoDetails}>
              <Text style={[styles.infoLabel, { color: theme.subText }]}>Lead Engineer</Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>Burhan Hamid · Solo Developer</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.logoutButton, { backgroundColor: theme.danger }]}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <LogOut color="#ffffff" size={18} style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const lightTheme = {
  pageBg: '#f4f6f0',
  cardBg: '#ffffff',
  text: '#1a2e1c',
  subText: '#6b7b6e',
  border: '#e8eceb',
  inputBg: '#f4f6f0',
  inputBorder: '#dde3de',
  primary: '#4a7c59',
  primaryLight: '#eaf2ec',
  danger: '#c0392b'
};

const darkTheme = {
  pageBg: '#141a15',
  cardBg: '#1e2720',
  text: '#e8ede9',
  subText: '#8a9e8d',
  border: '#2a3a2d',
  inputBg: '#162019',
  inputBorder: '#2a3a2d',
  primary: '#5a9469',
  primaryLight: '#1a2e1c',
  danger: '#e74c3c'
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    padding: 16,
  },
  section: {
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  sectionHeaderDetails: {
    marginLeft: 12,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  sectionSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  sectionBody: {
    padding: 14,
  },
  divider: {
    height: 1,
    width: '100%',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
    fontWeight: '500',
  },
  button: {
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  infoDetails: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '550',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 8,
    marginTop: 8,
  },
  logoutText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  passwordInput: {
    flex: 1,
    height: 44,
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: '500',
    borderWidth: 0,
  },
  eyeBtn: {
    paddingHorizontal: 12,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
