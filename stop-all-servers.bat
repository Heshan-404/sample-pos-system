@echo off
title POS System - Stop All Servers
color 0C

echo.
echo ========================================
echo    POS System - Stopping All Servers
echo ========================================
echo.

echo Stopping all Node.js processes...
echo.

REM Kill all node processes
taskkill /F /IM node.exe /T >nul 2>&1

if %errorlevel% equ 0 (
    echo ✓ All servers stopped successfully!
) else (
    echo ℹ No running servers found.
)

echo.
echo ========================================
echo         Servers Stopped
echo ========================================
echo.
echo Press any key to exit...
pause >nul
exit
