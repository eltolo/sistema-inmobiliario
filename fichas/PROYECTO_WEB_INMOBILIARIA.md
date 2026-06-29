# Quintana Propiedades - Sistema de Gestión Inmobiliaria

Este proyecto es un ecosistema automatizado para la extracción, procesamiento y visualización de propiedades inmobiliarias de Zonaprop.

## 1. Arquitectura del Sistema

El sistema se divide en tres capas principales:

### A. Agente de Extracción (Scraping)
- **Script principal:** `agente.py` (ubicado en la raíz del sistema).
- **Función:** Lee URLs desde `propiedades_link.txt`, extrae datos e imágenes usando Selenium/ScrapingBee y genera una estructura de carpetas por propiedad.
- **Salida:** Crea carpetas dentro de `/fichas/` con la dirección de la propiedad.

### B. Sincronizador de Datos
- **Script:** `update_web.py` (ubicado en `/fichas/`).
- **Función:** Actúa como puente entre los datos crudos y la web.
  - Escanea `/fichas/` buscando nuevas carpetas.
  - Parsea `datos_raw.txt` y `descripcion.txt`.
  - Sincroniza imágenes y audios hacia la carpeta pública de la web.
  - Genera `properties.json` en la web para alimentar el frontend.

### C. Portal Web (Frontend)
- **Tecnología:** React 18 + Vite + Tailwind CSS + Framer Motion.
- **Ubicación:** `/fichas/web-propiedades/`.
- **Características:**
  - Catálogo dinámico de propiedades.
  - Carrusel de fotos interactivo.
  - Reproductor de audio para narraciones (TTS).
  - Diseño responsive y estética premium (Quintana Propiedades).

## 2. Estructura de Datos (Carpeta /fichas/)

Cada propiedad tiene su propia carpeta con el siguiente contenido estándar:
- `Imagenes/`: Fotos originales y optimizadas.
- `datos_raw.txt`: Atributos técnicos (precio, metros, ambientes, etc.).
- `descripcion.txt`: Texto descriptivo para la web y Word.
- `page.html`: Backup del HTML original de Zonaprop.
- `[Direccion].docx`: Ficha generada para impresión/Word.
- `tts_segments/`: Archivos de audio generados para la narración.

## 3. Guía para el Mantenimiento (IA/Desarrollador)

### Agregar una Propiedad Nueva
1. Agregar URL a `propiedades_link.txt`.
2. Ejecutar `python agente.py`.
3. Ejecutar `python update_web.py` para subirla a la web.

### Modificar Datos Manualmente
Si el scraping falla o hay datos incorrectos, editar directamente el archivo `datos_raw.txt` o `descripcion.txt` dentro de la carpeta de la propiedad y volver a ejecutar `update_web.py`.

### Modificar la Estética de la Web
El frontend está basado en componentes funcionales en `web-propiedades/src/components/`. 
- **Hero.tsx:** Maneja el carrusel y la información principal.
- **Multimedia.tsx:** Gestiona el audio tour.
- **index.css:** Contiene las variables de color y estilos globales.

## 4. Comandos Útiles

```bash
# Sincronizar cambios de las carpetas a la web
cd fichas
python update_web.py

# Ejecutar la web en modo desarrollo
cd web-propiedades
npm run dev
```

## 5. Pipeline de Redacción Profesional

### Descripciones (rewriter_descripciones.py)
- **normalize_units()**: Corrige automáticamente unidades: `mts2`→`m²`, `U$S`→`USD`, etc.
- **parse_descripcion_file()**: Sepala datos estructurados (precio, ambientes, etc.) de la sección "Características".
- **rewrite_text()**: Envía solo la descripción a OpenAI gpt-4o-mini para reescribir con tono profesional + CTA.
- **infer_missing_fields()**: Usa LLM para inferir campos faltantes y los guarda en `datos_raw.txt`.
- **reconstruct_descripcion_file()**: Reensambla el archivo preservando datos y eliminando `AUTO_GENERATED`.

### Audios / TTS (rewriter_audios.py)
- Genera guión de narración corto (max 120 palabras) con OpenAI.
- Convierte a voz con ElevenLabs (voz Rachel, modelo multilingual v2).
- Guarda en `tts_segments/narracion_actualizada.wav`.

### Ejecución
```bash
# Reescribir todas las descripciones
python fichas/rewriter_descripciones.py

# Reescribir una propiedad específica
python fichas/rewriter_descripciones.py Austria_2200

# Generar audios para todas las propiedades
python fichas/rewriter_audios.py

# O via agente.py
python agente.py --rewrite        # todas
python agente.py --rewrite-prop Austria_2200
python agente.py --tts            # todas
python agente.py --tts-prop Austria_2200
```

## 6. Deploy a Hostinger Business

### Preparación
```bash
cd fichas/web-propiedades

# Build del frontend (genera dist/)
npm run build

# Probar en local modo producción:
npm start          # Express sirve dist/ en http://localhost:3001
```

### Archivos a subir a Hostinger (via FTP o Git)
```
fichas/web-propiedades/
├── dist/              ← frontend build (generado con npm run build)
├── server.js          ← backend Express
├── package.json
├── node_modules/      ← o correr npm install en Hostinger
├── fichas/            ← datos de propiedades (opcional, sino remoto)
│   ├── config.json
│   ├── update_web.py
│   ├── rewriter_descripciones.py
│   ├── rewriter_audios.py
│   ├── [propiedades]/
│   └── web-propiedades/public/properties/
```

### Configuración en Hostinger Business
1. En el panel: **Hosting → Sitios Web → Administrar → Node.js**
2. **Entry point**: `server.js` (o la ruta completa)
3. **Node version**: 18.x o 20.x
4. **Variables de entorno**: agregar `PORT=3000` (o el puerto que asigne Hostinger)
5. Asegurar que `dist/` existe (producto del build local)

### Actualizar datos
```bash
# En local (dev):
python fichas/update_web.py        # regenera properties.json
python fichas/rewriter_descripciones.py   # reescribe textos
python fichas/rewriter_audios.py          # genera audios
npm run build                              # actualiza dist/ con datos frescos
# → subir de nuevo dist/ + fichas/ a Hostinger
```

### Modo local (sin cambios)
```bash
npm run dev   # Vite + server.js en paralelo, misma experiencia que antes
```

## 7. Próximos Pasos Sugeridos
- Deploy completo con scraping + admin en vivo (no solo estático).
- Sistema de consultas (chatbot) con contexto de propiedades.
- Filtros avanzados (precio, ambientes, operación) en catálogo.
- Integración Google Maps con coordenadas extraídas.

---
*Documento actualizado el 2026-06-17 para Quintana Propiedades.*
