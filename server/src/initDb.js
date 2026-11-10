import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import 'dotenv/config';
import { dbConfig, DB_NAME } from './db.js';

const DB = DB_NAME;

// En Railway la red privada puede tardar unos segundos en resolver el host de MySQL al arrancar el contenedor
async function connectWithRetry() {
  const tries = Number(process.env.DB_CONNECT_TRIES || 12);
  const delayMs = Number(process.env.DB_CONNECT_DELAY_MS || 3000);
  console.log(`Conectando a MySQL ${dbConfig.host}:${dbConfig.port} como ${dbConfig.user}, BD "${DB}"`);
  for (let i = 1; i <= tries; i++) {
    try {
      return await mysql.createConnection({ ...dbConfig, multipleStatements: true });
    } catch (e) {
      console.error(`MySQL no disponible (intento ${i}/${tries}): ${e.code || ''} ${e.message}`);
      if (i === tries) throw e;
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}

const conn = await connectWithRetry();
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
// Los datos de ejemplo (disponibilidad y sistemas) solo se crean en la PRIMERA ejecución:
// así este script puede correr en cada arranque sin volver a crear lo que borres desde el panel.
const firstRun = !admins.length;
// Se recortan espacios/saltos de línea que suelen colarse al pegar valores en el panel de Railway
const ADMIN_USER = (process.env.ADMIN_USER || '').trim();
const ADMIN_PASSWORD = (process.env.ADMIN_PASSWORD || '').trim();
// RESET_ADMIN=true restablece usuario y clave del admin a ADMIN_USER / ADMIN_PASSWORD (úsalo una vez y quítalo)
const resetAdmin = String(process.env.RESET_ADMIN || '').trim().toLowerCase() === 'true';

if (firstRun || resetAdmin) {
  if (!ADMIN_USER || !ADMIN_PASSWORD) {
    throw new Error('Define ADMIN_USER y ADMIN_PASSWORD para crear/restablecer el administrador');
  }
  const hash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  if (firstRun) {
    await conn.query('INSERT INTO admins (username, password_hash) VALUES (?, ?)', [ADMIN_USER, hash]);
    console.log('Admin creado:', ADMIN_USER);
  } else {
    await conn.query('UPDATE admins SET username = ?, password_hash = ? ORDER BY id LIMIT 1', [ADMIN_USER, hash]);
    console.log('Admin RESTABLECIDO:', ADMIN_USER, '(quita la variable RESET_ADMIN)');
  }
}

const [av] = await conn.query('SELECT id FROM availability LIMIT 1');
if (firstRun && !av.length) {
  for (let d = 1; d <= 5; d++) {
    await conn.query('INSERT INTO availability (weekday,start_time,end_time) VALUES (?,?,?)', [d, '09:00:00', '17:00:00']);
  }
  console.log('Disponibilidad por defecto creada (lun-vie 9-17)');
}

const [sys] = await conn.query('SELECT id FROM systems LIMIT 1');
if (firstRun && !sys.length) {
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

// Proyectos reales publicados. Se insertan UNA sola vez (marca en settings) y se omiten los que ya existan por URL,
// así lo que edites o borres luego desde el panel no se vuelve a crear.
const [[seeded]] = await conn.query("SELECT COUNT(*) n FROM settings WHERE k = 'seed_live_links_v1'");
if (!seeded.n) {
  const live = [
    ['MedickG', 'MedickG', 'Gestión médica en línea', 'Online medical management', 'https://medickg.com/'],
    ['Equipo', 'Equipo', 'Control y gestión de equipos', 'Team and equipment management', 'https://equipo.up.railway.app/'],
    ['SmartCoop', 'SmartCoop', 'Plataforma para cooperativas', 'Platform for cooperatives', 'https://smartcoop.up.railway.app/'],
    ['KG Studio', 'KG Studio', 'Estudio de desarrollo y diseño', 'Development and design studio', 'https://kg-studio.vercel.app/'],
    ['Coffee', 'Coffee', 'Experiencia digital para cafeterías', 'Digital experience for coffee shops', 'https://coffee1.up.railway.app/'],
    ['Ktrachogo', 'Ktrachogo', 'Sitio web comercial', 'Business website', 'https://ktrachogo.com/'],
    ['El Piquete', 'El Piquete', 'Sitio web para restaurante', 'Restaurant website', 'https://el-piquete.vercel.app/'],
    ['Tiendas Lauren', 'Tiendas Lauren', 'Tienda en línea', 'Online store', 'https://tiendaslauren.com/'],
  ];
  let order = -live.length;
  for (const [te, ten, ge, gen, url] of live) {
    const [dup] = await conn.query('SELECT id FROM systems WHERE url = ? LIMIT 1', [url]);
    if (!dup.length) {
      await conn.query(
        `INSERT INTO systems (title_es,title_en,tagline_es,tagline_en,desc_es,desc_en,url,tags,sort_order)
         VALUES (?,?,?,?,?,?,?,?,?)`,
        [te, ten, ge, gen,
          'Descripción del proyecto. Edítala desde el panel administrativo.',
          'Project description. Edit it from the admin panel.',
          url, 'React,Node.js,MySQL', order]
      );
    }
    order++;
  }
  await conn.query("INSERT INTO settings (k, v) VALUES ('seed_live_links_v1', '1')");
  console.log('Enlaces de proyectos publicados agregados al catálogo');
}

const defaults = {
  name: 'Kevin García',
  email: 'kevinxgt90@gmail.com',
  phone: '', whatsapp: '', location: '',
  linkedin: '', github: '', facebook: '', instagram: '', tiktok: '', youtube: '', x: '',
  // Formación y certificaciones (INSERT IGNORE: solo se crea si no existe; lo que edites en el panel se respeta)
  education: JSON.stringify([
    { title_es: 'Certificación: Desarrollador FullStack', title_en: 'Certification: FullStack Developer', org: 'UTH', year: '2024' },
    { title_es: 'Curso: Básico de JavaScript', title_en: 'Course: JavaScript Basics', org: 'UNAH', year: '2025' },
    { title_es: 'Curso: Base de Datos MySQL', title_en: 'Course: MySQL Databases', org: 'INFOP', year: '2024' },
    { title_es: 'Curso: Nivel Básico de Inglés', title_en: 'Course: Basic English', org: 'Fuerzas Armadas de Honduras', year: '2024' },
    { title_es: 'Curso: Brigadistas del Hospital María Especialidades Pediátricas', title_en: 'Course: Brigade Member, Hospital María Pediatric Specialties', org: 'Cruz Roja Hondureña', year: '2024' },
    { title_es: 'Curso CCNA2: Switching, Routing and Wireless Essentials', title_en: 'Course CCNA2: Switching, Routing and Wireless Essentials', org: 'UTH', year: '2024' },
    { title_es: 'Curso CCNA1: Introducción a las Redes', title_en: 'Course CCNA1: Introduction to Networks', org: 'UTH', year: '2023' },
    { title_es: 'Curso: Relaciones Interpersonales', title_en: 'Course: Interpersonal Relationships', org: 'INFOP', year: '2017' },
    { title_es: 'Curso: Operador de Paquetes bajo Windows (Word, Excel, PowerPoint, Publisher)', title_en: 'Course: Windows Office Suite Operator (Word, Excel, PowerPoint, Publisher)', org: 'INFOP', year: '2008' },
  ]),
  experience: JSON.stringify([
    { role_es: 'Desarrollador Full-Stack', role_en: 'Full-Stack Developer', company: 'Tu empresa / Freelance', period: '2022 — Actual',
      desc_es: 'Edita este puesto desde el panel administrativo.', desc_en: 'Edit this position from the admin panel.' },
  ]),
};
for (const [k, v] of Object.entries(defaults)) await conn.query('INSERT IGNORE INTO settings (k, v) VALUES (?, ?)', [k, v]);

await conn.end();
console.log('Base de datos lista:', DB);
