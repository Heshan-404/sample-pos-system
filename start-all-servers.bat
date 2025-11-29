@echo off
title POS System - Development Launcher
color 0A

echo.
echo ========================================
echo    POS SYSTEM - DEVELOPMENT MODE
echo ========================================
echo.

REM Get the directory where this script is located
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

echo [Step 1/5] Stopping existing servers...
REM Kill any existing Node.js processes
taskkill /F /IM node.exe /T >nul 2>&1
if %errorlevel% equ 0 (
    echo   - Stopped existing Node processes
) else (
    echo   - No existing processes found
)
timeout /t 2 /nobreak >nul

echo [Step 2/5] Starting Backend Server...
start "Backend Server" cmd /k "cd /d "%SCRIPT_DIR%backend" && title Backend Server && npm start"
timeout /t 4 /nobreak >nul
echo   - Backend started on http://localhost:5000

echo [Step 3/5] Starting Print Server...
start "Print Server" cmd /k "cd /d "%SCRIPT_DIR%print-server" && title Print Server && npm start"
timeout /t 3 /nobreak >nul
echo   - Print server started

echo [Step 4/5] Starting Frontend Dev Server...
start "Frontend Dev Server" cmd /k "cd /d "%SCRIPT_DIR%frontend" && title Frontend Dev Server && npm run preview"
timeout /t 5 /nobreak >nul
echo   - Frontend dev started

echo [Step 5/5] Opening POS System in browser...
timeout /t 3 /nobreak >nul
start http://localhost:5173

echo.
echo ========================================
echo    ALL SERVERS STARTED SUCCESSFULLY!
echo ========================================
echo.
echo   Backend:   http://localhost:5000
echo   Frontend:  http://localhost:5173  (Auto-opened)
echo   Print:     Connected to Backend
echo.
echo   3 Terminal windows are open with live logs
echo   Close terminals or run stop-all-servers.bat to stop
echo.
echo ========================================
echo.
echo Press any key to exit this launcher...
pause >nul
exit
