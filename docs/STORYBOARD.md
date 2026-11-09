# Storyboard cinematográfico — CV de Kevin García

Experiencia controlada por scroll: **Higgsfield genera el material**, un script lo convierte en secuencias WebP/AVIF, y **GSAP ScrollTrigger + Canvas** lo reproducen. Los textos, botones y títulos son HTML real encima del canvas; **nunca** van dentro de las imágenes generadas.

## Estado de producción (2026-11-09)

**Estilo actualizado por petición del cliente:** fondo tipo **galaxia** (espacio profundo, nebulosas cian/azul/violeta, estrellas). **Sin anillos, óvalos ni rejillas** en ninguna escena. Los prompts de abajo conservan la composición y cámara; donde mencionan anillos, portal u órbitas, ya fueron sustituidos en las imágenes clave por nebulosa, galaxia espiral y partículas.

**Imágenes clave generadas** (Higgsfield, `gpt_image_2_6`, 16:9, 1344×752, calidad low; copias locales en el scratchpad de la sesión):

| Clave | Contenido | job_id |
|-------|-----------|--------|
| K0 | Punto de luz cian en el vacío con nebulosas | `86e4d86f-9b86-40e7-94c3-21a14de9bd45` |
| K1 | Cañón de nebulosa hacia galaxia espiral y torres de cristal | `6a622960-3919-4c5e-b27f-2597350cddfa` |
| K2 | Núcleo de cristal facetado con datos luminosos | `7ae28755-31e3-4a87-ba22-0f2b94d8a513` |
| K3 | Hilera de paneles de cristal hacia resplandor cian | `2b0e2ddf-d85e-45a3-8b5b-6991513bfb6c` |
| K4 | 10 pantallas flotantes en arco, centro despejado | `c0aa345d-bb00-4f25-9168-f0d64dbdf806` |
| K5 | Haz cian vertical y Vía Láctea sobre horizonte calmo | `49cdd9b4-5b00-4189-b39e-cc350b94be53` |

Pendiente: aprobación del cliente de las claves → generar los 5 videos (start = K(n), end = K(n+1)).

## Reglas para TODAS las escenas

**Biblia de estilo (pégala al inicio de cada prompt)**

> Cinematic sci-fi, ultra-clean, deep navy-black (#04070d) environment with neon cyan (#19e3ff) and electric blue (#2f7bff) light, subtle violet haze. Anamorphic lens, soft volumetric light, fine film grain, shallow depth of field, glossy glass and brushed-metal surfaces, high contrast, premium tech-commercial look. No text, no letters, no logos, no watermark, no readable screens, no human faces.

**Composición pensada para superponer HTML**

- Formato **16:9** (1920×1080 o 1280×720). En móvil el canvas recorta al centro (cover), así que el sujeto importante debe vivir en el **40 % central** del ancho.
- Deja **espacio negativo oscuro** en el tercio inferior y a la izquierda: ahí van títulos y botones.
- Sin elementos brillantes en los bordes (se recortan en móvil).

**Continuidad entre escenas (clave para que el scroll se sienta como un solo plano)**

El fotograma final de la escena *N* es el fotograma inicial de la escena *N+1*. Flujo recomendado en Higgsfield:

1. Generar primero las **6 imágenes clave K0…K5** con la biblia de estilo (consistencia visual).
2. Generar cada video con `start frame = K(n)` y `end frame = K(n+1)`.
3. Si el modelo elegido no admite *end frame*, generar solo con start frame y extraer el último fotograma para usarlo como start de la siguiente.

**Parámetros técnicos de cada clip**

- Cámara siempre **fluida y monótona** (sin cortes, sin cambios de dirección): el scroll puede ir hacia atrás y debe verse bien en ambos sentidos.
- Sin movimiento errático de personajes ni objetos que "salten"; el movimiento principal lo da la cámara.
- Calidad: 1080p si el modelo lo permite. Se convierte a 1280 px (desktop) y 720 px (móvil).

## Mapa de escenas

| # | Sección | Nombre | Duración | Frames finales | Cámara |
|---|---------|--------|----------|----------------|--------|
| 1 | Hero | Ignition | 8 s | 120 (15 fps) | Dolly-in a través de un portal |
| 2 | Sobre mí | The Architect | 5 s | 75 | Órbita lenta alrededor de un núcleo |
| 3 | Experiencia | The Timeline | 6 s | 90 | Travelling lateral por un corredor |
| 4 | Proyectos | The Gallery | 6 s | 90 | Dolly-in + leve crane-up |
| 5 | Contacto | The Signal | 5 s | 75 | Pull-back y tilt-up a un faro de luz |

---

## Escena 1 — HERO · "Ignition" (8 s)

**Rol en la web:** pantalla fijada (pin) de ~320 % de scroll. Tres textos HTML aparecen en secuencia: nombre/título → propuesta de valor → llamada a la acción.

- **Inicio (K0):** vacío casi negro. En el centro exacto, un único punto de luz cian diminuto, como una estrella. Un leve resplandor en el suelo.
- **Final (K1):** la cámara atravesó un anillo luminoso gigante y revela una ciudad digital holográfica a lo lejos: torres de cristal con líneas de datos cian que suben, bruma azul, horizonte bajo. Espacio oscuro libre abajo.
- **Cámara:** dolly-in recto y continuo hacia el centro, aceleración suave (ease-in), sin balanceo. Lente 24 mm, ligera distorsión anamórfica.
- **Iluminación:** única fuente central cian que crece; rim light azul en los bordes de las torres; haze volumétrico; contraste alto.
- **Composición:** simetría central (punto de fuga en el centro), regla de tercios para el horizonte en el tercio inferior.

**Prompt imagen K0**
```
[STYLE BIBLE] Wide shot of an infinite dark void with a perfectly centered tiny glowing cyan point of light like a distant star, faint cyan reflection on a glossy black floor, volumetric haze, vast empty negative space, symmetrical composition, 16:9.
```

**Prompt imagen K1**
```
[STYLE BIBLE] Wide shot looking through a giant glowing cyan ring portal at a distant futuristic holographic city of glass towers, thin cyan data streams rising from the towers, blue atmospheric haze, low horizon in the lower third, dark empty foreground, symmetrical one-point perspective, 16:9.
```

**Prompt video**
```
[STYLE BIBLE] Start frame K0, end frame K1. Smooth continuous straight dolly-in toward the center of the frame, slowly accelerating. The tiny cyan light grows into a luminous ring; the camera passes through the ring and reveals a distant holographic glass city with cyan data streams rising from the towers. Volumetric haze drifts gently past camera. No camera shake, no cuts, no direction change, no people, no text. 8 seconds, 24 fps, 16:9.
```

---

## Escena 2 — SOBRE MÍ · "The Architect" (5 s)

**Rol en la web:** fondo (backdrop) de la sección *Sobre mí*, avanza mientras la sección cruza la pantalla. Transición de entrada: cortina (clip-path) desde abajo.

- **Inicio (K1):** igual al final de la escena 1 (ciudad holográfica tras el anillo).
- **Final (K2):** primer plano de un **núcleo de cristal flotante** formado por capas de código luminoso abstracto (sin texto legible), anillos orbitales cian alrededor, fondo oscuro desenfocado con bokeh azul.
- **Cámara:** órbita lenta de ~60° hacia la derecha mientras se acerca al núcleo (arco continuo), lente 50 mm, poca profundidad de campo.
- **Iluminación:** luz interior cian pulsante en el núcleo, rim light azul, reflejos en cristal.
- **Composición:** núcleo ligeramente a la derecha del centro; izquierda libre para el texto.

**Prompt imagen K2**
```
[STYLE BIBLE] Close-up of a floating faceted glass core made of layered abstract glowing code-like lines (no readable text), thin cyan orbital rings around it, dark blurred background with blue bokeh, core slightly right of center, empty dark space on the left, shallow depth of field, 16:9.
```

**Prompt video**
```
[STYLE BIBLE] Start frame K1, end frame K2. Slow continuous orbiting camera arc of about 60 degrees to the right while gently moving closer. The distant holographic city dissolves into soft bokeh as a floating glass core made of luminous abstract lines emerges in focus, orbital rings rotating slowly. Smooth, steady, no cuts, no shake, no people, no text. 5 seconds, 24 fps, 16:9.
```

---

## Escena 3 — EXPERIENCIA · "The Timeline" (6 s)

**Rol en la web:** fondo de la sección *Experiencia*. Sobre ella se dibuja una línea de tiempo HTML con hitos que entran con scroll.

- **Inicio (K2):** el núcleo de cristal de la escena 2.
- **Final (K3):** corredor largo y estrecho de **paneles de cristal suspendidos** (vacíos / sin contenido legible) que se pierden hacia un fondo cian brillante; suelo reflectante.
- **Cámara:** travelling lateral + avance suave (tracking shot) a altura de ojos, como recorriendo una línea de tiempo.
- **Iluminación:** tira de luz cian en el suelo, paneles con borde luminoso azul, fondo en fuga más brillante.
- **Composición:** punto de fuga en el tercio derecho; paneles a la izquierda y derecha dejando el centro oscuro.

**Prompt imagen K3**
```
[STYLE BIBLE] Long narrow corridor of evenly spaced suspended empty glass panels with thin glowing blue edges receding toward a bright cyan glow, reflective dark floor with a cyan light strip, vanishing point in the right third, dark center, 16:9.
```

**Prompt video**
```
[STYLE BIBLE] Start frame K2, end frame K3. The glass core breaks into soft light particles that settle into a long corridor of suspended glass panels. Smooth continuous tracking shot moving forward with a slight lateral drift to the right, eye level, steady speed. Reflections slide across the glossy floor. No cuts, no shake, no people, no text. 6 seconds, 24 fps, 16:9.
```

---

## Escena 4 — PROYECTOS · "The Gallery" (6 s)

**Rol en la web:** fondo del *Catálogo de sistemas*. Termina en una vista amplia y oscura para que las tarjetas (HTML) destaquen.

- **Inicio (K3):** corredor de paneles de la escena 3.
- **Final (K4):** gran sala oscura con **10 pantallas flotantes en arco**, vacías (solo brillo cian, sin contenido legible), a distintas alturas, niebla baja; el centro queda despejado.
- **Cámara:** dolly-in con un crane-up suave (sube ~1 m), terminando en plano abierto.
- **Iluminación:** cada pantalla emite un halo cian/azul; luz cenital tenue; niebla baja reflectando.
- **Composición:** arco simétrico, centro vacío y oscuro (aquí se leen las tarjetas HTML).

**Prompt imagen K4**
```
[STYLE BIBLE] Vast dark hall with ten empty floating rectangular glowing screens arranged in a wide symmetrical arc at different heights, each emitting a soft cyan and blue halo with no readable content, low mist on a glossy floor, clear dark empty center, 16:9.
```

**Prompt video**
```
[STYLE BIBLE] Start frame K3, end frame K4. The corridor opens into a vast dark hall as ten floating empty glowing screens arrange themselves into a wide arc. Smooth continuous dolly-in with a gentle crane-up rising about one meter, ending on a wide establishing shot. Low mist drifts across the floor. No cuts, no shake, no people, no text. 6 seconds, 24 fps, 16:9.
```

---

## Escena 5 — CONTACTO · "The Signal" (5 s)

**Rol en la web:** fondo de *Contacto*. Cierra la historia con calma y sensación de "enviar una señal".

- **Inicio (K4):** sala con las 10 pantallas.
- **Final (K5):** las pantallas se alejan; la cámara termina frente a un **haz de luz cian vertical** que sube al cielo nocturno estrellado desde un punto lejano en el horizonte; todo en calma, mucho espacio oscuro.
- **Cámara:** pull-back suave con tilt-up lento (de las pantallas al cielo), terminando casi estática.
- **Iluminación:** haz central cian con halo; estrellas finas; contraste suave, más aire que en las otras escenas.
- **Composición:** haz en el centro-derecha, horizonte bajo, 60 % de la imagen es cielo oscuro limpio.

**Prompt imagen K5**
```
[STYLE BIBLE] Calm night horizon with a single thin vertical cyan beam of light rising from a distant point into a clean starry dark sky, soft glow halo around the beam, low flat dark landscape with faint cyan reflection, beam slightly right of center, large empty dark sky, 16:9.
```

**Prompt video**
```
[STYLE BIBLE] Start frame K4, end frame K5. Slow smooth pull-back combined with a gentle tilt-up: the floating screens fade into distant points of light while the camera rises toward a calm starry sky and settles on a thin vertical cyan beam of light rising from the horizon. Motion decelerates to nearly still at the end. No cuts, no shake, no people, no text. 5 seconds, 24 fps, 16:9.
```

---

## Pipeline de importación (ya implementado)

1. Descargar los clips de Higgsfield a una carpeta cualquiera, p. ej. `client/tools/source/hero.mp4`.
2. Convertir (desde `client/`):
   ```
   npm run seq -- tools/source/hero.mp4 hero --frames 120
   npm run seq -- tools/source/about.mp4 about --frames 75
   npm run seq -- tools/source/experience.mp4 experience --frames 90
   npm run seq -- tools/source/projects.mp4 projects --frames 90
   npm run seq -- tools/source/contact.mp4 contact --frames 75
   ```
   Opciones: `--format webp|avif` (webp por defecto), `--quality 70`.
3. El script crea `public/sequences/<nombre>/` con:
   - `d/0001.webp…` (1280 px, escritorio) y `m/0001.webp…` (720 px, móvil)
   - `poster.webp` (imagen estática para modo reducido)
   - `manifest.json`
4. Nombres de escena que la web busca: `hero`, `about`, `experience`, `projects`, `contact`. Si una escena no existe, la web usa una escena **procedural** de respaldo (túnel de anillos y partículas), así que nada se rompe mientras llega el material.

## Presupuesto de peso (orientativo)

| Escena | Frames | Desktop (≈45 KB/f) | Móvil (≈14 KB/f) |
|--------|--------|--------------------|-------------------|
| Hero | 120 | ~5.4 MB | ~1.7 MB |
| About | 75 | ~3.4 MB | ~1.1 MB |
| Experience | 90 | ~4.0 MB | ~1.3 MB |
| Projects | 90 | ~4.0 MB | ~1.3 MB |
| Contact | 75 | ~3.4 MB | ~1.1 MB |

Solo el hero carga al entrar; las demás escenas se descargan cuando la sección está a ~1500 px de aparecer.
