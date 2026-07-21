import type { ProductCard, SiteContentData } from '@/lib/data/site-content';
import { safeUrl } from '@/lib/safe-url';

function ProductCardView({ product }: { product: ProductCard }) {
  return (
    <a className="product reveal" href={safeUrl(product.url)} target="_blank" rel="noopener noreferrer">
      {product.variant === 'glyph' ? (
        <div className="product-mark">
          <span className="glyph" aria-hidden="true">{product.glyph}</span>
          <span className="word">{product.wordmark}</span>
        </div>
      ) : (
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
