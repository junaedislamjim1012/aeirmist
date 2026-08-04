import { ref, uploadBytesResumable, getDownloadURL, uploadBytes } from 'firebase/storage';
import { aeirmistCache } from './CacheService';

export enum MediaQuality {
  AUTO = 'auto',
  DATA_SAVER = 'data_saver',
  HD = 'hd',
  ULTRA = 'ultra',
  THUMBNAIL = 'thumbnail',
  PROFILE = 'profile',
  STORY = 'story',
  LITE = 'lite',
  WALLPAPER_LITE = 'wallpaper_lite'
}

interface UploadTask {
  id: string;
  file: File;
  path: string;
  isHD: boolean;
  quality: MediaQuality;
  onProgress: (progress: number, status: string) => void;
  resolve: (url: string) => void;
  reject: (error: any) => void;
  retries: number;
}

class MediaService {
  private uploadQueue: UploadTask[] = [];


  async compressImage(file: File, quality: MediaQuality = MediaQuality.AUTO): Promise<File> {
    let maxWidthOrHeight = 1440;
    let initialQuality = 0.80;

    switch (quality) {
      case MediaQuality.LITE:
        maxWidthOrHeight = 400;
        initialQuality = 0.50;
        break;
      case MediaQuality.WALLPAPER_LITE:
        maxWidthOrHeight = 1024;
        initialQuality = 0.65;
        break;
      case MediaQuality.DATA_SAVER:
        maxWidthOrHeight = 1024;
        initialQuality = 0.70;
        break;
      case MediaQuality.PROFILE:
        maxWidthOrHeight = 512; 
        initialQuality = 0.85;
        break;
      case MediaQuality.STORY:
        maxWidthOrHeight = 1280;
        initialQuality = 0.75;
        break;
      case MediaQuality.THUMBNAIL:
        maxWidthOrHeight = 256;
        initialQuality = 0.60;
        break;
      case MediaQuality.HD:
        maxWidthOrHeight = 1920;
        initialQuality = 0.85;
        break;
      case MediaQuality.ULTRA:
        maxWidthOrHeight = 2048;
        initialQuality = 0.90;
        break;
      case MediaQuality.AUTO:
      default:
        maxWidthOrHeight = 1440;
        initialQuality = 0.80;
        break;
    }

    if (typeof window === 'undefined') {
      return file;
    }

    return new Promise((resolve) => {
      const objectUrl = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidthOrHeight || height > maxWidthOrHeight) {
            if (width > height) {
              height = Math.round((height * maxWidthOrHeight) / width);
              width = maxWidthOrHeight;
            } else {
              width = Math.round((width * maxWidthOrHeight) / height);
              height = maxWidthOrHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            URL.revokeObjectURL(objectUrl);
            resolve(file);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Export to blob directly (fast)
          const mimeType = file.type === 'image/png' || file.type === 'image/jpeg' || file.type === 'image/webp' ? file.type : 'image/jpeg';
          canvas.toBlob(
            (blob) => {
              URL.revokeObjectURL(objectUrl);
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: mimeType,
                  lastModified: Date.now(),
                });
                console.log(`[MediaService] Fast canvas compression completed: ${file.name}. Original size: ${file.size} bytes, compressed size: ${compressedFile.size} bytes`);
                resolve(compressedFile);
              } else {
                resolve(file);
              }
            },
            mimeType,
            initialQuality
          );
        } catch (err) {
          URL.revokeObjectURL(objectUrl);
          console.error('[MediaService] Fast compression canvas error, using original:', err);
          resolve(file);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        console.error('[MediaService] Failed to load image element for compression, using original');
        resolve(file);
      };
      img.src = objectUrl;
    });
  }

  async uploadWithProgress(
    storage: any, 
    file: File, 
    path: string, 
    onProgress: (progress: number, status: string) => void,
    quality: MediaQuality = MediaQuality.AUTO
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const task: UploadTask = {
        id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        file,
        path,
        isHD: quality === MediaQuality.HD || quality === MediaQuality.ULTRA,
        quality,
        onProgress,
        resolve,
        reject,
        retries: 0
      };

      this.uploadQueue.push(task);
      this.processQueue(storage);
    });
  }

  private maxParallelUploads = 3;
  private currentUploads = 0;

  private async processQueue(storage: any) {
    if (this.currentUploads >= this.maxParallelUploads || this.uploadQueue.length === 0) return;

    while (this.currentUploads < this.maxParallelUploads && this.uploadQueue.length > 0) {
      const task = this.uploadQueue.shift()!;
      this.currentUploads++;
      
      // Fire and forget, but handle tracking
      this.executeUploadTask(storage, task)
        .then((url) => {
          task.resolve(url);
        })
        .catch(async (error) => {
          const nonRetriableErrors = [
            'storage/canceled',
            'storage/unauthorized',
            'storage/unauthenticated',
            'storage/invalid-argument',
            'storage/no-default-bucket',
            'storage/project-not-found'
          ];
          
          const isRetriable = !nonRetriableErrors.includes(error?.code);
          
          if (isRetriable && task.retries < 2) {
            task.retries++;
            const delay = 300 + (Math.random() * 200);
            console.warn(`[MediaService] Connection issue detected. Retrying task ${task.id} (${task.retries}/2) in ${Math.round(delay)}ms...`);
            await new Promise(r => setTimeout(r, delay));
            this.uploadQueue.push(task); // Re-queue
          } else {
            console.error(`[MediaService] Permanent upload failure for task ${task.id} after ${task.retries} retries:`, error);
            try {
              await aeirmistCache.removePendingUpload(task.id);
            } catch(e) { console.warn("Pending upload cleanup failed", e); }
            task.reject(error);
          }
        })
        .finally(() => {
          this.currentUploads--;
          this.processQueue(storage); // Check for more tasks
        });
    }
  }

  private async executeUploadTask(storage: any, task: UploadTask): Promise<string> {
    const { file, path, onProgress } = task;
    console.log(`[MediaService] Execution started: ${file.name}, path: ${path}, type: ${file.type}`);
    
    const storageRef = ref(storage, path);
    console.log(`[MediaService] Storage ref created: ${storageRef.fullPath}`);
    
    // Step 1: Pre-compression if image
    let uploadFile = file;
    if (file.type.startsWith('image/')) {
      if (file.size > 100 * 1024 || task.quality === MediaQuality.WALLPAPER_LITE || task.quality === MediaQuality.LITE) {
        console.log(`[MediaService] Image detected (>100KB or lite mode), compressing with quality: ${task.quality}...`);
        onProgress(0, 'Optimizing...');
        uploadFile = await this.compressImage(file, task.quality);
        console.log(`[MediaService] Compression complete. New size: ${uploadFile.size}`);
      } else {
        console.log(`[MediaService] Image under 100KB (${file.size} bytes), skipping compression for max speed.`);
      }
    } else {
        console.log(`[MediaService] No compression needed for ${file.type}`);
    }

    // Persist for potential recovery
    await aeirmistCache.savePendingUpload(task.id, path, uploadFile);

    onProgress(10, 'Uploading...');
    const metadata = {
      contentType: uploadFile.type || 'application/octet-stream',
      customMetadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
        quality: task.isHD ? 'HD' : 'Standard'
      }
    };
    console.log(`[MediaService] Metadata prepared. Uploading...`);

    return new Promise<string>((resolve, reject) => {
      // Step: PROGRESS-ACTIVITY WATCHDOG (60s inactivity limit)
      const inactivityLimit = 60000;
      let watchdogId: any = null;

      const resetWatchdog = () => {
        if (watchdogId) clearTimeout(watchdogId);
        watchdogId = setTimeout(() => {
          console.error(`[MediaService] Upload INACTIVITY TIMEOUT for task ${task.id} after ${inactivityLimit/1000}s`);
          uploadTask.cancel();
          reject({ code: 'storage/retry-limit-exceeded', message: `Inactivity timeout (${inactivityLimit/1000}s). Check your connection.` });
        }, inactivityLimit);
      };

      const cleanup = () => {
        if (watchdogId) clearTimeout(watchdogId);
      };

      // Initial start
      resetWatchdog();

      // Step: Decision - Use Resumable for everything to get real-time progress
      console.log(`[MediaService] Starting Resumable Upload: ${uploadFile.size} bytes, path: ${path}, type: ${uploadFile.type}`);
      const uploadTask = uploadBytesResumable(storageRef, uploadFile, metadata);
      console.log(`[MediaService] uploadTask initialized:`, !!uploadTask);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          resetWatchdog(); // Reset timer on any activity
          const progress = snapshot.totalBytes > 0 ? (snapshot.bytesTransferred / snapshot.totalBytes) * 100 : 0;
          console.log(`[MediaService] Upload progress: ${progress.toFixed(2)}% (${snapshot.bytesTransferred}/${snapshot.totalBytes})`);
          onProgress(progress, 'Uploading...');
        },
        (error: any) => {
          cleanup();
          console.warn(`[MediaService] Intermediate upload failure for ${task.id} (Code: ${error?.code}):`, error.message || error);
          reject(error);
        },
        async () => {
          try {
            cleanup();
            console.log(`[MediaService] Upload finished for ${task.id}, getting URL...`);
            onProgress(100, 'Publishing...');
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            // Background cache save
            aeirmistCache.saveMedia(downloadURL, uploadFile, uploadFile.type).catch(e => console.warn("Cache save failed", e));
            aeirmistCache.removePendingUpload(task.id).catch(e => console.warn("Cache remove failed", e));
            
            console.log(`[MediaService] Final download URL for ${task.id}: ${downloadURL}`);
            resolve(downloadURL);
          } catch (e) {
            console.error(`[MediaService] Finalizing task ${task.id} failed:`, e);
            reject(e);
          }
        }
      );
    });
  }

  async getCachedMediaURL(url: string, type: string): Promise<string> {
    const cachedBlob = await aeirmistCache.getMedia(url);
    if (cachedBlob) {
      return URL.createObjectURL(cachedBlob);
    }

    try {
      const response = await fetch(url);
      const blob = await response.blob();
      await aeirmistCache.saveMedia(url, blob, type);
      return URL.createObjectURL(blob);
    } catch (e) {
      return url; 
    }
  }

  async generateThumbnail(file: File): Promise<string | null> {
    if (file.type.startsWith('image/')) {
      return this.generateImageThumbnail(file);
    } else if (file.type.startsWith('video/')) {
      return this.generateVideoThumbnail(file);
    }
    return null;
  }

  private async generateImageThumbnail(file: File): Promise<string | null> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const maxSize = 20; 
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxSize) {
              height *= maxSize / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width *= maxSize / height;
              height = maxSize;
            }
          }

          canvas.width = width;
          canvas.height = height;
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/webp', 0.1));
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  }

  private async generateVideoThumbnail(file: File): Promise<string | null> {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;
      video.onloadedmetadata = () => {
        video.currentTime = 0.1;
      };
      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 160;
        canvas.height = 120;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/webp', 0.2));
        URL.revokeObjectURL(video.src);
      };
      video.onerror = () => resolve(null);
      video.src = URL.createObjectURL(file);
    });
  }
}

export const mediaService = new MediaService();
