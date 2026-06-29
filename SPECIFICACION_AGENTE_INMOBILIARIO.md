# Especificación: Agente Automatizado de Fichas Inmobiliarias

## Objetivo
Automatizar la creación de fichas inmobiliarias en Word a partir de propiedades publicadas en Zonaprop.

## Flujo de Trabajo

### 1. Lectura de URL y Monitoreo
- Leer archivo `propiedades_link.txt` que contiene lista de URLs (una por línea)
- Mantener registro de URLs ya procesadas en archivo `procesados.txt`
- Al iniciar: procesar solo URLs nuevas (no en procesados.txt)
- Modo continuo: verificar cada N segundos si hay nuevas URLs
- Cuando aparece un nuevo link: procesarlo inmediatamente
- Después de procesar: agregar URL a `procesados.txt`

**Archivos de control:**
- `propiedades_link.txt` - URLs nuevas a procesar
- `procesados.txt` - URLs ya procesadas (una por línea)

### 2. Extracción de Imágenes
- Buscar todas las etiquetas `<img>` o elementos con clase de galería de fotos
- Las URLs de imágenes siguen el patrón: `https://imgar.zonapropcdn.com/avisos/...`
- Descargar cada imagen y guardarla en `./fichas/[DIRECCION]/Imagenes/`
- Nombrar como `foto_1.jpg`, `foto_2.jpg`, etc.
- Si hay más de 9 fotos, numerar con dos dígitos: `foto_01.jpg`, `foto_02.jpg`, etc.

### 2. Extracción de Datos de Zonaprop
Para cada propiedad, extraer:

| Campo | Ubicación en Zonaprop | Ejemplo |
|-------|----------------------|---------|
| Dirección | Título de propiedad + dirección | Larrea 900 |
| Barrio | En dirección | Recoleta |
| Tipo propiedad | "Departamento", "Casa", etc. | Departamento |
| Operación | "alquiler" o "venta" | alquiler |
| Precio | Precio principal | $ 650.000 |
| Expensas | Expensas | $ 180.000 |
| Piso | Información de piso | 2° |
| Ambientes | Cantidad de ambientes | 2 |
| Metros totales | m² totales | 42 m² |
| Metros cubiertos | m² cubiertos | 38 m² |
| Ubicación | Frente/Contrafrente | Frente |
| Orientación | Orientación cardinal | Oeste |
| Antigüedad | Años del edificio | 45 años |
| Dormitorios | Cantidad dormitorios | 1 |
| Baños | Cantidad baños | 1 |
| Apto crédito | Si/No | - |
| Niños permitidos | Si/No | - |
| Mascotas permitidas | Si/No | no |
| Características | Descripción detallada | (texto completo) |

### 3. Estructura de Carpetas
Para cada propiedad:
```
./fichas/
└── [DIRECCION_SIN_ESPACIOS]/
    ├── datos_raw.txt          # Texto extraído completo de la página
    ├── descripcion.txt        # Mismo texto que va en el Word
    ├── Imagenes/
    │   ├── foto_1.jpg
    │   ├── foto_2.jpg
    │   └── ...
    └── [DIRECCION].docx       # Ficha Word generada
```

Ejemplo: `Larrea_910/`
```
Larrea_910/
├── datos_raw.txt
├── descripcion.txt
├── Imagenes/
│   ├── foto_1.jpg
│   ├── foto_2.jpg
│   ├── foto_3.jpg
│   └── foto_4.jpg
└── Larrea 910.docx
```

### 4. Generación del Documento Word

**Formato del Word:**

```
[DIRECCION] ([BARRIO])
[TIPO] DE [AMBIENTES] AMBIENTES- [CARACTERISTICA_PRINCIPAL]

[OPERACION]: $[PRECIO]
Expensas: $[EXPENSAS]
Piso: 	[PISO]
Ambientes: [AMBIENTES]
Metros totales: [MTOTALES] mts2
Metros cubiertos: [M CUBIERTOS] mts2
Ubicación: [UBICACION]
Orientación: [ORIENTACION]
Antigüedad: [ANTIGUEDAD]
Operación: [OPERACION]
Niños: [SI/NO]
Mascotas: [SI/NO]
Apto crédito: [SI/NO]

Características:
[DESCRIPCION_COMPLETA_CON_GUIONES]
```

### 5. Manejo de Datos Faltantes
- Si un campo está vacío o no disponible en la página: **mostrar en ROJO** en el documento Word
- Si el campo tiene valor: mostrar en negro

## Ejemplos de Referencia

### Input (Zonaprop - Larrea 910):
- URL: https://www.zonaprop.com.ar/propiedades/clasificado/alclapin-larrea-y-paraguay-2-ambientes-frente-con-balcon-58701754.html
- Dirección extraída: Larrea 900
- Barrio: Recoleta
- Tipo: Departamento
- Operación: alquiler
- Precio: 650.000
- Expensas: 180.000
- Ambientes: 2
- Metros totales: 42
- Metros cubiertos: 38
- Ubicación: Frente
- Orientación: Oeste
- Antigüedad: 45 años

### Output esperado (Larrea 910.docx):
```
Larrea 910 (Recoleta)
DEPARTAMENTO DE 2 AMBIENTES- AL FRENTE - CON BALCÓN- 42 mts2 TOTALES -

Alquiler: $ 650.000
Expensas: $ 180.000
Piso: 	2°
Ambientes: 2
Metros totales: 42 mts2
Metros cubiertos: 38 mts2
Ubicación: Frente
Orientación: Oeste
Antigüedad: 45 años
Operación: Alquiler
Niños: no
Mascotas: no

Características:
- [DESCRIPCION_COMPLETA]
```

## Requisitos Técnicos
- Python 3.x
- Libraries: `requests`, `beautifulsoup4`, `python-docx`, `Pillow` (para imágenes), `selenium`, `webdriver-manager`, `json5`, `openai` (opcional)
- El script debe manejar errores de conexión gracefully
- Logging de progreso por cada propiedad procesada
- Crear carpeta `fichas/` si no existe
- Guardar imágenes en formato JPEG (convertir si es necesario)
- Guardar una copia del HTML descargado en `page.html` para análisis offline
- Usar `gpt-5.4-mini` vía el endpoint `v1/responses` para las sugerencias y registrar el porcentaje de campos completados en `metricas_completitud.log`

### ScrapingBee (recomendado)
- Variables en `.env`: `SCRAPINGBEE_API_KEY`, `SCRAPINGBEE_ONLY=true`, `SCRAPINGBEE_PREMIUM=true`, `SCRAPINGBEE_STEALTH=true`
- Parametros ajustables: `SCRAPINGBEE_WAIT`, `SCRAPINGBEE_TIMEOUT` (por defecto 12000ms/120000ms)
- Si `SCRAPINGBEE_ONLY=true`, el agente no abre Selenium y evita prompts interactivos.

### Playwright (fallback sin Chrome)
- Variable en `.env`: `PLAYWRIGHT_FALLBACK=true`
- Usa Firefox headless para simular un cliente real cuando ScrapingBee falla.

### Diagnóstico Autónomo
- Después de generar la ficha, ejecutar un chequeo automático que detecte campos sin valor (precio, expensas, metros, ubicación, orientación, antigüedad y descripción completa) y genere `diagnostico.txt` dentro de la carpeta de la propiedad.
- Si no hay issues, `diagnostico.txt` dice "Diagnóstico: OK"; si falta información, se listan los campos faltantes.
- En caso de registros incompletos, el agente puede invocar la API de OpenAI (`OPENAI_API_KEY` debe estar en el entorno) para recibir sugerencias sobre cómo mejorar la extracción basada en un fragmento del HTML descargado.
- El LLM se usa solamente cuando hay fallos y el HTML está disponible; la ejecución sigue funcionando sin clave.
- Fallback manual: si la descripción completa no se pudo extraer, `descripcion.txt` se crea con encabezado `AUTO_GENERATED`. El usuario debe completar manualmente y eliminar esa línea para que el agente use esa descripción en la siguiente ejecución.
- En fallback manual el agente infiere `piso` y `metros` desde el texto de `descripcion.txt`. Opcionalmente puede inferir `barrio` con geocoding si `GEOCODE_ENABLED=true`.
- El agente puede inferir `ambientes`, `baños`, `orientación`, `ubicación` y `mascotas` desde la descripción manual si aparecen expresiones como "1 amb", "1 baño", "frente", "orientacion: O" o "no se aceptan mascotas".

### Modo de Ejecución

**Modo único (una ejecución):**
```
python agente.py
```
Procesa todos los links nuevos de propiedades_link.txt

**Modo continuo (monitoreo):**
```
python agente.py --watch
```
Verifica cada 1 hora si hay nuevos links (intervalo por defecto: 3600 segundos)

**Comportamiento:**
1. Lee `propiedades_link.txt`
2. Compara con `procesados.txt`
3. Procesa solo URLs nuevas
4. Al terminar, agrega URLs procesadas a `procesados.txt`
5. En modo watch, vuelve al paso 1

### Pipeline de Redacción Profesional (REDAC-001)
- **`fichas/rewriter_descripciones.py`**: Reescritura de descripciones con OpenAI.
  - `normalize_units()`: corrige mts2→m², U$S→USD automáticamente.
  - `parse_descripcion_file()`: separa datos estructurados de la descripción.
  - `rewrite_text()`: envía solo la sección "Características" al LLM.
  - `infer_missing_fields()`: extrae campos faltantes de la descripción y los guarda en `datos_raw.txt`.
  - `reconstruct_descripcion_file()`: reensambla el archivo sin AUTO_GENERATED.
- **`fichas/rewriter_audios.py`**: Generación de narraciones TTS con ElevenLabs.
  - Prompt: guión conversacional de max 120 palabras con CTA final.
  - Voz: Rachel (multilingual v2), estabilidad 0.4, similaridad 0.6.
  - Output: `tts_segments/narracion_actualizada.wav`.
- **Integración**: Llamado automático desde `agente.py` en `procesar_propiedad()`.
- **Batch**: `rewrite_all.bat`, `tts_all.bat`, o `python agente.py --rewrite --tts`.
- **Tests**: `tests/test_rewriter.py` (18 tests unitarios).

## Notas
- La dirección del barrio puede inferirse de la dirección (última parte después de la coma)
- Limpiar caracteres especiales del texto (tildes，保持)
- El formato debe coincidir exactamente con los ejemplos en ./Docs/
