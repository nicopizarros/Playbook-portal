# Memo — Dashboard de métricas del website

**Para:** Dirección
**De:** Playbook · equipo de producto
**Fecha:** 25 de agosto de 2026
**Asunto:** Dashboard de métricas, y un defecto de medición que encontramos al conectarlo

> **Corrección respecto a la versión anterior de este memo.** La primera versión
> afirmaba que el archivo del sitio "no recircula", con base en que se leían 1.03
> notas por lector y sólo el 1.2 % de los lectores leía más de una. **Ese
> hallazgo no se sostiene.** Al conectar Google Analytics quedó claro que esos
> números no medían el comportamiento de los lectores: medían tráfico
> automatizado contándose como lectores nuevos. Lo que sigue lo explica.

---

## Los dos archivos

**1. `metricas-website-playbook.xlsx`** — el dashboard. Nueve hojas, cinco
gráficas nativas, quince rangos con nombre, 253 fórmulas. Ninguna gráfica
contiene un valor escrito a mano.

Desde hoy **se llena solo**: las hojas de tráfico ya no son destino de pegado
manual, se alimentan directo de la API de Google Analytics.

**2. `metricas-website-runbook.md`** — el instructivo de operación.

---

## Lo primero que hay que saber: las dos fuentes no coinciden

Al conectar GA4 pudimos comparar, por primera vez, el contador propio del portal
contra una fuente independiente. En la misma ventana (10 → 25 de agosto):

| Fuente | Usuarios | Vistas | Qué cuenta |
|---|---|---|---|
| **Google Analytics** | **677** | 2,032 | Navegadores reales que ejecutaron JavaScript |
| **Contador del portal** | **9,067** | 9,304 | Peticiones al servidor, con o sin JavaScript |

Trece veces de diferencia en usuarios.

### Por qué, y por qué importa

El portal filtra bots con una lista de **catorce** user-agents escritos a mano
—googlebot, bingbot, facebookexternalhit y once más—. No incluye GPTBot,
ClaudeBot, CCBot, PerplexityBot, Bytespider, AhrefsBot ni el resto del tráfico
automatizado que hoy representa una parte enorme de las peticiones a cualquier
sitio de noticias.

Un crawler que no está en esa lista pasa el filtro, recibe una cookie anónima,
**no la guarda**, y en su siguiente petición se cuenta como un lector nuevo.

En los datos se ve exactamente así: **lecturas ≈ lectores todos los días**
(446/439, 663/661, 692/663). Una sola lectura por identidad, día tras día. Eso
no es un patrón de lectura humana; es la firma de un cliente que no persiste
cookies.

**Consecuencia directa:** "lecturas por lector" estaba clavado en 1.00 y la
"recurrencia" en 1.2 % **por construcción**, no por comportamiento. No se puede
concluir nada sobre recirculación con ese denominador. En el dashboard esas dos
filas quedaron reclasificadas como **diagnóstico, no como KPI**, con la
advertencia de no presentarlas hasta arreglar el filtro.

---

## Lo que sí sabemos hoy, con datos reales

### Tráfico (GA4, del 10 al 25 de agosto — 16 días)

| | |
|---|---|
| Usuarios activos | **677** |
| Sesiones | **1,057** |
| Vistas de página | **2,032** |
| Duración media de sesión | **3 min 43 s** |
| Tasa de interacción | **41.6 %** |

### De dónde llega la gente

| Canal | Sesiones | Usuarios |
|---|---|---|
| Directo | 320 | 191 |
| Búsqueda orgánica | 260 | 217 |
| **Email (newsletter)** | **259** | **194** |
| Referral | 116 | 20 |
| Social orgánico | 77 | 56 |

**El newsletter ya es el tercer canal del sitio**, casi empatado con búsqueda
orgánica. Es la audiencia propia funcionando, y no lo sabíamos.

### Dispositivos

Desktop **62 %**, mobile **37 %**, tablet 1 %. Para un medio de noticias esto es
al revés de lo normal, y es coherente con un producto que se lee en horario de
oficina: es un medio de negocios, no de consumo masivo. Vale la pena confirmarlo
con más semanas antes de tomar decisiones de producto.

### Producción editorial (base de datos del portal — este dato no está en duda)

| | |
|---|---|
| Notas publicadas | **177** |
| Score promedio (boleta 0–99) | **61.2** |
| Notas de portada fuerte (≥70) | **46** |

---

## Lo que todavía no se puede medir

| Métrica | Qué falta |
|---|---|
| **Recirculación y recurrencia reales** | Arreglar el filtro de bots. Es la prioridad: hasta entonces no tenemos lectura confiable de si el archivo trabaja. |
| **Recurrencia vía GA4** | Sólo hay 16 días de datos —la propiedad se rotó el 7 de agosto— así que 673 de 677 usuarios son "nuevos" por construcción. En unas semanas será medible. |
| **Conversión website → newsletter** | Falta disparar un evento en GA4 al darse de alta. Ya medimos el tráfico que el newsletter **manda** al sitio; falta el sentido contrario. |

---

## Lo que pido a dirección

1. **Arreglar el conteo de bots.** Es lo que bloquea las dos métricas ancla del
   área. Trabajo chico, impacto directo en poder reportar cualquier cosa sobre
   audiencia con cara seria.
2. **El evento de alta de newsletter**, para cerrar la conversión.
3. Nada más. El resto del dashboard ya corre solo.

---

*Ambos archivos viven en el repositorio, en `docs/`, y se regeneran desde ahí
con un comando. La copia del escritorio es para circular.*
