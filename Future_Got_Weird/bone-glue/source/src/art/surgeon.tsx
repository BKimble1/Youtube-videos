// The surgeon: a seated Weird Crew surgeon at the RIGHT side of the hand table, turned in a 3/4 profile toward
// screen-left and leaning over the wrist, in a scrub cap, a surgical mask, an opaque gown with long sleeves and
// light-blue gloves. Right-handed: his far RIGHT hand holds the applicator in a syringe grip (the index curled round the
// flange, the thumb on the plunger pad, the rest of the fingers closed), his near LEFT hand holds the pointed reduction
// clamp by its handles (thumb through the upper ring, ring finger through the lower one, the index along the shank).
//
// Construction (dc lineage: Death Clock -> Real Web Fluid -> Glass Climbing): an upright bust (head adapted from dc
// Head: the crew's eyes and brows, the cap replaces the hair, the mask covers the nose, mouth and chin), dc Limb
// sleeves (shoulder -> bent elbow -> wrist, the far arm behind the torso, the near arm in front of it), and gloved hands
// adapted from dc Hand (the same palm and knuckle layout, slimmer life-size fingers, and an explicit pose per joint so
// each digit can wrap the instrument; the instrument is sandwiched between the digits that pass behind it and the
// palm and digits in front of it; digits that go down through the clamp's rings get the ring's far half drawn back
// over their tips).
//
// Space: the wrist plane in millimetres (anatomy.ts). The scene draws that plane with scale(s, s*k) (camera k: the
// table squash of the high three-quarter view). The upright body is drawn with an inverse vertical scale 1/k about
// his table-level anchor, so his proportions never squash; his hands and the instruments stay in the table plane.
//
// Every contour is a constant on-screen width (non-scaling strokes, 2.8 px showing, the weight of the patient's skin
// line and the instruments); the face's drawn features scale with the face. No text or glyphs. Deterministic.
import React from 'react';
import {C, INK} from './palette';
import {Deco, Inked, InkLine, InkPath, useInk} from '../dc/ink';
import {Blob, Capsule, LIGHT, Lin} from '../dc/shade';
import {Limb} from '../dc/limb';
import {lit, mix, shade} from '../dc/color';
import {add, clamp, dot, fmt, len, lerpV, mul, norm, P as Pf, perp, rad, rot, sub, V} from '../dc/math';
import {AppState, Applicator, ClampRingOver, ClampState, Clamp, appGrip, clampGrip} from './instruments';

// ------------------------------------------------------------------------------------------------ state
export type SurgeonFace = {focus: number; smile: number; gx: number; gy: number; blink: number};
export type SurgeonState = {
  app: AppState;
  clamp: ClampState;
  /** 1 = the right hand grips the applicator; 0 = released and moved back toward the body */
  appHeld: number;
  /** 1 = the left hand grips the clamp; 0 = released and moved back toward the body */
  clampHeld: number;
  /** focus: concentration (brows lowered, eyes narrowed); smile: eye-smile above the mask (cheeks lift, lower lids
   *  rise); gx, gy: gaze offset -1..1 (+ = screen right / down; looking at the wrist is about gx -0.5, gy 0.6);
   *  blink 0..1 */
  face: SurgeonFace;
  /** the camera's table squash (the scene draws the wrist plane with scale(s, s*k)) */
  k: number;
  /** small body lean in degrees: + leans his upper body toward the table (screen-left), - sits back (about -8..8) */
  lean: number;
  /** optional (the story's instrument visibility); the hands stay on the instruments, so these are informational */
  appOn?: number;
  clampOn?: number;
};

// ------------------------------------------------------------------------------------------------ sizes, ink
export const SURGEON = {
  skin: '#C98B5E',
  /** gloved hand: wrist crease to the straight middle fingertip (mm), life size */
  hand: 172,
  /** head radius (the cartoon head is ~150 mm wide, a little larger than life) */
  headR: 76,
  /** his table-level anchor (wrist-plane mm): the inverse 1/k body scale is about this point */
  anchor: {x: 300, y: 6} as V,
};
/** the whole body's horizontal shift from its designed place (kept for compatibility; the body is designed in place) */
export const SURGEON_DX = 0;

/** Inked group width: dc draws a navy underlay stroked at w * 0.72; the surgeon's underlays are non-scaling strokes, so
 *  2.8 px of navy shows outside every silhouette and occlusion edge (as the patient's skin line and the instruments) */
const OUT = 7.8;
/** finger separations and seams (screen px) */
const SEP_PX = 2.2;
const CREASE_PX = 1.5;
/** the eyes' own contour (Inked width; non-scaling) */
const EYE_INK = 6.4;

const NSCLASS = 'bgsurg-ns';
const NSLINE = 'bgsurg-nsl';
const NsStyle: React.FC = () => (
  <style>{`.${NSCLASS} path[fill="${INK}"],.${NSCLASS} ellipse[fill="${INK}"],.${NSCLASS} circle[fill="${INK}"],.${NSLINE} path[fill="none"]{vector-effect:non-scaling-stroke}`}</style>
);

// ------------------------------------------------------------------------------------------------ helpers
const A0 = SURGEON.anchor;
const toLocal = (p: V, k: number): V => ({x: p.x, y: A0.y + (p.y - A0.y) * k});
const fromLocal = (p: V, k: number): V => ({x: p.x, y: A0.y + (p.y - A0.y) / k});
const bodyT = (k: number) => `translate(${fmt(A0.x)} ${fmt(A0.y)}) scale(1 ${(1 / k).toFixed(5)}) translate(${fmt(-A0.x)} ${fmt(-A0.y)})`;
const degOf = (d: V) => (Math.atan2(d.y, d.x) * 180) / Math.PI;
const ease = (x: number) => {
  const t = clamp(x);
  return t * t * (3 - 2 * t);
};
const smooth = (pts: V[], closedPath = true, tension = 1) => {
  const n = pts.length;
  let d = `M${Pf(pts[0])}`;
  const last = closedPath ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = pts[closedPath ? (i - 1 + n) % n : Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[closedPath ? (i + 1) % n : i + 1];
    const p3 = pts[closedPath ? (i + 2) % n : Math.min(n - 1, i + 2)];
    const c1 = add(p1, mul(sub(p2, p0), tension / 6));
    const c2 = sub(p2, mul(sub(p3, p1), tension / 6));
    d += ` C${Pf(c1)} ${Pf(c2)} ${Pf(p2)}`;
  }
  return closedPath ? d + ' Z' : d;
};
/** the closest point to p on a polyline, and its distance */
const nearestOn = (p: V, ps: V[]) => {
  let best = {q: ps[0], d: len(sub(p, ps[0]))};
  for (let i = 0; i < ps.length - 1; i++) {
    const a = ps[i], b = ps[i + 1];
    const ab = sub(b, a);
    const l2 = dot(ab, ab) || 1e-9;
    const t = clamp(dot(sub(p, a), ab) / l2);
    const q = add(a, mul(ab, t));
    const d = len(sub(p, q));
    if (d < best.d) best = {q, d};
  }
  return best;
};

// ------------------------------------------------------------------------------------------------ gloved hand
// Hand coordinates (as dc Hand): u along the hand's axis from the wrist (in units of the hand length L), v across it,
// positive toward the thumb. A digit is its joint chain in hand coordinates (MCP, PIP, DIP, tip; the thumb: CMC, MCP,
// IP, tip) with a radius at each joint; seen from above, a flexed phalanx is simply a shorter (foreshortened) segment.
// Each segment is drawn in front of the held object ('f') or behind it ('b').
type Lay = 'b' | 'f';
type Digit = {j: [number, number][]; r: number[]; lay?: Lay[]};
export type GripPose = {fingers: Digit[]; thumb: Digit; thumbLay: Lay; thumbOver: boolean};

/** the back of the hand (dc palm, a touch slimmer: a life-size glove) */
const PALM: [number, number][] = [
  [-0.03, -0.162],
  [0.2, -0.222],
  [0.4, -0.212],
  [0.468, -0.118],
  [0.482, 0.0],
  [0.468, 0.128],
  [0.43, 0.232],
  [0.27, 0.268],
  [0.12, 0.258],
  [-0.03, 0.162],
];
/** knuckle (MCP) positions and base radii: index, middle, ring, little */
const MCP: [number, number][] = [
  [0.44, 0.182],
  [0.462, 0.06],
  [0.448, -0.062],
  [0.408, -0.172],
];
const FR = [0.05, 0.053, 0.049, 0.043];
const TAPER = [1, 0.95, 0.9, 0.86];
const fingerR = (i: number) => TAPER.map((t) => FR[i] * t);
const THUMB_R = [0.084, 0.062, 0.057, 0.052];

type GloveProps = {
  id: string;
  wrist: V;
  /** hand axis (deg, atan2 convention) */
  ang: number;
  L: number;
  /** +1: thumb on the clockwise side of the hand axis (his left hand from the back), -1 anticlockwise (right hand) */
  ts: 1 | -1;
  pose: GripPose;
  color: string;
  /** the glove's cuff over the gown sleeve: unit direction from the wrist toward the elbow (world), length, radii */
  cuff: {dir: V; len: number; r0: number; r1: number};
  /** the held object (drawn between the 'b' and 'f' digits) */
  obj?: React.ReactNode;
  /** drawn right after the thumb (a clamp ring's far half over the thumb's tip) */
  thumbOverlay?: React.ReactNode;
  /** drawn last (a clamp ring's far half over a finger that passes through it) */
  over?: React.ReactNode;
};

const GloveHand: React.FC<GloveProps> = ({id, wrist, ang, L, ts, pose, color, cuff, obj, thumbOverlay, over}) => {
  const dir = {x: Math.cos(rad(ang)), y: Math.sin(rad(ang))};
  const n = perp(dir);
  const W = (u: number, v: number): V => add(wrist, add(mul(dir, u * L), mul(n, v * L * ts)));
  const palmD = smooth(PALM.map(([u, v]) => W(u, v)));
  const palmC = W(0.24, 0.02);
  const deep = shade(color, 0.42);
  const hi = lit(color, 0.55);

  // --- digits to world segments
  type Seg = {a: V; b: V; ra: number; rb: number; lay: Lay; si: number};
  const digitSegs = (dg: Digit): Seg[] => {
    const pts = dg.j.map(([u, v]) => W(u, v));
    const out: Seg[] = [];
    for (let i = 0; i < pts.length - 1; i++) out.push({a: pts[i], b: pts[i + 1], ra: dg.r[i] * L, rb: dg.r[i + 1] * L, lay: dg.lay?.[i] ?? 'f', si: i});
    return out;
  };
  const fingers = pose.fingers.map(digitSegs);
  const thumb = digitSegs(pose.thumb);
  const segCol = (si: number) => (si === 0 ? color : mix(color, shade(color, 0.1), 0.35 + 0.25 * si));
  const capsules = (segs: Seg[], key: string, lay: Lay) =>
    segs
      .filter((s) => s.lay === lay)
      .map((s) => <Capsule key={`${key}${s.si}`} id={`${id}-${key}${s.si}`} a={s.a} b={len(sub(s.b, s.a)) < 0.01 ? add(s.a, mul(dir, 0.01)) : s.b} ra={s.ra} rb={s.rb} color={segCol(s.si)} spec={s.si === 0 ? 0.16 : 0.1} k={1.25} />);

  // --- the cuff: a tube from under the palm back along the forearm, its open end rolled
  const c0 = W(0.05, 0);
  const cd = norm(cuff.dir);
  const c1 = add(c0, mul(cd, cuff.len));
  const cn = perp(cd);
  const cAng = degOf(cd);
  const cuffD = `M${Pf(add(c0, mul(cn, cuff.r0)))} L${Pf(add(c1, mul(cn, cuff.r1)))} A${fmt(cuff.r1 * 0.32)} ${fmt(cuff.r1)} ${fmt(cAng)} 0 1 ${Pf(add(c1, mul(cn, -cuff.r1)))} L${Pf(add(c0, mul(cn, -cuff.r0)))} Z`;
  let ln = cn;
  if (dot(ln, LIGHT) < 0) ln = mul(ln, -1);
  const cm = lerpV(c0, c1, 0.5);
  const rimIn = add(c1, mul(cd, -cuff.r1 * 0.2));
  const cuffBody = (
    <Lin key="cuff" id={`${id}-cf`} d={cuffD} from={add(cm, mul(ln, cuff.r0))} to={add(cm, mul(ln, -cuff.r0))} stops={[[0, lit(color, 0.26)], [0.3, lit(color, 0.08)], [0.62, color], [0.9, shade(color, 0.26)], [1, shade(color, 0.16)]]} />
  );
  const cuffDeco = (
    <g>
      <path d={`M${Pf(add(rimIn, mul(cn, cuff.r1 * 0.95)))} A${fmt(cuff.r1 * 0.3)} ${fmt(cuff.r1 * 0.95)} ${fmt(cAng)} 0 1 ${Pf(add(rimIn, mul(cn, -cuff.r1 * 0.95)))}`} fill="none" stroke={lit(color, 0.45)} strokeWidth={fmt(cuff.r1 * 0.2)} opacity={0.8} />
      <path d={`M${Pf(add(add(rimIn, mul(cd, -cuff.r1 * 0.16)), mul(cn, cuff.r1 * 0.9)))} A${fmt(cuff.r1 * 0.3)} ${fmt(cuff.r1 * 0.9)} ${fmt(cAng)} 0 1 ${Pf(add(add(rimIn, mul(cd, -cuff.r1 * 0.16)), mul(cn, -cuff.r1 * 0.9)))}`} fill="none" stroke={INK} strokeWidth={CREASE_PX} opacity={0.5} />
      <ellipse cx={fmt(add(cm, mul(ln, cuff.r0 * 0.5)).x)} cy={fmt(add(cm, mul(ln, cuff.r0 * 0.5)).y)} rx={fmt(cuff.len * 0.3)} ry={fmt(cuff.r0 * 0.08)} transform={`rotate(${fmt(cAng)} ${fmt(add(cm, mul(ln, cuff.r0 * 0.5)).x)} ${fmt(add(cm, mul(ln, cuff.r0 * 0.5)).y)})`} fill="#FFFFFF" opacity={0.32} />
      {/* latex wrinkles round the wrist */}
      {[0.32, 0.62].map((t, i) => {
        const p = lerpV(c0, c1, t);
        return <path key={i} d={`M${Pf(add(p, mul(cn, cuff.r0 * 0.75)))} Q${Pf(add(p, mul(cd, -cuff.r0 * 0.18)))} ${Pf(add(p, mul(cn, -cuff.r0 * 0.5)))}`} fill="none" stroke={deep} strokeWidth={CREASE_PX} strokeLinecap="round" opacity={0.3} />;
      })}
    </g>
  );

  // --- the palm (the back of the glove)
  const palm = <Blob key="palm" id={`${id}-palm`} d={palmD} c={palmC} r={0.46 * L} color={color} k={0.9} />;
  const palmDeco = (
    <g>
      {/* extensor tendons fanning to the knuckles, and the knuckles' bumps */}
      {MCP.map(([u, v], i) => (
        <path key={i} d={`M${Pf(W(0.1, v * 0.4))} Q${Pf(W(0.26, v * 0.75))} ${Pf(W(u - 0.05, v))}`} fill="none" stroke={hi} strokeWidth={fmt(L * 0.012)} strokeLinecap="round" opacity={0.22} />
      ))}
      {MCP.map(([u, v], i) => {
        const p = add(W(u - 0.03, v), mul(LIGHT, FR[i] * L * 0.3));
        return <ellipse key={`k${i}`} cx={fmt(p.x)} cy={fmt(p.y)} rx={fmt(FR[i] * L * 0.42)} ry={fmt(FR[i] * L * 0.22)} transform={`rotate(${fmt(ang + 90)} ${fmt(p.x)} ${fmt(p.y)})`} fill="#FFFFFF" opacity={0.26} />;
      })}
      <ellipse cx={fmt(W(0.22, 0.06).x)} cy={fmt(W(0.22, 0.06).y)} rx={fmt(0.12 * L)} ry={fmt(0.045 * L)} transform={`rotate(${fmt(ang + 10 * ts)} ${fmt(W(0.22, 0.06).x)} ${fmt(W(0.22, 0.06).y)})`} fill="#FFFFFF" opacity={0.18} />
    </g>
  );

  // --- finger deco: separations where neighbours touch, joint creases, knuckle glosses
  const sepFor = (i: number, lay: Lay) => {
    const A = fingers[i].filter((s) => s.lay === lay);
    const B = fingers[i + 1]?.filter((s) => s.lay === lay);
    if (!A.length || !B?.length) return null;
    const bPts = [B[0].a, ...B.map((s) => s.b)];
    const runs: V[][] = [];
    let cur: V[] = [];
    A.forEach((s) => {
      for (let k = 0; k <= 6; k++) {
        const t = k / 6;
        const p = lerpV(s.a, s.b, t);
        const r = s.ra + (s.rb - s.ra) * t;
        const nb = nearestOn(p, bPts);
        const rB = B[0].ra;
        if (nb.d < (r + rB) * 1.05 && nb.d > 1e-6) cur.push(add(p, mul(norm(sub(nb.q, p)), r * 0.9)));
        else if (cur.length) {
          runs.push(cur);
          cur = [];
        }
      }
    });
    if (cur.length) runs.push(cur);
    return runs
      .filter((rn) => rn.length > 1)
      .map((rn, k) => <path key={`s${i}${lay}${k}`} d={`M${rn.map((q) => Pf(q)).join(' L')}`} fill="none" stroke={INK} strokeWidth={SEP_PX} strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />);
  };
  const jointDeco = (segs: Seg[], key: string, lay: Lay) => {
    const els: React.ReactNode[] = [];
    segs.forEach((s, i) => {
      if (s.lay !== lay) return;
      const ax = norm(sub(s.b, s.a));
      const sl = len(sub(s.b, s.a));
      const nn = perp(ax);
      // a crease across the joint at the segment's start (PIP, DIP), when the previous segment is drawn too
      if (i > 0 && segs[i - 1].lay === lay) {
        const q = add(s.a, mul(ax, Math.min(sl * 0.3, s.ra * 0.35)));
        els.push(
          <path key={`${key}c${i}`} d={`M${Pf(add(q, mul(nn, s.ra * 0.62)))} Q${Pf(add(q, mul(ax, s.ra * 0.25)))} ${Pf(add(q, mul(nn, -s.ra * 0.62)))}`} fill="none" stroke={deep} strokeWidth={CREASE_PX} strokeLinecap="round" opacity={0.42} />,
        );
      }
      // a gloss on the segment's lit side (the knuckle top for a short, flexed segment)
      const g = add(lerpV(s.a, s.b, sl < s.ra * 1.2 ? 0.5 : 0.62), mul(LIGHT, s.ra * 0.42));
      const ga = sl < s.ra * 1.2 ? degOf(ax) + 90 : degOf(ax);
      els.push(<ellipse key={`${key}g${i}`} cx={fmt(g.x)} cy={fmt(g.y)} rx={fmt(Math.max(s.ra * 0.32, Math.min(sl * 0.32, s.ra * 0.75)))} ry={fmt(s.ra * 0.15)} transform={`rotate(${fmt(ga)} ${fmt(g.x)} ${fmt(g.y)})`} fill="#FFFFFF" opacity={0.5} />);
    });
    return els;
  };

  const thumbGroup = (
    <g>
      <Inked w={OUT}>{capsules(thumb.map((s) => ({...s, lay: pose.thumbLay})), 't', pose.thumbLay)}</Inked>
      {jointDeco(thumb.map((s) => ({...s, lay: pose.thumbLay})), 'tj', pose.thumbLay)}
      {thumbOverlay}
    </g>
  );
  const fingerCaps = (lay: Lay) => fingers.flatMap((segs, i) => capsules(segs, `f${i}s`, lay)).reverse();
  const fingerDeco = (lay: Lay) => (
    <g>
      {[0, 1, 2].map((i) => sepFor(i, lay))}
      {fingers.map((segs, i) => jointDeco(segs, `f${i}`, lay))}
    </g>
  );
  const hasBack = fingers.some((sg) => sg.some((s) => s.lay === 'b'));
  return (
    <g className={NSLINE}>
      {hasBack && (
        <g>
          <Inked w={OUT}>{fingerCaps('b')}</Inked>
          {fingerDeco('b')}
        </g>
      )}
      {pose.thumbLay === 'b' && thumbGroup}
      {obj}
      {pose.thumbLay === 'f' && !pose.thumbOver && thumbGroup}
      <Inked w={OUT}>
        {cuffBody}
        {palm}
        {fingerCaps('f')}
      </Inked>
      {cuffDeco}
      {palmDeco}
      {fingerDeco('f')}
      {pose.thumbLay === 'f' && pose.thumbOver && thumbGroup}
      {over}
    </g>
  );
};

// ------------------------------------------------------------------------------------------------ the two grips
const L_H = SURGEON.hand;
const dirDeg = (a: number): V => ({x: Math.cos(rad(a)), y: Math.sin(rad(a))});
/** world -> hand coordinates for a hand placed at (wrist, ang, ts) */
const toHand = (p: V, wrist: V, ang: number, ts: 1 | -1): [number, number] => {
  const d = dirDeg(ang);
  const n = perp(d);
  const q = sub(p, wrist);
  return [dot(q, d) / L_H, dot(q, n) / (L_H * ts)];
};
const handPt = (wrist: V, ang: number, ts: 1 | -1, u: number, v: number): V => {
  const d = dirDeg(ang);
  return add(wrist, add(mul(d, u * L_H), mul(perp(d), v * L_H * ts)));
};

/** Syringe grip (right hand, back of the hand up, ts -1): the applicator runs along the hand's thumb-side groove
 *  (v 0.27), its flange at u 0.6 under the index's middle joint. The index curls round the flange's inner wing (its
 *  last joint passing under the barrel, the tip showing beyond it), the middle finger curls in beside it, the ring and
 *  little fingers close loosely; the thumb lies along the near side of the plunger rod with its pad on the plunger's
 *  thumb pad, ready to press. */
const FAR_UV = {u: 0.6, v: 0.27};
const farPose = (thumbTip: [number, number]): GripPose => {
  const base: [number, number] = [0.1, 0.19];
  const tt = thumbTip;
  const L3 = (a: [number, number], b: [number, number], t: number, dv: number): [number, number] => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t + dv];
  return {
    fingers: [
      {j: [MCP[0], [0.585, 0.205], [0.628, 0.236], [0.62, 0.302]], r: fingerR(0), lay: ['f', 'f', 'b']},
      {j: [MCP[1], [0.598, 0.094], [0.632, 0.13], [0.618, 0.166]], r: fingerR(1), lay: ['f', 'f', 'b']},
      {j: [MCP[2], [0.572, -0.04], [0.598, -0.008]], r: fingerR(2)},
      {j: [MCP[3], [0.505, -0.152], [0.53, -0.122]], r: fingerR(3)},
    ],
    thumb: {j: [base, L3(base, tt, 0.42, 0.05), L3(base, tt, 0.74, 0.024), tt], r: THUMB_R},
    thumbLay: 'f',
    thumbOver: true,
  };
};

/** Ring grip (left hand, back of the hand up, ts +1): the clamp's handles run along the hand toward the box joint; the
 *  thumb's tip goes down through the upper ring, the ring finger through the lower ring, the middle finger curls
 *  between them, the index lies along the shank toward the joint and the little finger closes under. */
const NEAR_MID = {u: 0.6, v: 0.0815};
const nearPose = (upper: [number, number], lower: [number, number]): GripPose => {
  const base: [number, number] = [0.1, 0.19];
  const tt: [number, number] = [upper[0] - 0.012, upper[1] + 0.012];
  return {
    fingers: [
      {j: [MCP[0], [0.62, 0.118], [0.752, 0.094], [0.848, 0.084]], r: fingerR(0)},
      {j: [MCP[1], [0.585, 0.072], [0.616, 0.086]], r: fingerR(1)},
      {j: [MCP[2], [lower[0] - 0.035, lower[1] - 0.03], [lower[0], lower[1]]], r: fingerR(2)},
      {j: [MCP[3], [0.5, -0.15], [0.524, -0.12]], r: fingerR(3)},
    ],
    thumb: {j: [base, [0.28, 0.268], [0.45, tt[1] + 0.07], tt], r: THUMB_R},
    thumbLay: 'f',
    thumbOver: false,
  };
};

type GripSolve = {wrist: V; ang: number; pose: GripPose; ts: 1 | -1; tipT: V; tipR?: V; ringU?: V; ringL?: V; toward?: V};
const solveFar = (st: SurgeonState): GripSolve => {
  const g = appGrip(st.app);
  const ts: 1 | -1 = -1;
  const ang = (g.ang * 180) / Math.PI;
  const d = dirDeg(ang);
  const wrist = sub(sub(g.p, mul(d, FAR_UV.u * L_H)), mul(perp(d), FAR_UV.v * L_H * ts));
  // the thumb's pulp on the pad's back face
  const tipW = sub(g.padBack, mul(d, 0.046 * L_H));
  const tipH = toHand(tipW, wrist, ang, ts);
  return {wrist, ang, ts, pose: farPose(tipH), tipT: tipW};
};
const solveNear = (st: SurgeonState): GripSolve => {
  const g = clampGrip(st.clamp);
  const ts: 1 | -1 = 1;
  const nv = norm(sub(g.upper, g.lower));
  const d = {x: nv.y, y: -nv.x};
  const ang = degOf(d);
  const wrist = sub(sub(g.p, mul(d, NEAR_MID.u * L_H)), mul(perp(d), NEAR_MID.v * L_H * ts));
  const up = toHand(g.upper, wrist, ang, ts);
  const lo = toHand(g.lower, wrist, ang, ts);
  const pose = nearPose(up, lo);
  const tipT = handPt(wrist, ang, ts, pose.thumb.j[3][0], pose.thumb.j[3][1]);
  return {wrist, ang, ts, pose, tipT, tipR: g.lower, ringU: g.upper, ringL: g.lower, toward: d};
};

// ------------------------------------------------------------------------------------------------ head
const SurgeonHead: React.FC<{id: string; c: V; R: number; roll: number; turn: number; face: SurgeonFace; skin: string}> = ({id, c, R, roll, turn: t, face, skin}) => {
  const pass = useInk().pass;
  const s = R / 100;
  const Lc = rot(LIGHT, -roll);
  const xf = -30 * t;
  const fw = 4.6; // feature line width (head units)
  const focus = clamp(face.focus);
  const sm = clamp(face.smile);
  const gy = clamp(face.gy, -1, 1);
  const gx = clamp(face.gx, -1, 1);
  // expression mapping: looking down lowers the upper lids; focus narrows; the eye-smile lifts the lower lids
  const lid0 = clamp(0.1 + 0.22 * Math.max(0, gy) + 0.26 * focus - 0.08 * sm);
  const L = clamp(lid0 + clamp(face.blink) * (1 - lid0));
  const sq = clamp(0.18 * focus + 0.6 * sm);
  const browDown = clamp(0.85 * focus - 0.35 * sm, -0.3, 1);
  const browLift = 0.25 * sm; // relaxed arch with the smile
  const rg = (gid: string, cx: number, cy: number, r: number, focal: number, stops: [number, string, number?][]) => {
    const fp = add({x: cx, y: cy}, mul(Lc, r * focal));
    return (
      <radialGradient id={gid} gradientUnits="userSpaceOnUse" cx={fmt(cx)} cy={fmt(cy)} r={fmt(r)} fx={fmt(fp.x)} fy={fmt(fp.y)}>
        {stops.map(([o, col, a], i) => (
          <stop key={i} offset={o} stopColor={col} stopOpacity={a ?? 1} />
        ))}
      </radialGradient>
    );
  };
  const Q = (a: V, cc: V, b: V) => `M${Pf(a)} Q${Pf(cc)} ${Pf(b)}`;

  const headD = `M0,-107 C55,-107 100,-60 100,0 C100,60 55,107 0,107 C-55,107 -100,60 -100,0 C-100,-60 -55,-107 0,-107 Z`;
  const nearEarX = 101 - 8 * t;
  const ear = (x: number) =>
    `M${fmt(x - 8)},-16 C${fmt(x + 10)},-24 ${fmt(x + 22)},-8 ${fmt(x + 20)},8 C${fmt(x + 19)},22 ${fmt(x + 12)},34 ${fmt(x + 3)},36 C${fmt(x - 4)},37 ${fmt(x - 9)},32 ${fmt(x - 10)},26 L${fmt(x - 12)},-8 Z`;
  const earRim = (x: number) => `M${fmt(x - 2)},-10 C${fmt(x + 9)},-13 ${fmt(x + 14)},0 ${fmt(x + 12)},11 C${fmt(x + 11)},19 ${fmt(x + 6)},26 ${fmt(x)},27`;

  // --- cap: a rounded scrub cap over the whole top and back of the head (the hem across the forehead, behind the ear)
  const hx = xf * 0.2;
  const capD = smooth([
    {x: -109 + hx, y: -42},
    {x: -106 + hx, y: -98},
    {x: -66 + hx, y: -140},
    {x: 4 + hx, y: -150},
    {x: 72 + hx, y: -136},
    {x: 112, y: -92},
    {x: 120, y: -46},
    {x: 112, y: -24},
    {x: 96, y: -30},
    {x: 70, y: -52},
    {x: 30 + hx, y: -70},
    {x: -30 + hx, y: -70},
    {x: -80 + hx, y: -61},
  ]);
  // the hem: a folded band along the cap's lower edge
  const hemTop = [{x: -111 + hx, y: -58}, {x: -80 + hx, y: -79}, {x: -30 + hx, y: -89}, {x: 30 + hx, y: -89}, {x: 74, y: -72}, {x: 104, y: -50}, {x: 122, y: -40}];
  const hemBot = [{x: 112, y: -24}, {x: 96, y: -30}, {x: 70, y: -52}, {x: 30 + hx, y: -70}, {x: -30 + hx, y: -70}, {x: -80 + hx, y: -61}, {x: -109 + hx, y: -42}];
  const hemD = `${smooth(hemTop, false)} ${smooth(hemBot, false).replace(/^M/, 'L')} Z`;

  // --- eyes
  const eyeY = -8;
  const nearX = xf + 37 * (1 - 0.08 * t);
  const farX = xf - 37 * (1 - 0.3 * t);
  const farW = 1 - 0.32 * t;
  const Eye = (k: 'n' | 'f', ex: number, wf: number, side: 1 | -1) => {
    const rx = 20 * wf;
    const ry = 21;
    const eyeD = `M${fmt(ex - rx)},${eyeY} C${fmt(ex - rx)},${fmt(eyeY - ry * 1.33)} ${fmt(ex + rx)},${fmt(eyeY - ry * 1.33)} ${fmt(ex + rx)},${eyeY} C${fmt(ex + rx)},${fmt(eyeY + ry * 1.33)} ${fmt(ex - rx)},${fmt(eyeY + ry * 1.33)} ${fmt(ex - rx)},${eyeY} Z`;
    const topY = eyeY - ry + L * ry * 2.05;
    const botY = eyeY + ry - sq * ry * 1.05;
    // the lower lid bows UP with the eye-smile (a happy crescent), down otherwise
    const lowBow = 6 - 16 * sm;
    if (L > 0.92 || botY - topY < 3) {
      return <InkLine key={k} d={Q({x: ex - rx, y: eyeY + 3}, {x: ex, y: eyeY + 11 - 14 * sm}, {x: ex + rx, y: eyeY + 3})} w={fw * 1.1} />;
    }
    const pr = 10.2;
    const ix = ex + gx * rx * 0.42 - t * 4;
    const iy = eyeY + 2 + gy * ry * 0.42;
    // the eye (outline included) is cut along the lower lid when it rises, so a smiling eye is a crescent, not a ring
    const cutD = `M${fmt(ex - rx - 14)},${fmt(eyeY - ry * 2.2)} L${fmt(ex + rx + 14)},${fmt(eyeY - ry * 2.2)} L${fmt(ex + rx + 14)},${fmt(botY)} Q${fmt(ex)},${fmt(botY + lowBow * 1.9)} ${fmt(ex - rx - 14)},${fmt(botY)} Z`;
    return (
      <g key={k}>
        <defs>
          <clipPath id={`${id}-ec${k}`}>
            <path d={eyeD} />
          </clipPath>
          <clipPath id={`${id}-el${k}`}>
            <path d={cutD} />
          </clipPath>
          {rg(`${id}-ew${k}`, ex, eyeY - 4, ry * 1.4, 0.4, [
            [0, '#FFFFFF'],
            [0.55, '#F6F8FA'],
            [1, '#C9D5DE'],
          ])}
        </defs>
        <g clipPath={sq > 0.02 ? `url(#${id}-el${k})` : undefined}>
        <Inked w={EYE_INK}>
          <InkPath d={eyeD} fill={`url(#${id}-ew${k})`} />
        </Inked>
        {pass !== 'ink' && (
          <g clipPath={`url(#${id}-ec${k})`}>
            <circle cx={fmt(ix)} cy={fmt(iy)} r={fmt(pr)} fill={INK} />
            <circle cx={fmt(ix + pr * 0.38)} cy={fmt(iy - pr * 0.42)} r={fmt(pr * 0.34 + 0.6)} fill="#FFFFFF" />
            <circle cx={fmt(ix - pr * 0.36)} cy={fmt(iy + pr * 0.36)} r={fmt(pr * 0.15 + 0.3)} fill="#FFFFFF" opacity={0.85} />
            <rect x={fmt(ex - rx - 4)} y={fmt(topY)} width={fmt(rx * 2 + 8)} height={7} fill="#5E7486" opacity={0.18} />
            <path d={`M${fmt(ex - rx - 4)},${fmt(eyeY - ry * 1.7)} L${fmt(ex + rx + 4)},${fmt(eyeY - ry * 1.7)} L${fmt(ex + rx + 4)},${fmt(topY + 1)} Q${fmt(ex)},${fmt(topY - 6 * (1 - L))} ${fmt(ex - rx - 4)},${fmt(topY + 1)} Z`} fill={mix(skin, shade(skin, 0.2), 0.5)} />
            <path d={`M${fmt(ex - rx - 4)},${fmt(eyeY + ry * 1.7)} L${fmt(ex + rx + 4)},${fmt(eyeY + ry * 1.7)} L${fmt(ex + rx + 4)},${fmt(botY)} Q${fmt(ex)},${fmt(botY + lowBow)} ${fmt(ex - rx - 4)},${fmt(botY)} Z`} fill={lit(skin, 0.05)} />
          </g>
        )}
        </g>
        {L > 0.04 && <InkLine d={Q({x: ex - rx - 1, y: topY + 1}, {x: ex, y: topY - 6 * (1 - L)}, {x: ex + rx + 1, y: topY + 1})} w={fw} />}
        {sq > 0.08 && <InkLine d={Q({x: ex - rx * 1.02, y: botY}, {x: ex, y: botY + lowBow * 1.9}, {x: ex + rx * 1.02, y: botY})} w={fw * (0.7 + 0.25 * sm)} opacity={clamp(sq * 2)} />}
        {/* crow's feet at the outer corner with the eye-smile */}
        {sm > 0.15 && (
          <g opacity={clamp((sm - 0.15) * 1.6)}>
            {[-1, 0.2].map((kk, i) => (
              <InkLine key={i} d={`M${fmt(ex + side * (rx + 3))},${fmt(eyeY + 4 + kk * 7)} l${fmt(side * 8 * wf)},${fmt(kk * 4 - 1)}`} w={fw * 0.5} />
            ))}
          </g>
        )}
      </g>
    );
  };
  const Brow = (k: 'n' | 'f', ex: number, wf: number, inner: 1 | -1) => {
    const by = -44 + browDown * 9 - browLift * 6;
    const w = 21 * wf;
    const innerX = ex + inner * w * 0.95 - inner * browDown * 3;
    const outerX = ex - inner * w * 1.05;
    const innerY = by + browDown * 5 - browLift * 2;
    const outerY = by - browDown * 1 + browLift * 2;
    const midY = (innerY + outerY) / 2 - 5 - browLift * 3;
    return <InkLine key={`b${k}`} d={Q({x: outerX, y: outerY}, {x: ex, y: midY}, {x: innerX, y: innerY})} w={fw * 1.5} />;
  };

  // --- the mask: from under the eyes over the nose to below the chin, round the far cheek, back toward the ear
  const cheekUp = 5 * sm; // the eye-smile lifts the cheeks and the mask's top edge under the eyes
  const mTop: V[] = [
    {x: -103 - 6 * t, y: 19 - cheekUp * 0.5},
    {x: farX - 2, y: 21 - cheekUp},
    {x: xf - 10, y: 12 - cheekUp * 0.4},
    {x: nearX - 2, y: 22 - cheekUp},
    {x: 52, y: 20 - cheekUp * 0.6},
    {x: 84, y: 12},
  ];
  const mBot: V[] = [
    {x: 86, y: 64},
    {x: 56, y: 98},
    {x: 8, y: 120},
    {x: -42, y: 114},
    {x: -84, y: 84},
    {x: -108 - 8 * t, y: 50},
  ];
  const maskD = `${smooth(mTop, false, 0.9)} ${smooth(mBot, false, 0.9).replace(/^M/, 'L')} Z`;
  // pleats: three folds across, bowing down with the face's curvature
  const pleat = (y: number, k: number) => {
    const a = {x: -100 + k * 3, y: y + 2};
    const m = {x: xf - 4, y: y + 10 + k * 2};
    const b = {x: 84, y: y - 4};
    return Q(a, m, b);
  };

  const body = (
    <>
      <defs>
        {rg(`${id}-sk`, -6, -8, 126, 0.52, [
          [0, lit(skin, 0.14)],
          [0.4, lit(skin, 0.04)],
          [0.78, skin],
          [0.95, shade(skin, 0.12)],
          [1, shade(skin, 0.18)],
        ])}
        {rg(`${id}-ear`, 0, 10, 30, 0.5, [
          [0, lit(skin, 0.2)],
          [0.7, skin],
          [1, shade(skin, 0.28)],
        ])}
        {rg(`${id}-cap`, -10 + hx, -96, 150, 0.55, [
          [0, lit(C.cap, 0.3)],
          [0.42, lit(C.cap, 0.06)],
          [0.8, C.cap],
          [1, shade(C.cap, 0.32)],
        ])}
        {rg(`${id}-mk`, xf - 10, 40, 120, 0.5, [
          [0, '#FFFFFF'],
          [0.45, C.mask],
          [0.85, mix(C.mask, '#A9BCD2', 0.55)],
          [1, mix(C.mask, '#8EA4BE', 0.7)],
        ])}
        <clipPath id={`${id}-hc`}>
          <path d={headD} />
        </clipPath>
        <clipPath id={`${id}-mc`}>
          <path d={maskD} />
        </clipPath>
        <clipPath id={`${id}-cc`}>
          <path d={capD} />
        </clipPath>
      </defs>
      {/* head with the near ear in the same contour group (one silhouette) */}
      <Inked w={OUT}>
        <InkPath d={headD} fill={`url(#${id}-sk)`} />
        <InkPath d={ear(nearEarX)} fill={`url(#${id}-ear)`} />
      </Inked>
      {pass !== 'ink' && (
        <g>
          <g clipPath={`url(#${id}-hc)`}>
            {/* the cap's shadow on the forehead */}
            <ellipse cx={fmt(hx)} cy={-64} rx={110} ry={16} fill={shade(skin, 0.35)} opacity={0.22} />
          </g>
          <ellipse cx={fmt(nearEarX + 5)} cy={11} rx={6} ry={11} fill={shade(skin, 0.32)} opacity={0.45} />
          <path d={earRim(nearEarX)} fill="none" stroke={shade(skin, 0.42)} strokeWidth={3.4} strokeLinecap="round" opacity={0.75} />
        </g>
      )}
      {/* scrub cap */}
      <Inked w={OUT}>
        <InkPath d={capD} fill={`url(#${id}-cap)`} />
      </Inked>
      {pass !== 'ink' && (
        <g>
          <g clipPath={`url(#${id}-cc)`}>
            <path d={hemD} fill={shade(C.cap, 0.12)} />
            <path d={smooth(hemTop, false)} fill="none" stroke={lit(C.cap, 0.3)} strokeWidth={3} opacity={0.6} transform="translate(0 -2.5)" />
            {/* soft gathers of the cloth */}
            {[
              [-58, -126, -38, -96],
              [-10, -140, 0, -102],
              [44, -134, 36, -98],
              [96, -96, 78, -80],
            ].map(([x0, y0, x1, y1], i) => (
              <path key={i} d={`M${fmt(x0 + hx)},${fmt(y0)} Q${fmt((x0 + x1) / 2 + 8 + hx)},${fmt((y0 + y1) / 2)} ${fmt(x1 + hx)},${fmt(y1)}`} fill="none" stroke={shade(C.cap, 0.3)} strokeWidth={3.4} strokeLinecap="round" opacity={0.4} />
            ))}
            <ellipse cx={fmt(-48 + hx)} cy={-114} rx={32} ry={12} transform={`rotate(-26 ${fmt(-48 + hx)} -114)`} fill="#FFFFFF" opacity={0.24} />
          </g>
          <InkLine d={smooth(hemTop, false)} w={fw * 0.55} opacity={0.75} />
        </g>
      )}
      {Eye('f', farX, farW, -1)}
      {Eye('n', nearX, 1, 1)}
      {Brow('f', farX, farW, 1)}
      {Brow('n', nearX, 1, -1)}
      {/* mask */}
      <Inked w={OUT}>
        <InkPath d={maskD} fill={`url(#${id}-mk)`} />
      </Inked>
      {pass !== 'ink' && (
        <g>
          <g clipPath={`url(#${id}-mc)`}>
            {/* the nose under the mask: a soft ridge and its shadow */}
            <path d={`M${fmt(xf - 12)},${fmt(14 - cheekUp * 0.4)} Q${fmt(xf - 24)},38 ${fmt(xf - 12)},50`} fill="none" stroke={mix(C.mask, '#8EA4BE', 0.6)} strokeWidth={7} strokeLinecap="round" opacity={0.35} />
            <path d={`M${fmt(xf - 16)},${fmt(18 - cheekUp * 0.4)} Q${fmt(xf - 27)},36 ${fmt(xf - 18)},46`} fill="none" stroke="#FFFFFF" strokeWidth={4} strokeLinecap="round" opacity={0.42} />
            {[44, 66, 88].map((y, i) => (
              <g key={i}>
                <path d={pleat(y, i)} fill="none" stroke={mix(C.mask, '#7F96B2', 0.55)} strokeWidth={3.2} strokeLinecap="round" opacity={0.55} />
                <path d={pleat(y - 4, i)} fill="none" stroke="#FFFFFF" strokeWidth={2.6} strokeLinecap="round" opacity={0.6} />
              </g>
            ))}
            {/* the shaded underside along the chin */}
            <path d={smooth(mBot, false)} fill="none" stroke={mix(C.mask, '#7F96B2', 0.5)} strokeWidth={14} opacity={0.35} />
            {/* the bendable nose wire along the top edge */}
            <path d={`M${fmt(xf - 40)},${fmt(24 - cheekUp * 0.8)} Q${fmt(xf - 10)},${fmt(14 - cheekUp * 0.5)} ${fmt(xf + 22)},${fmt(26 - cheekUp * 0.9)}`} fill="none" stroke={mix(C.mask, '#8EA4BE', 0.7)} strokeWidth={3} strokeLinecap="round" opacity={0.6} />
          </g>
          {/* ties: one above the ear, one below it, back under the cap toward the nape */}
          {[
            [{x: 82, y: 12}, {x: 84, y: -12}, {x: 89, y: -35}],
            [{x: 84, y: 60}, {x: 98, y: 60}, {x: 108, y: 50}],
          ].map(([a, m, b], i) => (
            <g key={i}>
              <path d={Q(a, m, b)} fill="none" stroke={INK} strokeWidth={3.6} strokeLinecap="round" opacity={0.8} />
              <path d={Q(a, m, b)} fill="none" stroke={mix(C.mask, '#9FB2C8', 0.35)} strokeWidth={1.8} strokeLinecap="round" />
            </g>
          ))}
          {/* the cheek under the eye lifts with the smile: a soft shade above the mask's edge */}
          {sm > 0.05 && [nearX, farX].map((x, i) => <ellipse key={i} cx={fmt(x + (i ? -2 : 4))} cy={fmt(16 - cheekUp)} rx={fmt(i ? 13 : 18)} ry={5} fill="#E9805E" opacity={0.28 * sm} />)}
        </g>
      )}
      {/* glosses: forehead strip below the cap, the cheekbone above the mask */}
      {pass !== 'ink' && (
        <g>
          <ellipse cx={fmt(xf - 30)} cy={-60} rx={14} ry={4} transform={`rotate(-10 ${fmt(xf - 30)} -60)`} fill="#FFFFFF" opacity={0.18} />
        </g>
      )}
    </>
  );
  return <g transform={`translate(${fmt(c.x)} ${fmt(c.y)}) rotate(${fmt(roll)}) scale(${fmt(s)})`}>{body}</g>;
};


// ------------------------------------------------------------------------------------------------ body geometry
/** The bust in his local (unsquashed) frame: local = world x, and y scaled by k about the anchor (toLocal). Designed
 *  for the clinical camera (x 92, y -100, w 405, k 0.86): the head leans in at the top right over the wrist, the far
 *  shoulder tucked behind the chin, the near shoulder at the frame's right edge; the gown runs down the right side.
 *  At the cutaway camera (x -10, w 250) all of the body is beyond the right edge (only the gloves and sleeves enter). */
const bodyGeo = (lean: number) => {
  const pivot = {x: 330, y: 140};
  const R = (x: number, y: number, k = 1) => rot({x, y}, -lean * 0.9 * k, pivot);
  return {
    head: R(246, -352, 1.15),
    roll: -12 - lean * 1.2,
    collar: R(272, -262),
    neckBot: R(286, -258),
    neckTop: R(268, -318),
    farS: R(246, -246),
    nearS: R(334, -234),
    torso: [
      R(236, -264),
      R(241, -236),
      R(248, -184),
      R(253, -120),
      R(258, -50),
      R(264, 30),
      R(270, 120),
      R(275, 230),
      R(280, 380),
      R(520, 380),
      R(500, 220),
      R(482, 80),
      R(466, -60),
      R(448, -160),
      R(420, -232),
      R(380, -268),
      R(332, -284),
      R(290, -282),
    ],
  };
};

// ------------------------------------------------------------------------------------------------ arms
/** two-bone arm: the elbow on the clockwise (side -1) or anticlockwise side of the shoulder -> wrist line; an arm
 *  that cannot reach straightens (the forearm is foreshortened toward the lens, so its drawn length is free) */
const ik = (S: V, Wr: V, Lu: number, Lf: number, side: 1 | -1): V => {
  const dv = sub(Wr, S);
  const c = Math.max(1e-3, len(dv));
  let a = Lu, b = Lf;
  if (c > a + b - 1) {
    const kk = (c + 1) / (a + b);
    a *= kk;
    b *= kk;
  }
  const cc = Math.max(c, Math.abs(a - b) + 1);
  const A = Math.acos(clamp((a * a + cc * cc - b * b) / (2 * a * cc), -1, 1));
  const base = Math.atan2(dv.y, dv.x);
  const ang = base + side * A;
  return add(S, {x: Math.cos(ang) * a, y: Math.sin(ang) * a});
};
const ARM = {
  far: {Lu: 84, Lf: 108, side: -1 as const},
  near: {Lu: 262, Lf: 130, side: -1 as const},
};
/** sleeve radii: shoulder, elbow, wrist (the glove's cuff covers the wrist end) */
const SLV = {s: 40, e: 33, w: 28};
const CUFF = {len: 54, r0: 0.168 * SURGEON.hand, r1: 31};

type ArmSolve = {grip: GripSolve; S: V; E: V; Wl: V; wrist: V; cuffDir: V; held: number};
const solveArm = (st: SurgeonState, which: 'far' | 'near'): ArmSolve => {
  const k = st.k;
  const g = bodyGeo(st.lean);
  const grip = which === 'far' ? solveFar(st) : solveNear(st);
  const held = clamp(which === 'far' ? st.appHeld : st.clampHeld);
  const S = which === 'far' ? g.farS : g.nearS;
  const P = ARM[which];
  let Wl = toLocal(grip.wrist, k);
  let E = ik(S, Wl, P.Lu, P.Lf, P.side);
  let cuffDir = norm(sub(fromLocal(E, k), grip.wrist));
  let wrist = grip.wrist;
  if (held < 0.999) {
    // a released hand draws back along the forearm, toward the body
    wrist = add(grip.wrist, mul(cuffDir, 80 * ease(1 - held)));
    Wl = toLocal(wrist, k);
    E = ik(S, Wl, P.Lu, P.Lf, P.side);
    cuffDir = norm(sub(fromLocal(E, k), wrist));
  }
  return {grip, S, E, Wl, wrist, cuffDir, held};
};

const SleeveArm: React.FC<{id: string; a: ArmSolve; far: boolean; k: number}> = ({id, a, far, k}) => {
  const col = far ? shade(C.gown, 0.14) : C.gown;
  const u1 = norm(sub(a.E, a.S));
  const u2 = norm(sub(a.Wl, a.E));
  const n1 = perp(u1);
  const n2 = perp(u2);
  const lf = len(sub(a.Wl, a.E));
  const lu = len(sub(a.E, a.S));
  // the inside of the elbow is on the side the forearm turns toward
  const inSide = dot(n1, u2) > 0 ? 1 : -1;
  const fold = (p: V, nn: V, ax: V, w: number, o: number) => `M${Pf(add(p, mul(nn, w)))} Q${Pf(add(add(p, mul(ax, o)), mul(nn, w * 0.1)))} ${Pf(add(p, mul(nn, -w * 0.55)))}`;
  const deep = shade(col, 0.32);
  return (
    <g transform={bodyT(k)}>
      <Inked w={OUT} id={`${id}-ik`} fade={far ? undefined : [{c: a.S, r: 44}]}>
        <Limb id={`${id}-lb`} A={a.S} B={a.E} C={a.Wl} rA={SLV.s} rB={SLV.e} rC={SLV.w} color={col} spec={0.12} crease={0} capA="round" capC="flat" />
      </Inked>
      <Deco>
        {/* the sleeve's folds: bunched cloth inside the elbow, a long pull along the forearm and the upper arm */}
        <path d={`M${Pf(add(a.E, add(mul(n1, inSide * SLV.e * 0.7), mul(u1, -SLV.e * 0.9))))} Q${Pf(add(a.E, mul(n1, inSide * SLV.e * 0.2)))} ${Pf(add(a.E, add(mul(n2, inSide * SLV.e * 0.75), mul(u2, SLV.e * 0.8))))}`} fill="none" stroke={deep} strokeWidth={3.2} strokeLinecap="round" opacity={0.45} />
        {lf > 70 && <path d={fold(lerpV(a.E, a.Wl, 0.42), n2, u2, SLV.w * 0.85, -7)} fill="none" stroke={deep} strokeWidth={3} strokeLinecap="round" opacity={0.36} />}
        {lu > 120 && <path d={fold(lerpV(a.S, a.E, 0.55), n1, u1, SLV.e * 0.85, -9)} fill="none" stroke={deep} strokeWidth={3} strokeLinecap="round" opacity={0.32} />}
      </Deco>
    </g>
  );
};

const GloveOf: React.FC<{id: string; a: ArmSolve; far: boolean; obj: React.ReactNode; thumbOverlay?: React.ReactNode; over?: React.ReactNode}> = ({id, a, far, obj, thumbOverlay, over}) => {
  const holding = a.held > 0.999;
  return (
    <g>
      {!holding && obj}
      <GloveHand
        id={id}
        wrist={a.wrist}
        ang={a.grip.ang}
        L={SURGEON.hand}
        ts={a.grip.ts}
        pose={a.grip.pose}
        color={far ? shade(C.glove, 0.06) : C.glove}
        cuff={{dir: a.cuffDir, len: CUFF.len, r0: CUFF.r0, r1: CUFF.r1}}
        obj={holding ? obj : undefined}
        thumbOverlay={holding ? thumbOverlay : undefined}
        over={holding ? over : undefined}
      />
    </g>
  );
};

// ------------------------------------------------------------------------------------------------ the two passes
/** Head, gowned torso and the far (right) arm's sleeve: draw BEFORE the patient's arm. */
export const SurgeonBack: React.FC<{id: string; s: SurgeonState}> = ({id, s: st}) => {
  const k = st.k;
  const g = bodyGeo(st.lean);
  const far = solveArm(st, 'far');
  const torsoD = smooth(g.torso, true, 0.9);
  const c = g.collar;
  const gown = C.gown;
  return (
    <g className={NSCLASS}>
      <NsStyle />
      {/* the far arm hangs behind the chest: the gown covers its shoulder and the inside of its elbow */}
      <SleeveArm id={`${id}-fa`} a={far} far k={k} />
      <g transform={bodyT(k)}>
        {/* the neck behind the collar and the chin */}
        <Inked w={OUT}>
          <Capsule id={`${id}-nk`} a={g.neckBot} b={g.neckTop} ra={36} rb={34} color={shade(SURGEON.skin, 0.16)} />
        </Inked>
        {/* the gown: one opaque body, cel-shaded from the upper left, its back turning into shadow */}
        <Inked w={OUT}>
          <Blob id={`${id}-tor`} d={torsoD} c={add(c, {x: -40, y: 110})} r={380} color={gown} k={1} stops={[[0, lit(gown, 0.24)], [0.4, lit(gown, 0.06)], [0.72, gown], [1, C.gownDeep]]} />
        </Inked>
        <Deco>
          <defs>
            <clipPath id={`${id}-tclip`}>
              <path d={torsoD} />
            </clipPath>
          </defs>
          <g clipPath={`url(#${id}-tclip)`}>
            <Lin id={`${id}-tf`} d={torsoD} from={add(c, {x: -40, y: 60})} to={add(c, {x: 190, y: 120})} stops={[[0, gown, 0], [0.45, gown, 0], [1, C.gownDeep, 0.6]]} />
            {/* the near arm's raglan seam, the chest's soft folds and the lit front edge */}
            <path d={`M${Pf(add(c, {x: 22, y: -14}))} Q${Pf(add(c, {x: 54, y: 30}))} ${Pf(add(c, {x: 60, y: 104}))}`} fill="none" stroke={C.gownDeep} strokeWidth={3.4} strokeLinecap="round" opacity={0.5} />
            {[
              [-10, 70, -2, 250, 0.32],
              [26, 120, 40, 330, 0.26],
            ].map(([x0, y0, x1, y1, o], i) => {
              const a = add(c, {x: x0, y: y0});
              const b = add(c, {x: x1, y: y1});
              return <path key={i} d={`M${Pf(a)} Q${Pf(add(lerpV(a, b, 0.5), {x: 12, y: 0}))} ${Pf(b)}`} fill="none" stroke={C.gownDeep} strokeWidth={4} strokeLinecap="round" opacity={o} />;
            })}
            <path d={smooth([add(c, {x: -26, y: 22}), add(c, {x: -20, y: 120}), add(c, {x: -10, y: 240})], false)} fill="none" stroke={lit(gown, 0.4)} strokeWidth={9} strokeLinecap="round" opacity={0.35} />
          </g>
        </Deco>
        {/* the gown's round collar band */}
        <Inked w={OUT}>
          <InkPath d={smooth([add(c, {x: -40, y: -6}), add(c, {x: -12, y: 12}), add(c, {x: 30, y: 12}), add(c, {x: 58, y: -10}), add(c, {x: 36, y: 0}), add(c, {x: -8, y: 0}), add(c, {x: -30, y: -16})], true, 0.8)} fill={lit(gown, 0.16)} />
        </Inked>
        <SurgeonHead id={`${id}-hd`} c={g.head} R={SURGEON.headR} roll={g.roll} turn={0.92} face={st.face} skin={SURGEON.skin} />
      </g>
    </g>
  );
};

/** His near (left) arm, both gloved hands and both instruments: draw AFTER (over) the patient's arm. */
export const SurgeonFront: React.FC<{id: string; s: SurgeonState}> = ({id, s: st}) => {
  const k = st.k;
  const far = solveArm(st, 'far');
  const near = solveArm(st, 'near');
  const fingerTipR = fingerR(2)[3] * SURGEON.hand * 1.25;
  const thumbTipR = THUMB_R[3] * SURGEON.hand * 1.25;
  const ng = near.grip;
  return (
    <g className={NSCLASS}>
      <NsStyle />
      <SleeveArm id={`${id}-na`} a={near} far={false} k={k} />
      <GloveOf
        id={`${id}-nh`}
        a={near}
        far={false}
        obj={<Clamp id={`${id}-cl`} s={st.clamp} />}
        thumbOverlay={ng.ringU && <ClampRingOver id={`${id}-ru`} c={ng.ringU} toward={ng.toward!} near={{c: ng.tipT, r: thumbTipR}} />}
        over={ng.ringL && <ClampRingOver id={`${id}-rl`} c={ng.ringL} toward={ng.toward!} near={{c: ng.ringL, r: fingerTipR}} />}
      />
      <GloveOf id={`${id}-fh`} a={far} far obj={<Applicator id={`${id}-ap`} s={st.app} />} />
    </g>
  );
};

/** default instrument states and face the staging was designed around (the clinical shot) */
export const SURGEON_DEFAULT: SurgeonState = {
  app: {tip: {x: 5.5, y: -17.9}, ang: -0.39, press: 0.68, gel: 0},
  clamp: {a: {x: 7.5, y: -5.5}, b: {x: 6.5, y: 5.5}, open: 0, lift: 0},
  appHeld: 1,
  clampHeld: 1,
  face: {focus: 0.55, smile: 0, gx: -0.5, gy: 0.55, blink: 0},
  k: 0.86,
  lean: 0,
};
