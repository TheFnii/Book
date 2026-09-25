// Jeu de cartes « Messages de l'univers » posé sur le bureau.
// Au clic, une carte est tirée au hasard : elle quitte le paquet, vient au centre et se retourne.
import { CARD_RATIO, DEFAULT_CARDS } from './config.js';
import { resolveSrc } from './store.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const f = (n) => Math.round(n * 10) / 10;
const TILT = -7; // inclinaison du paquet sur le bureau (degrés)

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* ---------- Dos de carte dessiné (300 × 500) ---------- */
function sparkle(cx, cy, r) {
  return `M${f(cx)} ${f(cy - r)}Q${f(cx)} ${f(cy)} ${f(cx + r)} ${f(cy)}Q${f(cx)} ${f(cy)} ${f(cx)} ${f(cy + r)}Q${f(cx)} ${f(cy)} ${f(cx - r)} ${f(cy)}Q${f(cx)} ${f(cy)} ${f(cx)} ${f(cy - r)}Z`;
}

function compass(cx, cy, R, rot = 0) {
  const pts = [];
  for (let k = 0; k < 16; k++) {
    const a = (k * Math.PI) / 8 - Math.PI / 2 + rot;
    const r = k % 2 ? R * 0.17 : (k / 2) % 2 ? R * 0.55 : R;
    pts.push(`${f(cx + Math.cos(a) * r)} ${f(cy + Math.sin(a) * r)}`);
  }
  return 'M' + pts.join('L') + 'Z';
}

function crescent(cx, cy, r) {
  const r2 = r * 1.28;
  return `M${f(cx)} ${f(cy - r)}A${r} ${r} 0 0 0 ${f(cx)} ${f(cy + r)}A${f(r2)} ${f(r2)} 0 0 1 ${f(cx)} ${f(cy - r)}Z`;
}

// Rangée des phases de la lune : dernier croissant … pleine lune … premier croissant.
function moonRow(cy) {
  const xs = [102, 126, 150, 174, 198];
  let s = '';
  xs.forEach((x, i) => {
    const r = i === 2 ? 9 : 7;
    s += `<circle cx="${x}" cy="${cy}" r="${r}" fill="none" stroke="url(#cbg)" stroke-width="1"/>`;
    if (i === 2) s += `<circle cx="${x}" cy="${cy}" r="${r - 2}" fill="url(#cbg)"/>`;
    if (i === 1) s += `<path d="M${x} ${cy - r}A${r} ${r} 0 0 1 ${x} ${cy + r}Z" fill="url(#cbg)"/>`;
    if (i === 3) s += `<path d="M${x} ${cy - r}A${r} ${r} 0 0 0 ${x} ${cy + r}Z" fill="url(#cbg)"/>`;
    if (i === 0) s += `<path d="${crescent(x, cy, r)}" fill="url(#cbg)" transform="translate(${2 * x} 0) scale(-1 1)"/>`;
    if (i === 4) s += `<path d="${crescent(x, cy, r)}" fill="url(#cbg)"/>`;
  });
  return s;
}

// Générateur pseudo-aléatoire : le ciel étoilé est toujours le même.
function rng(seed) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

export function cardBackSVG() {
  const cx = 150;
  const cy = 250;
  const r = rng(11);
  let stars = '';
  for (let i = 0; i < 90; i++) {
    const x = 26 + r() * 248;
    const y = 26 + r() * 448;
    const size = 0.45 + r() * 1.05;
    const op = 0.25 + r() * 0.6;
    if (Math.hypot(x - cx, y - cy) < 112 || Math.abs(y - 62) < 14 || Math.abs(y - 438) < 14) continue;
    stars += `<circle cx="${f(x)}" cy="${f(y)}" r="${size.toFixed(2)}" opacity="${op.toFixed(2)}"/>`;
  }
  let rays = '';
  for (let k = 0; k < 48; k++) {
    const a = (k / 48) * Math.PI * 2;
    const r1 = 82;
    const r2 = k % 4 === 0 ? 110 : k % 2 ? 90 : 99;
    rays += `<line x1="${f(cx + Math.cos(a) * r1)}" y1="${f(cy + Math.sin(a) * r1)}" x2="${f(cx + Math.cos(a) * r2)}" y2="${f(cy + Math.sin(a) * r2)}"/>`;
  }
  const sparks = [[62, 128, 7], [240, 118, 5], [52, 372, 5], [246, 382, 7], [86, 208, 4], [218, 296, 4], [214, 196, 3.5], [90, 300, 3.5]]
    .map(([x, y, s]) => `<path d="${sparkle(x, y, s)}"/>`).join('');
  const corners = [[31, 31], [269, 31], [31, 469], [269, 469]]
    .map(([x, y]) => `<path d="${sparkle(x, y, 8)}"/><circle cx="${x}" cy="${y}" r="1.6" fill="#141845"/>`).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 500" width="600" height="1000">
  <defs>
    <linearGradient id="cbg" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="300" y2="500">
      <stop offset="0" stop-color="#8a6424"/><stop offset=".18" stop-color="#f6dc92"/><stop offset=".34" stop-color="#b8883a"/>
      <stop offset=".5" stop-color="#fbe7a8"/><stop offset=".66" stop-color="#a97b30"/><stop offset=".82" stop-color="#f1d386"/>
      <stop offset="1" stop-color="#7d5a1f"/>
    </linearGradient>
    <radialGradient id="cbn" cx=".5" cy=".46" r=".72">
      <stop offset="0" stop-color="#2d3478"/><stop offset=".55" stop-color="#171b4b"/><stop offset="1" stop-color="#0a0c27"/>
    </radialGradient>
    <radialGradient id="cbh" cx=".5" cy=".5" r=".5">
      <stop offset="0" stop-color="#ffdca0" stop-opacity=".3"/><stop offset=".6" stop-color="#ffdca0" stop-opacity=".08"/><stop offset="1" stop-color="#ffdca0" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="300" height="500" rx="16" fill="url(#cbn)"/>
  <g fill="#f3e3b5">${stars}</g>
  <circle cx="${cx}" cy="${cy}" r="124" fill="url(#cbh)"/>
  <g fill="none" stroke="url(#cbg)">
    <rect x="10" y="10" width="280" height="480" rx="11" stroke-width="2.4"/>
    <rect x="17" y="17" width="266" height="466" rx="8" stroke-width=".9" opacity=".85"/>
    <rect x="23" y="23" width="254" height="454" rx="6" stroke-width="1.6" stroke-dasharray="0 7" stroke-linecap="round" opacity=".7"/>
    <g stroke-width=".9" opacity=".7">${rays}</g>
    <circle cx="${cx}" cy="${cy}" r="78" stroke-width="2.2"/>
    <circle cx="${cx}" cy="${cy}" r="71" stroke-width="1.8" stroke-dasharray="0 6" stroke-linecap="round"/>
    <circle cx="${cx}" cy="${cy}" r="63" stroke-width=".9"/>
    <path d="M${cx} 86V136M${cx} 364V414" stroke-width="1"/>
  </g>
  <g fill="url(#cbg)">
    ${corners}
    ${sparks}
    <path d="${sparkle(cx, 86, 7)}"/><path d="${sparkle(cx, 414, 7)}"/>
    <circle cx="${cx}" cy="150" r="3"/><circle cx="${cx}" cy="350" r="3"/>
    <path d="${compass(cx, cy, 38, Math.PI / 8)}" opacity=".5"/>
    <path d="${compass(cx, cy, 56)}"/>
    <circle cx="${cx}" cy="${cy}" r="7" fill="#141845" stroke="url(#cbg)" stroke-width="1.6"/>
    ${moonRow(62)}
    ${moonRow(438)}
  </g>
</svg>`;
}

let backURL = null;
export function cardBackURL() {
  if (!backURL) backURL = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(cardBackSVG());
  return backURL;
}

// Ornement du recto (couleur du texte).
const ORN = `<svg viewBox="0 0 120 20" aria-hidden="true"><path d="M4 10H44M76 10H116" stroke="currentColor" stroke-width="1" fill="none"/><circle cx="48" cy="10" r="1.6" fill="currentColor"/><circle cx="72" cy="10" r="1.6" fill="currentColor"/><path d="${sparkle(60, 10, 8)}" fill="currentColor"/></svg>`;

export class Cards {
  constructor(reader, cfg) {
    this.reader = reader;
    this.root = reader.root;
    this.fx = reader.fx;
    this.sound = reader.sound;
    this.messages = cfg.messages && cfg.messages.length ? cfg.messages : DEFAULT_CARDS.messages;
    this.label = (cfg.label || '').trim() || DEFAULT_CARDS.label;
    this.isOpen = false;
    this.busy = false;
    this.seq = 0;
    this.bag = [];
    this.last = -1;
    this.build();
    this.setBack(cfg.back);
  }

  build() {
    const label = esc(this.label);
    this.root.insertAdjacentHTML('beforeend', `
      <button type="button" class="cards-desk" aria-label="${label} : tirer une carte">
        <span class="cdk-deck">
          <span class="cdk-glow"></span>
          <span class="cdk-card cdk-under"><img alt="" draggable="false"></span>
          <span class="cdk-card cdk-top"><img alt="" draggable="false"></span>
        </span>
        <span class="cdk-label">${label}</span>
      </button>
      <div class="cards-aura" aria-hidden="true"></div>
      <div class="cards-veil" aria-hidden="true"></div>
      <div class="cd-card" aria-hidden="true">
        <div class="cd-glow"></div>
        <div class="cd-inner">
          <div class="cd-face cd-back"><img alt="" draggable="false"></div>
          <div class="cd-face cd-front">
            <div class="cd-frame">
              <span class="cd-orn">${ORN}</span>
              <p class="cd-msg"></p>
              <span class="cd-orn">${ORN}</span>
            </div>
          </div>
        </div>
      </div>
      <section class="cards-ui" aria-hidden="true" aria-label="${label}">
        <button type="button" class="cards-back">‹ Retour au grimoire</button>
        <div class="cards-layout">
          <header class="cards-head">
            <h2>${label}</h2>
            <span class="oracle-divider"></span>
          </header>
          <div class="cards-slot"></div>
          <div class="cards-controls">
            <button type="button" class="cards-again">Tirer une autre carte</button>
            <p class="cards-note">Prends le temps d’accueillir ce message</p>
          </div>
        </div>
      </section>`);
    this.desk = this.root.querySelector('.cards-desk');
    this.card = this.root.querySelector('.cd-card');
    this.labelEl = this.desk.querySelector('.cdk-label');
    this.ui = this.root.querySelector('.cards-ui');
    this.slot = this.ui.querySelector('.cards-slot');
    this.msgEl = this.card.querySelector('.cd-msg');
    this.frame = this.card.querySelector('.cd-frame');
    this.againBtn = this.ui.querySelector('.cards-again');
    this.srLive = document.createElement('p');
    this.srLive.className = 'sr-only';
    this.srLive.setAttribute('aria-live', 'polite');
    this.ui.appendChild(this.srLive);

    this.desk.addEventListener('click', () => this.open());
    this.againBtn.addEventListener('click', () => this.again());
    this.ui.querySelector('.cards-back').addEventListener('click', () => this.close());
    this.root.querySelector('.cards-veil').addEventListener('click', () => this.close());
  }

  async setBack(path) {
    let src = cardBackURL();
    if (path) src = (await resolveSrc(path)) || src;
    this.root.querySelectorAll('.cdk-card img, .cd-back img').forEach((img) => {
      img.onerror = () => { img.onerror = null; img.src = cardBackURL(); };
      img.src = src;
    });
  }

  layout() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const compact = this.root.classList.contains('compact');
    // Taille de la carte tirée.
    let ch = compact ? Math.min(vh - 36, 520) : Math.min(vh - 240, 620);
    ch = Math.min(ch, ((compact ? vw * 0.42 : vw * 0.84)) / CARD_RATIO);
    ch = Math.max(ch, 180);
    const cw = ch * CARD_RATIO;
    this.root.style.setProperty('--cdw', cw.toFixed(1) + 'px');
    this.root.style.setProperty('--cdr', String(CARD_RATIO));

    // Le paquet sur le bureau.
    const rest = this.reader.deckRest;
    this.desk.hidden = !rest;
    if (!rest) return;
    const d = this.desk.style;
    d.left = rest.x.toFixed(1) + 'px';
    d.top = rest.y.toFixed(1) + 'px';
    d.width = rest.w.toFixed(1) + 'px';
    d.height = rest.h.toFixed(1) + 'px';
    this.desk.style.setProperty('--dw', rest.w.toFixed(1) + 'px');
    // Le texte sous le paquet ne doit jamais sortir de l'écran.
    const lw = this.labelEl.offsetWidth;
    const lcx = rest.x + rest.w / 2;
    const shift = Math.max(6 + lw / 2 - lcx, Math.min(0, vw - 6 - lw / 2 - lcx));
    this.labelEl.style.setProperty('--lsh', shift.toFixed(1) + 'px');

    // La carte au premier plan, à sa place dans la mise en page.
    const slot = this.slot.getBoundingClientRect();
    const s = this.card.style;
    s.left = slot.left + 'px';
    s.top = slot.top + 'px';
    s.width = slot.width + 'px';
    s.height = slot.height + 'px';

    // Au repos, elle est superposée exactement sur la carte du dessus du paquet.
    const dcx = rest.x + rest.w / 2;
    const dcy = rest.y + rest.h / 2;
    const k = rest.w / (slot.width || 1);
    this.restTransform = `translate(${(dcx - slot.left - slot.width / 2).toFixed(1)}px, ${(dcy - slot.top - slot.height / 2).toFixed(1)}px) scale(${k.toFixed(4)}) rotate(${TILT}deg)`;
    if (!this.isOpen) s.transform = this.restTransform;
    this.root.style.setProperty('--cox', dcx.toFixed(1) + 'px');
    this.root.style.setProperty('--coy', dcy.toFixed(1) + 'px');
    if (this.isOpen) this.fit();
  }

  // Tirage sans remise : on ne revoit une carte qu'après avoir vu toutes les autres.
  pick() {
    const n = this.messages.length;
    if (!this.bag.length) {
      this.bag = [...Array(n).keys()];
      for (let i = n - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
      }
      if (n > 1 && this.bag[this.bag.length - 1] === this.last) this.bag.unshift(this.bag.pop());
    }
    this.last = this.bag.pop();
    return this.messages[this.last];
  }

  setMessage(text) {
    this.msgEl.textContent = text;
    this.fit();
  }

  // Réduit le texte tant qu'il déborde du recto.
  // Pour un texte long sur une petite carte, les ornements s'effacent pour laisser la place au message.
  fit() {
    const m = this.msgEl;
    const w = parseFloat(this.card.style.width) || 300;
    const room = () => this.frame.clientHeight - [...this.frame.querySelectorAll('.cd-orn')].reduce((a, o) => a + o.offsetHeight, 0) - w * 0.1;
    let size = w * 0.068;
    const shrink = (min) => {
      m.style.fontSize = size + 'px';
      for (let i = 0; i < 24 && m.scrollHeight > room() && size > min; i++) {
        size *= 0.95;
        m.style.fontSize = size + 'px';
      }
    };
    this.card.classList.remove('dense');
    shrink(13);
    if (m.scrollHeight > room()) {
      this.card.classList.add('dense');
      size = w * 0.068;
      shrink(8);
    }
  }

  canOpen() {
    const r = this.reader;
    if (this.isOpen || !r.deckRest) return false;
    if (r.state === 'opening' || r.state === 'closing') return false;
    if (r.oracle && r.oracle.state === 'focus') return false;
    if (r.lunar && r.lunar.isOpen) return false;
    return true;
  }

  async open() {
    if (!this.canOpen()) return;
    const seq = ++this.seq;
    this.isOpen = true;
    this.busy = true;
    this.againBtn.disabled = true;
    this.reader.hidePanels();
    this.sound.unlock();
    this.sound.cardDraw();
    this.root.classList.add('cards-open');
    this.ui.setAttribute('aria-hidden', 'false');
    this.layout();
    this.setMessage(this.pick());

    const c = this.card;
    c.classList.remove('anim', 'revealed');
    c.style.transform = this.restTransform;
    c.classList.add('live');
    this.desk.classList.add('drawn');
    void c.offsetWidth;
    c.classList.add('anim');
    c.style.transform = 'none';
    await sleep(820);
    if (seq !== this.seq) return;
    await this.reveal(seq);
    if (seq === this.seq) this.againBtn.focus({ preventScroll: true });
  }

  async reveal(seq) {
    this.sound.cardFlip();
    this.card.classList.add('revealed');
    await sleep(430);
    if (seq !== this.seq) return;
    this.sound.cardReveal();
    this.srLive.textContent = this.msgEl.textContent;
    const r = this.card.getBoundingClientRect();
    this.fx.edges(r, { count: 70, speed: 80, life: 1.5 });
    await sleep(520);
    if (seq !== this.seq) return;
    this.busy = false;
    this.againBtn.disabled = false;
  }

  async again() {
    if (!this.isOpen || this.busy) return;
    const seq = ++this.seq;
    this.busy = true;
    this.againBtn.disabled = true;
    this.sound.cardFlip();
    this.card.classList.remove('revealed');
    await sleep(650);
    if (seq !== this.seq) return;
    this.card.classList.add('shuffle');
    this.sound.cardDraw();
    await sleep(520);
    if (seq !== this.seq) return;
    this.card.classList.remove('shuffle');
    this.setMessage(this.pick());
    await this.reveal(seq);
  }

  async close() {
    if (!this.isOpen) return;
    const seq = ++this.seq;
    this.isOpen = false;
    this.busy = false;
    this.root.classList.remove('cards-open');
    this.ui.setAttribute('aria-hidden', 'true');
    if (document.activeElement) document.activeElement.blur();
    this.sound.cardDraw();
    const c = this.card;
    c.classList.remove('revealed', 'shuffle');
    c.style.transform = this.restTransform;
    await sleep(1050);
    if (seq !== this.seq) return;
    c.classList.remove('live', 'anim');
    this.desk.classList.remove('drawn');
  }
}
