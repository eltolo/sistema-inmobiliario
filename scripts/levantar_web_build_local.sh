#!/bin/bash
cd "$(dirname "$0")/.."

if [ -f ".venv/bin/activate" ]; then
    source .venv/bin/activate
else
    echo "No se encontro el entorno virtual en .venv"
    echo "Ejecuta: python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt"
    exit 1
fi

echo "Iniciando servidor web local..."
echo ""

cd fichas/web-propiedades
export SERVE_DIST=1
node server.js

echo ""
echo "Servidor detenido."
