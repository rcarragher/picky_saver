import { useCallback, useEffect, useState } from 'react';
import * as MediaLibrary from 'expo-media-library';
import type { MonthBatch } from '../types';
import { getAvailableMonths, getPhotosForMonth } from '../services/photoService';

export function useAvailableMonths() {
  const [months, setMonths] = useState<MonthBatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getAvailableMonths();
      setMonths(result);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { months, isLoading, error, refresh };
}

export function useMonthPhotos(year: number, month: number) {
  const [photos, setPhotos] = useState<MediaLibrary.Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    getPhotosForMonth(year, month)
      .then((result) => {
        if (!cancelled) {
          setPhotos(result);
          setIsLoading(false);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e : new Error(String(e)));
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [year, month]);

  return { photos, isLoading, error };
}
