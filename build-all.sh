#!/bin/bash
set -e
cd "$(dirname "$0")"

echo "=== PoB Analysis — Full Build (All Platforms) ==="
echo ""

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

echo "Building app..."
npm run build

echo ""
echo "Packaging for macOS..."
npx electron-builder --mac --config electron-builder.config.cjs

echo ""
echo "Packaging for Windows..."
npx electron-builder --win --config electron-builder.config.cjs

echo ""
echo "=== All builds complete! ==="
echo "Output in dist-release/"
echo ""
ls -lh dist-release/ 2>/dev/null
