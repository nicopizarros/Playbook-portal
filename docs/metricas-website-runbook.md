# Runbook — Métricas del website de Playbook

Cómo llenar `docs/metricas-website-playbook.xlsx` cada mes.

Está escrito para alguien que **nunca ha abierto Google Analytics**. Si algo en
la pantalla no coincide con lo que dice aquí, lee la sección
[Cuando la pantalla no coincide](#cuando-la-pantalla-no-coincide) al final:
Google cambia el menú de GA4 con frecuencia y hay una forma de llegar igual.

- **Propiedad de GA4:** `G-KVE4HF75TF`
- **Tiempo total:** unos 15 minutos al mes
- **Se necesita:** una cuenta de Google con acceso de lectura a esa propiedad

---

## Antes de empezar: qué es cada hoja

El archivo tiene nueve hojas. Sólo vas a tocar **una**.

| Hoja | Quién la llena | Tú la tocas |
|---|---|---|
| `Resumen` | Fórmulas | ❌ No |
| `Trafico`, `Contenido`, `Audiencia`, `Newsletter` | Fórmulas | ❌ No |
| **`Datos_GA4`** | **Tú, pegando el export** | ✅ **Sí** |
| `Datos_Portal` | Un script contra la base de datos | ❌ No |
| `Definiciones`, `Instrucciones` | Nadie, son referencia | ❌ No |

Todo lo demás se recalcula solo. **No escribas un número a mano fuera de
`Datos_GA4`**: si lo haces, la próxima regeneración lo borra.

---

## Paso 0 — Entrar a GA4 (una sola vez)

1. Abre <https://analytics.google.com> e inicia sesión.
2. Arriba a la izquierda hay un selector de propiedad. Elige la que
   corresponde a **`G-KVE4HF75TF`**.
3. Si no la ves, no tienes acceso: pide que te agreguen como *Lector* a esa
   propiedad. No sigas hasta tener esto resuelto.

### El rango de fechas — esto se repite en los cinco reportes

Arriba a la derecha de **todos** los reportes hay un selector de fechas.
En cada uno de los cinco exports:

1. Haz clic en el selector.
2. Elige **Personalizado**.
3. Pon el **primer día del mes que estás reportando** y el **último día del
   mismo mes**. Ejemplo para agosto de 2026: `2026-08-01` a `2026-08-31`.
4. Clic en **Aplicar**.

> **No uses "Últimos 28 días" ni "Mes actual".** Son rangos móviles: el número
> que exportes hoy no será el mismo que si repites el export mañana, y el
> comparativo mes contra mes del `Resumen` deja de significar algo.

### Cómo se exporta — también igual en los cinco

Arriba a la derecha, junto al selector de fechas, hay un icono de
**compartir/exportar** (una flecha saliendo de una caja). Clic ahí →
**Descargar archivo** → **Descargar CSV**.

---

## Los cinco exports

Hazlos en este orden. Cada uno corresponde a un bloque de la hoja `Datos_GA4`.

### Export 1 · Resumen mensual

| | |
|---|---|
| **Ruta de clics** | Menú izquierdo → **Informes** → **Adquisición** → **Visión general** |
| **Rango** | El mes completo (ver arriba) |
| **Dimensión** | Ninguna — es la vista general |
| **Métricas** | Usuarios activos · Usuarios nuevos · Sesiones · Vistas de página · Duración media de la sesión · Tasa de interacción |
| **Pegar en** | `Datos_GA4`, bloque **RESUMEN MENSUAL** |

**Usuarios recurrentes no aparece como métrica en esta pantalla.** Se calcula:

> `Usuarios recurrentes = Usuarios activos − Usuarios nuevos`

Haz esa resta tú y escribe el resultado en la columna *Usuarios recurrentes*.
Es una sola celda al mes.

**Ojo:** esta pantalla da **una fila con el total del mes**, no una fila por
día. Es lo que queremos: el dashboard es mensual. Escribe el mes en la primera
columna con el formato `2026-08`.

---

### Export 2 · Canales de adquisición

| | |
|---|---|
| **Ruta de clics** | **Informes** → **Adquisición** → **Adquisición de tráfico** |
| **Rango** | El mes completo |
| **Dimensión** | **Grupo de canales predeterminado de la sesión** (viene puesta por defecto) |
| **Métricas** | Sesiones · Usuarios activos · Vistas de página · Tasa de interacción |
| **Pegar en** | `Datos_GA4`, bloque **CANALES** |

Vas a obtener una fila por canal: `Organic Search`, `Direct`, `Organic Social`,
`Referral`, etc. **Pégalas todas**, y repite el mes en la primera columna de
cada fila. Sí, el mes se repite — es a propósito: así el dashboard puede
filtrar por mes.

Este es el reporte que responde *"¿cuánta de nuestra audiencia es propia y
cuánta se la estamos alquilando a una plataforma?"*.

---

### Export 3 · Páginas más leídas

| | |
|---|---|
| **Ruta de clics** | **Informes** → **Interacción** → **Páginas y pantallas** |
| **Rango** | El mes completo |
| **Dimensión** | **Ruta de página y clase de pantalla** |
| **Métricas** | Vistas · Usuarios activos · Tiempo medio de interacción |
| **Pegar en** | `Datos_GA4`, bloque **PÁGINAS** |

Antes de exportar, ordena por **Vistas** (clic en el encabezado de esa columna)
y **quédate con las 20 primeras filas**. No necesitamos las 400 rutas del sitio;
necesitamos saber qué se leyó.

**Tiempo medio de interacción es el dato de tiempo de lectura real.** El portal
guarda un `reading_time` propio, pero ese es una *estimación* calculada sobre el
largo del texto, no una medición. No son lo mismo y no hay que confundirlos.

---

### Export 4 · Dispositivos (mobile vs desktop)

| | |
|---|---|
| **Ruta de clics** | **Informes** → **Tecnología** → **Detalles de tecnología** |
| **Rango** | El mes completo |
| **Dimensión** | Cambia el selector de la primera columna a **Categoría de dispositivo** |
| **Métricas** | Usuarios activos · Sesiones · Tasa de interacción |
| **Pegar en** | `Datos_GA4`, bloque **DISPOSITIVOS** |

Salen tres o cuatro filas: `mobile`, `desktop`, `tablet`, a veces `smart tv`.
Pégalas todas.

> La primera columna de esta pantalla suele venir en **Navegador**. Hay que
> cambiarla a **Categoría de dispositivo** con el desplegable que está en el
> encabezado de esa columna. Si no lo cambias vas a exportar Chrome/Safari, que
> no es lo que pide la hoja.

---

### Export 5 · Newsletter

> ⚠️ **Este export todavía no da datos, y eso es un hallazgo, no un error.**
> Hoy **no existe** un evento de suscripción en GA4, y los suscriptores viven
> en Substack, no en la base del portal. La conversión web → newsletter está
> marcada `PENDIENTE DE INSTRUMENTACIÓN` en el archivo. Ver
> [Lo que falta instrumentar](#lo-que-falta-instrumentar).

Cuando el evento exista:

| | |
|---|---|
| **Ruta de clics** | **Explorar** → **Exploración libre** |
| **Rango** | El mes completo |
| **Dimensión** | Nombre del evento |
| **Métricas** | Recuento de eventos · Usuarios activos · Sesiones |
| **Filtro** | Nombre del evento = el que se defina para el alta |
| **Pegar en** | `Datos_GA4`, bloque **NEWSLETTER** |

Mientras tanto, la parte de **suscriptores** se saca a mano de Substack:
Dashboard de Substack → **Subscribers** → el total y las altas del mes. Se
escriben en las columnas *Suscriptores* y *Altas del mes* de la hoja
`Newsletter`.

---

## Paso final — refrescar el dato del portal

Los números editoriales (notas publicadas, scores, lecturas propias,
recurrencia, autores, tags) **no salen de GA4**: salen directo de la base de
datos. Para actualizarlos, desde la raíz del repositorio:

```bash
POSTGRES_URL="$(grep '^POSTGRES_URL=' .env.local | cut -d= -f2- | tr -d '"')" \
  python3 scripts/build-metrics-dashboard.py
```

Eso regenera el `.xlsx` completo con los datos de la base al día.

> **El script conserva lo que ya pegaste en `Datos_GA4`.** Antes no lo hacía y
> el orden importaba; desde el 2026-08-25 detecta las celdas pegadas y las
> arrastra al archivo nuevo, así que puedes correrlo cuando quieras sin perder
> los exports. Te avisa en pantalla cuántas celdas conservó.
>
> La única excepción: si alguien cambia la ESTRUCTURA de los bloques de
> `Datos_GA4` (añadir o renombrar columnas), el script no puede saber a qué
> columna corresponde cada dato viejo, así que lo dice en pantalla y arranca
> limpio. Si ves ese aviso, vuelve a pegar los exports.

---

## Lo que falta instrumentar

Estas métricas no se pueden obtener hoy. Aparecen en el archivo marcadas
`PENDIENTE DE INSTRUMENTACIÓN` en vez de omitirse, porque un hueco visible se
arregla y uno omitido no.

| Métrica | Qué falta exactamente |
|---|---|
| **Conversión website → newsletter** | Dos cosas: (a) disparar un evento de GA4 cuando alguien se da de alta, y (b) un export mensual del total de Substack. Sin las dos, el cociente no existe. |
| **Usuarios recurrentes (serie limpia)** | Hoy se calcula restando dos métricas del Export 1. GA4 tiene un informe de **Retención** que lo da directo; vale la pena moverlo ahí cuando alguien tenga tiempo. |
| **Tiempo de lectura real** | Depende del Export 3. El `reading_time` del portal es una estimación por longitud de texto, no una medición. |
| **Recirculación entre historias** | El portal **sí** la mide de forma propia (`article_reads`), y ya está en el archivo. La versión de GA4 — secuencia de páginas por sesión — necesita una exploración de *Ruta* que nadie ha construido. |

### Un dato que ya existe y conviene mirar

La hoja `Audiencia` sale de `article_reads`, que es medición **propia** y no
depende del consentimiento de cookies de terceros. A la fecha de generación
dice que se leen **1.03 notas por lector** y que **el 1.2 %** de los lectores
lee más de una nota. Si esos dos números no se mueven, el archivo del sitio no
está trabajando: cada visita entra, lee una nota y se va.

Ese es probablemente el número más accionable de todo el dashboard, y no venía
de GA4.

---

## Cuando la pantalla no coincide

Google renombra y reacomoda los menús de GA4 seguido. Si una ruta de clics de
este documento ya no existe:

1. Usa el **buscador** que está hasta arriba de GA4 y escribe el nombre de la
   métrica (por ejemplo `usuarios activos`). Suele llevarte al informe correcto.
2. Si el menú izquierdo se ve distinto, busca el botón **Informes** (icono de
   gráfica de barras). Todo lo de este runbook cuelga de ahí salvo el Export 5,
   que cuelga de **Explorar**.
3. Lo que **no** cambia es qué dimensión y qué métricas necesita cada bloque de
   `Datos_GA4`. Si encuentras el reporte pero las columnas no coinciden, ajusta
   las columnas del reporte, no los encabezados de la hoja: las fórmulas y las
   gráficas apuntan a rangos con nombre y esperan ese orden exacto.

Si cambias algo de este proceso, actualiza este documento en el mismo commit.
