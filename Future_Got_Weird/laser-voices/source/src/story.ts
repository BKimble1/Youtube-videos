// Every state of the film as a pure function of time (s), keyed to the measured narration words (world.ts).
// The people: the recipient stands still at the listening position (her left ear toward the transmitter, eight feet
// away); the bystander starts on the near side of the beam reading a tablet, turns toward the far doorway, walks,
// pauses in the beam, then walks on and out. The obstruction is computed from his body geometry against the beam line,
// and everything that depends on "the signal is received" (overlay, ear accent, message audio gate, her reaction) is
// derived from that one function.
import {clamp, easeInOut as eio, easeOut as eout, inv, lerp, noise1, smooth} from './lib/math';
import {a3, Cam, d3, fwdOf, l3, lerp3, m3, n3, rotY, s3, V3, v3} from './p3';
import {EXP0, HeadExpr, mixE} from './Head3';
import {HAND_RELAXED, HandPose, mixHand} from './art/Hand';
import {DIM_B, DIM_R, joints, Pose} from './Person';
import {BEAM_Y, DUR, EXIT, w, WALK_X, we} from './world';

// ---- keyframe helpers
type K<T> = [number, T, ((x: number) => number)?];
export const tk = (t: number, keys: K<number>[]): number => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) return lerp(keys[i - 1][1], keys[i][1], (keys[i][2] ?? eio)(inv(keys[i - 1][0], keys[i][0], t)));
  return keys[keys.length - 1][1];
};
export const tk3 = (t: number, keys: K<V3>[]): V3 => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) return lerp3(keys[i - 1][1], keys[i][1], (keys[i][2] ?? eio)(inv(keys[i - 1][0], keys[i][0], t)));
  return keys[keys.length - 1][1];
};
const tkE = (t: number, keys: [number, HeadExpr][]): HeadExpr => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) return mixE(keys[i - 1][1], keys[i][1], eio(inv(keys[i - 1][0], keys[i][0], t)));
  return keys[keys.length - 1][1];
};
const E = (o: Partial<HeadExpr>): HeadExpr => ({...EXP0, ...o});
const blinkAt = (t: number, times: number[]) => times.reduce((m, b) => Math.max(m, 1 - clamp(Math.abs(t - b) / 0.075)), 0);

// ================================================================ beats (seconds, from the measured words)
export const BEAT = {
  B: w(17), // "And you wouldn't need anything in your ears."
  C: w(25), // "The beam is invisible. ..."
  D: w(48), // "Now, sweeping that beam ..."
  E: w(71), // "But if someone walks between you and the laser ..."
  F: w(92), // "And the second they move ..."
};

// ================================================================ the recipient
const R_YAW = 0.55; // turned toward the room (+x, +z) so her left ear looks back toward the transmitter and the camera side
const restR = (pos: V3): Pose => ({pos, yaw: R_YAW, crouch: 0, lean: 0.02, side: 0, twist: 0, bob: 0, headYaw: 0, headPitch: 0.04, headRoll: 0, walk: 0, walkAmt: 0,
  R: {hand: HAND_RELAXED}, L: {hand: HAND_RELAXED}, expr: EXP0, blink: 0, sway: 0});
/** the left ear's outer point (world) for a pose, using the head model's own surface parametrisation */
export const earOf = (pz: Pose) => {
  const j = joints(pz, DIM_R);
  const R = DIM_R.headR;
  const az = -1.52, el = -0.08;
  const lx = 0.86 * Math.sin(az) * Math.cos(el), ly = 1.0 * Math.sin(el), lz = 0.92 * Math.cos(az) * Math.cos(el);
  const p = a3(a3(a3(j.Hc, m3(j.hR, lx * R)), m3(j.hU, ly * R)), m3(j.hF, lz * R));
  return {p, out: m3(j.hR, -1), j};
};
// place her so that, at rest, the ear is on the optical axis 2.44 m (8 ft) from the exit
const R_POS = (() => {
  // solved for her usual listening pose (head turned slightly toward the source)
  const e = earOf({...restR(v3(0, 0, 0)), headYaw: -0.2}).p;
  return v3(2.44 - e.x, 0, -e.z);
})();
/** the listening position: a few centimetres of air just outside her ear, on the axis (fixed in the room) */
export const FOCUS = v3(2.44 - 0.035, BEAM_Y, 0);

/** the ear point in her listening pose (used to frame the close views) */
export const EARP = (() => earOf({...restR(R_POS), headYaw: -0.2}).p)();
export const recAt = (t: number): Pose => {
  const pz = restR(R_POS);
  // hook: the reaction is already under way at frame 0 (brows lifting, a small involuntary turn toward the left ear)
  const hy = tk(t, [[0, -0.1], [0.55, -0.3, eout], [2.6, -0.24], [3.3, -0.05], [4.3, -0.16], [w(17), -0.2], [we(24), -0.22],
    [w(71), -0.2], [w(74), -0.42], [w(83), -0.42], [w(83) + 0.25, -0.58, eout], [w(84), -0.55], [w(89), -0.85], [we(91), -0.8], [w(96), -0.6], [w(97) + 0.1, -0.45], [w(98) + 0.2, -0.36, eout], [DUR, -0.34]]);
  const roll = tk(t, [[0, -0.02], [0.5, -0.09, eout], [3.0, -0.06], [w(83), -0.05], [w(83) + 0.3, 0.06, eout], [w(89), 0.04], [w(97), 0.0], [w(98) + 0.2, -0.08], [DUR, -0.07]]);
  const pitch = tk(t, [[0, 0.02], [0.6, -0.02], [3.0, 0.04], [w(83), 0.04], [w(83) + 0.3, 0.07], [w(97), 0.03], [DUR, 0.0]]);
  const wonder = E({wide: 0.45, browIn: 0.25, smile: 0.05, open: 0.18, gx: -0.75, gy: 0.05, lid: 0.0});
  const listen = E({wide: 0.15, browIn: 0.2, smile: 0.32, gx: -0.45, lid: 0.04});
  const atHim = E({wide: 0.2, browAsym: 0.3, smile: 0.22, gx: -0.85, gy: 0.15});
  const settled = E({smile: 0.28, gx: -0.25, lid: 0.12, browIn: 0.1});
  const puzzled = E({browIn: 0.85, browDown: 0.1, browAsym: -0.55, smile: -0.75, gx: -0.7, gy: 0.05, open: 0.12, squint: 0.2, lid: 0.0});
  const atBlock = E({browIn: 0.6, browDown: 0.45, browAsym: -0.3, smile: -0.6, gx: -0.95, gy: 0.15, squint: 0.3, smirk: 0.0});
  const again = E({wide: 0.35, browIn: 0.15, smile: 0.5, gx: -0.55, lid: 0.0, open: 0.1});
  pz.expr = tkE(t, [[0, mixE(EXP0, wonder, 0.55)], [0.45, wonder], [2.2, listen], [3.0, atHim], [4.4, atHim], [5.2, listen], [8, settled], [w(80), settled],
    [w(83) - 0.02, settled], [w(83) + 0.22, puzzled], [w(89) - 0.15, puzzled], [w(89) + 0.3, atBlock], [w(97) - 0.15, atBlock], [w(97) + 0.25, again], [DUR, again]]);
  pz.headYaw = hy;
  pz.headRoll = roll;
  pz.headPitch = pitch;
  pz.blink = blinkAt(t, [1.9, 5.6, 9.4, 13.1, 16.8, 20.4, 24.2, 27.7, 30.9]);
  pz.sway = 0.4 * Math.sin(t * 1.3);
  pz.bob = 0.004 * Math.sin(t * 1.7);
  pz.side = 0.012 * Math.sin(t * 0.7);
  // a small lean toward the source while listening; settles back after the loss
  pz.lean = 0.02 + 0.02 * tk(t, [[0, 1], [3, 0.6], [w(83), 0.6], [w(83) + 0.4, 0], [w(97), 0], [w(98), 0.7]]);
  // hands: relaxed at her sides, the left drifting slightly up as she turns into the sound in the hook
  const j0 = joints({...pz, L: {hand: HAND_RELAXED}, R: {hand: HAND_RELAXED}}, DIM_R);
  void j0;
  pz.L = {hand: mixHand(HAND_RELAXED, {curl: [0.3, 0.35, 0.4, 0.45], spread: 0.3, thumb: 20, thumbCurl: 0.4}, 0.5), swing: 0.02};
  pz.R = {hand: HAND_RELAXED, swing: -0.01};
  return pz;
};

// ================================================================ the bystander's walk (planted feet)
// path: from just behind her (on the far side of the beam, reading his tablet) diagonally toward the near-side aisle
// at the bench end of the room, crossing the axis at x = WALK_X (upstream of her ear).
// s = distance travelled. Three walking segments: two steps up to the edge of the beam, a short pause to read, one
// step into it (the cut lands on "stops"), the pause in the beam, then on and out.
const B_DIR = n3(v3(-1.25, 0, 1.15));
const B_P0 = a3(v3(WALK_X, 0, 0), m3(B_DIR, -1.7)); // 1.7 m before the crossing point
export const S_EDGE = 1.2; // stops just short of the beam (reading)
export const S_STOP = 1.7 + 0.06; // pelvis 6 cm past the axis: the beam meets his left shoulder
const S_END = 4.4;
const L_STEP = 0.42; // step length (a slow amble while reading)
const pathAt = (s: number) => a3(B_P0, m3(B_DIR, s));
const YAW_WALK = Math.atan2(B_DIR.x, B_DIR.z);
const yawPath = (_s: number) => YAW_WALK;
export const WALK = {
  turn0: w(70) + 0.05, // turns from the tablet toward the aisle: a pivot step (end of beat D)
  go0: w(71) + 0.1, // "But ..."
  edge: w(79) + 0.15, // "... the laser": at the edge of the beam
  goB: w(80) + 0.42, // "The voice suddenly": one more step
  stop: w(84) + 0.1, // the step settles just after the cut on "stops"
  go1: w(96) - 0.08, // "move"
};
// a smooth start-cruise-stop profile on [0,1] (C1, accelerations bounded)
const smoothStop = (u: number, a = 0.3, b = 0.32) => {
  const vc = 1 / (1 - a / 2 - b / 2);
  if (u < a) return (vc * u * u) / (2 * a);
  if (u < 1 - b) return (vc * a) / 2 + vc * (u - a);
  const r = 1 - u;
  return 1 - (vc * r * r) / (2 * b);
};
// after the pause in the beam: accelerate from rest to about 0.95 m/s
const sAfter = (t: number) => {
  const tt = t - WALK.go1, acc = 1.9, vmax = 0.95, ta = vmax / acc;
  return S_STOP + (tt < ta ? 0.5 * acc * tt * tt : 0.5 * acc * ta * ta + vmax * (tt - ta));
};
const SEGS = [
  {t0: WALK.go0, t1: WALK.edge, s0: 0, s1: S_EDGE},
  {t0: WALK.goB, t1: WALK.stop, s0: S_EDGE, s1: S_STOP},
];
export const sAtWalk = (t: number) => {
  if (t < SEGS[0].t0) return 0;
  for (const g of SEGS) {
    if (t < g.t0) return g.s0;
    if (t < g.t1) return lerp(g.s0, g.s1, smoothStop(inv(g.t0, g.t1, t)));
  }
  return t < WALK.go1 ? S_STOP : sAfter(t);
};
export const bySpeed = (t: number) => (sAtWalk(t + 0.01) - sAtWalk(t - 0.01)) / 0.02;

type Plant = {foot: 'l' | 'r'; from: number; to: number; s0: number; s1: number}; // swing while pelvis s in [s0, s1]
const plan = (() => {
  const out: Plant[] = [];
  const pos = {l: 0, r: 0};
  let foot: 'l' | 'r' = 'r';
  const seg = (a: number, bEnd: number, open = false) => {
    let i = 1;
    for (;;) {
      let target = a + (i - 0.5) * L_STEP;
      const last = !open && target >= bEnd - 0.5 * L_STEP;
      if (last) target = bEnd + 0.07;
      if (open && target > bEnd) break;
      const s1 = Math.min(bEnd, target - 0.45 * L_STEP);
      const s0 = Math.max(a, Math.min(s1 - 0.08, target - 1.45 * L_STEP));
      out.push({foot, from: pos[foot], to: target, s0, s1: Math.max(s1, s0 + 0.08)});
      pos[foot] = target;
      foot = foot === 'l' ? 'r' : 'l';
      i++;
      if (last) {
        // bring the trailing foot alongside (it becomes the next lead)
        const t2 = bEnd - 0.05;
        if (Math.abs(pos[foot] - t2) > 0.05) out.push({foot, from: pos[foot], to: t2, s0: bEnd - 0.1, s1: bEnd - 1e-4});
        pos[foot] = t2;
        foot = foot === 'l' ? 'r' : 'l';
        break;
      }
    }
  };
  seg(0, S_EDGE);
  seg(S_EDGE, S_STOP);
  seg(S_STOP, S_END, true);
  return out;
})();
const footAt = (foot: 'l' | 'r', s: number) => {
  let pos = 0, lift = 0;
  for (const p of plan) {
    if (p.foot !== foot) continue;
    if (s >= p.s1) { pos = p.to; continue; }
    if (s > p.s0) {
      const u = smooth(inv(p.s0, p.s1, s));
      pos = lerp(p.from, p.to, u);
      lift = Math.sin(Math.PI * u) * 0.075;
    } else pos = p.from;
    break;
  }
  return {pos, lift};
};

const B_YAW0 = -0.3; // reading, facing the room
const B_YAW1 = YAW_WALK; // facing the aisle
export const byAt = (t: number): Pose => {
  const s = sAtWalk(t);
  const yaw = t < WALK.go1 ? tk(t, [[0, B_YAW0], [WALK.turn0, B_YAW0], [WALK.go0 + 0.25, B_YAW1 - 0.04], [WALK.edge, B_YAW1]]) : yawPath(s);
  const turning = clamp(inv(WALK.turn0, WALK.go0 + 0.25, t)) * (1 - clamp(inv(WALK.go0 + 0.25, WALK.go0 + 0.5, t)));
  const P = pathAt(s);
  const Fw = fwdOf(yaw);
  const Rv = v3(Math.cos(yaw), 0, -Math.sin(yaw));
  // feet: planted along the path while walking; during the pivot they step round the stance
  const stanceW = 0.13;
  const foot = (k: 'l' | 'r') => {
    const sgn = k === 'r' ? 1 : -1;
    const f = footAt(k, s);
    // lateral offset follows the body's right; the pivot step lifts the right foot then the left
    const piv = k === 'r' ? clamp(inv(WALK.turn0, WALK.turn0 + 0.45, t)) : clamp(inv(WALK.turn0 + 0.3, WALK.go0 + 0.25, t));
    const pivLift = Math.sin(Math.PI * piv) * 0.05;
    const yawF = lerp(B_YAW0, B_YAW1, smooth(piv));
    const RvF = v3(Math.cos(yawF), 0, -Math.sin(yawF));
    const fy = YAW_WALK;
    const RvP = v3(Math.cos(fy), 0, -Math.sin(fy));
    const base = a3(pathAt(f.pos), m3(t < WALK.go0 + 0.3 ? RvF : RvP, sgn * stanceW));
    return a3(base, v3(0, 0.065 + f.lift + pivLift, 0));
  };
  const feet = {l: foot('l'), r: foot('r')};
  const spd = bySpeed(t);
  // pelvis rides over the stance leg: bob and lateral shift from the feet
  const mid = lerp3(feet.l, feet.r, 0.5);
  const lat = d3(s3(mid, P), Rv);
  const walkAmt = clamp(spd / 0.6);
  // gait phase for the arm swing, from the step count (one cycle per two steps)
  const ph = (s / L_STEP) * Math.PI;
  const pz: Pose = {
    pos: a3(P, m3(Rv, lat * 0.5)), yaw, crouch: 0, lean: 0.06 + 0.03 * walkAmt, side: -lat * 0.3, twist: 0.06 * walkAmt * Math.sin(ph) + turning * 0.15,
    bob: -0.012 * walkAmt * Math.abs(Math.cos(ph)), headYaw: 0, headPitch: 0.42, headRoll: 0, walk: ph, walkAmt: 0, feet,
    R: {hand: HAND_RELAXED}, L: {hand: HAND_RELAXED}, expr: E({lid: 0.3, smile: 0.12, gy: 0.75}), blink: 0, sway: 0,
  };
  // head: reading the tablet; the glance to the doorway (end of beat D); a calm look up while paused; reading again
  pz.headPitch = tk(t, [[0, 0.42], [w(69) - 0.1, 0.42], [w(69) + 0.25, 0.05], [WALK.turn0 + 0.2, 0.08], [WALK.go0 + 0.4, 0.28], [w(84), 0.3], [w(87), 0.12], [w(89) + 0.2, 0.12], [w(91), 0.4], [WALK.go1 + 0.4, 0.3], [DUR, 0.25]]);
  pz.headYaw = tk(t, [[0, 0], [w(69) - 0.1, 0], [w(69) + 0.25, 0.45], [WALK.turn0 + 0.3, 0.4], [WALK.go0 + 0.4, 0.0], [w(87), 0.0], [w(87) + 0.3, -0.25], [w(89) + 0.4, -0.2], [w(91), 0.0], [DUR, 0.05]]);
  const gzUp = tk(t, [[0, 0.75], [w(69) - 0.1, 0.75], [w(69) + 0.25, 0.0], [WALK.go0 + 0.4, 0.6], [w(87), 0.6], [w(87) + 0.25, 0.0], [w(89) + 0.3, 0.0], [w(91), 0.65], [DUR, 0.6]]);
  pz.expr = E({lid: 0.25, smile: 0.14, gy: gzUp, gx: tk(t, [[w(69) - 0.1, 0], [w(69) + 0.25, 0.6], [WALK.go0 + 0.3, 0]])});
  pz.blink = blinkAt(t, [2.6, 7.9, 13.4, 18.2, 22.75, 26.2, 29.0, 33.0]);
  pz.sway = 0.3 * Math.sin(t * 1.1);
  if (t < WALK.go0) pz.side = 0.02 * Math.sin(t * 0.6) + 0.03 * tk(t, [[w(65), 0], [w(66), 1], [WALK.turn0, 0.4]]);
  // the tablet, held in both hands in front of the chest (tilted up toward his face)
  const Up = v3(0, 1, 0);
  const tabC = a3(a3(pz.pos, m3(Up, 1.1 - 0.012 * walkAmt * Math.cos(ph))), m3(Fw, 0.3));
  const tilt = 0.75;
  const tv = n3(a3(m3(Up, Math.cos(tilt)), m3(Fw, Math.sin(tilt))));
  const tu = Rv;
  // a small tap now and then (right index), and a swipe during the pause
  const tap = (t0: number) => Math.max(0, 1 - Math.abs(t - t0) / 0.12);
  const taps = tap(4.1) + tap(11.2) + tap(19.6) + tap(w(85) + 0.1) + tap(w(90)) + tap(w(90) + 0.32);
  pz.tablet = {c: tabC, u: m3(tu, 0.125), v: m3(tv, 0.09)};
  const grip = (sg: 1 | -1) => a3(a3(tabC, m3(tu, sg * 0.15)), m3(tv, -0.03));
  const holdHand: HandPose = {curl: [0.35, 0.45, 0.55, 0.6], spread: 0.2, thumb: 35, thumbCurl: 0.3};
  pz.R = {W: a3(grip(1), m3(Up, 0.012 * taps)), hand: mixHand(holdHand, {curl: [0.05, 0.5, 0.6, 0.65], spread: 0.25, thumb: 30, thumbCurl: 0.3}, clamp(taps)),
    dir: n3(a3(m3(tv, 0.75), m3(tu, -0.65))), pole: a3(m3(Up, -0.7), m3(Rv, 0.7))};
  pz.L = {W: grip(-1), hand: holdHand, dir: n3(a3(m3(tv, 0.75), m3(tu, 0.65))), pole: a3(m3(Up, -0.7), m3(Rv, -0.7))};
  return pz;
};

// ================================================================ the obstruction (one source of truth)
/** sample the bystander's body as spheres/capsules and find where the illustrated path from the exit to the listening
 *  position first meets it; null when the path is clear */
type Cap = {a: V3; b: V3; r: number};
const capsOf = (pz: Pose): Cap[] => {
  const j = joints(pz, DIM_B);
  const D = DIM_B;
  const caps: Cap[] = [
    {a: j.Hc, b: j.Hc, r: D.headR * 0.95},
    {a: j.N, b: a3(j.S, m3(j.spine, -0.02)), r: 0.055},
    // the chest as two capsules (about 0.36 m wide, 0.22 m deep), the shoulders as a bar
    {a: a3(a3(j.P, m3(j.spine, D.torso * 0.55)), m3(j.Rs, 0.08)), b: a3(a3(j.S, m3(j.spine, -0.06)), m3(j.Rs, 0.09)), r: 0.11},
    {a: a3(a3(j.P, m3(j.spine, D.torso * 0.55)), m3(j.Rs, -0.08)), b: a3(a3(j.S, m3(j.spine, -0.06)), m3(j.Rs, -0.09)), r: 0.11},
    {a: j.sh.r, b: j.sh.l, r: 0.075},
    {a: j.R.S, b: j.R.E, r: D.limb.up[0] * 1.15},
    {a: j.L.S, b: j.L.E, r: D.limb.up[0] * 1.15},
    {a: j.R.E, b: j.R.W, r: D.limb.up[1] * 1.12},
    {a: j.L.E, b: j.L.W, r: D.limb.up[1] * 1.12},
  ];
  return caps;
};
const segDist = (p: V3, c: Cap) => {
  const ab = s3(c.b, c.a);
  const L2 = d3(ab, ab);
  const u = L2 < 1e-9 ? 0 : clamp(d3(s3(p, c.a), ab) / L2);
  return l3(s3(p, a3(c.a, m3(ab, u))));
};
export const pathHit = (t: number): {s: number; p: V3} | null => {
  const pz = byAt(t);
  if (Math.abs(pz.pos.z) > 0.6 || pz.pos.x < 1.0) return null;
  const caps = capsOf(pz);
  const D = s3(FOCUS, EXIT);
  const L = l3(D);
  for (let s = 0.4; s < L; s += 0.004) {
    const p = a3(EXIT, m3(D, s / L));
    for (const c of caps) if (segDist(p, c) < c.r) return {s: s / L, p};
  }
  return null;
};
/** message transmitting (the playback unit's state) and the received gate */
export const MSG = [
  [0, 3.9], // the hook: the private voice (while the hook overlay shows)
  [w(57) - 0.1, we(62) + 0.15], // "concentrates the sound where you're standing" (shown with the localisation)
  [w(74), DUR + 1], // from the walk to the end: cut only by the obstruction
] as const;
export const transmitting = (t: number) => true || t < 0; // the source never stops: obstruction, not a power failure
export const messageOn = (t: number) => MSG.some(([a, b]) => t >= a && t < b);
export const blockedAt = (t: number) => pathHit(t) !== null;
export const received = (t: number) => messageOn(t) && !blockedAt(t);
void transmitting;

// ================================================================ re-exports for the film
export {EXP0, R_POS};
export const lerpCam = (a: Cam, b: Cam, k: number): Cam => ({pos: lerp3(a.pos, b.pos, k), tgt: lerp3(a.tgt, b.tgt, k), f: Math.exp(lerp(Math.log(a.f), Math.log(b.f), k)), roll: lerp(a.roll ?? 0, b.roll ?? 0, k)});
export const camKeys = (t: number, keys: [number, Cam, ((x: number) => number)?][]): Cam => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) return lerpCam(keys[i - 1][1], keys[i][1], (keys[i][2] ?? eio)(inv(keys[i - 1][0], keys[i][0], t)));
  return keys[keys.length - 1][1];
};
export {noise1, rotY};
