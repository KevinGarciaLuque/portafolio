import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import 'dotenv/config';
import { dbConfig } from './db.js';

const DB = process.env.DB_NAME;

const conn = await mysql.createConnection({ ...dbConfig, multipleStatements: true });
await conn.query(`CREATE DATABASE IF NOT EXISTS \`${DB}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
await conn.query(`USE \`${DB}\``);

await conn.query(`
CREATE TABLE IF NOT EXISTS admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(60) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS systems (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title_es VARCHAR(150) NOT NULL,
  title_en VARCHAR(150) NOT NULL,
  tagline_es VARCHAR(255) DEFAULT '',
  tagline_en VARCHAR(255) DEFAULT '',
  desc_es TEXT,
  desc_en TEXT,
  url VARCHAR(500) NOT NULL DEFAULT '',
  image_url VARCHAR(500) DEFAULT '',
  video_url VARCHAR(500) DEFAULT '',
  tags VARCHAR(255) DEFAULT '',
  sort_order INT DEFAULT 0,
  visible TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL,
  subject VARCHAR(200) DEFAULT '',
  message TEXT NOT NULL,
  is_read TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS meetings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL,
  phone VARCHAR(40) DEFAULT '',
  topic TEXT,
  start_at DATETIME NOT NULL,
  status ENUM('pending','confirmed','cancelled') DEFAULT 'pending',
  slot_key DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_slot (slot_key)
);
CREATE TABLE IF NOT EXISTS availability (
  id INT AUTO_INCREMENT PRIMARY KEY,
  weekday TINYINT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  active TINYINT(1) DEFAULT 1
);
CREATE TABLE IF NOT EXISTS blocked_days (
  day DATE PRIMARY KEY
);
CREATE TABLE IF NOT EXISTS settings (
  k VARCHAR(40) PRIMARY KEY,
  v TEXT
);
`);

const [admins] = await conn.query('SELECT id FROM admins LIMIT 1');
if (!admins.length) {
  const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
  await conn.query('INSERT INTO admins (username, password_hash) VALUES (?, ?)', [process.env.ADMIN_USER, hash]);
  console.log('Admin creado:', process.env.ADMIN_USER);
}

const [av] = await conn.query('SELECT id FROM availability LIMIT 1');
if (!av.length) {
  for (let d = 1; d <= 5; d++) {
    await conn.query('INSERT INTO availability (weekday,start_time,end_time) VALUES (?,?,?)', [d, '09:00:00', '17:00:00']);
  }
  console.log('Disponibilidad por defecto creada (lun-vie 9-17)');
}

const [sys] = await conn.query('SELECT id FROM systems LIMIT 1');
if (!sys.length) {
  const demo = [
    ['Sistema de Inventario', 'Inventory System', 'Control total de tu stock', 'Total control of your stock'],
    ['Sistema de Facturación', 'Billing System', 'Facturas y cobros en un solo lugar', 'Invoices and payments in one place'],
    ['Punto de Venta (POS)', 'Point of Sale (POS)', 'Ventas rápidas y reportes en vivo', 'Fast sales and live reports'],
    ['Gestión de Clientes (CRM)', 'Customer Management (CRM)', 'Relaciones que generan ventas', 'Relationships that drive sales'],
    ['Recursos Humanos', 'Human Resources', 'Planilla, asistencia y empleados', 'Payroll, attendance and staff'],
    ['Control de Citas', 'Appointment Booking', 'Agenda inteligente para tu negocio', 'Smart scheduling for your business'],
    ['Sistema Escolar', 'School System', 'Notas, matrículas y comunicación', 'Grades, enrollment and communication'],
    ['Gestión de Proyectos', 'Project Management', 'Tareas y equipos bajo control', 'Tasks and teams under control'],
    ['Tienda en Línea', 'Online Store', 'E-commerce listo para vender', 'E-commerce ready to sell'],
    ['Dashboard Gerencial', 'Executive Dashboard', 'Datos que impulsan decisiones', 'Data that drives decisions'],
  ];
  let i = 1;
  for (const [te, ten, ge, gen] of demo) {
    await conn.query(
      `INSERT INTO systems (title_es,title_en,tagline_es,tagline_en,desc_es,desc_en,url,tags,sort_order)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [te, ten, ge, gen,
        'Descripción del sistema. Edítala desde el panel administrativo.',
        'System description. Edit it from the admin panel.',
        '', 'React,Node.js,MySQL', i++]
    );
  }
  console.log('10 sistemas de ejemplo creados');
}

const defaults = {
  name: 'Kevin García',
  email: 'kevinxgt90@gmail.com',
  phone: '', whatsapp: '', location: '',
  linkedin: '', github: '', facebook: '', instagram: '', tiktok: '', youtube: '', x: '',
  experience: JSON.stringify([
    { role_es: 'Desarrollador Full-Stack', role_en: 'Full-Stack Developer', company: 'Tu empresa / Freelance', period: '2022 — Actual',
      desc_es: 'Edita este puesto desde el panel administrativo.', desc_en: 'Edit this position from the admin panel.' },
  ]),
};
for (const [k, v] of Object.entries(defaults)) await conn.query('INSERT IGNORE INTO settings (k, v) VALUES (?, ?)', [k, v]);

await conn.end();
console.log('Base de datos lista:', DB);
