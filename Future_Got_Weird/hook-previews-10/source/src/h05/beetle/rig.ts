// HOOK 05: the bombardier beetle rig. Brachinus (a ground beetle, Carabidae: Brachininae), about 1 cm long.
// Body coordinates in mm: x forward, y left, z dorsal; origin at the scutellum (pronotum / elytra junction).
// Anatomy: orange-red prognathous head with compound eyes, sickle mandibles, maxillary palps and long filiform
// 11-segment antennae; an orange cordiform pronotum; truncate blue-black elytra that leave the tip of the abdomen
// exposed; orange legs (coxa, trochanter, femur, tibia with apical spurs, five tarsomeres and paired claws) from the
// three thoracic segments; a mobile abdominal tip that carries the openings of the paired pygidial glands.
import {add3, cross3, dot3, len3, lerp3, mul3, norm3, sub3, V3} from '../../shared/three';
import {dirW, Frame, pitchF, rotA, toW, yawF} from '../core/frame';
import {ik2} from '../ant/rig';

export const LEGS = [0, 1, 2, 3, 4, 5] as const; // L1 R1 L2 R2 L3 R3
export const side = (i: number) => (i % 2 === 0 ? 1 : -1);
export const pair = (i: number) => Math.floor(i / 2);

/** coxal sockets (one side, y > 0), under pro-, meso- and metathorax */
export const SOCK: V3[] = [[1.05, 0.42, -0.52], [-0.1, 0.6, -0.66], [-0.85, 0.62, -0.72]];
export const LEN = {coxa: [0.45, 0.42, 0.55], femur: [1.85, 2.0, 2.45], tibia: [1.75, 1.95, 2.4], tarsus: [1.45, 1.65, 2.05]};
export const RAD = {coxa: 0.3, femur: [[0.27, 0.17], [0.22, 0.16], [0.24, 0.17]], tibia: [0.15, 0.12], tarsus: [0.1, 0.06]};
/** standing foot positions (body coordinates, before the floor) */
export const REST_FOOT: V3[] = [[3.6, 3.1, -1.6], [3.6, -3.1, -1.6], [0.4, 4.15, -1.6], [0.4, -4.15, -1.6], [-4.1, 3.75, -1.6], [-4.1, -3.75, -1.6]];
export const BODY_H = 1.55; // height of the body origin over the ground

export const NECK: V3 = [1.92, 0, 0.02];
export const HEAD_C: V3 = [0.86, 0, 0.0]; // head centre in head coordinates (origin at the neck)
export const HEAD_AX: V3 = [0.98, 0.84, 0.6];
/** the mobile abdominal tip: pivot and length (body coordinates) */
export const TIP_PIVOT: V3 = [-5.05, 0, -0.32];
export const TIP_LEN = 0.82;
export const TIP_REST: V3 = norm3([-1, 0, -0.42]);

export type BeetleState = {
  body: Frame;
  headPitch: number;
  headYaw: number;
  mand: number; // 0 closed .. 1 open
  antWave: [number, number]; // antenna sweep (deg) per side
  antLift: [number, number];
  feet: V3[]; // six world foot positions (on the floor)
  lift?: number[]; // per-leg foot lift (mm)
  tipDir: V3; // body-local direction of the abdominal tip
  pump: number; // abdomen breathing 0..1
};

export type LegJ = {socket: V3; troch: V3; knee: V3; ankle: V3; foot: V3; tars: V3[]; i: number};
export type BRig = {
  st: BeetleState;
  head: Frame;
  headC: V3;
  legs: LegJ[];
  ants: V3[][]; // 12 joints per antenna (base .. tip)
  palps: V3[][];
  tipBase: V3;
  tipEnd: V3;
  tipDirW: V3;
};

export const bw = (st: BeetleState, p: V3) => toW(st.body, p);
export const headFrame = (st: BeetleState): Frame => {
  const n = bw(st, NECK);
  let H: Frame = {...st.body, o: n};
  H = pitchF(H, st.headPitch, n);
  H = yawF(H, st.headYaw, n);
  return H;
};
export const hw = (H: Frame, p: V3) => toW(H, p);

const COXA_DIR: V3[] = [[0.35, 0.45, -0.82], [0.05, 0.6, -0.8], [-0.45, 0.55, -0.7]];
export const trochOf = (st: BeetleState, i: number): V3 => {
  const k = pair(i), s = side(i);
  const sock = bw(st, [SOCK[k][0], SOCK[k][1] * s, SOCK[k][2]]);
  const cd = norm3(dirW(st.body, [COXA_DIR[k][0], COXA_DIR[k][1] * s, COXA_DIR[k][2]]));
  return add3(sock, mul3(cd, LEN.coxa[k]));
};

/** world foot positions of the standing pose for a body frame, dropped to the floor z = 0 */
export const restFeet = (F: Frame, spread = 1): V3[] =>
  REST_FOOT.map((p) => {
    const w = toW(F, [p[0], p[1] * spread, p[2]]);
    return [w[0], w[1], 0] as V3;
  });

export const solveB = (st: BeetleState): BRig => {
  const head = headFrame(st);
  const headC = hw(head, HEAD_C);
  const up: V3 = [0, 0, 1];
  const legs: LegJ[] = LEGS.map((i) => {
    const k = pair(i), s = side(i);
    const socket = bw(st, [SOCK[k][0], SOCK[k][1] * s, SOCK[k][2]]);
    const troch = trochOf(st, i);
    const lift = st.lift ? st.lift[i] : 0;
    const foot = add3(st.feet[i], [0, 0, lift]);
    // the tarsus slopes down to the foot from the side of the hip
    let toHip = sub3(troch, foot);
    toHip = [toHip[0], toHip[1], 0];
    const along = len3(toHip) > 1e-4 ? norm3(toHip) : st.body.f;
    const tl = LEN.tarsus[k];
    const ankleT = add3(foot, add3(mul3(along, tl * 0.86), mul3(up, tl * 0.42)));
    const pole = add3(mul3(st.body.u, 0.75), add3(mul3(st.body.l, 1.2 * s), mul3(st.body.f, [0.45, 0, -0.5][k])));
    const {knee, ankle} = ik2(troch, ankleT, LEN.femur[k], LEN.tibia[k], pole);
    const fd = sub3(foot, ankle);
    const footR = add3(ankle, mul3(len3(fd) > 1e-5 ? norm3(fd) : st.body.f, tl));
    // five tarsomeres along a slight upward bow (first one longest)
    const fr = [0, 0.3, 0.5, 0.64, 0.76, 1];
    const bowN = norm3(cross3(cross3(sub3(footR, ankle), up), sub3(footR, ankle)));
    const tars = fr.map((u) => add3(lerp3(ankle, footR, u), mul3(bowN, -0.12 * Math.sin(Math.PI * u))));
    return {socket, troch, knee, ankle, foot: footR, tars, i};
  });
  // antennae: scape, pedicel and nine flagellomeres, forward and out with a gentle outward curve
  const segL = [0.5, 0.2, 0.46, 0.44, 0.43, 0.42, 0.41, 0.4, 0.39, 0.38, 0.4];
  const ants = [1, -1].map((s, j) => {
    const base = hw(head, [1.32, 0.5 * s, 0.22]);
    const wave = st.antWave[j], liftA = st.antLift[j];
    let d = norm3(dirW(head, [0.8, 0.55 * s, 0.25 + 0.012 * liftA]));
    d = rotA(d, head.u, wave * s);
    const pts: V3[] = [base];
    for (let k = 0; k < segL.length; k++) {
      // bend outward and slightly down along the flagellum
      d = norm3(rotA(d, head.u, (1.2 + 0.25 * k) * s));
      d = norm3(add3(d, mul3(head.u, -0.035 + 0.002 * liftA)));
      pts.push(add3(pts[k], mul3(d, segL[k])));
    }
    return pts;
  });
  const palps = [1, -1].map((s) => {
    const base = hw(head, [1.45, 0.3 * s, -0.42]);
    const ds: V3[] = [[0.6, 0.35 * s, -0.5], [0.8, 0.25 * s, -0.55], [0.9, 0.1 * s, -0.45], [0.95, 0.05 * s, -0.3]];
    const L = [0.18, 0.24, 0.2, 0.26];
    const pts: V3[] = [base];
    ds.forEach((q, k) => pts.push(add3(pts[k], mul3(norm3(dirW(head, q)), L[k]))));
    return pts;
  });
  const tipBase = bw(st, TIP_PIVOT);
  const tipDirW = norm3(dirW(st.body, st.tipDir));
  const tipEnd = add3(tipBase, mul3(tipDirW, TIP_LEN));
  return {st, head, headC, legs, ants, palps, tipBase, tipEnd, tipDirW};
};

/** body-local aim direction of the tip toward a world point, limited to a cone that the abdomen can reach */
export const aimDir = (body: Frame, from: V3, target: V3): V3 => {
  const d = sub3(target, from);
  return norm3([dot3(d, body.f), dot3(d, body.l), dot3(d, body.u)]);
};
export const slerpDir = (a: V3, b: V3, u: number): V3 => norm3(lerp3(a, b, u));
