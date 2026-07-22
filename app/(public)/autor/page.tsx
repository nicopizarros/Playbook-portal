import type { Metadata } from 'next';
import Link from 'next/link';
import { getArticlesByAuthor } from '@/lib/data/articles';
import { NewsRow } from '@/components/article/NewsRow';
import { SITE_URL } from '@/lib/site-url';

type Props = { searchParams: Promise<{ nombre?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { nombre } = await searchParams;
  const articles = nombre ? await getArticlesByAuthor(nombre) : [];
  const canonicalUrl = `${SITE_URL}/autor${nombre ? `?nombre=${encodeURIComponent(nombre)}` : ''}`;

  if (nombre && articles.length) {
    return {
      title: nombre,
      description: `Artículos publicados por ${nombre} en Playbook.`,
      alternates: { canonical: canonicalUrl },
      robots: { index: true, follow: true },
    };
  }
  return {
    title: 'Autor',
    alternates: { canonical: canonicalUrl },
    robots: { index: false, follow: true },
  };
}

export default async function AutorPage({ searchParams }: Props) {
  const { nombre } = await searchParams;
  const articles = nombre ? await getArticlesByAuthor(nombre) : [];

  return (
    <>
      <main className="container news-section archive-page" id="autor-main">
        <div className="section-head" style={{ borderBottom: 'none', marginBottom: 0, paddingTop: 0 }}>
          <div>
            <h2>{nombre || 'Autor'}</h2>
            <p className="sub">Todo lo publicado por este autor en Playbook.</p>
          </div>
          <Link className="section-link" href="/">← Volver a Noticias</Link>
        </div>

        <div>
          {nombre && articles.length ? (
            <div className="news-list">
              {articles.map(a => <NewsRow key={a.id} article={a} heading="h3" />)}
            </div>
          ) : nombre ? (
            <p className="empty-state">Todavía no hay artículos de este autor.</p>
          ) : (
            <div className="empty-state error-state">
              <p>No encontramos a este autor.</p>
              <p><Link href="/">Volver a Playbook</Link></p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
