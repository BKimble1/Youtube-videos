import React from 'react';
import {C, OUTLINE} from '../theme';

/**
 * Layered cutout hand rig (SVG). Hand-local coordinates, palm centre = (0,0), y down, screen angles in degrees
 * (0 = +x, 90 = +y, -90 = up). Every digit is a 3-segment chain pivoting from a real parent joint on the palm.
 * Poses are absolute segment angles (+ optional `flex`, a foreshortening angle for a curl toward the viewer).
 * Objects attach to fingertip points computed by the same FK, so held objects never float.
 *
 * Two body kinds share one rig: the simplified four-digit robot hand (thumb + three fingers, NO pinky; a ghost
 * outline can mark the human expectation) and a five-digit human hand used only for the illustrative taped-finger
 * reenactment. Two views: 'front' (palm facing the viewer) and 'side' (profile, hand pointing right).
 */
export type V = {x: number; y: number};
export const rad = (d: number) => (d * Math.PI) / 180;
export const deg = (r: number) => (r * 180) / Math.PI;

export type DigitName = 'thumb' | 'index' | 'middle' | 'ring' | 'pinky';
export type DigitDef = {bx: number; by: number; len: [number, number, number]; w: number; dx?: number; dy?: number};
export type DigitPose = {ang: [number, number, number]; flex?: [number, number, number]};
export type HandPose = Partial<Record<DigitName, DigitPose>>;
export type Kind = 'robot' | 'human';
export type View = 'front' | 'side';

type Layout = {palm: string; digits: Partial<Record<DigitName, DigitDef>>; order: DigitName[]; rest: Record<DigitName, DigitPose>};

const rest = (a: number, b?: number, c?: number): DigitPose => ({ang: [a, b ?? a, c ?? b ?? a]});

export const LAYOUTS: Record<`${Kind}-${View}`, Layout> = {
  'robot-front': {
    palm: 'M -112 -58 Q -112 -92 -78 -92 L 62 -92 Q 90 -92 104 -72 Q 116 -50 114 -22 L 114 70 Q 114 112 72 112 L -72 112 Q -112 112 -112 70 Z',
    digits: {
      thumb: {bx: -96, by: 46, len: [62, 52, 46], w: 50},
      index: {bx: -76, by: -80, len: [60, 44, 40], w: 46},
      middle: {bx: 0, by: -88, len: [66, 48, 46], w: 46},
      ring: {bx: 74, by: -80, len: [60, 44, 40], w: 46},
    },
    order: ['ring', 'middle', 'index', 'thumb'],
    rest: {thumb: rest(-148, -146, -140), index: rest(-96, -94, -92), middle: rest(-90), ring: rest(-84, -86, -88), pinky: rest(-80)},
  },
  'robot-side': {
    palm: 'M -118 -60 Q -118 -86 -92 -86 L 24 -86 Q 52 -86 52 -58 L 52 52 Q 52 84 22 84 L -92 84 Q -118 84 -118 58 Z',
    digits: {
      thumb: {bx: 18, by: 48, len: [62, 52, 46], w: 48},
      index: {bx: 42, by: -46, len: [60, 44, 40], w: 44},
      middle: {bx: 42, by: -46, len: [66, 48, 46], w: 44, dx: 14, dy: -15},
      ring: {bx: 42, by: -46, len: [60, 44, 40], w: 44, dx: 28, dy: -30},
    },
    order: ['ring', 'middle', 'index', 'thumb'],
    rest: {thumb: rest(14, 6, 0), index: rest(4, 6, 8), middle: rest(4, 6, 8), ring: rest(4, 6, 8), pinky: rest(0)},
  },
  'human-front': {
    palm: 'M -98 -66 Q -98 -84 -70 -84 L 70 -84 Q 98 -84 98 -60 L 98 70 Q 98 110 58 110 L -58 110 Q -98 110 -98 70 Z',
    digits: {
      thumb: {bx: -84, by: 48, len: [56, 46, 40], w: 38},
      index: {bx: -68, by: -72, len: [58, 38, 32], w: 34},
      middle: {bx: -22, by: -80, len: [64, 42, 34], w: 34},
      ring: {bx: 24, by: -76, len: [58, 40, 32], w: 34},
      pinky: {bx: 68, by: -62, len: [44, 30, 26], w: 30},
    },
    order: ['pinky', 'ring', 'middle', 'index', 'thumb'],
    rest: {thumb: rest(-150, -146, -140), index: rest(-98, -96, -94), middle: rest(-92), ring: rest(-84, -84, -86), pinky: rest(-74, -72, -72)},
  },
  'human-side': {
    palm: 'M -112 -54 Q -112 -76 -88 -76 L 22 -76 Q 46 -76 46 -50 L 46 50 Q 46 80 20 80 L -88 80 Q -112 80 -112 56 Z',
    digits: {
      thumb: {bx: 12, by: 44, len: [56, 46, 40], w: 38},
      index: {bx: 38, by: -44, len: [58, 38, 32], w: 34},
      middle: {bx: 38, by: -44, len: [64, 42, 34], w: 34, dx: 10, dy: 9},
      ring: {bx: 38, by: -44, len: [58, 40, 32], w: 34, dx: 18, dy: 18},
      pinky: {bx: 38, by: -44, len: [44, 30, 26], w: 30, dx: 26, dy: 27},
    },
    order: ['thumb', 'index', 'middle', 'ring', 'pinky'],
    rest: {thumb: rest(20, 12, 6), index: rest(4, 6, 8), middle: rest(4, 6, 8), ring: rest(4, 6, 8), pinky: rest(4, 6, 8)},
  },
};

export const defOf = (kind: Kind, view: View, n: DigitName): DigitDef | undefined => LAYOUTS[`${kind}-${view}`].digits[n];

/** FK: joint points [base, j1, j2, tip] of a digit in hand-local coords. */
export const digitPts = (d: DigitDef, p: DigitPose): V[] => {
  const pts: V[] = [{x: d.bx + (d.dx ?? 0), y: d.by + (d.dy ?? 0)}];
  let fl = 0;
  for (let i = 0; i < 3; i++) {
    fl += p.flex?.[i] ?? 0;
    const L = d.len[i] * Math.cos(rad(Math.min(78, fl)));
    const a = rad(p.ang[i]);
    const q = pts[i];
    pts.push({x: q.x + L * Math.cos(a), y: q.y + L * Math.sin(a)});
  }
  return pts;
};

/**
 * Inverse kinematics for one digit: put the tip on `target` (hand-local) with the distal segment pointing at
 * `distalDeg`. elbow = -1 bulges the middle joint to the dorsal (up, for a finger curling down) side, +1 the other.
 */
export const ikDigit = (d: DigitDef, target: V, distalDeg: number, elbow: 1 | -1): DigitPose => {
  const [L1, L2, L3] = d.len;
  const a3 = rad(distalDeg);
  const base = {x: d.bx + (d.dx ?? 0), y: d.by + (d.dy ?? 0)};
  const q = {x: target.x - L3 * Math.cos(a3), y: target.y - L3 * Math.sin(a3)};
  const dx = q.x - base.x;
  const dy = q.y - base.y;
  const dist = Math.min(L1 + L2 - 0.5, Math.max(Math.abs(L1 - L2) + 0.5, Math.hypot(dx, dy)));
  const a = Math.atan2(dy, dx);
  const g = Math.acos(Math.max(-1, Math.min(1, (L1 * L1 + dist * dist - L2 * L2) / (2 * L1 * dist))));
  const t1 = a + elbow * g;
  const e = {x: base.x + L1 * Math.cos(t1), y: base.y + L1 * Math.sin(t1)};
  const t2 = Math.atan2(q.y - e.y, q.x - e.x);
  return {ang: [deg(t1), deg(t2), distalDeg]};
};

const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
export const mix = (a: string, b: string, t: number) => {
  const A = hex(a), B = hex(b);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
};

type Look = {body: string; pad: string; palm: string; cuff: string; dot: string};
const ROBOT: Look = {body: C.teal, pad: C.tealDeep, palm: C.teal, cuff: C.blue, dot: C.saffron};
const HUMAN: Look = {body: '#F0C8A8', pad: '#E2AE8A', palm: '#F0C8A8', cuff: C.blueLight, dot: '#E2AE8A'};


/** Outline path (closed) of a round-capped capsule swept along a polyline, for dashed "ghost" digits. */
export const capsulePath = (pts: V[], w: number): string => {
  const r = w / 2;
  const n = pts.length;
  const norm = (i: number): V => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    const dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1;
    return {x: -dy / l, y: dx / l};
  };
  const left = pts.map((p, i) => ({x: p.x + norm(i).x * r, y: p.y + norm(i).y * r}));
  const right = pts.map((p, i) => ({x: p.x - norm(i).x * r, y: p.y - norm(i).y * r}));
  const L = left.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`);
  const R = right.reverse().map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`);
  return `M ${L[0]} L ${L.slice(1).join(' L ')} A ${r} ${r} 0 0 0 ${R[0]} L ${R.slice(1).join(' L ')} Z`;
};

const polyStr = (pts: V[]) => pts.map((p) => `${p.x},${p.y}`).join(' ');

const Digit: React.FC<{def: DigitDef; pose: DigitPose; kind: Kind; shade?: number; hl?: number}> = ({def, pose, kind, shade = 0, hl = 0}) => {
  const L = kind === 'robot' ? ROBOT : HUMAN;
  const pts = digitPts(def, pose);
  const body = shade ? mix(L.body, C.ink, shade) : L.body;
  const pad = shade ? mix(L.pad, C.ink, shade) : L.pad;
  const w = def.w;
  return (
    <g strokeLinecap="round" strokeLinejoin="round" fill="none">
      <polyline points={polyStr(pts)} stroke={C.ink} strokeWidth={w + OUTLINE * 2} />
      <polyline points={polyStr(pts)} stroke={body} strokeWidth={w} />
      {hl > 0 && <polyline points={polyStr(pts)} stroke={C.saffron} strokeWidth={w + 12} opacity={hl * 0.9} style={{mixBlendMode: 'normal'}} />}
      {hl > 0 && <polyline points={polyStr(pts)} stroke={body} strokeWidth={w} />}
      <polyline points={polyStr([pts[2], pts[3]])} stroke={pad} strokeWidth={w - 2} />
      <polyline points={polyStr([pts[0], pts[1]])} stroke={mix(body, '#FFFFFF', 0.22)} strokeWidth={Math.max(6, w * 0.18)} transform={`translate(${-w * 0.2} 0)`} opacity={0.55} />
      {kind === 'robot' ? (
        <>
          {[pts[1], pts[2]].map((p, i) =>
            Math.hypot(pts[i + 2].x - p.x, pts[i + 2].y - p.y) > 20 ? <circle key={i} cx={p.x} cy={p.y} r={w * 0.17} fill={L.dot} stroke={C.ink} strokeWidth={3} /> : null,
          )}
          <circle cx={pts[0].x} cy={pts[0].y} r={w * 0.5} fill={C.tealDeep} stroke={C.ink} strokeWidth={OUTLINE} />
          <circle cx={pts[0].x} cy={pts[0].y} r={w * 0.17} fill={L.dot} stroke={C.ink} strokeWidth={3} />
        </>
      ) : (
        <>
          {[pts[1], pts[2]].map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={2.6} fill={L.dot} opacity={0.6} />
          ))}
          <ellipse cx={pts[3].x} cy={pts[3].y} rx={w * 0.2} ry={w * 0.15} fill="none" />
        </>
      )}
    </g>
  );
};

export type HandProps = {
  kind?: Kind;
  view?: View;
  x: number;
  y: number;
  scale?: number;
  /** rotation of the whole hand about its palm centre, degrees (side view: 90 = fingers pointing down) */
  rot?: number;
  flip?: boolean; // mirror horizontally (before rotation)
  pose?: HandPose;
  /** hide digits (e.g. robot hand never gets a pinky) */
  highlight?: Partial<Record<DigitName, number>>;
  /** forearm: 'stand' = vertical tube down to world y; {to} = tube running to a world point (side view) */
  forearm?: {stand: number} | {to: V} | null;
  /** ghost pinky outline (human expectation) at 0..1 opacity, front robot view only */
  ghostPinky?: number;
  /** extra palm tint pulse 0..1 */
  pulse?: number;
  children?: React.ReactNode; // drawn inside hand-local space, above the palm, below the digits
  front?: React.ReactNode; // drawn above the digits
};

export const GHOST_PINKY: DigitDef = {bx: 108, by: -44, len: [48, 36, 32], w: 44};

export const Hand: React.FC<HandProps> = ({kind = 'robot', view = 'front', x, y, scale = 1, rot = 0, flip = false, pose = {}, highlight = {}, forearm = null, ghostPinky = 0, pulse = 0, children, front}) => {
  const lay = LAYOUTS[`${kind}-${view}`];
  const look = kind === 'robot' ? ROBOT : HUMAN;
  const poseOf = (n: DigitName) => pose[n] ?? lay.rest[n];
  const side = view === 'side';
  const cuff = side ? {x: -146, y: -66, w: 30, h: 136} : {x: kind === 'robot' ? -86 : -76, y: 108, w: kind === 'robot' ? 172 : 152, h: 40};
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${flip ? -scale : scale} ${scale})`}>
      {/* forearm / stand (behind everything) */}
      {forearm && 'stand' in forearm && (
        <g>
          <rect x={kind === 'robot' ? -58 : -52} y={140} width={kind === 'robot' ? 116 : 104} height={Math.max(20, (forearm.stand - y) / scale - 140)} fill={kind === 'robot' ? C.inkSoft : look.body} stroke={C.ink} strokeWidth={OUTLINE} />
          <rect x={kind === 'robot' ? -58 : -52} y={140} width={kind === 'robot' ? 116 : 104} height={14} fill={C.ink} opacity={0.25} />
          {kind === 'robot' && (
            <>
              <ellipse cx={0} cy={(forearm.stand - y) / scale} rx={118} ry={24} fill={C.shadow} />
              <rect x={-100} y={(forearm.stand - y) / scale - 26} width={200} height={26} rx={12} fill={C.blueDeep} stroke={C.ink} strokeWidth={OUTLINE} />
            </>
          )}
        </g>
      )}
      {forearm && 'to' in forearm && (() => {
        const lp = toLocal(forearm.to.x, forearm.to.y, x, y, scale, rot, flip);
        const sx = lp.x, sy = lp.y;
        return (
          <g strokeLinecap="round" fill="none">
            <line x1={cuff.x - 10} y1={4} x2={sx} y2={sy} stroke={C.ink} strokeWidth={(kind === 'robot' ? 84 : 104) + OUTLINE * 2} />
            <line x1={cuff.x - 10} y1={4} x2={sx} y2={sy} stroke={kind === 'robot' ? C.inkSoft : C.blue} strokeWidth={kind === 'robot' ? 84 : 104} />
            <line x1={cuff.x - 10} y1={-26} x2={sx} y2={sy - 30} stroke={mix(C.inkSoft, '#FFFFFF', 0.18)} strokeWidth={10} opacity={0.6} />
          </g>
        );
      })()}
      {/* ghost pinky: dashed outline of the digit a human hand would have; not hardware */}
      {kind === 'robot' && view === 'front' && ghostPinky > 0 && (
        <g opacity={ghostPinky}>
          <path d={capsulePath(digitPts(GHOST_PINKY, rest(-60, -56, -54)), GHOST_PINKY.w)} fill={C.white} fillOpacity={0.55} stroke={C.ink} strokeWidth={5} strokeDasharray="14 10" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
      {/* cuff */}
      <rect x={cuff.x} y={cuff.y} width={cuff.w} height={cuff.h} rx={side ? 12 : 14} fill={look.cuff} stroke={C.ink} strokeWidth={OUTLINE} />
      {/* palm */}
      <path d={lay.palm} fill={mix(look.palm, '#FFFFFF', pulse * 0.35)} stroke={C.ink} strokeWidth={OUTLINE} strokeLinejoin="round" />
      {kind === 'robot' && !side && (
        <g>
          <path d="M -86 66 L 86 66" stroke={C.ink} strokeWidth={3} opacity={0.5} strokeLinecap="round" />
          <circle cx={0} cy={20} r={25} fill={C.tealLight} stroke={C.ink} strokeWidth={OUTLINE - 1} />
          <circle cx={0} cy={20} r={11} fill={C.cream} stroke={C.ink} strokeWidth={3} />
        </g>
      )}
      {kind === 'robot' && side && (
        <g>
          <path d="M -96 62 L 30 62" stroke={C.ink} strokeWidth={3} opacity={0.5} strokeLinecap="round" />
          <circle cx={-34} cy={8} r={22} fill={C.tealLight} stroke={C.ink} strokeWidth={OUTLINE - 1} />
          <circle cx={-34} cy={8} r={9} fill={C.cream} stroke={C.ink} strokeWidth={3} />
        </g>
      )}
      {kind === 'human' && !side && <path d="M -60 40 Q -10 62 44 36" stroke={C.ink} strokeWidth={3} opacity={0.28} fill="none" strokeLinecap="round" />}
      {children}
      {/* digits, back to front */}
      {lay.order.map((n) => {
        const d = lay.digits[n];
        if (!d) return null;
        const far = side && n !== 'thumb' ? (n === 'index' ? 0 : n === 'middle' ? (kind === 'robot' ? 0.14 : 0.08) : n === 'ring' ? (kind === 'robot' ? 0.26 : 0.16) : 0.22) : 0;
        return <Digit key={n} def={d} pose={poseOf(n)} kind={kind} shade={far} hl={highlight[n] ?? 0} />;
      })}
      {front}
    </g>
  );
};

/** hand-local -> world (rotation, mirror, scale about the palm centre). */
export const toWorld = (p: V, x: number, y: number, scale: number, rot = 0, flip = false): V => {
  const lx = (flip ? -1 : 1) * p.x * scale, ly = p.y * scale;
  const c = Math.cos(rad(rot)), sn = Math.sin(rad(rot));
  return {x: x + lx * c - ly * sn, y: y + lx * sn + ly * c};
};

/** world -> hand-local (for IK targets). */
export const toLocal = (wx: number, wy: number, x: number, y: number, scale: number, rot = 0, flip = false): V => {
  const dx = wx - x, dy = wy - y;
  const c = Math.cos(rad(-rot)), sn = Math.sin(rad(-rot));
  const lx = (dx * c - dy * sn) / scale, ly = (dx * sn + dy * c) / scale;
  return {x: flip ? -lx : lx, y: ly};
};

export type Place = {x: number; y: number; scale: number; rot?: number; flip?: boolean};

/** Fingertip (distal end) in WORLD coords. */
export const tipWorld = (kind: Kind, view: View, n: DigitName, pose: HandPose, pl: Place): V => {
  const lay = LAYOUTS[`${kind}-${view}`];
  const p = digitPts(lay.digits[n]!, pose[n] ?? lay.rest[n])[3];
  return toWorld(p, pl.x, pl.y, pl.scale, pl.rot, pl.flip);
};

/** Joint chain in WORLD coords. */
export const ptsWorld = (kind: Kind, view: View, n: DigitName, pose: HandPose, pl: Place): V[] => {
  const lay = LAYOUTS[`${kind}-${view}`];
  return digitPts(lay.digits[n]!, pose[n] ?? lay.rest[n]).map((p) => toWorld(p, pl.x, pl.y, pl.scale, pl.rot, pl.flip));
};
