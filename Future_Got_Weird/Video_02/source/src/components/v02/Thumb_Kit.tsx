import React from 'react';
import {C} from '../../theme';
import {CAST} from '../cast';
import {handPos, reachLocal, type Arm, type Look} from '../Character';
import {segmentHitsRect, type P2, type Rect} from '../../lib/optics';
import {HandheldSensor} from './HandheldSensor';

/**
 * Thumbnail kit (Video 02 thumbnails only). Everything is drawn into one full-frame <svg> in screen px.
 *
 *  - `ThumbGuesser`: the accepted `guesser` rig (heads, hair, face, striped shirt and proportions copied from
 *    Character.tsx / Cast2.tsx) redrawn so the ink line is set in SCREEN px (4-6 px at thumbnail scale) instead of
 *    growing with the rig scale, and with facial marks weighted for small-size legibility.
 *  - `Cam` + `proj`: the film's oblique room projection (x along the relay wall, z toward the camera, h up;
 *    heights at full scale, floor foreshortened, a slight front-left shear), so the rooms read like the film's.
 *  - `checkRoute`: the light route must be physical: in plan, S->W and W->H clear the coral wall's footprint (so the
 *    light goes round its end via the gap at the wall), S->H is blocked; on screen, no leg may touch the coral
 *    silhouette. A violation throws, so a bad composition cannot render.
 */

export const INK = C.ink;
export const CORAL_FRONT = C.coral;
export const CORAL_SIDE = '#DA5843';
export const CORAL_TOP = '#F8A08E';
export const WALL = '#F6EBD2';
export const WALL_SHADE = '#EEDFC0';
export const FLOOR = '#E9C690';
export const FLOOR_DEEP = '#D9AE6E';
export const LIGHT = C.saffron;
export const LIGHT_DEEP = C.saffronDeep;

/* ------------------------------------------------------------------ projection */

export type Cam = {k: number; f: number; v: number; sh: number; ox: number; oy: number};
export type Pt = {x: number; y: number};
export const proj = (c: Cam, x: number, z: number, h = 0): Pt => ({x: c.ox + c.k * (x + c.sh * z), y: c.oy + c.k * (c.f * z - c.v * h)});
export const RIG_PX = 440;
export const PERSON_M = 1.7;
export const rigScale = (c: Cam, heightM = PERSON_M) => (c.k * heightM) / RIG_PX;

export type Block = {x0: number; x1: number; z0: number; z1: number; h: number};

/** Screen polygons of the coral block's visible faces (front-left camera: left face, top, front). */
export const blockFaces = (c: Cam, b: Block) => {
  const P = (x: number, z: number, h: number) => proj(c, x, z, h);
  const left = [P(b.x0, b.z0, 0), P(b.x0, b.z1, 0), P(b.x0, b.z1, b.h), P(b.x0, b.z0, b.h)];
  const top = [P(b.x0, b.z0, b.h), P(b.x1, b.z0, b.h), P(b.x1, b.z1, b.h), P(b.x0, b.z1, b.h)];
  const front = [P(b.x0, b.z1, 0), P(b.x1, b.z1, 0), P(b.x1, b.z1, b.h), P(b.x0, b.z1, b.h)];
  return {left, top, front};
};

/** Convex hull (screen) of the block's 8 corners: its silhouette. */
export const blockSilhouette = (c: Cam, b: Block): Pt[] => {
  const pts: Pt[] = [];
  for (const x of [b.x0, b.x1]) for (const z of [b.z0, b.z1]) for (const h of [0, b.h]) pts.push(proj(c, x, z, h));
  return hull(pts);
};

export const hull = (pts: Pt[]): Pt[] => {
  const p = [...pts].sort((a, b) => a.x - b.x || a.y - b.y);
  const cross = (o: Pt, a: Pt, b: Pt) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lo: Pt[] = [];
  for (const q of p) {
    while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop();
    lo.push(q);
  }
  const up: Pt[] = [];
  for (let i = p.length - 1; i >= 0; i--) {
    const q = p[i];
    while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop();
    up.push(q);
  }
  return [...lo.slice(0, -1), ...up.slice(0, -1)];
};

export const polyD = (pts: Pt[], closed = true) => pts.map((p, i) => `${i ? 'L' : 'M'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + (closed ? ' Z' : '');

/* ------------------------------------------------------------------ route checks */

const pointInPoly = (p: Pt, poly: Pt[]) => {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i];
    const b = poly[j];
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) c = !c;
  }
  return c;
};
const segPointDist = (p: Pt, a: Pt, b: Pt) => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const L = dx * dx + dy * dy;
  const t = L === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / L));
  return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy);
};
const segsCross = (a: Pt, b: Pt, c: Pt, d: Pt) => {
  const o = (p: Pt, q: Pt, r: Pt) => (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
  return o(a, b, c) * o(a, b, d) < 0 && o(c, d, a) * o(c, d, b) < 0;
};
/** Smallest screen distance between segment ab and polygon `poly` (0 when they touch or cross). */
export const segPolyClearance = (a: Pt, b: Pt, poly: Pt[]) => {
  if (pointInPoly(a, poly) || pointInPoly(b, poly)) return 0;
  let m = Infinity;
  for (let i = 0; i < poly.length; i++) {
    const c = poly[i];
    const d = poly[(i + 1) % poly.length];
    if (segsCross(a, b, c, d)) return 0;
    m = Math.min(m, segPointDist(c, a, b), segPointDist(d, a, b), segPointDist(a, c, d), segPointDist(b, c, d));
  }
  return m;
};

export type RouteCheck = {
  /** plan points (metres): sensor, wall spot (z = 0), hidden person */
  S: P2;
  W: P2;
  H: P2;
  block: Block;
  /** screen legs actually drawn (each [from, to]) and the silhouette(s) they must keep clear of */
  legs: [Pt, Pt][];
  silhouettes: Pt[][];
  /** min px between a leg's centre line and the coral silhouette */
  minClear: number;
  label: string;
};

/** Throws when the route is not physical or touches the coral wall on screen. Returns the measured clearances. */
export const checkRoute = (r: RouteCheck) => {
  const rect: Rect = {x0: r.block.x0 - 0.03, x1: r.block.x1 + 0.03, z0: r.block.z0 - 0.03, z1: r.block.z1 + 0.03};
  if (segmentHitsRect(r.S, r.W, rect)) throw new Error(`${r.label}: plan leg S->W crosses the coral wall`);
  if (segmentHitsRect(r.W, r.H, rect)) throw new Error(`${r.label}: plan leg W->H crosses the coral wall`);
  if (!segmentHitsRect(r.S, r.H, rect)) throw new Error(`${r.label}: the coral wall does not block S->H (he would be in plain view)`);
  if (Math.abs(r.W.z) > 1e-9) throw new Error(`${r.label}: the wall spot must lie on the relay wall (z = 0)`);
  const clear = r.legs.map(([a, b]) => Math.min(...r.silhouettes.map((s) => segPolyClearance(a, b, s))));
  clear.forEach((c, i) => {
    if (c < r.minClear) throw new Error(`${r.label}: leg ${i} passes ${c.toFixed(1)} px from the coral wall (min ${r.minClear})`);
  });
  return clear;
};

/* ------------------------------------------------------------------ the guesser, thumbnail weight */

const SHOULDER_Y = -292;
const SHOULDER_X = 66;
const HEAD_Y = -372;
const HEAD_R = 58;
const ARM_W = 30;
const TORSO_D = `M -76 ${SHOULDER_Y + 2} Q -82 ${SHOULDER_Y - 18} -52 ${SHOULDER_Y - 22} L 52 ${SHOULDER_Y - 22} Q 82 ${SHOULDER_Y - 18} 76 ${SHOULDER_Y + 2} L 66 -150 Q 0 -138 -66 -150 Z`;
const r = HEAD_R;
const cy = HEAD_Y;
const SPIKY_D = `M ${-r} ${cy - 12} L ${-r + 4} ${cy - r - 22} L ${-28} ${cy - r - 4} L ${-14} ${cy - r - 34} L 0 ${cy - r - 6} L 14 ${cy - r - 36} L 28 ${cy - r - 4} L ${r - 4} ${cy - r - 22} L ${r} ${cy - 12} Q ${r * 0.6} ${cy - r * 0.55} 0 ${cy - r * 0.6} Q ${-r * 0.6} ${cy - r * 0.55} ${-r} ${cy - 12} Z`;

/** Arms folded across the chest (Cast2 ARMS.armsCrossed, solved with the rig's own IK). */
export const ARMS_CROSSED = {armL: reachLocal(30, -218, -1, -1), armR: reachLocal(-30, -230, 1, -1)};

export type GuesserPose = {
  armL: Arm;
  armR: Arm;
  /** arms drawn in front of the torso; with 'both', `frontTop` is drawn last */
  armsFront?: 'none' | 'L' | 'R' | 'both';
  frontTop?: 'L' | 'R';
  /** whole-body lean about the pelvis, deg (+ = viewer's right) */
  lean?: number;
  /** head tilt, deg */
  tilt?: number;
  /** pupils, -1..1 (sideways glance: -1 = hard to the viewer's left) */
  lookX: number;
  lookY: number;
  /** 0..1 upper lids lowered (0.5 = half-lidded, smug) */
  lid: number;
  brows: number;
  /** raises the viewer's-right brow (skeptical / smug) 0..1 */
  browAsym: number;
  mouth: 'smirk' | 'smile' | 'flat' | 'o';
};

export const SMUG_SIDEWAYS: GuesserPose = {
  ...ARMS_CROSSED,
  armsFront: 'both',
  frontTop: 'L',
  lean: -3,
  tilt: 6,
  lookX: -1,
  lookY: 0.15,
  lid: 0.5,
  brows: -0.25,
  browAsym: 0.75,
  mouth: 'smirk',
};

export type ThumbGuesserProps = {
  /** ground point (between the feet), screen px */
  x: number;
  y: number;
  scale: number;
  pose: GuesserPose;
  /** ink contour width in screen px */
  outline?: number;
  /** weight of the facial marks (brows, mouth, lid line) relative to `outline` */
  face?: number;
  look?: Look;
  shadow?: boolean;
};

/** Head centre and the top of the hair in screen px, for aiming the light route. */
export const guesserHead = (p: {x: number; y: number; scale: number; pose: GuesserPose}) => {
  const lean = ((p.pose.lean ?? 0) * Math.PI) / 180;
  const rot = (px: number, py: number) => {
    // lean pivots about (0, -150)
    const dx = px;
    const dy = py + 150;
    return {x: dx * Math.cos(lean) - dy * Math.sin(lean), y: dx * Math.sin(lean) + dy * Math.cos(lean) - 150};
  };
  const c = rot(0, HEAD_Y);
  const top = rot(0, HEAD_Y - HEAD_R - 30);
  return {
    center: {x: p.x + c.x * p.scale, y: p.y + c.y * p.scale},
    hairTop: {x: p.x + top.x * p.scale, y: p.y + top.y * p.scale},
    radius: HEAD_R * p.scale,
    /** a point on the hair/scalp outline at angle a (deg, 0 = up, + = viewer's right), local head tilt ignored */
    rim: (aDeg: number, extra = 0) => {
      const a = (aDeg * Math.PI) / 180;
      const rr = HEAD_R + 22 + extra;
      const q = rot(Math.sin(a) * rr, HEAD_Y - Math.cos(a) * rr);
      return {x: p.x + q.x * p.scale, y: p.y + q.y * p.scale};
    },
  };
};

export const ThumbGuesser: React.FC<ThumbGuesserProps> = ({x, y, scale, pose, outline = 6, face = 1.35, look = CAST.guesser, shadow = true}) => {
  const ol = outline / scale; // contour width in rig units
  const fm = (outline * face) / scale; // facial mark width
  const st = {stroke: INK, strokeWidth: ol, strokeLinejoin: 'round' as const};
  const front = pose.armsFront ?? 'none';
  const frontL = front === 'L' || front === 'both';
  const frontR = front === 'R' || front === 'both';
  const topR = (pose.frontTop ?? 'L') === 'R';
  const uid = `g${Math.round(x)}_${Math.round(y)}`;

  const arm = (a: Arm, side: -1 | 1) => {
    const {ex, ey, hx, hy, angle} = handPos(a, side);
    const sx = SHOULDER_X * side;
    return (
      <g key={side}>
        <polyline points={`${sx},${SHOULDER_Y} ${ex},${ey} ${hx},${hy}`} fill="none" stroke={INK} strokeWidth={ARM_W + ol * 2} strokeLinecap="round" strokeLinejoin="round" />
        <polyline points={`${sx},${SHOULDER_Y} ${ex},${ey}`} fill="none" stroke={look.shirt} strokeWidth={ARM_W} strokeLinecap="round" strokeLinejoin="round" />
        <polyline points={`${ex},${ey} ${hx},${hy}`} fill="none" stroke={look.skin} strokeWidth={ARM_W} strokeLinecap="round" strokeLinejoin="round" />
        <g transform={`translate(${hx}, ${hy}) rotate(${angle})`}>
          <ellipse cx={0} cy={6} rx={20} ry={18} fill={look.skin} {...st} />
          <ellipse cx={side * -14} cy={-2} rx={8} ry={10} fill={look.skin} {...st} transform={`rotate(${side * -30})`} />
          <ellipse cx={side * -14} cy={-2} rx={6} ry={8} fill={look.skin} transform={`rotate(${side * -30})`} />
        </g>
      </g>
    );
  };
  const LArm = arm(pose.armL, -1);
  const RArm = arm(pose.armR, 1);

  // face
  const eyeY = HEAD_Y - 6;
  const lid = Math.max(0, Math.min(1, pose.lid));
  const browL = -12 - pose.brows * 6;
  const browR = -12 - pose.brows * 6 - pose.browAsym * 8;
  const my = HEAD_Y + 30;
  const mouth = (() => {
    const s = {fill: 'none', stroke: INK, strokeWidth: fm, strokeLinecap: 'round' as const};
    switch (pose.mouth) {
      case 'smirk':
        // Cast2 smirk, a touch wider so it survives at small size
        return <path d={`M -16 ${my + 4} Q 4 ${my + 13} 19 ${my - 4}`} {...s} />;
      case 'smile':
        return <path d={`M -16 ${my} Q 0 ${my + 14} 16 ${my}`} {...s} />;
      case 'flat':
        return <path d={`M -14 ${my + 2} L 14 ${my + 2}`} {...s} />;
      case 'o':
      default:
        return <ellipse cx={0} cy={my + 4} rx={8} ry={10} fill={INK} />;
    }
  })();

  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      {shadow && <ellipse cx={0} cy={2} rx={96} ry={15} fill={C.shadow} />}
      <g transform={`rotate(${pose.lean ?? 0} 0 -150)`}>
        {!frontL && LArm}
        {!frontR && RArm}
        {/* legs and shoes (Video 01 rest pose) */}
        <rect x={-52} y={-170} width={38} height={160} rx={16} fill={look.pants} {...st} />
        <rect x={14} y={-170} width={38} height={160} rx={16} fill={look.pants} {...st} />
        <ellipse cx={-34} cy={-6} rx={30} ry={13} fill={look.shoes} {...st} />
        <ellipse cx={34} cy={-6} rx={30} ry={13} fill={look.shoes} {...st} />
        {/* torso with the saffron stripes */}
        <path d={TORSO_D} fill={look.shirt} {...st} />
        {look.stripes && (
          <g clipPath={`url(#torso${uid})`}>
            {[0, 1, 2, 3, 4].map((i) => (
              <rect key={i} x={-90} y={SHOULDER_Y - 10 + i * 30} width={180} height={14} fill={look.stripes} />
            ))}
          </g>
        )}
        <defs>
          <clipPath id={`torso${uid}`}>
            <path d={TORSO_D} />
          </clipPath>
        </defs>
        <path d={TORSO_D} fill="none" {...st} />
        {/* neck */}
        <rect x={-16} y={HEAD_Y + 40} width={32} height={34} fill={look.skin} {...st} />
        {/* head */}
        <g transform={`rotate(${pose.tilt ?? 0} 0 ${HEAD_Y + 50})`}>
          <ellipse cx={0} cy={HEAD_Y} rx={HEAD_R} ry={HEAD_R + 4} fill={look.skin} {...st} />
          <ellipse cx={-HEAD_R - 2} cy={HEAD_Y + 6} rx={9} ry={12} fill={look.skin} {...st} />
          <ellipse cx={HEAD_R + 2} cy={HEAD_Y + 6} rx={9} ry={12} fill={look.skin} {...st} />
          <path d={SPIKY_D} fill={look.hairColor} {...st} />
          {look.cheeks && (
            <g opacity={0.6}>
              <circle cx={-34} cy={HEAD_Y + 16} r={9} fill={C.coral} />
              <circle cx={34} cy={HEAD_Y + 16} r={9} fill={C.coral} />
            </g>
          )}
          {[-1, 1].map((s) => {
            const rx = 12;
            const ry = 13;
            const lidY = -ry + 2 * ry * lid;
            const chord = rx * Math.sqrt(Math.max(0, 1 - (lidY / ry) ** 2));
            const by = s < 0 ? browL : browR;
            const clip = `eye${uid}${s < 0 ? 'l' : 'r'}`;
            const px = pose.lookX * 6;
            const py = pose.lookY * 4;
            return (
              <g key={s} transform={`translate(${s * 21} ${eyeY})`}>
                <defs>
                  <clipPath id={clip}>
                    <ellipse cx={0} cy={0} rx={rx} ry={ry} />
                  </clipPath>
                </defs>
                <ellipse cx={0} cy={0} rx={rx} ry={ry} fill={C.white} />
                <g clipPath={`url(#${clip})`}>
                  <circle cx={px} cy={py} r={6.2} fill={INK} />
                  <circle cx={px + 2.2} cy={py - 2.2} r={1.8} fill={C.white} />
                  {lid > 0.01 && <rect x={-rx - 2} y={-ry - 2} width={rx * 2 + 4} height={lidY + ry + 2} fill={look.skin} />}
                </g>
                <ellipse cx={0} cy={0} rx={rx} ry={ry} fill="none" stroke={INK} strokeWidth={ol * 0.8} />
                {lid > 0.01 && <line x1={-chord - 1.5} y1={lidY} x2={chord + 1.5} y2={lidY} stroke={INK} strokeWidth={fm * 0.95} strokeLinecap="round" />}
                <line x1={-12} y1={by} x2={12} y2={by + s * pose.brows * 6} stroke={INK} strokeWidth={fm * 1.15} strokeLinecap="round" transform="translate(0 -10)" />
              </g>
            );
          })}
          <path d={`M 2 ${HEAD_Y + 2} Q 10 ${HEAD_Y + 16} 0 ${HEAD_Y + 18}`} fill="none" stroke={INK} strokeWidth={ol * 0.8} strokeLinecap="round" />
          {mouth}
        </g>
        {/* front arms */}
        {frontR && !topR && RArm}
        {frontL && LArm}
        {frontR && topR && RArm}
      </g>
    </g>
  );
};

/* ------------------------------------------------------------------ the sensor on its little stand */

/**
 * The kit sensor (HandheldSensor, no hand) on a small tripod. (x, y) is where the grip meets the stand's head; the
 * tripod feet land `standPx` below it. Its working face looks away from us, at the wall; we see the readout.
 * Returns the group plus the emitter point (where the light leaves) in screen px.
 */
export const sensorEmitter = (x: number, y: number, scale: number, rotate = 0) => {
  // emitter lens rim, HandheldSensor local coords (see SENSOR geometry): box x0 -46 + 24 + depth 11, y0 -108 - 12
  const lx = -11;
  const ly = -121;
  const a = (rotate * Math.PI) / 180;
  return {x: x + (lx * Math.cos(a) - ly * Math.sin(a)) * scale, y: y + (lx * Math.sin(a) + ly * Math.cos(a)) * scale};
};

export const SensorOnStand: React.FC<{x: number; y: number; scale: number; standPx: number; rotate?: number; outline?: number; bumpHighlight?: number}> = ({x, y, scale, standPx, rotate = 0, outline = 4.5, bumpHighlight = 0.6}) => {
  const ol = outline;
  const foot = y + standPx;
  const spread = Math.max(40, standPx * 0.28);
  const hubY = y + standPx * 0.55;
  return (
    <g>
      <ellipse cx={x} cy={foot + 4} rx={spread * 1.25} ry={Math.max(6, spread * 0.16)} fill={C.shadow} />
      {/* tripod: two splayed legs, one toward us, a centre column */}
      {[
        [x - spread, foot],
        [x + spread, foot],
        [x + spread * 0.18, foot + spread * 0.12],
      ].map(([fx, fy], i) => (
        <g key={i}>
          <line x1={x} y1={hubY} x2={fx} y2={fy} stroke={INK} strokeWidth={9 + ol * 2} strokeLinecap="round" />
          <line x1={x} y1={hubY} x2={fx} y2={fy} stroke={C.inkSoft} strokeWidth={9} strokeLinecap="round" />
        </g>
      ))}
      <line x1={x} y1={y + 8} x2={x} y2={hubY + 6} stroke={INK} strokeWidth={12 + ol * 2} strokeLinecap="round" />
      <line x1={x} y1={y + 8} x2={x} y2={hubY + 6} stroke={C.inkMuted} strokeWidth={12} strokeLinecap="round" />
      <rect x={x - 17} y={hubY - 9} width={34} height={20} rx={6} fill={C.inkSoft} stroke={INK} strokeWidth={ol} />
      {/* head plate the grip sits in */}
      <rect x={x - 26} y={y + 4} width={52} height={16} rx={6} fill={C.inkSoft} stroke={INK} strokeWidth={ol} />
      <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
        <HandheldSensor led={1} bumpHighlight={bumpHighlight} />
      </g>
    </g>
  );
};

/* ------------------------------------------------------------------ the light route */

export type RouteStyle = {
  width?: number;
  casing?: number;
  /** the return trip (faint, dashed, its own lane) */
  showReturn?: boolean;
  returnLane?: number;
  /** pulse dots along each outbound leg, as fractions of the leg */
  pulses?: number[][];
};

const unit = (a: Pt, b: Pt) => {
  const d = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  return {x: (b.x - a.x) / d, y: (b.y - a.y) / d};
};
const lerp = (a: Pt, b: Pt, t: number): Pt => ({x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t});

/** Leg of light: an ink-cased saffron band, thinning after the bounce (the light is fainter after each reflection). */
export const LightLeg: React.FC<{a: Pt; b: Pt; width: number; casing: number; pale?: number; cap?: 'round' | 'butt'}> = ({a, b, width, casing, pale = 0, cap = 'round'}) => (
  <g>
    <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={INK} strokeWidth={width + casing * 2} strokeLinecap={cap} />
    <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={pale > 0 ? '#FFD978' : LIGHT} strokeWidth={width} strokeLinecap={cap} />
  </g>
);

/** Bounce mark on the wall: a small scatter burst (light spreads every which way off matte paint). */
export const BounceBurst: React.FC<{p: Pt; r: number; outline?: number; rays?: number; rot?: number}> = ({p, r, outline = 5, rays = 10, rot = 0}) => (
  <g>
    {Array.from({length: rays}).map((_, i) => {
      const a = rot + (i / rays) * Math.PI * 2;
      const r0 = r * 1.35;
      const r1 = r * (i % 2 ? 2.0 : 2.45);
      return (
        <g key={i}>
          <line x1={p.x + Math.cos(a) * r0} y1={p.y + Math.sin(a) * r0} x2={p.x + Math.cos(a) * r1} y2={p.y + Math.sin(a) * r1} stroke={INK} strokeWidth={7 + outline * 2} strokeLinecap="round" />
          <line x1={p.x + Math.cos(a) * r0} y1={p.y + Math.sin(a) * r0} x2={p.x + Math.cos(a) * r1} y2={p.y + Math.sin(a) * r1} stroke={LIGHT} strokeWidth={7} strokeLinecap="round" />
        </g>
      );
    })}
    <circle cx={p.x} cy={p.y} r={r} fill={LIGHT} stroke={INK} strokeWidth={outline} />
    <circle cx={p.x} cy={p.y} r={r * 0.45} fill={C.cream} />
  </g>
);

/** The arrival at his head: a small hit spark. */
export const HitSpark: React.FC<{p: Pt; r: number; outline?: number; dir?: number}> = ({p, r, outline = 5, dir = 0}) => {
  const pts: string[] = [];
  const n = 8;
  for (let i = 0; i < n * 2; i++) {
    const a = dir + (i / (n * 2)) * Math.PI * 2;
    const rr = i % 2 ? r * 0.48 : r;
    pts.push(`${(p.x + Math.cos(a) * rr).toFixed(1)},${(p.y + Math.sin(a) * rr).toFixed(1)}`);
  }
  return <polygon points={pts.join(' ')} fill={LIGHT} stroke={INK} strokeWidth={outline} strokeLinejoin="round" />;
};

export const PulseDot: React.FC<{p: Pt; r: number; outline?: number}> = ({p, r, outline = 5}) => (
  <g>
    <circle cx={p.x} cy={p.y} r={r} fill={LIGHT} stroke={INK} strokeWidth={outline} />
    <circle cx={p.x - r * 0.3} cy={p.y - r * 0.3} r={r * 0.32} fill={C.cream} />
  </g>
);

/** Faint return (H -> W -> S) as a thin dashed line offset into its own lane. */
export const ReturnTrail: React.FC<{pts: Pt[]; lane: number; width?: number; dash?: string; opacity?: number}> = ({pts, lane, width = 5, dash = '2 16', opacity = 0.9}) => {
  // offset each segment by `lane` px to its left (in travel direction) and join with miters
  const segs = pts.slice(1).map((b, i) => {
    const a = pts[i];
    const u = unit(a, b);
    const n = {x: u.y * lane, y: -u.x * lane};
    return [{x: a.x + n.x, y: a.y + n.y}, {x: b.x + n.x, y: b.y + n.y}] as [Pt, Pt];
  });
  const out: Pt[] = [segs[0][0]];
  for (let i = 1; i < segs.length; i++) {
    const [a1, b1] = segs[i - 1];
    const [a2, b2] = segs[i];
    const d1 = {x: b1.x - a1.x, y: b1.y - a1.y};
    const d2 = {x: b2.x - a2.x, y: b2.y - a2.y};
    const den = d1.x * d2.y - d1.y * d2.x;
    if (Math.abs(den) < 1e-6) out.push(b1);
    else {
      const t = ((a2.x - a1.x) * d2.y - (a2.y - a1.y) * d2.x) / den;
      out.push({x: a1.x + d1.x * t, y: a1.y + d1.y * t});
    }
  }
  out.push(segs[segs.length - 1][1]);
  return (
    <polyline points={out.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')} fill="none" stroke={LIGHT_DEEP} strokeWidth={width} strokeDasharray={dash} strokeLinecap="round" strokeLinejoin="round" opacity={opacity} />
  );
};

export {lerp, unit};

/* ------------------------------------------------------------------ big readout (thumbnail C) */

/**
 * The kit sensor seen from behind at close range (thumbnail C): the same teal box with its top and side faces, the
 * two lens rims peeking over the top (coral emitter, dark detector), the coral band, the status LED and the grip with
 * its coral trigger, drawn with a screen-px ink line. The readout is enlarged a little for the close-up. `children`
 * draw inside the screen in screen-local px (0..sw x 0..sh, see `bigSensorScreen`).
 */
export const bigSensorScreen = (w: number) => {
  const h = w * 0.64;
  return {x: w * 0.065, y: h * 0.1, w: w * 0.72, h: h * 0.66};
};

export const BigSensor: React.FC<{x: number; y: number; w: number; outline?: number; children?: React.ReactNode; led?: string}> = ({x, y, w, outline = 6, children, led = C.saffron}) => {
  const h = w * 0.64;
  const x0 = x - w / 2;
  const y0 = y - h / 2;
  const dx = w * 0.07;
  const dy = -w * 0.075;
  const ink = {stroke: INK, strokeWidth: outline, strokeLinejoin: 'round' as const};
  const s = bigSensorScreen(w);
  const r = h * 0.16;
  const gx = x0 + w * 0.535;
  const gw = w * 0.28;
  const id = `bs${Math.round(x)}${Math.round(y)}`;
  return (
    <g>
      {/* grip (into the tripod head below) */}
      <rect x={gx - gw / 2} y={y0 + h - r} width={gw} height={h * 0.95} rx={gw * 0.3} fill={C.tealDeep} {...ink} />
      <rect x={gx - gw * 0.22} y={y0 + h + h * 0.12} width={gw * 0.44} height={h * 0.2} rx={gw * 0.12} fill={C.coral} {...ink} />
      {/* lens rims of the working face (it looks away from us, at the wall) */}
      <ellipse cx={x0 + w * 0.28 + dx} cy={y0 + dy - 2} rx={w * 0.11} ry={w * 0.055} fill={C.coral} {...ink} />
      <ellipse cx={x0 + w * 0.62 + dx} cy={y0 + dy - 2} rx={w * 0.08} ry={w * 0.045} fill={C.inkSoft} {...ink} />
      {/* side, top, front */}
      <path d={`M ${x0 + w - 6} ${y0 + 4} L ${x0 + w + dx} ${y0 + dy} L ${x0 + w + dx} ${y0 + h + dy - 4} L ${x0 + w - 6} ${y0 + h - 4} Z`} fill={C.tealDeep} {...ink} />
      <path d={`M ${x0 + 4} ${y0 + 6} L ${x0 + 4 + dx} ${y0 + dy} L ${x0 + w + dx} ${y0 + dy} L ${x0 + w - 4} ${y0 + 6} Z`} fill="#7FCFC9" {...ink} />
      <rect x={x0} y={y0} width={w} height={h} rx={r} fill={C.teal} {...ink} />
      <defs>
        <clipPath id={`${id}face`}>
          <rect x={x0} y={y0} width={w} height={h} rx={r} />
        </clipPath>
        <clipPath id={`${id}scr`}>
          <rect x={x0 + s.x} y={y0 + s.y} width={s.w} height={s.h} rx={s.h * 0.08} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}face)`}>
        <rect x={x0 - 4} y={y0 + h - h * 0.15} width={w + 8} height={h * 0.2} fill={C.coral} />
        <line x1={x0} y1={y0 + h - h * 0.15} x2={x0 + w} y2={y0 + h - h * 0.15} stroke={INK} strokeWidth={outline * 0.8} />
      </g>
      <rect x={x0} y={y0} width={w} height={h} rx={r} fill="none" {...ink} />
      {/* readout */}
      <rect x={x0 + s.x} y={y0 + s.y} width={s.w} height={s.h} rx={s.h * 0.08} fill={C.cream} {...ink} />
      <g clipPath={`url(#${id}scr)`}>
        <g transform={`translate(${x0 + s.x} ${y0 + s.y})`}>{children}</g>
      </g>
      {/* LED and button */}
      <circle cx={x0 + w * 0.89} cy={y0 + h * 0.24} r={w * 0.045} fill={led} {...ink} />
      <circle cx={x0 + w * 0.89 - w * 0.014} cy={y0 + h * 0.24 - w * 0.014} r={w * 0.012} fill={C.cream} />
      <rect x={x0 + w * 0.845} y={y0 + h * 0.42} width={w * 0.09} height={h * 0.1} rx={h * 0.03} fill={C.tealLight} {...ink} strokeWidth={outline * 0.8} />
    </g>
  );
};
