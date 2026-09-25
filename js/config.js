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

// Calendrier lunaire : textes des 4 phases (modifiables dans l'atelier).
export const DEFAULT_LUNAR = {
  enabled: true,
  phases: [
    { title: 'Nouvelle lune', motto: 'Je sème', tips: ['Poser ses intentions', 'Commencer un projet', 'Écrire ses objectifs', 'Planifier ses actions'] },
    { title: 'Premier quartier', motto: 'J’agis', tips: ['Passer à l’action', 'Prendre une décision', 'Lever les blocages', 'Oser sortir de sa zone de confort'] },
    { title: 'Pleine lune', motto: 'Je récolte', tips: ['Faire le bilan', 'Prendre conscience', 'Recevoir des réponses', 'Célébrer les réussites'] },
    { title: 'Dernier quartier', motto: 'Je libère', tips: ['Lâcher prise', 'Trier et ranger', 'Pardonner', 'Clore ce qui n’a plus sa place'] },
  ],
};

// Jeu de cartes « Messages de l’univers » : proportions des cartes et messages par défaut
// (modifiables dans l'atelier, comme le dos des cartes).
export const CARD_RATIO = 3 / 5; // largeur / hauteur d'une carte

export const DEFAULT_CARDS = {
  enabled: true,
  label: 'Messages de l’univers',
  messages: [
    "Mettre trop d’énergie à vouloir tout organiser et protéger peut doucement mener à l’épuisement. L’Univers invite simplement à desserrer l’étreinte sur les événements : en laissant les choses s’agencer d’elles-mêmes, la sérénité retrouve naturellement sa place.",
    "Prendre soin du monde est une belle qualité, mais accorder la même tendresse à sa propre personne reste essentiel. Prendre un moment pour soi n’est jamais un détour : c’est la source où se ressource tout le reste.",
    "Il n’y a aucune course à gagner ni aucun retard à rattraper. La nature ne se presse pas, et pourtant tout s’accomplit. Honorer ses besoins de repos et ralentir le pas permet d’éclore exactement au bon moment.",
    "Au milieu du bruit et des attentes extérieures, la vérité murmure toujours avec discrétion. S’offrir un temps de retrait permet d’entendre à nouveau cette sagesse intérieure qui sait déjà ce qui est juste.",
    "Porter des responsabilités ou des inquiétudes qui ne nous appartiennent pas alourdit inutilement la marche. Déposer ces bagages au bord du chemin offre la possibilité de continuer le voyage le cœur plus léger.",
    "Chercher la perfection amène parfois une fatigue invisible. L’Univers ne demande aucun parcours sans faute, mais seulement de la présence et de la sincérité. Chaque hésitation fait aussi partie de la beauté du chemin.",
    "L’incertitude peut éveiller une certaine appréhension, mais elle reste avant tout l’espace où naissent les nouveaux possibles. Faire un pas vers l’inconnu, c’est s’ouvrir à la bienveillance de ce qui vient.",
    "Lorsque les réponses ne se dessinent pas encore, insister ne sert à rien. Laisser le mental se reposer dans le silence permet souvent aux compréhensions les plus claires de venir d’elles-mêmes.",
    "Les grandes transformations s’opèrent toujours dans la durée et la discrétion. Faire preuve de douceur envers ses propres doutes est le plus beau cadeau à s’offrir pour continuer d’avancer sereinement.",
    "Le passé a façonné l’expérience, mais il n’a pas à écrire la suite de l’histoire. Tourner une page avec gratitude permet de laisser l’énergie du renouveau s’installer avec fluidité.",
    "Tu n’as pas à rester fidèle à une ancienne version de toi-même simplement pour rassurer ton entourage. S’accorder le droit d’évoluer et d’avoir de nouveaux désirs est un acte de sincérité envers soi-même.",
    "Chercher à ce que tout soit parfait ou tranché peut parfois alourdir l’esprit. L’Univers rappelle qu’il existe une grande douceur dans la nuance : accueillir d’autres perspectives sans se juger permet de retrouver de la fluidité et d’apaiser les relations.",
    "Tirer sur une jeune pousse ne la fera jamais grandir plus vite, elle risque seulement de se fragiliser. Certaines étapes de la vie demandent un temps d’attente silencieux, bien à l’abri des regards, pour développer des racines solides. L’Univers invite à faire confiance à ce travail invisible qui se prépare en coulisses : tout mûrit à son propre rythme avant d’offrir ses plus beaux fruits.",
    "Végéter dans le souvenir d’hier ou s’inquiéter de l’ombre de demain fait manquer la seule réalité vivante : cet instant précis. Habiter pleinement le présent redonne toute sa couleur à l’expérience.",
    "Ignorer la colère ou la tristesse ne les fait pas disparaître ; cela ne fait que les terrer dans le silence. Offrir un espace d’écoute bienveillant à ses ressentis permet de les traverser sans s’y perdre.",
    "Attendre l’approbation d’autrui pour valider ses choix revient à donner les clés de sa maison. L’Univers invite à s’accorder soi-même la permission d’exister et d’avancer.",
    "L’eau contourne l’obstacle sans s’épuiser à le frapper. Faire preuve de souplesse face aux imprévus permet d’atteindre le même but en préservant son énergie.",
    "Conserver une rancune ravive sans cesse une blessure ancienne. Pardonner ne signifie pas cautionner, mais choisir de ne plus laisser le passé dicter la qualité du présent.",
    "L’élan créatif ne naît pas dans la contrainte, mais dans la disponibilité de l’esprit. Laisser vagabonder ses pensées sans objectif immédiat ouvre la porte aux idées les plus fécondes.",
    "Exprimer des intentions est un premier pas, mais seules les actions répétées façonnent le quotidien. Réduire l’écart entre ce qui est dit et ce qui est fait apporte une profonde paix intérieure.",
    "Accumuler les engagements, les objets ou les pensées finit par encombrer l’esprit. L’Univers invite à faire le tri pour ne conserver que ce qui a une valeur réelle et apporte une vraie légèreté.",
    "Repérer les défauts de la situation chez les autres est souvent plus facile que d’observer son propre rôle. Prendre un instant pour évaluer sa part de responsabilité redonne la capacité d’agir directement.",
    "Douter de sa valeur empêche souvent d’offrir ce que l’on a de plus précieux. La place occupée aujourd’hui ne doit rien au hasard : elle s’honore par la présence et l’authenticité, non par des preuves à fournir.",
    "Un petit pas accompli chaque jour crée une traversée bien plus grande qu’un grand saut suivi d’un abandon. La constance silencieuse bat toujours la précipitation.",
    "Vouloir à tout prix une réponse immédiate pousse parfois à faire des choix par dépit. Accepter de rester quelques instants dans l’incertitude laisse le temps aux vraies solutions d’émerger.",
    "Porter son attention sur ce qui manque masque la richesse de ce qui est déjà là. Reconnaître les appuis simples du quotidien transforme immédiatement la perception de la journée.",
    "Répéter les mêmes réflexes conduit inévitablement aux mêmes résultats. Introduire un léger changement dans sa routine suffit parfois à débloquer une situation figée.",
    "Lorsque l’esprit refuse de ralentir, le corps finit par exprimer le besoin de pause à sa manière. Prêter attention aux signaux d’inconfort évite d’avoir à subir un arrêt forcé.",
    "Attendre que l’autre devine un besoin non exprimé crée de la frustration inutile. Exprimer simplement et calmement son intention reste le chemin le plus court vers la compréhension.",
    "Il existe des moments où l’ancien n’est plus et où le nouveau n’est pas encore là. Cet espace intermédiaire peut sembler étrange, mais il est le terreau indispensable à toute métamorphose.",
    "Absorber toutes les rumeurs, les avis et les agitations du monde finit par offusquer la vision. Filtrer ce que l’on laisse entrer dans son esprit préserve une clarté indispensable pour faire ses propres choix.",
    "Passer trop de temps dans les concepts ou les écrans éloigne du monde sensible. Toucher la terre, marcher, sentir la matière sous ses mains offre un retour immédiat à l’équilibre.",
    "Offrir sa présence à quelqu’un ne demande pas de porter sa souffrance à sa place. Maintenir une frontière saine permet de soutenir l’autre sans s’épuiser soi-même.",
    "Trop analyser une idée finit souvent par l’asphyxier avant même qu’elle ne voie le jour. Laisser parler l’enthousiasme premier donne l’énergie nécessaire pour franchir le premier pas.",
    "Traînasser une culpabilité ancienne n’efface rien et pèse lourdement sur le présent. Reconnaître l’erreur, réparer ce qui peut l’être, puis se pardonner est le seul chemin vers la liberté.",
    "Vouloir remplir chaque minute de la journée empêche l’imprévu de s’inviter. Conserver des plages de vide offre à l’inspiration et aux rencontres la possibilité de se manifester.",
    "La nature ne fleurit pas toute l’année, et vouloir maintenir un niveau de productivité constant va contre les lois naturelles. Respecter ses phases de retrait prépare la vigueur des prochains épanouissements.",
    "Croire que personne ne peut faire aussi bien que soi mène inévitablement à la surcharge. Transmettre une tâche et accepter qu’elle soit faite différemment offre un précieux espace de respiration.",
    "Une tentative qui n’aboutit pas n’est pas une perte de temps, mais une donnée précieuse sur ce qui doit être ajusté. Chaque essai manqué affine la précision du geste suivant.",
    "Modifier ses valeurs pour être accepté par un groupe ou une personne crée une fracture interne. L’Univers rappelle que la vraie sécurité réside dans le fait de rester aligné avec ses principes, même si cela déplaît.",
    "Croire que l’on sait déjà tout ferme la porte aux plus belles découvertes. Adopter la posture de celui qui apprend garde l’esprit souple, curieux et prêt à s’enrichir de chaque rencontre.",
    "Osciller entre l’excès d’enthousiasme et le découragement total épuise les réserves. Rechercher l’équilibre et la modération permet de maintenir une trajectoire stable et durable.",
    "Regarder le parcours des autres à travers une vitrine fait parfois oublier la valeur de son propre cheminement. L’Univers rappelle que chaque trajectoire possède ses propres saisons : honorer sa vitesse personnelle est la plus belle façon de s’épanouir.",
    "Retirer les artifices et cesser de vouloir correspondre à un rôle offre un apaisement immédiat. C’est en habitant simplement sa propre vérité que l’énergie redevient fluide et que la vie retrouve tout son naturel.",
    "Lorsque les événements extérieurs s’agitent et brouillent les repères, la véritable boussole demeure à l’intérieur. Revenir à ses valeurs profondes permet de traverser le mouvement sans jamais perdre son orientation.",
    "Attendre des résultats immédiats amène parfois à douter de la valeur du travail accompli. L’Univers rappelle que les graines les plus précieuses prennent le temps de s’enraciner profondément avant de se déployer au soleil.",
    "S’entêter dans une direction qui se ferme épuise inutilement les réserves. Accepter de contourner l’obstacle ou d’ajuster son élan n’est pas un renoncement, mais une forme d’intelligence qui préserve l’énergie.",
    "Chercher à convaincre ou à changer les autres dresse des barrières inutiles. Offrir à chacun la liberté d’avoir ses propres convictions préserve la sérénité des échanges.",
    "Traverser les jours en pensant déjà à l’étape suivante pèse sur l’esprit. Accorder de la valeur aux instants de douceur et aux beautés discrètes du quotidien réchauffe le cœur et renouvelle la vitalité.",
    "S’accrocher à une amertume ou chercher à avoir le dernier mot alourdit inutilement la marche. Laisser aller les désaccords sans chercher à tout résoudre est parfois la manière la plus douce de préserver son équilibre.",
    "Vouloir répondre à chaque sollicitation disperse l’attention et assèche la joie. Offrir son temps uniquement à ce qui fait vibrer le cœur permet de retrouver toute sa fraîcheur intérieure.",
    "Ruminer une décision passée avec le regard d’aujourd’hui est une injustice envers soi-même. Accorder de la compassion à la personne qu’on était alors permet de se libérer définitivement du poids de l’erreur.",
    "Porter une attention douce sur tout ce qui a été traversé transforme la perception de l’instant. Prendre conscience du chemin déjà parcouru offre un ancrage chaleureux et donne confiance en la suite.",
    "Toutes les pièces du puzzle finissent par trouver leur place naturelle. Prendre la mesure de la sagesse acquise permet de se tenir au centre de sa vie, le cœur serein et prêt à accueillir l’inconnu.",
  ],
};
