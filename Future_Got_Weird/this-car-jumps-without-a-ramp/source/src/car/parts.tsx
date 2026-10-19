// Drawing parts in world millimetres (y up). `px` = screen pixels per millimetre at the current camera, so ink lines
// and arrowheads keep a constant on-screen size at any zoom.
import React from 'react';
import {C, F} from '../theme';
import {PAINT, WHEEL_R} from './geom';

export const INK = 4; // ink width at 1080p (render scale 2 gives 8 px in 4K)

/** Side-view wheel: tyre, five double-spoke face (rotating), red caliper seen through the windows. `simple` (0..1)
 *  fades the face details to a plain pale disc so a mechanism drawn over it stays readable. */
export const SideWheel: React.FC<{cx: number; cy: number; rot: number; px: number; simple?: number; brake?: number; groundY?: number; id: string; squashK?: number; blur?: number}> =
  ({cx, cy, rot, px, simple = 0, brake = 0, groundY = 0, id, squashK = 0, blur = 0}) => {
    const sw = INK / px;
    // tyre is flattened where it meets the road (clip below the ground line)
    const squash = cy - WHEEL_R < groundY;
    const R = WHEEL_R;
    const win = (k: number) => {
      const pol = (r: number, deg: number) => `${cx + r * Math.cos(((deg + k * 72) * Math.PI) / 180)},${cy + r * Math.sin(((deg + k * 72) * Math.PI) / 180)}`;
      return [pol(104, -19), pol(236, -29), pol(236, 29), pol(104, 19)].join(' ');
    };
    return (
      <g>
        <defs>
          {squash && (
            <clipPath id={`gnd-${id}`}>
              <rect x={cx - R - 200} y={groundY} width={2 * R + 400} height={2 * R + 400} />
            </clipPath>
          )}
          <clipPath id={`wins-${id}`}>
            {[0, 1, 2, 3, 4].map((k) => (
              <polygon key={k} points={win(k)} transform={`rotate(${rot} ${cx} ${cy})`} />
            ))}
          </clipPath>
        </defs>
        <g clipPath={squash ? `url(#gnd-${id})` : undefined}>
          <circle cx={cx} cy={cy} r={R} fill={PAINT.tyre} stroke={C.ink} strokeWidth={sw} />
          <circle cx={cx} cy={cy} r={R - 24} fill="none" stroke={PAINT.tyreSide} strokeWidth={12} />
          <circle cx={cx} cy={cy} r={R - 70} fill={PAINT.tyreSide} />
        </g>
        {squash && <line x1={cx - Math.sqrt(Math.max(0, R ** 2 - (cy - groundY) ** 2))} y1={groundY} x2={cx + Math.sqrt(Math.max(0, R ** 2 - (cy - groundY) ** 2))} y2={groundY} stroke={C.ink} strokeWidth={sw} />}
        {/* wheel face */}
        <circle cx={cx} cy={cy} r={262} fill={simple > 0.5 ? '#D7DEE2' : PAINT.rim} stroke={C.ink} strokeWidth={sw * 0.8} />
        <g opacity={1 - simple}>
          <g transform={`rotate(${rot} ${cx} ${cy})`} opacity={1 - 0.65 * blur}>
            {[0, 1, 2, 3, 4].map((k) => (
              <g key={k}>
                <polygon points={win(k)} fill={PAINT.rimDeep} stroke={PAINT.rimDeep} strokeWidth={14} strokeLinejoin="round" />
                <line x1={cx + 112 * Math.cos(((k * 72) * Math.PI) / 180)} y1={cy + 112 * Math.sin(((k * 72) * Math.PI) / 180)} x2={cx + 228 * Math.cos(((k * 72) * Math.PI) / 180)} y2={cy + 228 * Math.sin(((k * 72) * Math.PI) / 180)} stroke={PAINT.rim} strokeWidth={9} strokeLinecap="round" opacity={0.85} />
              </g>
            ))}
          </g>
          {/* caliper, visible only through the windows; glows hot under braking */}
          <g clipPath={`url(#wins-${id})`}>
            <rect x={cx + 90} y={cy - 150} width={130} height={260} rx={36} fill={PAINT.caliper} transform={`rotate(-14 ${cx} ${cy})`} />
            <circle cx={cx} cy={cy} r={236} fill="#FF7A2E" opacity={0.7 * brake} />
          </g>
          <circle cx={cx} cy={cy} r={258} fill="none" stroke={C.ink} strokeWidth={sw * 0.6} />
          {/* fast wheel: a smeared disc instead of spokes that would alias at 30 fps */}
          {blur > 0 && <circle cx={cx} cy={cy} r={250} fill="#AEB8BE" opacity={0.45 * blur} />}
        </g>
        <circle cx={cx} cy={cy} r={50} fill={simple > 0.5 ? '#EEF2F4' : PAINT.rim} stroke={C.ink} strokeWidth={sw * 0.8} />
        <circle cx={cx} cy={cy} r={20} fill={C.ink} opacity={1 - simple * 0.4} />
        {squashK > 0 && null}
      </g>
    );
  };

/** Helical spring seen from the side: slanted front coils between two points (half-width w, mm). */
const Coil: React.FC<{x1: number; y1: number; x2: number; y2: number; turns: number; w: number; px: number; color: string; opacity?: number}> = ({x1, y1, x2, y2, turns, w, px, color, opacity = 1}) => {
  const dx = x2 - x1, dy = y2 - y1;
  const L = Math.hypot(dx, dy);
  const ux = dx / L, uy = dy / L;
  const nx = -uy, ny = ux;
  const pitch = L / turns;
  const sw = INK / px;
  const segs: React.ReactNode[] = [];
  for (let i = 0; i < turns; i++) {
    const t0 = i * pitch + pitch * 0.05, t1 = t0 + pitch * 0.62;
    const a = [x1 + ux * t0 - nx * w, y1 + uy * t0 - ny * w];
    const b = [x1 + ux * t1 + nx * w, y1 + uy * t1 + ny * w];
    segs.push(<line key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={C.ink} strokeWidth={36 + sw * 1.8} strokeLinecap="round" />);
    segs.push(<line key={`c${i}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={color} strokeWidth={36} strokeLinecap="round" />);
  }
  return <g opacity={opacity}>{segs}</g>;
};

/**
 * Suspension corner between a body mount (top) and a hub (bottom), drawn as three separate parts side by side so each
 * can be introduced on its own cue: the coil spring on the axis, the damper just behind it (cylinder from the body
 * mount, rod to the hub, with a rubber bump stop and a collar on the rod), and the powered actuator on the other side.
 * Every part is attached to the same two endpoints by short brackets, so the geometry follows the two endpoints as
 * the body and wheel move; no hydraulics are shown. `spring`, `damper`, `actuator` (0..1) are how visible each part is
 * (a part at 0.3 reads as dimmed hardware). `force`: actuator force, -1..1 (+ pushes body and wheel apart); `limitHit`
 * lights the bump stop where the collar meets it (the compression limit).
 */
export const BUMP = {body: 250, stop: 52, collar: 38}; // damper body length, rubber stop length, collar height above the hub (mm)
export const Strut: React.FC<{top: [number, number]; bottom: [number, number]; px: number; actuator?: number; force?: number; springGlow?: number; damperGlow?: number; side?: 1 | -1; limitHit?: number; spring?: number; damper?: number; slide?: number}> =
  ({top, bottom, px, actuator = 0, force = 0, springGlow = 0, damperGlow = 0, side = 1, limitHit = 0, spring = 1, damper = 1, slide = 1}) => {
    const sw = INK / px;
    const [x1, y1] = top;
    const [x2, y2] = bottom;
    const L = Math.hypot(x2 - x1, y2 - y1);
    const ux = (x2 - x1) / L, uy = (y2 - y1) / L;
    const nx = -uy * side, ny = ux * side;
    const P = (t: number, off: number) => [x1 + ux * t + nx * off, y1 + uy * t + ny * off] as [number, number];
    // damper (offset away from the actuator): cylinder hangs from the body mount, rod goes to the hub
    const D_OFF = -150;
    const dTop = P(0, D_OFF), dBodyEnd = P(BUMP.body, D_OFF), dStopEnd = P(BUMP.body + BUMP.stop, D_OFF), dBot = [x2 + nx * D_OFF, y2 + ny * D_OFF] as [number, number];
    const dCollar = P(Math.max(BUMP.body + BUMP.stop, L - BUMP.collar), D_OFF);
    // actuator: offset alongside (toward +n), joined to the same two ends by short brackets; slides in from outside
    const off = 175;
    const so = (1 - slide) * 260;
    const ax1 = x1 + nx * (off + so), ay1 = y1 + ny * (off + so);
    const ax2 = x2 + nx * (off * 0.55 + so), ay2 = y2 + ny * (off * 0.55 + so);
    const aL = Math.hypot(ax2 - ax1, ay2 - ay1);
    const aux = (ax2 - ax1) / aL, auy = (ay2 - ay1) / aL;
    const cylLen = Math.min(aL * 0.58, 230);
    const acx = ax1 + aux * cylLen, acy = ay1 + auy * cylLen;
    const glow = Math.min(1, Math.abs(force));
    const actCol = force >= 0 ? C.teal : C.blue;
    const rodAng = (Math.atan2(uy, ux) * 180) / Math.PI;
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
              <path d="M 3 -16 L -8 3 L 0 3 L -4 16 L 8 -3 L 0 -3 Z" fill={C.white} stroke={C.ink} strokeWidth={1.5} strokeLinejoin="round" transform={`scale(${Math.min(1.6, Math.max(0.6, (70 * px) / 22))})`} />
            </g>
          </g>
        )}
        {/* damper */}
        <g opacity={damper}>
          <line x1={x1} y1={y1} x2={dTop[0]} y2={dTop[1]} stroke={C.ink} strokeWidth={sw * 1.6} />
          <line x1={x2} y1={y2} x2={dBot[0]} y2={dBot[1]} stroke={C.ink} strokeWidth={sw * 1.6} />
          {/* rod (chrome) from the stop to the hub bracket */}
          <line x1={dStopEnd[0]} y1={dStopEnd[1]} x2={dBot[0]} y2={dBot[1]} stroke={C.inkSoft} strokeWidth={26} />
          <line x1={dStopEnd[0]} y1={dStopEnd[1]} x2={dBot[0]} y2={dBot[1]} stroke="#D7DEE2" strokeWidth={26 - sw * 2} />
          {/* cylinder */}
          {damperGlow > 0 && <line x1={dTop[0]} y1={dTop[1]} x2={dBodyEnd[0]} y2={dBodyEnd[1]} stroke={C.blue} strokeWidth={130} strokeOpacity={0.3 * damperGlow} />}
          <line x1={dTop[0]} y1={dTop[1]} x2={dBodyEnd[0]} y2={dBodyEnd[1]} stroke={C.ink} strokeWidth={74} />
          <line x1={dTop[0]} y1={dTop[1]} x2={dBodyEnd[0]} y2={dBodyEnd[1]} stroke={damperGlow > 0 ? mixHex('#55646D', C.blue, damperGlow) : '#55646D'} strokeWidth={74 - sw * 2} />
          {/* rubber bump stop under the cylinder, and the collar on the rod that meets it at the compression limit */}
          <line x1={dBodyEnd[0]} y1={dBodyEnd[1]} x2={dStopEnd[0]} y2={dStopEnd[1]} stroke={C.ink} strokeWidth={60} />
          <line x1={dBodyEnd[0]} y1={dBodyEnd[1]} x2={dStopEnd[0]} y2={dStopEnd[1]} stroke={limitHit > 0 ? mixHex('#3A444B', C.coral, limitHit) : '#3A444B'} strokeWidth={60 - sw * 2} />
          {[0.25, 0.5, 0.75].map((k) => {
            const c = [dBodyEnd[0] + (dStopEnd[0] - dBodyEnd[0]) * k, dBodyEnd[1] + (dStopEnd[1] - dBodyEnd[1]) * k];
            return <line key={k} x1={c[0] + nx * 26} y1={c[1] + ny * 26} x2={c[0] - nx * 26} y2={c[1] - ny * 26} stroke={C.ink} strokeWidth={sw * 0.9} opacity={0.6} />;
          })}
          <g transform={`translate(${dCollar[0]} ${dCollar[1]}) rotate(${rodAng})`}>
            <rect x={-9} y={-44} width={18} height={88} rx={6} fill={limitHit > 0 ? mixHex('#C9D3D8', C.coral, limitHit) : '#C9D3D8'} stroke={C.ink} strokeWidth={sw} />
          </g>
          {limitHit > 0 && (
            <g opacity={limitHit}>
              <circle cx={dStopEnd[0]} cy={dStopEnd[1]} r={90} fill={C.coral} opacity={0.22} />
              <circle cx={dStopEnd[0]} cy={dStopEnd[1]} r={90} fill="none" stroke={C.coral} strokeWidth={sw * 2.2} />
            </g>
          )}
        </g>
        {/* spring: wide coil on the axis, ends on the same mount and hub */}
        <Coil x1={x1 + ux * 30} y1={y1 + uy * 30} x2={x2 - ux * 60} y2={y2 - uy * 60} turns={6} w={58} px={px} color={springGlow > 0 ? mixHex('#E9A91C', '#FFC744', springGlow) : C.saffronDeep} opacity={spring} />
        {/* mounts */}
        <circle cx={x1} cy={y1} r={30} fill={C.white} stroke={C.ink} strokeWidth={sw} />
        <circle cx={x2} cy={y2} r={30} fill={C.white} stroke={C.ink} strokeWidth={sw} />
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
