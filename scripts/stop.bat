@echo off
REM AnonHire Stop Script for Windows (Batch version)
REM This script stops all AnonHire services

echo 🛑 Stopping AnonHire Services
echo =============================

echo 🔄 Stopping all Node.js processes...
taskkill /F /IM node.exe >nul 2>&1
if errorlevel 1 (
    echo ℹ️  No Node.js processes found
) else (
    echo ✅ Stopped Node.js processes
)

echo 🔄 Stopping all cmd processes with AnonHire in title...
taskkill /F /FI "WINDOWTITLE eq AnonHire Backend*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq AnonHire Frontend*" >nul 2>&1

echo 🐳 Stopping Docker containers...
docker-compose down >nul 2>&1
if errorlevel 1 (
    echo ℹ️  No Docker containers to stop
) else (
    echo ✅ Docker containers stopped
)

echo.
echo ✅ All AnonHire services stopped successfully!
echo =============================================
echo.
echo To restart services, run: scripts\deploy.bat
echo.
pause
