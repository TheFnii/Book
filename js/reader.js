// Lecteur : scène, grimoire, ouverture magique, pages qui tournent.
import { coverSVG, fitCoverText, spineSVG } from './cover.js';
import { resolveSrc } from './store.js';
import { FX } from './fx.js';
import { Sound } from './sound.js';
import { Oracle } from './oracle.js';
import { LunarCalendar } from './lunar.js';
import { Cards } from './cards.js';
import { Lenormand } from './lenormand.js';
import { DESK, BALL, CARD_RATIO, LENORMAND_RATIO } from './config.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const I = (d) => `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
export const ICONS = {
  prev: I('<path d="M15 5l-7 7 7 7"/>'),
  next: I('<path d="M9 5l7 7-7 7"/>'),
  toc: I('<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1.2"/><circle cx="4.5" cy="12" r="1.2"/><circle cx="4.5" cy="18" r="1.2"/>'),
  zoom: I('<circle cx="10.5" cy="10.5" r="6.5"/><path d="M20 20l-4.8-4.8M10.5 7.5v6M7.5 10.5h6"/>'),
  soundOn: I('<path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4z"/><path d="M15.5 9a4.5 4.5 0 010 6M18.2 6.3a8.4 8.4 0 010 11.4"/>'),
  soundOff: I('<path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/>'),
  fullscreen: I('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>'),
  book: I('<path d="M12 6.5C10 5 7 4.5 3.5 5v13.5c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5z"/><path d="M12 6.5V20"/>'),
  close: I('<path d="M6 6l12 12M18 6L6 18"/>'),
};

function stackShadow(n, dir, u) {
  const cols = ['#efe4cc', '#d6c7a5', '#f4ead6', '#cbbb96'];
  const s = [];
  for (let i = 1; i <= n; i++) s.push(`${(dir * i * u).toFixed(2)}px ${(i * u * 0.7).toFixed(2)}px 0 ${cols[i % 4]}`);
  return s.join(',') || 'none';
}

export class Reader {
  constructor(root, { preview = false } = {}) {
    this.root = root;
    this.preview = preview;
    this.state = 'closed';
    this.sound = new Sound();
    this.pageEls = [];
    this.dir = 1;
    this.ratio = 0.707;
    this.onResize = this.onResize.bind(this);
    window.addEventListener('resize', this.onResize);
    this.buildShell();
    this.fx = new FX(this.q('.fx'));
    this.fx.setAmbient(38);
  }

  q(sel) { return this.root.querySelector(sel); }

  buildShell() {
    this.root.innerHTML = `
      <div class="scene" aria-hidden="true"><div class="desk"></div><div class="light"></div><div class="candle"></div></div>
      <main class="stage">
        <div class="book">
          <div class="glow glow-closed"></div>
          <div class="glow glow-open"></div>
          <div class="board board-l"></div>
          <div class="board board-r"></div>
          <div class="stack stack-l"></div>
          <div class="stack stack-r"></div>
          <div class="flip"></div>
          <div class="pagelight"></div>
          <div class="spine">${spineSVG()}</div>
          <div class="cover" role="button" tabindex="0" aria-label="Ouvrir le grimoire">
            <div class="face front"></div>
            <div class="face back"><div class="endpaper page--left"><div class="page-inner parchment"></div></div></div>
          </div>
        </div>
        <p class="hint">Touchez le grimoire pour l'ouvrir</p>
      </main>
      <canvas class="fx" aria-hidden="true"></canvas>
      <nav class="toolbar" aria-label="Navigation du livre">
        <button type="button" data-act="prev" title="Page précédente" aria-label="Page précédente">${ICONS.prev}</button>
        <span class="pageinfo" aria-live="polite"></span>
        <button type="button" data-act="next" title="Page suivante" aria-label="Page suivante">${ICONS.next}</button>
        <span class="sep"></span>
        <button type="button" data-act="toc" title="Sommaire" aria-label="Sommaire">${ICONS.toc}</button>
        <button type="button" data-act="zoom" title="Agrandir" aria-label="Agrandir les pages">${ICONS.zoom}</button>
        <button type="button" data-act="sound" title="Son" aria-label="Activer ou couper le son"></button>
        <button type="button" data-act="fullscreen" title="Plein écran" aria-label="Plein écran">${ICONS.fullscreen}</button>
        <button type="button" data-act="close" title="Fermer le livre" aria-label="Fermer le livre">${ICONS.book}</button>
      </nav>
      <section class="panel toc" hidden aria-label="Sommaire">
        <div class="panel-card">
          <header><h2>Sommaire</h2><button type="button" class="icon-btn" data-act="toc-close" aria-label="Fermer">${ICONS.close}</button></header>
          <ol class="toc-list"></ol>
        </div>
      </section>
      <section class="zoom" hidden aria-label="Pages agrandies">
        <div class="zoom-strip"></div>
        <button type="button" class="icon-btn zoom-close" data-act="zoom-close" aria-label="Fermer">${ICONS.close}</button>
        <p class="zoom-help">Touchez une page pour zoomer davantage</p>
      </section>
      <div class="toast" role="status"></div>
      ${this.preview ? '<div class="ribbon">Aperçu du brouillon</div>' : ''}
    `;
    this.root.classList.toggle('preview', this.preview);
    this.bookEl = this.q('.book');
    this.coverEl = this.q('.cover');
    this.flipEl = this.q('.flip');
    this.toolbar = this.q('.toolbar');
    if (!document.fullscreenEnabled) this.q('[data-act="fullscreen"]').remove();
    this.updateSoundBtn();

    this.coverEl.addEventListener('click', () => this.open());
    this.coverEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.open(); }
    });
    this.q('.hint').addEventListener('click', () => this.open());
    this.root.addEventListener('click', (e) => {
      const b = e.target.closest('[data-act]');
      if (b) this.action(b.dataset.act);
    });
    this.flipEl.addEventListener('pointerdown', (e) => {
      const r = this.flipEl.getBoundingClientRect();
      this.dir = e.clientX > r.left + r.width / 2 ? 1 : -1;
    });
    document.addEventListener('keydown', (e) => this.onKey(e));
    document.addEventListener('fullscreenchange', () => this.onResize());
  }

  async load(book) {
    this.book = book;
    this.ratio = book.pageRatio || 0.707;
    document.title = [book.cover.line1, book.cover.line2].filter(Boolean).join(' ') || 'Grimoire';

    const front = this.q('.face.front');
    if (book.cover.image) {
      const img = new Image();
      img.className = 'cover-img';
      img.alt = '';
      img.src = await resolveSrc(book.cover.image);
      front.appendChild(img);
    } else {
      front.innerHTML = coverSVG(book.cover);
      fitCoverText(front);
    }
    front.insertAdjacentHTML('beforeend', '<div class="shine"></div>');

    if (book.background) {
      this.q('.desk').style.backgroundImage = `url("${await resolveSrc(book.background)}")`;
      this.q('.scene').classList.add('custom-bg');
    }

    this.layout();
    this.buildPages();
    if (book.oracle && book.oracle.enabled) {
      this.oracle = new Oracle(this, book.oracle);
      this.oracle.layout();
    }
    if (book.lunar && book.lunar.enabled) {
      this.lunar = new LunarCalendar(this, book.lunar);
      this.lunar.layout();
    }
    if (book.cards && book.cards.enabled) {
      this.cards = new Cards(this, book.cards);
      this.cards.layout();
    }
    if (book.lenormand && book.lenormand.enabled) {
      this.lenormand = new Lenormand(this, book.lenormand);
      this.lenormand.layout();
    }
    this.root.classList.add('ready');
  }

  // Pages du livre : [page de garde] + pages + (page blanche finale si nombre impair).
  buildPages() {
    const items = [{ blank: true, endpaper: true }, ...this.book.pages];
    if (items.length % 2) items.push({ blank: true });
    this.items = items;
    this.pageEls = items.map((it, i) => {
      const el = document.createElement('div');
      el.className = 'page ' + (i % 2 ? 'page--right' : 'page--left');
      el.dataset.density = 'soft';
      const inner = document.createElement('div');
      inner.className = 'page-inner';
      if (it.blank) {
        inner.classList.add('parchment');
      } else {
        const img = document.createElement('img');
        img.alt = it.title || `Page ${i}`;
        img.decoding = 'async';
        img.draggable = false;
        inner.appendChild(img);
        el._img = img;
        el._src = it.src;
      }
      el.appendChild(inner);
      return el;
    });

    this.pf = new window.St.PageFlip(this.flipEl, {
      width: Math.round(1000 * this.ratio),
      height: 1000,
      size: 'stretch',
      minWidth: 40,
      maxWidth: 6000,
      minHeight: 60,
      maxHeight: 9000,
      usePortrait: false,
      showCover: false,
      autoSize: true,
      drawShadow: true,
      maxShadowOpacity: 0.55,
      flippingTime: 950,
      mobileScrollSupport: false,
      showPageCorners: true,
      swipeDistance: 25,
    });
    this.pf.loadFromHTML(this.pageEls);
    this.pf.on('flip', (e) => this.onFlip(e.data));
    this.pf.on('changeState', (e) => {
      if (e.data === 'flipping') this.onFlipping();
      if (e.data === 'user_fold' || e.data === 'fold_corner') this.preload(this.pf.getCurrentPageIndex(), 6);
    });

    this.preload(0, 4);
    const first = this.pageEls[1];
    this.firstReady = first && first._img ? this.imgReady(first._img) : Promise.resolve();
    this.onFlip(0);
  }

  imgReady(img) {
    return new Promise((resolve) => {
      const check = () => (img.complete && img.naturalWidth ? resolve() : null);
      img.addEventListener('load', resolve, { once: true });
      img.addEventListener('error', resolve, { once: true });
      check();
    });
  }

  preload(center, ahead = 5) {
    for (let i = Math.max(0, center - 2); i <= center + ahead; i++) {
      const el = this.pageEls[i];
      if (el && el._img && !el._loading) {
        el._loading = true;
        resolveSrc(el._src).then((u) => { el._img.src = u; });
      }
    }
  }

  layout() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    // Écran bas et large (téléphone en paysage) : barre d'outils verticale à droite.
    const compact = vh < 540 && vw > vh;
    this.root.classList.toggle('compact', compact);
    const bar = compact ? 0 : 66;
    const side = compact ? 62 : 0;
    const pad = vw < 600 || compact ? 10 : 26;
    const stageW = vw - side;
    const stageH = vh - bar;
    const availW = stageW - pad * 2;
    const availH = stageH - pad * 2;
    const r = this.ratio;
    const bmF = 0.04;
    const pwMax = Math.max(60, Math.floor(Math.min(availW / (2 + 2 * bmF), availH / (1 / r + 2 * bmF + 0.03))));

    // Le livre est centré sur le sous-main ; la boule est posée sur le bois, à côté.
    const oracleOn = !!(this.book && this.book.oracle && this.book.oracle.enabled);
    const lunarOn = !!(this.book && this.book.lunar && this.book.lunar.enabled);
    const cardsOn = !!(this.book && this.book.cards && this.book.cards.enabled);
    const leOn = !!(this.book && this.book.lenormand && this.book.lenormand.enabled);
    const objectsOn = oracleOn || lunarOn || cardsOn || leOn;
    const labelH = 44; // place du texte sous le paquet de cartes
    const P = DESK.pad;
    const R = DESK.ratio;
    const pcx = P.x + P.w / 2;
    const pcy = P.y + P.h / 2;
    const topRatio = BALL.top.h / BALL.top.w;
    const hx = stageW / 2;
    let hy = stageH / 2;
    let H;
    let ix;
    let iy;
    let ball = null;
    let dial = null;
    let deck = null;
    let leDeck = null;
    let dims;
    const size = (pw) => {
      const ph = pw / r;
      const bm = Math.round(pw * bmF);
      const coverW = pw + bm;
      const coverH = ph + 2 * bm;
      const cs = Math.min((availW * 0.84) / coverW, (availH * 0.84) / coverH, 2.3);
      return { pw, ph, bm, coverW, coverH, cs, spreadW: 2 * pw + 2 * bm, spreadH: ph + 2 * bm + ph * 0.03 };
    };

    if (vw / vh >= 1.15) {
      // Écran large : sous-main centré, boule sur le bois à droite (on réduit un peu le livre si besoin).
      const minBall = objectsOn ? Math.min(Math.max(vw * 0.085, 70), 150) : 0;
      const maxPadW = stageW - 2 * (minBall / 0.74 + 8);
      let pw = pwMax;
      for (let i = 0; i < 3; i++) {
        dims = size(pw);
        const hBook = Math.max(
          Math.max(dims.spreadW * 1.07, dims.cs * dims.coverW * 1.3) / (P.w * R),
          Math.max(dims.spreadH * 1.08, dims.cs * dims.coverH * 1.08) / P.h,
        );
        const hCover = Math.max(hx / (pcx * R), (vw - hx) / ((1 - pcx) * R), hy / pcy, (vh - hy) / (1 - pcy));
        H = Math.max(hBook, hCover);
        const padW = P.w * H * R;
        if (!objectsOn || padW <= maxPadW + 1 || hBook <= hCover) break;
        pw = Math.max(60, Math.floor(pw * Math.max(maxPadW / padW, hCover / hBook)));
      }
      ix = hx - pcx * H * R;
      iy = hy - pcy * H;
      if (objectsOn) {
        const padRight = ix + (P.x + P.w) * H * R;
        const padLeft = ix + P.x * H * R;
        const strip = stageW - padRight;
        const w = Math.min(strip * 0.74, 230, (vh * 0.34) / topRatio);
        const y = Math.max(12, iy + P.y * H);
        if (w >= 50) {
          if (oracleOn) ball = { w, h: w * topRatio, x: padRight + (strip - w) / 2, y };
          const dw = Math.min(w, padLeft * 0.82);
          if (lunarOn && dw >= 50) dial = { w: dw, h: dw, x: (padLeft - dw) / 2, y };
          if (lunarOn && !dial) ball = null;
          // Paquets de cartes : les « Messages » sous le cadran (à gauche), le Lenormand sous la boule (à droite).
          const bottom = stageH - 10 - labelH;
          const cols = [];
          if (dw >= 50) cols.push({ col: dw, cx: padLeft / 2, top: dial ? dial.y + dial.h + Math.max(18, dw * 0.16) : y });
          cols.push({ col: w, cx: padRight + strip / 2, top: ball ? ball.y + ball.h + Math.max(14, w * 0.1) : y });
          // kW : largeur de l'objet / largeur d'une carte (le Lenormand a son livret à côté du paquet).
          const place = (ratio, kW, maxW, pref) => {
            for (const sp of pref === 'right' ? [...cols].reverse() : cols) {
              let cw = Math.min((sp.col * 0.58) / kW, maxW);
              let ch = cw / ratio;
              if (sp.top + ch > bottom) { ch = bottom - sp.top; cw = ch * ratio; }
              if (cw >= 34) {
                const box = { w: cw * kW, h: ch, x: sp.cx - (cw * kW) / 2, y: sp.top };
                sp.top += ch + labelH + Math.max(16, sp.col * 0.12);
                return box;
              }
            }
            return null;
          };
          if (cardsOn) deck = place(CARD_RATIO, 1, 130, 'left');
          if (leOn) leDeck = place(LENORMAND_RATIO, 1.45, 96, 'right');
        }
      }
    }
    if (H === undefined || (oracleOn && !ball) || (lunarOn && !dial) || (cardsOn && !deck) || (leOn && !leDeck)) {
      // Écran étroit : boule en haut, sous-main et livre juste en dessous.
      dims = size(pwMax);
      const w = objectsOn ? Math.min(Math.max(Math.min(vw, vh) * 0.2, 64), 190) : 0;
      const objH = oracleOn ? w * topRatio : w;
      const decksOn = cardsOn || leOn;
      const deckH = decksOn ? Math.max(objH * 0.72, 56) : 0;
      const band = objectsOn ? Math.max(oracleOn || lunarOn ? objH + 24 : 0, decksOn ? 12 + deckH + labelH : 0) : 0;
      H = Math.max(vh, vw / R, band / P.y, (dims.spreadW * 1.07) / (P.w * R));
      iy = Math.min(0, Math.max(band - P.y * H, vh - H));
      ix = hx - pcx * H * R;
      const padTop = iy + P.y * H;
      const padBottom = Math.min(iy + (P.y + P.h) * H, stageH);
      hy = (padTop + padBottom) / 2;
      dims.cs = Math.min(dims.cs, ((padBottom - padTop) * 0.9) / dims.coverH);
      if (oracleOn) ball = { w, h: w * topRatio, x: stageW - w - 12, y: 12 };
      if (lunarOn) dial = { w, h: w, x: 12, y: 12 };
      // Les paquets se partagent l'espace entre le cadran et la boule.
      const mids = [cardsOn && 'cards', leOn && 'le'].filter(Boolean);
      const x0 = lunarOn ? 12 + w + 8 : 12;
      const x1 = oracleOn ? stageW - w - 20 : stageW - 12;
      const slotW = (x1 - x0) / (mids.length || 1);
      mids.forEach((k, i) => {
        const cx = x0 + slotW * (i + 0.5);
        const bw = k === 'cards' ? deckH * CARD_RATIO : deckH * LENORMAND_RATIO * 1.45;
        const box = { w: bw, h: deckH, x: cx - bw / 2, y: 12, lw: mids.length > 1 ? Math.max(70, slotW - 6) : 0 };
        if (k === 'cards') deck = box; else leDeck = box;
      });
    }
    const { pw, ph, bm, cs } = dims;
    this.ballRest = ball;
    this.dialRest = dial;
    this.deckRest = deck;
    this.leRest = leDeck;

    const desk = this.q('.desk');
    if (!this.book || !this.book.background) {
      desk.style.backgroundSize = `${(H * R).toFixed(1)}px ${H.toFixed(1)}px`;
      desk.style.backgroundPosition = `${ix.toFixed(1)}px ${iy.toFixed(1)}px`;
    }
    this.root.style.setProperty('--lx', ((hx / vw) * 100).toFixed(1) + '%');
    this.root.style.setProperty('--ly', ((hy / vh) * 100).toFixed(1) + '%');

    const s = this.bookEl.style;
    s.setProperty('--pw', pw + 'px');
    s.setProperty('--ph', ph + 'px');
    s.setProperty('--bm', bm + 'px');
    s.setProperty('--u', (pw / 300).toFixed(3) + 'px');
    s.setProperty('--cs', cs.toFixed(4));
    s.setProperty('--ctx', (-cs * (pw / 2 + bm / 2)).toFixed(2) + 'px');
    s.setProperty('--bx', (hx - stageW / 2).toFixed(1) + 'px');
    s.setProperty('--by', (hy - stageH / 2).toFixed(1) + 'px');
    this.geom = { pw, ph, bm };
    this.portraitHint = vw < vh && vw < 760;
    this.updateStacks();
    if (this.oracle) this.oracle.layout();
    if (this.lunar) this.lunar.layout();
    if (this.cards) this.cards.layout();
    if (this.lenormand) this.lenormand.layout();
  }

  onResize() {
    this.layout();
  }

  updateStacks() {
    if (!this.geom) return;
    const u = this.geom.pw / 300;
    const total = this.items ? this.items.length : 2;
    const idx = this.pf ? this.pf.getCurrentPageIndex() : 0;
    const left = idx + 1;
    const right = total - idx - 2;
    const n = (c) => (c <= 0 ? 0 : 1 + Math.min(7, Math.floor(c / 6)));
    this.q('.stack-l').style.boxShadow = stackShadow(n(left - 1), -1, u);
    this.q('.stack-r').style.boxShadow = stackShadow(n(right) || 1, 1, u);
  }

  contentPages() {
    return this.book ? this.book.pages.length : 0;
  }

  onFlip(idx) {
    this.preload(idx, 5);
    this.updateStacks();
    const n = this.contentPages();
    const vis = [idx, idx + 1].filter((i) => i >= 1 && i <= n);
    const info = this.q('.pageinfo');
    info.textContent = n ? `${vis.length ? vis.join('–') : '·'} / ${n}` : '';
    this.q('[data-act="prev"]').disabled = idx <= 0;
    this.q('[data-act="next"]').disabled = idx + 2 >= this.pageEls.length;
  }

  onFlipping() {
    this.sound.page();
    const r = this.flipEl.getBoundingClientRect();
    const x = this.dir > 0 ? r.right : r.left;
    for (let i = 0; i < 10; i++) {
      this.fx.burst(x - this.dir * 6, r.top + Math.random() * r.height, {
        count: 1.4, speed: 50, angle: -Math.PI / 2 - this.dir * 0.6, spread: 1.4, life: 1.2, stars: 0.4, size: 0.8,
      });
    }
  }

  next() { if (this.state === 'open') { this.dir = 1; this.pf.flipNext('bottom'); } }
  prev() { if (this.state === 'open') { this.dir = -1; this.pf.flipPrev('bottom'); } }

  async open() {
    if (this.state !== 'closed' || !this.pf) return;
    if (this.oracle && this.oracle.state === 'focus') return;
    if (this.lunar && this.lunar.isOpen) return;
    if (this.cards && this.cards.isOpen) return;
    if (this.lenormand && this.lenormand.isOpen) return;
    this.state = 'opening';
    this.sound.unlock();
    this.sound.chime();
    const rect = this.coverEl.getBoundingClientRect();
    this.fx.edges(rect, { count: 110, speed: 120 });
    this.fx.burst(rect.left + rect.width / 2, rect.top + rect.height * 0.5, { count: 55, speed: 300, stars: 0.45, life: 1.8 });
    this.bookEl.classList.add('awake');
    this.root.classList.add('is-opening');

    await Promise.all([sleep(480), Promise.race([this.firstReady, sleep(1500)])]);

    this.sound.cover();
    this.bookEl.classList.add('cover-open');
    if (this.oracle) this.oracle.layout();

    const st = this.q('.stage').getBoundingClientRect();
    const cx = st.left + st.width / 2;
    const cy = st.top + st.height / 2;
    const { pw, ph } = this.geom;
    setTimeout(() => {
      this.bookEl.classList.add('spill');
      this.fx.column(cx + pw * 0.08, cy - ph / 2, cy + ph / 2, { count: 90, spread: pw * 0.25 });
    }, 650);
    setTimeout(() => {
      this.fx.burst(cx, cy - ph / 2, { count: 30, speed: 140, spread: 2.6, stars: 0.5 });
    }, 1300);

    await sleep(1700);
    this.bookEl.classList.add('pages-front');
    this.root.classList.remove('is-opening');
    this.root.classList.add('is-open');
    this.state = 'open';
    this.fx.setAmbient(22);
    setTimeout(() => this.bookEl.classList.remove('spill'), 800);
    if (this.portraitHint) this.toast('Tournez l’écran pour agrandir le livre ↻', 4200);
  }

  async close() {
    if (this.state !== 'open') return;
    this.state = 'closing';
    if (this.oracle) this.oracle.layout();
    this.hidePanels();
    this.root.classList.remove('is-open');
    this.bookEl.classList.remove('pages-front');
    if (this.pf.getCurrentPageIndex() !== 0) this.pf.turnToPage(0);
    this.onFlip(0);
    this.sound.unlock();
    this.sound.cover(true);
    await sleep(30);
    this.bookEl.classList.remove('cover-open');
    await sleep(1650);
    this.bookEl.classList.remove('awake');
    const rect = this.coverEl.getBoundingClientRect();
    this.fx.edges(rect, { count: 40, speed: 60, life: 1.4 });
    this.fx.setAmbient(38);
    this.state = 'closed';
  }

  action(act) {
    switch (act) {
      case 'prev': this.prev(); break;
      case 'next': this.next(); break;
      case 'toc': this.showToc(); break;
      case 'toc-close': this.hidePanels(); break;
      case 'zoom': this.showZoom(); break;
      case 'zoom-close': this.hidePanels(); break;
      case 'sound':
        this.sound.setEnabled(!this.sound.enabled);
        this.sound.unlock();
        this.updateSoundBtn();
        this.sound.tink();
        break;
      case 'fullscreen':
        if (document.fullscreenElement) document.exitFullscreen();
        else document.documentElement.requestFullscreen().catch(() => {});
        break;
      case 'close': this.close(); break;
      default: break;
    }
  }

  updateSoundBtn() {
    const b = this.q('[data-act="sound"]');
    b.innerHTML = this.sound.enabled ? ICONS.soundOn : ICONS.soundOff;
    b.title = this.sound.enabled ? 'Couper le son' : 'Activer le son';
    b.classList.toggle('off', !this.sound.enabled);
  }

  onKey(e) {
    if (e.target && /input|textarea|select/i.test(e.target.tagName)) return;
    if (this.oracle && this.oracle.state === 'focus') {
      if (e.key === 'Escape') this.oracle.close();
      return;
    }
    if (this.lunar && this.lunar.isOpen) {
      if (e.key === 'Escape') this.lunar.close();
      return;
    }
    if (this.cards && this.cards.isOpen) {
      if (e.key === 'Escape') this.cards.close();
      return;
    }
    if (this.lenormand && this.lenormand.isOpen) {
      if (e.key === 'Escape') this.lenormand.onEscape();
      return;
    }
    if (e.key === 'Escape') {
      if (!this.q('.toc').hidden || !this.q('.zoom').hidden) this.hidePanels();
      return;
    }
    if (this.state !== 'open' || !this.q('.zoom').hidden || !this.q('.toc').hidden) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); this.next(); }
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); this.prev(); }
  }

  hidePanels() {
    this.q('.toc').hidden = true;
    this.q('.zoom').hidden = true;
    this.root.classList.remove('panel-open');
  }

  async showToc() {
    const list = this.q('.toc-list');
    list.innerHTML = '';
    const pages = this.book.pages;
    for (let i = 0; i < pages.length; i++) {
      const p = pages[i];
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'toc-item';
      const thumb = document.createElement('span');
      thumb.className = 'toc-thumb' + (p.blank ? ' parchment' : '');
      if (!p.blank) {
        const img = document.createElement('img');
        img.loading = 'lazy';
        img.alt = '';
        resolveSrc(p.src).then((u) => { img.src = u; });
        thumb.appendChild(img);
      }
      const label = document.createElement('span');
      label.className = 'toc-label';
      label.innerHTML = `<small>Page ${i + 1}</small>`;
      const t = document.createElement('span');
      t.textContent = p.title || (p.blank ? 'Page blanche' : '');
      label.appendChild(t);
      btn.append(thumb, label);
      btn.addEventListener('click', () => {
        this.hidePanels();
        const target = i + 1;
        const cur = this.pf.getCurrentPageIndex();
        if (target === cur || target === cur + 1) return;
        this.dir = target > cur ? 1 : -1;
        this.preload(target, 3);
        this.pf.flip(target, 'bottom');
      });
      li.appendChild(btn);
      list.appendChild(li);
    }
    this.q('.toc').hidden = false;
    this.root.classList.add('panel-open');
    this.sound.tink();
  }

  async showZoom() {
    const strip = this.q('.zoom-strip');
    strip.innerHTML = '';
    strip.classList.remove('zoomed');
    const idx = this.pf.getCurrentPageIndex();
    const n = this.contentPages();
    const vis = [idx, idx + 1].filter((i) => i >= 1 && i <= n && !this.items[i].blank);
    if (!vis.length) return;
    for (const i of vis) {
      const img = document.createElement('img');
      img.alt = this.items[i].title || `Page ${i}`;
      img.src = await resolveSrc(this.items[i].src);
      strip.appendChild(img);
    }
    strip.classList.toggle('single', vis.length === 1);
    strip.onclick = (e) => {
      const img = e.target.closest('img');
      if (!img) return;
      const zoomed = strip.classList.toggle('zoomed');
      if (zoomed) {
        requestAnimationFrame(() => {
          img.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        });
      }
    };
    this.q('.zoom').hidden = false;
    this.root.classList.add('panel-open');
  }

  toast(msg, ms = 3000) {
    const t = this.q('.toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => t.classList.remove('show'), ms);
  }

  showError(msg) {
    this.q('.hint').textContent = msg;
    this.root.classList.add('ready', 'has-error');
  }
}
