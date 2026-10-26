// The research hardware, in the insect's body frame (mm). Simplified from the Paraborg description (Le et al., Adv. Sci.
// 2026; UQ/UNSW): a removable electronic backpack (stimulator board + coin cell) with fine wires to electrodes at the
// antenna bases and cerci; on the medic insect a launch tube on top holds a spring-loaded auto-injector, latched by a line
// tied through the tube mouth and released when a heated nichrome wire cuts that line; on the observer insect a small
// Wi-Fi camera faces forward.
import {V3, Frame, toW} from '../lib/v3';
import {loftPoint, loftNormal} from '../lib/loft';
import {PLATES, PRONOTUM} from './roach';
import {add, mul} from '../lib/v3';

export const PACK = {
  saddle: {c: [1, 21.7, 0] as V3, h: [16.5, 0.7, 9.5] as V3},
  board: {c: [1, 23.0, 0] as V3, h: [13.5, 0.8, 8] as V3},
  chipA: {c: [8.5, 24.3, -4.2] as V3, h: [2.6, 0.55, 2.2] as V3},
  chipB: {c: [-6, 24.3, 4.4] as V3, h: [2.2, 0.55, 1.8] as V3},
  cell: {c: [-6.5, 24.0, -4.6] as V3, r: 3.6, h: 1.4}, // coin cell, axis y
  tube: {a: [-11, 27.3, 0] as V3, b: [24.5, 27.3, 0] as V3, r: 3.4}, // launch tube, axis x, clear plastic
  clamps: [-4.5, 15.5], // tube clamps (x)
  cam: {c: [19.5, 27.0, 0] as V3, h: [5.2, 4.0, 4.6] as V3, lens: 2.6}, // camera module (observer insect)
  aerial: {a: [-9, 24.6, 5.5] as V3, b: [-15, 36, 7.5] as V3},
};
/** the injector, in its own frame: x along the needle, origin at the rear of the barrel (mm) */
export const INJ = {
  barrelLen: 17, barrelR: 2.25, plungerLen: 3.2, collarAt: 17.6, collarR: 2.6, needleLen: 6.5, needleR: 0.22,
  /** loaded position of the injector's rear in the body frame, along the tube axis */
  loadedRear: 6.2,
};
/** spring between the tube's rear plug (x = tube.a + 1.5) and the injector rear */
export const springEnds = (injRearX: number): [number, number] => [PACK.tube.a[0] + 1.5, injRearX];

const onShell = (d: typeof PLATES, f: Frame, u: number, th: number, lift = 0.7): V3 => {
  const p = loftPoint(f, d, u, th), n = loftNormal(f, d, u, th);
  return add(p, mul(n, lift));
};
/** stimulation wires (world points), each ending at its electrode */
export const wires = (f: Frame) => {
  const local = (p: V3) => toW(f, p);
  const ant = (sd: 1 | -1): V3[] => [
    local([13.5, 23.2, 6.5 * sd]),
    onShell(PRONOTUM, f, 0.66, Math.PI / 2 - 0.5 * sd, 0.8),
    onShell(PRONOTUM, f, 0.9, Math.PI / 2 - 0.62 * sd, 0.8),
    local([33.2, 12.2, 5.0 * sd]),
  ];
  const cer = (sd: 1 | -1): V3[] => [
    local([-12.5, 23.0, 6.8 * sd]),
    onShell(PLATES, f, 0.5, Math.PI / 2 - 0.3 * sd),
    onShell(PLATES, f, 0.32, Math.PI / 2 - 0.35 * sd),
    onShell(PLATES, f, 0.15, Math.PI / 2 - 0.42 * sd),
    onShell(PLATES, f, 0.04, Math.PI / 2 - 0.6 * sd),
    local([-43.2, 8.8, 3.8 * sd]),
  ];
  return {antL: ant(-1), antR: ant(1), cerL: cer(-1), cerR: cer(1)};
};
export type WireKey = 'antL' | 'antR' | 'cerL' | 'cerR';
