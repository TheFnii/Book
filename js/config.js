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
