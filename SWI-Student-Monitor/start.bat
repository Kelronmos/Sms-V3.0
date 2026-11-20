@echo off
setlocal
cd /d "%~dp0"
echo ==========================================
echo   SWI Student Monitor - local prototype
echo ==========================================
where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js is not installed. Install Node.js 20 or newer, then retry.
  pause
  exit /b 1
)
where npm >nul 2>nul
if errorlevel 1 (
  echo ERROR: npm was not found. Repair your Node.js installation, then retry.
  pause
  exit /b 1
)
if not exist package-lock.json (
  echo ERROR: package-lock.json is missing. Stop; do not install unpinned dependencies.
  pause
  exit /b 1
)
if not exist node_modules\ (
  echo Installing locked dependencies with npm ci...
  call npm ci
  if errorlevel 1 (
    echo ERROR: npm ci failed. No server was started.
    pause
    exit /b 1
  )
)
echo Starting SWI Student Monitor...
call npm run dev
set EXITCODE=%ERRORLEVEL%
echo Server stopped with exit code %EXITCODE%.
pause
exit /b %EXITCODE%
