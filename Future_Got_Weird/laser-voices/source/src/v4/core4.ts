// V4 core: the locked timeline (narration words, captions), easing, keyed tracks and the 3D camera path.
import tl from '../data/timeline.json';
import {basis, Cam, B, V3, v3} from './rig/geo4';

export const FPS = tl.fps;
export const FRAMES = tl.frames;
export const DUR = tl.duration;
type Word = {word: string; start: number; end: number};
export const WORDS: Word[] = tl.words as Word[];
export const CAPTIONS = tl.captions as {text: string; emph: string[]; start: number; end: number; show: number; hide: number}[];
export const w = (i: number) => WORDS[i].start;
export const we = (i: number) => WORDS[i].end;
export const W = 1080, H = 1920;
// the locked obstruction frames (the narration's "stops" and the gap before "You hear it again")
export const T_BLOCK = 815 / FPS, T_CLEAR = 958 / FPS;

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const inv = (a: number, b: number, x: number) => clamp((x - a) / (b - a));
export const ss = (a: number, b: number, x: number) => {
  const t = inv(a, b, x);
  return t * t * (3 - 2 * t);
};
export const eio = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const eout = (t: number) => 1 - Math.pow(1 - t, 3);
export const ein = (t: number) => t * t * t;
export const win = (t: number, a: number, b: number, c: number, d: number) => clamp(Math.min(inv(a, b, t), 1 - inv(c, d, t)));
export const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
/** scalar keyed track: [t, value, ease?] (ease shapes the segment ending at that key; default smoothstep) */
export const kv = (t: number, keys: [number, number, ((x: number) => number)?][]) => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const [t0, a] = keys[i - 1], [t1, b, e] = keys[i];
      const u = (t - t0) / (t1 - t0 || 1);
      return a + (b - a) * (e ?? ((x: number) => x * x * (3 - 2 * x)))(u);
    }
  }
  return keys[keys.length - 1][1];
};
// periodic idle: whole cycles over the film, so it is continuous across the loop
export const cyc = (t: number, hz: number, ph = 0) => Math.sin((2 * Math.PI * Math.max(1, Math.round(hz * DUR)) * t) / DUR + ph);

// ---------------------------------------------------------------- 3D camera path
// Keys: position, look-at target (or yaw/pitch), focal length (px), roll. Every channel is a C1 cubic Hermite with
// Catmull-Rom tangents (zero at the ends and at 'hold' keys), so speed is continuous through keys.
export type CK = {t: number; pos: V3; at: V3; f: number; roll?: number; hold?: boolean};
const herm = (keys: CK[], get: (k: CK) => number, t: number) => {
  const n = keys.length;
  if (t <= keys[0].t) return get(keys[0]);
  if (t >= keys[n - 1].t) return get(keys[n - 1]);
  let i = 0;
  while (i < n - 2 && t > keys[i + 1].t) i++;
  const k0 = keys[i], k1 = keys[i + 1], h = k1.t - k0.t, s = (t - k0.t) / h;
  const tan = (j: number) => {
    if (j <= 0 || j >= n - 1 || keys[j].hold) return 0;
    const a = keys[j - 1], c = keys[j + 1];
    return (get(c) - get(a)) / (c.t - a.t);
  };
  const m0 = tan(i), m1 = tan(i + 1);
  const h00 = 2 * s ** 3 - 3 * s ** 2 + 1, h10 = s ** 3 - 2 * s ** 2 + s, h01 = -2 * s ** 3 + 3 * s ** 2, h11 = s ** 3 - s ** 2;
  return h00 * get(k0) + h10 * h * m0 + h01 * get(k1) + h11 * h * m1;
};
export const camPath = (keys: CK[], t: number): Cam => {
  const pos = v3(herm(keys, (k) => k.pos.x, t), herm(keys, (k) => k.pos.y, t), herm(keys, (k) => k.pos.z, t));
  const at = v3(herm(keys, (k) => k.at.x, t), herm(keys, (k) => k.at.y, t), herm(keys, (k) => k.at.z, t));
  const f = Math.exp(herm(keys, (k) => Math.log(k.f), t));
  const roll = herm(keys, (k) => k.roll ?? 0, t);
  return lookCam(pos, at, f, roll);
};
export const lookCam = (pos: V3, at: V3, f: number, roll = 0): Cam => {
  const d = v3(at.x - pos.x, at.y - pos.y, at.z - pos.z);
  const yaw = (Math.atan2(d.x, d.z) * 180) / Math.PI, pitch = (Math.atan2(d.y, Math.hypot(d.x, d.z)) * 180) / Math.PI;
  return {pos, yaw, pitch, f, cx: W / 2, cy: H / 2, roll};
};
export {basis, v3};
export type {B, Cam, V3};
