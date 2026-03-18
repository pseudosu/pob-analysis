#!/bin/bash
set -e
cd "$(dirname "$0")"

echo "=== PoB Analysis — Windows Build (cross-compile from macOS) ==="
echo ""
echo "NOTE: Cross-compiling Windows from macOS."
echo "For native Windows build, use build-win.bat on Windows."
echo ""

# Check prerequisites
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is required."
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Check for Windows LuaJIT
if [ ! -f "resources/luajit/luajit-win-x64.exe" ]; then
    echo "WARNING: Windows LuaJIT not found at resources/luajit/luajit-win-x64.exe"
    echo "The Windows build will need LuaJIT added manually."
    echo "Download from: https://luajit.org/download.html"
    echo ""
fi

echo "Building app..."
npm run build

echo "Packaging for Windows (x64)..."
npx electron-builder --win --config electron-builder.config.cjs

echo ""
echo "=== Build complete! ==="
echo "Output in dist-release/"
ls -lh dist-release/*.exe 2>/dev/null
