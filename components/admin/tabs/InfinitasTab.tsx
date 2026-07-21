'use client';

import type { InfinitasCard, SiteContentData } from '@/lib/data/site-content';
import { TextField } from '../fields/TextField';
import { ArrayEditor } from '../fields/ArrayEditor';

type Props = {
  data: SiteContentData['infinitasSection'];
  onChange: (next: SiteContentData['infinitasSection']) => void;
};

export function InfinitasTab({ data, onChange }: Props) {
  const set = <K extends keyof SiteContentData['infinitasSection']>(key: K, value: SiteContentData['infinitasSection'][K]) =>
    onChange({ ...data, [key]: value });
  const setFeatured = (patch: Partial<InfinitasCard>) => set('featured', { ...data.featured, ...patch });

  return (
    <div>
      <h2 className="admin-section-title">Infinitas</h2>
      <p className="admin-section-desc">El artículo destacado y los secundarios de Infinitas.</p>
      <TextField label="Título de la sección" help="El encabezado grande de la sección Infinitas." value={data.heading} onChange={v => set('heading', v)} />
      <TextField label="Subtítulo" help="El texto pequeño debajo del título." value={data.sub} onChange={v => set('sub', v)} />
      <TextField label="Texto del enlace" help="El texto del enlace que lleva a Infinitas." value={data.linkLabel} onChange={v => set('linkLabel', v)} />
      <TextField label="Enlace de Infinitas" type="url" required help="A dónde lleva ese enlace." value={data.linkUrl} onChange={v => set('linkUrl', v)} />

      <h3 className="admin-section-title">Artículo destacado</h3>
      <TextField label="Imagen" type="url" help="El link a la imagen de fondo del artículo destacado." value={data.featured.image} onChange={v => setFeatured({ image: v })} />
      <TextField label="Etiqueta" help="El texto pequeño arriba del título." value={data.featured.eyebrow} onChange={v => setFeatured({ eyebrow: v })} />
      <TextField label="Título" help="El título del artículo destacado." value={data.featured.title} onChange={v => setFeatured({ title: v })} />
      <TextField label="Texto" multiline help="El texto que acompaña al título." value={data.featured.body || ''} onChange={v => setFeatured({ body: v })} />
      <TextField label="Enlace del artículo destacado" type="url" required help="A dónde lleva la tarjeta al hacer clic." value={data.featured.url} onChange={v => setFeatured({ url: v })} />

      <h3 className="admin-section-title">Artículos secundarios</h3>
      <ArrayEditor<InfinitasCard>
        items={data.sideCards}
        onChange={sideCards => set('sideCards', sideCards)}
        addLabel="+ Agregar artículo secundario"
        itemTitle={item => item.title || 'Artículo'}
        newItem={() => ({ image: '', eyebrow: '', title: '', url: '' })}
        renderItem={(item, i) => (
          <>
            <TextField label="Imagen" type="url" help="El link a la imagen de fondo de la tarjeta." value={item.image} onChange={v => { const sideCards = data.sideCards.slice(); sideCards[i] = { ...sideCards[i], image: v }; set('sideCards', sideCards); }} />
            <TextField label="Etiqueta" help="El texto pequeño arriba del título." value={item.eyebrow} onChange={v => { const sideCards = data.sideCards.slice(); sideCards[i] = { ...sideCards[i], eyebrow: v }; set('sideCards', sideCards); }} />
            <TextField label="Título" help="El título de la tarjeta." value={item.title} onChange={v => { const sideCards = data.sideCards.slice(); sideCards[i] = { ...sideCards[i], title: v }; set('sideCards', sideCards); }} />
            <TextField label="Enlace del artículo" type="url" required help="A dónde lleva la tarjeta al hacer clic." value={item.url} onChange={v => { const sideCards = data.sideCards.slice(); sideCards[i] = { ...sideCards[i], url: v }; set('sideCards', sideCards); }} />
          </>
        )}
      />
    </div>
  );
}
