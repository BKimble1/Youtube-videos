// Companion v2 shared kit: cue lookup on the placed narration, a world camera, arrows, labels and the evidence tag.
import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import data from '../data/companion2_words.json';
import {C, F} from '../theme';
import {E} from '../lib/motion';

export {E};
export const FPS = 30;
export const words = data.words as {w: string; s: number; e: number; p: string}[];
const norm = (s: string) => s.replace(/[.,?!…]+$/, '').toLowerCase();

/** Start time (film seconds) of the n-th occurrence of `w` within phrase `p` (or anywhere if p is omitted). */
export const cue = (w: string, p?: string, n = 0, end = false): number => {
  const hits = words.filter((x) => norm(x.w) === norm(w) && (!p || x.p === p));
  if (!hits[n]) throw new Error(`cue not found: ${w} ${p ?? ''} ${n}`);
  return end ? hits[n].e : hits[n].s;
};
export const phrase = (p: string) => {
  const ws = words.filter((x) => x.p === p);
  return {s: ws[0].s, e: ws[ws.length - 1].e};
};

/** Global film time inside a Sequence that started at `start` seconds. */
export const useT = (start: number) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return start + frame / fps;
};

export const clamp = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};
/** 0→1 between a and b with an ease. */
export const ramp = (t: number, a: number, b: number, ease: (x: number) => number = E.inOut) =>
  interpolate(t, [a, Math.max(a + 1e-3, b)], [0, 1], {...clamp, easing: ease});
/** Keyframed value over film time: keys [t, v] (ease applies to the segment arriving at the key). */
export const track = (t: number, keys: [number, number, ((x: number) => number)?][]) => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1, e] = keys[i];
    const [t0, v0] = keys[i - 1];
    if (t <= t1) return v0 + (v1 - v0) * ramp(t, t0, t1, e ?? E.inOut);
  }
  return keys[keys.length - 1][1];
};
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

export type Cam = {x: number; y: number; z: number; r?: number};
export const camTrack = (t: number, keys: [number, Cam, ((x: number) => number)?][]): Cam => {
  // zoom interpolated in log space so pushes feel even
  const xs = keys.map(([k, c, e]) => [k, c.x, e] as [number, number, ((x: number) => number)?]);
  const ys = keys.map(([k, c, e]) => [k, c.y, e] as [number, number, ((x: number) => number)?]);
  const zs = keys.map(([k, c, e]) => [k, Math.log(c.z), e] as [number, number, ((x: number) => number)?]);
  const rs = keys.map(([k, c, e]) => [k, c.r ?? 0, e] as [number, number, ((x: number) => number)?]);
  return {x: track(t, xs), y: track(t, ys), z: Math.exp(track(t, zs)), r: track(t, rs)};
};

/** World layer: children are laid out in world coordinates; the camera puts (cam.x, cam.y) at the frame centre. */
export const World: React.FC<{cam: Cam; children: React.ReactNode; style?: React.CSSProperties}> = ({cam, children, style}) => (
  <AbsoluteFill style={{overflow: 'hidden', ...style}}>
    <div style={{position: 'absolute', left: 0, top: 0, width: 1, height: 1, transformOrigin: '0 0',
      transform: `translate(960px, 540px) rotate(${cam.r ?? 0}deg) scale(${cam.z}) translate(${-cam.x}px, ${-cam.y}px)`}}>
      {children}
    </div>
  </AbsoluteFill>
);
/** An SVG canvas in world coordinates (unbounded). */
export const WSvg: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <svg width={1} height={1} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', ...style}}>{children}</svg>
);
export const toScreen = (cam: Cam, x: number, y: number) => {
  const r = ((cam.r ?? 0) * Math.PI) / 180;
  const dx = (x - cam.x) * cam.z, dy = (y - cam.y) * cam.z;
  return {x: 960 + dx * Math.cos(r) - dy * Math.sin(r), y: 540 + dx * Math.sin(r) + dy * Math.cos(r)};
};

// Colour key used throughout: gas/air flow = blue, forces on the car = saffron, weight = ink.
export const FLOW = '#5B8FE0';
export const FLOW_LIGHT = '#BFD4F6';
export const FORCE = C.saffron;
export const WEIGHT = '#3A4A52';

/** A straight arrow from (x1,y1) to (x2,y2) with an ink outline. Width in the units of the surrounding SVG. */
export const Arrow: React.FC<{x1: number; y1: number; x2: number; y2: number; color: string; w?: number; head?: number; opacity?: number; outline?: number; dash?: string}> = ({x1, y1, x2, y2, color, w = 14, head, opacity = 1, outline, dash}) => {
  const L = Math.hypot(x2 - x1, y2 - y1);
  if (L < 0.5 || opacity <= 0) return null;
  const h = Math.min(head ?? w * 2.4, L * 0.6);
  const ux = (x2 - x1) / L, uy = (y2 - y1) / L;
  const bx = x2 - ux * h, by = y2 - uy * h;
  const px = -uy, py = ux;
  const hw = h * 0.62;
  const ow = outline ?? Math.max(2, w * 0.28);
  const shaft = `M ${x1} ${y1} L ${bx} ${by}`;
  const tip = `M ${x2} ${y2} L ${bx + px * hw} ${by + py * hw} L ${bx - px * hw} ${by - py * hw} Z`;
  return (
    <g opacity={opacity}>
      <path d={shaft} stroke={C.ink} strokeWidth={w + ow * 2} strokeLinecap="round" strokeDasharray={dash} fill="none" />
      <path d={tip} fill={C.ink} stroke={C.ink} strokeWidth={ow * 2} strokeLinejoin="round" />
      <path d={shaft} stroke={color} strokeWidth={w} strokeLinecap="round" strokeDasharray={dash} fill="none" />
      <path d={tip} fill={color} />
    </g>
  );
};

/** Curved rotation arrow (arc) centred at (cx, cy). */
export const ArcArrow: React.FC<{cx: number; cy: number; r: number; a0: number; a1: number; color?: string; w?: number; opacity?: number}> = ({cx, cy, r, a0, a1, color = C.ink, w = 10, opacity = 1}) => {
  if (opacity <= 0) return null;
  const rad = (d: number) => (d * Math.PI) / 180;
  const p = (a: number) => [cx + r * Math.cos(rad(a)), cy + r * Math.sin(rad(a))];
  const [x0, y0] = p(a0);
  const sweep = a1 > a0 ? 1 : 0;
  const end = a1 - Math.sign(a1 - a0) * Math.min(14, Math.abs(a1 - a0) * 0.3);
  const [xe, ye] = p(end);
  const [xt, yt] = p(a1);
  const large = Math.abs(end - a0) > 180 ? 1 : 0;
  return (
    <g opacity={opacity}>
      <path d={`M ${x0} ${y0} A ${r} ${r} 0 ${large} ${sweep} ${xe} ${ye}`} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" />
      <Arrow x1={xe} y1={ye} x2={xt} y2={yt} color={color} w={w} head={w * 2.6} outline={0.01} />
    </g>
  );
};

/** HTML label in screen space. */
export const Label: React.FC<{x: number; y: number; text: React.ReactNode; color?: string; bg?: string; size?: number; opacity?: number; align?: 'left' | 'center' | 'right'; border?: string; weight?: number; sub?: React.ReactNode}> = ({x, y, text, color = C.ink, bg = C.cream, size = 34, opacity = 1, align = 'center', border = C.ink, weight = 800, sub}) => {
  if (opacity <= 0) return null;
  const tx = align === 'center' ? '-50%' : align === 'right' ? '-100%' : '0';
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `translate(${tx}, -50%) scale(${0.92 + 0.08 * opacity})`, opacity, whiteSpace: 'nowrap', textAlign: align}}>
      <div style={{display: 'inline-block', fontFamily: F.body, fontWeight: weight, fontSize: size, color, background: bg, border: `3px solid ${border}`, borderRadius: size * 0.6, padding: `${size * 0.14}px ${size * 0.5}px`, lineHeight: 1.15}}>
        {text}
        {sub && <div style={{fontSize: size * 0.62, fontWeight: 700, opacity: 0.85}}>{sub}</div>}
      </div>
    </div>
  );
};

/** Evidence tag (top-left): what kind of material is on screen. */
export type TagKind = 'footage' | 'illustration' | 'claim' | 'notshown' | 'analogy';
const TAG: Record<TagKind, {label: string; bg: string; fg: string}> = {
  footage: {label: 'Tesla footage', bg: 'rgba(12,20,24,0.78)', fg: C.cream},
  illustration: {label: 'Simplified illustration', bg: C.cream, fg: C.ink},
  claim: {label: "Tesla's claim", bg: C.saffronLight, fg: C.ink},
  notshown: {label: 'Not shown in the demo', bg: C.coralLight, fg: C.ink},
  analogy: {label: 'Analogy', bg: C.cream, fg: C.ink},
};
export const Tag: React.FC<{kind: TagKind; text?: string; opacity?: number}> = ({kind, text, opacity = 1}) => {
  if (opacity <= 0) return null;
  const k = TAG[kind];
  return (
    <div style={{position: 'absolute', left: 48, top: 40, opacity}}>
      <span style={{fontFamily: F.body, fontWeight: 800, fontSize: 25, letterSpacing: 0.3, color: k.fg, background: k.bg, border: `2px solid ${kind === 'footage' ? 'rgba(255,251,240,0.5)' : C.ink}`, borderRadius: 18, padding: '5px 16px'}}>
        {text ?? k.label}
      </span>
    </div>
  );
};

/** Seeded random. */
export const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** 0 while a narration word is being spoken (with a small margin), rising to 1 in pauses: for ducking event sound. */
export const speechFree = (t: number, margin = 0.12, fade = 0.18) => {
  let d = Infinity;
  for (const w of words) {
    if (t >= w.s - margin && t <= w.e + margin) return 0;
    d = Math.min(d, Math.abs(t - (w.s - margin)), Math.abs(t - (w.e + margin)));
    if (w.s > t + 2) break;
  }
  return Math.min(1, d / fade);
};
