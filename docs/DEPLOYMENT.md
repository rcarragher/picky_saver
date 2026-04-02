# Deployment Guide

## Prerequisites

Before your first deployment:

1. **Apple Developer Program** — Enroll at developer.apple.com ($99/year).
2. **App Store Connect** — Create the app record at appstoreconnect.apple.com:
   - Bundle ID: `com.pickysaver.app` (must match `app.config.ts`)
   - App name: "Picky Saver"
   - SKU: any unique string (e.g., `pickysaver001`)
3. **EAS credentials** — Run `eas credentials` to configure signing:
   - EAS can auto-manage certificates and provisioning profiles.
   - Or provide your own if you prefer manual management.

## Build (self-hosted Mac Mini)

iOS builds run locally on the Mac Mini via `eas build --local`. EAS still manages code signing and version tracking — only the compute is local.

### Via GitHub Actions

Trigger the **Build iOS (Local)** workflow from the Actions tab. Select a build profile (`development`, `preview`, or `production`). The built artifact is uploaded and retained for 14 days.

### Manual command

    eas build --platform ios --profile production --local

## Submit to TestFlight

After a successful build:

    eas submit --platform ios --latest

Or build and submit in one step (uses EAS cloud for the build):

    eas build --platform ios --profile production --auto-submit

## E2E Tests (self-hosted Mac Mini)

E2E tests run on the Mac Mini using Maestro. The workflow triggers on push to `main` and `workflow_dispatch`.

### Via GitHub Actions

Trigger the **E2E Tests (Self-Hosted)** workflow from the Actions tab, or push to `main`. Maestro test artifacts are uploaded and retained for 7 days.

### Manual command

    npm run test:e2e

## Version management

EAS auto-increments the build number (`autoIncrement: true` in `eas.json`).
Update the user-facing version in `app.config.ts` (`version` field) before major releases.

## What EAS services are still in use

| Service                 | Purpose                                                        |
| ----------------------- | -------------------------------------------------------------- |
| Code signing management | Certificates and provisioning profiles for `eas build --local` |
| Version tracking        | `appVersionSource: "remote"` auto-increments build numbers     |
| `eas submit`            | Uploads .ipa to App Store Connect / TestFlight                 |
| `EXPO_TOKEN` secret     | Authenticates the runner with EAS for builds and submissions   |

## Self-hosted runner prerequisites

The Mac Mini runner needs:

- Xcode + Command Line Tools
- An iOS simulator runtime (e.g., iPhone 16)
- Node.js (version matching `.nvmrc`)
- CocoaPods
- Maestro CLI
- ImageMagick + ExifTool (for E2E fixture generation)

## Troubleshooting

- "No matching provisioning profile" — Run `eas credentials` to regenerate
- "App record not found" — Create it in App Store Connect first
- Build succeeds but not in TestFlight — Check App Store Connect for compliance issues
- E2E fails to boot simulator — Verify a compatible iPhone simulator is installed (`xcrun simctl list devices available`)

## Branch Protection (one-time setup)

After CI is stable, configure in GitHub Settings > Branches > `main`:

- Require status checks: `Lint & Format`, `Type Check`, `Unit Tests`
- Require branches to be up to date before merging
- Do NOT require E2E (manual-trigger only)
