import {
  AlphaType,
  BlendMode,
  ClipOp,
  ColorType,
  FilterMode,
  MipmapMode,
  PaintStyle,
  Skia,
  TileMode,
  type SkCanvas,
  type SkColor,
  type SkImage,
  type SkPaint,
  type SkPath,
  type SkPicture,
  type SkPictureRecorder,
  type SkShader,
  type SkSurface,
} from '@shopify/react-native-skia';

// Canvas 2D du navigateur réimplémenté sur Skia : juste ce que le moteur du jeu utilise
// (le jeu dessine tout par code, sans texte). Chaque toile hors écran est une surface raster
// de la taille logique ; la toile principale est enregistrée en image Skia (SkPicture) à chaque frame.

type Matrix = [number, number, number, number, number, number];
type Listener = (ev: unknown) => void;

export type ImageDataLike = { width: number; height: number; data: Uint8ClampedArray };

const BLEND: Record<string, BlendMode> = {
  'source-over': BlendMode.SrcOver,
  lighter: BlendMode.Plus,
  multiply: BlendMode.Multiply,
  copy: BlendMode.Src,
  'destination-in': BlendMode.DstIn,
  'source-in': BlendMode.SrcIn,
  'destination-out': BlendMode.DstOut,
  screen: BlendMode.Screen,
};

const colorCache = new Map<string, SkColor>();
const TRANSPARENT = Float32Array.of(0, 0, 0, 0);

function hex(s: string, i: number, n: number) {
  const v = parseInt(s.substr(i, n), 16);
  return n === 1 ? (v * 17) / 255 : v / 255;
}

function parseColor(input: string): SkColor {
  const hit = colorCache.get(input);
  if (hit) return hit;
  const s = input.trim();
  let c: SkColor = TRANSPARENT;
  if (s[0] === '#') {
    const n = s.length - 1;
    if (n === 3 || n === 4)
      c = Float32Array.of(hex(s, 1, 1), hex(s, 2, 1), hex(s, 3, 1), n === 4 ? hex(s, 4, 1) : 1);
    else if (n === 6 || n === 8)
      c = Float32Array.of(hex(s, 1, 2), hex(s, 3, 2), hex(s, 5, 2), n === 8 ? hex(s, 7, 2) : 1);
  } else if (s.startsWith('rgb')) {
    const p = s
      .slice(s.indexOf('(') + 1, s.lastIndexOf(')'))
      .split(/[\s,/]+/)
      .filter(Boolean);
    const ch = (v: string) => (v.endsWith('%') ? parseFloat(v) / 100 : parseFloat(v) / 255);
    const a =
      p[3] === undefined ? 1 : p[3].endsWith('%') ? parseFloat(p[3]) / 100 : parseFloat(p[3]);
    c = Float32Array.of(ch(p[0]), ch(p[1]), ch(p[2]), Math.max(0, Math.min(1, a)));
  } else if (s === 'white') c = Float32Array.of(1, 1, 1, 1);
  else if (s === 'black') c = Float32Array.of(0, 0, 0, 1);
  // Les couleurs calculées à la volée (rgb(...) animés) feraient grossir le cache sans fin.
  if (colorCache.size > 4096) colorCache.clear();
  colorCache.set(input, c);
  return c;
}

export class CanvasGradient {
  private stops: { pos: number; color: SkColor }[] = [];
  private shader: SkShader | null = null;

  constructor(
    private readonly kind: 'linear' | 'radial',
    private readonly args: number[]
  ) {}

  addColorStop(pos: number, color: string) {
    this.stops.push({ pos, color: parseColor(color) });
    this.shader = null;
  }

  getShader(): SkShader | null {
    if (this.shader) return this.shader;
    if (!this.stops.length) return null;
    const stops = [...this.stops].sort((a, b) => a.pos - b.pos);
    const colors = stops.map((s) => s.color);
    const pos = stops.map((s) => s.pos);
    const a = this.args;
    this.shader =
      this.kind === 'linear'
        ? Skia.Shader.MakeLinearGradient(
            Skia.Point(a[0], a[1]),
            Skia.Point(a[2], a[3]),
            colors,
            pos,
            TileMode.Clamp
          )
        : Skia.Shader.MakeTwoPointConicalGradient(
            Skia.Point(a[0], a[1]),
            a[2],
            Skia.Point(a[3], a[4]),
            a[5],
            colors,
            pos,
            TileMode.Clamp
          );
    return this.shader;
  }
}

type Style = string | CanvasGradient;

type State = {
  fillStyle: Style;
  strokeStyle: Style;
  lineWidth: number;
  globalAlpha: number;
  globalCompositeOperation: string;
  imageSmoothingEnabled: boolean;
  shadowColor: string;
  shadowBlur: number;
  m: Matrix;
};

const freshState = (): State => ({
  fillStyle: '#000',
  strokeStyle: '#000',
  lineWidth: 1,
  globalAlpha: 1,
  globalCompositeOperation: 'source-over',
  imageSmoothingEnabled: true,
  shadowColor: 'rgba(0,0,0,0)',
  shadowBlur: 0,
  m: [1, 0, 0, 1, 0, 0],
});

const isIdentity = (m: Matrix) =>
  m[0] === 1 && m[1] === 0 && m[2] === 0 && m[3] === 1 && m[4] === 0 && m[5] === 0;

/** Ce que drawImage accepte : une toile ou une image chargée. */
export type ImageSource = { width: number; height: number; getSkImage(): SkImage | null };

export class Context2D {
  private st: State = freshState();
  private stack: State[] = [];
  private path: SkPath = Skia.Path.Make();
  private readonly paint: SkPaint = Skia.Paint();
  imageSmoothingQuality = 'low';
  filter = 'none';

  constructor(readonly canvas: CanvasElement) {}

  reset() {
    this.st = freshState();
    this.stack = [];
    this.path = Skia.Path.Make();
  }

  // ---- état ----
  get fillStyle() {
    return this.st.fillStyle;
  }
  set fillStyle(v: Style) {
    this.st.fillStyle = v;
  }
  get strokeStyle() {
    return this.st.strokeStyle;
  }
  set strokeStyle(v: Style) {
    this.st.strokeStyle = v;
  }
  get lineWidth() {
    return this.st.lineWidth;
  }
  set lineWidth(v: number) {
    if (v > 0 && Number.isFinite(v)) this.st.lineWidth = v;
  }
  get globalAlpha() {
    return this.st.globalAlpha;
  }
  set globalAlpha(v: number) {
    if (v >= 0 && v <= 1) this.st.globalAlpha = v;
  }
  get globalCompositeOperation() {
    return this.st.globalCompositeOperation;
  }
  set globalCompositeOperation(v: string) {
    if (BLEND[v] !== undefined) this.st.globalCompositeOperation = v;
  }
  get imageSmoothingEnabled() {
    return this.st.imageSmoothingEnabled;
  }
  set imageSmoothingEnabled(v: boolean) {
    this.st.imageSmoothingEnabled = v;
  }
  get shadowColor() {
    return this.st.shadowColor;
  }
  set shadowColor(v: string) {
    this.st.shadowColor = v;
  }
  get shadowBlur() {
    return this.st.shadowBlur;
  }
  set shadowBlur(v: number) {
    this.st.shadowBlur = v;
  }

  save() {
    this.stack.push({ ...this.st, m: [...this.st.m] as Matrix });
    this.canvas.target()?.save();
  }
  restore() {
    const s = this.stack.pop();
    if (!s) return;
    this.st = s;
    this.canvas.target()?.restore();
  }

  // ---- transformations ----
  setTransform(a: number, b: number, c: number, d: number, e: number, f: number) {
    this.st.m = [a, b, c, d, e, f];
  }
  resetTransform() {
    this.st.m = [1, 0, 0, 1, 0, 0];
  }
  transform(a: number, b: number, c: number, d: number, e: number, f: number) {
    const [A, B, C, D, E, F] = this.st.m;
    this.st.m = [
      A * a + C * b,
      B * a + D * b,
      A * c + C * d,
      B * c + D * d,
      A * e + C * f + E,
      B * e + D * f + F,
    ];
  }
  translate(x: number, y: number) {
    this.transform(1, 0, 0, 1, x, y);
  }
  scale(x: number, y: number) {
    this.transform(x, 0, 0, y, 0, 0);
  }
  rotate(r: number) {
    const c = Math.cos(r),
      s = Math.sin(r);
    this.transform(c, s, -s, c, 0, 0);
  }

  // ---- peinture ----
  private shadow(p: SkPaint) {
    const { shadowBlur, shadowColor, m } = this.st;
    if (shadowBlur > 0) {
      const col = parseColor(shadowColor);
      if (col[3] > 0) {
        // Le flou d'ombre est en pixels écran : on compense l'échelle appliquée par concat.
        const sc = Math.sqrt(Math.abs(m[0] * m[3] - m[1] * m[2])) || 1;
        const sig = shadowBlur / 2 / sc;
        const c = Float32Array.of(col[0], col[1], col[2], col[3] * this.st.globalAlpha);
        p.setImageFilter(Skia.ImageFilter.MakeDropShadow(0, 0, sig, sig, c, null));
        return;
      }
    }
    p.setImageFilter(null);
  }

  private stylePaint(style: Style, kind: PaintStyle): SkPaint {
    const p = this.paint;
    p.setStyle(kind);
    p.setAntiAlias(kind === PaintStyle.Stroke);
    p.setStrokeWidth(this.st.lineWidth);
    p.setBlendMode(BLEND[this.st.globalCompositeOperation]);
    if (typeof style === 'string') {
      const c = parseColor(style);
      p.setShader(null);
      p.setColor(c);
      p.setAlphaf(c[3] * this.st.globalAlpha);
    } else {
      p.setShader(style.getShader());
      p.setColor(Float32Array.of(0, 0, 0, 1));
      p.setAlphaf(this.st.globalAlpha);
    }
    this.shadow(p);
    return p;
  }

  private draw(fn: (c: SkCanvas) => void) {
    const c = this.canvas.target();
    if (!c) return;
    const m = this.st.m;
    if (isIdentity(m)) fn(c);
    else {
      c.save();
      c.concat([m[0], m[2], m[4], m[1], m[3], m[5], 0, 0, 1]);
      fn(c);
      c.restore();
    }
    this.canvas.touch();
  }

  fillRect(x: number, y: number, w: number, h: number) {
    if (!w || !h) return;
    const p = this.stylePaint(this.st.fillStyle, PaintStyle.Fill);
    this.draw((c) => c.drawRect(Skia.XYWHRect(x, y, w, h), p));
  }
  strokeRect(x: number, y: number, w: number, h: number) {
    const p = this.stylePaint(this.st.strokeStyle, PaintStyle.Stroke);
    this.draw((c) => c.drawRect(Skia.XYWHRect(x, y, w, h), p));
  }
  clearRect(x: number, y: number, w: number, h: number) {
    const p = this.paint;
    p.setShader(null);
    p.setImageFilter(null);
    p.setStyle(PaintStyle.Fill);
    p.setBlendMode(BlendMode.Clear);
    this.draw((c) => c.drawRect(Skia.XYWHRect(x, y, w, h), p));
  }

  // ---- chemins ----
  beginPath() {
    this.path = Skia.Path.Make();
  }
  closePath() {
    this.path.close();
  }
  moveTo(x: number, y: number) {
    this.path.moveTo(x, y);
  }
  lineTo(x: number, y: number) {
    this.path.lineTo(x, y);
  }
  rect(x: number, y: number, w: number, h: number) {
    this.path.addRect(Skia.XYWHRect(x, y, w, h));
  }
  arc(x: number, y: number, r: number, a0: number, a1: number, ccw = false) {
    let sweep = a1 - a0;
    if (Math.abs(sweep) >= Math.PI * 2) {
      this.path.addCircle(x, y, r);
      return;
    }
    if (ccw && sweep > 0) sweep -= Math.PI * 2;
    else if (!ccw && sweep < 0) sweep += Math.PI * 2;
    const deg = 180 / Math.PI;
    this.path.arcToOval(Skia.XYWHRect(x - r, y - r, r * 2, r * 2), a0 * deg, sweep * deg, false);
  }
  fill() {
    const p = this.stylePaint(this.st.fillStyle, PaintStyle.Fill);
    p.setAntiAlias(true);
    const path = this.path;
    this.draw((c) => c.drawPath(path, p));
  }
  stroke() {
    const p = this.stylePaint(this.st.strokeStyle, PaintStyle.Stroke);
    const path = this.path;
    this.draw((c) => c.drawPath(path, p));
  }
  clip() {
    const c = this.canvas.target();
    if (!c) return;
    const m = this.st.m;
    const p = this.path.copy();
    if (!isIdentity(m)) p.transform([m[0], m[2], m[4], m[1], m[3], m[5], 0, 0, 1]);
    c.clipPath(p, ClipOp.Intersect, false);
  }

  // ---- dégradés ----
  createLinearGradient(x0: number, y0: number, x1: number, y1: number) {
    return new CanvasGradient('linear', [x0, y0, x1, y1]);
  }
  createRadialGradient(x0: number, y0: number, r0: number, x1: number, y1: number, r1: number) {
    return new CanvasGradient('radial', [x0, y0, r0, x1, y1, r1]);
  }

  // ---- images ----
  drawImage(src: ImageSource, ...n: number[]) {
    const img = src.getSkImage();
    if (!img) return;
    let sx = 0,
      sy = 0,
      sw = src.width,
      sh = src.height,
      dx: number,
      dy: number,
      dw: number,
      dh: number;
    if (n.length >= 8) [sx, sy, sw, sh, dx, dy, dw, dh] = n;
    else if (n.length >= 4) [dx, dy, dw, dh] = n;
    else [dx, dy, dw, dh] = [n[0], n[1], src.width, src.height];
    if (!sw || !sh || !dw || !dh) return;
    const p = this.paint;
    p.setShader(null);
    p.setStyle(PaintStyle.Fill);
    p.setColor(Float32Array.of(0, 0, 0, 1));
    p.setAlphaf(this.st.globalAlpha);
    p.setBlendMode(BLEND[this.st.globalCompositeOperation]);
    this.shadow(p);
    const fm = this.st.imageSmoothingEnabled ? FilterMode.Linear : FilterMode.Nearest;
    this.draw((c) =>
      c.drawImageRectOptions(
        img,
        Skia.XYWHRect(sx, sy, sw, sh),
        Skia.XYWHRect(dx, dy, dw, dh),
        fm,
        MipmapMode.None,
        p
      )
    );
  }

  createImageData(w: number, h: number): ImageDataLike {
    return { width: w, height: h, data: new Uint8ClampedArray(w * h * 4) };
  }
  getImageData(x: number, y: number, w: number, h: number): ImageDataLike {
    const out = this.createImageData(w, h);
    const px = this.canvas.getSkImage()?.readPixels(x, y, {
      width: w,
      height: h,
      colorType: ColorType.RGBA_8888,
      alphaType: AlphaType.Unpremul,
    });
    if (px instanceof Uint8Array) out.data.set(px);
    return out;
  }
  putImageData(id: ImageDataLike, x: number, y: number) {
    const c = this.canvas.target();
    if (!c || !id.width || !id.height) return;
    const bytes = new Uint8Array(id.data.buffer, id.data.byteOffset, id.data.byteLength);
    const img = Skia.Image.MakeImage(
      {
        width: id.width,
        height: id.height,
        colorType: ColorType.RGBA_8888,
        alphaType: AlphaType.Unpremul,
      },
      Skia.Data.fromBytes(bytes),
      id.width * 4
    );
    if (!img) return;
    const p = this.paint;
    p.setShader(null);
    p.setImageFilter(null);
    p.setColor(Float32Array.of(0, 0, 0, 1));
    p.setBlendMode(BlendMode.Src);
    c.drawImage(img, x, y, p);
    this.canvas.touch();
  }
}

/**
 * Équivalent d'un élément <canvas>. Hors écran : surface raster Skia.
 * Toile principale (`main`) : chaque frame est enregistrée dans un SkPicture affiché par <Canvas>.
 */
export class CanvasElement {
  private w = 300;
  private h = 150;
  private surface: SkSurface | null = null;
  private snap: SkImage | null = null;
  private recorder: SkPictureRecorder | null = null;
  private recording: SkCanvas | null = null;
  private listeners = new Map<string, Set<Listener>>();
  private readonly ctx: Context2D;
  /** Taille affichée en points (getBoundingClientRect), pour la toile principale. */
  layout = { width: 0, height: 0 };
  style: Record<string, string> = {};

  constructor(readonly main = false) {
    this.ctx = new Context2D(this);
    if (!main) this.alloc();
  }

  get width() {
    return this.w;
  }
  set width(v: number) {
    this.w = Math.max(0, Math.floor(v));
    this.alloc();
  }
  get height() {
    return this.h;
  }
  set height(v: number) {
    this.h = Math.max(0, Math.floor(v));
    this.alloc();
  }

  private alloc() {
    // Comme dans le navigateur, changer la taille efface la toile et remet le contexte à zéro.
    this.ctx.reset();
    this.snap = null;
    if (this.main) return;
    this.surface = this.w > 0 && this.h > 0 ? Skia.Surface.Make(this.w, this.h) : null;
  }

  getContext() {
    return this.ctx;
  }

  target(): SkCanvas | null {
    if (this.main) return this.recording;
    return this.surface ? this.surface.getCanvas() : null;
  }

  touch() {
    this.snap = null;
  }

  getSkImage(): SkImage | null {
    if (this.main || !this.surface) return null;
    if (!this.snap) this.snap = this.surface.makeImageSnapshot();
    return this.snap;
  }

  beginFrame() {
    if (!this.recorder) this.recorder = Skia.PictureRecorder();
    this.recording = this.recorder.beginRecording(Skia.XYWHRect(0, 0, this.w, this.h));
  }

  endFrame(): SkPicture | null {
    if (!this.recorder || !this.recording) return null;
    this.recording = null;
    return this.recorder.finishRecordingAsPicture();
  }

  getBoundingClientRect() {
    const { width, height } = this.layout;
    return { left: 0, top: 0, x: 0, y: 0, width, height, right: width, bottom: height };
  }

  focus() {}

  addEventListener(type: string, fn: Listener) {
    let set = this.listeners.get(type);
    if (!set) this.listeners.set(type, (set = new Set()));
    set.add(fn);
  }
  removeEventListener(type: string, fn: Listener) {
    this.listeners.get(type)?.delete(fn);
  }
  dispatch(type: string, ev: unknown) {
    this.listeners.get(type)?.forEach((fn) => {
      try {
        fn(ev);
      } catch (e) {
        console.error(e);
      }
    });
  }
}

/** Équivalent de `new Image()` : charge un fichier local (uri) en SkImage. */
export class ImageElement {
  private img: SkImage | null = null;
  complete = false;
  naturalWidth = 0;
  naturalHeight = 0;
  onload: (() => void) | null = null;
  onerror: ((e: unknown) => void) | null = null;
  private source = '';

  constructor(private readonly resolve: (src: string) => Promise<string | null>) {}

  get width() {
    return this.naturalWidth;
  }
  get height() {
    return this.naturalHeight;
  }

  get src() {
    return this.source;
  }
  set src(v: string) {
    this.source = v;
    this.resolve(v)
      .then((uri) =>
        uri ? Skia.Data.fromURI(uri) : Promise.reject(new Error('image introuvable ' + v))
      )
      .then((data) => {
        const img = Skia.Image.MakeImageFromEncoded(data);
        if (!img) throw new Error('image illisible ' + v);
        this.img = img;
        this.naturalWidth = img.width();
        this.naturalHeight = img.height();
        this.complete = true;
        this.onload?.();
      })
      .catch((e: unknown) => this.onerror?.(e));
  }

  getSkImage() {
    return this.img;
  }
}
