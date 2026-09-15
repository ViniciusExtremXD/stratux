/**
 * Testa a calculadora tributária contra valores conferidos à mão.
 * Preenche os campos no navegador real e lê os totais renderizados.
 *
 *   npm run build && node scripts-verify/calc-test.mjs
 */
import puppeteer from 'puppeteer-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const PORT = 5199;

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

/* ---------- cálculo de referência, independente do componente ---------- */
const SIMPLES = {
  I: [[180000, 0.04, 0], [360000, 0.073, 5940], [720000, 0.095, 13860], [1800000, 0.107, 22500], [3600000, 0.143, 87300], [4800000, 0.19, 378000]],
  II: [[180000, 0.045, 0], [360000, 0.078, 5940], [720000, 0.1, 13860], [1800000, 0.112, 22500], [3600000, 0.147, 85500], [4800000, 0.3, 720000]],
  III: [[180000, 0.06, 0], [360000, 0.112, 9360], [720000, 0.135, 17640], [1800000, 0.16, 35640], [3600000, 0.21, 125640], [4800000, 0.33, 648000]],
  V: [[180000, 0.155, 0], [360000, 0.18, 4500], [720000, 0.195, 9900], [1800000, 0.205, 17100], [3600000, 0.23, 62100], [4800000, 0.305, 540000]],
};

function expected({ fat, atividade, folha, iss }) {
  const RBT12 = fat * 12;
  const fatorR = RBT12 > 0 ? (folha * 12 * 1.2) / RBT12 : 0;
  const anexo =
    atividade === 'comercio' ? 'I' : atividade === 'industria' ? 'II' : fatorR >= 0.28 ? 'III' : 'V';
  const band = SIMPLES[anexo].find(([upTo]) => upTo >= RBT12);
  const aliq = (RBT12 * band[1] - band[2]) / RBT12;
  const das = fat * aliq;

  const serv = atividade === 'servicos';
  const lucroIrpj = fat * (serv ? 0.32 : 0.08);
  const irpj = lucroIrpj * 0.15;
  const adicional = Math.max(0, lucroIrpj - 20000) * 0.1;
  const csll = fat * (serv ? 0.32 : 0.12) * 0.09;
  const pis = fat * 0.0065;
  const cofins = fat * 0.03;
  const issV = serv ? fat * (iss / 100) : 0;
  const cpp = folha * 0.278;
  const lp = irpj + adicional + csll + pis + cofins + issV + cpp;

  return {
    anexo, fatorR, aliq, das, lp,
    difAnual: Math.abs(das - lp) * 12,
    menor: das < lp ? 'simples' : 'presumido',
    linhas: { irpj, adicional, csll, pis, cofins, iss: issV, cpp },
  };
}

const CASES = [
  { nome: 'Serviços 30k, sem folha (fator R baixo -> Anexo V)', fat: 30000, atividade: 'servicos', folha: 0, iss: 5 },
  { nome: 'Serviços 30k, folha 10k (fator R alto -> Anexo III)', fat: 30000, atividade: 'servicos', folha: 10000, iss: 5 },
  { nome: 'Comércio 50k, folha 8k', fat: 50000, atividade: 'comercio', folha: 8000, iss: 5 },
  { nome: 'Serviços 200k, folha 60k (adicional de IRPJ ativo)', fat: 200000, atividade: 'servicos', folha: 60000, iss: 3 },
  { nome: 'Indústria 100k, folha 25k', fat: 100000, atividade: 'industria', folha: 25000, iss: 5 },
  { nome: 'Serviços 15k, folha 5k (1a faixa)', fat: 15000, atividade: 'servicos', folha: 5000, iss: 2 },
];

const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new', userDataDir: 'C:/Temp/cdpc', args: ['--no-sandbox'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1000 });
await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'domcontentloaded', timeout: 60000 });

async function run(c) {
  await page.evaluate((c) => {
    const set = (id, v) => {
      const el = document.getElementById(id);
      el.value = String(v);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    };
    set('calc-faturamento', c.fat);
    set('calc-atividade', c.atividade);
    set('calc-folha', c.folha);
    set('calc-iss', c.iss);
  }, c);
  await new Promise((r) => setTimeout(r, 1000));
  return page.evaluate(() => {
    const sec = document.getElementById('calculadora');
    const leaves = [];
    for (const el of sec.querySelectorAll('*')) {
      if (el.children.length) continue;
      const t = (el.textContent || '').trim();
      if (t && (t.includes('R$') || t.includes('%') || /anexo|fator/i.test(t))) {
        leaves.push(t.replace(/\s+/g, ' ').slice(0, 90));
      }
    }
    return { text: sec.innerText, leaves };
  });
}

const parseBRL = (s) => {
  const m = String(s).match(/R\$\s*([\d.]+)(?:,(\d+))?/);
  if (!m) return null;
  return parseFloat(m[1].replace(/\./g, '') + '.' + (m[2] || '0'));
};

let bad = 0;
for (const c of CASES) {
  const e = expected(c);
  const got = await run(c);
  const nums = got.leaves.map(parseBRL).filter((n) => n !== null && n > 0);
  const near = (t, tol = 0.012) => nums.some((n) => Math.abs(n - t) <= Math.max(2, t * tol));

  const okDas = near(e.das);
  const okLp = near(e.lp);
  const okAnexo = c.atividade !== 'servicos' || new RegExp('anexo\\s*' + e.anexo + '\\b', 'i').test(got.text);
  const okDif = near(e.difAnual, 0.02);
  const all = okDas && okLp && okAnexo && okDif;
  if (!all) bad++;

  console.log((all ? '\nOK    ' : '\nFALHA ') + c.nome);
  console.log(
    '   esperado: DAS ' + e.das.toFixed(2) +
    ' | LP ' + e.lp.toFixed(2) +
    ' | dif/ano ' + e.difAnual.toFixed(2) +
    ' | anexo ' + e.anexo +
    ' | fatorR ' + (e.fatorR * 100).toFixed(1) + '%' +
    ' | menor: ' + e.menor,
  );
  console.log('   checks:   DAS=' + okDas + ' LP=' + okLp + ' anexo=' + okAnexo + ' dif=' + okDif);
  if (!all) {
    console.log('   valores lidos: ' + JSON.stringify(nums));
    console.log(got.text.split('\n').filter(Boolean).map((l) => '   | ' + l).join('\n'));
  }
}

console.log('\n' + '='.repeat(58));
console.log(bad ? bad + ' CASO(S) DIVERGENTE(S)' : 'CALCULADORA OK — ' + CASES.length + ' casos conferem');

await browser.close();
server.close();
process.exit(bad ? 1 : 0);
