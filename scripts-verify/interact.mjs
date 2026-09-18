/**
 * Testa as interações reais: filtros, diagnóstico, formulário, âncoras,
 * toggle de movimento e duplicidade de id. Roda contra o dist/.
 *
 *   npm run build && node scripts-verify/interact.mjs
 */
import puppeteer from 'puppeteer-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const PORT = 5411;

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.xml': 'application/xml', '.txt': 'text/plain',
};
const server = http.createServer((req, res) => {
  let f = path.join(DIST, decodeURIComponent(req.url.split('?')[0]));
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(PORT, r));

const R = [];
const ok = (m) => { R.push(1); console.log('  ok    ' + m); };
const no = (m) => { R.push(0); console.log('  FALHA ' + m); };

const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new', userDataDir: 'C:/Temp/cdpi', args: ['--no-sandbox'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 950 });
await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'domcontentloaded', timeout: 60000 });

/* ---------- ids duplicados ---------- */
const dupes = await page.evaluate(() => {
  const seen = {}, dup = [];
  for (const el of document.querySelectorAll('[id]')) {
    if (seen[el.id]) dup.push(el.id);
    else seen[el.id] = 1;
  }
  return dup;
});
dupes.length ? no('ids duplicados: ' + dupes.join(', ')) : ok('nenhum id duplicado');

/* ---------- âncoras da nav resolvem ---------- */
const badAnchors = await page.evaluate(() =>
  [...document.querySelectorAll('a[href^="#"]')]
    .map((a) => a.getAttribute('href').slice(1))
    .filter((id) => id && !document.getElementById(id)),
);
badAnchors.length ? no('âncoras sem destino: ' + [...new Set(badAnchors)].join(', '))
                  : ok('todas as âncoras internas resolvem');

/* ---------- hierarquia de headings ---------- */
const heads = await page.evaluate(() =>
  [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((h) => +h.tagName[1]),
);
const h1s = heads.filter((h) => h === 1).length;
h1s === 1 ? ok('exatamente um h1') : no(h1s + ' elementos h1 (deve ser 1)');
let jump = null;
for (let i = 1; i < heads.length; i++) if (heads[i] - heads[i - 1] > 1) { jump = `h${heads[i - 1]} -> h${heads[i]}`; break; }
jump ? no('salto de nível de heading: ' + jump) : ok('hierarquia de headings sem saltos');

/* ---------- filtro de perfil ---------- */
const areasAll = await page.evaluate(() =>
  [...document.querySelectorAll('.area')].filter((a) => getComputedStyle(a).display !== 'none').length,
);
await page.evaluate(() => { document.getElementById('perfil-pf').click(); });
await new Promise((r) => setTimeout(r, 400));
const areasPf = await page.evaluate(() => ({
  visiveis: [...document.querySelectorAll('.area')].filter((a) => getComputedStyle(a).display !== 'none').length,
  perfis: [...document.querySelectorAll('.area')]
    .filter((a) => getComputedStyle(a).display !== 'none')
    .map((a) => a.getAttribute('data-profiles')),
}));
areasAll === 6 ? ok('perfil "tudo" mostra as 6 áreas') : no('perfil "tudo" mostra ' + areasAll + ' áreas');
areasPf.visiveis > 0 && areasPf.visiveis < areasAll && areasPf.perfis.every((p) => p.includes('pf'))
  ? ok(`perfil "pessoa física" filtra para ${areasPf.visiveis} áreas, todas marcadas pf`)
  : no('filtro de perfil não funcionou: ' + JSON.stringify(areasPf));

await page.evaluate(() => { document.getElementById('perfil-mei').click(); });
await new Promise((r) => setTimeout(r, 300));
const meiOk = await page.evaluate(() =>
  [...document.querySelectorAll('.area')]
    .filter((a) => getComputedStyle(a).display !== 'none')
    .every((a) => a.getAttribute('data-profiles').includes('mei')),
);
meiOk ? ok('perfil "MEI" filtra corretamente') : no('perfil "MEI" mostrou área fora do perfil');
await page.evaluate(() => { document.getElementById('perfil-todos').click(); });

/* ---------- filtro de obrigações ---------- */
const obgIds = await page.evaluate(() =>
  [...document.querySelectorAll('#obrigacoes input[type=radio]')].map((r) => r.id),
);
if (obgIds.length >= 4) {
  const pfId = obgIds.find((i) => /pf$/.test(i));
  const before = await page.evaluate(() =>
    [...document.querySelectorAll('#obrigacoes [data-profiles]')].filter((e) => getComputedStyle(e).display !== 'none').length,
  );
  await page.evaluate((id) => document.getElementById(id).click(), pfId);
  await new Promise((r) => setTimeout(r, 350));
  const after = await page.evaluate(() => {
    const vis = [...document.querySelectorAll('#obrigacoes [data-profiles]')].filter((e) => getComputedStyle(e).display !== 'none');
    return { n: vis.length, todasPf: vis.every((e) => e.getAttribute('data-profiles').includes('pf')) };
  });
  after.n > 0 && after.n < before && after.todasPf
    ? ok(`filtro de obrigações: ${before} -> ${after.n}, todas do perfil pf`)
    : no('filtro de obrigações não funcionou: ' + JSON.stringify({ before, after }));
} else {
  no('filtro de obrigações não encontrado');
}

/* ---------- contagem regressiva ---------- */
const cd = await page.evaluate(() => {
  const s = document.getElementById('obrigacoes');
  const t = s.innerText;
  const m = t.match(/PRÓXIMO VENCIMENTO[\s\S]{0,220}/i);
  return m ? m[0].replace(/\n+/g, ' | ') : null;
});
cd && !/\w[A-ZÀ-Ú]/.test(cd.replace(/\| /g, '')) !== null
  ? ok('contagem regressiva renderizada: ' + (cd || '').slice(0, 110))
  : no('contagem regressiva vazia');

/* ---------- diagnóstico ---------- */
const diagBefore = await page.evaluate(() => document.querySelector('#diagnostico').innerText.length);
const diagRadios = await page.evaluate(() => {
  const groups = {};
  for (const r of document.querySelectorAll('#diagnostico input[type=radio]')) {
    (groups[r.name] = groups[r.name] || []).push(r.id);
  }
  return groups;
});
const gnames = Object.keys(diagRadios);
gnames.length === 4 ? ok('diagnóstico tem 4 grupos de pergunta') : no('diagnóstico tem ' + gnames.length + ' grupos');
for (const g of gnames) await page.evaluate((id) => document.getElementById(id).click(), diagRadios[g][0]);
await new Promise((r) => setTimeout(r, 700));
const diag = await page.evaluate(() => {
  const s = document.getElementById('diagnostico');
  const waLink = [...s.querySelectorAll('a[href*="wa.me"]')].map((a) => decodeURIComponent(a.href));
  return { len: s.innerText.length, wa: waLink };
});
diag.len > diagBefore ? ok('diagnóstico revelou a recomendação após responder tudo')
                      : no('diagnóstico não mudou após responder as 4 perguntas');
const ctx = diag.wa
  .map((h) => (h.split('text=')[1] || ''))
  .filter((t) => /situa|porte|funcion|prazo|abrir|trocar|regulariz|imposto/i.test(t))
  .sort((a, b) => b.length - a.length)[0];
ctx ? ok('WhatsApp do diagnóstico leva contexto: ' + ctx.replace(/\s+/g, ' ').slice(0, 120))
    : no('WhatsApp do diagnóstico sem contexto montado. Links: ' + JSON.stringify(diag.wa.map((h) => (h.split('text=')[1] || '').slice(0, 60))));

/* ---------- formulário de contato ---------- */
const form = await page.evaluate(() => {
  const f = document.querySelector('#contato form');
  if (!f) return null;
  return {
    required: [...f.querySelectorAll('[required]')].map((e) => e.name || e.id),
    consent: !!f.querySelector('input[type=checkbox][required]'),
    submit: !!f.querySelector('[type=submit], button:not([type])'),
  };
});
form && form.required.length >= 3 && form.consent
  ? ok('formulário: ' + form.required.length + ' campos obrigatórios, consentimento LGPD required')
  : no('formulário incompleto: ' + JSON.stringify(form));

// submete vazio: não pode abrir o WhatsApp nem navegar
let opened = 0;
// só conta abas/janelas de verdade — iframes (o mapa) também disparam
// 'targetcreated' no CDP e não devem contar como "abriu o WhatsApp".
browser.on('targetcreated', (t) => { if (t.type() === 'page') opened++; });
await page.evaluate(() => {
  const f = document.querySelector('#contato form');
  const b = f.querySelector('[type=submit], button:not([type])');
  if (b) b.click();
});
await new Promise((r) => setTimeout(r, 600));
opened === 0 ? ok('submit vazio não abre o WhatsApp') : no('submit vazio abriu ' + opened + ' aba(s)');
const errLive = await page.evaluate(() => {
  const f = document.querySelector('#contato');
  const live = [...f.querySelectorAll('[aria-live], [role=alert], [role=status]')]
    .map((e) => e.textContent.trim())
    .filter(Boolean);
  return live;
});
errLive.length ? ok('erro anunciado em aria-live: "' + errLive[0].slice(0, 70) + '"')
               : no('submit inválido não anunciou erro em aria-live');

/* ---------- toggle de movimento ---------- */
await page.evaluate(() => document.querySelector('[data-motion-toggle]').click());
await new Promise((r) => setTimeout(r, 250));
const red = await page.evaluate(() => ({
  cls: document.documentElement.classList.contains('motion-reduced'),
  ls: localStorage.getItem('stratux:motion'),
  pressed: document.querySelector('[data-motion-toggle]').getAttribute('aria-pressed'),
}));
red.cls && red.ls === 'reduced' && red.pressed === 'true'
  ? ok('toggle de movimento liga, persiste e anuncia estado')
  : no('toggle de movimento falhou: ' + JSON.stringify(red));
await page.evaluate(() => document.querySelector('[data-motion-toggle]').click());

/* ---------- mapa de atendimento: troca de praça ---------- */
const regIds = await page.evaluate(() =>
  [...document.querySelectorAll('#atendimento input[name=regiao]')].map((r) => r.id),
);
if (regIds.length === 4) {
  ok('mapa: 4 praças encontradas');
  const before = await page.evaluate(() =>
    [...document.querySelectorAll('#atendimento .mapa__frame')]
      .map((f) => ({ id: f.dataset.mapa, visible: getComputedStyle(f).opacity !== '0' })),
  );
  const visibleBefore = before.filter((f) => f.visible).map((f) => f.id);
  visibleBefore.length === 1 && visibleBefore[0] === 'sp'
    ? ok('mapa: só a matriz (sp) visível antes de qualquer clique')
    : no('mapa: estado inicial errado: ' + JSON.stringify(before));

  // qualquer praça que não seja a matriz — não fixar o nome da cidade aqui,
  // a lista de praças pode mudar (já mudou: Santos virou Sorocaba).
  const otherId = regIds.find((i) => !/-sp$/.test(i));
  await page.evaluate((id) => document.getElementById(id).click(), otherId);
  await new Promise((r) => setTimeout(r, 950)); // supera a transição de 0.72s
  const after = await page.evaluate(() =>
    [...document.querySelectorAll('#atendimento .mapa__frame')]
      .map((f) => ({ id: f.dataset.mapa, visible: getComputedStyle(f).opacity !== '0' })),
  );
  const visibleAfter = after.filter((f) => f.visible).map((f) => f.id);
  const otherMapaId = otherId.replace(/^regiao-/, '');
  visibleAfter.length === 1 && visibleAfter[0] === otherMapaId
    ? ok(`mapa: clicar em outra praça (${otherMapaId}) troca o mapa, só ele visível`)
    : no('mapa: troca de praça falhou: ' + JSON.stringify({ otherId, after }));

  const iframeSrcOk = await page.evaluate(() =>
    [...document.querySelectorAll('#atendimento iframe[data-mapa]')].every(
      (f) => /google\.com\/maps/.test(f.src) && f.src.includes('output=embed'),
    ),
  );
  iframeSrcOk ? ok('mapa: todos os iframes apontam para o Google Maps (embed público)')
              : no('mapa: algum iframe não aponta para o Google Maps embed');
} else {
  no('mapa: esperava 4 praças, achei ' + regIds.length);
}

/* ---------- links externos ---------- */
const extBad = await page.evaluate(() =>
  [...document.querySelectorAll('a[target="_blank"]')].filter((a) => !/noopener/.test(a.rel)).length,
);
extBad === 0 ? ok('todo target=_blank tem rel=noopener') : no(extBad + ' links _blank sem noopener');

/* ---------- SEO ---------- */
const seo = await page.evaluate(() => ({
  title: document.title,
  desc: document.querySelector('meta[name=description]')?.content?.length || 0,
  canonical: !!document.querySelector('link[rel=canonical]'),
  og: document.querySelectorAll('meta[property^="og:"]').length,
  ld: [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => {
    try { return JSON.parse(s.textContent)['@type']; } catch { return 'INVÁLIDO'; }
  }),
}));
seo.title && seo.desc > 80 && seo.canonical && seo.og >= 6
  ? ok(`SEO: title, description (${seo.desc} chars), canonical e ${seo.og} tags og`)
  : no('SEO incompleto: ' + JSON.stringify(seo));
seo.ld.length && !seo.ld.includes('INVÁLIDO')
  ? ok('JSON-LD válido: ' + seo.ld.join(', '))
  : no('JSON-LD ausente ou inválido: ' + JSON.stringify(seo.ld));

await browser.close();
server.close();
const bad = R.filter((x) => !x).length;
console.log('\n' + '='.repeat(58));
console.log(bad ? bad + ' FALHA(S) de ' + R.length : 'INTERAÇÕES OK — ' + R.length + ' checagens');
process.exit(bad ? 1 : 0);
