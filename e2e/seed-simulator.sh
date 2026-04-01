#!/bin/bash
# Seed the booted iOS simulator with test photos.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PHOTOS_DIR="$SCRIPT_DIR/fixtures/photos"

if [ ! -d "$PHOTOS_DIR" ] || [ -z "$(ls "$PHOTOS_DIR"/*.jpg 2>/dev/null)" ]; then
  echo "Error: No fixture photos found. Run generate-fixtures.sh first."
  exit 1
fi

# Verify a simulator is booted
if ! xcrun simctl list devices booted | grep -q "Booted"; then
  echo "Error: No booted simulator found. Boot one with:"
  echo "  xcrun simctl boot <device-udid>"
  exit 1
fi

echo "Seeding test photos into simulator..."
xcrun simctl addmedia booted "$PHOTOS_DIR"/*.jpg
echo "Done! Seeded $(ls "$PHOTOS_DIR"/*.jpg | wc -l | tr -d ' ') photos."
