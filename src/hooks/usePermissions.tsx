import { useState, useCallback, useEffect } from 'react';

export type PermissionType = 
  | 'camera' 
  | 'microphone' 
  | 'photos' 
  | 'notifications' 
  | 'location' 
  | 'contacts' 
  | 'bluetooth';

export interface PermissionState {
  status: 'prompt' | 'granted' | 'denied' | 'unavailable' | 'checking';
  lastRequested?: number;
  error?: string;
}

export const usePermissions = () => {
  const [permissions, setPermissions] = useState<Record<PermissionType, PermissionState>>({
    camera: { status: 'prompt' },
    microphone: { status: 'prompt' },
    photos: { status: 'prompt' },
    notifications: { status: 'prompt' },
    location: { status: 'prompt' },
    contacts: { status: 'prompt' },
    bluetooth: { status: 'prompt' },
  });

  const checkPermissionStatus = useCallback(async (type: PermissionType) => {
    if (typeof window === 'undefined') return;
    
    try {
      if (type === 'notifications') {
        if ('Notification' in window) {
          const status = Notification.permission === 'default' ? 'prompt' : 
                        Notification.permission === 'granted' ? 'granted' : 'denied';
          setPermissions(prev => ({ ...prev, notifications: { status } }));
        }
        return;
      }

      if (navigator.permissions && navigator.permissions.query) {
        const nameMap: any = {
          camera: 'camera',
          microphone: 'microphone',
          location: 'geolocation',
          photos: 'notifications', // No direct photo permission query in many browsers
          contacts: 'contacts' as any,
          bluetooth: 'bluetooth' as any
        };

        const permissionName = nameMap[type];
        if (!permissionName) return;

        try {
          const result = await navigator.permissions.query({ name: permissionName });
          const statusMap: any = {
            granted: 'granted',
            denied: 'denied',
            prompt: 'prompt'
          };
          setPermissions(prev => ({ 
            ...prev, 
            [type]: { status: statusMap[result.state] || 'prompt' } 
          }));

          result.onchange = () => {
            setPermissions(prev => ({ 
              ...prev, 
              [type]: { status: statusMap[result.state] || 'prompt' } 
            }));
          };
        } catch (e) {
          // Some permissions might not be queryable in all browsers
        }
      }
    } catch (err) {
      console.warn(`Status check failed for ${type}`, err);
    }
  }, []);

  const requestPermission = useCallback(async (type: PermissionType): Promise<boolean> => {
    // If already granted, return true immediately
    if (permissions[type].status === 'granted') {
      return true;
    }

    setPermissions(prev => ({ ...prev, [type]: { ...prev[type], status: 'checking' } }));
    console.log(`[Permissions] Requesting ${type}...`);
    
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("navigator.mediaDevices is not available");
      }

      if (type === 'camera') {
        // Request BOTH for camera as it's usually for video calls or video capture
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true,
          audio: true 
        });
        stream.getTracks().forEach(track => track.stop());
        setPermissions(prev => ({ 
          ...prev, 
          camera: { status: 'granted', lastRequested: Date.now() },
          microphone: { status: 'granted', lastRequested: Date.now() }
        }));
        return true;
      }

      if (type === 'microphone') {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        setPermissions(prev => ({ ...prev, microphone: { status: 'granted', lastRequested: Date.now() } }));
        return true;
      }

      if (type === 'notifications') {
        if (!('Notification' in window)) {
          setPermissions(prev => ({ ...prev, notifications: { status: 'unavailable' } }));
          return false;
        }
        const result = await Notification.requestPermission();
        const status = result === 'granted' ? 'granted' : 'denied';
        setPermissions(prev => ({ ...prev, notifications: { status, lastRequested: Date.now() } }));
        return result === 'granted';
      }

      if (type === 'location') {
        return new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            () => {
              setPermissions(prev => ({ ...prev, location: { status: 'granted', lastRequested: Date.now() } }));
              resolve(true);
            },
            (err) => {
              setPermissions(prev => ({ ...prev, location: { status: 'denied', error: err.message } }));
              resolve(false);
            },
            { timeout: 5000 }
          );
        });
      }

      if (type === 'photos') {
        // In web, standard input file doesn't need "permission" in the same way, 
        // but we can simulate a "granted" state for our logic.
        setPermissions(prev => ({ ...prev, photos: { status: 'granted', lastRequested: Date.now() } }));
        return true;
      }

      // Contacts and Bluetooth are experimental or platform specific
      if (type === 'contacts') {
        if ('contacts' in navigator && 'ContactsManager' in window) {
           // Theoretical support
           setPermissions(prev => ({ ...prev, contacts: { status: 'granted', lastRequested: Date.now() } }));
           return true;
        }
        setPermissions(prev => ({ ...prev, contacts: { status: 'unavailable' } }));
        return false;
      }

      return false;
    } catch (err: any) {
      console.error(`[Permissions] Critical failure for ${type}:`, err);
      console.error(`[Permissions] Error Name: ${err.name}, Message: ${err.message}`);
      
      let status: 'denied' | 'unavailable' = 'denied';
      let customErrorMessage = err.message || `Failed to access ${type}`;

      if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError' || err.name === 'NotSupportedError') {
        status = 'unavailable';
      } else if (err.name === 'NotAllowedError') {
        customErrorMessage = "System access denied. Please check your browser's site settings for Camera and Microphone and ensure they are allowed.";
      }
      
      setPermissions(prev => ({ 
        ...prev, 
        [type]: { status, error: customErrorMessage, lastRequested: Date.now() } 
      }));
      return false;
    }
  }, []);

  useEffect(() => {
    const permissionsToCheck: PermissionType[] = ['camera', 'microphone', 'notifications', 'location'];
    permissionsToCheck.forEach(checkPermissionStatus);
  }, [checkPermissionStatus]);

  return { permissions, requestPermission, checkPermissionStatus };
};
