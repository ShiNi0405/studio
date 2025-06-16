import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const popularStyles = [
  { id: '1', name: 'Crew Cut', category: 'men' },
  { id: '2', name: 'Fade', category: 'men' },
  { id: '3', name: 'Quiff', category: 'men' },
  { id: '4', name: 'Bob Cut', category: 'women' },
  { id: '5', name: 'Pixie Cut', category: 'women' },
  { id: '6', name: 'Long Layers', category: 'women' },
];

export default function BrowseStylesScreen({ navigation }: any) {
  const [selectedCategory, setSelectedCategory] = React.useState('men');

  const filteredStyles = popularStyles.filter(style => style.category === selectedCategory);

  const renderStyleCard = ({ item }: any) => (
    <TouchableOpacity style={styles.styleCard}>
      <View style={styles.stylePlaceholder}>
        <Text style={styles.styleEmoji}>✂️</Text>
      </View>
      <Text style={styles.styleName}>{item.name}</Text>
      <View style={styles.styleActions}>
        <TouchableOpacity style={styles.tryOnButton}>
          <Text style={styles.tryOnButtonText}>Try On</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.bookButton}
          onPress={() => navigation.navigate('Barbers')}
        >
          <Text style={styles.bookButtonText}>Book Style</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Browse Styles</Text>
        <Text style={styles.subtitle}>
          Explore popular hairstyles and visualize them
        </Text>
      </View>

      <View style={styles.categorySelector}>
        <TouchableOpacity
          style={[
            styles.categoryButton,
            selectedCategory === 'men' && styles.categoryButtonActive
          ]}
          onPress={() => setSelectedCategory('men')}
        >
          <Text style={[
            styles.categoryButtonText,
            selectedCategory === 'men' && styles.categoryButtonTextActive
          ]}>
            Men's Styles
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.categoryButton,
            selectedCategory === 'women' && styles.categoryButtonActive
          ]}
          onPress={() => setSelectedCategory('women')}
        >
          <Text style={[
            styles.categoryButtonText,
            selectedCategory === 'women' && styles.categoryButtonTextActive
          ]}>
            Women's Styles
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredStyles}
        renderItem={renderStyleCard}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.stylesGrid}
        columnWrapperStyle={styles.row}
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
  categorySelector: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginBottom: 24,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 4,
  },
  categoryButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  categoryButtonActive: {
    backgroundColor: '#3EB4E8',
  },
  categoryButtonText: {
    color: '#3EB4E8',
    fontWeight: '600',
  },
  categoryButtonTextActive: {
    color: 'white',
  },
  stylesGrid: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  row: {
    justifyContent: 'space-between',
  },
  styleCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    width: '48%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stylePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E0F7FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  styleEmoji: {
    fontSize: 32,
  },
  styleName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  styleActions: {
    width: '100%',
    gap: 8,
  },
  tryOnButton: {
    backgroundColor: '#E0F7FA',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  tryOnButtonText: {
    color: '#3EB4E8',
    fontWeight: '600',
    fontSize: 14,
  },
  bookButton: {
    backgroundColor: '#3EB4E8',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  bookButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
});