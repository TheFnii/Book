// Radio des années 1930 posée sur le bureau : lit la playlist Suno en continu (streaming).
// Clic sur la radio : allumer / éteindre. Un petit bandeau propose précédent, pause, suivant et volume.
// « Son d'époque » : filtre de vieux haut-parleur et léger grésillement (Web Audio).
import { DEFAULT_RADIO, SUNO_AUDIO } from './config.js';
import { placeLabel } from './oracle.js';

const KEY = 'grimoire.radio';
export const RADIO_RATIO = 200 / 240; // largeur / hauteur du dessin

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Radio « cathédrale » dessinée (200 × 240).
function radioSVG() {
  let slats = '';
  for (let i = 0; i < 7; i++) {
    const x = 62 + i * 12.7;
    slats += `<path d="M${x.toFixed(1)} 150V${(78 + Math.abs(3 - i) * 5).toFixed(0)}" />`;
  }
  let ticks = '';
  for (let i = 0; i <= 12; i++) {
    const a = Math.PI * (1 + i / 12);
    ticks += `<line x1="${(100 + Math.cos(a) * 17).toFixed(1)}" y1="${(186 + Math.sin(a) * 17).toFixed(1)}" x2="${(100 + Math.cos(a) * 21).toFixed(1)}" y2="${(186 + Math.sin(a) * 21).toFixed(1)}"/>`;
  }
  return `<svg class="rd-svg" viewBox="0 0 200 240" aria-hidden="true">
  <defs>
    <linearGradient id="rdWood" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#3a1d0c"/><stop offset=".18" stop-color="#7a4420"/><stop offset=".5" stop-color="#a0602e"/>
      <stop offset=".82" stop-color="#7a4420"/><stop offset="1" stop-color="#3a1d0c"/>
    </linearGradient>
    <linearGradient id="rdWood2" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#5a2f14"/><stop offset="1" stop-color="#2e160a"/>
    </linearGradient>
    <radialGradient id="rdCloth" cx=".5" cy=".55" r=".6">
      <stop offset="0" stop-color="#c9a877"/><stop offset="1" stop-color="#7c6040"/>
    </radialGradient>
    <radialGradient id="rdDial" cx=".5" cy=".7" r=".7">
      <stop offset="0" stop-color="#fff0c0"/><stop offset=".6" stop-color="#f3c867"/><stop offset="1" stop-color="#b9782c"/>
    </radialGradient>
    <radialGradient id="rdKnob" cx=".35" cy=".3" r=".8">
      <stop offset="0" stop-color="#7b4a2a"/><stop offset=".6" stop-color="#3c1f10"/><stop offset="1" stop-color="#1c0d06"/>
    </radialGradient>
    <filter id="rdShadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#000" flood-opacity=".65"/></filter>
  </defs>
  <g filter="url(#rdShadow)">
    <path d="M14 232V110C14 50 52 10 100 10C148 10 186 50 186 110V232Z" fill="url(#rdWood)" stroke="#23100a" stroke-width="2"/>
  </g>
  <path d="M24 226V112C24 58 58 22 100 22C142 22 176 58 176 112V226" fill="none" stroke="#e0a868" stroke-opacity=".35" stroke-width="1.5"/>
  <path d="M46 156V110C46 76 70 50 100 50C130 50 154 76 154 110V156Z" fill="url(#rdCloth)" stroke="#2a130a" stroke-width="3"/>
  <g stroke="url(#rdWood2)" stroke-width="7" stroke-linecap="round" fill="none">${slats}</g>
  <path d="M30 170H170V222H30Z" fill="url(#rdWood2)" opacity=".55"/>
  <path class="rd-dial" d="M78 186A22 22 0 0 1 122 186Z" fill="url(#rdDial)" stroke="#2a130a" stroke-width="2"/>
  <g stroke="#5a3210" stroke-width="1.2">${ticks}</g>
  <line class="rd-needle" x1="100" y1="186" x2="100" y2="167" stroke="#8b1e12" stroke-width="2" stroke-linecap="round"/>
  <circle cx="52" cy="196" r="12" fill="url(#rdKnob)" stroke="#120804" stroke-width="1.5"/>
  <circle cx="148" cy="196" r="12" fill="url(#rdKnob)" stroke="#120804" stroke-width="1.5"/>
  <path d="M52 186V192M148 186V192" stroke="#e8c77a" stroke-width="2" stroke-linecap="round"/>
  <circle class="rd-lamp" cx="100" cy="212" r="3.2" fill="#5a2a10"/>
  <path d="M12 232H188" stroke="#1a0b05" stroke-width="4"/>
</svg>`;
}

const IC = {
  prev: '<svg viewBox="0 0 24 24"><path d="M7 5v14M19 5l-9 7 9 7z"/></svg>',
  next: '<svg viewBox="0 0 24 24"><path d="M17 5v14M5 5l9 7-9 7z"/></svg>',
  play: '<svg viewBox="0 0 24 24"><path d="M7 5l12 7-12 7z"/></svg>',
  pause: '<svg viewBox="0 0 24 24"><path d="M8 5v14M16 5v14"/></svg>',
  power: '<svg viewBox="0 0 24 24"><path d="M12 3v8M6.3 6.8a8 8 0 1011.4 0"/></svg>',
};

export class Radio {
  constructor(reader, cfg) {
    this.reader = reader;
    this.root = reader.root;
    this.label = (cfg.label || '').trim() || DEFAULT_RADIO.label;
    this.tracks = (cfg.tracks && cfg.tracks.length ? cfg.tracks : DEFAULT_RADIO.tracks).filter((t) => t && t.id);
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { /* ignore */ }
    this.volume = typeof saved.volume === 'number' ? saved.volume : 0.7;
    this.vintage = saved.vintage !== false;
    this.index = Number.isInteger(saved.index) && saved.index < this.tracks.length ? saved.index : Math.floor(Math.random() * this.tracks.length);
    this.on = false;
    this.build();
  }

  build() {
    const label = esc(this.label);
    this.root.insertAdjacentHTML('beforeend', `
      <button type="button" class="radio-desk" aria-label="${label} : allumer ou éteindre">
        <span class="rd-glow"></span>
        ${radioSVG()}
        <span class="desk-label">${label}</span>
      </button>
      <div class="radio-bar" hidden role="group" aria-label="${label}">
        <p class="rb-title" aria-live="polite"></p>
        <div class="rb-row">
          <button type="button" data-r="prev" aria-label="Morceau précédent">${IC.prev}</button>
          <button type="button" data-r="play" aria-label="Lecture ou pause">${IC.pause}</button>
          <button type="button" data-r="next" aria-label="Morceau suivant">${IC.next}</button>
          <input type="range" class="rb-vol" min="0" max="1" step="0.05" aria-label="Volume">
          <button type="button" data-r="vintage" class="rb-vintage" title="Son d’époque" aria-label="Son d’époque">1930</button>
          <button type="button" data-r="off" aria-label="Éteindre la radio">${IC.power}</button>
        </div>
      </div>`);
    this.desk = this.root.querySelector('.radio-desk');
    this.root.classList.add('has-radio');
    this.bar = this.root.querySelector('.radio-bar');
    this.titleEl = this.bar.querySelector('.rb-title');
    this.playBtn = this.bar.querySelector('[data-r="play"]');
    this.vol = this.bar.querySelector('.rb-vol');
    this.vol.value = this.volume;
    this.bar.querySelector('.rb-vintage').classList.toggle('on', this.vintage);

    this.audio = new Audio();
    this.audio.crossOrigin = 'anonymous';
    this.audio.preload = 'none';
    this.audio.addEventListener('ended', () => this.step(1));
    this.audio.addEventListener('error', () => { if (this.on) this.onError(); });
    this.audio.addEventListener('play', () => this.syncPlay());
    this.audio.addEventListener('pause', () => this.syncPlay());

    this.desk.addEventListener('click', () => (this.on ? this.powerOff() : this.powerOn()));
    this.vol.addEventListener('input', () => { this.volume = Number(this.vol.value); this.applyVolume(); this.save(); });
    this.bar.addEventListener('click', (e) => {
      const b = e.target.closest('[data-r]');
      if (!b) return;
      const a = b.dataset.r;
      if (a === 'prev') this.step(-1);
      if (a === 'next') this.step(1);
      if (a === 'play') { if (this.audio.paused) this.audio.play().catch(() => {}); else this.audio.pause(); }
      if (a === 'off') this.powerOff();
      if (a === 'vintage') {
        this.vintage = !this.vintage;
        b.classList.toggle('on', this.vintage);
        this.route();
        this.save();
      }
    });
  }

  save() {
    try { localStorage.setItem(KEY, JSON.stringify({ volume: this.volume, vintage: this.vintage, index: this.index })); } catch (e) { /* ignore */ }
  }

  layout() {
    const r = this.reader.radioRest;
    this.desk.hidden = !r;
    if (!r) { this.bar.hidden = true; return; }
    const s = this.desk.style;
    s.left = r.x.toFixed(1) + 'px';
    s.top = r.y.toFixed(1) + 'px';
    s.width = r.w.toFixed(1) + 'px';
    s.height = r.h.toFixed(1) + 'px';
    placeLabel(this.desk.querySelector('.desk-label'), r);
    // Le bandeau se place au-dessus de la radio, sans sortir de l'écran.
    const bw = Math.min(290, window.innerWidth - 16);
    const b = this.bar.style;
    b.width = bw + 'px';
    b.left = Math.max(8, Math.min(window.innerWidth - bw - 8, r.x + r.w / 2 - bw / 2)).toFixed(1) + 'px';
    b.bottom = (window.innerHeight - r.y + 10).toFixed(1) + 'px';
  }

  /* ---------- Son ---------- */
  ensureGraph() {
    if (this.ctx !== undefined) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      const ctx = new AC();
      const src = ctx.createMediaElementSource(this.audio);
      const out = ctx.createGain();
      out.connect(ctx.destination);
      // Haut-parleur d'époque : médium serré, un peu de saturation douce.
      const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 280;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3600;
      const peak = ctx.createBiquadFilter(); peak.type = 'peaking'; peak.frequency.value = 1400; peak.gain.value = 4; peak.Q.value = 0.8;
      const sh = ctx.createWaveShaper();
      const curve = new Float32Array(1024);
      for (let i = 0; i < 1024; i++) { const x = (i / 511.5) - 1; curve[i] = Math.tanh(1.6 * x) / Math.tanh(1.6); }
      sh.curve = curve;
      const vin = ctx.createGain(); vin.gain.value = 1.1;
      hp.connect(lp).connect(peak).connect(sh).connect(vin);
      // Léger grésillement (bruit filtré + petits craquements).
      const n = ctx.sampleRate * 2;
      const buf = ctx.createBuffer(1, n, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * 0.35 + (Math.random() < 0.0004 ? (Math.random() * 2 - 1) * 4 : 0);
      const noise = ctx.createBufferSource(); noise.buffer = buf; noise.loop = true;
      const nf = ctx.createBiquadFilter(); nf.type = 'bandpass'; nf.frequency.value = 2500; nf.Q.value = 0.6;
      const ng = ctx.createGain(); ng.gain.value = 0;
      noise.connect(nf).connect(ng).connect(out);
      noise.start();
      this.ctx = ctx; this.src = src; this.out = out; this.fxIn = hp; this.fxOut = vin; this.noiseGain = ng;
      this.route();
    } catch (e) {
      // Web Audio indisponible : la musique passe directement par l'élément audio.
      this.ctx = null;
    }
  }

  route() {
    if (!this.ctx) { this.applyVolume(); return; }
    this.src.disconnect();
    this.fxOut.disconnect();
    if (this.vintage) { this.src.connect(this.fxIn); this.fxOut.connect(this.out); } else this.src.connect(this.out);
    this.applyVolume();
  }

  applyVolume() {
    const v = this.volume;
    if (this.ctx) {
      this.audio.volume = 1;
      this.out.gain.value = v;
      this.noiseGain.gain.value = this.vintage && this.on ? 0.012 : 0;
    } else {
      this.audio.volume = v;
    }
  }

  load(i, play = true) {
    const n = this.tracks.length;
    this.index = ((i % n) + n) % n;
    const t = this.tracks[this.index];
    this.audio.src = SUNO_AUDIO(t.id);
    this.titleEl.textContent = `♪ ${t.title}`;
    this.errors = this.errors || 0;
    this.save();
    if (play) this.audio.play().catch(() => this.onError());
  }

  step(d) {
    if (!this.on) return;
    this.tune();
    this.load(this.index + d);
  }

  onError() {
    // Morceau indisponible : on passe au suivant (sans boucler indéfiniment).
    this.errors = (this.errors || 0) + 1;
    if (this.errors > Math.min(5, this.tracks.length)) {
      this.titleEl.textContent = 'La radio ne capte pas pour le moment…';
      return;
    }
    setTimeout(() => { if (this.on) this.load(this.index + 1); }, 400);
  }

  syncPlay() {
    const playing = !this.audio.paused;
    this.playBtn.innerHTML = playing ? IC.pause : IC.play;
    this.root.classList.toggle('radio-playing', this.on && playing);
    if (playing) this.errors = 0;
  }

  // Petit bruit de réglage quand on allume ou change de station.
  tune() {
    const s = this.reader.sound;
    if (s && s.ready) {
      const t = s.ctx.currentTime + 0.01;
      s.rustle(t, 0.5, 0.12, 900, 3800, 2.5);
    }
  }

  powerOn() {
    if (!this.tracks.length) return;
    this.on = true;
    this.reader.sound.unlock();
    this.ensureGraph();
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    this.root.classList.add('radio-on');
    this.bar.hidden = false;
    this.tune();
    this.applyVolume();
    this.load(this.index);
  }

  powerOff() {
    this.on = false;
    this.audio.pause();
    this.root.classList.remove('radio-on', 'radio-playing');
    this.bar.hidden = true;
    this.applyVolume();
  }
}
