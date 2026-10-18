// The tableau's machines as engine items at film time T (LOD by distance from the camera). D4 can use these for its
// last frames so it ends on exactly what E/F show.
import {V3} from '../../../kit/math';
import {Item, View, toView} from '../../engine';
import {combatUnit, heavy, drone, armyItems, standing, UnitSpec} from '../../mech';
import {groundH} from '../../world';
import {persistAt} from '../../film/continuity';
import {ringSpecs, holderSpecs, wreckSpecs, heavy2Spec, heavy1Spec, droneSpecs, streamForm, holdForm, TB_RESERVE, Holder} from './tableau';
import {gripAt} from './crew';

const dist = (v: View, p: V3) => Math.hypot(p.x - v.pos.x, p.y - v.pos.y, p.z - v.pos.z);
const unitLod = (v: View, p: V3): UnitSpec['lod'] => {
  const d = dist(v, p);
  return d < 28 ? 'full' : d < 90 ? 'mid' : 'far';
};
const behind = (v: View, p: V3, margin = 4) => toView(v, p).z < -margin;

/** The holders' hands follow the held person's grip point (straining, sinking, heaving). */
const grip = (h: Holder, T: number): V3 => (h.who && h.who !== 'drone' && h.who !== 'director' && h.who !== 'runner' ? gripAt(h.who, T) : h.at);

export type MachineOpts = {
  /** leave out the avenue streams, the reserve block and the intersection squads (close shots) */
  near?: boolean;
  /** leave out units within r metres of a point (keep a close frame clean) */
  clear?: {p: V3; r: number};
};

// (the streams and squads keep their path tables between frames)
const STREAMS = streamForm();
const HOLDS = holdForm();

export const tableauMachineItems = (v: View, T: number, o: MachineOpts = {}): Item[] => {
  const out: Item[] = [];
  const skipNear = (p: V3) => !!o.clear && Math.hypot(p.x - o.clear.p.x, p.z - o.clear.p.z) < o.clear.r;
  [...ringSpecs(T), ...holderSpecs(T, grip), ...wreckSpecs(T)].forEach((u) => {
    const p = {x: u.pos.x, y: groundH(u.pos.x, u.pos.z) + 1.2, z: u.pos.z};
    if (behind(v, p) || skipNear(u.pos)) return;
    out.push(...combatUnit({...u, lod: unitLod(v, p)}));
  });
  const h2 = heavy2Spec(T);
  if (!behind(v, {...h2.pos, y: 4}, 8)) out.push(...heavy({...h2, lod: dist(v, h2.pos) < 60 ? 'full' : dist(v, h2.pos) < 200 ? 'mid' : 'far'}));
  // the first heavy's wreck across the crater: drawn here only until D3 registers its own (persistItems draws that)
  const d3Heavy = persistAt(T).some((p) => p.sec === 'D3' && p.kind === 'heavy');
  if (!d3Heavy) {
    const h1 = heavy1Spec(T);
    if (!behind(v, {...h1.pos, y: 2}, 10)) out.push(...heavy({...h1, lod: dist(v, h1.pos) < 70 ? 'full' : dist(v, h1.pos) < 220 ? 'mid' : 'far'}));
  }
  droneSpecs(T).forEach((d) => {
    if (behind(v, d.pos, 2)) return;
    out.push(...drone({...d, lod: dist(v, d.pos) < 45 ? 'full' : 'far', scale: dist(v, d.pos) > 120 ? 1.6 : 1}));
  });
  if (!o.near) {
    out.push(...armyItems(v, T, standing(TB_RESERVE), {ground: groundH, maxFull: 4, maxMid: 24, farFrom: 110, ctl: () => ({idle: 0.18, posture: 'ready'})}));
    out.push(...armyItems(v, T, STREAMS, {ground: groundH, maxFull: 2, maxMid: 30, farFrom: 120}));
    out.push(...armyItems(v, T, HOLDS, {ground: groundH, maxFull: 0, maxMid: 12, farFrom: 140, eye: 'amber'}));
  }
  return out;
};
