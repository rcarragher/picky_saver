# Picky Saver

A React Native + Expo app for decluttering your photo library, one swipe at a time. Swipe right to keep, left to mark for deletion. All operations are device-local — no cloud backend.

## Tech Stack

- React Native + Expo (TypeScript)
- Expo Router (file-based navigation)
- expo-media-library for photo access
- react-native-gesture-handler + react-native-reanimated for swipe gestures
- EAS Build for builds and submissions

## Setup

```bash
npm install
npm start          # Start Expo dev server
npm run ios        # Launch on iOS simulator
npm run android    # Launch on Android emulator/device
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start Expo dev server |
| `npm run ios` | Launch on iOS simulator |
| `npm run android` | Launch on Android emulator/device |
| `npm test` | Run Jest unit tests |
| `npm run test:watch` | Tests in watch mode |
| `npm run test:coverage` | Coverage report |
| `npm run test:e2e` | Run Maestro E2E test suite |

## Architecture

**Screens** (`app/`): Home, Date Picker, Swipe, Summary, To Delete review.

**Services** (`services/`): `photoService.ts` fetches and groups photos by month. `deletionAlbumService.ts` manages a native album for staging deletions.

**Hooks** (`hooks/`): Photo loading, deletion album CRUD, permissions, theming, app-state refresh.

**Components** (`components/`): Swipe cards, photo grid, permission gate, animated buttons, onboarding overlay.

## Testing

**Unit tests:** Jest with `jest-expo` preset. Tests are under `__tests__/` mirroring source structure.

```bash
npm test
npx jest __tests__/services/photoService.test.ts  # Single file
```

**E2E tests:** Maestro flows in `.maestro/flows/`. Requires the [Maestro CLI](https://maestro.mobile.dev/).

```bash
npm run test:e2e                                   # Full suite
maestro test .maestro/flows/<flow-name>.yaml       # Single flow
```
