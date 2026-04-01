#!/bin/bash
# Run the full E2E test suite: reset simulator, build app, seed photos, run Maestro flows.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BUNDLE_ID="com.pickysaver.app"
FLOWS_DIR="$PROJECT_DIR/.maestro/flows"

# Check Maestro is installed
if ! command -v maestro &>/dev/null; then
  echo "Error: Maestro CLI not found. Install with:"
  echo '  curl -Ls "https://get.maestro.mobile.dev" | bash'
  exit 1
fi

echo "=== Step 1: Reset simulator ==="
"$SCRIPT_DIR/reset-simulator.sh"

echo ""
echo "=== Step 2: Build and install app ==="
cd "$PROJECT_DIR"
npx expo run:ios --no-bundler

echo ""
echo "=== Step 3: Seed test photos ==="
"$SCRIPT_DIR/seed-simulator.sh"

echo ""
echo "=== Step 4: Pre-grant photo permissions ==="
xcrun simctl privacy booted grant photos "$BUNDLE_ID"
echo "Photo permissions granted for $BUNDLE_ID"

echo ""
echo "=== Step 5: Run Maestro E2E flows ==="

PASSED=0
FAILED=0
SKIPPED=0

run_flow() {
  local flow="$1"
  local flow_path="$FLOWS_DIR/$flow"

  if [ ! -f "$flow_path" ]; then
    echo "  SKIP: $flow (file not found)"
    ((SKIPPED++))
    return
  fi

  echo "  Running: $flow"
  if maestro test "$flow_path" 2>&1 | tail -1 | grep -q "COMPLETED"; then
    echo "  PASS: $flow"
    ((PASSED++))
  else
    echo "  FAIL: $flow"
    ((FAILED++))
  fi
}

# Independent flows (no state dependencies)
echo ""
echo "--- Independent flows ---"
run_flow "grant-permissions.yaml"
run_flow "permission-denied.yaml"
run_flow "to-delete-empty.yaml"
run_flow "onboarding-skip.yaml"
run_flow "pull-to-refresh.yaml"
run_flow "back-navigation.yaml"
run_flow "empty-month.yaml"
run_flow "undo-flow.yaml"

# Journey flows (sequential dependencies)
echo ""
echo "--- Journey flows ---"
run_flow "organize-month.yaml"       # Marks 2 photos for deletion
run_flow "restore-flow.yaml"         # Restores 1 from deletion list
run_flow "preview-close.yaml"        # Tests close button on preview modal
run_flow "swipe-all-photos.yaml"     # Completes a full month
run_flow "summary-assertions.yaml"   # Verifies summary screen content
run_flow "summary-navigation.yaml"   # Tests summary screen buttons
run_flow "delete-success-toast.yaml" # Deletes all + verifies toast

# Re-mark photos for the final delete-flow
echo "  (Re-marking photos for delete-flow...)"
maestro test "$FLOWS_DIR/organize-month.yaml" 2>&1 > /dev/null
run_flow "delete-flow.yaml"          # Standard delete all flow

echo ""
echo "=== Results ==="
echo "  Passed:  $PASSED"
echo "  Failed:  $FAILED"
echo "  Skipped: $SKIPPED"
echo "  Total:   $((PASSED + FAILED + SKIPPED))"

if [ "$FAILED" -gt 0 ]; then
  exit 1
fi
