import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec, spawn } from 'child_process';
import crypto from 'crypto';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const PYTHON = process.platform === 'win32' ? 'python' : 'python3';
// En dev, fichas/ es el directorio padre de web-propiedades. En prod, fichas/ se despliega dentro de web-propiedades/.
const FICHAS_DIR = (() => {
  const sibling = path.resolve(__dirname, '..');
  const nested = path.resolve(__dirname, 'fichas');
  if (fs.existsSync(path.join(sibling, 'config.json'))) return sibling;
  if (fs.existsSync(path.join(nested, 'config.json'))) return nested;
  return nested;
})();
const BASE_DIR = FICHAS_DIR;
const DIST_DIR = path.join(__dirname, 'dist');
const SHOULD_SERVE_DIST = process.env.NODE_ENV === 'production' || ['1', 'true', 'yes'].includes((process.env.SERVE_DIST || '').toLowerCase());

app.use(cors());
app.use(express.json());

// In production, serve the built frontend
if (SHOULD_SERVE_DIST && fs.existsSync(DIST_DIR)) {
  console.log(`Sirviendo frontend build desde ${DIST_DIR}`);
  app.use(express.static(DIST_DIR));
}

// --- Scrape Jobs Progress Tracking ---
const scrapeJobs = new Map();

function createJob(url) {
  const jobId = crypto.randomBytes(4).toString('hex');
  const job = {
    jobId,
    url,
    status: 'starting',
    stage: 'Registrando URL...',
    logs: [],
    error: null,
    startedAt: new Date().toISOString(),
    finishedAt: null,
  };
  scrapeJobs.set(jobId, job);
  return job;
}

function updateJob(jobId, updates) {
  const job = scrapeJobs.get(jobId);
  if (job) {
    Object.assign(job, updates);
    if (updates.logs) {
      job.logs = [...(job.logs || []), ...updates.logs];
    }
  }
}

function runScrapeJob(jobId, url) {
  const linksPath = path.join(BASE_DIR, '..', 'propiedades_link.txt');
  const procesadosPath = path.join(BASE_DIR, '..', 'procesados.txt');
  const logPath = path.join(BASE_DIR, 'admin.log');

  try {
    // 1. Add to propiedades_link.txt
    updateJob(jobId, { stage: 'Agregando URL a la cola...' });
    let links = '';
    if (fs.existsSync(linksPath)) {
      links = fs.readFileSync(linksPath, 'utf8');
    }
    if (!links.includes(url)) {
      fs.appendFileSync(linksPath, url + '\n', 'utf8');
    }

    // 2. Remove from procesados.txt
    if (fs.existsSync(procesadosPath)) {
      const lines = fs.readFileSync(procesadosPath, 'utf8').split('\n').filter(l => l.trim() !== url.trim());
      fs.writeFileSync(procesadosPath, lines.join('\n'), 'utf8');
    }

    // 3. Log
    fs.appendFileSync(logPath, `[${new Date().toISOString()}] URL agregada: ${url}\n`, 'utf8');

    // 4. Run scraper via spawned Python process
    updateJob(jobId, { status: 'running', stage: 'Scrapeando datos de Zonaprop...' });

    const safeUrl = url.replace(/'/g, "\\'");
    const parentDir = path.join(BASE_DIR, '..').replace(/\\/g, '/');
    const baseDirForward = BASE_DIR.replace(/\\/g, '/');
    const logFile = path.join(BASE_DIR, 'admin.log').replace(/\\/g, '/');
    const script = `
import sys, os, json, time
sys.path.insert(0, '${parentDir}')
os.chdir('${parentDir}')
import logging
logging.basicConfig(filename='${logFile}', level=logging.INFO, format='%(asctime)s %(message)s')
from agente import procesar_propiedad, guardar_procesado
try:
    print("STAGE:scrapeando")
    logging.info('Iniciando scrape manual: ${safeUrl}')
    ok = procesar_propiedad('${safeUrl}')
    if ok:
        guardar_procesado('${safeUrl}')
        print("STAGE:descargando_imagenes")
        logging.info('Scrape completado OK')
        print("STAGE:completado")
    else:
        print("STAGE:error")
        print("MSG:El scraper devolvió False")
except Exception as e:
    print(f"STAGE:error")
    print(f"MSG:{e}")
    logging.error(f'Scrape fallo: {e}')
`;
    const tempScript = path.join(BASE_DIR, `_scrape_${jobId}.py`);
    fs.writeFileSync(tempScript, script, 'utf8');

    const proc = spawn(PYTHON, [tempScript], {
      cwd: path.join(BASE_DIR, '..'),
    });

    let stdoutBuffer = '';
    proc.stdout.on('data', (data) => {
      const lines = data.toString().split('\n').filter(l => l.trim());
      for (const line of lines) {
        stdoutBuffer += line + '\n';
        if (line.startsWith('STAGE:')) {
          const stage = line.replace('STAGE:', '').trim();
          const stageLabels = {
            'scrapeando': 'Scrapeando datos de Zonaprop...',
            'descargando_imagenes': 'Descargando imágenes...',
            'completado': 'Scrape completado, sincronizando...',
            'error': 'Error durante el scrape',
          };
          updateJob(jobId, { stage: stageLabels[stage] || stage });
        } else if (line.startsWith('MSG:')) {
          updateJob(jobId, { logs: [line.replace('MSG:', '').trim()] });
        } else {
          updateJob(jobId, { logs: [line.trim()] });
        }
      }
    });

    proc.stderr.on('data', (data) => {
      const lines = data.toString().split('\n').filter(l => l.trim());
      for (const line of lines) {
        updateJob(jobId, { logs: [`[stderr] ${line.trim()}`] });
      }
    });

    proc.on('close', (code) => {
      try { fs.unlinkSync(tempScript); } catch {}
      fs.appendFileSync(logPath, `[${new Date().toISOString()}] Scrape exit code: ${code}\n`, 'utf8');

      if (code !== 0 || stdoutBuffer.includes('STAGE:error')) {
        updateJob(jobId, {
          status: 'error',
          stage: 'Error en el scrape',
          error: 'El proceso de scraping falló. Revisá la terminal para más detalles.',
          finishedAt: new Date().toISOString(),
        });
        return;
      }

      // 5. Auto-run sync after scrape
      updateJob(jobId, { status: 'syncing', stage: 'Actualizando web con nuevos datos...' });
      const syncScript = path.join(BASE_DIR, 'update_web.py');
      const syncProc = spawn(PYTHON, [syncScript], {
        cwd: path.join(BASE_DIR, '..'),
      });

      syncProc.stdout.on('data', (data) => {
        const lines = data.toString().split('\n').filter(l => l.trim());
        updateJob(jobId, { logs: lines.map(l => `[sync] ${l}`) });
      });

      syncProc.stderr.on('data', (data) => {
        const lines = data.toString().split('\n').filter(l => l.trim());
        updateJob(jobId, { logs: lines.map(l => `[sync] ${l}`) });
      });

      syncProc.on('close', (syncCode) => {
        if (syncCode === 0) {
          updateJob(jobId, {
            status: 'complete',
            stage: '¡Propiedad agregada y web actualizada!',
            finishedAt: new Date().toISOString(),
          });
        } else {
          updateJob(jobId, {
            status: 'complete',
            stage: 'Scrape completado. Sincronización web manual requerida.',
            finishedAt: new Date().toISOString(),
          });
        }
      });
    });

  } catch (err) {
    updateJob(jobId, {
      status: 'error',
      stage: 'Error interno',
      error: err.message,
      finishedAt: new Date().toISOString(),
    });
  }
}

// Obtener configuración global
app.get('/api/config', (req, res) => {
  const configPath = path.join(BASE_DIR, 'config.json');
  try {
    const data = fs.readFileSync(configPath, 'utf8');
    res.json(JSON.parse(data));
  } catch (err) {
    res.status(500).json({ error: 'No se pudo leer config.json' });
  }
});

// Guardar configuración global
app.post('/api/config', (req, res) => {
  const configPath = path.join(BASE_DIR, 'config.json');
  try {
    fs.writeFileSync(configPath, JSON.stringify(req.body, null, 2), 'utf8');
    res.json({ message: 'Configuración guardada' });
  } catch (err) {
    res.status(500).json({ error: 'No se pudo guardar config.json' });
  }
});

// Guardar/actualizar leads de pre-tasación
app.post('/api/tasacion-leads', (req, res) => {
  const leadsDir = path.join(BASE_DIR, 'tasaciones');
  const leadsPath = path.join(leadsDir, 'leads.json');
  const now = new Date().toISOString();
  const requestedId = typeof req.body.id === 'string' ? req.body.id : '';
  const lead = {
    ...req.body,
    id: requestedId || crypto.randomBytes(6).toString('hex'),
    createdAt: req.body.createdAt || now,
    updatedAt: now,
  };

  if (!lead.name || !lead.phone || !lead.neighborhood || !lead.coveredArea) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }

  try {
    fs.mkdirSync(leadsDir, { recursive: true });
    const leads = fs.existsSync(leadsPath) ? JSON.parse(fs.readFileSync(leadsPath, 'utf8')) : [];
    const existingIndex = leads.findIndex(item => item.id === lead.id);
    if (existingIndex >= 0) {
      leads[existingIndex] = { ...leads[existingIndex], ...lead, createdAt: leads[existingIndex].createdAt || lead.createdAt };
    } else {
      leads.unshift(lead);
    }
    fs.writeFileSync(leadsPath, JSON.stringify(leads, null, 2), 'utf8');
    res.json({ message: 'Lead de tasación guardado', id: lead.id });
  } catch (err) {
    res.status(500).json({ error: 'No se pudo guardar el lead de tasación' });
  }
});

// Cambiar estado de una propiedad
app.post('/api/status', (req, res) => {
  const { id, status } = req.body;
  if (!id || !status) return res.status(400).json({ error: 'Faltan datos' });

  const statusPath = path.join(BASE_DIR, id, 'status.txt');
  try {
    fs.writeFileSync(statusPath, status, 'utf8');
    res.json({ message: `Estado de ${id} actualizado a ${status}` });
  } catch (err) {
    res.status(500).json({ error: 'No se pudo actualizar el estado' });
  }
});

// Actualizar datos de una propiedad
app.post('/api/property/update', (req, res) => {
  const { id, precio, expensas, tipo, operacion, ambientes, dormitorios, orientacion, antiguedad, metros_totales, metros_cubiertos, banos, luminoso } = req.body;
  if (!id) return res.status(400).json({ error: 'Falta id' });

  const rawPath = path.join(BASE_DIR, id, 'datos_raw.txt');
  try {
    let content = fs.readFileSync(rawPath, 'utf8');

    const updateField = (key, value) => {
      if (value === undefined) return;
      const regex = new RegExp(`^(${key}:).*`, 'm');
      if (regex.test(content)) {
        content = content.replace(regex, `$1 ${value}`);
      } else {
        content += `\n${key}: ${value}`;
      }
    };

    updateField('precio', precio);
    updateField('expensas', expensas);
    updateField('tipo', tipo);
    updateField('operacion', operacion);
    updateField('ambientes', ambientes);
    updateField('dormitorios', dormitorios);
    updateField('orientacion', orientacion);
    updateField('antiguedad', antiguedad);
    updateField('metros_totales', metros_totales);
    updateField('metros_cubiertos', metros_cubiertos);
    updateField('banos', banos);
    updateField('luminoso', luminoso);

    fs.writeFileSync(rawPath, content, 'utf8');

    // Sync tipo.txt with the admin value so update_web.py doesn't revert it
    if (tipo !== undefined) {
      const tipoPath = path.join(BASE_DIR, id, 'tipo.txt');
      fs.writeFileSync(tipoPath, tipo, 'utf8');
    }

    res.json({ message: `Datos de ${id} actualizados` });
  } catch (err) {
    res.status(500).json({ error: 'No se pudo actualizar datos_raw.txt' });
  }
});

// Borrar propiedad (carpeta fuente + copias publicadas)
app.post('/api/property/delete', (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'Falta id' });
  if (!/^[\w.\-]+$/.test(id)) return res.status(400).json({ error: 'ID de propiedad inválido' });

  const removeInside = (root, ...parts) => {
    const target = path.resolve(root, ...parts);
    const safeRoot = path.resolve(root);
    if (!target.startsWith(safeRoot + path.sep)) {
      throw new Error(`Ruta insegura: ${target}`);
    }
    if (fs.existsSync(target)) {
      fs.rmSync(target, { recursive: true, force: true });
      return true;
    }
    return false;
  };

  try {
    const removed = [];

    // Carpeta fuente: fichas/<id>
    if (removeInside(BASE_DIR, id)) removed.push('fuente');

    // Eliminar URL de procesados.txt para permitir rescrapearla
    const procesadosPath = path.join(BASE_DIR, '..', 'procesados.txt');
    if (fs.existsSync(procesadosPath)) {
      const lines = fs.readFileSync(procesadosPath, 'utf8').split('\n');
      const folderSlug = id.replace(/_/g, '-').toLowerCase().replace(/[\s_-]/g, '');
      const filtered = lines.filter(l => !l.toLowerCase().replace(/[\s_-]/g, '').includes(folderSlug));
      fs.writeFileSync(procesadosPath, filtered.join('\n'), 'utf8');
    }

    // Copias públicas usadas en desarrollo y producción
    const publicRoots = [
      path.join(__dirname, 'public', 'properties'),
      path.join(DIST_DIR, 'properties'),
      path.join(BASE_DIR, 'web-propiedades', 'public', 'properties'),
      path.join(BASE_DIR, 'web-propiedades', 'dist', 'properties'),
    ];
    for (const root of publicRoots) {
      if (fs.existsSync(root) && removeInside(root, id)) removed.push(root);
    }

    // Quitarla también del JSON fuente para que no vuelva a aparecer al recargar el admin/dev.
    if (fs.existsSync(DATA_FILE)) {
      const webData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      const before = Array.isArray(webData.properties) ? webData.properties.length : 0;
      webData.properties = (webData.properties || []).filter(p => p.id !== id);
      if (webData.properties.length !== before) {
        fs.writeFileSync(DATA_FILE, JSON.stringify(webData, null, 2), 'utf8');
        removed.push('properties.json');
      }
    }

    res.json({ message: `Propiedad ${id} eliminada${removed.length ? ` (${removed.length} ubicación/es)` : ''}. Ejecutá Sincronizar Web y republicá para que desaparezca del portal público.` });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar propiedad: ' + err.message });
  }
});

// Agregar propiedad desde URL de Zonaprop (con progreso)
app.post('/api/property/add', (req, res) => {
  const { url } = req.body;
  if (!url || !url.includes('zonaprop.com.ar')) {
    return res.status(400).json({ error: 'URL de Zonaprop inválida' });
  }

  // No rescrapear si ya existe carpeta con fotos
  const urlWords = url.replace(/https?:\/\/[^\/]+\/propiedades\/clasificado\//, '').split('-').slice(0, -1).join(' ').toLowerCase();
  const matchFolder = fs.readdirSync(BASE_DIR).find(d => {
    if (d === 'web-propiedades' || d.startsWith('.')) return false;
    const imgDir = path.join(BASE_DIR, d, 'Imagenes');
    if (!fs.existsSync(imgDir)) return false;
    const imgs = fs.readdirSync(imgDir).filter(f => f.endsWith('.jpg'));
    if (imgs.length === 0) return false;
    return urlWords.includes(d.replace(/_/g, ' ').toLowerCase()) || d.toLowerCase().includes(urlWords.split(' ').slice(0, 2).join(''));
  });
  if (matchFolder) {
    return res.json({ message: `"${matchFolder}" ya existe. Borrala desde el panel y volvé a agregarla.` });
  }

  const job = createJob(url);
  runScrapeJob(job.jobId, url);
  res.json({ jobId: job.jobId, message: 'Scrape iniciado' });
});

// Consultar estado de un trabajo de scrape
app.get('/api/scrape-status/:jobId', (req, res) => {
  const job = scrapeJobs.get(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'Job no encontrado' });
  res.json(job);
});

// Obtener contenido de Instagram generado para una propiedad
app.get('/api/instagram/:id', (req, res) => {
  const id = req.params.id;
  // El caption se lee desde public (también disponible en dist tras el build)
  const captionPath = path.join(__dirname, 'public', 'properties', id, 'instagram', 'caption.txt');
  const fallbackPath = path.join(DIST_DIR, 'properties', id, 'instagram', 'caption.txt');
  const cardUrl = `/properties/${id}/instagram/card.jpg`;

  const targetPath = fs.existsSync(captionPath) ? captionPath : fallbackPath;
  try {
    const caption = fs.readFileSync(targetPath, 'utf8');
    res.json({ id, cardUrl, caption });
  } catch (err) {
    res.status(404).json({ error: 'Contenido de Instagram no encontrado. Sincronizá la web primero.' });
  }
});

// Obtener/generar paquete Facebook para una propiedad
function facebookPackageInfo(id) {
  const socialDir = path.join(BASE_DIR, id, 'social');
  const textPath = path.join(socialDir, 'facebook_post', 'texto_facebook.txt');
  const zipPath = path.join(socialDir, 'facebook_post.zip');
  return {
    textPath,
    zipPath,
    zipUrl: `/api/social/facebook/${encodeURIComponent(id)}/zip`,
  };
}

app.get('/api/social/facebook/:id', (req, res) => {
  const id = req.params.id;
  const info = facebookPackageInfo(id);
  if (!fs.existsSync(info.zipPath) || !fs.existsSync(info.textPath)) {
    return res.status(404).json({ error: 'Paquete Facebook no generado todavía.' });
  }
  res.json({ id, zipUrl: info.zipUrl, text: fs.readFileSync(info.textPath, 'utf8') });
});

app.post('/api/social/facebook/:id/generate', (req, res) => {
  const id = req.params.id;
  const scriptPath = path.join(BASE_DIR, 'social_media_generator.py');
  if (!fs.existsSync(scriptPath)) {
    return res.status(500).json({ error: 'No se encontró social_media_generator.py' });
  }
  const proc = spawn(PYTHON, [scriptPath, id], { cwd: BASE_DIR });
  let stdout = '';
  let stderr = '';
  proc.stdout.on('data', data => { stdout += data.toString(); });
  proc.stderr.on('data', data => { stderr += data.toString(); });
  proc.on('close', code => {
    if (code !== 0) {
      return res.status(500).json({ error: stderr || stdout || 'No se pudo generar el paquete Facebook' });
    }
    const info = facebookPackageInfo(id);
    if (!fs.existsSync(info.zipPath) || !fs.existsSync(info.textPath)) {
      return res.status(500).json({ error: 'El generador terminó pero no se encontró el ZIP.' });
    }
    res.json({ id, zipUrl: info.zipUrl, text: fs.readFileSync(info.textPath, 'utf8'), message: 'Paquete Facebook generado' });
  });
});

app.get('/api/social/facebook/:id/zip', (req, res) => {
  const id = req.params.id;
  const info = facebookPackageInfo(id);
  if (!fs.existsSync(info.zipPath)) {
    return res.status(404).json({ error: 'ZIP Facebook no encontrado' });
  }
  res.download(info.zipPath, `${id}_facebook_post.zip`);
});

// Configuración de multer para subida de fotos (destino dinámico por propiedad)
function createPhotoUpload(destPath) {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      fs.mkdirSync(destPath, { recursive: true });
      cb(null, destPath);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
      const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_\-]/g, '_');
      const unique = `${base}_${Date.now()}${ext}`;
      cb(null, unique);
    }
  });
  return multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });
}

// Listar fotos de una propiedad (desde la carpeta origen)
app.get('/api/property/:id/photos', (req, res) => {
  const id = req.params.id;
  const imgDir = path.join(BASE_DIR, id, 'Imagenes');
  if (!fs.existsSync(imgDir)) {
    return res.status(404).json({ error: 'Carpeta de imágenes no encontrada' });
  }
  try {
    const files = fs.readdirSync(imgDir)
      .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
      .map(f => ({
        filename: f,
        url: `/api/property/${id}/photos/${encodeURIComponent(f)}/file`,
        thumb: `/api/property/${id}/photos/${encodeURIComponent(f)}/file`,
        publicUrl: `/properties/${id}/images/${f}`,
        isCover: fs.existsSync(path.join(BASE_DIR, id, 'cover.txt')) &&
          fs.readFileSync(path.join(BASE_DIR, id, 'cover.txt'), 'utf8').trim() === f
      }));
    res.json({ id, photos: files });
  } catch (err) {
    res.status(500).json({ error: 'Error listando fotos: ' + err.message });
  }
});

// Servir una imagen original para el admin (desde la carpeta origen)
app.get('/api/property/:id/photos/:filename/file', (req, res) => {
  const id = req.params.id;
  const filename = req.params.filename;
  const imgDir = path.join(BASE_DIR, id, 'Imagenes');
  const targetFile = path.join(imgDir, filename);
  if (!fs.existsSync(targetFile)) {
    return res.status(404).json({ error: 'Imagen no encontrada' });
  }
  res.sendFile(path.resolve(targetFile));
});

// Definir foto de portada (cover.txt)
app.post('/api/property/:id/photos/cover', (req, res) => {
  const id = req.params.id;
  const { filename } = req.body;
  if (!filename) return res.status(400).json({ error: 'Falta filename' });
  const imgDir = path.join(BASE_DIR, id, 'Imagenes');
  const coverPath = path.join(BASE_DIR, id, 'cover.txt');
  const targetFile = path.join(imgDir, filename);
  if (!fs.existsSync(targetFile)) {
    return res.status(404).json({ error: 'La imagen no existe' });
  }
  try {
    fs.writeFileSync(coverPath, filename, 'utf8');
    res.json({ message: `Portada actualizada: ${filename}`, filename });
  } catch (err) {
    res.status(500).json({ error: 'No se pudo guardar la portada: ' + err.message });
  }
});

// Eliminar una foto de una propiedad
app.delete('/api/property/:id/photos/:filename', (req, res) => {
  const id = req.params.id;
  const filename = req.params.filename;
  const imgDir = path.join(BASE_DIR, id, 'Imagenes');
  const targetFile = path.join(imgDir, filename);
  if (!fs.existsSync(targetFile)) {
    return res.status(404).json({ error: 'La imagen no existe' });
  }
  try {
    fs.unlinkSync(targetFile);
    // Si era la portada, borrar cover.txt
    const coverPath = path.join(BASE_DIR, id, 'cover.txt');
    if (fs.existsSync(coverPath)) {
      const currentCover = fs.readFileSync(coverPath, 'utf8').trim();
      if (currentCover === filename) {
        fs.unlinkSync(coverPath);
      }
    }
    res.json({ message: `Foto eliminada: ${filename}`, filename });
  } catch (err) {
    res.status(500).json({ error: 'No se pudo eliminar la foto: ' + err.message });
  }
});

// Subir una o más fotos a una propiedad
app.post('/api/property/:id/photos', (req, res, next) => {
  const id = req.params.id;
  const imgDir = path.join(BASE_DIR, id, 'Imagenes');
  const upload = createPhotoUpload(imgDir).array('photos', 20);
  upload(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || 'Error subiendo fotos' });
    }
    const uploaded = (req.files || []).map(f => f.filename);
    res.json({ message: `${uploaded.length} foto(s) subida(s)`, filenames: uploaded });
  });
});

// Publicar una propiedad en Instagram via Graph API
app.post('/api/publish-instagram/:id', async (req, res) => {
  const id = req.params.id;
  const configPath = path.join(BASE_DIR, 'config.json');
  let config;
  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (err) {
    return res.status(500).json({ error: 'No se pudo leer config.json' });
  }

  const { instagram_account_id: accountId, instagram_access_token: accessToken } = config || {};
  if (!accountId || !accessToken) {
    return res.status(400).json({
      error: 'Faltan credenciales de Instagram en la configuración.',
      details: 'Agregá Instagram Account ID y Access Token en el panel Admin > Contacto Global.'
    });
  }

  const captionPath = path.join(__dirname, 'public', 'properties', id, 'instagram', 'caption.txt');
  const fallbackPath = path.join(DIST_DIR, 'properties', id, 'instagram', 'caption.txt');
  const targetCaptionPath = fs.existsSync(captionPath) ? captionPath : fallbackPath;
  const cardUrl = `https://quintana.cabapropiedades.ar/properties/${id}/instagram/card.jpg`;

  let caption;
  try {
    caption = fs.readFileSync(targetCaptionPath, 'utf8');
  } catch (err) {
    return res.status(404).json({ error: 'Contenido de Instagram no encontrado. Sincronizá la web primero.' });
  }

  const apiVersion = 'v18.0';
  try {
    // 1. Crear contenedor de medios
    const createUrl = new URL(`https://graph.facebook.com/${apiVersion}/${accountId}/media`);
    createUrl.searchParams.append('image_url', cardUrl);
    createUrl.searchParams.append('caption', caption);
    createUrl.searchParams.append('access_token', accessToken);

    const createRes = await fetch(createUrl.toString(), { method: 'POST' });
    const createData = await createRes.json();
    if (!createRes.ok || createData.error) {
      throw new Error(createData.error?.message || 'Error creando el contenedor de Instagram');
    }
    const creationId = createData.id;

    // 2. Publicar el contenedor
    const publishUrl = new URL(`https://graph.facebook.com/${apiVersion}/${accountId}/media_publish`);
    publishUrl.searchParams.append('creation_id', creationId);
    publishUrl.searchParams.append('access_token', accessToken);

    const publishRes = await fetch(publishUrl.toString(), { method: 'POST' });
    const publishData = await publishRes.json();
    if (!publishRes.ok || publishData.error) {
      throw new Error(publishData.error?.message || 'Error publicando en Instagram');
    }

    res.json({
      message: 'Publicado en Instagram',
      mediaId: publishData.id,
      creationId,
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Error publicando en Instagram' });
  }
});

// Ejecutar sincronización (update_web.py)
app.post('/api/sync', (req, res) => {
  const scriptPath = path.join(BASE_DIR, 'update_web.py');
  exec(`${PYTHON} "${scriptPath}"`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error}`);
      return res.status(500).json({ error: 'Error ejecutando sincronización', details: stderr });
    }
    res.json({ message: 'Sincronización completada', output: stdout });
  });
});

// SPA catch-all: solo activo si hay build (produccion)
if (SHOULD_SERVE_DIST && fs.existsSync(DIST_DIR)) {
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(DIST_DIR, 'index.html'));
    }
  });
  console.log('SPA catch-all activo para produccion');
} else {
  console.log('Entorno desarrollo: asumiendo Vite proxy en /api');
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Quintana Backend corriendo en http://0.0.0.0:${PORT}`);
});
