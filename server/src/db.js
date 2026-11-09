import mysql from 'mysql2/promise';
import path from 'path';
import { mkdirSync } from 'fs';
import 'dotenv/config';

const env = process.env;

// Acepta DB_* (local) o las variables que inyecta Railway (MYSQL*)
export const dbConfig = {
  host: env.DB_HOST || env.MYSQLHOST || 'localhost',
  port: Number(env.DB_PORT || env.MYSQLPORT || 3306),
  user: env.DB_USER || env.MYSQLUSER || 'root',
  password: env.DB_PASSWORD ?? env.MYSQLPASSWORD ?? '',
};

export const DB_NAME = env.DB_NAME || env.MYSQLDATABASE || 'cv_portfolio';

// Carpeta de archivos subidos desde el admin. En Railway debe apuntar a un volumen persistente (p. ej. /data/uploads)
export const UPLOAD_DIR = path.resolve(env.UPLOAD_DIR || 'uploads');
mkdirSync(UPLOAD_DIR, { recursive: true });

export const pool = mysql.createPool({
  ...dbConfig,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true,
  charset: 'utf8mb4',
});
