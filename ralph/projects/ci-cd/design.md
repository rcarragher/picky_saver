# CI/CD Pipeline — Design Specification

> **Status:** Ready
> **Date:** 2026-04-01

## Goal

Establish a GitHub Actions CI/CD pipeline that enforces code quality on every push and PR — running linting, type-checking, and unit tests automatically. Add the missing linting and formatting tooling (ESLint, Prettier) and pre-commit hooks (Husky) so issues are caught locally before they reach CI. Use EAS for E2E testing and TestFlight deployment.

## Current State

### What exists

| Area | Status | Details |
|------|--------|---------|
| Unit tests (Jest) | Good | 20 test files, ~2,447 lines, `jest-expo` preset, proper mocks |
| E2E tests (Maestro) | Good | 16 flows, orchestration script at `e2e/run-e2e.sh` |
| TypeScript | Good | Strict mode enabled via `tsconfig.json` extending `expo/tsconfig.base` |
| EAS Build | Good | 3 profiles (development, preview, production) in `eas.json` |
| EAS Workflow | Exists | `.eas/workflows/e2e.yml` for cloud E2E — not connected to GitHub Actions |

### Problems

1. **No CI pipeline.** No `.github/workflows/` directory exists. Code merges with zero automated checks.
2. **No linting.** No ESLint, Prettier, or any code style enforcement. No lint dependencies installed.
3. **No type-check script.** TypeScript strict mode is on but `tsc --noEmit` is never run outside of the IDE.
4. **No pre-commit hooks.** No Husky or lint-staged. Commits bypass all checks.
5. **No coverage thresholds.** Jest coverage is available (`test:coverage`) but no minimum is enforced.
6. **No Node version lock.** No `.nvmrc` — risk of version drift.

---

## Design

### Phase 1: Linting & Formatting Setup

Add ESLint and Prettier with Expo-recommended configurations.

**Dependencies to install (devDependencies):**

```
eslint
eslint-config-expo
prettier
eslint-config-prettier
```

> `eslint-config-expo` is the official Expo ESLint config. It bundles React, React Native, and TypeScript rules — no need to install individual plugins.
> `eslint-config-prettier` disables ESLint rules that conflict with Prettier.

**`eslint.config.mjs`** (new file — flat config format):

```js
import expoConfig from "eslint-config-expo/flat";
import prettierConfig from "eslint-config-prettier";

export default [
  ...expoConfig,
  prettierConfig,
  {
    ignores: [
      "node_modules/",
      ".expo/",
      "dist/",
      "e2e/fixtures/",
      "ralph/",
    ],
  },
];
```

**`.prettierrc`** (new file):

```json
{
  "singleQuote": true,
  "trailingComma": "all",
  "semi": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

> Prettier config choices: `singleQuote` and `trailingComma: "all"` are the most common React Native conventions. `printWidth: 100` balances readability with keeping JSX manageable. These should be confirmed with the user.

**`.prettierignore`** (new file):

```
node_modules/
.expo/
dist/
e2e/fixtures/
ralph/
*.json
```

**Package.json scripts to add:**

```json
{
  "lint": "eslint .",
  "lint:fix": "eslint . --fix",
  "format": "prettier --write .",
  "format:check": "prettier --check .",
  "type-check": "tsc --noEmit"
}
```

**Approach not taken:** Biome (all-in-one linter/formatter). While faster, Biome lacks mature React Native and Expo-specific rules that `eslint-config-expo` provides. The ecosystem alignment with Expo matters more than raw speed for this project.

### Phase 2: Pre-commit Hooks

Add Husky and lint-staged to catch issues before they reach CI.

**Dependencies to install (devDependencies):**

```
husky
lint-staged
```

**Setup commands:**

```bash
npx husky init
```

This creates `.husky/` and adds a `prepare` script to package.json.

**`.husky/pre-commit`** (new file, created by husky init, then edited):

```bash
npx lint-staged
```

**`lint-staged` config in `package.json`:**

```json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md,yml,yaml}": [
      "prettier --write"
    ]
  }
}
```

**What this does:**
1. On `git commit`, Husky triggers lint-staged.
2. Lint-staged runs ESLint + Prettier only on staged files.
3. If ESLint finds unfixable errors, the commit is blocked.

**What this does NOT do:** Run `tsc --noEmit` on pre-commit. Type-checking the whole project on every commit is too slow (~5-10s). Type errors are caught in CI instead.

### Phase 3: Node Version Lock

**`.nvmrc`** (new file):

```
20
```

> Use the major version only (`20`) to allow patch flexibility while ensuring the correct LTS line. Node 20 is the current LTS and what Expo SDK 54 targets.

### Phase 4: GitHub Actions — CI Workflow

Create a single workflow with parallel jobs for speed.

**`.github/workflows/ci.yml`** (new file):

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint:
    name: Lint & Format
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run format:check

  type-check:
    name: Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
          cache: 'npm'
      - run: npm ci
      - run: npm run type-check

  test:
    name: Unit Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
          cache: 'npm'
      - run: npm ci
      - run: npm run test:coverage -- --ci --reporters=default
      - name: Upload coverage
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: coverage/
          retention-days: 7
```

**Design decisions:**

| Decision | Rationale |
|----------|-----------|
| Three parallel jobs (lint, type-check, test) | Fastest feedback — each job takes ~1-2 min vs ~4 min sequential |
| `concurrency` with `cancel-in-progress` | Cancels stale runs when new commits push to same branch/PR |
| `npm ci` not `npm install` | Deterministic installs from lockfile, faster in CI |
| `node-version-file: '.nvmrc'` | Single source of truth for Node version |
| `actions/setup-node` with `cache: 'npm'` | Caches `~/.npm` across runs — saves ~30s per job |
| Ubuntu runners (not macOS) | 10x cheaper, sufficient for lint/test/type-check |
| Coverage uploaded as artifact | Viewable for 7 days without a third-party service |

**What's NOT in this workflow:**

- **E2E tests.** These run on EAS (see Phase 4b).
- **Builds and TestFlight.** Handled by EAS Build + Submit (see Phase 6).

### Phase 4b: E2E Testing via EAS Workflows

E2E tests run on EAS using the existing `.eas/workflows/e2e.yml`. No GitHub Actions macOS runners needed — EAS provides the simulator environment.

The existing EAS workflow file already defines E2E jobs for iOS and Android using the Maestro test action. No changes to this file are needed.

**Triggering E2E from GitHub Actions:**

Add a lightweight GitHub Actions workflow that triggers the EAS workflow via CLI. This keeps E2E visible in the GitHub PR checks UI without paying for macOS runners.

**`.github/workflows/e2e.yml`** (new file):

```yaml
name: E2E Tests

on:
  workflow_dispatch:

jobs:
  trigger-eas-e2e:
    name: Trigger EAS E2E
    runs-on: ubuntu-latest
    timeout-minutes: 45
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
          cache: 'npm'

      - run: npm ci

      - name: Run EAS workflow
        run: npx eas-cli workflow:run e2e --non-interactive
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
```

**Setup required:**
1. Generate an Expo access token at expo.dev > Account Settings > Access Tokens.
2. Add it as a GitHub repository secret named `EXPO_TOKEN`.

**Design decisions:**

| Decision | Rationale |
|----------|-----------|
| `workflow_dispatch` only | Manual trigger — run before releases or when needed |
| Ubuntu runner triggers EAS | Cheap ($0.008/min) — EAS does the heavy lifting |
| `EXPO_TOKEN` secret | Authenticates the EAS CLI without interactive login |
| 45-minute timeout | EAS builds + E2E can take longer than unit tests |

### Phase 4c: Dependabot Configuration

**`.github/dependabot.yml`** (new file):

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
    open-pull-requests-limit: 5
    groups:
      expo:
        patterns:
          - "expo*"
          - "@expo/*"
      react-native:
        patterns:
          - "react-native*"
          - "@react-native*"
      testing:
        patterns:
          - "jest*"
          - "@testing-library/*"
    ignore:
      - dependency-name: "react"
        update-types: ["version-update:semver-major"]
      - dependency-name: "react-native"
        update-types: ["version-update:semver-major"]

  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
```

**Design decisions:**

| Decision | Rationale |
|----------|-----------|
| Weekly schedule on Monday | Regular cadence without noise |
| 5 PR limit | Prevents Dependabot from flooding with PRs |
| Grouped updates (expo, react-native, testing) | Related packages update together to avoid version conflicts |
| Ignore major bumps for react/react-native | Major version upgrades need manual attention — Expo SDK pins these |
| GitHub Actions ecosystem included | Keeps action versions (checkout, setup-node) current |

### Phase 4d: Branch Protection (Manual Step)

After the CI pipeline is stable, configure branch protection rules in GitHub Settings > Branches > `main`:

- **Require status checks to pass:** `Lint & Format`, `Type Check`, `Unit Tests`
- **Require branches to be up to date before merging:** Yes
- **Do NOT require E2E** — it's manual-trigger only

This is configured in the GitHub UI, not in code. The plan should include a note to do this after Phase 5.

### Phase 5: Initial Lint Fix Pass

After adding ESLint and Prettier, the existing codebase will likely have violations. This phase runs the auto-fixers across the entire codebase and commits the result as a single formatting commit.

```bash
npm run lint:fix
npm run format
```

This must happen AFTER the config files are committed but BEFORE the CI workflow is active on `main`, to avoid a red pipeline on the initial commit.

**Sequence:**
1. Commit config files (eslint, prettier, husky, CI workflow) — CI runs but lint job will fail (expected).
2. Run `lint:fix` and `format` locally.
3. Commit formatting changes with message like `chore: auto-fix lint and formatting across codebase`.
4. Push — CI should pass.

### Phase 6: TestFlight Deployment via EAS (Documentation Only)

This phase creates a deployment guide — not automation. TestFlight setup requires Apple Developer Program enrollment, App Store Connect configuration, and EAS Submit credentials, none of which are in place yet. When it's time to ship, follow this guide.

**`docs/DEPLOYMENT.md`** (new file):

```markdown
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

- "No matching provisioning profile" → Run `eas credentials` to regenerate
- "App record not found" → Create it in App Store Connect first
- Build succeeds but not in TestFlight → Check App Store Connect for compliance issues
```

**Why documentation, not automation:** The deployment workflow above is included in the doc as a reference for when you're ready. It should NOT be added as an active workflow file until:
1. Apple Developer enrollment is complete
2. App Store Connect app record exists
3. `eas build --auto-submit` has succeeded at least once manually
4. `EXPO_TOKEN` secret is added to the GitHub repo

---

## Interaction with Existing Code

### Files modified

| File | What changes | What stays the same |
|------|-------------|---------------------|
| `package.json` | Add `lint`, `lint:fix`, `format`, `format:check`, `type-check` scripts. Add `lint-staged` config. Add `prepare` script (husky). | All existing scripts unchanged. Dependencies unchanged (new ones added to devDependencies only). |
| Source files (`app/`, `components/`, `hooks/`, `services/`, `constants/`, `types/`) | Formatting changes from Prettier auto-fix (whitespace, quotes, trailing commas). Possible lint auto-fixes (unused imports). | No logic changes. No API changes. No behavioral changes. |
| `jest.config.js` | Formatting only (Prettier). | Config values unchanged. |

### Files NOT modified

- `tsconfig.json` — already correct.
- `eas.json` — build config stays as-is.
- `app.config.ts` — no changes needed.
- `.maestro/` — E2E flows untouched.
- `e2e/` — shell scripts untouched.
- `__tests__/` — test files get formatting only, no logic changes.
- `__mocks__/` — mock files get formatting only.

---

## Files Changed

| File | Change |
|------|--------|
| `eslint.config.mjs` | **New file.** Flat ESLint config extending expo + prettier |
| `.prettierrc` | **New file.** Prettier configuration |
| `.prettierignore` | **New file.** Files excluded from Prettier |
| `.nvmrc` | **New file.** Node version lock (20) |
| `.husky/pre-commit` | **New file.** Pre-commit hook running lint-staged |
| `.github/workflows/ci.yml` | **New file.** CI pipeline with lint, type-check, and test jobs |
| `.github/workflows/e2e.yml` | **New file.** Manual-trigger workflow that invokes EAS E2E |
| `docs/DEPLOYMENT.md` | **New file.** TestFlight deployment guide (prerequisites, manual + automated steps) |
| `.github/dependabot.yml` | **New file.** Automated dependency update PRs (weekly) |
| `package.json` | Add scripts, lint-staged config, devDependencies |
| `app/**/*.{ts,tsx}` | Formatting auto-fixes (no logic changes) |
| `components/**/*.{ts,tsx}` | Formatting auto-fixes (no logic changes) |
| `hooks/**/*.{ts,tsx}` | Formatting auto-fixes (no logic changes) |
| `services/**/*.{ts,tsx}` | Formatting auto-fixes (no logic changes) |
| `constants/**/*.ts` | Formatting auto-fixes (no logic changes) |
| `types/**/*.ts` | Formatting auto-fixes (no logic changes) |
| `__tests__/**/*.{ts,tsx}` | Formatting auto-fixes (no logic changes) |

---

## Open Questions

1. **Prettier style preferences — single quotes, trailing commas, print width?**
   _Resolved:_ No preference — use the defaults in the design (`singleQuote: true`, `trailingComma: "all"`, `printWidth: 100`).

2. **Should E2E tests run in GitHub Actions?**
   _Resolved:_ E2E runs on EAS (not GitHub macOS runners). A lightweight GitHub Actions workflow triggers the EAS workflow via CLI (`workflow_dispatch` manual trigger). Uses existing `.eas/workflows/e2e.yml`.

3. **Should we enable GitHub Dependabot for dependency updates?**
   _Resolved:_ Yes — weekly schedule, grouped by ecosystem (expo, react-native, testing), 5 PR limit.

4. **Should we add coverage thresholds?**
   _Resolved:_ No — coverage is uploaded as an artifact for reference but no minimum is enforced.

5. **Should we add branch protection rules?**
   _Resolved:_ Yes — require `Lint & Format`, `Type Check`, and `Unit Tests` to pass before merging to `main`. Configure in GitHub UI after CI is stable (after Phase 5).

6. **Should `eslint-config-expo` be used or a more minimal setup?**
   _Resolved:_ Use the official `eslint-config-expo`.

7. **How should TestFlight deployment work?**
   _Resolved:_ Use EAS Build + Submit (`eas build --auto-submit`). Phase 6 creates a deployment guide (`docs/DEPLOYMENT.md`) documenting prerequisites and steps. The actual workflow file is NOT created until Apple Developer enrollment, App Store Connect setup, and a successful manual deploy are complete.
