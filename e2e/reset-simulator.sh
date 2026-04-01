#!/bin/bash
# Reset the booted iOS simulator to a clean state (wipes photos, apps, permissions).
set -euo pipefail

# Get the UDID of the booted simulator
DEVICE_UDID=$(xcrun simctl list devices booted -j | python3 -c "
import sys, json
data = json.load(sys.stdin)
for runtime, devices in data['devices'].items():
    for d in devices:
        if d['state'] == 'Booted':
            print(d['udid'])
            sys.exit(0)
print('', file=sys.stderr)
sys.exit(1)
" 2>/dev/null) || {
  echo "Error: No booted simulator found."
  exit 1
}

echo "Resetting simulator $DEVICE_UDID..."
xcrun simctl shutdown "$DEVICE_UDID"
xcrun simctl erase "$DEVICE_UDID"
xcrun simctl boot "$DEVICE_UDID"
echo "Simulator reset and rebooted."
