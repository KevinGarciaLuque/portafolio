import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { existsSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import { UPLOAD_DIR, pool } from './db.js';
import publicRoutes from './routes/public.js';
import adminRoutes from './routes/admin.js';

const app = express();
const isProd = process.env.NODE_ENV === 'production';

// Detrás del proxy de Railway: necesario para que el límite de peticiones vea la IP real
app.set('trust proxy', 1);

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      'img-src': ["'self'", 'data:', 'blob:', 'https:'],
      'media-src': ["'self'", 'blob:', 'https:'],
      'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      'font-src': ["'self'", 'data:', 'https://fonts.gstatic.com'],
    },
  },
}));

// En desarrollo la web corre en Vite (otro puerto); en producción es el mismo origen
if (!isProd) app.use(cors({ origin: process.env.CLIENT_ORIGIN }));
app.use(express.json({ limit: '1mb' }));

app.use('/uploads', express.static(UPLOAD_DIR));
app.use('/uploads', (_req, res) => res.status(404).end()); // un archivo inexistente no debe devolver la página principal
app.use('/api', publicRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', (_req, res) => res.status(404).json({ error: 'No encontrado' }));

// Sirve la web compilada (client/dist) con respaldo a index.html para /admin y demás rutas
const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../client/dist');
if (existsSync(dist)) {
  // URL pública del sitio según la petición (Railway envía el host/protocolo reales por el proxy)
  const siteUrl = (req) => `${req.protocol}://${req.get('host')}`;

  app.get('/robots.txt', (req, res) => {
    res.type('text/plain').send(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n\nSitemap: ${siteUrl(req)}/sitemap.xml\n`);
  });
  app.get('/sitemap.xml', (req, res) => {
    const base = siteUrl(req);
    const urls = ['/', '/sobre-mi'].map((p) => `  <url><loc>${base}${p}</loc></url>`).join('\n');
    res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
  });

  // Los fotogramas y assets con hash son inmutables: caché larga
  app.use('/assets', express.static(path.join(dist, 'assets'), { maxAge: '1y', immutable: true }));
  app.use('/sequences', express.static(path.join(dist, 'sequences'), { maxAge: '7d' }));
  app.use(express.static(dist, { index: false }));

  // index.html con la URL del sitio y la foto de perfil como imagen de vista previa
  const template = readFileSync(path.join(dist, 'index.html'), 'utf8');
  app.get('/{*splat}', async (req, res, next) => {
    try {
      const base = siteUrl(req);
      let ogImage = '';
      try {
        const [[row]] = await pool.query("SELECT v FROM settings WHERE k = 'photo'");
        if (row?.v?.startsWith('/uploads/')) ogImage = `<meta property="og:image" content="${base}${row.v}" />\n    <meta name="twitter:image" content="${base}${row.v}" />`;
      } catch { /* sin foto: se omite */ }
      res.type('html').send(template.replaceAll('__SITE_URL__', base).replace('<!--OG_IMAGE-->', ogImage));
    } catch (e) { next(e); }
  });
}

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Error del servidor' });
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`API en http://localhost:${port}${existsSync(dist) ? ' (sirviendo la web)' : ''}`));
