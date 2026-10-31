// The inside views. In the snail: the gut from mouth to stomach, the brown digestive gland, the swallowed egg,
// the larva hatching, and the sporocyst's green tubes growing through the body toward the eyestalks.
// In the dive: the inside of a broodsac, packed with the larvae (metacercariae) that will infect a bird.
// In the bird: gullet, gizzard, intestine and cloaca; the sac travelling down; the larvae becoming adult flukes in
// the cloaca and their eggs streaming toward the vent.
import React from 'react';
import {add, closed, lerpP, mul, nrm, open, P, perp, pt, sub, tube} from '../core/geo';
import {uid} from '../core/ids';
import {clamp, hash, lerp, sm} from '../lib';

// ---------------------------------------------------------------- polyline helpers
const plen = (ps: P[]) => ps.slice(1).reduce((a, p, i) => a + Math.hypot(p.x - ps[i].x, p.y - ps[i].y), 0);
/** the point a fraction u along a polyline */
export const along = (ps: P[], u: number): P => {
  const L = plen(ps) * clamp(u);
  let acc = 0;
  for (let i = 1; i < ps.length; i++) {
    const s = Math.hypot(ps[i].x - ps[i - 1].x, ps[i].y - ps[i - 1].y);
    if (acc + s >= L) return lerpP(ps[i - 1], ps[i], (L - acc) / (s || 1));
    acc += s;
  }
  return ps[ps.length - 1];
};
/** the first fraction u of a polyline, resampled */
const partial = (ps: P[], u: number, n = 24) => Array.from({length: n + 1}, (_, i) => along(ps, (u * i) / n));
const resample = (ps: P[], n: number) => Array.from({length: n + 1}, (_, i) => along(ps, i / n));

// ---------------------------------------------------------------- snail interior (snail-local coordinates)
export const GUT_SNAIL: P[] = [pt(2.0, -0.95), pt(1.0, -1.55), pt(-0.6, -2.0), pt(-2.6, -2.25), pt(-4.6, -2.65), pt(-6.6, -3.35), pt(-8.4, -4.2)];
const SPORO_MAIN: P[] = [pt(-9.2, -4.6), pt(-7.4, -3.9), pt(-5.4, -3.55), pt(-3.6, -3.6), pt(-2.3, -3.95), pt(-1.4, -4.3)];
const SPORO_FAR: P[] = [pt(-3.6, -3.6), pt(-2.9, -4.05), pt(-2.3, -4.45)];
const SPORO_SIDE: P[][] = [
  [pt(-7.4, -3.9), pt(-8.0, -2.6), pt(-9.6, -1.9)],
  [pt(-5.4, -3.55), pt(-5.0, -2.3), pt(-6.0, -1.3)],
  [pt(-9.2, -4.6), pt(-11.4, -5.0), pt(-13.0, -6.2)],
  [pt(-9.2, -4.6), pt(-10.6, -3.4), pt(-12.4, -2.6)],
  [pt(-3.6, -3.6), pt(-3.2, -2.5), pt(-2.0, -1.8)],
];
export type SnailInside = {eggU: number; hatch: number; grow: number; glow: number; t: number};
/** g: 0..1 growth of the sporocyst network; eggU: the egg's progress down the gut (0 mouth .. 1 stomach) */
export const snailInterior = (s: SnailInside) => (bend: (p: P) => P) => {
  const B = (ps: P[]) => ps.map(bend);
  const gut = tube(B(resample(GUT_SNAIL, 30)), Array.from({length: 31}, (_, i) => 0.42 + 0.12 * Math.sin(i * 0.7)), true, true);
  const tubeEl = (ps: P[], u: number, r: number, key: string) => {
    if (u <= 0.01) return null;
    const pp = B(partial(ps, u, 20));
    const R = pp.map((_, i) => r * (0.75 + 0.25 * Math.sin(i * 0.9 + s.t * 3)) * (i === pp.length - 1 ? 0.8 : 1));
    const tb = tube(pp, R, true, true);
    return (
      <g key={key}>
        <path d={closed(tb.outline, 0.9)} fill="#8FD14A" fillOpacity={0.85} stroke="#2F6A1A" strokeWidth={0.07} />
        <path d={open(pp)} fill="none" stroke="#DDF7A0" strokeWidth={r * 0.45} strokeOpacity={0.7} strokeDasharray={`${r * 0.6} ${r * 0.9}`} />
      </g>
    );
  };
  const g = s.grow;
  const egg = bend(along(GUT_SNAIL, s.eggU));
  const hatch = s.hatch;
  const miraP = lerpP(bend(pt(-8.4, -4.2)), bend(pt(-9.2, -4.6)), sm(clamp((hatch - 0.3) / 0.7)));
  return (
    <g>
      {/* tissue tint and organs */}
      <rect x={-22} y={-8} width={26} height={9} fill="#D8C6A0" opacity={0.35} />
      <ellipse cx={bend(pt(-13.5, -6.2)).x} cy={bend(pt(-13.5, -6.2)).y} rx={4.6} ry={2.4} fill="#7A4A26" opacity={0.75} />
      {[0, 1, 2, 3].map((i) => {
        const c = bend(pt(-15 + i * 1.6, -6.6 + (i % 2) * 0.9));
        return <ellipse key={i} cx={c.x} cy={c.y} rx={1.4} ry={0.9} fill="#5E351A" opacity={0.55} />;
      })}
      <path d={closed(gut.outline, 0.9)} fill="#E7A99A" fillOpacity={0.8} stroke="#A3584A" strokeWidth={0.06} />
      <ellipse cx={bend(pt(-8.6, -4.3)).x} cy={bend(pt(-8.6, -4.3)).y} rx={1.5} ry={1.0} fill="#D98E80" opacity={0.85} />
      <ellipse cx={bend(pt(1.0, -1.55)).x} cy={bend(pt(1.0, -1.55)).y} rx={0.75} ry={0.6} fill="#C77E70" opacity={0.85} />
      {/* the sporocyst network */}
      <g opacity={sm(clamp(g * 4))}>
        {SPORO_SIDE.map((ps, i) => tubeEl(ps, clamp((g - 0.15 - i * 0.06) / 0.55), 0.26, `s${i}`))}
        {tubeEl(SPORO_MAIN, clamp(g / 0.8), 0.36, 'm')}
        {tubeEl(SPORO_FAR, clamp((g - 0.55) / 0.35), 0.3, 'f')}
        <circle cx={bend(pt(-9.2, -4.6)).x} cy={bend(pt(-9.2, -4.6)).y} r={0.55 * sm(clamp(g * 5))} fill="#9BDC52" stroke="#2F6A1A" strokeWidth={0.07} />
      </g>
      {/* the egg going down, then the larva hatching */}
      {s.eggU > 0 && hatch < 1 && (
        <g>
          <circle cx={egg.x} cy={egg.y} r={0.55} fill="#FFD27A" opacity={0.35 * s.glow} />
          <ellipse cx={egg.x} cy={egg.y} rx={0.26} ry={0.17} fill="#C88A2E" stroke="#5A3A10" strokeWidth={0.04} opacity={1 - sm(clamp((hatch - 0.2) / 0.5))} />
        </g>
      )}
      {hatch > 0.15 && g < 0.25 && (
        <g opacity={1 - sm(clamp(g * 4))}>
          <ellipse cx={miraP.x} cy={miraP.y} rx={0.34} ry={0.18} fill="#E9F6C0" stroke="#5C8A2A" strokeWidth={0.04} />
          <circle cx={miraP.x} cy={miraP.y} r={0.6} fill="#CFF58A" opacity={0.3 * s.glow} />
        </g>
      )}
    </g>
  );
};

// ---------------------------------------------------------------- the egg, in world coordinates (micro scale)
/** a fluke egg (about 0.09 x 0.05 mm here), with its lid and the ciliated larva folded inside */
export const Egg: React.FC<{c: P; t: number; ang?: number; detail?: number}> = ({c, t, ang = -0.3, detail = 1}) => {
  const id = uid('eg');
  const a = (ang * 180) / Math.PI;
  const rx = 0.045, ry = 0.028;
  return (
    <g transform={`translate(${c.x} ${c.y}) rotate(${a})`}>
      <defs>
        <radialGradient id={`${id}g`} cx={-0.012} cy={-0.01} r={0.06} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#F3D58C" />
          <stop offset="0.7" stopColor="#C38B34" />
          <stop offset="1" stopColor="#7C5114" />
        </radialGradient>
      </defs>
      <ellipse cx={0} cy={0} rx={rx} ry={ry} fill={`url(#${id}g)`} />
      <path d={`M${rx * 0.72} ${-ry * 0.7} Q${rx * 0.6} 0 ${rx * 0.72} ${ry * 0.7}`} fill="none" stroke="#5A3A10" strokeWidth={0.0025} opacity={0.8} />
      {detail > 0.01 && (
        <g opacity={detail}>
          <ellipse cx={-0.004} cy={0} rx={rx * 0.68} ry={ry * 0.62} fill="#E8F2C4" opacity={0.75} />
          {Array.from({length: 18}, (_, i) => {
            const th = (i / 18) * Math.PI * 2;
            const x0 = -0.004 + Math.cos(th) * rx * 0.68, y0 = Math.sin(th) * ry * 0.62;
            const wob = 0.004 * Math.sin(t * 22 + i);
            return <path key={i} d={`M${x0} ${y0} l${Math.cos(th) * 0.004 + wob} ${Math.sin(th) * 0.004}`} stroke="#7FA54A" strokeWidth={0.0012} />;
          })}
          <circle cx={0.012} cy={-0.004} r={0.0035} fill="#2A2A14" />
          <circle cx={0.012} cy={0.005} r={0.0035} fill="#2A2A14" />
          {Array.from({length: 7}, (_, i) => <circle key={i} cx={-0.022 + i * 0.006} cy={0.004 * Math.sin(i * 2.1)} r={0.0028} fill="#A8C46A" opacity={0.7} />)}
        </g>
      )}
      <ellipse cx={-rx * 0.35} cy={-ry * 0.45} rx={rx * 0.35} ry={ry * 0.18} fill="#FFFFFF" opacity={0.5} />
    </g>
  );
};

// ---------------------------------------------------------------- inside a broodsac (screen space)
/** the larvae packed inside the sac, seen as the camera dives through the wall: z grows as it dives */
export const SacInterior: React.FC<{z: number; t: number; a: number}> = ({z, t, a}) => {
  if (a < 0.01) return null;
  const items: React.ReactNode[] = [];
  const sc = 1 + z * 1.6;
  for (let i = 0; i < 64; i++) {
    const gx = (i % 8) - 3.5, gy = Math.floor(i / 8) - 3.5;
    const x = 540 + (gx * 150 + (hash(i * 3.3) - 0.5) * 70) * sc;
    const y = 960 + (gy * 250 + (hash(i * 5.1) - 0.5) * 100) * sc;
    const r = (34 + hash(i * 2.2) * 16) * sc;
    const rot = hash(i * 7.7) * 180 + 6 * Math.sin(t * 3 + i);
    if (x < -r * 2 || x > 1080 + r * 2 || y < -r * 2 || y > 1920 + r * 2) continue;
    items.push(
      <g key={i} transform={`translate(${x} ${y}) rotate(${rot})`}>
        <ellipse rx={r * 1.35} ry={r} fill="#F6F0D6" opacity={0.85} />
        <ellipse rx={r * 1.15} ry={r * 0.8} fill="#E9C77E" opacity={0.6} />
        <circle cx={-r * 0.7} cy={0} r={r * 0.22} fill="#B9772E" opacity={0.85} />
        <circle cx={r * 0.15} cy={0} r={r * 0.28} fill="#B9772E" opacity={0.7} />
        <path d={`M${-r * 0.3} ${-r * 0.4} Q${r * 0.5} ${-r * 0.1} ${r * 0.8} ${r * 0.35}`} fill="none" stroke="#8C5A20" strokeWidth={r * 0.06} opacity={0.5} />
      </g>,
    );
  }
  return (
    <div style={{position: 'absolute', inset: 0, opacity: a}}>
      <svg width={1080} height={1920}>
        <defs>
          <radialGradient id="sacbg" cx="50%" cy="45%" r="75%">
            <stop offset="0" stopColor="#C9E86A" />
            <stop offset="0.6" stopColor="#7DB03A" />
            <stop offset="1" stopColor="#2E5A1C" />
          </radialGradient>
        </defs>
        <rect width={1080} height={1920} fill="url(#sacbg)" />
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={-100} y={((i * 520 + t * 300 * 0) % 2400) - 300} width={1300} height={160 * sc} fill={i % 2 ? '#F3EFCF' : '#1F431B'} opacity={0.18} transform={`rotate(-8 540 960)`} />
        ))}
        <g style={{filter: `blur(${clamp(6 - z * 4, 0, 6).toFixed(1)}px)`}}>{items}</g>
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------- bird interior (bird body coordinates)
export const GUT_BIRD: P[] = [pt(-19, -16), pt(-18.5, -9), pt(-16, -3), pt(-10, 0), pt(-3, 2.5), pt(2, 4), pt(5, 1), pt(9, -1), pt(12, 2), pt(9, 6), pt(5, 8), pt(9, 10), pt(14, 9), pt(18, 7.5), pt(21.5, 7.8)];
export type BirdInside = {sacU: number; burst: number; flukes: number; eggs: number; t: number; closeUp: number};
const FLUKES = [pt(18.2, 6.6), pt(19.3, 8.6), pt(20.2, 6.9), pt(17.4, 8.4), pt(19.6, 7.7)];
export const birdInterior = (s: BirdInside) => () => {
  const gutP = resample(GUT_BIRD, 60);
  const R = gutP.map((p, i) => {
    const u = i / 60;
    return u < 0.22 ? 1.4 : u < 0.36 ? 1.7 : u < 0.5 ? 2.6 : u > 0.86 ? 1.9 + 1.4 * sm((u - 0.9) / 0.1) : 1.25;
  });
  const gut = tube(gutP, R, true, true);
  const sacP = along(GUT_BIRD, s.sacU);
  const sacT = nrm(sub(along(GUT_BIRD, Math.min(1, s.sacU + 0.01)), along(GUT_BIRD, Math.max(0, s.sacU - 0.01))));
  const sacA = (Math.atan2(sacT.y, sacT.x) * 180) / Math.PI;
  const id = uid('bi');
  const flukes = FLUKES.map((f, i) => {
    const grow = sm(clamp((s.flukes - i * 0.08) / 0.6));
    if (grow < 0.01) return null;
    const src = lerpP(pt(17.5, 7.4), f, sm(clamp(s.flukes * 1.6 - i * 0.1)));
    const L = lerp(0.35, 1.8, grow), Wd = lerp(0.18, 0.75, grow);
    const wob = 6 * Math.sin(s.t * 4 + i * 1.7);
    return (
      <g key={i} transform={`translate(${src.x} ${src.y}) rotate(${-20 + i * 37 + wob})`}>
        <ellipse rx={L / 2} ry={Wd / 2} fill="#EBC3A8" stroke="#9A5A40" strokeWidth={0.05} />
        <circle cx={-L * 0.36} cy={0} r={Wd * 0.18} fill="#C9826A" />
        <circle cx={-L * 0.05} cy={0} r={Wd * 0.26} fill="#C9826A" />
        <path d={`M${-L * 0.1} ${-Wd * 0.25} C${L * 0.1} ${Wd * 0.3} ${L * 0.2} ${-Wd * 0.3} ${L * 0.38} ${Wd * 0.1}`} fill="none" stroke="#8A5A1C" strokeWidth={Wd * 0.14} opacity={0.8 * grow} />
      </g>
    );
  });
  // eggs streaming from the flukes toward the vent
  const eggs: React.ReactNode[] = [];
  if (s.eggs > 0) {
    for (let i = 0; i < 70; i++) {
      const src = FLUKES[i % FLUKES.length];
      const ph = clamp((s.eggs * 1.6 - (i / 70) * 0.8));
      if (ph <= 0) continue;
      const end = pt(22.6 + hash(i) * 0.8, 7.2 + (hash(i * 3) - 0.5) * 1.2);
      const p = lerpP(src, end, sm(ph));
      const off = (hash(i * 7) - 0.5) * 0.7 * (1 - ph);
      eggs.push(<ellipse key={i} cx={p.x} cy={p.y + off} rx={0.11} ry={0.07} fill="#B07A2A" stroke="#5A3A10" strokeWidth={0.02} opacity={0.95} />);
    }
  }
  // larvae spilling out of the burst sac
  const larvae: React.ReactNode[] = [];
  if (s.burst > 0 && s.flukes < 0.4) {
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      const p = add(sacP, mul({x: Math.cos(a), y: Math.sin(a) * 0.6}, 1.2 * sm(s.burst)));
      larvae.push(<ellipse key={i} cx={p.x} cy={p.y} rx={0.3} ry={0.2} fill="#F6EFD2" stroke="#B9772E" strokeWidth={0.04} opacity={1 - sm(clamp(s.flukes * 3))} />);
    }
  }
  const villi: React.ReactNode[] = [];
  if (s.closeUp > 0.01) {
    for (let i = 46; i < 60; i++) {
      for (const side of [1, -1]) {
        for (let k = 0; k < 3; k++) {
          const u = i + k / 3;
          const j = Math.min(59, Math.floor(u));
          const p = lerpP(gut.C[j], gut.C[j + 1], u - j);
          const nn = gut.N[j];
          const r = R[j];
          const base = add(p, mul(nn, side * r * 0.95));
          const tip = add(p, mul(nn, side * r * (0.55 + 0.1 * Math.sin(s.t * 2 + u))));
          villi.push(<path key={`${i}${side}${k}`} d={`M${base.x} ${base.y} L${tip.x} ${tip.y}`} stroke="#D27C84" strokeWidth={0.22} strokeLinecap="round" opacity={0.8 * s.closeUp} />);
        }
      }
    }
  }
  return (
    <g>
      <defs>
        <clipPath id={`${id}c`}>
          <path d={closed(gut.outline, 0.9)} />
        </clipPath>
      </defs>
      <rect x={-30} y={-20} width={62} height={40} fill="#E2C8B2" opacity={0.4} />
      {/* liver, heart, lungs: faint, for context */}
      <ellipse cx={-12} cy={-3} rx={6} ry={4.5} fill="#8E3A32" opacity={0.35} />
      <ellipse cx={-16} cy={-6} rx={3.2} ry={2.6} fill="#B5323A" opacity={0.35} />
      <ellipse cx={-4} cy={-8} rx={9} ry={3} fill="#E59AA0" opacity={0.3} />
      <path d={closed(gut.outline, 0.9)} fill="#EFA8A8" fillOpacity={0.9} stroke="#A84E58" strokeWidth={0.25} />
      <ellipse cx={0} cy={3.4} rx={4.2} ry={3.2} fill="#9A4A42" opacity={0.85} />
      <g clipPath={`url(#${id}c)`}>
        <path d={open(gutP)} fill="none" stroke="#F8D0CC" strokeWidth={0.6} strokeOpacity={0.6} />
        {villi}
      </g>
      {/* the sac on its way down, then burst */}
      {s.sacU > 0 && s.burst < 1 && (
        <g transform={`translate(${sacP.x} ${sacP.y}) rotate(${sacA})`} opacity={1 - sm(clamp(s.burst * 2))}>
          <ellipse rx={3.2} ry={1.15} fill="#9BC93E" />
          {[-2, -1, 0, 1, 2].map((k) => <rect key={k} x={k * 1.1 - 0.25} y={-1.1} width={0.5} height={2.2} fill={k % 2 ? '#F3EFCF' : '#1F431B'} opacity={0.85} />)}
          <circle r={2.2} fill="#FFF3A0" opacity={0.25} />
        </g>
      )}
      {larvae}
      {flukes}
      {eggs}
    </g>
  );
};
void perp; void lerp;
