'use client';

import { useEffect, useMemo, useState } from 'react';

// El Estilo (2026-08-14): the client half of the design suite. It owns
// the product-skin switcher (the device markup arrives already rendered
// from the server; swapping the wrapper class is all it takes to re-ink
// every device in a product's palette, which is itself a demonstration
// of how the system works) and the palette swatches, which read the LIVE
// computed values of the theme tokens so they follow the admin's own
// light/dark toggle instead of hardcoding hex copies that would drift.
//
// Deliberately NO ArticleMotion here: the admin main pane scrolls in an
// inner container, where window-anchored ScrollTriggers misfire. Every
// device's no-JS state is its complete final state (static bar widths,
// real figures), so the suite shows exactly what a reader without
// animations sees; the motion belongs to the article page.
export type DeviceSample = {
  name: string;
  group: string;
  note: string;
  syntax: string;
  html: string;
  renders: boolean;
};

const SKINS = [
  { key: 'noticias', label: 'Noticias' },
  { key: 'la-lana', label: 'La Lana' },
  { key: 'infinitas', label: 'Infinitas' },
  { key: 'futbol-business-review', label: 'TFBR' },
] as const;

const THEME_TOKENS = [
  { token: '--paper', label: 'Papel' },
  { token: '--paper-soft', label: 'Papel suave' },
  { token: '--ink', label: 'Tinta' },
  { token: '--rule', label: 'Regla' },
  { token: '--gray-txt', label: 'Gris texto' },
  { token: '--green', label: 'Verde Playbook' },
  { token: '--src-industry', label: 'Noticias' },
  { token: '--src-lana', label: 'La Lana' },
  { token: '--src-infinitas', label: 'Infinitas' },
  { token: '--src-opinion', label: 'Opinión' },
];

const FIXED_TOKENS = [
  { token: '--pb-green', label: 'Verde fijo' },
  { token: '--lana-gold', label: 'Oro La Lana' },
  { token: '--shots-bg', label: 'Fondo El Trago' },
  { token: '--tfbr-red', label: 'Rojo TFBR' },
  { token: '--ink-fixed', label: 'Tinta fija' },
];

function Swatch({ token, label }: { token: string; label: string }) {
  const [value, setValue] = useState('');
  useEffect(() => {
    // Live-read so the chip follows theme flips; re-read on toggle via the
    // same event the theme system already broadcasts.
    const read = () => setValue(getComputedStyle(document.documentElement).getPropertyValue(token).trim());
    read();
    window.addEventListener('playbook:theme-change', read);
    return () => window.removeEventListener('playbook:theme-change', read);
  }, [token]);
  return (
    <div className="estilo-swatch">
      <span className="estilo-swatch-chip" style={{ background: `var(${token})` }} aria-hidden="true" />
      <span className="estilo-swatch-name">{label}</span>
      <code className="estilo-swatch-value">{value || token}</code>
    </div>
  );
}

export function DesignSuiteView({ devices, autoHtml }: { devices: DeviceSample[]; autoHtml: string }) {
  const [skin, setSkin] = useState<(typeof SKINS)[number]['key']>('noticias');
  const groups = useMemo(() => {
    const order: string[] = [];
    const byGroup = new Map<string, DeviceSample[]>();
    for (const device of devices) {
      if (!byGroup.has(device.group)) {
        byGroup.set(device.group, []);
        order.push(device.group);
      }
      byGroup.get(device.group)!.push(device);
    }
    return order.map(name => ({ name, items: byGroup.get(name)! }));
  }, [devices]);
  const broken = devices.filter(d => !d.renders);

  return (
    <div className="estilo-page">
      <div className="analytics-head">
        <div>
          <h2 className="admin-section-title">El estilo</h2>
          <p className="admin-section-desc">
            La suite visual de Playbook: paleta, tipografía, los elementos automáticos y los
            veinticuatro dispositivos, renderizados por el mismo código que los produce en un
            artículo real — si algo cambia en el sistema, cambia aquí.
          </p>
        </div>
      </div>

      {broken.length > 0 && (
        <p className="estilo-broken" role="alert">
          ⚠ {broken.length} muestra(s) dejaron de renderizar — el parser cambió y la
          declaración canónica ya no pasa: {broken.map(b => b.name).join(', ')}. Eso mismo le
          pasaría a un artículo publicado con esa sintaxis.
        </p>
      )}

      <section className="estilo-section">
        <h3 className="analytics-panel-title">Paleta</h3>
        <p className="estilo-note">
          Tokens del tema (siguen el modo claro/oscuro de este panel) y literales de superficie
          fija — un fólder es papel y una pizarra es negra digan lo que digan los tokens.
        </p>
        <div className="estilo-swatch-grid">
          {THEME_TOKENS.map(t => (
            <Swatch key={t.token} token={t.token} label={t.label} />
          ))}
        </div>
        <div className="estilo-swatch-grid estilo-swatch-grid-fixed">
          {FIXED_TOKENS.map(t => (
            <Swatch key={t.token} token={t.token} label={t.label} />
          ))}
        </div>
      </section>

      <section className="estilo-section">
        <h3 className="analytics-panel-title">Tipografía</h3>
        <div className="estilo-type">
          <p className="estilo-type-display">El negocio del deporte</p>
          <p className="estilo-type-meta">Anton · var(--serif-display) · titulares, cifras, mastheads</p>
          <p className="estilo-type-body">
            Inter carga el cuerpo: 400 para el texto corrido, <b>700 para lo que pesa</b>, y las
            versalitas espaciadas de las etiquetas de dispositivo.
          </p>
          <p className="estilo-type-meta">Inter · var(--sans) · cuerpo, UI, etiquetas</p>
        </div>
      </section>

      <section className="estilo-section">
        <h3 className="analytics-panel-title">Elementos automáticos</h3>
        <p className="estilo-note">
          Sin sintaxis y fuera del presupuesto: lead-ins marcados, la cifra en negritas que cuenta
          hacia arriba en el artículo, el subrayado de dinero. Así se ve un párrafo de casa:
        </p>
        <div className={`article-detail article-product-${skin} estilo-canvas`}>
          <div className="article-body" dangerouslySetInnerHTML={{ __html: autoHtml }} />
        </div>
      </section>

      <section className="estilo-section">
        <div className="estilo-devices-head">
          <h3 className="analytics-panel-title">Los veinticuatro dispositivos</h3>
          <div className="estilo-skins" role="group" aria-label="Piel de producto">
            {SKINS.map(s => (
              <button
                key={s.key}
                type="button"
                className={`btn-mini${skin === s.key ? ' is-active' : ''}`}
                aria-pressed={skin === s.key}
                onClick={() => setSkin(s.key)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <p className="estilo-note">
          Veintitrés formas (Cotización tiene dos). La piel re-tinta cada dispositivo con el acento
          del producto elegido — el mismo mecanismo del artículo real. Las animaciones (count-ups,
          barras, staggers) corren en la página del artículo; aquí se muestra el estado final.
        </p>
        {groups.map(group => (
          <div className="estilo-group" key={group.name}>
            <h4 className="estilo-group-title">{group.name}</h4>
            {group.items.map(device => (
              <article className="estilo-sample" key={device.name}>
                <header className="estilo-sample-head">
                  <b>{device.name}</b>
                  <span>{device.note}</span>
                </header>
                <code className="estilo-sample-syntax">{device.syntax}</code>
                {device.renders ? (
                  <div className={`article-detail article-product-${skin} estilo-canvas`}>
                    <div className="article-body" dangerouslySetInnerHTML={{ __html: device.html }} />
                  </div>
                ) : (
                  <p className="estilo-broken">⚠ No renderiza — revisar el parser o la muestra.</p>
                )}
              </article>
            ))}
          </div>
        ))}
      </section>
    </div>
  );
}
