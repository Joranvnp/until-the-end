export type TutorialSlug = 'but' | 'commandes' | 'unites' | 'dangers';

export type TutorialSection = {
  title: string;
  body: string;
  code?: { title: string; snippet: string };
};

export type Tutorial = {
  slug: TutorialSlug;
  title: string;
  description: string;
  sections: TutorialSection[];
};

const but: Tutorial = {
  slug: 'but',
  title: 'Le but du jeu',
  description: 'Protège ton cœur bleu, détruis le rouge',
  sections: [
    {
      title: 'Deux cœurs, un gagnant',
      body: 'Ton cœur bleu est dans ta base. Le cœur rouge est à l’autre bout du monde. Détruis-le avant que l’armée rouge ne détruise le tien.',
    },
    {
      title: 'Mine et rapporte',
      body: 'Creuse la montagne pour trouver cuivre, fer, argent et diamants. Ton minerai est déposé tout seul quand tu reviens à la base.',
    },
    {
      title: 'Recrute et forge',
      body: 'À la base, dépense ta réserve pour recruter des troupes et acheter des améliorations. À la forge, fabrique de meilleures pioches et épées.',
    },
    {
      title: 'Éclats et boutique',
      body: 'Chaque partie terminée rapporte des éclats. Dépense-les dans la boutique du camp pour des tenues et des bonus de départ.',
    },
  ],
};

const commandes: Tutorial = {
  slug: 'commandes',
  title: 'Commandes tactiles',
  description: 'Marcher, sauter, miner, viser',
  sections: [
    {
      title: 'Se déplacer',
      body: 'Les flèches gauche et droite, en bas de l’écran, font marcher ton héros. La flèche vers le haut sert à sauter et à nager vers le haut. Tu peux glisser le pouce d’une flèche à l’autre sans le lever.',
    },
    {
      title: 'Le gros bouton',
      body: 'Il utilise l’objet en main et vise tout seul : il mine le bloc devant toi, frappe un ennemi ou lance une bombe. Maintiens la flèche vers le bas en même temps pour creuser sous tes pieds.',
    },
    {
      title: 'Viser précisément',
      body: 'Touche directement le monde pour utiliser l’objet à cet endroit précis, par exemple pour miner un filon en diagonale.',
    },
    {
      title: 'Barre et menus',
      body: 'La barre du bas choisit l’objet. Base recrute et améliore, Forge fabrique, Sac range ton inventaire, Ordre change la consigne de ton armée.',
    },
    {
      title: 'Gaucher ?',
      body: 'Dans le menu pause, Réglages, inverse les commandes pour avoir les flèches à droite et le gros bouton à gauche.',
    },
  ],
};

const unites: Tutorial = {
  slug: 'unites',
  title: 'Unités et ordres',
  description: 'Mineurs, guerriers, archers, golems',
  sections: [
    {
      title: 'Mineur',
      body: 'Creuse et rapporte du minerai tout seul. Recrute-les en premier : ils remplissent ta réserve pendant que tu explores. Ils fuient les pillards vers la tour.',
    },
    {
      title: 'Guerrier et archer',
      body: 'Le guerrier encaisse au corps à corps. L’archer tire de loin et recule quand on l’approche. Mélange les deux.',
    },
    {
      title: 'Golem',
      body: 'Colosse lent qui brise tout. Idéal pour faire tomber le cœur rouge.',
    },
    {
      title: 'Les ordres',
      body: 'Défense : tes troupes tiennent une ligne sous la tour, devant ton cœur. Assaut : l’armée marche groupée vers le cœur rouge. Suivre : tes troupes t’escortent partout.',
    },
    {
      title: 'Bon réflexe',
      body: 'Garde Défense tant que ton armée est petite, puis lance l’Assaut avec une dizaine de combattants. Les unités blessées rentrent se soigner à la base.',
    },
  ],
};

const dangers: Tutorial = {
  slug: 'dangers',
  title: 'Dangers et ennemis',
  description: 'Vagues, nuits, champion rouge',
  sections: [
    {
      title: 'Les vagues rouges',
      body: 'L’armée rouge se rassemble puis marche sur ta base. Chaque vague repoussée renforce la suivante : investis vite dans les améliorations.',
    },
    {
      title: 'La tour de guet',
      body: 'Elle tire sur les ennemis proches de ton cœur. Améliore-la depuis la base pour tenir les premières vagues.',
    },
    {
      title: 'La nuit',
      body: 'Slimes et zombies sortent. Lors d’une lune de sang, ils sont deux fois plus nombreux.',
    },
    {
      title: 'Le champion rouge',
      body: 'Il pille la montagne et traque tes mineurs. Blessé, il bat en retraite pour se soigner puis revient. L’abattre rapporte gros.',
    },
    {
      title: 'Si tu tombes',
      body: 'Tu reviens à la base au bout de quelques secondes. La partie n’est perdue que si ton cœur bleu est détruit.',
    },
  ],
};

export const TUTORIALS: Record<TutorialSlug, Tutorial> = { but, commandes, unites, dangers };

export const TUTORIAL_LIST: Tutorial[] = [but, commandes, unites, dangers];

export function isTutorialSlug(value: string): value is TutorialSlug {
  return value in TUTORIALS;
}
