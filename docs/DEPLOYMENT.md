# Deployment Guide — TestFlight via EAS

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

## Manual deployment (one command)

Build and submit to TestFlight in one step:

    eas build --platform ios --profile production --auto-submit

This will:

1. Build the iOS app on EAS cloud
2. Sign it with your provisioning profile
3. Upload the .ipa to App Store Connect
4. It appears in TestFlight once Apple finishes processing (~5-30 min)

## Automated deployment (GitHub Actions)

Once manual deployment works, add this workflow:

File: `.github/workflows/deploy.yml`

    name: Deploy to TestFlight

    on:
      workflow_dispatch:
      push:
        tags:
          - 'v*'

    jobs:
      deploy:
        name: Build & Submit
        runs-on: ubuntu-latest
        timeout-minutes: 60
        steps:
          - uses: actions/checkout@v4
          - uses: actions/setup-node@v4
            with:
              node-version-file: '.nvmrc'
              cache: 'npm'
          - run: npm ci
          - name: Build and submit to TestFlight
            run: npx eas-cli build --platform ios --profile production --auto-submit --non-interactive
            env:
              EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}

Trigger options:

- **Manual:** Click "Run workflow" in GitHub Actions UI
- **On tag:** Push a version tag (`git tag v1.0.0 && git push --tags`)

## Version management

EAS auto-increments the build number (`autoIncrement: true` in `eas.json`).
Update the user-facing version in `app.config.ts` (`version` field) before major releases.

## Troubleshooting

- "No matching provisioning profile" — Run `eas credentials` to regenerate
- "App record not found" — Create it in App Store Connect first
- Build succeeds but not in TestFlight — Check App Store Connect for compliance issues

## Branch Protection (one-time setup)

After CI is stable, configure in GitHub Settings > Branches > `main`:

- Require status checks: `Lint & Format`, `Type Check`, `Unit Tests`
- Require branches to be up to date before merging
- Do NOT require E2E (manual-trigger only)
