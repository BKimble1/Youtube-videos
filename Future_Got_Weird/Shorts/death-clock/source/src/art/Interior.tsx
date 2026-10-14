// Inside HIS arm and chest (V2 body journey). Everything here is drawn in one "section frame" attached to the
// left forearm: X runs along the arm (toward the wrist), D is depth below the skin on the case side of the arm,
// 1000 units = the wrist radius. The same frame serves the side-view section under the band (skin, fat, tissue,
// a vessel with near/far walls, the port and its sensor stream), the ride inside the vessel at very high zoom,
// and the front-view x-ray of the same arm, shoulder and chest (vessel to the heart, one organ, the heart).
// Because the vessel is one path in one frame, the camera can go wrist -> skin -> vessel -> torso without a
// cutaway to another diagram. Stylized depiction of an invented mechanism; not medical illustration.
import React from 'react';
import {ArmFrame, armR, DEV_GEO} from './Device';
import {Bead, BeadDefs, Path, smoothPath} from './Beads';
import {RBC, Ring} from './Vessel';
import {lit, mix, PAL, shade} from '../lib/color';
import {add, clamp, dot, hash, inv, len, lerp, mul, noise1, sub, V} from '../lib/math';
import {Blob, Glow, Lin} from '../lib/shade';

const f2 = (n: number) => (Math.abs(n) < 1e-9 ? '0' : n.toFixed(2));
const f5 = (n: number) => (Math.abs(n) < 1e-12 ? '0' : n.toFixed(5));
const P2 = (p: V) => `${f2(p.x)},${f2(p.y)}`;

// ------------------------------------------------------------------ the section frame
export const SEC = {
  units: 1000, // local units per wrist radius
  skin: 90,
  fat: 320,
  vd: 520, // vessel centre depth below the surface
  rho: 110, // lumen radius
  wall: 34,
  portBack: 720, // port sits this far from the band centre toward the elbow (under the case, clear of the strap)
};

export type SecFrame = {
  A: ArmFrame;
  k: number;
  rb: number;
  Y: V;
  O: V;
  Xb: number;
  Xp: number;
  matrix: string;
  toWorld: (X: number, D: number) => V;
  fromWorld: (p: V) => {X: number; D: number};
  /** depth of the skin surface at X (the forearm tapers toward the wrist) */
  dSurf: (X: number) => number;
};

/** sigma: which side of the arm the case is turned to in the section view (+1 = along n, -1 = opposite). */
export const secFrame = (A: ArmFrame, sigma: 1 | -1): SecFrame => {
  const k = SEC.units / A.rW;
  const ub = A.L - DEV_GEO.bandFromWrist * A.rW;
  const rb = armR(A, ub);
  const Y = mul(A.n, sigma);
  const O = add(A.E, mul(Y, rb));
  const toWorld = (X: number, D: number) => add(O, add(mul(A.u, X / k), mul(Y, -D / k)));
  const fromWorld = (p: V) => {
    const d = sub(p, O);
    return {X: dot(d, A.u) * k, D: -dot(d, Y) * k};
  };
  const matrix = `matrix(${f5(A.u.x / k)} ${f5(A.u.y / k)} ${f5(-Y.x / k)} ${f5(-Y.y / k)} ${f5(O.x)} ${f5(O.y)})`;
  const dSurf = (X: number) => (rb - armR(A, X / k)) * k;
  const Xb = ub * k;
  return {A, k, rb, Y, O, Xb, Xp: Xb - SEC.portBack, matrix, toWorld, fromWorld, dSurf};
};

// ------------------------------------------------------------------ arc-length paths
export type Arc = {pts: Path; cum: number[]; L: number; at: (s: number) => {p: V; dir: V; nrm: V}};
export const arc = (pts: Path): Arc => {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + len(sub(pts[i], pts[i - 1])));
  const L = cum[cum.length - 1];
  const at = (s: number) => {
    const x = clamp(s, 0, L);
    let lo = 0;
    let hi = cum.length - 1;
    while (hi - lo > 1) {
      const m = (lo + hi) >> 1;
      if (cum[m] <= x) lo = m;
      else hi = m;
    }
    const seg = cum[hi] - cum[lo] || 1;
    const t = (x - cum[lo]) / seg;
    const a = pts[lo];
    const b = pts[hi];
    const d = sub(b, a);
    const l = len(d) || 1;
    const dir = {x: d.x / l, y: d.y / l};
    return {p: add(a, mul(d, t)), dir, nrm: {x: -dir.y, y: dir.x}};
  };
  return {pts, cum, L, at};
};

/**
 * The vessel's centreline in section units: from the sensors' entry point just under the port, along the
 * forearm toward the elbow with a gentle S-bend, then (x-ray) on through the elbow, up the upper arm and
 * into the chest to the heart. The forearm part is identical with or without the continuation.
 */
export const vesselPath = (sf: SecFrame, cont: V[] = []): Arc & {entry: number} => {
  const X0 = sf.Xp - 70;
  const ctrl: V[] = [];
  // starts under the strap (the vessel runs on toward the hand), passes under the port, then along the arm
  // (stopping short of the elbow when it continues up the upper arm)
  const last = cont.length ? 9 : 11;
  for (let i = -4; i <= last; i++) {
    const X = X0 - i * 620;
    const D = sf.dSurf(X) + SEC.vd + 70 * Math.sin(((i * 620) / 1500) * Math.PI) * clamp(i / 2);
    ctrl.push({x: X, y: D});
  }
  const all = [
    ...ctrl,
    ...cont.map((p) => {
      const q = sf.fromWorld(p);
      return {x: q.X, y: q.D};
    }),
  ];
  const STEPS = 14;
  const pts = smoothPath(all, STEPS).slice(STEPS); // drop the first (lead-in) segment
  const a = arc(pts);
  // arc length of the entry point under the port (control point i = 0)
  return {...a, entry: a.cum[3 * STEPS]};
};

// ------------------------------------------------------------------ tissue
const rect = (x: number, y: number, w: number, h: number) => `M${f2(x)},${f2(y)} h${f2(w)} v${f2(h)} h${f2(-w)} Z`;

/** Rose muscle tissue with soft fibres running along the arm (shared by the section and the x-ray). */
export const TissueFill: React.FC<{id: string; x0: number; x1: number; y0: number; y1: number; tint?: number}> = ({id, x0, x1, y0, y1, tint = 0}) => {
  const base = mix(PAL.tissue, '#C9566A', tint);
  const fibres: React.ReactNode[] = [];
  const n = Math.min(60, Math.ceil((y1 - y0) / 70));
  for (let i = 0; i < n; i++) {
    const y = y0 + 40 + i * 70 + hash(i, 3) * 20;
    fibres.push(<rect key={i} x={f2(x0)} y={f2(y)} width={f2(x1 - x0)} height={f2(16 + hash(i, 4) * 10)} fill="#FFFFFF" opacity={0.07 + hash(i, 5) * 0.05} />);
  }
  return (
    <g>
      <Lin id={`${id}-t`} d={rect(x0, y0, x1 - x0, y1 - y0)} from={{x: 0, y: y0}} to={{x: 0, y: y1}} stops={[[0, lit(base, 0.1)], [0.5, base], [1, shade(base, 0.28)]]} />
      {fibres}
    </g>
  );
};

// ------------------------------------------------------------------ the vessel
export type Hero = {s: number; l: number; r: number; ring: number; signal: number; signalColor: string; dir?: V};
export type WallCell = {s: number; side: 1 | -1; decay: number; scan: number};

type TubeProps = {
  id: string;
  path: Arc;
  f: number;
  /** screen pixels per local unit (level of detail) */
  px: number;
  /** arc-length window to populate with cells (around the camera) */
  s0: number;
  s1: number;
  /** sensors released into the flow (0 = none yet) and from which arc length they have spread */
  sensors: number;
  sensorFront: number;
  hero?: Hero;
  cells?: WallCell[];
  /** blue treatment wave travelling along the vessel: its arc length, 0..1 strength */
  wave?: {s: number; a: number};
  /** a red warning pulse travelling back toward the band */
  pulse?: {s: number; a: number};
  /** overall warmth of the blood (1 = healthy flow, lower = sluggish) */
  flow?: number;
  /** one red cell scripted to pass in front of the hero (the hero goes behind it) */
  occluder?: {s: number; l: number};
  /** sluggish, darker blood from this arc length on (before the treatment wave reaches it) */
  dimFrom?: number;
};

const FLOW = 12; // local units per frame (blood flow toward the heart)

export const VesselTube: React.FC<TubeProps> = ({id, path, f, px, s0, s1, sensors, sensorFront, hero, cells = [], wave, pulse, flow = 1, occluder, dimFrom}) => {
  const {rho, wall} = SEC;
  const d = `M${path.pts.map(P2).join(' L')}`;
  const detail = px > 0.12; // red cells are drawn only when they would be at least ~4 px
  const lumen = `${id}-lm`;
  const bbox = path.pts.reduce((b, p) => ({x0: Math.min(b.x0, p.x), y0: Math.min(b.y0, p.y), x1: Math.max(b.x1, p.x), y1: Math.max(b.y1, p.y)}), {x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9});
  const pad = rho + wall + 40;
  const at = path.at;
  const place = (s: number, l: number) => {
    const q = at(s);
    return {p: add(q.p, mul(q.nrm, l)), a: (Math.atan2(q.dir.y, q.dir.x) * 180) / Math.PI, dir: q.dir};
  };
  const span = path.L;
  const lo = Math.max(0, s0);
  const hi = Math.min(span, s1);

  // red cells (two depths: far ones behind the sensors, a few near ones in front)
  const farCells: React.ReactNode[] = [];
  const nearCells: React.ReactNode[] = [];
  if (detail) {
    const n = Math.ceil(span / 46);
    for (let i = 0; i < n; i++) {
      const speed = FLOW * flow * (0.82 + 0.3 * hash(i, 41));
      const s = (((hash(i, 42) * span + speed * f) % span) + span) % span;
      if (s < lo - 80 || s > hi + 80) continue;
      const r = 30 + hash(i, 43) * 9;
      const l = (hash(i, 44) * 2 - 1) * (rho - r * 0.7);
      const q = place(s, l);
      const near = hash(i, 45) > 0.82;
      const el = <RBC key={i} id={`${id}-rc${i}`} p={q.p} r={r} tilt={0.32 + hash(i, 46) * 0.5} rot={q.a + 90 + noise1(f * 0.03, i) * 40} tone={near ? 0.08 : 0.35 + 0.3 * hash(i, 47)} />;
      (near ? nearCells : farCells).push(el);
    }
  }
  // sensors: small cyan beads that ride faster than the cells, spread out behind the front
  const sensorEls: React.ReactNode[] = [];
  if (sensors > 0.01) {
    const n = 70;
    for (let i = 0; i < n; i++) {
      const s = sensorFront - hash(i, 51) * 900 - ((f * 3) % 30);
      if (s < Math.max(lo, 0) - 40 || s > hi + 40) continue;
      const r = 9 + hash(i, 52) * 6;
      const l = (hash(i, 53) * 2 - 1) * (rho - 22) + Math.sin(f * 0.11 + i) * 6;
      const q = place(s, l);
      if (detail) sensorEls.push(<Bead key={i} id={`${id}-b`} p={q.p} r={r} dir={q.dir} wake={2.6} halo={0.5} opacity={sensors} />);
      else sensorEls.push(<circle key={i} cx={f2(q.p.x)} cy={f2(q.p.y)} r={f2(Math.max(r, 2.2 / Math.max(px, 0.01)))} fill="#BDF1FF" opacity={0.9 * sensors} />);
    }
  }
  const heroEl = (() => {
    if (!hero) return null;
    const q = place(hero.s, hero.l);
    return (
      <g>
        {hero.signal > 0.01 && <Ring id={`${id}-hs`} c={q.p} r={hero.r * (2 + 6 * hero.signal)} color={hero.signalColor} a={0.95 * (1 - hero.signal)} />}
        <Glow id={`${id}-hg`} c={q.p} r={hero.r * 3.2} color={PAL.signal} alpha={0.5} />
        <Bead id={`${id}-b`} p={q.p} r={hero.r} dir={hero.dir ?? q.dir} wake={hero.ring > 0.5 ? 0 : 3} halo={1} />
        {/* the hero's ring: a thin bright halo that marks it among the others */}
        <circle cx={f2(q.p.x)} cy={f2(q.p.y)} r={f2(hero.r * 1.55)} fill="none" stroke="#E4FBFF" strokeWidth={f2(hero.r * 0.12)} opacity={0.85 * hero.ring} />
      </g>
    );
  })();
  // wall cells lining the far wall near one edge; the target cell changes state
  const cellEls = cells.map((c, i) => {
    const q = place(c.s, c.side * (rho - 30));
    const col = mix('#F28C95', '#8E7C94', c.decay);
    const rx = 74 * (1 - 0.15 * c.decay);
    const ry = 30 * (1 - 0.2 * c.decay);
    const pts: string[] = [];
    for (let k = 0; k < 24; k++) {
      const t = (k / 24) * Math.PI * 2;
      const wob = 1 + c.decay * (0.13 * Math.sin(t * 5 + i) + 0.05 * noise1(k * 0.8 + f * 0.04, i + 3));
      pts.push(`${f2(Math.cos(t) * rx * wob)},${f2(Math.sin(t) * ry * wob)}`);
    }
    return (
      <g key={i} transform={`translate(${f2(q.p.x)} ${f2(q.p.y)}) rotate(${f2(q.a)})`}>
        {c.scan > 0.01 && <Glow id={`${id}-cs${i}`} c={{x: 0, y: 0}} r={rx * 1.4} color={c.decay > 0.3 ? '#FFB23E' : PAL.signal} alpha={0.55 * c.scan} />}
        <Blob id={`${id}-cb${i}`} d={`M${pts.join(' L')} Z`} c={{x: -rx * 0.2, y: -ry * 0.3}} r={rx * 1.1} color={col} k={0.9} />
        <ellipse cx={f2(rx * 0.1)} cy={f2(ry * 0.05)} rx={f2(rx * 0.3)} ry={f2(ry * 0.4)} fill={mix('#B05A7A', '#5E5068', c.decay)} opacity={0.75} />
      </g>
    );
  });
  const waveEl =
    wave && wave.a > 0.01 ? (
      <g>
        {[-1, 0, 1].map((k) => {
          const q = at(wave.s + k * 120);
          return <Glow key={k} id={`${id}-wv${k}`} c={q.p} r={rho * (2.4 - Math.abs(k) * 0.6)} color="#7FE3FF" alpha={0.95 * wave.a * (1 - Math.abs(k) * 0.3)} />;
        })}
        <ellipse cx={f2(at(wave.s).p.x)} cy={f2(at(wave.s).p.y)} rx={f2(rho * 0.9)} ry={f2(rho * 0.6)} fill="#E4FBFF" opacity={0.9 * wave.a} />
        {/* behind the wave the blood runs brighter */}
        <path d={`M${path.pts.filter((_, i) => path.cum[i] <= wave.s && path.cum[i] >= wave.s - 2400).map(P2).join(' L')}`} fill="none" stroke="#FF7A88" strokeOpacity={0.42 * wave.a} strokeWidth={f2(rho * 1.7)} />
      </g>
    ) : null;
  const pulseEl =
    pulse && pulse.a > 0.01 ? (
      <g>
        <Glow id={`${id}-pl`} c={at(pulse.s).p} r={rho * 3} color={PAL.alert} alpha={0.9 * pulse.a} />
        <circle cx={f2(at(pulse.s).p.x)} cy={f2(at(pulse.s).p.y)} r={f2(rho * 0.55)} fill="#FFD6D9" opacity={pulse.a} />
      </g>
    ) : null;
  const sw = (w: number) => f2(Math.max(w, 0.5));
  return (
    <g>
      <BeadDefs id={`${id}-b`} />
      <defs>
        <mask id={lumen} maskUnits="userSpaceOnUse" x={f2(bbox.x0 - pad)} y={f2(bbox.y0 - pad)} width={f2(bbox.x1 - bbox.x0 + 2 * pad)} height={f2(bbox.y1 - bbox.y0 + 2 * pad)}>
          <path d={d} fill="none" stroke="#FFFFFF" strokeWidth={sw(rho * 2 - 6)} strokeLinejoin="round" />
        </mask>
      </defs>
      {/* soft shadow the tube casts into the tissue around it */}
      <path d={d} fill="none" stroke="#5A1A20" strokeOpacity={0.18} strokeWidth={sw((rho + wall) * 2 + 60)} strokeLinejoin="round" />
      {/* cut walls (lighter cut face), then the far wall's inner surface: darker toward the edges */}
      <path d={d} fill="none" stroke={shade(PAL.vessel, 0.12)} strokeWidth={sw((rho + wall) * 2)} strokeLinejoin="round" />
      <path d={d} fill="none" stroke={mix(PAL.vessel, '#F07A84', 0.45)} strokeWidth={sw((rho + wall) * 2 - 14)} strokeLinejoin="round" />
      {[1, 0.86, 0.7, 0.52, 0.32].map((k, i) => (
        <path key={i} d={d} fill="none" stroke={mix('#4A0812', mix(PAL.blood, '#D9505E', 0.35), i / 4)} strokeWidth={sw(rho * 2 * k)} strokeLinejoin="round" />
      ))}
      <g mask={`url(#${lumen})`}>
        {/* slow plasma streaks along the flow */}
        {detail &&
          Array.from({length: 10}).map((_, i) => {
            const s = (((hash(i, 61) * span + FLOW * 0.7 * f) % span) + span) % span;
            if (s < lo - 300 || s > hi + 300) return null;
            const q = place(s, (hash(i, 62) * 2 - 1) * rho * 0.6);
            return <ellipse key={i} cx={f2(q.p.x)} cy={f2(q.p.y)} rx={160} ry={14} transform={`rotate(${f2(q.a)} ${f2(q.p.x)} ${f2(q.p.y)})`} fill="#FF9AA2" opacity={0.12} />;
          })}
        {cellEls}
        {dimFrom !== undefined && dimFrom < span && (() => {
          const i0 = path.cum.findIndex((c) => c >= dimFrom);
          const pts = [at(dimFrom).p, ...path.pts.slice(Math.max(0, i0))];
          return <path d={`M${pts.map(P2).join(' L')}`} fill="none" stroke="#2A0008" strokeOpacity={0.42} strokeWidth={sw(rho * 2)} />;
        })()}
        {farCells}
        {sensorEls}
        {waveEl}
        {heroEl}
        {nearCells}
        {detail && occluder && occluder.s > lo - 100 && occluder.s < hi + 100 && (() => {
          const q = place(occluder.s, occluder.l);
          return <RBC id={`${id}-occ`} p={q.p} r={44} tilt={0.55} rot={q.a + 90 + 20 * Math.sin(f * 0.05)} tone={0.05} />;
        })()}
        {pulseEl}
      </g>
    </g>
  );
};

// ------------------------------------------------------------------ the side-view section under the band
type SectionProps = {
  id: string;
  sf: SecFrame;
  f: number;
  /** window open 0..1 */
  open: number;
  /** the vessel and everything in it */
  tube: React.ReactNode;
  /** port stream: 0..1 progress of the release, 0 = none */
  stream: number;
  /** stream particles visible 0..1 */
  streamA: number;
  /** treatment pulse down the channel 0..1 */
  treat?: number;
};

export const streamPath = (sf: SecFrame, vp: Arc & {entry: number}): Arc => {
  const top = {x: sf.Xp, y: sf.dSurf(sf.Xp) - 8};
  const entry = vp.at(vp.entry).p;
  return arc(
    smoothPath(
      [
        top,
        {x: sf.Xp - 6, y: top.y + SEC.skin + 40},
        {x: sf.Xp - 30, y: top.y + SEC.fat + 10},
        {x: entry.x + 20, y: entry.y - SEC.rho - 30},
        {x: entry.x - 30, y: entry.y - 20},
        vp.at(vp.entry + 120).p,
      ],
      10,
    ),
  );
};

export const SectionLayers: React.FC<SectionProps> = ({id, sf, f, open, tube, stream, streamA, treat = 0}) => {
  const X1 = sf.Xb - DEV_GEO.bandW * 500 + 260; // tucked under the strap's edge
  const X0 = X1 - 6900;
  const e = clamp(open);
  // the window grows from the port: first along the arm, then down through the layers
  const wx0 = lerp(sf.Xp - 160, X0, Math.pow(clamp(e * 1.15), 1.6));
  const wx1 = lerp(sf.Xp + 160, X1, clamp(e * 1.4));
  const top = Math.min(sf.dSurf(X0), sf.dSurf(X1)) - 300;
  const depth = lerp(260, 1500, clamp((e - 0.1) / 0.9));
  const r = 120;
  const win = `M${f2(wx0)},${f2(top)} L${f2(wx1)},${f2(top)} L${f2(wx1)},${f2(depth - r)} Q${f2(wx1)},${f2(depth)} ${f2(wx1 - r)},${f2(depth)} L${f2(wx0 + r)},${f2(depth)} Q${f2(wx0)},${f2(depth)} ${f2(wx0)},${f2(depth - r)} Z`;
  const surf = (X: number) => sf.dSurf(X);
  const band = (d0: number, d1: number) => `M${f2(X0)},${f2(surf(X0) + d0)} L${f2(X1)},${f2(surf(X1) + d0)} L${f2(X1)},${f2(surf(X1) + d1)} L${f2(X0)},${f2(surf(X0) + d1)} Z`;
  const lobules: React.ReactNode[] = [];
  for (let i = 0; i < 70; i++) {
    const X = X0 + (i % 35) * 190 + (Math.floor(i / 35) % 2) * 95 + hash(i, 7) * 30;
    const row = Math.floor(i / 35);
    const rr = 66 + hash(i, 8) * 18;
    const D = surf(X) + SEC.skin + 70 + row * 112 + hash(i, 9) * 20;
    lobules.push(<Blob key={i} id={`${id}-fl${i}`} d={`M${f2(X - rr)},${f2(D)} a${f2(rr)},${f2(rr * 0.82)} 0 1,0 ${f2(2 * rr)},0 a${f2(rr)},${f2(rr * 0.82)} 0 1,0 ${f2(-2 * rr)},0 Z`} c={{x: X, y: D}} r={rr * 1.15} color={PAL.fat} k={0.85} />);
  }
  return (
    <g>
      <defs>
        <clipPath id={`${id}-win`}>
          <path d={win} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}-win)`}>
        <TissueFill id={`${id}-ts`} x0={X0} x1={X1} y0={top} y1={top + 3000} />
        {/* fat: packed lobules with their own shading */}
        <path d={band(SEC.skin, SEC.fat)} fill={shade(PAL.fat, 0.2)} />
        {lobules}
        <path d={band(SEC.fat - 6, SEC.fat + 36)} fill="#7A2A2A" opacity={0.16} />
        {/* skin: dermis + a lit epidermis line */}
        <Lin id={`${id}-sk`} d={band(-400, SEC.skin)} from={{x: 0, y: surf(sf.Xp)}} to={{x: 0, y: surf(sf.Xp) + SEC.skin}} stops={[[0, '#F7C9AE'], [1, PAL.skinLayer]]} />
        <path d={band(-4, 14)} fill="#FFE9DA" opacity={0.8} />
        <path d={band(SEC.skin - 4, SEC.skin + 30)} fill="#8A4A3A" opacity={0.14} />
        {tube}
        <StreamDraw id={`${id}-st`} sf={sf} f={f} stream={stream} a={streamA} treat={treat} />
      </g>
      {/* the clean rim of the cut: a lit bevel where the skin was opened, and its shadow inside */}
      <path d={win} fill="none" stroke="#FBE2CF" strokeWidth={f2(26)} opacity={0.9 * e} />
      <path d={win} fill="none" stroke="#7A3A2E" strokeWidth={f2(8)} opacity={0.35 * e} transform="translate(0 14)" />
    </g>
  );
};

/** The sensor stream from the port: a narrow channel down through skin and fat into the vessel. */
const StreamDraw: React.FC<{id: string; sf: SecFrame; f: number; stream: number; a: number; treat: number}> = ({id, sf, f, stream, a, treat}) => {
  if (a <= 0.01 && treat <= 0.01) return null;
  const vp = vesselPath(sf);
  const sp = streamPath(sf, vp);
  const d = `M${sp.pts.map(P2).join(' L')}`;
  const dots: React.ReactNode[] = [];
  const n = 26;
  for (let i = 0; i < n; i++) {
    // each particle's progress along the channel: released one after another while stream < 1
    const t = stream * 1.6 - (i / n) * 1.2 - ((f * 0.02 + hash(i, 3)) % 0.05);
    if (t <= 0 || t >= 1) continue;
    const q = sp.at(t * sp.L);
    const jit = (hash(i, 4) - 0.5) * 18;
    dots.push(<circle key={i} cx={f2(q.p.x + q.nrm.x * jit)} cy={f2(q.p.y + q.nrm.y * jit)} r={f2(9 + hash(i, 5) * 5)} fill="#C9F4FF" opacity={a} />);
  }
  return (
    <g>
      {a > 0.01 && <path d={d} fill="none" stroke={PAL.signal} strokeOpacity={0.28 * a} strokeWidth={34} strokeLinecap="round" />}
      {a > 0.01 && <path d={d} fill="none" stroke="#E4FBFF" strokeOpacity={0.5 * a} strokeWidth={7} strokeLinecap="round" />}
      {dots}
      {treat > 0.01 && treat < 1 && (
        <g>
          <path d={d} fill="none" stroke="#7FE3FF" strokeOpacity={0.35} strokeWidth={30} strokeLinecap="round" />
          <Glow id={`${id}-tr`} c={sp.at(clamp(treat) * sp.L).p} r={170} color="#7FE3FF" alpha={1} />
          <circle cx={f2(sp.at(clamp(treat) * sp.L).p.x)} cy={f2(sp.at(clamp(treat) * sp.L).p.y)} r={44} fill="#E4FBFF" />
        </g>
      )}
    </g>
  );
};

/** The recessed underside module, drawn in the section frame (D < 0 is inside the case). Clipped to the case. */
export const PortModule: React.FC<{id: string; sf: SecFrame; f: number; ext: number; reservoir: number; blue: number}> = ({id, sf, f, ext, reservoir, blue}) => {
  const cx = sf.Xp;
  const s0 = sf.dSurf(sf.Xb);
  const caseHalf = DEV_GEO.caseL * 500;
  const cavity = `M${f2(sf.Xb - caseHalf + 160)},${f2(s0 - 250)} h${f2(caseHalf * 2 - 320)} v${f2(210)} h${f2(-(caseHalf * 2 - 320))} Z`;
  const tipY = lerp(s0 - 70, s0 + 6, clamp(ext));
  const col = blue > 0.5 ? '#7FE3FF' : PAL.signal;
  return (
    <g>
      <path d={cavity} fill="#081429" />
      <Lin id={`${id}-cv`} d={cavity} from={{x: 0, y: s0 - 250}} to={{x: 0, y: s0 - 40}} stops={[[0, '#13254A', 0.9], [1, '#050B18', 0.9]]} />
      {/* reservoir: a glowing chamber of sensors */}
      <rect x={f2(cx + 140)} y={f2(s0 - 220)} width={f2(caseHalf * 1.1)} height={150} rx={60} fill="#0C2E55" />
      <Glow id={`${id}-rv`} c={{x: cx + 140 + caseHalf * 0.55, y: s0 - 145}} r={caseHalf * 0.6} ry={110} color={col} alpha={0.55 * reservoir} />
      {Array.from({length: 18}).map((_, i) => (
        <circle key={i} cx={f2(cx + 180 + hash(i, 71) * caseHalf * 1.0)} cy={f2(s0 - 200 + hash(i, 72) * 110 + Math.sin(f * 0.2 + i) * 6)} r={f2(10 + hash(i, 73) * 6)} fill="#C9F4FF" opacity={0.85 * reservoir} />
      ))}
      {/* the port: a short barrel that slides down to touch the skin */}
      <rect x={f2(cx - 60)} y={f2(s0 - 230)} width={120} height={f2(tipY - (s0 - 230))} rx={26} fill="#3E5C8E" />
      <rect x={f2(cx - 60)} y={f2(s0 - 230)} width={40} height={f2(tipY - (s0 - 230))} rx={20} fill="#8FB0FF" opacity={0.45} />
      <rect x={f2(cx - 44)} y={f2(tipY - 22)} width={88} height={26} rx={12} fill="#BFD0F2" />
      {ext > 0.6 && <Glow id={`${id}-tp`} c={{x: cx, y: tipY}} r={90} color={col} alpha={0.8 * clamp((ext - 0.6) * 2.5)} />}
    </g>
  );
};


// ------------------------------------------------------------------ the heart (simplified, dimensional)
/** Organised "lub-dub" beat; chaos 0..1 turns it into a fast, uneven quiver. */
export const heartBeat = (f: number, chaos: number) => {
  const per = 22;
  const k = (f % per) / per;
  const reg = Math.exp(-Math.pow((k - 0.08) / 0.05, 2)) + 0.55 * Math.exp(-Math.pow((k - 0.27) / 0.05, 2));
  const fib = 0.5 * (0.5 + 0.5 * noise1(f * 0.9, 7)) * (0.6 + 0.4 * Math.sin(f * 2.3));
  return lerp(reg, fib, chaos);
};

export const Heart2: React.FC<{id: string; c: V; size: number; rot: number; chaos: number; f: number}> = ({id, c, size, rot, chaos, f}) => {
  const b = heartBeat(f, chaos);
  const k = (size / 100) * (1 + 0.075 * b);
  // irregular rhythm: the two sides squeeze out of step and the whole heart quivers
  const qx = chaos * 3.5 * noise1(f * 1.7, 11);
  const qy = chaos * 3.5 * noise1(f * 1.9, 12);
  const sl = 1 + chaos * 0.06 * noise1(f * 1.3, 13);
  const sr = 1 + chaos * 0.06 * noise1(f * 1.1, 14);
  const P = (x: number, y: number) => `${f2(x)},${f2(y)}`;
  const vent = `M${P(-8, -42)} C${P(-40, -62)} ${P(-96 * sl, -40)} ${P(-92 * sl, 6)} C${P(-88 * sl, 52)} ${P(-34, 96)} ${P(12, 122)} C${P(52, 92)} ${P(92 * sr, 48)} ${P(88 * sr, 0)} C${P(84 * sr, -40)} ${P(36, -58)} ${P(-8, -42)} Z`;
  const col = mix('#C8323F', '#E0283A', chaos);
  return (
    <g transform={`translate(${f2(c.x + qx)} ${f2(c.y + qy)}) rotate(${f2(rot)}) scale(${f2(k)})`}>
      <defs>
        <radialGradient id={`${id}-v`} gradientUnits="userSpaceOnUse" cx={-20} cy={0} r={130} fx={-46} fy={-26}>
          <stop offset="0" stopColor={lit(col, 0.32)} />
          <stop offset="0.45" stopColor={col} />
          <stop offset="1" stopColor={shade(col, 0.45)} />
        </radialGradient>
        <radialGradient id={`${id}-a`} gradientUnits="userSpaceOnUse" cx={0} cy={-60} r={60} fx={-14} fy={-74}>
          <stop offset="0" stopColor={lit('#B92B3A', 0.25)} />
          <stop offset="1" stopColor={shade('#B92B3A', 0.35)} />
        </radialGradient>
      </defs>
      {/* great vessels: aortic arch (red) and pulmonary trunk (blue) */}
      <path d={`M${P(4, -40)} C${P(6, -96)} ${P(-10, -130)} ${P(-46, -126)} C${P(-70, -122)} ${P(-74, -98)} ${P(-70, -78)}`} fill="none" stroke={shade('#D94A55', 0.2)} strokeWidth={30} strokeLinecap="round" />
      <path d={`M${P(4, -40)} C${P(6, -96)} ${P(-10, -130)} ${P(-46, -126)} C${P(-70, -122)} ${P(-74, -98)} ${P(-70, -78)}`} fill="none" stroke="#E06470" strokeWidth={20} strokeLinecap="round" />
      <path d={`M${P(-24, -40)} C${P(-28, -70)} ${P(-40, -92)} ${P(-58, -104)}`} fill="none" stroke="#5F6FBE" strokeWidth={24} strokeLinecap="round" />
      <path d={`M${P(-24, -40)} C${P(-28, -70)} ${P(-40, -92)} ${P(-58, -104)}`} fill="none" stroke="#8B9AE0" strokeWidth={10} strokeLinecap="round" opacity={0.7} />
      {/* atria */}
      <ellipse cx={-58} cy={-40} rx={32 * sl} ry={28} fill={`url(#${id}-a)`} />
      <ellipse cx={54} cy={-46} rx={28 * sr} ry={24} fill={`url(#${id}-a)`} />
      {/* ventricles */}
      <path d={vent} fill={`url(#${id}-v)`} />
      {/* interventricular groove and coronary vessels */}
      <path d={`M${P(-4, -42)} C${P(18, 6)} ${P(22, 60)} ${P(12, 118)}`} fill="none" stroke={shade(col, 0.5)} strokeWidth={7} opacity={0.55} strokeLinecap="round" />
      <path d={`M${P(-40, -30)} C${P(-58, 10)} ${P(-48, 50)} ${P(-24, 80)}`} fill="none" stroke={shade(col, 0.45)} strokeWidth={4} opacity={0.45} strokeLinecap="round" />
      <path d={`M${P(40, -34)} C${P(62, 0)} ${P(58, 40)} ${P(40, 70)}`} fill="none" stroke={shade(col, 0.45)} strokeWidth={4} opacity={0.4} strokeLinecap="round" />
      {/* gloss */}
      <ellipse cx={-46} cy={-6} rx={18} ry={9} transform="rotate(-50 -46 -6)" fill="#FFFFFF" opacity={0.6} />
      <ellipse cx={-36} cy={-28} rx={7} ry={4} transform="rotate(-50 -36 -28)" fill="#FFFFFF" opacity={0.85} />
    </g>
  );
};

// ------------------------------------------------------------------ x-ray of the arm and chest
/** Forearm x-ray in front view: the inside of the same arm (tissue and the vessel), inside a rim of skin. */
export const ArmXray: React.FC<{id: string; sf: SecFrame; a: number; reach: number; tube: React.ReactNode}> = ({id, sf, a, reach, tube}) => {
  if (a <= 0.01) return null;
  const X1 = sf.Xb - DEV_GEO.bandW * 500 - 40;
  const Xr = lerp(X1, -400, clamp(reach));
  const rim = 110;
  const y0 = sf.dSurf(X1) + rim;
  const y1 = 2 * sf.rb * sf.k - rim;
  const d = `M${f2(Xr)},${f2(y0 - 200)} L${f2(X1)},${f2(y0)} L${f2(X1)},${f2(y1)} L${f2(Xr)},${f2(y1 + 200)} Z`;
  return (
    <g opacity={a}>
      <defs>
        <clipPath id={`${id}-c`}>
          <path d={d} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}-c)`}>
        <TissueFill id={`${id}-t`} x0={-2000} x1={X1 + 200} y0={-1000} y1={3000} />
        {tube}
      </g>
    </g>
  );
};

type ChestProps = {
  id: string;
  f: number;
  /** clip: the tee outline (world) and the upper arm capsule (world) */
  torsoD: string;
  arm: {a: V; b: V; r: number};
  /** torso frame */
  C: V;
  tc: number;
  s: number;
  a: number;
  /** liver failing 0..1 */
  organ: number;
  /** heart chaos 0..1 */
  chaos: number;
  /** sensors clustered on the organ / heart (0..1) and their warning colour (0 cyan .. 1 amber/red) */
  organSense: number;
  heartSense: number;
  /** drawn on top inside the clip: the vessel (in the section frame) */
  tube: React.ReactNode;
  secMatrix: string;
  /** false for the upper-arm view (only tissue and the vessel) */
  organs?: boolean;
};

/** The torso and upper arm x-ray: same man, same clothes outline; inside, the lungs, one organ and the heart. */
export const ChestXray: React.FC<ChestProps> = ({id, f, torsoD, arm, C, tc, s, a, organ, chaos, organSense, heartSense, tube, secMatrix, organs = true}) => {
  if (a <= 0.01) return null;
  const up = (deg: number): V => ({x: -Math.sin((deg * Math.PI) / 180), y: -Math.cos((deg * Math.PI) / 180)});
  const px = (deg: number): V => ({x: Math.cos((deg * Math.PI) / 180), y: -Math.sin((deg * Math.PI) / 180)});
  const loc = (u: number, v: number) => add(C, add(mul(up(tc), u * s), mul(px(tc), v * s)));
  const heartC = heartCenter(C, tc, s);
  const liverC = loc(-48, 22);
  const liver = (() => {
    const pts = [loc(-28, -12), loc(-22, 22), loc(-34, 52), loc(-66, 54), loc(-78, 22), loc(-64, -12)];
    return smoothClosedD(pts);
  })();
  const lungs = [-1, 1].map((k) => smoothClosedD([loc(130, k * 20), loc(140, k * 70), loc(90, k * 92), loc(10, k * 80), loc(20, k * 30), loc(80, k * 14)]));
  const dim = organ;
  const liverCol = mix('#B4513F', '#6E5A62', dim * 0.85);
  const sensDots = (c: V, n: number, rad: number, amt: number, seed: number, warn: number) =>
    Array.from({length: n}).map((_, i) => {
      const ang = hash(i, seed) * Math.PI * 2 + f * 0.04 * (hash(i, seed + 1) - 0.5);
      const rr = rad * (0.75 + 0.35 * hash(i, seed + 2));
      const p = add(c, {x: Math.cos(ang) * rr, y: Math.sin(ang) * rr * 0.8});
      const col = warn > 0.5 ? mix('#FFB23E', '#FF4A5A', (warn - 0.5) * 2) : mix('#BDF1FF', '#FFB23E', warn * 2);
      const pulse = 0.75 + 0.25 * Math.sin(f * 0.5 + i);
      return (
        <g key={i}>
          <circle cx={f2(p.x)} cy={f2(p.y)} r={f2(6 * s * pulse)} fill={col} opacity={0.25 * amt} />
          <circle cx={f2(p.x)} cy={f2(p.y)} r={f2(2.6 * s)} fill={col} opacity={amt} />
        </g>
      );
    });
  return (
    <g opacity={a}>
      <defs>
        <clipPath id={`${id}-c`}>
          <path d={torsoD} transform={`translate(${f2(C.x)} ${f2(C.y)}) scale(0.93) translate(${f2(-C.x)} ${f2(-C.y)})`} />
          <path d={capsuleD(arm.a, arm.b, arm.r)} />
        </clipPath>
        <radialGradient id={`${id}-bg`} gradientUnits="userSpaceOnUse" cx={f2(heartC.x)} cy={f2(heartC.y)} r={f2(260 * s)}>
          <stop offset="0" stopColor="#E7838A" />
          <stop offset="0.6" stopColor="#C55D6C" />
          <stop offset="1" stopColor="#8E3E52" />
        </radialGradient>
      </defs>
      <g clipPath={`url(#${id}-c)`}>
        <rect x={f2(C.x - 900 * s)} y={f2(C.y - 900 * s)} width={f2(1800 * s)} height={f2(1800 * s)} fill={`url(#${id}-bg)`} />
        {organs && lungs.map((d, i) => (
          <Blob key={i} id={`${id}-lu${i}`} d={d} c={loc(90, (i ? 1 : -1) * 50)} r={90 * s} color="#F0A9B3" k={0.6} opacity={0.55} />
        ))}
        {organs && <Blob id={`${id}-lv`} d={liver} c={liverC} r={46 * s} color={liverCol} k={1.0} />}
        {organs && dim > 0.01 && <path d={liver} fill="#3A2A44" opacity={0.25 * dim * (0.7 + 0.3 * Math.sin(f * 0.25))} />}
        {organs && organSense > 0.01 && sensDots(liverC, 14, 44 * s, organSense, 81, clamp(dim * 0.5))}
        <g transform={secMatrix}>{tube}</g>
        {organs && <Heart2 id={`${id}-ht`} c={heartC} size={44 * s} rot={-tc * 0.35} chaos={chaos} f={f} />}
        {organs && heartSense > 0.01 && sensDots(heartC, 16, 64 * s, heartSense, 91, clamp(chaos * 1.2))}
      </g>
    </g>
  );
};

/** The heart sits on his left side of the chest (toward the sky while he lies on his right side). */
export const heartCenter = (C: V, tc: number, s: number) => {
  const up = {x: -Math.sin((tc * Math.PI) / 180), y: -Math.cos((tc * Math.PI) / 180)};
  const px = {x: Math.cos((tc * Math.PI) / 180), y: -Math.sin((tc * Math.PI) / 180)};
  return add(C, add(mul(up, 50 * s), mul(px, 40 * s)));
};

const smoothClosedD = (pts: V[]) => {
  let d = `M${P2(pts[0])}`;
  for (let i = 0; i < pts.length; i++) {
    const p0 = pts[(i - 1 + pts.length) % pts.length];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % pts.length];
    const p3 = pts[(i + 2) % pts.length];
    d += ` C${P2({x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6})} ${P2({x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6})} ${P2(p2)}`;
  }
  return d + ' Z';
};
const capsuleD = (a: V, b: V, r: number) => {
  const d = sub(b, a);
  const l = len(d) || 1;
  const n = {x: (-d.y / l) * r, y: (d.x / l) * r};
  return `M${P2(add(a, n))} L${P2(add(b, n))} A${f2(r)} ${f2(r)} 0 0 1 ${P2(sub(b, n))} L${P2(sub(a, n))} A${f2(r)} ${f2(r)} 0 0 1 ${P2(add(a, n))} Z`;
};

export {inv};
