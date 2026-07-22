import type { ProductCard, SiteContentData } from '@/lib/data/site-content';
import { safeUrl } from '@/lib/safe-url';

// Products can point either at an internal collection page (e.g. /archivo?
// source=...) or an external destination (Substack, a partner site) — only
// the latter should force a new tab; a same-site link behaves like every
// other internal <a> on the portal.
function isExternalUrl(url: string) {
  return /^https?:/i.test(url.trim());
}

function ProductCardView({ product }: { product: ProductCard }) {
  const href = safeUrl(product.url);
  const external = isExternalUrl(product.url);
  return (
    <a className="product reveal" href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
      {product.variant === 'glyph' ? (
        <div className="product-mark">
          <span className="glyph" aria-hidden="true">{product.glyph}</span>
          <span className="word">{product.wordmark}</span>
        </div>
      ) : (
        // Editor-supplied URL, arbitrary host -- see AboutSection.tsx's comment.
        // eslint-disable-next-line @next/next/no-img-element
        <img className="product-banner" src={product.image} width={900} height={160} alt={product.imageAlt || ''} loading="lazy" decoding="async" />
      )}
      <div className="product-copy">
        <p>{product.description}</p>
        {product.meta && <span className="meta">{product.meta}</span>}
        <span className="product-arrow" aria-hidden="true">→</span>
      </div>
    </a>
  );
}

export function ProductsSection({ data }: { data: SiteContentData['productsSection'] }) {
  return (
    <section className="products" id="newsletters">
      <div className="container" style={{ padding: '44px 24px' }}>
        <div className="section-head reveal" style={{ paddingTop: 0 }}>
          <div>
            <h2>{data.heading}</h2>
          </div>
        </div>
        <div className="product-grid">
          {data.products.map((p, i) => (
            <ProductCardView key={i} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
