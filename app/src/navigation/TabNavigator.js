import React from 'react';
import { useColorScheme } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LayoutDashboard, Bell, Settings as SettingsIcon, CalendarClock } from 'lucide-react-native';

import Dashboard from '../screens/Dashboard';
import Notifications from '../screens/Notifications';
import Settings from '../screens/Settings';
import Schedule from '../screens/Schedule';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? darkTheme : lightTheme;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.tabBg,
          borderTopColor: theme.border,
          borderTopWidth: 1,
          elevation: 8,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: theme.activeTint,
        tabBarInactiveTintColor: theme.inactiveTint,
        tabBarLabelStyle: {
          fontWeight: '700',
          fontSize: 11,
          textTransform: 'uppercase',
        }
      }}
    >
      <Tab.Screen 
        name="DashboardTab" 
        component={Dashboard} 
        options={{
          title: 'Control',
          tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} />
        }}
      />
      <Tab.Screen 
        name="Schedule" 
        component={Schedule} 
        options={{
          title: 'Schedule',
          tabBarIcon: ({ color, size }) => <CalendarClock color={color} size={size} />
        }}
      />
      <Tab.Screen 
        name="Logs" 
        component={Notifications} 
        options={{
          title: 'Logs',
          tabBarIcon: ({ color, size }) => <Bell color={color} size={size} />
        }}
      />
      <Tab.Screen 
        name="SettingsTab" 
        component={Settings} 
        options={{
          title: 'System',
          tabBarIcon: ({ color, size }) => <SettingsIcon color={color} size={size} />
        }}
      />
    </Tab.Navigator>
  );
}

const lightTheme = {
  tabBg: '#ffffff',
  border: '#e2e8f0',
  activeTint: '#1e3a8a', // Deep Navy
  inactiveTint: '#94a3b8'
};

const darkTheme = {
  tabBg: '#0f172a',
  border: '#1e293b',
  activeTint: '#ea580c', // Saffron
  inactiveTint: '#475569'
};
