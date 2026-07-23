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
echo "  Iniciando servidor web + ngrok"
echo "========================================"
echo ""
echo "  PASO 1: npm run dev (servidor local)"
echo "  PASO 2: ngrok http 5173"
echo ""
echo "  Una vez iniciado ngrok, la URL publica"
echo "  se muestra en la terminal (https://xxxx.ngrok.io)"
echo ""
echo "  Presiona CTRL+C en cada terminal para salir."
echo "========================================"
echo ""

# Levantar dev server en background
cd fichas/web-propiedades
npm run dev &
DEV_PID=$!
sleep 5

# Levantar ngrok
ngrok http 5173 --host-header="localhost:5173"

kill $DEV_PID 2>/dev/null
