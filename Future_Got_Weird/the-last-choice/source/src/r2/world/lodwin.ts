// (R4) Level-of-detail windows: long camera moves during which a building must not change its level of detail.
//
// setItems() picks a building's detail by its distance from the camera (city.ts lodFor). On a long move that switches
// the building's whole window pattern (lod 0 draws each window, lod 1 pairs, lod 2 a ribbon every third storey) and its
// roof kit, tank and rebar in one frame: the aerial's skyline and the final pullback showed it as buildings that
// "popped". Inside a window every building keeps the finest level the camera ever asks of it during the window, so
// nothing changes while the camera travels (the finer mesh costs a few more faces at the start, nothing else).
//
// A window is {t0, t1} in film seconds with the camera path sampled (positions only). Outside every window the old
// per-frame distance rule applies unchanged. The windows read the shots' own pure camera functions, so they follow
// the camera if it is retuned.
import {V3} from '../../kit/math';
import {M} from '../timing';
import {camF1} from '../shots/EF/camera';
import type {Bldg} from './city';

export type LodWindow = {t0: number; t1: number; cams: V3[]};

const sample = (t0: number, t1: number, step: number, cam: (T: number) => V3): V3[] => {
  const out: V3[] = [];
  for (let T = t0; T < t1 + 1e-6; T += step) out.push(cam(T));
  out.push(cam(t1));
  return out;
};

let WINDOWS: LodWindow[] | null = null;
/** E2 → F1: the same scene through one camera, from the extreme close-up to the final pullback (E2 starts at M.RING_END) */
const windows = (): LodWindow[] => {
  if (WINDOWS) return WINDOWS;
  WINDOWS = [{t0: M.RING_END, t1: M.CARD_IN, cams: sample(M.RING_END, M.CARD_IN, 0.5, (T) => camF1(T).pos)}];
  return WINDOWS;
};

/** the window film time T falls in (or null) */
export const lodWindowAt = (T: number): LodWindow | null => windows().find((w) => T >= w.t0 && T <= w.t1) ?? null;

/** how much closer than the sampled path the rule assumes the lens can be (handheld drift and the gaps between samples) */
const MARGIN = 1.5;
/** smallest distance from a point to any camera position of the window, less a small margin */
export const minDistTo = (cams: V3[], p: V3): number => {
  let d = 1e12;
  for (const c of cams) { const q = Math.hypot(p.x - c.x, p.y - c.y, p.z - c.z); if (q < d) d = q; }
  return d - MARGIN;
};

const CACHE = new WeakMap<V3[], Map<string, number>>();
/** a building's distance for the level-of-detail rule over a set of camera positions (cached per set) */
export const envelopeDist = (cams: V3[], b: Bldg, c: V3): number => {
  let m = CACHE.get(cams);
  if (!m) { m = new Map(); CACHE.set(cams, m); }
  let d = m.get(b.id);
  if (d === undefined) { d = minDistTo(cams, c); m.set(b.id, d); }
  return d;
};
