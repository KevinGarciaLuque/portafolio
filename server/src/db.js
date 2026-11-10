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

// Archivos que NO se sirven públicamente (p. ej. el CV: solo se entrega por /api/cv cuando el admin lo activa).
// Queda junto a la carpeta de subidas, así que en Railway también vive dentro del volumen (/data/private-files).
export const PRIVATE_DIR = path.resolve(env.PRIVATE_DIR || path.join(path.dirname(UPLOAD_DIR), 'private-files'));
mkdirSync(PRIVATE_DIR, { recursive: true });

export const pool = mysql.createPool({
  ...dbConfig,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true,
  charset: 'utf8mb4',
});
