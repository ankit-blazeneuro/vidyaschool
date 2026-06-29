#!/bin/bash
cd /home/ankit/Documents/Code/vs/mobile-app/kotlin
export ANDROID_HOME=~/android-sdk

echo "Starting build at $(date)..."
./gradlew assembleDebug

if [ -f app/build/outputs/apk/debug/app-debug.apk ]; then
    echo "✅ BUILD SUCCESS at $(date)"
    echo "Installing on device..."
    adb install -r app/build/outputs/apk/debug/app-debug.apk
    echo "✅ APP INSTALLED - Check your phone!"
else
    echo "❌ BUILD FAILED"
fi
