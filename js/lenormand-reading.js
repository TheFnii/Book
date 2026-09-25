// Interprétation globale d'un tirage Lenormand : ambiance, thème dominant,
// lecture en paires (la 1re carte est le sujet, la suivante la nuance), points d'attention, conseil.
import { THEMES, NOTES } from './lenormand-data.js';

export function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// « de » + groupe nominal, avec les contractions du français.
export function de(g) {
  if (/^le /i.test(g)) return 'du ' + g.slice(3);
  if (/^les /i.test(g)) return 'des ' + g.slice(4);
  if (/^une? /i.test(g)) return 'd’' + g;
  return 'de ' + g;
}
// Deux cartes lues ensemble : le sujet de la première, nuancé par la seconde.
export const pair = (a, b) => `${a.nom} ${b.mod}`;
// Nom de carte au fil de la phrase (« le Livre », « les Étoiles ») et accord du verbe.
const nm = (c) => `<b>${c.name.replace(/^(Le|La|Les|L’) ?/, (m) => m.toLowerCase())}</b>`;
const v = (c, sing, plur) => (/^Les /.test(c.name) ? plur : sing);
const lower = (s) => s.charAt(0).toLowerCase() + s.slice(1);

function ambiance(cards) {
  const score = cards.reduce((s, c) => s + c.tone, 0) / cards.length;
  const good = cards.filter((c) => c.tone > 0).length;
  const hard = cards.filter((c) => c.tone < 0).length;
  if (score >= 0.4) return `L’ensemble du tirage est lumineux : ${good} carte${good > 1 ? 's' : ''} favorable${good > 1 ? 's' : ''} sur ${cards.length} encouragent à avancer avec confiance.`;
  if (score <= -0.4) return `Le tirage invite à la prudence : ${hard} carte${hard > 1 ? 's' : ''} sur ${cards.length} signalent des freins ou des tensions. Rien n’est figé pour autant ; il s’agit surtout d’avancer avec attention.`;
  if (good && hard) return 'Le tirage est nuancé : des appuis et des obstacles se mêlent. C’est l’équilibre entre les deux qui fera la différence.';
  return 'Le tirage est plutôt calme et neutre : les cartes décrivent la situation plus qu’elles ne la jugent.';
}

function theme(cards) {
  const count = {};
  cards.forEach((c, i) => c.themes.forEach((t, j) => { count[t] = (count[t] || 0) + (j === 0 ? 1 : 0.6) - i * 0.001; }));
  const sorted = Object.entries(count).sort((a, b) => b[1] - a[1]);
  if (!sorted.length || sorted[0][1] < 1.5) return 'Plusieurs domaines de ta vie se croisent dans ce tirage.';
  const [first, v1] = sorted[0];
  const second = sorted[1] && sorted[1][1] >= 1.5 ? sorted[1][0] : null;
  return second
    ? `Les cartes parlent surtout ${THEMES[first]}, et aussi ${THEMES[second]}.`
    : `Les cartes parlent surtout ${THEMES[first]}.`;
}

function story(spread, c) {
  switch (spread.id) {
    case 'trois':
      return [
        `Tout part ${de(c[0].nom)} (${nm(c[0])}). Aujourd’hui, c’est ${c[1].nom} qui occupe le devant de la scène (${nm(c[1])}), et la suite laisse entrevoir ${c[2].nom} (${nm(c[2])}).`,
        `Lues en paires, les cartes décrivent ${pair(c[0], c[1])}, puis ${pair(c[1], c[2])}.`,
      ];
    case 'cinq':
      return [
        `Au centre, ${nm(c[2])} donne le ton : ${c[2].nom}.`,
        `Le chemin parcouru évoque ${pair(c[0], c[1])} ; la suite annonce ${pair(c[3], c[4])}.`,
        `Autour de la carte centrale, on lit ${pair(c[1], c[2])}, puis ${pair(c[2], c[3])}.`,
      ];
    case 'croix':
      return [
        `Au cœur de la question se trouve ${c[0].nom} (${nm(c[0])}). La situation vient ${de(c[1].nom)} (${nm(c[1])}) et se dirige vers ${c[2].nom} (${nm(c[2])}).`,
        `Ce qui éclaire la situation : ${c[3].nom} (${nm(c[3])}). Ce qui agit en profondeur : ${c[4].nom} (${nm(c[4])}).`,
        `En reliant le passé au centre, puis le centre à l’avenir, on lit ${pair(c[1], c[0])}, puis ${pair(c[0], c[2])}.`,
      ];
    case 'neuf':
      return [
        `Au centre, ${nm(c[4])} résume la question : ${c[4].nom}.`,
        `Dans tes pensées (ligne du haut) : ${pair(c[0], c[1])}, puis ${c[2].nom}.`,
        `Dans ce que tu vis (ligne du milieu) : tout vient ${de(c[3].nom)} et évolue vers ${c[5].nom}.`,
        `En coulisses (ligne du bas) : ${pair(c[6], c[7])}, puis ${c[8].nom}.`,
        `Les quatre coins encadrent l’histoire : ${pair(c[0], c[2])} en haut, ${pair(c[6], c[8])} en bas.`,
      ];
    default:
      return [];
  }
}

function notes(cards) {
  const ns = new Set(cards.map((c) => c.n));
  const out = [];
  const used = new Set();
  for (const note of NOTES) {
    if (out.length >= 3) break;
    if (!note.all.every((n) => ns.has(n))) continue;
    if (note.all.length === 1 && used.has(note.all[0])) continue;
    note.all.forEach((n) => used.add(n));
    out.push(note.text);
  }
  return out;
}

// Carte qui indique la suite : dernière position, avenir de la croix, avenir du carré.
const OUTCOME = { trois: 2, cinq: 4, croix: 2, neuf: 5 };

export function interpret(spread, cards, question = '') {
  const paras = [];
  if (question.trim()) paras.push(`<span class="le-q">Ta question : « ${esc(question.trim())} »</span>`);
  if (cards.length === 1) {
    const c = cards[0];
    paras.push(`${cap(nm(c).replace('<b>', '')).replace(/^/, '<b>')} ${v(c, 't’accompagne', 't’accompagnent')} aujourd’hui. ${c.sens}`);
    paras.push(`<b>En amour :</b> ${lower(c.amour)} <b>Au travail :</b> ${lower(c.travail)}`);
    paras.push(`<b>Conseil du jour :</b> ${c.conseil}`);
    return paras;
  }
  paras.push(`${ambiance(cards)} ${theme(cards)}`);
  story(spread, cards).forEach((s) => paras.push(s.replace(/^(<b>)?(.)/, (m, b, ch) => (b || '') + ch.toUpperCase())));
  const ns = notes(cards);
  if (ns.length) paras.push(ns.join(' '));
  const out = cards[OUTCOME[spread.id] ?? cards.length - 1];
  paras.push(`<b>Pour la suite,</b> ${nm(out)} ${v(out, 'te conseille', 'te conseillent')} : ${lower(out.conseil)}`);
  return paras;
}
