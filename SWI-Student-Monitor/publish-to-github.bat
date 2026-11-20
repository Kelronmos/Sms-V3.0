@echo off
setlocal
cd /d "%~dp0"

echo ==================================================
echo SWI STUDENT MONITOR - GITHUB PUBLISHER
echo Target: Kelronmos/SWI-Student-Monitor
echo Visibility: PRIVATE by default
echo ==================================================

where gh >nul 2>nul
if errorlevel 1 (
  echo ERROR: GitHub CLI 'gh' is not installed.
  echo Install Git and GitHub CLI, then run: gh auth login
  pause
  exit /b 1
)

where git >nul 2>nul
if errorlevel 1 (
  echo ERROR: Git is not installed.
  pause
  exit /b 1
)

gh auth status
if errorlevel 1 (
  echo ERROR: GitHub CLI is not authenticated. Run: gh auth login
  pause
  exit /b 1
)

if not exist .git git init
if errorlevel 1 goto :fail

git add -A
if errorlevel 1 goto :fail

git diff --cached --quiet
if errorlevel 1 (
  git commit -m "Initial SWI Student Monitor prototype with CI and copyright"
  if errorlevel 1 goto :fail
) else (
  echo No staged changes; existing commit will be published if available.
)

REM Keep the repository private by default because this is student-monitoring software.
REM Change --private to --public only after reviewing the entire repository for sensitive data.
gh repo create Kelronmos/SWI-Student-Monitor --private --source=. --remote=origin --push
if errorlevel 1 (
  echo.
  echo Publish failed. If the repository already exists, inspect it before pushing.
  echo Do not force-push or overwrite existing history automatically.
  goto :fail
)

echo.
echo Publish command completed. Verify GitHub Actions before claiming build success.
echo Repository: https://github.com/Kelronmos/SWI-Student-Monitor
pause
exit /b 0

:fail
echo.
echo FAILED. No production authorization is implied.
pause
exit /b 1
