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
// the sporocyst: a trunk from the visceral mass (under the shell) forward through the body into both eyestalk bases
const SPORO_MAIN: P[] = [pt(-14.5, -1.6), pt(-11.6, -1.7), pt(-9.0, -2.0), pt(-6.8, -2.2), pt(-4.8, -2.4), pt(-3.2, -3.0), pt(-2.0, -3.8), pt(-1.05, -4.5)];
const SPORO_FAR: P[] = [pt(-3.2, -3.0), pt(-2.7, -3.8), pt(-2.2, -4.55)];
const SPORO_SIDE: P[][] = [
  [pt(-11.6, -1.7), pt(-11.0, -0.8), pt(-12.6, -0.5)],
  [pt(-9.0, -2.0), pt(-8.6, -1.0), pt(-9.6, -0.5)],
  [pt(-6.8, -2.2), pt(-6.2, -1.2), pt(-7.0, -0.6)],
  [pt(-4.8, -2.4), pt(-4.4, -1.4), pt(-3.2, -0.9)],
  [pt(-14.5, -1.6), pt(-16.4, -1.0), pt(-17.6, -0.5)],
  [pt(-9.0, -2.0), pt(-10.0, -2.7), pt(-11.6, -2.7)],
];
export type SnailInside = {grow: number; flow: number; t: number};
const MUSC = Array.from({length: 26}, (_, i) => ({y: -0.6 - (i % 7) * 0.55, x0: -19 + hash(i * 3.1) * 8, len: 6 + hash(i * 1.7) * 9}));
export const snailInterior = (s: SnailInside) => (bend: (p: P) => P) => {
  const B = (ps: P[]) => ps.map(bend);
  const gut = tube(B(resample(GUT_SNAIL, 30)), Array.from({length: 31}, (_, i) => 0.42 + 0.12 * Math.sin(i * 0.7)), true, true);
  const g = s.grow;
  const tubeEl = (ps: P[], u: number, r: number, key: string) => {
    if (u <= 0.01) return null;
    const pp = B(partial(ps, u, 22));
    const R = pp.map((_, i) => r * (0.82 + 0.18 * Math.sin(i * 0.9 - s.t * 6)) * (i === pp.length - 1 ? 0.75 : 1));
    const tb = tube(pp, R, true, true);
    // germ balls riding the tube toward the head
    const balls: React.ReactNode[] = [];
    const L = plen(pp);
    for (let k = 0; k < Math.floor(L / 0.7); k++) {
      const q = ((k * 0.7 + s.t * 1.6 * s.flow) % L) / L;
      if (q > u) continue;
      const c = along(pp, q);
      balls.push(<circle key={k} cx={c.x} cy={c.y} r={r * 0.42} fill="#F2FFB8" opacity={0.85} />);
    }
    return (
      <g key={key}>
        <path d={closed(tb.outline, 0.9)} fill="#A6F046" opacity={0.25} transform="" />
        <path d={closed(tb.outline, 0.9)} fill="#6FC52E" stroke="#163E0C" strokeWidth={0.08} />
        <path d={open(pp.map((p, i) => add(p, mul(tb.N[i], 0.4 * R[i]))))} fill="none" stroke="#D8FF8A" strokeWidth={r * 0.28} strokeOpacity={0.75} strokeLinecap="round" />
        {balls}
      </g>
    );
  };
  return (
    <g>
      {/* dark wet tissue, muscle fibres running along the foot */}
      <rect x={-22} y={-9} width={28} height={10} fill="#3A1A16" />
      <rect x={-22} y={-9} width={28} height={10} fill="#6A2E26" opacity={0.55} />
      {MUSC.map((m, i) => {
        const p0 = bend(pt(m.x0, m.y)), p1 = bend(pt(m.x0 + m.len, m.y - 0.2));
        return <path key={i} d={`M${p0.x} ${p0.y} L${p1.x} ${p1.y}`} stroke="#9A4A3C" strokeWidth={0.14} strokeOpacity={0.55} />;
      })}
      {/* digestive gland (dark brown lobes) and gut */}
      {[0, 1, 2, 3, 4].map((i) => {
        const c = bend(pt(-17.5 + i * 1.7, -2.6 - (i % 2) * 0.9));
        return <ellipse key={i} cx={c.x} cy={c.y} rx={1.5} ry={1.0} fill="#4A2810" stroke="#1E0E06" strokeWidth={0.06} />;
      })}
      <path d={closed(gut.outline, 0.9)} fill="#D9877A" stroke="#7A3328" strokeWidth={0.07} />
      <path d={open(gut.C)} fill="none" stroke="#F5B7A8" strokeWidth={0.12} strokeOpacity={0.7} />
      <ellipse cx={bend(pt(1.0, -1.55)).x} cy={bend(pt(1.0, -1.55)).y} rx={0.75} ry={0.6} fill="#B9685A" stroke="#7A3328" strokeWidth={0.06} />
      {/* the sporocyst network */}
      {SPORO_SIDE.map((ps, i) => tubeEl(ps, clamp((g - 0.12 - i * 0.09) / 0.45), 0.33, `s${i}`))}
      {tubeEl(SPORO_MAIN, clamp(0.25 + g * 0.75 * 1.4), 0.5, 'm')}
      {tubeEl(SPORO_FAR, clamp((g - 0.35) / 0.35), 0.4, 'f')}
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
const FLUKES = [pt(17.6, 6.7), pt(19.0, 8.7), pt(20.3, 6.8), pt(16.6, 8.5), pt(19.6, 7.7)];
const FANG = [-25, 20, -8, 35, 5];
export const birdInterior = (s: BirdInside) => () => {
  const gutP = resample(GUT_BIRD, 60);
  const R = gutP.map((_, i) => {
    const u = i / 60;
    return u < 0.22 ? 1.4 : u < 0.36 ? 1.8 : u < 0.5 ? 2.6 : u > 0.86 ? 2.0 + 1.5 * sm((u - 0.9) / 0.1) : 1.3;
  });
  const gut = tube(gutP, R, true, true);
  const sacP = along(GUT_BIRD, s.sacU);
  const sacT = nrm(sub(along(GUT_BIRD, Math.min(1, s.sacU + 0.01)), along(GUT_BIRD, Math.max(0, s.sacU - 0.01))));
  const sacA = (Math.atan2(sacT.y, sacT.x) * 180) / Math.PI;
  // the gut squeezes round the sac as it passes (peristalsis)
  const squeeze = (i: number) => 1 + 0.35 * Math.exp(-Math.pow((i / 60 - s.sacU) / 0.03, 2)) * (s.sacU > 0 && s.burst < 0.5 ? 1 : 0);
  const gutS = tube(gutP, R.map((r, i) => r * squeeze(i)), true, true);
  const id = uid('bi');
  const flukes = FLUKES.map((f, i) => {
    const grow = sm(clamp((s.flukes - i * 0.07) / 0.55));
    if (grow < 0.01) return null;
    const src = lerpP(pt(17.8, 7.4), f, sm(clamp(s.flukes * 1.5 - i * 0.1)));
    const L = lerp(0.4, 2.1, grow), Wd = lerp(0.2, 0.85, grow);
    const wob = 7 * Math.sin(s.t * 3.4 + i * 1.7);
    const ut = Array.from({length: 9}, (_, k) => pt(-L * 0.25 + (k / 8) * L * 0.6, Wd * 0.22 * Math.sin(k * 1.9 + i)));
    const full = sm(clamp((s.flukes - 0.55) / 0.3)) * (1 - 0.6 * sm(s.eggs));
    return (
      <g key={i} transform={`translate(${src.x} ${src.y}) rotate(${FANG[i] + wob})`}>
        <ellipse rx={L / 2} ry={Wd / 2} fill="#F0CDB4" stroke="#7E3E2A" strokeWidth={0.07} />
        <ellipse rx={L / 2.4} ry={Wd / 3} fill="#E5AE90" opacity={0.6} />
        <circle cx={-L * 0.38} cy={0} r={Wd * 0.17} fill="#B66650" stroke="#7E3E2A" strokeWidth={0.04} />
        <circle cx={-L * 0.08} cy={0} r={Wd * 0.24} fill="#B66650" stroke="#7E3E2A" strokeWidth={0.04} />
        {full > 0.01 && <path d={open(ut)} fill="none" stroke="#6E3E12" strokeWidth={Wd * 0.22} strokeLinecap="round" opacity={full} />}
        {full > 0.01 && ut.map((q, k) => <circle key={k} cx={q.x} cy={q.y} r={Wd * 0.075} fill="#D89A40" opacity={full} />)}
      </g>
    );
  });
  const eggs: React.ReactNode[] = [];
  if (s.eggs > 0) {
    for (let i = 0; i < 90; i++) {
      const src = FLUKES[i % FLUKES.length];
      const ph = clamp(s.eggs * 1.7 - (i / 90) * 0.85);
      if (ph <= 0) continue;
      const end = pt(22.4 + hash(i) * 1.6, 7.0 + (hash(i * 3) - 0.5) * 1.6);
      const p = lerpP(src, end, sm(ph));
      const off = (hash(i * 7) - 0.5) * 0.8 * Math.sin(Math.PI * ph);
      eggs.push(<ellipse key={i} cx={p.x} cy={p.y + off} rx={0.13} ry={0.085} fill="#C88A34" stroke="#4A2A08" strokeWidth={0.025} />);
    }
  }
  const larvae: React.ReactNode[] = [];
  if (s.burst > 0 && s.flukes < 0.45) {
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const p = add(sacP, mul({x: Math.cos(a), y: Math.sin(a) * 0.55}, 1.5 * sm(s.burst)));
      larvae.push(<ellipse key={i} cx={p.x} cy={p.y} rx={0.32} ry={0.2} fill="#F6EFD2" stroke="#8A5A1E" strokeWidth={0.04} opacity={1 - sm(clamp(s.flukes * 2.5))} />);
    }
  }
  // folds of the gut lining (always on: they give the tube its organic texture)
  const folds: React.ReactNode[] = [];
  for (let i = 1; i < 60; i++) {
    for (const side of [1, -1]) {
      const p = gutS.C[i], nn = gutS.N[i], r = gutS.rad[i];
      const base = add(p, mul(nn, side * r * 0.92));
      const tip = add(p, mul(nn, side * r * (0.55 + 0.08 * Math.sin(s.t * 2.2 + i))));
      folds.push(<path key={`${i}${side}`} d={`M${base.x} ${base.y} L${tip.x} ${tip.y}`} stroke="#B9425A" strokeWidth={0.26} strokeLinecap="round" opacity={0.75} />);
    }
  }
  return (
    <g>
      <defs>
        <clipPath id={`${id}c`}>
          <path d={closed(gutS.outline, 0.9)} />
        </clipPath>
      </defs>
      <rect x={-30} y={-20} width={62} height={40} fill="#3A1414" opacity={0.85} />
      {/* liver, heart, lungs */}
      <ellipse cx={-12} cy={-3} rx={6} ry={4.5} fill="#6E1E1E" opacity={0.8} />
      <ellipse cx={-16} cy={-6} rx={3.2} ry={2.6} fill="#A82230" opacity={0.75} />
      <ellipse cx={-4} cy={-8} rx={9} ry={3} fill="#C76A74" opacity={0.45} />
      <path d={closed(gutS.outline, 0.9)} fill="#E77E86" stroke="#6E1A28" strokeWidth={0.3} />
      <g clipPath={`url(#${id}c)`}>
        <path d={open(gutP)} fill="none" stroke="#FFC2B8" strokeWidth={0.7} strokeOpacity={0.45} />
        {folds}
      </g>
      <ellipse cx={0} cy={3.4} rx={4.2} ry={3.2} fill="#7A2A22" stroke="#3A0E0A" strokeWidth={0.25} />
      <path d="M-3 3.4 C-1 2.4 1 2.4 3 3.4" fill="none" stroke="#D9B4A0" strokeWidth={0.35} opacity={0.6} />
      {s.sacU > 0 && s.burst < 1 && (
        <g transform={`translate(${sacP.x} ${sacP.y}) rotate(${sacA})`} opacity={1 - sm(clamp(s.burst * 2))}>
          <circle r={2.4} fill="#E8FF7A" opacity={0.18} />
          <ellipse rx={3.2} ry={1.15} fill="#8FCB34" stroke="#1F431B" strokeWidth={0.12} />
          {[-2, -1, 0, 1, 2].map((k) => <rect key={k} x={k * 1.1 - 0.25} y={-1.05} width={0.5} height={2.1} fill={k % 2 ? '#F3EFCF' : '#1A3A14'} />)}
        </g>
      )}
      {larvae}
      {flukes}
      {eggs}
    </g>
  );
};
