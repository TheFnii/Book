// Atelier du Grimoire : édition du livre et publication sur GitHub.
import { REPO_DEFAULTS } from './config.js';
import { kv, blobs, normalizeBook, fetchPublishedBook, resolveSrc, forgetResolved } from './store.js';
import { prepareImage, naturalSort } from './images.js';
import { GitHub, bookAssetPaths } from './github.js';
import { coverSVG, fitCoverText } from './cover.js';
import { cardBackURL } from './cards.js';
import { cardFace } from './lenormand.js';
import { lenormandBackURL } from './lenormand-art.js';
import { CARDS as LE_CARDS } from './lenormand-data.js';

const $ = (s, r = document) => r.querySelector(s);
const uid = () => Math.random().toString(36).slice(2, 10);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SETTINGS_KEY = 'grimoire.github';

const I = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
const ICON = {
  left: I('<path d="M15 5l-7 7 7 7"/>'),
  right: I('<path d="M9 5l7 7-7 7"/>'),
  replace: I('<path d="M4 7h13l-3-3M20 17H7l3 3"/>'),
  trash: I('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'),
  plus: I('<path d="M12 5v14M5 12h14"/>'),
  warn: I('<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/>'),
};

const state = {
  book: null,
  published: null,
  selected: null,
  history: [],
  settings: null,
};

/* ---------- Réglages GitHub ---------- */
function loadSettings() {
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}'); } catch (e) { /* ignore */ }
  return { ...REPO_DEFAULTS, token: '', ...saved };
}
function saveSettings(s) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch (e) { /* ignore */ }
}
const gh = () => new GitHub(state.settings);

/* ---------- Modèle ---------- */
// Copie profonde : le brouillon ne doit jamais partager d'objet avec la version publiée.
const withIds = (b) => {
  const copy = JSON.parse(JSON.stringify(b));
  copy.pages = copy.pages.map((p) => ({ id: uid(), ...p }));
  return copy;
};
const toBook = (b) => normalizeBook(b);
function comparable(b) {
  if (!b) return '';
  const n = normalizeBook(b);
  delete n.updated;
  return JSON.stringify(n);
}
const isDirty = () => comparable(state.book) !== comparable(state.published);
const imagePages = () => state.book.pages.filter((p) => !p.blank);

function syncRatio() {
  const first = imagePages().find((p) => p.w && p.h);
  if (first) state.book.pageRatio = Math.round((first.w / first.h) * 10000) / 10000;
}

let saveTimer = null;
function saveDraft(now = false) {
  clearTimeout(saveTimer);
  const run = () => kv.set('draft', { ...toBook(state.book), baseUpdated: state.published ? state.published.updated : null })
    .catch(() => toast('Attention : le brouillon n’a pas pu être enregistré sur cet appareil.'));
  if (now) return run();
  saveTimer = setTimeout(run, 250);
  return Promise.resolve();
}

function pushHistory() {
  state.history.push(JSON.stringify(state.book));
  if (state.history.length > 80) state.history.shift();
  $('#undo').disabled = false;
}

function mutate(fn, { render: doRender = true } = {}) {
  pushHistory();
  fn();
  syncRatio();
  saveDraft();
  if (doRender) render();
  else renderStatus();
}

function undo() {
  const snap = state.history.pop();
  if (!snap) return;
  state.book = JSON.parse(snap);
  $('#undo').disabled = !state.history.length;
  saveDraft();
  render();
  toast('Action annulée');
}

/* ---------- Rendu ---------- */
function render() {
  renderStatus();
  renderCover();
  renderBackground();
  renderOracle();
  renderLunar();
  renderCards();
  renderLenormand();
  renderRadio();
  renderPages();
}

// Radio : « Titre | lien Suno » par ligne.
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
const tracksToText = (ts) => ts.map((t) => `${t.title} | https://suno.com/song/${t.id}`).join('\n');
function parseTracks(v) {
  return v.split('\n').map((l) => {
    const m = l.match(UUID);
    if (!m) return null;
    const title = (l.includes('|') ? l.split('|')[0] : l.replace(/https?:\/\/\S+/g, '')).trim();
    return { title, id: m[0].toLowerCase() };
  }).filter(Boolean);
}
function renderRadio() {
  const r = state.book.radio;
  $('#radio-on').checked = r.enabled;
  $('#radio-fields').hidden = !r.enabled;
  if (document.activeElement !== $('#radio-label')) $('#radio-label').value = r.label;
  if (document.activeElement !== $('#radio-tracks')) $('#radio-tracks').value = tracksToText(r.tracks);
  $('#radio-count').textContent = `(${r.tracks.length})`;
}

// Petit Lenormand : dos et dessins des 36 cartes.
let leBackRendered = '';
let leGridRendered = '';
async function renderLenormand() {
  const l = state.book.lenormand;
  $('#le-on').checked = l.enabled;
  $('#le-fields').hidden = !l.enabled;
  if (document.activeElement !== $('#le-label')) $('#le-label').value = l.label;
  $('#le-back-rm').hidden = !l.back;
  const n = Object.keys(l.images).length;
  $('#le-img-count').textContent = n ? `(${n} remplacé${n > 1 ? 's' : ''})` : '';
  const bkey = l.back || 'default';
  if (bkey !== leBackRendered) {
    leBackRendered = bkey;
    const img = new Image();
    img.alt = 'Dos des cartes Lenormand';
    img.src = l.back ? await resolveSrc(l.back) : lenormandBackURL();
    $('#le-back-preview').replaceChildren(img);
  }
  const gkey = JSON.stringify(l.images);
  if (gkey === leGridRendered) return;
  leGridRendered = gkey;
  const urls = {};
  await Promise.all(Object.entries(l.images).map(async ([k, p]) => { urls[k] = await resolveSrc(p); }));
  $('#le-grid').innerHTML = LE_CARDS.slice(1).map((c) => `<div class="le-edit-cell">
      <button type="button" class="pick" data-le="${c.n}" title="${c.n}. ${c.name} — remplacer le dessin"><span class="le-face le-front">${cardFace(c.n, urls[c.n])}</span></button>
      ${urls[c.n] ? `<button type="button" class="reset" data-le-reset="${c.n}" title="Remettre le dessin d’origine" aria-label="Remettre le dessin d’origine">✕</button><span class="custom-dot"></span>` : ''}
    </div>`).join('');
}

// Messages des cartes : un paragraphe par carte, séparés par une ligne vide.
const parseMessages = (v) => v.split(/\n\s*\n/).map((m) => m.replace(/\s+/g, ' ').trim()).filter(Boolean);

let backRendered = '';
async function renderCards() {
  const c = state.book.cards;
  $('#cards-on').checked = c.enabled;
  $('#cards-fields').hidden = !c.enabled;
  if (document.activeElement !== $('#cards-label')) $('#cards-label').value = c.label;
  if (document.activeElement !== $('#cards-messages')) $('#cards-messages').value = c.messages.join('\n\n');
  const n = c.messages.length;
  $('#cards-count').textContent = n ? `(${n})` : '(aucun : les messages par défaut seront utilisés)';
  $('#cards-back-rm').hidden = !c.back;
  const key = c.back || 'default';
  if (key === backRendered) return;
  backRendered = key;
  const img = new Image();
  img.alt = 'Dos des cartes';
  img.src = c.back ? await resolveSrc(c.back) : cardBackURL();
  $('#cards-back-preview').replaceChildren(img);
}

const LUNAR_ICONS = ['🌑', '🌓', '🌕', '🌗'];
function renderLunar() {
  const l = state.book.lunar;
  $('#lunar-on').checked = l.enabled;
  $('#lunar-fields').hidden = !l.enabled;
  const wrap = $('#lunar-phases');
  if (!wrap.children.length) {
    wrap.innerHTML = l.phases.map((p, i) => `
      <details class="lunar-phase" data-i="${i}">
        <summary>${LUNAR_ICONS[i]} <span class="t"></span><i class="m"></i></summary>
        <div class="inner">
          <label class="field">Nom de la phase<input type="text" data-k="title" maxlength="40" autocomplete="off"></label>
          <label class="field">Devise<input type="text" data-k="motto" maxlength="40" autocomplete="off"></label>
          <label class="field">Conseils — un par ligne<textarea data-k="tips" rows="5"></textarea></label>
        </div>
      </details>`).join('');
    let hist = false;
    wrap.addEventListener('input', (e) => {
      const el = e.target;
      const i = Number(el.closest('.lunar-phase').dataset.i);
      if (!hist) { pushHistory(); hist = true; }
      const k = el.dataset.k;
      state.book.lunar.phases[i][k] = k === 'tips' ? el.value.split('\n').map((t) => t.trim()).filter(Boolean) : el.value;
      saveDraft();
      renderStatus();
      renderLunar();
    });
    wrap.addEventListener('focusout', () => { hist = false; });
  }
  wrap.querySelectorAll('.lunar-phase').forEach((d) => {
    const p = l.phases[Number(d.dataset.i)];
    d.querySelector('.t').textContent = p.title;
    d.querySelector('.m').textContent = p.motto;
    d.querySelectorAll('[data-k]').forEach((el) => {
      if (document.activeElement === el) return;
      el.value = el.dataset.k === 'tips' ? p.tips.join('\n') : p[el.dataset.k];
    });
  });
}

function renderOracle() {
  const o = state.book.oracle;
  $('#oracle-on').checked = o.enabled;
  $('#oracle-fields').hidden = !o.enabled;
  if (document.activeElement !== $('#oracle-title')) $('#oracle-title').value = o.title;
  if (document.activeElement !== $('#oracle-subtitle')) $('#oracle-subtitle').value = o.subtitle;
  if (document.activeElement !== $('#oracle-answers')) $('#oracle-answers').value = o.answers.join('\n');
  const n = o.answers.length;
  $('#oracle-count').textContent = n ? `(${n})` : '(aucune : les réponses par défaut seront utilisées)';
}

function renderStatus() {
  const s = $('#status');
  const n = state.book.pages.length;
  $('#count').textContent = `(${n})`;
  if (!state.published) {
    s.textContent = 'Version publiée introuvable';
    s.className = 'status warn';
  } else if (isDirty()) {
    s.textContent = '● Modifications non publiées';
    s.className = 'status warn';
  } else {
    s.textContent = '✓ À jour avec la version publiée';
    s.className = 'status ok';
  }
  const sel = state.book.pages.findIndex((p) => p.id === state.selected);
  $('#insert-at').innerHTML = sel >= 0
    ? `Les nouvelles pages seront insérées <b>après la page ${sel + 1}</b>. <button type="button" class="link" id="unselect">Insérer à la fin</button>`
    : 'Astuce : touchez une page pour la sélectionner ; les nouvelles pages seront insérées juste après.';
  const un = $('#unselect');
  if (un) un.onclick = () => { state.selected = null; renderPages(); renderStatus(); };
}

let coverRendered = '';
async function renderCover() {
  const c = state.book.cover;
  const l1 = $('#line1');
  const l2 = $('#line2');
  if (document.activeElement !== l1) l1.value = c.line1;
  if (document.activeElement !== l2) l2.value = c.line2;
  $('#cover-img-rm').hidden = !c.image;
  l1.disabled = l2.disabled = !!c.image;
  const box = $('#cover-preview');
  const key = c.image ? 'img:' + c.image : 'svg:' + c.line1 + '\n' + c.line2;
  if (key === coverRendered) return;
  coverRendered = key;
  if (c.image) {
    box.innerHTML = '';
    const img = new Image();
    img.alt = 'Couverture';
    img.src = await resolveSrc(c.image);
    box.appendChild(img);
  } else {
    box.innerHTML = coverSVG(c);
    fitCoverText(box);
  }
}

async function renderBackground() {
  const bg = state.book.background;
  $('#bg-rm').hidden = !bg;
  const box = $('#bg-preview');
  box.style.backgroundImage = `url("${bg ? await resolveSrc(bg) : 'img/desk.jpg'}")`;
}

function pageCard(p, index, ratio) {
  const el = document.createElement('article');
  el.className = 'card' + (p.id === state.selected ? ' selected' : '') + (p.blank ? ' blank' : '');
  el.dataset.id = p.id;
  el.draggable = true;

  const thumb = document.createElement('div');
  thumb.className = 'thumb' + (p.blank ? ' parchment' : '');
  thumb.style.aspectRatio = String(ratio);
  if (!p.blank) {
    const img = document.createElement('img');
    img.alt = '';
    img.draggable = false;
    img.loading = 'lazy';
    resolveSrc(p.src).then((u) => { img.src = u; });
    img.onerror = () => { thumb.classList.add('missing'); };
    thumb.appendChild(img);
  } else {
    thumb.insertAdjacentHTML('beforeend', '<span class="blank-label">Page blanche</span>');
  }
  const num = document.createElement('button');
  num.type = 'button';
  num.className = 'num';
  num.dataset.a = 'move';
  num.title = 'Changer la position de cette page';
  num.textContent = index + 1;
  thumb.appendChild(num);
  if (!p.blank && p.w && p.h && Math.abs(p.w / p.h - ratio) / ratio > 0.02) {
    const w = document.createElement('span');
    w.className = 'badge-warn';
    w.title = `Format différent des autres pages (${p.w} × ${p.h}). Elle sera affichée avec des marges.`;
    w.innerHTML = ICON.warn;
    thumb.appendChild(w);
  }

  const title = document.createElement('input');
  title.type = 'text';
  title.className = 'title';
  title.placeholder = 'Titre (pour le sommaire)';
  title.value = p.title || '';
  title.maxLength = 80;
  let pushed = false;
  title.addEventListener('input', () => {
    if (!pushed) { pushHistory(); pushed = true; }
    p.title = title.value;
    saveDraft();
    renderStatus();
  });
  title.addEventListener('blur', () => { pushed = false; });

  const actions = document.createElement('div');
  actions.className = 'actions';
  actions.innerHTML = `
    <button type="button" data-a="left" title="Déplacer vers la gauche" aria-label="Déplacer avant" ${index === 0 ? 'disabled' : ''}>${ICON.left}</button>
    <button type="button" data-a="right" title="Déplacer vers la droite" aria-label="Déplacer après" ${index === state.book.pages.length - 1 ? 'disabled' : ''}>${ICON.right}</button>
    ${p.blank ? '' : `<button type="button" data-a="replace" title="Remplacer l’image" aria-label="Remplacer l’image">${ICON.replace}</button>`}
    <button type="button" data-a="delete" class="del" title="Supprimer la page" aria-label="Supprimer la page">${ICON.trash}</button>`;

  el.append(thumb, title, actions);
  return el;
}

function renderPages() {
  const wrap = $('#spreads');
  wrap.innerHTML = '';
  const pages = state.book.pages;
  const ratio = state.book.pageRatio;
  const cells = [{ fixed: true }, ...pages.map((p, i) => ({ p, i })), { add: true }];
  if (cells.length % 2) cells.push({ empty: true });
  for (let s = 0; s < cells.length; s += 2) {
    const spread = document.createElement('div');
    spread.className = 'spread';
    const label = document.createElement('div');
    label.className = 'spread-label';
    label.textContent = s === 0 ? 'Ouverture du livre' : `Double page ${s / 2 + 1}`;
    spread.appendChild(label);
    const row = document.createElement('div');
    row.className = 'spread-row';
    for (const c of [cells[s], cells[s + 1]]) {
      if (c.fixed) {
        row.insertAdjacentHTML('beforeend', `<div class="slot fixed"><div class="thumb parchment" style="aspect-ratio:${ratio}"><span class="blank-label">Page de garde<small>(intérieur de la couverture)</small></span></div></div>`);
      } else if (c.add) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'slot add';
        b.innerHTML = `<div class="thumb" style="aspect-ratio:${ratio}">${ICON.plus}<span>Ajouter<br>des pages</span></div>`;
        b.onclick = () => { state.selected = null; pickFiles(pages.length); };
        row.appendChild(b);
      } else if (c.empty) {
        row.insertAdjacentHTML('beforeend', '<div class="slot empty"></div>');
      } else {
        row.appendChild(pageCard(c.p, c.i, ratio));
      }
    }
    spread.appendChild(row);
    wrap.appendChild(spread);
  }
}

/* ---------- Actions sur les pages ---------- */
function indexOf(id) { return state.book.pages.findIndex((p) => p.id === id); }

function move(from, to) {
  const pages = state.book.pages;
  to = Math.max(0, Math.min(pages.length - 1, to));
  if (from === to || from < 0) return;
  mutate(() => {
    const [p] = pages.splice(from, 1);
    pages.splice(to, 0, p);
  });
}

function insertionIndex() {
  const i = indexOf(state.selected);
  return i >= 0 ? i + 1 : state.book.pages.length;
}

let pickCallback = null;
function pickFiles(at) {
  pickCallback = (files) => addFiles(files, at);
  $('#file-multi').value = '';
  $('#file-multi').click();
}
function pickOne(cb) {
  pickCallback = (files) => files[0] && cb(files[0]);
  $('#file-one').value = '';
  $('#file-one').click();
}

async function storeImage(file, opts) {
  const r = await prepareImage(file, opts);
  await blobs.set(r.path, r.blob);
  forgetResolved(r.path);
  return r;
}

async function addFiles(fileList, at) {
  const files = naturalSort([...fileList].filter((f) => /^image\/(png|jpeg|webp|gif|bmp)$/.test(f.type)));
  if (!files.length) { toast('Aucune image reconnue (PNG, JPG ou WebP).'); return; }
  const added = [];
  try {
    for (let i = 0; i < files.length; i++) {
      busy(`Préparation des pages… ${i + 1} / ${files.length}`);
      const r = await storeImage(files[i], { folder: 'pages', maxSide: 2000 });
      added.push({ id: uid(), src: r.path, w: r.w, h: r.h, title: '' });
    }
  } catch (e) {
    console.error(e);
    toast('Une image n’a pas pu être lue : ' + e.message);
  } finally {
    busy(false);
  }
  if (!added.length) return;
  mutate(() => { state.book.pages.splice(at, 0, ...added); });
  state.selected = added[added.length - 1].id;
  renderPages();
  renderStatus();
  toast(added.length > 1 ? `${added.length} pages ajoutées` : 'Page ajoutée');
  requestAnimationFrame(() => {
    const el = document.querySelector(`.card[data-id="${state.selected}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}

async function replacePage(id, file) {
  try {
    busy('Préparation de l’image…');
    const r = await storeImage(file, { folder: 'pages', maxSide: 2000 });
    const i = indexOf(id);
    if (i < 0) return;
    mutate(() => { Object.assign(state.book.pages[i], { src: r.path, w: r.w, h: r.h }); });
    toast('Image remplacée');
  } catch (e) {
    toast('Impossible de lire cette image : ' + e.message);
  } finally {
    busy(false);
  }
}

function deletePage(id) {
  const i = indexOf(id);
  if (i < 0) return;
  mutate(() => { state.book.pages.splice(i, 1); });
  if (state.selected === id) state.selected = null;
  render();
  toast('Page supprimée', { action: 'Annuler', onAction: undo });
}

function onCardClick(e) {
  const card = e.target.closest('.card');
  if (!card) return;
  const id = card.dataset.id;
  const i = indexOf(id);
  const btn = e.target.closest('[data-a]');
  if (btn) {
    const a = btn.dataset.a;
    if (a === 'left') move(i, i - 1);
    if (a === 'right') move(i, i + 1);
    if (a === 'delete') deletePage(id);
    if (a === 'replace') pickOne((f) => replacePage(id, f));
    if (a === 'move') {
      const n = state.book.pages.length;
      const v = prompt(`Nouvelle position pour cette page (1 à ${n}) :`, String(i + 1));
      const to = parseInt(v, 10);
      if (to >= 1 && to <= n) move(i, to - 1);
    }
    return;
  }
  if (e.target.closest('input')) return;
  state.selected = state.selected === id ? null : id;
  document.querySelectorAll('.card.selected').forEach((c) => c.classList.remove('selected'));
  if (state.selected) card.classList.add('selected');
  renderStatus();
}

/* ---------- Glisser-déposer ---------- */
let dragId = null;
function dropSide(card, e) {
  const r = card.getBoundingClientRect();
  return e.clientX < r.left + r.width / 2 ? 'before' : 'after';
}
function clearDropMarks() {
  document.querySelectorAll('.drop-before,.drop-after').forEach((c) => c.classList.remove('drop-before', 'drop-after'));
}
const hasFiles = (e) => e.dataTransfer && [...(e.dataTransfer.types || [])].includes('Files');

function setupDnD() {
  const wrap = $('#spreads');
  wrap.addEventListener('dragstart', (e) => {
    const card = e.target.closest('.card');
    if (!card) return;
    dragId = card.dataset.id;
    card.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', dragId);
  });
  wrap.addEventListener('dragend', () => {
    dragId = null;
    document.querySelectorAll('.dragging').forEach((c) => c.classList.remove('dragging'));
    clearDropMarks();
  });
  wrap.addEventListener('dragover', (e) => {
    const card = e.target.closest('.card');
    if (!card || (!dragId && !hasFiles(e))) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = dragId ? 'move' : 'copy';
    clearDropMarks();
    card.classList.add('drop-' + dropSide(card, e));
  });
  wrap.addEventListener('drop', (e) => {
    const card = e.target.closest('.card');
    if (!card) return;
    e.preventDefault();
    e.stopPropagation();
    hideVeil();
    const side = dropSide(card, e);
    clearDropMarks();
    let target = indexOf(card.dataset.id) + (side === 'after' ? 1 : 0);
    if (dragId) {
      const from = indexOf(dragId);
      if (from < target) target--;
      move(from, target);
    } else if (e.dataTransfer.files.length) {
      addFiles(e.dataTransfer.files, target);
    }
  });

  // Fichiers déposés n'importe où dans la page.
  let depth = 0;
  window.addEventListener('dragenter', (e) => { if (hasFiles(e) && !dragId) { depth++; $('#dropveil').hidden = false; } });
  window.addEventListener('dragleave', (e) => { if (hasFiles(e) && !dragId && --depth <= 0) hideVeil(); });
  window.addEventListener('dragover', (e) => { if (hasFiles(e)) e.preventDefault(); });
  window.addEventListener('drop', (e) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    hideVeil();
    addFiles(e.dataTransfer.files, insertionIndex());
  });
  function hideVeilInner() { depth = 0; $('#dropveil').hidden = true; }
  hideVeil = hideVeilInner;
}
let hideVeil = () => {};

/* ---------- Aperçu ---------- */
async function openPreview() {
  await saveDraft(true);
  const dlg = $('#dlg-preview');
  $('#preview-frame').src = 'index.html?apercu=1&t=' + Date.now();
  dlg.showModal();
}

/* ---------- Connexion GitHub ---------- */
function openSettings(intro) {
  const s = state.settings;
  $('#gh-owner').value = s.owner;
  $('#gh-repo').value = s.repo;
  $('#gh-branch').value = s.branch;
  $('#gh-token').value = s.token;
  $('#gh-result').textContent = '';
  $('#gh-result').className = 'result';
  if (intro) $('#settings-intro').textContent = intro;
  $('#dlg-settings').showModal();
}

function readSettingsForm() {
  return {
    owner: $('#gh-owner').value.trim() || REPO_DEFAULTS.owner,
    repo: $('#gh-repo').value.trim() || REPO_DEFAULTS.repo,
    branch: $('#gh-branch').value.trim() || REPO_DEFAULTS.branch,
    token: $('#gh-token').value.trim(),
  };
}

async function testSettings() {
  const res = $('#gh-result');
  const s = readSettingsForm();
  if (!s.token) { res.textContent = 'Collez d’abord votre jeton.'; res.className = 'result err'; return false; }
  res.textContent = 'Vérification…';
  res.className = 'result';
  try {
    const c = await new GitHub(s).check();
    if (!c.canPush) throw new Error('Ce jeton peut lire le dépôt mais pas y écrire. Donnez-lui la permission « Contents : Read and write ».');
    if (!c.branchOk) throw new Error(`La branche « ${s.branch} » n’existe pas dans ${c.fullName} (branche par défaut : ${c.defaultBranch}).`);
    res.textContent = `✓ Connexion réussie : ${c.fullName}, branche « ${s.branch} ».`;
    res.className = 'result ok';
    return true;
  } catch (e) {
    res.textContent = e.message;
    res.className = 'result err';
    return false;
  }
}

/* ---------- Publication ---------- */
function openPublish() {
  if (!state.settings.token) {
    openSettings('Pour publier, connectez d’abord l’atelier à votre dépôt GitHub (une seule fois par appareil).');
    return;
  }
  const n = state.book.pages.length;
  $('#pub-summary').innerHTML = isDirty()
    ? `Votre livre compte <b>${n} page${n > 1 ? 's' : ''}</b>. Après publication, <b>tout le monde</b> verra cette version.`
    : 'Aucune modification depuis la dernière publication. Vous pouvez tout de même republier.';
  $('#pub-progress').hidden = true;
  $('#pub-result').textContent = '';
  $('#pub-result').className = 'result';
  $('#pub-go').hidden = false;
  $('#pub-go').disabled = false;
  $('#pub-note').disabled = false;
  $('#dlg-publish [data-close]').textContent = 'Annuler';
  $('#dlg-publish').showModal();
}

async function doPublish() {
  const go = $('#pub-go');
  go.disabled = true;
  $('#pub-note').disabled = true;
  $('#pub-progress').hidden = false;
  const res = $('#pub-result');
  res.textContent = '';
  const book = toBook(state.book);
  book.updated = new Date().toISOString();
  const n = book.pages.length;
  const note = $('#pub-note').value.trim();
  const message = `Mise à jour du grimoire (${n} page${n > 1 ? 's' : ''})${note ? ' : ' + note : ''}`;
  try {
    await gh().publish(book, {
      getBlob: (p) => blobs.get(p),
      message,
      onProgress: (p) => { $('#pub-text').textContent = p.text; },
    });
  } catch (e) {
    console.error(e);
    $('#pub-progress').hidden = true;
    res.textContent = e.message;
    res.className = 'result err';
    go.disabled = false;
    $('#pub-note').disabled = false;
    return;
  }
  state.published = normalizeBook(book);
  state.book.updated = book.updated;
  await saveDraft(true);
  cleanupBlobs();
  render();
  go.hidden = true;
  $('#dlg-publish [data-close]').textContent = 'Fermer';
  $('#pub-note').value = '';

  const onSite = /\.github\.io$/i.test(location.hostname);
  if (!onSite) {
    $('#pub-progress').hidden = true;
    res.innerHTML = '✓ Publié sur GitHub. Le site se mettra à jour dans une à deux minutes.';
    res.className = 'result ok';
    return;
  }
  $('#pub-text').textContent = 'Publié ! Mise en ligne du site en cours (environ une minute)…';
  const live = await waitDeployed(book.updated);
  $('#pub-progress').hidden = true;
  if (live) {
    res.innerHTML = '✓ C’est en ligne : tout le monde voit la nouvelle version. <a href="./" target="_blank" rel="noopener">Ouvrir le livre</a>';
    res.className = 'result ok';
  } else {
    res.innerHTML = '✓ Publié. La mise en ligne prend un peu plus de temps que prévu : rechargez le livre dans quelques minutes.';
    res.className = 'result ok';
  }
}

async function waitDeployed(updated) {
  const start = Date.now();
  while (Date.now() - start < 5 * 60 * 1000) {
    await sleep(6000);
    try {
      const r = await fetch('book.json?v=' + Date.now(), { cache: 'no-store' });
      if (r.ok && (await r.json()).updated === updated) return true;
    } catch (e) { /* on réessaie */ }
  }
  return false;
}

// Supprime du stockage local les images qui ne servent plus.
async function cleanupBlobs() {
  const keep = bookAssetPaths(toBook(state.book));
  const keys = await blobs.keys();
  for (const k of keys) if (!keep.has(k)) await blobs.del(k).catch(() => {});
}

/* ---------- Interface ---------- */
function busy(text) {
  const b = $('#busy');
  if (!text) { b.hidden = true; return; }
  $('#busy-text').textContent = text;
  b.hidden = false;
}

let toastTimer = null;
function toast(msg, { action, onAction, ms = 3500 } = {}) {
  const t = $('#toast');
  t.innerHTML = '';
  const span = document.createElement('span');
  span.textContent = msg;
  t.appendChild(span);
  if (action) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = action;
    b.onclick = () => { t.classList.remove('show'); onAction(); };
    t.appendChild(b);
  }
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), action ? 6000 : ms);
}

function banner(html, actions = []) {
  const b = $('#banner');
  b.innerHTML = `<span>${html}</span>`;
  actions.forEach(([label, fn]) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn small';
    btn.textContent = label;
    btn.onclick = () => { b.hidden = true; fn(); };
    b.appendChild(btn);
  });
  const x = document.createElement('button');
  x.type = 'button';
  x.className = 'btn small ghost';
  x.textContent = 'Ignorer';
  x.onclick = () => { b.hidden = true; };
  b.appendChild(x);
  b.hidden = false;
}

function discardDraft() {
  if (!state.published) { toast('La version publiée n’a pas pu être chargée.'); return; }
  if (!confirm('Abandonner toutes les modifications non publiées et revenir à la version publiée ?')) return;
  mutate(() => { state.book = withIds(normalizeBook(state.published)); });
  state.selected = null;
  render();
  toast('Brouillon abandonné', { action: 'Annuler', onAction: undo });
}

async function loadPublished() {
  if (state.settings.token) {
    try { return normalizeBook(await gh().readBook()); } catch (e) { console.warn('Lecture via GitHub impossible', e); }
  }
  return fetchPublishedBook();
}

function bindUI() {
  $('#undo').onclick = undo;
  $('#preview').onclick = openPreview;
  $('#publish').onclick = openPublish;
  $('#settings').onclick = () => openSettings();
  $('#discard').onclick = discardDraft;
  $('#add').onclick = () => pickFiles(insertionIndex());
  $('#dropzone').onclick = () => pickFiles(insertionIndex());
  $('#add-blank').onclick = () => {
    const at = insertionIndex();
    const p = { id: uid(), blank: true, title: '' };
    mutate(() => { state.book.pages.splice(at, 0, p); });
    state.selected = p.id;
    renderPages();
    renderStatus();
  };
  $('#file-multi').onchange = (e) => { if (pickCallback) pickCallback(e.target.files); };
  $('#file-one').onchange = (e) => { if (pickCallback) pickCallback(e.target.files); };
  $('#spreads').addEventListener('click', onCardClick);

  let coverHist = false;
  ['line1', 'line2'].forEach((k) => {
    const input = $('#' + k);
    input.addEventListener('input', () => {
      if (!coverHist) { pushHistory(); coverHist = true; }
      state.book.cover[k] = input.value;
      saveDraft();
      renderStatus();
      renderCover();
    });
    input.addEventListener('blur', () => { coverHist = false; });
  });
  $('#cover-img').onclick = () => pickOne(async (f) => {
    try {
      busy('Préparation de la couverture…');
      const r = await storeImage(f, { folder: 'assets', maxSide: 2000 });
      mutate(() => { state.book.cover.image = r.path; });
    } catch (e) { toast(e.message); } finally { busy(false); }
  });
  $('#cover-img-rm').onclick = () => mutate(() => { state.book.cover.image = null; });
  $('#bg-img').onclick = () => pickOne(async (f) => {
    try {
      busy('Préparation du fond…');
      const r = await storeImage(f, { folder: 'assets', maxSide: 2400, quality: 0.85 });
      mutate(() => { state.book.background = r.path; });
    } catch (e) { toast(e.message); } finally { busy(false); }
  });
  $('#bg-rm').onclick = () => mutate(() => { state.book.background = null; });

  $('#oracle-on').onchange = (e) => mutate(() => { state.book.oracle.enabled = e.target.checked; });
  $('#lunar-on').onchange = (e) => mutate(() => { state.book.lunar.enabled = e.target.checked; });
  $('#cards-on').onchange = (e) => mutate(() => { state.book.cards.enabled = e.target.checked; });
  $('#cards-back').onclick = () => pickOne(async (f) => {
    try {
      busy('Préparation du dos des cartes…');
      const r = await storeImage(f, { folder: 'assets', maxSide: 1600 });
      mutate(() => { state.book.cards.back = r.path; });
    } catch (e) { toast(e.message); } finally { busy(false); }
  });
  $('#cards-back-rm').onclick = () => mutate(() => { state.book.cards.back = null; });
  $('#radio-on').onchange = (e) => mutate(() => { state.book.radio.enabled = e.target.checked; });
  let radioHist = false;
  [['radio-label', 'label'], ['radio-tracks', 'tracks']].forEach(([id, key]) => {
    const input = $('#' + id);
    input.addEventListener('input', () => {
      if (!radioHist) { pushHistory(); radioHist = true; }
      state.book.radio[key] = key === 'tracks' ? parseTracks(input.value) : input.value;
      saveDraft();
      renderStatus();
      renderRadio();
    });
    input.addEventListener('blur', () => { radioHist = false; });
  });
  $('#le-on').onchange = (e) => mutate(() => { state.book.lenormand.enabled = e.target.checked; });
  let leHist = false;
  $('#le-label').addEventListener('input', () => {
    if (!leHist) { pushHistory(); leHist = true; }
    state.book.lenormand.label = $('#le-label').value;
    saveDraft();
    renderStatus();
  });
  $('#le-label').addEventListener('blur', () => { leHist = false; });
  $('#le-back').onclick = () => pickOne(async (f) => {
    try {
      busy('Préparation du dos des cartes…');
      const r = await storeImage(f, { folder: 'assets', maxSide: 1600 });
      mutate(() => { state.book.lenormand.back = r.path; });
    } catch (e) { toast(e.message); } finally { busy(false); }
  });
  $('#le-back-rm').onclick = () => mutate(() => { state.book.lenormand.back = null; });
  $('#le-grid').addEventListener('click', (e) => {
    const reset = e.target.closest('[data-le-reset]');
    if (reset) {
      const n = reset.dataset.leReset;
      mutate(() => { delete state.book.lenormand.images[n]; });
      return;
    }
    const pick = e.target.closest('[data-le]');
    if (!pick) return;
    const n = pick.dataset.le;
    pickOne(async (f) => {
      try {
        busy(`Préparation de la carte ${n}…`);
        const r = await storeImage(f, { folder: 'assets', maxSide: 1400 });
        mutate(() => { state.book.lenormand.images[n] = r.path; });
        toast(`Carte ${n} remplacée`);
      } catch (err) { toast(err.message); } finally { busy(false); }
    });
  });
  let cardsHist = false;
  [['cards-label', 'label'], ['cards-messages', 'messages']].forEach(([id, key]) => {
    const input = $('#' + id);
    input.addEventListener('input', () => {
      if (!cardsHist) { pushHistory(); cardsHist = true; }
      state.book.cards[key] = key === 'messages' ? parseMessages(input.value) : input.value;
      saveDraft();
      renderStatus();
      renderCards();
    });
    input.addEventListener('blur', () => { cardsHist = false; });
  });
  let oracleHist = false;
  [['oracle-title', 'title'], ['oracle-subtitle', 'subtitle'], ['oracle-answers', 'answers']].forEach(([id, key]) => {
    const input = $('#' + id);
    input.addEventListener('input', () => {
      if (!oracleHist) { pushHistory(); oracleHist = true; }
      state.book.oracle[key] = key === 'answers'
        ? input.value.split('\n').map((l) => l.trim()).filter(Boolean)
        : input.value;
      saveDraft();
      renderStatus();
      renderOracle();
    });
    input.addEventListener('blur', () => { oracleHist = false; });
  });

  document.querySelectorAll('dialog [data-close]').forEach((b) => {
    b.addEventListener('click', () => b.closest('dialog').close());
  });
  $('#dlg-preview').addEventListener('close', () => { $('#preview-frame').src = 'about:blank'; });
  $('#gh-test').onclick = testSettings;
  $('#gh-save').onclick = async () => {
    state.settings = readSettingsForm();
    saveSettings(state.settings);
    const ok = await testSettings();
    if (ok) setTimeout(() => $('#dlg-settings').close(), 900);
  };
  $('#gh-forget').onclick = () => {
    state.settings = { ...readSettingsForm(), token: '' };
    saveSettings(state.settings);
    $('#gh-token').value = '';
    $('#gh-result').textContent = 'Jeton supprimé de cet appareil.';
    $('#gh-result').className = 'result';
  };
  $('#pub-go').onclick = doPublish;

  document.addEventListener('keydown', (e) => {
    const typing = /input|textarea/i.test(e.target.tagName);
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !typing) { e.preventDefault(); undo(); }
    if ((e.key === 'Delete' || e.key === 'Backspace') && !typing && state.selected && !document.querySelector('dialog[open]')) {
      e.preventDefault();
      deletePage(state.selected);
    }
  });
  setupDnD();
}

async function init() {
  state.settings = loadSettings();
  bindUI();
  let published = null;
  try {
    published = await loadPublished();
  } catch (e) {
    console.error(e);
  }
  state.published = published;
  const draft = await kv.get('draft');
  if (draft) {
    state.book = withIds(normalizeBook(draft));
    if (published && published.updated && draft.baseUpdated !== published.updated && comparable(draft) !== comparable(published)) {
      banner('Une version plus récente a été publiée depuis un autre appareil. Votre brouillon local est basé sur une ancienne version.', [
        ['Charger la version publiée', () => { mutate(() => { state.book = withIds(normalizeBook(published)); }); }],
      ]);
    }
  } else {
    state.book = withIds(published || normalizeBook({}));
  }
  if (!published) banner('La version publiée du livre n’a pas pu être chargée. Vous pouvez tout de même travailler sur votre brouillon.');
  syncRatio();
  render();
}

init();
