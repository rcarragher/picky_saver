# CI/CD Pipeline — Execution Plan

> **Design document:** [design.md](./design.md)
> **Status:** In progress
> **Current phase:** Phase 6

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

This plan adds ESLint, Prettier, Husky pre-commit hooks, a GitHub Actions CI pipeline, Dependabot, an EAS-triggered E2E workflow, and a TestFlight deployment guide. The result: every push/PR is automatically linted, type-checked, and tested; E2E can be triggered manually via EAS; and a deployment guide is ready for when TestFlight setup is complete.

---

## Phase 1: ESLint & Prettier — Install and Configure

**Goal:** Install linting/formatting dependencies and create config files. Verify they run against the codebase (but do NOT auto-fix yet — that's Phase 3).

### Tasks

- [x] **1.1** Install ESLint and Prettier devDependencies
  - Run: `npm install --save-dev eslint eslint-config-expo prettier eslint-config-prettier`

- [x] **1.2** Create `eslint.config.mjs`
  - File: `eslint.config.mjs`
  - Content from design doc: flat config extending `eslint-config-expo/flat` and `eslint-config-prettier`, with ignores for `node_modules/`, `.expo/`, `dist/`, `e2e/fixtures/`, `ralph/`

- [x] **1.3** Create `.prettierrc`
  - File: `.prettierrc`
  - Content: `{ "singleQuote": true, "trailingComma": "all", "semi": true, "printWidth": 100, "tabWidth": 2 }`

- [x] **1.4** Create `.prettierignore`
  - File: `.prettierignore`
  - Content: `node_modules/`, `.expo/`, `dist/`, `e2e/fixtures/`, `ralph/`, `*.json`

- [x] **1.5** Add scripts to `package.json`
  - In the `"scripts"` section, add:
    - `"lint": "eslint ."`
    - `"lint:fix": "eslint . --fix"`
    - `"format": "prettier --write ."`
    - `"format:check": "prettier --check ."`
    - `"type-check": "tsc --noEmit"`

- [x] **1.6** Smoke test: run `npm run lint` and `npm run format:check`
  - These will likely report violations — that's expected. The goal is to verify the tools run without crashing (exit code doesn't matter yet, just no configuration errors).
  - Also run `npm run type-check` to verify it works.

- [x] **1.7** Build + test gate: `npm test` — all existing tests still pass
  - No new tests in this phase — this is configuration only.

### Observations

- **Import path fix:** `eslint-config-expo/flat` (directory import) failed at runtime. Changed to `eslint-config-expo/flat.js` which works correctly. The design doc's import path is wrong — future phases should use the `.js` suffix.
- **ESLint smoke test:** 21 problems (4 errors, 17 warnings) — expected, will be fixed in Phase 3.
- **Prettier smoke test:** 60 files with formatting issues — expected, will be fixed in Phase 3.
- **Type-check:** Pre-existing errors in `__tests__/services/reviewService.test.ts` and `__tests__/smoke.test.ts` — missing `@types/jest`. These are pre-existing and don't affect `npm test` (Jest has its own globals). Should be addressed in Phase 3 if needed.
- **All 155 tests pass** across 20 test suites.
- Installed versions: eslint 9.39.4, eslint-config-expo 55.0.0, eslint-config-prettier 10.1.8, prettier 3.8.1.

---

## Phase 2: Pre-commit Hooks (Husky + lint-staged)

**Goal:** Install Husky and lint-staged so that commits automatically lint and format staged files.

### Tasks

- [x] **2.1** Install Husky and lint-staged
  - Run: `npm install --save-dev husky lint-staged`

- [x] **2.2** Initialize Husky
  - Run: `npx husky init`
  - This creates `.husky/` directory and adds `"prepare": "husky"` to `package.json` scripts.

- [x] **2.3** Configure the pre-commit hook
  - File: `.husky/pre-commit` (created by `husky init` — overwrite its contents)
  - Content: `npx lint-staged`

- [x] **2.4** Add lint-staged config to `package.json`
  - Add at the top level of `package.json` (not inside `scripts`):
    ```json
    "lint-staged": {
      "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
      "*.{json,md,yml,yaml}": ["prettier --write"]
    }
    ```

- [x] **2.5** Create `.nvmrc`
  - File: `.nvmrc`
  - Content: `20`

- [x] **2.6** Verify the hook works
  - Create a temporary test: stage a small whitespace change in any `.ts` file, run `npx lint-staged` manually, and confirm it applies formatting. Revert the test change.

- [x] **2.7** Build + test gate: `npm test` — all existing tests still pass

### Observations

- Installed husky 9.1.7 and lint-staged 16.4.0 (required `--legacy-peer-deps` due to React 19 peer dep conflicts — same as Phase 1).
- `npx husky init` created `.husky/pre-commit` with `npm test` and added `"prepare": "husky"` to package.json scripts — both expected.
- Overwrote `.husky/pre-commit` to run `npx lint-staged` instead of `npm test`.
- lint-staged verification: staged a whitespace change to `constants/theme.ts`, ran `npx lint-staged` — eslint and prettier both ran successfully. The "empty commit" error was expected since prettier reverted the whitespace addition.
- All 155 tests pass across 20 suites.
- `.nvmrc` set to `20` (major version only per design doc).

---

## Phase 3: Auto-fix Codebase & Verify Clean Lint

**Goal:** Run the auto-fixers across the entire codebase and resolve any remaining lint errors that can't be auto-fixed. After this phase, `npm run lint` and `npm run format:check` both exit 0.

### Tasks

- [x] **3.1** Run Prettier auto-fix
  - Run: `npm run format`
  - This reformats all source files (whitespace, quotes, trailing commas). No logic changes.

- [x] **3.2** Run ESLint auto-fix
  - Run: `npm run lint:fix`
  - This fixes auto-fixable lint violations (unused imports, formatting rules, etc.).

- [x] **3.3** Manually fix remaining lint errors
  - Run: `npm run lint`
  - If any errors remain that couldn't be auto-fixed, fix them manually. Common issues:
    - Unused variables → remove or prefix with `_`
    - Missing return types → add explicit return types
    - Any-typed values → add proper types
  - **Important:** Only fix lint errors. Do NOT refactor, rename, or change behavior.

- [x] **3.4** Verify clean lint and format
  - Run: `npm run lint && npm run format:check`
  - Both must exit 0.

- [x] **3.5** Verify type-check passes
  - Run: `npm run type-check`
  - Must exit 0. If there are type errors, fix them (these are pre-existing, not caused by this work).

- [x] **3.6** Build + test gate: `npm run lint && npm run format:check && npm run type-check && npm test`
  - All four must pass. This is the first phase where the full quality gate runs.

### Observations

- **Prettier auto-fix:** Reformatted ~40 source files (whitespace, quotes, trailing commas). No logic changes.
- **ESLint auto-fix:** Fixed some auto-fixable issues, but 19 problems remained (4 errors, 15 warnings).
- **Manual fixes applied:**
  - 4 `react/display-name` errors in mocks — converted arrow functions to named functions in `forwardRef` calls (`__mocks__/expo-image.ts`, `__mocks__/react-native-reanimated.ts`).
  - 11 `@typescript-eslint/no-unused-vars` warnings — removed unused imports from `app/index.tsx` (`useEffect`, `useState`, `Pressable`), `app/summary.tsx` (`Pressable`), `components/PermissionGate.tsx` (`PermissionStatus`), `components/PhotoCard.tsx` (`View`), `components/PhotoGrid.tsx` (`View`), `components/SwipeOverlay.tsx` (`View`), `__tests__/components/PhotoCard.test.tsx` (`fireEvent`), `__tests__/screens/swipe.test.tsx` (`act`), `__tests__/screens/toDelete.test.tsx` (`waitFor`). Removed unused `total` variable from `app/swipe/[year]/[month].tsx`.
  - 1 `react/no-unescaped-entities` error — escaped apostrophe in `app/swipe/[year]/[month].tsx` (`doesn't` → `doesn&apos;t`).
  - 3 `react-hooks/exhaustive-deps` warnings — added `eslint-disable-next-line` comments for intentional mount-only effects in `app/summary.tsx` and `components/CelebrationBurst.tsx` (2 instances).
- **Type-check fix:** Installed `@types/jest` (devDependency) to resolve pre-existing `TS2708: Cannot use namespace 'jest' as a value` and `TS2582: Cannot find name 'describe'` errors across all test and mock files. Required `--legacy-peer-deps` (same React 19 peer dep situation as earlier phases).
- **Full gate passes:** `npm run lint`, `npm run format:check`, `npm run type-check`, and `npm test` (155 tests, 20 suites) all exit 0.
- Pre-existing `act(...)` console warnings in swipe tests remain — these are test warnings (not failures) and not caused by this phase's changes.

---

## Phase 4: GitHub Actions — CI Workflow

**Goal:** Create the main CI workflow that runs lint, type-check, and unit tests on every push/PR to `main`.

### Tasks

- [x] **4.1** Create `.github/workflows/` directory
  - Run: `mkdir -p .github/workflows`

- [x] **4.2** Create `.github/workflows/ci.yml`
  - File: `.github/workflows/ci.yml`
  - Content from design doc: three parallel jobs (`lint`, `type-check`, `test`) on `ubuntu-latest`, using `node-version-file: '.nvmrc'`, `npm ci`, concurrency group with cancel-in-progress.
  - The `test` job runs `npm run test:coverage -- --ci --reporters=default` and uploads coverage as an artifact (retention: 7 days).

- [x] **4.3** Validate the workflow YAML
  - Run: `npx yaml-lint .github/workflows/ci.yml` or use `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml'))"` to verify valid YAML.
  - No integration test possible locally — the workflow will be validated when pushed to GitHub.

- [x] **4.4** Build + test gate: `npm run lint && npm run format:check && npm run type-check && npm test`

### Observations

- Created `.github/workflows/ci.yml` with three parallel jobs (`lint`, `type-check`, `test`) matching the design doc exactly.
- YAML validated via Node.js `yaml` package and Ruby `YAML.safe_load`.
- `python3 -c "import yaml"` not available on this machine (no PyYAML installed) — used alternatives.
- Full gate passes: lint, format:check, type-check, and all 155 tests across 20 suites.
- No code changes outside the new workflow file — this phase is configuration only.

---

## Phase 5: GitHub Actions — E2E Workflow & Dependabot

**Goal:** Create the manual-trigger E2E workflow (triggers EAS) and Dependabot configuration.

### Tasks

- [x] **5.1** Create `.github/workflows/e2e.yml`
  - File: `.github/workflows/e2e.yml`
  - Content from design doc: `workflow_dispatch` trigger, single job `trigger-eas-e2e` on `ubuntu-latest`, runs `npx eas-cli workflow:run e2e --non-interactive` with `EXPO_TOKEN` secret, 45-minute timeout.

- [x] **5.2** Create `.github/dependabot.yml`
  - File: `.github/dependabot.yml`
  - Content from design doc: npm ecosystem (weekly Monday, 5 PR limit, grouped updates for expo/react-native/testing, ignore major react/react-native bumps) + github-actions ecosystem (weekly).

- [x] **5.3** Validate both YAML files
  - Run: `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/e2e.yml')); yaml.safe_load(open('.github/dependabot.yml')); print('OK')"` to verify valid YAML.

- [x] **5.4** Build + test gate: `npm run lint && npm run format:check && npm run type-check && npm test`

### Observations

- Created `.github/workflows/e2e.yml` matching the design doc exactly — `workflow_dispatch` trigger, single `trigger-eas-e2e` job on `ubuntu-latest`, 45-minute timeout, `EXPO_TOKEN` secret.
- Created `.github/dependabot.yml` matching the design doc — npm (weekly Monday, 5 PR limit, grouped expo/react-native/testing updates, ignore major react/react-native) + github-actions (weekly).
- YAML validation used Node.js `yaml` package (same as Phase 4) since `python3 -c "import yaml"` is unavailable on this machine.
- Prettier reformatted `dependabot.yml` (double quotes → single quotes per `.prettierrc`). Ran `prettier --write` before the gate.
- Full gate passes: lint, format:check, type-check, and all 155 tests across 20 suites.

---

## Phase 6: Deployment Guide

**Goal:** Create the TestFlight deployment documentation.

### Tasks

- [ ] **6.1** Create `docs/` directory
  - Run: `mkdir -p docs`

- [ ] **6.2** Create `docs/DEPLOYMENT.md`
  - File: `docs/DEPLOYMENT.md`
  - Content from design doc: prerequisites (Apple Developer Program, App Store Connect, EAS credentials), manual deployment command (`eas build --platform ios --profile production --auto-submit`), automated deployment workflow reference (`.github/workflows/deploy.yml` — to be created later), version management notes, troubleshooting section.

- [ ] **6.3** Build + test gate: `npm run lint && npm run format:check && npm run type-check && npm test`

### Observations

<!-- Agent: write notes here during execution -->

---

## Phase 7: Final Verification & Cleanup

**Goal:** Review all changes for design compliance, verify everything works end-to-end, and document the branch protection setup.

### Tasks

- [ ] **7.1** Design compliance check
  - Re-read `design.md` and verify every file listed in "Files Changed" has been created or modified as specified.
  - Verify no files listed in "Files NOT modified" were accidentally changed (other than formatting).

- [ ] **7.2** Verify all new scripts work
  - Run each script and confirm it exits successfully:
    - `npm run lint`
    - `npm run format:check`
    - `npm run type-check`
    - `npm test`
    - `npx lint-staged` (with no staged changes — should be a no-op)

- [ ] **7.3** Verify `.nvmrc` is correct
  - Run: `node -v` and confirm it matches the major version in `.nvmrc` (20.x).

- [ ] **7.4** Add branch protection reminder to `docs/DEPLOYMENT.md`
  - Append a section to `docs/DEPLOYMENT.md`:
    ```markdown
    ## Branch Protection (one-time setup)

    After CI is stable, configure in GitHub Settings > Branches > `main`:
    - Require status checks: `Lint & Format`, `Type Check`, `Unit Tests`
    - Require branches to be up to date before merging
    - Do NOT require E2E (manual-trigger only)
    ```

- [ ] **7.5** Final build + test gate: `npm run lint && npm run format:check && npm run type-check && npm test`

### Observations

<!-- Agent: write notes here during execution -->

---

## Files Changed Summary

### New Files
| File | Phase | Purpose |
|------|-------|---------|
| `eslint.config.mjs` | 1 | ESLint flat config (expo + prettier) |
| `.prettierrc` | 1 | Prettier configuration |
| `.prettierignore` | 1 | Files excluded from Prettier |
| `.nvmrc` | 2 | Node version lock (20) |
| `.husky/pre-commit` | 2 | Pre-commit hook running lint-staged |
| `.github/workflows/ci.yml` | 4 | CI pipeline (lint, type-check, test) |
| `.github/workflows/e2e.yml` | 5 | Manual-trigger E2E via EAS |
| `.github/dependabot.yml` | 5 | Automated dependency update PRs |
| `docs/DEPLOYMENT.md` | 6 | TestFlight deployment guide |

### Modified Files
| File | Phases | Changes |
|------|--------|---------|
| `package.json` | 1, 2 | Add scripts (lint, format, type-check), devDependencies (eslint, prettier, husky, lint-staged), lint-staged config, prepare script |
| `app/**/*.{ts,tsx}` | 3 | Formatting auto-fixes only |
| `components/**/*.{ts,tsx}` | 3 | Formatting auto-fixes only |
| `hooks/**/*.{ts,tsx}` | 3 | Formatting auto-fixes only |
| `services/**/*.{ts,tsx}` | 3 | Formatting auto-fixes only |
| `constants/**/*.ts` | 3 | Formatting auto-fixes only |
| `types/**/*.ts` | 3 | Formatting auto-fixes only |
| `__tests__/**/*.{ts,tsx}` | 3 | Formatting auto-fixes only |
| `jest.config.js` | 3 | Formatting only |
