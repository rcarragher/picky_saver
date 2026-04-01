#!/bin/bash
# Generate test photo fixtures with EXIF dates for E2E testing.
# Requires: brew install imagemagick exiftool
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
OUTPUT_DIR="$SCRIPT_DIR/fixtures/photos"

# Check dependencies
for cmd in magick exiftool; do
  if ! command -v "$cmd" &>/dev/null; then
    echo "Error: $cmd is required. Install with: brew install imagemagick exiftool"
    exit 1
  fi
done

# Clean previous fixtures
rm -f "$OUTPUT_DIR"/*.jpg

echo "Generating test photo fixtures..."

# Colors for visual distinction
COLORS=("#E74C3C" "#3498DB" "#2ECC71" "#F39C12" "#9B59B6" \
        "#1ABC9C" "#E67E22" "#34495E" "#16A085" "#C0392B" \
        "#2980B9" "#27AE60" "#8E44AD")

# Photo configs: filename, width, height, EXIF date
PHOTOS=(
  "jan_01_portrait,1080,1920,2025:01:05 10:30:00"
  "jan_02_landscape,1920,1080,2025:01:10 14:15:00"
  "jan_03_square,1080,1080,2025:01:15 09:00:00"
  "jan_04_portrait,1080,1920,2025:01:20 16:45:00"
  "jan_05_landscape,1920,1080,2025:01:25 11:30:00"
  "feb_01_portrait,1080,1920,2025:02:03 08:00:00"
  "feb_02_landscape,1920,1080,2025:02:08 13:20:00"
  "feb_03_square,1080,1080,2025:02:14 17:00:00"
  "feb_04_portrait,1080,1920,2025:02:19 10:10:00"
  "feb_05_landscape,1920,1080,2025:02:24 15:45:00"
  "mar_01_portrait,1080,1920,2025:03:05 09:30:00"
  "mar_02_landscape,1920,1080,2025:03:15 12:00:00"
  "mar_03_square,1080,1080,2025:03:25 14:30:00"
)

for i in "${!PHOTOS[@]}"; do
  IFS=',' read -r name width height date <<< "${PHOTOS[$i]}"
  color="${COLORS[$i]}"
  filepath="$OUTPUT_DIR/${name}.jpg"

  # Generate solid-color image with a contrasting crosshair pattern for visual distinction
  magick -size "${width}x${height}" "xc:${color}" \
    -fill white -draw "line $((width/2)),0 $((width/2)),$height" \
    -fill white -draw "line 0,$((height/2)) $width,$((height/2))" \
    -fill white -draw "circle $((width/2)),$((height/2)) $((width/2 + 100)),$((height/2))" \
    -quality 50 "$filepath"

  # Set EXIF DateTimeOriginal
  exiftool -overwrite_original -DateTimeOriginal="$date" "$filepath"

  echo "  Created: ${name}.jpg (${width}x${height}, date: $date)"
done

echo ""
echo "Done! Generated ${#PHOTOS[@]} test photos in $OUTPUT_DIR"
