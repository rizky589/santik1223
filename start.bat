@echo off
echo ====================================
echo  SANTIK React - Setup & Run
echo ====================================
echo.
echo [1/2] Installing dependencies...
cd /d "%~dp0"
call npm install
if %errorlevel% neq 0 (
  echo [ERROR] npm install failed!
  pause
  exit /b 1
)
echo.
echo [2/2] Starting dev server...
call npm run dev
pause
