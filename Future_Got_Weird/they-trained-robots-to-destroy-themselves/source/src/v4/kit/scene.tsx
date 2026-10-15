// V4 2D scene kit: a camera (world point at screen centre + zoom), parallax layers, timing helpers, the robot and crew
// wrappers (constant ink width at any zoom), chips and labels in screen space.
import React from 'react';
import {Robot2D, RPose, RobotProps} from '../rig/Robot2D';
import {Character, Look, Pose as CPose, Arm as CArm, reach, handWorld} from '../../components/Character';
import {C, F} from '../../theme';

export type Cam = {x: number; y: number; z: number; rot?: number};
export const camT = (c: Cam, p = 1) => {
  const z = 1 + (c.z - 1) * p;
  return `translate(960 540) rotate(${c.rot ?? 0}) scale(${z}) translate(${-c.x * p - (1 - p) * 960} ${-c.y * p - (1 - p) * 540})`;
};
export const mixCam = (a: Cam, b: Cam, t: number): Cam => {
  // zoom interpolates geometrically so pushes feel even
  const z = Math.exp(Math.log(a.z) + (Math.log(b.z) - Math.log(a.z)) * t);
  return {x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z, rot: (a.rot ?? 0) + ((b.rot ?? 0) - (a.rot ?? 0)) * t};
};
/** World → screen. */
export const toScreen = (c: Cam, x: number, y: number) => {
  const r = ((c.rot ?? 0) * Math.PI) / 180;
  const dx = (x - c.x) * c.z, dy = (y - c.y) * c.z;
  return {x: 960 + dx * Math.cos(r) - dy * Math.sin(r), y: 540 + dx * Math.sin(r) + dy * Math.cos(r)};
};

// ---------------------------------------------------------------- timing
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (x: number) => {
  const t = clamp01(x);
  return t * t * (3 - 2 * t);
};
export const easeOut = (x: number) => 1 - Math.pow(1 - clamp01(x), 3);
export const easeIn = (x: number) => Math.pow(clamp01(x), 3);
export const easeInOut = (x: number) => {
  const t = clamp01(x);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};
/** Overshoot settle (back-out). */
export const backOut = (x: number, k = 1.6) => {
  const t = clamp01(x) - 1;
  return 1 + t * t * ((k + 1) * t + k);
};
/** Damped spring settle from 0 to 1 starting at t=0 (seconds). */
export const springy = (t: number, f = 2.2, d = 6) => (t <= 0 ? 0 : 1 - Math.exp(-d * t) * Math.cos(2 * Math.PI * f * t));
export const rnd = (seed: number) => {
  let t = (seed + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
/** Piecewise key interpolation: keys [[t, v], ...] with ease between keys. */
export const keys = (t: number, k: [number, number][], ease: (x: number) => number = smooth) => {
  if (t <= k[0][0]) return k[0][1];
  for (let i = 0; i < k.length - 1; i++) if (t <= k[i + 1][0]) return lerp(k[i][1], k[i + 1][1], ease((t - k[i][0]) / (k[i + 1][0] - k[i][0])));
  return k[k.length - 1][1];
};

// ---------------------------------------------------------------- scene wrapper
export const Scene: React.FC<{bg?: string; children: React.ReactNode; over?: React.ReactNode}> = ({bg = C.paper, children, over}) => (
  <div style={{position: 'absolute', inset: 0, background: bg, overflow: 'hidden'}}>
    <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}>{children}</svg>
    {over}
  </div>
);
/** A world layer under the camera (p < 1 = farther plane, moves less). */
export const Layer: React.FC<{cam: Cam; p?: number; children: React.ReactNode; opacity?: number}> = ({cam, p = 1, children, opacity}) => (
  <g transform={camT(cam, p)} opacity={opacity}>{children}</g>
);

/** Robot drawn in a world layer (ink stays ~4 px on screen at any zoom). */
export const Bot: React.FC<Omit<RobotProps, 'px'> & {cam: Cam}> = ({cam, s = 1, ...rest}) => <Robot2D {...rest} s={s} px={s * cam.z} />;

/** A crew member (channel cast) standing with feet at (x, y) in world units, height h (world px ≈ 440·k). */
export const Crew: React.FC<{look: Look; pose: CPose; x: number; y: number; h?: number; frame: number; seed?: number; flip?: boolean; holdL?: React.ReactNode; holdR?: React.ReactNode; shadow?: boolean; life?: number; front?: 'L' | 'R' | 'none'}> =
  ({look, pose, x, y, h = 420, frame, seed = 1, flip, holdL, holdR, shadow = true, life, front}) => {
    const k = h / 440;
    return (
      <g transform={`translate(${x - 200 * k} ${y - 500 * k}) scale(${k})`}>
        <Character look={look} pose={pose} frame={frame} seed={seed} flip={flip} holdL={holdL} holdR={holdR} shadow={shadow} life={life} front={front} />
      </g>
    );
  };

/** Arm angles that put a crew member's hand on a world point (handles `flip`). */
export const crewReach = (c: {x: number; y: number; h: number; flip?: boolean}, side: -1 | 1, wx: number, wy: number, elbow: 1 | -1 = 1): CArm =>
  reach({x: c.x, y: c.y, scale: c.h / 440}, side, c.flip ? 2 * c.x - wx : wx, wy, elbow);
/** World position of a crew member's hand for an arm pose. */
export const crewHand = (c: {x: number; y: number; h: number; flip?: boolean}, arm: CArm, side: -1 | 1) => {
  const p = handWorld({x: c.x, y: c.y, scale: c.h / 440}, arm, side);
  return {x: c.flip ? 2 * c.x - p.x : p.x, y: p.y};
};

export {Robot2D};
export type {RPose};

// ---------------------------------------------------------------- screen-space typography
export const Chip: React.FC<{x: number; y: number; lines: string[]; k: number; tone?: 'ink' | 'paper' | 'blue' | 'teal'; size?: number; anchor?: 'left' | 'right'}> = ({x, y, lines, k, tone = 'ink', size = 36, anchor = 'left'}) => {
  if (k <= 0) return null;
  const e = easeOut(k);
  const pal = tone === 'ink' ? {bg: '#162A32', fg: '#FAF3DF', bd: '#0B171C'} : tone === 'blue' ? {bg: '#3A5FA0', fg: '#FFFFFF', bd: '#24406F'} : tone === 'teal' ? {bg: C.teal, fg: '#FFFFFF', bd: C.tealDeep} : {bg: C.paper, fg: C.ink, bd: C.ink};
  return (
    <div style={{position: 'absolute', left: anchor === 'left' ? x : undefined, right: anchor === 'right' ? 1920 - x : undefined, top: y, opacity: Math.min(1, k * 2.5),
      transform: `translateY(${(1 - e) * 22}px)`, background: pal.bg, color: pal.fg, border: `3px solid ${pal.bd}`, borderRadius: 14,
      padding: '12px 24px', fontFamily: F.body, fontWeight: 800, fontSize: size, lineHeight: 1.22, whiteSpace: 'nowrap', boxShadow: '0 6px 0 rgba(0,0,0,0.22)'}}>
      {lines.map((l, i) => <div key={i} style={i > 0 ? {fontWeight: 700, fontSize: size * 0.8, opacity: 0.88} : undefined}>{l}</div>)}
    </div>
  );
};
/** Big title label (model names etc.). */
export const Title: React.FC<{x: number; y: number; big: string; small?: string; k: number; color?: string; accent?: string; align?: 'left' | 'center'}> = ({x, y, big, small, k, color = C.ink, accent = C.saffron, align = 'left'}) => {
  if (k <= 0) return null;
  const e = easeOut(k);
  return (
    <div style={{position: 'absolute', left: align === 'left' ? x : x - 600, width: align === 'left' ? undefined : 1200, top: y, textAlign: align, opacity: Math.min(1, k * 2), transform: `translateX(${align === 'left' ? (1 - e) * -40 : 0}px)`}}>
      <div style={{fontFamily: F.display, fontWeight: 700, fontSize: 104, color, lineHeight: 1}}>{big}</div>
      {small ? <div style={{fontFamily: F.body, fontWeight: 800, fontSize: 40, color, opacity: 0.8, marginTop: 8}}>{small}</div> : null}
      <div style={{width: 120 * e, height: 8, background: accent, borderRadius: 4, marginTop: 14, marginLeft: align === 'center' ? 'auto' : 0, marginRight: align === 'center' ? 'auto' : 0}} />
    </div>
  );
};
/** A small world-anchored tag with a leader line (SVG; give screen coords). */
export const Tag: React.FC<{ax: number; ay: number; x: number; y: number; text: string; k: number; color?: string; size?: number}> = ({ax, ay, x, y, text, k, color = C.ink, size = 34}) => {
  if (k <= 0) return null;
  const w = text.length * size * 0.56 + 36;
  return (
    <g opacity={Math.min(1, k * 2)}>
      <line x1={ax} y1={ay} x2={lerp(ax, x, easeOut(k))} y2={lerp(ay, y, easeOut(k))} stroke={color} strokeWidth={4} strokeLinecap="round" />
      <circle cx={ax} cy={ay} r={7} fill={color} />
      <g transform={`translate(${x} ${y}) scale(${0.7 + 0.3 * easeOut(k)})`}>
        <rect x={0} y={-size * 0.95} width={w} height={size * 1.6} rx={12} fill={C.paper} stroke={color} strokeWidth={4} />
        <text x={18} y={size * 0.28} fontFamily={F.body} fontWeight={800} fontSize={size} fill={C.ink}>{text}</text>
      </g>
    </g>
  );
};
