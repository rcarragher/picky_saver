# Month Review Progress Tracking — Pre-Execution Critique

> **Documents reviewed:** design.md, plan.md
> **Reviewer:** Claude Opus 4.6
> **Date:** 2026-04-01

---

## Summary

The design proposes adding persistent review tracking, a celebration animation, date picker badges, a history screen, and a home screen button — all using AsyncStorage and existing patterns. The plan breaks this into 8 well-scoped phases. Overall readiness is high, but there are a few issues that will cause test failures or inconsistencies if not addressed before execution.

---

## Findings

### Critical

**1. Reanimated mock is missing `Animated.Text` — Phase 3 tests will fail**

- **Section:** Phase 3.1 (CelebrationBurst component)
- **What the plan says:** CelebrationBurst renders emoji particles as `Animated.Text` elements using `react-native-reanimated`.
- **What the code actually does:** The reanimated mock at `__mocks__/react-native-reanimated.ts:24-31` only defines `Animated.View` and `Animated.createAnimatedComponent`. There is no `Animated.Text` export. When the CelebrationBurst component references `Animated.Text`, tests will throw `TypeError: Cannot read properties of undefined` or render nothing.
- **Fix:** Before or during Phase 3, add `Animated.Text` to the mock, mirroring the `AnimatedView` pattern:
  ```typescript
  const AnimatedText = React.forwardRef((props: any, ref: any) =>
    React.createElement(Text, { ...props, ref }),
  );
  // Add to Animated object:
  const Animated = {
    View: AnimatedView,
    Text: AnimatedText,
    createAnimatedComponent: (comp: any) => comp,
  };
  ```
  Import `Text` from `react-native` at the top of the mock file.

---

### Important

**2. Design's "Files Changed" table has incorrect test paths and wrong "New file" labels**

- **Section:** Design — "Files Changed" table
- **What the design says:** Lists `__tests__/app/summary.test.tsx` and `__tests__/app/history.test.tsx` as file paths, and labels `__tests__/components/MonthTile.test.tsx` and `__tests__/app/summary.test.tsx` as "**New file.**"
- **What the code actually does:** Test files for screens live under `__tests__/screens/`, not `__tests__/app/`. The files `__tests__/screens/summary.test.tsx` and `__tests__/components/MonthTile.test.tsx` already exist and should be modified, not created fresh.
- **Impact:** The plan already corrects these paths (`__tests__/screens/summary.test.tsx`, `__tests__/screens/history.test.tsx`) and correctly marks them as modified vs. new. So this won't cause execution failures if the agent follows the plan, but the design is inconsistent with the plan and could cause confusion if referenced during execution.
- **Fix:** Update the design's Files Changed table to use `__tests__/screens/` paths and change "New file" to "Modified" for `summary.test.tsx` and `MonthTile.test.tsx`.

**3. `app/_layout.tsx` not updated — history route missing from explicit screen list**

- **Section:** Plan — all phases; Design — "Files Changed" table
- **What the documents say:** Neither the design nor the plan mentions updating `app/_layout.tsx`.
- **What the code actually does:** `app/_layout.tsx:14-35` explicitly registers every route as a `Stack.Screen` entry (`index`, `date-picker`, `swipe`, `summary`, `to-delete`). While Expo Router auto-discovers file-based routes, the existing code follows a pattern of explicit registration.
- **Impact:** The history screen will likely work without registration (Expo Router auto-discovery), and the `screenOptions` on the Stack will apply the `slide_from_right` animation. However, if any screen-specific options are needed later (e.g., preventing gesture back), the entry won't exist. More importantly, the inconsistency with the existing pattern could confuse future contributors.
- **Fix:** Add a task (Phase 6 or 7) to add `<Stack.Screen name="history" />` to `_layout.tsx` and add `_layout.tsx` to the Files Changed tables.

**4. Phase 1.1 doesn't explicitly specify `useCallback` for hook methods**

- **Section:** Phase 1.1 (useReviewHistory hook)
- **What the plan says:** "Follow the `useDeletionAlbum` hook pattern exactly" — then lists the methods without mentioning `useCallback`.
- **What the code actually does:** `hooks/useDeletionAlbum.ts` wraps every method (`refresh`, `markForDeletion`, `restore`, `restoreAll`, `permanentlyDeleteAll`) in `useCallback` with explicit dependency arrays. This is important for preventing infinite re-render loops when these functions are used as dependencies in `useEffect` or `useFocusEffect`.
- **Impact:** If the executing agent doesn't pick up on the implicit "use `useCallback`" from the pattern reference, the hook's `saveReview`, `clearReview`, and `refresh` functions will be recreated on every render. This would cause the summary screen's `useFocusEffect` (home screen, Phase 7) to fire in a loop, and React lint warnings about unstable deps.
- **Fix:** Explicitly state in Phase 1.1 that `saveReview`, `clearReview`, and `refresh` must be wrapped in `useCallback`, matching the `useDeletionAlbum` pattern.

**5. Date picker Phase 4.2 doesn't call `useFocusEffect` correctly for review refresh**

- **Section:** Phase 4.2 (date-picker.tsx)
- **What the plan says:** "Add `useFocusEffect` (import from `expo-router`) that calls `refresh()`"
- **What the code actually does:** The date picker currently does NOT use `useFocusEffect`. It imports only `useRouter` from `expo-router`. The home screen demonstrates the correct `useFocusEffect` pattern, calling a `useCallback`-wrapped handler. However, calling `refresh()` directly inside `useFocusEffect` (without wrapping it in `useCallback`) would fire on every render because `useFocusEffect` expects a stable callback.
- **Impact:** If the agent writes `useFocusEffect(() => { refresh(); })` without `useCallback`, it will work but generate a React warning about the unstable callback argument. The home screen avoids this by passing its `handleForeground` callback (already `useCallback`-wrapped) directly.
- **Fix:** Clarify in Phase 4.2 that the `useFocusEffect` callback must be wrapped in `useCallback` (or `refresh` must be passed directly if it's stable from `useCallback` in the hook). Reference the home screen's pattern explicitly.

---

### Suggestions

**6. Consider combining the date picker's `useAppStateRefresh` and new `useFocusEffect` refresh logic**

- **Section:** Phase 4.2
- **Observation:** After Phase 4.2, the date picker will have two independent refresh mechanisms: `useAppStateRefresh(refresh)` for photo data refresh on app foreground, and a new `useFocusEffect` for review data refresh on screen focus. If the user completes a review and returns to the date picker, both need to fire. The home screen combines both hooks into a single `handleForeground` callback passed to both `useAppStateRefresh` and `useFocusEffect`. The date picker could follow the same pattern to keep refresh logic unified.

**7. Phase 3.1 CelebrationBurst animation may need `withDelay` for staggered emoji burst**

- **Section:** Phase 3.1
- **Observation:** The design describes 6-8 emoji particles bursting outward with slightly different trajectories. If all particles animate simultaneously with identical timing, the effect will look flat. A staggered launch (e.g., `withDelay(i * 50, withTiming(...))`) would create a more dynamic burst. The reanimated mock doesn't include `withDelay` — if used, it needs to be added to the mock. This is purely a polish consideration, not a correctness issue.
