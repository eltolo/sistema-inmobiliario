# Quintana Propiedades — Guía de Deploy en Hostinger

## 1. Requisitos del hosting

- **Plan:** Hostinger con soporte Node.js (hoster compartido Node.js o VPS)
- **Node.js:** v18+ (el proyecto usa ESM `"type": "module"`)
- **Storage:** ~500 MB para el proyecto completo

---

## 2. Preparar el proyecto para producción

### 2.1 Modificar server.js

El `server.js` original solo maneja admin. Necesitás uno que sirva el frontend buildado en producción.

Reemplazá `fichas/web-propiedades/server.js` con esto:

```js
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const BASE_DIR = path.resolve(__dirname, '..');

app.use(cors());
app.use(express.json());

// Servir archivos estáticos de propiedades (imágenes, mapas, audios)
app.use('/properties', express.static(path.join(BASE_DIR, 'web-propiedades', 'public', 'properties')));

// API endpoints (admin)
app.get('/api/config', (req, res) => {
  const configPath = path.join(BASE_DIR, 'config.json');
  try {
    res.json(JSON.parse(fs.readFileSync(configPath, 'utf8')));
  } catch {
    res.status(500).json({ error: 'No se pudo leer config.json' });
  }
});

app.post('/api/config', (req, res) => {
  try {
    fs.writeFileSync(path.join(BASE_DIR, 'config.json'), JSON.stringify(req.body, null, 2), 'utf8');
    res.json({ message: 'Configuración guardada' });
  } catch {
    res.status(500).json({ error: 'No se pudo guardar' });
  }
});

app.post('/api/status', (req, res) => {
  const { id, status } = req.body;
  if (!id || !status) return res.status(400).json({ error: 'Faltan datos' });
  try {
    fs.writeFileSync(path.join(BASE_DIR, id, 'status.txt'), status, 'utf8');
    res.json({ message: `Estado de ${id} actualizado a ${status}` });
  } catch {
    res.status(500).json({ error: 'No se pudo actualizar estado' });
  }
});

const { exec } = await import('child_process');
app.post('/api/sync', (req, res) => {
  const scriptPath = path.join(BASE_DIR, 'update_web.py');
  exec(`python3 "${scriptPath}"`, (error, stdout, stderr) => {
    if (error) return res.status(500).json({ error: stderr });
    res.json({ message: 'Sincronización completada', output: stdout });
  });
});

// Servir el frontend buildado
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor corriendo en http://0.0.0.0:${PORT}`);
});
```

### 2.2 Hacer el build

```bash
cd fichas/web-propiedades
npm install
npm run build
```

Esto genera la carpeta `fichas/web-propiedades/dist/` con el frontend listo.

---

## 3. Subir a Hostinger

### 3.1 Archivos necesarios (solo estos)

```
📂 web-propiedades/
├── dist/                  # ✅ Build de producción
├── node_modules/          # ✅ Dependencias (npm install alla)
├── public/
│   └── properties/        # ✅ Fotos, audios, mapas
├── package.json           # ✅
├── server.js              # ✅ Modificado para prod
📂 (carpetas propiedades)  # ✅ al_1100/, Arenales_2000/, etc.
📄 config.json             # ✅ Config de la inmobiliaria
📄 update_web.py           # ✅ Script de sincronización
```

Excluí (no subas): `src/`, `node_modules/` (corré `npm install` en el hosting), `.git/`, `tsconfig.json`, `vite.config.ts`, etc.

### 3.2 En Hostinger (Panel hPanel)

1. **Node.js selector:** Andá a **Avanzado → Node.js → Seleccionar**
2. **Versión:** Node.js 18 o 20
3. **Directorio raíz:** `/fichas/web-propiedades`
4. **Entry point:** `server.js`
5. **Variables de entorno (si necesitás):** No hace falta para el frontend solo

### 3.3 Instalar dependencias

Por SSH o desde el panel:
```bash
cd fichas/web-propiedades
npm install --production
```

### 3.4 Iniciar app

Desde el panel de Hostinger Node.js, dale a **Iniciar / Reiniciar**.

La web queda accesible en `https://tudominio.com` (o `https://tudominio.com:3001` si usás puerto).

---

## 4. Mantenimiento

### Agregar una propiedad nueva
```bash
# 1. Agregar URL a propiedades_link.txt y ejecutar agente.py (local)
# 2. Subir la carpeta nueva via FTP a fichas/
# 3. Ejecutar sync via SSH:
cd fichas && python3 update_web.py
# 4. O desde el panel admin: http://tudominio.com/admin → botón Sync
```

### Actualizar el frontend (si modificás componentes)
```bash
cd fichas/web-propiedades
npm run build
# Subir la carpeta dist/ actualizada
```

---

## 5. Alternativa: git deploy

Si preferís, conectá el hosting a un repo de GitHub:
1. Creá un repo (ej: `quintana-propiedades-web`)
2. Subí solo la carpeta `fichas/web-propiedades/`
3. En Hostinger: **Avanzado → Git Deploy** → conectá el repo
4. Configurá el build command: `npm install && npm run build`
5. Entry point: `server.js`

---

## 6. Archivos sensibles que NO se suben

- `.env` (API keys de OpenAI, ScrapingBee)
- `agente.py` (corre local, no en el hosting)
- `node_modules/` (mejor correr `npm install` en el hosting)

---

*Documento generado el 2026-06-17 para Quintana Propiedades.*
