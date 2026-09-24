// Publication sur GitHub : un seul commit contenant les nouvelles images et book.json.
import { BOOK_FILE } from './config.js';

const API = 'https://api.github.com';

function explain(status, msg) {
  if (status === 401) return 'Jeton refusé : il est invalide ou a expiré. Créez-en un nouveau (⚙ Connexion).';
  if (status === 403) return 'Accès refusé : le jeton n’a pas le droit d’écrire dans ce dépôt (permission « Contents : Read and write »).';
  if (status === 404) return 'Dépôt ou branche introuvable, ou le jeton n’a pas accès à ce dépôt.';
  if (status === 409) return 'Le dépôt est vide : la branche de publication doit exister.';
  if (status === 422 && /fast forward/i.test(msg || '')) return 'Le dépôt a changé pendant la publication. Réessayez.';
  return `Erreur GitHub ${status}${msg ? ' : ' + msg : ''}`;
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1] || '');
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

function decodeBase64Utf8(b64) {
  const bin = atob(b64.replace(/\s/g, ''));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function bookAssetPaths(book) {
  const out = new Set();
  if (!book) return out;
  (book.pages || []).forEach((p) => { if (p && p.src) out.add(p.src); });
  if (book.cover && book.cover.image) out.add(book.cover.image);
  if (book.background) out.add(book.background);
  return out;
}

export class GitHub {
  constructor({ owner, repo, branch, token }) {
    this.owner = owner;
    this.repo = repo;
    this.branch = branch || 'main';
    this.token = token;
  }

  async req(path, { method = 'GET', body } = {}) {
    let res;
    try {
      res = await fetch(`${API}/repos/${encodeURIComponent(this.owner)}/${encodeURIComponent(this.repo)}${path}`, {
        method,
        cache: 'no-store',
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${this.token}`,
          'X-GitHub-Api-Version': '2022-11-28',
          ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (e) {
      throw new Error('Impossible de joindre GitHub. Vérifiez votre connexion Internet.');
    }
    if (!res.ok) {
      let msg = '';
      try { msg = (await res.json()).message; } catch (e) { /* ignore */ }
      const err = new Error(explain(res.status, msg));
      err.status = res.status;
      throw err;
    }
    return res.status === 204 ? null : res.json();
  }

  // Vérifie le jeton, les droits et l'existence de la branche.
  async check() {
    const repo = await this.req('');
    const canPush = !!(repo.permissions && (repo.permissions.push || repo.permissions.admin));
    let branchOk = true;
    try {
      await this.req(`/git/ref/heads/${encodeURIComponent(this.branch)}`);
    } catch (e) {
      branchOk = false;
    }
    return { canPush, branchOk, defaultBranch: repo.default_branch, fullName: repo.full_name };
  }

  // Lit book.json directement dans le dépôt (toujours à jour, contrairement au site).
  async readBook() {
    const data = await this.req(`/contents/${BOOK_FILE}?ref=${encodeURIComponent(this.branch)}`);
    return JSON.parse(decodeBase64Utf8(data.content));
  }

  async publish(book, { getBlob, message, onProgress = () => {} }) {
    onProgress({ step: 'prepare', text: 'Connexion au dépôt…' });
    const ref = await this.req(`/git/ref/heads/${encodeURIComponent(this.branch)}`);
    const headSha = ref.object.sha;
    const head = await this.req(`/git/commits/${headSha}`);
    const baseTree = head.tree.sha;
    const tree = await this.req(`/git/trees/${baseTree}?recursive=1`);
    const existing = new Map();
    (tree.tree || []).forEach((e) => { if (e.type === 'blob') existing.set(e.path, e.sha); });

    // Ancienne version, pour savoir quelles images ne servent plus.
    let oldPaths = new Set();
    if (existing.has(BOOK_FILE)) {
      try {
        const b = await this.req(`/git/blobs/${existing.get(BOOK_FILE)}`);
        oldPaths = bookAssetPaths(JSON.parse(decodeBase64Utf8(b.content)));
      } catch (e) { /* ignore : on ne supprime rien */ }
    }

    const wanted = bookAssetPaths(book);
    const toUpload = [...wanted].filter((p) => !existing.has(p) || tree.truncated);
    const entries = [];
    let done = 0;
    for (const path of toUpload) {
      const blob = await getBlob(path);
      if (!blob) {
        if (existing.has(path)) continue;
        throw new Error(`Image introuvable sur cet appareil : ${path}. Supprimez cette page puis ajoutez-la de nouveau.`);
      }
      onProgress({ step: 'upload', text: `Envoi des images… ${done + 1} / ${toUpload.length}`, done, total: toUpload.length });
      const content = await blobToBase64(blob);
      const res = await this.req('/git/blobs', { method: 'POST', body: { content, encoding: 'base64' } });
      entries.push({ path, mode: '100644', type: 'blob', sha: res.sha });
      done++;
    }

    let deleted = 0;
    oldPaths.forEach((p) => {
      if (!wanted.has(p) && existing.has(p) && /^(pages|assets)\//.test(p)) {
        entries.push({ path: p, mode: '100644', type: 'blob', sha: null });
        deleted++;
      }
    });

    entries.push({ path: BOOK_FILE, mode: '100644', type: 'blob', content: JSON.stringify(book, null, 2) + '\n' });

    onProgress({ step: 'commit', text: 'Création de la nouvelle version…' });
    const newTree = await this.req('/git/trees', { method: 'POST', body: { base_tree: baseTree, tree: entries } });
    const commit = await this.req('/git/commits', {
      method: 'POST',
      body: { message: message || 'Mise à jour du grimoire', tree: newTree.sha, parents: [headSha] },
    });
    await this.req(`/git/refs/heads/${encodeURIComponent(this.branch)}`, { method: 'PATCH', body: { sha: commit.sha, force: false } });
    onProgress({ step: 'done', text: 'Publié !' });
    return { sha: commit.sha, url: commit.html_url, uploaded: done, deleted };
  }
}
