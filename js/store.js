// Stockage local (IndexedDB) : brouillon de l'éditeur et images pas encore publiées.
import { BOOK_FILE, DEFAULT_RATIO } from './config.js';

const DB_NAME = 'grimoire';
const DB_VERSION = 1;
let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    let req;
    try {
      req = indexedDB.open(DB_NAME, DB_VERSION);
    } catch (e) {
      reject(e);
      return;
    }
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv');
      if (!db.objectStoreNames.contains('blobs')) db.createObjectStore('blobs');
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  dbPromise.catch(() => { dbPromise = null; });
  return dbPromise;
}

async function tx(store, mode, fn) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, mode);
    const s = t.objectStore(store);
    const req = fn(s);
    t.oncomplete = () => resolve(req ? req.result : undefined);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  });
}

export const kv = {
  get: (k) => tx('kv', 'readonly', (s) => s.get(k)).catch(() => undefined),
  set: (k, v) => tx('kv', 'readwrite', (s) => s.put(v, k)),
  del: (k) => tx('kv', 'readwrite', (s) => s.delete(k)),
};

export const blobs = {
  get: (k) => tx('blobs', 'readonly', (s) => s.get(k)).catch(() => undefined),
  set: (k, v) => tx('blobs', 'readwrite', (s) => s.put(v, k)),
  del: (k) => tx('blobs', 'readwrite', (s) => s.delete(k)),
  keys: () => tx('blobs', 'readonly', (s) => s.getAllKeys()).catch(() => []),
};

// Normalise un objet livre (valeurs par défaut, champs manquants).
export function normalizeBook(b) {
  b = b && typeof b === 'object' ? b : {};
  const cover = b.cover || {};
  const pages = Array.isArray(b.pages) ? b.pages : [];
  return {
    version: 1,
    cover: {
      line1: typeof cover.line1 === 'string' ? cover.line1 : 'Le Grimoire de',
      line2: typeof cover.line2 === 'string' ? cover.line2 : 'Lilly',
      image: cover.image || null,
    },
    background: b.background || null,
    updated: typeof b.updated === 'string' ? b.updated : null,
    pageRatio: Number(b.pageRatio) > 0.2 && Number(b.pageRatio) < 3 ? Number(b.pageRatio) : DEFAULT_RATIO,
    pages: pages
      .filter((p) => p && (p.blank || typeof p.src === 'string'))
      .map((p) => (p.blank
        ? { blank: true, title: p.title || '' }
        : { src: p.src, w: p.w || 0, h: p.h || 0, title: p.title || '' })),
  };
}

export async function fetchPublishedBook() {
  const res = await fetch(BOOK_FILE, { cache: 'no-cache' });
  if (!res.ok) throw new Error('Impossible de charger ' + BOOK_FILE + ' (' + res.status + ')');
  return normalizeBook(await res.json());
}

// Résout un chemin d'image : si l'image existe dans le stockage local (pas encore
// publiée ou pas encore déployée), on utilise la copie locale.
const urlCache = new Map();
export async function resolveSrc(path) {
  if (!path) return null;
  if (urlCache.has(path)) return urlCache.get(path);
  let url = path;
  try {
    const blob = await blobs.get(path);
    if (blob) url = URL.createObjectURL(blob);
  } catch (e) { /* stockage indisponible : on garde l'URL publiée */ }
  urlCache.set(path, url);
  return url;
}

export function forgetResolved(path) {
  const url = urlCache.get(path);
  if (url && url.startsWith('blob:')) URL.revokeObjectURL(url);
  urlCache.delete(path);
}
