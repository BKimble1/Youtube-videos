// Inside HIS arm and chest (V2 body journey). Everything here is drawn in one "section frame" attached to the
// left forearm: X runs along the arm (toward the wrist), D is depth below the skin on the case side of the arm,
// 1000 units = the wrist radius. The same frame serves the side-view section under the band (skin, fat, tissue,
// a vessel with near/far walls, the port and its sensor stream), the ride inside the vessel at very high zoom,
// and the front-view x-ray of the same arm, shoulder and chest (vessel to the heart, one organ, the heart).
// Because the vessel is one path in one frame, the camera can go wrist -> skin -> vessel -> torso without a
// cutaway to another diagram. Stylized depiction of an invented mechanism; not medical illustration.
import React from 'react';
import {ArmFrame, armR, DEV_GEO, PORT_GEO} from './Device';
import {Bead, BeadDefs, Path, smoothPath} from './Beads';
import {RBC, Ring} from './Vessel';
import {lit, mix, PAL, shade} from '../lib/color';
import {add, clamp, dot, hash, inv, len, lerp, mul, noise1, smooth, sub, V} from '../lib/math';
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
  /** legacy V3 name: drawn as the compact dose below (no glow blob) */
  wave?: {s: number; a: number};
  /** V4 treatment dose in the lumen: the slug's head arc length, strength, width scale and how much it lights the
   *  lumen round it (all normal blend, alpha <= 0.35, masked to the lumen); `len` scales its length (it bunches as it
   *  brakes into the 987 match cut, Aftermath3 treatState) */
  dose?: {s: number; a: number; w?: number; glow?: number; body?: boolean; from?: number; wake?: number; len?: number};
  /** V4 sensors: the discrete beads released from the port, drawn once they have merged into the flow */
  release?: SensorRelease;
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

export const VesselTube: React.FC<TubeProps> = ({id, path, f, px, s0, s1, sensors, sensorFront, hero, cells = [], wave, dose: dose0, release, pulse, flow = 1, occluder, dimFrom}) => {
  const dose = dose0 ?? (wave ? {s: wave.s, a: wave.a} : undefined);
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
  if (release) {
    // V4: each bead meets the flow STREAM_MERGE past the vessel entry (path.entry when given) at its own time and
    // spreads out in the flow
    const E = ((path as Arc & {entry?: number}).entry ?? 0) + STREAM_MERGE;
    for (let k = 0; k < release.n; k++) {
      const st = releaseState(release, k, f);
      if (st.phase !== 'vessel') continue;
      const s = E + st.t * release.vVessel * (0.88 + 0.24 * hash(k, 54));
      if (s < lo - 40 || s > hi + 40) continue;
      const spread = smooth(clamp((s - E) / 450));
      const l = lerp(streamFan(k), (hash(k, 53) * 2 - 1) * (rho - 26) + Math.sin(f * 0.11 + k) * 6, spread);
      const r = 9 + hash(k, 52) * 6;
      const q = place(s, l);
      if (detail) sensorEls.push(<Bead key={k} id={`${id}-b`} p={q.p} r={r} dir={q.dir} wake={2.6} halo={0.5} />);
      else sensorEls.push(<circle key={k} cx={f2(q.p.x)} cy={f2(q.p.y)} r={f2(Math.max(r, 2.2 / Math.max(px, 0.01)))} fill="#BDF1FF" opacity={0.9} />);
    }
  } else if (sensors > 0.01) {
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
        <Glow id={`${id}-hg`} c={q.p} r={hero.r * 3.2} color={PAL.signal} alpha={0.35} blend="normal" />
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
  // V4: the treatment dose is one compact blue-white slug (core #EAF4FF, rim #4F86FF): a rigid capsule along the flow, a
  // soft halo stretched along it and one short continuous trail behind it (no wider than the slug, fading to nothing,
  // its length set by the slug's speed); normal blend, inside the lumen only (replaces V3's glow blob and long trail)
  const doseEl = (() => {
    if (!dose || dose.a <= 0.01) return null;
    const sLen = TREAT_SLUG.len * (dose.len ?? 1);
    const tail = dose.s - sLen;
    const wk = Math.max(0, dose.wake ?? 0);
    const w0 = Math.max(dose.from ?? -1e9, tail - wk);
    const dW = wk > 4 ? subPathD(path, w0, tail + 4) : null;
    const pw0 = at(tail - wk).p;
    const pw1 = at(tail).p;
    const mA = at(tail).p;
    const mB = at(dose.s).p;
    const mid = mul(add(mA, mB), 0.5);
    const ang = (Math.atan2(mB.y - mA.y, mB.x - mA.x) * 180) / Math.PI;
    const g = dose.glow ?? 0;
    return (
      <g opacity={dose.a}>
        <defs>
          <linearGradient id={`${id}-dw`} gradientUnits="userSpaceOnUse" x1={f2(pw0.x)} y1={f2(pw0.y)} x2={f2(pw1.x + 0.01)} y2={f2(pw1.y + 0.01)}>
            <stop offset="0" stopColor="#B9D2FF" stopOpacity={0} />
            <stop offset="1" stopColor="#B9D2FF" stopOpacity={0.3} />
          </linearGradient>
          <radialGradient id={`${id}-dh`}>
            <stop offset="0" stopColor="#A9C8FF" stopOpacity={0.2 + 0.12 * g} />
            <stop offset="0.5" stopColor="#A9C8FF" stopOpacity={(0.2 + 0.12 * g) * 0.45} />
            <stop offset="1" stopColor="#A9C8FF" stopOpacity={0} />
          </radialGradient>
        </defs>
        {dW && <path d={dW} fill="none" stroke={`url(#${id}-dw)`} strokeWidth={f2(TREAT_SLUG.w * 0.6 * (dose.w ?? 1))} strokeLinecap="butt" />}
        <ellipse cx={f2(mid.x)} cy={f2(mid.y)} rx={f2(sLen * 0.5 + TREAT_SLUG.w * 1.1)} ry={f2(TREAT_SLUG.w * (1.05 + 0.25 * g))} transform={`rotate(${f2(ang)} ${f2(mid.x)} ${f2(mid.y)})`} fill={`url(#${id}-dh)`} />
        {dose.body !== false && <SlugStroke path={path} u0={tail} u1={dose.s} w={dose.w ?? 1} rigid />}
      </g>
    );
  })();
  // the warning pulse keeps a readable size on screen at any zoom (at least ~70 px glow, ~16 px core)
  const pr = Math.max(rho * 3, 48 / Math.max(px, 1e-4));
  const pc = Math.max(rho * 0.55, 16 / Math.max(px, 1e-4));
  const pulseEl =
    pulse && pulse.a > 0.01 ? (
      <g>
        <Glow id={`${id}-pl`} c={at(pulse.s).p} r={pr} color={PAL.alert} alpha={0.75 * pulse.a} blend="normal" />
        <circle cx={f2(at(pulse.s).p.x)} cy={f2(at(pulse.s).p.y)} r={f2(pc)} fill="#FFE3E6" opacity={pulse.a} />
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
        {doseEl}
        {heroEl}
        {nearCells}
        {detail && occluder && occluder.s > lo - 100 && occluder.s < hi + 100 && (() => {
          const q = place(occluder.s, occluder.l);
          return <RBC id={`${id}-occ`} p={q.p} r={44} tilt={0.55} rot={q.a + 90 + 20 * Math.sin(f * 0.05)} tone={0.05} />;
        })()}
      </g>
      {pulseEl}
    </g>
  );
};

// ------------------------------------------------------------------ V4: the contact point, the port and its mechanism
// One geometry (Device.tsx DEV_GEO / PORT_GEO) drawn in the section frame. xi runs along the arm from the port toward
// the wrist and h is the height above the case's back face. The back face follows the skin's taper (a 2 deg shear in
// this frame) and sits DEV_GEO.sink into the skin, exactly as Wrist3D draws the case, so the profile, the cut-away and
// the section agree. Stylized depiction of an invented mechanism; not a medical device or procedure.
const U = SEC.units;

/** The port frame: (xi, h) -> section (X, D); `matrix` maps SVG (xi, y = -h) into the section frame. */
export const portFrame = (sf: SecFrame) => {
  const slope = (sf.dSurf(sf.Xp + 1000) - sf.dSurf(sf.Xp)) / 1000;
  const D0 = sf.dSurf(sf.Xp) + DEV_GEO.sink * U;
  return {slope, D0, matrix: `matrix(1 ${f5(slope)} 0 1 ${f2(sf.Xp)} ${f2(D0)})`, toSec: (xi: number, h: number): V => ({x: sf.Xp + xi, y: D0 + slope * xi - h})};
};
/** height of the nose tip above the back face: recessed when closed, `press` past the skin line at full stroke */
export const noseTipH = (stroke: number, press: number) => lerp(PORT_GEO.recess * U, DEV_GEO.sink * U - press, clamp(stroke));
/** how far the nose presses past the skin line (= the dimple depth), local units */
export const portPress = (stroke: number, press: number) => Math.max(0, DEV_GEO.sink * U - noseTipH(stroke, press));
/** the skin dimple under the nose (cos^2 over +-dimpleHalf) */
export const dimpleAt = (sf: SecFrame, X: number, amp: number) => {
  const t = (X - sf.Xp) / (PORT_GEO.dimpleHalf * U);
  return Math.abs(t) >= 1 ? 0 : amp * Math.pow(Math.cos((t * Math.PI) / 2), 2);
};

/** The skin pressed in under the nose. part 'shade' (on the arm, inArm, over the section when it is open): a soft
 *  crescent shades the dimpled skin. part 'gap' (in the case layer, so it also covers the case's outline stroke): the
 *  dark sliver between the case's back face and the dimpled skin beside the nose, the small attached shadow. */
export const SkinDimple: React.FC<{id: string; sf: SecFrame; amp: number; part?: 'shade' | 'gap'}> = ({id, sf, amp, part = 'shade'}) => {
  if (amp < 0.5) return null;
  const half = PORT_GEO.dimpleHalf * U;
  const n = 18;
  const xs = Array.from({length: n + 1}, (_, i) => sf.Xp - half + (2 * half * i) / n);
  const back = DEV_GEO.sink * U;
  const surf = xs.map((X) => ({x: X, y: sf.dSurf(X) + back}));
  const dim = xs.map((X) => ({x: X, y: sf.dSurf(X) + Math.max(back, dimpleAt(sf, X, amp))}));
  const gap = `M${[...surf, ...[...dim].reverse()].map(P2).join(' L')} Z`;
  if (part === 'gap')
    return (
      <g>
        <path d={gap} fill="#1B2833" />
        <path d={`M${surf.map(P2).join(' L')}`} fill="none" stroke="#0A1A44" strokeWidth={8} />
      </g>
    );
  const cr = 0.2 * U;
  const cx = Array.from({length: n + 1}, (_, i) => sf.Xp - cr + (2 * cr * i) / n);
  const cTop = cx.map((X) => ({x: X, y: sf.dSurf(X) + dimpleAt(sf, X, amp)}));
  const cBot = cx.map((X, i) => ({x: X, y: cTop[i].y + 46 * Math.sin((Math.PI * i) / n)}));
  const y0 = sf.dSurf(sf.Xp) + amp;
  const k = clamp(amp / 14);
  return (
    <g>
      <Lin id={`${id}-cr`} d={`M${[...cTop, ...[...cBot].reverse()].map(P2).join(' L')} Z`} from={{x: 0, y: y0 - 4}} to={{x: 0, y: y0 + 46}} stops={[[0, '#4A2016', 0.5 * k], [0.45, '#5A2A1E', 0.3 * k], [1, '#5A2A1E', 0]]} />
    </g>
  );
};

/** a small local light where the nose meets the skin (normal blend, alpha <= 0.3, about a quarter wrist radius) */
export const PortLight: React.FC<{id: string; sf: SecFrame; press: number; a: number; color: string}> = ({id, sf, press, a, color}) =>
  a > 0.01 ? <Glow id={id} c={{x: sf.Xp, y: sf.dSurf(sf.Xp) + press + 40}} r={110} ry={90} color={color} alpha={0.22 * clamp(a)} blend="normal" /> : null;

// ------------------------------------------------------------------ the compact section window at the contact point
/** the window round the port (local units): toward the elbow, toward the wrist, and its depth (past the far wall) */
export const SEC_WIN = {back: 2100, fwd: 300, depth: 820};

type SectionProps = {
  id: string;
  sf: SecFrame;
  f: number;
  /** window open 0..1: it grows from the contact point along the arm and down through the layers */
  open: number;
  /** the vessel and everything in it */
  tube: React.ReactNode;
  /** window extent along the arm (local X) and its depth; default SEC_WIN round the port */
  x0?: number;
  x1?: number;
  depth?: number;
  /** skin dimple under the nose (local units): skin, dermis and fat follow it 1 / 0.6 / 0.3 */
  dimple?: number;
  /** the sensor shot: a thin cyan edge leads the opening */
  sweep?: boolean;
  /** the treatment (no sweep): how far the window reaches toward the elbow (local units from the port); it runs on
   *  off frame after `open` completes (default: the whole window) */
  reach?: number;
  /** drawn inside the window over the vessel (the sensor stream, the treatment channel) */
  children?: React.ReactNode;
};

export const SectionLayers: React.FC<SectionProps> = ({id, sf, open, tube, x0, x1, depth, dimple = 0, sweep = false, reach, children}) => {
  const X0 = x0 ?? sf.Xp - SEC_WIN.back;
  const X1 = x1 ?? sf.Xp + SEC_WIN.fwd;
  const DEP = depth ?? SEC_WIN.depth;
  const e = clamp(open);
  if (e <= 0.002) return null;
  const Xp = sf.Xp;
  const surf = (X: number) => sf.dSurf(X);
  // the window opens from the contact point as a slit that runs along the arm first, then deepens down to the vessel.
  // The sensor shot's sweep (in the overview) runs the cut along the arm in a few frames, reaching through the skin and
  // the fat to a strip of tissue as it runs; the treatment's (in the close-up) starts as a shallow slit of the skin bands
  // only at the dimple, runs along the arm, then deepens through the fat to the vessel over 4-5 frames. Never a lone
  // patch of fat.
  const eL = sweep ? smooth(clamp(Math.sqrt(e) / 0.35)) : smooth(clamp(e / 0.3));
  const eD = sweep ? smooth(clamp((e - 0.15) / 0.85)) : smooth(clamp((e - 0.06) / 0.6));
  // V4 final (treatment, no sweep): one shape grows from the dimple's floor, all the layers opening together (no slit
  // along the arm, no lone slab of fat): `open` (linear) deepens it with an ease-in, the wrist side follows the depth,
  // and the elbow side runs on at `reach` (past the top of frame before it completes)
  const pT = e * e * (2 - e);
  const dnT = (X1 - Xp) * (1 - Math.pow(1 - clamp(pT / 0.5), 2));
  const wx0 = sweep ? lerp(Xp - 120, X0, eL) : Math.max(X0, Xp - Math.max(dnT, reach ?? Xp - X0));
  const wx1 = sweep ? lerp(Xp + 120, X1, Math.min(1, eL * 1.6)) : Xp + dnT;
  const top = Math.min(surf(X0), surf(X1)) - 300;
  // (the sweep's first frame is a shallow slit too; it is through the fat by the time it has run half its length)
  const dep = sweep ? lerp(surf(Xp) + lerp(60, SEC.fat + 110, smooth(clamp(eL / 0.5))), DEP, eD) : lerp(surf(Xp) + dimple, DEP, pT);
  const rc = Math.min(260, (dep - surf(Xp)) * 0.5, (wx1 - wx0) * 0.5);
  const rimK = sweep ? Math.min(1, 0.45 + 3 * e) : smooth(clamp((dep - surf(Xp) - SEC.skin + 30) / 160));
  const win = `M${f2(wx0)},${f2(top)} L${f2(wx1)},${f2(top)} L${f2(wx1)},${f2(dep - rc)} A${f2(rc)},${f2(rc)} 0 0 1 ${f2(wx1 - rc)},${f2(dep)} L${f2(wx0 + rc)},${f2(dep)} A${f2(rc)},${f2(rc)} 0 0 1 ${f2(wx0)},${f2(dep - rc)} Z`;
  const dim = (X: number) => dimpleAt(sf, X, dimple);
  const half = PORT_GEO.dimpleHalf * U;
  const xs = [X0, ...Array.from({length: 17}, (_, i) => Xp - half + (2 * half * i) / 16), X1];
  const band = (d0: number, k0: number, d1: number, k1: number) => {
    const a = xs.map((X) => ({x: X, y: surf(X) + d0 + dim(X) * k0}));
    const b = xs.map((X) => ({x: X, y: surf(X) + d1 + dim(X) * k1})).reverse();
    return `M${[...a, ...b].map(P2).join(' L')} Z`;
  };
  const lobules: React.ReactNode[] = [];
  for (let i = 0; i < 30; i++) {
    const row = i % 2;
    const col = Math.floor(i / 2);
    const X = X1 - 60 - col * 170 - row * 85 + hash(i, 7) * 30;
    if (X < X0 - 100) continue;
    const rr = 62 + hash(i, 8) * 16;
    const D = surf(X) + SEC.skin + 66 + row * 104 + hash(i, 9) * 16 + dim(X) * 0.45;
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
        <path d={band(SEC.skin, 0.6, SEC.fat, 0.3)} fill={shade(PAL.fat, 0.2)} />
        {lobules}
        <path d={band(SEC.fat - 6, 0.3, SEC.fat + 36, 0.3)} fill="#7A2A2A" opacity={0.16} />
        {/* skin: dermis + a lit epidermis line, all following the dimple */}
        <Lin id={`${id}-sk`} d={band(0, 1, SEC.skin, 0.6)} from={{x: 0, y: surf(Xp)}} to={{x: 0, y: surf(Xp) + SEC.skin}} stops={[[0, '#F7C9AE'], [1, PAL.skinLayer]]} />
        <path d={band(-4, 1, 14, 1)} fill="#FFE9DA" opacity={0.8} />
        <path d={band(SEC.skin - 4, 0.6, SEC.skin + 30, 0.6)} fill="#8A4A3A" opacity={0.14} />
        {tube}
        {children}
      </g>
      {/* the cut's restrained rim: a thin lit bevel and a thin ink line. The treatment's slit (skin only, the same tone
          as the skin round it) has no rim: it comes in with the depth, as the dermis and the fat show, so the first
          frames never read as an empty outline on the skin */}
      <path d={win} fill="none" stroke="#F8DCCB" strokeWidth={16} opacity={0.85 * rimK} />
      <path d={win} fill="none" stroke="#172B3A" strokeWidth={5} opacity={0.4 * rimK} />
      {/* V4 fix: the sweep's lit edge belongs to the overview only; it is gone by e 0.41 (the punch-in at 177, e 0.43),
          so no bright line runs down the window's cut edge in the close-up */}
      {sweep && e > 0.01 && e < 0.41 && (
        <path d={`M${f2(wx0)},${f2(top + 40)} L${f2(wx0)},${f2(dep - rc)} A${f2(rc)},${f2(rc)} 0 0 0 ${f2(wx0 + rc)},${f2(dep)} L${f2(wx1 - rc)},${f2(dep)}`} fill="none" stroke="#C9F4FF" strokeWidth={12} strokeLinecap="round" opacity={0.7 * Math.sin(Math.PI * Math.min(1, e * 1.05)) * (1 - smooth(clamp((e - 0.3) / 0.11)))} />
      )}
    </g>
  );
};

// ------------------------------------------------------------------ the sensors: discrete beads from the cartridge
export type SensorRelease = {
  /** the first and last bead leave the nose tip at t0 and t1; n beads */
  t0: number;
  t1: number;
  n: number;
  /** frames a bead spends in the case's feed, then on the stream path from the nose tip to the vessel entry */
  feed: number;
  travel: number;
  /** speed in the flow (local units per frame) once merged */
  vVessel: number;
  /** the hero bead (k = -1) reaches the vessel entry at this frame */
  heroMerge?: number;
};
/** where bead k (k = -1: the hero) is at frame f: still in the cartridge, in the feed (t 0..1), on the stream path
 *  (t 0..1), or in the vessel (t = frames since it merged) */
export const releaseState = (rel: SensorRelease, k: number, f: number): {phase: 'cart' | 'feed' | 'stream' | 'vessel'; t: number} => {
  const tExit = k < 0 ? (rel.heroMerge ?? -1e9) - rel.travel : rel.t0 + (k * (rel.t1 - rel.t0)) / Math.max(1, rel.n - 1);
  if (f < tExit - rel.feed) return {phase: 'cart', t: 0};
  if (f < tExit) return {phase: 'feed', t: (f - (tExit - rel.feed)) / rel.feed};
  if (f < tExit + rel.travel) return {phase: 'stream', t: (f - tExit) / rel.travel};
  return {phase: 'vessel', t: f - tExit - rel.travel};
};

/** The sensor route from the nose tip at the light touch: a gentle descent into the arm that leans slightly upstream,
 *  then one broad sweep (radius 210) that crosses the near wall and meets the flow tangentially STREAM_MERGE past the
 *  vessel entry (far enough upstream that the route never runs toward the wrist, against the flow). Curved and
 *  fanning, so it never reads like the treatment's straight channel. */
export const STREAM_FAN = 46; // half-spread of the beads across the route where it meets the flow (local units)
/** where the sensors meet the flow: this far along the vessel past its entry (local units); VesselTube's beads and the
 *  hero take over from here */
export const STREAM_MERGE = 180;
export const streamFan = (k: number) => (hash(k, 4) * 2 - 1) * STREAM_FAN;
export const streamPath = (sf: SecFrame, vp: Arc & {entry: number}): Arc => {
  const top = {x: sf.Xp, y: sf.dSurf(sf.Xp) + PORT_GEO.pressSensor * U};
  const e = vp.at(vp.entry + STREAM_MERGE).p;
  const r2 = 210; // the sweep's radius: it ends at the merge point, heading along the flow
  const C = {x: e.x, y: e.y - r2};
  const s3 = {x: C.x + r2, y: C.y};
  const h = s3.y - top.y;
  const P1 = {x: lerp(top.x, s3.x, 0.15), y: top.y + h * 0.4};
  const P2 = {x: s3.x, y: s3.y - h * 0.45};
  const pts: V[] = [top];
  for (let i = 1; i <= 14; i++) {
    const t = i / 14;
    const u = 1 - t;
    pts.push({
      x: u * u * u * top.x + 3 * u * u * t * P1.x + 3 * u * t * t * P2.x + t * t * t * s3.x,
      y: u * u * u * top.y + 3 * u * u * t * P1.y + 3 * u * t * t * P2.y + t * t * t * s3.y,
    });
  }
  for (let i = 1; i <= 14; i++) {
    const t = ((i / 14) * Math.PI) / 2;
    pts.push({x: C.x + r2 * Math.cos(t), y: C.y + r2 * Math.sin(t)});
  }
  return arc(pts);
};

/** The sensors crossing into the vessel: sparse discrete cyan beads that fan out along the curved route (each bead
 *  fast out of the nose, slowing to the flow's speed as it merges, arriving at its own lane in the flow). V4 fix: no
 *  standalone trace of the route (it ran ahead of the leading bead and outlived the stream); each bead's own short wake
 *  is the only trail. `trace` is kept in the props for the caller but no longer drawn. */
export const StreamDraw: React.FC<{id: string; sf: SecFrame; vp: Arc & {entry: number}; f: number; rel: SensorRelease; trace: number}> = ({id, sf, vp, f, rel}) => {
  const sp = streamPath(sf, vp);
  const L = sp.L;
  const c = clamp(1 - (rel.vVessel * rel.travel) / L, 0, 0.9);
  const els: React.ReactNode[] = [];
  for (let k = rel.heroMerge === undefined ? 0 : -1; k < rel.n; k++) {
    const st = releaseState(rel, k, f);
    if (st.phase !== 'stream') continue;
    const hero = k < 0;
    const u = (hero ? 1 - Math.pow(1 - st.t, 2) : st.t + c * st.t * (1 - st.t)) * L;
    const q = sp.at(u);
    const jit = hero ? 0 : streamFan(k) * smooth(clamp(u / L));
    const p = add(q.p, mul(q.nrm, jit));
    if (hero) {
      els.push(
        <g key={k}>
          <Glow id={`${id}-hg`} c={p} r={22 * 3.2} color={PAL.signal} alpha={0.35} blend="normal" />
          <Bead id={`${id}-b`} p={p} r={22} dir={q.dir} wake={3} halo={1} />
        </g>,
      );
    } else els.push(<Bead key={k} id={`${id}-b`} p={p} r={9 + hash(k, 52) * 6} dir={q.dir} wake={2.2} halo={0.5} />);
  }
  return (
    <g>
      <BeadDefs id={`${id}-b`} />
      {els}
    </g>
  );
};

// ------------------------------------------------------------------ the treatment: one slug down a straight channel
export const TREAT_SLUG = {len: 170, w: 56, core: '#EAF4FF', rim: '#4F86FF', lean: 12, bend: 130};

/** SVG path of an arc's sub-span [u0, u1] (null when empty) */
const subPathD = (a: Arc, u0: number, u1: number) => {
  const lo = Math.max(0, u0);
  const hi = Math.min(a.L, u1);
  if (hi - lo < 1) return null;
  const pts = [a.at(lo).p, ...a.pts.filter((_, i) => a.cum[i] > lo && a.cum[i] < hi), a.at(hi).p];
  return `M${pts.map(P2).join(' L')}`;
};

/** the slug: a short capsule (band-blue rim, blue-white core, one small highlight at the head). `rigid` lays it straight
 *  along the chord of its span, so it never bends round a curve (in the tissue and the lumen); otherwise it follows its
 *  path, as fluid in a bore does (inside the case). */
const SlugStroke: React.FC<{path: Arc; u0: number; u1: number; w: number; rigid?: boolean}> = ({path, u0, u1, w, rigid = false}) => {
  const lo = Math.max(0, u0);
  const hi = Math.min(path.L, u1);
  if (hi - lo < 1) return null;
  let d: string;
  let head: V;
  if (rigid) {
    const a = path.at(lo).p;
    const b = path.at(hi).p;
    const m = mul(add(a, b), 0.5);
    const c = sub(b, a);
    const dir = mul(c, 1 / (len(c) || 1));
    const half = (hi - lo) / 2;
    const tip = add(m, mul(dir, half));
    d = `M${P2(add(m, mul(dir, -half)))} L${P2(tip)}`;
    head = add(tip, mul(dir, -Math.min(half, TREAT_SLUG.w * 0.55 * w)));
  } else {
    d = subPathD(path, lo, hi) as string;
    head = path.at(Math.max(lo, hi - TREAT_SLUG.w * 0.55 * w)).p;
  }
  return (
    <g>
      <path d={d} fill="none" stroke={TREAT_SLUG.rim} strokeWidth={f2(TREAT_SLUG.w * w)} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={TREAT_SLUG.core} strokeWidth={f2(TREAT_SLUG.w * 0.6 * w)} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={f2(head.x)} cy={f2(head.y)} r={f2(TREAT_SLUG.w * 0.14 * w)} fill="#FFFFFF" />
    </g>
  );
};

export type TreatPath = {arc: Arc; uTip: number; uBend: number; uMerge: number; sMerge: number; uJoin: number; uWall: number; shift: number};
/** The treatment route in the section frame: reservoir outlet -> feed -> down the rod to the nose tip (full stroke) ->
 *  one narrow channel that leaves the nose leaning toward the flow and curves evenly through skin, fat and the near
 *  wall (about 40 deg to the vessel there) into the lumen, where it meets the flow tangentially on the axis (uJoin) ->
 *  on along the vessel. Continuous; it never leaves the channel or the lumen.
 *  V4 final: the curve replaces V4's straight channel and tight bend (the slug turned about 75 deg in 3 frames at the
 *  wall). From the join on the route is V4's own (the same points), `shift` (local units) further along it, and
 *  uMerge / sMerge keep V4's map between the route and the vessel (s = sMerge + u - uMerge), so with the head's timing
 *  shifted to match (Aftermath3 slugHead) the slug is where V4 had it from the join on (the 987 match). uWall: where the
 *  channel opens into the lumen (uBend: the trace ends there). */
export const treatPath = (sf: SecFrame, vp: Arc & {entry: number}): TreatPath => {
  const pf = portFrame(sf);
  const PG = PORT_GEO;
  const hTip = noseTipH(1, PG.pressTreat * U);
  const fh = PG.treatFeedH * U;
  const xr = PG.treatRes.xi0 * U;
  const rc = 30;
  const inCase: V[] = [];
  for (let i = 0; i <= 6; i++) inCase.push(pf.toSec(lerp(xr, rc, i / 6), fh));
  for (let i = 1; i <= 6; i++) {
    const t = ((i / 6) * Math.PI) / 2;
    inCase.push(pf.toSec(rc - rc * Math.sin(t), fh - rc + rc * Math.cos(t)));
  }
  for (let i = 1; i <= 6; i++) inCase.push(pf.toSec(0, lerp(fh - rc, hTip, i / 6)));
  const tip = inCase[inCase.length - 1];
  const th = (TREAT_SLUG.lean * Math.PI) / 180;
  const r = TREAT_SLUG.bend;
  const Dc = vp.at(vp.entry + 110).p.y;
  const t = (Dc - r + r * Math.sin(th) - tip.y) / Math.cos(th);
  const start = {x: tip.x - t * Math.sin(th), y: tip.y + t * Math.cos(th)};
  const C = {x: start.x - r * Math.cos(th), y: Dc - r};
  const tissue: V[] = [];
  for (let i = 1; i <= 10; i++) tissue.push({x: lerp(tip.x, start.x, i / 10), y: lerp(tip.y, start.y, i / 10)});
  const phi0 = Math.PI / 2 - th;
  for (let i = 1; i <= 10; i++) {
    const ph = phi0 * (1 - i / 10);
    tissue.push({x: C.x + r * Math.sin(ph), y: C.y + r * Math.cos(ph)});
  }
  let sM = vp.entry;
  let best = 1e9;
  for (let s = vp.entry; s < vp.entry + 500; s += 2) {
    const d = Math.abs(vp.at(s).p.x - C.x);
    if (d < best) {
      best = d;
      sM = s;
    }
  }
  const flow: V[] = [];
  for (let s = sM + 20; s <= sM + 3000; s += 20) flow.push(vp.at(s).p);
  const a = arc([...inCase, ...tissue, ...flow]);
  // V4 final: the curved channel, a cubic from the nose tip (V4's lean) to the vessel's axis JOIN steps along the flow,
  // tangent to it there; the route goes on through V4's own flow points
  const JOIN = 15;
  const P1 = flow[JOIN - 1];
  const d1 = vp.at(sM + 20 * JOIN).dir;
  const ch = len(sub(P1, tip));
  const curve: V[] = [];
  for (let i = 1; i <= 40; i++) {
    const q = i / 40;
    const h00 = 2 * q ** 3 - 3 * q ** 2 + 1;
    const h10 = q ** 3 - 2 * q ** 2 + q;
    const h01 = -2 * q ** 3 + 3 * q ** 2;
    const h11 = q ** 3 - q ** 2;
    curve.push(i === 40 ? P1 : {x: h00 * tip.x - h10 * ch * Math.sin(th) + h01 * P1.x + h11 * ch * d1.x, y: h00 * tip.y + h10 * ch * Math.cos(th) + h01 * P1.y + h11 * ch * d1.y});
  }
  const b = arc([...inCase, ...curve, ...flow.slice(JOIN)]);
  const uJoin = b.cum[inCase.length + curve.length - 1];
  const shift = uJoin - a.cum[inCase.length + tissue.length - 1 + JOIN];
  // the channel opens into the lumen where the curve crosses the lumen's near edge (SEC.rho from the axis)
  let uWall = uJoin;
  for (let u = b.cum[inCase.length - 1]; u < uJoin; u += 2) {
    if (b.at(u).p.y > P1.y - SEC.rho) {
      uWall = u;
      break;
    }
  }
  const uMerge = a.cum[inCase.length + tissue.length - 1] + shift;
  return {arc: b, uTip: b.cum[inCase.length - 1], uBend: uWall, uMerge, sMerge: sM, uJoin, uWall, shift};
};

/** The slug and the faint trace it leaves (20 local wide, alpha 0.35; only along the case's bore and the channel,
 *  never in the lumen). `part` picks which stretch this layer owns:
 *  inside the case (caseCut layer: the slug is fluid in the bore, clipped to the feed, the hollow rod and the nose, at
 *  the bore's width) or the tissue (section layer: the channel, and the slug following it, widening as it leaves the
 *  nose tip). The trace
 *  fades over `trail` (about 10 frames of travel). `trailLumen` is accepted for compatibility and ignored. The slug is
 *  drawn while any of it is still short of the merge point; VesselTube's dose takes it over from there. */
export const TreatChannel: React.FC<{
  id: string;
  tp: TreatPath;
  head: number;
  trail: number;
  trailLumen?: number;
  w?: number;
  part: 'case' | 'tissue';
  /** part 'case': the bore the slug runs in (the port frame and the nose's current stroke) */
  bore?: {sf: SecFrame; stroke: number; press: number};
  /** part 'tissue': the channel itself, run from the nose tip into the lumen (k 0..1) at opacity a */
  channel?: {k: number; a: number};
}> = ({id, tp, head, trail, w = 1, part, bore, channel}) => {
  const tail = head - TREAT_SLUG.len;
  const trace = (key: string, c0: number, c1: number, tr: number, alpha = 0.35) => {
    const tr0 = Math.max(c0, tail - tr);
    const tr1 = Math.min(c1, tail + 12);
    const d = tr > 1 ? subPathD(tp.arc, tr0, tr1) : null;
    if (!d) return null;
    const p0 = tp.arc.at(Math.max(0, tail - tr)).p;
    const p1 = tp.arc.at(Math.max(0, tail)).p;
    return (
      <g key={key}>
        <defs>
          <linearGradient id={`${id}-${key}`} gradientUnits="userSpaceOnUse" x1={f2(p0.x)} y1={f2(p0.y)} x2={f2(p1.x + 0.01)} y2={f2(p1.y + 0.01)}>
            <stop offset="0" stopColor="#9EC0FF" stopOpacity={0} />
            <stop offset="1" stopColor="#9EC0FF" stopOpacity={alpha} />
          </linearGradient>
        </defs>
        <path d={d} fill="none" stroke={`url(#${id}-${key})`} strokeWidth={20} strokeLinecap="butt" />
      </g>
    );
  };
  const live = head > 0 && tail < tp.uJoin;
  if (part === 'case') {
    let clip: React.ReactNode = null;
    if (bore) {
      const pf = portFrame(bore.sf);
      const fh = PORT_GEO.treatFeedH * U;
      const tipH = noseTipH(bore.stroke, bore.press);
      clip = (
        <clipPath id={`${id}-bc`}>
          <path transform={pf.matrix} d={rectD(-17, PORT_GEO.treatRes.xi0 * U + 24, fh - 17, fh + 17, 12)} />
          <path transform={pf.matrix} d={rectD(-17, 17, tipH - 2, fh + 17)} />
        </clipPath>
      );
    }
    return (
      <g>
        {trace('tr', 0, tp.uTip, trail)}
        {live && (
          <g clipPath={clip ? `url(#${id}-bc)` : undefined}>
            {clip && <defs>{clip}</defs>}
            <SlugStroke path={tp.arc} u0={Math.max(0, tail)} u1={Math.min(head, tp.uTip + 40)} w={w * 0.6} />
          </g>
        )}
      </g>
    );
  }
  // the slug widens from the bore's width to its own as it leaves the nose tip
  const wT = w * lerp(0.6, 1, smooth(clamp((head - tp.uTip) / TREAT_SLUG.len)));
  // V4 final: one narrow channel (a pale bore with a thin blue-grey wall) from the nose tip to where it opens into the
  // lumen; the slug runs in it and on along the same curve into the flow (no free-floating capsule, no turn in place)
  const chD = channel && channel.a > 0.01 && channel.k > 0.01 ? subPathD(tp.arc, tp.uTip - 12, lerp(tp.uTip, tp.uWall + 16, channel.k)) : null;
  return (
    <g>
      {chD && (
        <g opacity={f2(channel?.a ?? 0)}>
          <path d={chD} fill="none" stroke="#35548A" strokeOpacity={0.55} strokeWidth={34} strokeLinecap="round" strokeLinejoin="round" />
          <path d={chD} fill="none" stroke="#EAF1FF" strokeOpacity={0.8} strokeWidth={18} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
      {/* the trace stays in the channel (it ends where the channel opens into the lumen): no ghost J */}
      {trace('tr', tp.uTip, tp.uBend, trail)}
      {live && head > tp.uTip && <SlugStroke path={tp.arc} u0={Math.max(tp.uTip - TREAT_SLUG.len, tail)} u1={head} w={wT} />}
    </g>
  );
};

// ------------------------------------------------------------------ the case cut-away: port, shutter, actuator, payloads
type MechProps = {
  id: string;
  sf: SecFrame;
  f: number;
  /** 0 closed .. 1 open */
  shutter: number;
  /** 0 retracted .. 1 full stroke, and how far past the skin the full stroke presses (local units) */
  stroke: number;
  press: number;
  /** treatment reservoir fill 0..1 */
  treatLevel: number;
  /** sensor beads still in the cartridge 0..1 */
  sensorLeft: number;
  /** sensor beads travelling the feed (0..1 along it) */
  feed?: number[];
  /** 0..1 how far the near wall has been cut away, from the case's elbow end past the port toward the wrist (a hard
   *  edge with a lit lip that runs along the case; never a translucent fade of the mechanism) */
  reveal?: number;
};

const rectD = (xi0: number, xi1: number, h0: number, h1: number, rad = 0) => {
  const r = Math.min(rad, (xi1 - xi0) / 2, (h1 - h0) / 2);
  const y0 = -h1;
  const y1 = -h0;
  if (r <= 0.5) return `M${f2(xi0)},${f2(y0)} H${f2(xi1)} V${f2(y1)} H${f2(xi0)} Z`;
  return `M${f2(xi0 + r)},${f2(y0)} H${f2(xi1 - r)} A${f2(r)},${f2(r)} 0 0 1 ${f2(xi1)},${f2(y0 + r)} V${f2(y1 - r)} A${f2(r)},${f2(r)} 0 0 1 ${f2(xi1 - r)},${f2(y1)} H${f2(xi0 + r)} A${f2(r)},${f2(r)} 0 0 1 ${f2(xi0)},${f2(y1 - r)} V${f2(y0 + r)} A${f2(r)},${f2(r)} 0 0 1 ${f2(xi0 + r)},${f2(y0)} Z`;
};

/** The sensor feed inside the case: from the cartridge's port-side end along the panel to the nose and out of its tip. */
const sensorFeedPts = (tipH: number): V[] => [
  {x: PORT_GEO.sensorCart.xi0 * U + 10, y: -120},
  {x: PORT_GEO.sensorCart.xi0 * U - 15, y: -PORT_GEO.sensorFeedH * U},
  {x: 85, y: -PORT_GEO.sensorFeedH * U},
  {x: 0, y: -45},
  {x: 0, y: -tipH},
];

/** The local cut-away at the port end of the case (replaces V3's full-length cavity and 18-dot reservoir): the back
 *  panel and its seam, the bore and the sliding shutter, the nose on a short piston rod driven by a small actuator,
 *  the treatment reservoir with its feed, the sensor cartridge with its own feed, and the electronics board. */
export const PortMech: React.FC<MechProps> = ({id, sf, shutter, stroke, press, treatLevel, sensorLeft, feed = [], reveal = 1}) => {
  const pf = portFrame(sf);
  const PG = PORT_GEO;
  const cut = PG.cut;
  const k = (v: number) => v * U;
  const rv = clamp(reveal);
  if (rv <= 0.001) return null;
  // the moving edge of the cut-away while it opens (local xi)
  const xEdge = lerp(k(cut.xi0) - 12, k(cut.xi1) + 12, rv);
  const tipH = noseTipH(stroke, press);
  const noseTop = tipH + k(PG.noseL);
  const nh = k(PG.nose) / 2;
  const yT = -tipH;
  const yN = -noseTop;
  const nr = 42;
  const nose = `M${f2(-nh)},${f2(yN)} H${f2(nh)} V${f2(yT - nr)} A${nr},${nr} 0 0 1 ${f2(nh - nr)},${f2(yT)} H${f2(-nh + nr)} A${nr},${nr} 0 0 1 ${f2(-nh)},${f2(yT - nr)} Z`;
  const sl = k(PG.shutterSlide) * clamp(shutter);
  const res = PG.treatRes;
  const cart = PG.sensorCart;
  const lev = clamp(treatLevel);
  const fluidX1 = k(res.xi0) + 8 + (k(res.xi1 - res.xi0) - 16) * lev;
  // the cartridge's visible payload: 12 beads, the ones nearest the port leave first
  const slots = Array.from({length: 12}, (_, i) => ({x: k(cart.xi0) + 34 + (i % 6) * 40 + Math.floor(i / 6) * 18, h: k(cart.h0) + 26 + Math.floor(i / 6) * 38 + hash(i, 77) * 6}));
  const order = [...slots.keys()].sort((a, b) => slots[a].x - slots[b].x);
  const left = Math.round(12 * clamp(sensorLeft));
  const fp = sensorFeedPts(tipH);
  const fpArc = arc(fp);
  const bore = k(PG.bore) / 2;
  const pT = k(DEV_GEO.panelT);
  const opening = rv < 0.999;
  return (
    <g transform={pf.matrix}>
      <defs>
        {opening && (
          <clipPath id={`${id}-rv`}>
            <rect x={f2(k(cut.xi0) - 200)} y={f2(-k(cut.h1) - 200)} width={f2(xEdge - k(cut.xi0) + 200)} height={f2(k(cut.h1) + 800)} />
          </clipPath>
        )}
        <linearGradient id={`${id}-cv`} gradientUnits="userSpaceOnUse" x1="0" y1={f2(-k(cut.h1))} x2="0" y2="0">
          <stop offset="0" stopColor="#15284F" />
          <stop offset="1" stopColor="#050B18" />
        </linearGradient>
        <linearGradient id={`${id}-rod`} gradientUnits="userSpaceOnUse" x1={f2(-k(PG.piston) / 2)} y1="0" x2={f2(k(PG.piston) / 2)} y2="0">
          <stop offset="0" stopColor="#8DA9EC" />
          <stop offset="0.45" stopColor="#5675C2" />
          <stop offset="1" stopColor="#2E4785" />
        </linearGradient>
        <linearGradient id={`${id}-ns`} gradientUnits="userSpaceOnUse" x1={f2(-nh)} y1="0" x2={f2(nh)} y2="0">
          <stop offset="0" stopColor="#F2F6FF" />
          <stop offset="0.5" stopColor="#C3D2F2" />
          <stop offset="1" stopColor="#8197C9" />
        </linearGradient>
        <linearGradient id={`${id}-fl`} gradientUnits="userSpaceOnUse" x1="0" y1={f2(-k(res.h1))} x2="0" y2={f2(-k(res.h0))}>
          <stop offset="0" stopColor="#F4F9FF" />
          <stop offset="0.55" stopColor="#D5E5FF" />
          <stop offset="1" stopColor="#8FB2FF" />
        </linearGradient>
      </defs>
      <BeadDefs id={`${id}-b`} />
      <g clipPath={opening ? `url(#${id}-rv)` : undefined}>
      {/* the opened pocket at the port end */}
      <path d={rectD(k(cut.xi0), k(cut.xi1), 0, k(cut.h1), 40)} fill={`url(#${id}-cv)`} />
      {/* electronics: a slim board closing the pocket on the wrist side */}
      <path d={rectD(k(PG.board.xi0), k(PG.board.xi1), k(PG.board.h0), k(PG.board.h1), 10)} fill="#0F2146" stroke="#2C4C96" strokeWidth={5} strokeOpacity={0.6} />
      {[0.3, 0.5, 0.7].map((t, i) => (
        <path key={i} d={`M${f2(k(PG.board.xi0) + 6)},${f2(-lerp(k(PG.board.h0), k(PG.board.h1), t))} H${f2(k(PG.board.xi1) - 6)}`} stroke="#4A6FC4" strokeWidth={6} strokeLinecap="round" opacity={0.6} />
      ))}
      {/* back panel in section, split by the bore; the shutter's slot; the seam where the panel meets the body */}
      {/* the bore through the panel: near-black behind the shutter */}
      <path d={rectD(-bore, bore, -2, pT + 2)} fill="#02060F" />
      <path d={rectD(k(cut.xi0), -bore, 0, pT)} fill="#1D3F9E" />
      <path d={rectD(bore, k(cut.xi1), 0, pT)} fill="#1D3F9E" />
      <path d={rectD(bore, k(cut.xi1) - 120, 4, 36)} fill="#0A1A44" opacity={0.7} />
      <path d={`M${f2(k(cut.xi0))},${f2(-pT)} H${f2(-bore)} M${f2(bore)},${f2(-pT)} H${f2(k(cut.xi1))}`} stroke="#0A1A44" strokeWidth={12} />
      <path d={`M${f2(k(cut.xi0) + 20)},${f2(-pT + 14)} H${f2(-bore - 10)} M${f2(bore + 10)},${f2(-pT + 14)} H${f2(k(cut.xi1) - 20)}`} stroke="#5C86F2" strokeWidth={6} opacity={0.45} />
      {/* treatment reservoir: blue-white fluid ahead of a small plunger, and its feed to the rod */}
      <path d={rectD(40, k(res.xi0) + 6, k(PG.treatFeedH) - 16, k(PG.treatFeedH) + 16, 10)} fill="#081430" />
      <path d={rectD(k(res.xi0), k(res.xi1), k(res.h0), k(res.h1), 56)} fill="#0E2550" stroke="#9DB8FF" strokeWidth={6} strokeOpacity={0.55} />
      {lev > 0.01 && <path d={rectD(k(res.xi0) + 8, fluidX1, k(res.h0) + 8, k(res.h1) - 8, 46)} fill={`url(#${id}-fl)`} stroke={TREAT_SLUG.rim} strokeWidth={5} />}
      <path d={rectD(fluidX1, fluidX1 + 18, k(res.h0) + 6, k(res.h1) - 6, 6)} fill="#3E5C8E" />
      <path d={rectD(fluidX1 + 18, k(res.xi1) - 8, k(PG.treatFeedH) - 10, k(PG.treatFeedH) + 10)} fill="#2B437A" />
      {/* sensor cartridge: the remaining beads, and its feed along the panel to the nose */}
      <path d={`M${fp.slice(0, 4).map(P2).join(' L')}`} fill="none" stroke="#081430" strokeWidth={28} strokeLinejoin="round" />
      <path d={`M${fp.slice(0, 4).map(P2).join(' L')}`} fill="none" stroke="#10305A" strokeWidth={14} strokeLinejoin="round" />
      <path d={rectD(k(cart.xi0), k(cart.xi1), k(cart.h0), k(cart.h1), 40)} fill="#0B2A4E" stroke={PAL.signal} strokeWidth={5} strokeOpacity={0.5} />
      {order.map((i, rank) => (rank >= 12 - left ? <circle key={i} cx={f2(slots[i].x)} cy={f2(-slots[i].h)} r={13} fill="#C9F4FF" opacity={0.92} /> : null))}
      {/* piston rod (hollow: the payload runs down its middle) and the nose */}
      <path d={rectD(-k(PG.piston) / 2, k(PG.piston) / 2, noseTop - 4, 322)} fill={`url(#${id}-rod)`} />
      <path d={rectD(-14, 14, noseTop, 322)} fill="#0A1A44" opacity={0.8} />
      <path d={nose} fill={`url(#${id}-ns)`} stroke="#3E5C8E" strokeWidth={6} />
      <path d={rectD(-12, 12, tipH + 10, noseTop)} fill="#0A1A44" opacity={0.75} />
      {/* actuator housing round the rod's top: a small solenoid */}
      <path d={rectD(k(PG.actuator.xi0), k(PG.actuator.xi1), k(PG.actuator.h0), k(PG.actuator.h1), 18)} fill="#22357A" stroke="#0A1A44" strokeWidth={6} />
      {[270, 293, 316].map((h, i) => (
        <path key={i} d={`M${f2(k(PG.actuator.xi0) + 22)},${-h} H${f2(k(PG.actuator.xi1) - 22)}`} stroke="#5476CC" strokeWidth={8} strokeLinecap="round" opacity={0.55} />
      ))}
      {/* shutter: a plate under the bore that slides toward the case centre. The bore it uncovers is near-black, and the
          plate has a dark outline and a thin lit edge on its trailing side and face, so it reads at phone size */}
      <path d={rectD(-k(PG.shutterL) / 2 + sl, k(PG.shutterL) / 2 + sl, 4, 4 + k(PG.shutterT), 8)} fill="#8FB0FF" stroke="#0A1A44" strokeWidth={7} />
      <path d={`M${f2(-k(PG.shutterL) / 2 + sl + 4)},${f2(-6 - k(PG.shutterT) + 4)} V${f2(-10)} H${f2(k(PG.shutterL) / 2 + sl - 10)}`} fill="none" stroke="#F2F7FF" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" opacity={0.9} />
      {/* sensor beads in the feed */}
      {feed.map((t, i) => {
        const q = fpArc.at(clamp(t) * fpArc.L);
        return <Bead key={i} id={`${id}-b`} p={q.p} r={11} dir={q.dir} wake={1.6} halo={0.4} />;
      })}
      {/* the cut edge: a lit rim round the opened pocket, open across the bore (it never crosses the nose or the slug) */}
      <path
        d={`M${f2(-bore)},0 H${f2(k(cut.xi0) + 40)} A40,40 0 0 1 ${f2(k(cut.xi0))},-40 V${f2(-k(cut.h1) + 40)} A40,40 0 0 1 ${f2(k(cut.xi0) + 40)},${f2(-k(cut.h1))} H${f2(k(cut.xi1) - 40)} A40,40 0 0 1 ${f2(k(cut.xi1))},${f2(-k(cut.h1) + 40)} V-40 A40,40 0 0 1 ${f2(k(cut.xi1) - 40)},0 H${f2(bore)}`}
        fill="none"
        stroke="#8FB0FF"
        strokeWidth={10}
        opacity={0.6}
      />
      </g>
      {/* while it opens: the near wall's cut lip at the moving edge */}
      {opening && <path d={`M${f2(xEdge)},${f2(-k(cut.h1) - 6)} V6`} stroke="#8FB0FF" strokeWidth={12} strokeLinecap="round" opacity={0.75} />}
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
