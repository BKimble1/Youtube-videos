// The Crew in E/F (and the aftermath poses D4 ends on): the Director dying against the slab, the drone pilot reaching
// him and holding his hand to the end (nobody touches the radio), the others surrendered — each for their own reason and
// in their own way (tableau.ts SURRENDER) — and the runner down. Every figure is a FigSpec at film time T built on the
// tableau; contacts are world points shared by both bodies.
import React from 'react';
import {V3, add3, sub3, mul3, norm3, lerp, lerp3, clamp, smooth, noise} from '../../../kit/math';
import {View, headingVec, Item, SpriteItem, makeView} from '../../engine';
import {groundH} from '../../world';
import {
  FigSpec, figureRig, figProps, figLight, figureParts, Pose, keyPose, layer, blendPose, SLUMP, KNEEL, LYING_BACK, STAND, lookR2, dmgR2,
  plateWear, hipReel, Part, figureSprite, SH_X, SH_H, UPPER, FORE, HIP_H, THIGH, SHIN, Face,
  expr, exprMix, focusSearch, slowBlink,
} from '../../rig';
import {TB_CREW, DIRECTOR_SEAT, SURRENDER, flaresHeave} from './tableau';
import {M} from '../../timing';

const hv = headingVec;
/** World point relative to a body: fwd / right (m) along its heading, `up` above the ground there. */
export const at3 = (p: {x: number; z: number}, heading: number, fwd: number, right: number, up: number): V3 => {
  const f = hv(heading), r = hv(heading + 90);
  const x = p.x + f.x * fwd + r.x * right, z = p.z + f.z * fwd + r.z * right;
  return {x, y: groundH(x, z) + up, z};
};
const headingTo = (a: {x: number; z: number}, b: {x: number; z: number}) => (Math.atan2(b.x - a.x, -(b.z - a.z)) * 180) / Math.PI;
const wrap = (a: number) => ((a + 540) % 360) - 180;
/** A window 0 → 1 → 0 between a and b (ramps ri in, ro out). */
const win = (T: number, a: number, b: number, ri = 0.3, ro = 0.3) => smooth((T - a) / ri) * (1 - smooth((T - (b - ro)) / ro));

/** Keyed scalar (smoothstep between keys). */
export const kn = (T: number, keys: [number, number][]): number => {
  if (T <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (T <= keys[i][0]) return lerp(keys[i - 1][1], keys[i][1], smooth((T - keys[i - 1][0]) / (keys[i][0] - keys[i - 1][0])));
  return keys[keys.length - 1][1];
};
/** Keyed point (smoothstep between keys). */
export const kv = (T: number, keys: [number, V3][]): V3 => {
  if (T <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (T <= keys[i][0]) return lerp3(keys[i - 1][1], keys[i][1], smooth((T - keys[i - 1][0]) / (keys[i][0] - keys[i - 1][0])));
  return keys[keys.length - 1][1];
};

// A neutral view for solving world points of a body (the rig's world points do not depend on the view).
const SOLVE_VIEW: View = makeView({pos: {x: 9.5, y: 1.4, z: 7.5}, target: {x: 7, y: 0.6, z: 3.2}, fov: 40});

// ================================================================== the Director
export const DIR = {pos: DIRECTOR_SEAT, heading: TB_CREW.director.heading};
/** The last breath (cue final_breath at this time); the lids start their final close at CLOSE0 and are shut at
 *  M.EYES_CLOSE (196.6); the neck lets go after it. */
export const FINAL_BREATH = 195.0;
const CLOSE0 = 195.25;
/** When the drone pilot's hands close on his. */
export const CLASP_T = 189.45;

/** His breathing, −1 (empty) … 1 (full): ragged and shallow, slowing; one last small breath; a long release; none. */
export const dirBreath = (T: number) => kn(T, [
  [186.0, -0.2], [186.9, 0.15], [187.35, 0.85], [188.25, -0.55], [189.05, 0.7], [190.2, -0.5], [191.1, 0.55], [192.3, -0.45],
  [193.2, 0.42], [194.3, -0.42], [FINAL_BREATH, 0.8], [196.3, -0.6], [197.4, -0.82],
]);
/** 0 = still conscious … 1 = still (the eyes shut, the neck let go). */
const stillK = (T: number) => smooth((T - M.EYES_CLOSE) / 0.9);

/**
 * His face (RIG presets): exhaustion sliding into dying; the eyes keep losing focus and pulling back (focusSearch);
 * when she is there they find her — focus sharpens, the lids lift a little, the brows with them (189.2–190.8) — then
 * slip; heavy slow blinks; after the last breath the lids sag, catch once and close (CLOSE0 → 196.6); stillness.
 */
const dirFace = (T: number): Face => {
  const k = smooth((T - 186.9) / (CLOSE0 - 186.9));
  const base = exprMix('exhaustion', 'dying', k);
  const rec = win(T, 189.15, 190.85, 0.5, 0.9); // he finds her
  const still = stillK(T);
  const fs = focusSearch(T, {amt: lerp(0.5, 0.95, k) * (1 - 0.85 * rec), period: 2.3, seed: 7});
  const blink = Math.min(1, slowBlink(T, 187.7, 0.6) + slowBlink(T, 190.95, 0.8) + slowBlink(T, 193.85, 0.95));
  // heavy but open (the pupils must stay readable: where he looks is the performance) — 0.3 … 0.55
  const lidOpen = clamp(0.3 + 0.14 * k - 0.1 * rec + 0.45 * fs.lid, 0.22, 0.56);
  const lid0 = lidOpen + (1 - lidOpen) * blink;
  // the final close (after RIG eyesClose's shape, re-timed for this drawn lid, which reads shut above ~0.8): the lids
  // sag after the last breath, catch once (a last effort to keep her), then close slowly — the last open sliver
  // lingers ~9 frames — shut at M.EYES_CLOSE
  const shutLid = T < CLOSE0 ? 0 : kn(T, [[CLOSE0, 0], [195.9, 0.64], [196.12, 0.6], [196.3, 0.7], [M.EYES_CLOSE + 0.02, 1]]);
  const b = dirBreath(T);
  // the mouth parts on each inhale (a shallow catch), and a little more on the last one; slack after death
  const open = still > 0 ? lerp(0.16, 0.13, still) : clamp(0.1 + 0.16 * Math.max(0, b) + 0.12 * win(T, 194.75, 196.3, 0.4, 0.9), 0, 0.5);
  return {
    ...base, blink: false, mouth: 'breath', open,
    lid: Math.max(lid0, shutLid),
    unfocus: lerp(fs.unfocus, 0.6, still),
    lookX: fs.lookX * (1 - still), lookY: lerp(fs.lookY, 0.3, still),
    brows: lerp((base.brows ?? 0) + 0.3 * rec, 0, still), worry: lerp((base.worry ?? 0.3) * (1 - 0.35 * rec), 0.08, still),
    squint: 0,
  };
};

/** His body pose at T (no hand targets): slumped against the slab, the breath in the chest and head, the settle. */
export const directorPose = (T: number): Pose => {
  const b = dirBreath(T);
  const settle = smooth((T - (M.EYES_CLOSE + 0.15)) / 1.2); // the neck lets go after the eyes close
  // his head comes round to her as she reaches him (189.2–190.2) and stays toward her, sinking as he goes
  const turn = kn(T, [[186.9, 0], [189.1, 0], [190.2, 1], [192.8, 0.85], [196.6, 0.8]]);
  const base = SLUMP({lean: 27, headRoll: 12});
  return {
    ...base,
    lean: 0, bodyPitch: -(27 + b * 1.3),
    // the back of his head rests on the slab's top edge; when the neck lets go it sinks forward and rolls a little
    // further toward her (the slab still holding it)
    head: {pitch: 22 - b * 2.0 + settle * 7, yaw: -16 * turn - settle * 5, roll: 12 - 6 * turn + settle * 4},
    // left arm limp at his left side, the hand on the ground beside his hip (out from under the clasp; the shattered
    // plate on its forearm)
    armL: {local: {r: -78, u: 24, f: 4}, pole: {r: -1, u: 0.1, f: -0.6}},
    handL: 'limp',
    // his right hand: pressing his side, then held in hers — curled a little, then (as his grip goes, 191.7–192.7) slack
    handR: T < 192.6 ? 'relaxed' : 'limp',
    face: dirFace(T),
    chest: b * 0.55,
    breath: 0,
    shadow: 1,
  };
};

const dirBase = (T: number): FigSpec => ({
  key: 'ef_dir', look: lookR2('director'), t: T, seed: 11, pos: DIR.pos, heading: DIR.heading,
  pose: {...directorPose(T), wearL: plateWear('shattered'), dmg: dmgR2('director', T)},
});

/** His right hand: pressed to his left side, then taken by her and lifted a little; the wrist goes heavy as his grip
 *  lets go (192–193.2: the hand sinks 3 cm into her palm); she keeps holding it to the end. */
export const dirHandR = (T: number): {pos: V3; orient: {fingers: V3; palm: V3; w: number}} => {
  const R = figureRig(SOLVE_VIEW, dirBase(Math.min(T, 189.0)));
  const wound = R.torso({r: -30, u: 48, f: 40});
  const fwdH = hv(DIR.heading), left = hv(DIR.heading - 90);
  // where she holds it: in front of his left hip, toward her, a little up — within his reach (his right arm crosses
  // his body), so her hands close on his real hand, not on a point past it
  const held0 = add3(R.torso({r: -24, u: 6, f: 74}), {x: left.x * 0.16 + fwdH.x * 0.04, y: 0.09, z: left.z * 0.16 + fwdH.z * 0.04});
  const shR = R.torso({r: SH_X, u: SH_H, f: 0});
  const dh = sub3(held0, shR), lh = Math.hypot(dh.x, dh.y, dh.z), maxR = ((UPPER + FORE) / 251.4) * 0.93;
  const held = lh > maxR ? add3(shR, mul3(dh, maxR / lh)) : held0;
  const k1 = smooth((T - (CLASP_T - 0.05)) / 0.7);
  const sag = 0.03 * smooth((T - 192.0) / 1.2);
  const pos = add3(lerp3(wound, held, k1), {x: 0, y: -sag, z: 0});
  const bodyN = norm3(sub3(R.torso({r: 0, u: 60, f: 0}), R.torso({r: 0, u: 60, f: 40})));
  // pressing: palm on his side, fingers toward his left; held: palm down onto her palm, fingers toward her (drooping
  // a little more once the grip has gone)
  const palm = norm3(lerp3(bodyN, {x: 0, y: -1, z: 0}, k1));
  const droop = 0.25 + 0.2 * smooth((T - 192.0) / 1.0);
  const fingers = norm3(lerp3({x: left.x * 0.7 - fwdH.x * 0.2, y: -0.5, z: left.z * 0.7 - fwdH.z * 0.2}, {x: left.x * 0.8 + fwdH.x * 0.4, y: -droop, z: left.z * 0.8 + fwdH.z * 0.4}, k1));
  return {pos, orient: {fingers, palm, w: 1}};
};

/** His head (world; ~stable: the breath moves it by a centimetre) and his chest — perspective anchors for close shots. */
export const DIR_HEAD: V3 = {x: 6.53, y: 1.095, z: 3.04};
export const DIR_CHEST: V3 = {x: 6.72, y: 0.66, z: 3.18};

/** Where his eyes go: toward the sound of her (weakly), onto her face when she is there, slipping; none once still. */
const dirGazeW = (T: number) => kn(T, [[186.9, 0.15], [187.6, 0.35], [188.6, 0.5], [189.25, 0.95], [190.6, 1], [191.6, 0.7], [194.0, 0.55], [195.6, 0.4], [M.EYES_CLOSE, 0]]);

export const directorSpec = (T: number, anchor?: V3): FigSpec => {
  const s = dirBase(T);
  const h = dirHandR(T);
  const gw = dirGazeW(T);
  return {...s, anchor, world: {handR: h.pos, orientR: h.orient}, ...(gw > 0.01 ? {gaze: pilotHead(T), gazeW: gw} : {})};
};

// ================================================================== the drone pilot (checker)
const PIL0 = TB_CREW.drone.pos; // on hands and knees at FINAL_HIT
/** Where she kneels at his left side, facing him (E1 on): close enough that her arms bend as she holds his hand. */
export const PIL_Q = at3(DIR.pos, DIR.heading - 60, 0.9, 0, 0);
const PIL_HQ = headingTo(PIL_Q, DIR.pos);

type Crawl = {pos: V3; heading: number; handL: V3; handR: V3; footL: V3; footR: V3; ph: number};
/** Hands-and-knees crawl along a line from a to b between t0 and t1: hand R, knee L, hand L, knee R per cycle. */
const crawlAt = (T: number, a: V3, b: V3, t0: number, t1: number, cycles = 2): Crawl => {
  const heading = headingTo(a, b);
  const L = Math.hypot(b.x - a.x, b.z - a.z);
  const u = clamp((T - t0) / (t1 - t0));
  const step = L / (cycles * 2);
  const n = cycles;
  const ph = u * n;
  const k = Math.floor(Math.min(ph, n - 1e-6)), f = ph - k;
  const bodyD = (k + smooth(f)) * (L / n) * 0.98 + (u >= 1 ? L * 0.02 : 0);
  const pos = at3(a, heading, Math.min(L, bodyD), 0, 0);
  const limb = (s0: number) => {
    let d = 0, lift = 0;
    for (let c = 0; c < n; c++) {
      const w = clamp(((u * n) - c - s0) / 0.3);
      d += smooth(w) * step * 2;
      lift += Math.sin(Math.PI * clamp(w)) * (w > 0 && w < 1 ? 1 : 0);
    }
    return {d, lift};
  };
  const hR = limb(0), kL = limb(0.2), hL = limb(0.5), kR = limb(0.7);
  const c = (s0: number) => -(0.35 - s0) * step * 2;
  return {
    pos, heading, ph,
    handR: at3(a, heading, CRAWL_HAND + c(0) + hR.d, 0.16, 0.035 + hR.lift * 0.1),
    handL: at3(a, heading, CRAWL_HAND + c(0.5) + hL.d, -0.16, 0.035 + hL.lift * 0.1),
    footL: at3(a, heading, CRAWL_FOOT + c(0.2) + kL.d, -0.11, 0.05 + kL.lift * 0.06),
    footR: at3(a, heading, CRAWL_FOOT + c(0.7) + kR.d, 0.11, 0.05 + kR.lift * 0.06),
  };
};
/** Planted hands sit this far ahead of the body root while crawling (under the shoulders, a little forward). */
const CRAWL_HAND = 0.44, CRAWL_FOOT = -0.2;
/** On hands and knees, the back inclined ~40° (not a plank), the head up toward him. */
const CRAWL_POSE: Pose = {drop: 84, bodyPitch: 50, lean: 0, handL: 'brace', handR: 'brace', head: {pitch: -38}, legL: {pole: {r: -0.1, u: 0.3, f: 1}}, legR: {pole: {r: 0.1, u: 0.3, f: 1}}};
const KNEEL_UP: Pose = {drop: 80, lean: 14, bodyPitch: 0, legL: {local: {r: -30, u: 28, f: -72}, pitch: -50}, legR: {local: {r: 30, u: 28, f: -72}, pitch: -50}, handL: 'relaxed', handR: 'relaxed'};
/** A kneeling foot (the ankle behind the knee, the shin on the ground) for a body at pos/heading whose pelvis is
 *  lowered by `drop` (rig units): the knee lands on the ground in front of the hips, the ankle a shin's length behind. */
const kneelFoot = (pos: V3, heading: number, sd: 1 | -1, drop = 80, lift = 0) => {
  const hipH = (HIP_H - drop) / 251.4, th = THIGH / 251.4, sn = SHIN / 251.4;
  const kf = Math.sqrt(Math.max(0, th * th - (hipH - 0.06) ** 2));
  return at3(pos, heading, kf - sn * 0.99, sd * 0.12, 0.05 + lift);
};

/** Her grief beats after his eyes close (film s). */
const GRIEF = {see: 196.85, crumple: 197.35, bow: 197.7, bowed: 198.9, sob0: 198.2, sob1: 214.0};
const pilotFace = (T: number): Face => {
  // fear and hope while she reaches him; when the eyes close: she sees it (a catch: brows up), then grief
  const see = smooth((T - GRIEF.see) / 0.35), crumple = smooth((T - GRIEF.crumple) / 0.6);
  const before: Face = {...exprMix('fear', 'grief', smooth((T - 189.6) / 2.2)), mouth: T > 189.6 && T < 191.2 ? 'flat' : 'sad', lid: kn(T, [[186.9, 0.08], [190, 0.12], [196.0, 0.2]])};
  const caught: Face = {...expr('realization', 1), open: 0.14};
  const grief: Face = {...expr('grief', 1), lid: 0.62, open: 0.12};
  const f1 = see > 0 ? {...before, ...caught, brows: lerp(before.brows ?? 0.6, 0.8, see)} : before;
  return crumple > 0 ? {...f1, ...grief, brows: lerp(0.8, 0.45, crumple), worry: 1} : f1;
};
/** Small sobs: the shoulders lift and fall, fading. */
const sob = (T: number) => (T < GRIEF.sob0 ? 0 : (1 - smooth((T - (GRIEF.sob1 - 6)) / 6)) * smooth((T - GRIEF.sob0) / 0.6) * Math.max(0, Math.sin((T - GRIEF.sob0) * 2 * Math.PI * 0.55)) ** 2);

/** Her head, world (for his gaze). */
const pilotHead = (T: number): V3 => figureRig(SOLVE_VIEW, pilotSpec(T)).head;

/** Which way her right arm is layered against his hand in the pair sprite (now always under: she never lets go). */
export type RightLayer = 'under' | 'free' | 'top';
export const pilotRightLayer = (_T: number): RightLayer => 'under';

/** The drone pilot at T. */
export const pilotSpec = (T: number, anchor?: V3): FigSpec => {
  const look = lookR2('drone');
  const dmg = dmgR2('drone', T);
  const base = {key: 'ef_pil', look, t: T, seed: 5, anchor};
  const C1 = 188.35; // end of the crawl
  // the crawl stops a little short of her kneeling spot: she sits up clear of him, then shuffles in on her knees
  const crawlEnd = at3(PIL0, headingTo(PIL0, PIL_Q), Math.hypot(PIL_Q.x - PIL0.x, PIL_Q.z - PIL0.z) - 0.25, 0, 0);
  if (T < C1 + 0.05) {
    const cr = crawlAt(T, PIL0, crawlEnd, 186.4, C1, 2);
    const w = Math.sin(2 * Math.PI * cr.ph);
    const bob = Math.abs(Math.sin(2 * Math.PI * cr.ph));
    const moving = clamp((T - 186.4) / 0.2) * (1 - clamp((T - (C1 - 0.15)) / 0.2));
    return {...base, pos: cr.pos, heading: cr.heading,
      pose: {...CRAWL_POSE, drop: (CRAWL_POSE.drop ?? 0) + 6 * bob * moving, twist: 7 * w * moving, side: -4 * w * moving,
        head: {pitch: -38 + 4 * bob * moving, yaw: -6 * w * moving}, face: {...pilotFace(T), lookY: -0.45}, breath: 0.9, dmg},
      world: {handL: cr.handL, handR: cr.handR, footL: cr.footL, footR: cr.footR,
        orientL: {palm: {x: 0, y: -1, z: 0}, fingers: hv(cr.heading), w: 1}, orientR: {palm: {x: 0, y: -1, z: 0}, fingers: hv(cr.heading), w: 1}}};
  }
  const end = crawlAt(C1, PIL0, crawlEnd, 186.4, C1, 2);
  const up = smooth((T - C1) / 0.75);
  // ---- body: sit up beside him, shuffle in on her knees; she stays: kneeling, sitting back toward her heels (spent),
  // leaning in over his hand; when his eyes close she bows over it, the shoulders lifting with small sobs
  const shuffle = smooth((T - 188.9) / 0.5);
  const pos = lerp3(end.pos, PIL_Q, shuffle);
  const heading = end.heading + wrap(PIL_HQ - end.heading) * up;
  const s = sob(T);
  const pose = layer(
    keyPose([
      [C1, {...CRAWL_POSE}],
      [C1 + 0.75, {...KNEEL_UP, lean: 14}],
      [CLASP_T - 0.55, {...KNEEL_UP, lean: 24, drop: 88}], // reaching for his hand: shoulders forward and down
      [CLASP_T, {...KNEEL_UP, lean: 29, drop: 94, twist: -6}],
      [191.2, {...KNEEL_UP, lean: 27, drop: 97, twist: -5}],
      [196.6, {...KNEEL_UP, lean: 26, drop: 100, twist: -4}],
      [GRIEF.see + 0.2, {...KNEEL_UP, lean: 23, drop: 98, twist: -4}], // a catch: she straightens a little
      [GRIEF.bowed, {...KNEEL_UP, lean: 39, drop: 108, twist: -3, side: -3}], // bowed over his hand
      [206.0, {...KNEEL_UP, lean: 41, drop: 110, twist: -3, side: -3}],
    ], T),
    {
      head: {
        pitch: T < CLASP_T ? lerp(-30, 26, up) : kn(T, [[CLASP_T, 26], [196.6, 22], [GRIEF.see + 0.2, 16], [GRIEF.bowed, 36], [206, 40]]),
        yaw: kn(T, [[189.0, 0], [190.0, -6], [GRIEF.bowed, -2]]),
        roll: kn(T, [[190, 0], [192, -8], [197, -11], [GRIEF.bowed, -6]]),
      },
      face: pilotFace(T), dmg, breath: T > GRIEF.sob0 ? 0.25 : 0.7,
    },
  );
  const bp = pose as Pose;
  const posed: Pose = {...bp, lean: (bp.lean ?? 0) + 2.2 * s, side: (bp.side ?? 0) + 0.8 * s, drop: (bp.drop ?? 0) - 3 * s};
  const knee = (sd: 1 | -1) => lerp3(sd < 0 ? end.footL : end.footR, kneelFoot(pos, PIL_HQ, sd, posed.drop), up);
  // ---- hands: her right hand slides under his (contact CLASP_T), her left closes over it; she never lets go
  const H = dirHandR(T);
  const fwdD = hv(DIR.heading);
  const toHer = norm3(sub3(PIL_Q, DIR.pos));
  const under = add3(H.pos, {x: toHer.x * 0.03, y: -0.045, z: toHer.z * 0.03});
  const over = add3(H.pos, {x: -fwdD.x * 0.02 - toHer.x * 0.06, y: 0.05, z: -fwdD.z * 0.02 - toHer.z * 0.06});
  const reach = smooth((T - (CLASP_T - 0.5)) / 0.5); // right hand under his (contact CLASP_T)
  const reachL = smooth((T - (CLASP_T - 0.2)) / 0.5); // then the left hand closes over it
  // (sitting up: her hands come off the ground onto her thighs, elbows bent — not hanging straight down)
  const restR0 = at3(PIL_Q, PIL_HQ, 0.13, 0.13, 0.43), restL0 = at3(PIL_Q, PIL_HQ, 0.15, -0.14, 0.44);
  const hL = lerp3(lerp3(end.handL, restL0, up), over, reachL);
  const hR = lerp3(lerp3(end.handR, restR0, up), under, reach);
  // her squeeze answering his loosening grip (the insert, 191.4–193.1) and again as he goes: the hands press in
  const sq = win(T, 192.3, 193.6, 0.3, 0.6) + win(T, GRIEF.see, GRIEF.bowed + 0.4, 0.3, 0.8);
  const clasp = {palm: {x: 0, y: 1, z: 0}, fingers: norm3({x: -toHer.x, y: -0.15, z: -toHer.z}), w: reach};
  return {...base, pos, heading,
    pose: {...posed, handR: reach > 0.5 ? (sq > 0.3 ? 'grip' : 'open') : 'relaxed', handL: sq > 0.4 ? 'grip' : 'relaxed',
      // elbows out and down (a hold, not a point)
      armL: {pole: {r: -1, u: -0.9, f: -0.3}}, armR: {pole: {r: 1, u: -0.9, f: -0.3}}},
    world: {handR: hR, handL: hL, footL: knee(-1), footR: knee(1), orientR: clasp,
      orientL: {palm: {x: 0, y: -1, z: 0}, fingers: norm3({x: fwdD.x, y: -0.4, z: fwdD.z}), w: reachL}},
    // her eyes on his face; once she bows, on their hands
    gaze: T < GRIEF.bow ? figureRig(SOLVE_VIEW, dirBase(T)).head : H.pos, gazeW: T < 188.6 ? 0 : 0.9};
};

/** Her perspective anchor: the chest. */
export const pilotAnchor = (T: number): V3 => {
  const p = pilotSpec(T);
  return {x: p.pos.x, y: p.pos.y + 0.6, z: p.pos.z};
};

/**
 * One sprite drawing the Director and the drone pilot together with the clasp layered correctly: his body, her right
 * arm and the palm under his hand, his right arm and hand, then the rest of her (torso, head, the hand on his wrist).
 * Painter depth: his seat.
 */
export const clasped = (dir: FigSpec, pil: FigSpec, right: RightLayer = 'under', o: {bias?: number; noCull?: boolean} = {}): SpriteItem => ({
  kind: 'sprite', key: 'ef_pair', pos: dir.pos, bias: o.bias ?? 0.25, noCull: o.noCull,
  draw: (c) => {
    const a = figProps(c.view, dir), b = figProps(c.view, pil);
    if (a.F.k < 0.4) return null;
    const pa = figureParts({...a.props, light: figLight(c, a.F)}).parts, pb = figureParts({...b.props, light: figLight(c, b.F)}).parts;
    const sort = (ps: Part[]) => ps.slice().sort((x, y) => x.z - y.z);
    const hisHand = (q: Part) => q.key === 'arm1' || q.key === 'handf1';
    const herR = (q: Part) => q.key === 'arm1' || q.key === 'handf1';
    const herL = (q: Part) => q.key === 'arm0' || q.key === 'handf0';
    const shadows = [...pa, ...pb].filter((q) => q.key === 'shadow');
    // who is nearer the camera decides whose body is in front; the clasp itself is always her palm, his hand, her hand
    const nearer = (p: V3) => Math.hypot(p.x - c.view.pos.x, p.z - c.view.pos.z);
    const sheFar = nearer(pil.pos) > nearer(dir.pos);
    const herBody = sort(pb.filter((q) => q.key !== 'shadow' && !herL(q) && (right === 'free' || !herR(q))));
    const herTop = sort(pb.filter((q) => herL(q) || (right === 'top' && herR(q))));
    const order: Part[] = [
      ...shadows,
      ...(sheFar ? herBody : []),
      ...sort(pa.filter((q) => q.key !== 'shadow' && !hisHand(q))),
      ...(right === 'under' ? sort(pb.filter(herR)) : []),
      ...sort(pa.filter(hisHand)),
      ...(sheFar ? [] : herBody),
      ...herTop,
    ];
    return <g>{order.map((q, i) => <g key={`${i}_${q.key}`}>{q.el}</g>)}</g>;
  },
});

// ================================================================== the others: surrendered, each in their own way
const struggle = (T: number, seed: number) => (1 - smooth((T - 186.5) / 4)) * noise(T * 2.3, seed);
/** The tether operator sinking onto her knees (0 standing … 1 kneeling). */
const tetherSink = (T: number) => smooth((T - SURRENDER.tether.sink) / (SURRENDER.tether.sunk - SURRENDER.tether.sink));

/** The tableau grip point of a held person (shared with the holder's hand): strains early, follows her down as the
 *  tether operator sinks, rises with the flare carrier's heave. */
export const gripAt = (role: 'tether' | 'decoy' | 'flares' | 'breaker', T: number): V3 => {
  const c = TB_CREW[role];
  const g = c.held!.at;
  const f = hv(c.heading);
  const s = role === 'tether' ? struggle(T, 9.3) * (1 - smooth((T - SURRENDER.tether.giveUp) / 0.8)) : struggle(T, role.length * 3.1);
  let p = {x: g.x + f.x * s * 0.06, y: g.y + Math.abs(s) * 0.02, z: g.z + f.z * s * 0.06};
  if (role === 'tether') {
    // as she goes down onto her knees the held wrist comes down with her (pulled a little back up by the grip)
    const k = tetherSink(T);
    p = {x: p.x - f.x * 0.06 * k, y: p.y - 0.38 * k, z: p.z - f.z * 0.06 * k};
  }
  if (role === 'flares') p = {...p, y: p.y + 0.07 * flaresHeave(T)};
  return p;
};

/** Head yaw (rig convention: + = to the figure's left) toward a world point, clamped. */
const yawTo = (pos: {x: number; z: number}, heading: number, at: {x: number; z: number}, lim = 70) => -clamp(wrap(headingTo(pos, at) - heading), -lim, lim);
const DIR_AT = {x: DIRECTOR_SEAT.x, z: DIRECTOR_SEAT.z};

export const heldSpec = (role: 'tether' | 'decoy' | 'flares' | 'breaker' | 'runner', T: number): FigSpec => {
  const c = TB_CREW[role];
  const look = lookR2(role);
  const dmg = dmgR2(role, T);
  const base = {key: `ef_${role}`, look, t: T, seed: role.length + 20, pos: c.pos, heading: c.heading};
  const s = struggle(T, role.length * 3.1);
  // grief reaches each of them at a different moment (they see the drone pilot bow over him)
  const toDir = yawTo(c.pos, c.heading, DIR_AT);

  if (role === 'tether') {
    const S = SURRENDER.tether;
    const strain = 1 - smooth((T - S.giveUp) / 0.9);
    const sink = tetherSink(T);
    const mouth = win(T, S.mouth, S.sink + 0.1, 0.6, 0.5); // her free hand to her mouth
    const grief = smooth((T - (S.mouth - 0.4)) / 1.2);
    const stand: Pose = {
      ...STAND, drop: lerp(20, 14, strain), lean: lerp(6, 18 + s * 5, strain), twist: 6 * strain, side: -3 * (1 - strain),
      head: {pitch: lerp(14, 8, strain) + grief * 12 + sink * 8, yaw: toDir * 0.5},
      // her free (right) hand out toward him while she strains; it drops when the strain gives out
      armR: {local: {r: lerp(46, 24, strain), u: lerp(176, 232, strain), f: lerp(26, 122, strain)}}, handR: strain > 0.4 ? 'open' : 'relaxed', handL: 'fist',
      legL: {local: {r: -40, u: 10, f: 46}}, legR: {local: {r: 44, u: 10, f: -50}},
      face: strain > 0.2 ? {...expr('fear', 0.9), mouth: 'open', open: 0.25} : grief > 0.3 ? {...expr('grief', 0.95), lid: 0.4} : {...expr('exhaustion', 0.7), brows: 0.55, worry: 0.8, mouth: 'sad'},
      dmg, extra: hipReel(0), breath: 0.7,
    };
    // on her knees (both), sitting back a little, head bowed; the held wrist still up behind her
    const kneel: Pose = {...KNEEL_UP, drop: 92, lean: 16, head: {pitch: 30, yaw: toDir * 0.3}, handR: 'relaxed', handL: 'fist', face: {...expr('grief', 1), lid: 0.55}, dmg, extra: hipReel(0), breath: 0.5};
    const pose = sink > 0 ? blendPose(stand, kneel, sink) : stand;
    const world: FigSpec['world'] = {handL: gripAt('tether', T)};
    if (sink > 0.02) {
      // the knees come down one after the other (left, then right), each with a small lift
      const kf = (sd: 1 | -1, t0: number) => {
        const u = smooth((T - t0) / 0.7);
        const st = at3(c.pos, c.heading, sd < 0 ? 0.12 : -0.12, sd * 0.19, 0.03);
        return add3(lerp3(st, kneelFoot(c.pos, c.heading, sd, 92), u), {x: 0, y: 0.08 * Math.sin(Math.PI * u), z: 0});
      };
      world.footL = kf(-1, S.sink + 0.05);
      world.footR = kf(1, S.sink + 0.45);
    }
    // the free hand: out toward him / dropped / up to her mouth / down on her thigh as she kneels
    const R0 = figureRig(SOLVE_VIEW, {...base, pose, world});
    const mouthP = add3(R0.head, add3(mul3(hv(c.heading), 0.11), {x: 0, y: -0.07, z: 0}));
    const thigh = at3(c.pos, c.heading, 0.22, 0.12, 0.3);
    let hand = R0.handR;
    if (mouth > 0) hand = lerp3(hand, mouthP, mouth);
    if (sink > 0) hand = lerp3(hand, thigh, smooth((T - (S.sink + 0.3)) / 0.8));
    return {...base, pose: {...pose, handR: mouth > 0.5 ? 'fist' : pose.handR}, world: {...world, handR: hand}};
  }

  if (role === 'decoy') {
    const S = SURRENDER.decoy;
    const up = smooth((T - S.handsUp) / 0.7) * (1 - smooth((T - S.lower) / 1.2));
    const both = smooth((T - (S.handsUp - 0.05)) / 0.6); // the front foot comes back: both knees down
    const lowered = smooth((T - S.lower) / 1.2);
    const glance = win(T, S.glance, S.glance + 1.4, 0.25, 0.4);
    const grief = smooth((T - 198.9) / 1.5);
    const shake = up * (1 - smooth((T - 192) / 6)) * 2.2;
    const tremor = (k: number) => shake * Math.sin(T * 2 * Math.PI * 7.3 + k) * (0.6 + 0.4 * noise(T * 3, k));
    const yawB = yawTo(c.pos, c.heading, TB_CREW.breaker.pos);
    const held: Pose = {...KNEEL('L'), lean: 10 + s * 3, head: {pitch: 10, yaw: toDir * 0.4}, armL: {local: {r: -8, u: 286, f: 46}}, handL: 'relaxed', handR: 'fist', face: {...expr('fear', 1), mouth: 'sad'}};
    // both knees down, open hands raised to the sides of her head, palms toward the machines
    const handsUp: Pose = {
      ...KNEEL_UP, drop: 86, lean: 4,
      armL: {local: {r: -100 + tremor(1), u: 318 + tremor(2), f: 34}, palm: {r: 0, u: 0.15, f: 1}, pole: {r: -1, u: -1, f: 0.1}},
      armR: {local: {r: 102 + tremor(3), u: 324 + tremor(4), f: 34}, palm: {r: 0, u: 0.15, f: 1}, pole: {r: 1, u: -1, f: 0.1}},
      handL: 'open', handR: 'open', face: {...expr('fear', 0.85), mouth: 'flat', lid: 0.1},
      head: {pitch: 6, yaw: toDir * 0.35 + (yawB - toDir * 0.35) * glance},
    };
    // hands sunk to her thighs, palms still open; head bowed
    const down: Pose = {...KNEEL_UP, drop: 94, lean: 12, armL: {local: {r: -40, u: 118, f: 62}, palm: {r: 0, u: 1, f: 0.2}}, armR: {local: {r: 40, u: 118, f: 62}, palm: {r: 0, u: 1, f: 0.2}}, handL: 'open', handR: 'open', head: {pitch: 26, yaw: toDir * 0.25}, face: {...expr('grief', 1)}};
    let pose = blendPose(held, handsUp, both);
    if (lowered > 0) pose = blendPose(pose, down, lowered);
    if (grief > 0 && lowered < 0.5) pose = {...pose, face: {...expr('grief', 0.9)}};
    pose = {...pose, dmg, breath: 0.6};
    // the front foot (right) comes back under her as she drops to both knees, lifted (no slide)
    const world: FigSpec['world'] = {};
    // the held wrist: on the grip until she is let go, then (0.5 s) up into her raised hand's own place
    const free = smooth((T - S.release) / 0.5);
    if (free < 1) world.handR = free <= 0 ? gripAt('decoy', T) : lerp3(gripAt('decoy', S.release), figureRig(SOLVE_VIEW, {...base, pose}).handR, free);
    if (both > 0 && both < 1) {
      const u = both;
      const front = at3(c.pos, c.heading, 0.34, 0.15, 0.03);
      world.footR = add3(lerp3(front, kneelFoot(c.pos, c.heading, 1, 86), u), {x: 0, y: 0.1 * Math.sin(Math.PI * u), z: 0});
    }
    return {...base, pose, world};
  }

  if (role === 'flares') {
    const S = SURRENDER.flares;
    const press = smooth((T - S.press) / 0.6);
    const heave = flaresHeave(T);
    const drop = smooth((T - S.drop) / 0.9);
    const glance = win(T, S.glance, S.glance + 1.3, 0.3, 0.45);
    const yawD = yawTo(c.pos, c.heading, TB_CREW.decoy.pos);
    const grief = smooth((T - 199.6) / 1.5);
    const pose: Pose = {
      ...KNEEL('R'), lean: 22 + 10 * press - 18 * heave + 6 * drop + s * 3, drop: 84 + 8 * press - 10 * heave,
      head: {pitch: lerp(18, -6, heave) + 20 * drop + grief * 6 + (-12 * glance), yaw: toDir * 0.3 * (1 - glance) + yawD * 0.8 * glance},
      // his free left hand braced on his left knee
      armL: {local: {r: -44, u: 120, f: 92}}, handL: 'brace', handR: 'fist',
      face: heave > 0.2 ? {...expr('effort', 1)} : drop > 0.3 ? {...exprMix('pain', 'grief', grief), lid: 0.45} : {...expr('pain', 0.8)},
      dmg, breath: 0.8 - 0.4 * drop,
    };
    return {...base, pose, world: {handR: gripAt('flares', T)}};
  }

  if (role === 'breaker') {
    const S = SURRENDER.breaker;
    const shake = 1 - smooth((T - (S.shakeEnd - 1.2)) / 1.2);
    const tr = (k: number) => shake * Math.sin(T * 2 * Math.PI * 9.1 + k) * 2.4;
    const away = smooth((T - S.away) / 1.0);
    const pose: Pose = {
      drop: 128, lean: 8 + 6 * away, bodyPitch: -10,
      head: {pitch: 6 + 22 * away, yaw: toDir * 0.6 * (1 - away) - 38 * away},
      legL: {local: {r: -36, u: 12, f: 150}}, legR: {local: {r: 40, u: 46, f: 80}, pitch: -10},
      // right hand gripping the bleeding left forearm across his lap — shaking until the shock settles
      armL: {local: {r: 10, u: 120, f: 70}}, armR: {local: {r: -14 + tr(1), u: 130 + tr(2), f: 76}}, handL: 'relaxed', handR: 'grip',
      face: away > 0.3 ? {...expr('grief', 0.9), lid: 0.5} : {...exprMix('pain', 'exhaustion', smooth((T - 186) / 6)), mouth: 'grit'},
      dmg, breath: 0.9,
    };
    return {...base, pose};
  }

  // runner: down on his back, alive — breathing; tries to rise on his elbows toward the van; lies back
  const S = SURRENDER.runner;
  const rise = win(T, S.rise, S.down + 0.6, 0.55, 0.9);
  const grief = smooth((T - S.rise) / 0.8);
  const pose: Pose = {
    ...LYING_BACK, bodyPitch: -86 + 26 * rise,
    head: {roll: 12 * (1 - rise), yaw: -40 * (1 - rise), pitch: -4 + 10 * rise},
    armR: {fk: {fwd: 20 + 8 * Math.sin(T * 0.9) * (1 - rise), out: 40, bend: 30 + 60 * rise}},
    armL: {fk: {fwd: 30, out: 50 - 20 * rise, bend: 20 + 70 * rise}},
    face: rise > 0.2 ? {...expr('pain', 0.7), brows: 0.5} : grief > 0.5 ? {...expr('grief', 0.8), lid: 0.5} : {brows: 0.4, worry: 0.6, mouth: 'pant', lid: 0.45},
    breath: 0.5 + 0.4 * rise, dmg,
  };
  // the elbows find the ground as he rises
  const world: FigSpec['world'] = {};
  if (rise > 0.02) {
    const f = hv(c.heading);
    const el = (sd: 1 | -1) => at3(c.pos, c.heading, -0.42, sd * 0.3, 0.05);
    void f;
    const R0 = figureRig(SOLVE_VIEW, {...base, pose});
    world.handL = lerp3(R0.handL, el(-1), rise);
    world.handR = lerp3(R0.handR, el(1), rise);
  }
  return {...base, pose, world};
};

/** All aftermath Crew figures except the pair at the slab (for wides). */
export const othersItems = (T: number): Item[] => (['tether', 'decoy', 'flares', 'breaker', 'runner'] as const).map((r) => figureSprite(heldSpec(r, T)));

/** For D4: the Crew as they are at FINAL_HIT (the pair drawn as one clasp-aware sprite). */
export const aftermathCrewItems = (T: number): Item[] => [clasped(directorSpec(T), pilotSpec(T)), ...othersItems(T)];
