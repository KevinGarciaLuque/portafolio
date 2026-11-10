import fs from 'fs';
import path from 'path';
import { pool, PRIVATE_DIR } from './db.js';
import { isCvFileName } from './cvName.js';

export async function setSetting(k, v) {
  await pool.query('INSERT INTO settings (k, v) VALUES (?, ?) ON DUPLICATE KEY UPDATE v = VALUES(v)', [k, v]);
}

/** Estado del CV: archivo guardado, nombre original y si el admin lo tiene activado. */
export async function getCv() {
  const [rows] = await pool.query("SELECT k, v FROM settings WHERE k IN ('cv_file', 'cv_name', 'cv_enabled')");
  const s = Object.fromEntries(rows.map((r) => [r.k, r.v]));
  const file = isCvFileName(s.cv_file) ? s.cv_file : '';
  const full = file ? path.join(PRIVATE_DIR, file) : '';
  const exists = !!full && fs.existsSync(full);
  return { file: exists ? file : '', full: exists ? full : '', exists, name: s.cv_name || '', enabled: s.cv_enabled === 'true' };
}

export function removeCvFile(file) {
  if (!isCvFileName(file)) return;
  try { fs.unlinkSync(path.join(PRIVATE_DIR, file)); } catch { /* ya no existía */ }
}
