'use client';

import type { SiteContentData } from '@/lib/data/site-content';

type Props = {
  data: SiteContentData['siteSettings'];
  onChange: (next: SiteContentData['siteSettings']) => void;
};

export function SettingsTab({ data, onChange }: Props) {
  return (
    <div>
      <h2 className="admin-section-title">Ajustes del sitio</h2>
      <p className="admin-section-desc">
        Interruptores generales que aplican a todo Playbook, no a una sección en particular.
      </p>
      <div className="field">
        <span className="field-label">Mostrar autor en todos los artículos</span>
        <span className="field-help">
          Enciende esto para mostrar el nombre del autor en la página de cada artículo, sin importar el
          interruptor individual de cada uno. Apagado por defecto. Cada artículo también puede mostrar su
          autor por separado desde la pestaña Artículos, sin tocar este interruptor.
        </span>
        <label className="checkbox-option">
          <input
            type="checkbox"
            checked={data.mostrarAutorGlobal === true}
            onChange={e => onChange({ ...data, mostrarAutorGlobal: e.target.checked })}
          />
          <span>Mostrar autor globalmente</span>
        </label>
      </div>
    </div>
  );
}
