@echo off
title POD Design Studio Launcher
cd /d "%~dp0"
set PATH=D:\nodejs;%PATH%
echo ========================================================
echo Launching POD Design Studio (Full-Stack Local Studio)
echo ========================================================

:: 1. Clean up old processes on 8000 and 3000 if stuck
echo [1/3] Checking ports 8000 and 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1

:: 2. Start Backend
echo [2/3] Starting Backend API Server (FastAPI on Port 8000)...
start "POD Studio - Backend" cmd /k "backend\venv\Scripts\python.exe backend\run.py"

:: 3. Start Frontend
echo [3/3] Starting Frontend Studio Client (Next.js on Port 3000)...
start "POD Studio - Frontend" cmd /k "cd frontend && npm run dev"

echo ========================================================
echo Waiting for studio to be fully ready...
echo (Next.js is compiling, please wait a few seconds)
echo ========================================================

:: Poll localhost:3000 until ready before opening browser
powershell -Command "for ($i=0; $i -lt 30; $i++) { try { $r = Invoke-WebRequest -Uri 'http://localhost:3000' -UseBasicParsing -TimeoutSec 2; if ($r.StatusCode -eq 200) { break } } catch { Start-Sleep -Seconds 1 } }"

echo ========================================================
echo Studio is READY! Opening browser at http://localhost:3000
echo ========================================================
start http://localhost:3000
