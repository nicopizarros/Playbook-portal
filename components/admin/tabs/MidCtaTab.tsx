'use client';

import type { SiteContentData } from '@/lib/data/site-content';
import { TextField } from '../fields/TextField';

type Props = {
  data: SiteContentData['midCta'];
  onChange: (next: SiteContentData['midCta']) => void;
};

export function MidCtaTab({ data, onChange }: Props) {
  const set = <K extends keyof SiteContentData['midCta']>(key: K, value: SiteContentData['midCta'][K]) =>
    onChange({ ...data, [key]: value });

  return (
    <div>
      <h2 className="admin-section-title">CTA secundario</h2>
      <p className="admin-section-desc">El bloque &quot;Con Playbook estás un paso adelante&quot;.</p>
      <TextField label="Título (parte normal)" help="La primera parte del título, en texto normal." value={data.headingMain} onChange={v => set('headingMain', v)} />
      <TextField label="Título (parte destacada)" help="La segunda parte del título, resaltada en verde." value={data.headingEm} onChange={v => set('headingEm', v)} />
      <TextField label="Texto" multiline help="El texto debajo del título." value={data.body} onChange={v => set('body', v)} />
      <TextField label="Texto del botón" help="El texto del botón de suscripción." value={data.buttonLabel} onChange={v => set('buttonLabel', v)} />
      <TextField label="Enlace del formulario" type="url" required help="A dónde se envía el formulario de suscripción." value={data.formUrl} onChange={v => set('formUrl', v)} />
      <TextField label="Mensaje de éxito" help="El mensaje que ve la persona después de suscribirse." value={data.successMessage} onChange={v => set('successMessage', v)} />
    </div>
  );
}
