'use client';

import type { ProductHubsContent, HubMetric, LanaBoardRow } from '@/lib/product-hubs-content';
import { TextField } from '../fields/TextField';
import { ArrayEditor } from '../fields/ArrayEditor';

// Edita las cuatro páginas de producto (/noticias, /la-lana,
// /futbol-business-review, /infinitas — 2026-08-05). El resto de cada
// página (expedientes, listas, marcadores en vivo) sale solo de los
// artículos publicados; acá vive únicamente lo que es copy editorial:
// mastheads, la ruta del dinero por defecto, y las cifras de El Marcador.
//
// `data` llega ya fusionada con los defaults de código
// (productHubsContent en lib/data/site-content.ts), así que una fila de
// site_content guardada antes de que existiera esta sección se edita
// igual que una nueva.

type Props = {
  data: ProductHubsContent;
  onChange: (next: ProductHubsContent) => void;
};

export function HubsTab({ data, onChange }: Props) {
  return (
    <div>
      <h2 className="admin-section-title">Hubs de producto</h2>
      <p className="admin-section-desc">
        El copy editorial de las páginas de cada producto. Los artículos que se listan en cada hub
        salen solos de lo publicado; esto edita los encabezados y las cifras fijas.
      </p>

      <h3 className="admin-section-title">Noticias — /noticias</h3>
      <TextField
        label="Bajada del masthead"
        help="La línea bajo el título NOTICIAS."
        value={data.noticias.sub}
        onChange={v => onChange({ ...data, noticias: { ...data.noticias, sub: v } })}
      />
      <TextField
        label="Nota de cadencia"
        help='Ej. "Nuevas ediciones martes y jueves". El "1 shot ≈ 3 min" se agrega solo.'
        value={data.noticias.cadenceNote}
        onChange={v => onChange({ ...data, noticias: { ...data.noticias, cadenceNote: v } })}
      />

      <h3 className="admin-section-title">La Lana del Deporte — /la-lana</h3>
      <TextField
        label="Eyebrow"
        help="La línea pequeña arriba del título."
        value={data.lana.eyebrow}
        onChange={v => onChange({ ...data, lana: { ...data.lana, eyebrow: v } })}
      />
      <TextField
        label="Bajada del masthead"
        value={data.lana.sub}
        onChange={v => onChange({ ...data, lana: { ...data.lana, sub: v } })}
      />
      <TextField
        label="Etiqueta del tablero"
        help='Encabezado del tablero de salidas, ej. "Tablero de conexiones".'
        value={data.lana.boardLabel}
        onChange={v => onChange({ ...data, lana: { ...data.lana, boardLabel: v } })}
      />
      <TextField
        label="Nota del tablero"
        help="La línea que explica qué es el tablero."
        value={data.lana.boardNote}
        onChange={v => onChange({ ...data, lana: { ...data.lana, boardNote: v } })}
      />
      <ArrayEditor<LanaBoardRow>
        items={data.lana.boardRows}
        onChange={boardRows => onChange({ ...data, lana: { ...data.lana, boardRows } })}
        addLabel="+ Agregar conexión al tablero"
        itemTitle={item => item.conexion || 'Conexión'}
        newItem={() => ({ fecha: '', conexion: '', expediente: '', estado: 'Abierto', url: '' })}
        renderItem={(item, i) => {
          const update = (patch: Partial<LanaBoardRow>) => {
            const boardRows = data.lana.boardRows.slice();
            boardRows[i] = { ...boardRows[i], ...patch };
            onChange({ ...data, lana: { ...data.lana, boardRows } });
          };
          return (
            <>
              <TextField
                label="Conexión"
                help='La conexión destapada, ej. "Infantino ↔ Trump".'
                value={item.conexion}
                onChange={v => update({ conexion: v })}
              />
              <TextField label="Salida (fecha)" help='Ej. "5 ago 2026". Puede quedar vacío.' value={item.fecha} onChange={v => update({ fecha: v })} />
              <TextField label="Vuelo" help='Ej. "EXP. 004". Puede quedar vacío.' value={item.expediente} onChange={v => update({ expediente: v })} />
              <TextField
                label="Estado"
                help='Ej. "Abierto", "En curso", "Archivado". Abierto/En curso parpadean como llamada de abordaje.'
                value={item.estado}
                onChange={v => update({ estado: v })}
              />
              <TextField
                label="Enlace (opcional)"
                help="URL del expediente (/articulo/…) para que la fila sea clickeable."
                value={item.url}
                onChange={v => update({ url: v })}
              />
            </>
          );
        }}
      />
      <p className="admin-section-desc">
        Además de estas filas, el tablero agrega solo una salida por cada expediente reciente que
        declare su &quot;Ruta del dinero:&quot; en el cuerpo, con su número de caso y su estado.
      </p>

      <h3 className="admin-section-title">The Futbol Business Review — /futbol-business-review</h3>
      <TextField
        label="Tagline (parte en rojo)"
        help='Ej. "The insights" — se pinta en rojo.'
        value={data.tfbr.taglineEm}
        onChange={v => onChange({ ...data, tfbr: { ...data.tfbr, taglineEm: v } })}
      />
      <TextField
        label="Tagline (resto)"
        help='Ej. "behind the game."'
        value={data.tfbr.taglineRest}
        onChange={v => onChange({ ...data, tfbr: { ...data.tfbr, taglineRest: v } })}
      />
      <TextField
        label="Bajada del masthead"
        value={data.tfbr.sub}
        onChange={v => onChange({ ...data, tfbr: { ...data.tfbr, sub: v } })}
      />
      <TextField
        label="URL de Substack"
        help="A dónde manda el botón mientras las ediciones vivan en Substack."
        value={data.tfbr.substackUrl}
        onChange={v => onChange({ ...data, tfbr: { ...data.tfbr, substackUrl: v } })}
      />
      <TextField
        label="Edición de portada (id)"
        help="El id del artículo que abre la sala como reporte de portada. Vacío o inexistente: se usa la edición más reciente."
        value={data.tfbr.headlinerId}
        onChange={v => onChange({ ...data, tfbr: { ...data.tfbr, headlinerId: v } })}
      />

      <h3 className="admin-section-title">Infinitas — /infinitas</h3>
      <TextField
        label="Historia principal (id)"
        help="El id del artículo que encabeza el hub. Vacío o inexistente: se usa el más reciente."
        value={data.infinitas.leadId}
        onChange={v => onChange({ ...data, infinitas: { ...data.infinitas, leadId: v } })}
      />
      <TextField
        label="Bajada del masthead"
        value={data.infinitas.sub}
        onChange={v => onChange({ ...data, infinitas: { ...data.infinitas, sub: v } })}
      />
      <TextField
        label="Bajada de El Marcador"
        value={data.infinitas.marcadorSub}
        onChange={v => onChange({ ...data, infinitas: { ...data.infinitas, marcadorSub: v } })}
      />
      <ArrayEditor<HubMetric>
        items={data.infinitas.metrics}
        onChange={metrics => onChange({ ...data, infinitas: { ...data.infinitas, metrics } })}
        addLabel="+ Agregar cifra del Marcador"
        itemTitle={item => item.label || item.value || 'Cifra'}
        newItem={() => ({ value: '', prefix: '', suffix: '', label: '', source: '' })}
        renderItem={(item, i) => {
          const update = (patch: Partial<HubMetric>) => {
            const metrics = data.infinitas.metrics.slice();
            metrics[i] = { ...metrics[i], ...patch };
            onChange({ ...data, infinitas: { ...data.infinitas, metrics } });
          };
          return (
            <>
              <TextField
                label="Cifra"
                help='Solo el número, ej. "2.35" o "91,553". Anima contando desde cero al entrar en pantalla.'
                value={item.value}
                onChange={v => update({ value: v })}
              />
              <TextField label="Prefijo" help='Ej. "US$". Puede quedar vacío.' value={item.prefix} onChange={v => update({ prefix: v })} />
              <TextField label="Sufijo" help='Ej. "B" o "M". Puede quedar vacío.' value={item.suffix} onChange={v => update({ suffix: v })} />
              <TextField label="Descripción" help="Qué mide la cifra." value={item.label} onChange={v => update({ label: v })} />
              <TextField
                label="Fuente"
                help='Atribución, ej. "Deloitte" o "FIFA". Un marcador sin fuente es marketing: siempre llenarla.'
                value={item.source}
                onChange={v => update({ source: v })}
              />
            </>
          );
        }}
      />
    </div>
  );
}
