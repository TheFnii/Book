// Sons synthétisés en direct (Web Audio) : aucun fichier audio, aucun droit d'auteur.

const KEY = 'grimoire.sound';

function readPref() {
  try { return localStorage.getItem(KEY) !== 'off'; } catch (e) { return true; }
}

export class Sound {
  constructor() {
    this.enabled = readPref();
    this.ctx = null;
  }

  setEnabled(on) {
    this.enabled = on;
    try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch (e) { /* ignore */ }
  }

  // Doit être appelé pendant un geste de l'utilisateur (clic / toucher).
  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.8;
      const comp = this.ctx.createDynamicsCompressor();
      this.master.connect(comp).connect(this.ctx.destination);
      this.reverb = this.ctx.createConvolver();
      this.reverb.buffer = this.impulse(2.8, 2.6);
      this.wet = this.ctx.createGain();
      this.wet.gain.value = 0.45;
      this.reverb.connect(this.wet).connect(this.master);
      this.noiseBuf = this.noise(2);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  get ready() {
    return this.enabled && this.ctx && this.ctx.state !== 'closed';
  }

  noise(seconds) {
    const len = Math.floor(this.ctx.sampleRate * seconds);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  impulse(seconds, decay) {
    const rate = this.ctx.sampleRate;
    const len = Math.floor(rate * seconds);
    const buf = this.ctx.createBuffer(2, len, rate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  }

  bell(freq, t, gain, dur = 2.2) {
    const ctx = this.ctx;
    const out = ctx.createGain();
    out.gain.setValueAtTime(0, t);
    out.gain.linearRampToValueAtTime(gain, t + 0.006);
    out.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    out.connect(this.master);
    out.connect(this.reverb);
    [[1, 1], [2.76, 0.28], [5.4, 0.1], [0.5, 0.18]].forEach(([m, a]) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = freq * m;
      g.gain.value = a;
      o.connect(g).connect(out);
      o.start(t);
      o.stop(t + dur + 0.1);
    });
  }

  // Carillon magique (ouverture du livre).
  chime() {
    if (!this.ready) return;
    const t = this.ctx.currentTime + 0.02;
    const notes = [1318.5, 1568, 1975.5, 2349.3, 2637, 3136];
    notes.forEach((n, i) => this.bell(n, t + i * 0.085, 0.09 - i * 0.008, 2.4));
    // nappe grave et chaude
    const ctx = this.ctx;
    const pad = ctx.createGain();
    pad.gain.setValueAtTime(0, t);
    pad.gain.linearRampToValueAtTime(0.07, t + 0.35);
    pad.gain.exponentialRampToValueAtTime(0.0001, t + 3.2);
    pad.connect(this.master);
    pad.connect(this.reverb);
    [196, 293.7, 392].forEach((fq) => {
      const o = ctx.createOscillator();
      o.type = 'triangle';
      o.frequency.value = fq;
      o.detune.value = (Math.random() - 0.5) * 10;
      o.connect(pad);
      o.start(t);
      o.stop(t + 3.3);
    });
    // scintillement
    this.shimmer(t + 0.1, 1.6, 0.05);
  }

  shimmer(t, dur, gain) {
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const hp = ctx.createBiquadFilter();
    hp.type = 'bandpass';
    hp.Q.value = 6;
    hp.frequency.setValueAtTime(5000, t);
    hp.frequency.exponentialRampToValueAtTime(11000, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + dur * 0.3);
    g.gain.linearRampToValueAtTime(0, t + dur);
    src.connect(hp).connect(g);
    g.connect(this.master);
    g.connect(this.reverb);
    src.start(t, Math.random());
    src.stop(t + dur + 0.05);
  }

  rustle(t, dur, gain, f0, f1, q = 0.9) {
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.playbackRate.value = 0.85 + Math.random() * 0.3;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = q;
    bp.frequency.setValueAtTime(f0, t);
    bp.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + dur * 0.12);
    g.gain.exponentialRampToValueAtTime(gain * 0.45, t + dur * 0.45);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(bp).connect(g).connect(this.master);
    const send = ctx.createGain();
    send.gain.value = 0.15;
    g.connect(send).connect(this.reverb);
    src.start(t, Math.random() * 1.2);
    src.stop(t + dur + 0.05);
  }

  // Page qui tourne.
  page() {
    if (!this.ready) return;
    const t = this.ctx.currentTime + 0.01;
    this.rustle(t, 0.42, 0.5, 3200, 900);
    this.rustle(t + 0.05, 0.3, 0.18, 6000, 2500, 1.4);
    this.rustle(t + 0.36, 0.12, 0.22, 1800, 1200, 1.2); // la page se pose
  }

  // Couverture qui s'ouvre / se ferme.
  cover(closing = false) {
    if (!this.ready) return;
    const ctx = this.ctx;
    const t = ctx.currentTime + 0.01;
    this.rustle(t, 1.1, 0.35, 900, 300, 0.7);
    const land = t + (closing ? 1.45 : 1.55);
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(110, land);
    o.frequency.exponentialRampToValueAtTime(48, land + 0.25);
    g.gain.setValueAtTime(0.0001, land);
    g.gain.exponentialRampToValueAtTime(0.35, land + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, land + 0.35);
    o.connect(g).connect(this.master);
    o.start(land);
    o.stop(land + 0.4);
    this.rustle(land, 0.18, 0.25, 700, 400, 1);
  }

  // Son de verre (partiels presque harmoniques, très purs).
  glass(freq, t, gain, dur = 2.5) {
    const ctx = this.ctx;
    const out = ctx.createGain();
    out.gain.setValueAtTime(0, t);
    out.gain.linearRampToValueAtTime(gain, t + 0.02);
    out.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    out.connect(this.master);
    out.connect(this.reverb);
    [[1, 1], [2.01, 0.25], [3.02, 0.08]].forEach(([m, a]) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = freq * m;
      g.gain.value = a;
      o.connect(g).connect(out);
      o.start(t);
      o.stop(t + dur + 0.1);
    });
  }

  pad(freqs, t, gain, attack, dur, type = 'sine') {
    const ctx = this.ctx;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    g.connect(this.master);
    g.connect(this.reverb);
    freqs.forEach((f) => {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = f;
      o.detune.value = (Math.random() - 0.5) * 12;
      o.connect(g);
      o.start(t);
      o.stop(t + dur + 0.1);
    });
  }

  // Arrivée sur la boule de cristal.
  oracleOpen() {
    if (!this.ready) return;
    const t = this.ctx.currentTime + 0.02;
    this.rustle(t, 1, 0.12, 600, 2400, 0.6);
    this.pad([220, 329.6, 440], t, 0.05, 0.6, 2.8);
    this.glass(1760, t + 0.5, 0.05, 2.5);
  }

  // Pendant que la boule « réfléchit ».
  oracleAsk() {
    if (!this.ready) return;
    const t = this.ctx.currentTime + 0.02;
    this.shimmer(t, 2.4, 0.07);
    this.pad([146.8, 220, 293.7], t, 0.06, 1.2, 3);
    const notes = [1318.5, 1568, 1760, 2093, 2349.3, 2637];
    for (let i = 0; i < 12; i++) {
      this.glass(notes[Math.floor(Math.random() * notes.length)], t + i * 0.19, 0.018 + i * 0.002, 1.4);
    }
  }

  // La réponse apparaît.
  oracleReveal() {
    if (!this.ready) return;
    const t = this.ctx.currentTime + 0.02;
    [1318.5, 1661.2, 1975.5, 2637].forEach((f, i) => this.glass(f, t + i * 0.06, 0.07 - i * 0.01, 3.2));
    this.pad([164.8, 246.9, 329.6], t, 0.07, 0.05, 3.2, 'triangle');
  }

  // Petit tintement (clic de bouton, sommaire…).
  tink() {
    if (!this.ready) return;
    this.bell(2637, this.ctx.currentTime + 0.01, 0.035, 0.9);
  }
}
