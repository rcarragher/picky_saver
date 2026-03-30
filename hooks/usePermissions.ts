import { useCallback, useEffect, useState } from 'react';
import * as MediaLibrary from 'expo-media-library';

export type PermissionStatus = 'granted' | 'denied' | 'undetermined' | 'limited';

function mapStatus(response: MediaLibrary.PermissionResponse): PermissionStatus {
  if (response.granted) return 'granted';
  if (response.accessPrivileges === 'limited') return 'limited';
  if (response.canAskAgain) return 'undetermined';
  return 'denied';
}

export function usePermissions() {
  const [status, setStatus] = useState<PermissionStatus>('undetermined');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    MediaLibrary.getPermissionsAsync().then((response) => {
      if (!cancelled) {
        setStatus(mapStatus(response));
        setIsLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  const requestPermission = useCallback(async () => {
    const response = await MediaLibrary.requestPermissionsAsync();
    setStatus(mapStatus(response));
  }, []);

  return { status, requestPermission, isLoading };
}
