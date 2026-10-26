// The SURVIVOR rig (pure maths, no drawing): the Weird Crew "person" lying prone in rubble, propped on her forearms
// with her chest off the ground and her head raised, facing screen-right toward a gap where the cockroach appears.
//
// Built on the copied turnaround rig in this folder (./Crew, ./cast, ./geo, ./poses, lineage in their headers): same
// body dimensions (BODY_P), same look (PERSON), same head (Head4 reads the head frame computed here), same faces
// mixer. Two things are new and specific to a figure lying on the ground:
//   1. The skeleton is placed explicitly instead of through joints4: elbows and wrists are planted on the floor (the
//      forearms rest flat on it), the shoulders sit one upper-arm length above the elbows, the pelvis and legs lie flat
//      behind. joints4's arm IK cannot keep both elbow and wrist on the floor while the chest breathes.
//   2. A camera elevation. The rig's card projection is orthographic and level, so a floor seen from "slightly above
//      ground level" would collapse to one line and both forearms would sit on top of each other. Every card-local
//      point and axis is first rotated about the card's screen-horizontal axis by `elev` (pivot = the anchor), then
//      projected with the rig's own cardPt, so far things rise on screen exactly as a camera looking down would show.
//
// Units: rig units u (BODY_P: the standing figure is 440 u tall; 267 u = 1 m, so 1 u = 3.75 mm).
// Card-local axes (before the elevation): X = her left, Y up, Z forward (toward her head / the gap).
// Anchor = the floor point midway between her two elbow contacts. Everything is a pure function of its inputs.
import {BODY_P, Body4} from './cast';
import {Face4, J4, rotA} from './Crew';
import {add3, Card, cardPt, cross3, len3, mul3, norm3, sub3, V3, v3} from './geo';
import {face, mix} from './poses';

const RAD = Math.PI / 180;
const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const sm = (x: number) => {
  const u = clamp(x);
  return u * u * (3 - 2 * u);
};

// ------------------------------------------------------------------ faces
/** The survivor's two acting poles (mixed by `recog`). Both are built on the rig's FACES:
 *  alarm = FACES.alarm with the inner brows pulled up harder (the outer ends stay lower, so in this slightly-from-above
 *          view the brows stay clear of the bob's hairline instead of merging into it) and a smaller mouth;
 *  recog = cautious recognition: soft brows lifted in the middle, relaxed lids, closed almost-smile. */
export const SURV_FACES = {
  alarm: face({brow: 0.2, browIn: 1, wide: 1, mw: 9, curve: -0.3, open: 0.42}),
  recog: face({brow: 0.28, browIn: 0.75, lid: 0.1, wide: 0.05, mw: 11, curve: 0.4, open: 0}),
};

// ------------------------------------------------------------------ inputs
export type Pt = {x: number; y: number};
export type SurvivorOpts = {
  /** seconds; drives breathing only */
  t?: number;
  /** 0 = alarm .. 1 = cautious recognition (face mix, shoulders settle, slower deeper breath) */
  recog?: number;
  /** 0..1 flinch: head pulls back and up, chin lifts, shoulders hunch */
  recoil?: number;
  /** 0 = near-hand fingers pulled in (tense) .. 1 = open, flat and relaxed */
  handOpen?: number;
  /** 0..1 near hand slides `slideU` u toward the insect (palm down on the floor) */
  handSlide?: number;
  /** blink 0 (open) .. 1 (closed) */
  blink?: number;
  /** eye target in screen px (pupils aim at it). Overrides gx/gy. */
  gaze?: Pt | null;
  /** direct pupil offsets when no gaze point: gx -1..1 (+ screen right), gy -1.4..1.4 (+ down) */
  gx?: number;
  gy?: number;
  /** 0..1 dust smudges on shirt, cheek, forearm */
  dust?: number;
  /** 0..1 a visible breath out (chest and shoulders sink, lips part a little); animate 0 -> 1 -> 0 */
  exhale?: number;
  /** breathing amplitude multiplier (default 1; 0 = no breathing) */
  breath?: number;
  /** extra head angles (deg) on top of the acting: nod + = chin down; turn + = face toward her right (toward the camera
   *  at the default yaw; the rig already turns her face 23-30 deg toward the camera); tilt + = top of the head toward her right */
  nod?: number;
  turn?: number;
  tilt?: number;
  /** near-hand slide: distance in u (default 16 u = 6 cm) and heading (deg; 0 = straight ahead, + = toward her right) */
  slideU?: number;
  slideDir?: number;
  /** fine-tune: Face4 fields laid over the acting mix (gaze, blink and the breath out still apply on top) */
  face?: Partial<Face4>;
  /** card yaw (deg): 90 = exact profile facing screen-right, lower = turned toward the camera (default 66) */
  yaw?: number;
  /** camera elevation (deg): how far above floor level the camera looks down (default 14) */
  elev?: number;
};
export type SurvivorPlace = {x: number; y: number; scale: number};

// ------------------------------------------------------------------ skeleton constants (card-local u, before the elevation)
const FORE_Y = 15; // forearm centre height: half the arm stroke, so the forearm's underside touches the floor
const ELBOW_X = 58; // elbows a little inside the shoulder points (shW 62): weight under the shoulders
const SHOULDER_BACK = 12; // shoulders sit this far behind the elbow line
const PELVIS = v3(0, 26, -100); // on the floor behind (body half-thickness above it)
const BREATH_T = 3.4; // s per breath (fixed so that changing state never jumps the phase)

/** A flat hand on the floor: wrist point, its forward direction (along the fingers) and lateral direction (toward her left),
 *  plus the HandArt shape parameters. All vectors already elevated (screen-ready via cardPt / dirScr). */
export type FlatHand = {W: V3; fwd: V3; lat: V3; thumb: number; shape: 'open'; splay: number; curl: number[]; flatW: number};

/** How a flat hand is drawn: HandArt (hand-local +y along the fingers, +x across) through an affine map. A truly flat
 *  hand seen from a camera this low is a sliver whose width runs into depth, so the cartoon cheats it toward a top view:
 *  its length follows the projected finger direction (at least MIN_L of full size), its width is drawn perpendicular to
 *  that on screen, toward the side where the true floor-plane width points, at FLAT_W of full size. Origin = the wrist
 *  on the forearm's centre line, so the hand continues the forearm. Returns the SVG matrix, the mean scale (for the
 *  outline) and a hand-local -> screen mapper. */
// FLAT_W >= 0.92 keeps the palm (rx 18) wider than the forearm stroke (radius 15 + ink), as in Crew4. The far hand, which
// lies behind the near forearm, keeps a truer (thinner) width so it never spills out below the near arm.
export const FLAT_W = 0.94, FLAT_W_FAR = 0.55, MIN_L = 0.95;
export const handMap = (h: FlatHand, cd: Card) => {
  const cp = Math.cos(cd.phi * RAD), sp = Math.sin(cd.phi * RAD);
  const scr2 = (v: V3) => ({x: v.x * cp + v.z * sp, y: -v.y});
  const o = cardPt(cd, h.W);
  const F = scr2(h.fwd), Lt = scr2(h.lat);
  const lF = Math.hypot(F.x, F.y) || 1e-6;
  const fl = Math.max(lF, MIN_L);
  const Fx = (F.x / lF) * fl, Fy = (F.y / lF) * fl;
  let px = -F.y / lF, py = F.x / lF;
  if (px * Lt.x + py * Lt.y < 0) { px = -px; py = -py; }
  const Lx = px * h.flatW, Ly = py * h.flatW, k = cd.k;
  return {
    matrix: `matrix(${(Lx * k).toFixed(4)} ${(Ly * k).toFixed(4)} ${(Fx * k).toFixed(4)} ${(Fy * k).toFixed(4)} ${o.x.toFixed(1)} ${o.y.toFixed(1)})`,
    gm: Math.sqrt(Math.abs(Lx * Fy - Ly * Fx)) || 1,
    at: (lx: number, ly: number): Pt => ({x: o.x + k * (Lx * lx + Fx * ly), y: o.y + k * (Ly * lx + Fy * ly)}),
  };
};

export type SurvivorRig = ReturnType<typeof survivorRig>;

/** Rotate a card-local point/vector about the card's screen-horizontal axis by the camera elevation (pivot = origin). */
export const elevator = (yaw: number, elev: number) => {
  const c = Math.cos(yaw * RAD), s = Math.sin(yaw * RAD), ce = Math.cos(elev * RAD), se = Math.sin(elev * RAD);
  return (p: V3): V3 => {
    const h = p.x * c + p.z * s, d = -p.x * s + p.z * c; // screen-horizontal, depth toward camera
    const y2 = p.y * ce - d * se, d2 = d * ce + p.y * se; // near floor drops, high points come toward the camera
    return v3(h * c - d2 * s, y2, h * s + d2 * c);
  };
};

/** The head as Head4 projects it (same maths as Head4's dirS/egg), for placing overlays and aiming the pupils. */
export const headMap = (j: J4, cd: Card, R: number) => {
  const c = cardPt(cd, j.Hc);
  const cp = Math.cos(cd.phi * RAD), sp = Math.sin(cd.phi * RAD);
  const toS = (v: V3) => ({x: v.x * cp + v.z * sp, y: v.y, d: -v.x * sp + v.z * cp});
  const Hx = toS(j.hx), Hy = toS(j.hy), Hz = toS(j.hz);
  const rho = Math.atan2(Hy.x, Math.max(1e-3, Hy.y));
  const cr = Math.cos(rho), sr = Math.sin(rho);
  const egg = (x: number, y: number, rad = R) => {
    const px = x * rad, py = -y * rad;
    const a = px * cr + py * sr, bb = (-px * sr + py * cr) * ((R + 4) / R);
    return {x: a * cr - bb * sr, y: a * sr + bb * cr};
  };
  const dirS = (az: number, el: number) => {
    const o = v3(Math.sin(az * RAD) * Math.cos(el * RAD), Math.sin(el * RAD), Math.cos(az * RAD) * Math.cos(el * RAD));
    return {x: Hx.x * o.x + Hy.x * o.y + Hz.x * o.z, y: Hx.y * o.x + Hy.y * o.y + Hz.y * o.z, d: Hx.d * o.x + Hy.d * o.y + Hz.d * o.z};
  };
  /** a point on the head sphere (az: + toward her left, el: + up; deg) -> head-local px-units (lx, ly) and screen px */
  const at = (az: number, el: number, rad = R) => {
    const s = dirS(az, el);
    const e = egg(s.x, s.y, rad);
    return {lx: e.x, ly: e.y, x: c.x + cd.k * e.x, y: c.y + cd.k * e.y, d: s.d};
  };
  const outline = (() => {
    const pts: Pt[] = [];
    for (let i = 0; i < 72; i++) {
      const a = (i / 72) * Math.PI * 2;
      pts.push(egg(Math.cos(a), Math.sin(a)));
    }
    return pts;
  })();
  return {c, rho, headRot: (rho * 180) / Math.PI, egg, dirS, at, outline, facing: Hz};
};

/** The whole survivor: skeleton (elevated card-local), face, hands, and the screen layout for the shot. */
export const survivorRig = (o: SurvivorOpts, place: SurvivorPlace, b: Body4 = BODY_P) => {
  const t = o.t ?? 0, recog = clamp(o.recog ?? 0), recoil = clamp(o.recoil ?? 0), open = clamp(o.handOpen ?? 0);
  const slide = clamp(o.handSlide ?? 0), exhale = clamp(o.exhale ?? 0), yaw = o.yaw ?? 66, elev = o.elev ?? 14;
  const E = elevator(yaw, elev);
  const cd: Card = {x: place.x, y: place.y, k: place.scale, phi: yaw, depth: 0};

  // ---- chest: breathing (fixed rate; alarm shallow and high, recognition deeper and lower), recoil, settle
  const breathAmp = (o.breath ?? 1) * (1.0 + 0.8 * recog);
  const br = Math.sin((2 * Math.PI * t) / BREATH_T);
  const S0 = v3(0, FORE_Y + Math.sqrt(b.upper * b.upper - SHOULDER_BACK * SHOULDER_BACK - (b.shW - ELBOW_X) ** 2), -SHOULDER_BACK);
  const S = add3(S0, v3(0, br * breathAmp + 1 * recoil - 2.2 * recog * (1 - recoil) - 3 * exhale, -4 * recoil));
  const P = PELVIS;
  const u = norm3(sub3(S, P)); // spine (points forward and up)
  const Lc = v3(1, 0, 0);
  const Fc = cross3(Lc, u); // chest front: down and forward, toward the floor
  const Lh = v3(1, 0, 0), Fh = v3(0, 0, 1);
  // shoulders: a hunch in the flinch, a drop on the breath out
  const hunch = 2.5 * recoil - 1.5 * recog * (1 - recoil) - 1.5 * exhale + 0.4 * br * breathAmp;
  const SL0 = add3(add3(S, mul3(Lc, b.shW)), v3(0, hunch, 0));
  const SR0 = add3(add3(S, mul3(Lc, -b.shW)), v3(0, hunch, 0));

  // ---- forearms planted flat: elbows on the floor, wrists on the floor, angled in toward the midline
  const EL = v3(ELBOW_X, FORE_Y, 0);
  const dirL = norm3(v3(-Math.sin(46 * RAD), 0, Math.cos(46 * RAD))); // far forearm angled in: its hand tucks behind the near hand
  const WL = add3(EL, mul3(dirL, b.fore));
  // near (right) arm: the slide swings the forearm toward the insect; the elbow slides along by the forward part only
  const slideU = o.slideU ?? 16, sd = (o.slideDir ?? 35) * RAD;
  const sv = mul3(v3(-Math.sin(sd), 0, Math.cos(sd)), slideU * sm(slide));
  const ER0 = v3(-ELBOW_X, FORE_Y, 0);
  const dirR0 = norm3(v3(Math.sin(10 * RAD), 0, Math.cos(10 * RAD)));
  const WR0 = add3(ER0, mul3(dirR0, b.fore));
  const ER = add3(ER0, v3(0, 0, sv.z * 0.75));
  const dirR = norm3(sub3(add3(add3(WR0, mul3(dirR0, 20)), sv), ER)); // aim the palm (20 u past the wrist) at its slid spot
  const WR = add3(ER, mul3(dirR, b.fore));
  // the elbows stay planted, so each shoulder point keeps (within 3 %) one upper-arm length from its elbow: the chest
  // can breathe, settle and flinch, but an arm never visibly stretches
  const fitArm = (Sh: V3, El: V3) => {
    const d = sub3(Sh, El), l = len3(d) || 1;
    return add3(El, mul3(d, clamp(l, b.upper * 0.97, b.upper * 1.03) / l));
  };
  const SL = fitArm(SL0, EL), SR = fitArm(SR0, ER);

  // ---- head: neck base on the spine, head frame from world up (nod, turn, tilt), not from the chest
  const nod = -8 - 7 * recoil + 8 * recog * (1 - recoil) + (o.nod ?? 0);
  const turn = 26 + 4 * recog - 3 * recoil + (o.turn ?? 0);
  const tilt = 5 * recog * (1 - recoil) + (o.tilt ?? 0);
  const X = v3(1, 0, 0), Y = v3(0, 1, 0), Z = v3(0, 0, 1);
  let hx = X, hy = rotA(Y, X, nod), hz = rotA(Z, X, nod); // + nod tips the face down
  hx = rotA(hx, Y, -turn); hy = rotA(hy, Y, -turn); hz = rotA(hz, Y, -turn); // + turn toward her right (-X)
  hx = rotA(hx, hz, tilt); hy = rotA(hy, hz, tilt); // + tilt: top of the head toward her right
  const N = add3(S, mul3(u, 12));
  const Hc = add3(add3(N, mul3(hy, b.headUp - 12)), v3(0, 4 * recoil, -7 * recoil));

  // ---- legs lying flat behind, toes down
  const HL = add3(P, v3(b.hipW, -6, 0)), HR = add3(P, v3(-b.hipW, -6, 0));
  const legY = b.legW / 2;
  const KL = v3(HL.x + 6, legY, HL.z - b.thigh), KR = v3(HR.x - 4, legY, HR.z - b.thigh + 1);
  const AL = v3(KL.x + 6, legY, KL.z - b.shin), AR = v3(KR.x - 2, legY, KR.z - b.shin + 2);
  const toeDir = norm3(v3(0, -0.6, -0.8));

  // ---- hands: flat on the floor (palm down), fingers along the forearm
  // near hand: tense = fingers drawn in short and together, open = long, spread, relaxed
  const near = {
    splay: 0.05 + 0.9 * sm(open),
    curl: [0, 1, 2, 3].map((i) => (1 - sm(open)) * (0.9 + 0.06 * Math.sin(i * 1.7))),
  };
  const far = {splay: 0.35 + 0.1 * recog, curl: [0.3, 0.38, 0.4, 0.35].map((c) => c * (1 - 0.6 * recog) + 0.25 * (1 - recog))};
  const latOf = (d: V3) => v3(d.z, 0, -d.x); // in-floor perpendicular, toward her left
  const handOf = (W: V3, d: V3, thumb: number, sp: number, curl: number[], flatW: number): FlatHand => ({
    W: E(W), fwd: E(d), lat: E(latOf(d)), thumb, shape: 'open', splay: sp, curl, flatW,
  });
  // palm down: the thumb lies toward her midline (right hand: toward +X; left hand: toward -X). HandArt puts the thumb at
  // local x = -14 * side, and local +x maps to `lat` (+X side), so right hand side = -1, left hand side = +1.
  const handR = handOf(WR, dirR, -1, near.splay, near.curl, FLAT_W);
  const handL = handOf(WL, dirL, 1, far.splay, far.curl, FLAT_W_FAR);

  // ---- elevate everything and assemble a J4 for Head4
  const j: J4 = {
    P: E(P), S: E(S), SL: E(SL), SR: E(SR), HL: E(HL), HR: E(HR), KL: E(KL), AL: E(AL), KR: E(KR), AR: E(AR),
    EL: E(EL), WL: E(WL), ER: E(ER), WR: E(WR), short: 0, armShort: 0,
    u: E(u), Lc: E(Lc), Fc: E(Fc), Lh: E(Lh), Fh: E(Fh), N: E(N), Hc: E(Hc), hx: E(hx), hy: E(hy), hz: E(hz),
  };
  const toeL = E(toeDir), toeR = E(toeDir);
  const scr = (p: V3) => cardPt(cd, p); // elevated card-local -> screen
  const point = (x: number, y: number, z: number) => scr(E(v3(x, y, z))); // any card-local point (u, before the elevation) -> screen
  const ground = (x: number, z: number) => point(x, 0, z); // a floor point -> screen

  // ---- face: the acting mix, then blink, gaze, the breath out
  const hm = headMap(j, cd, b.R);
  const eyeL = hm.at(21, 6), eyeR = hm.at(-21, 6);
  const eyeMid = {x: (eyeL.x + eyeR.x) / 2, y: (eyeL.y + eyeR.y) / 2};
  let gx = o.gx ?? 0, gy = o.gy ?? 0;
  if (o.gaze) {
    const vx = o.gaze.x - eyeMid.x, vy = o.gaze.y - eyeMid.y;
    const l = Math.hypot(vx, vy) || 1;
    const cr = Math.cos(hm.rho), sr = Math.sin(hm.rho);
    const lx = (vx * cr + vy * sr) / l, ly = (-vx * sr + vy * cr) / l; // into the eye's own (rotated) frame
    const near01 = clamp(l / (b.R * cd.k * 0.6)); // a target almost on the face recentres the pupils a little
    gx = lx * (0.55 + 0.45 * near01);
    gy = ly * 1.4 * (0.55 + 0.45 * near01);
  }
  gx = clamp(gx, -1, 1); gy = clamp(gy, -1.4, 1.4);
  const base: Face4 = {...mix(SURV_FACES.alarm, SURV_FACES.recog, sm(recog)), ...(o.face ?? {})};
  const f: Face4 = {
    ...base,
    gx, gy,
    blink: clamp(o.blink ?? 0),
    // looking down drops the upper lids a touch; the breath out softens them and parts the lips
    lid: clamp(base.lid + 0.08 * Math.max(0, gy - 0.5) + 0.1 * exhale, 0, 0.6) * (1 - 0.6 * recoil),
    wide: clamp(base.wide + 0.15 * recoil),
    open: base.open + 0.12 * exhale * (1 - base.open),
  };

  // ---- screen layout for the shot (px)
  const hR = handMap(handR, cd), hL = handMap(handL, cd);
  const nearPalm = hR.at(0, 6), nearTip = hR.at(0, 32);
  const layout = {
    anchor: {x: place.x, y: place.y},
    head: hm.c, eyeL: {x: eyeL.x, y: eyeL.y}, eyeR: {x: eyeR.x, y: eyeR.y}, eyeMid,
    chin: (() => { const p = hm.at(0, -62, b.R + 2); return {x: p.x, y: p.y}; })(),
    mouth: (() => { const p = hm.at(0, -29); return {x: p.x, y: p.y}; })(),
    nearElbow: ground(ER.x, ER.z), farElbow: ground(EL.x, EL.z),
    nearWrist: scr(j.WR), farWrist: scr(j.WL), nearPalm, nearTip,
    farTip: hL.at(0, 32),
    shoulders: scr(j.S), nearShoulder: scr(j.SR), pelvis: scr(j.P), waist: scr(E(add3(P, mul3(u, -14)))),
    knees: [scr(j.KL), scr(j.KR)], feet: [scr(j.AL), scr(j.AR)],
    /** a floor spot ~46 u (17 cm) ahead of the near fingertips, a little toward her right: where the insect can stop */
    insectSpot: ground(WR.x + dirR.x * 80 - 10, WR.z + dirR.z * 80),
  };
  const upperErr = Math.max(Math.abs(len3(sub3(SR, ER)) - b.upper), Math.abs(len3(sub3(SL, EL)) - b.upper));

  // ---- the torso's screen frame (Crew4's torso construction: a flat trapezoid along the projected spine). T(along,
  // across) is a screen point `along` px from the top of the shoulders toward the waist and `across` px off the axis;
  // + across is the floor (belly) side.
  const torso = (() => {
    const cp = Math.cos(cd.phi * RAD), sp = Math.sin(cd.phi * RAD);
    const dirScr = (v: V3) => ({x: v.x * cp + v.z * sp, y: -v.y});
    const wb = scr(add3(j.P, mul3(j.u, -14))), tp = scr(add3(j.S, mul3(j.u, 22)));
    const ax = {x: wb.x - tp.x, y: wb.y - tp.y};
    const alen = Math.hypot(ax.x, ax.y) || 1;
    const ad = {x: ax.x / alen, y: ax.y / alen};
    const belly = Math.sign(ad.x || 1); // n = (-ad.y, ad.x) * belly points down the screen, toward the floor
    const n = {x: -ad.y * belly, y: ad.x * belly};
    const half = (L: V3, F: V3, w: number, dd: number) => {
      const ls = dirScr(L), fs = dirScr(F);
      return w * Math.abs(ls.x * n.x + ls.y * n.y) + dd * Math.abs(fs.x * n.x + fs.y * n.y);
    };
    const k = cd.k;
    const wS = half(j.Lc, j.Fc, b.torsoW, b.torsoD) * k, wW = half(j.Lh, j.Fh, b.torsoWh, b.torsoD * 0.9) * k;
    const pW = half(j.Lh, j.Fh, b.hipW + b.legW * 0.5, b.torsoD * 0.8) * k;
    const T = (along: number, across: number): Pt => ({x: tp.x + ad.x * along + n.x * across, y: tp.y + ad.y * along + n.y * across});
    return {tp, wb, ad, n, alen, wS, wW, pW, T};
  })();
  /** the spine point (elevated card-local) where the body crosses the card-local plane z */
  const spineAt = (z: number) => E(add3(P, mul3(sub3(S, P), clamp((z - P.z) / (S.z - P.z || 1)))));
  /** A slab whose leading face is seen edge-on (a vertical screen line at x = cutX; in 3D the plane through the spine
   *  point that contains the view direction). Returns cutX for a body position z, and the y range her torso and the
   *  floor cover on that line: back = the top of her back, belly = her underside, floor = the floor just beside her near
   *  side. Everything with screen x > cutX is in front of that face. */
  const cutAt = (z: number) => {
    const x = scr(spineAt(z)).x;
    const ys: number[] = [];
    const {T, alen, wS, wW} = torso;
    for (const side of [-1, 1]) {
      for (let i = 0; i < 64; i++) {
        const a0 = 24 * cd.k + ((alen - 24 * cd.k) * i) / 64, a1 = 24 * cd.k + ((alen - 24 * cd.k) * (i + 1)) / 64;
        const wAt = (a: number) => wS + ((wW - wS) * (a - 24 * cd.k)) / (alen - 24 * cd.k || 1); // the trapezoid's side edges
        const p0 = T(a0, side * wAt(a0)), p1 = T(a1, side * wAt(a1));
        if ((p0.x - x) * (p1.x - x) <= 0 && p0.x !== p1.x) ys.push(p0.y + ((p1.y - p0.y) * (x - p0.x)) / (p1.x - p0.x));
      }
    }
    const cx = Math.cos(cd.phi * RAD), sx = Math.sin(cd.phi * RAD);
    const nearX = -b.torsoW - 10; // a floor point beside her near side on the same screen vertical
    const floor = ground(nearX, (x - cd.x) / cd.k / sx - (nearX * cx) / sx);
    return {x, back: ys.length ? Math.min(...ys) : scr(spineAt(z)).y, belly: ys.length ? Math.max(...ys) : scr(spineAt(z)).y, floor: floor.y};
  };
  return {cd, b, j, face: f, handR, handL, toeL, toeR, scr, ground, point, spineAt, cutAt, torso, E, layout, hm, upperErr};
};
