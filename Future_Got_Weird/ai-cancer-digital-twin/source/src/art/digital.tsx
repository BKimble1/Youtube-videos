// The digital model's visual language: cool wireframe on deep navy, distinct from the warm living tissue.
// Twin3D is a real 3D mesh (deformed sphere) rotated and projected each frame, so turning it shows depth.
import React from 'react';
import {C, M} from '../theme';
import {blob, clamp01, closedPath, lerp, mixHex, noise, P, rand, smooth} from '../kit/core';

const INK = C.ink;

export type TwinShape = {
  R: number;             // base radius (world units)
  seed: number;
  scale?: number;        // overall growth/shrink factor
  lumpAt?: [number, number]; // (theta, phi) of a regrowth/resistant lump
  lump?: number;         // lump size 0..1
  rough?: number;        // surface irregularity
};
/** Surface radius in direction (theta = longitude, phi = latitude in [-pi/2, pi/2]). */
export const twinR = (s: TwinShape, th: number, ph: number) => {
  const rough = s.rough ?? 0.16;
  let k = 1 + rough * (0.6 * Math.sin(th * 2 + s.seed) * Math.cos(ph * 2) + 0.4 * noise(th * 1.7 + ph * 2.3, s.seed));
  if (s.lump && s.lumpAt) {
    const [lt, lp] = s.lumpAt;
    const cosd = Math.cos(ph) * Math.cos(lp) * Math.cos(th - lt) + Math.sin(ph) * Math.sin(lp);
    k += 0.55 * s.lump * Math.exp(-(1 - cosd) * 9);
  }
  return s.R * (s.scale ?? 1) * k;
};
const proj = (s: TwinShape, th: number, ph: number, rotY: number, tilt: number, rr?: number) => {
  const r = rr ?? twinR(s, th, ph);
  let x = r * Math.cos(ph) * Math.cos(th), y = -r * Math.sin(ph), z = r * Math.cos(ph) * Math.sin(th);
  // rotate about Y
  const cy = Math.cos(rotY), sy = Math.sin(rotY);
  [x, z] = [x * cy + z * sy, -x * sy + z * cy];
  // tilt about X
  const cx = Math.cos(tilt), sx = Math.sin(tilt);
  [y, z] = [y * cx - z * sx, y * sx + z * cx];
  return [x, y, z] as [number, number, number];
};

export const Twin3D: React.FC<{
  shape: TwinShape; rotY: number; tilt?: number; color?: string; dim?: string; lw?: number; op?: number;
  fill?: number; voxels?: number; heat?: (x: number, y: number, z: number) => number; t?: number; build?: number; hot?: number; warnLump?: number; nLat?: number; nLon?: number;
}> = ({shape, rotY, tilt = 0.32, color = M.wire, dim = M.wireDim, lw = 2, op = 1, fill = 0.14, voxels = 0, heat, t = 0, build = 1, hot = 0, warnLump = 0, nLat = 9, nLon = 14}) => {
  const front: string[] = [], back: string[] = [];
  const addLine = (pts: [number, number, number][]) => {
    let curF = '', curB = '';
    for (let i = 0; i < pts.length; i++) {
      const [x, y, z] = pts[i];
      const isF = z >= 0;
      const seg = `${x.toFixed(1)} ${y.toFixed(1)}`;
      if (isF) {
        curF += (curF ? ' L ' : 'M ') + seg;
        if (curB) { back.push(curB + ' L ' + seg); curB = ''; }
      } else {
        curB += (curB ? ' L ' : 'M ') + seg;
        if (curF) { front.push(curF + ' L ' + seg); curF = ''; }
      }
    }
    if (curF) front.push(curF);
    if (curB) back.push(curB);
  };
  const b = smooth(build);
  // latitude rings appear bottom→top during the build (scan slices assembling into a volume)
  for (let i = 1; i < nLat; i++) {
    const ph = -Math.PI / 2 + (i / nLat) * Math.PI;
    if (i / nLat > b * 1.05) continue;
    const pts: [number, number, number][] = [];
    for (let j = 0; j <= 48; j++) pts.push(proj(shape, (j / 48) * Math.PI * 2, ph, rotY, tilt));
    addLine(pts);
  }
  const mer = smooth(clamp01(build * 2 - 1));
  if (mer > 0) {
    for (let j = 0; j < nLon; j++) {
      const th = (j / nLon) * Math.PI * 2;
      const pts: [number, number, number][] = [];
      const top = lerp(-Math.PI / 2, Math.PI / 2, mer);
      for (let i = 0; i <= 24; i++) pts.push(proj(shape, th, lerp(-Math.PI / 2, top, i / 24), rotY, tilt));
      addLine(pts);
    }
  }
  // silhouette: farthest projected point per screen angle
  const sil: P[] = [];
  const NA = 40;
  const best = new Array(NA).fill(0);
  for (let i = 0; i <= 16; i++) for (let j = 0; j < 32; j++) {
    const [x, y] = proj(shape, (j / 32) * Math.PI * 2, -Math.PI / 2 + (i / 16) * Math.PI, rotY, tilt);
    const a = Math.atan2(y, x), k = Math.floor(((a + Math.PI) / (Math.PI * 2)) * NA) % NA;
    best[k] = Math.max(best[k], Math.hypot(x, y));
  }
  for (let k = 0; k < NA; k++) {
    const a = ((k + 0.5) / NA) * Math.PI * 2 - Math.PI;
    sil.push([Math.cos(a) * best[k], Math.sin(a) * best[k]]);
  }
  // voxel cloud (model cells / density)
  const vox: React.ReactNode[] = [];
  if (voxels > 0.01) {
    for (let i = 0; i < 140; i++) {
      const u = rand(shape.seed * 7 + i), v = rand(shape.seed * 11 + i), w = rand(shape.seed * 13 + i);
      const th = u * Math.PI * 2, ph = Math.asin(v * 2 - 1), rf = Math.cbrt(w) * 0.9;
      const [x, y, z] = proj(shape, th, ph, rotY, tilt, twinR(shape, th, ph) * rf);
      const h = heat ? heat(x, y, z) : 0.5;
      const sz = 3.2 + 2.2 * (z / (shape.R * 1.2) + 1) * 0.5;
      const col = h > 0.66 ? M.wireWarn : h > 0.33 ? M.wireHot : M.wire;
      vox.push(<rect key={i} x={x - sz / 2} y={y - sz / 2} width={sz} height={sz} fill={col} opacity={voxels * (0.35 + 0.5 * ((z / (shape.R * 1.3)) + 1) * 0.5) * (0.6 + 0.4 * Math.sin(t * 2 + i))} />);
    }
  }
  return (
    <g opacity={op}>
      <path d={closedPath(sil)} fill={mixHex(M.wire, M.screen, 0.6)} opacity={fill * b} />
      {hot > 0.01 && <path d={closedPath(sil)} fill={M.wireHot} opacity={0.12 * hot} />}
      <path d={back.join(' ')} fill="none" stroke={dim} strokeWidth={lw * 0.7} opacity={0.55} strokeLinejoin="round" />
      {vox}
      <path d={front.join(' ')} fill="none" stroke={color} strokeWidth={lw} strokeLinejoin="round" strokeLinecap="round" />
      <path d={closedPath(sil)} fill="none" stroke={color} strokeWidth={lw * 1.4} opacity={0.9 * b} />
      {warnLump > 0.01 && shape.lumpAt && (() => {
        const [x, y] = proj(shape, shape.lumpAt[0], shape.lumpAt[1], rotY, tilt, twinR(shape, shape.lumpAt[0], shape.lumpAt[1]) * 0.9);
        return <circle cx={x} cy={y} r={shape.R * 0.42} fill="none" stroke={M.wireWarn} strokeWidth={lw * 1.6} strokeDasharray={`${lw * 4} ${lw * 3}`} opacity={warnLump} />;
      })()}
    </g>
  );
};

/** Silhouette points of a twin at a rotation (screen-space, around its centre) — used for match cuts. */
export const twinSilhouette = (shape: TwinShape, rotY: number, tilt = 0.32): P[] => {
  const NA = 48, best = new Array(NA).fill(0);
  for (let i = 0; i <= 16; i++) for (let j = 0; j < 32; j++) {
    const [x, y] = proj(shape, (j / 32) * Math.PI * 2, -Math.PI / 2 + (i / 16) * Math.PI, rotY, tilt);
    const a = Math.atan2(y, x), k = Math.floor(((a + Math.PI) / (Math.PI * 2)) * NA) % NA;
    best[k] = Math.max(best[k], Math.hypot(x, y));
  }
  return best.map((r, k) => {
    const a = ((k + 0.5) / NA) * Math.PI * 2 - Math.PI;
    return [Math.cos(a) * r, Math.sin(a) * r] as P;
  });
};

/** An illustrative axial MRI-style slice of the chest (two breasts above the chest wall), with a bright lesion.
 *  Local coords centred, size w×h. lesion: 0..1 brightness/size of the lesion; level: which slice (shifts anatomy). */
export const MriSlice: React.FC<{w?: number; h?: number; lesion?: number; level?: number; seed?: number; frame?: boolean; edge?: string; lesionShift?: number}> = ({w = 320, h = 240, lesion = 1, level = 0.5, seed = 1, frame = true, edge = M.wire, lesionShift = 0}) => {
  const k = Math.sin(level * Math.PI);
  const id = `mri${seed}${Math.round(level * 100)}`;
  return (
    <g>
      <defs>
        <clipPath id={id}><rect x={-w / 2} y={-h / 2} width={w} height={h} rx={10} /></clipPath>
        <radialGradient id={id + 'g'} cx="50%" cy="50%" r="55%"><stop offset="0%" stopColor="#FFFFFF" /><stop offset="100%" stopColor={M.mri1} stopOpacity={0} /></radialGradient>
      </defs>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={10} fill={M.mri0} />
      <g clipPath={`url(#${id})`}>
        {/* chest wall */}
        <path d={`M ${-w * 0.48} ${h * 0.5} Q ${-w * 0.46} ${h * 0.05} ${-w * 0.2} ${h * 0.12} Q 0 ${h * 0.18} ${w * 0.2} ${h * 0.12} Q ${w * 0.46} ${h * 0.05} ${w * 0.48} ${h * 0.5} Z`} fill="#55555E" />
        <path d={`M ${-w * 0.4} ${h * 0.5} Q ${-w * 0.36} ${h * 0.22} 0 ${h * 0.26} Q ${w * 0.36} ${h * 0.22} ${w * 0.4} ${h * 0.5} Z`} fill="#2A2A30" />
        {/* breasts (fibroglandular texture) */}
        {[-1, 1].map((sd) => (
          <g key={sd}>
            <path d={blob(sd * w * 0.22, h * 0.05, w * (0.17 + 0.03 * k), seed + sd + 5, 0, 0.05, 14, 1.05, 0.95 + 0.1 * k)} fill="#8C8C95" />
            {Array.from({length: 7}, (_, i) => (
              <path key={i} d={blob(sd * w * 0.22 + (rand(seed * 9 + i + sd) - 0.5) * w * 0.22, h * 0.02 + (rand(seed * 5 + i - sd) - 0.5) * h * 0.25, w * 0.03, i + sd * 3, 0, 0.3, 7)} fill="#B9B9C2" opacity={0.7} />
            ))}
          </g>
        ))}
        {/* lesion */}
        {lesion > 0.01 && (
          <g transform={`translate(${w * 0.2 + lesionShift} ${h * -0.02})`}>
            <circle r={w * 0.09 * lesion} fill={`url(#${id}g)`} opacity={0.6} />
            <path d={blob(0, 0, w * 0.045 * (0.6 + 0.6 * lesion) * (0.7 + 0.5 * k), seed + 2, 0, 0.25, 9)} fill="#FFFFFF" />
          </g>
        )}
      </g>
      {frame && <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={10} fill="none" stroke={edge} strokeWidth={3} />}
    </g>
  );
};

/** A clinic monitor (local origin at the screen centre). Children render clipped inside the screen. */
export const Monitor: React.FC<{w: number; h: number; id: string; children?: React.ReactNode; stand?: boolean; glow?: number; bezel?: string}> = ({w, h, id, children, stand = true, glow = 0, bezel = '#2B3A44'}) => (
  <g>
    {stand && (
      <g>
        <path d={`M ${-w * 0.06} ${h / 2} L ${-w * 0.08} ${h / 2 + h * 0.22} L ${w * 0.08} ${h / 2 + h * 0.22} L ${w * 0.06} ${h / 2} Z`} fill={bezel} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        <rect x={-w * 0.2} y={h / 2 + h * 0.2} width={w * 0.4} height={h * 0.05} rx={h * 0.02} fill={bezel} stroke={INK} strokeWidth={4} />
      </g>
    )}
    {glow > 0.01 && <rect x={-w / 2 - 30} y={-h / 2 - 30} width={w + 60} height={h + 60} rx={40} fill={M.wire} opacity={0.08 * glow} />}
    <rect x={-w / 2 - 16} y={-h / 2 - 16} width={w + 32} height={h + 32} rx={18} fill={bezel} stroke={INK} strokeWidth={5} />
    <defs><clipPath id={id}><rect x={-w / 2} y={-h / 2} width={w} height={h} rx={6} /></clipPath></defs>
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={6} fill={M.screen} />
    <g clipPath={`url(#${id})`}>{children}</g>
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={6} fill="none" stroke="#000" strokeOpacity={0.35} strokeWidth={3} />
  </g>
);

/** Faint blueprint grid for the model space. */
export const Grid: React.FC<{x0: number; y0: number; x1: number; y1: number; step?: number; color?: string; op?: number; lw?: number}> = ({x0, y0, x1, y1, step = 60, color = M.wireDim, op = 0.35, lw = 1}) => {
  let d = '';
  for (let x = Math.ceil(x0 / step) * step; x <= x1; x += step) d += `M ${x} ${y0} L ${x} ${y1} `;
  for (let y = Math.ceil(y0 / step) * step; y <= y1; y += step) d += `M ${x0} ${y} L ${x1} ${y} `;
  return <path d={d} stroke={color} strokeWidth={lw} opacity={op} fill="none" />;
};

/** A simple scan-beam sweep line (cyan) across a box. */
export const Sweep: React.FC<{x0: number; x1: number; y0: number; y1: number; u: number; op?: number}> = ({x0, x1, y0, y1, u, op = 1}) => {
  const y = lerp(y0, y1, u);
  return (
    <g opacity={op * Math.sin(clamp01(u) * Math.PI)}>
      <rect x={x0} y={y - 24} width={x1 - x0} height={24} fill={M.wire} opacity={0.12} />
      <line x1={x0} x2={x1} y1={y} y2={y} stroke={M.wire} strokeWidth={3} />
    </g>
  );
};
