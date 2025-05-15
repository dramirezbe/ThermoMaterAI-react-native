// components/NumberExtractorComponent.tsx
import React, { useState, useEffect } from 'react';
import { Button, Image, ScrollView, StyleSheet, Text, ActivityIndicator, Alert, View, TextInput } from 'react-native';
import { processImageAndExtractNumbers } from '../../utils/processImage'; // Assuming this utility exists

interface NumberExtractorProps {
  /** The URI of the image selected by the parent component. */
  imageUri: string | null;
  /**
   * Callback function called when the user has accepted or modified the numbers
   * and the process is ready to start. Receives the final two numbers.
   */
  onExtractionComplete: (numbers: [string, string]) => void;
  /**
   * Optional callback function called when the component has finished processing
   * or the user has cancelled modification, allowing the parent to potentially
   * hide the component or reset state if needed.
   */
  onProcessReset?: () => void;
}

/**
 * A component that receives an image URI, processes it to extract numbers,
 * allows the user to view and modify them, and then provides the final numbers
 * via a callback.
 */
export default function NumberExtractorComponent({ imageUri, onExtractionComplete, onProcessReset }: NumberExtractorProps) {
  // State to hold all extracted numbers (primarily for debug or future use)
  const [allExtractedNumbers, setAllExtractedNumbers] = useState<string[]>([]);
  // State to hold the two numbers specifically displayed/modified by the user
  const [displayedNumbers, setDisplayedNumbers] = useState<[string, string] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // State for handling number modification
  const [isModifyingNumbers, setIsModifyingNumbers] = useState<boolean>(false);
  const [numberInput1, setNumberInput1] = useState<string>('');
  const [numberInput2, setNumberInput2] = useState<string>('');

  // State to control the visibility of the Start button (managed internally now)
  const [showStartButton, setShowStartButton] = useState<boolean>(false);

  // Reset state when a new image URI is provided (or cleared)
  useEffect(() => {
      // Only reset if imageUri changes from non-null to non-null, or null
      // Avoids resetting when component first mounts with null imageUri
      if (imageUri !== null) {
          // Reset internal state whenever a new image is selected
          setAllExtractedNumbers([]);
          setDisplayedNumbers(null);
          setLoading(false);
          setIsModifyingNumbers(false);
          setNumberInput1('');
          setNumberInput2('');
          setShowStartButton(false);
          // Optionally call onProcessReset here if parent needs notification on image *change*
      } else {
           // Reset all state when imageUri becomes null
           setAllExtractedNumbers([]);
           setDisplayedNumbers(null);
           setLoading(false);
           setIsModifyingNumbers(false);
           setNumberInput1('');
           setNumberInput2('');
           setShowStartButton(false);
      }
  }, [imageUri]); // Depend on imageUri prop

  /**
   * Process the selected image: crop, perform OCR, and extract numbers.
   * Updates state to show extracted numbers or prompts for modification.
   * Provides user feedback via loading indicator and error alerts.
   */
  const handleProcessImage = async (): Promise<void> => {
    if (!imageUri) {
      // This case should ideally not happen if the button is conditionally rendered
      Alert.alert('Error', 'No image URI available for processing.');
      return;
    }

    setLoading(true);
    // Clear previous results before processing
    setAllExtractedNumbers([]);
    setDisplayedNumbers(null);
    setIsModifyingNumbers(false);
    setShowStartButton(false);

    try {
      const numbers = await processImageAndExtractNumbers(imageUri);
      setAllExtractedNumbers(numbers); // Store all found numbers

      if (numbers.length >= 2) {
        // If at least two numbers are found, take the first two
        setDisplayedNumbers([numbers[0], numbers[1]]);
        // Do NOT show the start button yet, await user action (Accept or Modify)
      } else {
        // Not enough numbers found
        setDisplayedNumbers(null);
        Alert.alert('Extraction Failed', 'Could not find at least two numbers in the selected area.');
         // Optionally call onProcessReset if the process failed to find numbers
        if (onProcessReset) {
           onProcessReset();
        }
      }

    } catch (error: unknown) {
      console.error('Error processing image:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Processing Error', `An error occurred: ${message}`);
      setDisplayedNumbers(null); // Ensure numbers are cleared on error
       // Optionally call onProcessReset on processing error
       if (onProcessReset) {
           onProcessReset();
       }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle the user choosing to modify the extracted numbers.
   * Sets the state to show input fields.
   */
  const handleModifyNumbers = () => {
    if (displayedNumbers) {
      setIsModifyingNumbers(true);
      setNumberInput1(displayedNumbers[0]);
      setNumberInput2(displayedNumbers[1]);
      // Hide other buttons when modifying
      setShowStartButton(false); // Ensure start is hidden
    }
  };

  /**
   * Handle the user accepting the extracted numbers as they are.
   * Sets the state to show the Start button.
   */
  const handleAcceptNumbers = () => {
    if (displayedNumbers) {
      setIsModifyingNumbers(false); // Exit modification mode if somehow entered
      setShowStartButton(true); // Show the Start button
      // The numbers are now ready for the parent component via onExtractionComplete
    }
  };

  /**
   * Handle saving the modified numbers from the input fields.
   * Updates displayedNumbers and shows the Start button.
   */
  const handleSaveChanges = () => {
    // Basic validation: check if inputs are not empty
    const trimmedInput1 = numberInput1.trim();
    const trimmedInput2 = numberInput2.trim();

    if (trimmedInput1 === '' || trimmedInput2 === '') {
        Alert.alert('Invalid Input', 'Numbers cannot be empty.');
        return;
    }

    setDisplayedNumbers([trimmedInput1, trimmedInput2]);
    setIsModifyingNumbers(false); // Exit modification mode
    setShowStartButton(true); // Show the Start button
    // The modified numbers are now ready for the parent component via onExtractionComplete
  };

  /**
   * Handle cancelling the modification.
   * Reverts to showing the original extracted numbers and the accept/modify options.
   */
  const handleCancelModification = () => {
    setIsModifyingNumbers(false);
    // displayedNumbers retains the original extracted values (or whatever they were before modify was clicked)
    // accept/modify buttons will reappear because isModifyingNumbers is false
  };

  /**
   * Handle the final "Start" button press.
   * Calls the parent's callback with the final numbers.
   */
  const handleStart = () => {
    if (displayedNumbers) {
      onExtractionComplete(displayedNumbers); // Pass the final numbers back to the parent
    }
  };


  // Conditional rendering logic within the component
  const renderContent = () => {
      if (!imageUri) {
          // This state shouldn't really be hit if parent renders component only when imageUri exists
          return <Text style={styles.resultText}>No image selected yet.</Text>;
      }

      if (loading) {
          return <ActivityIndicator size="large" style={styles.loader} />;
      }

      if (!displayedNumbers && allExtractedNumbers.length < 2) {
          // Image is selected, not loading, but less than 2 numbers were found or processing failed
          if (allExtractedNumbers.length > 0) {
             // Some numbers found, but not enough
             return (
                <View style={styles.resultsContainer}>
                    <Text style={styles.label}>Extraction Results:</Text>
                    <Text style={styles.resultText}>Found {allExtractedNumbers.length} number(s).</Text>
                    <Text style={styles.resultText}>At least two numbers are required.</Text>
                     {/* Optionally allow retrying or picking a new image here */}
                </View>
             );
          } else if (!displayedNumbers && !loading) {
            // Image selected, not loading, and no numbers processed/found yet
             return (
                <View style={styles.resultsContainer}>
                      {/* Only show process button if an image is selected and we haven't processed yet */}
                     <Button
                         title="Process Image"
                         onPress={handleProcessImage}
                         disabled={!imageUri || loading || !!displayedNumbers} // Disable if no image or loading
                     />
                </View>
             );
          }
      }


      if (displayedNumbers && !isModifyingNumbers && !showStartButton) {
          // Numbers found, not modifying, haven't accepted yet
          return (
              <View style={styles.resultsContainer}>
                <Text style={styles.label}>Temperature Range:</Text>
                <Text style={styles.resultText}>{displayedNumbers[0]}°C</Text>
                <Text style={styles.resultText}>{displayedNumbers[1]}°C</Text>
                <Text style={styles.promptText}>Do you want to modify these numbers?</Text>
                <View style={styles.buttonRow}>
                    <Button title="Modify Numbers" onPress={handleModifyNumbers} />
                    <Button title="Accept & Continue" onPress={handleAcceptNumbers} />
                </View>
              </View>
          );
      }

      if (displayedNumbers && isModifyingNumbers) {
          // Numbers found, currently modifying
          return (
             <View style={styles.resultsContainer}>
                <Text style={styles.label}>Modify Numbers:</Text>
                <TextInput
                    style={styles.input}
                    value={numberInput1}
                    onChangeText={setNumberInput1}
                    keyboardType="numeric" // Suggest numeric keyboard
                    placeholder="Enter number 1"
                    autoFocus={true} // Focus first input on entering modify mode
                />
                 <TextInput
                    style={styles.input}
                    value={numberInput2}
                    onChangeText={setNumberInput2}
                    keyboardType="numeric" // Suggest numeric keyboard
                    placeholder="Enter number 2"
                />
                <View style={styles.buttonRow}>
                    <Button title="Save Changes" onPress={handleSaveChanges} />
                    <Button title="Cancel" onPress={handleCancelModification} color="red" />
                </View>
             </View>
          );
      }

      if (displayedNumbers && showStartButton) {
          // Numbers accepted/saved, show Start button
          return (
            <View style={styles.resultsContainer}>
                <Text style={styles.label}>Final Temperature Range:</Text>
                <Text style={styles.resultText}>{displayedNumbers[0]}°C</Text>
                <Text style={styles.resultText}>{displayedNumbers[1]}°C</Text>
                <Button title="Start" onPress={handleStart} />
            </View>
          );
      }

       // Default fallback (should ideally not be reached in typical flow)
       return null;
  };


  return (
    <View style={styles.container}>
      {/* Always show the selected image if available */}
      {imageUri && (
        <>
          {/* Optionally show the cropped image here instead of original */}
          <Image source={{ uri: imageUri }} style={styles.image} />
        </>
      )}

      {/* Render the dynamic content based on state */}
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // No padding here, handled by parent ScrollView if needed
    alignItems: 'center',
    width: '100%', // Take full width of parent container
    marginTop: 10, // Add some space above the image
    paddingBottom: 10, // Add space below content
  },
  image: {
    width: 300,
    height: 300,
    resizeMode: 'contain',
    marginVertical: 5,
  },
  loader: {
    marginTop: 20,
  },
  label: {
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 5,
    fontSize: 16,
    textAlign: 'center', // Center text labels
  },
  resultsContainer: {
    marginTop: 5, // Reduced margin as container has top margin
    marginBottom: 20,
    alignItems: 'center',
    width: '100%', // Use full width for alignment
  },
  resultText: {
    marginVertical: 2,
    fontSize: 14,
    textAlign: 'center',
  },
  promptText: {
      marginTop: 15,
      fontSize: 16,
      textAlign: 'center',
      paddingHorizontal: 10, // Add padding for better wrapping on small screens
  },
  buttonRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      width: '80%', // Control button row width
      marginTop: 15,
      marginBottom: 10, // Add margin below buttons
  },
  input: {
      height: 40,
      borderColor: 'gray',
      borderWidth: 1,
      width: '80%',
      marginVertical: 8,
      paddingHorizontal: 10,
      textAlign: 'center',
      fontSize: 16,
      borderRadius: 5,
  },
});