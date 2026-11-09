# Portafolio / CV cinematográfico

React (Vite) + Node/Express + MySQL. Hero y escenas controladas por scroll (GSAP ScrollTrigger + Canvas), catálogo de sistemas, contacto, agenda de reuniones y panel administrativo en `/admin`.

## Estructura
- `client/` — React + Vite
- `server/` — API Express + MySQL (JWT para el admin)
- `docs/STORYBOARD.md` — storyboard y prompts de las escenas de Higgsfield

## Desarrollo local
```bash
# 1) Servidor
cd server
cp .env.example .env      # completa DB_PASSWORD, JWT_SECRET, ADMIN_PASSWORD
npm install
npm run init-db           # crea la base de datos, tablas y datos iniciales
npm run dev

# 2) Cliente (otra terminal)
cd client
npm install
npm run dev               # http://localhost:5173  ·  admin: /admin
```

## Variables de entorno (`server/.env`)
`PORT`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`, `ADMIN_USER`, `ADMIN_PASSWORD`, `CLIENT_ORIGIN`.

## Despliegue en Railway (un solo servicio + MySQL)
Express sirve la API y la web compilada (`client/dist`).

1. **Servicio de la app:** repositorio de GitHub, **Root Directory: `/`**. Railway usa `npm run build` y `npm start` del `package.json` raíz (el arranque ejecuta `init-db`, que es seguro repetir).
2. **Base de datos:** añade el plugin **MySQL**. La app lee automáticamente `MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD` y `MYSQLDATABASE`; en el servicio de la app define cada una como referencia, p. ej. `MYSQLHOST=${{MySQL.MYSQLHOST}}`.
3. **Variables del servicio de la app:**
   - `NODE_ENV=production`
   - `JWT_SECRET` — cadena aleatoria larga (≥ 32 bytes)
   - `ADMIN_USER` y `ADMIN_PASSWORD` — solo se usan para crear el admin la **primera** vez
   - `UPLOAD_DIR=/data/uploads`
4. **Volumen:** crea un volumen montado en `/data` para que las imágenes y videos subidos desde el panel no se pierdan en cada despliegue.
5. **Dominio:** *Settings → Networking → Generate Domain*. Después cambia la clave del admin desde `/admin` → Cuenta.

## Escenas cinematográficas
Los fotogramas están en `client/public/sequences/<escena>/`. Para regenerarlos desde un clip:
```bash
cd client
npm run seq -- ruta/clip.mp4 hero --frames 120 --soften 1.15
```
