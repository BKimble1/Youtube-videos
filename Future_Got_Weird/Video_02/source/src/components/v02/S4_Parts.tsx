import React from 'react';
import {C, F, OUTLINE} from '../../theme';

/**
 * S4 only: small drawing parts for the geometry act (ruler, labels, the echo-comparison card, the assumption card,
 * the photo frame and the tick / cross marks). World-space parts take `k` = world px per screen px (1 / camera zoom)
 * so their strokes and widths stay a constant size on screen while the camera moves; screen-space parts take px.
 */

const f2 = (n: number) => (Math.round(n * 100) / 100).toString();
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/* ------------------------------------------------------------------ ruler (world space, inside an <svg>) */

export type RulerProps = {
  /** pivot (the wall spot), world px */
  o: {x: number; y: number};
  /** screen/plan angle (radians, atan2(dz, dx): 0 = along the wall to the right, pi/2 = straight into the room) */
  angle: number;
  /** length, world px */
  len: number;
  /** world px per metre (for the ticks) */
  ppm: number;
  /** world px per screen px */
  k: number;
  opacity?: number;
};

/** A flat saffron measuring ruler pinned at a wall spot, swinging about the pin; a coral pen nub at the tip. */
export const Ruler: React.FC<RulerProps> = ({o, angle, len, ppm, k, opacity = 1}) => {
  if (len <= 1 || opacity <= 0.001) return null;
  const w = 24 * k;
  const ticks: React.ReactNode[] = [];
  for (let m = 0.25; m * ppm < len - 6 * k; m += 0.25) {
    const x = m * ppm;
    const long = Math.abs(m - Math.round(m)) < 1e-6;
    ticks.push(<line key={m.toFixed(2)} x1={x} y1={-w / 2} x2={x} y2={-w / 2 + (long ? 0.62 : 0.4) * w} stroke={C.ink} strokeWidth={3 * k} strokeLinecap="round" />);
  }
  return (
    <g transform={`translate(${f2(o.x)} ${f2(o.y)}) rotate(${f2((angle * 180) / Math.PI)})`} opacity={opacity}>
      <rect x={-w * 0.5} y={-w / 2 + 5 * k} width={len + w * 0.5} height={w} rx={6 * k} fill={C.shadow} />
      <rect x={-w * 0.5} y={-w / 2} width={len + w * 0.5} height={w} rx={6 * k} fill={C.saffron} stroke={C.ink} strokeWidth={OUTLINE * k} strokeLinejoin="round" />
      {ticks}
      <circle cx={0} cy={0} r={8 * k} fill={C.coral} stroke={C.ink} strokeWidth={3.5 * k} />
      <circle cx={len} cy={0} r={9 * k} fill={C.coralDeep} stroke={C.ink} strokeWidth={3.5 * k} />
    </g>
  );
};

/* ------------------------------------------------------------------ labels (screen space) */

export type PillProps = {
  x: number;
  y: number;
  children: React.ReactNode;
  size?: number;
  color?: string;
  bg?: string;
  border?: string;
  align?: 'left' | 'center' | 'right';
  opacity?: number;
  mono?: boolean;
  weight?: number;
  /** 0..1 pop-in scale (1 = settled) */
  pop?: number;
};

/** A label on a cream pill so lines on the board pass cleanly behind it. (x, y) is the anchor (centre of the line). */
export const Pill: React.FC<PillProps> = ({x, y, children, size = 36, color = C.ink, bg = C.cream, border, align = 'center', opacity = 1, mono, weight, pop = 1}) => {
  if (opacity <= 0.001) return null;
  const tx = align === 'center' ? '-50%' : align === 'right' ? '-100%' : '0';
  const ox = align === 'center' ? '50%' : align === 'right' ? '100%' : '0%';
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(${tx}, -50%) scale(${f2(pop)})`,
        transformOrigin: `${ox} 50%`,
        fontFamily: mono ? F.mono : F.body,
        fontWeight: weight ?? (mono ? 700 : 800),
        fontSize: size,
        color,
        whiteSpace: 'nowrap',
        lineHeight: 1,
        opacity,
        background: bg,
        padding: `${Math.round(size * 0.2)}px ${Math.round(size * 0.36)}px ${Math.round(size * 0.26)}px`,
        borderRadius: Math.round(size * 0.42),
        border: border ? `3px solid ${border}` : undefined,
      }}
    >
      {children}
    </div>
  );
};

/* ------------------------------------------------------------------ marks */

export const CheckMark: React.FC<{x: number; y: number; r?: number; t?: number}> = ({x, y, r = 28, t = 1}) => {
  if (t <= 0) return null;
  const s = clamp01(t);
  return (
    <g transform={`translate(${f2(x)} ${f2(y)}) scale(${f2(0.6 + 0.4 * s)})`} opacity={Math.min(1, s * 1.6)}>
      <circle r={r} fill={C.teal} stroke={C.ink} strokeWidth={OUTLINE} />
      <path d={`M ${-r * 0.45} ${r * 0.02} L ${-r * 0.1} ${r * 0.36} L ${r * 0.48} ${-r * 0.32}`} fill="none" stroke={C.white} strokeWidth={r * 0.22} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
};

export const CrossMark: React.FC<{x: number; y: number; r?: number; t?: number}> = ({x, y, r = 28, t = 1}) => {
  if (t <= 0) return null;
  const s = clamp01(t);
  const a = r * 0.36;
  return (
    <g transform={`translate(${f2(x)} ${f2(y)}) scale(${f2(0.6 + 0.4 * s)})`} opacity={Math.min(1, s * 1.6)}>
      <circle r={r} fill={C.coral} stroke={C.ink} strokeWidth={OUTLINE} />
      <path d={`M ${-a} ${-a} L ${a} ${a} M ${a} ${-a} L ${-a} ${a}`} fill="none" stroke={C.white} strokeWidth={r * 0.22} strokeLinecap="round" />
    </g>
  );
};

/* ------------------------------------------------------------------ echo comparison card (screen space) */

export type EchoCardProps = {
  x: number;
  y: number;
  w?: number;
  /** measured arrival times (ns), one per wall spot */
  measured: number[];
  /** the candidate's predicted arrival times (ns) */
  predicted: number[];
  /** axis range (ns) */
  range: [number, number];
  /** 0..1 how far the predicted ticks have drawn in */
  reveal: number;
  /** verdict mark: 1 match, -1 mismatch, 0 none; vt 0..1 its pop */
  verdict: -1 | 0 | 1;
  vt: number;
  opacity?: number;
  pop?: number;
};

/**
 * "Each candidate predicts echoes": two rows of tick marks on one time axis, the measured echo times (ink) and the
 * candidate's predicted times (teal), one tick per wall spot, with a check or a cross.
 */
export const EchoCard: React.FC<EchoCardProps> = ({x, y, w = 560, measured, predicted, range, reveal, verdict, vt, opacity = 1, pop = 1}) => {
  if (opacity <= 0.001) return null;
  const h = 168;
  const lx = 196; // axis start inside the card
  const ax0 = lx;
  const ax1 = w - 96;
  const X = (ns: number) => ax0 + ((ns - range[0]) / (range[1] - range[0])) * (ax1 - ax0);
  const row1 = 58;
  const row2 = 118;
  const tick = (ns: number, yy: number, col: string, key: string, op = 1) => {
    const xx = Math.max(ax0, Math.min(ax1, X(ns)));
    return <line key={key} x1={xx} y1={yy - 20} x2={xx} y2={yy + 20} stroke={col} strokeWidth={7} strokeLinecap="round" opacity={op} />;
  };
  return (
    <div style={{position: 'absolute', left: x, top: y, width: w, height: h, opacity, transform: `scale(${f2(pop)})`, transformOrigin: '50% 100%'}}>
      <svg width={w} height={h} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <rect x={8} y={10} width={w} height={h} rx={22} fill={C.shadow} />
        <rect x={0} y={0} width={w} height={h} rx={22} fill={C.cream} stroke={C.ink} strokeWidth={OUTLINE} />
        <line x1={ax0} y1={row1} x2={ax1} y2={row1} stroke={C.paperLine} strokeWidth={4} strokeLinecap="round" />
        <line x1={ax0} y1={row2} x2={ax1} y2={row2} stroke={C.paperLine} strokeWidth={4} strokeLinecap="round" />
        {measured.map((ns, i) => tick(ns, row1, C.ink, `m${i}`))}
        {predicted.map((ns, i) => tick(ns, row2, C.tealDeep, `p${i}`, clamp01(reveal * predicted.length - i)))}
        {verdict === 1 && <CheckMark x={w - 50} y={h / 2} r={30} t={vt} />}
        {verdict === -1 && <CrossMark x={w - 50} y={h / 2} r={30} t={vt} />}
      </svg>
      <div style={{position: 'absolute', left: 22, top: row1 - 17, fontFamily: F.body, fontWeight: 800, fontSize: 34, color: C.ink, lineHeight: 1}}>measured</div>
      <div style={{position: 'absolute', left: 22, top: row2 - 17, fontFamily: F.body, fontWeight: 800, fontSize: 34, color: C.tealDeep, lineHeight: 1}}>predicted</div>
    </div>
  );
};

/* ------------------------------------------------------------------ assumption card (screen space) */

export const AssumptionCard: React.FC<{x: number; y: number; pop: number; opacity?: number}> = ({x, y, pop, opacity = 1}) => {
  if (pop <= 0.001 || opacity <= 0.001) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%, -50%) scale(${f2(pop)})`,
        transformOrigin: '50% 50%',
        opacity,
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        padding: '16px 26px 18px 20px',
        background: C.cream,
        border: `${OUTLINE}px solid ${C.ink}`,
        borderRadius: 22,
        boxShadow: `8px 10px 0 ${C.shadow}`,
        whiteSpace: 'nowrap',
      }}
    >
      <svg width={52} height={52} style={{flex: 'none'}}>
        <circle cx={26} cy={26} r={22} fill={C.saffronLight} stroke={C.ink} strokeWidth={3.5} />
        <circle cx={26} cy={26} r={8} fill={C.teal} stroke={C.ink} strokeWidth={3} />
      </svg>
      <div style={{fontFamily: F.body, fontWeight: 800, fontSize: 38, color: C.ink, lineHeight: 1}}>
        <span style={{color: C.inkSoft}}>assumption:</span> one small object
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ photo frame (screen space, inside an <svg>) */

/** An instant-photo frame (cream border, empty window) that tries to frame him; `cross` 0..1 strikes it out. */
export const PhotoFrame: React.FC<{x: number; y: number; rot: number; scale?: number; cross: number; opacity?: number}> = ({x, y, rot, scale = 1, cross, opacity = 1}) => {
  if (opacity <= 0.001) return null;
  const w = 300;
  const h = 350;
  const win = {x: -w / 2 + 22, y: -h / 2 + 22, w: w - 44, h: 250};
  const frame = `M ${-w / 2} ${-h / 2} H ${w / 2} V ${h / 2} H ${-w / 2} Z M ${win.x} ${win.y} V ${win.y + win.h} H ${win.x + win.w} V ${win.y} Z`;
  const c1 = clamp01(cross * 2);
  const c2 = clamp01(cross * 2 - 1);
  const a = 128;
  return (
    <g transform={`translate(${f2(x)} ${f2(y)}) rotate(${f2(rot)}) scale(${f2(scale)})`} opacity={opacity}>
      <path d={frame} transform="translate(8 10)" fill={C.shadow} fillRule="evenodd" />
      <path d={frame} fill={C.cream} fillRule="evenodd" stroke={C.ink} strokeWidth={OUTLINE} strokeLinejoin="round" />
      {/* corner marks of a viewfinder inside the window */}
      {[
        [win.x + 14, win.y + 14, 1, 1],
        [win.x + win.w - 14, win.y + 14, -1, 1],
        [win.x + 14, win.y + win.h - 14, 1, -1],
        [win.x + win.w - 14, win.y + win.h - 14, -1, -1],
      ].map(([cx, cy, sx, sy], i) => (
        <path key={i} d={`M ${cx} ${cy + sy * 30} L ${cx} ${cy} L ${cx + sx * 30} ${cy}`} fill="none" stroke={C.inkSoft} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
      ))}
      {c1 > 0 && <line x1={-a} y1={-a} x2={-a + 2 * a * c1} y2={-a + 2 * a * c1} stroke={C.coral} strokeWidth={22} strokeLinecap="round" />}
      {c2 > 0 && <line x1={a} y1={-a} x2={a - 2 * a * c2} y2={-a + 2 * a * c2} stroke={C.coral} strokeWidth={22} strokeLinecap="round" />}
    </g>
  );
};
