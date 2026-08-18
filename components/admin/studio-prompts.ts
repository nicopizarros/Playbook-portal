// Contenido estático de la Guía (/admin/guia, movida fuera del CMS central
// en la redada de Fase 9 — antes vivía como pestaña "Studio"). La parte de
// arriba (StudioTab.tsx) es tutorial real, paso a paso; esto de aquí es solo
// lo que sobra sin un skill dedicado: la biblioteca de prompts que el equipo
// copia y pega en su propia sesión de Claude. Nada de aquí llama a ninguna
// API; es texto de referencia. Mantenerlo alineado con:
// - .claude/skills/publish-newsletter/SKILL.md y publish-sourced-article/SKILL.md (flujos reales)
// - components/admin/tabs/ArticlesTab.tsx (orden exacto de los campos)
// - lib/taxonomy.ts (valores exactos de las etiquetas, no inventar)

// Bloque de voz compartido: se repite dentro de cada prompt a propósito,
// para que cada uno funcione pegado solo, sin contexto previo. (Actualizado
// 2026-08-13 con la guía editorial: la conexión regional dejó de ser un
// cierre por defecto — entra solo cuando es concreta.)
const VOZ = `Voz Playbook: natural, directa y con criterio propio. Español de México (tuteo). Tono de brief de negocios, no de alerta de última hora. Sin relleno, sin sensacionalismo, sin lenguaje de nota de prensa. La conexión México/LATAM no es obligatoria: entra solo cuando hay actor, mercado, capital, sede, audiencia o consecuencia regional concreta, nunca como cierre forzado. Nunca uses la raya larga (el carácter "—"): usa comas, puntos, paréntesis o "y"/"pero".`;

// Núcleo editorial compartido (guía 2026-08-13): cómo piensa y escribe
// Playbook. Se interpola en los prompts de redacción para que la voz no
// dependa de muletillas sino del método.
const NUCLEO = `ESTÁS ESCRIBIENDO PARA PLAYBOOK

Playbook es un medio especializado en sports business con foco en México y Latinoamérica. Explica el negocio que existe alrededor del deporte: dinero, derechos, medios, inversión, propiedad, audiencias, patrocinios, distribución, datos, infraestructura, entretenimiento, tecnología y gobernanza.

CÓMO PIENSA PLAYBOOK
Busca la historia detrás del anuncio.

MOVIMIENTO: qué ocurrió.
MECANISMO: cómo funciona realmente el acuerdo, operación, modelo o decisión.
INCENTIVO: por qué los involucrados lo están haciendo.
CONSECUENCIA: qué cambia, quién gana o pierde algo y qué puede ocurrir después.

Busca especialmente estas palancas cuando sean relevantes: control, propiedad, captura de valor, inventario, margen, distribución, relación directa con el fan, riesgo, negociación, gobernanza y poder.

CÓMO ESCRIBE PLAYBOOK
Escribe de manera natural, directa y segura. El tono es el de alguien que conoce la industria y explica el negocio a otro profesional inteligente; no el de un académico, un consultor ni un comunicado corporativo.

Los párrafos son golpes, no contenedores: una sola idea principal por párrafo.

Abre con el movimiento o la tensión. No empieces con "En los últimos años" ni fórmulas generales. Pon pronto el dato fuerte: dinero, porcentaje, plazo, valuación, audiencia, participación, derechos o consecuencia.

La tensión viene de los hechos. No dramatices artificialmente.

EVITA (fórmulas intercambiables): "confirma una tendencia", "el mensaje es claro", "marca la ruta", "el verdadero examen", "más allá de la anécdota", "la pregunta ya no es", "no solo X, sino Y", "este caso demuestra que", "para México y Latinoamérica esto representa". La estructura "no es X, es Y" puede aparecer máximo una vez y solo si expresa la tesis con precisión; cero también está bien.

DATOS E INTERPRETACIÓN
Distingue hecho confirmado, información reportada por terceros, interpretación de Playbook y escenario posible. Una inferencia nunca se escribe como hecho.

ARITMÉTICA
Haz una cuenta cuando la cuenta revele el negocio. Evítala si solo luce análisis.

OPINIÓN
La Opinión de Playbook debe agregar una segunda capa. Si podría usarse debajo de otra noticia cambiando únicamente los nombres, todavía no está lista.`;

const TAXONOMIA = `Etiquetas permitidas (exactas, no inventes otras):
- Alcance: Nacional, Internacional
- Deporte: Fútbol, Liga MX, NFL, NBA, Béisbol, Tenis, Golf, F1, Olímpico, Multi-deporte / Otros
- Vertical de negocio: Gobernanza y Regulación, Derechos de TV y Streaming, Fusiones y Adquisiciones, Patrocinios, Infraestructura y Venues, Sedes y Eventos, Finanzas y Negocio, Private Equity e Inversiones, Mercadotecnia Deportiva, Gestión de Talento, Audiencias y Consumo, Fan Experience, Naming Rights

En Deporte, usa la etiqueta más específica que aplique antes de caer en una genérica: si la nota es sobre la competencia Liga MX en sí (sus reglas, sus clubes en conjunto), usa "Liga MX", no "Fútbol". Si la nota es de un solo deporte con etiqueta propia (béisbol, tenis, golf, F1, olímpico), usa esa etiqueta, no "Multi-deporte / Otros" — ese bucket es solo para notas genuinamente multi-deporte o sin etiqueta propia.`;

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
    key: 'articles',
    title: '1 · Artículos',
    description:
      'El sistema editorial completo (guía 2026-08-13): primero clasifica la historia (A/B/C/D), después redacta con el núcleo Playbook y el prompt del formato, y al final audita con el editor. Úsalo cuando NO tengas una sesión de Claude Code a mano — dentro de Claude Code, el skill publish-sourced-article recorre este mismo sistema de punta a punta (clasifica, cruza fuentes, cita todo, pide tu aprobación y publica), ver la sección de arriba.',
    prompts: [
      {
        title: '01 · Router editorial: decidir A / B / C / D',
        description:
          'Antes de escribir una sola línea: qué clase de pieza es. La profundidad define el formato; los gráficos son consecuencia, no criterio.',
        prompt: `Actúa como editor de Playbook, medio especializado en sports business con foco en México y Latinoamérica.

Antes de escribir, analiza la información disponible y determina qué formato editorial corresponde.

A · NOTICIA BREVE
La historia necesita principalmente informar qué pasó. El protagonista, dato, monto, socio, plazo o consecuencia inmediata explican por sí mismos su relevancia. No necesita una Opinión de Playbook.

B · NOTICIA PLAYBOOK
Además de contar qué pasó, existe una segunda capa concreta de negocio que vale la pena explicar: control, dinero, propiedad, distribución, audiencia, riesgo, negociación, inventario, gobernanza o poder.

C · DEEP DIVE
La pieza sigue siendo news-driven: parte de un acontecimiento concreto, pero para entenderlo hacen falta varias cifras, actores, comparaciones, antecedentes, cálculos o mecanismos.

D · LA LANA DEL DEPORTE
Existe una pregunta de industria que merece una investigación completa. La noticia puede ser el punto de partida, pero la pieza no se construye aquí: La Lana tiene su flujo propio.

Lo que NO debe definir el formato: que tengamos mucho research disponible, que existan varias cifras o links, que podamos hacer una gráfica atractiva, o que una historia internacional se quiera "aterrizar" a México.

Aquí está la información:

[PEGA AQUÍ LA URL O EL TEXTO DE LA NOTA]

Devuelve:
FORMATO:
RAZÓN:
PREGUNTA CENTRAL:
PALANCA DE NEGOCIO PRINCIPAL:
DATOS QUE FALTAN:`,
      },
      {
        title: '02 · Núcleo común: cómo piensa y escribe Playbook',
        description:
          'La cabeza editorial compartida por todos los formatos. Pégalo antes del prompt del formato cuando trabajes fuera de Claude Code.',
        prompt: NUCLEO,
      },
      {
        title: '03 · A: Noticia breve',
        description: 'Informar rápido qué pasó. 100 a 180 palabras, sin Opinión de Playbook y sin subtítulos.',
        prompt: `${NUCLEO}

FORMATO: NOTICIA BREVE

OBJETIVO
Informar rápidamente una noticia relevante para alguien interesado en sports business. No intentes encontrar una gran tesis si la historia no la necesita.

EXTENSIÓN
Referencia: 100 a 180 palabras. No rellenar para alcanzar una cifra.

ESTRUCTURA
TITULAR: corto, directo y noticioso. Preferentemente protagonista + movimiento + cifra, socio o consecuencia.

PÁRRAFO 1: qué ocurrió + dato principal.
PÁRRAFO 2: contexto mínimo para entender escala o relevancia.
Puede existir un tercero solo si añade un dato indispensable.

NO INCLUIR
Opinión de Playbook separada. Moraleja. Conclusión general sobre la industria. Conexión artificial con México o Latinoamérica. Subtítulos. Material gráfico salvo que una cifra excepcional lo justifique.

CRITERIO FINAL
El lector debe poder responder rápido: ¿qué pasó?, ¿quién está involucrado?, ¿cuánto / por cuánto tiempo / qué derechos?, ¿por qué vale la pena saberlo?

Aquí está la información:

[PEGA AQUÍ LA URL O EL TEXTO DE LA NOTA]`,
      },
      {
        title: '04 · B: Noticia Playbook',
        description: 'La noticia y su lectura de negocio. 250 a 500 palabras, con Opinión de Playbook.',
        prompt: `${NUCLEO}

FORMATO: NOTICIA PLAYBOOK

OBJETIVO
Contar una noticia y explicar una lectura de negocio concreta detrás del movimiento. Entregar una segunda capa sin convertirla en análisis largo.

EXTENSIÓN
Referencia: 250 a 500 palabras. No alargues una noticia solo para alcanzar la extensión.

ANTES DE ESCRIBIR
Identifica movimiento, mecanismo, incentivo, consecuencia y una palanca de negocio principal. Elige una sola lectura editorial fuerte; no intentes explicar todas las implicaciones posibles.

ESTRUCTURA
TITULAR: comunica claramente el movimiento; puede sumar cifra o consecuencia si aumenta el interés.

APERTURA: empieza por lo que acaba de pasar. El dato fuerte aparece pronto.

DESARROLLO: normalmente tres a cinco movimientos. Cada bloque aporta algo nuevo: mecanismo, dinero, actor, antecedente, comparación o consecuencia. Cada movimiento abre con una entrada corta en negritas específica de ese bloque (ej. "**Por qué se cayeron las multas:**"), nunca etiquetas genéricas reutilizables como "El movimiento", "La mecánica", "El contexto" o "El impacto". La lógica puede repetirse; los encabezados no.

OPINIÓN DE PLAYBOOK
Uno o dos párrafos cortos que empiecen con "**Opinión de Playbook:**". Debe identificar algo que no estaba escrito explícitamente en el anuncio: qué activo se monetiza, quién gana o pierde control, qué ingreso se compromete, dónde quedó el riesgo, por qué ocurre ahora, qué capacidad obtiene el protagonista o qué podría cambiar después. No repetir la noticia. No convertirla en una recomendación genérica para toda la industria.

MATERIAL GRÁFICO
Opcional y ligero: cifra destacada, comparativo, timeline o diagrama sencillo si realmente ayuda a entender la operación.

CRITERIO FINAL
La pieza debe responder: ¿qué pasó? y, además, ¿qué significa realmente?

Aquí está la información:

[PEGA AQUÍ LA URL O EL TEXTO DE LA NOTA]`,
      },
      {
        title: '05 · C: Deep Dive',
        description: 'Desarmar el negocio detrás de una noticia importante. 700 a 1,200 palabras, 4 a 7 secciones.',
        prompt: `${NUCLEO}

FORMATO: PLAYBOOK DEEP DIVE

OBJETIVO
Desarmar el negocio detrás de una noticia importante. Es news-driven: siempre existe un acontecimiento concreto que justifica publicar ahora.

EXTENSIÓN
Referencia: 700 a 1,200 palabras. La profundidad depende de la historia.

ANTES DE REDACTAR
Define una sola pregunta central. Después identifica qué piezas hacen falta para responderla: actores, dinero, modelo, precedentes, comparaciones, estructura, incentivos, riesgos, timing y consecuencias.

APERTURA
Empieza desde la noticia. Dos o tres párrafos. Explica rápido qué ocurrió y dónde está la tensión.

DESARROLLO
Cuatro a siete secciones con subtítulos "##". Cada una responde una parte distinta de la pregunta central. Los subtítulos son argumentos, no etiquetas (mejor "El descanso se volvió inventario" que "El acuerdo comercial").

DATOS
Usa cifras, comparaciones, series históricas, valuaciones, contratos anteriores, participaciones, márgenes, audiencias, derechos o cálculos cuando ayuden. No acumules datos: cada cifra debe mover el argumento.

MATERIAL GRÁFICO
Referencia: dos a cuatro materiales. Cada uno responde una pregunta: ecuación, reparto, serie, duelo, mapa o timeline. No crear gráficos por decoración.

OPINIÓN DE PLAYBOOK
Uno o dos párrafos que sinteticen la lectura obtenida después del análisis. No repetir el artículo.

CIERRE
No buscar moraleja. Puede terminar con una consecuencia, tensión abierta, decisión pendiente, número a observar o pregunta concreta que el mercado todavía no responde.

CRITERIO FINAL
El lector debería poder explicar qué ocurrió, cómo funciona, dónde está el dinero, qué incentivos existen, quién controla qué y qué puede cambiar después.

Aquí está la información:

[PEGA AQUÍ LA URL O EL TEXTO DE LA NOTA]`,
      },
      {
        title: '06 · D: La Lana del Deporte, traslado al website',
        description: 'La Lana no se regenera: se adapta. Conservar tesis, estructura y voz; adaptar presentación y metadata.',
        prompt: `FORMATO: LA LANA DEL DEPORTE

La Lana tiene su propio flujo de investigación y redacción. No la vuelvas a generar desde este prompt.

Al trasladarla al website:
- conserva la tesis, estructura, subtítulos y voz del artículo aprobado;
- conserva el bloque de tres preguntas cuando forme parte de la edición;
- conserva La Opinión de Playbook (sus tres viñetas);
- adapta el contenido al formato Expediente del portal;
- incorpora metadata, hero, anexos y materiales gráficos disponibles;
- revisa que las gráficas aporten información y no funcionen como decoración;
- no resumas ni reescribas el artículo salvo instrucción editorial expresa.

DIFERENCIA CLAVE
Deep Dive explica a fondo una noticia. La Lana investiga una pregunta.

Aquí está el artículo aprobado:

[PEGA AQUÍ EL ARTÍCULO]`,
      },
      {
        title: '07 · Editor Playbook: control final',
        description: 'Auditoría antes de publicar: primero califica, luego máximo cinco cambios, y solo después corrige.',
        prompt: `ACTÚA COMO EDITOR GENERAL DE PLAYBOOK

No reescribas automáticamente el artículo. Primero audítalo.

VOZ
¿Suena natural? ¿Hay lenguaje corporativo o de consultoría? ¿Hay frases demasiado perfectas?

RITMO
¿Cada párrafo contiene una sola idea? ¿Hay párrafos que funcionan como contenedores?

FOCO
¿Está claro cuál es la historia? ¿Estamos intentando contar demasiadas cosas?

DATOS
¿El dato fuerte aparece pronto? ¿Cada cifra aporta algo? ¿Hay datos incluidos únicamente para demostrar investigación?

ANÁLISIS
¿La lectura está sustentada? ¿Se distinguen hecho, reporte, interpretación y escenario?

OPINIÓN DE PLAYBOOK
¿Añade una segunda capa? ¿Podría utilizarse en otra noticia cambiando solo los nombres?

FÓRMULAS
Busca expresiones como "confirma una tendencia", "el mensaje es claro", "marca la ruta", "el verdadero examen", "más allá de la anécdota", "la pregunta ya no es", "no solo X, sino Y", "esto demuestra que". Si aparecen, determina si son realmente necesarias.

REGIÓN
¿México o Latinoamérica aparecen porque forman parte real de la historia o porque intentamos forzar relevancia?

CIERRE
¿Termina con una consecuencia concreta o con una moraleja?

Devuelve primero una calificación:
APROBADO
AJUSTES MENORES
REQUIERE REEDICIÓN

Después identifica máximo cinco cambios concretos. Solo después entrega la versión corregida.

Aquí está el artículo:

[PEGA AQUÍ EL ARTÍCULO]`,
      },
      {
        title: '08 · Captura en el panel: campos del formulario',
        description:
          'Con el artículo ya redactado y auditado, devuelve los campos en el orden exacto de la pestaña Artículos.',
        prompt: `Toma este artículo terminado de Playbook y devuélveme los campos EN ESTE ORDEN, con el mismo nombre que usa el panel:

[PEGA AQUÍ EL ARTÍCULO TERMINADO]

${VOZ}

1. Título (en español, informativo, sin clickbait)
2. ID (el título en minúsculas y con guiones, sin acentos)
3. Extracto (1 o 2 frases de gancho para la tarjeta del feed)
4. Resumen en texto plano (1 a 3 frases sin formato, para RSS)
5. Teaser del muro de registro (1 o 2 frases que dejen con ganas de seguir leyendo, sin regalar la nota)
6. Cuerpo del artículo (el texto ya redactado, prosa con negritas y subtítulos "##" si hacen falta, nunca HTML)
7. Autor (vacío salvo que haya un byline real) y Mostrar autor (apagado por defecto)
8. Publicación y Fuente (Noticias/noticias, La Lana del Deporte/la-lana, o Infinitas/infinitas)
9. Alcance, Deporte y Vertical de negocio, usando solo la taxonomía de abajo
10. Fecha (AAAA-MM-DD) y Fecha en texto (ej. "23 jul 2026")
11. Tiempo de lectura (1 breve, 2 estándar, 3 largo, 4 muy largo)
12. Importancia (escala de abajo)
13. Destacado (solo si es LA historia del día, normalmente no)
14. Enlace en Substack (si existe; si no, vacío)
15. Imagen (toda nota lleva imagen de portada: sugiere una búsqueda concreta de foto con crédito real, sin inventar URLs; nunca Getty/iStock/AP)

${TAXONOMIA}

${IMPORTANCIA}`,
      },
    ],
  },
  {
    key: 'social',
    title: '2 · Redes sociales',
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
    title: '3 · Investigación y preparación',
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
    title: '4 · Newsletter semanal',
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
    title: '5 · Playbook Base',
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
