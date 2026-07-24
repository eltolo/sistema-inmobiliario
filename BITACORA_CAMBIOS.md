# Bitácora de cambios - Sistema Inmobiliaria

## 2026-07-23 - Migración a Linux (Ubuntu/Debian + Python 3.12)

### Objetivo
Migrar el proyecto completo de Windows a Linux para usar el servidor Dell (192.168.1.89) como entorno de desarrollo y producción local.

### Archivos modificados (cross-platform)

| Archivo | Cambio |
|---------|--------|
| `scripts/zip_site.py` | Reemplazados 3 paths hardcoded `d:\Claudia_Inmobiliaria\...` por paths relativos con `Path(__file__).resolve().parent.parent` |
| `scripts/deploy_to_hostinger.py` | Reemplazado path hardcoded `D:\Claudia_Inmobiliaria\...` por path relativo |
| `enviar_fichas.py` | Reemplazado path hardcoded `D:\Apps\MCP_GMAIL` por variable de entorno `MCP_GMAIL_PATH` |
| `fichas/web-propiedades/server.js` | Detectar OS para usar `python3` en Linux; paths generados dinámicamente con forward slash; const `PYTHON` cross-platform |
| `fichas/instagram_generator.py` | Priorizar fonts Linux (dejavu, liberation) sobre Windows |
| `fichas/social_media_generator.py` | Priorizar fonts Linux (dejavu, liberation) sobre Windows |
| `requirements.txt` | Agregado `paramiko` (faltaba, usado en scripts de deploy) |
| `README.md` | Instrucciones Linux + Windows lado a lado; sección de fuentes |
| `quintana-web.service` | Servicio systemd para auto-arranque |
| `fichas/web-propiedades/vite.config.ts` | Puerto proxy cambiado de 3001 a 3002 |

### Scripts .sh creados (equivalentes a .bat)

| Script | Función |
|--------|---------|
| `menu.sh` | Menú interactivo con opciones |
| `deploy.sh` | Build frontend + ZIP + deploy Hostinger |
| `levantar_web_desarrollo.sh` | Dev server (Vite + Express) |
| `levantar_web_con_ngrok.sh` | Dev server + túnel ngrok |
| `scrapear_zonaprop_y_generar_fichas.sh` | Ejecuta `agente.py` |
| `reescribir_descripciones_con_ia.sh` | Reescritura IA de descripciones |
| `generar_audios_elevenlabs.sh` | Generación de audios TTS |
| `regenerar_docx_desde_descripcion.sh` | Rebuild Word desde descripción |
| `regenerar_docx_desde_descripcion_manual.sh` | Rebuild Word manual |
| `scripts/levantar_web_build_local.sh` | Servidor local modo producción |

### Servicio systemd

- Servicio: `quintana-web`
- Puerto: **3002** (3001 ocupado por Dagster)
- Servidor: 192.168.1.89, usuario: `tato`
- WorkingDirectory: `/home/tato/proyectos/inmobiliaria/sistema-inmobiliario/fichas/web-propiedades`
- Auto-arranque: `systemctl enable quintana-web`
- URL web: `http://192.168.1.89:3002`
- URL admin: `http://192.168.1.89:3002/admin` (pass: `admin123`)

### Comandos útiles en Linux

```bash
sudo systemctl status quintana-web      # Estado
sudo systemctl restart quintana-web     # Reiniciar
sudo journalctl -u quintana-web -f      # Logs en tiempo real
# Rebuildear frontend después de cambios:
cd ~/proyectos/inmobiliaria/sistema-inmobiliario/fichas/web-propiedades
npm run build
sudo systemctl restart quintana-web
```

### Commits realizados
- `7a0e32b` feat: migrar proyecto a Linux (Ubuntu/Debian + Python 3.12)
- `e4962fd` feat: agregar servicio systemd para Linux
- `8a8d261` fix: cambiar puerto a 3002 para evitar conflicto con Dagster

### Notas
- Deploy a Hostinger sigue funcionando desde Linux (paramiko SSH/SFTP)
- En Linux instalar fonts: `sudo apt-get install fonts-dejavu-core fonts-liberation`

--- / 2026-07-15 - Sesión deploy Hostinger + mejoras portal

### Producción / Hostinger
- Se realizó backup inicial del sitio antes de publicar cambios:
  - `/home/u896915843/backups/backup_cabapropiedades_public_html_20260714_165628.tar.gz`
- Se publicó la web en Hostinger para:
  - `https://cabapropiedades.ar/`
  - `https://quintana.cabapropiedades.ar/`
- Se corrigió el subdominio `quintana.cabapropiedades.ar`, que apuntaba a `/public_html/quintana`.
- Se copió el build también en:
  - `/home/u896915843/domains/cabapropiedades.ar/public_html`
  - `/home/u896915843/domains/cabapropiedades.ar/public_html/quintana`
  - `/home/u896915843/domains/cabapropiedades.ar/nodejs/dist`
- Último backup antes del parche final:
  - `/home/u896915843/backups/backup_before_patch_20260714_212442.tar.gz`
- Último ZIP deploy usado:
  - `/home/u896915843/backups/deploy_patch_20260714_212442.zip`

### Tasador / consulta de valor
- Se detectó que el tasador no usaba IA real; usaba tabla fija USD/m².
- Se creó tabla completa de barrios CABA:
  - `fichas/web-propiedades/src/data/cabaNeighborhoodValues.ts`
- Se reemplazó el campo libre de barrio por selector desplegable + accesos rápidos.
- Para alquileres se agregó texto específico:
  - “Para alquileres preferimos revisar el caso con un asesor, ya que el valor locativo depende de actualización contractual, expensas, estado, demanda y condiciones de publicación.”
- Se corrigió referencia rota a imagen `.webp` inexistente.

### Borrado de propiedades
- Se detectó que al borrar `Arenales_2000` quedaba visible sin fotos.
- Causas corregidas:
  - `properties.json` todavía contenía la propiedad.
  - `update_web.py` no limpiaba `public/properties` antes de regenerar.
  - La ruta `/property/:id` hacía fallback a la primera propiedad si no encontraba el ID.
- Cambios:
  - `fichas/update_web.py`: ahora limpia `public/properties` antes de regenerar.
  - `fichas/web-propiedades/server.js`: borra fuente, copias públicas, dist y quita la propiedad de `properties.json`.
  - `fichas/web-propiedades/src/App.tsx`: si la propiedad no existe muestra “Propiedad no disponible”.
- `Arenales_2000` quedó eliminado en QA/local:
  - no está en `properties.json`
  - no está en `public/properties`
  - no está en `dist/properties`
  - sitemap quedó con 26 URLs.

### Propiedades / UX
- Se creó documento de tickets:
  - `Docs/TICKETS_MEJORAS_PROPIEDADES.md`
- Tickets creados:
  - `PROP-UX-001` Filtro por barrio
  - `PROP-UX-002` Filtro por ambientes
  - `PROP-UX-003` Ordenamiento
  - `PROP-UX-004` Estado vacío
  - `PROP-UX-005` CTA WhatsApp en tarjetas
  - `PROP-UX-006` Buscador
  - `PROP-UX-007` Filtro por precio
  - `PROP-UX-008` Compartir propiedad
  - `PROP-UX-009` SEO por ficha
- Implementado:
  - filtro por barrio
  - filtro por ambientes
  - ordenamiento por recientes/precio/m²
  - estado vacío con botón limpiar filtros
  - botón “Consultar por WhatsApp” en cada tarjeta
  - hero usa primera propiedad disponible en lugar de Arenales fijo

### Instagram / Facebook / API admin
- Error reportado:
  - `Unexpected token '<', "<!doctype "... is not valid JSON`
- Causa: endpoints `/api/...` devolvían HTML en lugar de JSON cuando backend no respondía o hosting servía app estática.
- Se creó helper común:
  - `fichas/web-propiedades/src/lib/apiResponse.ts`
- Se aplicó a endpoints usados por Admin, Instagram y Facebook.
- Ahora los errores muestran mensajes más diagnósticos, por ejemplo:
  - “La API no está respondiendo...”
  - “Respuesta inválida del servidor: ...”

### Tests
- Se instaló Vitest en `fichas/web-propiedades`.
- Se agregó script:
  - `npm test`
- Se creó batería:
  - `fichas/web-propiedades/src/lib/apiResponse.test.ts`
- Tests cubren:
  - JSON válido
  - respuesta vacía
  - error JSON backend
  - HTML devuelto por hosting/Vite
  - texto plano inválido
  - fallos tipo generador Facebook
- Última verificación local:
  - `npm test` OK, 6 tests passing
  - `npm run build` OK

### Archivos principales modificados
- `fichas/web-propiedades/src/pages/Tasacion.tsx`
- `fichas/web-propiedades/src/data/cabaNeighborhoodValues.ts`
- `fichas/web-propiedades/src/pages/Home.tsx`
- `fichas/web-propiedades/src/pages/Admin.tsx`
- `fichas/web-propiedades/src/App.tsx`
- `fichas/web-propiedades/src/lib/apiResponse.ts`
- `fichas/web-propiedades/src/lib/apiResponse.test.ts`
- `fichas/web-propiedades/server.js`
- `fichas/update_web.py`
- `fichas/web-propiedades/package.json`
- `fichas/web-propiedades/package-lock.json`
- `Docs/TICKETS_MEJORAS_PROPIEDADES.md`

### URLs verificadas en producción
- `https://quintana.cabapropiedades.ar/` -> 200
- `https://quintana.cabapropiedades.ar/admin` -> 200
- `https://quintana.cabapropiedades.ar/tasacion` -> 200

### Rollback rápido
Para volver al estado previo al último parche de producción:

```bash
cd /home/u896915843/domains/cabapropiedades.ar/public_html
rm -rf ./*
tar -xzf /home/u896915843/backups/backup_before_patch_20260714_212442.tar.gz -C .
```

Para rollback al backup inicial de la sesión:

```bash
cd /home/u896915843/domains/cabapropiedades.ar/public_html
rm -rf ./*
tar -xzf /home/u896915843/backups/backup_cabapropiedades_public_html_20260714_165628.tar.gz -C .
```

> Nota: si el subdominio `quintana` apunta a `public_html/quintana`, verificar después del rollback que esa carpeta exista y contenga `index.html`.
