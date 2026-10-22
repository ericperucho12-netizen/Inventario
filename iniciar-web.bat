@echo off
cd /d "%~dp0"
set PATH=C:\Program Files\nodejs;%PATH%
echo ========================================================
echo Iniciando servidor web de PeruchOS POS...
echo Abre en tu navegador: http://localhost:5173
echo ========================================================
npm run dev:web
pause
