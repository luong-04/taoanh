@echo off
title POD Design Studio - Backend API Server (Port 8000)
cd /d "%~dp0"
echo ========================================================
echo Starting POD Design Studio Backend (FastAPI on Port 8000)
echo ========================================================
backend\venv\Scripts\python.exe backend\run.py
pause

