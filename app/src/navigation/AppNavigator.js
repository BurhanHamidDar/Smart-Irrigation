import React from 'react';
import { useColorScheme } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Splash from '../screens/Splash';
import Login from '../screens/Login';
import TabNavigator from './TabNavigator';
import Weather from '../screens/Weather';
import ChatbotScreen from '../screens/ChatbotScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const isDark = useColorScheme() === 'dark';
  
  return (
    <Stack.Navigator 
      initialRouteName="Splash"
      screenOptions={{
        headerStyle: {
          backgroundColor: isDark ? '#0f172a' : '#1e3a8a',
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen 
        name="Splash" 
        component={Splash} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="Login" 
        component={Login} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="Dashboard" 
        component={TabNavigator} 
        options={{ 
          headerShown: false,
          gestureEnabled: false     
        }} 
      />
      <Stack.Screen 
        name="Weather" 
        component={Weather} 
        options={{ 
          headerShown: true,
          title: "Orchard Weather",
          headerStyle: {
            backgroundColor: isDark ? '#022c22' : '#f0fdf4',
          },
          headerTintColor: isDark ? '#f0fdf4' : '#14532d',
        }} 
      />
      <Stack.Screen 
        name="Advisor" 
        component={ChatbotScreen} 
        options={{ 
          headerShown: true,
          title: "AgroBot Advisor",
          headerStyle: {
            backgroundColor: isDark ? '#064e3b' : '#d1fae5',
          },
          headerTintColor: isDark ? '#f0fdf4' : '#065f46',
        }} 
      />

    </Stack.Navigator>
  );
}
