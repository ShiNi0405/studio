import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Mock data for demonstration
const mockBarbers = [
  {
    id: '1',
    displayName: 'John Smith',
    specialties: ['Fades', 'Beard Trims'],
    location: 'Downtown',
    rating: 4.8,
    reviewCount: 42,
    bio: 'Professional barber with 10 years of experience'
  },
  {
    id: '2',
    displayName: 'Mike Johnson',
    specialties: ['Classic Cuts', 'Modern Styles'],
    location: 'Midtown',
    rating: 4.6,
    reviewCount: 28,
    bio: 'Specializing in modern and classic hairstyles'
  }
];

export default function BarbersScreen({ navigation }: any) {
  const [barbers, setBarbers] = useState(mockBarbers);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredBarbers = barbers.filter(barber =>
    barber.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    barber.specialties.join(', ').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderBarberCard = ({ item }: any) => (
    <TouchableOpacity 
      style={styles.barberCard}
      onPress={() => navigation.navigate('BarberProfile', { barberId: item.id })}
    >
      <View style={styles.barberAvatar}>
        <Text style={styles.barberInitial}>{item.displayName[0]}</Text>
      </View>
      
      <View style={styles.barberInfo}>
        <Text style={styles.barberName}>{item.displayName}</Text>
        <Text style={styles.barberSpecialties}>{item.specialties.join(', ')}</Text>
        <Text style={styles.barberLocation}>{item.location}</Text>
        
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={16} color="#FFD700" />
          <Text style={styles.rating}>{item.rating} ({item.reviewCount} reviews)</Text>
        </View>
      </View>
      
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Find Your Barber</Text>
        <Text style={styles.subtitle}>Discover talented barbers near you</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or specialty..."
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
      </View>

      <FlatList
        data={filteredBarbers}
        renderItem={renderBarberCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E0F7FA',
  },
  header: {
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#3EB4E8',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 24,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  listContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  barberCard: {
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
  barberAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3EB4E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  barberInitial: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  barberInfo: {
    flex: 1,
  },
  barberName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  barberSpecialties: {
    fontSize: 14,
    color: '#3EB4E8',
    marginBottom: 4,
  },
  barberLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
});