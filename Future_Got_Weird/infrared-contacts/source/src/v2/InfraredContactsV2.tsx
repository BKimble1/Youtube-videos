// FGW "These Contacts Let You See With Your Eyes Closed" V2: a visual rebuild on the LOCKED V1 audio (narration,
// music, effects and captions unchanged). Same spatial model as V1 (train L0 -> lead L1 -> eye section L2).
//   Hook 0-4.85     macro: a refracting lens lands on the eye, squashes and settles; the lid shuts; the wearer's
//                   view opens out of the closed lid: darkness, a flash (1.24). Pull out to a two-shot: closed eyes,
//                   a hand with a compact transmitter. The button is pressed; the camera follows the (schematic)
//                   pulse back into the closed eye; the view opens again: flashes on the two flash tones (3.40, 4.00).
//                   Out to the face: eyes shut, outwardly nothing.
//   4.85-7.9        the lead opens their eyes; the scene clears to an explanation field; a spectrum strip; visible
//                   light enters and the pupil reacts (6.255 chime); an infrared wave enters and nothing happens
//                   (7.205 thud).
//   7.45-13.7       push into the same open eye: cutaway; the lens slides on (8.40 click); push into its material:
//                   layered, refracting, with hexagonal nanocrystals; the marked crystal stores two infrared packets
//                   (10.23, 10.83) and releases one green emission (11.5); pull back: conversions ripple across the
//                   crystals; out to the section; the lids close (13.55).
//   13.7-22.9       out to the real closed-eyed face; push to the closed lid; side-on cutaway: visible light stops
//                   in the lid (15.09-15.55), infrared continues (17.45); follow one infrared packet to the lens
//                   (19.10), into the material, conversion at a crystal (20.24), follow the green light inward to the
//                   retina (21.5), into the wearer's view: the payoff flash (22.24).
//   22.9-29.7       out to the night train: the lead asleep; the sender raises the transmitter; the frame splits:
//                   above, the compartment where nothing is visible; below, the wearer's view: the 4-pulse code in
//                   sync with the presses; the split closes back into the closed eye; a tiny smile.
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import '@fontsource-variable/nunito';
import '@fontsource-variable/fredoka';
import {
  FPS, DUR, Pt, P, Cam, clamp, lerp, inv, ramp, eio, eio2, eout, ein, fadeWin, camKeys, keyCam, screenMats, matStr, apply,
  headToL0, L2toL0, SCALE1, SCALE2, Mat, rot,
} from '../lib';
import {V2, SFX} from './timing2';
import {LeadHead, LeadBody, Finger, LeadPose, POSE0, EYE, fissurePath} from '../art/Lead';
import {EyeContent, LensFlight, EyeState, EYE0, LENS_C} from './Eye2';
import {Section2View, Section2State, LID_FRONT_X2, rippleAmt, HERO, polar} from './Section2';
import {PARTICLES} from '../art/Section';
import {TrainBack, Sender, Bystander, senderHand, LAYOUT} from '../art/Train';
import {Captions, Chip, Packet, Kind} from '../Overlay';
import {POV, Ap, apLerp, FULL, Flash, Spectrum, pill} from './Overlay2';
import {LIGHT} from '../theme';

const lerp2 = (a: Pt, b: Pt, k: number) => P(lerp(a.x, b.x, k), lerp(a.y, b.y, k));
const pw = (t: number, keys: [number, number][]) => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) return lerp(keys[i - 1][1], keys[i][1], inv(keys[i - 1][0], keys[i][0], t));
  return keys[keys.length - 1][1];
};
const EYE_C = P(4, 6);
const LID_P = P(2, 15);

// ---------------- lead ----------------
const tiltAt = (t: number) => -4 * ramp(23.4, 25.2, t, eio) + 1.6 * Math.sin(Math.PI * clamp((t - 24.6) / 1.6)) * (t > 24.6 && t < 26.2 ? 1 : 0);
const lidAt = (t: number) => {
  if (t < V2.lidClose0) return 0;
  if (t < V2.eyeOpen0) return ramp(V2.lidClose0, V2.lidClose1, t, (x) => (x < 1 ? 1 - Math.pow(1 - x, 2.6) : 1));
  if (t < V2.lidsClose0) return 1 - ramp(V2.eyeOpen0, V2.eyeOpen1, t, eio);
  return ramp(V2.lidsClose0, V2.lidsClose1, t, eio);
};
const leadPose = (t: number): LeadPose => {
  const squeeze = 0.3 * ramp(V2.contact, V2.contact + 0.1, t, eout) * (1 - ramp(V2.contact + 0.16, 0.75, t, eio));
  const look = ramp(0.5, 1.0, t);
  const curious = fadeWin(t, 4.95, 7.6, 0.3);
  return {
    ...POSE0, lid: lidAt(t), squeeze,
    brow: lerp(0.45, 0.15, ramp(0.6, 1.4, t)) + 0.35 * curious - 0.2 * ramp(23.4, 25, t) + 0.3 * ramp(V2.smirk0, V2.smirk1, t, eout),
    gx: lerp(0.3, 0.12, look) + 0.45 * curious, gy: lerp(-0.45, 0, look) - 0.1 * curious,
    smirk: ramp(V2.smirk0, V2.smirk1, t, eout) + 0.25 * fadeWin(t, 4.62, 4.95, 0.12) * 0,
    tilt: tiltAt(t),
    lensOn: 0,
    breath: Math.sin(t * 2 * Math.PI * 0.24),
  };
};
const eyeState = (t: number): EyeState => {
  const seated = t >= V2.contact && (t < V2.eyeOpen0 || t > V2.lidsClose0);
  const dt = t - V2.contact;
  const squash = seated && dt < 1.2 ? 1 + 0.1 * Math.exp(-dt / 0.13) * Math.cos((2 * Math.PI * dt) / 0.24) : 1;
  const pupil = 1 - 0.28 * ramp(V2.visArrive, V2.visArrive + 0.2, t, eout) * (1 - ramp(7.0, 7.5, t, eio));
  return {
    ...EYE0,
    gx: leadPose(t).gx, gy: leadPose(t).gy, pupil,
    glow: ramp(V2.visArrive, V2.visArrive + 0.08, t) * (1 - ramp(V2.visArrive + 0.3, V2.visArrive + 0.9, t)),
    lensOn: seated ? 1 : 0, squash,
    glint: seated && dt < 1 ? lerp(-0.3, 1.3, clamp((dt - 0.03) / 0.5)) : -1,
    ripple: seated && dt < 0.5 ? dt / 0.48 : -1,
  };
};
// fingertip + lens in flight (head coords)
const flightAt = (t: number) => {
  const k = eout(clamp(t / V2.contact)) * 0.9 + clamp(t / V2.contact) * 0.1;
  return {c: lerp2(P(40, 22), LENS_C, k), s: lerp(1.2, 1.0, k)};
};
const fingerAt = (t: number) => {
  if (t < V2.contact) {const f = flightAt(t); return {tip: P(f.c.x + 11 * f.s, f.c.y + 7 * f.s), dir: 32};}
  if (t < V2.fingerOut0) return {tip: P(LENS_C.x + 11, LENS_C.y + 7 + 1.5 * Math.sin((t - V2.contact) * 30)), dir: 32};
  const k = ramp(V2.fingerOut0, V2.fingerOut1, t, (x) => x * x * (2.4 - 1.4 * x));
  return {tip: lerp2(P(LENS_C.x + 11, LENS_C.y + 7), P(330, 380), k), dir: lerp(32, 44, k)};
};

// ---------------- section ----------------
const heroX = (t: number) => pw(t, [[V2.heroLaunch, 196], [V2.heroLid, 137.5], [V2.heroLidOut, 119.7], [V2.heroLens, 118.3], [V2.heroParticle, HERO.x]]);
const sectionState = (t: number, zl: number, view: Section2State['view']): Section2State => {
  const inC = t < 14.2;
  const charge = inC
    ? clamp((t - V2.absorb1) / 0.12) + clamp((t - V2.absorb2) / 0.12)
    : 2 * ramp(V2.heroParticle - 0.05, V2.convert - 0.05, t);
  const emit = inC ? ramp(V2.emit0, V2.emit1, t, (x) => x) : ramp(V2.convert, V2.convert + 0.8, t, (x) => x);
  const green = ramp(V2.greenRetina - 0.15, V2.greenRetina + 0.2, t) * (1 - ramp(22.4, 22.75, t));
  return {
    t, zl, view,
    reveal: inC
      ? ramp(V2.reveal0, V2.reveal1, t, eout) * (1 - ramp(V2.unreveal0, V2.unreveal1, t, eio))
      : ramp(V2.reveal2_0, V2.reveal2_1, t, eout) * (1 - ramp(V2.unreveal3 - 0.35, V2.unreveal3, t, eio)),
    lidOpen: inC ? 1 - ramp(V2.lidsClose0, V2.lidsClose1, t, eio) : 0,
    lensIn: inC ? ramp(V2.lensIn0, V2.lensIn1, t, (x) => 1 - Math.pow(1 - x, 3)) : 1,
    retina: {amt: green, spread: 46, col: LIGHT.green},
    hero: {charge: charge * (1 - emit), emit, mark: inC ? fadeWin(t, V2.mark0, V2.mark1, 0.2) : fadeWin(t, V2.heroParticle - 0.3, V2.convert + 0.5, 0.2)},
    rippleT0: inC ? V2.ripple0 : Infinity,
    lensFocus: inC ? fadeWin(t, V2.lensIn1 - 0.15, V2.lensIn1 + 0.7, 0.15) : 0,
  };
};

// ---------------- camera ----------------
const camAt = (t: number): Cam => {
  const tilt = tiltAt(t);
  const H1 = (p: Pt) => headToL0(p, tilt);
  const H2 = (p: Pt) => L2toL0(p, tilt);
  const K = (lvl: 0 | 1 | 2, p: Pt, sx: number, sy: number, zl: number) => keyCam({lvl, p: lvl === 0 ? p : lvl === 1 ? H1(p) : H2(p), sx, sy, zl});
  const leadEye0 = H1(EYE_C);
  const lin = (x: number) => x;
  return camKeys(t, [
    [0, K(1, P(10, 6), 540, 860, 10.0)],
    [0.72, K(1, P(10, 6), 540, 860, 10.6), lin],
    [V2.pov1In1, K(1, LID_P, 540, 900, 14), eio],
    [V2.pov1Out0, K(1, LID_P, 540, 900, 14.6), lin],
    [2.35, K(0, P(486, 880), 540, 900, 1.6), eio],
    [V2.pulse0, K(0, P(490, 880), 540, 900, 1.66), lin],
    [V2.pov2In1 - 0.04, K(1, LID_P, 540, 900, 14), (x) => eio2(x) * 0.6 + ein(x) * 0.4],
    [V2.pov2Out0, K(1, LID_P, 540, 900, 15.5), lin],
    [4.9, K(1, P(30, 40), 520, 880, 2.3), eio],
    [5.55, K(1, P(14, 4), 540, 900, 8.2), eio],
    [7.3, K(1, P(14, 4), 540, 900, 8.8), lin],
    [V2.reveal1, K(2, P(24, 20), 540, 960, 4.0), eio],
    [SFX.lensClick, K(2, P(28, 18), 540, 958, 4.2), lin],
    [V2.push1, K(2, HERO, 540, 820, 300), eio],
    [10.4, K(2, HERO, 560, 800, 1150), eio2],
    [V2.emit0 - 0.05, K(2, HERO, 560, 800, 1250), lin],
    [12.0, K(2, HERO, 600, 830, 560), eio],
    [12.95, K(2, HERO, 620, 840, 150), (x) => x * (2 - x)],
    [13.75, K(2, P(30, 10), 540, 940, 4.0), eio],
    [V2.faceD, K(1, P(20, 30), 500, 860, 2.4), eio],
    [V2.reveal2_1, K(2, P(112, -30), 540, 820, 6.4), eio],
    [15.7, K(2, P(118, -32), 560, 830, 7.4), lin],
    [16.75, K(2, P(116, 4), 540, 860, 7.0), eio],
    [18.4, K(2, P(118, -2), 540, 860, 8.4), lin],
    [V2.heroLens, K(2, P(118.4, -6.8), 560, 860, 18), eio],
    [V2.heroParticle, K(2, HERO, 540, 840, 420), eio],
    [V2.convert + 0.06, K(2, HERO, 540, 840, 560), eio2],
    [21.45, K(2, P(-40, 0), 540, 900, 4.6), eio],
    [V2.pov3In1, K(2, P(-88, 0), 540, 900, 9.0), eio],
    [V2.unreveal3, K(1, LID_P, 540, 900, 14), lin],
    [V2.pov3Out1, K(1, LID_P, 540, 900, 12.5), lin],
    [24.55, K(0, leadEye0, 400, 760, 2.0), eio2],
    [25.85, K(0, leadEye0, 420, 780, 2.35), lin],
    [V2.split1 - 0.15, K(0, P(560, 677), 540, 500, 1.2), eio],
    [V2.split2, K(0, P(560, 677), 540, 500, 1.24), lin],
    [V2.split3 + 0.1, K(0, P(560, 860), 540, 900, 1.04), eio],
    [DUR, K(0, leadEye0, 470, 820, 2.5), eio2],
  ]);
};
const invMat = (m: Mat): Mat => {
  const det = m[0] * m[3] - m[1] * m[2];
  const a = m[3] / det, b = -m[1] / det, c = -m[2] / det, d = m[0] / det;
  return [a, b, c, d, -(a * m[4] + c * m[5]), -(b * m[4] + d * m[5])];
};

// ---------------- the frame ----------------
export const FrameV2: React.FC<{t: number; captions: boolean}> = ({t, captions}) => {
  const cam = camAt(t);
  const pose = leadPose(t);
  const eye = eyeState(t);
  const tilt = pose.tilt;
  const M = screenMats(cam, tilt);
  const zl2 = cam.z * SCALE2, zl1 = cam.z * SCALE1;
  const inv2 = invMat(M.L2);
  const c0 = apply(inv2, P(0, 0)), c1 = apply(inv2, P(1080, 1920));
  const view = {x0: Math.min(c0.x, c1.x), x1: Math.max(c0.x, c1.x), y0: Math.min(c0.y, c1.y), y1: Math.max(c0.y, c1.y)};
  const sec = sectionState(t, zl2, view);
  const s2 = (p: Pt) => apply(M.L2, p);
  const sH = (p: Pt) => apply(M.Head, p);
  const s0 = (p: Pt) => apply(M.L0, p);
  const eyeS = sH(EYE_C);
  const showTrain = cam.z < 30;
  const showFig = cam.z < 9;
  const fis = fissurePath(pose.lid, pose.squeeze);

  // ---- explanation field (clears the train around the open eye for the ordinary-vision demo and the section) ----
  const wipe = ramp(V2.wipe0, V2.wipe1, t, eio) * (1 - ramp(V2.wipeBack0, V2.wipeBack1, t, eio));

  // ---- transmitter ----
  const aimHook = fadeWin(t, 1.55, 4.4, 0.35);
  const aimEnd = ramp(V2.aim0, V2.aim1, t, eio) * (1 - 0.6 * ramp(V2.lower0, V2.lower1, t, eio));
  const aim = Math.max(aimHook, aimEnd);
  const presses: [number, number][] = [[V2.press0, 0.14], ...SFX.buttons.map((b, i) => [b, SFX.codeLen[i]] as [number, number])];
  const press = presses.reduce((m, [at, len]) => Math.max(m, clamp((t - at) / 0.04) * (1 - clamp((t - at - len) / 0.05))), 0);
  const hand = senderHand(aim);
  const handDeg = lerp(-60, -18, aim);
  const tip0 = P(hand.x + rot(P(-92, -2), handDeg).x * LAYOUT.sender.s, hand.y + rot(P(-92, -2), handDeg).y * LAYOUT.sender.s);
  const tipS = s0(tip0);

  // ---- POV apertures ----
  const lidAp: Ap = (() => {
    const a = sH(EYE.L), b = sH(EYE.M), c = sH(P(0, 17));
    return {cx: c.x, cy: c.y, w: Math.max(4, Math.hypot(b.x - a.x, b.y - a.y) * 0.9), h: 4, r: 2};
  })();
  const k1 = ramp(V2.pov1In0, V2.pov1In1, t, eio) * (1 - ramp(V2.pov1Out0, V2.pov1Out1, t, eio));
  const k2 = ramp(V2.pov2In0, V2.pov2In1, t, eio) * (1 - ramp(V2.pov2Out0, V2.pov2Out1, t, eio));
  const retS = s2(polar(P(0, 0), 89, 180));
  const k3in = ramp(V2.pov3In0, V2.pov3In1, t, eio), k3out = ramp(V2.pov3Out0, V2.pov3Out1, t, eio);
  // aperture size follows sqrt(k) so the covered area (and the screen change) grows evenly
  const ap3 = pill(k3out > 0 ? apLerp(lidAp, FULL, Math.sqrt(1 - k3out)) : apLerp({cx: retS.x, cy: retS.y, w: 12, h: 12, r: 6}, FULL, Math.sqrt(k3in)));
  const ksplit = ramp(V2.split0, V2.split1, t, eio) * (1 - ramp(V2.split2, V2.split3, t, eio));
  const PANEL: Ap = {cx: 540, cy: 1462, w: 1120, h: 924, r: 0};
  const apS0 = apLerp(lidAp, PANEL, Math.sqrt(ksplit));
  const apS = {...apS0, r: (1 - ksplit) * Math.min(apS0.w, apS0.h) / 2};
  const hookFlashes: Flash[] = [{at: V2.flash0, len: 0.16, gain: 0.95}, {at: SFX.flashA[0], len: 0.28, gain: 1}, {at: SFX.flashA[1], len: 0.28, gain: 1}];
  const codeFlashes: Flash[] = SFX.buttons.map((b, i) => ({at: b + SFX.codeTravel, len: SFX.codeLen[i], gain: 0.95}));

  // ---- packets ----
  const packets: {pts: Pt[]; d: number; kind: Kind; a?: number; len?: number; sc?: number}[] = [];
  const along2 = (path: Pt[], d2: number, kind: Kind, a = 1, len = 200, sc = 1.4) => packets.push({pts: path.map(s2), d: d2 * zl2, kind, a, len, sc});
  const screenPk = (A: Pt, B: Pt, t0: number, t1: number, kind: Kind, a = 1, len = 220, sc = 1.3) => {
    if (t < t0 || t > t1 + 0.35) return;
    const L = Math.hypot(B.x - A.x, B.y - A.y);
    packets.push({pts: [A, B], d: ((t - t0) / (t1 - t0)) * L, kind, a, len, sc});
  };
  // hook: the press sends a (schematic) pulse to the closed eye; the camera rides with it
  screenPk(tipS, sH(P(14, 10)), V2.pulse0, V2.pulse1, 'ir', 0.85, 240, 1.4);
  // ordinary vision: visible light (pupil reacts), then infrared (nothing)
  const pupilS = sH(P(EYE.iris.x + 3, EYE.iris.y));
  screenPk(P(1180, pupilS.y - 30), pupilS, V2.visLaunch, V2.visArrive, 'vis', 1, 300, 1.6);
  screenPk(P(1180, pupilS.y + 30), pupilS, V2.irLaunch, V2.irArrive, 'ir', 1, 320, 1.6);
  // material: two infrared packets into the marked crystal; the green emission leaves inward
  for (const at of [V2.absorb1, V2.absorb2]) if (t > at - 0.5 && t < at + 0.4) along2([P(HERO.x + 1.3, HERO.y), HERO], ((t - (at - 0.5)) / 0.5) * 1.3, 'ir', 1, 230, 1.6);
  if (t > V2.emit0 + 0.05 && t < V2.emit1 + 0.8 && t < 14) along2([HERO, P(HERO.x - 2.4, HERO.y)], ((t - V2.emit0 - 0.05) / 1.0) * 1.7, 'green', 1, 200, 1.6);
  // the ripple: infrared arriving at neighbouring crystals just before each one converts
  if (t > V2.ripple0 - 0.6 && t < 13.3) {
    PARTICLES.filter((q) => Math.hypot(q.p.x - HERO.x, q.p.y - HERO.y) < 3.2 && q.i % 5 === 0).slice(0, 26).forEach((q) => {
      const d = Math.hypot(q.p.x - HERO.x, q.p.y - HERO.y);
      const at = V2.ripple0 + d * 0.32 + ((q.i * 9.1 * 127.1 + 311.7) % 1) * 0;
      if (t > at - 0.4 && t < at + 0.1) along2([P(q.p.x + 1.0, q.p.y), q.p], ((t - (at - 0.4)) / 0.4) * 1.0, 'ir', 0.8, 140, 0.9);
    });
  }
  // eyelid barrier: visible light stops in the lid, infrared continues
  const VIS_ROWS = [-46, -37, -28, -19];
  VIS_ROWS.forEach((y, i) => {
    const hit = SFX.visStop[i];
    const xf = LID_FRONT_X2(y) - (i === 2 ? 7 : 1.5);
    const tr = (196 - xf) / 110;
    if (t < hit - tr || t > hit + 0.6) return;
    const path = [P(196, y), P(xf, y)];
    const d = (t - (hit - tr)) * 110;
    along2(path, d, 'vis', 1 - clamp((d - (196 - xf)) / 18), 190, 2.0);
  });
  const lidGlows = VIS_ROWS.map((y, i) => ({p: P(LID_FRONT_X2(y) - 5, y), a: t > SFX.visStop[i] - 0.03 ? Math.exp(-(t - SFX.visStop[i]) / 0.45) * clamp((t - SFX.visStop[i] + 0.03) / 0.06) : 0}));
  const IR_ROWS: [number, number][] = [[7, 16.45], [-6.768, V2.heroLaunch], [19, 16.7]];
  IR_ROWS.forEach(([y, at], i) => {
    const hero = i === 1;
    if (t < at || t > V2.heroParticle + 0.3) return;
    const x = hero ? heroX(t) : pw(t, [[at, 196], [at + 0.9, 137.5], [at + 2.15, 119.7]]);
    const end = hero ? HERO.x : i === 2 ? 128 : 119.7;
    const fade = i === 2 ? 1 - clamp((196 - x - 62) / 8) : i === 0 ? 1 - clamp((t - (at + 2.15)) / 0.3) : 1;
    along2([P(196, y), P(end, y)], 196 - Math.max(x, end - 1e-3) + (hero && t > V2.heroParticle ? (t - V2.heroParticle) * 4 : 0), 'ir', fade * (x < 137.5 ? 0.85 : 1), hero ? 240 : 200, 2.0);
  });
  // the converted light travels inward to the retina
  const PATH_E = [HERO, P(88, -3), P(74, -1.5), P(-89, 0)];
  const tE = V2.convert + 0.12;
  const lenE = PATH_E.reduce((s, p, i) => (i ? s + Math.hypot(p.x - PATH_E[i - 1].x, p.y - PATH_E[i - 1].y) : 0), 0);
  if (t > tE && t < V2.greenRetina + 0.5) {
    const d = ((t - tE) / (V2.greenRetina - tE)) * lenE;
    along2(PATH_E, d, 'green', 1 - clamp((d - lenE) / 40), 230, 1.4);
  }
  const cone = clamp((t - (tE + 0.3)) / 0.5) * (1 - ramp(22.2, 22.6, t)) * (t > tE && t < 22.7 ? 1 : 0);
  const heroS = s2(HERO);
  const spark = t > V2.convert - 0.02 && t < V2.convert + 0.7 && zl2 < 120 ? Math.sin(Math.PI * clamp((t - V2.convert + 0.02) / 0.6)) : 0;

  // ---- labels ----
  const chips = [
    {text: 'INFRARED', p: P(heroS.x + 160, heroS.y - 260), a: fadeWin(t, V2.absorb1 - 0.45, V2.emit0 - 0.1, 0.15), col: LIGHT.ir, dashed: true},
    {text: 'VISIBLE', p: P(heroS.x - 250, heroS.y + 230), a: fadeWin(t, V2.emit0 + 0.3, 12.6, 0.15), col: LIGHT.green, dashed: false},
    {text: 'VISIBLE', p: s2(P(150, -60)), a: fadeWin(t, 14.85, 16.3, 0.15), col: LIGHT.vis, dashed: false},
    {text: 'INFRARED', p: s2(P(150, 34)), a: fadeWin(t, 16.4, 18.5, 0.15), col: LIGHT.ir, dashed: true},
  ];

  const showHead = !(sec.reveal >= 1 && zl2 > 20) && !(k3in >= 1 && k3out <= 0 && t > 22.1 && t < 22.86);
  const leadEyeS = sH(EYE_C);
  return (
    <AbsoluteFill style={{background: '#1B3340'}}>
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        <defs>
          <radialGradient id="warmglow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#FFD08A" stopOpacity={0.95} />
            <stop offset="0.5" stopColor="#FF9A5A" stopOpacity={0.45} />
            <stop offset="1" stopColor="#FF9A5A" stopOpacity={0} />
          </radialGradient>
          <linearGradient id="sweep" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#FFE3A8" stopOpacity={0} />
            <stop offset="0.5" stopColor="#FFE3A8" stopOpacity={0.22} />
            <stop offset="1" stopColor="#FFE3A8" stopOpacity={0} />
          </linearGradient>
          <radialGradient id="xfield" cx="0.5" cy="0.42" r="0.75">
            <stop offset="0" stopColor="#F3F1E6" />
            <stop offset="0.6" stopColor="#DCEBE6" />
            <stop offset="1" stopColor="#B9D6D2" />
          </radialGradient>
        </defs>
        {showTrain && (
          <g transform={matStr(M.L0)}>
            <TrainBack t={t} id="tb" leadLamp={0.85} sleeper={Math.sin(t * 2 * Math.PI * 0.18)} />
            {showFig && <Bystander page={ramp(SFX.page, SFX.page + 0.54, t, eio)} breath={Math.sin(t * 2 * Math.PI * 0.2 + 1)} id="by" />}
          </g>
        )}
        {wipe > 0.001 && <circle cx={eyeS.x} cy={eyeS.y} r={2400 * wipe} fill="url(#xfield)" />}
        {cam.z < 14 && <g transform={matStr(M.L1)}><LeadBody id="lbb" breath={pose.breath} pass="back" /></g>}
        {showHead && <g transform={matStr(M.Head)}><LeadHead p={pose} id="lh" frame={Math.round(t * FPS)} detail={zl1 > 4 ? 1 : 0} eyeContent={<EyeContent e={eye} id="ec" />} /></g>}
        {sec.reveal > 0 && <g transform={matStr(M.L2)}><Section2View s={sec} id="s2" /></g>}
        {/* the lens on the fingertip, in front of the eye, then the finger leaving */}
        {t < V2.fingerOut1 + 0.05 && (
          <g transform={matStr(M.Head)}>
            <Finger tip={fingerAt(t).tip} dir={fingerAt(t).dir} lens={0} lensRx={22} id="fg" />
            {t < V2.contact && <LensFlight c={flightAt(t).c} s={flightAt(t).s} e={eye} id="lf" fissure={fis} />}
          </g>
        )}
        {cam.z < 14 && <g transform={matStr(M.L1)}><LeadBody id="lbf" breath={pose.breath} pass="front" /></g>}
        {showFig && (
          <g transform={matStr(M.L0)}>
            <Sender txScale={1.45} txGlow={press * 0.8} aim={aim} press={press} look={1} smile={0.3 + 0.7 * ramp(SFX.buttons[3], SFX.buttons[3] + 0.6, t)} breath={Math.sin(t * 2 * Math.PI * 0.22 + 2)} id="sd" />
          </g>
        )}
        {/* converted light spreading to the retina, and the conversion spark at eye scale */}
        {cone > 0.01 && (
          <path d={`M${heroS.x} ${heroS.y}L${s2(P(88, -16)).x} ${s2(P(88, -16)).y}L${s2(polar(P(0, 0), 89, 152)).x} ${s2(polar(P(0, 0), 89, 152)).y}A${89 * zl2} ${89 * zl2} 0 0 0 ${s2(polar(P(0, 0), 89, 208)).x} ${s2(polar(P(0, 0), 89, 208)).y}L${s2(P(88, 16)).x} ${s2(P(88, 16)).y}Z`} fill={LIGHT.green} opacity={0.22 * cone} />
        )}
        {lidGlows.map((g, i) => (g.a > 0.01 ? <circle key={i} cx={s2(g.p).x} cy={s2(g.p).y} r={zl2 * 9} fill="url(#warmglow)" opacity={g.a} /> : null))}
        {packets.map((k, i) => <Packet key={i} pts={k.pts} d={k.d} kind={k.kind} a={k.a} len={k.len} scale={k.sc} />)}
        {spark > 0.01 && (
          <g opacity={spark}>
            <circle cx={heroS.x} cy={heroS.y} r={40 + 110 * spark} fill={LIGHT.green} opacity={0.45} />
            <circle cx={heroS.x} cy={heroS.y} r={18} fill="#FFFFFF" />
          </g>
        )}
        {/* the wearer's view */}
        {/* passing lights from the window sweep over the sleeping lead */}
        {t > 23.6 && t < 26.3 && Array.from({length: 2}, (_, i) => {
          const u = ((t - 23.6 + i * 0.7) % 1.35) / 1.35;
          const x = lerp(1200, -300, u);
          return <rect key={i} x={x - 120} y={0} width={240} height={1920} fill="url(#sweep)" transform={`skewX(-12)`} />;
        })}
        {(k1 > 0.001 || k2 > 0.001) && <g opacity={clamp(Math.max(k1, k2) * 5)}><POV ap={pill(apLerp(lidAp, FULL, Math.sqrt(Math.max(k1, k2))))} t={t} flashes={hookFlashes} id="pv1" /></g>}
        {(k3in > 0.001 && (k3out < 0.999)) && <g opacity={k3out > 0 ? clamp((1 - k3out) * 5) : 1}><POV ap={ap3} t={t} flashes={[{at: V2.flashE, len: 0.5, gain: 1.25}]} id="pv3" /></g>}
        {ksplit > 0.001 && <g opacity={clamp(ksplit * 5)}><POV ap={apS} t={t} flashes={codeFlashes} id="pvs" seam={ksplit > 0.6} focus={{x: 540, y: 1360}} /></g>}
      </svg>
      <Spectrum a={ramp(V2.spec0, V2.spec1, t, eout) * (1 - ramp(V2.specOut0, V2.specOut1, t, eio))}
        hiVis={fadeWin(t, V2.visLaunch, V2.irLaunch, 0.15)} hiIR={fadeWin(t, V2.irLaunch, V2.specOut0, 0.15)} y={200} />
      {chips.map((c, i) => <Chip key={i} text={c.text} x={c.p.x} y={c.p.y} a={c.a} dot={c.col} dashed={c.dashed} />)}
      {captions && <Captions t={t} />}
    </AbsoluteFill>
  );
};

export const InfraredContactsV2: React.FC<{audio: string | false; captions: boolean}> = ({audio, captions}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <FrameV2 t={frame / FPS} captions={captions} />
      {audio && <Audio src={staticFile(`audio/${audio}.wav`)} />}
    </AbsoluteFill>
  );
};
export const FilmStillV2: React.FC<{t: number; captions?: boolean}> = ({t, captions = false}) => <FrameV2 t={t} captions={captions} />;
