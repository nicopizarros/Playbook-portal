'use client';

import type { OpinionCard, SiteContentData } from '@/lib/data/site-content';
import { TextField } from '../fields/TextField';
import { SelectField } from '../fields/SelectField';
import { ArrayEditor } from '../fields/ArrayEditor';

type Props = {
  data: SiteContentData['opinionSection'];
  onChange: (next: SiteContentData['opinionSection']) => void;
};

export function OpinionTab({ data, onChange }: Props) {
  const set = <K extends keyof SiteContentData['opinionSection']>(key: K, value: SiteContentData['opinionSection'][K]) =>
    onChange({ ...data, [key]: value });

  return (
    <div>
      <h2 className="admin-section-title">Artículos de opinión</h2>
      <p className="admin-section-desc">Las tarjetas de &quot;Artículos de opinión&quot;.</p>
      <TextField label="Título de la sección" help="El encabezado grande arriba de las tarjetas de opinión." value={data.heading} onChange={v => set('heading', v)} />
      <TextField label='Texto del enlace "Ver archivo"' help="El texto del enlace que lleva al archivo completo de opinión." value={data.archiveLinkLabel} onChange={v => set('archiveLinkLabel', v)} />
      <TextField label="Enlace del archivo" type="url" required help="A dónde lleva ese enlace (normalmente Substack)." value={data.archiveLinkUrl} onChange={v => set('archiveLinkUrl', v)} />
      <ArrayEditor<OpinionCard>
        items={data.cards}
        onChange={cards => set('cards', cards)}
        addLabel="+ Agregar artículo de opinión"
        itemTitle={item => item.title || 'Artículo sin título'}
        newItem={() => ({ variant: 'standard', masthead: '', title: '', excerpt: '', url: '', image: '', imageAlt: '' })}
        renderItem={(item, i) => (
          <>
            <SelectField
              label="Formato"
              help="Estándar es solo texto; Banner muestra una imagen arriba del texto."
              value={item.variant}
              options={[{ value: 'standard', label: 'Estándar (texto)' }, { value: 'banner', label: 'Banner (con imagen)' }]}
              onChange={v => {
                const cards = data.cards.slice();
                cards[i] = { ...cards[i], variant: v as OpinionCard['variant'] };
                set('cards', cards);
              }}
            />
            <TextField label="Publicación" help="El nombre que aparece arriba del título (ej. La Lana del Mundial)." value={item.masthead} onChange={v => { const cards = data.cards.slice(); cards[i] = { ...cards[i], masthead: v }; set('cards', cards); }} />
            <TextField label="Título" help="El titular que se muestra en la tarjeta." value={item.title} onChange={v => { const cards = data.cards.slice(); cards[i] = { ...cards[i], title: v }; set('cards', cards); }} />
            <TextField label="Extracto" multiline help="Uno o dos renglones que resumen el artículo." value={item.excerpt} onChange={v => { const cards = data.cards.slice(); cards[i] = { ...cards[i], excerpt: v }; set('cards', cards); }} />
            <TextField label="Enlace del artículo" type="url" required help="La URL a la que lleva la tarjeta al hacer clic." value={item.url} onChange={v => { const cards = data.cards.slice(); cards[i] = { ...cards[i], url: v }; set('cards', cards); }} />
            <TextField label="Imagen (solo formato Banner)" type="url" help="El link a una imagen ya subida. Déjalo vacío si el formato es Estándar." value={item.image} onChange={v => { const cards = data.cards.slice(); cards[i] = { ...cards[i], image: v }; set('cards', cards); }} />
          </>
        )}
      />
    </div>
  );
}
