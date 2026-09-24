// Maquette du calendrier lunaire (vues « Aujourd'hui », « Calendrier », « Lunaisons »).
import { phasesBetween, moonState, dayPhase, dayKey, parisNoon, MAJOR, TZ } from './moon.js';

const DAY = 86400000;
const $ = (s, r = document) => r.querySelector(s);

// Textes des 4 phases (repris de la fiche ; modifiables plus tard dans l'atelier).
export const PHASES = [
  { key: 'new', title: 'Nouvelle lune', motto: 'Je sème', tips: ['Poser ses intentions', 'Commencer un projet', 'Écrire ses objectifs', 'Planifier ses actions'] },
  { key: 'first', title: 'Premier quartier', motto: 'J’agis', tips: ['Passer à l’action', 'Prendre une décision', 'Lever les blocages', 'Oser sortir de sa zone de confort'] },
  { key: 'full', title: 'Pleine lune', motto: 'Je récolte', tips: ['Faire le bilan', 'Prendre conscience', 'Recevoir des réponses', 'Célébrer les réussites'] },
  { key: 'last', title: 'Dernier quartier', motto: 'Je libère', tips: ['Lâcher prise', 'Trier et ranger', 'Pardonner', 'Clore ce qui n’a plus sa place'] },
];

const f = (o) => new Intl.DateTimeFormat('fr-FR', { timeZone: TZ, ...o });
const fmtLong = f({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const fmtDay = f({ weekday: 'long', day: 'numeric', month: 'long' });
const fmtShort = f({ day: 'numeric', month: 'short' });
const fmtTime = f({ hour: '2-digit', minute: '2-digit' });
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const ymd = (d) => dayKey(d).split('-').map(Number);

/* ---------- Dessin de la Lune ---------- */
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

/* ---------- Données ---------- */
function todayYMD() { return ymd(new Date()); }
function sameDay(a, b) { return a[0] === b[0] && a[1] === b[1] && a[2] === b[2]; }
function diffDays(a, b) { return Math.round((Date.UTC(b[0], b[1] - 1, b[2]) - Date.UTC(a[0], a[1] - 1, a[2])) / DAY); }

// Lunaisons d'une année : celles qui ont au moins une phase principale dans l'année.
function lunations(year) {
  const ev = phasesBetween(new Date(Date.UTC(year - 1, 10, 1)), new Date(Date.UTC(year + 1, 1, 15)));
  const out = [];
  for (let i = 0; i < ev.length; i++) {
    if (ev[i].type !== 0) continue;
    const group = ev.slice(i, i + 4);
    if (group.length < 4) break;
    if (group.some((e) => ymd(e.date)[0] === year)) out.push(group);
  }
  return out;
}

/* ---------- Interface ---------- */
const state = { day: todayYMD(), month: null, year: null, view: 'today' };

function moonIcon(theta, size) {
  const c = document.createElement('canvas');
  c.className = 'mini-moon';
  drawMoon(c, theta, size);
  return c;
}

function renderToday() {
  const [y, m, d] = state.day;
  const p = dayPhase(y, m - 1, d);
  const size = Math.round(Math.min(window.innerHeight * 0.42, window.innerWidth * (window.innerWidth < 760 ? 0.62 : 0.3), 380));
  const cv = $('#big-moon');
  drawMoon(cv, p.theta, size);
  cv.style.setProperty('--glow', (0.15 + p.illum * 0.45).toFixed(2));
  const isToday = sameDay(state.day, todayYMD());
  $('#t-date').textContent = cap(fmtLong.format(p.date));
  $('#t-back').hidden = isToday;
  $('#t-name').textContent = p.name;
  $('#t-illum').textContent = Math.round(p.illum * 100) + ' %';
  $('#t-age').textContent = p.age.toFixed(1).replace('.', ',') + ' j';

  const ph = PHASES[p.period];
  const card = $('#t-card');
  card.dataset.phase = ph.key;
  $('#t-card-title').textContent = ph.title;
  $('#t-card-motto').textContent = ph.motto;
  $('#t-card-tips').innerHTML = ph.tips.map((t) => `<li>${t}</li>`).join('');
  const icon = $('#t-card-icon');
  icon.innerHTML = '';
  icon.appendChild(moonIcon(p.period * 90, 54));

  // Prochaine phase principale (après aujourd'hui).
  const ev = phasesBetween(new Date(+p.date - 2 * DAY), new Date(+p.date + 40 * DAY));
  const todayEv = ev.find((e) => sameDay(ymd(e.date), state.day));
  const next = ev.find((e) => diffDays(state.day, ymd(e.date)) > 0);
  const nd = diffDays(state.day, ymd(next.date));
  $('#t-event').innerHTML = todayEv
    ? `<b>${MAJOR[todayEv.type]} aujourd’hui</b> à ${fmtTime.format(todayEv.date)}`
    : `<b>${MAJOR[next.type]} ${nd === 1 ? 'demain' : `dans ${nd} jours`}</b> · ${fmtDay.format(next.date)} à ${fmtTime.format(next.date)}`;

  // Frise de la lunaison en cours.
  const lun = phasesBetween(new Date(+p.date - 32 * DAY), new Date(+p.date + 32 * DAY));
  let i0 = -1;
  for (let i = 0; i < lun.length; i++) if (lun[i].type === 0 && lun[i].date <= p.date) i0 = i;
  const group = lun.slice(i0, i0 + 5);
  const t0 = group[0].date;
  const span = group[4].date - t0;
  const bar = $('#t-bar');
  bar.innerHTML = '<div class="track"><div class="fill"></div></div>';
  const pos = Math.max(0, Math.min(1, (p.date - t0) / span));
  bar.querySelector('.fill').style.width = (pos * 100).toFixed(1) + '%';
  group.slice(0, 4).forEach((e) => {
    const x = (e.date - t0) / span;
    const mk = document.createElement('div');
    mk.className = 'mark' + (e.date <= p.date ? ' done' : '');
    mk.style.left = (x * 100).toFixed(1) + '%';
    mk.appendChild(moonIcon(e.type * 90, 26));
    mk.insertAdjacentHTML('beforeend', `<span>${fmtShort.format(e.date)}</span>`);
    bar.appendChild(mk);
  });
  const now = document.createElement('div');
  now.className = 'now';
  now.style.left = (pos * 100).toFixed(1) + '%';
  bar.appendChild(now);
}

function renderMonth() {
  const [y, m] = state.month;
  const title = f({ month: 'long', year: 'numeric' }).format(parisNoon(y, m - 1, 15));
  $('#m-title').textContent = cap(title);
  const grid = $('#m-grid');
  grid.innerHTML = ['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d) => `<div class="wd">${d}</div>`).join('');
  const first = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7;
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  for (let i = 0; i < first; i++) grid.insertAdjacentHTML('beforeend', '<div class="cell empty"></div>');
  const today = todayYMD();
  for (let d = 1; d <= days; d++) {
    const p = dayPhase(y, m - 1, d);
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'cell' + (p.major !== null ? ' major ph-' + PHASES[p.major].key : '') + (sameDay([y, m, d], today) ? ' today' : '');
    cell.appendChild(moonIcon(p.theta, p.major !== null ? 30 : 24));
    cell.insertAdjacentHTML('beforeend', `<span class="n">${d}</span>${p.major !== null ? `<span class="lbl">${MAJOR[p.major]}</span>` : ''}`);
    cell.title = `${d} : ${p.name} (${Math.round(p.illum * 100)} %)`;
    cell.onclick = () => { state.day = [y, m, d]; show('today'); };
    grid.appendChild(cell);
  }
}

function renderYear() {
  const y = state.year;
  $('#y-title').textContent = `Lunaisons ${y}`;
  const rows = lunations(y);
  const now = new Date();
  const body = rows.map((g, i) => {
    const current = now >= g[0].date && (rows[i + 1] ? now < rows[i + 1][0].date : now < new Date(+g[0].date + 29.6 * DAY));
    return `<tr class="${current ? 'current' : ''}"><th>Lunaison ${i + 1}</th>${g.map((e) => `<td data-type="${e.type}"><span class="ico"></span>${f({ day: 'numeric', month: 'long', ...(ymd(e.date)[0] !== y ? { year: 'numeric' } : {}) }).format(e.date)}</td>`).join('')}</tr>`;
  }).join('');
  $('#y-table').innerHTML = `<thead><tr><th></th>${PHASES.map((p, i) => `<th class="ph-${p.key}"><span class="ico" data-type="${i}"></span>${p.title}</th>`).join('')}</tr></thead><tbody>${body}</tbody>`;
  $('#y-table').querySelectorAll('.ico').forEach((el) => {
    const t = Number(el.dataset.type ?? el.parentElement.dataset.type);
    el.appendChild(moonIcon(t * 90, el.closest('thead') ? 30 : 20));
  });
}

function show(view) {
  state.view = view;
  document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('on', t.dataset.view === view));
  document.querySelectorAll('.view').forEach((v) => { v.hidden = v.id !== 'v-' + view; });
  if (view === 'today') renderToday();
  if (view === 'month') { if (!state.month) state.month = [state.day[0], state.day[1]]; renderMonth(); }
  if (view === 'year') { if (!state.year) state.year = state.day[0]; renderYear(); }
}

function shiftDay(n) {
  const [y, m, d] = state.day;
  const t = new Date(Date.UTC(y, m - 1, d + n));
  state.day = [t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate()];
  renderToday();
}

document.querySelectorAll('.tab').forEach((t) => { t.onclick = () => show(t.dataset.view); });
$('#t-prev').onclick = () => shiftDay(-1);
$('#t-next').onclick = () => shiftDay(1);
$('#t-back').onclick = () => { state.day = todayYMD(); renderToday(); };
$('#m-prev').onclick = () => { let [y, m] = state.month; m--; if (m < 1) { m = 12; y--; } state.month = [y, m]; renderMonth(); };
$('#m-next').onclick = () => { let [y, m] = state.month; m++; if (m > 12) { m = 1; y++; } state.month = [y, m]; renderMonth(); };
$('#y-prev').onclick = () => { state.year--; renderYear(); };
$('#y-next').onclick = () => { state.year++; renderYear(); };
window.addEventListener('resize', () => { if (state.view === 'today') renderToday(); });

const qs = new URLSearchParams(location.search);
if (qs.get('date')) state.day = qs.get('date').split('-').map(Number);
document.fonts.ready.then(() => show(qs.get('vue') || 'today'));
