/**
 * Pipeline de verificação da Stratux.
 *
 *   node scripts-verify/verify.mjs [--pages /,/404] [--no-shots]
 *
 * Roda o Chrome instalado contra o dist/ servido estaticamente, em 1440px e
 * 390px, com "efeitos de animação" do Windows emulados como desligados.
 * Verifica: elementos presos invisíveis, erros de console, overflow horizontal,
 * revelações disparadas, cobertura de animação elemento a elemento, curva de
 * entrada quadro a quadro, e o comportamento sem JavaScript.
 */
import puppeteer from 'puppeteer-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const OUT = path.join(ROOT, 'scripts-verify', 'out');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 4321 + Math.floor(process.hrtime()[1] % 300);

const argv = process.argv.slice(2);
const getArg = (k, d) => {
  const i = argv.indexOf(k);
  return i >= 0 ? argv[i + 1] : d;
};
const PAGES = getArg('--pages', '/').split(',');
const SHOTS = !argv.includes('--no-shots');

fs.mkdirSync(OUT, { recursive: true });

/* ---------- servidor estático ---------- */
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp',
  '.avif': 'image/avif', '.svg': 'image/svg+xml', '.woff2': 'font/woff2',
  '.woff': 'font/woff', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
};
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  let f = path.join(DIST, p);
  try {
    if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
    if (!fs.existsSync(f)) f = path.join(DIST, p + '.html');
    if (!fs.existsSync(f)) {
      res.writeHead(404); res.end('404'); return;
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(res);
  } catch (e) {
    res.writeHead(500); res.end(String(e));
  }
});
await new Promise((r) => server.listen(PORT, r));
const ORIGIN = `http://127.0.0.1:${PORT}`;

/* ---------- utilidades ---------- */
const results = [];
const fail = (m) => { results.push({ ok: false, m }); console.log('  FAIL  ' + m); };
const pass = (m) => { results.push({ ok: true, m }); console.log('  ok    ' + m); };

async function scrollAll(page) {
  await page.evaluate(async () => {
    const H = document.body.scrollHeight;
    for (let y = 0; y < H; y += Math.round(window.innerHeight * 0.6)) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 140));
    }
    window.scrollTo(0, H);
    await new Promise((r) => setTimeout(r, 400));
  });
  await new Promise((r) => setTimeout(r, 900));
}

const AUDIT = () => {
  const vis = (el) => {
    const s = getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden') return false;
    if (s.clip === 'rect(0px, 0px, 0px, 0px)' || el.closest('.sr-only')) return false;
    const r = el.getBoundingClientRect();
    return r.width > 2 && r.height > 2;
  };
  const rendersContent = (el) => {
    const tag = el.tagName;
    if (['SCRIPT', 'STYLE', 'META', 'LINK', 'TITLE', 'HEAD', 'HTML', 'BODY', 'NOSCRIPT', 'BR', 'DEFS', 'LINEARGRADIENT', 'STOP'].includes(tag)) return false;
    if (tag === 'IMG' || tag === 'PICTURE' || tag === 'SOURCE' || tag === 'VIDEO' || tag === 'CANVAS') return tag !== 'SOURCE';
    if (tag === 'SVG' || el instanceof SVGElement) return tag === 'svg';
    // texto direto
    for (const n of el.childNodes) if (n.nodeType === 3 && n.nodeValue.trim()) return true;
    return false;
  };
  const stuck = [];
  const uncovered = [];
  let checked = 0;
  const all = document.querySelectorAll('main *, header *, footer *');
  for (const el of all) {
    if (!rendersContent(el)) continue;
    if (!vis(el)) continue;
    checked++;
    const s = getComputedStyle(el);
    if (parseFloat(s.opacity) < 0.02) stuck.push(el.tagName + '.' + (el.className?.toString?.().slice(0, 40) || ''));
    // cobertura: o próprio elemento ou algum ancestral carrega animação
    let covered = false;
    let n = el;
    while (n && n !== document.documentElement) {
      if (n.hasAttribute?.('data-reveal') || n.hasAttribute?.('data-split') ||
          n.hasAttribute?.('data-parallax') || n.hasAttribute?.('data-hero-out') ||
          n.hasAttribute?.('data-count') ||
          n.classList?.contains('marquee__track') || n.classList?.contains('img-fade') ||
          n.classList?.contains('w')) { covered = true; break; }
      const cs = getComputedStyle(n);
      if (cs.animationName && cs.animationName !== 'none') { covered = true; break; }
      if (cs.transitionProperty && cs.transitionProperty !== 'none' && cs.transitionProperty !== 'all' && parseFloat(cs.transitionDuration) > 0) { covered = true; break; }
      n = n.parentElement;
    }
    if (!covered) {
      uncovered.push({
        tag: el.tagName,
        cls: (el.className?.toString?.() || '').slice(0, 60),
        text: (el.textContent || '').trim().slice(0, 50),
      });
    }
  }
  const revealTotal = document.querySelectorAll('[data-reveal], [data-split]').length;
  const revealIn = document.querySelectorAll('[data-reveal].is-in, [data-split].is-in').length;
  const words = document.querySelectorAll('[data-split] .w').length;
  const parallaxMoved = [...document.querySelectorAll('[data-parallax]')]
    .filter((e) => e.style.transform && e.style.transform !== 'none').length;
  const overflow = document.documentElement.scrollWidth > window.innerWidth + 1
    ? document.documentElement.scrollWidth - window.innerWidth : 0;
  // quem estoura
  const wide = [];
  if (overflow) {
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect();
      if (r.right > window.innerWidth + 2 && r.width > 0)
        wide.push(el.tagName + '.' + (el.className?.toString?.().slice(0, 40) || '') + ' right=' + Math.round(r.right));
    }
  }
  return { checked, stuck, uncovered, revealTotal, revealIn, words, parallaxMoved, overflow, wide: wide.slice(0, 8) };
};

/* ---------- execução ---------- */
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  userDataDir: 'C:/Temp/cdpv',
  args: ['--no-sandbox', '--force-prefers-reduced-motion', '--font-render-hinting=none'],
});

const summary = {};

for (const route of PAGES) {
  for (const [vp, w, h] of [['desktop', 1440, 900], ['mobile', 390, 844]]) {
    const page = await browser.newPage();
    const errors = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
    page.on('pageerror', (e) => errors.push('PAGEERROR ' + String(e).slice(0, 200)));
    page.on('requestfailed', (r) => errors.push('REQFAIL ' + r.url().slice(0, 120)));

    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    await page.setViewport({ width: w, height: h, isMobile: vp === 'mobile', hasTouch: vp === 'mobile' });
    const url = ORIGIN + route;
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
    await new Promise((r) => setTimeout(r, 700));
    await scrollAll(page);

    const a = await page.evaluate(AUDIT);
    const key = `${route} ${vp}`;
    summary[key] = a;
    console.log(`\n== ${key} ==`);
    console.log(`  elementos com conteúdo: ${a.checked} | sem animação: ${a.uncovered.length}`);
    a.stuck.length ? fail(`${key}: ${a.stuck.length} preso(s) invisível(is) — ${a.stuck.slice(0, 4).join(', ')}`)
                   : pass(`${key}: zero elementos presos invisíveis`);
    a.uncovered.length ? fail(`${key}: ${a.uncovered.length} sem animação — ${a.uncovered.slice(0, 5).map((u) => u.tag + '“' + u.text + '”').join(' | ')}`)
                       : pass(`${key}: 100% de cobertura de animação (${a.checked} elementos)`);
    a.revealIn === a.revealTotal ? pass(`${key}: ${a.revealIn}/${a.revealTotal} revelações disparadas`)
                                 : fail(`${key}: só ${a.revealIn}/${a.revealTotal} revelações dispararam`);
    a.overflow ? fail(`${key}: overflow horizontal de ${a.overflow}px — ${a.wide.join(' ; ')}`)
               : pass(`${key}: sem overflow horizontal`);
    errors.length ? fail(`${key}: ${errors.length} erro(s) de console — ${errors.slice(0, 3).join(' | ')}`)
                  : pass(`${key}: console limpo`);
    console.log(`  palavras animadas: ${a.words} | parallax movido: ${a.parallaxMoved}`);

    if (SHOTS) {
      // volta ao topo para o hero aparecer no estado de repouso
      await page.evaluate(() => window.scrollTo(0, 0));
      await new Promise((r) => setTimeout(r, 700));
      const nm = (route === '/' ? 'home' : route.replace(/\W+/g, '-').replace(/^-|-$/g, '')) + '-' + vp;
      await page.screenshot({ path: path.join(OUT, nm + '.png'), fullPage: true });
    }
    await page.close();
  }

  /* ---------- sem JavaScript ---------- */
  const nojs = await browser.newPage();
  await nojs.setJavaScriptEnabled(false);
  await nojs.setViewport({ width: 1440, height: 900 });
  await nojs.goto(ORIGIN + route, { waitUntil: 'networkidle0', timeout: 60000 });
  const nj = await nojs.evaluate(() => {
    let checked = 0; const hidden = [];
    for (const el of document.querySelectorAll('main *, header *, footer *')) {
      const s = getComputedStyle(el);
      if (s.display === 'none' || s.visibility === 'hidden') continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      let hasText = false;
      for (const n of el.childNodes) if (n.nodeType === 3 && n.nodeValue.trim()) hasText = true;
      if (!hasText && el.tagName !== 'IMG') continue;
      checked++;
      if (parseFloat(s.opacity) < 0.02) hidden.push(el.tagName + '.' + (el.className?.toString?.().slice(0, 30) || ''));
    }
    return { checked, hidden };
  });
  nj.hidden.length ? fail(`${route} sem JS: ${nj.hidden.length} invisível(is) — ${nj.hidden.slice(0, 4).join(', ')}`)
                   : pass(`${route} sem JS: ${nj.checked} elementos, nenhum invisível`);
  await nojs.close();
}

await browser.close();
server.close();

const bad = results.filter((r) => !r.ok);
console.log(`\n${'='.repeat(60)}`);
console.log(bad.length ? `${bad.length} FALHA(S) de ${results.length} checagens` : `TUDO OK — ${results.length} checagens`);
fs.writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify({ summary, results }, null, 2));
process.exit(bad.length ? 1 : 0);
