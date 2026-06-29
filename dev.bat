@echo off
cd /d "%~dp0fichas\web-propiedades"
echo Iniciando servidor web inmobiliario...
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:3001
echo.
npm run dev
pause
