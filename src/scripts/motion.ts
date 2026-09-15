/* =========================================================================
   STRATUX — motor de movimento
   Um único módulo. Tudo entra suave; nada pode ficar invisível.

   Regras:
   - Ignora deliberadamente prefers-reduced-motion do sistema. Quem precisa
     reduzir usa o botão do rodapé (persistido em localStorage).
   - Anima apenas opacity / transform / filter. Nunca clip-path.
   - Três redes de segurança para as revelações: IntersectionObserver,
     verificação por scroll em rAF, e um timeout final.
   ========================================================================= */

const root = document.documentElement;
const MOTION_KEY = 'stratux:motion';

/* ---------- preferência de movimento ---------- */
function isReduced(): boolean {
  return root.classList.contains('motion-reduced');
}

function setReduced(on: boolean): void {
  root.classList.toggle('motion-reduced', on);
  try {
    localStorage.setItem(MOTION_KEY, on ? 'reduced' : 'full');
  } catch {
    /* modo privado: preferência vale só para esta sessão */
  }
  document.querySelectorAll<HTMLElement>('[data-motion-toggle]').forEach((el) => {
    el.setAttribute('aria-pressed', String(on));
    const label = el.querySelector<HTMLElement>('[data-motion-label]');
    if (label) label.textContent = on ? 'Animações reduzidas' : 'Animações ativas';
  });
}

function initMotionToggle(): void {
  document.querySelectorAll<HTMLElement>('[data-motion-toggle]').forEach((el) => {
    el.setAttribute('aria-pressed', String(isReduced()));
    const label = el.querySelector<HTMLElement>('[data-motion-label]');
    if (label) label.textContent = isReduced() ? 'Animações reduzidas' : 'Animações ativas';
    el.addEventListener('click', () => setReduced(!isReduced()));
  });
}

/* ---------- split de texto por palavra ---------- */
function splitWords(el: HTMLElement): void {
  if (el.dataset.splitDone === '1') return;
  el.dataset.splitDone = '1';

  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const texts: Text[] = [];
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const t = node as Text;
    if (t.nodeValue && t.nodeValue.trim()) texts.push(t);
  }

  let index = 0;
  for (const text of texts) {
    const parts = (text.nodeValue || '').split(/(\s+)/);
    const frag = document.createDocumentFragment();
    for (const part of parts) {
      if (!part) continue;
      if (/^\s+$/.test(part)) {
        // espaço fica como nó de texto: a linha quebra e o espaço colapsa
        frag.appendChild(document.createTextNode(part));
      } else {
        const w = document.createElement('span');
        w.className = 'w';
        w.style.setProperty('--w', String(index++));
        w.textContent = part;
        frag.appendChild(w);
      }
    }
    text.parentNode?.replaceChild(frag, text);
  }
  el.style.setProperty('--w-total', String(index));
}

/* ---------- revelações ---------- */
type RevealEl = HTMLElement;
const pending = new Set<RevealEl>();

function show(el: RevealEl): void {
  if (!pending.has(el)) return;
  pending.delete(el);
  el.classList.add('is-in');
}

function inViewport(el: Element, slack = 0.12): boolean {
  const r = el.getBoundingClientRect();
  const vh = window.innerHeight || document.documentElement.clientHeight;
  if (r.width === 0 && r.height === 0) return false;
  return r.top < vh * (1 - slack * 0) + vh * slack && r.bottom > -vh * 0.15;
}

function initReveals(): void {
  const targets = Array.from(
    document.querySelectorAll<RevealEl>('[data-reveal], [data-split]'),
  );

  for (const el of targets) {
    if (el.hasAttribute('data-split')) splitWords(el);
    pending.add(el);
  }

  // rede 1 — IntersectionObserver
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            show(e.target as RevealEl);
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.01 },
    );
    for (const el of targets) io.observe(el);
  } else {
    for (const el of targets) show(el);
  }

  // rede 2 — varredura por scroll em rAF
  let scheduled = false;
  const sweep = () => {
    scheduled = false;
    if (!pending.size) return;
    for (const el of Array.from(pending)) {
      if (inViewport(el)) show(el);
    }
  };
  const onScroll = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(sweep);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  requestAnimationFrame(sweep);
  setTimeout(sweep, 260);

  // rede 3 — nada fica preso para sempre
  window.setTimeout(() => {
    for (const el of Array.from(pending)) show(el);
  }, 9000);
}

/* ---------- scroll: progresso, nav, parallax, hero, link ativo ---------- */
function initScroll(): void {
  const bar = document.querySelector<HTMLElement>('[data-progress]');
  const nav = document.querySelector<HTMLElement>('[data-nav]');
  const parallax = Array.from(document.querySelectorAll<HTMLElement>('[data-parallax]'));
  const heroOut = Array.from(document.querySelectorAll<HTMLElement>('[data-hero-out]'));
  const navLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-navlink]'));
  const sections = navLinks
    .map((a) => {
      const id = a.getAttribute('href')?.split('#')[1];
      return id ? document.getElementById(id) : null;
    })
    .filter((s): s is HTMLElement => !!s);

  let lastY = window.scrollY;
  let ticking = false;

  const frame = () => {
    ticking = false;
    const y = window.scrollY;
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const reduced = isReduced();

    if (bar) bar.style.transform = `scaleX(${Math.min(1, Math.max(0, y / max))})`;

    if (nav) {
      nav.classList.toggle('is-solid', y > 24);
      const goingDown = y > lastY + 4;
      const goingUp = y < lastY - 4;
      if (goingDown && y > 380) nav.classList.add('is-hidden');
      else if (goingUp || y < 120) nav.classList.remove('is-hidden');
    }

    if (!reduced) {
      const vh = window.innerHeight;
      for (const el of parallax) {
        const r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) continue;
        const speed = parseFloat(el.dataset.parallax || '0.12');
        const center = r.top + r.height / 2 - vh / 2;
        el.style.transform = `translate3d(0, ${(-center * speed).toFixed(2)}px, 0)`;
      }
      for (const el of heroOut) {
        const p = Math.min(1, y / Math.max(1, window.innerHeight * 0.85));
        el.style.opacity = String(1 - p * 0.95);
        el.style.transform = `translate3d(0, ${(p * 46).toFixed(1)}px, 0)`;
      }
    }

    if (sections.length) {
      const probe = y + window.innerHeight * 0.32;
      let active: string | null = null;
      for (const s of sections) {
        if (s.offsetTop <= probe) active = s.id;
      }
      for (const a of navLinks) {
        const id = a.getAttribute('href')?.split('#')[1];
        const on = !!id && id === active;
        a.classList.toggle('is-active', on);
        if (on) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      }
    }

    lastY = y;
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(frame);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  frame();
}

/* ---------- ponteiro fino: brilho e botões magnéticos ---------- */
function initPointer(): void {
  if (!window.matchMedia('(pointer: fine)').matches) return;

  const glows = Array.from(document.querySelectorAll<HTMLElement>('[data-glow]'));
  for (const el of glows) {
    el.addEventListener(
      'pointermove',
      (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`);
        el.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`);
      },
      { passive: true },
    );
  }

  const magnets = Array.from(document.querySelectorAll<HTMLElement>('.magnetic'));
  for (const el of magnets) {
    let raf = 0;
    const move = (e: PointerEvent) => {
      if (isReduced()) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) * 0.18;
        const dy = (e.clientY - (r.top + r.height / 2)) * 0.22;
        el.style.transform = `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0)`;
      });
    };
    const reset = () => {
      cancelAnimationFrame(raf);
      el.style.transform = '';
    };
    el.addEventListener('pointermove', move, { passive: true });
    el.addEventListener('pointerleave', reset, { passive: true });
    el.addEventListener('blur', reset);
  }
}

/* ---------- imagens ---------- */
function initImages(): void {
  const imgs = Array.from(document.querySelectorAll<HTMLImageElement>('.img-fade'));
  for (const img of imgs) {
    if (img.complete && img.naturalWidth > 0) {
      img.classList.add('is-loaded');
    } else {
      img.addEventListener('load', () => img.classList.add('is-loaded'), { once: true });
      img.addEventListener('error', () => img.classList.add('is-loaded'), { once: true });
    }
  }
  // nenhuma imagem pode ficar transparente por falha de rede
  window.setTimeout(() => {
    for (const img of imgs) img.classList.add('is-loaded');
  }, 5000);
}

/* ---------- contadores ---------- */
function initCounters(): void {
  const els = Array.from(document.querySelectorAll<HTMLElement>('[data-count]'));
  if (!els.length) return;

  const run = (el: HTMLElement) => {
    if (el.dataset.counted === '1') return;
    el.dataset.counted = '1';
    const to = parseFloat(el.dataset.count || '0');
    const dec = parseInt(el.dataset.countDecimals || '0', 10);
    const prefix = el.dataset.countPrefix || '';
    const suffix = el.dataset.countSuffix || '';
    const fmt = (v: number) =>
      prefix +
      v.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec }) +
      suffix;

    if (isReduced()) {
      el.textContent = fmt(to);
      return;
    }
    const dur = 1250;
    let start = 0;
    const step = (t: number) => {
      if (!start) start = t;
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(to * eased);
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = fmt(to);
    };
    requestAnimationFrame(step);
  };

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            run(e.target as HTMLElement);
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.3 },
    );
    for (const el of els) io.observe(el);
  } else {
    for (const el of els) run(el);
  }
  window.setTimeout(() => els.forEach(run), 9000);
}

/* ---------- menu mobile: fecha ao navegar e com Escape ---------- */
function initMobileNav(): void {
  const menu = document.querySelector<HTMLDetailsElement>('[data-mobile-menu]');
  if (!menu) return;
  menu.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    if (t.closest('a')) menu.open = false;
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.open) {
      menu.open = false;
      menu.querySelector('summary')?.focus();
    }
  });
  menu.addEventListener('toggle', () => {
    document.body.style.overflow = menu.open ? 'hidden' : '';
  });
}

/* ---------- arranque ---------- */
function boot(): void {
  try {
    initMotionToggle();
    initReveals();
    initScroll();
    initPointer();
    initImages();
    initCounters();
    initMobileNav();
  } catch (err) {
    // se qualquer coisa explodir, o conteúdo aparece
    root.classList.add('motion-failed');
    // eslint-disable-next-line no-console
    console.error('[motion]', err);
  } finally {
    root.classList.add('motion-ready');
    window.clearTimeout((window as unknown as { __motionFail?: number }).__motionFail);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}

export {};
