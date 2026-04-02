# Monthly Review Reminders — Design Specification

> **Status:** Draft
> **Date:** 2026-04-01

## Goal

Add a monthly push notification reminding users to review their recent photos, driving re-engagement with the app. The feature should work cross-platform (iOS and Android) using `expo-notifications` for local scheduled notifications — no server or cloud push infrastructure required.

## Current State

- **What exists:** Picky Saver is a fully device-local app with no notification infrastructure. There are no notification dependencies, no notification permissions declared, and no background task scheduling.
- **Review history:** `reviewService.ts` stores `ReviewRecord` objects in AsyncStorage keyed by `(year, month)`. This existing data can be used to determine whether the user has already reviewed the current month.
- **Home screen:** `app/index.tsx` is the primary entry point, displaying action buttons based on photo and review state.

### Problems

1. Users have no reason to return to the app unless they remember to — there is no re-engagement mechanism.
2. Photos accumulate over time; the longer a user waits, the more daunting the backlog becomes. A monthly nudge keeps the task manageable.

## Design

### Approach: `expo-notifications` Local Scheduled Notifications

Use Expo's built-in notification module to schedule a **repeating local notification** — no push server, no cloud functions, no third-party service. This is the simplest cross-platform approach and aligns with the app's device-local philosophy.

**Rejected alternatives:**
- **Server-sent push notifications (FCM/APNs):** Requires a backend, push tokens, and server infra. Overkill for a simple monthly reminder with no user-specific targeting.
- **`react-native-push-notification`:** Community library with more moving parts; `expo-notifications` is better maintained within the Expo ecosystem and handles both platforms with a single API.
- **Background fetch + local alert:** More complex, less reliable, and iOS throttles background fetch frequency.

### Notification Content

```
Title: "Time to review your photos!"
Body:  "You have new photos from last month. Swipe through them in Picky Saver."
```

### Scheduling Strategy

Schedule a **single repeating monthly notification** that fires on the **3rd day of each month at 10:00 AM local time**. The 3rd gives time for photos from the previous month to fully sync to the device.

```typescript
// Pseudocode — scheduling the monthly reminder
await Notifications.scheduleNotificationAsync({
  content: {
    title: "Time to review your photos!",
    body: "You have new photos from last month. Swipe through them in Picky Saver.",
  },
  trigger: {
    type: SchedulableTriggerInputTypes.MONTHLY,
    day: 3,
    hour: 10,
    minute: 0,
  },
});
```

### Smart Suppression (Optional Enhancement)

If the user has already reviewed the current month (i.e., a `ReviewRecord` exists for that `(year, month)` pair), the notification is still delivered by the OS — but we can check on app open whether to suppress future ones. For v1, we keep it simple: **always send the monthly notification**. The user can disable it via a toggle.

**Rationale:** Canceling and re-scheduling notifications based on review state requires background execution, which adds significant complexity. A static monthly schedule is reliable and predictable.

### Notification Service

Create a new service `services/notificationService.ts` responsible for:

1. **Requesting permission** — wraps `Notifications.requestPermissionsAsync()`
2. **Scheduling the monthly reminder** — idempotent: cancels any existing reminder before scheduling a new one
3. **Canceling the reminder** — for the opt-out toggle
4. **Checking if reminders are enabled** — reads from AsyncStorage

```typescript
// services/notificationService.ts — key exports

import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

const REMINDER_ENABLED_KEY = 'picky_saver_reminder_enabled';
const REMINDER_IDENTIFIER_KEY = 'picky_saver_reminder_id';

export async function requestNotificationPermission(): Promise<boolean>;
export async function scheduleMonthlyReminder(): Promise<void>;
export async function cancelMonthlyReminder(): Promise<void>;
export async function isReminderEnabled(): Promise<boolean>;
export async function setReminderEnabled(enabled: boolean): Promise<void>;
```

**Lifecycle:**
```
App first launch (or feature first available)
  → Prompt user: "Would you like monthly reminders?"
  → If yes: requestPermission() → scheduleMonthlyReminder()
  → Save preference to AsyncStorage

User taps notification → App opens to home screen (deep link to `/`)

User toggles reminder off in settings
  → cancelMonthlyReminder()
  → Update AsyncStorage
```

### Permission Handling

| Platform | Behavior |
|----------|----------|
| iOS | Must request permission explicitly. `expo-notifications` handles the system dialog. If denied, show a message explaining how to enable in Settings. |
| Android 13+ | Must request `POST_NOTIFICATIONS` permission at runtime. Older Android versions grant it by default. |
| Android <13 | No runtime permission needed — notifications allowed by default. |

### Hook: `useReminder`

A new hook `hooks/useReminder.ts` to manage reminder state in UI components:

```typescript
// hooks/useReminder.ts
export function useReminder() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);

  // Load current state on mount
  useEffect(() => { ... }, []);

  async function toggleReminder(value: boolean): Promise<void> {
    if (value) {
      const granted = await requestNotificationPermission();
      if (!granted) return; // permission denied
      await scheduleMonthlyReminder();
    } else {
      await cancelMonthlyReminder();
    }
    await setReminderEnabled(value);
    setEnabled(value);
  }

  return { enabled, permissionGranted, toggleReminder };
}
```

### UI: Settings Screen

Add a new `app/settings.tsx` screen accessible from the home screen via a gear icon or "Settings" button. This screen will hold the reminder toggle and is designed to accommodate future settings.

```
Settings
─────────────────────────────
Notifications
  Monthly reminders           [Toggle switch]
  Get a reminder on the 3rd of each month
  to review your recent photos.
─────────────────────────────
```

- Toggle calls `useReminder.toggleReminder(value)`.
- If permission was denied at the OS level, tapping the toggle shows an alert directing the user to system Settings.
- The screen uses the same `useTheme` styling as the rest of the app.

### UI: Home Screen Changes

Add a settings gear icon/button to the home screen header area. No reminder toggle on the home screen itself — that lives in settings.

On first launch (when reminder preference hasn't been set), show an inline opt-in card on the home screen:

### First-Launch Opt-In Flow

Rather than showing the toggle immediately, the first time the feature is available we show a one-time prompt:

```
"Stay on top of your photos"
"Get a monthly reminder to review and organize your photos."
[Enable Reminders]  [Not Now]
```

This appears on the home screen as a dismissible card (similar pattern to the existing `OnboardingOverlay`). Once dismissed (either choice), it never shows again — the toggle takes over.

### Notification Tap Handling

When the user taps the notification, the app should open to the home screen. Since the home screen is the default route (`/`), no special deep-link routing is needed. The existing `useAppStateRefresh` hook will refresh data when the app foregrounds.

For a future enhancement, we could deep-link directly to `/date-picker` — but for v1, the home screen is sufficient.

### Re-Scheduling on App Update

`expo-notifications` scheduled notifications persist across app updates on both platforms. No re-scheduling logic is needed unless the user clears app data (Android) — in which case AsyncStorage is also cleared, and the opt-in flow will re-trigger naturally.

## Interaction with Existing Code

### `app.config.ts`
- **Changes:** Add `expo-notifications` plugin. Add `NSUserNotificationsUsageDescription` (iOS) and `POST_NOTIFICATIONS` permission (Android 13+).
- **Unchanged:** All existing permissions and plugins.

### `app/index.tsx` (Home Screen)
- **Changes:** Add settings navigation button (gear icon). Add first-launch opt-in card (`ReminderCard`). Import `useReminder` hook.
- **Unchanged:** All existing buttons, data fetching, refresh logic.

### `app/_layout.tsx` (Root Layout)
- **Changes:** Add `settings` screen to Stack. Configure notification handler to suppress foreground notifications.
- **Unchanged:** Existing Stack screens and navigation configuration.

### No changes to:
- `services/photoService.ts`
- `services/deletionAlbumService.ts`
- `services/reviewService.ts`
- Any existing hooks
- Any existing components
- Any existing tests

## Files Changed

| File | Change |
|------|--------|
| `package.json` | Add `expo-notifications` dependency |
| `app.config.ts` | Add `expo-notifications` plugin, iOS/Android notification permissions |
| `services/notificationService.ts` | **New file.** Schedule/cancel monthly reminder, manage permission and preference |
| `hooks/useReminder.ts` | **New file.** React hook wrapping notificationService for UI state |
| `app/index.tsx` | Add settings button and first-launch opt-in card |
| `app/settings.tsx` | **New file.** Settings screen with reminder toggle (extensible for future settings) |
| `app/_layout.tsx` | Add settings screen to Stack, configure notification handler to suppress foreground notifications |
| `components/ReminderCard.tsx` | **New file.** First-launch opt-in card component |
| `__tests__/services/notificationService.test.ts` | **New file.** Unit tests for notification service |
| `__tests__/hooks/useReminder.test.ts` | **New file.** Unit tests for reminder hook |
| `__mocks__/expo-notifications.ts` | **New file.** Jest mock for expo-notifications |

## Open Questions

1. **What day/time should the reminder fire?**
   _Resolved:_ 3rd of each month at 10:00 AM local time.

2. **Should the opt-in prompt be a modal or an inline card on the home screen?**
   _Resolved:_ Inline dismissible card on the home screen.

3. **Should we support a "reminder settings" screen, or is the home screen toggle sufficient for v1?**
   _Resolved:_ Dedicated settings screen (`app/settings.tsx`) — designed to accommodate future settings beyond reminders.

4. **Should foreground notifications be shown (e.g., user has app open on the 3rd)?**
   _Resolved:_ Suppress foreground notifications.
