'use client';

import type { Stat, SiteContentData } from '@/lib/data/site-content';
import { TextField } from '../fields/TextField';
import { ArrayEditor } from '../fields/ArrayEditor';

type Props = {
  data: SiteContentData['statsSection'];
  onChange: (next: SiteContentData['statsSection']) => void;
};

export function StatsTab({ data, onChange }: Props) {
  return (
    <div>
      <h2 className="admin-section-title">Playbook en números</h2>
      <p className="admin-section-desc">Las cifras de &quot;Playbook en números&quot;.</p>
      <TextField label="Título de la sección" help="El encabezado de la sección de cifras." value={data.heading} onChange={v => onChange({ ...data, heading: v })} />
      <ArrayEditor<Stat>
        items={data.stats}
        onChange={stats => onChange({ ...data, stats })}
        addLabel="+ Agregar cifra"
        itemTitle={item => item.value || 'Cifra'}
        newItem={() => ({ value: '', label: '' })}
        renderItem={(item, i) => (
          <>
            <TextField label="Cifra" help="El número grande (ej. 3.5M+)." value={item.value} onChange={v => { const stats = data.stats.slice(); stats[i] = { ...stats[i], value: v }; onChange({ ...data, stats }); }} />
            <TextField label="Descripción" help="El texto pequeño que explica la cifra." value={item.label} onChange={v => { const stats = data.stats.slice(); stats[i] = { ...stats[i], label: v }; onChange({ ...data, stats }); }} />
          </>
        )}
      />
    </div>
  );
}
