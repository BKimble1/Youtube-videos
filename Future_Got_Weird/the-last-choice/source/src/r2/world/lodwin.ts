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

export type LodWindow = {t0: number; t1: number; cams: V3[]; /** no low-camera shortcut for blocks behind the frontage inside this window (the crane's rise passes 26 m) */ noShortcut?: boolean};

const sample = (t0: number, t1: number, step: number, cam: (T: number) => V3): V3[] => {
  const out: V3[] = [];
  for (let T = t0; T < t1 + 1e-6; T += step) out.push(cam(T));
  out.push(cam(t1));
  return out;
};

/**
 * Shots whose camera moves only a few metres still flipped a mid-distance building between two window patterns once or several
 * times (handheld drift across a threshold; D1-2: 10 flips in 2.5 s). Their camera boxes [x0, y0, z0, x1, y1, z1] (the
 * positions the camera takes in the shot, ±4 m), baked from the shots' own cameras (tools: a headless pass over every shot at
 * 5-frame steps). The rule never gets coarser than the camera's distance NOW, so a camera that later leaves its box is handled
 * as before. Film seconds, half-open [t0, t1).
 */
const BOXES: [string, number, number, number, number, number, number, number, number][] = [
  ['B3_reveal', 16.76, 21.4, -8.8, 0.8, -1.3, 0.7, 9.4, 7],
  ['B5b_strap', 26.3, 30.26, 2, -2.6, 0, 13.8, 7.6, 10.5],
  ['B6a_halt', 30.26, 32.9, 102, 1.9, 0.5, 112.2, 10, 8.5],
  ['C1_turn', 35.8, 38.46, -1.4, 0.4, -0.7, 7, 8.5, 7.4],
  ['C3_vault', 40.16, 45.3, -1.4, 2.4, -1.5, 6.8, 10.5, 6.8],
  ['C4b_launch', 46.7, 50, -8.7, -0.3, -3.3, 0.1, 8.8, 7.1],
  ['C6c2_threat', 57, 58.05, 70.4, -1.8, 12.6, 78.8, 6.3, 20.8],
  ['D1-2', 64, 66.5, 13.9, -3.1, -1.2, 34.6, 5.1, 9.4],
  ['D1-2b', 66.5, 68.3, 25.5, -2.5, -5.8, 41.4, 5.5, 2.9],
  ['D1-7b', 83.9, 85.64, 33.4, -1, -0.8, 41.9, 7.1, 7.3],
  ['D3-5', 128.02, 131.02, 62, -0.7, -11.4, 71.3, 25.7, 3.2],
  ['D3-6', 131.02, 133.82, 34.1, 8, 10.2, 42.4, 16.2, 18.4],
  ['D3-7a', 133.82, 135.3, 40.4, -1.7, -4.4, 48.9, 7, 4.5],
  ['D3-10c', 144.25, 145.18, 65.6, -0.4, -7.2, 75.2, 7.7, 1.1],
  ['D3-11a', 145.18, 146.3, 31.9, -0.5, 1.2, 40.6, 7.9, 10.1],
  ['D4-1a', 149.86, 152.5, 20.2, 0.2, 5, 29.6, 8.6, 13.6],
  ['D4-2a', 154.5, 156.7, 17.3, -3.1, 8, 26.4, 5, 16.6],
  ['D4-5', 166.41, 169.06, 5.5, -2.4, 0.9, 13.8, 5.6, 9.1],
  ['D4-6a', 170.4, 172.6, 7, 19.6, 9.8, 15.4, 29, 18.6],
  ['D4-8', 177.45, 179.3, 4.3, -2.4, 2.9, 13.4, 8.1, 12.9],
];
const boxCams = (b: number[]): V3[] => {
  const out: V3[] = [];
  for (const x of [b[0], (b[0] + b[3]) / 2, b[3]]) for (const y of [b[1], (b[1] + b[4]) / 2, b[4]]) for (const z of [b[2], (b[2] + b[5]) / 2, b[5]]) out.push({x, y, z});
  return out;
};

let WINDOWS: LodWindow[] | null = null;
const windows = (): LodWindow[] => {
  if (WINDOWS) return WINDOWS;
  WINDOWS = [
    // E2 → F1: the same scene through one camera, from the extreme close-up to the final pullback (E2 starts at M.RING_END)
    {t0: M.RING_END, t1: M.CARD_IN, cams: sample(M.RING_END, M.CARD_IN, 0.5, (T) => camF1(T).pos), noShortcut: true},
    ...BOXES.map(([, t0, t1, ...b]): LodWindow => ({t0, t1: t1 - 1e-6, cams: boxCams(b)})),
  ];
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
