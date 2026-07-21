# Playbook — Referencia de formatos de imagen

Documento de referencia para el equipo de diseño. Lista cada contenedor de imagen usado en el sitio, con su relación de aspecto/dimensión exacta tal como está definida hoy en el CSS, y si varía por breakpoint. **Este documento es solo de referencia — no se modificó ningún archivo de código para generarlo.**

Todas las imágenes usan `object-fit:cover` (o, en el caso del logo, `width:auto`), así que el recorte siempre es central salvo que se indique `object-position` distinto.

## Resumen

| # | Contenedor | Dónde aparece | Relación/tamaño | ¿Varía por breakpoint? |
|---|---|---|---|---|
| 1 | Foto del destacado (hero) | Artículo principal en Noticias | `16:10` | No |
| 2 | Banner TFBR (opinión) | Tarjeta "The Futbol Business Review" en Artículos de opinión | Alto fijo `110px` (ancho 100%) | No |
| 3 | Banner de producto | Tarjetas de Productos editoriales | Alto fijo `74px` (ancho 100%) | No |
| 4 | Video destacado | Video Playbook, panel grande | `16:9` | No |
| 5 | Clip de video (chico) | Video Playbook, fila de clips | `4:5` | No |
| 6 | Tarjeta Infinitas destacada | Infinitas, columna principal | `16:10` | No |
| 7 | Tarjeta Infinitas lateral | Infinitas, columna secundaria | `16:6.4` | No |
| 8 | Visual "Al Banquillo" | Sección Acerca de | `16:9` | No |
| 9 | Logo (header) | Encabezado, marca | Alto fijo, ancho automático | **Sí** — ver detalle abajo |
| 10 | Logo (footer) | Pie de página | Alto fijo `34px` | No |

---

## Detalle por contenedor

### 1. Foto del destacado (hero / lead story)
- **Selector:** `.lead-photo` / `.lead-photo img`
- **Archivo:** `css/hero.css:13-14`
- **Relación de aspecto:** `16 / 10`
- **Comportamiento:** `object-fit:cover`; al pasar el cursor (o focus) sobre toda la tarjeta, la imagen hace zoom suave a `scale(1.03)` (`css/hero.css:15`).
- **Breakpoints:** ninguno — la relación de aspecto se mantiene igual en mobile y desktop; solo cambia el layout general de la columna (`.news-grid` pasa de 2 columnas a 1 columna debajo de 920px, `css/responsive.css:29`), no el recorte de la imagen.

### 2. Banner TFBR (tarjeta de opinión con imagen)
- **Selector:** `.opinion-card.tfbr img`
- **Archivo:** `css/sections.css:11`
- **Dimensión:** alto fijo `110px`, ancho `100%` (no usa `aspect-ratio`, sino `height` fija — la relación real depende del ancho de la columna en cada momento).
- **Comportamiento:** zoom `scale(1.03)` en hover (`css/sections.css:12`).
- **Breakpoints:** ninguno explícito para esta imagen; la columna donde vive pasa de 3 a 1 columna debajo de 920px (`.opinion-grid`, `css/responsive.css:33`), lo que angosta el contenedor y por tanto cambia la relación de aspecto visual aunque el alto en px se mantenga igual.

### 3. Banner de producto
- **Selector:** `.product-banner`
- **Archivo:** `css/sections.css:25`
- **Dimensión:** alto fijo `74px`, ancho `100%`.
- **Nota:** el formato "sin imagen" (`.product-mark`, glifo + texto) usa el mismo alto de `74px` para mantener alineación entre tarjetas con y sin imagen.
- **Breakpoints:** ninguno explícito; la grilla de 4 columnas pasa a 1 columna debajo de 920px (`css/responsive.css:33`).

### 4. Video destacado (panel grande)
- **Selector:** `.video-feature-card .frame` (contiene un `<iframe>`)
- **Archivo:** `css/sections.css:51-52`
- **Relación de aspecto:** `16 / 9`
- **Breakpoints:** ninguno — el layout de 2 columnas (video + copy) pasa a 1 columna debajo de 920px (`.video-top`, `css/responsive.css:36`), pero la relación de aspecto del frame no cambia.

### 5. Clip de video (formato chico, fila de 4)
- **Selector:** `.clip-card .frame`
- **Archivo:** `css/sections.css:66-67`
- **Relación de aspecto:** `4 / 5` (vertical, formato tipo Reels/Shorts)
- **Comportamiento:** zoom `scale(1.05)` en hover/focus (`css/sections.css:68`).
- **Breakpoints:** la grilla de 4 columnas (`.clips-row`) pasa a 2 columnas debajo de 920px y a 1 columna debajo de 520px (`css/responsive.css:37,46`) — la relación de aspecto de cada clip individual no cambia, solo cuántos caben por fila.

### 6. Tarjeta Infinitas destacada
- **Selector:** `.inf-card` (dentro de `.infinitas-wrap`, columna principal)
- **Archivo:** `css/sections.css:82`
- **Relación de aspecto:** `16 / 10`
- **Comportamiento:** imagen de fondo (`.inf-bg`) con zoom `scale(1.04)` en hover/focus (`css/sections.css:85`); overlay de texto con gradiente oscuro sobre la parte inferior.
- **Breakpoints:** el layout de 2 columnas (`1.4fr / 1fr`) pasa a 1 columna debajo de 920px (`css/responsive.css:36`); la relación de aspecto de la tarjeta en sí no cambia.

### 7. Tarjeta Infinitas lateral
- **Selector:** `.inf-side .inf-card`
- **Archivo:** `css/sections.css:91`
- **Relación de aspecto:** `16 / 6.4` (más ancha/baja que la destacada — formato tipo "banner horizontal")
- **Breakpoints:** ninguno explícito además del cambio de columna ya descrito arriba.

### 8. Visual "Al Banquillo" (sección Acerca de)
- **Selector:** `.about-visual` / `.about-visual img`
- **Archivo:** `css/sections.css:116-117`
- **Relación de aspecto:** `16 / 9`
- **Comportamiento:** zoom `scale(1.02)` en hover/focus (`css/sections.css:118`); overlay con gradiente + badge de texto sobrepuesto en la esquina inferior.
- **Breakpoints:** el layout de 2 columnas (`.about-card`) pasa a 1 columna debajo de 920px (`css/responsive.css:36`); la relación de aspecto de la imagen no cambia.

### 9. Logo — header (única imagen con variación real por breakpoint)
- **Selector:** `.brand img`
- **Archivo:** `css/header.css:8` (base), `css/header.css:6` (estado scrolled), `css/responsive.css:8-9,47-48` (mobile)
- **Dimensiones por estado:**

| Estado | Alto | Ancho |
|---|---|---|
| Desktop, sin scroll | `64px` | auto |
| Desktop, con scroll (`.is-scrolled`) | `48px` | auto |
| Mobile (≤920px), sin scroll | `38px` | auto |
| Mobile (≤920px), con scroll | `38px` | auto |
| Mobile chico (≤520px), cualquier scroll | `32px` | auto |

- **Nota:** es el único contenedor de imagen de todo el sitio con overrides responsivos reales — todos los demás mantienen su relación de aspecto fija en cualquier tamaño de pantalla.

### 10. Logo — footer
- **Selector:** `.footer-brand img`
- **Archivo:** `css/sections.css:134`
- **Dimensión:** alto fijo `34px`, ancho auto. Aplica `filter:brightness(0) invert(1)` para mostrarlo en blanco sobre el fondo oscuro del footer.
- **Breakpoints:** ninguno.

---

## Hallazgos para diseño

- **Ningún formato de imagen editorial (hero, opinión, producto, video, Infinitas, Acerca de) cambia de relación de aspecto entre mobile y desktop.** Solo cambia cuántas columnas caben por fila. Si el equipo de diseño quiere un recorte distinto en mobile (por ejemplo, más cuadrado para que la cara del sujeto no se corte en pantallas angostas), hoy no existe ningún mecanismo para eso — habría que añadirlo.
- El **logo** es el único elemento con dimensiones responsivas ya resueltas.
- Dos formatos (`.opinion-card.tfbr img`, `.product-banner`) usan **alto fijo en píxeles** en lugar de `aspect-ratio` — su relación visual real varía según el ancho de columna disponible, a diferencia de los demás que fijan la proporción explícitamente.

## Resuelto en la migración a Next.js (Fases 2-3)

- **Imagen del artículo en `/articulo`**: resuelto reutilizando `.lead-photo`
  (`16:10`), como se recomendaba arriba — ver `app/(public)/articulo/page.tsx`
  y `components/article/LeadStory.tsx` (esta última usada en la portada, la
  primera en la página de artículo individual). Ambas llevan además
  `width={1200} height={750}` explícitos en el `<img>` desde la Fase 5
  (checkpoint 4) — no cambia nada visualmente (el contenedor ya reserva el
  espacio vía `aspect-ratio`), es solo una señal explícita adicional para
  el navegador, consistente con el resto de imágenes editoriales del sitio.
- **Miniaturas en `/archivo`**: se decidió no agregar imagen a las filas de
  artículo (`components/article/NewsRow.tsx`) — se mantiene el mismo
  formato sin imagen que legacy tenía en `.news-row`.
