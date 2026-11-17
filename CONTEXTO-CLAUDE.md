# 33r — Contexto del proyecto (para Daniel, Juan y para Claude)

Web oficial de **33r**, estudio de soluciones digitales de marketing y tecnología (Ambato, Ecuador · clientes en LatAm). Es nuestra carta de presentación: cada cliente la compara con lo que le podemos hacer a él.

## 1. Concepto: «Los fantasmas detrás de la máquina»
Los fundadores no somos protagonistas: somos presencias detrás de cada sistema. Los protagonistas son los negocios de los clientes.

- **Linterna espectral** (`src/scripts/spot.js`): en el hero la pantalla está en penumbra y un halo de luz revela fragmentos de mecánicas que construimos. Ratón → sigue el cursor. Táctil → sigue el dedo y además deriva sola. Giroscopio **opcional** (botón, pide permiso).
- **Presencias**: niebla ligera + estela del halo en canvas (`mist.js`), fragmentos con afterimage (CSS), texto que se **materializa** (blur → nítido), no entra deslizando.
- **Quiénes**: «Somos dos. Casi no nos verás.» Dos siluetas difusas que solo toman forma bajo el cursor/dedo.
- **Huevo de pascua**: escribir `33r` (o tocar el logo 3 veces) → el sitio se revela con la linterna 3 s y aparece un mensaje con CTA (`egg.js`; el lead queda con `source = easter-egg`).
- **REGLA: la magia nunca estorba.** Todo el contenido se lee con contraste AA **sin** linterna; ella solo intensifica (el titular y los textos van por encima de la capa oscura). Con `prefers-reduced-motion`: sin rAF, sin canvas, sin GSAP, halo fijo, siluetas tenues, todo visible. Verificado.

## 2. Titular (se evaluaron 3 versiones)
| # | Titular | Veredicto |
|---|---|---|
| 1 | **Una pantalla que vende. Otra que controla.** | **Elegido**: es la idea central, se entiende en 2 s y es memorable. |
| 2 | Primero lo ves funcionando. Después decides. | Fuerte, pero habla del proceso, no de lo que entregamos. Vive en «Por qué 33r» y en el CTA. |
| 3 | Detrás de cada negocio que crece hay un sistema que no se ve. | El más misterioso, pero abstracto en el primer pantallazo. |

Subtítulo elegido: *«Tu cliente ve una experiencia que lo hace comprar. Tú ves exactamente qué pasa en tu negocio. Antes de pagar, ves tu demo funcionando en tu celular.»*
Tono: seguro, preciso, con un toque de misterio. Sin clichés («soluciones integrales», «siguiente nivel», «apasionados»). Textos en `src/i18n/index.js` (ES y EN).

## 3. Paleta y por qué
| Token | Hex | Uso |
|---|---|---|
| Tinta | `#0A0A0C` | Fondo |
| Grafito | `#141418` | Superficies / tarjetas |
| Niebla | `#2A2A31` | Bordes / líneas |
| Hueso | `#EDEAE3` | Texto principal (más cálido que el blanco puro) |
| Ceniza | `#8E8C88` | Texto secundario |
| Ectoplasma | `#9CF6D4` | Acento: CTAs, halo, etiquetas |
| Aura | `#A99BFF` | Solo en degradado con el ectoplasma (momentos mágicos) |

Razonamiento: (1) un estudio que vende trabajo visual necesita un fondo **neutro** que haga brillar los proyectos de los clientes, no competir con ellos; (2) oscuro = misterio, foco, nivel premium; (3) **un solo acento** «espectral» para magia y CTAs, sin el neón morado cliché de tecnología. Proporción objetivo 90 % neutros · ~8 % hueso · ≤2 % acento. El degradado ectoplasma→aura solo aparece en el logo animado, el halo y el huevo de pascua.

**Contraste WCAG (medido):** Hueso/Tinta 16.5:1 · Hueso/Grafito 15.3:1 · Ceniza/Tinta 5.9:1 · Ceniza/Grafito 5.5:1 · Tinta sobre Ectoplasma (botones) 15.6:1 · Ectoplasma/Tinta 15.6:1 · Aura/Tinta 8.3:1. Todo ≥ AA (4.5:1). Niebla (1.4:1) solo para bordes decorativos. Se mantiene tu paleta: no encontré una alternativa más fuerte. Ajuste propio: la última línea del manifiesto usa `#B5B2AB` (9.4:1) en lugar de Ceniza para que la animación por scroll nunca baje del AA.

## 4. Tipografías
Display **Space Grotesk** (carácter geométrico, enorme) · Texto **Inter** · Detalles técnicos **JetBrains Mono** en mayúsculas pequeñas (etiquetas, métricas). Las tres libres (OFL), autoalojadas con `@fontsource-variable` (sin pedir fuentes a Google).

## 5. Logo (elegido: mezcla sobria de A + B)
Se exploraron 3 conceptos (`/logo-lab`): A Reflejo, B Trazo de luz, C Eco. Daniel pidió una mezcla **limpia y sobria**:
- **Reposo**: «33r» monolínea, quieto, con una chispa menta mínima en la r. Sin brillos ni ecos permanentes.
- **Entrada (de B)**: las letras se dibujan una vez con luz (`stroke-dasharray`) y el resplandor se apaga.
- **Momento mágico (de A)**: el primer 3 gira en Y, revela la simetría Ɛ3 (dos presencias que se miran) y vuelve. Una sola vez; se repite con hover/tap.
- **Marca compacta** (favicon, ícono de app, perfil de Instagram): los dos 3 espejados «Ɛ3» — a 16 px un «33r» completo no se lee.
- **C (Eco)** quedó descartado del logo (lo menos sobrio); sigue en `/logo-lab` como exploración.
Archivos: `src/lib/logo.js` (trazos, fuente única), `src/components/Logo.astro` (animado), `scripts/build-brand.mjs` (SVG estáticos) y `scripts/build-png.mjs` (PNG). Salidas en `public/brand/`: `33r-dark.svg`, `33r-light.svg`, `app-icon.svg/.png`, `apple-touch-icon.png`, `instagram-profile.svg/.png`, `public/favicon.svg`, `public/og.png`.

## 6. Stack (una línea de justificación)
**Astro** (HTML estático = Lighthouse y SEO, rutas por proyecto, i18n) + CSS propio con variables + **GSAP** (solo el manifiesto, cargado en idle) + canvas 2D ligero + SVG; Supabase por `fetch` (sin SDK); despliegue en **GitHub Pages** vía Actions.

## 7. Estructura del sitio
`/` y `/en/` (bilingüe, selector ES/EN): Hero → Manifiesto → «Vende/Controla» interactivo → Por qué 33r → Trabajo → Servicios → Cómo trabajamos → Industrias → Quiénes → Pide tu demo → Footer.
Más: `/trabajo/[slug]` y `/en/work/[slug]` (caso de estudio, plantilla única `src/lib/case.js`), `/admin` (privado, noindex), `/logo-lab` (noindex), `404.html`, `sitemap-index.xml`, `robots.txt`, `manifest.webmanifest`.

## 8. Datos del portafolio
Todo el portafolio vive en datos, no en el HTML. Capa única: `src/js/data.js` (async). Sin claves de Supabase usa `src/data/projects.seed.json`; con claves usa Supabase **sin tocar nada más**.

Campos de un proyecto: `slug, client, industry, solution_types[], country, city, year, status (en_vivo | caso_de_estudio | oculto), published (false = borrador), live_url, cover_url, video_url, star_mechanic, target_client, challenge, solution, mechanics[], results, metrics[{label,value}], screens{sell,control}, en{…traducciones}, sort_order, featured`.

- **Borradores**: `published: false`. NO aparecen en la web, ni se generan como página, ni entran al sitemap. Para revisarlos: `/?preview=1`.
- Industrias: `gastronomia, eventos, retail, salud, gobierno_tech, marca_propia`. Tipos: `landing, panel, fidelizacion, ecommerce, minijuego, a_medida`.
- **Proyectos publicados (leídos de sus sitios reales):** MockaBox (Mocka), Core Studio, Ficoa Beer Garden, Gorila Burgers, Luna Dental, Dogo y DIP. Capturas en `public/work/`. Los textos describen solo lo que cada sitio hace; no hay métricas inventadas. Todos son `kind: cliente`, `status: en_vivo`.
- **«Hecho a medida» (personalización visible):** cada proyecto tiene `signature` (título), `signature_text` y `accent` (color de marca del cliente). Se muestra en la tarjeta (chip con el color del cliente), en la sección **«Cada negocio, su propia pieza»** de la portada (lista editorial, se llena sola desde los datos) y en el caso de estudio. Rasgos: Mockabox → tarjeta Mocka (saldo propio y QR); Core Studio → Core Card con estrellas; Ficoa → Beer Club; Gorila → jeep del Gorila; Luna Dental → odontograma de primer nivel; Dogo → panel del dueño; DIP → juego 3D completo.
- **Dogo — panel:** está detrás de login; su contenido se leyó del código de `panel.html` (resumen, pedidos, compras con pronóstico de demanda, precios y márgenes, marketing con ROAS, clientes, equipo con roles dueño/equipo). Falta captura.
- **Luna Dental — odontograma:** NO es visible en el sitio público (no hay ruta ni código). Se publica según lo indicado por Daniel, sin detalles inventados. Falta captura o link.
- Nueva industria: `entretenimiento` (para DIP). El campo `gallery` admite imágenes extra («En acción»).
- Sigue como **borrador** (no público): `nutribites`. (La «plantilla dental» se reemplazó por Luna Dental.)
- Falta la captura de «la pantalla que controla» de cada uno: hoy se muestra un recuadro «captura pendiente».
- Los datos de contacto de esos negocios (WhatsApp, correo) **no** se copiaron a esta web.

### Agregar un proyecto en menos de 2 minutos
**Con Supabase (recomendado):** `/admin` → «+ Nuevo proyecto» → llena nombre, industria, tipo, mecánica estrella → sube la captura → marca «Publicado» → Guardar. Aparece en la web al instante (la página del caso se renderiza desde la base).
**Sin Supabase:** agrega un objeto a `src/data/projects.seed.json` (copia uno), pon `"published": true`, sube la imagen a `public/work/` y haz push.

## 9. Conectar Supabase (pendiente de las claves)
1. Crear proyecto en supabase.com. En **SQL Editor** pegar y ejecutar `supabase/schema.sql` (tablas `projects`, `project_media`, `leads`, `admins`, RLS y bucket `project-media`).
2. **Authentication → Users**: crear los usuarios de Daniel y Juan. Luego, en SQL: `insert into admins (email) values ('…'), ('…');` (solo esos correos entran al panel; la seguridad la impone RLS, no el código).
3. En GitHub → Settings → Secrets and variables → Actions → **Variables**: `PUBLIC_SUPABASE_URL` y `PUBLIC_SUPABASE_ANON_KEY` (la clave *anon/publishable* es pública por diseño; **nunca** pongas la `service_role`).
4. Re-ejecutar el despliegue. RLS: el público solo lee proyectos publicados e inserta leads; todo lo demás requiere usuario admin.
Leads: estado `nuevo → contactado → demo_enviada → ganado / perdido` (editable en `/admin`).

## 10. Analítica
`src/scripts/analytics.js` emite: `demo_cta_click`, `lead_submit`, `whatsapp_click`, `case_open`, `filter_change`, `easter_egg`. Para conectar la herramienta elegida: `src/config/site.js → analytics` (`plausible`, `umami` o `ga4` + ID). Hasta entonces no se carga ningún script de terceros.

## 11. SEO
Título y descripción por página, canonical + hreflang ES/EN, Open Graph/Twitter con `og.png`, JSON-LD `Organization`, sitemap. Keywords trabajadas en el copy: «desarrollo de landing pages en Ecuador», «sistema de fidelización para restaurantes», «CRM para negocios pequeños», «agencia de marketing digital Ambato» y equivalentes en EN.

## 12. Rendimiento (Lighthouse móvil, página principal)
Performance 97 · Accesibilidad 100 · Buenas prácticas 100 · SEO 100 (LCP ≈2.0 s, CLS 0, TBT ≈110 ms). Verificado sin scroll horizontal en 375, 390, 768, 1280 y 1920 px, y con `prefers-reduced-motion`.

## 13. Pendientes (lo que necesito de Daniel)
Ver la lista al final de la entrega: links y capturas de los proyectos, métricas reales, significado de «33r» (hoy el nombre habla solo, no se inventó nada), roles de Daniel y Juan, WhatsApp / email / Instagram / LinkedIn, dominio, herramienta de analítica, claves de Supabase.
