// Shared 3D -> SVG drawing: draw items (painter-sorted), lighting and colour ramps.
import {add3, Basis, dot3, len3, mul3, norm3, P2, proj, sub3, V2, V3} from './three';
import {mix} from './color';
import {clamp} from '../lib';

/** one SVG element, sorted far -> near by z (camera depth) */
export type Item = {
  z: number;
  d: string;
  fill?: string;
  op?: number;
  stroke?: string;
  sw?: number;
  /** stroke-linejoin/cap round */
  round?: boolean;
  /** a linear gradient fill (user space), used for smooth shading across a band */
  grad?: Grad;
};
export type Grad = {x1: number; y1: number; x2: number; y2: number; stops: [number, string][]};

/** gradient stops from sampled (screen point, colour) pairs projected onto the axis a -> b; offsets kept monotonic */
export const gradFrom = (a: V2, b: V2, samples: {p: V2; c: string}[]): Grad => {
  const dx = b.x - a.x, dy = b.y - a.y;
  const L2 = dx * dx + dy * dy || 1;
  const st: [number, string][] = samples.map((q) => [clamp(((q.p.x - a.x) * dx + (q.p.y - a.y) * dy) / L2), q.c]);
  st.sort((p, q) => p[0] - q[0]);
  return {x1: a.x, y1: a.y, x2: b.x, y2: b.y, stops: st};
};

export type Light = {
  /** a point light near the camera, to its upper left (the house light direction on screen), with distance falloff */
  pos: V3;
  /** distance at which the light falls to half */
  d0: number;
  /** camera depth where fog starts, and the depth over which it closes in */
  fog0: number;
  fogLen: number;
  fogColor: string;
  /** overall exposure */
  gain?: number;
};

/** the light for a camera: up and to the left of the eye, a little behind it */
export const lightFor = (B: Basis, dist: number, opts: Partial<Light> = {}): Light => ({
  pos: add3(B.eye, add3(add3(mul3(B.r, -0.75 * dist), mul3(B.u, 0.95 * dist)), mul3(B.fw, -0.15 * dist))),
  d0: dist * 1.9,
  fog0: dist * 1.15,
  fogLen: dist * 2.6,
  fogColor: '#1A0815',
  ...opts,
});

/** colour along a ramp (dark -> light), v in [0, 1] */
export const ramp = (cols: string[], v: number) => {
  const x = clamp(v) * (cols.length - 1);
  const i = Math.min(cols.length - 2, Math.floor(x));
  return mix(cols[i], cols[i + 1], x - i);
};

export type ShadeOpts = {spec?: number; specPow?: number; rim?: number; rimColor?: string; amb?: number; tint?: [string, number]};
/** shade a surface point: diffuse from the light, headlamp falloff, specular sheen, rim, fog by camera depth */
export const shadeAt = (B: Basis, L: Light, cols: string[], p: V3, n: V3, o: ShadeOpts = {}) => {
  const toL = sub3(L.pos, p);
  const dl = len3(toL);
  const l = mul3(toL, 1 / dl);
  const v = norm3(sub3(B.eye, p));
  const diff = Math.max(0, dot3(n, l));
  const att = 1.25 / (1 + (dl / L.d0) ** 2);
  const amb = o.amb ?? 0.16;
  let I = (amb + (1 - amb) * diff ** 0.85) * att * (L.gain ?? 1);
  let c = ramp(cols, I);
  if (o.tint) c = mix(c, o.tint[0], o.tint[1]);
  if (o.rim) {
    const r = (1 - Math.max(0, dot3(n, v))) ** 3 * o.rim * att;
    c = mix(c, o.rimColor ?? '#BFF6F2', clamp(r));
  }
  if (o.spec) {
    const h = norm3(add3(l, v));
    const s = Math.max(0, dot3(n, h)) ** (o.specPow ?? 40) * o.spec * att;
    c = mix(c, '#FFFFFF', clamp(s));
  }
  const z = dot3(sub3(p, B.eye), B.fw);
  const f = clamp((z - L.fog0) / L.fogLen);
  return mix(c, L.fogColor, f * f * (3 - 2 * f));
};
export const fogAmt = (B: Basis, L: Light, p: V3) => {
  const z = dot3(sub3(p, B.eye), B.fw);
  const f = clamp((z - L.fog0) / L.fogLen);
  return f * f * (3 - 2 * f);
};

export const depthOf = (B: Basis, p: V3) => dot3(sub3(p, B.eye), B.fw);
/** a projected polygon path (no near clipping: callers keep geometry in front of the camera) */
export const polyD = (pts: V2[]) => `M${pts.map(P2).join('L')}Z`;
export const lineD = (pts: V2[]) => `M${pts.map(P2).join('L')}`;
export const projAll = (B: Basis, pts: V3[]) => pts.map((p) => proj(B, p));
/** is the surface facing the camera */
export const facing = (B: Basis, p: V3, n: V3) => dot3(n, sub3(B.eye, p)) > 0;
