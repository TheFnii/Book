// Couverture du grimoire dessinée en SVG (vectoriel : nette à toutes les tailles).
// Repère : 1000 × 1414 (format A4 portrait).

const W = 1000;
const H = 1414;
const f = (n) => Math.round(n * 10) / 10;

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Étoile scintillante à 4 branches (côtés concaves).
function sparkle(cx, cy, r) {
  return `M${f(cx)} ${f(cy - r)}Q${f(cx)} ${f(cy)} ${f(cx + r)} ${f(cy)}Q${f(cx)} ${f(cy)} ${f(cx)} ${f(cy + r)}Q${f(cx)} ${f(cy)} ${f(cx - r)} ${f(cy)}Q${f(cx)} ${f(cy)} ${f(cx)} ${f(cy - r)}Z`;
}

// Rose des vents à 8 branches.
function compass(cx, cy, R) {
  const pts = [];
  for (let k = 0; k < 16; k++) {
    const a = (k * Math.PI) / 8 - Math.PI / 2;
    const r = k % 2 ? R * 0.16 : (k / 2) % 2 ? R * 0.55 : R;
    pts.push(`${f(cx + Math.cos(a) * r)} ${f(cy + Math.sin(a) * r)}`);
  }
  return 'M' + pts.join('L') + 'Z';
}

// Croissant de lune ouvert vers la droite.
function crescent(cx, cy, r) {
  const r2 = r * 1.28;
  return `M${f(cx)} ${f(cy - r)}A${r} ${r} 0 0 0 ${f(cx)} ${f(cy + r)}A${f(r2)} ${f(r2)} 0 0 1 ${f(cx)} ${f(cy - r)}Z`;
}

function moonPhases(cy) {
  const xs = [380, 440, 500, 560, 620];
  let s = '';
  xs.forEach((x, i) => {
    const r = i === 2 ? 23 : 18;
    s += `<circle cx="${x}" cy="${cy}" r="${r}" fill="none" stroke="url(#gold)" stroke-width="1.6"/>`;
    if (i === 2) s += `<circle cx="${x}" cy="${cy}" r="${r - 4}" fill="url(#gold)"/>`;
    if (i === 1) s += `<path d="M${x} ${cy - r}A${r} ${r} 0 0 1 ${x} ${cy + r}Z" fill="url(#gold)"/>`;
    if (i === 3) s += `<path d="M${x} ${cy - r}A${r} ${r} 0 0 0 ${x} ${cy + r}Z" fill="url(#gold)"/>`;
    if (i === 0) s += `<path d="${crescent(x, cy, r)}" fill="url(#gold)" transform="translate(${2 * x} 0) scale(-1 1)"/>`;
    if (i === 4) s += `<path d="${crescent(x, cy, r)}" fill="url(#gold)"/>`;
  });
  return s;
}

function cubicPoint(p0, p1, p2, p3, t) {
  const u = 1 - t;
  return [
    u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
    u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
  ];
}

function cornerOrnament() {
  const P = [[0, 210], [0, 95], [95, 0], [210, 0]];
  let dots = '';
  [0.18, 0.36, 0.64, 0.82].forEach((t) => {
    const [x, y] = cubicPoint(...P, t);
    dots += `<circle cx="${f(x + 10)}" cy="${f(y + 10)}" r="3.2"/>`;
  });
  const [mx, my] = cubicPoint(...P, 0.5);
  return `<g id="corner" fill="url(#gold)" stroke="url(#gold)">
    <path d="M0 210C0 95 95 0 210 0" fill="none" stroke-width="3.2"/>
    <path d="M0 150C0 66 66 0 150 0" fill="none" stroke-width="1.4"/>
    <path d="M210 0c20 0 30 15 21 27c-7 9 -21 5 -19 -5" fill="none" stroke-width="2.4"/>
    <path d="M0 210c0 20 15 30 27 21c9 -7 5 -21 -5 -19" fill="none" stroke-width="2.4"/>
    <path d="${sparkle(34, 34, 26)}" stroke="none"/>
    <circle cx="34" cy="34" r="5" stroke="none" fill="#2a180e"/>
    <path d="${sparkle(mx + 22, my + 22, 11)}" stroke="none"/>
    <g stroke="none">${dots}</g>
  </g>`;
}

const STARS = [
  [300, 175, 11], [415, 228, 7], [610, 205, 9], [705, 160, 6], [875, 385, 9], [128, 420, 9],
  [112, 1000, 8], [888, 985, 11], [290, 1045, 7], [715, 1050, 8], [196, 1238, 9], [806, 1244, 8],
  [520, 1300, 6], [470, 140, 6], [178, 560, 6], [826, 560, 7], [170, 860, 7], [838, 860, 6],
  [560, 110, 5], [120, 300, 6], [890, 250, 5], [240, 1150, 5], [760, 1160, 6], [380, 1310, 5],
  [640, 1330, 5],
];

export function coverSVG({ line1 = '', line2 = '' } = {}) {
  const cx = 500;
  const cy = 700;
  let stars = STARS.map(([x, y, r]) => `<path d="${sparkle(x, y, r)}"/>`).join('');
  let ticks = '';
  for (let k = 0; k < 32; k++) {
    const a = (k * Math.PI) / 16;
    const r1 = 278;
    const r2 = k % 4 === 0 ? 300 : 290;
    ticks += `<line x1="${f(cx + Math.cos(a) * r1)}" y1="${f(cy + Math.sin(a) * r1)}" x2="${f(cx + Math.cos(a) * r2)}" y2="${f(cy + Math.sin(a) * r2)}"/>`;
  }
  let ringStars = '';
  for (let k = 0; k < 8; k++) {
    const a = (k * Math.PI) / 4 + Math.PI / 8;
    ringStars += `<path d="${sparkle(cx + Math.cos(a) * 255, cy + Math.sin(a) * 255, 9)}"/>`;
  }

  return `<svg class="cover-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <linearGradient id="gold" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${W}" y2="${H}">
      <stop offset="0" stop-color="#8a6424"/>
      <stop offset=".18" stop-color="#f6dc92"/>
      <stop offset=".32" stop-color="#b8883a"/>
      <stop offset=".5" stop-color="#fbe7a8"/>
      <stop offset=".66" stop-color="#a97b30"/>
      <stop offset=".82" stop-color="#f1d386"/>
      <stop offset="1" stop-color="#7d5a1f"/>
    </linearGradient>
    <linearGradient id="goldText" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff2c2"/>
      <stop offset=".45" stop-color="#e9c46f"/>
      <stop offset=".55" stop-color="#c6953f"/>
      <stop offset="1" stop-color="#f3d68a"/>
    </linearGradient>
    <linearGradient id="hinge" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#000" stop-opacity=".6"/>
      <stop offset=".6" stop-color="#000" stop-opacity=".25"/>
      <stop offset=".8" stop-color="#ffd9a0" stop-opacity=".09"/>
      <stop offset="1" stop-color="#000" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="medal" cx=".5" cy=".5" r=".5">
      <stop offset="0" stop-color="#000" stop-opacity=".0"/>
      <stop offset=".8" stop-color="#000" stop-opacity=".18"/>
      <stop offset="1" stop-color="#000" stop-opacity=".35"/>
    </radialGradient>
    <filter id="emboss" x="-3%" y="-3%" width="106%" height="106%">
      <feDropShadow dx="0" dy="3" stdDeviation="2.2" flood-color="#000" flood-opacity=".7"/>
    </filter>
    ${cornerOrnament()}
  </defs>

  <rect x="0" y="0" width="46" height="${H}" fill="url(#hinge)"/>
  <circle cx="${cx}" cy="${cy}" r="262" fill="url(#medal)"/>

  <g filter="url(#emboss)">
    <g fill="none" stroke="url(#gold)">
      <rect x="40" y="40" width="${W - 80}" height="${H - 80}" rx="6" stroke-width="5"/>
      <rect x="51" y="51" width="${W - 102}" height="${H - 102}" rx="4" stroke-width="3" stroke-dasharray="0 13" stroke-linecap="round"/>
      <rect x="62" y="62" width="${W - 124}" height="${H - 124}" rx="3" stroke-width="1.6"/>
      <circle cx="${cx}" cy="${cy}" r="262" stroke-width="3" stroke-dasharray="0 12" stroke-linecap="round"/>
      <circle cx="${cx}" cy="${cy}" r="250" stroke-width="4"/>
      <circle cx="${cx}" cy="${cy}" r="236" stroke-width="1.3"/>
      <g stroke-width="2">${ticks}</g>
      <path d="M345 ${cy - 8}H468M532 ${cy - 8}H655" stroke-width="1.6"/>
      <path d="M330 1212H466M534 1212H670" stroke-width="1.6"/>
    </g>

    <use href="#corner" transform="translate(72 72)"/>
    <use href="#corner" transform="translate(${W - 72} 72) scale(-1 1)"/>
    <use href="#corner" transform="translate(72 ${H - 72}) scale(1 -1)"/>
    <use href="#corner" transform="translate(${W - 72} ${H - 72}) scale(-1 -1)"/>

    <g fill="url(#gold)">
      <path d="${compass(cx, 335, 72)}"/>
      <circle cx="${cx}" cy="335" r="9" fill="#2a180e"/>
      <circle cx="${cx}" cy="335" r="4"/>
      <path d="${compass(150, cy, 58)}"/>
      <path d="${compass(850, cy, 58)}"/>
      <path d="${crescent(250, 300, 36)}" transform="rotate(-25 250 300)"/>
      <path d="${crescent(750, 300, 36)}" transform="translate(1500 0) scale(-1 1) rotate(-25 750 300)"/>
      <path d="${sparkle(cx, cy - 8, 15)}"/>
      <path d="${sparkle(500, 1212, 13)}"/>
      <path d="${sparkle(500, 62, 17)}"/>
      <path d="${sparkle(500, H - 62, 17)}"/>
      <path d="${sparkle(62, H / 2, 17)}"/>
      <path d="${sparkle(W - 62, H / 2, 17)}"/>
      ${ringStars}
      ${stars}
    </g>
    ${moonPhases(1150)}

    <g class="cover-title" fill="url(#goldText)" stroke="#2b1609" stroke-width="1.2" paint-order="stroke" text-anchor="middle">
      <text x="${cx}" y="${cy - 42}" font-size="66" data-max="420" style="font-family:'UnifrakturMaguntia',serif">${esc(line1)}</text>
      <text x="${cx}" y="${cy + 150}" font-size="168" data-max="430" style="font-family:'UnifrakturMaguntia',serif">${esc(line2)}</text>
    </g>
  </g>
</svg>`;
}

// Réduit la taille du titre s'il est trop long pour le médaillon.
export async function fitCoverText(root) {
  try { await document.fonts.ready; } catch (e) { /* ignore */ }
  root.querySelectorAll('.cover-title text').forEach((t) => {
    const max = Number(t.dataset.max);
    const base = Number(t.dataset.base || t.getAttribute('font-size'));
    t.dataset.base = base;
    t.setAttribute('font-size', base);
    let len = 0;
    try { len = t.getComputedTextLength(); } catch (e) { return; }
    if (len > max) t.setAttribute('font-size', f((base * max) / len));
  });
}

// Petit dos du livre (visible quand il est fermé).
export function spineSVG() {
  const bands = [0.12, 0.3, 0.5, 0.7, 0.88];
  return `<svg class="spine-svg" viewBox="0 0 60 1414" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <linearGradient id="spineShade" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#0c0604"/>
      <stop offset=".35" stop-color="#3c2418"/>
      <stop offset=".6" stop-color="#2a180f"/>
      <stop offset="1" stop-color="#0e0805"/>
    </linearGradient>
    <linearGradient id="spineGold" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#6b4c1a"/>
      <stop offset=".4" stop-color="#f2d68c"/>
      <stop offset="1" stop-color="#7d5a1f"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="60" height="1414" rx="14" fill="url(#spineShade)"/>
  ${bands.map((b) => `<rect x="2" y="${f(b * 1414 - 14)}" width="56" height="28" rx="10" fill="#4a2c1c"/>
  <rect x="2" y="${f(b * 1414 - 16)}" width="56" height="3" fill="url(#spineGold)"/>
  <rect x="2" y="${f(b * 1414 + 13)}" width="56" height="3" fill="url(#spineGold)"/>`).join('')}
</svg>`;
}
