# Month Review Progress Tracking — Execution Plan

> **Design document:** [design.md](./design.md)
> **Status:** In progress
> **Current phase:** Phase 6 complete

---

## How to Use This Plan

This plan is designed for the Ralph loop. Each phase:

1. Has **checkboxes** for every discrete task — mark `[x]` when done.
2. Has an **Observations** section — write notes, surprises, or decisions made during that iteration.
3. Is scoped so one phase fits comfortably in a single loop iteration.
4. Includes tests for all new logic introduced in that phase.
5. Ends with a **build + test gate** — confirm the project builds and all tests pass before moving on.

**After each loop iteration:** update the "Current phase" field at the top and record observations.

**Build + test gate (mandatory at the end of every phase):**

*Baseline (every phase):* `npx expo export --platform ios 2>&1 | head -5 && npm test`

Phases that add or modify integration/E2E tests must also run them. Include any prerequisites (deployment, environment setup) as tasks before the gate, and add the integration test run command to the gate itself. The gate command may differ between phases — it must cover all tests that validate the phase's work.

A phase is **not complete** until the gate succeeds and **all** tests written or modified in that phase have been executed. Fix failures before marking the phase done.

---

## Summary

Implement month-level review progress tracking across 8 phases: data layer (type, service, hook), summary screen integration (save record + celebration animation), date picker progress indicators, a new Review History screen with summary stats and actions, and home screen navigation. All data persists locally via AsyncStorage following existing codebase patterns.

---

## Phase 0: ReviewRecord Type and Review Service

**Goal:** Create the `ReviewRecord` type and `reviewService.ts` with full AsyncStorage CRUD, plus unit tests.

### Tasks

- [x] **0.1** Add `ReviewRecord` type to `types/index.ts`
  - File: `types/index.ts`
  - Add after the `SwipeSession` type:
    ```typescript
    export type ReviewRecord = {
      year: number;
      /** 1-based month number (1 = January, 12 = December) */
      month: number;
      kept: number;
      deleted: number;
      total: number;
      /** ISO 8601 date string */
      reviewedAt: string;
    };
    ```

- [x] **0.2** Create `services/reviewService.ts`
  - File: `services/reviewService.ts`
  - Storage key: `picky_saver_review_records`
  - Implement five functions per the design:
    - `getReviewRecords()` — parse JSON array from AsyncStorage, return `[]` if key is missing or parse fails
    - `getReviewRecord(year, month)` — find matching record or return `null`
    - `saveReviewRecord(record)` — upsert: read all, filter out matching year+month, append new record, write back
    - `clearReviewRecord(year, month)` — read all, filter out matching year+month, write back
    - `isMonthReviewed(year, month)` — convenience wrapper around `getReviewRecord`
  - Let errors propagate (no try/catch) — the hook layer handles errors
  - Follow the service pattern from `deletionAlbumService.ts` (plain async functions, no class)

- [x] **0.3** Create unit tests for `reviewService`
  - File: `__tests__/services/reviewService.test.ts`
  - Mock `@react-native-async-storage/async-storage` (the mock at `__mocks__/@react-native-async-storage/async-storage.js` should auto-resolve, but verify — if not, add a `jest.mock` call)
  - Follow the testing pattern from `__tests__/services/deletionAlbumService.test.ts`
  - Test cases:
    - `getReviewRecords` returns `[]` when no data stored
    - `getReviewRecords` returns parsed records when data exists
    - `saveReviewRecord` stores and retrieves a record
    - `saveReviewRecord` upserts — saving for same year+month overwrites previous record
    - `getReviewRecord` returns matching record
    - `getReviewRecord` returns `null` for non-existent month
    - `clearReviewRecord` removes only the target month, leaves others intact
    - `clearReviewRecord` is a no-op when record doesn't exist
    - `isMonthReviewed` returns `true` when record exists, `false` otherwise

- [x] **0.4** Build + test gate: `npx expo export --platform ios 2>&1 | head -5 && npm test`

### Observations

- All 4 tasks completed. `ReviewRecord` type added to `types/index.ts`, `reviewService.ts` created with 5 async functions (getReviewRecords, getReviewRecord, saveReviewRecord, clearReviewRecord, isMonthReviewed), and 10 unit tests all passing.
- AsyncStorage mock auto-resolves via jest config (`jest/async-storage-mock.js`) — no manual mock needed.
- Expo build and full test suite (127 tests) pass cleanly. Pre-existing `act(...)` warnings in swipe tests are unrelated.
- Files added: `services/reviewService.ts`, `__tests__/services/reviewService.test.ts`
- Files modified: `types/index.ts`

---

## Phase 1: useReviewHistory Hook

**Goal:** Create the React hook wrapping `reviewService` for use in components, plus unit tests.

### Tasks

- [x] **1.1** Create `hooks/useReviewHistory.ts`
  - File: `hooks/useReviewHistory.ts`
  - Follow the `useDeletionAlbum` hook pattern exactly (see `hooks/useDeletionAlbum.ts`):
    - State: `records: ReviewRecord[]` (sorted by `reviewedAt` descending), `isLoading: boolean`
    - Load on mount via `useEffect` → `refresh()`
    - `refresh()` — call `getReviewRecords()`, sort by `reviewedAt` descending, set state
    - `saveReview(data: Omit<ReviewRecord, 'reviewedAt'>)` — call `saveReviewRecord({...data, reviewedAt: new Date().toISOString()})`, then call `refresh()` to reload state
    - `clearReview(year, month)` — call `clearReviewRecord(year, month)`, then call `refresh()`
    - `isReviewed(year, month)` — synchronous: `records.some(r => r.year === year && r.month === month)`
    - `getRecord(year, month)` — synchronous: `records.find(r => r.year === year && r.month === month)`
  - **Important:** Wrap `refresh`, `saveReview`, and `clearReview` in `useCallback` with correct dependency arrays, exactly as `useDeletionAlbum` does for all its methods. This prevents infinite re-render loops when these functions are used as deps in `useEffect` or `useFocusEffect` in consuming screens.
  - Silently catch errors in `refresh()` (matching `useDeletionAlbum` pattern: `try { ... } catch { } finally { setIsLoading(false) }`)

- [x] **1.2** Create unit tests for `useReviewHistory`
  - File: `__tests__/hooks/useReviewHistory.test.ts`
  - Mock `../../services/reviewService` (follow `__tests__/hooks/useDeletionAlbum.test.ts` pattern)
  - Use `renderHook` from `@testing-library/react-native`
  - Test cases:
    - Loads records on mount and sets `isLoading` correctly
    - `saveReview` calls service with `reviewedAt` added, then refreshes state
    - `clearReview` calls service and refreshes state
    - `isReviewed` returns `true` for existing record, `false` for non-existent
    - `getRecord` returns matching record or `undefined`
    - `refresh` reloads from service
    - Records are sorted by `reviewedAt` descending

- [x] **1.3** Build + test gate: `npx expo export --platform ios 2>&1 | head -5 && npm test`

### Observations

- All 3 tasks completed. `useReviewHistory` hook created following `useDeletionAlbum` pattern exactly: state with `records` and `isLoading`, load on mount via `useEffect`, all methods wrapped in `useCallback` with correct dependency arrays.
- 7 unit tests all passing. Tests cover mount loading, sort order, saveReview, clearReview, isReviewed, getRecord, and refresh.
- Build (expo export) and full test suite (134 tests, 18 suites) pass cleanly. Pre-existing `act(...)` warnings in swipe tests are unrelated.
- Files added: `hooks/useReviewHistory.ts`, `__tests__/hooks/useReviewHistory.test.ts`

---

## Phase 2: Save Review Record on Session Completion

**Goal:** Wire the summary screen to persist a review record when a month is completed. Update existing summary tests.

### Tasks

- [x] **2.1** Modify summary screen to save review record on mount
  - File: `app/summary.tsx`
  - Import `useReviewHistory` from `../hooks/useReviewHistory`
  - Add a `useRef(false)` guard (`hasSavedRef`)
  - Add a `useEffect` that:
    1. Checks `hasSavedRef.current` — if `true`, return early
    2. Sets `hasSavedRef.current = true`
    3. Calls `saveReview({ year: Number(params.year), month: Number(params.month), kept, deleted, total })`
  - Dependency array: `[]` (run once on mount; values come from route params which don't change)
  - **Do not change** any other behavior yet — celebration animation comes in Phase 3

- [x] **2.2** Update summary screen tests
  - File: `__tests__/screens/summary.test.tsx`
  - Add mock for `useReviewHistory`:
    ```typescript
    const mockSaveReview = jest.fn();
    jest.mock('../../hooks/useReviewHistory', () => ({
      useReviewHistory: () => ({
        records: [],
        isLoading: false,
        saveReview: mockSaveReview,
        clearReview: jest.fn(),
        isReviewed: jest.fn(() => false),
        getRecord: jest.fn(() => undefined),
        refresh: jest.fn(),
      }),
    }));
    ```
  - Add test: `saveReview` is called on mount with correct params (`{ year: 2024, month: 3, kept: 18, deleted: 7, total: 25 }`)
  - Verify all existing tests still pass (the "All done!" title test will be updated in Phase 3)

- [x] **2.3** Build + test gate: `npx expo export --platform ios 2>&1 | head -5 && npm test`

### Observations

- All 3 tasks completed. Summary screen now imports `useReviewHistory` and calls `saveReview` on mount with a `useRef(false)` guard to prevent double-save.
- Added `useReviewHistory` mock to summary tests and a new test verifying `saveReview` is called with correct params (`{ year: 2024, month: 3, kept: 18, deleted: 7, total: 25 }`).
- All existing summary tests pass unchanged. Build (expo export) and full test suite (135 tests, 18 suites) pass cleanly.
- Files modified: `app/summary.tsx`, `__tests__/screens/summary.test.tsx`

---

## Phase 3: Celebration Animation

**Goal:** Create the `CelebrationBurst` component and integrate it into the summary screen. Change title to "Month Complete!"

### Tasks

- [x] **3.1** Update reanimated mock to support `Animated.Text`
  - File: `__mocks__/react-native-reanimated.ts`
  - The existing mock only defines `Animated.View` and `Animated.createAnimatedComponent` — `Animated.Text` is missing
  - Import `Text` from `react-native` at the top of the file
  - Add `AnimatedText` forwardRef mirroring the existing `AnimatedView` pattern:
    ```typescript
    const AnimatedText = React.forwardRef((props: any, ref: any) =>
      React.createElement(Text, { ...props, ref }),
    );
    ```
  - Add to the `Animated` object: `Text: AnimatedText`
  - If using `withDelay` for staggered emoji burst, also add: `const withDelay = (_delay: any, anim: any) => anim;` and export it

- [x] **3.2** Create `CelebrationBurst` component
  - File: `components/CelebrationBurst.tsx`
  - Self-contained, no props — plays on mount
  - Implementation:
    - Define an array of 6-8 emoji particles: `['🎉', '⭐', '✨', '🎊', '🎉', '✨']`
    - Each particle gets: `useSharedValue` for translateX, translateY, opacity, scale
    - On mount (`useEffect`), trigger animations:
      - Each emoji: random endpoint (x: -120 to +120, y: -180 to -40), `withTiming` over ~1200ms for position, `withTiming` opacity from 1 to 0 over ~1500ms
      - Consider staggering particle launches with `withDelay(i * 50, ...)` for a more dynamic burst effect
    - Render as `Animated.Text` elements absolutely positioned at center
    - Use `pointerEvents="none"` on the container so it doesn't block touches
  - Also animate the checkmark: `withSpring` scale from 0 to 1 (damping ~8, stiffness ~120)
    - Export this as part of the component: render a large "✓" that springs in, with the emoji burst around it
  - Use `colors.accent` for the checkmark (from `useTheme`)

- [x] **3.3** Integrate `CelebrationBurst` into summary screen
  - File: `app/summary.tsx`
  - Replace the static `<Text style={[styles.checkIcon, { color: colors.accent }]}>✓</Text>` with `<CelebrationBurst />`
  - Change title from `"All done!"` to `"Month Complete!"`
  - Remove the `checkIcon` style (no longer needed — CelebrationBurst handles its own styling)

- [x] **3.4** Update summary screen test for new title
  - File: `__tests__/screens/summary.test.tsx`
  - Update the test `'renders the completion title'` to check for `'Month Complete!'` instead of `'All done!'`
  - The reanimated mock was updated in task 3.1 — verify `Animated.Text` renders correctly in tests

- [x] **3.5** Build + test gate: `npx expo export --platform ios 2>&1 | head -5 && npm test`

### Observations

- All 5 tasks completed. Created `CelebrationBurst` component with 6 emoji particles that burst outward on mount using `withTiming` + `withDelay` stagger, plus a checkmark that springs in via `withSpring`.
- Updated reanimated mock: added `AnimatedText` (forwardRef mirroring `AnimatedView`), `withDelay` mock, and `Text` import from react-native.
- Summary screen: replaced static "✓" with `<CelebrationBurst />`, changed title from "All done!" to "Month Complete!", removed unused `checkIcon` style.
- Summary test updated to assert "Month Complete!" title. All 135 tests pass. Build succeeds.
- `CelebrationBurst` uses `accessibilityElementsHidden` and `importantForAccessibility="no-hide-descendants"` on the checkmark to keep it decorative (the title "Month Complete!" conveys the info).
- Files added: `components/CelebrationBurst.tsx`
- Files modified: `__mocks__/react-native-reanimated.ts`, `app/summary.tsx`, `__tests__/screens/summary.test.tsx`

---

## Phase 4: Date Picker Progress Indicators

**Goal:** Show "✓ Reviewed" badges on completed months in the date picker.

### Tasks

- [x] **4.1** Add `reviewed` prop to `MonthTile`
  - File: `components/MonthTile.tsx`
  - Add optional prop: `reviewed?: boolean` to the `Props` type
  - When `reviewed` is true:
    - Add to the container style: `borderLeftWidth: 3, borderLeftColor: colors.keep`
    - Change caption text from `"{count} photos"` to `"{count} photos · ✓ Reviewed"`, with the " · ✓ Reviewed" portion in `colors.keep`
    - Approach: render the caption as two `Text` elements (or use a nested `Text` for the green portion) so colors can differ
  - When `reviewed` is false/undefined: no change to existing rendering
  - Update accessibility label to include "reviewed" when applicable

- [x] **4.2** Wire date picker to pass review status
  - File: `app/date-picker.tsx`
  - Import `useReviewHistory` from `../hooks/useReviewHistory`
  - Import `useFocusEffect` from `expo-router` (not currently imported — the date picker only imports `useRouter`)
  - In `DatePickerContent`, call `useReviewHistory()` to get `isReviewed` and `refresh` (as `refreshReview`)
  - Create a unified `handleForeground` callback wrapped in `useCallback` that calls both `refresh()` (photo data) and `refreshReview()` (review data), following the home screen's pattern in `app/index.tsx`. Pass this to both `useAppStateRefresh` and `useFocusEffect`.
  - **Important:** `useFocusEffect` requires a stable callback — do NOT pass an inline arrow function. Either pass the `useCallback`-wrapped handler directly, or pass `refreshReview` directly if it's stable from `useCallback` in the hook.
  - In the `renderItem` callback, when rendering a `MonthTile`, pass `reviewed={isReviewed(item.data.year, item.data.month)}`

- [x] **4.3** Add tests for MonthTile reviewed state
  - File: `__tests__/components/MonthTile.test.tsx`
  - Add to existing describe block:
    - `'shows reviewed indicator when reviewed is true'` — render with `reviewed={true}`, assert "✓ Reviewed" text is present
    - `'does not show reviewed indicator when reviewed is false'` — render with `reviewed={false}`, assert "✓ Reviewed" is absent
    - `'does not show reviewed indicator when reviewed is omitted'` — render without prop, assert "✓ Reviewed" is absent
    - `'includes reviewed in accessibility label when reviewed'` — check updated a11y label

- [x] **4.4** Build + test gate: `npx expo export --platform ios 2>&1 | head -5 && npm test`

### Observations

- All 4 tasks completed. `MonthTile` now accepts optional `reviewed` prop: when true, adds a green left border (`borderLeftWidth: 3, borderLeftColor: colors.keep`) and appends " · ✓ Reviewed" in green to the caption. Accessibility label includes ", reviewed" when applicable.
- Date picker now imports `useReviewHistory` and `useFocusEffect` from `expo-router`. Created a unified `handleForeground` callback that refreshes both photo data and review data, used by both `useAppStateRefresh` and `useFocusEffect`. Pull-to-refresh also refreshes both via `Promise.all`.
- `MonthTile` renders `reviewed` prop inline via `isReviewed(item.data.year, item.data.month)`.
- Date picker test file updated: added `useFocusEffect` to expo-router mock and added `useReviewHistory` mock. All existing date picker tests pass unchanged.
- 4 new MonthTile tests added (reviewed indicator shown/hidden, accessibility label). All 139 tests pass. Build succeeds.
- Files modified: `components/MonthTile.tsx`, `app/date-picker.tsx`, `__tests__/components/MonthTile.test.tsx`, `__tests__/screens/datePicker.test.tsx`

---

## Phase 5: HistoryTile Component

**Goal:** Create the `HistoryTile` component for displaying a reviewed month with stats and action buttons, plus unit tests.

### Tasks

- [x] **5.1** Create `HistoryTile` component
  - File: `components/HistoryTile.tsx`
  - Props (per design):
    ```typescript
    type HistoryTileProps = {
      record: ReviewRecord;
      onReviewAgain: (year: number, month: number) => void;
      onClear: (year: number, month: number) => void;
    };
    ```
  - Layout:
    - Container: `colors.surface` background, `borderRadius.md`, `padding: spacing.lg`
    - Title: month name via `getMonthName(record.month)` from `services/photoService` — `fontSize.h2`, `fontWeight.semibold`
    - Subtitle: "Reviewed [date]" — format `record.reviewedAt` to short date (e.g., "Jan 15") using `new Date(record.reviewedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })` — `fontSize.caption`, `colors.textSecondary`
    - Stats row: `"{kept} kept · {deleted} deleted"` — kept in `colors.keep`, deleted in `colors.delete` — `fontSize.caption`
    - Action buttons row (bottom, `flexDirection: 'row'`, `gap: spacing.sm`, `marginTop: spacing.md`):
      - "Review Again" — `AnimatedPressable`, small secondary style (`colors.surface` with border or slightly different bg), `fontSize.small`
      - "Clear" — `AnimatedPressable`, text-only/ghost style, `fontSize.small`, `colors.textSecondary`
  - Accessibility: `accessibilityLabel` on each button, `accessibilityRole="button"`

- [x] **5.2** Create unit tests for `HistoryTile`
  - File: `__tests__/components/HistoryTile.test.tsx`
  - Mock `useTheme` (follow `__tests__/components/MonthTile.test.tsx` pattern)
  - Test cases:
    - Renders month name (e.g., "March" for month 3)
    - Renders formatted review date
    - Renders kept and deleted stats
    - "Review Again" button calls `onReviewAgain` with correct year and month
    - "Clear" button calls `onClear` with correct year and month

- [x] **5.3** Build + test gate: `npx expo export --platform ios 2>&1 | head -5 && npm test`

### Observations

- All 3 tasks completed. `HistoryTile` component created with month name title (via `getMonthName`), formatted review date subtitle, colored kept/deleted stats, and two action buttons ("Review Again" with border style, "Clear" with ghost/text-only style).
- 5 unit tests all passing: renders month name, renders formatted review date, renders kept/deleted stats, Review Again calls `onReviewAgain` with correct args, Clear calls `onClear` with correct args.
- Component follows `MonthTile` patterns: uses `useTheme`, `AnimatedPressable`, same theme constants (`borderRadius.md`, `spacing.lg`, `fontSize`). Both buttons have `accessibilityRole="button"` and `accessibilityLabel`.
- Build (expo export) and full test suite (144 tests, 19 suites) pass cleanly.
- Files added: `components/HistoryTile.tsx`, `__tests__/components/HistoryTile.test.tsx`

---

## Phase 6: History Screen

**Goal:** Create the Review History screen with summary banner, grouped month list, empty state, and pull-to-refresh. Wire up "Review Again" and "Clear" actions.

### Tasks

- [x] **6.1** Register history route in layout
  - File: `app/_layout.tsx`
  - Add `<Stack.Screen name="history" />` to the `Stack` component, after the `to-delete` entry
  - This maintains consistency with the existing pattern — every route in the app is explicitly registered as a `Stack.Screen` in `_layout.tsx`

- [x] **6.2** Create history screen
  - File: `app/history.tsx`
  - Follow `app/date-picker.tsx` structure closely:
    - Wrap in `PermissionGate` (consistent with other screens)
    - Header: back button + "Review History" title (same style as date picker header)
    - Use `useReviewHistory` hook for data
    - `useFocusEffect` to call `refresh()` on focus
  - FlatList:
    - Data: build year-grouped sections from `records` (reuse the `buildSections` pattern — define a local version that works with `ReviewRecord[]` sorted newest-first)
    - `ListHeaderComponent`: summary banner card showing total months, total kept, total deleted (reduce over `records`)
    - Render year headers and `HistoryTile` for each record
    - Pull-to-refresh via `RefreshControl`
  - Empty state: centered text "No months reviewed yet" + "Start Organizing →" button → `/date-picker`
  - "Review Again" handler: `router.push(\`/swipe/${year}/${month}\`)`
  - "Clear" handler: `Alert.alert` confirmation per design, then `clearReview(year, month)`
    - Title: `"Clear?"`
    - Message: `"This will remove the reviewed status for [Month Year]. Your photos won't be affected."`
    - Buttons: Cancel (default), Clear (destructive)

- [x] **6.3** Create history screen tests
  - File: `__tests__/screens/history.test.tsx`
  - Mock pattern: follow `__tests__/screens/home.test.tsx` structure
  - Mock `useReviewHistory`, `expo-router`, `react-native-safe-area-context`, `useTheme`, `usePermissions`
  - Test cases:
    - Renders "Review History" header
    - Renders summary banner with correct totals
    - Renders HistoryTile for each record
    - Shows empty state when no records
    - "Review Again" navigates to correct swipe route
    - "Clear" shows confirmation alert (mock `Alert.alert`)

- [x] **6.4** Build + test gate: `npx expo export --platform ios 2>&1 | head -5 && npm test`

### Observations

- All 4 tasks completed. History screen created at `app/history.tsx` following `date-picker.tsx` structure closely.
- Route registered in `app/_layout.tsx` after `to-delete`.
- Screen features: header with back button + "Review History" title, FlatList with year-grouped sections (records sorted newest-first by year then month), summary banner as `ListHeaderComponent` showing total months/kept/deleted, pull-to-refresh via `RefreshControl`, `useFocusEffect` to refresh on focus.
- Empty state renders "No months reviewed yet" + "Start Organizing →" button routing to `/date-picker`.
- "Review Again" navigates to `/swipe/${year}/${month}`. "Clear" shows `Alert.alert` confirmation with destructive style, then calls `clearReview(year, month)`.
- Local `buildSections` and `groupAndSort` functions handle year grouping — records are sorted by year desc then month desc (not by `reviewedAt`) for logical display order.
- 8 unit tests all passing: header rendering, summary banner totals, HistoryTile rendering, empty state, Review Again navigation, Clear alert display, Clear confirmation calls clearReview, empty state Start Organizing navigation.
- Build (expo export) and full test suite (152 tests, 20 suites) pass cleanly. Pre-existing `act(...)` warnings in swipe tests are unrelated.
- Files added: `app/history.tsx`, `__tests__/screens/history.test.tsx`
- Files modified: `app/_layout.tsx`

---

## Phase 7: Home Screen Button and Final Verification

**Goal:** Add "Review History" button to the home screen, update home tests, and perform a final verification pass across all changes.

### Tasks

- [ ] **7.1** Add "Review History" button to home screen
  - File: `app/index.tsx`
  - Import `useReviewHistory` from `../hooks/useReviewHistory`
  - In `HomeScreen`, call `useReviewHistory()` to get `records` and `refresh`
  - Add `refresh` to the `handleForeground` callback (alongside existing `refreshDeletion` and `refreshMonths`)
  - After the "To Be Deleted" button block (inside the `<>` fragment, after `markedCount > 0 && (...)` block), add:
    ```jsx
    {records.length > 0 && (
      <AnimatedPressable
        style={[styles.secondaryButton, { backgroundColor: colors.surface }]}
        onPress={() => router.push('/history')}
        accessibilityRole="button"
        accessibilityLabel="Review history"
      >
        <Text style={[styles.secondaryButtonText, { color: colors.textPrimary }]}>
          Review History
        </Text>
      </AnimatedPressable>
    )}
    ```
  - Reuse the existing `secondaryButton` / `secondaryButtonText` styles (same as "To Be Deleted" button)

- [ ] **7.2** Update home screen tests
  - File: `__tests__/screens/home.test.tsx`
  - Add mock for `useReviewHistory`:
    ```typescript
    const mockUseReviewHistory = jest.fn();
    jest.mock('../../hooks/useReviewHistory', () => ({
      useReviewHistory: () => mockUseReviewHistory(),
    }));
    ```
  - Set default mock return in `beforeEach`: `{ records: [], isLoading: false, refresh: jest.fn(), ... }`
  - Add tests:
    - `'shows Review History button when records exist'` — mock with `records: [fakeRecord]`, assert "Review History" is rendered
    - `'hides Review History button when no records'` — mock with `records: []`, assert "Review History" is not rendered
    - `'navigates to /history on Review History press'` — assert `mockPush` called with `'/history'`
  - Verify all existing home screen tests still pass (they should — just need the new mock in `beforeEach`)

- [ ] **7.3** Accessibility verification
  - Review all new/modified files for correct `accessibilityRole`, `accessibilityLabel` usage:
    - `components/CelebrationBurst.tsx` — decorative, should not be announced
    - `components/HistoryTile.tsx` — buttons labeled, stats readable
    - `components/MonthTile.tsx` — updated label includes "reviewed" when applicable
    - `app/history.tsx` — header has `accessibilityRole="header"`, buttons labeled
    - `app/summary.tsx` — title still has `accessibilityRole="header"`

- [ ] **7.4** Design compliance check
  - Read `ralph/projects/progress-tracking/design.md` and verify:
    - All files listed in "Files Changed" table have been created/modified
    - `ReviewRecord` type matches the design spec
    - Service functions match the design spec signatures
    - Hook API matches the design spec
    - "Clear" (not "Clear Review") is used everywhere
    - Upsert behavior works correctly (saving same year+month overwrites)
    - No partial state is saved anywhere
    - Summary screen uses `useRef` guard against double-save
    - CelebrationBurst is a standalone component (easy to swap)

- [ ] **7.5** Final build + test gate: `npx expo export --platform ios 2>&1 | head -5 && npm test`

### Observations

<!-- Agent: write notes here during execution -->

---

## Files Changed Summary

### New Files
| File | Phase | Purpose |
|------|-------|---------|
| `services/reviewService.ts` | 0 | AsyncStorage CRUD for review records |
| `__tests__/services/reviewService.test.ts` | 0 | Unit tests for review service |
| `hooks/useReviewHistory.ts` | 1 | React hook wrapping reviewService |
| `__tests__/hooks/useReviewHistory.test.ts` | 1 | Unit tests for review hook |
| `components/CelebrationBurst.tsx` | 3 | Self-contained emoji burst animation |
| `components/HistoryTile.tsx` | 5 | History list item with stats and actions |
| `__tests__/components/HistoryTile.test.tsx` | 5 | Unit tests for HistoryTile |
| `app/history.tsx` | 6 | Review History screen |
| `__tests__/screens/history.test.tsx` | 6 | Unit tests for history screen |

### Modified Files
| File | Phases | Changes |
|------|--------|---------|
| `types/index.ts` | 0 | Add `ReviewRecord` type |
| `__mocks__/react-native-reanimated.ts` | 3 | Add `Animated.Text` (and `withDelay` if used) to mock |
| `app/summary.tsx` | 2, 3 | Phase 2: save record on mount. Phase 3: CelebrationBurst, title change |
| `__tests__/screens/summary.test.tsx` | 2, 3 | Phase 2: add saveReview mock+test. Phase 3: update title assertion |
| `components/MonthTile.tsx` | 4 | Add optional `reviewed` prop with green border + badge |
| `__tests__/components/MonthTile.test.tsx` | 4 | Add reviewed state tests |
| `app/date-picker.tsx` | 4 | Wire useReviewHistory, add useFocusEffect, unified refresh handler, pass reviewed to MonthTile |
| `app/_layout.tsx` | 6 | Add `<Stack.Screen name="history" />` |
| `app/index.tsx` | 7 | Add "Review History" button, wire useReviewHistory |
| `__tests__/screens/home.test.tsx` | 7 | Add useReviewHistory mock, Review History button tests |
