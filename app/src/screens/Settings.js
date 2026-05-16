import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, useColorScheme, Alert, ImageBackground, Platform, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { User, Shield, Info, LogOut, MapPin, Navigation, Timer } from 'lucide-react-native';
import { ref, onValue, set } from 'firebase/database';
import { database } from '../config/firebase';
import * as Location from 'expo-location';

export default function Settings({ navigation }) {
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? darkTheme : lightTheme;

  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const [isLocating, setIsLocating] = useState(false);

  const [runtime, setRuntime] = useState('20');

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
    <ImageBackground 
      source={require('../../assets/orchard_bg.png')} 
      style={styles.background}
      blurRadius={Platform.OS === 'ios' ? 8 : 4}
    >
      <View style={[styles.overlay, { backgroundColor: theme.overlayBg }]} />
      <SafeAreaView style={styles.container}>
        <View style={[styles.header, { backgroundColor: 'rgba(255, 255, 255, 0.8)', borderBottomColor: theme.primary }]}>
          <Text style={[styles.title, { color: '#14532d' }]}>System Settings</Text>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
          
          <View style={[styles.section, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <View style={styles.row}>
              <MapPin color={theme.primary} size={24} />
              <View style={styles.rowTextContainer}>
                <Text style={[styles.rowTitle, { color: theme.text }]}>Orchard Location</Text>
                <Text style={[styles.rowSubtitle, { color: theme.subText }]}>Used for weather forecasting</Text>
              </View>
            </View>
            
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            
            <View style={{ padding: 16 }}>
              <Text style={{color: theme.text, fontWeight: 'bold', marginBottom: 6}}>Latitude</Text>
              <TextInput 
                style={[styles.input, { borderColor: theme.border, color: theme.text }]}
                value={lat}
                onChangeText={setLat}
                keyboardType="numeric"
                placeholder="e.g. 34.0522"
                placeholderTextColor={theme.subText}
              />
              
              <Text style={{color: theme.text, fontWeight: 'bold', marginBottom: 6, marginTop: 12}}>Longitude</Text>
              <TextInput 
                style={[styles.input, { borderColor: theme.border, color: theme.text }]}
                value={lon}
                onChangeText={setLon}
                keyboardType="numeric"
                placeholder="e.g. -118.2437"
                placeholderTextColor={theme.subText}
              />
              
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
                <TouchableOpacity 
                  style={[styles.actionBtn, { backgroundColor: theme.primary, flex: 1, marginRight: 8 }]}
                  onPress={handleSaveLocation}
                >
                  <Text style={{ color: '#fff', fontWeight: '900', textAlign: 'center', letterSpacing: 0.5 }}>SAVE</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.actionBtn, { backgroundColor: '#15803d', flex: 1, marginLeft: 8, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }]}
                  onPress={handleGetCurrentLocation}
                  disabled={isLocating}
                >
                  {isLocating ? <ActivityIndicator color="#fff" size="small" /> : <Navigation color="#fff" size={16} style={{marginRight: 6}}/>}
                  <Text style={{ color: '#fff', fontWeight: '900', textAlign: 'center', letterSpacing: 0.5 }}>CURRENT</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={[styles.section, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <View style={styles.row}>
              <Timer color={theme.primary} size={24} />
              <View style={styles.rowTextContainer}>
                <Text style={[styles.rowTitle, { color: theme.text }]}>Pump Motor Protection</Text>
                <Text style={[styles.rowSubtitle, { color: theme.subText }]}>Maximum continuous runtime (minutes)</Text>
              </View>
            </View>
            
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            
            <View style={{ padding: 16 }}>
              <TextInput 
                style={[styles.input, { borderColor: theme.border, color: theme.text }]}
                value={runtime}
                onChangeText={setRuntime}
                keyboardType="numeric"
                placeholder="e.g. 20"
                placeholderTextColor={theme.subText}
              />
              
              <TouchableOpacity 
                style={[styles.actionBtn, { backgroundColor: theme.primary, marginTop: 16 }]}
                onPress={handleSaveRuntime}
              >
                <Text style={{ color: '#fff', fontWeight: '900', textAlign: 'center', letterSpacing: 0.5 }}>SAVE RUNTIME LIMIT</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.section, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <View style={styles.row}>
              <User color={theme.primary} size={24} />
              <View style={styles.rowTextContainer}>
                <Text style={[styles.rowTitle, { color: theme.text }]}>Authorized Officer</Text>
                <Text style={[styles.rowSubtitle, { color: theme.subText }]}>mudasir</Text>
              </View>
            </View>
            
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            
            <View style={styles.row}>
              <Shield color={theme.primary} size={24} />
              <View style={styles.rowTextContainer}>
                <Text style={[styles.rowTitle, { color: theme.text }]}>Security Clearance</Text>
                <Text style={[styles.rowSubtitle, { color: theme.subText }]}>Administrator</Text>
              </View>
            </View>
          </View>

          <View style={[styles.section, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <View style={styles.row}>
              <Info color={theme.primary} size={24} />
              <View style={styles.rowTextContainer}>
                <Text style={[styles.rowTitle, { color: theme.text }]}>System Version</Text>
                <Text style={[styles.rowSubtitle, { color: theme.subText }]}>AgroFlow v1.0</Text>
              </View>
            </View>
            
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            
            <View style={styles.row}>
              <User color={theme.primary} size={24} />
              <View style={styles.rowTextContainer}>
                <Text style={[styles.rowTitle, { color: theme.text }]}>Developer Credits</Text>
                <Text style={[styles.rowSubtitle, { color: theme.subText }]}>Burhan Hamid</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.logoutButton, { backgroundColor: theme.danger }]}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <LogOut color="#ffffff" size={20} style={{ marginRight: 8 }} />
            <Text style={styles.logoutText}>TERMINATE SESSION</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const lightTheme = {
  overlayBg: 'rgba(240, 253, 244, 0.85)',
  cardBg: 'rgba(255, 255, 255, 0.95)',
  text: '#14532d',
  subText: '#166534',
  border: '#bbf7d0',
  primary: '#dc2626',
  danger: '#ef4444'
};

const darkTheme = {
  overlayBg: 'rgba(2, 44, 34, 0.85)',
  cardBg: 'rgba(2, 44, 34, 0.95)',
  text: '#f0fdf4',
  subText: '#a7f3d0',
  border: '#065f46',
  primary: '#ef4444',
  danger: '#ef4444'
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
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  content: {
    padding: 16,
  },
  section: {
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 20,
    elevation: 2, // Subtle crisp shadow
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  rowTextContainer: {
    marginLeft: 16,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  rowSubtitle: {
    fontSize: 14,
    marginTop: 4,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    width: '100%',
  },
  input: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    fontSize: 16,
    backgroundColor: 'rgba(255,255,255,0.5)'
  },
  actionBtn: {
    paddingVertical: 12,
    borderRadius: 6,
    elevation: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#7f1d1d', // Dark red border
    elevation: 2,
  },
  logoutText: {
    color: '#ffffff',
    fontWeight: '900',
    letterSpacing: 1.5,
  }
});
