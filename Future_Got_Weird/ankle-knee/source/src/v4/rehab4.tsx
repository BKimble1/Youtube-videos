// V4 rehab: one continuous movement between the parallel bars (rehabPose4), seen through three cameras that each
// answer one question, with the cuts on the movement.
//   A  11.40-14.62 "with his toes pointing behind him. That backward ankle now": a tight side profile at the socket
//      (w 32, 1.8x tighter than B): the turned foot in the clear socket, toes pointing back, and under it the
//      prosthetic trainer pointing forward as the reference; his other leg stays out of the frame (only the heel of
//      its trainer and its thigh at the edges), so B's two-leg view is new. A slow drift up the foot; the toes flick
//      once on "pointing" (a curl, then a lift toward his back, held through "behind him"). On "backward ankle" the
//      lens rises up the socket to the turned ankle at its rim, the thigh above it (w fixed, no push-in), and comes to
//      rest as the bend starts at BEND0, so the bend reads in A; the cut lands a third of the way in, at speed.
//   B  14.62-16.00 "bent the same way as his other knee": a low lens near the floor, from the grips (his face stays
//      above the frame) to the shoes: his ordinary knee and the turned ankle flex together, forward, while his hips
//      lower; his hands stay round the rails, elbows bend. The bottom of the bend on "same way"; he starts to rise
//      at RISE0 and the cut lands about half way up, at full speed.
//   C  16.00-17.03 "knee. When Wyatt": wider (a lens at his waist height), the whole boy and the bars: he finishes
//      rising, moves his hips over his left foot, and the prosthetic leg takes one clear step forward (screen-left):
//      the turned ankle flexes to lift the prosthetic foot, swings it through, extends, and the foot lands flat at
//      FOOTFALL. The next shot cuts on it.
// World units are centimetres (y up is negative, the floor is y = 0); he faces screen-left.
import React from 'react';
import {Cam, D0, Layer, camScale, proj, W, H} from '../camera';
import {Inked, InkPath} from '../dc/ink';
import {Capsule, SoftShadow, Blob} from '../dc/shade';
import {lit, shade} from '../dc/color';
import {fmt, V} from '../dc/math';
import {closed} from '../core/geo';
import {footPt} from '../art/wyatt';
import {C} from '../art/pal';
import {ss, ss5, lerp, clamp} from '../lib';
import {Rail} from '../v2/rails';
import {Wyatt2, bjoints, BPose} from '../v2/body';
import {legTo, focus, HAND_GRIP, ANK} from '../v2/poses';
import {mixExpr} from '../dc/Head';
import {T4, CUT_REHAB_A, CUT_REHAB_B, CUT_REHAB_C, CUT_WAKE, BEND0, BEND_LOW, RISE0, STEP0, FOOTFALL} from './story4';

// ------------------------------------------------------------------------------------------------ the room layout
const RAIL_Y = -70, DN = D0 - 30, DF = D0 + 30;
/** B's low lens sees the near rail cheated 20 cm nearer his plane (no post is in that frame), so it projects at his
 *  waist rather than his chest: the near forearm reaches level to the bar (elbow not dropped below it) and the arm
 *  bends only as his hips lower. With C's waist-high lens this puts the near grip at the same height against his
 *  body in both views, so the near elbow keeps its angle across the B-C cut (91 -> 96 deg) */
export const DN_B = D0 - 10;
/** the near rail's depth as the shot at time t draws it */
export const railDN = (t: number) => (t >= CUT_REHAB_B && t < CUT_REHAB_C ? DN_B : DN);
/** a point on a layer at depth D, expressed in the subject layer (same screen position) */
const toD0 = (c: Cam, D: number, x: number, y: number): V => ({x: c.x + (x - c.x) * (D0 / D), y: c.eye + (y - c.eye) * (D0 / D)});
const FRONT_X = -66; // the front end of the bars (he faces it)
const BACK_X = 150;
const BENCH = {D: D0 + 45, x0: 26, x1: 114};

// ------------------------------------------------------------------------------------------------ the movement
/** his far (left, ordinary) foot: planted ahead of the near one for the whole passage */
export const STAG4: V = {x: -10, y: -1.8};
export const FAR_FOOT: V = {x: -26, y: -ANK + STAG4.y};
/** the prosthetic foot: planted, then one step forward (lands at FOOTFALL) */
export const NEAR_FOOT0: V = {x: 0, y: -ANK};
export const NEAR_FOOT1: V = {x: -47, y: -ANK};
const LEGL = 35 + 31;

/** cubic Hermite through [t, value, velocity] keys (held outside the keys) */
const herm = (t: number, keys: [number, number, number][]) => {
  if (t <= keys[0][0]) return keys[0][1];
  const n = keys.length;
  if (t >= keys[n - 1][0]) return keys[n - 1][1];
  let i = 0;
  while (i < n - 2 && t > keys[i + 1][0]) i++;
  const [t0, p0, v0] = keys[i], [t1, p1, v1] = keys[i + 1];
  const h = t1 - t0, u = (t - t0) / h, u2 = u * u, u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * p0 + (u3 - 2 * u2 + u) * h * v0 + (-2 * u3 + 3 * u2) * p1 + (u3 - u2) * h * v1;
};
/** smooth max (blend width w), so a reach clamp never kinks the hip's path */
const smax = (a: number, b: number, w = 1.2) => {
  const h = Math.max(w - Math.abs(a - b), 0) / w;
  return Math.max(a, b) + (h * h * w) / 4; // never below either (a planted leg always reaches)
};
/** the lowest the hip may sit so a planted ankle at F stays reached from a hip at x (slack: knees a touch soft) */
const reachY = (hx: number, F: V, slack = 0.7) => {
  const L = LEGL - slack;
  const dx = hx - F.x;
  return F.y - Math.sqrt(Math.max(0, L * L - dx * dx));
};

/** the toes' flex on "pointing" (deg; negative = extension, the toes lift toward the dorsum, i.e. toward his back) */
export const TOE_FLEX = -21, TOE_WIND = 26;
/** the bend: 0 standing, 1 at the bottom (BEND_LOW .. RISE0), back up by RISE_END. Both halves are front-loaded so
 *  each cut lands at the movement's fastest: the bend is a third done (and still accelerating) when A cuts to B,
 *  and the rise is about half done, at full speed, when B cuts to C */
export const RISE_END = RISE0 + 0.46;
export const BEND_AT_CUT = 0.36;
const down4 = (t: number) => herm(t, [[BEND0, 0, 0], [CUT_REHAB_B, BEND_AT_CUT, 1.7], [BEND_LOW, 1, 0]]);
const up4 = (t: number) => herm(t, [[RISE0, 1, 0], [CUT_REHAB_C, 0.55, -2.5], [RISE_END, 0, 0]]);
export const bend4 = (t: number) => down4(t) * up4(t) + 0.04 * Math.sin(Math.PI * clamp((t - BEND_LOW) / (RISE0 - BEND_LOW)));
/** forward travel of the hips: the weight moves over his left foot, then carries on through the step */
export const SHIFT0 = 15.92;
const hipX = (t: number) => herm(t, [[SHIFT0, -6, 0], [STEP0, -13.6, -24], [FOOTFALL, -26, -16], [FOOTFALL + 0.3, -28.6, 0]]);
/** the step, u 0..1 from STEP0 (foot leaves the floor) to FOOTFALL (it lands flat) */
export const stepU = (t: number) => clamp((t - STEP0) / (FOOTFALL - STEP0));
const SWING_H = 8.6;
const swingLift = (u: number) => herm(u, [[0, 0, 9], [0.36, SWING_H, 0], [1, 0, -15]]);

/** the sneaker outline (same frame as v2/body Sneaker): for the sole's lowest point */
const SNEAK: [number, number][] = [
  [-4.6, -3.6], [2.8, -3.4], [6.0, -1.4], [10.2, 0.8], [14.2, 2.3], [16.8, 3.6], [17.9, 5.2], [17.6, 7.0], [15.6, 7.7],
  [6, 7.75], [-4, 7.75], [-6.8, 7.2], [-7.4, 4.4], [-6.9, 0.8], [-5.8, -2.0],
];
export const sneakerLow = (A: V, fa: number) => Math.max(...SNEAK.map(([u, v]) => footPt(A, fa, 1, u, v).y));

/** pre-swing: as the weight leaves it, the prosthetic heel rises and the foot rolls over its toe (the toe stays put
 *  on the floor), so the turned ankle is already flexing before the foot leaves the floor at STEP0 */
export const HEEL0 = 16.18;
const HEEL_PITCH = 16;
const TOE_C = {u: 15.6, v: 7.7}; // the sole under the toes
const TOE_P: V = footPt(NEAR_FOOT0, 90, 1, TOE_C.u, TOE_C.v);
const ankleAboutToe = (pitch: number): V => {
  const q = footPt({x: 0, y: 0}, pitch, 1, TOE_C.u, TOE_C.v);
  return {x: TOE_P.x - q.x, y: TOE_P.y - q.y};
};
/** the near (prosthetic) ankle target, the shoe's world pitch and its height off the floor at time t */
export const nearFoot4 = (t: number) => {
  const u = stepU(t);
  if (u <= 0) {
    const pitch = 90 - HEEL_PITCH * ss(t, HEEL0, STEP0);
    return {p: ankleAboutToe(pitch), pitch, lift: 0};
  }
  if (u >= 1) return {p: NEAR_FOOT1, pitch: 90, lift: 0};
  const A0 = ankleAboutToe(90 - HEEL_PITCH);
  const e = ss5(u, 0, 1);
  const lift = swingLift(u);
  // the foot keeps its toe-down hang while the turned ankle is flexed, and is level again to land flat
  const pitch = 90 - HEEL_PITCH * (1 - ss(u, 0.2, 0.85));
  return {p: {x: lerp(A0.x, NEAR_FOOT1.x, e), y: lerp(A0.y, NEAR_FOOT1.y, ss(u, 0, 0.9)) - lift}, pitch, lift};
};

/** the hand slide along the rails (rail x of each grip). Until the step the far hand grips 10 cm behind the near one,
 *  under its shoulder, so it still reaches its rail through the low lens of B, where that rail looks lowest; through
 *  the step it slides on with the body (its rail is farther, so it travels farther along it), staying just ahead of
 *  its shoulder so the far elbow stays inside his back's silhouette */
const gripX = (t: number, far: boolean) => (far ? lerp(-20, -44, ss5(t, 16.1, 17.0)) : lerp(-30, -39, ss5(t, 16.1, 16.94)));

/** the default lens for a time (the shot it falls in), so rehabPose4(t) alone gives what the film shows */
export const rehabCam4 = (t: number): Cam => (t < CUT_REHAB_B ? camA(t) : t < CUT_REHAB_C ? camB(t) : camC(t));

/** the single movement shared by the three views. The hands reach for the rails' positions as the lens `c` sees
 *  them (a rail sits nearer or farther than him, so the grip point in his plane depends on the lens). */
export const rehabPose4 = (t: number, c: Cam = rehabCam4(t), dn: number = railDN(t)): BPose => {
  const b = bend4(t);
  const fw = ss(t, SHIFT0, FOOTFALL); // 0..1 over the weight shift and step
  const breath = 0.25 * Math.sin((2 * Math.PI * (t - 11.4)) / 2.6);
  const hx = hipX(t) + 1.5 * b;
  const nf = nearFoot4(t);
  // the hip: standing height, the bend, and kept low enough that each planted foot stays reached
  // (late in the swing the hips sink a little toward the double support of the footfall, so the landing leg's reach
  // limit does not have to pull them down in the last frames)
  let hy = -73.4 + 9 * b + breath * (1 - fw) * 0.4 + 3.6 * ss(t, 16.6, FOOTFALL + 0.05);
  // (the far hip is drawn at hip + STAG4, so its limit is shifted back by STAG4.y; the near limit follows the near
  // ankle's target, planted or in the air, so it stays continuous through lift-off and landing)
  hy = smax(hy, reachY(hx + STAG4.x, FAR_FOOT) - STAG4.y);
  hy = smax(hy, reachY(hx, nf.p));
  const Hp = {x: hx, y: hy};
  const Hf = {x: Hp.x + STAG4.x, y: Hp.y + STAG4.y};
  // hands: the wrist sits above and behind the rail, the hand wraps forward over it (the rail never through a wrist)
  const rn = toD0(c, dn, gripX(t, false), RAIL_Y), rf = toD0(c, DF, gripX(t, true), RAIL_Y);
  const rr = 2.0;
  const look = ss(t, 16.05, 16.6);
  return {
    hip: Hp, pelvis: 4 + 6 * b + 2 * fw, chest: 3 + 8 * b + 4 * Math.sin(Math.PI * fw) + 1.5 * fw + breath * 0.6,
    near: legTo(Hp, nf.p, nf.pitch), far: legTo(Hf, FAR_FOOT, 90), stag: STAG4,
    aN: {T: {x: rn.x + 3.4, y: rn.y - rr * (D0 / dn) - 2.6}, elbow: -1}, aF: {T: {x: rf.x + 3.4, y: rf.y - rr * (D0 / DF) - 2.6}, elbow: -1},
    hN: HAND_GRIP, hF: HAND_GRIP, hAbsN: 128, hAbsF: 128,
    neck: 10 + 8 * b - 4 * look, turn: 0.8,
    expr: mixExpr({...focus, gx: -0.25, gy: 0.9, smile: 0.3 + 0.2 * b}, {...focus, gx: -0.55, gy: 0.75, smile: 0.45}, look), blink: 0,
  };
};

// ------------------------------------------------------------------------------------------------ the cameras
/** A: a tight side profile at the socket (w 31: the socket, the pylon and the prosthetic trainer fill the frame; his
 *  other leg stays out of it, so B's two-leg view is new). A slow drift along the foot (up and toward his front) while
 *  the toes flick; then on "backward ankle" a rise up the socket to the turned ankle at its rim, the thigh above it
 *  (w fixed: no push-in; the eye rises with the lens, so the wall and the floor show parallax), at rest by BEND0 so
 *  the bend reads on its own */
export const A_W = 32;
export const camA = (t: number): Cam => {
  // (x is held: the frame's left edge sits between the socket's front corner and his other sock, so his other leg
  // shows only as the heel of its trainer and the thigh going out at the top, never as a sliver)
  const y = herm(t, [[CUT_REHAB_A, -26.2, -0.35], [13.42, -26.9, -0.35], [14.3, -36.0, 0]]);
  const x = lerp(-5.32, -5.4, ss(t, CUT_REHAB_A, 14.3));
  return {x, y, w: A_W, eye: y - 10.5};
};
/** B: a low lens near the floor; the legs and the grips; a slight drift for parallax */
export const camB = (t: number): Cam => {
  const u = clamp((t - CUT_REHAB_B) / (CUT_REHAB_C - CUT_REHAB_B));
  // framed from the grips down: his face stays above the frame even at the bottom of the bend
  return {x: lerp(-16.5, -18.5, u), y: -45, w: 58, eye: -12};
};
/** C: wide, the whole boy and the bars; still (the action moves). The lens is at his waist height (eye -55), so the
 *  near rail projects where it does in B relative to his body (the grip arm keeps its shape across the cut) and the
 *  far rail sits a little lower, which keeps the far arm long and its elbow inside his back's silhouette */
export const camC = (t: number): Cam => {
  void t;
  return {x: -23, y: -80, w: 96, eye: -55};
};

// ------------------------------------------------------------------------------------------------ the room
/** the rehab room (V2 Room, with the floor boards and the window fixed in the world so a track shows parallax) */
const Room4: React.FC<{c: Cam; k: string}> = ({c, k}) => {
  const DW = D0 + 330;
  const wallBase = proj(c, DW, {x: 0, y: 0}).y;
  const planks: React.ReactNode[] = [];
  const i0 = Math.round(c.x / 40);
  for (let i = i0 - 40; i <= i0 + 40; i++) {
    const a = proj(c, DW, {x: i * 40, y: 0}), b = proj(c, 40, {x: i * 40, y: 0});
    planks.push(<line key={i} x1={fmt(a.x)} y1={fmt(a.y)} x2={fmt(b.x)} y2={fmt(b.y)} stroke={shade('#D8C3A0', 0.18)} strokeWidth={1.6} opacity={0.5} />);
  }
  const win = [proj(c, DW, {x: -190, y: -230}), proj(c, DW, {x: -60, y: -110})];
  return (
    <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
      <defs>
        <linearGradient id={`${k}rw`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={lit('#E4EEF0', 0.2)} /><stop offset="1" stopColor="#C8D9DE" /></linearGradient>
        <linearGradient id={`${k}rf`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#CDB792" /><stop offset="1" stopColor="#E3CFAC" /></linearGradient>
      </defs>
      <rect x={0} y={0} width={W} height={fmt(Math.max(0, wallBase + 1))} fill={`url(#${k}rw)`} />
      {[win].map((w, i) => (
        <rect key={i} x={fmt(w[0].x)} y={fmt(w[0].y)} width={fmt(w[1].x - w[0].x)} height={fmt(w[1].y - w[0].y)} fill="#CFEAF6" stroke="#AFC6D0" strokeWidth={6} />
      ))}
      <rect x={0} y={fmt(wallBase - 10)} width={W} height={12} fill="#B4C7CE" />
      <rect x={0} y={fmt(wallBase)} width={W} height={fmt(Math.max(0, H - wallBase))} fill={`url(#${k}rf)`} />
      {planks}
    </svg>
  );
};
/** a padded treatment bench behind him (V3), side-on a little deeper than his plane */
const Bench4: React.FC<{c: Cam; k: string; iw: number}> = ({c, k, iw}) => {
  const q = (x: number, y: number) => toD0(c, BENCH.D, x, y);
  const {x0, x1} = BENCH;
  const top = [q(x0, -52), q(x1, -52), q(x1, -44), q(x0, -44)];
  return (
    <g>
      {[x0 + 8, x1 - 8].map((x, i) => <Capsule key={i} id={`${k}bl${i}`} a={q(x, -44)} b={q(x, 0)} ra={1.6 * (D0 / BENCH.D)} rb={1.6 * (D0 / BENCH.D)} color={shade(C.metal, 0.15)} />)}
      <SoftShadow id={`${k}bs`} c={q((x0 + x1) / 2, 0)} rx={46} ry={2.2} alpha={0.22} color="#6B5A3C" />
      <Inked w={iw}><Blob id={`${k}bp`} d={closed(top, 0.3)} c={q(x0 + 26, -56)} r={50} color="#4F87B8" k={0.6} /></Inked>
      <Inked w={iw}><InkPath d={closed([q(x1 - 28, -53), q(x1 - 12, -58), q(x1 - 1, -56), q(x1 - 1, -52), q(x1 - 28, -52)], 0.4)} fill={lit(C.sheet, 0.1)} /></Inked>
    </g>
  );
};
/** the front of the bars: the cross-rail between the two end posts */
const FrontEnd: React.FC<{c: Cam; iw: number; dn: number}> = ({c, iw, dn}) => {
  const a = toD0(c, dn, FRONT_X, RAIL_Y), b = toD0(c, DF, FRONT_X, RAIL_Y);
  return (
    <Inked w={iw}><InkPath d={`M${fmt(a.x)},${fmt(a.y - 2)} L${fmt(b.x)},${fmt(b.y - 1.6)} L${fmt(b.x)},${fmt(b.y + 1.6)} L${fmt(a.x)},${fmt(a.y + 2)} Z`} fill="#C3CBD3" /></Inked>
  );
};
/** a foot's contact shadow on the floor: full when planted, smaller and fainter as it lifts */
const FootShadow: React.FC<{k: string; x: number; y: number; lift: number}> = ({k, x, y, lift}) => {
  const f = clamp(1 - lift / 14);
  return <SoftShadow id={k} c={{x, y}} rx={12 * (0.7 + 0.3 * f)} ry={2 * (0.7 + 0.3 * f)} alpha={0.32 * f} color="#6B5A3C" />;
};

/** the rehab room and Wyatt between the bars, through the lens c */
const RehabView: React.FC<{t: number; k: string; c: Cam; dn?: number}> = ({t, k, c, dn = DN}) => {
  const px = 1 / camScale(c);
  const iw = 7 * px;
  const p = rehabPose4(t, c, dn);
  const j = bjoints(p);
  // one flex of the toes on "pointing": they lift toward his back (extension, away from the sole, toward the bench
  // behind him, as far as the socket's back wall allows), hold through "behind him", and settle back
  // (a small curl first, a wind-up, so the lift reads as one flick that ends pointing back)
  const P0 = T4.pointing;
  const toe = herm(t, [[P0 - 0.12, 0, 0], [P0 + 0.04, TOE_WIND, 0], [P0 + 0.1, TOE_WIND, 0], [P0 + 0.3, TOE_FLEX, 0], [T4.him + 0.1, TOE_FLEX, 0], [T4.him + 0.4, 0, 0]]);
  const nf = nearFoot4(t);
  return (
    <>
      <Room4 c={c} k={k} />
      <Layer c={c}>
        <Bench4 c={c} k={`${k}be`} iw={iw} />
        <Rail c={c} D={DF} k={`${k}rf0`} posts={[FRONT_X, BACK_X]} />
        <FrontEnd c={c} iw={iw} dn={dn} />
        <FootShadow k={`${k}fs0`} x={j.FA.x - 3} y={FAR_FOOT.y + ANK + 0.3} lift={0} />
        <FootShadow k={`${k}fs1`} x={j.PA.x - 3} y={0.3} lift={nf.lift} />
        <Wyatt2 p={p} o={{id: `${k}w`, px, shoeN: 'sneaker', shoeF: 'sneaker', prosthesis: true, socket: {clear: 1, local: 0, rim: 1}, toeCurl: toe, shirt: '#F2A33C', shorts: '#2E3F5C', sock: '#FFFFFF',
          behind: <Rail c={c} D={DF} k={`${k}rf`} posts={[]} />,
          beforeNearArm: <Rail c={c} D={dn} k={`${k}rn`} posts={[FRONT_X, BACK_X + 10]} />}} />
      </Layer>
    </>
  );
};

export const RehabA4: React.FC<{t: number; k: string}> = ({t, k}) => <RehabView t={t} k={k} c={camA(t)} />;
export const RehabB4: React.FC<{t: number; k: string}> = ({t, k}) => <RehabView t={t} k={k} c={camB(t)} dn={DN_B} />;
export const RehabC4: React.FC<{t: number; k: string}> = ({t, k}) => <RehabView t={t} k={k} c={camC(t)} />;

/** caption centre heights (px) for captions 7-10. 7-9 share one height that clears all three views: in A over his
 *  thigh, at least ~50 px above the socket's rim (over his shorts after the rise), above the near grip in B (whose
 *  top edge is the shirt, his face is above the frame) and above his head in C;
 *  none of them covers the foot, the socket or the shoes. 10 sits at the film default (260), as the wake shot sets it
 *  (CAP_Y_BED), which still clears his head in C. */
export const CAP_Y4_REHAB = 180;
export const CAP_Y_REHAB: Record<number, number | ((t: number) => number)> = {
  7: CAP_Y4_REHAB,
  8: CAP_Y4_REHAB,
  9: CAP_Y4_REHAB,
  10: 260,
};
