// Types de l'objet que le moteur expose (window.__game, voir la fin de engine.js).
export type GameApi = {
  readonly state: string;
  paused: boolean;
  saveGame: () => void;
  newGame: (difficulty?: number) => void;
  step: (n: number, dt?: number) => void;
};

export default function createGame(env: object): GameApi;
