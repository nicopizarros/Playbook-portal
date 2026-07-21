'use client';

import type { SocialLink, SiteContentData } from '@/lib/data/site-content';
import { TextField } from '../fields/TextField';
import { ArrayEditor } from '../fields/ArrayEditor';

type Props = {
  data: SiteContentData['footer'];
  onChange: (next: SiteContentData['footer']) => void;
};

export function FooterTab({ data, onChange }: Props) {
  const set = <K extends keyof SiteContentData['footer']>(key: K, value: SiteContentData['footer'][K]) =>
    onChange({ ...data, [key]: value });

  return (
    <div>
      <h2 className="admin-section-title">Footer</h2>
      <p className="admin-section-desc">Redes sociales y el pie de página.</p>
      <TextField label="Descripción de Playbook" multiline help="El texto corto junto al logo, en el pie de página." value={data.brandBlurb} onChange={v => set('brandBlurb', v)} />
      <TextField label="Texto del enlace a Infinitas" help="El texto del enlace a Infinitas en el pie de página." value={data.infinitasLinkLabel} onChange={v => set('infinitasLinkLabel', v)} />
      <TextField label="Enlace de Infinitas" type="url" required help="A dónde lleva ese enlace." value={data.infinitasLinkUrl} onChange={v => set('infinitasLinkUrl', v)} />
      <TextField label="Texto de copyright" help="El texto de derechos de autor, al final de la página." value={data.copyrightText} onChange={v => set('copyrightText', v)} />
      <h3 className="admin-section-title">Redes sociales</h3>
      <ArrayEditor<SocialLink>
        items={data.socialLinks}
        onChange={socialLinks => set('socialLinks', socialLinks)}
        addLabel="+ Agregar red social"
        itemTitle={item => item.label || 'Red social'}
        newItem={() => ({ label: '', url: '' })}
        renderItem={(item, i) => (
          <>
            <TextField label="Nombre" help="El nombre de la red social (ej. Instagram, X)." value={item.label} onChange={v => { const links = data.socialLinks.slice(); links[i] = { ...links[i], label: v }; set('socialLinks', links); }} />
            <TextField label="Enlace del perfil" type="url" required help="El link al perfil de esa red social." value={item.url} onChange={v => { const links = data.socialLinks.slice(); links[i] = { ...links[i], url: v }; set('socialLinks', links); }} />
          </>
        )}
      />
    </div>
  );
}
