#!/bin/bash
cd "$(dirname "$0")"

activate_venv() {
    if [ -f ".venv/bin/activate" ]; then
        source .venv/bin/activate
    else
        echo "No se encontro el entorno virtual en .venv"
        echo "Ejecuta: python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt"
        exit 1
    fi
}

activate_venv

while true; do
    clear
    echo "========================================"
    echo "  QUINTANA INMOBILIARIA - MENU PRINCIPAL"
    echo "========================================"
    echo ""
    echo "  WEB"
    echo "  1.  Deploy a Hostinger (produccion)"
    echo "  2.  Levantar web en desarrollo (localhost:5173)"
    echo "  3.  Levantar web + ngrok (URL publica temporal)"
    echo "  4.  Levantar web local modo produccion (localhost:3001)"
    echo ""
    echo "  PROPIEDADES"
    echo "  5.  Scrapear propiedad de Zonaprop"
    echo "  6.  Regenerar fichas Word desde descripcion"
    echo "  7.  Regenerar Word manual"
    echo ""
    echo "  CONTENIDO"
    echo "  8.  Reescribir descripciones con IA"
    echo "  9.  Generar audios ElevenLabs"
    echo ""
    echo "  HERRAMIENTAS"
    echo "  10. Abrir sesion OpenCode"
    echo ""
    echo "  0.  Salir"
    echo ""
    echo "========================================"
    read -p "Seleccione una opcion [0-10]: " opcion

    case $opcion in
        1) bash deploy.sh ;;
        2) bash levantar_web_desarrollo.sh ;;
        3) bash levantar_web_con_ngrok.sh ;;
        4) bash scripts/levantar_web_build_local.sh ;;
        5) bash scrapear_zonaprop_y_generar_fichas.sh ;;
        6) bash regenerar_docx_desde_descripcion.sh ;;
        7) bash regenerar_docx_desde_descripcion_manual.sh ;;
        8) bash reescribir_descripciones_con_ia.sh ;;
        9) bash generar_audios_elevenlabs.sh ;;
        0) exit 0 ;;
        *) echo "Opcion invalida" ;;
    esac

    echo ""
    read -p "Presione Enter para volver al menu..."
done
