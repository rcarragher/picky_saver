# Month Review Progress Tracking — Design Specification

> **Status:** Final
> **Date:** 2026-04-01

## Goal

Let users see and celebrate their photo-organizing progress. When a user finishes swiping through all photos in a month, the app records that session, shows a celebratory moment, and marks the month as reviewed. A Review History screen lets users browse past sessions with stats, re-review any month, or clear a month's reviewed status.

---

## Current State

### What exists

The app has a linear flow: **Home → Date Picker → Swipe → Summary**. When the user finishes swiping all photos in a month, the swipe screen auto-navigates to the summary screen with query params (`total`, `kept`, `deleted`, `year`, `month`). The summary shows a static "✓ All done!" with stat cards and buttons for "Review Deletions" or "Back to Home."

There is no persistence of session outcomes — once the user leaves the summary screen, the fact that they reviewed a month is lost. The date picker shows every month identically regardless of whether it's been reviewed.

**Data/state patterns in use:**
| Pattern | Where | Mechanism |
|---------|-------|-----------|
| Onboarding flag | `OnboardingOverlay` | `AsyncStorage.setItem('onboarding_complete', 'true')` |
| Hint swipe count | Swipe screen | `AsyncStorage.setItem('picky_saver_swipe_count', String(n))` |
| Deletion staging | `deletionAlbumService` | Native MediaLibrary album |
| Session stats | Summary screen | URL query params (ephemeral) |

### Problems

1. **No memory of progress.** Users can't tell which months they've already reviewed. After organizing 6 months of photos, the date picker looks exactly the same as day one — no sense of accomplishment.
2. **No celebration.** The summary screen says "All done!" but it's static and low-energy. There's no rewarding moment for completing what can be a tedious task.
3. **No session history.** Users can't look back at what they've done — how many photos they organized, which months are clean. There's no "before and after" story.
4. **No easy re-review.** If a user wants to go back through a month (e.g., they were too hasty, or new photos synced), they have to navigate Home → Date Picker → find the month → tap. There's no shortcut from a history view.

---

## Design

### 1. Data Model — `ReviewRecord`

A review record is a snapshot of a completed swipe session for a specific month.

```typescript
type ReviewRecord = {
  year: number;
  month: number;       // 1-based (1 = January)
  kept: number;
  deleted: number;
  total: number;
  reviewedAt: string;  // ISO 8601, e.g. "2026-04-01T14:30:00.000Z"
};
```

**Key:** A record is uniquely identified by `year + month`. Only one record exists per month — completing a re-review overwrites the previous record.

**Why no session history (multiple records per month)?** The user cares about whether a month is "done," not how many times they did it. Stacking sessions adds complexity (which record to show? how to summarize?) without clear user value. If we later want session history, we can add a `sessions: []` array inside the record — the simpler model doesn't prevent this.

### 2. Storage — AsyncStorage

**Storage key:** `picky_saver_review_records`
**Format:** JSON-serialized `ReviewRecord[]`

```
AsyncStorage:
  "picky_saver_review_records" → '[{"year":2026,"month":1,"kept":40,"deleted":12,...}, ...]'
```

**Why AsyncStorage and not SQLite/MMKV?**
- Matches the existing two AsyncStorage patterns in the codebase
- The data volume is tiny — at most ~120 records (10 years × 12 months), each ~100 bytes
- No queries needed beyond "get all" and "find by year+month"
- No new dependencies

**Data lifecycle:** Records persist until explicitly cleared by the user. Uninstalling the app clears AsyncStorage. There's no sync, no backup — this is local convenience data, not critical.

### 3. Review Service — `services/reviewService.ts`

Thin wrapper over AsyncStorage. All functions are async. No caching layer (the hook handles in-memory state).

```
reviewService.ts
├── getReviewRecords(): Promise<ReviewRecord[]>
├── getReviewRecord(year, month): Promise<ReviewRecord | null>
├── saveReviewRecord(record: ReviewRecord): Promise<void>   // upsert
├── clearReviewRecord(year, month): Promise<void>
└── isMonthReviewed(year, month): Promise<boolean>
```

**Upsert logic in `saveReviewRecord`:**
```
1. Read existing records from storage
2. Filter out any record matching (year, month)
3. Append the new record
4. Write back to storage
```

**Error handling:** Let errors propagate. The calling hook/screen can decide how to handle (the existing pattern in the codebase is to silently catch in hooks).

### 4. Review History Hook — `hooks/useReviewHistory.ts`

Follows the `useDeletionAlbum` pattern: load on mount, expose methods that update both storage and local state.

```
useReviewHistory()
├── State
│   ├── records: ReviewRecord[]        // all records, sorted newest-first by reviewedAt
│   └── isLoading: boolean
├── Methods
│   ├── saveReview(data): Promise<void>  // accepts Omit<ReviewRecord, 'reviewedAt'>, adds timestamp
│   ├── clearReview(year, month): Promise<void>
│   ├── isReviewed(year, month): boolean  // synchronous, checks loaded records
│   ├── getRecord(year, month): ReviewRecord | undefined  // synchronous
│   └── refresh(): Promise<void>
```

**Why synchronous `isReviewed` and `getRecord`?** The hook loads all records on mount. Screens need to check review status for many months (date picker renders a list) — making each check async would be awkward and slow. The synchronous methods read from the already-loaded `records` array.

**Sort order:** Records sorted by `reviewedAt` descending (most recently reviewed first). This is the natural order for the history screen.

### 5. Session Recording — Summary Screen Integration

**When to record:** The summary screen already receives all needed data as route params (`year`, `month`, `kept`, `deleted`, `total`). On mount, it calls `saveReview()` to persist the record.

**What "complete" means:** A month is only recorded as reviewed when the user swipes through *every* photo — i.e., when the swipe screen's `currentIndex >= photos.length` triggers the auto-navigation to the summary screen. If the user taps the back button mid-session, nothing is saved. No partial state is persisted. The next time they enter that month, they start from photo #1 again.

**Why no partial save / resume?** Partial state would require tracking which specific photo IDs were already swiped, handling photos added or deleted between sessions, and introducing an "In Progress" status. This is a lot of complexity for a case that should be rare — the natural UX encourages finishing a month once you start. Starting fresh also guarantees the user sees every photo with fresh eyes, which aligns with the app's purpose (being "picky").

**Flow:**
```
Swipe screen (last photo swiped)
  → router.replace('/summary?total=52&kept=40&deleted=12&year=2026&month=1')
    → Summary screen mounts
      → useEffect calls saveReview({ year: 2026, month: 1, kept: 40, deleted: 12, total: 52 })
      → Celebration animation plays
      → User sees stats and action buttons
```

**Guard against double-save:** Use a `useRef(false)` flag. The `useEffect` checks the ref, sets it to `true`, then calls `saveReview`. This prevents double-execution from React strict mode or re-renders.

**What stays the same on summary screen:**
- Route params and how they're parsed
- Stat cards (kept/deleted)
- "Review Deletions" and "Back to Home" buttons
- Gesture prevention (no swipe-back)

### 6. Celebration Moment

**Current state:** Static "✓" text element + "All done!" title.

**New state:** Animated celebration that plays on mount:

1. **Title changes** from "All done!" to "Month Complete!" — feels more specific and accomplished.
2. **Emoji burst animation** — 6-8 emoji elements (🎉 ⭐ ✨ 🎊) that start at center, burst outward in random directions, and fade out over ~1.5 seconds.
3. **Checkmark scales up** — the ✓ animates from 0 to full size with a spring bounce.

**Implementation approach:** Use `react-native-reanimated` (already in the project). Each emoji gets a `useSharedValue` for position (x, y) and opacity. On mount, trigger `withTiming` to move each emoji to a random endpoint and fade to 0. The checkmark uses `withSpring` for the scale-up.

**Why not a confetti library?** Adding `react-native-confetti-cannon` or similar means a new dependency, potential native rebuild, and heavier animation. The emoji approach is lightweight, matches the app's emoji-text aesthetic (the home screen uses 📷), and needs zero new deps.

**Configurability:** Extract the celebration into its own component (`components/CelebrationBurst.tsx`) so the intensity can be easily tuned or swapped later. The component takes no props — it's self-contained and plays on mount. If we ever want to dial it up (full confetti) or down (just the checkmark), we only change one file.

**Performance note:** The animation is fire-and-forget — it runs once on mount and all shared values are cleaned up when the component unmounts. No ongoing animation loop.

### 7. Date Picker — Progress Indicators

When a month has been reviewed, its `MonthTile` in the date picker should look visually distinct to give users that satisfying sense of progress.

**Visual treatment for reviewed months:**

```
┌──────────────────────────────────┐
│ ┃  January 2026                  │   ← green left border (3px)
│ ┃  52 photos · ✓ Reviewed        │   ← "✓ Reviewed" in green
│                              →   │
└──────────────────────────────────┘
```

vs. an un-reviewed month (unchanged):

```
┌──────────────────────────────────┐
│  January 2026                    │
│  52 photos                       │
│                              →   │
└──────────────────────────────────┘
```

**Changes to `MonthTile`:**
- New optional prop: `reviewed?: boolean`
- When `true`: add `borderLeftWidth: 3, borderLeftColor: colors.keep` to the container
- When `true`: append " · ✓ Reviewed" to the caption text in `colors.keep`

**Changes to `date-picker.tsx`:**
- Import `useReviewHistory`
- For each month, pass `reviewed={isReviewed(year, month)}` to `MonthTile`
- Refresh review status on screen focus (`useFocusEffect`) so the indicator appears immediately after completing a review and navigating back

**Months remain fully tappable.** A reviewed month can always be re-entered for another round of swiping.

### 8. History Screen — `app/history.tsx`

A new screen accessible from the home screen. Shows all reviewed months with session stats and actions.

**Navigation:** Home screen gets a new "Review History" button (secondary style, like "To Be Deleted"). Routes to `/history`. Only visible when `records.length > 0`.

**Layout:**

```
┌────────────────────────────────────┐
│  ← Review History                  │   ← Header (matches date-picker style)
│                                    │
│  2026                              │   ← Year header
│ ┌────────────────────────────────┐ │
│ │  January                       │ │
│ │  Reviewed Jan 15               │ │
│ │  40 kept · 12 deleted          │ │
│ │                                │ │
│ │  [Review Again]  [Clear]│ │   ← Action buttons
│ └────────────────────────────────┘ │
│ ┌────────────────────────────────┐ │
│ │  March                         │ │
│ │  Reviewed Mar 2                │ │
│ │  ...                           │ │
│ └────────────────────────────────┘ │
│                                    │
│  2025                              │   ← Year header
│ ┌────────────────────────────────┐ │
│ │  December                      │ │
│ │  ...                           │ │
```

**Summary banner at top:** Before the month list, show a motivational summary card:
```
┌────────────────────────────────────┐
│  🎯  6 months reviewed            │
│  248 kept · 67 deleted             │
└────────────────────────────────────┘
```
Computed by reducing over all records. Uses `colors.surface` background, centered text. The kept count uses `colors.keep`, deleted count uses `colors.delete`. Rendered as the `ListHeaderComponent` of the FlatList.

**Grouping:** Records grouped by year, sorted newest-first (both years and months within years). Reuse the `buildSections` pattern from the date picker.

**Empty state:** "No months reviewed yet" with a "Start Organizing →" button that routes to `/date-picker`.

**Pull-to-refresh:** Supported (calls `refresh()` on the hook).

### 9. History Tile Component — `components/HistoryTile.tsx`

A self-contained card for one reviewed month.

**Props:**
```typescript
type HistoryTileProps = {
  record: ReviewRecord;
  onReviewAgain: (year: number, month: number) => void;
  onClear: (year: number, month: number) => void;
};
```

**Layout details:**
- **Title:** Month name (e.g., "January") — use `getMonthName()` from `photoService`
- **Subtitle:** "Reviewed Jan 15" — format `reviewedAt` to a short date
- **Stats row:** "{kept} kept · {deleted} deleted" — kept count in `colors.keep`, deleted count in `colors.delete`
- **Action buttons:** Two small buttons at the bottom of the tile
  - "Review Again" — secondary style, triggers `onReviewAgain(year, month)`
  - "Clear" — text-only/ghost style, triggers `onClear(year, month)`

**Styling:** Uses `colors.surface` background, `borderRadius.md`, consistent with `MonthTile`.

### 10. Actions — Review Again and Clear

**"Review Again"**
- Navigates to `/swipe/${year}/${month}`
- The swipe screen fetches fresh photos from MediaLibrary for that month
- User swipes through all remaining photos (photos previously kept are still there; photos previously deleted via the "To Delete" flow are gone)
- Upon completion, the summary screen fires `saveReview()` which upserts — the old record is replaced with new stats
- This means the history always reflects the most recent review

**"Clear"**
- Shows a confirmation dialog via `Alert.alert`:
  ```
  Title: "Clear?"
  Message: "This will remove the reviewed status for January 2026. Your photos won't be affected."
  Buttons: [Cancel (default), Clear (destructive style)]
  ```
- On confirm: calls `clearReview(year, month)` from the hook
- The tile disappears from the history list
- The month's "✓ Reviewed" badge disappears from the date picker (on next focus)
- **No photos are affected** — this only removes the metadata record

### 11. Home Screen Changes

**New button: "Review History"**
```
┌──────────────────────────────────┐
│        Start Organizing →        │   ← Primary (accent) — existing
└──────────────────────────────────┘
┌──────────────────────────────────┐
│    To Be Deleted (5 photos)      │   ← Secondary (surface) — existing, conditional
└──────────────────────────────────┘
┌──────────────────────────────────┐
│       Review History             │   ← Secondary (surface) — NEW, conditional
└──────────────────────────────────┘
```

- Only shown when `records.length > 0` (same pattern as "To Be Deleted" which checks `markedCount > 0`)
- Style: matches "To Be Deleted" button exactly (secondary, surface background)
- Routes to `/history`

**Integration:** The home screen already uses `useFocusEffect` to refresh data. Add `useReviewHistory` and call `refresh()` on focus so the button appears/disappears correctly.

---

## Interaction with Existing Code

### `types/index.ts`
- **Add:** `ReviewRecord` type after `SwipeSession`
- **Unchanged:** `MonthBatch`, `SwipeDirection`, `SwipeSession`

### `app/summary.tsx`
- **Add:** `useReviewHistory` hook import, `useEffect` to save record on mount, `useRef` guard
- **Modify:** Replace static "✓" with animated celebration, change title to "Month Complete!"
- **Unchanged:** Route params parsing, stat cards layout, "Review Deletions" button, "Back to Home" button, gesture prevention

### `components/MonthTile.tsx`
- **Add:** Optional `reviewed` prop, conditional left border and "✓ Reviewed" text
- **Unchanged:** Existing props (`year`, `month`, `count`, `onPress`), tap behavior, layout structure

### `app/date-picker.tsx`
- **Add:** `useReviewHistory` hook, pass `reviewed` prop to `MonthTile`, `useFocusEffect` for review refresh
- **Unchanged:** FlatList structure, year grouping, pull-to-refresh, shimmer loading, navigation to swipe screen

### `app/index.tsx`
- **Add:** `useReviewHistory` hook, "Review History" button (conditional), refresh on focus
- **Unchanged:** "Picky Saver" branding, "Start Organizing" button, "To Be Deleted" button, empty/loading states

### `app/swipe/[year]/[month].tsx`
- **No changes.** The swipe screen doesn't need to know about review records. It does its job (fetch photos, enable swiping, navigate to summary) exactly as before. The summary screen handles persistence.

### `hooks/useDeletionAlbum.ts`
- **No changes.**

### `services/photoService.ts`, `services/deletionAlbumService.ts`
- **No changes.**

---

## Files Changed

| File | Change |
|------|--------|
| `types/index.ts` | Add `ReviewRecord` type |
| `services/reviewService.ts` | **New file.** AsyncStorage CRUD for review records |
| `hooks/useReviewHistory.ts` | **New file.** React hook wrapping reviewService |
| `components/CelebrationBurst.tsx` | **New file.** Self-contained emoji burst animation component |
| `app/summary.tsx` | Save review record on mount, integrate CelebrationBurst, title change |
| `components/MonthTile.tsx` | Add optional `reviewed` prop with visual indicator |
| `app/date-picker.tsx` | Pass review status to MonthTile, refresh on focus |
| `app/history.tsx` | **New file.** Review History screen |
| `components/HistoryTile.tsx` | **New file.** History list item with stats and actions |
| `app/index.tsx` | Add "Review History" button |
| `__tests__/services/reviewService.test.ts` | **New file.** Unit tests |
| `__tests__/hooks/useReviewHistory.test.ts` | **New file.** Unit tests |
| `__tests__/components/MonthTile.test.tsx` | **New file.** Unit tests for reviewed state |
| `__tests__/components/HistoryTile.test.tsx` | **New file.** Unit tests |
| `__tests__/app/summary.test.tsx` | **New file.** Unit tests for save behavior |
| `__tests__/app/history.test.tsx` | **New file.** Unit tests for actions |

---

## Open Questions

1. **Should partial reviews be saved?**
   _Resolved:_ No. "Reviewed" means the user swiped every photo in the month. If they back out mid-session, nothing is saved and they start from photo #1 next time. No partial state, no resume. This keeps the model simple and ensures "Reviewed" is a meaningful badge of completion.

2. **Where should the history screen be accessible from?**
   _Resolved:_ Button on the home screen, same level as "To Be Deleted." Most discoverable, consistent with existing patterns. Lay it out in a visually appealing way.

3. **Celebration intensity — how much is too much?**
   _Resolved:_ Medium — checkmark spring animation + 4-6 emoji burst that fades in ~1.5s. Extracted into a standalone `CelebrationBurst` component so intensity can be easily tuned later without touching the summary screen logic.

4. **Should the history screen show a total summary at the top?**
   _Resolved:_ Yes. Show a summary banner: "6 months reviewed — 248 kept · 67 deleted." Computed by reducing over all records. Rendered as `ListHeaderComponent`.

5. **Naming confirmation**
   _Resolved:_ Final names:
   | Concept | Name |
   |---------|------|
   | Completion status | "Reviewed" |
   | History screen title | "Review History" |
   | Re-enter swipe flow | "Review Again" |
   | Remove reviewed status | "Clear" |
