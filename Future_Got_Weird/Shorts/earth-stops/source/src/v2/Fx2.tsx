import React from 'react';
import {C} from '../theme';
import {rand} from '../lib/anim';
import {COFFEE, COFFEE_HI} from './props';
import {EVT, GYW, PARCEL_B0, STREAM_TB, hipX, lowestShoeX, parcels, vHip, V0, Parcel} from './choreo2';

type P2 = {x: number; y: number};

/** Catmull-Rom through points -> cubic Bezier path segments (no leading M) */
const crPath = (pts: P2[]): string => {
  if (pts.length < 2) return '';
  let d = '';
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1 = {x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6};
    const c2 = {x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6};
    d += ` C ${c1.x.toFixed(1)} ${c1.y.toFixed(1)} ${c2.x.toFixed(1)} ${c2.y.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
};

/* ------------------------------------------------------------------ world-fixed ground effects: dust, skid marks, stains */
const Puff: React.FC<{x: number; y: number; age: number; seed: number}> = ({x, y, age, seed}) => {
  const life = 26;
  if (age < 0 || age > life) return null;
  const r = 26 + age * 3.1, o = 1 - (age / life) ** 2;
  const dx = (rand(seed) - 0.5) * 30, rise = age * 0.8;
  const pts: [number, number, number][] = [[-0.6 * r + dx, 0, 0.8], [0.35 * r + dx, -0.45 * r, 1], [0.7 * r + dx, 0.1 * r, 0.7]];
  return (
    <g opacity={o} transform={`translate(${x} ${y - rise})`}>
      {pts.map(([px, py, s], i) => <circle key={`o${i}`} cx={px} cy={py} r={r * s * 0.7 + 4.5} fill={C.ink} />)}
      {pts.map(([px, py, s], i) => <circle key={`s${i}`} cx={px} cy={py + r * 0.12} r={r * s * 0.7} fill="#CDB98C" />)}
      {pts.map(([px, py, s], i) => <circle key={`f${i}`} cx={px - r * 0.06} cy={py - r * 0.1} r={r * s * 0.62} fill="#FFFFFF" />)}
    </g>
  );
};

const blob = (cx: number, cy: number, rx: number, ry: number, seed: number, n = 9): string => {
  const pts: P2[] = Array.from({length: n}).map((_, i) => {
    const a = (i / n) * Math.PI * 2, k = 0.72 + 0.55 * rand(seed * 7 + i * 3);
    return {x: cx + Math.cos(a) * rx * k, y: cy + Math.sin(a) * ry * k};
  });
  const mid = (a: P2, b: P2) => ({x: (a.x + b.x) / 2, y: (a.y + b.y) / 2});
  let d = `M ${mid(pts[n - 1], pts[0]).x} ${mid(pts[n - 1], pts[0]).y}`;
  for (let i = 0; i < n; i++) { const m = mid(pts[i], pts[(i + 1) % n]); d += ` Q ${pts[i].x} ${pts[i].y} ${m.x} ${m.y}`; }
  return d + ' Z';
};

/** t0: first frame of skidding (E-A is already skidding at frame 0, so t0 = -8; E-C starts at the stop, t0 = 0). b0: coffee birth offset. */
export const GroundFx: React.FC<{f: number; t0?: number; b0?: number}> = ({f, t0 = -8, b0 = PARCEL_B0}) => {
  const emit: number[] = [-6, -4, -2, 0, 2, 4, 6, 8, EVT.land, EVT.land, EVT.land + 2].filter((e) => e >= t0 + 2);
  for (let e = EVT.land + 4; e <= 66; e += 3) emit.push(e);
  const skidA = {x0: lowestShoeX(t0), x1: lowestShoeX(Math.max(t0, Math.min(f, EVT.launch - 1)))}; // the mark grows behind the contact point, never ahead of it
  const skidB = {x0: lowestShoeX(EVT.land), x1: lowestShoeX(Math.min(f, 66))};
  const stains = parcels(f, b0).filter((p) => p.landed);
  return (
    <g>
      {f >= t0 && <path d={`M ${skidA.x0} ${GYW - 3} L ${skidA.x1} ${GYW - 3}`} stroke={C.ink} strokeWidth={11} strokeLinecap="round" opacity={0.34} />}
      {f > EVT.land && <path d={`M ${skidB.x0} ${GYW - 3} L ${skidB.x1} ${GYW - 3}`} stroke={C.ink} strokeWidth={11} strokeLinecap="round" opacity={0.34} />}
      {stains.map((p) => {
        const big = p.r > 7;
        const rx = (big ? 12 + p.r * 1.7 : 5 + p.r) * (0.8 + 0.5 * rand(p.k * 5));
        const ry = rx * 0.34;
        return (
          <g key={`st${p.k}`}>
            <path d={blob(p.x, p.y + 2, rx * 1.18, ry * 1.25, p.k + 1)} fill="#6B4A2B" />
            <path d={blob(p.x, p.y + 1, rx, ry, p.k + 9)} fill={COFFEE} />
          </g>
        );
      })}
      {stains.filter((p) => p.sinceLand >= 0 && p.sinceLand < 9 && p.r > 7).map((p) =>
        [-3, 0.8, 3.4].map((vx, i) => {
          const t = p.sinceLand, vy = [8, 11, 7][i];
          return <circle key={`c${p.k}-${i}`} cx={p.x + vx * t * 1.5} cy={p.y - (vy * t - 0.45 * t * t)} r={Math.max(2, 5 - t * 0.4)} fill={COFFEE} />;
        }),
      )}
      {emit.map((e, i) => <Puff key={i} x={lowestShoeX(e) - 24} y={GYW - 16} age={f - e} seed={i * 7 + e + 40} />)}
    </g>
  );
};

/* ------------------------------------------------------------------ the airborne coffee: one tapered ribbon that breaks into unequal drops */
export const CoffeeFx: React.FC<{f: number; b0?: number}> = ({f, b0 = PARCEL_B0}) => {
  const ps = parcels(f, b0);
  const rib = ps.filter((p) => p.ribbon).sort((a, b) => b.k - a.k); // newest (at the mug) first
  const drops = ps.filter((p) => !p.landed && !p.ribbon);
  let ribbon: React.ReactNode = null;
  if (rib.length > 3) {
    const pts = rib.map((p) => ({x: p.x, y: p.y}));
    const wid = rib.map((p) => p.w * Math.pow(Math.max(0, 1 - p.age / STREAM_TB), 0.65)); // full width at the mouth, tapering along the stream
    const L: P2[] = [], R: P2[] = [], top: P2[] = [];
    pts.forEach((p, i) => {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      let nx = -(b.y - a.y), ny = b.x - a.x; const len = Math.hypot(nx, ny) || 1; nx /= len; ny /= len;
      const h = wid[i] / 2;
      L.push({x: p.x + nx * h, y: p.y + ny * h}); R.push({x: p.x - nx * h, y: p.y - ny * h});
      const up = ny < 0 ? 1 : -1; top.push({x: p.x + nx * h * 0.45 * up, y: p.y + ny * h * 0.45 * up});
    });
    const Rr = [...R].reverse();
    const d = `M ${L[0].x.toFixed(1)} ${L[0].y.toFixed(1)}${crPath(L)} L ${Rr[0].x.toFixed(1)} ${Rr[0].y.toFixed(1)}${crPath(Rr)} Z`;
    ribbon = (
      <g>
        <path d={d} fill={COFFEE} stroke={C.ink} strokeWidth={2.6} strokeLinejoin="round" />
        <path d={`M ${top[0].x.toFixed(1)} ${top[0].y.toFixed(1)}${crPath(top.slice(0, Math.max(2, top.length - 2)))}`} fill="none" stroke={COFFEE_HI} strokeWidth={3} strokeLinecap="round" opacity={0.75} />
      </g>
    );
  }
  return (
    <g>
      {ribbon}
      {drops.map((p: Parcel) => {
        const ang = (Math.atan2(p.vy, p.vx) * 180) / Math.PI;
        const rx = p.r * p.stretch, ry = p.r / (0.8 * p.stretch + 0.2);
        return (
          <g key={`d${p.k}`} transform={`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${ang.toFixed(1)})`}>
            <ellipse cx={0} cy={0} rx={rx} ry={ry} fill={COFFEE} stroke={p.r > 8 ? C.ink : 'none'} strokeWidth={2.4} />
            {p.r > 10 && <ellipse cx={-rx * 0.25} cy={-ry * 0.35} rx={rx * 0.3} ry={ry * 0.2} fill={COFFEE_HI} opacity={0.85} />}
          </g>
        );
      })}
    </g>
  );
};

/** ground shadow under the hero: world-fixed height cue (shrinks and fades as she leaves the ground) */
export const HeroShadow: React.FC<{x: number; lift: number}> = ({x, lift}) => {
  const s = Math.max(0, Math.min(1, 1 - lift / 300));
  return <ellipse cx={x} cy={GYW + 4} rx={140 - 36 * (1 - s)} ry={16} fill={C.shadow} opacity={0.3 + 0.7 * s} />;
};
void hipX; void vHip; void V0;
