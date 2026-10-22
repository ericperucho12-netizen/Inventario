@echo off
cd /d "%~dp0"
set PATH=C:\Program Files\nodejs;%PATH%
echo ========================================================
echo Iniciando aplicacion de escritorio PeruchOS POS (Electron)...
echo ========================================================
npm run dev:pos
pause
