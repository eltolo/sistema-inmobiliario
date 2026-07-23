#!/bin/bash
cd "$(dirname "$0")"

if [ -f ".venv/bin/activate" ]; then
    source .venv/bin/activate
else
    echo "No se encontro el entorno virtual en .venv"
    echo "Ejecuta: python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt"
    exit 1
fi

echo "========================================"
echo "  Generando audios con ElevenLabs"
echo "========================================"
echo ""

python3 fichas/rewriter_audios.py

echo ""
echo "Luego ejecuta: python3 update_web.py"
