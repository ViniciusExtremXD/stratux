import type { APIRoute } from 'astro';

/**
 * sitemap.xml — gerado no build (projeto estático).
 * Só entram páginas indexáveis: a home e a política de privacidade. A 404 fica
 * de fora de propósito, porque é noindex.
 */

/** Mesmo domínio declarado em astro.config.mjs, caso `site` não venha. */
const FALLBACK_SITE = 'https://www.stratuxconsultoria.com.br';

type Entry = { path: string; changefreq: string; priority: string };

const ROUTES: Entry[] = [
  { path: '/', changefreq: 'monthly', priority: '1.0' },
  { path: '/politica-de-privacidade', changefreq: 'yearly', priority: '0.3' },
];

/** Junta o caminho ao BASE_URL e resolve contra o domínio do site. */
function absolute(site: URL | undefined, path: string): string {
  const withBase = `${import.meta.env.BASE_URL}${path}`.replace(/\/{2,}/g, '/');
  return new URL(withBase, site ?? FALLBACK_SITE).href;
}

export const GET: APIRoute = ({ site }) => {
  /** Data da geração do arquivo. */
  const lastmod = new Date().toISOString().slice(0, 10);

  const urls = ROUTES.map((r) =>
    [
      '  <url>',
      `    <loc>${absolute(site, r.path)}</loc>`,
      `    <lastmod>${lastmod}</lastmod>`,
      `    <changefreq>${r.changefreq}</changefreq>`,
      `    <priority>${r.priority}</priority>`,
      '  </url>',
    ].join('\n'),
  ).join('\n');

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls,
    '</urlset>',
    '',
  ].join('\n');

  return new Response(xml, {
    status: 200,
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
