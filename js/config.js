// Dépôt GitHub où l'éditeur publie le livre.
// Ces valeurs peuvent aussi être modifiées dans l'éditeur (⚙ Connexion).
export const REPO_DEFAULTS = {
  owner: 'TheFnii',
  repo: 'Book',
  branch: 'main',
};

export const BOOK_FILE = 'book.json';
export const DEFAULT_RATIO = 1414 / 2000; // A4 portrait (format Canva)

// Boule de voyance : réponses par défaut (modifiables dans l'atelier).
export const DEFAULT_ORACLE = {
  enabled: true,
  title: 'Lilly',
  subtitle: 'Messagère d’univers',
  answers: [
    'Oui', 'Absolument', 'Certainement', 'Les étoiles disent oui', 'Oui, sans hésiter',
    'C’est un grand OUI', 'Les astres sont favorables', 'Définitivement oui', 'La réponse est oui',
    'Très favorable', 'Les astres répondent non', 'Ce chemin n’est pas le plus favorable',
    'Non, mais une autre porte va s’ouvrir', 'Les étoiles montrent une autre direction',
    'Non, cette voie n’est pas éclairée par les étoiles', 'Le moment n’est pas propice',
    'Les étoiles gardent encore le secret', 'Une meilleure opportunité approche', 'Probablement',
    'C’est possible', 'Les signes sont encore flous', 'Demande-moi plus tard', 'L’issue est incertaine',
    'Ni oui ni non pour l’instant', 'Ça dépend de toi', 'Les étoiles hésitent',
    'La réponse se précise encore', 'Réponse mitigée', 'Reviens me voir bientôt',
    'Le chemin se dessine encore', 'Attends un signe des étoiles', 'Le temps apportera la réponse',
  ],
};

// Décor par défaut : bureau en bois avec sous-main en cuir.
// Positions exprimées en fraction de l'image (mesurées sur la photo).
export const DESK = {
  src: 'img/desk.jpg',
  ratio: 1408 / 768, // largeur / hauteur de la photo
  pad: { x: 300 / 1408, y: 105 / 768, w: 810 / 1408, h: 565 / 768 }, // rectangle du sous-main
};

// Boule de voyance : vue de haut (sur le bureau) et vue de côté (quand on la consulte).
// cx, cy, r : centre et rayon de la sphère dans l'image, en pixels.
export const BALL = {
  top: { src: 'img/ball-top.webp', w: 573, h: 715, cx: 281.4, cy: 202.3, r: 197.5 },
  side: { src: 'img/ball-side.webp', w: 846, h: 1311, cx: 419.9, cy: 341.2, r: 337.6 },
};
