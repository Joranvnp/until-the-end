import createGame, { type GameApi } from './engine.generated';
import { createEnv } from './env';

type Runtime = Awaited<ReturnType<typeof createEnv>> & { game: GameApi };

// Le moteur ne se charge qu'une fois par lancement de l'app, comme une page web :
// quitter puis revenir à l'écran de jeu reprend la même partie.
let runtime: Promise<Runtime> | null = null;

/** Démarre le moteur à la taille donnée (en points) au premier appel, puis le réutilise. */
export function getRuntime(width: number, height: number) {
  if (!runtime) {
    runtime = createEnv().then((rt) => {
      rt.resize(width, height);
      return { ...rt, game: createGame(rt.env) };
    });
    runtime.catch(() => (runtime = null));
  }
  return runtime;
}
