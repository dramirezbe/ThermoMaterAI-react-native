// index.tsx
import React, { useState } from 'react';
import { Button, ScrollView, StyleSheet, Text, Alert, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import NumberExtractorComponent from './components/NumberExtractorComponent'; // Import the new component

/**
 * Main application component.
 * Handles image selection and delegates processing/extraction/modification
 * to the NumberExtractorComponent. Receives final numbers back to start
 * the main process.
 */
export default function App() {
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [finalNumbers, setFinalNumbers] = useState<[string, string] | null>(null);

  /**
   * Launch image library and let the user pick an image.
   * Resets previous state and handles permission prompting.
   */
  const handlePickImage = async (): Promise<void> => {
    // Reset state related to the previous process
    setSelectedImageUri(null);
    setFinalNumbers(null);

    // Request media library permission
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Denied', 'Access to media library is required.');
      return;
    }

    // Open image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1, // You might adjust quality if image size is a concern for processing
    });

    if (!result.canceled) {
      // Set the URI. This will cause NumberExtractorComponent to render.
      setSelectedImageUri(result.assets[0].uri);
      // The rest of the flow (processing, etc.) is handled by the child component
    }
  };

  /**
   * Callback function passed to NumberExtractorComponent.
   * Called when the user has accepted/modified the numbers and is ready to proceed.
   */
  const handleExtractionComplete = (numbers: [string, string]) => {
      console.log('Final numbers ready:', numbers);
      setFinalNumbers(numbers);
       Alert.alert('Ready to Start', `Numbers for game: ${numbers[0]} and ${numbers[1]}`);
       // Add your actual game/process start logic here using `numbers`
  };

  /**
   * Optional callback to handle resets from the child component (e.g., processing failed).
   * This could be used to hide the child component or show a message.
   */
   const handleProcessReset = () => {
       console.log('Number extraction process reset/failed.');
   };


  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Button title={selectedImageUri ? "Pick Another Image" : "Select Image"} onPress={handlePickImage} />

      {/* Render the NumberExtractorComponent only when an image is selected */}
      {selectedImageUri ? (
        <NumberExtractorComponent
          imageUri={selectedImageUri}
          onExtractionComplete={handleExtractionComplete}
          onProcessReset={handleProcessReset}
        />
      ) : (
        // Message when no image is selected yet
        <View style={styles.messageContainer}>
             <Text style={styles.messageText}>Select an image to begin</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
    minHeight: '100%', // Ensure scroll view takes full height
  },
  title: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 20,
      marginTop: 40, // Add space from top status bar
  },
  messageContainer: {
      marginTop: 30,
      alignItems: 'center',
  },
  messageText: {
      fontSize: 16,
      textAlign: 'center',
      color: '#555',
  },
});