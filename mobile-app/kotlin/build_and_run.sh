#!/usr/bin/env bash
# build_and_run.sh
# Builds the Android app (debug variant) and installs + launches it
# on a device connected via USB.
#
# Usage:
#   ./build_and_run.sh
#
# Requirements:
#   - Run this from the root of your Android project (where gradlew lives)
#   - USB debugging enabled on the phone, device authorized (adb devices)
#   - adb available in PATH (comes with Android SDK platform-tools)

set -e  # exit immediately if a command fails

# ---- CONFIG: change these if your project differs ----
APP_MODULE="app"                 # gradle module name, usually "app"
BUILD_VARIANT="Debug"            # Debug / Release
PACKAGE_NAME=""                  # e.g. "com.blazeneuro.app" - leave empty to auto-detect
LAUNCHER_ACTIVITY=""             # e.g. ".MainActivity" - leave empty to auto-launch via monkey
# --------------------------------------------------------

echo "🔧 Checking adb device connection..."
DEVICE_COUNT=$(adb devices | grep -w "device" | wc -l)

if [ "$DEVICE_COUNT" -eq 0 ]; then
    echo "❌ No device found. Plug in your phone via USB, enable USB debugging,"
    echo "   and accept the RSA fingerprint prompt on the device. Then re-run this script."
    exit 1
fi

echo "✅ Device detected:"
adb devices

echo ""
echo "🏗️  Building $BUILD_VARIANT APK for module '$APP_MODULE'..."
chmod +x ./gradlew
./gradlew ":${APP_MODULE}:assemble${BUILD_VARIANT}"

# Locate the generated APK
APK_PATH=$(find "${APP_MODULE}/build/outputs/apk" -type f -name "*.apk" | grep -i "${BUILD_VARIANT,,}" | head -n 1)

if [ -z "$APK_PATH" ]; then
    echo "❌ Could not find built APK. Check the build output above for errors."
    exit 1
fi

echo "📦 Found APK: $APK_PATH"

echo ""
echo "📲 Installing APK on device..."
adb install -r "$APK_PATH"

# Auto-detect package name from APK if not set
if [ -z "$PACKAGE_NAME" ]; then
    PACKAGE_NAME=$(aapt dump badging "$APK_PATH" 2>/dev/null | grep package | awk -F"'" '{print $2}')
fi

if [ -z "$PACKAGE_NAME" ]; then
    echo "⚠️  Could not auto-detect package name (aapt not available)."
    echo "   APK installed successfully, but launch it manually on the device."
    exit 0
fi

echo "📦 Package: $PACKAGE_NAME"

echo ""
echo "🚀 Launching app on device..."
if [ -n "$LAUNCHER_ACTIVITY" ]; then
    adb shell am start -n "${PACKAGE_NAME}/${LAUNCHER_ACTIVITY}"
else
    # Generic launch using monkey tool — finds and starts default launcher activity
    adb shell monkey -p "$PACKAGE_NAME" -c android.intent.category.LAUNCHER 1 > /dev/null 2>&1
fi

echo "✅ Done. App should now be running on your device."
