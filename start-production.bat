@echo off
title POS System - Production Launcher
color 0A

echo.
echo ========================================
echo    POS SYSTEM - PRODUCTION MODE
echo ========================================
echo.

REM Get the directory where this script is located
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

echo [Step 1/6] Stopping existing servers...
REM Kill any existing Node.js processes
taskkill /F /IM node.exe /T >nul 2>&1
if %errorlevel% equ 0 (
    echo   - Stopped existing Node processes
) else (
    echo   - No existing processes found
)
timeout /t 2 /nobreak >nul

echo [Step 2/6] Building frontend...
cd "%SCRIPT_DIR%frontend"
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Frontend build failed!
    pause
    exit /b 1
)
echo   - Frontend built successfully

echo [Step 3/6] Starting Backend Server...
cd "%SCRIPT_DIR%backend"
start /min "POS Backend" cmd /k "title POS Backend Server && npm start"
timeout /t 4 /nobreak >nul
echo   - Backend started on http://localhost:5000

echo [Step 4/6] Starting Print Server...
cd "%SCRIPT_DIR%print-server"
start /min "POS Print Server" cmd /k "title POS Print Server && npm start"
timeout /t 3 /nobreak >nul
echo   - Print server started

echo [Step 5/6] Waiting for servers to initialize...
timeout /t 3 /nobreak >nul

echo [Step 6/6] Opening POS System in browser...
start http://localhost:5000

echo.
echo ========================================
echo    POS SYSTEM IS NOW RUNNING
echo ========================================
echo.
echo   Backend API:  http://localhost:5000/api
echo   Dashboard:    http://localhost:5000
echo.
echo   Servers are running in minimized windows
echo   To stop: Run stop-all-servers.bat
echo.
echo ========================================
echo.
echo Press any key to exit this launcher...
pause >nul
exit
