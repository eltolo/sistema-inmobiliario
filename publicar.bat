@echo off
cd /d "%~dp0fichas\web-propiedades"
echo ========================================
echo  Iniciando servidor web + ngrok
echo ========================================
echo.
echo  PASO 1: npm run dev (servidor local)
echo  PASO 2: ngrok http 5173
echo.
echo  Una vez iniciado ngrok, la URL publica
echo  se muestra en la terminal (https://xxxx.ngrok.io)
echo.
echo  Presiona CTRL+C en cada ventana para salir.
echo ========================================
echo.
start "Quintana Web" cmd /k "npm run dev"
timeout /t 5
ngrok http 5173 --host-header="localhost:5173"
pause
