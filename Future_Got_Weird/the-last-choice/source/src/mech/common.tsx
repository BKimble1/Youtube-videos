// Shared pieces for the coordination system's machines: the restrained mark, the sensor eye, colour mixing, simple
// shape builders and deterministic particle helpers (sparks, flying pieces, hydraulic fluid). Pure functions of props.
import React from 'react';
import {C, SYS} from '../theme';
import {V2, clamp, lerp, rnd, f2, pt, smoothPath, polyPath} from '../kit/math';

export const INK = C.ink;
// local tones (derived from SYS) so plates read as panels with a lit and a shaded side
export const M = {
  plate: SYS.panel, plateShade: SYS.panelShade, plateDeep: SYS.panelDeep, plateHi: '#F6F9FA',
  frame: SYS.slate, frameDark: SYS.dark, black: SYS.black, joint: '#33434E', rubber: '#1E272D', hub: '#8A99A4',
  glass: '#22313B', warmWhite: '#FBFAF6', softShade: '#E3E6E4', softDeep: '#C9D0CF', teal: '#5ED1C3', tealCore: '#E6FFF9',
  rust: '#7B5340', spark: '#FFE9A6', sparkHot: '#FFFBEA', sparkWarm: '#FF9A3C', light: '#FFF4D6',
};

const hex = (h: string) => {
  const s = h.replace('#', '');
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
};
export const mixHex = (a: string, b: string, t: number) => {
  const A = hex(a), B = hex(b);
  const k = clamp(t);
  return '#' + A.map((v, i) => Math.round(lerp(v, B[i], k)).toString(16).padStart(2, '0')).join('');
};
/** Unique, stable id for gradients (no React state). */
export const gid = (prefix: string, ...n: number[]) => `${prefix}_${n.map((v) => Math.round(v * 10)).join('_')}`.replace(/-/g, 'm');

/** Rounded rectangle path centred on (cx, cy). */
export const rrect = (cx: number, cy: number, w: number, h: number, r: number) => {
  const x = cx - w / 2, y = cy - h / 2, rr = Math.min(r, w / 2, h / 2);
  return `M ${f2(x + rr)} ${f2(y)} H ${f2(x + w - rr)} Q ${f2(x + w)} ${f2(y)} ${f2(x + w)} ${f2(y + rr)} V ${f2(y + h - rr)} Q ${f2(x + w)} ${f2(y + h)} ${f2(x + w - rr)} ${f2(y + h)} H ${f2(x + rr)} Q ${f2(x)} ${f2(y + h)} ${f2(x)} ${f2(y + h - rr)} V ${f2(y + rr)} Q ${f2(x)} ${f2(y)} ${f2(x + rr)} ${f2(y)} Z`;
};
/** Capsule (stadium) between two points with half-widths ra, rb. */
export const capsule = (a: V2, b: V2, ra: number, rb = ra) => {
  const dx = b.x - a.x, dy = b.y - a.y, L = Math.max(1e-3, Math.hypot(dx, dy));
  const nx = -dy / L, ny = dx / L;
  const a1 = {x: a.x + nx * ra, y: a.y + ny * ra}, a2 = {x: a.x - nx * ra, y: a.y - ny * ra};
  const b1 = {x: b.x + nx * rb, y: b.y + ny * rb}, b2 = {x: b.x - nx * rb, y: b.y - ny * rb};
  return `M ${pt(a1)} L ${pt(b1)} A ${f2(rb)} ${f2(rb)} 0 0 0 ${pt(b2)} L ${pt(a2)} A ${f2(ra)} ${f2(ra)} 0 0 0 ${pt(a1)} Z`;
};
/** Polygon through local points, rotated by ang (deg) and translated to (x, y). */
export const xform = (pts: V2[], x: number, y: number, ang = 0, sx = 1, sy = 1): V2[] => {
  const a = (ang * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  return pts.map((p) => ({x: x + (p.x * sx) * c - (p.y * sy) * s, y: y + (p.x * sx) * s + (p.y * sy) * c}));
};
export {smoothPath, polyPath};

// ------------------------------------------------------------------ the mark
/** Three concentric arcs and a dot. Small, restrained, never text. r = outer radius. */
export const SysMark: React.FC<{x: number; y: number; r: number; color?: string; opacity?: number; rot?: number}> = ({x, y, r, color = SYS.mark, opacity = 1, rot = -40}) => {
  const arc = (rad: number, gapDeg: number) => {
    const a0 = ((rot + gapDeg / 2) * Math.PI) / 180, a1 = ((rot + 360 - gapDeg / 2) * Math.PI) / 180;
    const p0 = {x: x + Math.cos(a0) * rad, y: y + Math.sin(a0) * rad}, p1 = {x: x + Math.cos(a1) * rad, y: y + Math.sin(a1) * rad};
    return `M ${pt(p0)} A ${f2(rad)} ${f2(rad)} 0 1 1 ${pt(p1)}`;
  };
  const w = r * 0.13;
  return (
    <g opacity={opacity} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round">
      <path d={arc(r, 70)} />
      <path d={arc(r * 0.68, 90)} />
      <path d={arc(r * 0.38, 120)} />
      <circle cx={x} cy={y} r={r * 0.11} fill={color} stroke="none" />
    </g>
  );
};

// ------------------------------------------------------------------ the sensor eye
/**
 * The system's eye: a dark housing, a bezel, a black lens and an iris ring that is cyan while observing and tightens and
 * turns amber as `lock` → 1. `look` shifts the iris inside the lens (−1..1). `squash` foreshortens horizontally when
 * the eye turns away (1 = facing the viewer). `open` 0 = shuttered/dead. Anchor: centre; r = housing radius.
 */
export const SensorEye: React.FC<{x: number; y: number; r: number; look?: V2; lock?: number; glow?: number; ink?: number; squash?: number; open?: number; rot?: number; id?: string}> = ({
  x, y, r, look = {x: 0, y: 0}, lock = 0, glow = 0, ink = 3, squash = 1, open = 1, rot = 0, id,
}) => {
  const L = clamp(lock);
  const cL = clamp((L - 0.45) / 0.45);
  const cK = cL * cL * (3 - 2 * cL);
  const ring = mixHex(SYS.sensor, SYS.lock, cK);
  const core = mixHex(SYS.sensorCore, SYS.lockCore, cK);
  const ir = r * 0.4 * (1 - 0.42 * L);
  const lx = look.x * r * 0.2, ly = look.y * r * 0.2;
  const g = id ?? gid('eye', x, y, r);
  const sq = clamp(squash, 0.12, 1);
  return (
    <g transform={`translate(${f2(x)} ${f2(y)}) rotate(${f2(rot)}) scale(${f2(sq)} 1)`}>
      {glow > 0 && open > 0 && (
        <>
          <defs>
            <radialGradient id={g}>
              <stop offset="0%" stopColor={ring} stopOpacity={0.55 * glow} />
              <stop offset="100%" stopColor={ring} stopOpacity={0} />
            </radialGradient>
          </defs>
          <circle cx={0} cy={0} r={r * 2.6} fill={`url(#${g})`} />
        </>
      )}
      <circle cx={0} cy={0} r={r} fill={M.frameDark} stroke={INK} strokeWidth={ink} />
      <circle cx={0} cy={0} r={r * 0.78} fill={M.frame} />
      <circle cx={0} cy={0} r={r * 0.62} fill={M.black} />
      {open > 0 && (
        <g opacity={clamp(open)}>
          <circle cx={lx} cy={ly} r={ir} fill="none" stroke={ring} strokeWidth={r * (0.14 + 0.08 * L)} />
          <circle cx={lx} cy={ly} r={r * (0.13 - 0.03 * L)} fill={core} />
          <circle cx={lx - r * 0.22} cy={ly - r * 0.24} r={r * 0.07} fill="#FFFFFF" opacity={0.8} />
        </g>
      )}
      {open < 1 && <path d={`M ${-r * 0.62} 0 L ${r * 0.62} 0`} stroke={M.frame} strokeWidth={r * 1.24 * (1 - clamp(open))} />}
    </g>
  );
};

// ------------------------------------------------------------------ particles
/** Ballistic position after dt from origin with velocity (vx, vy) and gravity g (world units/s²). */
const ball = (o: V2, vx: number, vy: number, dt: number, g: number) => ({x: o.x + vx * dt, y: o.y + vy * dt + 0.5 * g * dt * dt});

/** A burst of streak sparks. dir (deg) is the main direction, spread (deg) the cone; speed world units/s. */
export const Sparks: React.FC<{t: number; t0: number; x: number; y: number; dir?: number; spread?: number; n?: number; speed?: number; g?: number; life?: number; seed?: number; w?: number; groundY?: number}> = ({
  t, t0, x, y, dir = -90, spread = 140, n = 16, speed = 900, g = 1600, life = 0.6, seed = 1, w = 3, groundY,
}) => {
  const dt0 = t - t0;
  if (dt0 < 0 || dt0 > life * 1.6) return null;
  const out: React.ReactElement[] = [];
  for (let i = 0; i < n; i++) {
    const L = life * (0.45 + 0.8 * rnd(seed * 97 + i * 13));
    if (dt0 > L) continue;
    const a = ((dir + (rnd(seed * 31 + i * 7) - 0.5) * spread) * Math.PI) / 180;
    const sp = speed * (0.35 + 0.9 * rnd(seed * 17 + i * 5));
    const vx = Math.cos(a) * sp, vy = Math.sin(a) * sp;
    let p = ball({x, y}, vx, vy, dt0, g);
    if (groundY !== undefined && p.y > groundY) p = {x: p.x, y: groundY};
    const cvx = vx, cvy = vy + g * dt0;
    const k = 0.028 + 0.02 * rnd(seed + i);
    const q = {x: p.x - cvx * k, y: p.y - cvy * k};
    const fade = 1 - dt0 / L;
    out.push(<line key={i} x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke={fade > 0.55 ? M.sparkHot : fade > 0.25 ? M.spark : M.sparkWarm} strokeWidth={w * (0.6 + fade * 0.6)} strokeLinecap="round" opacity={Math.min(1, fade * 1.6)} />);
  }
  return <g>{out}</g>;
};

/** A short bright electrical crackle at a broken cable end (repeats while `on`). */
export const Crackle: React.FC<{t: number; x: number; y: number; size: number; seed?: number; on?: number}> = ({t, x, y, size, seed = 1, on = 1}) => {
  if (on <= 0) return null;
  const k = Math.floor(t * 18 + seed * 3);
  if (rnd(k * 7 + seed) < 0.45) return null;
  const pts: V2[] = [{x, y}];
  let a = rnd(k * 3 + seed) * Math.PI * 2;
  for (let i = 0; i < 4; i++) {
    a += (rnd(k * 11 + i + seed) - 0.5) * 1.6;
    const prev = pts[pts.length - 1];
    pts.push({x: prev.x + Math.cos(a) * size * 0.35, y: prev.y + Math.sin(a) * size * 0.35});
  }
  return (
    <g opacity={on}>
      <polyline points={pts.map((p) => `${f2(p.x)},${f2(p.y)}`).join(' ')} fill="none" stroke={SYS.sensor} strokeWidth={size * 0.12} strokeLinecap="round" />
      <polyline points={pts.map((p) => `${f2(p.x)},${f2(p.y)}`).join(' ')} fill="none" stroke="#FFFFFF" strokeWidth={size * 0.045} strokeLinecap="round" />
      <circle cx={x} cy={y} r={size * 0.18} fill={M.sparkHot} />
    </g>
  );
};

/** Dark hydraulic fluid: pulsing spurts from (x, y) in direction dir (deg) that break into drops, plus an optional
 *  pool on the ground. amt 0..1 scales the flow. */
export const Fluid: React.FC<{t: number; t0: number; x: number; y: number; dir?: number; amt?: number; speed?: number; seed?: number; w?: number; groundY?: number; pool?: number}> = ({
  t, t0, x, y, dir = 90, amt = 1, speed = 260, seed = 1, w = 10, groundY, pool = 0,
}) => {
  const dt0 = t - t0;
  if (dt0 < 0 || amt <= 0) return null;
  const g = 1500;
  const out: React.ReactElement[] = [];
  const a = (dir * Math.PI) / 180;
  const pulse = 0.55 + 0.45 * Math.max(0, Math.sin(dt0 * 11 + seed));
  const v = speed * pulse;
  // the attached gush: a short tapered blob at the outlet (connected stream for ~0.07 s of flight)
  const gush: V2[] = [];
  for (let i = 0; i <= 6; i++) gush.push(ball({x, y}, Math.cos(a) * v, Math.sin(a) * v, (i / 6) * 0.07, g));
  const nx = -Math.sin(a), ny = Math.cos(a);
  const side1 = gush.map((p, i) => ({x: p.x + nx * w * 0.5 * amt * (1 - i / 8), y: p.y + ny * w * 0.5 * amt * (1 - i / 8)}));
  const side2 = gush.map((p, i) => ({x: p.x - nx * w * 0.5 * amt * (1 - i / 8), y: p.y - ny * w * 0.5 * amt * (1 - i / 8)})).reverse();
  out.push(<path key="gush" d={smoothPath([...side1, ...side2], true, 0.5)} fill={SYS.fluid} />);
  // drops leaving the gush at staggered times, each with its own flight
  for (let i = 0; i < 12; i++) {
    const per = 0.9;
    const ph = ((dt0 + (i / 12) * per) % per);
    const sp = speed * (0.55 + 0.5 * rnd(seed * 5 + i));
    const da = (rnd(seed * 9 + i) - 0.5) * 0.35;
    let p = ball({x, y}, Math.cos(a + da) * sp, Math.sin(a + da) * sp, ph, g);
    if (groundY !== undefined && p.y > groundY) continue;
    const vy = Math.sin(a + da) * sp + g * ph;
    const st = Math.min(2.2, 1 + Math.abs(vy) / 900);
    out.push(<ellipse key={`d${i}`} cx={p.x} cy={p.y} rx={w * 0.38 * amt} ry={w * 0.38 * amt * st} fill={SYS.fluid} />);
  }
  if (groundY !== undefined && pool > 0) {
    const pr = pool * w * 9;
    const land = {x: x + Math.cos(a) * speed * 0.25, y: groundY};
    out.push(<ellipse key="pool" cx={land.x} cy={groundY} rx={pr} ry={pr * 0.16} fill={SYS.fluid} opacity={0.92} />);
    out.push(<ellipse key="poolhi" cx={land.x - pr * 0.3} cy={groundY - pr * 0.03} rx={pr * 0.35} ry={pr * 0.045} fill="#5A6A74" opacity={0.6} />);
  }
  return <g>{out}</g>;
};

/** A flying piece: draws `children` (local coords, origin at the piece centre) moved ballistically after t0 from
 * (x, y) with velocity, spin (deg/s), optional ground bounce. Before t0 it sits at (x, y) with rotation rot0. */
export const Flying: React.FC<{t: number; t0: number; x: number; y: number; vx: number; vy: number; spin: number; rot0?: number; g?: number; groundY?: number; children: React.ReactNode}> = ({
  t, t0, x, y, vx, vy, spin, rot0 = 0, g = 1800, groundY, children,
}) => {
  const dt = Math.max(0, t - t0);
  let p = ball({x, y}, vx, vy, dt, g);
  let rot = rot0 + spin * dt;
  if (groundY !== undefined && p.y > groundY) {
    // one damped bounce then rest
    const tHit = (-vy + Math.sqrt(Math.max(0, vy * vy + 2 * g * (groundY - y)))) / g;
    const after = dt - tHit;
    const vy2 = -(vy + g * tHit) * 0.25, vx2 = vx * 0.35;
    const p2 = ball({x: x + vx * tHit, y: groundY}, vx2, vy2, Math.min(after, Math.max(0, (-2 * vy2) / g)), g);
    p = {x: p2.x, y: Math.min(groundY, p2.y)};
    rot = rot0 + spin * tHit + spin * 0.2 * Math.min(after, 0.4);
  }
  return <g transform={`translate(${f2(p.x)} ${f2(p.y)}) rotate(${f2(rot)})`}>{children}</g>;
};

/** Jagged edge helper: points along a→b with seeded zig-zag of amplitude amp. */
export const jag = (a: V2, b: V2, n: number, amp: number, seed: number): V2[] => {
  const out: V2[] = [];
  const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L, ny = dx / L;
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const k = i === 0 || i === n ? 0 : (rnd(seed * 13 + i * 7) - 0.5) * 2 * amp * (i % 2 ? 1 : 0.45);
    out.push({x: a.x + dx * u + nx * k, y: a.y + dy * u + ny * k});
  }
  return out;
};

/** Soft radial light (for headlights, glows). */
export const Glow: React.FC<{x: number; y: number; r: number; color: string; op?: number; id: string; sx?: number; sy?: number}> = ({x, y, r, color, op = 0.5, id, sx = 1, sy = 1}) => (
  <g transform={`translate(${f2(x)} ${f2(y)}) scale(${f2(sx)} ${f2(sy)})`}>
    <defs>
      <radialGradient id={id}>
        <stop offset="0%" stopColor={color} stopOpacity={op} />
        <stop offset="100%" stopColor={color} stopOpacity={0} />
      </radialGradient>
    </defs>
    <circle cx={0} cy={0} r={r} fill={`url(#${id})`} />
  </g>
);
