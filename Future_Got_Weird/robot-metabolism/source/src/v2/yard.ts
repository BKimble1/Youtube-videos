// V2: the lab-floor station. Everything here is a pure function of the film time t.
//
// Early (t < 13.3): the opening pair at H (pair.ts); then the completed robot walks away from the broken robot (-x,
// front edge leading) with its own links: a stretch pushes the front edge out, a shrink pulls the body after it. The cycles land on "stretch" and
// "shrink". After the operator's key press it pulls itself on toward a working module S (coral band) lying ahead;
// S telescopes its end toward the front-near vertex, both connectors turn into line, contact on "connects"; S then
// pushes with its tip planted (the body's weight goes onto it and the robot slides back), and recovers.
//
// Late (t >= 17.05, a separate demonstration at F, beside a second pair at H2): the robot walks on S as a walking
// stick; S stops working (light out), sinks under the load as its rod is pushed in, lets go, drops and rolls aside
// toward the camera; the robot steps sideways to a replacement R (teal), R reaches in, contact on "replacement", the
// robot rears up onto R and pushes on. At H2 the pair runs its pre-roll (tau = t - 25.7): another incomplete robot
// crawls up to another broken robot whose intact module starts to let go, exactly as in the first frame.
import {add, clamp, easeIn, lerp, mix, mul, norm, ss, ss5, sub, V3, v3, len} from '../lib/v3';
import {E, FRAMES, FPS, T} from '../lib/time';
import {COL, GY, Link} from '../rig/truss';
import {EDGES, lensAdd, Lens, tetra, Tet} from '../rig/body';
import {FINAL, pairState, PT} from './pair';
import {bodyTravel, strokes, tipTravel} from '../rig/gait';

export const DUR = FRAMES / FPS;
export const H = v3(0, 0, 0);
export const H2 = v3(-1.25, 0, 0); // 5 x 25 cm: the floor grid lines up exactly with H
const HALF = 0.165;
const dOf = (L: number) => Math.sqrt(Math.max(0, L * L - HALF * HALF));
const LS = 0.41; // rear links stretched
const STEP = dOf(LS) - dOf(0.33);

/** the walking cycles: [stretch start, stretch end, shrink start, shrink end] */
export const CYC: [number, number, number, number][] = [
  [PT.risen + 0.1, PT.risen + 0.52, PT.risen + 0.6, PT.risen + 1.05],
  [T('stretch') - 0.06, T('stretch') + 0.4, T('shrink') - 0.04, T('shrink') + 0.38],
  [T('with') + 0.05, T('magnets') + 0.45, T('at their') - 0.05, E('ends') + 0.2],
  [T('controls') + 0.27, T('controls') + 0.67, T('movements') + 0.15, T('movements') + 0.55],
];
const APPROACH: [number, number] = [T('guiding') + 0.12, T('connects') - 0.12];
export const SNAP_S = T('connects') + 0.1;
const PUSH: [number, number] = [SNAP_S + 0.12, E('extra piece') + 0.05];
const RECOVER: [number, number] = [E('extra piece') + 0.1, E('extra piece') + 0.5];
export const EARLY_END = T('becomes a walking') - 0.02;

/** rear-link length and the rear vertex position: the walk goes -x, front edge leading. A reach stretches the rear
 *  links with the rear vertex planted (the front edge moves); a follow shrinks them with the front edge planted (the
 *  rear vertex is pulled after it) */
const walkLens = (t: number) => {
  let st = 0;
  for (const [s0, s1, r0, r1] of CYC) st += ss5(s0, s1, t) - ss5(r0, r1, t);
  st += ss5(APPROACH[0], APPROACH[1], t);
  const L = 0.33 + (LS - 0.33) * st;
  let v1x = dOf(0.33);
  for (const [, , r0, r1] of CYC) v1x -= dOf(LS) - dOf(LS - (LS - 0.33) * ss5(r0, r1, t));
  return {L, v1x, xf: v1x - dOf(L)};
};

/** the opening station at film time t (t < EARLY_END) */
export const earlyState = (t: number) => {
  if (t < PT.risen) {
    const p = pairState(t, H);
    return {links: p.links, D: p.D, cues: [[p.tet.V0, p.cue1], [p.tet.V1, p.cue2]] as [V3, number][], tet: p.tet, S: sLink(t, null), pair: p};
  }
  const {L, xf} = walkLens(t);
  const wob = Math.sin(t * 7.1) * 0.008;
  const lens: Lens = lensAdd(FINAL, {l01: L - 0.33, l12: L - 0.33, l03: wob, l13: -wob * 0.6});
  // the push by S after the connection: the whole body slides back (+x)
  const push = ss5(PUSH[0], PUSH[1], t);
  const tet = tetra(lens, {x: H.x + xf + 0.08 * push, z: H.z, yaw: 0, tilt: 0});
  const links: Link[] = EDGES.map(([a, b], i) => {
    const isM = a === 'V0' && b === 'V1';
    const flip = i % 2 === 1;
    return {id: isM ? 'M' : `O${i}`, a: isM ? tet.V0 : flip ? tet[b] : tet[a], b: isM ? tet.V1 : flip ? tet[a] : tet[b], band: isM ? COL.bandX : COL.bandT, led: 1};
  });
  const S = sLink(t, tet);
  // the front-near vertex's connector (on the V0-V2 link) turns toward S as it comes
  const k = ss5(T('rod'), SNAP_S - 0.15, t) * (t < SNAP_S ? 1 : 0);
  if (k > 0) for (const l of links) {
    if (l.id === 'M') continue;
    if (l.a === tet.V0) l.winA = norm(lerp(sub(l.a, l.b), sub(S.a, tet.V0), k));
    if (l.b === tet.V0) l.winB = norm(lerp(sub(l.b, l.a), sub(S.a, tet.V0), k));
  }
  return {links: [...links, S], D: pairState(PT.risen, H).D, cues: [[tet.V0, clamp((t - SNAP_S) / 0.32)]] as [V3, number][], tet, S, pair: null};
};

// S: lying ahead (-x) of where the front-near vertex will be at the connection, pointing away
const V0_AT_SNAP = (() => {
  const {xf} = walkLens(SNAP_S);
  return v3(H.x + xf, GY, H.z + HALF);
})();
export const S_TIP0 = V0_AT_SNAP.x - 0.35;
const sLink = (t: number, tet: Tet | null): Link => {
  const joined = t >= SNAP_S && tet !== null;
  // before: lying ready (light on); its near end reaches the last 5 cm toward the vertex
  const r0 = SNAP_S - 0.2;
  let gap: number;
  if (t < T('rod')) gap = 0.05;
  else if (t < r0) gap = mix(0.05, 0.018, ss5(T('rod'), r0, t));
  else gap = mix(0.018, 0, easeIn(r0, SNAP_S, t, 2.6));
  const a = joined ? tet!.V0 : sub(V0_AT_SNAP, v3(gap, 0, 0));
  // after the connection S pushes with its tip planted, then its tip slides in (recovery)
  const tip = v3(S_TIP0 + 0.1 * ss5(RECOVER[0], RECOVER[1], t), GY, V0_AT_SNAP.z);
  const winA = !joined && tet ? norm(lerp(v3(1, 0, 0), sub(tet.V0, a), ss5(T('rod'), SNAP_S - 0.15, t))) : undefined;
  return {id: 'S', a, b: tip, band: COL.bandS, led: 1, winA};
};

// ----------------------------------------------------------------------------------------------------------------
// late: the failure, the repair and the pair at H2
export const L0 = T('and if');
const TILT = (27 * Math.PI) / 180;
export const LEV = {
  die: T('stops working') + 0.12,
  sink0: T('stops working') + 0.25,
  sink1: E('working') + 0.15,
  release: T('it can') + 0.04,
  lower1: T('drop') + 0.2,
  fall1: T('drop') + 0.32,
  roll1: E('drop it') + 0.18,
  side0: T('drop') + 0.32,
  side1: T('and attach') + 0.22,
  contact: T('replacement') + 0.22,
  rear0: T('replacement') + 0.32,
  rear1: E('replacement') + 0.18,
};
const XF = -0.05; // the robot's front edge at the start of the late part
const SIDE = -0.12;
const ROLL = 0.13;

export const lateState = (t: number) => {
  // the robot walks on S, then (after the repair) on R
  const S0 = strokes(L0 + 0.02, 1, 0.47, 0.09);
  const S1 = strokes(E('replacement') + 0.24, 2, 0.55, 0.08);
  const bx = XF - bodyTravel(S0, t) - bodyTravel(S1, t);
  const struggle = ss(LEV.die + 0.05, LEV.die + 0.2, t) * (1 - ss(LEV.lower1 - 0.1, LEV.lower1, t));
  const sinkK = ss5(LEV.sink0, LEV.sink1, t);
  const tilt = mix(TILT, (13 * Math.PI) / 180, sinkK) * (1 - ss5(LEV.release + 0.04, LEV.lower1, t)) + TILT * ss5(LEV.rear0, LEV.rear1, t);
  const bz = SIDE * ss5(LEV.side0, LEV.side1, t);
  const wob = Math.sin(t * 9) * 0.006 + Math.sin(t * 19) * 0.016 * struggle;
  const tet = tetra(lensAdd(FINAL, {l03: wob, l23: -wob, l13: wob * 0.4}), {x: bx + Math.sin(t * 31) * 0.003 * struggle, z: bz, yaw: 0, tilt});
  const links: Link[] = EDGES.map(([a, b], i) => {
    const isM = a === 'V0' && b === 'V1';
    const flip = i % 2 === 1;
    return {id: isM ? 'M' : `T${i}`, a: isM ? tet.V0 : flip ? tet[b] : tet[a], b: isM ? tet.V1 : flip ? tet[a] : tet[b], band: isM ? COL.bandX : COL.bandT, led: 1};
  });

  // ---- S: the walking stick, until it fails
  const V1h = (tl: number) => (0.2858 * Math.cos(tl)); // rear vertex ahead of the front edge
  const tip0 = XF + V1h(TILT) + 0.3;
  const sTip = v3(tip0 - tipTravel(S0, t), GY, 0);
  let S: Link;
  const sLed = 1 - ss(LEV.die - 0.06, LEV.die + 0.12, t);
  if (t < LEV.release + 0.04) {
    S = {id: 'S', a: tet.V1, b: sTip, band: COL.bandS, led: sLed, relA: ss(LEV.release - 0.06, LEV.release + 0.04, t)};
  } else {
    // released: its top end drops to the mat (it pivots on its tip), then it rolls aside toward the camera
    const at = lateState_vAt(LEV.release + 0.04);
    const Ls = len(sub(at, sTip));
    const fall = ss5(LEV.release + 0.04, LEV.fall1, t);
    // as it falls its tip skids back a little, so its top end lands clear of the lowering vertex
    const kick = v3(0.05 * fall, 0, 0);
    const sTipK = add(sTip, kick);
    const lay = v3(sTipK.x - Ls, GY, sTip.z);
    const a0 = lerp(at, lay, fall);
    // keep the length while it falls (rotate about the tip)
    const dir = norm(sub(a0, sTipK));
    const aFall = add(sTipK, mul(dir, Ls));
    const r = ss5(LEV.fall1 + 0.02, LEV.roll1, t);
    const dz = ROLL * r;
    S = {id: 'S', a: add(aFall, v3(0, 0, dz)), b: add(sTipK, v3(0, 0, dz)), band: COL.bandS, led: 0, relA: 1 - ss(LEV.fall1 + 0.2, LEV.roll1, t), roll: -(dz / 0.02)};
  }

  // ---- R: the replacement, lying ready on the far side
  const v1Side = tetra(FINAL, {x: XF - 0.09, z: SIDE, yaw: 0, tilt: 0}).V1;
  const r0 = LEV.contact - 0.16;
  let gap: number;
  if (t < LEV.side1) gap = 0.08;
  else if (t < r0) gap = mix(0.08, 0.02, ss5(LEV.side1, r0, t));
  else gap = mix(0.02, 0, easeIn(r0, LEV.contact, t, 2.6));
  const joined = t >= LEV.contact;
  const rTip0 = v1Side.x + 0.08 + 0.28;
  const rec = ss5(LEV.rear1 + 0.02, E('replacement') + 0.22, t);
  const rTip = v3(rTip0 - 0.1 * rec - tipTravel(S1, t), GY, SIDE);
  const ra = joined ? tet.V1 : add(v1Side, v3(gap, 0, 0));
  const R: Link = {id: 'R', a: ra, b: rTip, band: COL.bandR, led: 1,
    winA: joined ? undefined : norm(lerp(v3(-1, 0, 0), sub(tet.V1, ra), ss5(LEV.side1, LEV.contact - 0.15, t)))};

  // ---- the pair at H2 (pre-roll of the opening)
  const pair = pairState(t - DUR, H2);
  return {tet, links: [...links, S, R], S, R, pair, cues: [[tet.V1, clamp((t - LEV.contact) / 0.32)]] as [V3, number][]};
};
// the rear vertex position at a given time (used to start S's fall from where it let go)
const lateState_vAt = (t: number) => {
  const S0 = strokes(L0 + 0.02, 1, 0.47, 0.09);
  const bx = XF - bodyTravel(S0, t);
  const sinkK = ss5(LEV.sink0, LEV.sink1, t);
  const tilt = mix(TILT, (13 * Math.PI) / 180, sinkK) * (1 - ss5(LEV.release + 0.04, LEV.lower1, t));
  return tetra(FINAL, {x: bx, z: 0, yaw: 0, tilt}).V1;
};
void E; void clamp;
