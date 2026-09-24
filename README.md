# Le Grimoire de Lilly

Un livre interactif à feuilleter : le grimoire s'ouvre dans une lueur dorée, avec des particules et un carillon, puis les pages se tournent en se courbant. Le livre s'installe comme une application sur Android et reste lisible hors ligne.

- **Le livre (public)** : `https://thefnii.github.io/Book/`
- **L'atelier (pour modifier)** : `https://thefnii.github.io/Book/editeur.html`

Les visiteurs peuvent seulement lire. Pour publier, il faut votre jeton GitHub personnel, qui n'est enregistré que dans votre navigateur.

---

## Mise en route (une seule fois)

### 1. Activer GitHub Pages
1. Sur GitHub, ouvrez le dépôt **Book** → **Settings** → **Pages**.
2. **Source** : *Deploy from a branch*.
3. **Branch** : `main`, dossier `/ (root)` → **Save**.
4. Une à deux minutes plus tard, le lien du livre apparaît en haut de cette page.

### 2. Créer votre jeton d'accès (pour publier depuis l'atelier)
1. Ouvrez <https://github.com/settings/personal-access-tokens/new>.
2. **Token name** : `Atelier du Grimoire`. Choisissez une **expiration** (1 an par exemple).
3. **Repository access** : *Only select repositories* → **Book**.
4. **Permissions** → **Repository permissions** → **Contents** : *Read and write*.
5. **Generate token**, puis copiez le jeton (il commence par `github_pat_`).
6. Dans l'atelier, cliquez sur ⚙, collez le jeton, puis **Enregistrer**. Le message « ✓ Connexion réussie » doit s'afficher.

> Le jeton est une clé : ne le partagez jamais. Il reste enregistré dans le navigateur de l'appareil où vous l'avez collé. Sur un autre appareil, il faudra le coller de nouveau.

---

## Au quotidien : ajouter ou modifier des pages

1. **Dans Canva** : *Partager → Télécharger → PNG*, toutes les pages. Gardez le même format pour toutes (A4 portrait, comme maintenant).
2. **Dans l'atelier** : glissez les fichiers dans la zone prévue, ou touchez **Ajouter des pages**. Les fichiers sont rangés par ordre de nom (`page2` avant `page10`).
   - Pour **insérer à un endroit précis**, touchez d'abord une page : les nouvelles pages viendront juste après elle.
   - Pour **déplacer** une page : glisser-déposer (ordinateur), les flèches ‹ ›, ou un clic sur son numéro pour choisir sa position.
   - Pour **remplacer** une page par sa nouvelle version Canva : bouton ⇄.
   - **Page blanche** : ajoute une page vierge, pratique pour caler une double page.
   - **Titre** : facultatif, il apparaît dans le sommaire du livre.
   - **Annuler** (ou Ctrl+Z) défait la dernière action.
3. **Aperçu** : feuilletez le livre tel qu'il sera publié.
4. **Publier** : environ une minute plus tard, tout le monde voit la nouvelle version.

Tant que vous ne publiez pas, vos modifications restent un **brouillon** enregistré automatiquement sur cet appareil. **Abandonner le brouillon** vous ramène à la version publiée.

La couverture peut être modifiée dans l'atelier : titre sur deux lignes, ou une image faite dans Canva. Vous pouvez aussi remplacer le décor derrière le livre.

---

## La boule de voyance

Une boule de cristal est posée sur le bureau, en haut à droite. Quand on la touche, la vue se recentre sur elle : on pose sa question en silence, puis on touche **Interroger Lilly**. La boule tourbillonne et une réponse tirée au hasard apparaît à l'intérieur.

Dans l'atelier, l'encadré **Boule de voyance** permet de :
- l'afficher ou la masquer ;
- changer le titre et le sous-titre (« Lilly », « Messagère d'univers ») ;
- modifier la liste des réponses, **une réponse par ligne**.

Comme le reste du livre, les changements sont visibles par tous après avoir cliqué sur **Publier**.

---

## Installer le livre sur un téléphone

- **Android (Chrome)** : ouvrez le lien du livre → menu **⋮** → **Installer l'application** (ou *Ajouter à l'écran d'accueil*).
- **iPhone (Safari)** : bouton **Partager** → **Sur l'écran d'accueil**.

L'application s'ouvre en plein écran et fonctionne hors ligne pour les pages déjà consultées.

---

## Bon à savoir

- **Structure du livre** : à l'ouverture, on voit la page de garde (page blanche à gauche) et votre première page à droite. Si le nombre de pages est impair, une page blanche est ajoutée automatiquement à la fin.
- **Taille des images** : l'atelier réduit les images à 2000 px de haut au maximum et les compresse (WebP). Un livre de 100 pages pèse environ 30 Mo.
- **Historique** : chaque publication crée une version dans GitHub (onglet *Commits*). On peut donc toujours revenir en arrière.
- **Lecture** : clic ou glisser sur un coin pour tourner les pages, flèches du clavier, sommaire, loupe pour lire en grand, son activable ou désactivable. Sur téléphone, tournez l'écran pour avoir un livre plus grand.

---

## Partie technique

Site statique, sans étape de compilation : HTML, CSS et JavaScript (modules ES).

| Fichier | Rôle |
|---|---|
| `index.html`, `js/main.js`, `js/reader.js` | Lecteur (scène, ouverture, pages) |
| `js/cover.js` | Couverture dessinée en SVG |
| `js/fx.js` | Particules dorées |
| `js/oracle.js` | Boule de voyance |
| `js/sound.js` | Sons générés en direct (Web Audio, sans fichier audio) |
| `editeur.html`, `js/editor.js` | Atelier |
| `js/github.js` | Publication : un seul commit par publication, via l'API Git de GitHub |
| `js/images.js`, `js/store.js` | Préparation des images, brouillon local (IndexedDB) |
| `book.json` | Contenu du livre (ordre des pages, titres, couverture) |
| `pages/`, `assets/` | Images (nommées d'après leur contenu) |
| `sw.js`, `manifest.webmanifest` | Application installable et lecture hors ligne |

Pour tester en local : `python3 -m http.server`, puis ouvrez `http://localhost:8000/`.

**Crédits** : tournage des pages par [StPageFlip](https://github.com/Nodlik/StPageFlip) (licence MIT, `lib/page-flip.LICENSE`). Polices Cinzel, Cinzel Decorative, Cormorant Garamond et Princess Sofia (SIL Open Font License, via Google Fonts). Photo du bureau et visuels de la boule de voyance fournis par l'autrice ; textures du cuir et du parchemin générées pour ce projet.
