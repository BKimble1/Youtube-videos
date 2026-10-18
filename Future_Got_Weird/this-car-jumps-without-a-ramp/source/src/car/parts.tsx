// Drawing parts in world millimetres (y up). `px` = screen pixels per millimetre at the current camera, so ink lines
// and arrowheads keep a constant on-screen size at any zoom.
import React from 'react';
import {C, F} from '../theme';
import {PAINT, WHEEL_R} from './geom';

export const INK = 4; // ink width at 1080p (render scale 2 gives 8 px in 4K)

/** Side-view wheel: tyre, rim, spokes (rotating), disc and caliper. xray fades tyre and rim so parts behind show. */
export const SideWheel: React.FC<{cx: number; cy: number; rot: number; px: number; xray?: number; brake?: number; groundY?: number; id: string; caliperBack?: boolean}> =
  ({cx, cy, rot, px, xray = 0, brake = 0, groundY = 0, id, caliperBack}) => {
    const sw = INK / px;
    const a = 1 - 0.72 * xray;
    // tyre is flattened where it meets the road (clip below the ground line)
    const squash = cy - WHEEL_R < groundY;
    return (
      <g>
        {squash && (
          <defs>
            <clipPath id={`gnd-${id}`}>
              <rect x={cx - WHEEL_R - 200} y={groundY} width={2 * WHEEL_R + 400} height={2 * WHEEL_R + 400} />
            </clipPath>
          </defs>
        )}
        <g clipPath={squash ? `url(#gnd-${id})` : undefined}>
          <circle cx={cx} cy={cy} r={WHEEL_R} fill={PAINT.tyre} fillOpacity={a} stroke={C.ink} strokeWidth={sw} />
          <circle cx={cx} cy={cy} r={WHEEL_R - 26} fill="none" stroke={PAINT.tyreSide} strokeOpacity={a} strokeWidth={10} />
        </g>
        {squash && <line x1={cx - Math.sqrt(Math.max(0, WHEEL_R ** 2 - (cy - groundY) ** 2))} y1={groundY} x2={cx + Math.sqrt(Math.max(0, WHEEL_R ** 2 - (cy - groundY) ** 2))} y2={groundY} stroke={C.ink} strokeWidth={sw} />}
        <g opacity={a}>
          <circle cx={cx} cy={cy} r={262} fill={PAINT.rimDeep} stroke={C.ink} strokeWidth={sw * 0.8} />
          {/* brake disc and caliper sit behind the spokes */}
          <circle cx={cx} cy={cy} r={200} fill={PAINT.disc} stroke={C.ink} strokeWidth={sw * 0.5} />
          <circle cx={cx} cy={cy} r={200} fill="#FF7A2E" opacity={0.75 * brake} />
          <g transform={`rotate(${caliperBack ? 205 : -25} ${cx} ${cy})`}>
            <rect x={cx + 120} y={cy - 70} width={95} height={140} rx={28} fill={PAINT.caliper} stroke={C.ink} strokeWidth={sw * 0.7} />
          </g>
          <g transform={`rotate(${rot} ${cx} ${cy})`}>
            {[0, 72, 144, 216, 288].map((k) => (
              <g key={k} transform={`rotate(${k} ${cx} ${cy})`}>
                <path d={`M ${cx - 22} ${cy + 40} L ${cx - 46} ${cy + 236} L ${cx - 6} ${cy + 240} L ${cx} ${cy + 120} L ${cx + 6} ${cy + 240} L ${cx + 46} ${cy + 236} L ${cx + 22} ${cy + 40} Z`} fill={PAINT.rim} stroke={C.ink} strokeWidth={sw * 0.6} strokeLinejoin="round" />
              </g>
            ))}
            <circle cx={cx} cy={cy} r={62} fill={PAINT.rim} stroke={C.ink} strokeWidth={sw * 0.7} />
            <circle cx={cx} cy={cy} r={24} fill={C.ink} />
          </g>
          <circle cx={cx} cy={cy} r={258} fill="none" stroke={C.ink} strokeWidth={sw * 0.6} />
        </g>
      </g>
    );
  };

/** Zig-zag coil between two points, `turns` loops, half-width w (mm). */
const coil = (x1: number, y1: number, x2: number, y2: number, turns: number, w: number) => {
  const dx = x2 - x1, dy = y2 - y1;
  const L = Math.hypot(dx, dy);
  const ux = dx / L, uy = dy / L;
  const nx = -uy, ny = ux;
  const pts: string[] = [];
  const n = turns * 2;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const s = i === 0 || i === n ? 0 : i % 2 === 0 ? -1 : 1;
    pts.push(`${x1 + ux * L * t + nx * w * s},${y1 + uy * L * t + ny * w * s}`);
  }
  return pts.join(' ');
};

/**
 * Suspension corner between a body mount (top) and a hub (bottom): coil spring around a damper, plus (when
 * `actuator` > 0) a powered actuator drawn alongside as a simple functional symbol. No internal hydraulics are shown.
 * force: actuator force, -1..1 (+ pushes body and wheel apart). Glow shows the actuator working.
 */
export const Strut: React.FC<{top: [number, number]; bottom: [number, number]; px: number; actuator?: number; force?: number; springGlow?: number; damperGlow?: number; side?: 1 | -1; limitHit?: number}> =
  ({top, bottom, px, actuator = 0, force = 0, springGlow = 0, damperGlow = 0, side = 1, limitHit = 0}) => {
    const sw = INK / px;
    const [x1, y1] = top;
    const [x2, y2] = bottom;
    const L = Math.hypot(x2 - x1, y2 - y1);
    const ux = (x2 - x1) / L, uy = (y2 - y1) / L;
    const nx = -uy * side, ny = ux * side;
    // damper body hangs from the top mount, rod comes up from the hub
    const bodyLen = Math.min(L * 0.62, 260);
    const bx = x1 + ux * bodyLen, by = y1 + uy * bodyLen;
    // actuator: offset alongside (toward +n), same two ends via short brackets
    const off = 175;
    const ax1 = x1 + nx * off, ay1 = y1 + ny * off;
    const ax2 = x2 + nx * off * 0.55, ay2 = y2 + ny * off * 0.55;
    const aL = Math.hypot(ax2 - ax1, ay2 - ay1);
    const aux = (ax2 - ax1) / aL, auy = (ay2 - ay1) / aL;
    const cylLen = Math.min(aL * 0.58, 230);
    const acx = ax1 + aux * cylLen, acy = ay1 + auy * cylLen;
    const glow = Math.min(1, Math.abs(force));
    const actCol = force >= 0 ? C.teal : C.blue;
    return (
      <g strokeLinecap="round" strokeLinejoin="round">
        {/* actuator (behind the spring) */}
        {actuator > 0 && (
          <g opacity={actuator}>
            <line x1={x1} y1={y1} x2={ax1} y2={ay1} stroke={C.ink} strokeWidth={sw * 1.6} />
            <line x1={x2} y1={y2} x2={ax2} y2={ay2} stroke={C.ink} strokeWidth={sw * 1.6} />
            <line x1={acx} y1={acy} x2={ax2} y2={ay2} stroke={C.inkSoft} strokeWidth={30} />
            <line x1={acx} y1={acy} x2={ax2} y2={ay2} stroke="#C9D3D8" strokeWidth={30 - sw * 2} />
            {glow > 0.02 && <line x1={ax1} y1={ay1} x2={acx} y2={acy} stroke={actCol} strokeWidth={120} strokeOpacity={0.3 * glow} />}
            <line x1={ax1} y1={ay1} x2={acx} y2={acy} stroke={C.ink} strokeWidth={70} />
            <line x1={ax1} y1={ay1} x2={acx} y2={acy} stroke={glow > 0.02 ? actCol : '#6F8FC8'} strokeWidth={70 - sw * 2} />
            {/* lightning mark = powered */}
            <g transform={`translate(${(ax1 + acx) / 2} ${(ay1 + acy) / 2}) scale(${1 / px} ${-1 / px}) rotate(${(Math.atan2(-auy, aux) * 180) / Math.PI + 90})`}>
              <path d="M 3 -16 L -8 3 L 0 3 L -4 16 L 8 -3 L 0 -3 Z" fill={C.white} stroke={C.ink} strokeWidth={1.5} strokeLinejoin="round" transform={`scale(${Math.min(1.6, Math.max(0.6, 70 * px / 22))})`} />
            </g>
          </g>
        )}
        {/* damper */}
        <line x1={bx} y1={by} x2={x2} y2={y2} stroke={C.inkSoft} strokeWidth={26} />
        <line x1={bx} y1={by} x2={x2} y2={y2} stroke="#D7DEE2" strokeWidth={26 - sw * 2} />
        <line x1={x1} y1={y1} x2={bx} y2={by} stroke={C.ink} strokeWidth={64} />
        <line x1={x1} y1={y1} x2={bx} y2={by} stroke={damperGlow > 0 ? `rgba(79,124,201,${0.4 + 0.6 * damperGlow})` : '#55646D'} strokeWidth={64 - sw * 2} />
        {/* spring */}
        <polyline points={coil(x1 + ux * 30, y1 + uy * 30, x2 - ux * 60, y2 - uy * 60, 6, 62)} fill="none" stroke={C.ink} strokeWidth={sw * 3.2} />
        <polyline points={coil(x1 + ux * 30, y1 + uy * 30, x2 - ux * 60, y2 - uy * 60, 6, 62)} fill="none" stroke={springGlow > 0 ? mixHex('#E9A91C', '#FFC744', springGlow) : C.saffronDeep} strokeWidth={sw * 1.6} />
        {/* mounts */}
        <circle cx={x1} cy={y1} r={30} fill={C.white} stroke={C.ink} strokeWidth={sw} />
        <circle cx={x2} cy={y2} r={30} fill={C.white} stroke={C.ink} strokeWidth={sw} />
        {limitHit > 0 && <circle cx={x1 + ux * 70} cy={y1 + uy * 70} r={70} fill="none" stroke={C.coral} strokeWidth={sw * 2} opacity={limitHit} />}
      </g>
    );
  };

export const mixHex = (a: string, b: string, t: number) => {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const A = p(a), B = p(b);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * Math.max(0, Math.min(1, t)))).join(',')})`;
};

/**
 * A force (or motion) arrow in world mm from (x, y) along (dx, dy). Thickness and head stay constant on screen; the
 * length carries the magnitude. kind 'force' = solid, 'motion' = dashed (so motion is never mistaken for force).
 */
export const Arrow: React.FC<{x: number; y: number; dx: number; dy: number; px: number; color: string; width?: number; kind?: 'force' | 'motion'; opacity?: number; head?: number}> =
  ({x, y, dx, dy, px, color, width = 14, kind = 'force', opacity = 1, head = 30}) => {
    const L = Math.hypot(dx, dy);
    if (L * px < 4 || opacity <= 0.001) return null;
    const ux = dx / L, uy = dy / L;
    const h = Math.min(head / px, L * 0.6);
    const w = width / px;
    const bx = x + ux * (L - h * 0.85), by = y + uy * (L - h * 0.85);
    const nx = -uy, ny = ux;
    const hw = (head * 0.62) / px;
    const tip = [x + dx, y + dy];
    const headPts = `${tip[0]},${tip[1]} ${bx + nx * hw},${by + ny * hw} ${bx - nx * hw},${by - ny * hw}`;
    const sw = 3 / px;
    return (
      <g opacity={opacity}>
        {kind === 'force' ? (
          <>
            <line x1={x} y1={y} x2={bx} y2={by} stroke={C.ink} strokeWidth={w + 2 * sw} strokeLinecap="round" />
            <line x1={x} y1={y} x2={bx} y2={by} stroke={color} strokeWidth={w} strokeLinecap="round" />
          </>
        ) : (
          <line x1={x} y1={y} x2={bx} y2={by} stroke={color} strokeWidth={w * 0.75} strokeDasharray={`${18 / px} ${12 / px}`} strokeLinecap="round" />
        )}
        <polygon points={headPts} fill={color} stroke={C.ink} strokeWidth={sw} strokeLinejoin="round" />
      </g>
    );
  };

/** Screen-sized content pinned to a world point (text stays upright and constant size). */
export const Pin: React.FC<{x: number; y: number; px: number; children: React.ReactNode; opacity?: number}> = ({x, y, px, children, opacity = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${1 / px} ${-1 / px})`} opacity={opacity}>{children}</g>
);

/** A small rounded label in screen pixels, anchored at (0,0) by `anchor`. */
export const Tag: React.FC<{text: string; color?: string; fg?: string; size?: number; anchor?: 'l' | 'c' | 'r'; dy?: number; weight?: number; outline?: boolean}> =
  ({text, color = C.white, fg = C.ink, size = 30, anchor = 'c', dy = 0, weight = 700, outline = true}) => {
    const w = text.length * size * 0.6 + size * 1.1;
    const h = size * 1.55;
    const x0 = anchor === 'l' ? 0 : anchor === 'c' ? -w / 2 : -w;
    return (
      <g transform={`translate(${x0} ${dy - h / 2})`}>
        <rect x={0} y={0} width={w} height={h} rx={h * 0.3} fill={color} stroke={outline ? C.ink : 'none'} strokeWidth={3.5} />
        <text x={w / 2} y={h / 2 + size * 0.36} textAnchor="middle" fontFamily={F.display} fontWeight={weight} fontSize={size} fill={fg} letterSpacing={0.5}>
          {text}
        </text>
      </g>
    );
  };
