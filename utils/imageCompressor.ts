/**
 * Compresses an image file by resizing it to a maximum width/height
 * and reducing the JPEG quality using HTML5 Canvas.
 * 
 * @param file The image File object from a file input.
 * @param maxWidth The maximum width allowed for the output image. Default is 800.
 * @param maxHeight The maximum height allowed for the output image. Default is 800.
 * @param quality The JPEG compression quality between 0 and 1. Default is 0.7.
 * @returns A promise that resolves to the compressed image as a JPEG Data URL (Base64).
 */
export const compressImageFile = (
  file: File,
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.7
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
          // If canvas context is not available, resolve with the original read result
          resolve(event.target?.result as string);
          return;
        }

        // Draw the image on the canvas with the new dimensions
        ctx.drawImage(img, 0, 0, width, height);

        // Convert the canvas to a JPEG data URL with the specified quality compression
        try {
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        } catch (err) {
          // Fallback if canvas.toDataURL fails (e.g. security error if image is from tainted source, though not applicable to local files)
          resolve(event.target?.result as string);
        }
      };

      img.onerror = (err) => {
        reject(new Error("Failed to load image for compression: " + err.toString()));
      };

      // Set the image src to the read data URL
      img.src = event.target?.result as string;
    };

    reader.onerror = (err) => {
      reject(new Error("Failed to read image file: " + err.toString()));
    };

    reader.readAsDataURL(file);
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
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'El archivo seleccionado no es una imagen válida.' };
  }
  if (file.size > maxSizeBytes) {
    const sizeMb = (maxSizeBytes / (1024 * 1024)).toFixed(0);
    return { valid: false, error: `La imagen excede el límite de tamaño de ${sizeMb}MB.` };
  }
  return { valid: true };
};
