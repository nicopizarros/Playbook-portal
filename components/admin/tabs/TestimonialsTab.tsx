'use client';

import type { Testimonial, SiteContentData } from '@/lib/data/site-content';
import { TextField } from '../fields/TextField';
import { ArrayEditor } from '../fields/ArrayEditor';

type Props = {
  data: SiteContentData['testimonialsSection'];
  onChange: (next: SiteContentData['testimonialsSection']) => void;
};

export function TestimonialsTab({ data, onChange }: Props) {
  function setItem(i: number, patch: Partial<Testimonial>) {
    const testimonials = data.testimonials.slice();
    testimonials[i] = { ...testimonials[i], ...patch };
    onChange({ ...data, testimonials });
  }

  return (
    <div>
      <h2 className="admin-section-title">Testimonios</h2>
      <p className="admin-section-desc">Las citas de la comunidad.</p>
      <TextField label="Título de la sección" help="El encabezado de la sección de testimonios." value={data.heading} onChange={v => onChange({ ...data, heading: v })} />
      <ArrayEditor<Testimonial>
        items={data.testimonials}
        onChange={testimonials => onChange({ ...data, testimonials })}
        addLabel="+ Agregar testimonio"
        itemTitle={item => item.name || 'Testimonio'}
        newItem={() => ({ quote: '', name: '', role: '' })}
        renderItem={(item, i) => (
          <>
            <TextField label="Cita" multiline help="La cita textual de la persona." value={item.quote} onChange={v => setItem(i, { quote: v })} />
            <TextField label="Nombre" help="El nombre de quien dice la cita." value={item.name} onChange={v => setItem(i, { name: v })} />
            <TextField label="Cargo" help="El cargo o rol de esa persona, debajo del nombre." value={item.role} onChange={v => setItem(i, { role: v })} />
          </>
        )}
      />
    </div>
  );
}
