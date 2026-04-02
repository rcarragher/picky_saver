# Monthly Review Reminders — Execution Plan

> **Design document:** [design.md](./design.md)
> **Status:** Not started
> **Current phase:** Phase 0

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

*Baseline (every phase):* `npx tsc --noEmit && npm test`

Phases that add or modify integration/E2E tests must also run them. Include any prerequisites (deployment, environment setup) as tasks before the gate, and add the integration test run command to the gate itself. The gate command may differ between phases — it must cover all tests that validate the phase's work.

A phase is **not complete** until the gate succeeds and **all** tests written or modified in that phase have been executed. Fix failures before marking the phase done.

---

## Summary

Add a monthly local push notification reminding users to review photos, using `expo-notifications`. Includes a notification service, a `useReminder` hook, an inline opt-in card on the home screen, and a new Settings screen with a reminder toggle. Six phases: dependency setup, service + tests, hook + tests, settings screen, home screen integration, final verification.

---

## Phase 1: Install Dependency and Configure Permissions

**Goal:** Add `expo-notifications` to the project and configure platform permissions so the app can send local notifications.

### Tasks

- [ ] **1.1** Install `expo-notifications`
  - Run: `npx expo install expo-notifications`

- [ ] **1.2** Update `app.config.ts` — add notification plugin and permissions
  - File: `app.config.ts`
  - Add `"expo-notifications"` to the `plugins` array
  - iOS: No extra infoPlist key needed — `expo-notifications` plugin handles the permission prompt
  - Android: Add `"android.permission.POST_NOTIFICATIONS"` to the `permissions` array

- [ ] **1.3** Create Jest mock for `expo-notifications`
  - File: `__mocks__/expo-notifications.ts`
  - Mock the functions the service will use: `requestPermissionsAsync`, `getPermissionsAsync`, `scheduleNotificationAsync`, `cancelScheduledNotificationAsync`, `cancelAllScheduledNotificationsAsync`, `setNotificationHandler`
  - Follow the same pattern as `__mocks__/expo-media-library.ts` (export `jest.fn()` for each)
  - Also export `SchedulableTriggerInputTypes` as an enum/object with at least `MONTHLY`

- [ ] **1.4** Build + test gate: `npx tsc --noEmit && npm test` — all existing tests still pass

### Observations

<!-- Agent: write notes here during execution -->

---

## Phase 2: Notification Service + Unit Tests

**Goal:** Implement `notificationService.ts` with all scheduling, cancellation, and preference logic. Fully unit-tested.

### Tasks

- [ ] **2.1** Create `services/notificationService.ts`
  - File: `services/notificationService.ts`
  - Exports:
    - `requestNotificationPermission(): Promise<boolean>` — calls `Notifications.requestPermissionsAsync()`, returns `true` if granted
    - `scheduleMonthlyReminder(): Promise<void>` — cancels any existing reminder (by stored identifier), then schedules a new monthly notification (day 3, hour 10, minute 0). Stores the returned identifier in AsyncStorage under key `picky_saver_reminder_id`
    - `cancelMonthlyReminder(): Promise<void>` — reads stored identifier from AsyncStorage, calls `cancelScheduledNotificationAsync`, removes the stored identifier
    - `isReminderEnabled(): Promise<boolean>` — reads `picky_saver_reminder_enabled` from AsyncStorage, returns `false` if null
    - `setReminderEnabled(enabled: boolean): Promise<void>` — writes to AsyncStorage
    - `hasSeenReminderPrompt(): Promise<boolean>` — reads `picky_saver_reminder_prompt_seen` from AsyncStorage
    - `setReminderPromptSeen(): Promise<void>` — writes `"true"` to AsyncStorage
  - Notification content: title = `"Time to review your photos!"`, body = `"You have new photos from last month. Swipe through them in Picky Saver."`
  - Trigger: `{ type: SchedulableTriggerInputTypes.MONTHLY, day: 3, hour: 10, minute: 0 }`

- [ ] **2.2** Create unit tests for `notificationService`
  - File: `__tests__/services/notificationService.test.ts`
  - Test cases:
    - `requestNotificationPermission` returns `true` when granted
    - `requestNotificationPermission` returns `false` when denied
    - `scheduleMonthlyReminder` calls `scheduleNotificationAsync` with correct content and trigger
    - `scheduleMonthlyReminder` cancels existing reminder before scheduling (when identifier exists in storage)
    - `scheduleMonthlyReminder` stores the returned identifier in AsyncStorage
    - `cancelMonthlyReminder` cancels by stored identifier and clears it
    - `cancelMonthlyReminder` is a no-op when no identifier stored
    - `isReminderEnabled` returns `false` by default
    - `setReminderEnabled(true)` then `isReminderEnabled()` returns `true`
    - `hasSeenReminderPrompt` returns `false` by default
    - `setReminderPromptSeen` then `hasSeenReminderPrompt` returns `true`
  - Follow the same patterns as `__tests__/services/reviewService.test.ts` (AsyncStorage.clear in beforeEach)

- [ ] **2.3** Build + test gate: `npx tsc --noEmit && npm test` — all tests pass including new ones

### Observations

<!-- Agent: write notes here during execution -->

---

## Phase 3: `useReminder` Hook + Unit Tests

**Goal:** Implement the React hook that wraps `notificationService` for UI consumption, with unit tests.

### Tasks

- [ ] **3.1** Create `hooks/useReminder.ts`
  - File: `hooks/useReminder.ts`
  - Returns: `{ enabled: boolean | null, promptSeen: boolean | null, permissionGranted: boolean | null, toggleReminder: (value: boolean) => Promise<void>, dismissPrompt: () => Promise<void>, refresh: () => void }`
  - On mount (`useEffect`): load `isReminderEnabled()`, `hasSeenReminderPrompt()`, and check current permission status via `Notifications.getPermissionsAsync()`
  - `toggleReminder(true)`: request permission → if granted, `scheduleMonthlyReminder()` + `setReminderEnabled(true)` → update state. If denied, do not enable — show alert via `Alert.alert` directing user to system Settings (use `Linking.openSettings()` on the action button)
  - `toggleReminder(false)`: `cancelMonthlyReminder()` + `setReminderEnabled(false)` → update state
  - `dismissPrompt()`: calls `setReminderPromptSeen()` → update state

- [ ] **3.2** Create unit tests for `useReminder`
  - File: `__tests__/hooks/useReminder.test.ts`
  - Mock `services/notificationService` (jest.mock the module)
  - Mock `expo-notifications` for `getPermissionsAsync`
  - Test cases:
    - Initial state: `enabled` is `null` until loaded, then reflects stored value
    - `toggleReminder(true)` with permission granted: calls `requestNotificationPermission`, `scheduleMonthlyReminder`, `setReminderEnabled(true)`
    - `toggleReminder(true)` with permission denied: does not schedule, does not enable
    - `toggleReminder(false)`: calls `cancelMonthlyReminder`, `setReminderEnabled(false)`
    - `dismissPrompt()`: calls `setReminderPromptSeen()`
  - Follow patterns from `__tests__/hooks/useReviewHistory.test.ts`

- [ ] **3.3** Build + test gate: `npx tsc --noEmit && npm test` — all tests pass

### Observations

<!-- Agent: write notes here during execution -->

---

## Phase 4: Settings Screen

**Goal:** Create the Settings screen with the reminder toggle, accessible from the home screen.

### Tasks

- [ ] **4.1** Create `app/settings.tsx`
  - File: `app/settings.tsx`
  - Layout:
    - Back button/arrow at top (uses `router.back()`)
    - Title: "Settings"
    - Section header: "Notifications"
    - Row: "Monthly reminders" label + `Switch` component bound to `useReminder().enabled`
    - Description text below toggle: "Get a reminder on the 3rd of each month to review your recent photos."
  - When `enabled === null` (loading), disable the switch
  - Use `useTheme()` for colors, follow existing screen patterns (safe area insets, screenMargin, etc.)

- [ ] **4.2** Add `settings` screen to Stack in `app/_layout.tsx`
  - File: `app/_layout.tsx`
  - Add `<Stack.Screen name="settings" />` after the existing screens

- [ ] **4.3** Configure notification handler in `app/_layout.tsx`
  - File: `app/_layout.tsx`
  - At module level (outside the component), call:
    ```typescript
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: false,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
    ```
  - This suppresses notifications when the app is in the foreground

- [ ] **4.4** Build + test gate: `npx tsc --noEmit && npm test` — all tests pass

### Observations

<!-- Agent: write notes here during execution -->

---

## Phase 5: Home Screen — Opt-In Card and Settings Navigation

**Goal:** Add the first-launch reminder opt-in card and settings gear button to the home screen.

### Tasks

- [ ] **5.1** Create `components/ReminderCard.tsx`
  - File: `components/ReminderCard.tsx`
  - Props: `{ onEnable: () => void; onDismiss: () => void }`
  - Inline card layout (not modal):
    - Title: "Stay on top of your photos"
    - Body: "Get a monthly reminder to review and organize your photos."
    - Two buttons: "Enable Reminders" (calls `onEnable`) and "Not Now" (calls `onDismiss`)
  - Style consistent with existing cards — use `useTheme()` colors, `borderRadius.md`, `spacing.*`, `fontSize.*`
  - The card has a subtle background (use `colors.surface`) to distinguish it from the main background

- [ ] **5.2** Add settings button to home screen
  - File: `app/index.tsx`
  - Add a gear/settings icon button in the top-right area of the screen (positioned absolutely or in the header area, near the top safe area inset)
  - Use a text-based gear symbol (e.g., "⚙") or a simple "Settings" text button — no external icon library needed
  - On press: `router.push('/settings')`

- [ ] **5.3** Integrate `ReminderCard` on home screen
  - File: `app/index.tsx`
  - Import and use `useReminder` hook
  - Show `ReminderCard` above the buttons section **only when** `promptSeen === false` (user hasn't responded to the opt-in yet)
  - `onEnable`: call `toggleReminder(true)` then `dismissPrompt()`
  - `onDismiss`: call `dismissPrompt()` only
  - After dismissal, the card disappears and never returns (controlled by AsyncStorage flag)

- [ ] **5.4** Build + test gate: `npx tsc --noEmit && npm test` — all tests pass

### Observations

<!-- Agent: write notes here during execution -->

---

## Phase 6: Final Verification

**Goal:** Review all changes for design compliance, code quality, and ensure the full test suite passes.

### Tasks

- [ ] **6.1** Design compliance check
  - Verify notification content matches design: title = "Time to review your photos!", body = "You have new photos from last month. Swipe through them in Picky Saver."
  - Verify schedule: day 3, hour 10, minute 0, monthly
  - Verify foreground notifications are suppressed
  - Verify settings screen has the reminder toggle with correct description
  - Verify opt-in card matches design copy and only shows once
  - Verify settings button is accessible from home screen

- [ ] **6.2** Code quality review
  - No unused imports or dead code
  - AsyncStorage keys are consistently named (`picky_saver_*` prefix)
  - Error handling: permission denial handled gracefully (alert with Settings link)
  - No changes to existing services, hooks, or components beyond what the design specifies

- [ ] **6.3** Verify no existing tests were broken
  - Run the full test suite and confirm all pre-existing tests still pass

- [ ] **6.4** Final build + test gate: `npx tsc --noEmit && npm test` — all tests pass, zero regressions

### Observations

<!-- Agent: write notes here during execution -->

---

## Files Changed Summary

### New Files
| File | Phase | Purpose |
|------|-------|---------|
| `__mocks__/expo-notifications.ts` | 1 | Jest mock for expo-notifications |
| `services/notificationService.ts` | 2 | Schedule/cancel monthly reminder, manage preferences |
| `__tests__/services/notificationService.test.ts` | 2 | Unit tests for notification service |
| `hooks/useReminder.ts` | 3 | React hook wrapping notificationService for UI |
| `__tests__/hooks/useReminder.test.ts` | 3 | Unit tests for useReminder hook |
| `app/settings.tsx` | 4 | Settings screen with reminder toggle |
| `components/ReminderCard.tsx` | 5 | First-launch opt-in card component |

### Modified Files
| File | Phases | Changes |
|------|--------|---------|
| `package.json` | 1 | Add `expo-notifications` dependency |
| `app.config.ts` | 1 | Add expo-notifications plugin, Android POST_NOTIFICATIONS permission |
| `app/_layout.tsx` | 4 | Add settings Stack.Screen, configure notification handler |
| `app/index.tsx` | 5 | Add settings button, integrate ReminderCard with useReminder |
