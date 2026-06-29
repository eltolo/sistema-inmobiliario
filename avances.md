# Avances del Proyecto

## 2025-06-29 - Ticket: Landing orientada a captar propietarios

### Resumen
- Se creó el ticket TICKET-001 en `tickets.json` para rediseñar la Home y orientarla a captar propietarios.
- La prioridad es crítica porque el negocio inmobiliario depende primero de conseguir propiedades para comercializar.

### Alcance de TICKET-001
- Rediseñar `Home.tsx` con Hero principal claro: "Vendé o alquilá tu propiedad en CABA con atención personalizada y tecnología".
- Botones principales: Solicitar Tasación y WhatsApp.
- Sección de 4 beneficios: Tasación Profesional, Fotografías de Alta Calidad, Máxima Difusión, Acompañamiento Personalizado.
- Sección "¿Por qué elegirnos?" enfocada en confianza.
- Sección "Claudia" con foto profesional y botón de contacto.
- CTA final con formulario de tasación sin cargo.
- Requisitos técnicos: responsive, SEO, Open Graph, Schema.org LocalBusiness, Lighthouse Performance > 90 y SEO > 95.

### Estado
- Pendiente de implementación.

## 2025-06-26 - Gestión de fotos de propiedades en panel Admin (dev + producción)

### Resumen
- Se agregó al panel de administración un modal para gestionar las fotos de cada propiedad.
- Funcionalidades: seleccionar foto de portada, eliminar fotos y subir nuevas fotos.
- Se probó primero en local (dev) y, tras aprobación, se deployó a producción en Hostinger.
- Se verificó en producción que el admin puede cargar fotos, cambiar portada, eliminar y subir archivos.

### Detalles técnicos
- Backend: `fichas/web-propiedades/server.js` expone los endpoints:
  - `GET /api/property/:id/photos` — lista las fotos de la propiedad con flag `isCover`.
  - `POST /api/property/:id/photos/cover` — escribe `cover.txt` en la carpeta de la propiedad.
  - `DELETE /api/property/:id/photos/:filename` — elimina una foto.
  - `POST /api/property/:id/photos` — sube una o varias fotos usando `multer`.
  - `GET /api/property/:id/photos/:filename/file` — sirve la imagen original para el admin.
- Frontend: `Admin.tsx` con botón "Gestionar fotos" por propiedad, modal con grid de fotos, indicador de portada, botones de acción y input de upload.
- `update_web.py` respeta `cover.txt` para colocar la foto de portada en primer lugar en `properties.json`.
- `zip_site.py` ahora incluye la carpeta `fichas/` en el ZIP de deploy, para que el admin de producción acceda a las imágenes origen.
- `server.js` detecta automáticamente si `fichas/` está en `__dirname/../fichas` (dev) o `__dirname/fichas` (producción).

### Deploy y verificación
- Tests en local: `http://localhost:5173/admin` — se cambió portada, se subió una imagen de prueba y se eliminó. Se corrió `update_web.py` y se verificó que la portada se refleja en `properties.json`.
- Build en `fichas/web-propiedades`: exitoso, sitemap con 20 URLs.
- ZIP: `site_express.zip` (292 MB) con `web-propiedades` y `fichas/`.
- Deploy: `scripts/deploy_to_hostinger.py` creó backup, subió ZIP, descomprimió, ejecutó `npm install --omit=dev` y reinició Passenger.
- Verificación en producción (`https://quintana.cabapropiedades.ar/admin`):
  - Login OK.
  - Modal de fotos carga 23 imágenes de `Arenales_2000`.
  - Cambio de portada: se seleccionó `02_ingreso_hall_01.jpg`, se verificó el borde ámbar y `cover.txt`, luego se restableció a `01_frente_01.jpg`.
  - Upload: se subió `test_upload.jpg` y apareció en el grid; se eliminó y se verificó en el servidor que no queda rastro.
  - Servidor: `cover.txt` contiene `01_frente_01.jpg`.

### Archivos creados o modificados
- `fichas/web-propiedades/server.js` (modificado)
- `fichas/web-propiedades/src/pages/Admin.tsx` (modificado)
- `fichas/web-propiedades/package.json` (modificado: agregado `multer` y `@types/multer`)
- `scripts/zip_site.py` (modificado: incluye `fichas/`)
- `tickets.json` (modificado: agregado ticket ADMIN-004)
- `avances.md` (modificado)

### Posibles errores y cómo validarlos
- Si el modal de fotos no abre en producción: verificar que `fichas/` esté en el servidor (`/home/u896915843/domains/cabapropiedades.ar/nodejs/fichas`) y que `server.js` la detecte en `BASE_DIR`.
- Si `/api/property/:id/photos` da 404: revisar que el endpoint esté antes del catch-all del SPA y que `BASE_DIR` apunte a la carpeta correcta.
- Si se cambia la portada en el admin pero no cambia en el sitio público: el admin escribe `cover.txt` en la fuente; para reflejarlo en la web se debe ejecutar `update_web.py` y hacer build + deploy nuevamente.
- Si la subida falla: revisar permisos de escritura en `fichas/<propiedad>/Imagenes/` y que `multer` esté instalado (`npm install`).

## 2025-06-25 - Deploy a Hostinger y SEO básico

### Resumen
- Se completó el deploy del sitio web en el dominio `quintana.cabapropiedades.ar` apuntando al VPS de Hostinger (`89.117.7.159`).
- Se configuró el registro DNS A para el subdominio `quintana` desde el panel de Hostinger.
- Se implementaron los entregables SEO básicos: meta tags, Open Graph, Twitter Cards, JSON-LD, `robots.txt` y `sitemap.xml`.
- Se regeneró el ZIP de deploy con el build actualizado y se re-desplegó en Hostinger.

### Detalles técnicos

#### DNS y dominio
- Dominio: `cabapropiedades.ar` gestionado en Hostinger.
- Registro DNS: `quintana` → tipo `A` → valor `89.117.7.159` (TTL 300).
- Verificación: `quintana.cabapropiedades.ar` resuelve a `89.117.7.159` y responde HTTP 200 desde el backend Node.js.

#### Configuración del backend
- Se subió `fichas/config.json` al servidor porque `/api/config` fallaba sin él.
- Ruta en el servidor: `/home/u896915843/domains/cabapropiedades.ar/config.json`.
- Se copió el `.htaccess` de `public_html` a `public_html/quintana` para que el subdominio ejecute la app Node.js vía Passenger.

#### SEO implementado
- `fichas/web-propiedades/index.html`: agregados meta description, canonical, robots, Open Graph, Twitter Cards y JSON-LD (schema.org/RealEstateAgent).
- `fichas/web-propiedades/public/robots.txt`: permite todo excepto `/admin`, referencia el sitemap.
- `fichas/web-propiedades/scripts/generate-sitemap.js`: genera `sitemap.xml` en `dist/` a partir de `properties.json` durante el build.
- `fichas/web-propiedades/package.json`: script `build` actualizado para ejecutar el generador de sitemap.
- El sitemap incluye `/`, `/nosotros` y cada `/property/{id}` (20 URLs en total).

#### Deploy
- Se actualizó `site_express.zip` con el nuevo build (incluye `dist/sitemap.xml`, `dist/robots.txt` e `index.html` con SEO).
- Se ejecutó `scripts/deploy_to_hostinger.py` para subir, instalar dependencias y reiniciar Passenger.

### Verificación
- `https://quintana.cabapropiedades.ar/` → OK (carga la app).
- `https://quintana.cabapropiedades.ar/api/config` → OK.
- `https://quintana.cabapropiedades.ar/sitemap.xml` → OK, 20 URLs.
- `https://quintana.cabapropiedades.ar/robots.txt` → OK.
- `curl -s https://quintana.cabapropiedades.ar/` → contiene meta tags, OG, JSON-LD.

### Archivos modificados o creados
- `fichas/web-propiedades/index.html`
- `fichas/web-propiedades/public/robots.txt` (nuevo)
- `fichas/web-propiedades/scripts/generate-sitemap.js` (nuevo)
- `fichas/web-propiedades/package.json`
- `scripts/deploy_to_hostinger.py` (usado, sin cambios)
- `avances.md` (nuevo)

### Posibles errores y cómo validarlos
- Si el sitemap no se actualiza al agregar propiedades: revisar que `npm run build` ejecute `node scripts/generate-sitemap.js` y que el ZIP incluya el nuevo `dist/`.
- Si el subdominio deja de responder: revisar el registro A en Hostinger y el `.htaccess` de `public_html/quintana`.
- Si `/api/config` falla: verificar que `config.json` exista en `/home/u896915843/domains/cabapropiedades.ar/config.json`.

## 2025-06-25 - Generador de contenido para Instagram

### Resumen
- Se agregó un generador automático de tarjetas visuales y captions de Instagram para cada propiedad.
- La generación se ejecuta automáticamente durante `update_web.py` (sincronización de propiedades).
- Se agregó un botón en el panel de admin para descargar la imagen, copiar el caption y publicar directamente en Instagram.
- El contenido se sirve desde `public/properties/{id}/instagram/` y es accesible desde la web.

### Detalles técnicos
- Módulo: `fichas/instagram_generator.py` usando Pillow para generar imágenes 1080x1080.
- Integración: `fichas/update_web.py` genera y copia `card.jpg` y `caption.txt` a la carpeta pública.
- API: `GET /api/instagram/:id` devuelve `cardUrl` y `caption`.
- Publicación: `POST /api/publish-instagram/:id` publica la imagen vía Instagram Graph API.
- UI: `Admin.tsx` muestra un ícono de Instagram por propiedad con modal de descarga/copia/publicación.
- Configuración: `config.json` acepta `instagram_account_id` y `instagram_access_token` para Graph API.

### Verificación
- `https://quintana.cabapropiedades.ar/api/instagram/Arenales_2000` → OK.
- `https://quintana.cabapropiedades.ar/properties/Arenales_2000/instagram/card.jpg` → OK, imagen JPEG 200 OK.
- Panel admin: botón Instagram visible por propiedad (tras rebuild).
- Botón "Publicar en Instagram" visible en el modal; si faltan credenciales, devuelve mensaje informativo.

### Archivos creados o modificados
- `fichas/instagram_generator.py` (nuevo)
- `fichas/update_web.py` (modificado)
- `fichas/config.json` (modificado)
- `fichas/web-propiedades/src/types/property.ts` (modificado)
- `fichas/web-propiedades/server.js` (modificado)
- `fichas/web-propiedades/src/pages/Admin.tsx` (modificado)
- `avances.md` (modificado)
- `tickets.json` (modificado)

### Posibles errores y cómo validarlos
- Si el botón Instagram no aparece en el admin: verificar que `properties.json` tenga `instagram_card` y `instagram_caption` y que se haya hecho `npm run build` + deploy.
- Si `/api/instagram/:id` da 404: verificar que exista `public/properties/{id}/instagram/caption.txt` en el servidor.
- Si la publicación da "Faltan credenciales": completar `instagram_account_id` y `instagram_access_token` en el admin (ver ticket SOCIAL-002).
- Si la imagen no se genera: revisar que Pillow esté instalado y que la propiedad tenga fotos en `Imagenes/`.

### Próximos pasos sugeridos
- Completar el setup de Meta App y credenciales (ticket SOCIAL-001).
- Implementar meta tags dinámicos por propiedad con `react-helmet-async`.
- Mejorar el OG image con una imagen/logo dedicado de la inmobiliaria.
- Enviar el sitemap a Google Search Console.
- Considerar el ticket LEAD-001 (sistema de leads) o ADMIN-001 (carga manual de propiedades).

## 2025-06-25 - Ordenamiento de fotos por categorías

### Resumen
- Se implementó un sistema automático para ordenar las fotos de las propiedades según una secuencia predefinida usando un clasificador de imágenes con LLM.
- Se clasificaron **280 imágenes** de **18 propiedades** y se renombraron con prefijos de categoría para forzar el orden deseado.
- Se actualizó el frontend y backend para respetar el nuevo ordenamiento.
- Se generó el build, se empaquetó y se deployó en Hostinger.
- Se verificó en el sitio remoto que las fotos se muestran en el orden correcto.

### Secuencia de categorías
1. `01_frente` — Frente de la propiedad
2. `02_ingreso_hall` — Ingreso o hall de entrada
3. `03_puerta_pasillo` — Puerta de ingreso o pasillo de ingreso
4. `04_sala` — Sala principal
5. `05_balcon` — Balcón
6. `06_dormitorio` — Dormitorios
7. `07_cocina` — Cocina
8. `08_bano` — Baños
9. `99_otros` — Otros / imágenes no clasificadas

### Detalles técnicos
- Clasificador: `fichas/classify_images.py` usando el modelo `gpt-4o-mini` de OpenAI.
- El script lee las imágenes de `fichas/<propiedad>/Imagenes/`, las clasifica y las renombra con el prefijo correspondiente.
- Se agregó el flag `--dry-run` para probar sin renombrar archivos.
- Se agregó el flag `--repair` para reconstruir `classification.json` desde los nombres de archivo actuales sin consumir API.
- `fichas/update_web.py` ahora ordena las imágenes priorizando los nombres con prefijo de categoría, luego alfabético, y dejando las que contienen `optimized` al final.
- `tests/dedup_fotos.py` fue actualizado para preservar los prefijos de categoría si ya existen y renumerar dentro de cada categoría en lugar de reiniciar a `foto_XX.jpg`.
- Costo estimado de la clasificación: **~$1.40 USD**.

### Deploy y verificación
- Se ejecutó `update_web.py` para regenerar `src/data/properties.json` con el nuevo orden.
- Se ejecutó `npm run build` en `fichas/web-propiedades` sin errores (sitemap generado con 20 URLs).
- Se ejecutó `scripts/zip_site.py` generando `site_express.zip` (~200 MB).
- Se ejecutó `scripts/deploy_to_hostinger.py`: backup, upload, descompresión, `npm install --omit=dev` y reinicio de Passenger.
- Verificación remota: `https://quintana.cabapropiedades.ar/property/San_Jose_de_Calasanz_500` muestra las miniaturas en orden de categoría: frente, ingreso, pasillo, sala, dormitorio, cocina, baño, otros.

### Archivos creados o modificados
- `fichas/classify_images.py` (nuevo)
- `fichas/update_web.py` (modificado)
- `tests/dedup_fotos.py` (modificado)
- `fichas/.env` (actualizado con nueva API key de OpenAI)
- `fichas/web-propiedades/src/data/properties.json` (regenerado)
- `avances.md` (modificado)
- `tickets.json` (modificado)

### Posibles errores y cómo validarlos
- Si una foto aparece desordenada: revisar el nombre del archivo en `fichas/<propiedad>/Imagenes/` y corregir el prefijo de categoría; luego correr `update_web.py` y deployar.
- Si `classification.json` queda desactualizado: ejecutar `python fichas/classify_images.py --repair` para reconstruirlo desde los nombres de archivo.
- Si la clasificación falla por API: verificar que `OPENAI_API_KEY` en `fichas/.env` tenga saldo y permisos para `gpt-4o-mini`.
- Si el deploy no refleja el orden: verificar que `npm run build` se ejecutó después de `update_web.py` y que el ZIP se subió correctamente.
