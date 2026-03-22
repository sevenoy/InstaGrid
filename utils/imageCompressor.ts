export async function compressImage(file: File, maxDimension: number = 2000): Promise<File | Blob> {
  // Pass through if not an image or it's very small
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return file;
  if (file.size < 500 * 1024) return file; // Skip under 500KB

  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        let { width, height } = img;
        
        // Calculate dimensions maintaining aspect ratio
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round(maxDimension * (height / width));
            width = maxDimension;
          } else {
            width = Math.round(maxDimension * (width / height));
            height = maxDimension;
          }
        } else {
          // No need to compress if it's already smaller than maxDimension
          resolve(file);
          return;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          resolve(file); // Fallback
          return;
        }
        
        // Use better interpolation if available
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        
        // Attempt to compress
        const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const quality = outputType === 'image/jpeg' ? 0.85 : undefined;
        
        canvas.toBlob((blob) => {
          if (blob) {
            // Re-package as File to keep the original name if needed, or just return Blob
            // Since URL.createObjectURL accepts Blobs, this is fine
            resolve(blob);
          } else {
            resolve(file);
          }
        }, outputType, quality);
      };
      
      img.onerror = () => resolve(file);
      
      if (typeof e.target?.result === 'string') {
        img.src = e.target.result;
      } else {
        resolve(file);
      }
    };
    
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}
