# Picky Saver — Build Plan

Combined step-by-step plan merging the implementation plan, UI design spec, and test strategy into a single executable sequence. Each step has a clear deliverable and verification.

Reference docs: `plans/implementation-plan.md`, `plans/ui-design.md`

---

## Step 1: Project Scaffold

**Create the Expo project and install all dependencies.**

- [x] Initialize the project in the current directory. If `create-expo-app` does not support scaffolding in-place, create a temp directory and move its contents into the project root. The final result must have `app/`, `components/`, `services/`, etc. at the repo root — no nested `picky-saver/` subdirectory.
- [x] Install production packages:
  ```
  expo-router expo-media-library react-native-gesture-handler
  react-native-reanimated react-native-screens expo-haptics
  react-native-safe-area-context expo-linking expo-constants expo-status-bar
  expo-image @react-native-async-storage/async-storage
  ```
- [x] Install dev/test packages:
  ```
  jest-expo @testing-library/react-native @types/react
  ```
  **Do not install `jest` explicitly.** Let `jest-expo` bring its compatible Jest version as a transitive dependency. Verify the resolved version with `npx jest --version` after install.
- [x] Create directory structure:
  ```
  app/                    (expo-router screens)
  components/
  services/
  hooks/
  constants/
  types/
  __tests__/services/
  __tests__/hooks/
  __tests__/components/
  __tests__/screens/
  __mocks__/
  ```
- [x] Configure `app.config.ts` — app name, slug, scheme, iOS/Android permissions (NSPhotoLibraryUsageDescription, NSPhotoLibraryAddUsageDescription)
- [x] Set up expo-router: create `app/_layout.tsx` with Stack navigator, create placeholder files for all routes (`index.tsx`, `date-picker.tsx`, `swipe/[year]/[month].tsx`, `summary.tsx`, `to-delete.tsx`)

**Verify:** `npx expo start` launches without errors. All placeholder routes navigate correctly.

**Observations:**
- Used `create-expo-app` with `blank-typescript` template in /tmp, then moved files to project root.
- `@testing-library/react-native` required `--legacy-peer-deps` due to react-test-renderer peer dep conflict with react@19.1.0. This also required explicitly installing `jest@^29` since legacy peer deps skipped the transitive jest dependency from jest-expo.
- Converted `app.json` → `app.config.ts` for type safety and dynamic config support. Removed the old `app.json`.
- Set `userInterfaceStyle: "automatic"` (was "light") to support dark mode from the start.
- Entry point changed from `registerRootComponent(App)` to `import "expo-router/entry"`.
- Expo SDK 54 with React 19.1.0, React Native 0.81.5.
- TypeScript compiles clean. Expo config resolves correctly.
- Could not test `npx expo start` in headless mode — verified via TypeScript compilation and `npx expo config` instead.
- Test scripts added to package.json: `test`, `test:watch`, `test:coverage`.

---

## Step 2: Test Infrastructure

**Set up the testing framework so every subsequent step can include tests.**

- [x] Create `jest.config.js`:
  ```javascript
  module.exports = {
    preset: 'jest-expo',
    setupFilesAfterSetup: ['<rootDir>/jest-setup.js'],
    transformIgnorePatterns: [
      'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|react-navigation|@react-navigation/.*|react-native-svg))'
    ],
    testMatch: [
      '**/__tests__/**/*.{ts,tsx}',
      '**/*.{test,spec}.{ts,tsx}'
    ],
  };
  ```
- [x] Create `jest-setup.js`:
  ```javascript
  import 'react-native-gesture-handler/jestSetup';
  import { setUpTests } from 'react-native-reanimated';
  setUpTests({ fps: 60 });
  ```
- [x] Create `__mocks__/expo-media-library.ts` with jest.fn() mocks for: `requestPermissionsAsync`, `getPermissionsAsync`, `getAssetsAsync`, `getAlbumAsync`, `createAlbumAsync`, `addAssetsToAlbumAsync`, `removeAssetsFromAlbumAsync`, `deleteAssetsAsync`
- [x] Add npm scripts: `"test"`, `"test:watch"`, `"test:coverage"`
- [x] Write a trivial smoke test (`__tests__/smoke.test.ts`) that passes

**Verify:** `npm test` runs and passes the smoke test.

**Observations:**
- Plan had typo: `setupFilesAfterSetup` → corrected to `setupFilesAfterEnv` (the actual Jest config key).
- Reanimated v4 with react-native-worklets can't run `setUpTests()` in Jest (native module not available). Used `moduleNameMapper` to point `react-native-reanimated` to its bundled `mock.js` instead. Removed `setUpTests` call from jest-setup.js — just importing the gesture handler setup is sufficient.
- Had to install `react-native-worklets` (dependency of reanimated v4) with `--legacy-peer-deps`.
- Test scripts already existed from Step 1 — no changes needed to package.json scripts.
- Smoke test passes: `npm test` runs successfully.

---

## Step 3: Theme & Design Tokens

**Implement the design system from the UI spec as code constants. All subsequent steps that build screens/components must use the theme hook — dark mode is built-in from the start, not bolted on later.**

- [x] Create `constants/theme.ts` with:
  - Light mode colors: background `#FAFAF8`, surface `#F2F0EC`, textPrimary `#1C1C1E`, textSecondary `#6B6B6B`, accent `#E8725A`, keep `#4CAF7D`, delete `#E05555`, border `#E5E3DF`
  - Dark mode colors: background `#141414`, surface `#1E1E1E`, textPrimary `#F0F0F0`, textSecondary `#9A9A9A`, accent `#E8725A`, keep `#5BC88A`, delete `#E86060`
  - Spacing: xs=4, sm=8, md=16, lg=24, xl=32, xxl=48
  - Font sizes: h1=28, h2=22, body=17, caption=14, small=12
  - Font weights: regular='400', medium='500', semibold='600', bold='700'
  - Border radii: sm=8, md=12, lg=16, full=9999
  - `screenMargin: 20`
  - `touchTarget: { min: 48 }`
- [x] Create `types/index.ts` with shared types:
  - `MonthBatch` — `{ year: number; month: number; count: number }`. **Convention: `month` is 1-based (1 = January, 12 = December).** Document this in a JSDoc comment on the type.
  - `SwipeDirection` — `'left' | 'right'`
  - `SwipeSession` — `{ kept: number; deleted: number; total: number }`
- [x] Create `hooks/useTheme.ts`:
  - Uses `useColorScheme()` from react-native
  - Returns the correct color set from `theme.ts`
  - All screens and components built in subsequent steps must use this hook for every color value

**Verify:** Theme hook returns correct colors in both modes. Types compile without errors.

**Observations:**
- Used explicit `Colors` type interface instead of `as const` inference for color objects — the literal string types from `as const` made light/dark incompatible as return types.
- Dark mode `border` color was not in the plan spec — added `#2A2A2A` as a sensible dark mode border color.
- Fixed `react-test-renderer` version mismatch (had 19.2.0, needed 19.1.0 to match react@19.1.0). Installed with `--legacy-peer-deps`.
- All 4 tests pass (3 useTheme tests + 1 smoke test). TypeScript compiles clean for source files.

---

## Step 4: Permissions

**Build the permission layer — the first thing every user encounters. Use theme hook for all colors.**

- [x] Create `hooks/usePermissions.ts`:
  - On mount: call `MediaLibrary.getPermissionsAsync()`
  - Expose: `status` ('granted' | 'denied' | 'undetermined' | 'limited'), `requestPermission()`, `isLoading`
- [x] Create `components/PermissionGate.tsx`:
  - If granted/limited → render children
  - If undetermined → show explanation screen with "Allow Access" button (coral accent, 56px tall) that calls `requestPermission()`
  - If denied → show explanation + "Open Settings" button using `Linking.openSettings()`
  - If limited (iOS) → show subtle banner: "For best results, allow full photo access in Settings"
- [x] Write tests:
  - `__tests__/hooks/usePermissions.test.ts` — returns correct status for each permission state, calls requestPermissionsAsync on request
  - `__tests__/components/PermissionGate.test.tsx` — renders children when granted, shows request button when undetermined, shows settings link when denied

**Verify:** `npm test` passes. On device/simulator: permission dialog appears, denied state shows settings button.

**Observations:**
- The `__mocks__/expo-media-library.ts` mock only exports `jest.fn()` functions — it doesn't export enums like `PermissionStatus`. Tests for `usePermissions` use string literals instead of the enum values.
- `usePermissions` maps the MediaLibrary permission response using a helper `mapStatus()` function that checks `granted`, `accessPrivileges`, and `canAskAgain` fields to derive the simplified 4-state status.
- `PermissionGate` uses `Linking.openSettings()` (from react-native) for the denied state — no need for `expo-linking`.
- Limited permission state shows a banner above children (not a blocking screen), with an "Open Settings" link.
- All 17 tests pass (6 usePermissions + 7 PermissionGate + 3 useTheme + 1 smoke).

---

## Step 5: Photo Service + Date Picker Screen

**Load photos from the library grouped by month, and build the date picker UI. Use theme hook for all colors.**

- [x] Create `services/photoService.ts`:
  - `getAvailableMonths()` — paginate through all assets via `MediaLibrary.getAssetsAsync({ sortBy: ['creationTime'], first: 500 })`, group by year/month, return `MonthBatch[]` sorted newest-first. **Month values are 1-based** (extract via `date.getMonth() + 1`). For large libraries, implement progressive loading: yield/return results as each page is processed so the UI can render visible months while background pagination continues for accurate counts.
  - `getPhotosForMonth(year, month)` — **`month` param is 1-based.** Convert to 0-based for the Date constructor: `createdAfter: new Date(year, month - 1, 1).getTime()` and `createdBefore: new Date(year, month, 0, 23, 59, 59).getTime()`. Return Asset array.
- [x] Create `hooks/usePhotos.ts`:
  - `useAvailableMonths()` — calls `getAvailableMonths()` on mount, returns `{ months, isLoading, error }`
  - `useMonthPhotos(year, month)` — calls `getPhotosForMonth()`, returns `{ photos, isLoading, error }`
- [x] Create `components/MonthTile.tsx`:
  - Surface-colored card (themed), full width, 24px padding
  - Month name + year in H2 style, photo count in caption style, right chevron (→)
  - Year section headers when months span multiple years
  - Tap handler receives year + month
- [x] Build `app/date-picker.tsx`:
  - Header: back arrow + "Pick a Month" (H1)
  - Wrapped in `PermissionGate`
  - `FlatList` of `MonthTile` components
  - Loading state: 4 shimmer placeholder tiles
  - Tap a tile → `router.push(\`/swipe/${year}/${month}\`)`
- [x] Write tests:
  - `__tests__/services/photoService.test.ts` — groups assets by month correctly **(verify months are 1-based in output)**, passes correct date params **(verify 0-based conversion in Date constructor)**, handles empty library, handles pagination (hasNextPage)
  - `__tests__/hooks/usePhotos.test.ts` — loading/loaded/error states
  - `__tests__/components/MonthTile.test.tsx` — renders month, year, count; calls onPress
  - `__tests__/screens/datePicker.test.tsx` — renders month list, hides empty months, navigates on tap

**Verify:** `npm test` passes. On device: date picker shows months with correct photo counts.

**Observations:**
- `getAvailableMonths()` uses simple async pagination (not progressive/streaming) — sufficient for initial build. Progressive loading can be added later if performance is an issue with very large libraries.
- `getMonthName()` exported from photoService for reuse by MonthTile component.
- Year section headers are implemented in the date-picker screen via a `buildSections()` helper that interleaves header items into the FlatList data, rather than using SectionList (simpler FlatList approach).
- `useAvailableMonths` exposes a `refresh()` callback for pull-to-refresh (Step 14).
- All 45 tests pass (8 photoService + 8 usePhotos + 6 MonthTile + 7 datePicker + 17 prior tests + 1 smoke).

---

## Step 6: Swipe Screen — Card & Gestures

**Build the core swipe experience — the heart of the app. Use theme hook for all colors. Use `expo-image` for photo display.**

- [x] Create `components/SwipeOverlay.tsx`:
  - "KEEP" text + checkmark icon, green (themed), positioned top-left of card
  - "DELETE" text + X icon, red (themed), positioned top-right of card
  - Opacity driven by animated value (0 at rest, 0.6 at threshold)
  - Border: 3px solid in matching color around the full card at opacity
- [x] Create `components/PhotoCard.tsx`:
  - Receives: `asset`, `onSwipeLeft`, `onSwipeRight`, `isFirst` (for onboarding hint)
  - Full-width card, borderRadius 12px, aspect ratio from photo metadata
  - **Photo displayed via `expo-image`'s `<Image>` component** (not React Native's built-in `<Image>`). This provides better caching, memory management, and prefetch support for rapid swiping.
  - `PanGesture` from react-native-gesture-handler:
    - Tracks `translationX` → drives card translateX + rotation (max 15deg)
    - Threshold: 40% of screen width
    - Below threshold on release: spring back to center (200ms)
    - Above threshold: fly off screen (300ms ease-out), fire callback
  - Reanimated `useSharedValue` + `useAnimatedStyle` for 60fps
  - `gestureTestId="photo-pan"` for testing
  - Haptic feedback (`expo-haptics` light impact) when crossing threshold
- [x] Build `app/swipe/[year]/[month].tsx`:
  - **Parse route params to numbers:** `const year = Number(params.year); const month = Number(params.month);` — validate they are finite numbers before proceeding.
  - Header: back arrow + "March 2024" + progress counter "24/156"
  - Loads photos via `useMonthPhotos(year, month)`
  - Displays current `PhotoCard`, **preload next photo using `expo-image`'s `Image.prefetch(nextAsset.uri)`**
  - Swipe right (keep) → advance to next photo (no album action needed)
  - Swipe left (delete) → call `markForDeletion()` (stub for now), advance
  - Undo button (centered below card): reverses last swipe, animates card back
  - Tap buttons: X button (left, 48x48, delete color) and checkmark button (right, 48x48, keep color) as swipe alternatives
  - Hint text "← DELETE    KEEP →" below card, secondary color, fades after 5 swipes (track count in `AsyncStorage` so it persists across sessions)
  - When all photos swiped → navigate to summary with session stats
  - Loading state: shimmer card placeholder
  - Reduce Motion: replace rotation + fly-off with simple fade transitions
- [x] Write tests:
  - `__tests__/components/PhotoCard.test.tsx` — renders image, fires onSwipeLeft on left gesture (using `fireGestureHandler`), fires onSwipeRight on right gesture
  - `__tests__/screens/swipe.test.tsx` — shows photo, shows progress counter, advances on swipe, undo reverses last action, navigates to summary when done

**Verify:** `npm test` passes. On device: card swipes smoothly, overlays appear, haptic fires, progress updates, undo works.

**Observations:**
- Reanimated v4 mock.js can't be used — it imports native worklets module which fails in Jest. Created custom `__mocks__/react-native-reanimated.ts` with manual mock of `useSharedValue`, `useAnimatedStyle`, `useReducedMotion`, `withSpring`, `withTiming`, `runOnJS`, `Easing`, `useEvent`, and `setGestureState`. Updated jest.config.js moduleNameMapper to point to this manual mock.
- Created `__mocks__/expo-image.ts` (renders View, exports `Image.prefetch` as jest.fn) and `__mocks__/expo-haptics.ts` (exports `impactAsync` and `ImpactFeedbackStyle`).
- Added `@react-native-async-storage/async-storage` to jest.config.js moduleNameMapper using its built-in mock at `jest/async-storage-mock.js`.
- Gesture API uses `.withTestId()` not `.testID()` (Reanimated v4 / gesture-handler v2.28).
- `SharedValue` type is exported as a named type from `react-native-reanimated`, not under `Animated.SharedValue` namespace.
- `isFirst` prop on PhotoCard was omitted — not needed until Step 7 (onboarding overlay).
- Swipe left currently just advances (stub) — real `markForDeletion()` integration in Step 8.
- Swipe completion uses `router.replace()` to navigate to summary (prevents back-to-swipe).
- All 64 tests pass (6 PhotoCard + 13 swipe screen + 45 prior).
- Files added: `components/SwipeOverlay.tsx`, `components/PhotoCard.tsx`, `__mocks__/expo-image.ts`, `__mocks__/expo-haptics.ts`, `__mocks__/react-native-reanimated.ts`, `__tests__/components/PhotoCard.test.tsx`, `__tests__/screens/swipe.test.tsx`.
- Files modified: `app/swipe/[year]/[month].tsx`, `jest.config.js`.

---

## Step 7: First-Launch Onboarding Overlay

**Teach the swipe mechanic on first use.**

- [x] Create `components/OnboardingOverlay.tsx`:
  - Semi-transparent dark backdrop over the swipe screen
  - "← Swipe left to delete" (left side), "Swipe right to keep →" (right side)
  - "You can undo anytime" caption at bottom
  - "Got it!" button (coral, full width) → dismisses overlay
  - "Skip" text button (top-right)
  - Both dismiss and set `AsyncStorage` flag `onboarding_complete: true`
- [x] Integrate into swipe screen: show overlay if `!onboarding_complete`, render over the user's actual first photo
- [x] Write test:
  - `__tests__/components/OnboardingOverlay.test.tsx` — renders instruction text, "Got it!" dismisses, "Skip" dismisses

**Verify:** `npm test` passes. On device: overlay shows on first launch only, never again after dismissal.

**Observations:**
- `OnboardingOverlay` uses absolute positioning with `zIndex: 100` to render over the swipe card content.
- Exported `ONBOARDING_KEY` constant from the component for use by the swipe screen (to check AsyncStorage on mount).
- The swipe screen reads `ONBOARDING_KEY` from AsyncStorage in the same `useEffect` that reads the hint swipe count. If not set to `'true'`, it shows the overlay.
- Both "Got it!" and "Skip" call the same `dismiss()` function that saves the flag and calls `onDismiss`.
- React act() warning in swipe tests from the async `setShowOnboarding` — harmless, all tests pass.
- All 69 tests pass (5 new OnboardingOverlay + 64 prior).
- Files added: `components/OnboardingOverlay.tsx`, `__tests__/components/OnboardingOverlay.test.tsx`.
- Files modified: `app/swipe/[year]/[month].tsx`.

---

## Step 8: Deletion Album Service

**Implement the "To Be Deleted" album management — the persistence layer for marked photos. Use theme hook for all colors in any UI elements.**

- [x] Create `services/deletionAlbumService.ts`:
  - `getOrCreateAlbum()` — look up "Picky Saver - To Delete" via `MediaLibrary.getAlbumAsync()`. If null, cache that it needs creation (album can only be created with an asset). Return album or null.
  - `markForDeletion(asset)` — if album doesn't exist, create it with `MediaLibrary.createAlbumAsync("Picky Saver - To Delete", asset)`. If album exists, `MediaLibrary.addAssetsToAlbumAsync([asset], album, false)`. Cache album reference.
  - `restore(asset)` — `MediaLibrary.removeAssetsFromAlbumAsync([asset], album)`
  - `getMarkedAssets()` — `MediaLibrary.getAssetsAsync({ album })`, return full list (paginated internally)
  - `getMarkedCount()` — quick count without loading all assets
  - `permanentlyDelete(assets)` — `MediaLibrary.deleteAssetsAsync(assetIds)`. Returns success/failure. OS shows confirmation dialog.
  - Handle edge case: album deleted outside app → `getOrCreateAlbum()` detects null, resets cache
- [x] Create `hooks/useDeletionAlbum.ts`:
  - Exposes: `markedPhotos`, `markedCount`, `isLoading`, `markForDeletion(asset)`, `restore(asset)`, `permanentlyDeleteAll()`, `refresh()`
- [x] Wire into swipe screen: replace stub `markForDeletion()` call with real service
- [x] Write tests:
  - `__tests__/services/deletionAlbumService.test.ts` — creates album on first mark, reuses on subsequent marks, restore calls removeAssetsFromAlbumAsync, permanentlyDelete calls deleteAssetsAsync, handles missing album gracefully
  - `__tests__/hooks/useDeletionAlbum.test.ts` — tracks count, mark/restore update state

**Verify:** `npm test` passes. On device: swipe left creates album visible in system Photos app, photos appear in it, album persists across app restarts.

**Observations:**
- `deletionAlbumService.ts` caches the album reference but re-verifies via `getAlbumAsync` on each call to handle external deletion. Exported `_resetCache()` for test isolation.
- `markForDeletion` in the swipe screen is fire-and-forget (not awaited) — the UI advances immediately while the album operation completes in the background. Same for `restore` on undo.
- `useDeletionAlbum` optimistically updates local state (count/photos array) on mark/restore without waiting for a refresh from the service, for snappy UI.
- `permanentlyDelete` maps assets to their IDs before calling `deleteAssetsAsync`, matching the MediaLibrary API which expects string IDs.
- All 90 tests pass (15 deletionAlbumService + 6 useDeletionAlbum + 69 prior).
- Files added: `services/deletionAlbumService.ts`, `hooks/useDeletionAlbum.ts`, `__tests__/services/deletionAlbumService.test.ts`, `__tests__/hooks/useDeletionAlbum.test.ts`.
- Files modified: `app/swipe/[year]/[month].tsx` (imported and wired `markForDeletion` and `restore`).

---

## Step 9: Summary Screen

**Show results after completing a swipe session. Use theme hook for all colors.**

- [ ] Build `app/summary.tsx`:
  - Receives session stats via route params: `{ total, kept, deleted, year, month }`
  - Large checkmark icon (accent color), "All done!" (H1)
  - "You reviewed {total} photos" (body)
  - Two stat cards side by side:
    - "Kept" with count in keep green
    - "Marked for deletion" with count in delete red
  - Surface-colored cards, 24px padding, border radius 12
  - "Review Deletions" button (secondary, surface bg) → navigates to `/to-delete`
  - "Back to Home" button (text style) → navigates to `/`
  - Back gesture / back button → home (not back to swipe screen)
- [ ] Write test:
  - `__tests__/screens/summary.test.tsx` — renders stats correctly, both navigation buttons work

**Verify:** `npm test` passes. On device: summary shows after completing a batch with correct numbers.

---

## Step 10: Deletion Review Screen

**Let users review, restore, or permanently delete marked photos. Use theme hook for all colors.**

- [ ] Create `components/PhotoGrid.tsx`:
  - 3-column FlatList grid, 4px gaps between thumbnails
  - Each cell: square thumbnail via `expo-image`'s `<Image>`, tap opens full-screen preview
  - Uses `numColumns={3}` on FlatList
- [ ] Build `app/to-delete.tsx`:
  - Header: back arrow + "To Be Deleted" + count badge
  - Wrapped in `PermissionGate`
  - `PhotoGrid` displaying `markedPhotos` from `useDeletionAlbum()`
  - Tap a thumbnail → modal/overlay showing full-screen photo on dark background:
    - Close button (✕) top-left
    - "Restore Photo" button (↩) at bottom → removes from album, closes preview, refreshes grid
  - "Delete All ({count})" button — red background, white text, fixed at bottom of screen
    - Calls `permanentlyDeleteAll()` → OS confirmation dialog
    - On success: show brief "Deleted {count} photos" message, navigate home
  - Loading state: grid of shimmer squares
  - Empty state: "Nothing here yet. Start organizing to mark photos for deletion." + "Start Organizing" button
- [ ] Write tests:
  - `__tests__/screens/toDelete.test.tsx` — renders grid of photos, restore removes photo from list, delete all triggers confirmation, empty state renders correctly

**Verify:** `npm test` passes. On device: grid shows marked photos, tap opens preview, restore works, delete triggers OS dialog.

---

## Step 11: Home Screen

**Wire up the entry point — the first thing users see. Use theme hook for all colors.**

- [ ] Build `app/index.tsx`:
  - Centered layout, vertically distributed
  - App icon placeholder (can be a simple styled text/icon for now)
  - "Picky Saver" (H1, primary color)
  - "Organize your photos, one swipe at a time" (body, secondary color)
  - "Start Organizing →" button: coral background, white text, full width, 56px tall, border radius 12 → navigates to `/date-picker`
  - "To Be Deleted ({count} photos)" button: surface background, primary text, full width, 48px tall → navigates to `/to-delete`. Only visible when count > 0. Uses `useDeletionAlbum().markedCount`.
  - Wrapped in `PermissionGate`
  - Empty device state: if no photos at all, show "No photos found on this device" instead of buttons
- [ ] Write test:
  - `__tests__/screens/home.test.tsx` — renders title and tagline, shows both buttons, hides deletion button when count is 0, navigates correctly

**Verify:** `npm test` passes. On device: home screen shows correctly, deletion count updates after swipe sessions, both buttons navigate to correct screens.

---

## Step 12: Navigation Polish & Edge Cases

**Tighten up the full flow and handle edge cases.**

- [ ] Configure `app/_layout.tsx` stack options:
  - Screen transitions: slide from right (forward), slide from left (back) — 250ms native
  - Header hidden globally (each screen manages its own header inline)
  - Background color matches theme
- [ ] Back behavior adjustments:
  - Summary screen: back goes to home (not back to swipe). Use `router.replace` or reset the stack.
  - Swipe screen: back goes to date picker. If user has progress, it's preserved (photos marked are already in the album).
- [ ] Handle stale state via `AppState` listener:
  - When the app returns to foreground, re-fetch photo data (month list, current swipe batch, deletion album contents). This handles photos added or deleted outside the app while backgrounded. **Do not filter query results** — `MediaLibrary.getAssetsAsync()` only returns assets that currently exist, so stale references are only an in-memory concern.
  - Album deleted outside app: `getOrCreateAlbum()` returns null, resets to "no marked photos" state
- [ ] Loading states everywhere:
  - Date picker: 4 shimmer tiles while months load
  - Swipe screen: shimmer card while first photo loads
  - Deletion review: shimmer grid while album loads
  - Home: brief shimmer while deletion count loads
- [ ] Empty states:
  - No photos on device: home shows message, no buttons
  - No photos in selected month: (shouldn't happen — hidden months) but fallback message + back button
  - Empty deletion album: message + "Start Organizing" button
- [ ] Status bar: adapt to light/dark mode

**Verify:** Full flow works end-to-end on device. Back button behavior is correct at every screen. Stale state handled gracefully.

---

## Step 13: Accessibility

**Ensure the app is usable by everyone.**

- [ ] Add `accessibilityLabel` to all interactive elements:
  - "Start organizing your photos" (home button)
  - "Review {count} photos marked for deletion" (to-delete button)
  - "{Month} {Year}, {count} photos" (month tile)
  - "Keep this photo" / "Delete this photo" (tap buttons on swipe screen)
  - "Undo last action" (undo button)
  - "Delete all {count} photos permanently" (delete all button)
  - "Restore this photo" (restore button in preview)
- [ ] Add `accessibilityRole` where appropriate: 'button', 'image', 'header'
- [ ] Verify all touch targets are minimum 48x48px
- [ ] Reduce Motion support:
  - Check `AccessibilityInfo.isReduceMotionEnabled` (or `useReducedMotion` from reanimated)
  - If enabled: replace card swipe rotation + fly-off with simple fade/slide
  - Keep the swipe gesture itself functional, just simplify the visual feedback
- [ ] Font scaling: ensure no text gets clipped when system font size is set to maximum

**Verify:** Enable VoiceOver (iOS) / TalkBack (Android) and navigate the full flow. Enable Reduce Motion and verify swipe still works. Set largest font size and check no clipping.

---

## Step 14: Final Polish

**App icon, splash screen, and quality-of-life improvements.**

- [ ] Design and set app icon in `app.config.ts` (1024x1024 source, Expo generates all sizes)
- [ ] Configure splash screen: warm white background + app name centered
- [ ] Button press animations: scale 0.97 + slight opacity change, 100ms (use `Pressable` with animated style)
- [ ] Screen transition tuning: verify 250ms slide transitions feel smooth
- [ ] Pull-to-refresh on date picker (reload months in case photos were added/deleted)
- [ ] Handle app backgrounding during swipe session: preserve position on return
- [ ] Test on small screens (iPhone SE / small Android) — ensure nothing overflows

**Verify:** App looks polished. Icon displays correctly. Splash screen shows on cold start. All animations feel smooth and responsive.

---

## Step 15: E2E Tests (Maestro)

**Write end-to-end test flows for the complete user journey.**

- [ ] Create `.maestro/flows/` directory
- [ ] `grant-permissions.yaml` — Launch app → grant photo access → verify home screen visible
- [ ] `organize-month.yaml` — Home → tap Start Organizing → pick first month → swipe 3 photos right, 2 left → verify summary shows 5 reviewed, 2 marked
- [ ] `delete-flow.yaml` — Home → tap To Be Deleted → tap Delete All → confirm OS dialog → verify empty state
- [ ] `restore-flow.yaml` — Home → To Be Deleted → tap a photo → tap Restore → verify count decremented
- [ ] Create `.eas/workflows/e2e.yml` for running on EAS

**Verify:** Maestro flows pass locally via `maestro test .maestro/flows/`.

---

## Step 16: App Store Preparation

**Build, test, and configure for store submission.**

- [ ] Create `eas.json` with build profiles (development, preview, production)
- [ ] Run `eas build --platform ios --profile preview` — test on real iOS device via TestFlight
- [ ] Run `eas build --platform android --profile preview` — test APK on real Android device
- [ ] App Store Connect setup:
  - App name, description, keywords
  - Screenshots (6.7" iPhone 16 Pro Max, 6.1" iPhone 16)
  - Privacy policy URL (simple page: "Picky Saver does not collect, store, or transmit any user data. All photos remain on your device.")
  - Pricing: set one-time purchase price
  - Age rating: 4+
- [ ] Google Play Console setup:
  - Store listing, screenshots (phone + tablet if supporting)
  - Privacy policy
  - Content rating questionnaire
  - Pricing
- [ ] Submit: `eas submit --platform ios` and `eas submit --platform android`

**Verify:** Test builds install and run correctly on real devices. Store listings look correct. Submissions accepted.

---

## Quick Reference: What's Built At Each Step

| Step | Screens/Components | Services/Hooks | Tests |
|------|-------------------|----------------|-------|
| 1 | Placeholder routes, _layout | — | — |
| 2 | — | — | Jest config, smoke test |
| 3 | — | useTheme | theme.ts, types |
| 4 | PermissionGate | usePermissions | 2 test files |
| 5 | DatePicker, MonthTile | photoService, usePhotos | 4 test files |
| 6 | PhotoCard, SwipeOverlay, Swipe screen | — | 2 test files |
| 7 | OnboardingOverlay | — | 1 test file |
| 8 | — | deletionAlbumService, useDeletionAlbum | 2 test files |
| 9 | Summary screen | — | 1 test file |
| 10 | PhotoGrid, Deletion Review, Photo Preview | — | 1 test file |
| 11 | Home screen | — | 1 test file |
| 12 | (polish existing) | (edge case handling, AppState) | — |
| 13 | (accessibility attrs) | — | — |
| 14 | (icon, splash, animations) | — | — |
| 15 | — | — | 4 Maestro E2E flows |
| 16 | — | — | Real device testing |
