@echo off
cd /d "%~dp0"
set PATH=C:\Program Files\nodejs;%PATH%
echo ========================================================
echo Iniciando backend API (http://localhost:3000)...
echo ========================================================
npm run dev:backend
pause
