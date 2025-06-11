import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

// Screens
import HomeScreen from '../screens/main/HomeScreen';
import BarbersScreen from '../screens/main/BarbersScreen';
import BarberProfileScreen from '../screens/main/BarberProfileScreen';
import BookingScreen from '../screens/main/BookingScreen';
import DashboardScreen from '../screens/main/DashboardScreen';
import MyBookingsScreen from '../screens/main/MyBookingsScreen';
import BookingRequestsScreen from '../screens/main/BookingRequestsScreen';
import MyProfileScreen from '../screens/main/MyProfileScreen';
import StyleSuggestionScreen from '../screens/main/StyleSuggestionScreen';
import BrowseStylesScreen from '../screens/main/BrowseStylesScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="HomeMain" 
        component={HomeScreen} 
        options={{ title: 'Barbermatch' }}
      />
      <Stack.Screen 
        name="StyleSuggestion" 
        component={StyleSuggestionScreen}
        options={{ title: 'AI Hairstyle Advisor' }}
      />
      <Stack.Screen 
        name="BrowseStyles" 
        component={BrowseStylesScreen}
        options={{ title: 'Browse Styles' }}
      />
    </Stack.Navigator>
  );
}

function BarbersStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="BarbersMain" 
        component={BarbersScreen} 
        options={{ title: 'Find Barbers' }}
      />
      <Stack.Screen 
        name="BarberProfile" 
        component={BarberProfileScreen}
        options={{ title: 'Barber Profile' }}
      />
      <Stack.Screen 
        name="Booking" 
        component={BookingScreen}
        options={{ title: 'Book Appointment' }}
      />
    </Stack.Navigator>
  );
}

function DashboardStack() {
  const { user } = useAuth();
  
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="DashboardMain" 
        component={DashboardScreen} 
        options={{ title: 'Dashboard' }}
      />
      <Stack.Screen 
        name="MyBookings" 
        component={MyBookingsScreen}
        options={{ title: 'My Bookings' }}
      />
      {user?.role === 'barber' && (
        <>
          <Stack.Screen 
            name="BookingRequests" 
            component={BookingRequestsScreen}
            options={{ title: 'Booking Requests' }}
          />
          <Stack.Screen 
            name="MyProfile" 
            component={MyProfileScreen}
            options={{ title: 'My Profile' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function MainNavigator() {
  const { user } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Barbers') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Dashboard') {
            iconName = focused ? 'grid' : 'grid-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3EB4E8',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Barbers" component={BarbersStack} />
      <Tab.Screen name="Dashboard" component={DashboardStack} />
    </Tab.Navigator>
  );
}