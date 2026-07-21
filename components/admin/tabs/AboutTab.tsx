'use client';

import type { AboutAction, SiteContentData } from '@/lib/data/site-content';
import { TextField } from '../fields/TextField';
import { SelectField } from '../fields/SelectField';
import { ArrayEditor } from '../fields/ArrayEditor';

type Props = {
  data: SiteContentData['aboutSection'];
  onChange: (next: SiteContentData['aboutSection']) => void;
};

export function AboutTab({ data, onChange }: Props) {
  const set = <K extends keyof SiteContentData['aboutSection']>(key: K, value: SiteContentData['aboutSection'][K]) =>
    onChange({ ...data, [key]: value });

  return (
    <div>
      <h2 className="admin-section-title">Acerca de Playbook</h2>
      <p className="admin-section-desc">El texto y la frase destacada de &quot;Acerca de Playbook&quot;.</p>
      <TextField label="Imagen principal" type="url" required help="La imagen de la sección; se ve al hacer clic para reproducir el video." value={data.image} onChange={v => set('image', v)} />
      <TextField label="Texto alternativo de la imagen" help="Descripción de la imagen para accesibilidad y buscadores." value={data.imageAlt} onChange={v => set('imageAlt', v)} />
      <TextField label="Enlace del video" type="url" required help="El video que se abre al hacer clic en la imagen." value={data.videoUrl} onChange={v => set('videoUrl', v)} />
      <TextField label="Etiqueta pequeña sobre la imagen" help="Ej. Al Banquillo." value={data.badgeEyebrow} onChange={v => set('badgeEyebrow', v)} />
      <TextField label="Texto grande sobre la imagen" help="El texto grande que aparece sobre la imagen." value={data.badgeTitle} onChange={v => set('badgeTitle', v)} />
      <TextField label="Etiqueta de sección" help="La etiqueta pequeña arriba del título de la sección." value={data.eyebrow} onChange={v => set('eyebrow', v)} />
      <TextField label="Frase destacada (parte normal)" help="La primera parte de la frase, en texto normal." value={data.pullQuoteMain} onChange={v => set('pullQuoteMain', v)} />
      <TextField label="Frase destacada (parte cursiva)" help="La segunda parte de la frase, en cursiva." value={data.pullQuoteEm} onChange={v => set('pullQuoteEm', v)} />
      <TextField label="Texto" multiline help="El párrafo principal de la sección." value={data.body} onChange={v => set('body', v)} />
      <TextField label="Línea de productos" help="La línea que menciona los productos de Playbook." value={data.productsLine} onChange={v => set('productsLine', v)} />
      <TextField label="Nota junto a la línea de productos" help="Una nota corta junto a esa línea." value={data.productsLineNote} onChange={v => set('productsLineNote', v)} />
      <ArrayEditor<AboutAction>
        items={data.actions}
        onChange={actions => set('actions', actions)}
        addLabel="+ Agregar botón"
        itemTitle={item => item.label || 'Botón'}
        newItem={() => ({ label: '', url: '', style: 'light' })}
        renderItem={(item, i) => (
          <>
            <TextField label="Texto del botón" help="El texto que se muestra en el botón." value={item.label} onChange={v => { const actions = data.actions.slice(); actions[i] = { ...actions[i], label: v }; set('actions', actions); }} />
            <TextField label="Enlace del botón" type="url" required help="A dónde lleva el botón al hacer clic." value={item.url} onChange={v => { const actions = data.actions.slice(); actions[i] = { ...actions[i], url: v }; set('actions', actions); }} />
            <SelectField label="Estilo" help='El único estilo disponible: un botón con borde, en negro.' value={item.style} options={[{ value: 'light', label: 'Claro (con borde)' }]} onChange={() => {}} />
          </>
        )}
      />
    </div>
  );
}
