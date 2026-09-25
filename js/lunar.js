// Calendrier lunaire : cadran posé sur le bureau et panneau interactif
// (« Aujourd'hui », « Calendrier », « Lunaisons »), dans le fuseau horaire choisi.
import { DEFAULT_LUNAR } from './config.js';
import { phasesBetween, moonState, dayPhase, ymdIn, localNoon, lunations, tzOffset, MAJOR } from './moon.js';
import { drawMoon, litPath } from './moon-draw.js';
import { placeLabel } from './oracle.js';

const DAY = 86400000;
const KEYS = ['new', 'first', 'full', 'last'];
const TZ_KEY = 'grimoire.tz';
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const same = (a, b) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
const diffDays = (a, b) => Math.round((Date.UTC(b[0], b[1] - 1, b[2]) - Date.UTC(a[0], a[1] - 1, a[2])) / DAY);

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* ---------- Fuseaux horaires ---------- */
const FEATURED = [
  ['Europe/Paris', 'France métropolitaine'], ['Europe/Brussels', 'Belgique'], ['Europe/Zurich', 'Suisse'],
  ['Europe/Luxembourg', 'Luxembourg'], ['Europe/Monaco', 'Monaco'], ['America/Toronto', 'Québec'],
  ['America/Guadeloupe', 'Guadeloupe'], ['America/Martinique', 'Martinique'], ['America/Cayenne', 'Guyane'],
  ['America/Miquelon', 'Saint-Pierre-et-Miquelon'], ['Indian/Reunion', 'La Réunion'], ['Indian/Mayotte', 'Mayotte'],
  ['Indian/Mauritius', 'Maurice'], ['Pacific/Noumea', 'Nouvelle-Calédonie'], ['Pacific/Tahiti', 'Polynésie (Tahiti)'],
  ['Pacific/Wallis', 'Wallis-et-Futuna'], ['Africa/Casablanca', 'Maroc'], ['Africa/Algiers', 'Algérie'],
  ['Africa/Tunis', 'Tunisie'], ['Africa/Dakar', 'Sénégal'], ['Africa/Abidjan', 'Côte d’Ivoire'],
  ['Africa/Kinshasa', 'RD Congo (Kinshasa)'], ['Africa/Douala', 'Cameroun'], ['Asia/Beirut', 'Liban'],
];

function validTz(tz) {
  try { new Intl.DateTimeFormat('fr', { timeZone: tz }); return true; } catch (e) { return false; }
}

function offsetLabel(tz) {
  const m = tzOffset(new Date(), tz);
  const sign = m >= 0 ? '+' : '−';
  const a = Math.abs(m);
  return `UTC${sign}${Math.floor(a / 60)}${a % 60 ? ':' + String(a % 60).padStart(2, '0') : ''}`;
}

function cityLabel(tz) {
  const parts = tz.split('/');
  return parts[parts.length - 1].replace(/_/g, ' ') + (parts.length > 1 ? ` (${parts[0].replace(/_/g, ' ')})` : '');
}

function tzName(tz) {
  const f = FEATURED.find(([id]) => id === tz);
  return f ? f[1] : cityLabel(tz);
}

/* ---------- Cadran lunaire (dessiné) ---------- */
function dialSVG() {
  const C = 200;
  let ticks = '';
  for (let i = 0; i < 72; i++) {
    const a = (i * 5 - 90) * (Math.PI / 180);
    const r1 = 171;
    const r2 = i % 9 === 0 ? 184 : 179;
    ticks += `<line x1="${(C + Math.cos(a) * r1).toFixed(1)}" y1="${(C + Math.sin(a) * r1).toFixed(1)}" x2="${(C + Math.cos(a) * r2).toFixed(1)}" y2="${(C + Math.sin(a) * r2).toFixed(1)}"/>`;
  }
  let moons = '';
  for (let k = 0; k < 8; k++) {
    const a = (k * 45 - 90) * (Math.PI / 180);
    const x = C + Math.cos(a) * 150;
    const y = C + Math.sin(a) * 150;
    moons += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="12" fill="#0e1234" stroke="url(#dBrass)" stroke-width="1.6"/>`;
    const d = litPath(+x.toFixed(1), +y.toFixed(1), 11, k * 45);
    if (d) moons += `<path d="${d}" fill="#f3e3b5"/>`;
    else moons += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="11" fill="none" stroke="#f3e3b5" stroke-opacity=".35" stroke-width="1"/>`;
  }
  let dots = '';
  [[118, 96], [292, 110], [104, 268], [300, 280], [150, 312], [262, 84], [84, 190], [318, 206]].forEach(([x, y], i) => {
    dots += `<circle cx="${x}" cy="${y}" r="${i % 3 ? 1.4 : 2}" fill="#e8c77a" opacity=".55"/>`;
  });
  return `<svg class="ld-svg" viewBox="0 0 400 400" aria-hidden="true">
  <defs>
    <linearGradient id="dBrass" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#6b4a1c"/><stop offset=".25" stop-color="#f3dc97"/><stop offset=".45" stop-color="#b8883a"/>
      <stop offset=".65" stop-color="#f6e2a4"/><stop offset=".85" stop-color="#9c7228"/><stop offset="1" stop-color="#5a3d17"/>
    </linearGradient>
    <radialGradient id="dFace" cx=".45" cy=".4" r=".7">
      <stop offset="0" stop-color="#23306b"/><stop offset=".6" stop-color="#141a45"/><stop offset="1" stop-color="#090c26"/>
    </radialGradient>
    <radialGradient id="dGlass" cx=".35" cy=".25" r=".7">
      <stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".45" stop-color="#fff" stop-opacity=".04"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </radialGradient>
    <filter id="dShadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="6" stdDeviation="7" flood-color="#000" flood-opacity=".7"/></filter>
  </defs>
  <g filter="url(#dShadow)">
    <circle cx="${C}" cy="${C}" r="196" fill="url(#dBrass)"/>
  </g>
  <circle cx="${C}" cy="${C}" r="189" fill="none" stroke="#3b2a10" stroke-width="2" opacity=".7"/>
  <circle cx="${C}" cy="${C}" r="166" fill="#1a1433" stroke="#3b2a10" stroke-width="2"/>
  <g stroke="#3b2a10" stroke-width="2" stroke-linecap="round" opacity=".8">${ticks}</g>
  <circle cx="${C}" cy="${C}" r="164" fill="url(#dFace)"/>
  <circle cx="${C}" cy="${C}" r="134" fill="none" stroke="url(#dBrass)" stroke-width="2.5"/>
  <circle cx="${C}" cy="${C}" r="100" fill="none" stroke="#e8c77a" stroke-opacity=".35" stroke-width="1" stroke-dasharray="2 6"/>
  ${dots}
  ${moons}
  <g class="ld-needle">
    <path d="M${C} ${C - 72}L${C - 5} ${C - 118}L${C} ${C - 140}L${C + 5} ${C - 118}Z" fill="url(#dBrass)" stroke="#3b2a10" stroke-width="1"/>
    <circle cx="${C}" cy="${C - 118}" r="2.2" fill="#fff3d0"/>
  </g>
  <circle cx="${C}" cy="${C}" r="70" fill="#0a0d26" stroke="url(#dBrass)" stroke-width="7"/>
  <circle cx="${C}" cy="${C}" r="196" fill="url(#dGlass)"/>
</svg>`;
}

export class LunarCalendar {
  constructor(reader, cfg) {
    this.reader = reader;
    this.root = reader.root;
    this.sound = reader.sound;
    this.phases = (cfg && cfg.phases) || DEFAULT_LUNAR.phases;
    this.isOpen = false;
    let saved = null;
    try { saved = localStorage.getItem(TZ_KEY); } catch (e) { /* ignore */ }
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    this.tz = [saved, detected, 'Europe/Paris'].find((t) => t && validTz(t));
    this.view = 'today';
    this.build();
    this.setFormats();
    this.timer = setInterval(() => this.drawDial(), 10 * 60 * 1000);
  }

  build() {
    this.root.insertAdjacentHTML('beforeend', `
      <button type="button" class="lunar-desk" aria-label="Ouvrir le calendrier lunaire">
        <span class="ld-glow"></span>
        ${dialSVG()}
        <canvas class="ld-moon" aria-hidden="true"></canvas>
        <span class="desk-label">Calendrier lunaire</span>
      </button>
      <div class="lunar-aura" aria-hidden="true"></div>
      <section class="lunar-ui" aria-hidden="true" aria-label="Calendrier lunaire">
        <button type="button" class="lu-back">‹ Retour au grimoire</button>
        <div class="lu-wrap">
          <header class="lu-head">
            <h2>Calendrier lunaire</h2>
            <label class="lu-tz"><span>Fuseau horaire</span><select id="lu-tz"></select></label>
            <span class="lu-divider"></span>
            <nav class="lu-tabs" aria-label="Vues">
              <button type="button" class="lu-tab on" data-view="today">Aujourd’hui</button>
              <button type="button" class="lu-tab" data-view="month">Calendrier</button>
              <button type="button" class="lu-tab" data-view="year">Lunaisons</button>
            </nav>
          </header>

          <div class="lu-view" data-v="today">
            <div class="lu-today">
              <div class="lu-moon-col">
                <canvas class="lu-big-moon" aria-hidden="true"></canvas>
                <div class="lu-daynav">
                  <button type="button" data-act="prev-day" aria-label="Jour précédent">‹</button>
                  <span class="lu-date"></span>
                  <button type="button" data-act="next-day" aria-label="Jour suivant">›</button>
                </div>
                <button type="button" class="lu-link" data-act="today" hidden>Revenir à aujourd’hui</button>
              </div>
              <div class="lu-info">
                <article class="lu-card">
                  <div class="lu-card-icon"></div>
                  <div class="lu-card-text">
                    <h3 class="lu-card-title"></h3>
                    <p class="lu-motto"></p>
                  </div>
                  <ul class="lu-tips"></ul>
                </article>
                <p class="lu-name"></p>
                <div class="lu-stats">
                  <div><span class="lu-illum"></span><small>éclairée</small></div>
                  <div><span class="lu-age"></span><small>âge de la lune</small></div>
                </div>
                <p class="lu-event"></p>
                <div class="lu-bar"></div>
              </div>
            </div>
          </div>

          <div class="lu-view" data-v="month" hidden>
            <div class="lu-nav">
              <button type="button" data-act="prev-month" aria-label="Mois précédent">‹</button>
              <h3 class="lu-month-title"></h3>
              <button type="button" data-act="next-month" aria-label="Mois suivant">›</button>
            </div>
            <div class="lu-grid"></div>
          </div>

          <div class="lu-view" data-v="year" hidden>
            <div class="lu-nav">
              <button type="button" data-act="prev-year" aria-label="Année précédente">‹</button>
              <h3 class="lu-year-title"></h3>
              <button type="button" data-act="next-year" aria-label="Année suivante">›</button>
            </div>
            <div class="lu-table-wrap"><table class="lu-table"></table></div>
          </div>
        </div>
      </section>`);
    this.desk = this.root.querySelector('.lunar-desk');
    this.ui = this.root.querySelector('.lunar-ui');
    this.dialMoon = this.desk.querySelector('.ld-moon');
    this.needle = this.desk.querySelector('.ld-needle');
    const q = (s) => this.ui.querySelector(s);
    this.q = q;

    this.desk.addEventListener('click', () => this.open());
    q('.lu-back').addEventListener('click', () => this.close());
    this.ui.addEventListener('click', (e) => {
      const t = e.target.closest('[data-view],[data-act]');
      if (!t) return;
      if (t.dataset.view) this.show(t.dataset.view);
      const act = t.dataset.act;
      if (act === 'prev-day') this.shiftDay(-1);
      if (act === 'next-day') this.shiftDay(1);
      if (act === 'today') { this.day = ymdIn(new Date(), this.tz); this.renderToday(); }
      if (act === 'prev-month' || act === 'next-month') {
        let [y, m] = this.month;
        m += act === 'next-month' ? 1 : -1;
        if (m < 1) { m = 12; y--; }
        if (m > 12) { m = 1; y++; }
        this.month = [y, m];
        this.renderMonth();
      }
      if (act === 'prev-year') { this.year--; this.renderYear(); }
      if (act === 'next-year') { this.year++; this.renderYear(); }
    });

    // Liste des fuseaux : le vôtre, la francophonie, puis tous les autres.
    const sel = q('#lu-tz');
    const opt = (tz, label) => `<option value="${tz}">${esc(label)} — ${offsetLabel(tz)}</option>`;
    const featured = FEATURED.filter(([tz]) => validTz(tz));
    let html = '';
    if (!featured.some(([tz]) => tz === this.tz)) html += `<optgroup label="Votre fuseau">${opt(this.tz, cityLabel(this.tz))}</optgroup>`;
    html += `<optgroup label="France et francophonie">${featured.map(([tz, l]) => opt(tz, l)).join('')}</optgroup>`;
    let all = [];
    try { all = Intl.supportedValuesOf('timeZone'); } catch (e) { all = []; }
    all = all.filter((tz) => !featured.some(([f]) => f === tz) && tz !== this.tz && tz.includes('/'))
      .sort((a, b) => cityLabel(a).localeCompare(cityLabel(b), 'fr'));
    if (all.length) html += `<optgroup label="Toutes les villes">${all.map((tz) => opt(tz, cityLabel(tz))).join('')}</optgroup>`;
    sel.innerHTML = html;
    sel.value = this.tz;
    sel.addEventListener('change', () => {
      this.tz = sel.value;
      try { localStorage.setItem(TZ_KEY, this.tz); } catch (e) { /* ignore */ }
      this.setFormats();
      this.day = ymdIn(new Date(), this.tz);
      this.month = [this.day[0], this.day[1]];
      this.render();
    });
  }

  setFormats() {
    const f = (o) => new Intl.DateTimeFormat('fr-FR', { timeZone: this.tz, ...o });
    this.fmt = {
      long: f({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
      day: f({ weekday: 'long', day: 'numeric', month: 'long' }),
      short: f({ day: 'numeric', month: 'short' }),
      dm: f({ day: 'numeric', month: 'long' }),
      dmy: f({ day: 'numeric', month: 'long', year: 'numeric' }),
      time: f({ hour: '2-digit', minute: '2-digit' }),
      month: f({ month: 'long', year: 'numeric' }),
    };
  }

  layout() {
    const r = this.reader.dialRest;
    this.desk.hidden = !r;
    if (!r) return;
    const s = this.desk.style;
    s.left = r.x.toFixed(1) + 'px';
    s.top = r.y.toFixed(1) + 'px';
    s.width = s.height = r.w.toFixed(1) + 'px';
    placeLabel(this.desk.querySelector('.desk-label'), r);
    const cx = r.x + r.w / 2;
    const cy = r.y + r.w / 2;
    this.root.style.setProperty('--lox', cx.toFixed(1) + 'px');
    this.root.style.setProperty('--loy', cy.toFixed(1) + 'px');
    const dx = window.innerWidth / 2 - cx;
    const dy = window.innerHeight / 2 - cy;
    this.desk.style.setProperty('--ld-zoom', `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) scale(2.6)`);
    this.drawDial();
    if (this.isOpen && this.view === 'today') this.renderToday();
  }

  drawDial() {
    const r = this.reader.dialRest;
    if (!r) return;
    const st = moonState(new Date());
    drawMoon(this.dialMoon, st.theta, Math.max(16, r.w * 0.3));
    this.needle.setAttribute('transform', `rotate(${st.theta.toFixed(1)} 200 200)`);
  }

  open() {
    if (this.isOpen) return;
    const rs = this.reader.state;
    if (rs === 'opening' || rs === 'closing') return;
    if (this.reader.oracle && this.reader.oracle.state === 'focus') return;
    if (this.reader.cards && this.reader.cards.isOpen) return;
    if (this.reader.lenormand && this.reader.lenormand.isOpen) return;
    this.isOpen = true;
    this.reader.hidePanels();
    this.sound.unlock();
    this.sound.oracleOpen();
    this.day = ymdIn(new Date(), this.tz);
    this.month = [this.day[0], this.day[1]];
    this.year = this.day[0];
    this.root.classList.add('lunar-open');
    this.ui.setAttribute('aria-hidden', 'false');
    this.ui.scrollTop = 0;
    this.show('today');
    setTimeout(() => { if (this.isOpen) this.q('.lu-tab.on').focus({ preventScroll: true }); }, 700);
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.root.classList.remove('lunar-open');
    this.ui.setAttribute('aria-hidden', 'true');
    if (document.activeElement) document.activeElement.blur();
  }

  show(view) {
    this.view = view;
    this.ui.querySelectorAll('.lu-tab').forEach((t) => t.classList.toggle('on', t.dataset.view === view));
    this.ui.querySelectorAll('.lu-view').forEach((v) => { v.hidden = v.dataset.v !== view; });
    this.render();
  }

  render() {
    if (this.view === 'today') this.renderToday();
    if (this.view === 'month') this.renderMonth();
    if (this.view === 'year') this.renderYear();
  }

  shiftDay(n) {
    const [y, m, d] = this.day;
    const t = new Date(Date.UTC(y, m - 1, d + n));
    this.day = [t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate()];
    this.renderToday();
  }

  icon(theta, size) {
    const c = document.createElement('canvas');
    c.className = 'lu-mini';
    drawMoon(c, theta, size);
    return c;
  }

  renderToday() {
    const q = this.q;
    const [y, m, d] = this.day;
    const p = dayPhase(y, m, d, this.tz);
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const size = Math.round(Math.min(vh * 0.42, vw * (vw < 760 ? 0.6 : 0.3), 380));
    const cv = q('.lu-big-moon');
    drawMoon(cv, p.theta, size);
    cv.style.setProperty('--glow', (0.15 + p.illum * 0.45).toFixed(2));
    q('.lu-date').textContent = cap(this.fmt.long.format(p.date));
    q('[data-act="today"]').hidden = same(this.day, ymdIn(new Date(), this.tz));

    const ph = this.phases[p.period] || DEFAULT_LUNAR.phases[p.period];
    const card = q('.lu-card');
    card.dataset.phase = KEYS[p.period];
    q('.lu-card-title').textContent = ph.title;
    q('.lu-motto').textContent = ph.motto;
    q('.lu-tips').innerHTML = ph.tips.map((t) => `<li>${esc(t)}</li>`).join('');
    const ic = q('.lu-card-icon');
    ic.innerHTML = '';
    ic.appendChild(this.icon(p.period * 90, 64));

    q('.lu-name').textContent = p.name;
    q('.lu-illum').textContent = Math.round(p.illum * 100) + ' %';
    q('.lu-age').textContent = p.age.toFixed(1).replace('.', ',') + ' j';

    const ev = phasesBetween(new Date(+p.date - 2 * DAY), new Date(+p.date + 40 * DAY));
    const todayEv = ev.find((e) => same(ymdIn(e.date, this.tz), this.day));
    const next = ev.find((e) => diffDays(this.day, ymdIn(e.date, this.tz)) > 0);
    const nd = diffDays(this.day, ymdIn(next.date, this.tz));
    q('.lu-event').innerHTML = todayEv
      ? `<b>${MAJOR[todayEv.type]} ce jour-là</b> à ${this.fmt.time.format(todayEv.date)}`
      : `<b>${MAJOR[next.type]} ${nd === 1 ? 'le lendemain' : `dans ${nd} jours`}</b> · ${this.fmt.day.format(next.date)} à ${this.fmt.time.format(next.date)}`;
    if (same(this.day, ymdIn(new Date(), this.tz))) {
      q('.lu-event').innerHTML = q('.lu-event').innerHTML.replace('ce jour-là', 'aujourd’hui').replace('le lendemain', 'demain');
    }

    // Frise de la lunaison en cours.
    const lun = phasesBetween(new Date(+p.date - 32 * DAY), new Date(+p.date + 32 * DAY));
    let i0 = 0;
    for (let i = 0; i < lun.length; i++) if (lun[i].type === 0 && lun[i].date <= p.date) i0 = i;
    const group = lun.slice(i0, i0 + 5);
    const t0 = group[0].date;
    const span = group[4] ? group[4].date - t0 : 29.53 * DAY;
    const bar = q('.lu-bar');
    const pos = Math.max(0, Math.min(1, (p.date - t0) / span));
    bar.innerHTML = `<div class="track"><div class="fill" style="width:${(pos * 100).toFixed(1)}%"></div></div>`;
    group.slice(0, 4).forEach((e) => {
      const mk = document.createElement('div');
      mk.className = 'mark' + (e.date <= p.date ? ' done' : '');
      mk.style.left = (((e.date - t0) / span) * 100).toFixed(1) + '%';
      mk.appendChild(this.icon(e.type * 90, 26));
      mk.insertAdjacentHTML('beforeend', `<span>${this.fmt.short.format(e.date)}</span>`);
      bar.appendChild(mk);
    });
    bar.insertAdjacentHTML('beforeend', `<div class="now" style="left:${(pos * 100).toFixed(1)}%"></div>`);
  }

  renderMonth() {
    const q = this.q;
    const [y, m] = this.month;
    q('.lu-month-title').textContent = cap(this.fmt.month.format(localNoon(y, m, 15, this.tz)));
    const grid = q('.lu-grid');
    grid.innerHTML = ['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d) => `<div class="wd">${d}</div>`).join('');
    const first = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7;
    const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
    for (let i = 0; i < first; i++) grid.insertAdjacentHTML('beforeend', '<div class="cell empty"></div>');
    const today = ymdIn(new Date(), this.tz);
    for (let d = 1; d <= days; d++) {
      const p = dayPhase(y, m, d, this.tz);
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'cell' + (p.major !== null ? ' major ph-' + KEYS[p.major] : '') + (same([y, m, d], today) ? ' today' : '');
      cell.appendChild(this.icon(p.theta, p.major !== null ? 30 : 24));
      cell.insertAdjacentHTML('beforeend', `<span class="n">${d}</span>${p.major !== null ? `<span class="lbl">${MAJOR[p.major]}</span>` : ''}`);
      cell.title = `${d} : ${p.name} (${Math.round(p.illum * 100)} %)`;
      cell.addEventListener('click', () => { this.day = [y, m, d]; this.show('today'); });
      grid.appendChild(cell);
    }
  }

  renderYear() {
    const q = this.q;
    const y = this.year;
    q('.lu-year-title').textContent = `Lunaisons ${y}`;
    const rows = lunations(y, this.tz);
    const now = new Date();
    const head = `<thead><tr><th></th>${this.phases.map((p, i) => `<th class="ph-${KEYS[i]}"><span class="ico" data-t="${i}"></span>${esc(p.title)}</th>`).join('')}</tr></thead>`;
    const body = rows.map((g, i) => {
      const end = rows[i + 1] ? rows[i + 1][0].date : new Date(+g[0].date + 29.53 * DAY);
      const current = now >= g[0].date && now < end;
      return `<tr class="${current ? 'current' : ''}"><th>Lunaison ${i + 1}</th>${g.map((e) => {
        const fmt = ymdIn(e.date, this.tz)[0] !== y ? this.fmt.dmy : this.fmt.dm;
        return `<td><span class="ico" data-t="${e.type}"></span>${fmt.format(e.date)}</td>`;
      }).join('')}</tr>`;
    }).join('');
    const table = q('.lu-table');
    table.innerHTML = head + `<tbody>${body}</tbody>`;
    table.querySelectorAll('.ico').forEach((el) => {
      el.appendChild(this.icon(Number(el.dataset.t) * 90, el.closest('thead') ? 28 : 20));
    });
  }
}
