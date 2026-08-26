# Memo — Dashboard de métricas del website

**Para:** Dirección
**De:** Playbook · equipo de producto
**Fecha:** 25 de agosto de 2026
**Asunto:** Propuesta de dashboard de métricas, y qué podemos medir hoy

---

## Los dos archivos

**1. `metricas-website-playbook.xlsx`** — el dashboard.

Nueve hojas: `Resumen`, `Tráfico`, `Contenido`, `Audiencia`, `Newsletter`,
`Datos_GA4`, `Datos_Portal`, `Definiciones` e `Instrucciones`. Cinco gráficas
nativas de Excel, catorce rangos con nombre, 250 fórmulas.

Ninguna gráfica contiene un solo valor escrito a mano: todas leen rangos de
celdas. Actualizar el archivo es pegar un export y guardar — nadie tiene que
editar una gráfica nunca.

**2. `metricas-website-runbook.md`** — el instructivo.

La ruta de clics exacta en Google Analytics para cada uno de los cinco exports
que alimentan el dashboard, con el rango de fechas, las dimensiones y las
métricas de cada reporte. Está escrito para alguien que **nunca ha abierto
GA4**, e incluye qué hacer cuando Google cambia el menú, que lo hace seguido.

---

## Lo que ya podemos medir hoy, con datos propios

Esta es la parte que no esperábamos encontrar.

El portal registra sus propias lecturas (`article_reads`). Es **medición de
primera parte**: no depende del consentimiento de cookies de terceros, no
depende de ninguna plataforma, y ya lleva meses acumulando. Los números están
en el dashboard y son reales, no estimados:

| | |
|---|---|
| Notas publicadas | **177** |
| Score promedio (boleta 0–99) | **61.2** |
| Notas de portada fuerte (≥70) | **46** |
| Lecturas registradas | **13,036** |
| Lectores únicos | **12,614** |
| **Lecturas por lector** | **1.03** |
| **Lectores que leen más de una nota** | **155 — el 1.23 %** |

### Lo que esos dos últimos números dicen

**Prácticamente nadie lee una segunda nota.** De cada 100 personas que llegan al
sitio, 99 leen una sola cosa y se van. El archivo — 177 notas, meses de trabajo
— no está trabajando: no recircula, no retiene, no genera hábito.

Esto es medible desde ya y no requiere GA4. También conviene decir por qué es
confiable: la identidad anónima vive en una cookie firmada de dos años, y los
bots quedan excluidos **antes** de que se registre una lectura. No es un
artefacto de sesión ni tráfico automatizado inflando el denominador. Subestima,
eso sí, a quien cambia de dispositivo o navega en incógnito — es decir, el
número real de recurrencia es *algo* mejor, pero no de otro orden.

De las cuatro métricas ancla del área, **dos ya están respondidas** con dato
propio: recirculación y recurrencia. Las dos dan mal.

---

## Lo que todavía no podemos medir

El archivo marca cada una como `PENDIENTE DE INSTRUMENTACIÓN` en vez de
omitirla. Un hueco visible se arregla; uno omitido no.

| Métrica | Qué falta |
|---|---|
| Usuarios, sesiones, vistas, canales, mobile vs desktop | Sólo pegar los exports de GA4. La hoja destino ya está lista con los encabezados exactos. |
| **Conversión website → newsletter** | Faltan **dos cosas**: (a) disparar un evento en GA4 cuando alguien se da de alta, y (b) un export mensual del total de Substack. Sin las dos, el cociente no existe. Los suscriptores viven en Substack, no en el portal. |
| Tiempo de lectura real | Sale del export de páginas de GA4. El `reading_time` que guarda el portal es una **estimación** por longitud de texto, no una medición — no son lo mismo y no conviene confundirlos en una junta. |

### Sobre GA4

**El dashboard llega con la hoja `Datos_GA4` vacía, a propósito.** No hay
credenciales de Google Analytics en el repositorio — las cuatro llaves existen
pero están en blanco. Preferimos entregar una celda vacía que una cifra
inventada: en un tablero de dirección, un número que nadie puede rastrear hasta
su fuente es peor que un hueco.

La hoja trae los encabezados exactos del export de GA4, así que llenarla es
literalmente pegar. Quince minutos al mes.

---

## Cómo se actualiza

1. Hacer los cinco exports de GA4 siguiendo el runbook.
2. Pegar cada uno en su bloque de `Datos_GA4`.
3. Correr el script que refresca los datos del portal.
4. Listo — el `Resumen` y las gráficas se recalculan solos.

El script **conserva** lo que ya se pegó en `Datos_GA4`, así que se puede correr
en cualquier momento sin perder los exports. (Antes no lo hacía; se corrigió.)

---

## Trabajo relacionado en la misma corrida

Además del dashboard, en esta sesión se atendieron cuatro cosas más:

- **Hub de la LFA — conteo de franquicias.** Decía 8; son 7. La corrección de
  fondo no fue cambiar el dígito: el número ahora se **cuenta** de la lista de
  plazas en lugar de escribirse dos veces. La página llegó a listar siete
  equipos y anunciar ocho, con ambas cifras "con fuente"; eso ya no puede
  volver a pasar.
- **Hub de la LFA — fan base.** Los tres datos de Global Intelligence
  integrados en el tablero, textuales, con la atribución al propietario del
  estudio siempre visible.
- **Sistema de jerarquías.** La pregunta del equipo era si ya estaba vivo en
  los prompts. **No lo estaba.** Estaba documentado en ambos flujos de
  publicación y era inejecutable: el script no aceptaba la boleta y no escribía
  la calificación. Todo lo puntuado había entrado por un proceso manual
  posterior. Ya quedó conectado y verificado contra la base.
- **QA del hub** antes de compartirlo con la liga: links, imágenes, textos
  alternativos, taxonomía, móvil y modo claro/oscuro.

---

## Lo que necesito de dirección

1. **La conversión a newsletter es la única métrica ancla que no podemos
   instrumentar solos.** Necesita una decisión sobre el evento de alta. Es
   trabajo chico, pero hasta que exista, ese número no se puede reportar.
2. **La recirculación en 1.03 merece conversación de producto,** no de
   analítica. El dato ya está; lo que falta es decidir qué hacer con él.
3. **Una fotografía más de la LFA** para el hub. Hoy la misma imagen aparece
   dos veces en la página, y no hay otra foto de la liga en el repositorio.

---

*Los dos archivos viven también en el repositorio, en `docs/`, y se regeneran
desde ahí. La copia del escritorio es para circular.*
