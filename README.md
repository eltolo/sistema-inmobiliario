# Sistema Inmobiliario - Quintana Servicios Inmobiliarios

Sistema completo para gestión, publicación y promoción de propiedades inmobiliarias.

## Componentes principales

- **Agente de scraping** (`agente.py`): extrae datos de Zonaprop y genera fichas de propiedades.
- **Frontend web** (`fichas/web-propiedades/`): sitio público en React + Vite + TailwindCSS.
- **Backend API** (`fichas/web-propiedades/server.js`): Express.js con endpoints para admin, scraping, sincronización, publicación en Instagram y gestión de fotos.
- **Clasificación de fotos** (`fichas/classify_images.py`): etiqueta imágenes con categorías para ordenarlas automáticamente.
- **Generador de Instagram** (`fichas/instagram_generator.py`): crea tarjeta 1080x1080 y caption para cada propiedad.
- **Scripts de deploy** (`scripts/`): automatización de ZIP y despliegue en Hostinger.

## Estructura

```
/
├── agente.py              # Agente de scraping
├── fichas/                # Datos fuente de propiedades + web
│   ├── web-propiedades/   # Aplicación web (React + Node)
│   ├── classify_images.py
│   ├── instagram_generator.py
│   ├── update_web.py
│   └── config.json        # Configuración de la agencia (NO secretos)
├── scripts/               # Deploy y utilidades
├── tests/                 # Scripts de prueba y datos de ejemplo
├── requirements.txt       # Dependencias Python
├── avances.md             # Bitácora de avances
├── tickets.json           # Tickets del proyecto
├── .env.example           # Plantilla de variables de entorno
└── .gitignore             # Exclusiones de git
```

## Requisitos

- Python 3.11+
- Node.js 20+
- Cuentas/claves externas:
  - OpenAI API (clasificación de fotos y reescritura de textos)
  - ScrapingBee (scraping de Zonaprop)
  - Hostinger (deploy)
  - Meta / Instagram Graph API (publicación automática en Instagram, opcional)

## Instalación

### 1. Entorno Python

```powershell
python -m venv .venv
.\.venv\scripts\activate.ps1
pip install -r requirements.txt
```

### 2. Entorno Node.js

```powershell
cd fichas\web-propiedades
npm install
```

### 3. Variables de entorno

Copiar `.env.example` a `.env` y completar las claves reales.

```powershell
copy .env.example .env
```

No subir `.env` a git; ya está protegido por `.gitignore`.

## Uso común

### Scrapear una propiedad

```powershell
.\.venv\scripts\activate.ps1
python agente.py
```

### Sincronizar propiedades a la web

```powershell
.\.venv\scripts\activate.ps1
cd fichas
python update_web.py
```

### Ejecutar el sitio en desarrollo

```powershell
cd fichas\web-propiedades
npm run dev
```

El sitio estará en `http://localhost:5173` y el admin en `http://localhost:5173/admin`.

### Acceder al panel de admin

- URL: `/admin`
- Contraseña: `admin123` (configurable en `server.js`)

### Build y deploy a Hostinger

```powershell
cd fichas\web-propiedades
npm run build

cd ..\..
python scripts\zip_site.py
python scripts\deploy_to_hostinger.py
```

## Características implementadas

- Scraping de Zonaprop con seguimiento en tiempo real desde el admin.
- Panel de administración con edición de propiedades y gestión de fotos.
- Selección manual de foto de portada (`cover.txt`).
- Subida y eliminación de fotos desde el admin.
- Clasificación automática de fotos por categorías.
- Generación de tarjeta y caption para Instagram.
- Botón de publicación en Instagram (requiere credenciales de Graph API).
- SEO básico: meta tags, Open Graph, JSON-LD, sitemap.xml y robots.txt.
- Página de contacto con tarjetas de WhatsApp.
- Mapa interactivo por propiedad.

## Notas de seguridad

- `.env` y archivos de cookies **nunca** deben subirse a git.
- `fichas/config.json` contiene datos de la agencia (teléfonos, email) pero no claves secretas.
- El repo público no incluye credenciales ni el ZIP de deploy.

## Dominios

- Producción: https://quintana.cabapropiedades.ar

## Licencia

Proyecto privado. Uso exclusivo de Quintana Servicios Inmobiliarios.
