@echo off
echo === PoB Analysis — Windows Build ===
echo.

cd /d "%~dp0"

where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ERROR: Node.js is required. Install from https://nodejs.org
    exit /b 1
)

if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

if not exist "resources\luajit\luajit-win-x64.exe" (
    echo ERROR: LuaJIT binary not found at resources\luajit\luajit-win-x64.exe
    echo Download LuaJIT for Windows and place it there.
    echo Download from: https://luajit.org/download.html
    exit /b 1
)

echo Building app...
call npm run build

echo Packaging for Windows...
call npx electron-builder --win --config electron-builder.config.cjs

echo.
echo === Build complete! ===
echo Output in dist-release\
dir /b dist-release\*.exe 2>nul
pause
