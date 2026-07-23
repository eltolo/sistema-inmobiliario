#!/bin/bash
cd "$(dirname "$0")"

echo "========================================"
echo "  Deploy a Hostinger - Quintana"
echo "========================================"
echo ""

# 1. Build frontend
echo "[1/4] Build frontend..."
cd fichas/web-propiedades
npm run build
if [ $? -ne 0 ]; then
    echo "ERROR: Fallo el build. Abortando."
    exit 1
fi
cd ../..

# 2. Crear ZIP
echo "[2/4] Creando site_express.zip..."
rm -f site_express.zip
cd fichas/web-propiedades
zip -r ../../site_express.zip . -x "node_modules/*" ".git/*" "src/*" "scripts/*"
cd ../..
if [ $? -ne 0 ]; then
    echo "ERROR: Fallo al crear el ZIP."
    exit 1
fi
echo "OK: site_express.zip creado"

# 3. Subir a Hostinger
echo "[3/4] Subiendo a Hostinger..."
python3 scripts/deploy_to_hostinger.py
if [ $? -ne 0 ]; then
    echo "ERROR: Fallo el deploy."
    exit 1
fi

# 4. Verificar
echo "[4/4] Verificando sitio..."
sleep 5
curl -s -o /dev/null -w "HTTP %{http_code}\n" https://cabapropiedades.ar/

echo ""
echo "========================================"
echo "  Deploy completado!"
echo "========================================"
