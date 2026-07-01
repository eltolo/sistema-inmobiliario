@echo off
chcp 65001 >nul

REM Script para lanzar el servidor web local de Quintana Inmobiliaria

echo Iniciando servidor web local...
echo.

cd /d "%~dp0\..\fichas\web-propiedades"

set SERVE_DIST=1
node server.js

echo.
echo Servidor detenido.
pause
