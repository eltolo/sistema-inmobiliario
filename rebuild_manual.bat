@echo off
REM Regenerar Word desde descripcion.txt manual
cd /d %~dp0

echo Ejecutando rebuild manual...
python agente.py --rebuild-manual
echo Listo.
