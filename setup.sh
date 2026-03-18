#!/bin/bash
set -e
cd "$(dirname "$0")"

echo "=== PoB Analysis — Setup ==="
echo ""

# 1. Install npm dependencies
echo "[1/4] Installing npm dependencies..."
npm install

# 2. Clone PoB Community source
if [ ! -d "resources/pob-src-repo" ]; then
  echo "[2/4] Cloning Path of Building Community source..."
  git clone --depth=1 https://github.com/PathOfBuildingCommunity/PathOfBuilding.git resources/pob-src-repo
else
  echo "[2/4] PoB source already cloned, pulling latest..."
  cd resources/pob-src-repo && git pull && cd ../..
fi

# 3. Copy PoB source files
echo "[3/4] Setting up PoB source and runtime..."
mkdir -p resources/pob-src resources/pob-runtime/lua resources/luajit

# Copy src/ to pob-src/
cp -r resources/pob-src-repo/src/* resources/pob-src/

# Copy runtime Lua modules
cp resources/pob-src-repo/runtime/lua/base64.lua resources/pob-runtime/lua/ 2>/dev/null || true
cp resources/pob-src-repo/runtime/lua/dkjson.lua resources/pob-runtime/lua/ 2>/dev/null || true
cp resources/pob-src-repo/runtime/lua/xml.lua resources/pob-runtime/lua/ 2>/dev/null || true
cp resources/pob-src-repo/runtime/lua/lua-profiler.lua resources/pob-runtime/lua/ 2>/dev/null || true
cp -r resources/pob-src-repo/runtime/lua/sha1 resources/pob-runtime/lua/ 2>/dev/null || true

# Copy Windows DLLs for cross-platform support
cp resources/pob-src-repo/runtime/zlib1.dll resources/pob-src/ 2>/dev/null || true
cp resources/pob-src-repo/runtime/vcruntime140.dll resources/pob-src/ 2>/dev/null || true
cp resources/pob-src-repo/runtime/vcruntime140_1.dll resources/pob-src/ 2>/dev/null || true
cp resources/pob-src-repo/runtime/msvcp140.dll resources/pob-src/ 2>/dev/null || true
cp resources/pob-src-repo/runtime/msvcp140_1.dll resources/pob-src/ 2>/dev/null || true
cp resources/pob-src-repo/runtime/msvcp140_2.dll resources/pob-src/ 2>/dev/null || true
cp resources/pob-src-repo/runtime/lua-utf8.dll resources/pob-runtime/lua/ 2>/dev/null || true

# Copy pobBridge.lua (our custom bridge)
# Already in the repo — no action needed

# 4. Setup LuaJIT
echo "[4/4] Setting up LuaJIT..."
if [ "$(uname -m)" = "arm64" ] && [ "$(uname)" = "Darwin" ]; then
  if command -v luajit &>/dev/null; then
    cp "$(which luajit)" resources/luajit/luajit-mac-arm64
    echo "  Copied system LuaJIT (arm64)"
  elif [ -f /opt/homebrew/bin/luajit ]; then
    cp /opt/homebrew/bin/luajit resources/luajit/luajit-mac-arm64
    echo "  Copied Homebrew LuaJIT (arm64)"
  else
    echo "  WARNING: LuaJIT not found. Install with: brew install luajit"
  fi
elif [ "$(uname)" = "Darwin" ]; then
  if command -v luajit &>/dev/null; then
    cp "$(which luajit)" resources/luajit/luajit-mac-x64
    echo "  Copied system LuaJIT (x64)"
  fi
fi

# Compile lua-utf8.so for Mac
if [ "$(uname)" = "Darwin" ] && command -v clang &>/dev/null; then
  echo "  Compiling lua-utf8.so..."
  LUAJIT_INC="/opt/homebrew/opt/luajit/include/luajit-2.1"
  if [ ! -d "$LUAJIT_INC" ]; then
    LUAJIT_INC="/usr/local/opt/luajit/include/luajit-2.1"
  fi
  if [ -d "$LUAJIT_INC" ]; then
    cd /tmp
    [ ! -d luautf8-src ] && git clone --depth=1 https://github.com/starwing/luautf8.git luautf8-src
    clang -O2 -bundle -undefined dynamic_lookup -I"$LUAJIT_INC" -o lua-utf8.so luautf8-src/lutf8lib.c
    cp lua-utf8.so "$(dirname "$0")/resources/pob-runtime/lua/lua-utf8.so"
    cd "$(dirname "$0")"
    echo "  lua-utf8.so compiled"
  fi
fi

# Download Windows LuaJIT from MSYS2 (for cross-compilation)
if [ ! -f "resources/luajit/luajit-win-x64.exe" ]; then
  echo "  Downloading Windows LuaJIT..."
  MSYS2_URL=$(curl -sL "https://packages.msys2.org/package/mingw-w64-x86_64-luajit?repo=mingw64" 2>/dev/null | grep -o 'https://mirror.msys2.org/mingw/mingw64/mingw-w64-x86_64-luajit[^"]*pkg.tar.zst' | head -1)
  if [ -n "$MSYS2_URL" ]; then
    curl -sL -o /tmp/luajit-pkg.tar.zst "$MSYS2_URL"
    cd /tmp && zstd -d luajit-pkg.tar.zst -o luajit-pkg.tar 2>/dev/null
    tar xf luajit-pkg.tar mingw64/bin/luajit.exe mingw64/bin/lua51.dll 2>/dev/null
    cp mingw64/bin/luajit.exe "$(dirname "$0")/resources/luajit/luajit-win-x64.exe"
    cp mingw64/bin/lua51.dll "$(dirname "$0")/resources/luajit/lua51.dll"
    cd "$(dirname "$0")"
    echo "  Windows LuaJIT downloaded"
  else
    echo "  WARNING: Could not download Windows LuaJIT"
  fi
fi

echo ""
echo "=== Setup complete! ==="
echo "Run: npm run dev     (development)"
echo "Run: ./build-mac.sh  (macOS build)"
echo "Run: ./build-win.sh  (Windows build)"
