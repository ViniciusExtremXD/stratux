import type { APIRoute } from 'astro';

/**
 * robots.txt — gerado no build (projeto estático).
 * Libera o site inteiro e aponta o sitemap em URL absoluta, como os
 * rastreadores exigem.
 */

/** Mesmo domínio declarado em astro.config.mjs, caso `site` não venha. */
const FALLBACK_SITE = 'https://www.stratuxconsultoria.com.br';

/** Junta o caminho ao BASE_URL e resolve contra o domínio do site. */
function absolute(site: URL | undefined, path: string): string {
  const withBase = `${import.meta.env.BASE_URL}${path}`.replace(/\/{2,}/g, '/');
  return new URL(withBase, site ?? FALLBACK_SITE).href;
}

export const GET: APIRoute = ({ site }) => {
  const body = ['User-agent: *', 'Allow: /', '', `Sitemap: ${absolute(site, 'sitemap.xml')}`, ''].join(
    '\n',
  );

  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
