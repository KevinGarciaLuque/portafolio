import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import 'dotenv/config';
import publicRoutes from './routes/public.js';
import adminRoutes from './routes/admin.js';

const app = express();
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: process.env.CLIENT_ORIGIN }));
app.use(express.json({ limit: '1mb' }));
app.use('/uploads', express.static('uploads'));
app.use('/api', publicRoutes);
app.use('/api/admin', adminRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Error del servidor' });
});

app.listen(process.env.PORT, () => console.log(`API en http://localhost:${process.env.PORT}`));
