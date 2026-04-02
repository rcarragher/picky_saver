# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start              # Start Expo dev server
npm run ios            # Launch on iOS simulator
npm run android        # Launch on Android emulator/device
npm test               # Run all Jest tests
npm run test:watch     # Tests in watch mode
npm run test:coverage  # Coverage report
npx jest __tests__/services/photoService.test.ts  # Run a single test file
```

## E2E Testing (Maestro)

Prerequisites: Install the Maestro CLI with `curl -Ls "https://get.maestro.mobile.dev" | bash`

```bash
npm run test:e2e                                    # Full suite (reset sim, build, seed, run all flows)
maestro test .maestro/flows/<flow-name>.yaml        # Run a single flow
```

The E2E script (`e2e/run-e2e.sh`) resets the simulator, builds the app, seeds test photos, pre-grants permissions, then runs flows in two groups:

- **Independent flows** (8): No state dependencies — permissions, empty states, onboarding, navigation, undo, pull-to-refresh
- **Journey flows** (8): Run sequentially — organize month → restore → preview → swipe all → summary → delete

## Architecture

Picky Saver is a React Native + Expo app for decluttering photo libraries via swiping. All operations are device-local — no cloud backend.

**Navigation:** Expo Router with file-based Stack routing (`app/` directory). Five screens: Home → Date Picker → Swipe (`app/swipe/[year]/[month].tsx`) → Summary → To Delete review.

**Data layer:** Two services in `services/` wrap `expo-media-library`:

- `photoService.ts` — fetches and groups photos by month
- `deletionAlbumService.ts` — manages a native "Picky Saver - To Delete" album for staging deletions

**State:** Local `useState` + `AsyncStorage` for onboarding/hint flags. No Redux or global state.

**Hooks** (`hooks/`): `usePhotos` (photo loading with cancellation), `useDeletionAlbum` (deletion album CRUD), `usePermissions` (media library permissions), `useTheme` (light/dark mode colors), `useAppStateRefresh` (refresh on foreground).

**UI:** Gesture-driven swipe cards using `react-native-gesture-handler` + `react-native-reanimated`. `PermissionGate` component wraps screens that need photo access.

**Testing:** Jest with `jest-expo` preset. Mocks in `__mocks__/` for reanimated and expo-media-library. Tests mirror source structure under `__tests__/`.

**Build/Deploy:** EAS Build (`eas.json`) with development, preview, and production profiles. E2E tests via Maestro (`.maestro/flows/`).

**Design tokens:** `constants/theme.ts` defines colors, spacing, typography. Types in `types/index.ts`.
