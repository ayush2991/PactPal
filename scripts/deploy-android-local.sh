#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ANDROID_DIR="$ROOT_DIR/android"
DEFAULT_APP_ID="$(node -p "require('$ROOT_DIR/app.json').expo?.android?.package" 2>/dev/null || echo "com.aayushagarwal.pactpal")"
APP_ID="${APP_ID:-$DEFAULT_APP_ID}"
APK_PATH="$ANDROID_DIR/app/build/outputs/apk/release/app-release.apk"

# Script configuration flags
AUTO_LAUNCH=true
UNINSTALL_FIRST=true
CLEAN_BUILD=false

usage() {
  cat <<EOF
Usage: $(basename "$0") [options]

Builds and deploys the release APK to a connected Android device.

Options:
  --clean           Run gradle clean before building
  --keep-data       Keep existing app data (skips 'adb uninstall')
  --no-launch       Do not launch the app after installing
  -h, --help        Show this help message
EOF
}

# Parse CLI options
while [[ $# -gt 0 ]]; do
  case "$1" in
    --clean)
      CLEAN_BUILD=true
      shift
      ;;
    --keep-data)
      UNINSTALL_FIRST=false
      shift
      ;;
    --no-launch)
      AUTO_LAUNCH=false
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 1
      ;;
  esac
done

# 1. Ensure adb is in PATH (check common Android SDK locations if missing)
if ! command -v adb >/dev/null 2>&1; then
  for sdk_dir in "${ANDROID_HOME:-}" "${ANDROID_SDK_ROOT:-}" "$HOME/Library/Android/sdk" "$HOME/Android/Sdk"; do
    if [[ -n "$sdk_dir" && -x "$sdk_dir/platform-tools/adb" ]]; then
      export PATH="$sdk_dir/platform-tools:$PATH"
      break
    fi
  done
fi

if ! command -v adb >/dev/null 2>&1; then
  echo "adb was not found. Please install Android platform-tools or add adb to your PATH." >&2
  exit 1
fi

# 2. Ensure Android native project exists (run expo prebuild if missing)
if [[ ! -d "$ANDROID_DIR" || ! -x "$ANDROID_DIR/gradlew" ]]; then
  echo "Android native files not found at $ANDROID_DIR."
  echo "Running 'npx expo prebuild --platform android' to generate native project..."
  (cd "$ROOT_DIR" && npx expo prebuild --platform android)
fi

# 3. Locate JDK 17
resolve_java_home() {
  if [[ -n "${JAVA_HOME:-}" && -d "$JAVA_HOME" ]]; then
    return 0
  fi

  if command -v /usr/libexec/java_home >/dev/null 2>&1; then
    local jhome
    jhome="$(/usr/libexec/java_home -v 17 2>/dev/null || true)"
    if [[ -n "$jhome" && -d "$jhome" ]]; then
      export JAVA_HOME="$jhome"
      return 0
    fi
  fi

  local candidates=(
    "/opt/homebrew/opt/openjdk@17"
    "/usr/local/opt/openjdk@17"
    "/Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home"
    "/Library/Java/JavaVirtualMachines/zulu-17.jdk/Contents/Home"
    "/Applications/Android Studio.app/Contents/jbr/Contents/Home"
    "/Applications/Android Studio.app/Contents/jre/Contents/Home"
  )

  for candidate in "${candidates[@]}"; do
    if [[ -d "$candidate" ]]; then
      export JAVA_HOME="$candidate"
      return 0
    fi
  done

  return 1
}

if ! resolve_java_home; then
  echo "JDK 17 was not found." >&2
  echo "Set JAVA_HOME to a JDK 17 installation (e.g. 'brew install openjdk@17') before running this script." >&2
  exit 1
fi

# 4. Check device connectivity
if [[ -n "${ANDROID_SERIAL:-}" ]]; then
  ADB_CMD=(adb -s "$ANDROID_SERIAL")
else
  device_count="$(adb devices | awk 'NR > 1 && $2 == "device" { count++ } END { print count + 0 }')"

  if [[ "$device_count" -eq 0 ]]; then
    echo "No authorized Android device found. Connect your phone and enable USB debugging." >&2
    adb devices >&2
    exit 1
  fi

  if [[ "$device_count" -gt 1 ]]; then
    echo "More than one Android device is connected. Set ANDROID_SERIAL to choose one:" >&2
    adb devices >&2
    exit 1
  fi
  ADB_CMD=(adb)
fi

# 5. Build release APK
GRADLE_TASKS=()
if [[ "$CLEAN_BUILD" == "true" ]]; then
  GRADLE_TASKS+=("clean")
fi
GRADLE_TASKS+=("assembleRelease")

echo "Building release APK with Gradle (using JDK at $JAVA_HOME)..."
(
  cd "$ANDROID_DIR"
  JAVA_HOME="$JAVA_HOME" ./gradlew "${GRADLE_TASKS[@]}"
)

if [[ ! -f "$APK_PATH" ]]; then
  echo "Expected APK not found at $APK_PATH." >&2
  exit 1
fi

# 6. Uninstall old package if requested to avoid signature mismatch
if [[ "$UNINSTALL_FIRST" == "true" ]]; then
  echo "Checking for previous installation of $APP_ID..."
  if "${ADB_CMD[@]}" shell pm list packages "$APP_ID" 2>/dev/null | grep -q "^package:$APP_ID$"; then
    echo "Uninstalling existing $APP_ID..."
    "${ADB_CMD[@]}" uninstall "$APP_ID"
  else
    echo "$APP_ID is not currently installed."
  fi
fi

# 7. Install APK
echo "Installing $APK_PATH..."
"${ADB_CMD[@]}" install -r "$APK_PATH"

echo "Successfully installed $APP_ID."

# 8. Optionally launch the app
if [[ "$AUTO_LAUNCH" == "true" ]]; then
  echo "Launching $APP_ID..."
  "${ADB_CMD[@]}" shell monkey -p "$APP_ID" -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1 || true
fi
