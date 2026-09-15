/**
 * Captura uma imagem por seção, rolando a seção até a tela antes de fotografar.
 * O fullPage do Chrome costura strips e embaralha páginas muito altas — este
 * script evita isso capturando por elemento.
 *
 *   node scripts-verify/shots.mjs [desktop|mobile]
 */
import puppeteer from 'puppeteer-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const OUT = path.join(ROOT, 'scripts-verify', 'out', 'secoes');
const PORT = 5321;
const VP = process.argv[2] === 'mobile' ? ['mobile', 390, 844] : ['desktop', 1440, 900];

fs.rmSync(OUT, { recursive: true, force: true });
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

const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new', userDataDir: 'C:/Temp/cdps',
  args: ['--no-sandbox', '--force-prefers-reduced-motion'],
});
const page = await browser.newPage();
await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
await page.setViewport({ width: VP[1], height: VP[2], isMobile: VP[0] === 'mobile', hasTouch: VP[0] === 'mobile' });
await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle0', timeout: 60000 });

// dispara todas as revelações rolando a página inteira, depois volta
await page.evaluate(async () => {
  const H = document.body.scrollHeight;
  for (let y = 0; y < H; y += Math.round(window.innerHeight * 0.7)) {
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 90));
  }
});
await new Promise((r) => setTimeout(r, 1200));

const ids = await page.evaluate(() =>
  [...document.querySelectorAll('section[id], footer')].map((s, i) => s.id || 'rodape'),
);

let n = 0;
for (const id of ids) {
  const handle = await page.$(id === 'rodape' ? 'footer' : `[id="${id}"]`);
  if (!handle) continue;
  await page.evaluate((i) => {
    const el = i === 'rodape' ? document.querySelector('footer') : document.getElementById(i);
    el.scrollIntoView({ block: 'start', behavior: 'instant' });
    window.scrollBy(0, -80);
  }, id);
  await new Promise((r) => setTimeout(r, 450));
  const name = String(n).padStart(2, '0') + '-' + id + '.png';
  try {
    await handle.screenshot({ path: path.join(OUT, name), captureBeyondViewport: false });
  } catch {
    await page.screenshot({ path: path.join(OUT, name) });
  }
  const box = await handle.boundingBox();
  console.log(name.padEnd(28) + (box ? Math.round(box.width) + 'x' + Math.round(box.height) : '?'));
  n++;
}

await browser.close();
server.close();
console.log('\n' + n + ' seções em ' + OUT);
