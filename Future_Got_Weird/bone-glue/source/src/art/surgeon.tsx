// The surgeon: a seated Weird Crew surgeon at the RIGHT side of the hand table, facing screen-left in 3/4, in a scrub
// cap, a surgical mask, a gown with long sleeves and light-blue gloves. Right-handed: his far RIGHT hand holds the
// applicator (barrel up-right of the cannula tip), his near LEFT hand holds the pointed reduction clamp's handles
// (down-right of the wrist).
//
// Construction (dc lineage: Death Clock -> Real Web Fluid -> Glass Climbing): a custom bust (head + neck + gowned
// torso), dc Limb sleeves, gloved fists adapted from dc Hand (the glove's cuff joins the palm in one contour group, the
// curled fingers tuck under like a fist seen from the back, and the instrument passes under the fist so it shows on
// both sides of the grip), a head adapted from dc Head (the crew's eyes and brows; the cap replaces the hair, the mask
// covers the nose, mouth and chin).
//
// Space: the wrist plane in millimetres (anatomy.ts). The scene draws that plane with scale(s, s*k) (camera k: the
// table squash of the high three-quarter view). The upright body is drawn with an inverse vertical scale 1/k about
// his table-level anchor, so his proportions never squash; his hands and the instruments stay in the table plane.
//
// Silhouette contours and the hands' lines are constant on-screen width (non-scaling strokes), so the art reads the
// same from the wrist close-up to the wide clinical shot; the face's features scale with the face. No text or glyphs.
// Deterministic.
import React from 'react';
import {C, INK} from './palette';
import {Deco, Inked, InkLine, InkPath, useInk} from '../dc/ink';
import {Blob, Capsule, LIGHT, Lin} from '../dc/shade';
import {Limb} from '../dc/limb';
import {HandPose, mixHand} from '../dc/Hand';
import {lit, mix, shade} from '../dc/color';
import {add, clamp, dot, fmt, len, lerpV, mul, norm, P as Pf, perp, rad, rot, sub, V} from '../dc/math';
import {AppState, Applicator, ClampState, Clamp, appGrip, clampGrip} from './instruments';

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
   *  rise); gx, gy: gaze offset -1..1 (+ = screen right / down; looking at the wrist is about gx -0.45, gy 0.75);
   *  blink 0..1 */
  face: SurgeonFace;
  /** the camera's table squash (the scene draws the wrist plane with scale(s, s*k)) */
  k: number;
  /** small body lean in degrees: + leans his upper body toward the table (screen-left), - sits back (about -8..8) */
  lean: number;
};

// ------------------------------------------------------------------------------------------------ colours, sizes
export const SURGEON = {
  skin: '#C98B5E',
  /** gloved hand: wrist to the straight middle fingertip (mm) */
  hand: 165,
  /** head radius (the head is ~200 mm wide) */
  headR: 100,
  /** his table-level anchor (wrist-plane mm): the inverse 1/k body scale is about this point */
  anchor: {x: 228, y: 6} as V,
};
/** contour widths in screen pixels (the ink underlays are non-scaling strokes inside the surgeon's groups) */
const OUT = 6.4; // body / head silhouette
const IN = 5.4; // inner occlusion contours
const HAND_INK = 5.4;
const HAND_LINE = 3.0; // finger separations, cuff rim (px)

const NSCLASS = 'bgsurg-ns';
const NSLINE = 'bgsurg-nsl';
/** the ink underlays (filled navy + navy stroke) of the dc primitives become constant-width on screen; inside the
 *  hands, the drawn ink lines too */
const NsStyle: React.FC = () => (
  <style>{`.${NSCLASS} path[fill="${INK}"],.${NSCLASS} ellipse[fill="${INK}"],.${NSCLASS} circle[fill="${INK}"],.${NSLINE} path[fill="none"]{vector-effect:non-scaling-stroke}`}</style>
);

// ------------------------------------------------------------------------------------------------ helpers
const A0 = SURGEON.anchor;
const toLocal = (p: V, k: number): V => ({x: p.x, y: A0.y + (p.y - A0.y) * k});
const fromLocal = (p: V, k: number): V => ({x: p.x, y: A0.y + (p.y - A0.y) / k});
const bodyT = (k: number) => `translate(${fmt(A0.x)} ${fmt(A0.y)}) scale(1 ${(1 / k).toFixed(5)}) translate(${fmt(-A0.x)} ${fmt(-A0.y)})`;
const dirA = (a: number): V => ({x: Math.cos(a), y: Math.sin(a)});
const degOf = (d: V) => (Math.atan2(d.y, d.x) * 180) / Math.PI;
/** a world direction (deg) seen in the unsquashed local frame (deg) */
const angLocal = (a: number, k: number) => (Math.atan2(Math.sin(rad(a)) * k, Math.cos(rad(a))) * 180) / Math.PI;
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

// ------------------------------------------------------------------------------------------------ gloved hand
// Adapted from dc/Hand (same palm, knuckle layout and thumb). Changes: a curled finger tucks its middle and distal
// segments under (a fist seen from the back shows the proximal phalanges ending in rounded knuckles); the glove's cuff
// is part of the palm's contour group (no line at the wrist); a latex finish (soft sheen, small glosses); the held
// object passes under the fist (palm and front digits drawn over it).
const FINGERS = [
  {v: 0.185, u: 0.44, len: 0.4, r: 0.074, fan: 9},
  {v: 0.062, u: 0.465, len: 0.45, r: 0.077, fan: 2},
  {v: -0.062, u: 0.45, len: 0.42, r: 0.073, fan: -6},
  {v: -0.175, u: 0.41, len: 0.33, r: 0.064, fan: -14},
];
const SEG = [0.45, 0.31, 0.24];
/** finger radius relative to dc (a glove's fingers are a little slimmer than the crew's cartoon fingers) */
const FR = 0.9;
/** Seen from the back, a flexing finger's segments turn down away from the viewer: each shows the cosine of its
 *  cumulative flexion (MCP 85, PIP 105, DIP 75 degrees at full curl); a segment turned past vertical is tucked under,
 *  so a curled finger ends at its rounded knuckle. */
const segFore = (c: number): number[] => {
  const phi = [85 * c, 190 * c, 265 * c];
  const out: number[] = [];
  let tucked = false;
  for (const a of phi) {
    const v = Math.cos(rad(Math.min(a, 180)));
    if (tucked || v < 0.06) {
      tucked = true;
      out.push(0);
    } else out.push(v);
  }
  return out;
};

type Hold = {front: (number | 't')[]; obj: React.ReactNode; palmFront?: boolean};
type GloveProps = {
  id: string;
  wrist: V;
  /** hand axis (deg, atan2 convention) */
  ang: number;
  L: number;
  /** +1: thumb on the clockwise side of the hand axis (his left hand from the back), -1 anticlockwise (right hand) */
  ts: 1 | -1;
  pose: HandPose;
  color: string;
  /** the cuff: from just inside the palm back along the forearm to `back`, radius at the wrist and at the rim */
  cuff?: {back: V; r0: number; r1: number};
  hold?: Hold;
};

const GloveHand: React.FC<GloveProps> = ({id, wrist, ang, L, ts, pose, color, cuff, hold}) => {
  const iw = HAND_INK;
  const dir = {x: Math.cos(rad(ang)), y: Math.sin(rad(ang))};
  const n = perp(dir);
  const W = (u: number, vv: number): V => add(wrist, add(mul(dir, u * L), mul(n, vv * L * ts)));
  const palmPts: [number, number][] = [
    [-0.03, -0.17],
    [0.2, -0.235],
    [0.4, -0.225],
    [0.475, -0.12],
    [0.49, 0.0],
    [0.475, 0.13],
    [0.43, 0.245],
    [0.27, 0.28],
    [0.12, 0.27],
    [-0.03, 0.17],
  ];
  const palmD = smooth(palmPts.map(([u, vv]) => W(u, vv)));
  const palmC = W(0.24, 0.02);

  const fingerEls: React.ReactNode[] = [];
  const fingerIdx: number[] = [];
  const sepLines: React.ReactNode[] = [];
  [3, 2, 1, 0].forEach((fi) => {
    const F = FINGERS[fi];
    const c = pose.curl[fi];
    const fan = F.fan * pose.spread * ts;
    let fd = rot(dir, fan);
    let p = W(F.u, F.v);
    const segs: {a: V; b: V; ra: number; rb: number}[] = [];
    let r = F.r * L * FR;
    const fore = segFore(c);
    SEG.forEach((sg, si) => {
      const l = F.len * sg * L * fore[si];
      fd = rot(fd, -fan * 0.12 * si);
      const b = add(p, mul(fd, Math.max(0.001, l)));
      const rb = r * [0.97, 0.95, 0.92][si];
      segs.push({a: p, b, ra: r, rb});
      p = b;
      r = rb;
    });
    const vis = segs.filter((_, si) => si === 0 || fore[si] > 0);
    fingerIdx.push(fi);
    fingerEls.push(
      <g key={fi}>
        {vis.map((sg, si) => (
          <Capsule key={si} id={`${id}-f${fi}s${si}`} a={sg.a} b={sg.b} ra={sg.ra} rb={sg.rb} color={si === 0 ? color : mix(color, shade(color, 0.1), 0.5)} spec={si === 0 ? 0.2 : 0.12} k={1.45} />
        ))}
      </g>,
    );
    if (fi < 3) {
      const side = mul(n, -ts);
      const last = vis[vis.length - 1];
      const pts = [add(vis[0].a, add(mul(side, vis[0].ra * 0.92), mul(dir, vis[0].ra * 0.25))), ...vis.map((sg) => add(sg.b, mul(side, sg.rb * 0.9)))];
      const ld = norm(sub(last.b, last.a));
      pts[pts.length - 1] = add(pts[pts.length - 1], mul(ld, -last.rb * 0.45));
      sepLines.push(<path key={fi} d={`M${pts.map((q) => Pf(q)).join(' L')}`} fill="none" stroke={INK} strokeWidth={HAND_LINE} strokeLinecap="round" strokeLinejoin="round" />);
    }
    // the bend: a soft crease across a curled finger just before its knuckle turns down
    if (fore[1] === 0) {
      const q0 = vis[0];
      const ax = norm(sub(q0.b, q0.a));
      const q = add(q0.b, mul(ax, -q0.rb * 0.15));
      const nn = perp(ax);
      sepLines.push(<path key={`c${fi}`} d={`M${Pf(add(q, mul(nn, q0.rb * 0.7)))} Q${Pf(add(q, mul(ax, q0.rb * 0.42)))} ${Pf(add(q, mul(nn, -q0.rb * 0.7)))}`} fill="none" stroke={shade(color, 0.45)} strokeWidth={HAND_LINE * 0.7} strokeLinecap="round" opacity={0.6} />);
    }
    // latex finish: a gloss on the knuckle that ends the finger (or near a straight fingertip) and on the base knuckle
    const lastV = vis[vis.length - 1];
    const knuckle = vis.length < 3 ? lastV.b : add(lastV.a, mul(sub(lastV.b, lastV.a), 0.62));
    const kr = lastV.rb;
    const ta = degOf(sub(vis[0].b, vis[0].a));
    const k0 = segs[0].a;
    sepLines.push(
      <g key={`g${fi}`}>
        <ellipse cx={fmt(knuckle.x + LIGHT.x * kr * 0.35)} cy={fmt(knuckle.y + LIGHT.y * kr * 0.35)} rx={fmt(kr * 0.36)} ry={fmt(kr * 0.17)} transform={`rotate(${fmt(ta + 90)} ${fmt(knuckle.x + LIGHT.x * kr * 0.35)} ${fmt(knuckle.y + LIGHT.y * kr * 0.35)})`} fill="#FFFFFF" opacity={0.62} />
        <ellipse cx={fmt(k0.x + LIGHT.x * segs[0].ra * 0.3)} cy={fmt(k0.y + LIGHT.y * segs[0].ra * 0.3)} rx={fmt(segs[0].ra * 0.36)} ry={fmt(segs[0].ra * 0.18)} transform={`rotate(${fmt(ta)} ${fmt(k0.x + LIGHT.x * segs[0].ra * 0.3)} ${fmt(k0.y + LIGHT.y * segs[0].ra * 0.3)})`} fill="#FFFFFF" opacity={0.3} />
      </g>,
    );
  });

  // thumb: thenar pad + two segments
  const tBase = W(0.1, 0.19);
  const tDir = rot(dir, pose.thumb * ts);
  const t1 = add(tBase, mul(tDir, 0.2 * L));
  const tDir2 = rot(tDir, -pose.thumbCurl * 38 * ts);
  const t2 = add(t1, mul(tDir2, 0.15 * L * (1 - pose.thumbCurl * 0.35)));
  const tDir3 = rot(tDir2, -pose.thumbCurl * 30 * ts);
  const t3 = add(t2, mul(tDir3, 0.12 * L * (1 - pose.thumbCurl * 0.45)));
  const thumbEl = (
    <g>
      <Inked w={iw}>
        <Capsule id={`${id}-t0`} a={tBase} b={t1} ra={0.1 * L} rb={0.078 * L * FR} color={color} spec={0.14} k={1.35} />
        <Capsule id={`${id}-t1`} a={t1} b={t2} ra={0.076 * L * FR} rb={0.07 * L * FR} color={color} spec={0.16} k={1.35} />
        <Capsule id={`${id}-t2`} a={t2} b={t3} ra={0.07 * L * FR} rb={0.064 * L * FR} color={lit(color, 0.04)} spec={0.16} k={1.35} />
      </Inked>
      <ellipse cx={fmt((t2.x + t3.x * 2) / 3 + LIGHT.x * 0.025 * L)} cy={fmt((t2.y + t3.y * 2) / 3 + LIGHT.y * 0.025 * L)} rx={fmt(0.03 * L)} ry={fmt(0.014 * L)} transform={`rotate(${fmt(degOf(sub(t3, t2)))} ${fmt((t2.x + t3.x * 2) / 3 + LIGHT.x * 0.025 * L)} ${fmt((t2.y + t3.y * 2) / 3 + LIGHT.y * 0.025 * L)})`} fill="#FFFFFF" opacity={0.6} />
    </g>
  );

  // the cuff: a tube over the sleeve whose open end flares into a rolled rim
  const cuffEls = cuff
    ? (() => {
        const a = W(0.08, 0);
        const b = cuff.back;
        const ax = norm(sub(b, a));
        const nn = perp(ax);
        const aDeg = degOf(ax);
        const d = `M${Pf(add(a, mul(nn, cuff.r0)))} L${Pf(add(b, mul(nn, cuff.r1)))} A${fmt(cuff.r1 * 0.3)} ${fmt(cuff.r1)} ${fmt(aDeg)} 0 1 ${Pf(add(b, mul(nn, -cuff.r1)))} L${Pf(add(a, mul(nn, -cuff.r0)))} Z`;
        let ln = nn;
        if (dot(ln, LIGHT) < 0) ln = mul(ln, -1);
        const mid = lerpV(a, b, 0.5);
        const rimIn = add(b, mul(ax, -cuff.r1 * 0.22));
        const hl = add(mid, mul(ln, cuff.r0 * 0.55));
        return {
          body: <Lin key="cf" id={`${id}-cf`} d={d} from={add(mid, mul(ln, cuff.r0))} to={add(mid, mul(ln, -cuff.r0))} stops={[[0, lit(color, 0.26)], [0.3, lit(color, 0.08)], [0.62, color], [0.9, shade(color, 0.28)], [1, shade(color, 0.18)]]} />,
          deco: (
            <g key="rim">
              {/* the rolled rim: a lighter band just inside the cuff's open end, and the fold line behind it */}
              <path d={`M${Pf(add(rimIn, mul(nn, cuff.r1 * 0.96)))} A${fmt(cuff.r1 * 0.3)} ${fmt(cuff.r1 * 0.96)} ${fmt(aDeg)} 0 1 ${Pf(add(rimIn, mul(nn, -cuff.r1 * 0.96)))}`} fill="none" stroke={lit(color, 0.4)} strokeWidth={fmt(cuff.r1 * 0.22)} opacity={0.85} />
              <path d={`M${Pf(add(add(rimIn, mul(ax, -cuff.r1 * 0.14)), mul(nn, cuff.r1 * 0.92)))} A${fmt(cuff.r1 * 0.3)} ${fmt(cuff.r1 * 0.92)} ${fmt(aDeg)} 0 1 ${Pf(add(add(rimIn, mul(ax, -cuff.r1 * 0.14)), mul(nn, -cuff.r1 * 0.92)))}`} fill="none" stroke={INK} strokeWidth={HAND_LINE * 0.8} opacity={0.55} />
              <ellipse cx={fmt(hl.x)} cy={fmt(hl.y)} rx={fmt(len(sub(b, a)) * 0.3)} ry={fmt(cuff.r0 * 0.09)} transform={`rotate(${fmt(aDeg)} ${fmt(hl.x)} ${fmt(hl.y)})`} fill="#FFFFFF" opacity={0.35} />
            </g>
          ),
        };
      })()
    : null;

  const palm = <Blob id={`${id}-palm`} d={palmD} c={palmC} r={0.44 * L} color={color} k={1.0} />;
  // the back of the glove: soft tendon ridges, a broad sheen
  const palmDeco = (
    <g>
      {[0.15, 0.05, -0.06, -0.16].map((vv, i) => (
        <path key={i} d={`M${Pf(W(0.14, vv * 0.55))} Q${Pf(W(0.3, vv * 0.85 + 0.01))} ${Pf(W(0.42, vv))}`} fill="none" stroke={lit(color, 0.45)} strokeWidth={fmt(L * 0.011)} strokeLinecap="round" opacity={0.28} />
      ))}
      <ellipse cx={fmt(W(0.24, 0.1).x)} cy={fmt(W(0.24, 0.1).y)} rx={fmt(0.11 * L)} ry={fmt(0.045 * L)} transform={`rotate(${fmt(ang + 12 * ts)} ${fmt(W(0.24, 0.1).x)} ${fmt(W(0.24, 0.1).y)})`} fill="#FFFFFF" opacity={0.2} />
    </g>
  );
  if (hold) {
    const isFront = (fi: number) => hold.front.includes(fi);
    const rear = fingerEls.filter((_, i) => !isFront(fingerIdx[i]));
    const front = fingerEls.filter((_, i) => isFront(fingerIdx[i]));
    const thumbFront = hold.front.includes('t');
    return (
      <g className={NSLINE}>
        {!thumbFront && thumbEl}
        {(rear.length > 0 || !hold.palmFront) && (
          <Inked w={iw}>
            {!hold.palmFront && cuffEls?.body}
            {!hold.palmFront && palm}
            {rear}
          </Inked>
        )}
        {!hold.palmFront && cuffEls?.deco}
        {!hold.palmFront && palmDeco}
        {hold.obj}
        {(front.length > 0 || hold.palmFront) && (
          <Inked w={iw}>
            {hold.palmFront && cuffEls?.body}
            {hold.palmFront && palm}
            {front}
          </Inked>
        )}
        {hold.palmFront && cuffEls?.deco}
        {hold.palmFront && palmDeco}
        {sepLines}
        {thumbFront && thumbEl}
      </g>
    );
  }
  return (
    <g className={NSLINE}>
      <Inked w={iw}>
        {cuffEls?.body}
        {palm}
        {fingerEls}
      </Inked>
      {cuffEls?.deco}
      {palmDeco}
      {sepLines}
      {thumbEl}
    </g>
  );
};

/** where the held object sits in each grip (hand units: u along the hand axis from the wrist, v toward the thumb):
 *  the applicator's flange between the index and middle fingers, the clamp's handles across the fist */
const GRIP_UV = {app: {u: 0.535, v: 0.128}, clamp: {u: 0.57, v: 0.02}};
/** the wrist that puts a grip point on `grip` with the hand axis at `ang` (deg) */
const wristFor = (grip: V, ang: number, L: number, ts: 1 | -1, uv: {u: number; v: number}) => {
  const d = dirA(rad(ang));
  return sub(sub(grip, mul(d, uv.u * L)), mul(perp(d), uv.v * L * ts));
};

// grip poses (index and middle hooked over the flange; a fist across the handles), the opening grip, a relaxed rest
const P_APP: HandPose = {curl: [0.42, 0.5, 0.78, 0.86], spread: 0.5, thumb: -4, thumbCurl: 0.4};
const P_CLAMP: HandPose = {curl: [0.82, 0.88, 0.9, 0.93], spread: 0.03, thumb: 16, thumbCurl: 0.66};
const P_OPEN: HandPose = {curl: [0.34, 0.38, 0.42, 0.46], spread: 0.3, thumb: 36, thumbCurl: 0.25};
const P_REST: HandPose = {curl: [0.44, 0.5, 0.56, 0.62], spread: 0.18, thumb: 24, thumbCurl: 0.45};

// ------------------------------------------------------------------------------------------------ head
const SurgeonHead: React.FC<{id: string; c: V; R: number; roll: number; turn: number; face: SurgeonFace; skin: string}> = ({id, c, R, roll, turn: t, face, skin}) => {
  const pass = useInk().pass;
  const s = R / 100;
  const Lc = rot(LIGHT, -roll);
  const xf = -30 * t;
  const fw = 5.4; // feature line width (head units)
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
        <Inked w={IN * 0.8}>
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
    {x: -101, y: 18 - cheekUp * 0.5},
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
    {x: -104, y: 46},
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
              <path d={Q(a, m, b)} fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" opacity={0.8} />
              <path d={Q(a, m, b)} fill="none" stroke={mix(C.mask, '#9FB2C8', 0.35)} strokeWidth={2.4} strokeLinecap="round" />
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
/** the body's key points in his local (unsquashed) frame for a lean: head, neck, shoulders, the gown's outline.
 *  Local = world x, and y scaled by k about the anchor (see toLocal). Designed for camera B (x 110, y -80, w 470,
 *  k 0.86): the head in the upper right, the gowned chest down the right edge, the shoulders just under the mask. */
const bodyGeo = (lean: number) => {
  const pivot = {x: 300, y: 330};
  const R = (p: V, k = 0.9) => rot(p, -lean * k, pivot);
  const o = (x: number, y: number) => R({x, y});
  const head = rot(o(222, -303), -lean * 0.5, o(255, -200)); // the head cranes a little further forward
  return {
    head,
    roll: -14 - lean * 1.4,
    neckTop: o(236, -222),
    neckBot: o(258, -168),
    collar: o(256, -176),
    rS: o(190, -150), // far (right) shoulder
    lS: o(340, -158), // near (left) shoulder
    torso: [
      o(214, -194),
      o(182, -180),
      o(156, -152),
      o(142, -104),
      o(138, -30),
      o(146, 70),
      o(166, 190),
      o(200, 330),
      o(240, 520),
      o(540, 520),
      o(480, 300),
      o(440, 100),
      o(418, -80),
      o(396, -160),
      o(354, -200),
      o(302, -214),
      o(268, -210),
    ],
    /** where each hand rests when it has let go (local), and the hand angle there (deg, world) */
    restApp: {p: o(188, -52), ang: 196},
    restClamp: {p: o(196, 56), ang: 184},
  };
};

// ------------------------------------------------------------------------------------------------ arms
type ArmSolve = {S: V; E: V; W: V; Ww: V; handAng: number; pose: HandPose; holding: boolean; cuffBack: V};

/** Forearm-first arm: the forearm leaves the wrist at the hand's angle less a small wrist deviation, so the wrist
 *  never kinks; the upper arm joins the shoulder to that elbow (its length kept within a natural range: a reach toward
 *  the lens foreshortens it). His elbows sit back at his sides, below the shoulders. */
const solveArm = (st: SurgeonState, which: 'app' | 'clamp'): ArmSolve => {
  const k = st.k;
  const g = bodyGeo(st.lean);
  const L = SURGEON.hand;
  const isApp = which === 'app';
  const held = clamp(isApp ? st.appHeld : st.clampHeld);
  const grip = isApp ? appGrip(st.app) : clampGrip(st.clamp);
  const ts: 1 | -1 = isApp ? -1 : 1;
  const gripPose = isApp ? P_APP : P_CLAMP;
  // release: the grip opens first, then the hand travels back toward the body
  const opening = ease((1 - held) / 0.4);
  const travel = ease((1 - held - 0.25) / 0.75);
  const pose = mixHand(mixHand(gripPose, P_OPEN, opening), P_REST, travel);
  const angG = (grip.ang * 180) / Math.PI;
  const wG = wristFor(grip.p, angG, L, ts, isApp ? GRIP_UV.app : GRIP_UV.clamp);
  const rest = isApp ? g.restApp : g.restClamp;
  const restW = fromLocal(rest.p, k);
  const ang = angG + (((rest.ang - angG + 540) % 360) - 180) * travel;
  const Ww = lerpV(wG, restW, travel);
  const Wl = toLocal(Ww, k);
  const S = isApp ? g.rS : g.lS;
  const angL = angLocal(ang, k);
  const dev = isApp ? -14 : -4;
  const Lf = isApp ? 124 : 142;
  let E = sub(Wl, mul(dirA(rad(angL - dev)), Lf));
  const dSE = len(sub(E, S));
  const LuMax = 215, LuMin = 120;
  if (dSE > LuMax) E = add(S, mul(norm(sub(E, S)), LuMax));
  if (dSE < LuMin) E = add(S, mul(norm(sub(E, S)), LuMin));
  // the cuff runs back from the wrist along the forearm (world)
  const Ew = fromLocal(E, k);
  const cuffBack = add(Ww, mul(norm(sub(Ew, Ww)), 50));
  return {S, E, W: Wl, Ww, handAng: ang, pose, holding: travel < 0.06, cuffBack};
};

/** the sleeve radii: shoulder, elbow, wrist (the glove's cuff covers the wrist end) */
const SLV = {s: 46, e: 37, w: 26};

const SleeveArm: React.FC<{id: string; a: ArmSolve; far: boolean; k: number}> = ({id, a, far, k}) => {
  const col = far ? shade(C.gown, 0.12) : C.gown;
  // the sleeve ends a little past the wrist, under the glove's cuff
  const Wend = add(a.W, mul(norm(sub(a.E, a.W)), 8));
  const u1 = norm(sub(a.E, a.S));
  const u2 = norm(sub(Wend, a.E));
  const n2 = perp(u2);
  const fold = (t: number, w: number, o: number) => {
    const p = lerpV(a.E, Wend, t);
    return `M${Pf(add(p, mul(n2, w)))} Q${Pf(add(p, mul(u2, o)))} ${Pf(add(p, mul(n2, -w * 0.6)))}`;
  };
  return (
    <g transform={bodyT(k)}>
      <Inked w={IN} id={`${id}-ik`} fade={[{c: a.S, r: 50}]}>
        <Limb id={`${id}-lb`} A={a.S} B={a.E} C={Wend} rA={SLV.s} rB={SLV.e} rC={SLV.w} color={col} spec={0.14} crease={0} capA="round" capC="flat" />
      </Inked>
      <Deco>
        <path d={fold(0.32, 24, -12)} fill="none" stroke={shade(col, 0.3)} strokeWidth={3.6} strokeLinecap="round" opacity={0.42} />
        <path d={fold(0.62, 20, -9)} fill="none" stroke={shade(col, 0.3)} strokeWidth={3.2} strokeLinecap="round" opacity={0.36} />
        <path d={`M${Pf(add(lerpV(a.S, a.E, 0.5), mul(perp(u1), 30)))} Q${Pf(add(lerpV(a.S, a.E, 0.66), mul(u1, 8)))} ${Pf(add(lerpV(a.S, a.E, 0.78), mul(perp(u1), -18)))}`} fill="none" stroke={shade(col, 0.3)} strokeWidth={3.4} strokeLinecap="round" opacity={0.34} />
      </Deco>
    </g>
  );
};

const GlovedHandOf: React.FC<{id: string; a: ArmSolve; far: boolean; obj?: React.ReactNode}> = ({id, a, far, obj}) => (
  // the syringe grip (far hand) tucks the thumb under the palm onto the plunger pad; the fist (near hand) closes the
  // thumb over the handles
  <GloveHand
    id={id}
    wrist={a.Ww}
    ang={a.handAng}
    L={SURGEON.hand}
    ts={far ? -1 : 1}
    pose={a.pose}
    color={far ? shade(C.glove, 0.07) : C.glove}
    cuff={{back: a.cuffBack, r0: 0.168 * SURGEON.hand, r1: 31}}
    hold={obj ? {front: far ? [0, 1, 2, 3] : [0, 1, 2, 3, 't'], obj, palmFront: true} : undefined}
  />
);

// ------------------------------------------------------------------------------------------------ the two passes
/** Head, torso and the far (right) arm: draw BEFORE the patient's arm. */
export const SurgeonBack: React.FC<{id: string; s: SurgeonState}> = ({id, s: st}) => {
  const k = st.k;
  const g = bodyGeo(st.lean);
  const far = solveArm(st, 'app');
  const torsoD = smooth(g.torso, true, 0.9);
  const tc = add(g.collar, {x: -60, y: 110});
  const Wend = add(far.W, mul(norm(sub(far.E, far.W)), 8));
  const farCol = shade(C.gown, 0.12);
  return (
    <g className={NSCLASS}>
      <NsStyle />
      {/* the far arm, behind the torso */}
      <SleeveArm id={`${id}-fa`} a={far} far k={k} />
      <g transform={bodyT(k)}>
        <Inked w={OUT}>
          {/* neck behind the collar */}
          <Inked w={IN}>
            <Capsule id={`${id}-nk`} a={g.neckBot} b={g.neckTop} ra={40} rb={38} color={shade(SURGEON.skin, 0.14)} />
          </Inked>
          {/* gown */}
          <Inked w={IN}>
            <Blob id={`${id}-tor`} d={torsoD} c={tc} r={360} color={C.gown} k={1} stops={[[0, lit(C.gown, 0.26)], [0.42, lit(C.gown, 0.06)], [0.74, C.gown], [1, C.gownDeep]]} />
          </Inked>
          <Deco>
            <defs>
              <clipPath id={`${id}-tclip`}>
                <path d={torsoD} />
              </clipPath>
            </defs>
            <g clipPath={`url(#${id}-tclip)`}>
              {/* form: the back turns away into the deep blue */}
              <Lin id={`${id}-tf`} d={torsoD} from={add(g.collar, {x: -90, y: 40})} to={add(g.collar, {x: 170, y: 90})} stops={[[0, '#FFFFFF', 0.14], [0.35, '#FFFFFF', 0], [0.6, C.gownDeep, 0], [1, C.gownDeep, 0.55]]} />
              {/* the far shoulder's seam and the drape folds down the chest */}
              <path d={`M${Pf(add(g.collar, {x: -44, y: -8}))} Q${Pf(add(g.collar, {x: -78, y: 10}))} ${Pf(add(g.collar, {x: -98, y: 52}))}`} fill="none" stroke={C.gownDeep} strokeWidth={3.4} strokeLinecap="round" opacity={0.45} />
              {[
                [-96, 70, -104, 250, 0.34],
                [-40, 30, -60, 230, 0.26],
                [40, 40, 60, 260, 0.3],
              ].map(([x0, y0, x1, y1, o], i) => {
                const a = add(g.collar, {x: x0, y: y0});
                const b = add(g.collar, {x: x1, y: y1});
                return <path key={i} d={`M${Pf(a)} Q${Pf(add(lerpV(a, b, 0.5), {x: 14, y: 0}))} ${Pf(b)}`} fill="none" stroke={C.gownDeep} strokeWidth={4} strokeLinecap="round" opacity={o} />;
              })}
              <ellipse cx={fmt(g.collar.x - 74)} cy={fmt(g.collar.y + 96)} rx={52} ry={15} transform={`rotate(-70 ${fmt(g.collar.x - 74)} ${fmt(g.collar.y + 96)})`} fill="#FFFFFF" opacity={0.15} />
            </g>
          </Deco>
          {/* the gown's round collar band */}
          <Inked w={IN}>
            <InkPath d={smooth([add(g.collar, {x: -46, y: -12}), add(g.collar, {x: -14, y: 12}), add(g.collar, {x: 36, y: 10}), add(g.collar, {x: 62, y: -16}), add(g.collar, {x: 40, y: -4}), add(g.collar, {x: -10, y: -2}), add(g.collar, {x: -34, y: -22})], true, 0.8)} fill={lit(C.gown, 0.14)} />
          </Inked>
          {/* the far forearm crosses in front of the gown (only where it overlaps the torso; elsewhere the copy
              behind shows) */}
          <Deco>
            <defs>
              <mask id={`${id}-fm`}>
                <path d={torsoD} fill="#FFF" stroke="#FFF" strokeWidth={8} />
              </mask>
            </defs>
          </Deco>
          <g mask={`url(#${id}-fm)`}>
            <Inked w={IN}>
              <Capsule id={`${id}-ffa`} a={far.E} b={Wend} ra={SLV.e} rb={SLV.w} color={farCol} spec={0.12} />
            </Inked>
          </g>
          <SurgeonHead id={`${id}-hd`} c={g.head} R={SURGEON.headR} roll={g.roll} turn={0.72} face={st.face} skin={SURGEON.skin} />
        </Inked>
      </g>
    </g>
  );
};

/** His near (left) arm, both gloved hands and both instruments: draw AFTER (over) the patient's arm. */
export const SurgeonFront: React.FC<{id: string; s: SurgeonState}> = ({id, s: st}) => {
  const k = st.k;
  const far = solveArm(st, 'app');
  const near = solveArm(st, 'clamp');
  const clampEl = <Clamp id={`${id}-cl`} s={st.clamp} />;
  const appEl = <Applicator id={`${id}-ap`} s={st.app} />;
  return (
    <g className={NSCLASS}>
      <NsStyle />
      <SleeveArm id={`${id}-na`} a={near} far={false} k={k} />
      {!near.holding && clampEl}
      <GlovedHandOf id={`${id}-nh`} a={near} far={false} obj={near.holding ? clampEl : undefined} />
      {!far.holding && appEl}
      <GlovedHandOf id={`${id}-fh`} a={far} far obj={far.holding ? appEl : undefined} />
    </g>
  );
};

/** default instrument states and face the staging was designed around */
export const SURGEON_DEFAULT: SurgeonState = {
  app: {tip: {x: -5.0, y: 0.8}, ang: -0.42, press: 0.35, gel: 1},
  clamp: {a: {x: 11.5, y: -6.0}, b: {x: 10.8, y: 14.0}, open: 0, lift: 0},
  appHeld: 1,
  clampHeld: 1,
  face: {focus: 0.6, smile: 0, gx: -0.45, gy: 0.75, blink: 0},
  k: 0.86,
  lean: 0,
};
