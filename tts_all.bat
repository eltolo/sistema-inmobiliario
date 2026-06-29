@echo off
REM Generar audios (narración ElevenLabs) para todas las propiedades
cd /d %~dp0

echo ========================================
echo  Generando audios con ElevenLabs
echo ========================================
echo.

python fichas/rewriter_audios.py

echo.
echo Luego ejecut: python update_web.py
pause
