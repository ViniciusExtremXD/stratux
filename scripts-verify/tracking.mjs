/**
 * Testa o aviso de cookies e os eventos de medição contra o dist/.
 * Nenhuma requisição sai para o Google: tudo fora do servidor local é interceptado.
 *
 *   PUBLIC_GTM_ID=GTM-TESTE npm run build && node scripts-verify/tracking.mjs
 *   npm run build && node scripts-verify/tracking.mjs     (sem ID: nada pode carregar)
 */
import puppeteer from 'puppeteer-core';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const OUT = path.join(ROOT, 'scripts-verify', 'out');
const PORT = 5412;
const BASE = `http://127.0.0.1:${PORT}`;
const PII = ['Fulana de Teste', '11900001111', 'fulana@teste.com', 'segredo do caso'];

if (!fs.existsSync(path.join(DIST, 'index.html'))) {
  console.error('dist/index.html não existe: rode o build antes.');
  process.exit(1);
}
fs.mkdirSync(OUT, { recursive: true });

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
const check = (cond, m, detail) => (cond ? ok(m) : no(m + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new',
  userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'stx-track-')),
  args: ['--no-sandbox'],
});

const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });

let gtmRequests = [];
let externalRequests = [];
await page.setRequestInterception(true);
page.on('request', (r) => {
  const u = r.url();
  if (u.startsWith(BASE) || u.startsWith('data:')) return r.continue();
  if (u.includes('googletagmanager.com/gtm.js')) {
    gtmRequests.push(u);
    return r.respond({ status: 200, contentType: 'text/javascript', body: '/* gtm simulado */' });
  }
  externalRequests.push(u);
  r.respond({ status: 204, body: '' });
});

/* Registra o window.open e evita navegar para fora ao clicar nos links. */
await page.evaluateOnNewDocument(() => {
  window.__opened = [];
  window.__popupBlocked = false;
  window.open = (...a) => {
    window.__opened.push(a);
    return window.__popupBlocked ? null : { opener: window };
  };
  window.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href]');
    if (a && !a.getAttribute('href').startsWith('#')) e.preventDefault();
  });
});

const open = async (p = '/') => {
  gtmRequests = [];
  await page.goto(BASE + p, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await wait(250);
};
const noticeVisible = () =>
  page.evaluate(() => {
    const n = document.querySelector('[data-cookie-notice]');
    return !!n && !n.hidden && getComputedStyle(n).display !== 'none';
  });
const events = () =>
  page.evaluate(() =>
    (window.dataLayer || []).filter((d) => d && d.event && !String(d.event).startsWith('gtm.')).map((d) => ({ ...d })),
  );
const layerJson = () =>
  page.evaluate(() => JSON.stringify((window.dataLayer || []).map((d) => (d && d.length !== undefined ? [...d] : d))));
const consent = () =>
  page.evaluate(() =>
    (window.dataLayer || []).filter((d) => d && d[0] === 'consent').map((d) => [d[1], { ...d[2] }]),
  );
const clickFirst = (sel) =>
  page.evaluate((s) => {
    const el = document.querySelector(s);
    if (el) el.click();
    return !!el;
  }, sel);
const fillForm = () =>
  page.evaluate((pii) => {
    const f = document.querySelector('#contato-form');
    f.querySelector('#ct-nome').value = pii[0];
    f.querySelector('#ct-tel').value = pii[1];
    f.querySelector('#ct-email').value = pii[2];
    f.querySelector('#ct-msg').value = pii[3];
    f.querySelector('#ct-lgpd').checked = true;
  }, PII);
const submitForm = async () => {
  await page.evaluate(() => document.querySelector('#contato-form [data-submit]').click());
  await wait(150);
};
const formState = () =>
  page.evaluate(() => {
    const f = document.querySelector('#contato-form');
    return {
      ok: f.querySelector('[data-msg]').classList.contains('is-ok'),
      msg: f.querySelector('[data-msg-text]').textContent,
      fallback: f.querySelector('[data-wa-fallback]').classList.contains('is-on'),
      opened: window.__opened.length,
    };
  });

await open('/');
const hasNotice = await page.evaluate(() => !!document.querySelector('[data-cookie-notice]'));

if (!hasNotice) {
  /* ---------- build sem PUBLIC_GTM_ID ---------- */
  console.log('\n== build sem ID ==');
  ok('sem aviso de cookies');
  const prefs = await page.evaluate(() => document.querySelectorAll('footer [data-cookie-prefs]').length);
  check(prefs === 0, 'sem botão de preferências no rodapé', prefs);
  await clickFirst('.fab');
  await fillForm();
  await submitForm();
  const st = await formState();
  check(gtmRequests.length === 0, 'GTM não é requisitado', gtmRequests);
  check((await events()).length === 0, 'nenhum evento registrado');
  check(st.ok && st.opened === 1, 'formulário abre o WhatsApp e confirma o envio', st);
} else {
  /* ---------- 1. primeira visita, sem resposta ---------- */
  console.log('\n== sem resposta ==');
  check(await noticeVisible(), 'aviso aparece na primeira visita');
  check(gtmRequests.length === 0, 'GTM não carrega antes de aceitar', gtmRequests);
  await clickFirst('.fab');
  await fillForm();
  await submitForm();
  const st0 = await formState();
  check((await events()).length === 0, 'sem resposta, cliques e formulário não geram evento');
  check(gtmRequests.length === 0, 'sem resposta, GTM continua sem carregar', gtmRequests);
  check(
    st0.ok && !st0.fallback && st0.opened === 1,
    'formulário confirma o envio, sem falso aviso de bloqueio',
    st0,
  );
  const openedArgs = await page.evaluate(() => window.__opened[0].map(String));
  check(openedArgs[0].startsWith('https://wa.me/') && openedArgs[1] === '_blank', 'WhatsApp abre em nova aba', openedArgs[1]);

  /* ---------- 2. recusar ---------- */
  console.log('\n== recusar ==');
  await clickFirst('[data-cookie-reject]');
  check(!(await noticeVisible()), 'aviso some ao recusar');
  await clickFirst('.fab');
  check((await events()).length === 0, 'recusado: clique não gera evento');
  check(gtmRequests.length === 0, 'recusado: GTM não carrega', gtmRequests);
  await open('/');
  check(!(await noticeVisible()) && gtmRequests.length === 0, 'recusa persiste após recarregar');

  /* ---------- 3. mudar para aceitar ---------- */
  console.log('\n== aceitar ==');
  await clickFirst('footer [data-cookie-prefs]');
  check(await noticeVisible(), 'preferências no rodapé reabrem o aviso');
  await clickFirst('[data-cookie-accept]');
  check(!(await noticeVisible()), 'aviso some ao aceitar');
  check(gtmRequests.length === 1 && gtmRequests[0].includes('id=GTM-'), 'GTM carrega uma vez após aceitar', gtmRequests);
  const c = await consent();
  check(
    c[0]?.[0] === 'default' && c[0][1].ad_storage === 'granted' &&
      c[0][1].ad_personalization === 'denied' && c[0][1].analytics_storage === 'denied',
    'consentimento: medição sim, personalização e analytics não',
    c,
  );

  /* ---------- 4. eventos ---------- */
  console.log('\n== eventos ==');
  const before = (await events()).length;
  await clickFirst('.fab');
  await clickFirst('footer a[href^="tel:"]');
  await clickFirst('footer a[href^="mailto:"]');
  await clickFirst('#contato .cta__channels a[href^="https://wa.me/"]');
  const ev = (await events()).slice(before);
  const expected = [
    ['contact_whatsapp', 'botao_flutuante'],
    ['contact_phone', 'rodape'],
    ['contact_email', 'rodape'],
    ['contact_whatsapp', 'contato'],
  ];
  check(
    ev.length === 4 && expected.every(([e, o], i) => ev[i].event === e && ev[i].contact_origin === o),
    'WhatsApp, telefone e e-mail geram o evento e a origem certos',
    ev,
  );

  await page.evaluate(() => { document.querySelector('#ct-nome').value = ''; document.querySelector('#ct-lgpd').checked = false; });
  const n1 = (await events()).length;
  await submitForm();
  check((await events()).length === n1, 'formulário inválido não gera lead');

  await fillForm();
  const openedBefore = (await formState()).opened;
  await submitForm();
  const leads = (await events()).filter((e) => e.event === 'generate_lead');
  const st1 = await formState();
  check(leads.length === 1 && leads[0].lead_source === 'formulario_contato', 'formulário válido gera um generate_lead', leads);
  check(st1.opened === openedBefore + 1, 'formulário válido abre o WhatsApp uma vez', st1.opened);

  await page.evaluate(() => { window.__popupBlocked = true; });
  await submitForm();
  const st2 = await formState();
  check(st2.fallback && !st2.ok, 'com pop-up bloqueado, mostra o link de reserva', st2);
  const n2 = (await events()).filter((e) => e.event === 'contact_whatsapp').length;
  await clickFirst('[data-wa-fallback]');
  const n3 = (await events()).filter((e) => e.event === 'contact_whatsapp').length;
  check(n3 === n2, 'link de reserva não conta o mesmo lead duas vezes');

  const json = await layerJson();
  const leaked = PII.filter((p) => json.includes(p));
  check(leaked.length === 0 && !json.includes('wa.me') && !json.includes('text='), 'dataLayer sem dados do formulário e sem URL do WhatsApp', leaked);

  /* ---------- 5. layout ---------- */
  console.log('\n== layout ==');
  await page.evaluate(() => localStorage.removeItem('stratux:cookies'));
  for (const [w, h, name] of [[1440, 900, 'desktop'], [390, 844, 'mobile'], [320, 640, 'mobile-320']]) {
    await page.setViewport({ width: w, height: h });
    await open('/');
    const measure = () =>
      page.evaluate(() => {
        const n = document.querySelector('[data-cookie-notice]').getBoundingClientRect();
        const f = document.querySelector('.fab').getBoundingClientRect();
        const overlap = !(n.right <= f.left || n.left >= f.right || n.bottom <= f.top || n.top >= f.bottom);
        return {
          inView: n.top >= 0 && n.bottom <= innerHeight && n.left >= 0 && n.right <= innerWidth,
          overlap,
          overflow: document.documentElement.scrollWidth - innerWidth,
          h: Math.round(n.height),
        };
      });
    const top = await measure();
    await page.screenshot({ path: path.join(OUT, `tracking-${name}.png`) });
    await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight / 2, behavior: 'instant' }));
    await wait(100);
    const mid = await measure();
    await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }));
    await wait(100);
    const end = await measure();
    check(top.inView && mid.inView && end.inView, `${name}: aviso visível no topo, no meio e no fim da página`, { top, mid, end });
    check(!top.overlap && !mid.overlap && !end.overlap, `${name}: aviso não cobre o botão do WhatsApp`, { top, mid, end });
    const semAviso = await page.evaluate(() => {
      document.querySelector('[data-cookie-notice]').hidden = true;
      return document.documentElement.scrollWidth - innerWidth;
    });
    check(top.overflow <= semAviso, `${name}: aviso não aumenta a rolagem horizontal`, { comAviso: top.overflow, semAviso });
  }
  await page.setViewport({ width: 1440, height: 900 });

  /* ---------- 6. revogar ---------- */
  console.log('\n== revogar ==');
  await clickFirst('[data-cookie-accept]');
  await page.evaluate(() => { document.cookie = '_gcl_au=teste; path=/'; document.cookie = 'outro=1; path=/'; });
  await open('/');
  check(!(await noticeVisible()) && gtmRequests.length === 1, 'aceite persiste: sem aviso e GTM carrega ao recarregar', gtmRequests);
  await clickFirst('footer [data-cookie-prefs]');
  await clickFirst('[data-cookie-reject]');
  const cookies = await page.evaluate(() => document.cookie);
  check(!cookies.includes('_gcl_') && cookies.includes('outro=1'), 'revogar apaga só os cookies _gcl_', cookies);
  const upd = (await consent()).at(-1);
  check(upd[0] === 'update' && upd[1].ad_storage === 'denied', 'revogar envia consentimento negado ao GTM', upd);
  const n4 = (await events()).length;
  await clickFirst('.fab');
  check((await events()).length === n4, 'revogado: clique não gera evento');
  await open('/');
  check(gtmRequests.length === 0, 'revogado: GTM não carrega ao recarregar', gtmRequests);

  /* ---------- 7. política ---------- */
  console.log('\n== política ==');
  await open('/politica-de-privacidade');
  const pp = await page.evaluate(() => {
    const text = document.querySelector('#cookies').textContent;
    return {
      btn: !!document.querySelector('#cookies [data-cookie-prefs]'),
      oldClaim: text.includes('não usa cookies de rastreamento'),
      keys: ['_gcl_au', 'stratux:cookies', 'stratux:motion'].every((k) => text.includes(k)),
    };
  });
  check(pp.btn, 'seção de cookies tem o botão de preferências');
  check(!pp.oldClaim, 'frase antiga "não usa cookies de rastreamento" saiu');
  check(pp.keys, 'seção de cookies lista os cookies e itens locais');
  await clickFirst('#cookies [data-cookie-prefs]');
  check(await noticeVisible(), 'botão da política reabre o aviso');
  const link = await page.evaluate(() => document.querySelector('[data-cookie-notice] a').getAttribute('href'));
  check(link.endsWith('/politica-de-privacidade#cookies'), '"Saiba mais" aponta para a seção de cookies', link);
}

await browser.close();
server.close();

const bad = R.filter((x) => !x).length;
console.log('\n' + '='.repeat(58));
console.log(bad ? bad + ' FALHA(S) de ' + R.length : 'MEDIÇÃO OK — ' + R.length + ' checagens');
process.exit(bad ? 1 : 0);
