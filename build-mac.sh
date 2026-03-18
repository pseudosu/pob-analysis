#!/bin/bash
set -e
cd "$(dirname "$0")"

echo "=== PoB Analysis — macOS Build ==="
echo ""

# Check prerequisites
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is required. Install from https://nodejs.org"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "ERROR: npm is required."
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Ensure LuaJIT binary exists
if [ ! -f "resources/luajit/luajit-mac-arm64" ]; then
    echo "ERROR: LuaJIT binary not found at resources/luajit/luajit-mac-arm64"
    echo "Install via: brew install luajit && cp /opt/homebrew/bin/luajit resources/luajit/luajit-mac-arm64"
    exit 1
fi

# Ensure PoB source exists
if [ ! -f "resources/pob-src/HeadlessWrapper.lua" ]; then
    echo "ERROR: PoB source not found at resources/pob-src/"
    echo "Clone PathOfBuildingCommunity/PathOfBuilding and copy src/ to resources/pob-src/"
    exit 1
fi

echo "Building app..."
npm run build

echo "Packaging for macOS (arm64)..."
npx electron-builder --mac --config electron-builder.config.cjs

echo ""
echo "=== Build complete! ==="
echo "Output in dist-release/"
ls -lh dist-release/*.dmg dist-release/*.zip 2>/dev/null
