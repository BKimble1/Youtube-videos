// HOOK 03 environment: a still pond. Above the waterline a soft out-of-focus bank; below it muted green-teal water
// with blurred weed stems at two depths (parallax), faint light shafts and drifting motes. The waterline is drawn at
// the subject's depth as a 2.5D split line; the plunge adds a crown splash, droplets, surface rings and an
// entrained bubble cloud that rises past the camera.
import React from 'react';
import {Basis, capsule2, proj, smoothClosed, smoothOpen, V3} from '../shared/three';
import {clamp, hash, ss} from '../shared/lib';
import {Item} from './core/draw3';
import {mix, rgba} from '../shared/color';

const f2 = (n: number) => n.toFixed(2);
export const WATER = {top: '#4E9690', mid: '#2C6767', deep: '#1B4449', tint: '#2D6E6E'};

/** screen y of the waterline at the subject's depth (world y = 0) */
export const surfaceY = (B: Basis) => proj(B, [B.eye[0] + B.fw[0] * 200, 0, 0]).y;

export const Backdrop: React.FC<{B: Basis; t: number}> = ({B, t}) => {
  const ys = surfaceY(B);
  const yd = proj(B, [B.eye[0], 0, -260]).y;
  const under = clamp(-B.eye[2] / 25); // 0 camera at the surface .. 1 below
  // weed stems at two depths, from below up toward the surface
  const stems = (yW: number, n: number, seed: number, col: string, blur: string, op: number) => (
    <g filter={blur} opacity={op}>
      {Array.from({length: n}, (_, i) => {
        const x0 = -520 + (i + 0.3 * hash(i + seed)) * (1000 / n);
        const top = -18 - 90 * hash(i * 3.1 + seed);
        const sway = 6 * Math.sin(t * 0.7 + i * 1.3);
        const pts = [0, 1, 2, 3, 4].map((k) => proj(B, [x0 + 14 * Math.sin(k * 0.9 + i) + sway * (k / 4), yW, -520 + ((top + 520) * k) / 4]));
        const w = 3.2 * pts[2].s;
        const leaves = [0.35, 0.55, 0.75].map((u, k) => {
          const p = proj(B, [x0 + 14 * Math.sin(u * 3.6 + i) + sway * u, yW, -520 + (top + 520) * u]);
          const L = (16 + 10 * hash(i + k)) * p.s, dir = (k + i) % 2 ? 1 : -1;
          return <path key={k} d={`M${f2(p.x)},${f2(p.y)} q${f2(dir * L * 0.6)},${f2(-L * 0.5)} ${f2(dir * L)},${f2(-L * 0.2)} q${f2(-dir * L * 0.5)},${f2(L * 0.25)} ${f2(-dir * L)},${f2(L * 0.2)}Z`} fill={col} />;
        });
        return (
          <g key={i}>
            <path d={smoothOpen(pts)} stroke={col} strokeWidth={f2(w)} fill="none" strokeLinecap="round" />
            {leaves}
          </g>
        );
      })}
    </g>
  );
  // light shafts from the surface
  const shafts = [-160, -60, 40, 150, 260].map((x, i) => {
    const sw = 10 * Math.sin(t * 0.5 + i * 2.1);
    const a = proj(B, [x + sw, 220, 0]), b = proj(B, [x + sw + 30, 220, 0]);
    const c = proj(B, [x + sw - 60, 220, -380]), d = proj(B, [x + sw + 40, 220, -380]);
    return <path key={i} d={`M${f2(a.x)},${f2(a.y)} L${f2(b.x)},${f2(b.y)} L${f2(d.x)},${f2(d.y)} L${f2(c.x)},${f2(c.y)}Z`} fill="url(#h3shaft)" opacity={0.5 + 0.3 * Math.sin(t * 1.1 + i)} />;
  });
  // the far bank (above the waterline): soft rounded shrubs and a few reeds, out of focus
  const bank = [
    ...Array.from({length: 22}, (_, i) => {
      const x = -640 + i * 60 + 25 * hash(i * 7.7);
      const r = 26 + 22 * hash(i * 2.3);
      const p0 = proj(B, [x, 520, r * 0.2]);
      const R = r * p0.s;
      return <ellipse key={`s${i}`} cx={f2(p0.x)} cy={f2(p0.y)} rx={f2(R * 1.25)} ry={f2(R * 0.8)} fill={hash(i * 3.3) > 0.5 ? '#9DBC94' : '#8DB085'} />;
    }),
    ...Array.from({length: 14}, (_, i) => {
      const x = -560 + i * 85 + 40 * hash(i * 1.3);
      const h = 70 + 60 * hash(i * 4.1);
      const lean = 25 * (hash(i * 5.1) - 0.5);
      const p0 = proj(B, [x, 480, 0]), p1 = proj(B, [x + lean * 0.4, 480, h * 0.6]), p2 = proj(B, [x + lean, 480, h]);
      return <path key={`r${i}`} d={`M${f2(p0.x)},${f2(p0.y)} Q${f2(p1.x)},${f2(p1.y)} ${f2(p2.x)},${f2(p2.y)}`} stroke="#8DAF86" strokeWidth={f2(1.8 * p0.s)} fill="none" strokeLinecap="round" />;
    }),
  ];
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
      <defs>
        <linearGradient id="h3water" gradientUnits="userSpaceOnUse" x1="0" y1={f2(ys)} x2="0" y2={f2(yd)}>
          <stop offset="0" stopColor={WATER.top} />
          <stop offset="0.45" stopColor={WATER.mid} />
          <stop offset="1" stopColor={WATER.deep} />
        </linearGradient>
        <linearGradient id="h3sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#D8E8DC" />
          <stop offset="1" stopColor="#A9C7A6" />
        </linearGradient>
        <linearGradient id="h3shaft" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#D9F2E6" stopOpacity="0.2" />
          <stop offset="1" stopColor="#D9F2E6" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="h3under" gradientUnits="userSpaceOnUse" x1="0" y1={f2(ys - 300)} x2="0" y2={f2(ys)}>
          <stop offset="0" stopColor="#7DBBB2" />
          <stop offset="1" stopColor="#B8E0D6" />
        </linearGradient>
        <filter id="h3b6" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="7" /></filter>
        <filter id="h3b3" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3.5" /></filter>
      </defs>
      <rect x={0} y={0} width={1080} height={1920} fill="url(#h3water)" />
      {shafts}
      {stems(380, 16, 1, mix(WATER.mid, '#3F7A5E', 0.5), 'url(#h3b6)', 0.55)}
      {stems(170, 9, 7, mix(WATER.mid, '#2E5E48', 0.6), 'url(#h3b3)', 0.6)}
      {ys > -50 && (
        <g>
          <rect x={0} y={-10} width={1080} height={f2(Math.max(0, ys + 10))} fill="url(#h3sky)" />
          <clipPath id="h3above"><rect x={0} y={-10} width={1080} height={f2(Math.max(0, ys + 10))} /></clipPath>
          <g clipPath="url(#h3above)"><g filter="url(#h3b6)" opacity={0.55}>{bank}</g></g>
          <rect x={0} y={-10} width={1080} height={f2(Math.max(0, ys + 10))} fill="url(#h3under)" opacity={under * 0.85} />
        </g>
      )}
    </svg>
  );
};

/** drifting motes (in front of and behind the subject) */
export const motes = (B: Basis, t: number, near: boolean): React.ReactNode => {
  const out: React.ReactNode[] = [];
  for (let i = 0; i < 90; i++) {
    const y = near ? -60 - 80 * hash(i * 1.7) : 20 + 260 * hash(i * 1.7);
    if (near && i > 30) break;
    const x = -320 + 600 * hash(i * 3.3) + 6 * Math.sin(t * 0.6 + i);
    const z = -8 - 380 * hash(i * 5.9) + 4 * Math.sin(t * 0.4 + i * 2) - 3 * t;
    if (z > -3) continue;
    const p = proj(B, [x, y, z]);
    if (p.z < 20 || p.x < -20 || p.x > 1100 || p.y < -20 || p.y > 1940) continue;
    const r = (0.25 + 0.35 * hash(i * 9.1)) * p.s * (near ? 1.4 : 1);
    out.push(<circle key={i} cx={f2(p.x)} cy={f2(p.y)} r={f2(Math.max(0.8, r))} fill="#D5EEE2" opacity={near ? 0.22 : 0.35 * (0.5 + 0.5 * hash(i))} />);
  }
  return <g>{out}</g>;
};

/** the waterline (bright meniscus band with small waves) and the expanding rings from the entry point */
export const Waterline: React.FC<{B: Basis; t: number; entry: V3}> = ({B, t, entry}) => {
  const ys = surfaceY(B);
  if (ys < -40 || ys > 1960) return null;
  const s = proj(B, [entry[0], 0, 0]).s;
  const amp = Math.max(1.5, 0.35 * s) * (0.5 + 0.5 * Math.exp(-t / 0.8));
  const pts = Array.from({length: 28}, (_, i) => {
    const x = -20 + i * 42;
    const dx = (x - proj(B, entry).x) / Math.max(1, s);
    const ringW = Math.exp(-(((Math.abs(dx) - 30 * (t + 0.25)) / 8) ** 2)) * 2.2;
    return {x, y: ys + amp * Math.sin(x * 0.012 + t * 2.4) + amp * ringW * Math.sin(dx * 0.4 - t * 10)};
  });
  const rings = [0, 1, 2].map((k) => {
    const r = 6 + 42 * (t + 0.22 - k * 0.14);
    if (r < 3) return null;
    const P = Array.from({length: 30}, (_, i) => {
      const a = (i / 30) * Math.PI * 2;
      return proj(B, [entry[0] + r * Math.cos(a), entry[1] + r * Math.sin(a), 0]);
    });
    return <path key={k} d={smoothClosed(P)} fill="none" stroke="#F2FBF7" strokeWidth={f2(Math.max(1.2, 0.18 * s))} opacity={0.75 * Math.exp(-r / 40) * (1 - clamp(-B.eye[2] / 8))} />;
  });
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
      <path d={`${smoothOpen(pts)} L1100,1960 L-20,1960Z`} fill={WATER.tint} opacity={0.14} />
      {rings}
      <path d={smoothOpen(pts)} fill="none" stroke="#E9F7F1" strokeWidth={f2(Math.max(2.5, 0.32 * s))} opacity={0.9} />
      <path d={smoothOpen(pts.map((p) => ({x: p.x, y: p.y + Math.max(3, 0.6 * s)})))} fill="none" stroke="#BFE3DA" strokeWidth={f2(Math.max(2, 0.4 * s))} opacity={0.4} />
    </svg>
  );
};

/** the impact splash around the entry point: a ring of thrown droplets and a few thin sheet fragments that lift off the
 *  rim and fall back (no solid crown, so nothing hides the head below the surface) */
export const splashItems = (B: Basis, t: number, entry: V3): Item[] => {
  const items: Item[] = [];
  // thin sheet fragments: short curved slivers of the rim, thrown up and out, breaking up by ~0.35 s
  for (let i = 0; i < 9; i++) {
    const a0 = 2 * Math.PI * (i / 9 + 0.07 * hash(i * 3.9));
    const t0 = -0.1;
    const tau = t - t0;
    const life = tau / (0.36 + 0.1 * hash(i));
    if (life >= 1) continue;
    const span = (0.38 + 0.2 * hash(i * 2.1)) * (1 - 0.4 * life);
    const R = 4 + (60 + 40 * hash(i * 5.3)) * tau;
    const hTop = (2.5 + 3 * hash(i * 7.1)) * Math.sin(Math.PI * Math.min(1, life * 1.1));
    const n = 7;
    const lo: {x: number; y: number}[] = [], hi: {x: number; y: number}[] = [];
    for (let k = 0; k <= n; k++) {
      const a = a0 + span * (k / n - 0.5);
      const bulge = Math.sin((Math.PI * k) / n);
      lo.push(proj(B, [entry[0] + R * Math.cos(a), entry[1] + R * Math.sin(a), hTop * 0.35 * bulge]));
      hi.push(proj(B, [entry[0] + (R + 1.6) * Math.cos(a), entry[1] + (R + 1.6) * Math.sin(a), hTop * (0.75 + 0.25 * bulge)]));
    }
    const C = proj(B, [entry[0] + R * Math.cos(a0), entry[1] + R * Math.sin(a0), hTop * 0.6]);
    items.push({
      z: C.z,
      el: (
        <g key={`sh${i}`} opacity={1 - life ** 2}>
          <path d={smoothClosed([...lo, ...[...hi].reverse()])} fill="rgba(226,247,242,0.4)" stroke={rgba('#F8FFFD', 0.95)} strokeWidth={f2(Math.max(1, 0.12 * C.s))} strokeLinejoin="round" />
        </g>
      ),
    });
  }
  // droplets: a ring thrown from the rim, ballistic, round with a short trail
  for (let i = 0; i < 44; i++) {
    const a = 2 * Math.PI * (i / 44 + 0.4 * hash(i * 4.1) / 44);
    const t0 = -0.13 + 0.1 * hash(i * 1.9);
    const tau = t - t0;
    if (tau <= 0) continue;
    const vr = 60 + 170 * hash(i * 6.3), vz = 220 + 420 * hash(i * 8.7);
    const z = vz * tau - 4905 * tau * tau;
    if (z < -0.5) continue;
    const r0 = 4 + vr * tau;
    const p = [entry[0] + r0 * Math.cos(a), entry[1] + r0 * Math.sin(a), z] as V3;
    const P = proj(B, p);
    const vzNow = vz - 9810 * tau;
    const q = proj(B, [p[0] - Math.cos(a) * vr * 0.005, p[1] - Math.sin(a) * vr * 0.005, z - vzNow * 0.005]);
    const rr = (0.25 + 0.55 * hash(i * 2.2)) * P.s;
    items.push({
      z: P.z,
      el: (
        <g key={`d${i}`}>
          <path d={`M${f2(q.x)},${f2(q.y)} L${f2(P.x)},${f2(P.y)}`} stroke="rgba(225,246,240,0.3)" strokeWidth={f2(rr * 1.0)} strokeLinecap="round" />
          <circle cx={f2(P.x)} cy={f2(P.y)} r={f2(rr)} fill="#E4F6F1" stroke="rgba(23,43,58,0.35)" strokeWidth={0.8} />
          <circle cx={f2(P.x - rr * 0.3)} cy={f2(P.y - rr * 0.35)} r={f2(rr * 0.32)} fill="#FFFFFF" />
        </g>
      ),
    });
  }
  return items;
};

/** the air pocket dragged down along the plunging prothorax (from the surface to the neck, never over the face): a
 *  silvery sheath that pinches off near the surface and breaks into bubbles by ~0.4 s */
export const airPocketItem = (B: Basis, t: number, along: (x: number) => V3, z: number): Item | null => {
  const fade = 1 - ss(t, 0.1, 0.36);
  if (fade < 0.02) return null;
  // the current surface crossing along the prothorax
  let xc = 0;
  for (let x = 0; x <= 20; x += 0.25) if (along(x)[2] <= 0) { xc = x; break; }
  const xTop = xc + (18.5 - xc) * ss(t, 0.05, 0.4) * 0.7;
  const xBot = 19.5;
  if (xBot - xTop < 1) return null;
  const A = proj(B, along(xTop)), Bp = proj(B, along(xBot));
  const ang = (Math.atan2(Bp.y - A.y, Bp.x - A.x) * 180) / Math.PI;
  // an irregular sheath of air: elongated silvery lobes riding on the upper side of the prothorax, wobbling
  const lobes = Array.from({length: 7}, (_, k) => {
    const u = k / 6;
    const x = xTop + (xBot - xTop) * u;
    const P = proj(B, along(x));
    const rx = (2.2 + 0.8 * hash(k * 3.1)) * P.s * (1 - 0.3 * u), ry = (1.1 + 0.5 * hash(k * 7.7)) * P.s * (1 + 0.15 * Math.sin(t * 30 + k));
    const off = -0.9 * P.s;
    const nx = Math.sin((ang * Math.PI) / 180) * off, ny = -Math.cos((ang * Math.PI) / 180) * off;
    return <ellipse key={k} cx={f2(P.x - nx)} cy={f2(P.y - ny)} rx={f2(rx)} ry={f2(ry)} transform={`rotate(${f2(ang + 8 * Math.sin(t * 20 + k))} ${f2(P.x - nx)} ${f2(P.y - ny)})`} fill="rgba(226,247,242,0.13)" stroke="rgba(240,252,248,0.55)" strokeWidth={f2(Math.max(1, 0.1 * P.s))} />;
  });
  return {
    z,
    el: (
      <g key="air" opacity={fade}>
        {lobes}
      </g>
    ),
  };
};

export type BubbleSrc = (ts: number, k: number) => V3;

/** entrained air from the plunge plus a few later bubbles escaping the mantis; they rise and wobble */
export const bubbleItems = (B: Basis, t: number, src: BubbleSrc, srcVel: (ts: number) => V3): Item[] => {
  const items: Item[] = [];
  const draw = (i: number, ts: number, rMm: number) => {
    const tau = t - ts;
    if (tau < 0) return;
    const p0 = src(ts, i);
    if (p0[2] > -0.5) return;
    const v0 = srcVel(ts);
    const rise = 150 + 120 * Math.min(1, rMm / 1.5);
    // carried down by the wake at first, then buoyancy wins (exponential relaxation to the rise speed)
    const k = 0.12;
    const zv = (v0[2] * 0.55 - rise) * k * (1 - Math.exp(-tau / k)) + rise * tau;
    const x = p0[0] + v0[0] * 0.4 * k * (1 - Math.exp(-tau / k)) + 2.5 * Math.sin(tau * 9 + i);
    const z = p0[2] + zv;
    if (z > -0.6) return;
    const P = proj(B, [x, p0[1] + 3 * Math.sin(i), z]);
    if (P.y < -30 || P.y > 1950) return;
    const r = Math.max(1.2, rMm * P.s);
    items.push({
      z: P.z,
      el: (
        <g key={`b${i}`}>
          <circle cx={f2(P.x)} cy={f2(P.y)} r={f2(r)} fill="rgba(210,240,234,0.22)" stroke="#E6FAF4" strokeWidth={f2(Math.max(0.8, r * 0.16))} opacity={0.9} />
          <path d={`M${f2(P.x - r * 0.62)},${f2(P.y - r * 0.12)} A${f2(r * 0.62)},${f2(r * 0.62)} 0 0,1 ${f2(P.x - r * 0.1)},${f2(P.y - r * 0.6)}`} fill="none" stroke="#FFFFFF" strokeWidth={f2(Math.max(0.7, r * 0.18))} strokeLinecap="round" />
        </g>
      ),
    });
  };
  for (let i = 0; i < 95; i++) draw(i, -0.15 + 0.8 * hash(i * 3.7) ** 1.6, 0.3 + 1.5 * hash(i * 7.3) ** 2);
  for (let i = 0; i < 12; i++) draw(100 + i, 0.9 + i * 0.42 + 0.2 * hash(i), 0.35 + 0.5 * hash(i * 5.5));
  return items;
};

export {ss};
