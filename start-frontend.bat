@echo off
title POD Design Studio - Frontend App (Port 3000)
cd /d "%~dp0frontend"
set PATH=D:\nodejs;%PATH%
echo ========================================================
echo Starting POD Design Studio Frontend (Next.js on Port 3000)
echo ========================================================
npm run dev
pause

