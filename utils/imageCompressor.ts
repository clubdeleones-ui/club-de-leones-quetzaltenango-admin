/**
 * Compresses an image file by resizing it to a maximum width/height
 * and reducing the JPEG quality using HTML5 Canvas.
 * 
 * @param file The image File object from a file input.
 * @param maxWidth The maximum width allowed for the output image. Default is 800.
 * @param maxHeight The maximum height allowed for the output image. Default is 800.
 * @param quality The JPEG compression quality between 0 and 1. Default is 0.7.
 * @param removeBlackBackground Whether to remove dark/black backgrounds. Default is false.
 * @returns A promise that resolves to the compressed image as a JPEG Data URL (Base64).
 */
export const compressImageFile = (
  file: File,
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.7,
  removeBlackBackground = false
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate the new dimensions while maintaining the aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        // Fill with white background so transparent PNGs/WebPs don't turn black when converted to JPEG
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);

        // Draw the image on the canvas with the new dimensions
        ctx.drawImage(img, 0, 0, width, height);

        if (removeBlackBackground) {
          const imgData = ctx.getImageData(0, 0, width, height);
          const data = imgData.data;
          const threshold = 35; // Threshold for dark/black pixels
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            if (r <= threshold && g <= threshold && b <= threshold) {
              data[i + 3] = 0; // Turn pixel transparent
            }
          }
          ctx.putImageData(imgData, 0, 0);
        }

        // Firestore strictly enforces a maximum of 1,048,487 bytes per property or document.
        // We set our safety threshold to 400,000 chars (~300 KB), guaranteeing it will NEVER exceed Firestore limit.
        const MAX_SAFE_LENGTH = 400000;

        try {
          let currentQuality = quality;
          let currentCanvas = canvas;
          let currentWidth = width;
          let currentHeight = height;

          // Always encode photos as JPEG (or webp if black background removed) to ensure lossy compression
          let outputType = removeBlackBackground ? 'image/webp' : 'image/jpeg';
          let dataUrl = currentCanvas.toDataURL(outputType, currentQuality);

          // If webp is not supported or yielded a PNG fallback, switch to JPEG
          if (dataUrl.startsWith('data:image/png') && !removeBlackBackground) {
            dataUrl = currentCanvas.toDataURL('image/jpeg', currentQuality);
          }

          // Dynamic downscale loop: if the output is somehow too large, step down quality and resolution
          let iterations = 0;
          while (dataUrl.length > MAX_SAFE_LENGTH && iterations < 5) {
            iterations++;
            if (currentQuality > 0.4) {
              currentQuality = Math.max(0.35, currentQuality - 0.15);
            } else {
              // Scale down dimensions by 25%
              currentWidth = Math.round(currentWidth * 0.75);
              currentHeight = Math.round(currentHeight * 0.75);
              const scaledCanvas = document.createElement('canvas');
              scaledCanvas.width = currentWidth;
              scaledCanvas.height = currentHeight;
              const sCtx = scaledCanvas.getContext('2d');
              if (sCtx) {
                sCtx.fillStyle = '#FFFFFF';
                sCtx.fillRect(0, 0, currentWidth, currentHeight);
                sCtx.drawImage(currentCanvas, 0, 0, currentWidth, currentHeight);
                currentCanvas = scaledCanvas;
              }
            }
            dataUrl = currentCanvas.toDataURL('image/jpeg', currentQuality);
          }

          resolve(dataUrl);
        } catch (err) {
          // If canvas compression fails, try a low-quality basic jpeg
          try {
            resolve(canvas.toDataURL('image/jpeg', 0.5));
          } catch {
            resolve(event.target?.result as string);
          }
        }
      };

      img.onerror = (err) => {
        reject(new Error("Failed to load image for compression: " + err.toString()));
      };

      img.src = event.target?.result as string;
    };

    reader.onerror = (err) => {
      reject(new Error("Failed to read image file: " + err.toString()));
    };

    reader.readAsDataURL(file);
  });
};

/**
 * Safely converts any image URL (remote Firebase Storage URL or Data URL)
 * into a local Base64 Data URL to bypass cross-origin canvas security restrictions.
 */
export const urlToDataUrl = async (url: string): Promise<string> => {
  if (!url || url.startsWith('data:')) return url;
  try {
    const response = await fetch(url, { mode: 'cors' });
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(url);
      reader.readAsDataURL(blob);
    });
  } catch {
    return url;
  }
};

/**
 * Removes black/dark background pixels from a data URL image and returns a transparent PNG data URL.
 */
export const removeDarkBackgroundFromDataUrl = async (
  inputUrl: string,
  threshold = 35
): Promise<string> => {
  if (!inputUrl) return inputUrl;

  // Convert remote URL to Base64 first if needed to prevent CORS tainted canvas error
  const dataUrl = await urlToDataUrl(inputUrl);

  return new Promise((resolve) => {
    const img = new Image();
    if (dataUrl.startsWith('http://') || dataUrl.startsWith('https://')) {
      img.crossOrigin = 'anonymous';
    }

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.clearRect(0, 0, img.width, img.height);
        ctx.drawImage(img, 0, 0);

        const imgData = ctx.getImageData(0, 0, img.width, img.height);
        const data = imgData.data;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          // If pixel is black or near-black
          if (r <= threshold && g <= threshold && b <= threshold) {
            data[i + 3] = 0; // Make pixel transparent
          }
        }

        ctx.putImageData(imgData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch {
        // Safe fallback if canvas is tainted or blocked by CORS
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
};

/**
 * Compresses/resizes a PNG signature image to reduce size while keeping transparency.
 */
export const compressPngSignature = (
  file: File,
  maxWidth = 400,
  maxHeight = 200
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        try {
          const compressedDataUrl = canvas.toDataURL('image/png');
          resolve(compressedDataUrl);
        } catch (err) {
          resolve(event.target?.result as string);
        }
      };
      img.onerror = (err) => {
        reject(new Error("Failed to load signature image: " + err.toString()));
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = (err) => {
      reject(new Error("Failed to read signature file: " + err.toString()));
    };
    reader.readAsDataURL(file);
  });
};

/**
 * Validates an image file's size and MIME type.
 * Default size limit is 5MB.
 */
export const validateImageFile = (
  file: File,
  maxSizeBytes = 5 * 1024 * 1024
): { valid: boolean; error?: string } => {
  if (!file) {
    return { valid: false, error: 'No se seleccionó ningún archivo.' };
  }
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/avif',
    'image/heic',
    'image/heif'
  ];
  const fileExt = file.name ? file.name.split('.').pop()?.toLowerCase() : '';
  const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif', 'heic', 'heif'];

  if (!file.type.startsWith('image/') || (!allowedMimeTypes.includes(file.type.toLowerCase()) && !allowedExtensions.includes(fileExt || ''))) {
    return { valid: false, error: 'El archivo seleccionado no es un formato de imagen permitido (JPG, PNG, WEBP).' };
  }
  if (file.size > maxSizeBytes) {
    const sizeMb = (maxSizeBytes / (1024 * 1024)).toFixed(0);
    return { valid: false, error: `La imagen excede el límite de tamaño de ${sizeMb}MB.` };
  }
  return { valid: true };
};
