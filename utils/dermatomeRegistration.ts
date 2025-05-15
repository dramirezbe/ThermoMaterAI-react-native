//import { ImageSource, processImage } from 'react-native-fast-opencv';
//import { Mat, Imgproc, Imgcodecs, Subdiv2D, Point, Rect, Scalar, MatVector } from 'react-native-fast-opencv';

/**
 * 1. Decode image URI into OpenCV Mat
 */
/**export async function loadImageToMat(uri: string): Promise<Mat> {
  const buffer = await fetch(uri).then(res => res.arrayBuffer());
  const mat = Imgcodecs.imdecode(new Uint8Array(buffer));
  return mat;
}
*/

/**
import * as cv from 'react-native-fast-opencv';
import RNFS from 'react-native-fs';

export async function loadImageToMat(uri: string): Promise<Mat> {
  // Read file as base64 string
  const b64 = await RNFS.readFile(uri, 'base64');
  // Create Mat from base64
  const mat = cv.base64ToMat(b64);
  return mat;
}*/