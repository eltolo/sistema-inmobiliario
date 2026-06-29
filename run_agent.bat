@echo off
REM Activates the shared virtual environment and runs the agent
cd /d %~dp0
set VENV_PATH=D:\apps\mcp_filesystem\venv
IF EXIST "%VENV_PATH%\Scripts\activate.bat" (
    call "%VENV_PATH%\Scripts\activate.bat"
) ELSE (
    echo Virtual environment not found at %VENV_PATH%
    echo Please create or adjust VENV_PATH in this script.
    goto :EOF
)

pip install -r requirements.txt

python agente.py %*
