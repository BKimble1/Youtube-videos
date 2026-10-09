import React from 'react';
import {C, F, OUTLINE} from '../../theme';
import {CAST} from '../cast';

/**
 * V5 / V6 parts (group G3). Screen-space pieces shared by the delay-to-place explanation (V5) and the real U board (V6):
 *
 *  - Pointer:  the checker's long wooden pointer, held in her mitt, her coral-cardigan sleeve entering from the frame
 *              edge (the researcher points at the result; she is not drawn on real-data boards, only her arm and prop,
 *              as in V4.3). Anticipation (a small pull back), contact (the tip meets the target on `hit`, a short
 *              press), settle and retract are computed by `pointerAt`.
 *  - Chip40:   the guard-rail chip set at 40 px (the shot plan asks for "simplified picture · sends and listens at one
 *              spot" at 40; the kit Chip warns outside 30–34 px). Same look as the kit Chip: ink on cream, 3 px outline.
 *  - TapRing:  the small contact ring where a pointer tip touches.
 *
 * All pure functions of their props.
 */

const f2 = (n: number) => Math.round(n * 100) / 100;
const clamp01 = (v: number) => (v <= 0 ? 0 : v >= 1 ? 1 : v);

/* ------------------------------------------------------------------ pointer */

export type PointerPose = {
  /** where the tip is (screen px) */
  tip: {x: number; y: number};
  /** unit vector from the tip back toward the hand (and on out of frame) */
  back: {x: number; y: number};
  /** 0..1 how far the press is into contact (squash of the mitt, a tap ring) */
  press: number;
  /** false when the whole assembly is off screen */
  on: boolean;
};

/**
 * Pose of a pointer that pokes `target` at frame `hit`, entering along `dir` (unit vector from the target toward the
 * hand, i.e. where the arm comes from) from `travel` px further out.
 *   in:   [hit - inDur - 4, hit - 4]  eased in, stopping 26 px short (anticipation hover, a small pull back)
 *   poke: [hit - 4, hit]             accelerates onto the target (contact on `hit`)
 *   hold: [hit, hit + hold]          press 1 → settles
 *   out:  [hit + hold, + outDur]     eases back out of frame
 */
export const pointerAt = (
  g: number,
  o: {target: {x: number; y: number}; dir: {x: number; y: number}; hit: number; travel?: number; inDur?: number; hold?: number; outDur?: number},
): PointerPose => {
  const travel = o.travel ?? 900;
  const inDur = o.inDur ?? 14;
  const hold = o.hold ?? 14;
  const outDur = o.outDur ?? 14;
  const t0 = o.hit - inDur - 4;
  const t1 = o.hit - 4;
  const t2 = o.hit;
  const t3 = o.hit + hold;
  const t4 = t3 + outDur;
  const n = Math.hypot(o.dir.x, o.dir.y) || 1;
  const d = {x: o.dir.x / n, y: o.dir.y / n};
  let off: number; // px from the target, along d
  let press = 0;
  if (g < t0 || g > t4) return {tip: o.target, back: d, press: 0, on: false};
  if (g < t1) {
    const u = (g - t0) / (t1 - t0);
    const e = 1 - Math.pow(1 - u, 3); // ease out
    off = travel + (26 - travel) * e;
    // the last third: a small pull back (anticipation) before the poke
    off += 10 * Math.sin(Math.PI * clamp01((u - 0.66) / 0.34));
  } else if (g < t2) {
    const u = (g - t1) / (t2 - t1);
    off = 26 * (1 - u * u);
  } else if (g <= t3) {
    const u = (g - t2) / Math.max(1, t3 - t2);
    off = -4 * Math.sin(Math.PI * clamp01(u * 3)) * (u < 0.34 ? 1 : 0); // a 4 px press into the target, then rest
    press = u < 0.34 ? Math.sin(Math.PI * clamp01(u * 3)) : 0;
  } else {
    const u = (g - t3) / outDur;
    off = travel * u * u * u;
  }
  return {tip: {x: o.target.x + d.x * off, y: o.target.y + d.y * off}, back: d, press, on: true};
};

/**
 * The pointer itself: a wooden stick `stick` px long from the tip to the mitt, the mitt (skin, ink outline, a thumb
 * over the stick), a cream cuff and the coral cardigan sleeve running on out of frame.
 */
export const Pointer: React.FC<{pose: PointerPose; stick?: number; scale?: number}> = ({pose, stick = 330, scale = 1}) => {
  if (!pose.on) return null;
  const {tip, back} = pose;
  const s = scale;
  const hand = {x: tip.x + back.x * stick * s, y: tip.y + back.y * stick * s};
  const sleeveEnd = {x: hand.x + back.x * 1400, y: hand.y + back.y * 1400};
  const cuff0 = {x: hand.x + back.x * 34 * s, y: hand.y + back.y * 34 * s};
  const cuff1 = {x: hand.x + back.x * 58 * s, y: hand.y + back.y * 58 * s};
  const ang = (Math.atan2(-back.y, -back.x) * 180) / Math.PI; // the stick's direction (hand → tip)
  const skin = CAST.checker.skin;
  const sq = 1 - 0.08 * pose.press;
  const line = (a: {x: number; y: number}, b: {x: number; y: number}, w: number, col: string, cap: 'round' | 'butt' = 'round') => (
    <line x1={f2(a.x)} y1={f2(a.y)} x2={f2(b.x)} y2={f2(b.y)} stroke={col} strokeWidth={w} strokeLinecap={cap} />
  );
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none'}}>
      {/* hard shadow (flat, offset) */}
      <g opacity={0.9} transform="translate(8 10)">
        {line(tip, hand, 14 * s, C.shadow)}
        {line(cuff1, sleeveEnd, 64 * s, C.shadow)}
      </g>
      {/* the stick: ink outline, wood, a dark tip cap */}
      {line(tip, hand, 14 * s + OUTLINE * 2 - 1, C.ink)}
      {line(tip, hand, 14 * s - 1, C.woodLight)}
      {line(tip, {x: tip.x + back.x * 18 * s, y: tip.y + back.y * 18 * s}, 14 * s - 1, C.coralDeep)}
      {/* sleeve and cuff */}
      {line(cuff1, sleeveEnd, 64 * s + OUTLINE * 2, C.ink)}
      {line(cuff1, sleeveEnd, 64 * s, C.coral)}
      {line(cuff0, cuff1, 58 * s + OUTLINE * 2, C.ink, 'butt')}
      {line(cuff0, cuff1, 58 * s, C.cream, 'butt')}
      {/* the mitt round the stick, a thumb over it */}
      <g transform={`translate(${f2(hand.x)} ${f2(hand.y)}) rotate(${f2(ang)}) scale(${f2(s * sq)} ${f2(s * (2 - sq))})`}>
        <ellipse cx={-6} cy={0} rx={34} ry={28} fill={skin} stroke={C.ink} strokeWidth={OUTLINE} />
        <path d="M 4 -14 Q 26 -24 34 -8 Q 30 2 12 0" fill={skin} stroke={C.ink} strokeWidth={OUTLINE} strokeLinejoin="round" />
      </g>
    </svg>
  );
};

/** A small contact ring at a pointer tip: grows and fades over `t` 0..1 (start it on the contact frame). */
export const TapRing: React.FC<{x: number; y: number; t: number; r?: number; color?: string}> = ({x, y, t, r = 30, color = C.ink}) => {
  if (t <= 0 || t >= 1) return null;
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none'}}>
      <circle cx={f2(x)} cy={f2(y)} r={f2(8 + r * (1 - Math.pow(1 - t, 2)))} fill="none" stroke={color} strokeWidth={f2(5 * (1 - 0.6 * t))} opacity={f2(1 - t)} />
    </svg>
  );
};

/* ------------------------------------------------------------------ 40 px chip */

/** The kit chip's look (ink on cream, 3 px ink outline, Nunito 800) at 40 px; `maxWidth` wraps it into a rounded box. */
export const Chip40: React.FC<{children: React.ReactNode; x: number; y: number; anchor?: 'start' | 'end'; opacity?: number; maxWidth?: number; size?: number}> = ({children, x, y, anchor = 'start', opacity = 1, maxWidth, size = 40}) => {
  if (opacity <= 0.001) return null;
  const wrap = maxWidth !== undefined;
  return (
    <div
      style={{
        position: 'absolute',
        left: f2(x),
        top: f2(y),
        transform: anchor === 'end' ? 'translate(-100%, 0)' : undefined,
        opacity: clamp01(opacity),
        boxSizing: 'border-box',
        maxWidth: wrap ? maxWidth : undefined,
        width: wrap ? 'max-content' : undefined,
        padding: wrap ? `${f2(size * 0.36)}px ${f2(size * 0.6)}px ${f2(size * 0.42)}px` : `${f2(size * 0.28)}px ${f2(size * 0.62)}px ${f2(size * 0.32)}px`,
        borderRadius: wrap ? Math.round(size * 0.6) : 999,
        background: C.cream,
        color: C.ink,
        border: `3px solid ${C.ink}`,
        fontFamily: F.body,
        fontWeight: 800,
        fontSize: size,
        lineHeight: wrap ? 1.18 : 1,
        whiteSpace: wrap ? 'normal' : 'nowrap',
        textAlign: anchor === 'end' && wrap ? 'right' : 'left',
      }}
    >
      {children}
    </div>
  );
};
