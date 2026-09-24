// Boule de voyance posée sur le bureau (vue de haut). Au clic, la vue se recentre :
// la boule glisse au premier plan (vue de côté) et Lilly répond à la question posée en silence.
import { BALL, DEFAULT_ORACLE } from './config.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const pct = (v) => (v * 100).toFixed(3) + '%';

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Position de la sphère dans une image (en fraction de sa largeur / hauteur).
function sphereBox(v) {
  return `left:${pct((v.cx - v.r) / v.w)};top:${pct((v.cy - v.r) / v.h)};width:${pct((2 * v.r) / v.w)};height:${pct((2 * v.r) / v.h)}`;
}

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
    const name = esc(cfg.title || 'Lilly');
    const T = BALL.top;
    const S = BALL.side;
    this.root.insertAdjacentHTML('beforeend', `
      <div class="oracle-aura" aria-hidden="true"></div>
      <div class="oracle-veil" aria-hidden="true"></div>
      <div class="oracle-desk" role="button" tabindex="0" aria-label="Boule de cristal : poser une question à ${name}" title="Poser une question à ${name}">
        <div class="od-glow" style="${sphereBox(T)}"></div>
        <img src="${T.src}" alt="" draggable="false">
        <div class="od-mist" style="${sphereBox(T)}"><div class="mist m1"></div><div class="mist m2"></div></div>
      </div>
      <div class="oracle" aria-hidden="true">
        <div class="oracle-glow" style="${sphereBox(S)}"></div>
        <img class="oracle-img" src="${S.src}" alt="" draggable="false">
        <div class="orb" style="${sphereBox(S)}">
          <div class="mist m1"></div>
          <div class="mist m2"></div>
          <div class="depth"></div>
          <div class="vortex"></div>
          <p class="answer" aria-live="polite"></p>
        </div>
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
            <button type="button" class="oracle-ask">Interroger ${name}</button>
            <p class="oracle-note">Une seule question à la fois</p>
          </div>
        </div>
      </section>`);
    this.desk = this.root.querySelector('.oracle-desk');
    this.el = this.root.querySelector('.oracle');
    this.ui = this.root.querySelector('.oracle-ui');
    this.slot = this.root.querySelector('.oracle-slot');
    this.orb = this.el.querySelector('.orb');
    this.answerEl = this.el.querySelector('.answer');
    this.promptEl = this.ui.querySelector('.oracle-prompt');
    this.askBtn = this.ui.querySelector('.oracle-ask');
    this.askLabel = this.askBtn.textContent;

    this.desk.addEventListener('click', () => this.open());
    this.desk.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.open(); }
    });
    this.el.addEventListener('click', () => this.ask());
    this.askBtn.addEventListener('click', () => this.ask());
    this.ui.querySelector('.oracle-back').addEventListener('click', () => this.close());
    this.root.querySelector('.oracle-veil').addEventListener('click', () => this.close());
  }

  layout() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const T = BALL.top;
    const S = BALL.side;
    const sr = S.h / S.w;
    const compact = this.root.classList.contains('compact');
    const wf = Math.round(compact
      ? Math.min((vh * 0.88) / sr, vw * 0.4, 420)
      : Math.min((vh * 0.94 - 240) / sr, vw * 0.84, 430));
    this.root.style.setProperty('--ow', Math.max(120, wf) + 'px');
    this.root.style.setProperty('--osr', sr.toFixed(4));

    // La boule sur le bureau.
    const rest = this.reader.ballRest;
    this.desk.hidden = !rest;
    if (!rest) return;
    const d = this.desk.style;
    d.left = rest.x.toFixed(1) + 'px';
    d.top = rest.y.toFixed(1) + 'px';
    d.width = rest.w.toFixed(1) + 'px';
    d.height = rest.h.toFixed(1) + 'px';

    // La boule au premier plan, à sa place dans la mise en page.
    const slot = this.slot.getBoundingClientRect();
    const s = this.el.style;
    s.left = slot.left + 'px';
    s.top = slot.top + 'px';
    s.width = slot.width + 'px';
    s.height = slot.height + 'px';

    // Au repos, la vue de côté est superposée exactement sur la sphère de la vue de haut.
    const tcx = rest.x + (rest.w * T.cx) / T.w;
    const tcy = rest.y + (rest.h * T.cy) / T.h;
    const tr = (rest.w * T.r) / T.w;
    const scx = (slot.width * S.cx) / S.w;
    const scy = (slot.height * S.cy) / S.h;
    const srad = (slot.width * S.r) / S.w;
    const k = tr / srad;
    this.restTransform = `translate(${(tcx - slot.left - k * scx).toFixed(1)}px, ${(tcy - slot.top - k * scy).toFixed(1)}px) scale(${k.toFixed(4)})`;
    if (this.state !== 'focus') s.transform = this.restTransform;
    this.root.style.setProperty('--oox', tcx.toFixed(1) + 'px');
    this.root.style.setProperty('--ooy', tcy.toFixed(1) + 'px');
  }

  orbCenter() {
    const b = this.orb.getBoundingClientRect();
    return { x: b.left + b.width / 2, y: b.top + b.height / 2, r: b.width / 2 };
  }

  open() {
    if (this.state !== 'rest' || !this.reader.ballRest) return;
    if (this.reader.state === 'opening' || this.reader.state === 'closing') return;
    this.state = 'focus';
    this.reader.hidePanels();
    this.sound.unlock();
    this.sound.oracleOpen();
    this.root.classList.add('oracle-open');
    this.ui.setAttribute('aria-hidden', 'false');
    this.el.style.transform = 'none';
    setTimeout(() => {
      if (this.state === 'focus') this.askBtn.focus({ preventScroll: true });
    }, 1000);
  }

  close() {
    if (this.state !== 'focus') return;
    this.state = 'rest';
    this.root.classList.remove('oracle-open');
    this.ui.setAttribute('aria-hidden', 'true');
    this.el.style.transform = this.restTransform;
    if (document.activeElement) document.activeElement.blur();
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
          gravity: -20, life: 1.1, stars: 0, size: 0.8, glow: 'violet',
        });
      }
    }, 90);

    await sleep(2500);
    clearInterval(swirl);
    this.answerEl.textContent = this.pick();
    this.fitAnswer();
    this.el.classList.remove('asking');
    this.el.classList.add('answered');
    this.sound.oracleReveal();
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
