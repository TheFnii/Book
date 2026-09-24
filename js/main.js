import { Reader } from './reader.js';
import { fetchPublishedBook, kv, normalizeBook } from './store.js';

const preview = new URLSearchParams(location.search).has('apercu');
const reader = new Reader(document.getElementById('app'), { preview });

(async () => {
  let book;
  try {
    if (preview) {
      const draft = await kv.get('draft');
      book = draft ? normalizeBook(draft) : await fetchPublishedBook();
    } else {
      book = await fetchPublishedBook();
    }
  } catch (e) {
    console.error(e);
    reader.showError('Le grimoire n’a pas pu être chargé. Vérifiez votre connexion puis rechargez la page.');
    return;
  }
  await reader.load(book);
})();

if (!preview && 'serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
