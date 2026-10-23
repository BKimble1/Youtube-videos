// V2 story: every state is a pure function of time (s), keyed from the measured narration words (src/data/timeline.json,
// unchanged from V1). One corridor; the guard walks down it with a torch toward her hiding place; she has the shield.
//   she: comes round the corner from the side doorway (z 1.25..2.35, left wall), spins and drops behind the shield at
//        (-0.55, 2.5) facing down the corridor (+z), reaches round its right edge, then stands and swings it aside
//   guard: walks from z 10.5 toward her along x = -0.35, stops, searches, leans in, meets the floating hand, is startled
import {clamp, easeInOut as eio, easeOut as eout, inv, lerp, smooth} from '../lib/math';
import {WORDS, DUR} from '../world';
import {a3, Cam, l3, lerp3, m3, n3, s3, V3, v3} from './p3';
import {EXP0, HeadExpr, mixE} from './Head3';
import {HAND_RELAXED, HandPose, mixHand} from '../art/Hand';
import {DIM_G, DIM_W, joints, Pose} from './Person';
import {gripWorld, onShield, SH, ShieldState} from './Shield3';

const w = (i: number) => WORDS[i].start;
const we = (i: number) => WORDS[i].end;
export {w, we};

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
const lin = (x: number) => x;

// ---- shots (cuts) ----
export const SHOT = {
  s1: 0, s2: 1.55, s3: 3.1, s4: 3.95, s5: 4.7, s6: 8.3, s7: 13.95, s8: 15.3, s9: 16.4, s10: 18.5, s11: 20.9, s12: 21.85, s13: 22.7, s14: 23.9,
  // the reveal: two-shot as the shield comes down; his jolt; her grin over his shoulder; the two-shot and the dash
  s15: WORDS[81].start - 0.08, s16: WORDS[85].start - 0.05, s17: WORDS[90].start,
};
export const shotAt = (t: number) => {
  const ks = Object.entries(SHOT);
  let cur = ks[0][0];
  for (const [k, v] of ks) if (t >= v) cur = k;
  return cur as keyof typeof SHOT;
};

// ---- key places
export const HIDE = v3(-0.55, 0, 2.5);
export const S_HIDE: ShieldState = {c: v3(-0.55, SH.h / 2 + 0.006, 2.95), yaw: 0, tilt: 0, speed: 0};
export const GX = -0.35;

// ---- loop time: the last 0.6 s (her dash for the doorway) and frame 0 (her stepping out of it) are one action
const lt = (t: number) => t; // the loop is a cut (her dash out -> her stepping out at frame 0); no remapping

// ================================================================ the shield
const shieldRaw = (t: number): ShieldState => {
  const T = lt(t);
  if (T < 0.55) {
    // carried at her left side while she steps out of the doorway (flat face toward the corridor's +z)
    const p = womanPos(t);
    return {c: v3(p.x, 0.6 + 0.02 * Math.sin(T * 9), p.z + 0.36), yaw: 0.25, tilt: 0.05, speed: 0};
  }
  if (T < w(76)) {
    // the swing: from her side, round in front of her, down onto the floor in front of the hiding place
    const k = eio(inv(0.55, 1.32, T));
    const p0 = womanPos(0.55);
    const start = v3(p0.x, 0.6, p0.z + 0.36);
    const mid = v3(-0.62, 0.95, 3.15);
    const c = k < 0.5 ? lerp3(start, mid, eout(k * 2)) : lerp3(mid, S_HIDE.c, eio((k - 0.5) * 2));
    let yaw = lerp(0.25, 0, k) + 0.35 * Math.sin(Math.PI * k);
    let tilt = 0.05 * (1 - k);
    // settle and the small adjustments she makes while hiding
    const st = T - 1.32;
    if (st > 0) { c.y += 0.012 * Math.exp(-6 * st) * Math.sin(16 * st); yaw += 0.12 * Math.exp(-3 * st) * Math.sin(5 * st) * (T < 2.6 ? 1 : 0); }
    // the guard's first look: she squares the panel to his line (2.0..2.9)
    yaw += -0.16 * (1 - eio(inv(1.7, 2.9, T))) * (T > 1.32 ? 1 : 0);
    // grip adjustment (S8) and the weight shift before the reach (S10)
    const adj = inv(15.5, 16.2, T);
    if (adj > 0 && adj < 1) { c.y += 0.01 * Math.sin(Math.PI * adj); tilt += 0.02 * Math.sin(Math.PI * adj * 2); }
    const sh = inv(w(59) - 0.3, w(59) + 0.5, T);
    if (sh > 0 && sh < 1) tilt += -0.025 * Math.sin(Math.PI * sh);
    return {c, yaw, tilt, speed: 0};
  }
  // lowering: she stands and swings it down and aside to her left, turning its edge to the guard
  const k = eio(inv(w(76) + 0.05, we(79) + 0.1, T));
  const side = v3(-1.12, 0.58, 2.62);
  const c = lerp3(S_HIDE.c, side, k);
  c.y += -0.06 * Math.sin(Math.PI * k);
  const yaw = lerp(0, -1.15, k);
  // the dash for the doorway at the end: carried along at her side
  const dash = inv(DUR - 0.62, DUR, t);
  if (dash > 0) {
    const p = womanPos(t);
    return {c: v3(lerp(c.x, p.x, eio(dash)), 0.6, lerp(c.z, p.z + 0.36, eio(dash))), yaw: lerp(yaw, 0.25, eio(dash)), tilt: 0.05 * dash, speed: 0};
  }
  return {c, yaw, tilt: 0.04 * k, speed: 0};
};
export const shieldAt = (t: number): ShieldState => {
  const a = shieldRaw(t), b = shieldRaw(t - 1 / 30);
  return {...a, speed: l3(s3(a.c, b.c)) * 30 + Math.abs(a.yaw - b.yaw) * 30 * 0.4};
};

// ================================================================ her
// position along her path: out of the doorway (moving +x), then to the hiding place
export function womanPos(t: number): V3 {
  const T = lt(t);
  if (T < 0.55) return tk3(T, [[0, v3(-1.32, 0, 2.02)], [0.3, v3(-1.0, 0, 1.86), lin], [0.55, v3(-0.93, 0, 1.84), eout]]);
  if (T < DUR - 0.62) return tk3(T, [[0.55, v3(-0.93, 0, 1.84)], [1.3, HIDE], [w(76) + 0.2, HIDE], [we(79) + 0.2, v3(-0.55, 0, 2.6)]]);
  // the dash back into the doorway
  return tk3(t, [[DUR - 0.62, v3(-0.55, 0, 2.6)], [DUR, v3(-1.6, 0, 1.85), lin]]);
}
const GRIP: HandPose = {curl: [0.82, 0.86, 0.88, 0.9], spread: 0.15, thumb: 34, thumbCurl: 0.7};
const OPEN: HandPose = {curl: [0.06, 0.05, 0.08, 0.12], spread: 0.6, thumb: 40, thumbCurl: 0.1};
const E_SNEAK: HeadExpr = {...EXP0, browDown: 0.3, smile: 0.05, lid: 0.12, gx: -0.3, gy: 0};
const E_STARTLE: HeadExpr = {...EXP0, wide: 1, browIn: 0.6, open: 0.45, smile: -0.2, lid: 0, gx: -0.8};
const E_FOCUS: HeadExpr = {...EXP0, browDown: 0.4, browIn: 0.2, smile: -0.1, lid: 0.15, gy: 0.2};
const E_HOLD: HeadExpr = {...EXP0, wide: 0.5, browIn: 0.7, smile: -0.25, squint: 0.1, gy: -0.3};
const E_WINCE: HeadExpr = {...EXP0, browIn: 0.8, squint: 0.7, lid: 0.55, smile: -0.4};
const E_MISCHIEF: HeadExpr = {...EXP0, smirk: 0.8, smile: 0.45, browAsym: 0.7, lid: 0.18, gx: 0.15};
const E_GRIN: HeadExpr = {...EXP0, smile: 0.85, smirk: 0.4, browAsym: 0.5, lid: 0.12, wide: 0.1};

export const womanAt = (t: number): Pose => {
  const T = lt(t);
  const s = shieldAt(t);
  const pos = womanPos(t);
  // facing: +x while stepping out, spinning to +z during the swing; -x for the final dash
  // coming round the corner toward the camera (facing +x and down the corridor's -z), then the spin to face the guard
  let yaw = T < 0.55 ? 2.05 : tk(T, [[0.55, 2.05], [1.25, 0]]);
  if (t > DUR - 0.62) yaw = lerp(0, -Math.PI / 2 - 0.3, eio(inv(DUR - 0.62, DUR - 0.35, t)));
  const walkAmt = T < 0.32 ? 1 : T < 0.55 ? 1 - inv(0.32, 0.5, T) : t > DUR - 0.5 ? 1 : 0;
  const walk = T * 11;
  let crouch = T < 0.55 ? 0 : tk(T, [[0.55, 0.05], [1.3, 1, eout]]);
  if (T > w(76)) crouch = lerp(1, 0, eio(inv(w(76) + 0.02, we(79) - 0.05, T)));
  if (t > DUR - 0.62) crouch = 0.15 * Math.sin(Math.PI * inv(DUR - 0.62, DUR, t));
  // head: looking back over her left shoulder at the torch while she steps out; then at the panel / the guard
  // eyes ahead as she comes round; the torch light lands beside her and she snaps a look back over her left shoulder
  let headYaw = T < 0.55 ? tk(T, [[0, 0.15], [0.3, 0.05], [0.5, -0.75]]) : tk(T, [[0.55, -0.75], [1.1, 0]]);
  let headPitch = T < 0.55 ? -0.05 : tk(T, [[0.6, 0], [1.4, 0.2], [3.0, 0.05]]);
  if (t > DUR - 0.62) { headYaw = tk(t, [[DUR - 0.62, 0], [DUR, 1.0]]); headPitch = -0.05; }
  const startle = T > 0.25 && T < 0.7 ? Math.sin(Math.PI * inv(0.25, 0.7, T)) : 0;
  // expressions
  let e = T < 0.28 ? E_SNEAK : T < 0.75 ? mixE(E_SNEAK, E_STARTLE, inv(0.28, 0.38, T)) : mixE(E_STARTLE, E_FOCUS, inv(0.75, 1.2, T));
  if (T > 2.9) e = mixE(E_FOCUS, E_HOLD, inv(2.9, 3.3, T));
  if (T > 15.4) e = mixE(E_HOLD, E_WINCE, inv(15.4, 15.6, T) * (1 - inv(16.0, 16.3, T)));
  if (T > 18.4) e = mixE(E_FOCUS, E_MISCHIEF, inv(19.6, 20.4, T));
  if (T > w(76)) e = mixE(E_MISCHIEF, E_MISCHIEF, 1);
  if (T > w(85) - 0.2) e = mixE(E_MISCHIEF, E_GRIN, inv(w(85) - 0.2, w(85) + 0.2, T));
  if (t > DUR - 0.62) e = mixE(E_GRIN, E_SNEAK, inv(DUR - 0.62, DUR - 0.2, t));
  // arms
  let R: Pose['R'], L: Pose['L'];
  if (T < 0.55) {
    // left hand carries the shield by its near grip; right arm swings with the stride
    L = {W: gripWorld(s, -1, 0.6), hand: GRIP, pole: v3(0, -1, -0.4)};
    R = {hand: HAND_RELAXED, swing: 0.15 * startle};
  } else if (T < w(76)) {
    const both = eio(inv(0.7, 1.05, T));
    L = {W: gripWorld(s, -1, 0.55), hand: GRIP, pole: v3(-1, -0.6, -0.3)};
    const rHang = a3(pos, v3(0.25, 0.75 - 0.3 * crouch, 0.05));
    let rW = lerp3(rHang, gripWorld(s, 1, 0.55), both);
    let rHand = mixHand(HAND_RELAXED, GRIP, both);
    let rDir: V3 | undefined;
    let rPalm: V3 | undefined;
    // grip adjustment in S8: the right hand slides up its grip and back
    const adj = inv(15.5, 16.25, T);
    if (adj > 0 && adj < 1) rW = gripWorld(s, 1, 0.55 + 0.35 * Math.sin(Math.PI * adj));
    // the reach round the right edge (+r side of the panel)
    const out0 = w(61) - 0.15, out1 = we(64) - 0.05, back0 = we(75) + 0.05, back1 = w(76) + 0.0;
    if (T > w(59) && T < back1 + 0.05) {
      const a1 = eio(inv(w(59), out0, T)); // grip -> behind the edge (hidden)
      const a2 = eio(inv(out0, out1, T)); // round the edge into view
      const a3_ = eio(inv(back0, back1, T)); // back to the grip
      const stage = onShield(s, 0.5 - 0.04, 0.12, -0.06);
      const out = floatHandPos(t);
      rW = lerp3(lerp3(gripWorld(s, 1, 0.55), stage, a1), out, a2);
      rW = lerp3(rW, gripWorld(s, 1, 0.55), a3_);
      const o = a2 * (1 - a3_);
      rHand = mixHand(mixHand(GRIP, OPEN, a1), GRIP, a3_);
      // fingers up, palm toward the guard (+z)
      if (o > 0.02) {
        rDir = n3(lerp3(v3(0.2, 0.2, 0.9), v3(-0.05, 1, 0.12), a2));
        rPalm = v3(0, 0, 1);
        // the finger ripple (S13) and a small first twitch when the guard freezes (S12)
        const wv = inv(SHOT.s13 + 0.1, back0 - 0.05, T);
        const tw = inv(SHOT.s12 + 0.25, SHOT.s12 + 0.6, T);
        const env = Math.sin(Math.PI * clamp(wv)) + 0.4 * Math.sin(Math.PI * clamp(tw));
        if (env > 0.01) {
          const ph = (wv > 0 ? wv * Math.PI * 2 * 2.2 : tw * Math.PI * 2);
          rHand = {...rHand, curl: rHand.curl.map((c0, i) => clamp(c0 + 0.85 * env * Math.max(0, Math.sin(ph - i * 0.75)))) as HandPose['curl']};
        }
      }
    }
    R = {W: rW, hand: rHand, pole: v3(1, -0.7, -0.4), dir: rDir, palm: rPalm};
  } else {
    // standing, swinging the shield aside with her left hand; right hand free: the little wave on "right in front"
    const k = eio(inv(w(76) + 0.05, we(79) + 0.1, T));
    L = {W: gripWorld(s, -1, 0.55), hand: GRIP, pole: v3(-1, -0.8, 0)};
    const relax = eio(inv(w(76), w(76) + 0.5, T));
    const hang = a3(pos, v3(0.26, 0.72, 0.06));
    const wave = inv(w(85) - 0.1, w(89) + 0.1, T);
    const waveUp = Math.sin(Math.PI * clamp(wave));
    const up = a3(pos, v3(0.3, 1.18, 0.32));
    let rW = lerp3(lerp3(gripWorld(s, 1, 0.55), hang, relax), up, eio(clamp(waveUp * 1.6)));
    let rHand = mixHand(GRIP, HAND_RELAXED, relax);
    let rDir: V3 | undefined, rPalm: V3 | undefined;
    if (waveUp > 0.05) {
      rDir = n3(v3(0.05, 1, 0.15));
      rPalm = v3(0, 0, 1);
      const ph = wave * Math.PI * 2 * 2;
      rHand = {...OPEN, curl: OPEN.curl.map((c0, i) => clamp(c0 + 0.8 * waveUp * Math.max(0, Math.sin(ph - i * 0.75)))) as HandPose['curl']};
    }
    if (t > DUR - 0.62) rW = lerp3(rW, a3(pos, v3(-0.2, 0.8, 0.25)), eio(inv(DUR - 0.62, DUR - 0.3, t)));
    R = {W: rW, hand: rHand, pole: v3(1, -0.8, -0.2), dir: rDir, palm: rPalm};
    void k;
  }
  const lean = (T < 0.55 ? 0.05 - 0.15 * startle : T < w(76) ? 0.28 : lerp(0.28, 0.02, eio(inv(w(76), we(79), T)))) + (t > DUR - 0.62 ? 0.2 * inv(DUR - 0.62, DUR - 0.3, t) : 0);
  const side = T > w(59) && T < w(76) ? 0.08 * Math.sin(Math.PI * clamp(inv(w(59), w(76), T))) : 0;
  const breath = 0.006 * Math.sin(T * 5.5);
  const sway = clamp((T > 0.55 && T < 1.4 ? -Math.sin(Math.PI * inv(0.55, 1.4, T)) : 0) + (t > DUR - 0.62 ? Math.sin(Math.PI * inv(DUR - 0.62, DUR, t)) : 0) + 0.3 * Math.sin(T * 3.1) * (T < 0.55 ? 1 : 0), -1, 1);
  const blinkAt = [2.4, 12.0, 17.2, 26.9];
  const blink = blinkAt.reduce((m, a) => Math.max(m, clamp(1 - Math.abs(T - a) / 0.07)), 0);
  return {
    pos, yaw, crouch, lean, side, twist: T < 0.55 ? -0.3 : 0, bob: 0.02 * startle + breath, headYaw, headPitch, headRoll: T > w(85) && T < DUR - 0.62 ? 0.15 * eio(inv(w(85), w(85) + 0.3, T)) : 0,
    walk, walkAmt, R, L, expr: e, blink, sway,
  };
};
// the floating hand: just beyond the panel's right edge at chest height of a crouching person, palm to the guard
export const floatHandPos = (t: number): V3 => {
  const s = shieldAt(t);
  const base = onShield(s, 0.5 + 0.07, 0.2, 0.05);
  return a3(base, v3(0.004 * Math.sin(t * 2.3), 0.006 * Math.sin(t * 1.7), 0));
};

// ================================================================ the guard
export const guardZ = (t: number) => {
  const T = lt(t);
  return tk(T, [
    [0, 10.5], [2.4, 8.8, lin], [4.8, 8.8], [13.9, 6.2, lin], [16.0, 4.9, eout], [w(56), 4.75], [SHOT.s11, 4.35],
    [SHOT.s12 + 0.15, 4.35], [SHOT.s12 + 0.55, 4.62, eout], [w(76), 4.55], [w(81), 4.0], [w(81) + 0.25, 4.32, eout], [DUR - 0.62, 4.3], [DUR, 4.22],
  ]);
};
const walking = (t: number) => {
  const T = lt(t);
  // [start, end, amount]: the patrol, then slow creeping steps toward the panel (S10-S11, S14)
  const segs: [number, number, number][] = [[-1, 2.4, 1], [4.8, 16.0, 1], [w(56) + 0.2, SHOT.s11, 0.45], [w(76) + 0.1, w(81), 0.55]];
  let a = 0;
  for (const [s0, s1, m] of segs) a = Math.max(a, m * clamp(Math.min((T - s0) / 0.25, (s1 - T) / 0.35)));
  return a;
};
const GE_SEARCH: HeadExpr = {...EXP0, browDown: 0.45, smile: -0.15, lid: 0.12};
const GE_SQUINT: HeadExpr = {...EXP0, browDown: 0.9, squint: 0.65, smile: -0.2, lid: 0.25};
const GE_PUZZLED: HeadExpr = {...EXP0, browAsym: 0.9, browDown: 0.3, smile: -0.25, smirk: 0.2, lid: 0.1};
const GE_FREEZE: HeadExpr = {...EXP0, wide: 1, browIn: 0.4, open: 0.35, smile: -0.2, lid: 0};
const GE_SHOCK: HeadExpr = {...EXP0, wide: 1, browIn: 0.8, open: 0.85, smile: -0.4, lid: 0};
// where the torch points (a world target)
export const torchAim = (t: number): V3 => {
  const T = lt(t);
  const hand = floatHandPos(t);
  return tk3(T, [
    [0, v3(-1.6, 1.3, 4.8)], [0.32, v3(-1.6, 1.15, 1.2), lin], [0.6, v3(-1.6, 1.0, 0.7)], [1.2, v3(-0.95, 0.8, 3.0)], [2.0, v3(-1.25, 0.75, 2.97)], [2.9, v3(-0.2, 0.7, 2.97)],
    [3.6, v3(-0.55, 0.62, 2.97)], [4.6, v3(-0.5, 0.7, 2.97)], [7.0, v3(-0.9, 0.65, 2.97)], [10, v3(0.3, 0.6, 2.97)], [12.5, v3(-1.2, 0.7, 2.97)],
    [14.0, v3(-0.1, 0.6, 2.97)], [15.4, v3(-0.05, 0.75, 2.97)], [15.9, v3(-0.75, 0.75, 2.97)], [16.6, v3(-0.55, 0.62, 2.97)], [18.4, v3(-0.45, 0.6, 2.97)],
    [20.0, v3(-0.4, 0.55, 2.97)], [SHOT.s11, v3(hand.x, hand.y, hand.z)], [SHOT.s13 + 0.6, v3(hand.x, hand.y, hand.z)], [w(76), v3(-0.5, 0.6, 2.97)],
    [w(81), v3(-0.5, 0.9, 2.9)], [w(81) + 0.18, v3(-0.6, 2.9, 2.2)], [w(81) + 0.55, v3(-0.5, 0.4, 2.7)], [DUR - 0.62, v3(-0.55, 0.15, 2.9)], [DUR, v3(-1.5, 1.0, 2.2)],
  ]);
};
export const guardAt = (t: number): Pose => {
  const T = lt(t);
  const z = guardZ(t);
  const pos = v3(GX, 0, z);
  const wa = walking(t);
  const aim = torchAim(t);
  // lean in toward the shield (S4 squint, S9 close look); startle (S12 freeze/step back, S14 jerk back)
  const leanIn = 0.18 * Math.sin(Math.PI * clamp(inv(4.0, 4.8, T))) + 0.3 * Math.sin(Math.PI * clamp(inv(16.5, 18.4, T))) + 0.12 * clamp(inv(20.3, 20.9, T)) * (1 - clamp(inv(SHOT.s12 + 0.1, SHOT.s12 + 0.4, T)));
  const jerk = Math.sin(Math.PI * clamp(inv(w(81), w(81) + 0.55, T)));
  const back = -0.22 * jerk - 0.12 * Math.sin(Math.PI * clamp(inv(SHOT.s12 + 0.1, SHOT.s12 + 0.6, T))) - 0.08 * clamp(inv(w(81) + 0.4, w(81) + 0.8, T));
  const base: Pose = {
    pos, yaw: Math.PI, crouch: 0.04 * jerk, lean: 0.04 + leanIn + back, side: 0, twist: 0, bob: wa * 0.012 * Math.abs(Math.sin(T * 6)) + 0.03 * jerk, headYaw: 0, headPitch: 0.14, headRoll: 0,
    walk: T * 6, walkAmt: wa * 0.7, R: {hand: GRIP}, L: {hand: HAND_RELAXED}, expr: EXP0, blink: 0, sway: 0, flashlight: true,
  };
  const j = joints(base, DIM_G);
  // head turns toward the torch target, a little behind it; puzzled tilt in S9; tilt in S12
  const toAim = s3(aim, j.N);
  const hy = Math.atan2(toAim.x, toAim.z) - Math.PI;
  const yawH = ((hy + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
  const headYaw = clamp(yawH * 0.8, -0.9, 0.9);
  const headPitch = clamp(-Math.atan2(toAim.y, Math.hypot(toAim.x, toAim.z)) * 0.7 + 0.05, -0.5, 0.6);
  const roll = 0.25 * clamp(inv(17.7, 18.1, T)) * (1 - clamp(inv(18.5, 18.8, T))) + 0.22 * Math.sin(Math.PI * clamp(inv(SHOT.s12 + 0.2, SHOT.s13 + 0.4, T)));
  // torch arm: hand forward at chest height pointing at the target
  const W = a3(a3(a3(j.sh.r, m3(j.F, 0.4)), v3(0, -0.14, 0)), v3(0, 0.25 * clamp(inv(w(81), w(81) + 0.12, T)) * (1 - clamp(inv(w(81) + 0.3, w(81) + 0.6, T))), 0));
  const dir = n3(s3(aim, W));
  // left hand: relaxed; raised slowly toward the floating hand (S12-S13), snatched back on the ripple
  const fh = floatHandPos(t);
  const raise = eio(clamp(inv(SHOT.s12 + 0.35, SHOT.s13 + 0.35, T))) * (1 - eio(clamp(inv(we(75) - 0.1, we(75) + 0.35, T))));
  const flinch = Math.sin(Math.PI * clamp(inv(SHOT.s13 + 0.55, SHOT.s13 + 0.85, T)));
  const reachT = lerp3(a3(j.sh.l, v3(0.05, -0.15, -0.35)), a3(fh, v3(0.05, 0.12, 0.45 + 0.12 * flinch)), 0.9);
  const lW = raise > 0.01 ? lerp3(a3(a3(j.sh.l, m3(j.Rv, -0.06)), v3(0, -0.55, 0.06)), reachT, raise) : undefined;
  let e = wa > 0.5 ? GE_SEARCH : GE_SEARCH;
  if (T > 3.95 && T < 4.9) e = mixE(GE_SEARCH, GE_SQUINT, inv(4.0, 4.25, T));
  if (T > 16.4 && T < 18.6) e = mixE(GE_SQUINT, GE_PUZZLED, inv(17.6, 18.0, T));
  if (T > 16.4 && T < 17.6) e = GE_SQUINT;
  if (T > SHOT.s11) e = mixE(GE_PUZZLED, GE_FREEZE, inv(SHOT.s11 + 0.5, SHOT.s12 + 0.15, T));
  if (T > w(76)) e = mixE(GE_FREEZE, GE_PUZZLED, inv(w(76), w(76) + 0.4, T));
  if (T > w(81) - 0.05) e = mixE(GE_PUZZLED, GE_SHOCK, inv(w(81) - 0.05, w(81) + 0.08, T));
  if (T > w(89)) e = mixE(GE_SHOCK, GE_FREEZE, inv(w(89), w(91), T));
  if (t > DUR - 0.62) e = mixE(GE_FREEZE, GE_SQUINT, inv(DUR - 0.62, DUR - 0.3, t));
  const blinkAt = [1.2, 9.0, 15.2, 20.2];
  const blink = blinkAt.reduce((m, a) => Math.max(m, clamp(1 - Math.abs(T - a) / 0.07)), 0);
  return {
    ...base, headYaw, headPitch, headRoll: roll,
    R: {W, hand: GRIP, dir, pole: v3(-0.4, -1, 0.3)},
    L: lW ? {W: lW, hand: mixHand(HAND_RELAXED, {curl: [0.1, 0.12, 0.2, 0.28], spread: 0.4, thumb: 30, thumbCurl: 0.2}, raise), pole: v3(1, -0.6, 0.2), dir: n3(v3(-0.05, 0.75, -1)), palm: v3(0, 0.2, -1)} : {hand: HAND_RELAXED},
    expr: e, blink,
  };
};
export const torchRay = (t: number) => {
  const g = guardAt(t);
  const j = joints(g, DIM_G);
  return {o: a3(j.R.W, m3(j.R.dir, 0.3)), dir: j.R.dir, eye: j.Hc};
};

// ================================================================ cameras
export const camAt = (t: number): Cam => {
  const sh = shotAt(t);
  const g = guardAt(t);
  const gj = joints(g, DIM_G);
  const eye = gj.Hc;
  const SC = S_HIDE.c;
  switch (sh) {
    case 's1': {
      // corner: she comes round toward us, the guard far down the corridor behind her; the torch light slides past her,
      // a fast push to her eyes; then the camera drops low behind her as she spins and the shield swings round between
      // her and the guard
      const p = womanPos(t);
      const faceT = a3(p, v3(0.02, 1.47, 0.0));
      const T = lt(t);
      if (T < 0.58) {
        const k = eio(inv(-0.2, 0.52, T));
        return {pos: lerp3(v3(0.05, 1.42, 0.05), v3(-0.6, 1.46, 1.02), k), tgt: lerp3(a3(faceT, v3(0.25, -0.05, 0.9)), faceT, k), f: lerp(950, 1500, k)};
      }
      const k = eio(inv(0.58, 1.5, T));
      return {pos: lerp3(v3(-0.6, 1.46, 1.02), v3(-0.05, 1.0, 1.15), k), tgt: lerp3(faceT, v3(-0.5, 0.85, 5.5), k), f: lerp(1500, 1100, k)};
    }
    case 's2': {
      // over the guard's right shoulder: the shield down the corridor, settling
      const k = inv(SHOT.s2, SHOT.s3, t);
      return {pos: a3(eye, v3(-0.55, 0.16, 1.55)), tgt: a3(SC, v3(0.18, 0.08, 0)), f: lerp(2300, 2500, k)};
    }
    case 's3': {
      // the audience's side view: she is crouched behind it; the guard down the corridor
      const k = inv(SHOT.s3, SHOT.s4, t);
      return {pos: v3(1.15, 0.7 + 0.04 * k, lerp(1.6, 1.72, k)), tgt: v3(-0.6, 0.68, 3.4), f: 900};
    }
    case 's4': {
      // the guard, from beside the shield: he stops, narrows his eyes, leans in
      const k = inv(SHOT.s4, SHOT.s5, t);
      return {pos: v3(-0.05, 1.0, 3.35), tgt: a3(eye, v3(0, -0.18, 0)), f: lerp(2600, 2900, k)};
    }
    case 's5': {
      // his point of view, then one continuous push into the shield's surface until the lenses fill the frame:
      // the distance to the surface falls in log space (slow while the whole panel is in frame, fast at the end)
      const k = inv(w(15) - 0.1, we(23) - 0.3, t);
      const kk = Math.pow(eio(k), 1.25);
      const surf = onShield(S_HIDE, 0.18, 0.06, SH.th / 2);
      const startP = a3(eye, v3(0.04, 0.0, -0.24));
      const dir = n3(s3(startP, surf));
      const D0 = l3(s3(startP, surf));
      const D = Math.exp(lerp(Math.log(D0), Math.log(0.024), kk));
      const pos = a3(surf, m3(dir, D));
      const tgtFar = a3(SC, v3(0, 0.05, 0));
      return {pos, tgt: lerp3(tgtFar, surf, smooth(inv(0.15, 0.85, kk))), f: lerp(2300, 1500, smooth(kk))};
    }
    case 's6':
      return sectionCam(t);
    case 's7': {
      // crane down out of the plan view to behind the guard's right shoulder
      const k = eio(inv(SHOT.s7, SHOT.s8, t));
      const a = sectionCam(SHOT.s7);
      const bpos = a3(eye, v3(-0.5, 0.1, 1.15));
      return {pos: lerp3(a.pos, bpos, k), tgt: lerp3(a.tgt, a3(SC, v3(0.1, 0.1, 0)), smooth(k)), f: Math.exp(lerp(Math.log(a.f), Math.log(1700), k)), up: n3(lerp3(v3(0, 0, -1), v3(0, 1, 0), smooth(k)))};
    }
    case 's8': {
      // low, from her right-front: tense, adjusting her grip; the torch light spills round the edge
      const k = inv(SHOT.s8, SHOT.s9, t);
      const hc = joints(womanAt(SHOT.s8 + 0.5), DIM_W).Hc;
      // her face is a hand's width behind the panel: seen in profile just past its left edge, then the camera drifts
      // toward the lens side until the edge crosses her face and the lenses smear it ("your outline disappears")
      const kk = eio(k);
      return {pos: v3(lerp(-1.5, -1.3, kk), lerp(0.86, 0.82, kk), lerp(2.99, 3.13, kk)), tgt: a3(hc, v3(lerp(0.12, 0.2, kk), -0.06, 0.02)), f: lerp(1250, 1350, k)};
    }
    case 's9': {
      // behind the guard: starts a little off his line (her outline shows), arcs onto it (the outline melts away)
      const k = eio(inv(SHOT.s9, w(55) + 0.1, t));
      return {pos: a3(eye, v3(lerp(0.8, -0.62, k), 0.3, lerp(1.5, 1.35, k))), tgt: a3(SC, v3(0.12, 0.1, 0)), f: lerp(1500, 1750, k)};
    }
    case 's10': {
      // her side, from the right: the real arm going round the edge
      const k = inv(SHOT.s10, SHOT.s11, t);
      return {pos: v3(1.05, 0.85, lerp(1.95, 2.05, k)), tgt: v3(-0.5, 0.74, 3.15), f: lerp(1000, 1080, k)};
    }
    case 's11': {
      // the guard's point of view: a hand floating beside the panel
      const k = inv(SHOT.s11, SHOT.s12, t);
      const fh = floatHandPos(t);
      return {pos: a3(eye, v3(0.02, -0.04, -0.24)), tgt: lerp3(a3(SC, v3(0.15, 0.1, 0)), a3(fh, v3(-0.08, 0, 0)), eio(k) * 0.6), f: lerp(1500, 2100, eio(k))};
    }
    case 's12': {
      // reverse: the guard freezes, tilts his head, steps back and raises his own hand
      const k = inv(SHOT.s12, SHOT.s13, t);
      return {pos: v3(-0.12, 0.95, 3.25), tgt: a3(eye, v3(0, -0.22, 0)), f: lerp(1500, 1650, k)};
    }
    case 's13': {
      // over his left shoulder, low: his hand and the floating hand, the ripple, the flinch
      const k = inv(SHOT.s13, SHOT.s14, t);
      // beside his left shoulder, just off his line (the panel still hides her): his arm reaches into the frame toward
      // the floating hand; the ripple; he snatches it back
      const fh0 = floatHandPos(SHOT.s13);
      return {pos: v3(lerp(0.15, 0.1, k), lerp(1.43, 1.4, k), lerp(4.82, 4.72, k)), tgt: lerp3(a3(fh0, v3(0.02, 0.12, 0.2)), a3(fh0, v3(0.02, 0.1, 0.1)), k), f: lerp(1300, 1450, k)};
    }
    case 's14': {
      // the shield comes down: a three-quarter two-shot across the corridor, drifting in
      const k = eio(inv(SHOT.s14, SHOT.s15, t));
      return {pos: lerp3(v3(1.52, 1.28, 3.52), v3(1.44, 1.32, 3.5), k), tgt: lerp3(v3(-0.45, 1.02, 3.5), v3(-0.45, 1.1, 3.48), k), f: lerp(860, 900, k)};
    }
    case 's15': {
      // his jolt: close on his face from beside the lowered shield; the frame stays put as he jerks back
      const k = inv(SHOT.s15, SHOT.s16, t);
      const e0 = joints(guardAt(SHOT.s15), DIM_G).Hc;
      return {pos: v3(0.08, 1.42, 3.0), tgt: lerp3(a3(e0, v3(0, -0.12, 0)), a3(eye, v3(0, -0.12, 0)), 0.55), f: lerp(1900, 2050, k)};
    }
    case 's16': {
      // over his shoulder: she is right in front of him, grinning, the little wave
      const k = inv(SHOT.s16, SHOT.s17, t);
      const face = v3(-0.55, 1.42, 2.62);
      return {pos: a3(eye, v3(lerp(-0.42, -0.38, k), 0.04, lerp(0.62, 0.5, k))), tgt: a3(face, v3(0.03, -0.08, 0)), f: lerp(1500, 1650, k)};
    }
    default: {
      // the two of them, a push in on "the entire time"; a whip as she dashes for the doorway
      const k = eio(inv(SHOT.s17, we(92), t));
      const dash = eio(inv(DUR - 0.5, DUR, t));
      const tg = lerp3(v3(-0.45, 1.1, 3.5), v3(-0.45, 1.2, 3.48), k);
      return {pos: lerp3(v3(1.5, 1.3, 3.52), v3(1.38, 1.34, 3.5), k), tgt: lerp3(tg, v3(-1.4, 1.1, 2.3), dash * 0.6), f: lerp(860, 930, k)};
    }
  }
};
// section: pitch down over the cut, then rise to the plan view (positions above the cut point)
export const CUT_Y = S_HIDE.c.y + 0.06 * SH.h;
export const sectionCam = (t: number): Cam => {
  const P0 = onShield(S_HIDE, 0.18, 0.06, SH.th / 2);
  const front = v3(0, 0, 1);
  // stage 1 (pitch over): camera orbits from in front of the surface to above the cut
  const a = eio(inv(SHOT.s6, SHOT.s6 + 0.85, t));
  const r0 = 0.024;
  const ang = lerp(0, Math.PI / 2, a); // ends exactly overhead, where stage 2 begins (the up vector is explicit)
  const orbitPos = a3(P0, a3(m3(front, Math.cos(ang) * r0), v3(0, Math.sin(ang) * r0, 0)));
  // stage 2 (rise): straight up over the plan, drifting toward the middle between her and the guard
  const r = eio(inv(SHOT.s6 + 0.85, w(32) + 0.4, t));
  const r2 = eio(inv(w(32) + 0.4, w(42), t));
  const h = Math.exp(lerp(Math.log(r0), Math.log(3.2), r)) + lerp(0, 1.6, r2);
  const cx = lerp(P0.x, -0.45, smooth(r)), cz = lerp(P0.z, lerp(3.6, 4.2, r2), smooth(r));
  const above = v3(cx, CUT_Y + h, cz);
  // stage 3 (start of the crane): tilt toward the guard's side
  const c3_ = 0;
  // screen-up turns continuously from +y (facing the surface) to -z (looking down): the guard's left/right is kept
  if (a < 1 || r <= 0) return {pos: orbitPos, tgt: P0, f: 1500, up: n3(v3(0, Math.cos(ang), -Math.sin(ang)))};
  const pos = a3(above, v3(0, -0.4 * c3_, 0.6 * c3_));
  return {pos, tgt: v3(cx, CUT_Y, cz + 1.2 * c3_), f: lerp(1500, 1250, smooth(r)), up: v3(0, 0, -1)};
};
