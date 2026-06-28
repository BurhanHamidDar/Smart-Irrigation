import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, useColorScheme, ActivityIndicator, Alert, TouchableOpacity, StatusBar } from 'react-native';
import { Bell, AlertTriangle, Droplets, CheckCircle, Trash2, ArrowLeft } from 'lucide-react-native';
import { ref, onValue, query, limitToLast, remove } from 'firebase/database';
import { database } from '../config/firebase';

export default function Notifications({ navigation }) {
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? darkTheme : lightTheme;

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const notifsRef = query(ref(database, 'notifications'), limitToLast(50));
    const unsubscribe = onValue(notifsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
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
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const renderItem = ({ item }) => {
    let IconComponent = Bell;
    let iconColor = theme.primary;
    let iconBg = theme.primaryLight;
    
    if (item.type === 'alert') {
      IconComponent = AlertTriangle;
      iconColor = theme.danger;
      iconBg = '#fef2f2';
    } else if (item.type === 'info') {
      IconComponent = Droplets;
      iconColor = '#3b82f6';
      iconBg = '#eff6ff';
    } else if (item.type === 'success') {
      IconComponent = CheckCircle;
      iconColor = '#10b981';
      iconBg = '#eaf7f0';
    }

    return (
      <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
            <IconComponent color={iconColor} size={16} />
          </View>
          <Text style={[styles.cardTitle, { color: theme.text }]}>{item.title}</Text>
          <Text style={[styles.cardTime, { color: theme.subText }]}>{formatTime(item.timestamp)}</Text>
        </View>
        <Text style={[styles.cardDesc, { color: theme.subText }]}>{item.desc}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.pageBg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.cardBg} />
      
      <View style={[styles.header, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft color={theme.text} size={20} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]}>Activity Logs</Text>
        </View>
        {notifications.length > 0 && (
          <TouchableOpacity onPress={handleClearLogs} style={[styles.clearBtn, { backgroundColor: theme.danger }]} activeOpacity={0.8}>
            <Trash2 color="#ffffff" size={16} />
          </TouchableOpacity>
        )}
      </View>
      
      {loading ? (
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : notifications.length === 0 ? (
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24}}>
          <Bell color={theme.subText} size={36} style={{ opacity: 0.5, marginBottom: 12 }} />
          <Text style={{color: theme.subText, fontSize: 13, fontWeight: '600', textTransform: 'uppercase'}}>No activity logs found.</Text>
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
  );
}

const lightTheme = {
  pageBg: '#f4f6f0',
  cardBg: '#ffffff',
  text: '#1a2e1c',
  subText: '#6b7b6e',
  border: '#e8eceb',
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
    justifyContent: 'space-between',
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
  clearBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContainer: {
    padding: 16,
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  cardTime: {
    fontSize: 10,
    fontWeight: '550',
  },
  cardDesc: {
    fontSize: 12,
    lineHeight: 18,
    marginLeft: 36,
    fontWeight: '500',
  }
});
