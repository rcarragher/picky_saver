# Picky Saver — UI Design Spec

## Design Principles

1. **Content first** — Photos are the star. UI stays out of the way.
2. **Instant clarity** — Every screen's purpose is obvious within 1 second.
3. **Zero learning curve** — Familiar patterns (swipe, tap, back). No manual needed.
4. **Friendly but clean** — Warm, approachable, not cluttered or childish.

---

## Color Palette

A neutral, photo-friendly palette with one warm accent. Background stays muted so photos pop.

### Light Mode (default)

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Background | Warm white | `#FAFAF8` | Screen backgrounds |
| Surface | Soft cream | `#F2F0EC` | Cards, date picker tiles |
| Text Primary | Charcoal | `#1C1C1E` | Headings, body text |
| Text Secondary | Warm grey | `#6B6B6B` | Captions, counts, labels |
| Accent | Coral | `#E8725A` | Primary buttons, active states |
| Keep / Save | Soft green | `#4CAF7D` | Right-swipe overlay, save indicator |
| Delete | Soft red | `#E05555` | Left-swipe overlay, delete indicator |
| Border | Light grey | `#E5E3DF` | Subtle dividers, card outlines |

### Dark Mode

| Role | Color | Hex |
|------|-------|-----|
| Background | Near black | `#141414` |
| Surface | Dark grey | `#1E1E1E` |
| Text Primary | Off white | `#F0F0F0` |
| Text Secondary | Medium grey | `#9A9A9A` |
| Accent | Coral (same) | `#E8725A` |
| Keep / Save | Soft green | `#5BC88A` |
| Delete | Soft red | `#E86060` |

**Why coral accent:** Warm, energetic, stands out against both light and dark neutrals without clashing with photo content. Meets 4.5:1 contrast on both backgrounds.

---

## Typography

Use **system fonts** — San Francisco on iOS, Roboto on Android. No custom fonts needed. This ensures:
- Native feel on each platform
- No font loading delay
- Automatic support for Dynamic Type / font scaling

### Type Scale

| Style | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| H1 | 28px | Bold (700) | 34px | Screen titles ("Your Photos") |
| H2 | 22px | Semibold (600) | 28px | Section headers ("March 2024") |
| Body | 17px | Regular (400) | 24px | Descriptions, instructions |
| Body Bold | 17px | Semibold (600) | 24px | Counts, emphasis |
| Caption | 14px | Regular (400) | 20px | Photo dates, secondary info |
| Small | 12px | Medium (500) | 16px | Badges, labels |

All sizes scale with system accessibility settings via React Native's `allowFontScaling`.

---

## Spacing System

8px base grid. All spacing is a multiple of 8.

| Token | Value | Usage |
|-------|-------|-------|
| `xs` | 4px | Tight gaps (icon + label) |
| `sm` | 8px | Between closely related items |
| `md` | 16px | Standard content padding, list gaps |
| `lg` | 24px | Section separation, card padding |
| `xl` | 32px | Major section breaks |
| `2xl` | 48px | Screen-level vertical padding |

**Screen margins:** 20px horizontal on all screens.

---

## Touch Targets

All interactive elements: minimum **48x48px** touch area (meets WCAG 2.2 AA and both platform guidelines). Buttons with text are at least 48px tall with 16px horizontal padding.

---

## Screen Designs

### 1. Home Screen

```
┌─────────────────────────────┐
│                             │
│         [App Icon]          │
│       Picky Saver           │  H1, centered
│                             │
│   Organize your photos,     │  Body, secondary color
│     one swipe at a time     │
│                             │
│  ┌─────────────────────┐    │
│  │                     │    │
│  │   Start Organizing  │    │  Primary button (coral)
│  │         →           │    │  Full width, 56px tall
│  └─────────────────────┘    │
│                             │
│  ┌─────────────────────┐    │
│  │  📁 To Be Deleted   │    │  Secondary button (surface bg)
│  │        42 photos    │    │  Shows count badge
│  └─────────────────────┘    │
│                             │
│                             │
│                             │
└─────────────────────────────┘
```

**Key decisions:**
- No tab bar — the app flow is linear (home → pick month → swipe → done). Tabs add complexity for no benefit with only 2 entry points.
- Stack navigation with a clear back path on every screen.
- Large, obvious buttons. User can't get lost.
- "To Be Deleted" button only appears if count > 0.

### 2. Date Picker Screen

```
┌─────────────────────────────┐
│  ←  Pick a Month        H1  │  Back arrow top-left
│                             │
│  ┌─────────────────────┐    │
│  │  March 2024         │    │
│  │  156 photos     →   │    │  Surface card, full width
│  └─────────────────────┘    │
│  ┌─────────────────────┐    │
│  │  February 2024      │    │
│  │  89 photos      →   │    │  Sorted newest first
│  └─────────────────────┘    │
│  ┌─────────────────────┐    │
│  │  January 2024       │    │
│  │  214 photos     →   │    │
│  └─────────────────────┘    │
│  ┌─────────────────────┐    │
│  │  December 2023      │    │
│  │  312 photos     →   │    │
│  └─────────────────────┘    │
│          ...                │  Scrollable list
└─────────────────────────────┘
```

**Key decisions:**
- Simple scrollable list, not a calendar widget. Easier to scan and tap.
- Each row shows month/year + photo count — user knows what they're getting into.
- Sorted newest-first (most relevant months at top).
- Right chevron (→) signals tappability.
- Months with 0 photos are hidden.
- Year headers separate groups when list spans multiple years.

### 3. Swipe Screen (Core Experience)

```
┌─────────────────────────────┐
│  ←  March 2024    24/156    │  Back + progress counter
│                             │
│  ┌─────────────────────┐    │
│  │                     │    │
│  │                     │    │
│  │                     │    │
│  │     [PHOTO]         │    │  Full-width photo card
│  │                     │    │  Rounded corners (12px)
│  │                     │    │
│  │                     │    │
│  │                     │    │
│  └─────────────────────┘    │
│                             │
│   ← DELETE     KEEP →       │  Hint text, secondary color
│                             │
│  ┌───┐              ┌───┐   │
│  │ ✕ │    [UNDO]    │ ✓ │   │  Tap buttons as alternatives
│  └───┘              └───┘   │  to swiping (accessibility)
│                             │
└─────────────────────────────┘
```

**During a swipe (card tilted right):**
```
┌─────────────────────────────┐
│  ←  March 2024    24/156    │
│                             │
│     ┌─────────────────┐     │
│     │  ┌──────┐       │     │  Card rotates 5-10deg
│     │  │ KEEP │       │     │  Green "KEEP" stamp fades in
│     │  └──────┘       │     │  at top-left of card
│     │                 │ ╱   │
│     │    [PHOTO]      │╱    │
│     │                 │     │
│     │                 │     │
│     └─────────────────┘     │
│                             │
│                             │
└─────────────────────────────┘
```

**During a swipe (card tilted left):**
```
     Same but mirrored:
     - Card rotates opposite direction
     - Red "DELETE" stamp fades in at top-right
```

**Key decisions:**
- Photo takes up ~70% of screen. It's the focus.
- Progress counter ("24/156") always visible — user knows how far along they are.
- "DELETE" / "KEEP" hint text below the card at rest. Disappears after first few swipes (user has learned).
- Tap buttons (X and checkmark) as fallback for users who don't want to swipe.
- UNDO button centered below — reverses last action. Shows briefly after each swipe, fades if not used.
- Back arrow always available — user can leave mid-session, progress is saved.
- Swipe overlays use the keep/delete colors with ~60% opacity stamped on the card.

### 4. Summary Screen

```
┌─────────────────────────────┐
│                             │
│                             │
│          ✓                  │  Large checkmark icon
│                             │  (accent color)
│     All done!               │  H1
│                             │
│   You reviewed 156 photos   │  Body
│                             │
│   ┌──────────┐ ┌──────────┐│
│   │  Kept    │ │ Marked   ││
│   │  114     │ │   42     ││  Two stat cards side by side
│   │          │ │          ││  Keep=green, Delete=red text
│   └──────────┘ └──────────┘│
│                             │
│  ┌─────────────────────┐    │
│  │  Review Deletions   │    │  Secondary button → to-delete
│  └─────────────────────┘    │
│  ┌─────────────────────┐    │
│  │  Back to Home       │    │  Text button → home
│  └─────────────────────┘    │
│                             │
└─────────────────────────────┘
```

**Key decisions:**
- Satisfying completion moment. User sees the impact of their work.
- Clear next actions: review what they marked, or go home.
- No dead ends.

### 5. Deletion Review Screen

```
┌─────────────────────────────┐
│  ←  To Be Deleted      42   │  Back + total count
│                             │
│  ┌────┐ ┌────┐ ┌────┐      │
│  │    │ │    │ │    │      │
│  │ 📷 │ │ 📷 │ │ 📷 │      │  3-column photo grid
│  └────┘ └────┘ └────┘      │  Thumbnails, 4px gaps
│  ┌────┐ ┌────┐ ┌────┐      │  Tap to preview full-screen
│  │    │ │    │ │    │      │
│  │ 📷 │ │ 📷 │ │ 📷 │      │
│  └────┘ └────┘ └────┘      │
│  ┌────┐ ┌────┐ ┌────┐      │
│  │    │ │    │ │    │      │
│  │ 📷 │ │ 📷 │ │ 📷 │      │
│  └────┘ └────┘ └────┘      │
│          ...                │  Scrollable
│                             │
│  ┌─────────────────────┐    │
│  │  Delete All (42)    │    │  Red button, fixed at bottom
│  └─────────────────────┘    │
└─────────────────────────────┘
```

**Tap a photo → full-screen preview:**
```
┌─────────────────────────────┐
│  ✕                          │  Close button top-left
│                             │
│                             │
│                             │
│        [FULL PHOTO]         │  Full screen, dark bg
│                             │
│                             │
│                             │
│                             │
│  ┌─────────────────────┐    │
│  │   ↩ Restore Photo   │    │  Moves back out of album
│  └─────────────────────┘    │
└─────────────────────────────┘
```

**Key decisions:**
- Familiar 3-column grid (same as iOS Photos, Google Photos).
- Tap any thumbnail for full-screen view with restore option.
- "Delete All" is red and pinned to the bottom — destructive action is visible but requires deliberate tap.
- Delete triggers OS confirmation dialog (required by both platforms), so no extra "are you sure?" modal from us.

### 6. First-Launch Onboarding (Overlay)

Shown only once, on first app open. Not a separate flow — it overlays the swipe screen on first use.

```
┌─────────────────────────────┐
│                  ╭────────╮ │
│                  │  Skip  │ │  Top-right skip link
│                  ╰────────╯ │
│                             │
│    ← Swipe left             │
│       to delete             │  Left side hint with arrow
│                             │
│     [SAMPLE CARD]           │  Uses their actual first photo
│                             │
│             Swipe right →   │
│                to keep      │  Right side hint with arrow
│                             │
│    You can undo anytime     │  Caption below
│                             │
│  ┌─────────────────────┐    │
│  │      Got it!         │    │  Dismisses overlay
│  └─────────────────────┘    │
│                             │
└─────────────────────────────┘
```

**Key decisions:**
- One screen, not a multi-step tutorial. Swipe left/right is the only thing to learn.
- Uses the user's actual first photo, not a stock image.
- "Got it!" dismisses. "Skip" also dismisses. Both paths lead to the same place.
- After dismissal, the hint text ("← DELETE / KEEP →") below the card persists for the first ~5 swipes, then fades out.

---

## Navigation Model

**Stack navigation** (not tabs). The app has a single linear flow with one branch:

```
Home ──→ Date Picker ──→ Swipe ──→ Summary
  │                                    │
  └──→ Deletion Review ←──────────────┘
```

- Every screen has a back button (← top-left).
- User can leave the swipe screen at any time — progress is preserved.
- No hamburger menu, no drawer, no tabs. There's nothing to hide.

**Why no tabs:** The app has one primary task (organize photos) and one secondary view (review deletions). Tabs would add visual noise and suggest the app is more complex than it is.

---

## Animations & Micro-interactions

| Interaction | Animation | Duration |
|------------|-----------|----------|
| Card swipe | Translate X + rotate (max 15deg) + opacity overlay | Follows finger, 200ms spring on release |
| Card exit | Fly off screen in swipe direction | 300ms ease-out |
| Next card | Scale from 0.95 → 1.0, opacity 0 → 1 | 200ms ease-out |
| Undo | Card flies back from off-screen | 300ms spring |
| Button press | Scale 0.97 + slight opacity | 100ms |
| Screen transition | Slide from right (forward) / left (back) | 250ms native transition |
| Delete overlay | Opacity 0 → 0.6 based on swipe distance | Continuous (follows gesture) |
| Keep overlay | Same as delete, green instead of red | Continuous |
| Haptic | Light impact on swipe threshold crossing | Instant |

---

## Empty & Loading States

**Loading photos:**
- Shimmer placeholders on date picker (grey rectangles pulsing).
- Swipe screen: single shimmer card while first photo loads.

**No photos for a month:** (shouldn't happen — we hide empty months)

**No photos on device:**
```
Home screen shows:
"No photos found on this device."
(No buttons shown)
```

**Empty deletion queue:**
- "To Be Deleted" button hidden on home screen.
- If user navigates to deletion review directly (shouldn't happen):
  "Nothing here yet. Start organizing to mark photos for deletion."

---

## Accessibility Notes

- All buttons have accessible labels (`accessibilityLabel`).
- Swipe has tap-button alternatives (X and checkmark).
- Colors meet WCAG 2.2 AA contrast (4.5:1 minimum for text).
- Keep/Delete states are distinguished by both color AND icon/text (not color alone).
- Supports Dynamic Type / font scaling.
- Reduce Motion: if enabled, skip card rotation and fly-off animation, use simple fade instead.

---

## Theme Constants Reference

To be implemented in `constants/theme.ts`:

```
colors.background, colors.surface, colors.textPrimary, colors.textSecondary
colors.accent, colors.keep, colors.delete, colors.border
colors.dark.background, colors.dark.surface, ... (dark mode variants)

spacing.xs (4), spacing.sm (8), spacing.md (16), spacing.lg (24),
spacing.xl (32), spacing.xxl (48)

fontSize.h1 (28), fontSize.h2 (22), fontSize.body (17),
fontSize.caption (14), fontSize.small (12)

fontWeight.regular (400), fontWeight.medium (500),
fontWeight.semibold (600), fontWeight.bold (700)

borderRadius.sm (8), borderRadius.md (12), borderRadius.lg (16), borderRadius.full (9999)

touchTarget.min (48)
```
