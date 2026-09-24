// Boule de voyance posée sur le bureau : au clic, la vue se recentre sur elle
// et Lilly répond à la question posée en silence.
import { DEFAULT_ORACLE } from './config.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Taille et position de la boule au repos (coin haut droit du bureau).
export function oracleRest(vw, vh, bookOpen, compact) {
  const vmin = Math.min(vw, vh);
  if (bookOpen) {
    const w = clamp(vmin * 0.1, 50, 88);
    return { w, h: w * 1.4, x: vw - w - (compact ? 72 : 12), y: 8 };
  }
  const w = clamp(vmin * 0.2, 80, 220);
  const mx = Math.max(12, vw * 0.045);
  const my = Math.max(12, vh * 0.04);
  return { w, h: w * 1.4, x: vw - w - mx, y: my };
}

// Pied en argent ancien serti d'améthystes (repère 400 × 560, la boule occupe le haut).
function gem(cx, cy, rx, ry, grad) {
  const facets = [0, 60, 120, 180, 240, 300].map((a) => {
    const r = (a * Math.PI) / 180;
    return `M${cx} ${cy}L${(cx + Math.cos(r) * rx * 0.85).toFixed(1)} ${(cy + Math.sin(r) * ry * 0.85).toFixed(1)}`;
  }).join('');
  return `<ellipse cx="${cx}" cy="${cy}" rx="${rx + 4}" ry="${ry + 4}" fill="url(#oMetalDark)" stroke="#1f1c19" stroke-width="1"/>
    <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#${grad})"/>
    <path d="${facets}" stroke="#fff" stroke-opacity=".22" stroke-width="1"/>
    <ellipse cx="${cx - rx * 0.32}" cy="${cy - ry * 0.38}" rx="${rx * 0.28}" ry="${ry * 0.18}" fill="#fff" opacity=".75" transform="rotate(-25 ${cx - rx * 0.32} ${cy - ry * 0.38})"/>`;
}

function beadsOnEllipse(cx, cy, rx, ry, from, to, n, r) {
  let s = '';
  for (let i = 0; i < n; i++) {
    const a = ((from + ((to - from) * i) / (n - 1)) * Math.PI) / 180;
    s += `<circle cx="${(cx + Math.cos(a) * rx).toFixed(1)}" cy="${(cy + Math.sin(a) * ry).toFixed(1)}" r="${r}"/>`;
  }
  return s;
}

// Petites feuilles d'argent qui enserrent la boule.
function claws() {
  return [18, 44, 70, 90, 110, 136, 162].map((d) => {
    const a = (d * Math.PI) / 180;
    const x = 200 + Math.cos(a) * 108;
    const y = 305 + Math.sin(a) * 22;
    const rot = ((x - 200) / 108) * 30;
    const h = d === 90 ? 30 : 24;
    return `<path transform="translate(${x.toFixed(1)} ${(y + 3).toFixed(1)}) rotate(${rot.toFixed(1)})" d="M-8 0C-10 -${h * 0.45} -4 -${h * 0.85} 0 -${h}C4 -${h * 0.85} 10 -${h * 0.45} 8 0Z"/>
      <path transform="translate(${x.toFixed(1)} ${(y + 3).toFixed(1)}) rotate(${rot.toFixed(1)})" d="M0 -2L0 -${h * 0.8}" stroke="#f4efe6" stroke-opacity=".5" stroke-width="1.2" fill="none"/>`;
  }).join('');
}

// Volute baroque (spirale en « C »), dessinée pour le côté gauche puis mise en miroir.
function volute(d, mirror) {
  const t = mirror ? ' transform="translate(400 0) scale(-1 1)"' : '';
  return `<g${t}><path d="${d}" stroke="#15120f" stroke-width="12" fill="none" stroke-linecap="round"/>
    <path d="${d}" stroke="url(#oMetalV)" stroke-width="8.5" fill="none" stroke-linecap="round"/>
    <path d="${d}" stroke="#fffaf0" stroke-opacity=".35" stroke-width="2" fill="none" stroke-linecap="round" transform="translate(-1.5 -1.5)"/></g>`;
}

const BODY = 'M106 330C112 360 146 370 160 392C166 404 166 416 158 428C146 446 122 456 116 474C110 492 124 504 150 508L250 508C276 504 290 492 284 474C278 456 254 446 242 428C234 416 234 404 240 392C254 370 288 360 294 330Z';
const PLINTH = 'M84 512C84 500 110 494 200 494C290 494 316 500 316 512C316 526 290 534 200 534C110 534 84 526 84 512Z';
const BAND = 'M92 305A108 22 0 0 0 308 305L300 324A100 20 0 0 1 100 324Z';
const VOL_SIDE = 'M160 398C140 394 126 408 131 424C135 436 150 434 148 424C147 418 140 418 139 422';
const VOL_FOOT = 'M130 498C98 496 72 510 76 530C80 546 104 544 102 530C101 522 92 522 91 528';
const VOL_TOP = 'M112 336C92 340 86 360 98 370C108 378 120 370 114 362';

const BASE_SVG = `<svg class="oracle-base" viewBox="0 0 400 560" aria-hidden="true">
  <defs>
    <linearGradient id="oMetal" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#1e1b18"/>
      <stop offset=".14" stop-color="#5e5850"/>
      <stop offset=".3" stop-color="#d6cfc2"/>
      <stop offset=".44" stop-color="#7a746a"/>
      <stop offset=".62" stop-color="#34302b"/>
      <stop offset=".82" stop-color="#a59e92"/>
      <stop offset="1" stop-color="#1d1a17"/>
    </linearGradient>
    <linearGradient id="oMetalV" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#e2dccf"/>
      <stop offset=".45" stop-color="#8a8378"/>
      <stop offset="1" stop-color="#2c2824"/>
    </linearGradient>
    <linearGradient id="oMetalDark" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#c9c2b5"/>
      <stop offset=".5" stop-color="#4f4a43"/>
      <stop offset="1" stop-color="#1c1916"/>
    </linearGradient>
    <linearGradient id="oShade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1a0f24" stop-opacity=".6"/>
      <stop offset=".35" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity=".45"/>
    </linearGradient>
    <radialGradient id="oLav" cx=".5" cy="0" r=".9">
      <stop offset="0" stop-color="#d9b8ff" stop-opacity=".7"/>
      <stop offset="1" stop-color="#d9b8ff" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="oAme" cx=".4" cy=".35" r=".75">
      <stop offset="0" stop-color="#f7ebff"/>
      <stop offset=".25" stop-color="#c79cf2"/>
      <stop offset=".62" stop-color="#7a42b8"/>
      <stop offset="1" stop-color="#2b104d"/>
    </radialGradient>
    <radialGradient id="oBlue" cx=".4" cy=".35" r=".75">
      <stop offset="0" stop-color="#e6f7ff"/>
      <stop offset=".35" stop-color="#6fb3dc"/>
      <stop offset="1" stop-color="#0f3552"/>
    </radialGradient>
    <radialGradient id="oPink" cx=".4" cy=".35" r=".75">
      <stop offset="0" stop-color="#ffe6f0"/>
      <stop offset=".35" stop-color="#d9608a"/>
      <stop offset="1" stop-color="#541030"/>
    </radialGradient>
    <filter id="oBlur" x="-20%" y="-200%" width="140%" height="500%"><feGaussianBlur stdDeviation="9"/></filter>
  </defs>
  <ellipse cx="200" cy="542" rx="178" ry="15" fill="#000" opacity=".7" filter="url(#oBlur)"/>

  <path d="${PLINTH}" fill="url(#oMetal)" stroke="#15120f" stroke-width="1.5"/>
  <path d="M92 514C110 526 290 526 308 514" stroke="#f4efe6" stroke-opacity=".35" stroke-width="1.5" fill="none"/>
  ${volute(VOL_FOOT, false)}${volute(VOL_FOOT, true)}

  <path d="${BODY}" fill="url(#oMetal)" stroke="#15120f" stroke-width="1.5"/>
  <path d="${BODY}" fill="url(#oShade)"/>
  ${volute(VOL_SIDE, false)}${volute(VOL_SIDE, true)}
  ${volute(VOL_TOP, false)}${volute(VOL_TOP, true)}

  <g fill="none" stroke-linecap="round">
    <path d="M120 338C126 360 148 372 162 394" stroke="#fff" stroke-opacity=".3" stroke-width="2"/>
    <g stroke="#f4efe6" stroke-opacity=".5" stroke-width="1.8">
      <path d="M176 350C160 342 142 350 146 364C149 374 162 372 160 364"/>
      <path d="M224 350C240 342 258 350 254 364C251 374 238 372 240 364"/>
      <path d="M170 470C154 462 136 470 140 484C143 494 156 492 154 484"/>
      <path d="M230 470C246 462 264 470 260 484C257 494 244 492 246 484"/>
    </g>
    <g stroke="#15120f" stroke-opacity=".65" stroke-width="1.4">
      <path d="M150 384C170 393 230 393 250 384"/>
      <path d="M124 458C150 468 250 468 276 458"/>
    </g>
  </g>
  <g fill="#d8d1c4" opacity=".55">${beadsOnEllipse(200, 388, 52, 6, 20, 160, 11, 1.6)}</g>

  <ellipse cx="200" cy="411" rx="46" ry="12" fill="url(#oMetal)" stroke="#15120f" stroke-width="1.2"/>
  <g fill="#ece6db" stroke="#1d1a17" stroke-width=".5">${beadsOnEllipse(200, 411, 44, 11, 0, 180, 13, 2.4)}</g>
  <path d="M116 474A84 11 0 0 0 284 474" fill="none" stroke="#efe9df" stroke-opacity=".6" stroke-width="2.2"/>
  <g fill="#e8e2d8">${beadsOnEllipse(200, 474, 84, 11, 15, 165, 13, 2.4)}</g>

  <g fill="url(#oMetalV)" stroke="#15120f" stroke-width="1">${claws()}</g>
  <path d="${BAND}" fill="url(#oMetal)" stroke="#15120f" stroke-width="1.3"/>
  <path d="${BAND}" fill="url(#oLav)"/>
  <g fill="#eee8de" stroke="#2a2622" stroke-width=".6">${beadsOnEllipse(200, 324, 100, 20, 12, 168, 17, 2.8)}</g>
  ${gem(150, 330, 6, 5, 'oAme')}
  ${gem(200, 335, 8, 6.5, 'oAme')}
  ${gem(250, 330, 6, 5, 'oAme')}
  <g fill="#ece6db" stroke="#1d1a17" stroke-width=".5">${beadsOnEllipse(200, 366, 27, 32, 0, 360, 20, 2)}</g>
  ${gem(200, 366, 20, 25, 'oAme')}
  ${gem(200, 506, 15, 13, 'oAme')}
  ${gem(128, 510, 9, 8, 'oBlue')}
  ${gem(272, 510, 9, 8, 'oPink')}
</svg>`;

export class Oracle {
  constructor(reader, cfg) {
    this.reader = reader;
    this.root = reader.root;
    this.fx = reader.fx;
    this.sound = reader.sound;
    this.answers = cfg.answers && cfg.answers.length ? cfg.answers : DEFAULT_ORACLE.answers;
    this.state = 'rest';
    this.phase = 'idle';
    this.lastIndex = -1;
    this.build(cfg);
  }

  build(cfg) {
    const twinkles = [[30, 28], [66, 36], [44, 62], [72, 64], [24, 50], [56, 20], [38, 78]]
      .map(([x, y], i) => `<i style="left:${x}%;top:${y}%;animation-delay:${(i * 0.7).toFixed(1)}s"></i>`).join('');
    this.root.insertAdjacentHTML('beforeend', `
      <div class="oracle-aura" aria-hidden="true"></div>
      <div class="oracle-veil" aria-hidden="true"></div>
      <div class="oracle" role="button" tabindex="0" aria-label="Boule de cristal : poser une question à ${esc(cfg.title || 'Lilly')}" title="Poser une question à ${esc(cfg.title || 'Lilly')}">
        <div class="oracle-glow"></div>
        <div class="orb">
          <div class="mist m1"></div>
          <div class="mist m2"></div>
          <div class="depth"></div>
          <div class="vortex"></div>
          <div class="twinkles">${twinkles}</div>
          <div class="orb-shine"></div>
          <p class="answer" aria-live="polite"></p>
        </div>
        ${BASE_SVG}
      </div>
      <section class="oracle-ui" aria-hidden="true" aria-label="Boule de voyance">
        <button type="button" class="oracle-back">‹ Retour au grimoire</button>
        <div class="oracle-layout">
          <header class="oracle-head">
            <h2>${esc(cfg.title || '')}</h2>
            <p>${esc(cfg.subtitle || '')}</p>
            <span class="oracle-divider"></span>
          </header>
          <div class="oracle-slot"></div>
          <div class="oracle-controls">
            <p class="oracle-prompt">Pose ta question en silence</p>
            <button type="button" class="oracle-ask">Interroger ${esc(cfg.title || 'Lilly')}</button>
            <p class="oracle-note">Une seule question à la fois</p>
          </div>
        </div>
      </section>`);
    this.el = this.root.querySelector('.oracle');
    this.ui = this.root.querySelector('.oracle-ui');
    this.slot = this.root.querySelector('.oracle-slot');
    this.orb = this.el.querySelector('.orb');
    this.answerEl = this.el.querySelector('.answer');
    this.promptEl = this.ui.querySelector('.oracle-prompt');
    this.askBtn = this.ui.querySelector('.oracle-ask');
    this.askLabel = this.askBtn.textContent;

    this.el.addEventListener('click', () => (this.state === 'focus' ? this.ask() : this.open()));
    this.el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (this.state === 'focus') this.ask(); else this.open();
      }
    });
    this.askBtn.addEventListener('click', () => this.ask());
    this.ui.querySelector('.oracle-back').addEventListener('click', () => this.close());
    this.root.querySelector('.oracle-veil').addEventListener('click', () => this.close());
  }

  layout() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const compact = this.root.classList.contains('compact');
    const wf = Math.round(compact
      ? Math.min((vh * 0.86) / 1.4, vw * 0.4, 420)
      : Math.min((vh * 0.94 - 250) / 1.4, vw * 0.84, 440));
    this.root.style.setProperty('--ow', Math.max(120, wf) + 'px');
    const slot = this.slot.getBoundingClientRect();
    const s = this.el.style;
    s.left = slot.left + 'px';
    s.top = slot.top + 'px';
    s.width = slot.width + 'px';
    s.height = slot.height + 'px';
    const bookOpen = this.reader.state === 'open' || this.reader.state === 'opening';
    const r = oracleRest(vw, vh, bookOpen, compact);
    const k = r.w / slot.width;
    this.restTransform = `translate(${(r.x - slot.left).toFixed(1)}px, ${(r.y - slot.top).toFixed(1)}px) scale(${k.toFixed(4)})`;
    if (this.state !== 'focus') s.transform = this.restTransform;
    this.root.style.setProperty('--oox', (r.x + r.w / 2).toFixed(1) + 'px');
    this.root.style.setProperty('--ooy', (r.y + r.h * 0.35).toFixed(1) + 'px');
  }

  orbCenter() {
    const b = this.orb.getBoundingClientRect();
    return { x: b.left + b.width / 2, y: b.top + b.height / 2, r: b.width / 2 };
  }

  open() {
    if (this.state !== 'rest') return;
    if (this.reader.state === 'opening' || this.reader.state === 'closing') return;
    this.state = 'focus';
    this.reader.hidePanels();
    this.sound.unlock();
    this.sound.oracleOpen();
    this.root.classList.add('oracle-open');
    this.ui.setAttribute('aria-hidden', 'false');
    this.el.style.transform = 'none';
    setTimeout(() => {
      if (this.state !== 'focus') return;
      const c = this.orbCenter();
      this.fx.burst(c.x, c.y - c.r * 0.2, { count: 36, speed: c.r * 1.3, stars: 0.45, life: 1.8, glow: 'violet' });
      this.askBtn.focus({ preventScroll: true });
    }, 1000);
  }

  close() {
    if (this.state !== 'focus') return;
    this.state = 'rest';
    this.root.classList.remove('oracle-open');
    this.ui.setAttribute('aria-hidden', 'true');
    this.el.style.transform = this.restTransform;
    this.el.blur();
    setTimeout(() => { if (this.state === 'rest' && this.phase !== 'asking') this.reset(); }, 1100);
  }

  pick() {
    const n = this.answers.length;
    let i = Math.floor(Math.random() * n);
    if (n > 1 && i === this.lastIndex) i = (i + 1 + Math.floor(Math.random() * (n - 1))) % n;
    this.lastIndex = i;
    return this.answers[i];
  }

  async ask() {
    if (this.state !== 'focus' || this.phase === 'asking') return;
    if (this.phase === 'answered') { this.reset(); return; }
    this.phase = 'asking';
    this.sound.unlock();
    this.sound.oracleAsk();
    this.el.classList.add('asking');
    this.askBtn.disabled = true;
    this.promptEl.textContent = 'Les étoiles t’écoutent…';

    // Tourbillon d'étincelles autour de la boule.
    const start = performance.now();
    const swirl = setInterval(() => {
      const c = this.orbCenter();
      const t = (performance.now() - start) / 1000;
      for (let i = 0; i < 3; i++) {
        const a = Math.random() * Math.PI * 2;
        const rr = c.r * (1.02 + Math.random() * 0.12);
        this.fx.burst(c.x + Math.cos(a) * rr, c.y + Math.sin(a) * rr, {
          count: 1 / this.fx.scale, speed: 40 + t * 30, angle: a + Math.PI / 2, spread: 0.6,
          gravity: -20, life: 1.1, stars: 0.3, size: 0.8, glow: 'violet',
        });
      }
    }, 90);

    await sleep(2500);
    clearInterval(swirl);
    const text = this.pick();
    this.answerEl.textContent = text;
    this.fitAnswer();
    this.el.classList.remove('asking');
    this.el.classList.add('answered');
    this.sound.oracleReveal();
    const c = this.orbCenter();
    this.fx.burst(c.x, c.y, { count: 45, speed: c.r * 1.6, stars: 0.5, life: 2, glow: 'violet' });
    this.phase = 'answered';
    this.promptEl.textContent = 'Les étoiles ont parlé';
    this.askBtn.textContent = 'Nouvelle question';
    this.askBtn.disabled = false;
  }

  // Réduit le texte si une réponse est longue.
  fitAnswer() {
    const a = this.answerEl;
    a.style.fontSize = '';
    const max = this.orb.clientHeight * 0.62;
    let size = parseFloat(getComputedStyle(a).fontSize);
    for (let i = 0; i < 12 && a.scrollHeight > max && size > 8; i++) {
      size *= 0.9;
      a.style.fontSize = size + 'px';
    }
  }

  reset() {
    this.phase = 'idle';
    this.el.classList.remove('answered', 'asking');
    this.promptEl.textContent = 'Pose ta question en silence';
    this.askBtn.textContent = this.askLabel;
    this.askBtn.disabled = false;
  }
}
