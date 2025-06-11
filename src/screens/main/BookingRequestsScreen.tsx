import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const mockRequests = [
  {
    id: '1',
    customerName: 'Alice Johnson',
    service: 'Haircut',
    date: '2024-01-16',
    time: '11:00',
    status: 'pending',
    price: 25,
    notes: 'Looking for a modern bob cut'
  },
  {
    id: '2',
    customerName: 'Bob Wilson',
    service: 'Hair + Beard',
    date: '2024-01-17',
    time: '15:00',
    status: 'pending',
    price: 35,
    notes: ''
  }
];

export default function BookingRequestsScreen() {
  const handleAccept = (requestId: string) => {
    Alert.alert(
      'Accept Booking',
      'Are you sure you want to accept this booking request?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Accept', onPress: () => console.log('Accepted:', requestId) }
      ]
    );
  };

  const handleReject = (requestId: string) => {
    Alert.alert(
      'Reject Booking',
      'Are you sure you want to reject this booking request?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reject', style: 'destructive', onPress: () => console.log('Rejected:', requestId) }
      ]
    );
  };

  const renderRequestCard = ({ item }: any) => (
    <View style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <Text style={styles.customerName}>{item.customerName}</Text>
        <Text style={styles.price}>${item.price}</Text>
      </View>
      
      <Text style={styles.serviceName}>{item.service}</Text>
      
      <View style={styles.requestDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar" size={16} color="#666" />
          <Text style={styles.detailText}>{item.date} at {item.time}</Text>
        </View>
        
        {item.notes && (
          <View style={styles.detailRow}>
            <Ionicons name="document-text" size={16} color="#666" />
            <Text style={styles.detailText}>{item.notes}</Text>
          </View>
        )}
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => handleReject(item.id)}
        >
          <Text style={styles.rejectButtonText}>Reject</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.acceptButton]}
          onPress={() => handleAccept(item.id)}
        >
          <Text style={styles.acceptButtonText}>Accept</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Booking Requests</Text>
        <Text style={styles.subtitle}>Manage incoming appointment requests</Text>
      </View>

      <FlatList
        data={mockRequests}
        renderItem={renderRequestCard}
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
  listContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  requestCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  customerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3EB4E8',
  },
  serviceName: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  requestDetails: {
    gap: 8,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  acceptButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  rejectButtonText: {
    color: '#666',
    fontWeight: '600',
  },
});