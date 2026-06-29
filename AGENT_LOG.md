# Bitacora Agente

## 2026-03-30
- Observacion: Cloudflare bloquea Selenium; ScrapingBee pasa con parametros premium/stealth.
- Decision: Forzar ScrapingBee con waits largos y pausas entre propiedades.
- Acciones: Ajuste parametros ScrapingBee, modo lento, registros de completitud.
- Resultado: Extraccion exitosa en varias propiedades con fotos y Word generados.

## 2026-06-16
### SCRAPE-001: Robustecer ScrapingBee
- Agregado `_cargar_cookies_str()` helper para pasar cookies guardadas a ScrapingBee
- Agregados parametros `wait_for` (selector CSS), `device='desktop'` y `cookies` a la llamada ScrapingBee
- Agregadas vars al `.env`: `SCRAPINGBEE_PREMIUM`, `SCRAPINGBEE_STEALTH`, `SCRAPINGBEE_WAIT=15000`
- Eliminado bloque duplicado de ScrapingBee (segundo intento con mismos params, codigo muerto)

### SCRAPE-002: Arreglar parseo OpenAI
- `obtener_sugerencia_llm()` ahora maneja multiples formatos de respuesta del SDK (output_text, output list, fallback str)
- Mejor manejo de errores

### SCRAPE-003: Documentacion
- Actualizado AGENT_LOG.md con cambios
- Actualizado tickets.json

### OpenAI: Cambiado a chat.completions
- SDK instalado no soporta `responses.create()`, cambiado a `chat.completions.create()` con modelo gpt-4o-mini

### Imagenes HD
- Agregada funcion `_url_a_hd()`: convierte URL comun a URL de alta resolucion (/resize/ + ID en pares)
- Agregada funcion `_intentar_hd_adicionales()`: prueba numeros secuenciales para obtener mas fotos en HD
- Modificado `descargar_imagenes()`: intenta HD primero, fallback a la URL original
- Nota guardada en knowledge base con el patron descubierto

## 2026-06-17
### ADMIN-002: Panel Admin editable completo
- Se agregaron campos editables en Admin.tsx: tipo, ambientes, dormitorios, baños, antigüedad, orientación, luminoso, metros totales, metros cubiertos
- Se agregó `bedrooms`, `bathrooms`, `luminoso` al Property type y a update_web.py
- Se corrigió la ficha técnica (PropertyDetails.tsx) que mostraba rooms como dormitorios
- Se agregó dormitorios al resumen (Description.tsx)
- **Bug fix**: admin guardaba `tipo` solo en `datos_raw.txt`, pero `update_web.py` lee `tipo.txt` como priority. Ahora al guardar tipo via admin también escribe `tipo.txt`
- **Bug fix**: campos nuevos (luminoso) no existían en datos_raw.txt y el regex `replace` fallaba. Ahora usa `updateField()` que crea la línea si no existe

### ADMIN-003: Progreso de scraping en tiempo real
- Nuevo endpoint `GET /api/scrape-status/:jobId` para polling
- `/api/property/add` ya no responde "URL registrada, abrí la terminal". Ahora ejecuta el scraper via `spawn()`, captura stdout con `STAGE:` markers y auto-ejecuta `update_web.py` al finalizar
- Modal de progreso en Admin.tsx con spinner, logs en vivo, y recarga automática al completar

### SEO-001: Preparación para SEO
- Documentadas técnicas: JSON-LD structured data, Open Graph, meta dinámicos, sitemap.xml (pendiente de implementar)

### REDAC-001: Pipeline de redacción profesional y audios
- **rewriter_descripciones.py**: Mejora completa del prompt de reescritura con OpenAI.
  - Nueva función `normalize_units()`: corrige automáticamente mts2→m², U$S→USD, etc.
  - Nueva función `parse_descripcion_file()`: separa datos estructurados de la descripción para enviar solo el texto relevante al LLM.
  - Nueva función `reconstruct_descripcion_file()`: reensambla el archivo preservando datos estructurados + eliminando AUTO_GENERATED.
  - Nueva función `infer_missing_fields()`: usa LLM para inferir campos faltantes (dormitorios, mascotas, apto_credito, piso, etc.) desde la descripción y los escribe en `datos_raw.txt`.
  - Prompt mejorado: ahora solo recibe la sección "Características" (no los datos estructurados), produce 2-3 párrafos sin bullet points, con CTA variado.
- **rewriter_audios.py**: mejor integración con `parse_descripcion_file()` para enviar solo descripción al LLM de narración.
- **Batch scripts**: `rewrite_all.bat` y `tts_all.bat` para ejecución rápida.
- **Bugfix**: `update_web.py` filtraba `__pycache__` como propiedad.
- **Tests**: 18 tests unitarios para normalize_units, parse/reconstruct, inferencia.
- Resultado: 17/19 propiedades reescritas profesionalmente en lote.

### Deploy Hostinger (preparacion)
- server.js: BASE_DIR dinámico (path.resolve) + sirve dist/ si existe + SPA catch-all
- package.json: agregado script "start": "node server.js"
- npm run build OK
- Verificado: server.js sirve estático (200) y API (200) en modo producción
- PROYECTO_WEB_INMOBILIARIA.md: sección 6 con instrucciones deploy

### Documentacion
- AGENT_LOG.md: actualizado con REDAC-001
- tickets.json: REDAC-001 marcado como completado
- PROYECTO_WEB_INMOBILIARIA.md: agregada seccion 5 con pipeline de redaccion
- SPECIFICACION_AGENTE_INMOBILIARIO.md: agregada subseccion pipeline redaccion profesional
- Bugfix: update_web.py filtra __pycache__

## 2026-06-18
### DEPLOY-001: Deploy Hostinger + Fix acentos en imagenes
- **Problema**: Hostinger devolvia 422 en URLs con acentos en nombres de carpeta
- **Fix**: Renombradas 4 propiedades acentuadas a ASCII:
  - `Aristóbulo_del_Valle_300` → `Aristobulo_del_Valle_300`
  - `San_José_de_Calasanz_500` → `San_Jose_de_Calasanz_500`
  - `Junín_1100` → `Junin_1100`
  - `Francisco_Acuña_de_Figueroa_800` → `Francisco_Acuna_de_Figueroa_800`
- **properties.json**: actualizados id, images paths, map paths, titles y descriptions
- **Vite rebuild** con paths sin acentos
- **ZIP**: `site_express.zip` (147 MB) con proyecto completo
- **Deploy**: subido via SFTP a Hostinger (89.117.7.159:65002), extraido, Passenger restart
- **Verificado**: imagenes responden 200 OK en https://limegreen-reindeer-489453.hostingersite.com/

## Comandos ejecutados
