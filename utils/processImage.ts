// utils/processImage.ts
import TextRecognition from '@react-native-ml-kit/text-recognition';
import * as ImageManipulator from 'expo-image-manipulator';
import * as cv from 'react-native-fast-opencv';
import * as tf from 'react-native-fast-tflite';

/**
 * Rectangle defining the crop area.
 * Adjust these values to target the region of interest.
 */
const CUT_AREA = {
  x: 900,
  y: 150,
  width: 158,
  height: 850,
};

/**
 * Crop the image to the specified area.
 * @param uri - URI of the original image
 * @returns URI of the cropped image
 */
async function cropImage(uri: string): Promise<string> {
  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ crop: { originX: CUT_AREA.x, originY: CUT_AREA.y, width: CUT_AREA.width, height: CUT_AREA.height } }],
      { format: ImageManipulator.SaveFormat.PNG }
    );
    return result.uri;
  } catch (err) {
    console.error('Crop Error:', err);
    throw new Error('Image cropping failed.');
  }
}

/**
 * Perform OCR on the given image URI.
 * @param uri - URI of the image (cropped or original)
 * @returns Recognized text string
 */
async function recognizeText(uri: string): Promise<string> {
  try {
    const result = await TextRecognition.recognize(uri);
    return result.text;
  } catch (err) {
    console.error('OCR Error:', err);
    throw new Error('Text recognition failed.');
  }
}

/**
 * Extract integer or floating-point numbers from text.
 * @param text - String to search for numbers
 * @returns Array of number strings
 */
function extractNumbers(text: string): string[] {
  const matches = text.match(/\d+(?:\.\d+)?/g);
  return matches ?? [];
}

/**
 * Full pipeline: crop image, run OCR, and extract numbers.
 * @param imageUri - URI of the original image
 * @returns Array of extracted number strings
 */
export async function processImageAndExtractNumbers(imageUri: string): Promise<string[]> {
  try {
    const croppedUri = await cropImage(imageUri);
    const ocrText = await recognizeText(croppedUri);
    return extractNumbers(ocrText);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Process Pipeline Error:', message);
    throw new Error(`Processing pipeline failed: ${message}`);
  }
}