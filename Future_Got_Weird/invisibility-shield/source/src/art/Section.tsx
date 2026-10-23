// The local mechanism view. A horizontal cut across the same panel at chest height opens a TOP VIEW section beneath
// it, drawn in the same world x as the front view (left stays left; the lens row sits under the ridges it continues),
// with depth running down the screen: the wall (back), the lead seen from above, the lens row (bumps facing the
// viewer) and the viewer's eye (front). Depth is compressed and the paths are a few representative rays, labelled as
// simplified: body light reaching the lenses is spread sideways (most of it misses the viewer; a little still arrives),
// and background light from beside the body is bent across the space in front of him toward the viewer.
// Front-view overlays (inside the panel above the cut) use the same colours: the dashed outline of where he stands,
// his light spreading sideways, and the background band smearing across the outline.
import React from 'react';
import {add, clamp, fmt, inv, lerp, mul, norm, sub, V} from '../lib/math';
import {easeInOut as eio} from '../lib/math';
import {BODY_X, PANEL, RIDGE, WALL} from '../world';

export const SEC = {x0: 318, x1: 762, y0: 636, y1: 900, wallY: 674, bodyY: 714, panelY: 760, lensY: 772, eye: {x: 540, y: 872}};
export const RAY = {body: '#FFB347', bodyGlow: '#FFD89A', bg: '#3FD0C4', bgGlow: '#9CF0E6'};

const lensXs = (() => {
  const xs: number[] = [];
  const x0 = BODY_X - PANEL.w / 2;
  for (let x = x0 + RIDGE / 2; x < x0 + PANEL.w; x += RIDGE) xs.push(x);
  return xs;
})();
const nearestLens = (x: number) => lensXs.reduce((b, l) => (Math.abs(l - x) < Math.abs(b - x) ? l : b), lensXs[0]);

// a ray drawn on progressively along its polyline (k 0..1), with a soft glow and a small chevron at its head
const Ray: React.FC<{pts: V[]; k: number; col: string; glow: string; w?: number; a?: number; arrow?: boolean}> = ({pts, k, col, glow, w = 2.2, a = 1, arrow = true}) => {
  if (k <= 0.001 || a <= 0.003) return null;
  const segs = pts.slice(1).map((p, i) => Math.hypot(p.x - pts[i].x, p.y - pts[i].y));
  const total = segs.reduce((s, x) => s + x, 0);
  let left = total * clamp(k);
  const out: V[] = [pts[0]];
  let head = pts[0], dir = {x: 0, y: 1};
  for (let i = 0; i < segs.length && left > 0; i++) {
    const u = Math.min(1, left / segs[i]);
    head = add(pts[i], mul(sub(pts[i + 1], pts[i]), u));
    dir = norm(sub(pts[i + 1], pts[i]));
    out.push(head);
    left -= segs[i];
  }
  const d = out.map((p, i) => `${i ? 'L' : 'M'}${fmt(p.x)},${fmt(p.y)}`).join(' ');
  const n = {x: -dir.y, y: dir.x};
  const tip = head, b1 = add(add(head, mul(dir, -6)), mul(n, 3.4)), b2 = add(add(head, mul(dir, -6)), mul(n, -3.4));
  return (
    <g opacity={a}>
      <path d={d} fill="none" stroke={glow} strokeWidth={w * 3} strokeOpacity={0.25} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={col} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
      {arrow && k > 0.05 && <path d={`M${fmt(b1.x)},${fmt(b1.y)} L${fmt(tip.x)},${fmt(tip.y)} L${fmt(b2.x)},${fmt(b2.y)}`} fill="none" stroke={col} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />}
    </g>
  );
};

const Label: React.FC<{x: number; y: number; text: string; a: number; anchor?: 'start' | 'middle' | 'end'; size?: number; col?: string}> = ({x, y, text, a, anchor = 'middle', size = 9.5, col = '#D9EEF0'}) =>
  a > 0.003 ? (
    <text x={fmt(x)} y={fmt(y)} textAnchor={anchor} fontFamily='"Fredoka Variable", "Fredoka", system-ui, sans-serif' fontWeight={600} fontSize={size} letterSpacing="0.06em" fill={col} opacity={a}>
      {text}
    </text>
  ) : null;

export type SectionState = {open: number; spread: number; smear: number; labels: number};

export const Section: React.FC<{id: string; s: SectionState}> = ({id, s}) => {
  if (s.open <= 0.001) return null;
  const h = (SEC.y1 - SEC.y0) * clamp(s.open);
  const bodyRays = [480, 540, 600].map((x, i) => {
    const lx = nearestLens(x);
    const src = {x, y: SEC.bodyY + 24 - Math.abs(x - BODY_X) * 0.06};
    const lens = {x: lx, y: SEC.lensY + 4};
    const k1 = eio(inv(0.0 + i * 0.06, 0.4 + i * 0.06, s.spread));
    const k2 = eio(inv(0.38 + i * 0.05, 1, s.spread));
    const fan = [-66, 62].map((deg) => {
      const r = (deg * Math.PI) / 180;
      return {x: lens.x + Math.sin(r) * 120, y: lens.y + Math.cos(r) * 120};
    });
    return {src, lens, k1, k2, fan};
  });
  const bgRays = [
    [330, 440], [345, 465], [360, 490],
    [750, 640], [735, 615], [720, 590],
  ].map(([wx, lx], i) => {
    const src = {x: wx, y: SEC.wallY + 6};
    const lens = {x: nearestLens(lx), y: SEC.lensY + 4};
    const k = eio(inv(0.05 + (i % 3) * 0.08, 0.85 + (i % 3) * 0.05, s.smear));
    return {pts: [src, lens, SEC.eye], k};
  });
  const residK = eio(inv(0.7, 1, s.spread));
  return (
    <g>
      <defs>
        <clipPath id={`${id}-box`}>
          <rect x={SEC.x0} y={SEC.y0} width={SEC.x1 - SEC.x0} height={fmt(h)} />
        </clipPath>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0E2A33" />
          <stop offset="1" stopColor="#123943" />
        </linearGradient>
      </defs>
      {/* the cut line across the front view */}
      <line x1={SEC.x0} y1={SEC.y0} x2={SEC.x1} y2={SEC.y0} stroke="#FFFFFF" strokeWidth={2.2} strokeDasharray="8 5" opacity={clamp(s.open * 3)} />
      <g clipPath={`url(#${id}-box)`}>
        <rect x={SEC.x0} y={SEC.y0} width={SEC.x1 - SEC.x0} height={SEC.y1 - SEC.y0} fill={`url(#${id}-bg)`} opacity={0.96} />
        {/* fold shading at the hinge */}
        <rect x={SEC.x0} y={SEC.y0} width={SEC.x1 - SEC.x0} height={10} fill="#000" opacity={0.25} />
        {/* wall (back), seen from above: the painted band's colour, continuous behind everything */}
        <rect x={SEC.x0} y={SEC.wallY - 6} width={SEC.x1 - SEC.x0} height={12} fill="#1CA7A0" />
        <rect x={SEC.x0} y={SEC.wallY - 6} width={SEC.x1 - SEC.x0} height={3} fill="#5CC7BF" />
        {/* the lead from above: shoulders, head, arms forward to the grips */}
        <g>
          {[-1, 1].map((sd) => (
            <path key={sd} d={`M${fmt(BODY_X + sd * 98)},${fmt(SEC.bodyY + 4)} L${fmt(BODY_X + sd * PANEL.gripX)},${fmt(SEC.panelY - 6)}`} stroke="#F2C9A8" strokeWidth={16} strokeLinecap="round" />
          ))}
          <ellipse cx={BODY_X} cy={SEC.bodyY} rx={116} ry={24} fill="#FFFFFF" stroke="#172B3A" strokeWidth={2.4} />
          <ellipse cx={BODY_X} cy={SEC.bodyY} rx={116} ry={24} fill="none" stroke="#FFC744" strokeWidth={5} strokeDasharray="10 12" opacity={0.7} />
          <circle cx={BODY_X} cy={SEC.bodyY - 2} r={27} fill="#C0392B" stroke="#172B3A" strokeWidth={2.4} />
          <path d={`M${fmt(BODY_X - 9)},${fmt(SEC.bodyY + 23)} Q${fmt(BODY_X)},${fmt(SEC.bodyY + 32)} ${fmt(BODY_X + 9)},${fmt(SEC.bodyY + 23)}`} fill="#F2C9A8" stroke="#172B3A" strokeWidth={2} />
        </g>
        {/* the panel: clear slab with its lens bumps facing the viewer */}
        <rect x={BODY_X - PANEL.w / 2} y={SEC.panelY} width={PANEL.w} height={SEC.lensY - SEC.panelY} fill="#CFF1F4" opacity={0.85} />
        <path
          d={`M${fmt(BODY_X - PANEL.w / 2)},${SEC.lensY} ` + lensXs.map((x) => `A${RIDGE / 2},${RIDGE / 2 + 1} 0 0 0 ${fmt(x + RIDGE / 2)},${SEC.lensY}`).join(' ')}
          fill="#CFF1F4"
          stroke="#E9FBFC"
          strokeWidth={1.4}
        />
        <rect x={BODY_X - PANEL.w / 2} y={SEC.panelY} width={PANEL.w} height={SEC.lensY - SEC.panelY + RIDGE / 2 + 1} fill="none" stroke="#7FB3BE" strokeWidth={1} opacity={0.6} />
        {/* the viewer */}
        <g>
          <path d={`M${SEC.eye.x - 16},${SEC.eye.y} Q${SEC.eye.x},${SEC.eye.y - 11} ${SEC.eye.x + 16},${SEC.eye.y} Q${SEC.eye.x},${SEC.eye.y + 11} ${SEC.eye.x - 16},${SEC.eye.y} Z`} fill="#FFFFFF" stroke="#D9EEF0" strokeWidth={1.6} />
          <circle cx={SEC.eye.x} cy={SEC.eye.y - 0.5} r={5.5} fill="#2E6B76" />
          <circle cx={SEC.eye.x} cy={SEC.eye.y - 0.5} r={2.4} fill="#0B1A1F" />
        </g>
        {/* body light: to the lenses, then fanned out sideways; a little still reaches the viewer */}
        {bodyRays.map((b, i) => (
          <g key={`b${i}`}>
            <Ray pts={[b.src, b.lens]} k={b.k1} col={RAY.body} glow={RAY.bodyGlow} arrow={b.k2 < 0.01} />
            {b.fan.map((f, j) => (
              <Ray key={j} pts={[b.lens, f]} k={b.k2} col={RAY.body} glow={RAY.bodyGlow} a={0.9} />
            ))}
            {i === 1 && <Ray pts={[b.lens, SEC.eye]} k={residK} col={RAY.body} glow={RAY.bodyGlow} w={1.3} a={0.45} />}
          </g>
        ))}
        {/* background light: from beside him, bent across the space in front of him toward the viewer */}
        {bgRays.map((r, i) => (
          <Ray key={`g${i}`} pts={r.pts} k={r.k} col={RAY.bg} glow={RAY.bgGlow} />
        ))}
        <Label x={SEC.x0 + 12} y={SEC.y0 + 22} text="TOP VIEW · SIMPLIFIED LIGHT PATHS" a={s.labels} anchor="start" size={10.5} col="#FFFFFF" />
        <Label x={SEC.x1 - 12} y={SEC.wallY + 20} text="WALL" a={s.labels} anchor="end" />
        <Label x={BODY_X + 140} y={SEC.bodyY + 4} text="YOU" a={s.labels} anchor="start" />
        <Label x={SEC.x1 - 12} y={SEC.lensY + 24} text="LENSES" a={s.labels} anchor="end" />
        <Label x={SEC.eye.x + 26} y={SEC.eye.y + 4} text="VIEWER" a={s.labels} anchor="start" />
      </g>
      {/* hinge edge */}
      <line x1={SEC.x0} y1={SEC.y0} x2={SEC.x1} y2={SEC.y0} stroke="#FFFFFF" strokeWidth={1.4} opacity={clamp(s.open * 3) * 0.8} />
    </g>
  );
};

// ---------------------------------------------------------------- front-view overlays (inside the panel clip)
export const FrontOverlay: React.FC<{id: string; outline: number; spread: number; smear: number; torsoD: string; head: V}> = ({id, outline, spread, smear, torsoD, head}) => {
  if (outline <= 0.003) return null;
  const y0 = 300, y1 = SEC.y0;
  // his light: a warm column that widens sideways and thins out
  const sw = lerp(170, PANEL.w * 1.1, eio(spread));
  const warmA = outline * (0.34 * (1 - spread) + 0.12 * spread) * (1 - 0.7 * smear);
  // the background band closing across the outline from both sides
  const gap = lerp(120, 0, eio(smear));
  const bandA = outline * clamp(smear * 4);
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-warm`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={RAY.body} stopOpacity={0} />
          <stop offset="0.5" stopColor={RAY.body} stopOpacity={1} />
          <stop offset="1" stopColor={RAY.body} stopOpacity={0} />
        </linearGradient>
        <linearGradient id={`${id}-bandL`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#1CA7A0" stopOpacity={1} />
          <stop offset="0.8" stopColor="#1CA7A0" stopOpacity={1} />
          <stop offset="1" stopColor="#1CA7A0" stopOpacity={0} />
        </linearGradient>
        <linearGradient id={`${id}-bandR`} x1="1" y1="0" x2="0" y2="0">
          <stop offset="0" stopColor="#1CA7A0" stopOpacity={1} />
          <stop offset="0.8" stopColor="#1CA7A0" stopOpacity={1} />
          <stop offset="1" stopColor="#1CA7A0" stopOpacity={0} />
        </linearGradient>
      </defs>
      <rect x={fmt(BODY_X - sw / 2)} y={y0} width={fmt(sw)} height={y1 - y0} fill={`url(#${id}-warm)`} opacity={fmt(warmA)} />
      {/* the band's two halves sliding in across the outline (the background spread across where he stands) */}
      {bandA > 0.003 && (
        <g opacity={fmt(bandA)}>
          <rect x={BODY_X - 260} y={WALL.band[0]} width={fmt(260 - gap)} height={WALL.band[1] - WALL.band[0]} fill={`url(#${id}-bandL)`} />
          <rect x={fmt(BODY_X + gap)} y={WALL.band[0]} width={fmt(260 - gap)} height={WALL.band[1] - WALL.band[0]} fill={`url(#${id}-bandR)`} />
        </g>
      )}
      {/* dashed outline of where he is standing */}
      <g opacity={fmt(outline * 0.9)} fill="none" stroke="#FFFFFF" strokeWidth={2.6} strokeDasharray="9 7" strokeLinecap="round">
        <path d={torsoD} />
        <ellipse cx={fmt(head.x)} cy={fmt(head.y - 6)} rx={98} ry={106} />
      </g>
    </g>
  );
};
