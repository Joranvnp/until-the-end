import AsyncStorage from '@react-native-async-storage/async-storage';
import { Asset } from 'expo-asset';
import * as Haptics from 'expo-haptics';
import {
  AppState,
  BackHandler,
  PixelRatio,
  Share,
  type NativeEventSubscription,
} from 'react-native';
import { AudioContext } from 'react-native-audio-api';
import type { SkPicture } from '@shopify/react-native-skia';
import { CanvasElement, ImageElement } from './canvas';

// Fait croire au moteur du jeu (game/engine.js) qu'il tourne dans une page web :
// window/document/navigator, stockage, sons, images, tactile, et le pont « Capacitor » qu'il
// utilise déjà pour les vibrations, le partage, le bouton retour et la mise en arrière-plan.

type Listener = (ev: unknown) => void;
type Bus = Map<string, Set<Listener>>;

const SAVE_KEYS = ['ute-save-v1', 'ute-profile-v1'];

// Sons et images du jeu (le moteur les demande par leur chemin relatif : audio/x.mp3, art/x.png).
const AUDIO: Record<string, number> = {
  ach: require('../assets/audio/ach.mp3'),
  boom: require('../assets/audio/boom.mp3'),
  bow: require('../assets/audio/bow.mp3'),
  brk: require('../assets/audio/brk.mp3'),
  buy: require('../assets/audio/buy.mp3'),
  click: require('../assets/audio/click.mp3'),
  coin: require('../assets/audio/coin.mp3'),
  deny: require('../assets/audio/deny.mp3'),
  hit: require('../assets/audio/hit.mp3'),
  horn: require('../assets/audio/horn.mp3'),
  hurt: require('../assets/audio/hurt.mp3'),
  jump: require('../assets/audio/jump.mp3'),
  pick: require('../assets/audio/pick.mp3'),
  place: require('../assets/audio/place.mp3'),
  sword: require('../assets/audio/sword.mp3'),
  'music-aube': require('../assets/audio/music-aube.mp3'),
  'music-blood': require('../assets/audio/music-blood.mp3'),
  'music-combat': require('../assets/audio/music-combat.mp3'),
  'music-day': require('../assets/audio/music-day.mp3'),
  'music-defaite': require('../assets/audio/music-defaite.mp3'),
  'music-grotte': require('../assets/audio/music-grotte.mp3'),
  'music-menu': require('../assets/audio/music-menu.mp3'),
  'music-night': require('../assets/audio/music-night.mp3'),
  'music-raid': require('../assets/audio/music-raid.mp3'),
  'music-victoire': require('../assets/audio/music-victoire.mp3'),
  'music-village': require('../assets/audio/music-village.mp3'),
};
const IMAGES: Record<string, number> = {
  'art/menu.png': require('../assets/art/menu.png'),
  'art/fin-victoire.png': require('../assets/art/fin-victoire.png'),
  'art/fin-defaite.png': require('../assets/art/fin-defaite.png'),
  'art/bg-far.png': require('../assets/art/bg-far.png'),
  'art/bg-near.png': require('../assets/art/bg-near.png'),
};

async function localUri(mod: number) {
  const asset = Asset.fromModule(mod);
  if (!asset.localUri) await asset.downloadAsync();
  return asset.localUri ?? asset.uri;
}

function on(bus: Bus, type: string, fn: Listener) {
  let set = bus.get(type);
  if (!set) bus.set(type, (set = new Set()));
  set.add(fn);
}
function emit(bus: Bus, type: string, ev: unknown) {
  bus.get(type)?.forEach((fn) => {
    try {
      fn(ev);
    } catch (e) {
      console.error(e);
    }
  });
}

/** AudioContext natif, avec decodeAudioData à rappels comme dans le navigateur. */
function makeAudioContext() {
  const ac = new AudioContext();
  const decode = ac.decodeAudioData.bind(ac);
  return Object.assign(ac, {
    decodeAudioData(
      input: string | ArrayBuffer,
      ok?: (b: unknown) => void,
      ko?: (e: unknown) => void
    ) {
      const p = decode(input);
      if (ok) p.then(ok, ko);
      return p;
    },
  });
}

/** Ce qu'un toucher RN devient pour le moteur. */
export type TouchPoint = { identifier: number; clientX: number; clientY: number };

export type GameHost = {
  /** Image de la frame courante, à afficher par <Picture>. */
  onFrame: (picture: SkPicture) => void;
  /** Le moteur veut quitter (bouton retour depuis l'écran titre). */
  onExit: () => void;
};

export type GameEnv = ReturnType<typeof createEnv>;

export async function createEnv() {
  const stored = await AsyncStorage.multiGet(SAVE_KEYS);
  const store = new Map<string, string>();
  for (const [k, v] of stored) if (v != null) store.set(k, v);

  const winBus: Bus = new Map();
  const docBus: Bus = new Map();
  const appBus: Bus = new Map();
  let host: GameHost | null = null;
  let hidden = false;

  const cv = new CanvasElement(true);

  const localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => {
      const s = String(v);
      store.set(k, s);
      AsyncStorage.setItem(k, s).catch(() => {});
    },
    removeItem: (k: string) => {
      store.delete(k);
      AsyncStorage.removeItem(k).catch(() => {});
    },
  };

  // Boucle d'animation : une seule demande en attente, exécutée à la prochaine frame d'écran
  // tant que l'écran de jeu est affiché. Chaque frame est enregistrée en SkPicture.
  let pending: ((t: number) => void) | null = null;
  let active = false;
  let raf = 0;
  const tick = () => {
    raf = 0;
    if (!active) return;
    const cb = pending;
    pending = null;
    if (cb) {
      cv.beginFrame();
      try {
        cb(performance.now());
      } finally {
        const pic = cv.endFrame();
        if (pic) host?.onFrame(pic);
      }
    }
    if (pending && active && !raf) raf = requestAnimationFrame(tick);
  };
  const requestFrame = (cb: (t: number) => void) => {
    pending = cb;
    if (active && !raf) raf = requestAnimationFrame(tick);
    return 1;
  };

  const capacitor = {
    isNativePlatform: () => true,
    getPlatform: () => (process.env.EXPO_OS === 'ios' ? 'ios' : 'android'),
    Plugins: {
      Haptics: {
        impact: ({ style }: { style: 'HEAVY' | 'MEDIUM' | 'LIGHT' }) =>
          Haptics.impactAsync(
            style === 'HEAVY'
              ? Haptics.ImpactFeedbackStyle.Heavy
              : style === 'MEDIUM'
                ? Haptics.ImpactFeedbackStyle.Medium
                : Haptics.ImpactFeedbackStyle.Light
          ).catch(() => {}),
        vibrate: ({ duration }: { duration: number }) =>
          Haptics.impactAsync(
            duration > 80 ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Medium
          ).catch(() => {}),
      },
      Share: {
        share: async ({ title, text, url }: { title?: string; text: string; url?: string }) => {
          await Share.share({ title, message: url ? `${text} ${url}` : text, url });
        },
      },
      App: {
        addListener: (type: string, fn: Listener) => on(appBus, type, fn),
        exitApp: () => host?.onExit(),
      },
    },
  };

  const window = {
    devicePixelRatio: PixelRatio.get(),
    ontouchstart: null,
    Capacitor: capacitor,
    AudioContext: makeAudioContext as unknown as new () => AudioContext,
    addEventListener: (type: string, fn: Listener) => on(winBus, type, fn),
    removeEventListener: (type: string, fn: Listener) => winBus.get(type)?.delete(fn),
  } as Record<string, unknown> & { __game?: unknown };
  // Le moteur fait `new window.AudioContext()` : une fonction fabrique convient aussi avec `new`.

  const document = {
    get hidden() {
      return hidden;
    },
    getElementById: () => cv,
    createElement: () => new CanvasElement(),
    addEventListener: (type: string, fn: Listener) => on(docBus, type, fn),
  };

  const navigator = {
    maxTouchPoints: 5,
    language: 'fr-FR',
    clipboard: { writeText: async () => {} },
  };

  const fetchShim = async (url: string) => {
    const name = /audio\/(.+)\.mp3$/.exec(url)?.[1];
    const mod = name ? AUDIO[name] : undefined;
    if (!mod) return { ok: false, arrayBuffer: async () => new ArrayBuffer(0) };
    // decodeAudioData natif lit directement un chemin de fichier : on passe l'URI locale.
    const uri = await localUri(mod);
    return { ok: true, arrayBuffer: async () => uri };
  };

  class Image extends ImageElement {
    constructor() {
      super(async (src) => {
        const mod = IMAGES[src];
        return mod ? localUri(mod) : null;
      });
    }
  }

  const env = {
    window,
    document,
    navigator,
    localStorage,
    performance,
    addEventListener: window.addEventListener,
    Image,
    fetch: fetchShim,
    innerWidth: 0,
    innerHeight: 0,
    location: { protocol: 'app:' },
    ResizeObserver: undefined,
    visualViewport: undefined,
    requestAnimationFrame: requestFrame,
    setTimeout,
    atob: globalThis.atob,
    btoa: globalThis.btoa,
  };

  let appSub: NativeEventSubscription | null = null;
  let backSub: NativeEventSubscription | null = null;

  return {
    env,
    canvas: cv,

    /** Branche l'écran de jeu : la boucle tourne, le retour Android et l'arrière-plan sont relayés. */
    attach(h: GameHost) {
      host = h;
      active = true;
      if (pending && !raf) raf = requestAnimationFrame(tick);
      appSub = AppState.addEventListener('change', (s) => {
        const nowHidden = s !== 'active';
        if (nowHidden === hidden) return;
        hidden = nowHidden;
        emit(docBus, 'visibilitychange', {});
        if (hidden) {
          emit(winBus, 'pagehide', {});
          emit(appBus, 'pause', {});
        } else emit(appBus, 'resume', {});
      });
      backSub = BackHandler.addEventListener('hardwareBackPress', () => {
        emit(appBus, 'backButton', {});
        return true;
      });
    },

    /** L'écran de jeu se ferme : sauvegarde et pause comme une mise en arrière-plan. */
    detach() {
      emit(appBus, 'pause', {});
      active = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      host = null;
      appSub?.remove();
      backSub?.remove();
      appSub = backSub = null;
    },

    /** Taille de la vue en points : équivalent d'un redimensionnement de fenêtre. */
    resize(width: number, height: number) {
      if (width === cv.layout.width && height === cv.layout.height) return;
      cv.layout = { width, height };
      env.innerWidth = width;
      env.innerHeight = height;
      emit(winBus, 'resize', {});
    },

    touch(
      type: 'touchstart' | 'touchmove' | 'touchend' | 'touchcancel',
      changed: TouchPoint[],
      all: TouchPoint[]
    ) {
      cv.dispatch(type, { changedTouches: changed, touches: all, preventDefault() {} });
      if (type === 'touchend') emit(winBus, 'touchend', {});
    },
  };
}
