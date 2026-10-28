// V3 Truss Link rig.
//
// A link is an actuator between the centres of its two connector balls (its length Lp, 0.25-0.40 m: about 28 cm
// contracted and 43 cm extended overall, as in the paper). Along its axis, from the motor end: ball, neck, motor block,
// housing (fixed length), inner rod (slides out of the housing), ball. Nothing on a link ever changes size except the
// rod's exposed length.
//
// A joint is a point J where several link ends meet. Each end's ball sits on the line from J toward that link's other
// end, at the distance that makes it touch the balls already there, in the order the links attached:
//   the first two balls touch each other (equal distances from J),
//   every later ball takes the outermost distance along its ray at which it touches an earlier ball (down to J
//   itself: a link joining from the back nests into the middle of the cluster, touching the balls around it).
// A ball that attaches later therefore never moves the balls already in the cluster, and the cluster is a tight knot
// of touching magnets (the paper's free-form connectors: a spherical magnet turns in its holder to meet a partner).
//
// Choreography modules describe joints and free ends; resolve() turns them into ball centres and link lengths.
import {add, dot, len, mul, norm, sub, V3, v3} from '../lib/v3';

export const RB = 0.017; // connector ball radius
export const L_MIN = 0.25;
export const L_MAX = 0.4;
export const R_NECK = 0.0072;
export const R_MOTOR = 0.016;
export const R_HOUS = 0.0135;
export const R_ROD = 0.007;
/** stations along the axis from the motor-end ball centre (m) */
export const S_NECK0 = Math.sqrt(RB * RB - R_NECK * R_NECK);
export const S_M0 = 0.034;
export const S_M1 = 0.079;
export const S_H1 = 0.168;
export const S_ROD_IN = Math.sqrt(RB * RB - R_ROD * R_ROD); // the rod meets the far ball here (from that ball's centre)

export const COL = {
  housing: '#4C5D72',
  motor: '#3A4859',
  rod: '#C6D1DA',
  shell: '#E9EEF1',
  magnetWin: '#2D3A47',
  ledOn: '#45E38E',
  ledIdle: '#F2B84A',
  ledFail: '#F0574A',
  ledOff: '#2B3742',
  bandT: '#8DB6D6', // the robot's own links
  bandX: '#F2A23C', // the part it takes in the hook
  bandS: '#E8705E', // the walking stick
  bandR: '#2EB5A5', // the replacement
  bandB: '#A4ADB6', // the broken robot
};

export type EndSpec = {j: string} | {p: V3};
export type LinkSpec = {
  id: string;
  a: EndSpec; // motor end
  b: EndSpec; // rod end
  band: string;
  /** status light: colour and brightness 0..1 */
  led: number;
  ledCol?: string;
  /** rotation about its own axis (rad), e.g. while rolling */
  roll?: number;
  /** housing cut-away 0..1 */
  cut?: number;
  /** connector cut-away at end a / b, 0..1 */
  secA?: number;
  secB?: number;
  /** magnet direction at end a / b (world); default: toward the cluster centre when joined, straight out when free */
  winA?: V3;
  winB?: V3;
  /** magnet pulled back into its shell (0..1): letting go */
  relA?: number;
  relB?: number;
  crack?: boolean;
  /** the rod-end ball snapped off (broken robot) */
  noBallB?: boolean;
  /** dull (dead) finish */
  dead?: boolean;
};

export type RigState = {
  joints: Record<string, V3>;
  /** attach order of the ends at each joint: "linkId:a" / "linkId:b" */
  order: Record<string, string[]>;
  links: LinkSpec[];
};

export type ResolvedLink = LinkSpec & {Ca: V3; Cb: V3; Lp: number; u: V3; jA?: string; jB?: string};
export type Resolved = {links: ResolvedLink[]; balls: Record<string, {key: string; c: V3}[]>; joints: Record<string, V3>};

/** distances of the balls from J along unit directions us (attach order) */
export const clusterDeltas = (us: V3[]): number[] => {
  const n = us.length;
  const d = new Array(n).fill(RB);
  if (n < 2) return d;
  const c01 = Math.max(-1, Math.min(1, dot(us[0], us[1])));
  const s = Math.sqrt((1 - c01) / 2); // sin(theta / 2)
  d[0] = d[1] = Math.min(0.09, RB / Math.max(1e-3, s));
  for (let k = 2; k < n; k++) {
    // the outermost point along its line where it touches an earlier ball; for a link joining from behind this can be
    // at or just past J (the ball nests into the middle of the cluster, touching the balls around it)
    let best = -Infinity;
    for (let j = 0; j < k; j++) {
      const c = Math.max(-1, Math.min(1, dot(us[k], us[j])));
      const q = 4 * RB * RB - d[j] * d[j] * (1 - c * c);
      best = Math.max(best, d[j] * c + Math.sqrt(Math.max(0, q)));
    }
    d[k] = best;
  }
  return d;
};

/** ball centres of a cluster at J (attach order). Along each ball's line first (clusterDeltas); a later ball whose line
 *  passes just wide of its neighbours (by a few millimetres, as joint angles open) is drawn the rest of the way into
 *  contact, toward a smoothly weighted blend of its nearest neighbours (continuous: no switching between neighbours) */
export const clusterBalls = (J: V3, us: V3[]): V3[] => {
  const ds = clusterDeltas(us);
  const C = us.map((u, i) => add(J, mul(u, ds[i])));
  for (let k = 2; k < C.length; k++) {
    const d = C.slice(0, k).map((c) => len(sub(C[k], c)));
    const dmin = Math.min(...d);
    const loose = dmin - 2 * RB;
    if (loose <= 1e-6) continue;
    const w = d.map((x) => Math.exp(-(x - dmin) / 0.002));
    const ws = w.reduce((a, b) => a + b, 0);
    let T = v3(0, 0, 0);
    C.slice(0, k).forEach((c, j) => {
      const q = add(c, mul(sub(C[k], c), (2 * RB) / d[j]));
      T = add(T, mul(q, w[j] / ws));
    });
    C[k] = add(C[k], mul(sub(T, C[k]), Math.min(1, loose / 0.0015)));
  }
  return C;
};

const endRef = (st: RigState, e: EndSpec): V3 => ('j' in e ? st.joints[e.j] : e.p);

export const resolve = (st: RigState): Resolved => {
  const ball: Record<string, V3> = {};
  const balls: Resolved['balls'] = {};
  for (const [jid, keys] of Object.entries(st.order)) {
    const J = st.joints[jid];
    const us = keys.map((k) => {
      const [lid, end] = k.split(':');
      const l = st.links.find((x) => x.id === lid);
      if (!l) throw new Error(`joint ${jid}: no link ${lid}`);
      const other = end === 'a' ? l.b : l.a;
      return norm(sub(endRef(st, other), J));
    });
    const cs = clusterBalls(J, us);
    balls[jid] = keys.map((k, i) => {
      ball[k] = cs[i];
      return {key: k, c: cs[i]};
    });
  }
  const links: ResolvedLink[] = st.links.map((l) => {
    const Ca = 'j' in l.a ? ball[`${l.id}:a`] : l.a.p;
    const Cb = 'j' in l.b ? ball[`${l.id}:b`] : l.b.p;
    if (!Ca || !Cb) throw new Error(`link ${l.id}: an end is on a joint that does not list it`);
    const d = sub(Cb, Ca);
    const Lp = len(d);
    return {...l, Ca, Cb, Lp, u: mul(d, 1 / Lp), jA: 'j' in l.a ? l.a.j : undefined, jB: 'j' in l.b ? l.b.j : undefined};
  });
  return {links, balls, joints: st.joints};
};

/** joint distance that gives a link length Lp between two joints whose balls sit at d1, d2 from them (collinear) */
export const jdist = (Lp: number, d1: number, d2: number) => Lp + d1 + d2;
/** nominal ball distance in a three-ball cluster at 60 degrees */
export const D60 = 2 * RB;

export {v3};
