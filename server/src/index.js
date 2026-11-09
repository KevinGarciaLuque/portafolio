import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import { UPLOAD_DIR } from './db.js';
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
  // Los fotogramas y assets con hash son inmutables: caché larga
  app.use('/assets', express.static(path.join(dist, 'assets'), { maxAge: '1y', immutable: true }));
  app.use('/sequences', express.static(path.join(dist, 'sequences'), { maxAge: '7d' }));
  app.use(express.static(dist));
  app.get('/{*splat}', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Error del servidor' });
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`API en http://localhost:${port}${existsSync(dist) ? ' (sirviendo la web)' : ''}`));
