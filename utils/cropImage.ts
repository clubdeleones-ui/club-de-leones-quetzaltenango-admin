/**
 * Utilities for cropping, rotating, and standardizing profile images to a square (1:1) format.
 */

export interface PixelCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

const getRadianAngle = (degreeValue: number) => (degreeValue * Math.PI) / 180;

/**
 * Returns the cropped, rotated, and standardized 1:1 image as a compressed base64 JPEG data URL.
 * Output size is typically 500x500 pixels for optimal crispness on retina screens and lightweight Firestore storage.
 */
export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: PixelCrop,
  rotation = 0,
  outputSize = 500
): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context available');
  }

  const rotRad = getRadianAngle(rotation);

  // Calculate bounding box of the rotated image
  const bBoxWidth =
    Math.abs(Math.cos(rotRad) * image.width) + Math.abs(Math.sin(rotRad) * image.height);
  const bBoxHeight =
    Math.abs(Math.sin(rotRad) * image.width) + Math.abs(Math.cos(rotRad) * image.height);

  // Set canvas size to match the bounding box
  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  // Translate canvas context to a central location on canvas to allow rotating and flipping around the center
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.translate(-image.width / 2, -image.height / 2);

  // Draw rotated image
  ctx.drawImage(image, 0, 0);

  // Create standardized square output canvas (e.g. 500x500)
  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = outputSize;
  outputCanvas.height = outputSize;
  const outCtx = outputCanvas.getContext('2d');

  if (!outCtx) {
    throw new Error('No output context available');
  }

  // Smooth image resizing
  outCtx.imageSmoothingEnabled = true;
  outCtx.imageSmoothingQuality = 'high';

  // Fill white background for transparent PNGs
  outCtx.fillStyle = '#FFFFFF';
  outCtx.fillRect(0, 0, outputSize, outputSize);

  // Draw the cropped portion from the rotated canvas into the standardized output canvas
  outCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outputSize,
    outputSize
  );

  // Export as high quality JPEG (quality 0.82)
  let quality = 0.82;
  let dataUrl = outputCanvas.toDataURL('image/jpeg', quality);

  // Safety downscale if it exceeds 350KB (Firestore limit safety)
  if (dataUrl.length > 400000) {
    quality = 0.68;
    dataUrl = outputCanvas.toDataURL('image/jpeg', quality);
  }

  return dataUrl;
}
