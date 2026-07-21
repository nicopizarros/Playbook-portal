'use client';

import type { ProductCard, SiteContentData } from '@/lib/data/site-content';
import { TextField } from '../fields/TextField';
import { SelectField } from '../fields/SelectField';
import { ArrayEditor } from '../fields/ArrayEditor';

type Props = {
  data: SiteContentData['productsSection'];
  onChange: (next: SiteContentData['productsSection']) => void;
};

export function ProductsTab({ data, onChange }: Props) {
  const set = <K extends keyof SiteContentData['productsSection']>(key: K, value: SiteContentData['productsSection'][K]) =>
    onChange({ ...data, [key]: value });

  function setProduct(i: number, patch: Partial<ProductCard>) {
    const products = data.products.slice();
    products[i] = { ...products[i], ...patch };
    set('products', products);
  }

  return (
    <div>
      <h2 className="admin-section-title">Productos editoriales</h2>
      <p className="admin-section-desc">Las tarjetas de &quot;Productos editoriales&quot;.</p>
      <TextField label="Título de la sección" help="El encabezado grande de la sección de productos." value={data.heading} onChange={v => set('heading', v)} />
      <ArrayEditor<ProductCard>
        items={data.products}
        onChange={products => set('products', products)}
        addLabel="+ Agregar producto"
        itemTitle={item => item.wordmark || item.description || 'Producto'}
        newItem={() => ({ variant: 'banner', glyph: '', wordmark: '', description: '', meta: '', url: '', image: '', imageAlt: '' })}
        renderItem={(item, i) => (
          <>
            <SelectField
              label="Formato"
              help="Banner muestra una imagen; Ícono + texto muestra un emoji y el nombre."
              value={item.variant}
              options={[{ value: 'banner', label: 'Banner (con imagen)' }, { value: 'glyph', label: 'Ícono + texto' }]}
              onChange={v => setProduct(i, { variant: v as ProductCard['variant'] })}
            />
            <TextField label="Ícono (emoji)" help="Un emoji que representa el producto (solo formato Ícono + texto)." value={item.glyph} onChange={v => setProduct(i, { glyph: v })} />
            <TextField label="Nombre del producto" help="El nombre junto al ícono (solo formato Ícono + texto)." value={item.wordmark} onChange={v => setProduct(i, { wordmark: v })} />
            <TextField label="Imagen (solo formato Banner)" type="url" help="El link a la imagen del producto." value={item.image} onChange={v => setProduct(i, { image: v })} />
            <TextField label="Descripción" help="El texto que describe el producto." value={item.description} onChange={v => setProduct(i, { description: v })} />
            <TextField label="Frecuencia" help="Cuándo se publica (ej. Martes / Jueves)." value={item.meta} onChange={v => setProduct(i, { meta: v })} />
            <TextField label="Enlace del producto" type="url" required help="A dónde lleva la tarjeta al hacer clic." value={item.url} onChange={v => setProduct(i, { url: v })} />
          </>
        )}
      />
    </div>
  );
}
