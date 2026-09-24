// Phases de la Lune (algorithme de Jean Meeus, « Astronomical Algorithms », chap. 49).
// Précision : quelques minutes. Affichage à l'heure de Paris.

const RAD = Math.PI / 180;
const SYNODIC = 29.530588861;
export const TZ = 'Europe/Paris';

// 0 = nouvelle lune, 1 = premier quartier, 2 = pleine lune, 3 = dernier quartier
function phaseJDE(k, type) {
  k += type / 4;
  const T = k / 1236.85;
  let jde = 2451550.09766 + SYNODIC * k + 0.00015437 * T * T - 0.00000015 * T ** 3 + 0.00000000073 * T ** 4;
  const E = 1 - 0.002516 * T - 0.0000074 * T * T;
  const M = (2.5534 + 29.1053567 * k - 0.0000014 * T * T - 0.00000011 * T ** 3) * RAD;
  const Mp = (201.5643 + 385.81693528 * k + 0.0107582 * T * T + 0.00001238 * T ** 3 - 0.000000058 * T ** 4) * RAD;
  const F = (160.7108 + 390.67050284 * k - 0.0016118 * T * T - 0.00000227 * T ** 3 + 0.000000011 * T ** 4) * RAD;
  const O = (124.7746 - 1.56375588 * k + 0.0020672 * T * T + 0.00000215 * T ** 3) * RAD;
  const s = Math.sin;
  let c;
  if (type === 0 || type === 2) {
    const n = type === 0;
    c = (n ? -0.4072 : -0.40614) * s(Mp) + (n ? 0.17241 : 0.17302) * E * s(M) + (n ? 0.01608 : 0.01614) * s(2 * Mp)
      + (n ? 0.01039 : 0.01043) * s(2 * F) + (n ? 0.00739 : 0.00734) * E * s(Mp - M) - (n ? 0.00514 : 0.00515) * E * s(Mp + M)
      + (n ? 0.00208 : 0.00209) * E * E * s(2 * M) - 0.00111 * s(Mp - 2 * F) - 0.00057 * s(Mp + 2 * F)
      + 0.00056 * E * s(2 * Mp + M) - 0.00042 * s(3 * Mp) + 0.00042 * E * s(M + 2 * F) + 0.00038 * E * s(M - 2 * F)
      - 0.00024 * E * s(2 * Mp - M) - 0.00017 * s(O) - 0.00007 * s(Mp + 2 * M) + 0.00004 * s(2 * Mp - 2 * F)
      + 0.00004 * s(3 * M) + 0.00003 * s(Mp + M - 2 * F) + 0.00003 * s(2 * Mp + 2 * F) - 0.00003 * s(Mp + M + 2 * F)
      + 0.00003 * s(Mp - M + 2 * F) - 0.00002 * s(Mp - M - 2 * F) - 0.00002 * s(3 * Mp + M) + 0.00002 * s(4 * Mp);
  } else {
    c = -0.62801 * s(Mp) + 0.17172 * E * s(M) - 0.01183 * E * s(Mp + M) + 0.00862 * s(2 * Mp) + 0.00804 * s(2 * F)
      + 0.00454 * E * s(Mp - M) + 0.00204 * E * E * s(2 * M) - 0.0018 * s(Mp - 2 * F) - 0.0007 * s(Mp + 2 * F)
      - 0.0004 * s(3 * Mp) - 0.00034 * E * s(2 * Mp - M) + 0.00032 * E * s(M + 2 * F) + 0.00032 * E * s(M - 2 * F)
      - 0.00028 * E * E * s(Mp + 2 * M) + 0.00027 * E * s(2 * Mp + M) - 0.00017 * s(O) - 0.00005 * s(Mp - M - 2 * F)
      + 0.00004 * s(2 * Mp + 2 * F) - 0.00004 * s(Mp + M + 2 * F) + 0.00004 * s(Mp - 2 * M) + 0.00003 * s(Mp + M - 2 * F)
      + 0.00003 * s(3 * M) + 0.00002 * s(2 * Mp - 2 * F) + 0.00002 * s(Mp - M + 2 * F) - 0.00002 * s(3 * Mp + M);
    const W = 0.00306 - 0.00038 * E * Math.cos(M) + 0.00026 * Math.cos(Mp) - 0.00002 * Math.cos(Mp - M)
      + 0.00002 * Math.cos(Mp + M) + 0.00002 * Math.cos(2 * F);
    c += type === 1 ? W : -W;
  }
  const A = [
    [299.77 + 0.107408 * k - 0.009173 * T * T, 0.000325], [251.88 + 0.016321 * k, 0.000165],
    [251.83 + 26.651886 * k, 0.000164], [349.42 + 36.412478 * k, 0.000126], [84.66 + 18.206239 * k, 0.00011],
    [141.74 + 53.303771 * k, 0.000062], [207.14 + 2.453732 * k, 0.00006], [154.84 + 7.30686 * k, 0.000056],
    [34.52 + 27.261239 * k, 0.000047], [207.19 + 0.121824 * k, 0.000042], [291.34 + 1.844379 * k, 0.00004],
    [161.72 + 24.198154 * k, 0.000037], [239.56 + 25.513099 * k, 0.000035], [331.55 + 3.592518 * k, 0.000023],
  ];
  for (const [a, f] of A) c += f * Math.sin(a * RAD);
  return jde + c;
}

// Temps dynamique → temps universel (ΔT ≈ 69 s autour de 2025) → Date JavaScript.
function jdeToDate(jde, year) {
  const dT = 69 + 0.3 * (year - 2025);
  return new Date((jde - 2440587.5) * 86400000 - dT * 1000);
}

// Toutes les phases principales entre deux dates.
export function phasesBetween(from, to) {
  const out = [];
  const y0 = from.getUTCFullYear() + from.getUTCMonth() / 12;
  let k = Math.floor((y0 - 2000) * 12.3685) - 1;
  for (;;) {
    for (let t = 0; t < 4; t++) {
      const d = jdeToDate(phaseJDE(k, t), y0);
      if (d > to) return out;
      if (d >= from) out.push({ type: t, date: d });
    }
    k++;
  }
}

const DAY = 86400000;

// État de la Lune à une date : angle de phase, éclairement, âge, phase précédente et suivante.
export function moonState(date) {
  const ev = phasesBetween(new Date(date - 40 * DAY), new Date(+date + 40 * DAY));
  let i = ev.findIndex((e) => e.date > date);
  const next = ev[i];
  const prev = ev[i - 1];
  const f = (date - prev.date) / (next.date - prev.date);
  const theta = (prev.type + f) * 90; // 0 nouvelle, 90 premier quartier, 180 pleine, 270 dernier
  const illum = (1 - Math.cos(theta * RAD)) / 2;
  let lastNew = prev;
  for (let j = i - 1; j >= 0; j--) if (ev[j].type === 0) { lastNew = ev[j]; break; }
  return { theta, illum, age: (date - lastNew.date) / DAY, prev, next };
}

// Clé de jour à l'heure de Paris (« 2026-09-24 »).
const keyFmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
export const dayKey = (d) => keyFmt.format(d);

// Midi à Paris pour une date du calendrier (sert de référence pour l'état du jour).
export function parisNoon(y, m, d) {
  const guess = new Date(Date.UTC(y, m, d, 12));
  const h = Number(new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', hour12: false }).format(guess));
  return new Date(+guess - (h - 12) * 3600000);
}

// Nom de la phase d'un jour (8 phases), en tenant compte des phases principales tombant ce jour-là.
export const MAJOR = ['Nouvelle lune', 'Premier quartier', 'Pleine lune', 'Dernier quartier'];
const MINOR = ['Premier croissant', 'Lune gibbeuse croissante', 'Lune gibbeuse décroissante', 'Dernier croissant'];
export function dayPhase(y, m, d) {
  const noon = parisNoon(y, m, d);
  const st = moonState(noon);
  const key = dayKey(noon);
  const major = [st.prev, st.next].find((e) => dayKey(e.date) === key);
  return {
    ...st,
    date: noon,
    major: major ? major.type : null,
    name: major ? MAJOR[major.type] : MINOR[st.prev.type],
    period: major ? major.type : st.prev.type, // phase dont on vit l'énergie
  };
}
