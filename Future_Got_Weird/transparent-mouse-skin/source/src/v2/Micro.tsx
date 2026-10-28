// The microscopic journey (V2): an immersive, full-frame tissue world the camera travels through: no call-out circle,
// no labels. Three depths for parallax: a dim back layer, the mid layer where light is traced, and large blurred
// cells drifting past the lens in front. Water-rich matrix (blue, with moving caustics) fills the space between
// lipid-rich cells (golden droplets with membranes). Light enters from the surface (dye film on top) and is traced
// with Snell's law through the drifting cells: before the dye it bends at every boundary, branches (scattering) and
// a glow of scattered light veils the intestine wall below. The dye then seeps down through the WATER only; the
// water's index for red light rises toward the lipid's (1.33 -> 1.60 vs 1.62: illustrative, exaggerated values),
// the membranes' optical edges fade (the fat stays fat), the same rays run straight, the veil clears and the
// moving intestine wall appears sharp.
import React from 'react';
import {mix} from '../dc/color';
import {clamp, easeInOut, hash, inv, lerp, V} from '../dc/math';

export type MicroCam = {x: number; y: number; z: number};
export const SURF = 0;
export const DEEP = 2100;   // bottom of the skin/body-wall tissue
export const ORGAN = 2190;  // intestine wall surface
const XW = 760;             // half width of the traced field
const N_FAT = 1.62;

type Cell = {x: number; y: number; r: number; ph: number};
const packCells = (n: number, rmin: number, rmax: number, y0: number, y1: number, xw: number, seed: number, gap: number) => {
  const out: Cell[] = [];
  for (let i = 0; out.length < n && i < 20000; i++) {
    const r = rmin + hash(i, seed) * (rmax - rmin);
    const x = (hash(i, seed + 1) - 0.5) * 2 * xw, y = lerp(y0 + r, y1 - r, hash(i, seed + 2));
    if (out.every((q) => Math.hypot(q.x - x, q.y - y) > q.r + r + gap)) out.push({x, y, r, ph: hash(i, seed + 3) * 6.28});
  }
  return out;
};
export const MID = packCells(70, 34, 96, SURF + 30, DEEP - 10, XW, 301, 16);
const BACK = packCells(60, 30, 80, -200, DEEP + 200, XW * 1.3, 401, 10);
const FRONT = packCells(14, 110, 190, -100, DEEP + 300, XW * 1.1, 501, 120);

const drift = (c: Cell, t: number): Cell => ({x: c.x + 5 * Math.sin(t * 0.7 + c.ph), y: c.y + 4 * Math.cos(t * 0.55 + c.ph * 1.3), r: c.r * (1 + 0.015 * Math.sin(t * 1.1 + c.ph)), ph: c.ph});

// ---------------- light tracing (Snell's law through circular lipid cells) ----------------
type Path = {pts: V[]; branches: {p: V; d: V; w: number}[]; reached: boolean};
const dot = (a: V, b: V) => a.x * b.x + a.y * b.y;
export const traceRay = (x0: number, dx: number, nW: number, cells: Cell[]): Path => {
  let p: V = {x: x0 - dx * 300, y: SURF - 300};
  let d: V = {x: dx, y: 1}; const dl0 = Math.hypot(d.x, d.y); d = {x: d.x / dl0, y: d.y / dl0};
  const pts: V[] = [p];
  // to the surface
  const t0 = (SURF - p.y) / d.y; p = {x: p.x + d.x * t0, y: SURF}; pts.push(p);
  const branches: Path['branches'] = [];
  for (let ev = 0; ev < 60; ev++) {
    let best = Infinity, bi = -1;
    cells.forEach((b, i) => {
      const oc = {x: p.x - b.x, y: p.y - b.y};
      const bb = dot(oc, d), cc = dot(oc, oc) - b.r * b.r, disc = bb * bb - cc;
      if (disc < 0) return;
      const s = Math.sqrt(disc);
      for (const tt of [-bb - s, -bb + s]) if (tt > 0.5 && tt < best) { best = tt; bi = i; }
    });
    const tDeep = d.y > 1e-6 ? (ORGAN - p.y) / d.y : Infinity;
    const tSurf = d.y < -1e-6 ? (SURF - p.y) / d.y : Infinity;
    const tSide = d.x > 1e-6 ? (XW * 1.25 - p.x) / d.x : d.x < -1e-6 ? (-XW * 1.25 - p.x) / d.x : Infinity;
    const tWall = Math.min(tDeep, tSurf, tSide);
    if (tWall <= best) {
      const q = {x: p.x + d.x * tWall, y: p.y + d.y * tWall};
      pts.push(q);
      return {pts, branches, reached: tWall === tDeep};
    }
    const b = cells[bi];
    const q = {x: p.x + d.x * best, y: p.y + d.y * best};
    pts.push(q);
    let nrm = {x: (q.x - b.x) / b.r, y: (q.y - b.y) / b.r};
    const entering = dot(d, nrm) < 0;
    const n1 = entering ? nW : N_FAT, n2 = entering ? N_FAT : nW;
    if (!entering) nrm = {x: -nrm.x, y: -nrm.y};
    const cosi = -dot(d, nrm), eta = n1 / n2, k = 1 - eta * eta * (1 - cosi * cosi);
    const refl = {x: d.x + 2 * cosi * nrm.x, y: d.y + 2 * cosi * nrm.y};
    const R0 = ((n1 - n2) / (n1 + n2)) ** 2, fres = R0 + (1 - R0) * (1 - cosi) ** 5;
    if (k >= 0 && fres * 14 > 0.03) branches.push({p: q, d: refl, w: Math.min(0.9, fres * 14)});
    if (k < 0) d = refl;
    else { const ck = Math.sqrt(k); d = {x: eta * d.x + (eta * cosi - ck) * nrm.x, y: eta * d.y + (eta * cosi - ck) * nrm.y}; }
    const dl = Math.hypot(d.x, d.y); d = {x: d.x / dl, y: d.y / dl};
    p = {x: q.x + d.x * 0.8, y: q.y + d.y * 0.8};
  }
  return {pts, branches, reached: false};
};
export const plen = (pts: V[]) => pts.slice(1).reduce((s, b, i) => s + Math.hypot(b.x - pts[i].x, b.y - pts[i].y), 0);
export const pointAt = (pts: V[], L: number): V => {
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], l = Math.hypot(b.x - a.x, b.y - a.y);
    if (acc + l >= L) { const u = (L - acc) / (l || 1); return {x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u}; }
    acc += l;
  }
  return pts[pts.length - 1];
};
const sub = (pts: V[], L0: number, L1: number): V[] => {
  const out: V[] = [pointAt(pts, Math.max(0, L0))];
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const l = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    acc += l;
    if (acc > L0 && acc < L1) out.push(pts[i]);
  }
  out.push(pointAt(pts, L1));
  return out;
};
const poly = (pts: V[]) => 'M' + pts.map((q) => `${q.x.toFixed(1)},${q.y.toFixed(1)}`).join(' L');

export const RAYS = [-560, -400, -250, -110, 30, 170, 310, 460, 600].map((x, i) => ({x, dx: (hash(i, 77) - 0.5) * 0.16}));
export const PHOTON_SPEED = 560;

/** optical state of the world at time t (shared with the camera, which follows photons) */
export type MicroState = {
  t: number;
  nW: number;          // water's index for the red light
  dyeFront: number;    // depth reached by the dye (world y), -inf before it enters
  tintW: number;       // 0..1 water tint toward the dye's orange
  edges: number;       // membrane (optical boundary) visibility 1..0.25
  reveal: number;      // 0..1 rays revealed (drawn length)
  scatter: number;     // 0..1 visibility of scattered branches
  veil: number;        // 0..1 glow of scattered light veiling the depths
  waterGlow: number;   // emphasis pulse on the water (on "water" / "watery")
  fatGlow: number;     // emphasis pulse on the cells (on "fat")
};
export const cellsAt = (t: number) => MID.map((c) => drift(c, t));
export const tracesAt = (s: MicroState) => {
  const cells = cellsAt(s.t);
  return RAYS.map((r) => traceRay(r.x, r.dx, s.nW, cells));
};

const DyeDots = Array.from({length: 220}, (_, i) => {
  let x = 0, y = 0;
  for (let k = 0; k < 40; k++) {
    x = (hash(i, 601 + k) - 0.5) * 2 * XW * 1.05; y = lerp(SURF + 20, DEEP - 20, hash(i, 701 + k));
    if (MID.every((c) => Math.hypot(x - c.x, y - c.y) > c.r + 10 && Math.hypot(x - c.x, y - 60 - c.y) > c.r + 10)) break;
  }
  return {x, y, ph: hash(i, 9) * 6.28};
});

export const MicroWorld: React.FC<{s: MicroState; cam: MicroCam; opacity?: number}> = ({s, cam, opacity = 1}) => {
  const t = s.t;
  const cells = cellsAt(t);
  const traces = tracesAt(s);
  const water = mix('#BFE3EE', '#F3B484', s.tintW);
  const waterDeep = mix('#8FC3D6', '#E4935E', s.tintW);
  const layerT = (f: number, zf: number) => `translate(540 960) scale(${(cam.z * zf).toFixed(4)}) translate(${(-cam.x * f).toFixed(2)} ${(-cam.y * f).toFixed(2)})`;
  const peri = (x: number) => 14 * Math.sin(x * 0.012 - t * 2.1) + 8 * Math.sin(x * 0.031 + t * 1.3);
  const organD = `M${-XW * 2},${ORGAN + peri(-XW * 2)} ` + Array.from({length: 41}, (_, i) => {
    const x = -XW * 2 + (i / 40) * XW * 4; return `L${x.toFixed(0)},${(ORGAN + peri(x)).toFixed(1)}`;
  }).join(' ') + ` L${XW * 2},${ORGAN + 2400} L${-XW * 2},${ORGAN + 2400} Z`;
  const veilBlur = 2 + 16 * s.veil;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', left: 0, top: 0, opacity}}>
      <defs>
        <linearGradient id="mw-water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={water} />
          <stop offset="1" stopColor={waterDeep} />
        </linearGradient>
        <linearGradient id="mw-veil" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFF6EE" stopOpacity="0" />
          <stop offset="0.55" stopColor="#FFF0E2" stopOpacity="0.55" />
          <stop offset="1" stopColor="#FFF4EA" stopOpacity="0.95" />
        </linearGradient>
        <filter id="mw-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="7" /></filter>
        <filter id="mw-soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="14" /></filter>
        <filter id="mw-organ" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation={veilBlur.toFixed(1)} /></filter>
        <radialGradient id="mw-cell" cx="0.38" cy="0.34" r="0.7">
          <stop offset="0" stopColor="#FFF4C8" />
          <stop offset="0.55" stopColor="#FBE29A" />
          <stop offset="1" stopColor="#EFC66A" />
        </radialGradient>
      </defs>
      {/* back layer: dim water and cells far behind the traced plane */}
      <g transform={layerT(0.7, 0.7)}>
        <rect x={-3000} y={-1200} width={6000} height={1200 + SURF} fill="#1E2B36" />
        <rect x={-3000} y={SURF} width={6000} height={ORGAN - SURF} fill="url(#mw-water)" />
        {BACK.map((c, i) => <circle key={i} cx={c.x} cy={c.y} r={c.r} fill={mix('#E9D79A', water, 0.5)} opacity={0.55} />)}
      </g>
      {/* mid layer: the traced plane */}
      <g transform={layerT(1, 1)}>
        <rect x={-2400} y={SURF} width={4800} height={ORGAN - SURF} fill="url(#mw-water)" opacity={0.82} />
        {/* the intestine wall below, gently moving; veiled by scattered light until the paths settle */}
        <g filter="url(#mw-organ)">
          <rect x={-2400} y={DEEP} width={4800} height={1000} fill="#8E3641" />
          <path d={organD} fill="#E8968A" stroke="#6A2330" strokeWidth={8} />
          {Array.from({length: 22}, (_, i) => {
            const x = -XW * 1.6 + i * 72;
            return <path key={i} d={`M${x},${ORGAN + 70 + peri(x)} q22,${50 + 10 * Math.sin(t * 2 + i)} 0,120`} stroke="#C7706A" strokeWidth={10} fill="none" strokeLinecap="round" />;
          })}
          <path d={`M${-XW * 1.6},${ORGAN + 36} C${-XW * 0.6},${ORGAN + 20 + peri(0)} ${XW * 0.4},${ORGAN + 44} ${XW * 1.6},${ORGAN + 30}`} stroke="#F7C6B8" strokeWidth={16} fill="none" strokeLinecap="round" opacity={0.7} />
        </g>
        {/* caustics in the water: slow moving light ripples */}
        {Array.from({length: 26}, (_, i) => {
          const y = SURF + 60 + i * 80, a = 0.1 + 0.25 * s.waterGlow;
          return <path key={i} d={`M${-XW * 1.5},${y} ` + Array.from({length: 12}, (_, k) => `Q${-XW * 1.5 + k * 260 + 130},${y + 24 * Math.sin(t * 1.4 + i + k)} ${-XW * 1.5 + (k + 1) * 260},${y}`).join(' ')}
            stroke="#FFFFFF" strokeWidth={5} fill="none" opacity={a} />;
        })}
        {/* lipid-rich cells: golden droplets with membranes (the optical edge fades as the mismatch shrinks) */}
        {cells.map((c, i) => (
          <g key={i}>
            <circle cx={c.x} cy={c.y} r={c.r} fill="url(#mw-cell)" />
            <circle cx={c.x} cy={c.y} r={c.r} fill="none" stroke="#B4842A" strokeWidth={6} opacity={s.edges} />
            <circle cx={c.x + c.r * 0.25} cy={c.y + c.r * 0.2} r={c.r * 0.22} fill="#F2CF6E" opacity={0.7} />
            <circle cx={c.x - c.r * 0.3} cy={c.y + c.r * 0.35} r={c.r * 0.13} fill="#F2CF6E" opacity={0.6} />
            <ellipse cx={c.x - c.r * 0.32} cy={c.y - c.r * 0.38} rx={c.r * 0.3} ry={c.r * 0.16} fill="#FFFBEA" opacity={0.85 * (0.6 + 0.4 * s.fatGlow)} />
            {s.fatGlow > 0 && <circle cx={c.x} cy={c.y} r={c.r + 6} fill="none" stroke="#FFF2B0" strokeWidth={8} opacity={0.6 * s.fatGlow} />}
          </g>
        ))}
        {/* dye in the water spaces only, seeping down from the surface film */}
        {DyeDots.map((d, i) => {
          const u = clamp((s.dyeFront - d.y) / 140);
          if (u <= 0) return null;
          const y = d.y - 60 * (1 - u) + 4 * Math.sin(t * 2.3 + d.ph), x = d.x + 5 * Math.cos(t * 1.9 + d.ph);
          return <circle key={i} cx={x} cy={y} r={7} fill="#E8801A" stroke="#9A4A0E" strokeWidth={2} opacity={u} />;
        })}
        {/* the surface: air above, the dye film on top */}
        <rect x={-2400} y={SURF - 1200} width={4800} height={1200} fill="#22303B" />
        <path d={`M${-2400},${SURF} ` + Array.from({length: 40}, (_, i) => `Q${-2400 + i * 120 + 60},${SURF + (i % 2 ? 10 : -10)} ${-2400 + (i + 1) * 120},${SURF}`).join(' ')} stroke="#E8901E" strokeWidth={lerp(26, 10, s.tintW)} fill="none" />
        {/* the veil of scattered light over the depths */}
        <rect x={-2400} y={SURF + 200} width={4800} height={ORGAN - SURF + 300} fill="url(#mw-veil)" opacity={s.veil} />
        {/* light: faint full paths, branching scattered light, and photon pulses travelling along them */}
        {traces.map((tr, i) => {
          const L = plen(tr.pts);
          const shown = lerp(320, L, s.reveal);
          const pts = sub(tr.pts, 0, shown);
          const pulses: React.ReactNode[] = [];
          for (let k = 0; k < 6; k++) {
            const ph = ((t * PHOTON_SPEED + i * 173 + k * 420) % (L + 300)) - 100;
            if (ph < 0 || ph > shown) continue;
            const seg = sub(tr.pts, Math.max(0, ph - 90), ph);
            pulses.push(<path key={k} d={poly(seg)} stroke="#FFE9CF" strokeWidth={10} strokeLinecap="round" fill="none" />);
            pulses.push(<circle key={`c${k}`} cx={seg[seg.length - 1].x} cy={seg[seg.length - 1].y} r={12} fill="#FFF4E4" filter="url(#mw-glow)" />);
          }
          return (
            <g key={i}>
              <path d={poly(pts)} stroke="#FF5A2E" strokeWidth={18} fill="none" opacity={0.3} filter="url(#mw-glow)" />
              <path d={poly(pts)} stroke="#FF7A45" strokeWidth={6} fill="none" strokeLinejoin="round" strokeLinecap="round" opacity={0.9} />
              {tr.branches.map((b, j) => {
                const blen = 90 + 40 * Math.sin(t * 3 + j);
                return <path key={j} d={`M${b.p.x},${b.p.y} l${b.d.x * blen},${b.d.y * blen}`} stroke="#FF9A66" strokeWidth={5} strokeLinecap="round" opacity={s.scatter * b.w * s.reveal} />;
              })}
              {pulses}
              {tr.reached && shown >= L - 1 && <circle cx={tr.pts[tr.pts.length - 1].x} cy={ORGAN} r={30} fill="#FFD9B4" opacity={0.6 * (1 - s.veil)} filter="url(#mw-glow)" />}
            </g>
          );
        })}
      </g>
      {/* front layer: large soft cells drifting past the lens */}
      <g transform={layerT(1.45, 1.45)} filter="url(#mw-soft)">
        {FRONT.map((c0, i) => {
          const c = drift(c0, t);
          return <circle key={i} cx={c.x} cy={c.y} r={c.r} fill={mix('#FBE6A0', water, 0.3)} opacity={0.35} />;
        })}
      </g>
    </svg>
  );
};

/** where photon k of ray i is at time t (for the camera to follow) */
export const photonAt = (s: MicroState, i: number, k: number): V => {
  const tr = traceRay(RAYS[i].x, RAYS[i].dx, s.nW, cellsAt(s.t));
  const L = plen(tr.pts);
  const ph = ((s.t * PHOTON_SPEED + i * 173 + k * 420) % (L + 300)) - 100;
  return pointAt(tr.pts, clamp(ph, 0, L));
};
export {easeInOut, inv};
