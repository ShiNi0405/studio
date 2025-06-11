import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen({ navigation }: any) {
  const { user } = useAuth();

  const customerActions = [
    {
      title: "AI Hairstyle Advisor",
      description: "Get personalized hairstyle recommendations",
      icon: "sparkles",
      onPress: () => navigation.navigate('StyleSuggestion')
    },
    {
      title: "Browse Styles",
      description: "Explore popular hairstyles and try them on",
      icon: "color-palette",
      onPress: () => navigation.navigate('BrowseStyles')
    },
    {
      title: "Find Barbers",
      description: "Discover talented barbers near you",
      icon: "search",
      onPress: () => navigation.navigate('Barbers', { screen: 'BarbersMain' })
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>
            Welcome{user?.displayName ? `, ${user.displayName.split(' ')[0]}` : ''}!
          </Text>
          <Text style={styles.subtitle}>
            {user?.role === 'barber' 
              ? "Manage your profile and bookings" 
              : "Find your perfect look and book appointments"
            }
          </Text>
        </View>

        {user?.role === 'customer' && (
          <View style={styles.actionsContainer}>
            <Text style={styles.sectionTitle}>What would you like to do today?</Text>
            {customerActions.map((action, index) => (
              <TouchableOpacity 
                key={index}
                style={styles.actionCard}
                onPress={action.onPress}
              >
                <View style={styles.actionIcon}>
                  <Ionicons name={action.icon as any} size={24} color="#3EB4E8" />
                </View>
                <View style={styles.actionContent}>
                  <Text style={styles.actionTitle}>{action.title}</Text>
                  <Text style={styles.actionDescription}>{action.description}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.featuresContainer}>
          <Text style={styles.sectionTitle}>Features</Text>
          
          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>✂️</Text>
            <Text style={styles.featureTitle}>Expert Barbers</Text>
            <Text style={styles.featureDescription}>
              Connect with skilled and reviewed barbers in your area
            </Text>
          </View>

          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>📅</Text>
            <Text style={styles.featureTitle}>Easy Booking</Text>
            <Text style={styles.featureDescription}>
              Seamless appointment scheduling in just a few taps
            </Text>
          </View>

          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>✨</Text>
            <Text style={styles.featureTitle}>Style Ideas</Text>
            <Text style={styles.featureDescription}>
              Explore popular styles and visualize them on yourself
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E0F7FA',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#3EB4E8',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  actionsContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  actionCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E0F7FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: '#666',
  },
  featuresContainer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  featureCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});