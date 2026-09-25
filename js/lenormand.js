// Petit Lenormand : paquet et livret posés sur le bureau, table de tirage,
// significations à côté des cartes, interprétation globale et livret des règles.
import { CARDS, SPREADS, RULES } from './lenormand-data.js';
import { interpret, esc, pair } from './lenormand-reading.js';
import { cardArt, lenormandBackURL } from './lenormand-art.js';
import { resolveSrc } from './store.js';
import { LENORMAND_RATIO as LE_RATIO, DEFAULT_LENORMAND } from './config.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const isRed = (pc) => /[♥♦]/.test(pc);
const low = (s) => s.charAt(0).toLowerCase() + s.slice(1);

// Recto dessiné d'une carte (ou l'image choisie dans l'atelier).
export function cardFace(n, img) {
  const c = CARDS[n];
  if (img) return `<img class="le-full" src="${esc(img)}" alt="${esc(c.name)}" draggable="false">`;
  return `<span class="le-num">${n}</span><span class="le-pc${isRed(c.pc) ? ' red' : ''}">${c.pc}</span>
    <span class="le-art">${cardArt(n)}</span><span class="le-name">${c.name}</span>`;
}

export class Lenormand {
  constructor(reader, cfg) {
    this.reader = reader;
    this.root = reader.root;
    this.fx = reader.fx;
    this.sound = reader.sound;
    this.label = (cfg.label || '').trim() || DEFAULT_LENORMAND.label;
    this.paths = cfg.images && typeof cfg.images === 'object' ? cfg.images : {};
    this.urls = {};
    this.backSrc = lenormandBackURL();
    this.spread = SPREADS[1];
    this.drawn = null;
    this.isOpen = false;
    this.busy = false;
    this.seq = 0;
    this.build();
    this.loadImages(cfg.back);
  }

  async loadImages(back) {
    if (back) this.backSrc = (await resolveSrc(back)) || this.backSrc;
    await Promise.all(Object.entries(this.paths).map(async ([n, p]) => {
      if (p) this.urls[n] = await resolveSrc(p);
    }));
    this.root.querySelectorAll('.led-card img').forEach((img) => { img.src = this.backSrc; });
    this.renderGrid();
    this.renderBoard();
  }

  build() {
    const label = esc(this.label);
    const chips = SPREADS.map((s, i) => `<button type="button" class="le-chip${s === this.spread ? ' on' : ''}" data-spread="${i}">${s.name}<small>${s.count} carte${s.count > 1 ? 's' : ''}</small></button>`).join('');
    const spreadsHelp = SPREADS.map((s) => `<h4>${s.name} <small>· ${s.count} carte${s.count > 1 ? 's' : ''}</small></h4><p>${s.desc}</p>
      <ol>${s.positions.map((p) => `<li><b>${p.label}</b> — ${p.hint}</li>`).join('')}</ol>`).join('');
    this.root.insertAdjacentHTML('beforeend', `
      <button type="button" class="le-desk" aria-label="${label} : tirer les cartes">
        <span class="led-stack">
          <span class="led-glow"></span>
          <span class="led-card led-under"><img alt="" draggable="false"></span>
          <span class="led-card led-top"><img alt="" draggable="false"></span>
        </span>
        <span class="led-book" title="Le livret"><span class="led-book-title"></span></span>
        <span class="le-desk-label">${label}</span>
      </button>
      <div class="le-aura" aria-hidden="true"></div>
      <section class="le-ui" aria-hidden="true" aria-label="${label}">
        <button type="button" class="le-back">‹ Retour au grimoire</button>
        <button type="button" class="le-open-book"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 6.5C10 5 7 4.5 3.5 5v13.5c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5z"/><path d="M12 6.5V20"/></svg>Livret</button>
        <div class="le-wrap">
          <header class="le-head">
            <h2>${label}</h2>
            <p>36 cartes pour éclairer une question</p>
            <span class="oracle-divider"></span>
          </header>
          <nav class="le-spreads" aria-label="Type de tirage">${chips}</nav>
          <p class="le-desc"></p>
          <div class="le-ask">
            <input class="le-question" type="text" maxlength="140" placeholder="Ta question (facultatif)" aria-label="Ta question (facultatif)">
            <button type="button" class="le-draw">Mélanger et tirer</button>
          </div>
          <div class="le-main">
            <div class="le-board"></div>
            <div class="le-reading" hidden>
              <h3>Les cartes tirées</h3>
              <ol class="le-list"></ol>
            </div>
            <section class="le-global" hidden>
              <h3>Interprétation du tirage</h3>
              <div class="le-global-text"></div>
            </section>
          </div>
        </div>
        <aside class="le-booklet" aria-hidden="true" aria-label="Le livret">
          <header class="le-bhead">
            <h3>Le livret</h3>
            <button type="button" class="le-book-close" aria-label="Fermer le livret">✕</button>
          </header>
          <nav class="le-btabs">
            <button type="button" class="on" data-tab="rules">Les règles</button>
            <button type="button" data-tab="spreads">Les tirages</button>
            <button type="button" data-tab="cards">Les 36 cartes</button>
          </nav>
          <div class="le-bbody">
            <div class="le-pane" data-pane="rules">${RULES}</div>
            <div class="le-pane" data-pane="spreads" hidden>${spreadsHelp}</div>
            <div class="le-pane" data-pane="cards" hidden>
              <div class="le-grid"></div>
              <article class="le-detail" hidden></article>
            </div>
          </div>
        </aside>
      </section>`);
    this.desk = this.root.querySelector('.le-desk');
    this.ui = this.root.querySelector('.le-ui');
    this.booklet = this.ui.querySelector('.le-booklet');
    this.board = this.ui.querySelector('.le-board');
    this.reading = this.ui.querySelector('.le-reading');
    this.main = this.ui.querySelector('.le-main');
    this.globalEl = this.ui.querySelector('.le-global');
    this.drawBtn = this.ui.querySelector('.le-draw');
    this.labelEl = this.desk.querySelector('.le-desk-label');
    const q = (s) => this.ui.querySelector(s);

    this.desk.addEventListener('click', (e) => this.open(!!e.target.closest('.led-book')));
    q('.le-back').addEventListener('click', () => this.close());
    q('.le-open-book').addEventListener('click', () => this.openBooklet());
    q('.le-book-close').addEventListener('click', () => this.closeBooklet());
    this.drawBtn.addEventListener('click', () => this.draw());
    q('.le-question').addEventListener('keydown', (e) => { if (e.key === 'Enter') this.draw(); });
    q('.le-spreads').addEventListener('click', (e) => {
      const b = e.target.closest('[data-spread]');
      if (!b || this.busy) return;
      this.setSpread(SPREADS[Number(b.dataset.spread)]);
    });
    q('.le-btabs').addEventListener('click', (e) => {
      const b = e.target.closest('[data-tab]');
      if (b) this.showTab(b.dataset.tab);
    });
    this.ui.addEventListener('click', (e) => {
      const link = e.target.closest('[data-card]');
      if (link) { this.openBooklet(Number(link.dataset.card)); return; }
      const card = e.target.closest('.le-slot.flipped');
      if (card) this.focusItem(Number(card.dataset.i));
      if (e.target.closest('.le-detail-back')) this.showGrid();
    });
    this.setSpread(this.spread);
  }

  /* ---------- Bureau ---------- */
  layout() {
    const rest = this.reader.leRest;
    this.desk.hidden = !rest;
    this.sizeBoard();
    if (!rest) return;
    const d = this.desk.style;
    d.left = rest.x.toFixed(1) + 'px';
    d.top = rest.y.toFixed(1) + 'px';
    d.width = rest.w.toFixed(1) + 'px';
    d.height = rest.h.toFixed(1) + 'px';
    this.desk.style.setProperty('--dw', (rest.h * LE_RATIO).toFixed(1) + 'px');
    this.labelEl.style.width = rest.lw ? rest.lw.toFixed(0) + 'px' : '';
    const vw = window.innerWidth;
    const lw = this.labelEl.offsetWidth;
    const lcx = rest.x + rest.w / 2;
    const shift = Math.max(6 + lw / 2 - lcx, Math.min(0, vw - 6 - lw / 2 - lcx));
    this.labelEl.style.setProperty('--lsh', shift.toFixed(1) + 'px');
    this.root.style.setProperty('--lex', lcx.toFixed(1) + 'px');
    this.root.style.setProperty('--ley', (rest.y + rest.h / 2).toFixed(1) + 'px');
  }

  canOpen() {
    const r = this.reader;
    if (this.isOpen || !r.leRest) return false;
    if (r.state === 'opening' || r.state === 'closing') return false;
    if (r.oracle && r.oracle.state === 'focus') return false;
    if (r.lunar && r.lunar.isOpen) return false;
    if (r.cards && r.cards.isOpen) return false;
    return true;
  }

  open(withBooklet = false) {
    if (!this.canOpen()) return;
    this.isOpen = true;
    this.reader.hidePanels();
    this.sound.unlock();
    this.sound.cardDraw();
    this.root.classList.add('lenormand-open');
    this.ui.setAttribute('aria-hidden', 'false');
    this.ui.scrollTop = 0;
    this.sizeBoard();
    if (withBooklet) setTimeout(() => this.openBooklet(), 350);
    setTimeout(() => { if (this.isOpen && !this.bookletOpen) this.drawBtn.focus({ preventScroll: true }); }, 700);
  }

  close() {
    if (!this.isOpen) return;
    this.closeBooklet();
    this.isOpen = false;
    this.seq++;
    this.busy = false;
    this.drawBtn.disabled = false;
    this.root.classList.remove('lenormand-open');
    this.ui.setAttribute('aria-hidden', 'true');
    if (document.activeElement) document.activeElement.blur();
  }

  onEscape() {
    if (this.bookletOpen) this.closeBooklet();
    else this.close();
  }

  /* ---------- Tirage ---------- */
  setSpread(spread) {
    this.spread = spread;
    this.drawn = null;
    this.ui.querySelectorAll('.le-chip').forEach((b) => b.classList.toggle('on', SPREADS[Number(b.dataset.spread)] === spread));
    this.ui.querySelector('.le-desc').textContent = spread.desc;
    this.drawBtn.textContent = 'Mélanger et tirer';
    this.reading.hidden = true;
    this.globalEl.hidden = true;
    this.main.classList.remove('has-reading');
    this.renderBoard();
  }

  // Taille des cartes selon le tirage et l'écran.
  sizeBoard() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const wide = vw >= 980;
    const sp = this.spread;
    const rows = sp.id === 'croix' || sp.id === 'neuf' ? 3 : 1;
    const gap = vw < 600 ? 8 : 14;
    const side = wide && this.main && this.main.classList.contains('has-reading');
    const boardW = side ? Math.min(vw - 470 - 80, 760) : Math.min(vw - 28, wide ? 900 : 720);
    const max = { jour: 190, trois: 160, cinq: 128, croix: 116, neuf: 116 }[sp.id];
    let w = (boardW - (sp.cols - 1) * gap) / sp.cols;
    if (wide) w = Math.min(w, Math.max(88, ((vh - 240) / rows - 30 - gap) * LE_RATIO));
    w = Math.max(52, Math.min(max, w));
    this.board.style.setProperty('--lw', w.toFixed(1) + 'px');
    this.board.style.setProperty('--lg', gap + 'px');
  }

  renderBoard() {
    const sp = this.spread;
    this.board.dataset.spread = sp.id;
    this.sizeBoard();
    this.board.innerHTML = sp.positions.map((p, i) => {
      const n = this.drawn ? this.drawn[i] : 0;
      const state = !this.drawn ? ' idle' : this.revealed ? ' dealt flipped' : '';
      return `<div class="le-slot${state}" data-i="${i}"${p.area ? ` style="grid-area:${p.area}"` : ''}>
        <div class="le-card" aria-label="${esc(p.label)}">
          <span class="le-inner">
            <span class="le-face le-backface"><img src="${this.backSrc}" alt="" draggable="false"></span>
            <span class="le-face le-front">${n ? cardFace(n, this.urls[n]) : ''}</span>
          </span>
        </div>
        <span class="le-pos">${sp.count > 1 ? `${i + 1}. ` : ''}${p.label}</span>
      </div>`;
    }).join('');
  }

  shuffle() {
    const deck = Array.from({ length: 36 }, (_, i) => i + 1);
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }

  async draw() {
    if (!this.isOpen || this.busy) return;
    const seq = ++this.seq;
    this.busy = true;
    this.drawBtn.disabled = true;
    this.revealed = false;
    this.reading.hidden = true;
    this.globalEl.hidden = true;
    this.main.classList.remove('has-reading');
    const sp = this.spread;
    this.drawn = this.shuffle().slice(0, sp.count);
    this.renderBoard();
    this.sound.cardDraw();
    const slots = [...this.board.querySelectorAll('.le-slot')];
    await sleep(60);
    for (const s of slots) {
      if (seq !== this.seq) return;
      s.classList.add('dealt');
      await sleep(sp.count > 5 ? 90 : 140);
    }
    await sleep(420);
    for (const s of slots) {
      if (seq !== this.seq) return;
      this.sound.cardFlip();
      s.classList.add('flipped');
      await sleep(sp.count > 5 ? 180 : 300);
    }
    await sleep(500);
    if (seq !== this.seq) return;
    this.revealed = true;
    this.renderReading();
    this.sound.cardReveal();
    const r = this.board.getBoundingClientRect();
    this.fx.burst(r.left + r.width / 2, r.top + r.height / 2, { count: 26, speed: 160, stars: 0.5, life: 1.3 });
    this.busy = false;
    this.drawBtn.disabled = false;
    this.drawBtn.textContent = 'Nouveau tirage';
  }

  renderReading() {
    const sp = this.spread;
    const cards = this.drawn.map((n) => CARDS[n]);
    this.ui.querySelector('.le-list').innerHTML = cards.map((c, i) => {
      const p = sp.positions[i];
      return `<li class="le-item" data-i="${i}">
        <p class="le-item-pos">${sp.count > 1 ? `${i + 1}. ` : ''}${p.label} <i>— ${p.hint}</i></p>
        <h4><button type="button" class="le-link" data-card="${c.n}" title="Voir la carte dans le livret">${c.name}</button> <small class="${isRed(c.pc) ? 'red' : ''}">${c.pc}</small></h4>
        <p class="le-kw">${c.kw.join(' · ')}</p>
        <p>${c.sens}</p>
      </li>`;
    }).join('');
    const q = this.ui.querySelector('.le-question').value;
    this.ui.querySelector('.le-global-text').innerHTML = interpret(sp, cards, q).map((t) => `<p>${t}</p>`).join('');
    this.reading.hidden = false;
    this.globalEl.hidden = false;
    this.main.classList.add('has-reading');
    this.sizeBoard();
    if (window.innerWidth < 980) {
      setTimeout(() => this.globalEl.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
    }
  }

  focusItem(i) {
    const item = this.ui.querySelector(`.le-item[data-i="${i}"]`);
    if (!item) return;
    this.ui.querySelectorAll('.le-item.hl, .le-slot.hl').forEach((e) => e.classList.remove('hl'));
    item.classList.add('hl');
    const slot = this.board.querySelector(`.le-slot[data-i="${i}"]`);
    if (slot) slot.classList.add('hl');
    item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /* ---------- Livret ---------- */
  openBooklet(n) {
    this.bookletOpen = true;
    this.booklet.setAttribute('aria-hidden', 'false');
    this.ui.classList.add('book-open');
    this.sound.page();
    if (n) { this.showTab('cards'); this.showDetail(n); } else if (!this.tab) this.showTab('rules');
    setTimeout(() => { if (this.bookletOpen) this.booklet.querySelector('.le-book-close').focus({ preventScroll: true }); }, 400);
  }

  closeBooklet() {
    if (!this.bookletOpen) return;
    this.bookletOpen = false;
    this.booklet.setAttribute('aria-hidden', 'true');
    this.ui.classList.remove('book-open');
  }

  showTab(tab) {
    this.tab = tab;
    this.booklet.querySelectorAll('[data-tab]').forEach((b) => b.classList.toggle('on', b.dataset.tab === tab));
    this.booklet.querySelectorAll('[data-pane]').forEach((p) => { p.hidden = p.dataset.pane !== tab; });
    if (tab === 'cards') this.showGrid();
    this.booklet.querySelector('.le-bbody').scrollTop = 0;
  }

  renderGrid() {
    const grid = this.booklet.querySelector('.le-grid');
    grid.innerHTML = CARDS.slice(1).map((c) => `<button type="button" class="le-mini" data-card="${c.n}" aria-label="${esc(c.name)}"><span class="le-face le-front">${cardFace(c.n, this.urls[c.n])}</span></button>`).join('');
  }

  showGrid() {
    this.booklet.querySelector('.le-grid').hidden = false;
    this.booklet.querySelector('.le-detail').hidden = true;
  }

  showDetail(n) {
    const c = CARDS[n];
    const d = this.booklet.querySelector('.le-detail');
    d.innerHTML = `<button type="button" class="le-detail-back">‹ Toutes les cartes</button>
      <div class="le-detail-top">
        <div class="le-big"><span class="le-face le-front">${cardFace(n, this.urls[n])}</span></div>
        <div>
          <h4>${c.n}. ${c.name}</h4>
          <p class="le-pcline">Carte à jouer : <span class="${isRed(c.pc) ? 'red' : ''}">${c.pc}</span></p>
          <p class="le-kw">${c.kw.join(' · ')}</p>
        </div>
      </div>
      <p>${c.sens}</p>
      <p><b>En amour :</b> ${low(c.amour)}</p>
      <p><b>Au travail :</b> ${low(c.travail)}</p>
      <p><b>Conseil :</b> ${c.conseil}</p>
      <p class="le-pairs"><b>En paire :</b> placée en premier, elle désigne <i>${c.nom}</i> ; placée en second, elle précise sa voisine, par exemple <i>${pair(CARDS[n === 24 ? 1 : 24], c)}</i>.</p>`;
    this.booklet.querySelector('.le-grid').hidden = true;
    d.hidden = false;
    this.booklet.querySelector('.le-bbody').scrollTop = 0;
  }
}
