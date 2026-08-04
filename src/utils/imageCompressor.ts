/**
 * Utility helper to compress and optimize uploaded images client-side.
 * Resizes intelligently, maintains aspect ratio, and exports high-quality WebP or JPEG.
 */
export const compressImage = (
  file: File, 
  maxWidth = 1920, 
  maxHeight = 1080, 
  quality = 0.82
): Promise<string> => {
  return new Promise((resolve, reject) => {
    // If the file is a video, don't compress via canvas, return base64 data URL
    if (file.type.startsWith('video/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (typeof e.target?.result === 'string') {
          resolve(e.target.result);
        } else {
          reject(new Error('Failed to read video file.'));
        }
      };
      reader.onerror = () => reject(new Error('Error reading video file.'));
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Resize intelligently while maintaining aspect ratio
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Attempt WebP compression first for maximum size saving
          let dataUrl = '';
          try {
            dataUrl = canvas.toDataURL('image/webp', quality);
          } catch (webpError) {
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }

          resolve(dataUrl);
        } catch (err) {
          console.error('Canvas compression error, falling back to original base64', err);
          resolve(e.target?.result as string);
        }
      };
      img.onerror = () => {
        // Fallback to original Base64 in case image object instantiation fails
        resolve(e.target?.result as string);
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });
};
