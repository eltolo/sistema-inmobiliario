@echo off
REM Re-escribir descripciones de todas las propiedades con IA
cd /d %~dp0

echo ========================================
echo  Re-escribiendo descripciones con IA
echo ========================================
echo.

python fichas/rewriter_descripciones.py

echo.
echo Luego ejecut: python update_web.py
pause
