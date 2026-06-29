import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://quintana.cabapropiedades.ar';
const DIST_DIR = path.resolve(__dirname, '..', 'dist');
const PROPERTIES_FILE = path.resolve(__dirname, '..', 'src', 'data', 'properties.json');

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function buildUrl(loc, priority, changefreq) {
  return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${formatDate(new Date())}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

function generateSitemap() {
  if (!fs.existsSync(PROPERTIES_FILE)) {
    console.error('No se encontró properties.json');
    process.exit(1);
  }

  const raw = fs.readFileSync(PROPERTIES_FILE, 'utf-8');
  const data = JSON.parse(raw);
  const properties = data.properties || [];

  const urls = [
    buildUrl(BASE_URL, '1.0', 'weekly'),
    buildUrl(`${BASE_URL}/nosotros`, '0.8', 'monthly'),
  ];

  for (const property of properties) {
    if (property.id) {
      urls.push(buildUrl(`${BASE_URL}/property/${property.id}`, '0.9', 'weekly'));
    }
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;

  if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR, { recursive: true });
  }

  const outputPath = path.join(DIST_DIR, 'sitemap.xml');
  fs.writeFileSync(outputPath, sitemap, 'utf-8');
  console.log(`Sitemap generado: ${outputPath} (${urls.length} URLs)`);
}

generateSitemap();
