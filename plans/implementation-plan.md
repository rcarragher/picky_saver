# Picky Saver — Implementation Plan

## Context

Build a mobile app (iOS + Android) that helps users declutter their photo library. Users pick a month/year, then swipe through photos one at a time — right to keep, left to mark for deletion. Deleted photos go to a "To Be Deleted" album for later permanent removal. The app will be a paid upfront purchase in both app stores (no subscriptions, no in-app purchases).

**Framework: React Native with Expo** — chosen because:
- You have existing (if dated) JS/React Native experience — Dart/Flutter would mean learning a new language
- Expo's managed workflow handles 90% of native config, signing, and app store submission via EAS
- For single-card swipe interactions (not infinite scroll), React Native performance is more than adequate
- `@react-native-camera-roll/camera-roll` supports date range filtering (`fromTime`/`toTime`)
- Paid upfront model eliminates the need for in-app purchase libraries entirely

## App Screens & Flow

```
Home Screen
├── "Start Organizing" → Date Picker → Swipe Screen → Summary
└── "To Be Deleted (N)" → Deletion Review Screen
```

1. **Home Screen** — Two buttons: "Start Organizing" and "To Be Deleted (N)" showing count
2. **Date Picker** — Scrollable list of months with photo counts, tap to start swiping
3. **Swipe Screen** — Full-screen photo, swipe right=keep / left=delete, progress counter, undo button
4. **Summary** — After finishing a batch: "Reviewed 156 photos, marked 42 for deletion"
5. **Deletion Review** — Grid of marked photos, tap to preview, restore individual or delete all permanently

## Project Structure

```
picky-saver/
├── app/                          # Expo Router file-based routing
│   ├── _layout.tsx               # Root layout with navigation
│   ├── index.tsx                 # Home screen
│   ├── date-picker.tsx           # Month/year picker
│   ├── swipe/[year]/[month].tsx  # Swipe screen (dynamic route)
│   ├── summary.tsx               # Post-swipe summary
│   └── to-delete.tsx             # Deletion review screen
├── components/
│   ├── PhotoCard.tsx             # Swipeable photo card
│   ├── SwipeOverlay.tsx          # KEEP/DELETE indicators
│   ├── MonthTile.tsx             # Month row in date picker
│   ├── PhotoGrid.tsx             # Grid for deletion review
│   └── PermissionGate.tsx        # Wraps screens needing photo access
├── services/
│   ├── photoService.ts           # Photo library access (CameraRoll wrapper)
│   └── deletionAlbumService.ts   # "To Be Deleted" album management
├── hooks/
│   ├── usePhotos.ts              # Load photos for a month
│   ├── useDeletionAlbum.ts       # Deletion album state
│   └── usePermissions.ts         # Photo permission state
├── types/
│   └── index.ts                  # Shared types
└── constants/
    └── theme.ts                  # Colors, spacing, typography
```

## Key Packages

| Package | Purpose |
|---------|---------|
| `expo` ~52 | Managed workflow, EAS build/submit |
| `expo-router` | File-based navigation |
| `expo-media-library` | Photo library access, album creation, deletion |
| `react-native-gesture-handler` | Swipe gesture recognition (UI thread) |
| `react-native-reanimated` | 60fps swipe animations |
| `react-native-screens` | Native screen transitions |
| `expo-haptics` | Haptic feedback on swipe |

**Note on photo library:** Using `expo-media-library` over `@react-native-camera-roll/camera-roll` because it integrates cleanly with Expo's managed workflow and supports album creation (`createAlbumAsync`), asset fetching with sorting by date, and deletion (`deleteAssetsAsync`).

## Core Implementation Details

### Photo Service (`services/photoService.ts`)

```typescript
// Key functions:
getAvailableMonths(): Promise<MonthBatch[]>
  // Fetches all assets, groups by month/year, returns counts
  // Uses MediaLibrary.getAssetsAsync with sortBy: ['creationTime']
  // Paginate through all assets to build month index

getPhotosForMonth(year: number, month: number): Promise<Asset[]>
  // Uses MediaLibrary.getAssetsAsync with createdAfter/createdBefore
  // createdAfter: new Date(year, month, 1).getTime()
  // createdBefore: new Date(year, month + 1, 0).getTime()
  // Returns Asset objects (has uri for thumbnail display)

getThumbnail(asset: Asset): string
  // asset.uri is already a local file URI — use directly in <Image>
  // For performance: use asset.uri with resizeMode="cover"
```

### Deletion Album Service (`services/deletionAlbumService.ts`)

**Strategy:** Create a device album called "Picky Saver - To Delete" using `expo-media-library`.

```typescript
getOrCreateAlbum(): Promise<Album>
  // MediaLibrary.getAlbumAsync("Picky Saver - To Delete")
  // If null: MediaLibrary.createAlbumAsync("Picky Saver - To Delete", asset)
  // Cache album ID in memory

markForDeletion(asset: Asset): Promise<void>
  // MediaLibrary.addAssetsToAlbumAsync([asset], album, false)
  // On iOS: this copies the reference (not the file)

restore(asset: Asset): Promise<void>
  // MediaLibrary.removeAssetsFromAlbumAsync([asset], album)

getMarkedAssets(): Promise<Asset[]>
  // MediaLibrary.getAssetsAsync({ album })

permanentlyDelete(assets: Asset[]): Promise<void>
  // MediaLibrary.deleteAssetsAsync(assets.map(a => a.id))
  // Both platforms show system confirmation dialog
```

**Important iOS behavior:** `createAlbumAsync` requires at least one asset to create the album. We'll handle this by creating the album on the first swipe-left action.

### Swipe Screen — Gesture Handling

Using `react-native-gesture-handler` Pan gesture + `react-native-reanimated` for the card animation:

- Pan gesture tracks horizontal drag
- Card translates X and rotates slightly (tinder effect)
- Opacity overlays: green "KEEP" fades in on right drag, red "DELETE" on left
- Threshold: 40% of screen width triggers the action
- Below threshold: card springs back
- Above threshold: card flies off screen, next card appears
- Undo button: reverses last action (restores from album if was a delete)

### Permission Flow

```
App Launch → PermissionGate checks MediaLibrary.getPermissionsAsync()
  ├── Granted → Show content
  ├── Undetermined → requestPermissionsAsync() → show result
  └── Denied → Show explanation + "Open Settings" button
```

iOS 14+ Limited Library: `expo-media-library` handles this. If user grants limited access, we work with whatever photos they selected. Show a subtle banner suggesting full access for best experience.

## Platform Configuration

### iOS (`app.json` / `app.config.ts`)
```json
{
  "ios": {
    "infoPlist": {
      "NSPhotoLibraryUsageDescription": "Picky Saver needs access to your photos to help you organize and clean up your library.",
      "NSPhotoLibraryAddUsageDescription": "Picky Saver creates a 'To Be Deleted' album to hold photos you want to remove."
    }
  }
}
```

### Android
- `expo-media-library` handles permissions automatically via config plugin
- Android 13+: `READ_MEDIA_IMAGES` requested automatically
- Android 10-12: `READ_EXTERNAL_STORAGE` requested automatically
- Deletion on Android 11+: system shows `createDeleteRequest` dialog (handled by expo-media-library)

## Implementation Order

### Phase 1: Project Setup
- `npx create-expo-app picky-saver` with TypeScript template
- Install all packages
- Set up expo-router with placeholder screens
- Configure `app.config.ts` with permissions and app metadata
- Set up theme constants

### Phase 2: Permissions + Photo Loading
- Implement `usePermissions` hook and `PermissionGate` component
- Implement `photoService.ts` — fetch assets by date range
- Implement `usePhotos` hook
- Test on both platforms: verify photo access and date filtering

### Phase 3: Date Picker Screen
- Build month/year list showing photo counts per month
- Show only months with photos
- Tap a month → navigate to swipe screen with year/month params

### Phase 4: Swipe Screen (Core Feature)
- Build `PhotoCard` with pan gesture + reanimated animations
- Add KEEP/DELETE overlay indicators
- Wire swipe-left to `deletionAlbumService.markForDeletion()`
- Add progress counter ("24 / 156")
- Add undo functionality
- Add haptic feedback via `expo-haptics`
- Handle batch completion → navigate to summary

### Phase 5: Deletion Album + Review Screen
- Implement `deletionAlbumService.ts`
- Build deletion review grid
- Tap to preview with restore option
- "Delete All Permanently" button with confirmation
- Handle system deletion dialogs on both platforms

### Phase 6: Home Screen + Polish
- Wire up home screen with photo count badges
- Empty states for all screens
- Loading states and error handling
- App icon and splash screen
- Smooth transitions between screens

### Phase 7: App Store Preparation
- EAS Build configuration (`eas.json`)
- Test builds on real devices via EAS
- App Store Connect setup (iOS)
- Google Play Console setup (Android)
- Screenshots, description, privacy policy
- Submit via `eas submit`

## Test Strategy

### Testing Stack

| Layer | Tool | Purpose |
|-------|------|---------|
| Unit tests | `jest-expo` + Jest 30 | Service logic, hooks, utilities |
| Component/UI tests | `@testing-library/react-native` | Screen rendering, user interactions, state changes |
| Gesture tests | `react-native-gesture-handler/jestUtils` | Swipe gesture simulation via `fireGestureHandler` |
| Navigation tests | `expo-router/testing-library` | Route transitions via `renderRouter()` |
| E2E tests | Maestro (via EAS Workflows) | Full user flows on real devices |

### Test Infrastructure Setup (Phase 1 task)

**Dev dependencies:**
```
jest-expo ~52.0.0
jest ^30.0.0
@testing-library/react-native ^12.0.0
```

**jest.config.js:**
```javascript
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest-setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|react-navigation|@react-navigation/.*|react-native-svg))'
  ],
  testMatch: [
    '**/__tests__/**/*.{ts,tsx}',
    '**/*.{test,spec}.{ts,tsx}'
  ],
};
```

**jest-setup.js:**
```javascript
import 'react-native-gesture-handler/jestSetup';
import { setUpTests } from 'react-native-reanimated';
setUpTests({ fps: 60 });
```

**Global mock — `__mocks__/expo-media-library.ts`:**
```typescript
export const requestPermissionsAsync = jest.fn(() =>
  Promise.resolve({ granted: true, canAskAgain: true, status: 'granted' })
);
export const getAssetsAsync = jest.fn(() =>
  Promise.resolve({ assets: [], hasNextPage: false, endCursor: '', totalCount: 0 })
);
export const getAlbumAsync = jest.fn(() => Promise.resolve(null));
export const createAlbumAsync = jest.fn(() => Promise.resolve({ id: 'mock-album' }));
export const addAssetsToAlbumAsync = jest.fn(() => Promise.resolve(true));
export const removeAssetsFromAlbumAsync = jest.fn(() => Promise.resolve(true));
export const deleteAssetsAsync = jest.fn(() => Promise.resolve(true));
```

**Test file location:** `__tests__/` directory at project root (NOT inside `app/`).

### Unit Tests

Test the service layer logic in isolation with mocked expo-media-library.

| Test file | What it covers |
|-----------|---------------|
| `__tests__/services/photoService.test.ts` | `getAvailableMonths()` groups assets by month correctly; `getPhotosForMonth()` passes correct date range params; handles empty results; handles pagination |
| `__tests__/services/deletionAlbumService.test.ts` | `getOrCreateAlbum()` creates album on first call, returns cached on second; `markForDeletion()` calls `addAssetsToAlbumAsync`; `restore()` calls `removeAssetsFromAlbumAsync`; `permanentlyDelete()` calls `deleteAssetsAsync` with correct IDs |
| `__tests__/hooks/usePermissions.test.ts` | Returns correct state for granted/denied/undetermined; triggers request on mount |
| `__tests__/hooks/usePhotos.test.ts` | Loads photos for given month; handles loading/error states; paginates correctly |
| `__tests__/hooks/useDeletionAlbum.test.ts` | Tracks marked photos count; mark/restore update state; permanent delete clears list |

### UI / Component Tests

Test screens and components render correctly and respond to user interaction.

| Test file | What it covers |
|-----------|---------------|
| `__tests__/components/PhotoCard.test.tsx` | Renders image from asset URI; shows KEEP overlay on right drag; shows DELETE overlay on left drag (using `fireGestureHandler`) |
| `__tests__/components/PermissionGate.test.tsx` | Shows children when granted; shows request prompt when undetermined; shows denied message with settings link when denied |
| `__tests__/components/MonthTile.test.tsx` | Displays month name, year, photo count; calls onPress with correct params |
| `__tests__/screens/home.test.tsx` | Renders both action buttons; shows deletion count badge; navigates to correct routes on press |
| `__tests__/screens/datePicker.test.tsx` | Renders months with photos; hides months with 0 photos; navigates to swipe screen on tap |
| `__tests__/screens/swipe.test.tsx` | Shows current photo; updates progress counter on swipe; calls markForDeletion on left swipe; calls undo correctly; shows summary when batch complete |
| `__tests__/screens/toDelete.test.tsx` | Renders grid of marked photos; restore removes from grid; delete all triggers confirmation; empty state when no photos marked |

### Gesture Testing Details

Swipe gestures are tested using `fireGestureHandler` from `react-native-gesture-handler/jestUtils`:

```typescript
import { fireGestureHandler, getByGestureTestId } from 'react-native-gesture-handler/jestUtils';

test('left swipe marks photo for deletion', () => {
  const onSwipeLeft = jest.fn();
  render(<PhotoCard asset={mockAsset} onSwipeLeft={onSwipeLeft} />);

  fireGestureHandler(getByGestureTestId('photo-pan'), [
    { translationX: 0 },
    { translationX: -200 },  // past threshold
  ]);

  expect(onSwipeLeft).toHaveBeenCalledWith(mockAsset);
});
```

Reanimated animations run as web mocks in tests — they execute but don't render visually. This is fine for verifying callbacks fire. Visual smoothness is verified via E2E/Maestro.

### E2E Tests (Maestro)

Maestro flows test complete user journeys on real devices via EAS Workflows.

**Directory:** `.maestro/flows/`

| Flow file | Scenario |
|-----------|----------|
| `grant-permissions.yaml` | App launch → grant photo access → see home screen |
| `organize-month.yaml` | Home → pick a month → swipe through 5 photos → see summary |
| `delete-flow.yaml` | Mark photos → go to To Be Deleted → confirm deletion |
| `restore-flow.yaml` | Go to To Be Deleted → restore a photo → verify it's removed from list |

**EAS Workflow config (`.eas/workflows/e2e.yml`):**
```yaml
build:
  name: Build for E2E
  steps:
    - eas/build
test:
  name: Run Maestro E2E
  needs: [build]
  steps:
    - eas/maestro_test:
        flow_path: .maestro/flows
```

### When to Write Tests

Tests are written alongside each implementation phase, not deferred:

- **Phase 1:** Set up test infrastructure (jest config, setup files, global mocks, `npm test` script)
- **Phase 2:** Unit tests for `photoService`, `usePermissions`, `PermissionGate` component test
- **Phase 3:** Unit tests for `usePhotos`, component test for `MonthTile`, screen test for date picker
- **Phase 4:** Gesture tests for `PhotoCard`, screen test for swipe screen, undo logic tests
- **Phase 5:** Unit tests for `deletionAlbumService`, screen test for deletion review
- **Phase 6:** Screen test for home, navigation tests, empty/loading state tests
- **Phase 7:** Maestro E2E flows written and run via EAS

### npm Scripts

```json
{
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage"
}
```

## Verification Checklist

1. **Run locally:** `npx expo run:ios` and `npx expo run:android` on simulators/devices
2. **Run tests:** `npm test` passes all unit + UI tests
3. **Permission flow:** Test grant, deny, limited (iOS), and "don't ask again" (Android)
4. **Photo loading:** Correct photos for selected month, handles 0 and 1000+ photos
5. **Swipe mechanics:** Smooth 60fps animation, correct threshold, undo works
6. **Deletion album:** Album created, photos added/restored, permanent deletion triggers system dialog
7. **Edge cases:** Album deleted outside app, photos deleted outside app, empty library
8. **E2E:** Maestro flows pass on EAS
9. **App store builds:** `eas build --platform all` produces installable builds
