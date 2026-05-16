import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, useColorScheme, ActivityIndicator, Alert, TouchableOpacity, ImageBackground, Platform } from 'react-native';
import { Bell, AlertTriangle, Droplets, CheckCircle, Trash2 } from 'lucide-react-native';
import { ref, onValue, query, limitToLast, remove } from 'firebase/database';
import { database } from '../config/firebase';

export default function Notifications() {
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? darkTheme : lightTheme;

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch last 50 notifications
    const notifsRef = query(ref(database, 'notifications'), limitToLast(50));
    const unsubscribe = onValue(notifsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Convert object to array, add id, and sort by timestamp descending
        const parsedNotifs = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        })).sort((a, b) => b.timestamp - a.timestamp);
        
        setNotifications(parsedNotifs);
      } else {
        setNotifications([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleClearLogs = () => {
    if (notifications.length === 0) return;
    
    Alert.alert(
      "Clear System Logs",
      "Are you sure you want to permanently delete all logs?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete All", 
          style: "destructive",
          onPress: async () => {
            try {
              await remove(ref(database, 'notifications'));
            } catch (error) {
              Alert.alert('Error', 'Failed to clear logs.');
            }
          }
        }
      ]
    );
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hr${diffHours > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const renderItem = ({ item }) => {
    let IconComponent = Bell;
    let iconColor = theme.primary;
    
    if (item.type === 'alert') {
      IconComponent = AlertTriangle;
      iconColor = theme.danger;
    } else if (item.type === 'info') {
      IconComponent = Droplets;
      iconColor = theme.primary;
    } else if (item.type === 'success') {
      IconComponent = CheckCircle;
      iconColor = theme.success;
    }

    return (
      <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
        <View style={styles.cardHeader}>
          <IconComponent color={iconColor} size={20} />
          <Text style={[styles.cardTitle, { color: theme.text }]}>{item.title}</Text>
          <View style={styles.spacer} />
          <Text style={[styles.cardTime, { color: theme.subText }]}>{formatTime(item.timestamp)}</Text>
        </View>
        <Text style={[styles.cardDesc, { color: theme.subText }]}>{item.desc}</Text>
      </View>
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
          <Text style={[styles.title, { color: '#14532d' }]}>System Logs</Text>
          {notifications.length > 0 && (
            <TouchableOpacity onPress={handleClearLogs} style={[styles.clearBtn, { backgroundColor: theme.danger, borderRadius: 8 }]} activeOpacity={0.7}>
              <Trash2 color="#ffffff" size={24} />
            </TouchableOpacity>
          )}
        </View>
        
        {loading ? (
          <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : notifications.length === 0 ? (
          <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
            <Text style={{color: theme.subText, fontSize: 16, fontWeight: '700', textTransform: 'uppercase'}}>No system logs found.</Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContainer}
          />
        )}
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
  danger: '#ef4444',
  success: '#15803d'
};

const darkTheme = {
  overlayBg: 'rgba(2, 44, 34, 0.85)',
  cardBg: 'rgba(2, 44, 34, 0.95)',
  text: '#f0fdf4',
  subText: '#a7f3d0',
  border: '#065f46',
  primary: '#ef4444',
  danger: '#ef4444',
  success: '#22c55e'
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  clearBtn: {
    padding: 8,
  },
  listContainer: {
    padding: 16,
  },
  card: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 10,
    textTransform: 'uppercase',
  },
  spacer: {
    flex: 1,
  },
  cardTime: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardDesc: {
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 30, // Align with title
    fontWeight: '500',
  }
});
