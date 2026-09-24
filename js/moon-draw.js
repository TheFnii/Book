// Dessin de la Lune : texture (générée, douce) et ombre de la phase.
function rng(seed) {
  return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
}

let texture = null;
// Bruit de valeur lissé (pour une texture de Lune douce, sans bords durs).
function makeNoise(seed, n) {
  const r = rng(seed);
  const grid = new Float32Array(n * n).map(() => r());
  const at = (x, y) => grid[((y % n) + n) % n * n + ((x % n) + n) % n];
  return (x, y) => {
    const xi = Math.floor(x); const yi = Math.floor(y);
    const fx = x - xi; const fy = y - yi;
    const sx = fx * fx * (3 - 2 * fx); const sy = fy * fy * (3 - 2 * fy);
    const a = at(xi, yi) + (at(xi + 1, yi) - at(xi, yi)) * sx;
    const b = at(xi, yi + 1) + (at(xi + 1, yi + 1) - at(xi, yi + 1)) * sx;
    return a + (b - a) * sy;
  };
}
function moonTexture() {
  if (texture) return texture;
  const S = 384;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d');
  const img = g.createImageData(S, S);
  const nz = makeNoise(11, 64);
  const fbm = (x, y) => { let v = 0; let a = 0.5; let f = 1; for (let o = 0; o < 5; o++) { v += a * nz(x * f, y * f); a *= 0.5; f *= 2; } return v; };
  // Grandes mers, placées comme sur la vraie Lune (face visible).
  const maria = [[0.36, 0.3, 0.17], [0.55, 0.33, 0.09], [0.6, 0.46, 0.1], [0.77, 0.38, 0.06], [0.27, 0.5, 0.17], [0.45, 0.63, 0.1], [0.63, 0.62, 0.07]];
  const R = S / 2;
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const dx = (x - R) / R; const dy = (y - R) / R;
      const d2 = dx * dx + dy * dy;
      const i = (y * S + x) * 4;
      if (d2 > 1) { img.data[i + 3] = 0; continue; }
      const u = x / S; const v = y / S;
      // Contours irréguliers : on déforme les coordonnées avec le bruit.
      const wu = u + (fbm(u * 5 + 13, v * 5) - 0.5) * 0.16;
      const wv = v + (fbm(u * 5, v * 5 + 29) - 0.5) * 0.16;
      let m = 0;
      for (const [mx, my, mr] of maria) {
        const dd = Math.hypot(wu - mx, wv - my) / mr;
        m += Math.max(0, 1 - dd * dd) * 0.75;
      }
      const n1 = fbm(u * 7, v * 7);
      m = Math.min(1, Math.max(0, m + (n1 - 0.5) * 1.1));
      m = m * m * (3 - 2 * m);
      const detail = fbm(u * 28 + 7, v * 28 + 3);
      const limb = 1 - 0.28 * Math.pow(d2, 1.6);
      const k = (0.86 + 0.22 * detail) * limb;
      const hi = [246, 236, 208];
      const lo = [176, 160, 128];
      img.data[i] = (hi[0] + (lo[0] - hi[0]) * m) * k;
      img.data[i + 1] = (hi[1] + (lo[1] - hi[1]) * m) * k;
      img.data[i + 2] = (hi[2] + (lo[2] - hi[2]) * m) * k;
      img.data[i + 3] = d2 > 0.985 ? 255 * (1 - d2) / 0.015 : 255;
    }
  }
  g.putImageData(img, 0, 0);
  // Quelques cratères discrets et Tycho.
  const r = rng(5);
  for (let j = 0; j < 22; j++) {
    const a = r() * Math.PI * 2; const rr = Math.sqrt(r()) * R * 0.85;
    const x = R + Math.cos(a) * rr; const y = R + Math.sin(a) * rr; const cr = 2 + r() * 6;
    const gr = g.createRadialGradient(x, y, 0, x, y, cr);
    gr.addColorStop(0, 'rgba(120,100,70,.18)'); gr.addColorStop(0.75, 'rgba(120,100,70,.1)'); gr.addColorStop(0.9, 'rgba(255,248,230,.18)'); gr.addColorStop(1, 'rgba(255,248,230,0)');
    g.fillStyle = gr; g.fillRect(x - cr, y - cr, cr * 2, cr * 2);
  }
  const t = g.createRadialGradient(S * 0.45, S * 0.83, 0, S * 0.45, S * 0.83, S * 0.05);
  t.addColorStop(0, 'rgba(255,252,240,.7)'); t.addColorStop(1, 'rgba(255,252,240,0)');
  g.fillStyle = t; g.fillRect(0, 0, S, S);
  texture = c;
  return c;
}

// theta : 0 nouvelle lune, 90 premier quartier, 180 pleine lune, 270 dernier quartier.
export function drawMoon(canvas, theta, cssSize) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const S = Math.round(cssSize * dpr);
  canvas.width = canvas.height = S;
  canvas.style.width = canvas.style.height = cssSize + 'px';
  const g = canvas.getContext('2d');
  const R = S / 2;
  g.clearRect(0, 0, S, S);
  g.drawImage(moonTexture(), 0, 0, S, S);

  // Ombre : disque sombre dont on retire la partie éclairée (bord adouci).
  const sh = document.createElement('canvas');
  sh.width = sh.height = S;
  const s = sh.getContext('2d');
  s.fillStyle = 'rgba(8, 10, 32, .9)';
  s.beginPath(); s.arc(R, R, R + 1, 0, Math.PI * 2); s.fill();
  const t = ((theta % 360) + 360) % 360;
  const waning = t > 180;
  const a = waning ? 360 - t : t;
  const rx = Math.abs(Math.cos((a * Math.PI) / 180)) * R;
  s.save();
  if (waning) { s.translate(S, 0); s.scale(-1, 1); }
  s.globalCompositeOperation = 'destination-out';
  s.shadowColor = '#000';
  s.shadowBlur = Math.max(1, R * 0.05);
  s.beginPath();
  s.arc(R, R, R + 1, -Math.PI / 2, Math.PI / 2, false); // bord éclairé (à droite)
  if (a < 90) s.ellipse(R, R, rx, R + 1, 0, Math.PI / 2, -Math.PI / 2, true);
  else s.ellipse(R, R, rx, R + 1, 0, Math.PI / 2, (3 * Math.PI) / 2, false);
  s.closePath();
  if (a > 0.5) s.fill();
  s.restore();
  g.drawImage(sh, 0, 0);
}

// Partie éclairée d'une petite lune en SVG (pour les icônes gravées).
export function litPath(cx, cy, r, theta) {
  const t = ((theta % 360) + 360) % 360;
  if (t < 0.5 || t > 359.5) return '';
  const waning = t > 180;
  const a = waning ? 360 - t : t;
  const rx = Math.abs(Math.cos((a * Math.PI) / 180)) * r;
  const side = waning ? 0 : 1; // bord éclairé : droite en croissance, gauche en décroissance
  const top = `${cx} ${cy - r}`;
  const bottom = `${cx} ${cy + r}`;
  const limb = `A${r} ${r} 0 0 ${side} ${bottom}`;
  const term = a < 90 ? `A${rx.toFixed(2)} ${r} 0 0 ${side ? 0 : 1} ${top}` : `A${rx.toFixed(2)} ${r} 0 0 ${side} ${top}`;
  return `M${top}${limb}${term}Z`;
}
