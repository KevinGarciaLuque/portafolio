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

## Escenas cinematográficas
Los fotogramas están en `client/public/sequences/<escena>/`. Para regenerarlos desde un clip:
```bash
cd client
npm run seq -- ruta/clip.mp4 hero --frames 120 --soften 1.15
```
