# Picky Saver — Pre-Execution Critique

> **Documents reviewed:** plan.md (build-plan.md), plans/implementation-plan.md, plans/ui-design.md
> **Reviewer:** Claude Opus 4.6
> **Date:** 2026-03-29

---

## Summary

The plan proposes a 17-step build of a React Native + Expo photo organizer app with swipe-to-delete UX, file-based routing, and album-based deletion persistence. The overall structure is sound and well-sequenced, but there are several concrete issues — a missing dependency, an ambiguous month-indexing convention that will cause off-by-one bugs, a directory nesting problem in Step 1, and performance concerns around photo enumeration — that should be resolved before execution begins.

---

## Findings

### Critical

**1. Missing AsyncStorage dependency**

- **Where:** Step 1 (dependencies), Step 6 (hint fade after 5 swipes), Step 7 (onboarding_complete flag)
- **What the plan says:** Step 6 says "fades after 5 swipes (use AsyncStorage to track)." Step 7 says "set AsyncStorage flag `onboarding_complete: true`."
- **The problem:** Neither `@react-native-async-storage/async-storage` nor any equivalent (e.g., `expo-secure-store`) is listed in Step 1's dependency installs. The build will fail or the agent will improvise when it reaches Steps 6-7, potentially choosing an inconsistent storage solution.
- **Fix:** Add `@react-native-async-storage/async-storage` to the production package list in Step 1. Alternatively, use `expo-secure-store` if you prefer staying within the Expo ecosystem, though AsyncStorage is more appropriate for non-sensitive preferences.

**2. Month indexing ambiguity — 0-based vs 1-based**

- **Where:** Step 5 (photoService.ts), Step 6 (route params `/swipe/[year]/[month]`)
- **What the plan says:** `getPhotosForMonth(year, month)` uses `new Date(year, month, 1)` for the start and `new Date(year, month + 1, 0, 23, 59, 59)` for the end. The route is `/swipe/${year}/${month}`.
- **The problem:** JavaScript's `Date` constructor uses 0-based months (January = 0). But the route URL will almost certainly display human-readable months (e.g., `/swipe/2024/3` for March). If the `MonthBatch` type stores month as 1-based (January = 1) — which is natural for display and URLs — then passing it directly to `new Date(year, month, 1)` will query the *wrong* month (April instead of March). The plan never specifies the convention, and the `MonthBatch` type definition just says "month" without clarifying.
- **Fix:** Explicitly state that `MonthBatch.month` is 1-based (1 = January, 12 = December) for human readability and URL clarity. Then in `getPhotosForMonth`, use `new Date(year, month - 1, 1)` and `new Date(year, month, 0, 23, 59, 59)`. Document this convention in the `types/index.ts` definition.

### Important

**3. `create-expo-app` creates a nested directory**

- **Where:** Step 1
- **What the plan says:** `npx create-expo-app picky-saver --template blank-typescript`
- **The problem:** The user's working directory is `/Users/rickcar/play/picky_saver/`. Running this command will create `/Users/rickcar/play/picky_saver/picky-saver/` — a nested subdirectory. The plan's project structure (and all file paths like `app/`, `components/`, `services/`) assumes these live at the project root, not inside a subdirectory. The executing agent will either work in the wrong directory or need to reconcile this mismatch.
- **Fix:** Either (a) run `create-expo-app` from the parent directory (`/Users/rickcar/play/`) and rename the result to `picky_saver`, or (b) run `create-expo-app` with `.` as the name to scaffold in the current directory (if supported by the current version), or (c) scaffold into a temp name and move contents up. Whichever approach is chosen, specify it explicitly so the agent doesn't have to guess.

**4. `getAvailableMonths()` performance for large libraries**

- **Where:** Step 5 (photoService.ts)
- **What the plan says:** "paginate through all assets via `MediaLibrary.getAssetsAsync({ sortBy: ['creationTime'], first: 500 })`, group by year/month."
- **The problem:** This fetches metadata for *every photo on the device* to build month counts. A user with 20,000+ photos will experience a multi-second delay on the date picker screen (each page is a round-trip to the native bridge). The plan acknowledges pagination but doesn't address the performance impact. The shimmer loading state helps UX, but the underlying operation could take 5-10 seconds on a large library.
- **Fix:** Consider progressive loading: fetch the first few pages to populate visible months quickly, then continue pagination in the background to get accurate counts. Alternatively, cache the month index (with a staleness check) so subsequent visits are instant. At minimum, add a note about expected performance characteristics so the agent can implement appropriate optimizations rather than a naive fetch-all-then-render approach.

**5. Steps 3 and 13 overlap on theme implementation**

- **Where:** Step 3 ("Set up dark/light mode support... `useTheme()` hook"), Step 13 ("Create `hooks/useTheme.ts` (if not done in step 3)")
- **What the plan says:** Step 3 creates the theme hook. Step 13 creates it again "if not done."
- **The problem:** This is ambiguous. Step 3 says to create the hook, so it *will* be done. Step 13 then has a conditional that will never trigger, making its first task a no-op. The real work in Step 13 — applying theme colors to every screen — should be happening incrementally in Steps 4-11 as screens are built. By Step 13, if screens weren't themed from the start, this becomes a large retroactive pass that's easy to do inconsistently.
- **Fix:** Remove Step 13 as a standalone step. Instead, add a note to each screen-building step (Steps 4-11) that all components must use the theme hook from Step 3. This ensures dark mode support is built in from the start rather than bolted on later.

**6. No image optimization for the swipe screen**

- **Where:** Step 6 (PhotoCard.tsx)
- **What the plan says:** "Photo displayed via `<Image source={{ uri: asset.uri }}>`"
- **The problem:** `asset.uri` points to the full-resolution photo. During rapid swiping, loading full-resolution images (potentially 12MP+ / 4-8MB each) into `<Image>` will cause significant memory pressure and potential OOM crashes, especially on older devices. React Native's `<Image>` does some caching but isn't optimized for this use case.
- **Fix:** Use `expo-image` (add to Step 1 dependencies) which provides better caching, memory management, and placeholder support. For the swipe card, request a screen-sized resolution rather than full resolution. `expo-media-library` assets have a `uri` that can be used with `expo-image`'s built-in optimizations. The next-photo preload mentioned in the plan also needs `expo-image`'s prefetch API to actually work.

**7. Jest version compatibility risk**

- **Where:** Step 2 (test infrastructure), implementation-plan.md
- **What the plan says:** The implementation plan specifies `jest ^30.0.0` and `jest-expo ~52.0.0`.
- **The problem:** Jest 30 was a major version bump with breaking changes. `jest-expo` presets are tightly coupled to specific Jest major versions. As of the plan's writing, `jest-expo` may not support Jest 30 — the preset historically targets the Jest version that ships with the Expo SDK. Installing Jest 30 alongside an incompatible `jest-expo` will fail silently or produce confusing errors.
- **Fix:** Don't pin Jest independently. Let `jest-expo` pull in its compatible Jest version. In Step 2, install `jest-expo` first and verify which Jest version it brings, then use that. Remove the explicit `jest ^30.0.0` from the install list.

### Suggestions

**8. Step 12's "stale state" filtering is unnecessary for fetched data**

- **Where:** Step 12 ("filter out assets that no longer resolve")
- **What the plan says:** "Photos deleted outside the app: when loading month photos or deletion album, filter out assets that no longer resolve."
- **Analysis:** `MediaLibrary.getAssetsAsync()` only returns assets that currently exist in the library. A photo deleted outside the app simply won't appear in query results — there's nothing to filter. The real stale-state issue is *in-memory references*: if the user backgrounds the app, deletes photos in the system Photos app, then returns, any Asset objects held in React state may reference deleted assets. The fix is to re-fetch on app foreground (`AppState` listener), not to filter query results.
- **Suggestion:** Replace the "filter out" language with "re-fetch photo data when the app returns to foreground via an `AppState` change listener."

**9. Route params are strings, not numbers**

- **Where:** Step 6 (`app/swipe/[year]/[month].tsx`)
- **Analysis:** Expo Router delivers dynamic route params as strings. The plan doesn't mention parsing `year` and `month` from string to number before passing them to `getPhotosForMonth()`. This is minor but the kind of thing an executing agent might miss, leading to `new Date("2024", "3", 1)` which *does* work in JS but is fragile.
- **Suggestion:** Add a note in Step 6 to parse route params: `const year = Number(params.year); const month = Number(params.month);` with validation.
