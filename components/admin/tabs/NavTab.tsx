'use client';

import type { SiteContentData } from '@/lib/data/site-content';
import { TextField } from '../fields/TextField';

type Props = {
  data: SiteContentData['nav'];
  onChange: (next: SiteContentData['nav']) => void;
};

export function NavTab({ data, onChange }: Props) {
  return (
    <div>
      <h2 className="admin-section-title">Navegación</h2>
      <p className="admin-section-desc">Textos y enlaces del menú superior, y el botón de suscripción.</p>
      <TextField
        label="Texto del botón de suscripción"
        help="El texto que aparece en el botón verde de suscripción, en la esquina del menú."
        value={data.ctaLabel}
        onChange={v => onChange({ ...data, ctaLabel: v })}
      />
      <TextField
        label="Enlace del botón de suscripción"
        type="url"
        required
        help="A dónde lleva el botón al hacer clic (normalmente la página de Substack)."
        value={data.ctaUrl}
        onChange={v => onChange({ ...data, ctaUrl: v })}
      />
      <h3 className="admin-section-title">Enlaces del menú</h3>
      <p className="admin-section-desc">
        Solo se puede editar el texto y el destino de cada botón — agregar o quitar botones aquí podría
        romper la página.
      </p>
      <div className="array-editor">
        {data.links.map((link, i) => (
          <div className="array-item is-open is-static" key={i}>
            <div className="array-item-body">
              <TextField
                label="Texto del enlace"
                help="El texto que se muestra en el menú (ej. Noticias, Video)."
                value={link.label}
                onChange={v => {
                  const links = data.links.slice();
                  links[i] = { ...links[i], label: v };
                  onChange({ ...data, links });
                }}
              />
              <TextField
                label="Destino del enlace"
                help="A qué sección de la página lleva (ej. #noticias)."
                value={link.href}
                onChange={v => {
                  const links = data.links.slice();
                  links[i] = { ...links[i], href: v };
                  onChange({ ...data, links });
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
