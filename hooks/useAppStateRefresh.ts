import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

/**
 * Calls the provided callback when the app transitions from background to foreground.
 * Useful for re-fetching data that may have changed while the app was backgrounded
 * (e.g., photos added/deleted outside the app).
 */
export function useAppStateRefresh(onForeground: () => void) {
  const appState = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        onForeground();
      }
      appState.current = nextState;
    });

    return () => subscription.remove();
  }, [onForeground]);
}
