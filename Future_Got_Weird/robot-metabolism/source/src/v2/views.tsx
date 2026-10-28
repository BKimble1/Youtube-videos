// V2 views: the lab-floor station (a large gridded test mat, the lab wall far behind with a rack of spare links)
// and the ramp. The floor grid is continuous, so the pair at H and the pair at H2 sit on identical ground.
import {box, Item, line, poly, Proj} from '../lib/r3';
import {v3, V3} from '../lib/v3';
import {COL, contactCue, Link, linkItems, shadowItems} from '../rig/truss';
import {ENV} from '../world/benchArt';
import {rampArt} from '../world/ramp';
import {earlyState, lateState} from './yard';
import {ramp2State} from './ramp2';

const MAT = {x0: -3.2, x1: 2.4, z0: -0.9, z1: 1.6};
const WZ = -1.25;

export const yardArt = (P: Proj): (Item | null)[] => {
  const out: (Item | null)[] = [];
  out.push(poly(P, [v3(-6, 0, WZ), v3(6, 0, WZ), v3(6, 2.6, WZ), v3(-6, 2.6, WZ)], ENV.wall, {layer: 0, stroke: null, depthBias: 100}));
  out.push(poly(P, [v3(-6, -1, WZ + 0.001), v3(6, -1, WZ + 0.001), v3(6, 0.0, WZ + 0.001), v3(-6, 0.0, WZ + 0.001)], ENV.panel, {layer: 0, stroke: null, depthBias: 99}));
  // the rack repeats every 1.25 m (the distance between H and H2), so both pairs see the same wall
  for (let k = -4; k <= 3; k++) out.push(...box(P, v3(0.3 + k * 1.25, 0.95, WZ + 0.07), v3(0.42, 0.01, 0.07), {top: ENV.shelf, side: ENV.woodFront, front: ENV.woodFront}, {layer: 0}));
  out.push(poly(P, [v3(-6, 0, WZ), v3(6, 0, WZ), v3(6, 0, 3), v3(-6, 0, 3)], ENV.wood, {layer: 1, stroke: null, depthBias: 70}));
  out.push(poly(P, [v3(MAT.x0, 0.0002, MAT.z0), v3(MAT.x1, 0.0002, MAT.z0), v3(MAT.x1, 0.0002, MAT.z1), v3(MAT.x0, 0.0002, MAT.z1)], ENV.mat, {layer: 1, sw: 2.4, depthBias: 60}));
  for (let x = MAT.x0; x <= MAT.x1 + 1e-6; x += 0.05) {
    const bold = Math.abs(Math.round(x / 0.25) * 0.25 - x) < 1e-6;
    out.push(line(P, [v3(x, 0.0004, MAT.z0), v3(x, 0.0004, MAT.z1)], bold ? ENV.matBold : ENV.matLine, bold ? 2.2 : 1.1, {layer: 1, depthBias: 50}));
  }
  for (let z = MAT.z0; z <= MAT.z1 + 1e-6; z += 0.05) {
    const bold = Math.abs(Math.round(z / 0.25) * 0.25 - z) < 1e-6;
    out.push(line(P, [v3(MAT.x0, 0.0004, z), v3(MAT.x1, 0.0004, z)], bold ? ENV.matBold : ENV.matLine, bold ? 2.2 : 1.1, {layer: 1, depthBias: 50}));
  }
  return out;
};

/** spare links lying on the wall rack (static, dark) */
const rackLinks = (): Link[] => {
  const L: Link[] = [];
  const zz = WZ + 0.07;
  for (let r = -4; r <= 3; r++)
    for (let k = 0; k < 2; k++) {
      const x0 = 0.3 + r * 1.25 - 0.36 + k * 0.4;
      L.push({id: `K${r + 4}${k}`, a: v3(x0, 0.98, zz), b: v3(x0 + 0.29, 0.98, zz), band: k === 1 ? COL.bandR : COL.bandT, led: 0});
    }
  return L;
};

const robots = (P: Proj, links: Link[], extra: Link[], cues: [V3, number][]): (Item | null)[] => [
  ...shadowItems(P, [...links, ...extra]),
  ...rackLinks().flatMap((l) => linkItems(P, l, {layer: 0})),
  ...extra.flatMap((l) => linkItems(P, l)),
  ...links.flatMap((l) => linkItems(P, l)),
  ...cues.map(([c, k]) => contactCue(P, c, k)),
];

export const earlyItems = (P: Proj, t: number, mod?: (l: Link) => Link): (Item | null)[] => {
  const s = earlyState(t);
  const links = mod ? s.links.map(mod) : s.links;
  const extra = [...s.D, ...(s.pair ? [] : []), ...(s.pair ? [s.S] : [])];
  return [...yardArt(P), ...robots(P, links, extra, s.cues)];
};

export const lateItems = (P: Proj, t: number): (Item | null)[] => {
  const s = lateState(t);
  const p = s.pair;
  return [...yardArt(P), ...robots(P, [...s.links, ...p.links], p.D, [...s.cues, [p.tet.V0, p.cue1], [p.tet.V1, p.cue2]])];
};

export const rampItems2 = (P: Proj, Pw: Proj, t: number): (Item | null)[] => {
  const s = ramp2State(t);
  return [...rampArt(P, Pw), ...shadowItems(P, s.links), ...s.links.flatMap((l) => linkItems(P, l))];
};
