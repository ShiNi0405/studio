import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

export default function StyleSuggestionScreen({ navigation }: any) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [styleType, setStyleType] = useState<string>('');

  const styleTypes = ['Casual', 'Trendy', 'Professional', 'Classic', 'Edgy'];

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions to use this feature.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera permissions to use this feature.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const handleGetSuggestion = () => {
    if (!selectedImage || !styleType) {
      Alert.alert('Missing Information', 'Please provide your photo and select a style type.');
      return;
    }

    // Mock AI suggestion
    Alert.alert(
      'AI Suggestion',
      `Based on your photo and ${styleType} preference, we recommend a "Modern Textured Quiff" - this style would complement your face shape and give you that ${styleType.toLowerCase()} look you're going for!`,
      [
        { text: 'Find Barbers', onPress: () => navigation.navigate('Barbers') },
        { text: 'OK' }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>AI Hairstyle Advisor</Text>
          <Text style={styles.subtitle}>
            Upload your photo and get personalized hairstyle recommendations
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Step 1: Your Photo</Text>
          
          {!selectedImage ? (
            <View style={styles.photoOptions}>
              <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
                <Ionicons name="image" size={24} color="#3EB4E8" />
                <Text style={styles.photoButtonText}>Choose from Gallery</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
                <Ionicons name="camera" size={24} color="#3EB4E8" />
                <Text style={styles.photoButtonText}>Take Photo</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.photoPreview}>
              <View style={styles.photoPlaceholder}>
                <Ionicons name="person" size={48} color="#3EB4E8" />
                <Text style={styles.photoText}>Photo Selected</Text>
              </View>
              <TouchableOpacity 
                style={styles.changePhotoButton}
                onPress={() => setSelectedImage(null)}
              >
                <Text style={styles.changePhotoText}>Change Photo</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Step 2: Style Preference</Text>
          
          <View style={styles.styleOptions}>
            {styleTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.styleButton,
                  styleType === type && styles.styleButtonActive
                ]}
                onPress={() => setStyleType(type)}
              >
                <Text style={[
                  styles.styleButtonText,
                  styleType === type && styles.styleButtonTextActive
                ]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity 
          style={[
            styles.suggestionButton,
            (!selectedImage || !styleType) && styles.suggestionButtonDisabled
          ]}
          onPress={handleGetSuggestion}
          disabled={!selectedImage || !styleType}
        >
          <Ionicons name="sparkles" size={20} color="white" />
          <Text style={styles.suggestionButtonText}>Get AI Suggestion</Text>
        </TouchableOpacity>
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
    fontSize: 28,
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
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  photoOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  photoButton: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  photoButtonText: {
    color: '#3EB4E8',
    fontWeight: '600',
    marginTop: 8,
  },
  photoPreview: {
    alignItems: 'center',
  },
  photoPlaceholder: {
    backgroundColor: 'white',
    width: 150,
    height: 150,
    borderRadius: 75,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  photoText: {
    color: '#3EB4E8',
    fontWeight: '600',
    marginTop: 8,
  },
  changePhotoButton: {
    marginTop: 12,
  },
  changePhotoText: {
    color: '#3EB4E8',
    textDecorationLine: 'underline',
  },
  styleOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  styleButton: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#3EB4E8',
  },
  styleButtonActive: {
    backgroundColor: '#3EB4E8',
  },
  styleButtonText: {
    color: '#3EB4E8',
    fontWeight: '600',
  },
  styleButtonTextActive: {
    color: 'white',
  },
  suggestionButton: {
    backgroundColor: '#3EB4E8',
    marginHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  suggestionButtonDisabled: {
    opacity: 0.5,
  },
  suggestionButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
});