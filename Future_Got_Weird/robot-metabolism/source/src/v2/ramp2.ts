// V2 ramp: the same 10-degree ramp (fixed 10 cm marks). One continuous side-tracking view of one robot:
//   first it crawls down with its own links while the new stick S trails behind, dragged (slow): the front edge
//   reaches (rear links stretch, the rear vertex stays), then the rear vertex follows (they shrink) and drags S;
//   then it rears up onto S about its front edge ("becomes a walking stick"): S takes part of the weight;
//   then S pushes with its tip planted, stroke after stroke ("helping the robot move faster downhill").
import {ss5, v3} from '../lib/v3';
import {E, T} from '../lib/time';
import {COL, GY, Link} from '../rig/truss';
import {EDGES, lensAdd, tetra} from '../rig/body';
import {bodyTravel, strokes, tipTravel} from '../rig/gait';
import {FINAL} from './pair';
import {EARLY_END} from './yard';

export const RA0 = EARLY_END;
const X0 = 1.18;
const HALF = 0.165;
const dOf = (L: number) => Math.sqrt(Math.max(0, L * L - HALF * HALF));
const LC = 0.38;
const TILT = (27 * Math.PI) / 180;
export const RAMP_EV = {
  c1: [RA0 + 0.05, RA0 + 0.42, RA0 + 0.45, RA0 + 0.82] as [number, number, number, number],
  rear0: T('becomes a walking') + 0.45,
  rear1: E('stick') + 0.2,
  push0: T('helping') + 0.02,
};
const S1 = strokes(RAMP_EV.push0, 5, 0.47, 0.09);
const V1X0 = X0 + dOf(0.33);
const TIP0 = V1X0 + 0.28;

export const ramp2State = (t: number) => {
  const [s0, s1, r0, r1] = RAMP_EV.c1;
  const L = 0.33 + (LC - 0.33) * (ss5(s0, s1, t) - ss5(r0, r1, t));
  const tilt = TILT * ss5(RAMP_EV.rear0, RAMP_EV.rear1, t);
  // reach: the rear vertex holds, the front edge moves; after that the front edge holds while the rear follows,
  // and later the pushes carry the whole body
  const fx = t < r0 ? V1X0 - dOf(L) : V1X0 - dOf(LC) - bodyTravel(S1, t);
  const wob = Math.sin(t * 9) * 0.006;
  const tet = tetra(lensAdd(FINAL, {l01: L - 0.33, l12: L - 0.33, l03: wob, l23: -wob}), {x: fx, z: 0.0, yaw: 0, tilt});
  // the stick: dragged by the rear vertex as it follows; planted while it props and pushes, sliding between pushes
  const drag = t < r0 ? 0 : V1X0 - (V1X0 - dOf(LC) + dOf(L));
  const tip = v3(TIP0 - drag - tipTravel(S1, t), GY, 0);
  const links: Link[] = EDGES.map(([a, b], i) => {
    const isM = a === 'V0' && b === 'V1';
    const flip = i % 2 === 1;
    return {id: isM ? 'M' : `T${i}`, a: isM ? tet.V0 : flip ? tet[b] : tet[a], b: isM ? tet.V1 : flip ? tet[a] : tet[b], band: isM ? COL.bandX : COL.bandT, led: 1};
  });
  const S: Link = {id: 'S', a: tet.V1, b: tip, band: COL.bandS, led: 1};
  return {tet, links: [...links, S], fx};
};
