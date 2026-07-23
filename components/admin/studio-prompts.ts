// Contenido estático del Studio (Fase 8B): la biblioteca de prompts que el
// equipo copia y pega en su propia sesión de Claude. Nada de aquí llama a
// ninguna API; es texto de referencia. Mantenerlo alineado con:
// - .claude/skills/publish-newsletter/SKILL.md (flujo real de publicación)
// - components/admin/tabs/ArticlesTab.tsx (orden exacto de los campos)
// - lib/taxonomy.ts (valores exactos de las etiquetas, no inventar)

// Bloque de voz compartido: se repite dentro de cada prompt a propósito,
// para que cada uno funcione pegado solo, sin contexto previo.
const VOZ = `Voz Playbook: directa, analítica, con autoridad. Español de México (tuteo). Sin relleno, sin sensacionalismo, sin lenguaje de nota de prensa. Siempre que aplique, cierra con el ángulo México/LATAM. Nunca uses la raya larga (el carácter "—"): usa comas, puntos, paréntesis o "y"/"pero".`;

const TAXONOMIA = `Etiquetas permitidas (exactas, no inventes otras):
- Alcance: Nacional, Internacional
- Deporte: Fútbol, Liga MX, NFL, NBA, Béisbol, Tenis, Golf, F1, Olímpico, Multi-deporte / Otros
- Vertical de negocio: Gobernanza y Regulación, Derechos de TV y Streaming, Fusiones y Adquisiciones, Patrocinios, Infraestructura y Venues, Sedes y Eventos, Finanzas y Negocio, Private Equity e Inversiones, Mercadotecnia Deportiva, Gestión de Talento, Audiencias y Consumo, Fan Experience, Naming Rights`;

const IMPORTANCIA = `Importancia (1 a 5, escala objetiva):
- 5 = historia regulatoria, estructural o de negocio mayor, específica de México/LATAM
- 4 = historia internacional grande con implicación clara para LATAM o para el negocio
- 3 = interesante pero secundaria: tendencia global, movimiento de plataforma, lanzamiento
- 2 = actualización breve: seguimiento, nicho, sin ángulo fuerte de opinión
- 1 = menor, casi no se usa`;

export type StudioPrompt = { title: string; description: string; prompt: string };
export type StudioSection = { key: string; title: string; description: string; prompts: StudioPrompt[] };

export const STUDIO_SECTIONS: StudioSection[] = [
  {
    key: 'newsletter-publish',
    title: '1 · Publicación de newsletter',
    description:
      'Convierte una edición de Substack (Industry Shots, La Lana del Mundial, Infinitas) en artículos del portal. Requiere una sesión de Claude Code dentro del repo Playbook-portal, porque usa el skill publish-newsletter y la base de datos de producción.',
    prompts: [
      {
        title: 'Publicación directa (sin revisión)',
        description:
          'El flujo automático completo: lee la edición, redacta cada nota y la publica en vivo. Úsalo solo cuando de verdad quieras publicar sin revisar.',
        prompt: `Usa el skill publish-newsletter con estos enlaces de Substack:

[PEGA AQUÍ UNO O MÁS ENLACES]

Procesa cada edición completa (cada historia es un artículo aparte) y publícalos directo, sin paso de revisión, como indica el skill. Al final dame el resumen por artículo: título, id y URL en vivo, y avísame si alguno salió como duplicate.`,
      },
      {
        title: 'Con revisión antes de publicar',
        description:
          'El mismo flujo pero en dos tiempos: primero borradores completos para revisar, y solo se publica lo que apruebes.',
        prompt: `Usa el skill publish-newsletter con estos enlaces de Substack:

[PEGA AQUÍ UNO O MÁS ENLACES]

Haz solo la parte de lectura y redacción (pasos 1 a 3 del skill): muéstrame cada borrador completo con todos sus campos (título, extracto, teaser, cuerpo, etiquetas, importancia, destacado, fechas, URLs). NO publiques nada todavía. Cuando te diga cuáles quedan aprobados (y con qué ajustes), publica únicamente esos con el paso 5 del skill y dame el resumen por artículo: título, id y URL en vivo.`,
      },
    ],
  },
  {
    key: 'articles',
    title: '2 · Artículos',
    description:
      'Redacta un artículo listo para capturar en la pestaña Artículos de este panel, con todos los campos en el mismo orden del formulario.',
    prompts: [
      {
        title: 'Artículo desde una URL externa',
        description:
          'Pasa cualquier nota de otro medio y devuelve el artículo Playbook completo, campo por campo, listo para pegar en la pestaña Artículos.',
        prompt: `Redacta un artículo de Playbook (medio de negocio del deporte para México/LATAM) a partir de esta fuente:

[PEGA AQUÍ LA URL O EL TEXTO DE LA NOTA]

${VOZ}

Estructura del cuerpo en dos capas: primero el hecho (qué pasó, quién, los números clave, contexto de la fuente) y al final un párrafo que empiece con "Opinión de Playbook:" (qué significa para la industria, con ángulo México/LATAM cuando aplique). Largo: 150 a 300 palabras. Formato del cuerpo: prosa con negritas y subtítulos "##" si hacen falta, nunca HTML.

Devuélveme los campos EN ESTE ORDEN, con el mismo nombre que usa el panel:
1. Título (en español, informativo, sin clickbait)
2. ID (el título en minúsculas y con guiones, sin acentos)
3. Extracto (1 o 2 frases de gancho para la tarjeta del feed)
4. Resumen en texto plano (1 a 3 frases sin formato, para RSS)
5. Teaser del muro de registro (1 o 2 frases que dejen con ganas de seguir leyendo, sin regalar la nota)
6. Cuerpo del artículo (ver arriba)
7. Autor (vacío salvo que haya un byline real) y Mostrar autor (apagado por defecto)
8. Publicación y Fuente (Noticias/industry-shots, La Lana del Mundial/la-lana, Infinitas/infinitas, o Playbook/playbook)
9. Alcance, Deporte y Vertical de negocio, usando solo la taxonomía de abajo
10. Fecha (AAAA-MM-DD) y Fecha en texto (ej. "23 jul 2026")
11. Tiempo de lectura (1 breve, 2 estándar, 3 largo)
12. Importancia (escala de abajo)
13. Destacado (solo si es LA historia del día, normalmente no)
14. Enlace en Substack (si existe; si no, vacío)
15. Imagen (vacío salvo Importancia 5; si es 5, sugiere una búsqueda concreta de foto libre en Unsplash, sin inventar URLs)

${TAXONOMIA}

${IMPORTANCIA}`,
      },
    ],
  },
  {
    key: 'social',
    title: '3 · Redes sociales',
    description: 'Convierte un artículo ya publicado en piezas para X, LinkedIn e Instagram.',
    prompts: [
      {
        title: 'Hilo para X',
        description: 'De 5 a 8 tuits a partir de un artículo, con gancho fuerte y cierre con enlace.',
        prompt: `Convierte este artículo de Playbook en un hilo para X (Twitter):

[PEGA AQUÍ LA URL O EL TEXTO DEL ARTÍCULO]

${VOZ}

Reglas del hilo:
- 5 a 8 tuits, cada uno de máximo 270 caracteres.
- Tuit 1: el dato o la tensión más fuerte de la historia, sin "hilo 🧵" ni fórmulas gastadas.
- Un dato o idea por tuit; los números concretos valen más que los adjetivos.
- Penúltimo tuit: la lectura de Playbook (qué significa para la industria, ángulo México/LATAM si aplica).
- Último tuit: invitación sobria a leer el artículo completo + [URL DEL ARTÍCULO].
- Sin hashtags, salvo uno muy natural si de verdad suma.

Devuelve los tuits numerados, listos para copiar.`,
      },
      {
        title: 'Post de LinkedIn',
        description: 'Un post profesional para la audiencia de negocio, con espacio para conversación.',
        prompt: `Convierte este artículo de Playbook en un post de LinkedIn:

[PEGA AQUÍ LA URL O EL TEXTO DEL ARTÍCULO]

${VOZ}

Reglas del post:
- 120 a 200 palabras, párrafos cortos (1 a 2 líneas), sin muro de texto.
- Primera línea: el dato o la pregunta que obliga a dar clic en "ver más".
- Desarrolla una sola idea de negocio (no resumas todo el artículo).
- Cierra con una pregunta genuina a la audiencia de industria y el enlace: [URL DEL ARTÍCULO].
- Sin emojis en cadena (máximo uno, si de verdad ayuda) y sin hashtags de relleno (máximo 3, específicos).`,
      },
      {
        title: 'Carrusel de Instagram',
        description: 'Guion de 6 a 8 láminas con texto por lámina y pie del post.',
        prompt: `Convierte este artículo de Playbook en un carrusel de Instagram:

[PEGA AQUÍ LA URL O EL TEXTO DEL ARTÍCULO]

${VOZ}

Reglas del carrusel:
- 6 a 8 láminas. Por cada una devuelve: TITULAR (máximo 8 palabras) y APOYO (máximo 20 palabras).
- Lámina 1: el gancho (el número o la tensión más fuerte).
- Láminas intermedias: un dato o idea por lámina, en orden lógico.
- Penúltima lámina: "La lectura de Playbook" con la opinión editorial.
- Última lámina: cierre con llamado a leer el artículo completo (enlace en bio).
- Pie del post: 2 o 3 frases + máximo 5 hashtags específicos del negocio del deporte.`,
      },
    ],
  },
  {
    key: 'research',
    title: '4 · Investigación y preparación',
    description: 'Trabajo previo: briefs de investigación y preparación de entrevistas.',
    prompts: [
      {
        title: 'Brief de artículo',
        description: 'Investigación previa para una historia: contexto, datos, actores y ángulos posibles.',
        prompt: `Prepara un brief de investigación para un posible artículo de Playbook (negocio del deporte, México/LATAM) sobre este tema:

[DESCRIBE AQUÍ EL TEMA O PEGA UN ENLACE DETONADOR]

${VOZ}

Estructura del brief:
1. La historia en una frase: qué está pasando y por qué importa ahora.
2. Contexto esencial: qué pasó antes, en 5 puntos máximo.
3. Los números: cifras concretas y verificables (monto, audiencia, contratos), cada una con su fuente.
4. Actores: quién gana, quién pierde, quién decide.
5. Ángulo México/LATAM: la conexión concreta con el mercado local (si no la hay, dilo).
6. Tres ángulos editoriales posibles, del más obvio al más propio de Playbook.
7. Qué falta confirmar antes de escribir (y dónde buscarlo).

Marca claramente cualquier dato que no puedas verificar. No inventes cifras ni declaraciones.`,
      },
      {
        title: 'Preparación de entrevista',
        description: 'Perfil del entrevistado, contexto de negocio y batería de preguntas.',
        prompt: `Prepárame una entrevista de Playbook (medio de negocio del deporte, México/LATAM) con esta persona:

[NOMBRE, CARGO Y ORGANIZACIÓN + ENLACES SI TIENES]

${VOZ}

Devuélveme:
1. Perfil en 5 líneas: trayectoria, cargo actual, por qué es relevante ahora.
2. El contexto de negocio: los 3 temas de su organización/industria donde hay historia (con datos).
3. 10 a 12 preguntas en tres bloques: apertura (2 o 3 para entrar en confianza), núcleo (6 o 7 sobre el negocio, ordenadas de lo concreto a lo estratégico), cierre (2 que solo esta persona puede responder).
4. Las 2 o 3 repreguntas probables: qué va a evadir y cómo insistir con elegancia.
5. Qué NO preguntar (lo trillado que ya respondió en todas partes, con enlaces si los encuentras).

Preguntas concretas y con números cuando se pueda; nada de "¿cómo ves el futuro del deporte?".`,
      },
    ],
  },
  {
    key: 'weekly',
    title: '5 · Newsletter semanal',
    description: 'El digest editorial de la semana a partir de lo ya publicado.',
    prompts: [
      {
        title: 'Digest semanal desde lista de títulos',
        description: 'Pasa la lista de títulos/enlaces de la semana y arma la edición completa.',
        prompt: `Arma la edición semanal de la newsletter de Playbook a partir de estas notas publicadas esta semana:

[PEGA AQUÍ LA LISTA: UN TÍTULO + ENLACE POR LÍNEA]

${VOZ}

Estructura de la edición:
1. Asunto del correo: máximo 60 caracteres, concreto, sin clickbait. Da 3 opciones.
2. Apertura (60 a 90 palabras): el hilo conductor de la semana, no un índice.
3. De 5 a 7 bloques, uno por historia, en orden de importancia editorial (no cronológico). Cada bloque: titular propio (puede diferir del original), 2 o 3 frases con el hecho y POR QUÉ IMPORTA, y el enlace.
4. "El número de la semana": una cifra de las notas con una línea de lectura.
5. Cierre (2 o 3 frases): qué mirar la próxima semana.

Si una nota no aporta a la narrativa de la semana, dilo y déjala fuera en vez de forzarla.`,
      },
    ],
  },
  {
    key: 'base',
    title: '6 · Playbook Base',
    description: 'Contenido evergreen: el diccionario del negocio del deporte y explainers de fondo.',
    prompts: [
      {
        title: 'Entrada de diccionario',
        description: 'Define un término del negocio del deporte con ejemplo LATAM.',
        prompt: `Escribe una entrada del diccionario de Playbook Base (contenido evergreen del negocio del deporte) para este término:

[TÉRMINO, ej. "naming rights", "fee de expansión", "salary cap"]

${VOZ}

Estructura:
1. Definición en una frase (que se entienda sin saber finanzas).
2. Cómo funciona: 2 o 3 párrafos cortos con la mecánica real del negocio (quién paga, quién cobra, plazos y órdenes de magnitud típicos).
3. Por qué importa: qué decisiones de la industria se explican con este concepto.
4. El ejemplo LATAM: un caso real de México o América Latina (si no existe, el caso global más citado y por qué aún no llega a la región).
5. Términos relacionados: 3 a 5, solo la lista.

Largo total: 250 a 400 palabras. Es contenido evergreen: nada de "esta semana" ni referencias que caduquen en un mes.`,
      },
      {
        title: 'Explainer evergreen',
        description: 'Una pieza de fondo que responde una pregunta estructural de la industria.',
        prompt: `Escribe un explainer evergreen de Playbook Base sobre esta pregunta:

[PREGUNTA, ej. "¿Cómo se reparten los derechos de TV en la Liga MX?", "¿Qué es el multi-club ownership?"]

${VOZ}

Reglas:
- 500 a 800 palabras, con subtítulos "##" cada 2 o 3 párrafos.
- Empieza por la respuesta corta (3 o 4 frases): alguien con prisa se lleva lo esencial del primer bloque.
- Después el desarrollo: la mecánica, los actores, los números estructurales (rangos y proporciones que envejezcan bien, no cifras de la semana).
- Un bloque "El caso mexicano/LATAM" con la especificidad local.
- Cierra con "Lo que hay que vigilar": las 2 o 3 variables que podrían cambiar esta respuesta en los próximos años.
- Marca todo dato que necesite verificación antes de publicar. No inventes cifras.`,
      },
    ],
  },
];
