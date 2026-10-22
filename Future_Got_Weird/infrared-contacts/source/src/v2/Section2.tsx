// V2 eye section (L2, same geometry and placement as V1's: eyeball radius 100, front of the eye = +x, seen through a
// circular cutaway window in the face). Changes from V1:
//  - anatomical eyelids that open and close about their fornices (no sliding layers);
//  - the soft lens slides on from the right and settles;
//  - the lens material reads as a physical medium: tear-film sheen on both surfaces, a polymer network, slow
//    refractive caustic bands, a deeper out-of-focus particle layer and a few near out-of-focus particles;
//  - nanoparticles are drawn as small hexagonal core-shell crystals (faceted, translucent), with a detailed hero
//    crystal that stores two infrared packets (edges and lattice light up, energy rings) and releases one green
//    emission; a ripple of conversions then spreads across neighbouring crystals.
// Strokes are non-scaling (screen px) so the drawing holds from the whole eye down to one crystal.
import React from 'react';
import {SECC as S, LEADC, LIGHT, C} from '../theme';
import {Pt, P, smooth, pathD, rnd, clamp, lerp} from '../lib';
import {EYE2, HERO, PARTICLES, PARTICLE_R, polar} from '../art/Section';

const ns = {vectorEffect: 'non-scaling-stroke' as const};
const arcPts = (c: Pt, r: number, a0: number, a1: number, n = 48) => Array.from({length: n + 1}, (_, i) => polar(c, r, lerp(a0, a1, i / n)));

// ---------- lids (anatomical: margin angle opens/closes; the lid rests on the eye surface) ----------
const lidInner = (upper: boolean, margin: number) => {
  const pts: Pt[] = [];
  const rr = EYE2.lensRo + EYE2.lidGap;
  if (upper) {
    for (let a = -78; a <= -34; a += 3) pts.push(polar(P(0, 0), 104, a));
    for (let a = -58; a < margin; a += 3) pts.push(polar(EYE2.lensC, rr, a));
    pts.push(polar(EYE2.lensC, rr, margin));
  } else {
    for (let a = 70; a >= 34; a -= 3) pts.push(polar(P(0, 0), 104, a));
    for (let a = 58; a > margin; a -= 3) pts.push(polar(EYE2.lensC, rr, a));
    pts.push(polar(EYE2.lensC, rr, margin));
  }
  return pts;
};
const offsetOut = (pts: Pt[], thick: (u: number) => number, upper: boolean) => {
  const n = pts.length;
  return pts.map((p, i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    let tx = b.x - a.x, ty = b.y - a.y;
    const l = Math.hypot(tx, ty) || 1;
    tx /= l; ty /= l;
    const nx = upper ? ty : -ty, ny = upper ? -tx : tx;
    const k = thick(i / (n - 1));
    return P(p.x + nx * k, p.y + ny * k);
  });
};
export const lidGeom = (upper: boolean, open: number) => {
  const margin = upper ? lerp(6, -44, open) : lerp(10, 47, open);
  const inner = lidInner(upper, margin);
  // an opening lid folds and bunches near its root, so it thickens
  const outer = offsetOut(inner, (u) => lerp(upper ? 18 : 14, upper ? 12 : 10, u) * (1 + 0.45 * open * (1 - u * 0.5)), upper);
  const mi = inner[inner.length - 1], mo = outer[outer.length - 1];
  const tipDir = upper ? 1 : -1;
  const cap = [P(lerp(mi.x, mo.x, 0.5) + 4.2, lerp(mi.y, mo.y, 0.5) + tipDir * 1.2)];
  return {inner, outer, shape: smooth([...inner, ...cap, ...outer.slice().reverse()], true, 0.14), margin: P((mi.x + mo.x) / 2 + 3, (mi.y + mo.y) / 2), root: outer[0], mDeg: margin};
};
const L_UP0 = lidGeom(true, 0), L_LO0 = lidGeom(false, 0);
export const LID_FRONT_X2 = (y: number) => {
  let best = L_UP0.outer[0];
  for (const q of [...L_UP0.outer, ...L_LO0.outer]) if (Math.abs(q.y - y) < Math.abs(best.y - y) && q.x > 60) best = q;
  return best.x;
};

// ---------- tissue (as V1, with the lid roots fixed) ----------
const TISSUE = (() => {
  const up = L_UP0.root, lo = L_LO0.root;
  const brow = [P(196, -250), P(176, -186), P(150, -150), P(108, -134), P(60, -128), up];
  const back: Pt[] = [];
  for (let a = -78; a >= -282; a -= 4) back.push(polar(P(0, 0), 104, a));
  const cheek = [lo, P(76, 126), P(126, 146), P(166, 196), P(196, 270)];
  return pathD([...brow, ...back, ...cheek, P(196, 420), P(-420, 420), P(-420, -420), P(196, -420)], true);
})();
const SKIN_EDGE = smooth([P(196, -250), P(176, -186), P(150, -150), P(108, -134), P(60, -128), L_UP0.root], false);
const CHEEK_EDGE = smooth([L_LO0.root, P(76, 126), P(126, 146), P(166, 196), P(196, 270)], false);
const CORNEA = (() => {
  const a = EYE2.limbusDeg;
  return pathD([...arcPts(EYE2.corneaC, EYE2.corneaR, -a, a, 40), ...arcPts(P(0, 0), EYE2.R, 26.1, -26.1, 12)], true);
})();
const CONTACT = (() => {
  const a = EYE2.lensDeg;
  const outer = arcPts(EYE2.lensC, EYE2.lensRo, -a + 2, a - 2, 80);
  const inner = arcPts(EYE2.lensC, EYE2.lensRi, a - 1.2, -a + 1.2, 80);
  const e1 = polar(EYE2.lensC, (EYE2.lensRi + EYE2.lensRo) / 2, a + 0.4), e0 = polar(EYE2.lensC, (EYE2.lensRi + EYE2.lensRo) / 2, -a - 0.4);
  return smooth([e0, ...outer, e1, ...inner], true, 0.12);
})();
export const HERO_DEG2 = -6;
const lensPt = (deg: number, f: number) => polar(EYE2.lensC, lerp(EYE2.lensRi, EYE2.lensRo, f), deg);
// polymer network: short wavy strands through the thickness, densest near the hero region
const STRANDS = Array.from({length: 90}, (_, k) => {
  const deg0 = lerp(-22, 9, rnd(k * 11.3));
  const pts: Pt[] = [];
  for (let j = 0; j < 7; j++) {
    const f = clamp(lerp(0.05, 0.95, rnd(k * 3.7 + 1)) + (rnd(k * 9 + j) - 0.5) * 0.4, 0.03, 0.97);
    pts.push(lensPt(deg0 + j * 0.5 + (rnd(k + j * 2.2) - 0.5) * 0.4, f));
  }
  return smooth(pts);
});
// a deeper (out-of-plane) layer of particles: smaller, softer, offset
const DEEP = Array.from({length: 520}, (_, i) => ({p: lensPt(lerp(-30, 20, rnd(i * 2.31 + 7)), lerp(0.08, 0.92, rnd(i * 5.17 + 3))), r: PARTICLE_R * lerp(0.45, 0.7, rnd(i * 1.7)), i}));
// a few near out-of-focus crystals (bokeh) around the hero
const NEAR = Array.from({length: 9}, (_, i) => ({p: lensPt(HERO_DEG2 + lerp(-1.6, 1.6, rnd(i * 4.4 + 1)), lerp(0.1, 0.9, rnd(i * 7.7 + 2))), r: PARTICLE_R * lerp(1.8, 2.6, rnd(i * 3.3)), i}));

// hexagon path (radius r, rotation rot)
const hexD = (cx: number, cy: number, r: number, rotDeg: number) => {
  const pts = Array.from({length: 6}, (_, k) => polar(P(cx, cy), r, rotDeg + k * 60));
  return pathD(pts, true);
};
// conversion ripple: each crystal near the hero flashes once, later with distance
export const rippleAmt = (t: number, t0: number, p: Pt, i: number) => {
  const d = Math.hypot(p.x - HERO.x, p.y - HERO.y);
  if (d > 3.2) return 0;
  const at = t0 + d * 0.32 + rnd(i * 9.1) * 0.22;
  const x = (t - at) / 0.42;
  return x <= 0 || x >= 1 ? 0 : Math.sin(Math.PI * x) ** 1.4;
};

export type Section2State = {
  t: number;
  zl: number;
  view: {x0: number; y0: number; x1: number; y1: number};
  reveal: number;
  lidOpen: number; // 0 closed .. 1 open (anatomical)
  lensIn: number; // 0 off to the right .. 1 seated on the cornea
  retina: {amt: number; spread: number; col: string};
  hero: {charge: number; emit: number; mark: number};
  rippleT0: number; // start time of the conversion ripple across neighbours (Infinity = none)
  lensFocus: number;
};

export const Section2View: React.FC<{s: Section2State; id: string}> = ({s, id}) => {
  const wr = EYE2.window.r * s.reveal;
  if (wr < 0.5) return null;
  const lensOff = P(150 * (1 - s.lensIn), 0);
  const vis = (p: Pt, m: number) => p.x + lensOff.x > s.view.x0 - m && p.x + lensOff.x < s.view.x1 + m && p.y > s.view.y0 - m && p.y < s.view.y1 + m;
  const pAlpha = clamp((s.zl - 22) / 30);
  const hexMode = s.zl > 140;
  const matA = clamp((s.zl - 70) / 150);
  const up = lidGeom(true, s.lidOpen), lo = lidGeom(false, s.lidOpen);
  // lens settle: a small squash as it seats
  const settle = s.lensIn < 1 ? 0 : 0;
  return (
    <g>
      <defs>
        <clipPath id={`${id}-win`}>
          <circle cx={EYE2.window.c.x} cy={EYE2.window.c.y} r={wr} />
        </clipPath>
        <clipPath id={`${id}-lens`}>
          <path d={CONTACT} />
        </clipPath>
        <radialGradient id={`${id}-air`} cx="0.75" cy="0.45" r="0.7">
          <stop offset="0" stopColor={S.air} />
          <stop offset="1" stopColor={S.airDeep} />
        </radialGradient>
        <radialGradient id={`${id}-vit`} cx="0.6" cy="0.5" r="0.6">
          <stop offset="0" stopColor={S.vitreous} />
          <stop offset="1" stopColor={S.vitreousDeep} />
        </radialGradient>
        <radialGradient id={`${id}-ret`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={s.retina.col} stopOpacity={1} />
          <stop offset="1" stopColor={s.retina.col} stopOpacity={0} />
        </radialGradient>
        <linearGradient id={`${id}-hx`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#EDE6FF" />
          <stop offset="0.5" stopColor="#B5A3EC" />
          <stop offset="1" stopColor="#7561C2" />
        </linearGradient>
        <radialGradient id={`${id}-gg`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={LIGHT.greenGlow} stopOpacity={0.95} />
          <stop offset="0.45" stopColor={LIGHT.green} stopOpacity={0.55} />
          <stop offset="1" stopColor={LIGHT.green} stopOpacity={0} />
        </radialGradient>
        <linearGradient id={`${id}-mat`} x1="1" y1="0" x2="0" y2="0">
          <stop offset="0" stopColor="#DDF7F9" />
          <stop offset="0.5" stopColor="#C9EEF2" />
          <stop offset="1" stopColor="#D8F4F6" />
        </linearGradient>
      </defs>
      <g clipPath={`url(#${id}-win)`}>
        <circle cx={EYE2.window.c.x} cy={EYE2.window.c.y} r={EYE2.window.r + 2} fill={`url(#${id}-air)`} />
        <path d={TISSUE} fill={S.fat} />
        <path d={SKIN_EDGE} fill="none" stroke={LEADC.skin} strokeWidth={9} strokeLinecap="round" />
        <path d={CHEEK_EDGE} fill="none" stroke={LEADC.skin} strokeWidth={9} strokeLinecap="round" />
        <path d={SKIN_EDGE} fill="none" stroke={C.ink} strokeWidth={2.2} {...ns} />
        <path d={CHEEK_EDGE} fill="none" stroke={C.ink} strokeWidth={2.2} {...ns} />
        <path d="M-20 -100 C-80 -122 -170 -112 -240 -86 L-240 -62 C-170 -84 -90 -96 -32 -92 Z" fill={S.tissueDeep} opacity={0.9} />
        <path d="M-20 100 C-80 122 -170 112 -240 86 L-240 62 C-170 84 -90 96 -32 92 Z" fill={S.tissueDeep} opacity={0.9} />
        <path d="M-96 -16 C-150 -20 -220 -26 -300 -30 L-300 18 C-220 14 -150 16 -96 18 Z" fill={S.nerve} stroke={S.fatDeep} strokeWidth={1.5} {...ns} />
        <circle cx={0} cy={0} r={100} fill={S.sclera} stroke={C.ink} strokeWidth={2.4} {...ns} />
        <circle cx={0} cy={0} r={94.5} fill={S.choroid} />
        <circle cx={0} cy={0} r={92} fill={S.retina} />
        {/* photoreceptor texture along the retina (a fine comb), visible near the back of the eye */}
        {s.zl > 3 && <path d={Array.from({length: 120}, (_, k) => { const a = 128 + (k / 119) * 104; const p0 = polar(P(0, 0), 92, a), p1 = polar(P(0, 0), 89.4, a); return `M${p0.x} ${p0.y}L${p1.x} ${p1.y}`; }).join('')} stroke={S.retinaDeep} strokeWidth={1} opacity={0.5} {...ns} />}
        <circle cx={0} cy={0} r={88.5} fill={`url(#${id}-vit)`} />
        <path d={pathD([...arcPts(P(0, 0), 95, -42, 42, 16), P(70, 50), P(70, -50)])} fill={S.vitreous} />
        <path d={pathD([P(70, -52), P(86, -50), P(92, -36), P(92, 36), P(86, 50), P(70, 52)])} fill="#EAF6F6" />
        {s.retina.amt > 0.001 && (() => {
          const c = polar(P(0, 0), 90, 180);
          return <ellipse cx={c.x} cy={c.y} rx={10 + s.retina.spread * 0.9} ry={14 + s.retina.spread * 1.6} fill={`url(#${id}-ret)`} opacity={s.retina.amt} />;
        })()}
        <ellipse cx={74} cy={0} rx={12} ry={30} fill={S.lensEye} stroke={S.lensEyeRim} strokeWidth={1.6} {...ns} />
        <path d="M70 -46 C76 -40 82 -38 86 -42 L84 -54 Z M70 46 C76 40 82 38 86 42 L84 54 Z" fill={S.tissueDeep} />
        <path d="M86 -47 C90 -40 91 -26 89 -17 L85.6 -17 C87 -27 86 -40 82.5 -46 Z" fill={S.iris} stroke={S.irisDeep} strokeWidth={1.2} {...ns} />
        <path d="M86 47 C90 40 91 26 89 17 L85.6 17 C87 27 86 40 82.5 46 Z" fill={S.iris} stroke={S.irisDeep} strokeWidth={1.2} {...ns} />
        <path d={pathD([...arcPts(EYE2.lensC, EYE2.lensRi + 0.2, -EYE2.lensDeg, EYE2.lensDeg, 60), ...arcPts(P(0, 0), 101, 34, -34, 10)])} fill="#E2F6F7" opacity={s.lensIn} />
        <path d={CORNEA} fill={S.cornea} stroke={C.ink} strokeWidth={2} {...ns} />
        {/* ---- the soft contact lens ---- */}
        {s.lensIn > 0.001 && (
          <g transform={`translate(${lensOff.x + settle} ${lensOff.y})`}>
            <path d={CONTACT} fill={`url(#${id}-mat)`} fillOpacity={0.94} />
            <g clipPath={`url(#${id}-lens)`}>
              {/* refractive caustic bands drifting slowly through the material */}
              {matA > 0.01 && [0, 1, 2, 3, 4].map((k) => {
                const f = 0.18 + 0.16 * k + 0.05 * Math.sin(s.t * 0.9 + k * 1.7);
                const d0 = -24 + k * 6 + 2 * Math.sin(s.t * 0.6 + k);
                return <path key={k} d={smooth(arcPts(EYE2.lensC, lerp(EYE2.lensRi, EYE2.lensRo, f), d0, d0 + 9 + k * 2, 24))} fill="none" stroke="#FFFFFF" strokeWidth={16 + 8 * (k % 2)} strokeOpacity={0.13 * matA} strokeLinecap="round" {...ns} />;
              })}
              {matA > 0.01 && <g opacity={0.5 * matA}>{STRANDS.map((d, k) => <path key={k} d={d} fill="none" stroke="#7CC9D3" strokeWidth={1.5} {...ns} />)}</g>}
              {/* deeper, softer crystals (out of the focal plane) */}
              {s.zl > 90 && <g opacity={0.35 * matA}>{DEEP.filter((q) => vis(q.p, 0.5)).map((q) => <path key={q.i} d={hexD(q.p.x, q.p.y, q.r, rnd(q.i) * 60)} fill="#9C8BD8" />)}</g>}
            </g>
            <path d={CONTACT} fill="none" stroke={S.contactRim} strokeWidth={1.8 + 1.8 * s.lensFocus} {...ns} />
            {/* tear-film sheen on the front surface */}
            <path d={smooth(arcPts(EYE2.lensC, EYE2.lensRo - 0.05, -EYE2.lensDeg + 6, EYE2.lensDeg - 6, 60))} fill="none" stroke="#FFFFFF" strokeWidth={2.4} strokeOpacity={0.75} {...ns} />
            {s.lensFocus > 0.01 && <path d={CONTACT} fill="none" stroke="#FFFFFF" strokeWidth={10} strokeOpacity={0.35 * s.lensFocus} {...ns} />}
            {pAlpha > 0.01 && (
              <g opacity={pAlpha}>
                {PARTICLES.filter((q) => vis(q.p, 0.6)).map((q) => {
                  const g = rippleAmt(s.t, s.rippleT0, q.p, q.i);
                  const rot = rnd(q.i * 2.9) * 60;
                  return (
                    <g key={q.i}>
                      {g > 0.01 && <circle cx={q.p.x} cy={q.p.y} r={q.r * (1.5 + 1.3 * g)} fill={`url(#${id}-gg)`} opacity={g} />}
                      {hexMode ? (
                        <g>
                          <path d={hexD(q.p.x, q.p.y, q.r, rot)} fill={`url(#${id}-hx)`} stroke={g > 0.2 ? LIGHT.greenDeep : '#5E4BAA'} strokeWidth={s.zl > 500 ? 1.6 : 1} {...ns} />
                          <path d={hexD(q.p.x - q.r * 0.08, q.p.y - q.r * 0.1, q.r * 0.55, rot)} fill={g > 0.2 ? LIGHT.greenGlow : '#F4F0FF'} opacity={0.55 + 0.4 * g} />
                        </g>
                      ) : (
                        <circle cx={q.p.x} cy={q.p.y} r={q.r} fill={g > 0.2 ? LIGHT.green : '#A896E2'} />
                      )}
                    </g>
                  );
                })}
                {vis(HERO, 2) && <HeroCrystal s={s} id={id} />}
              </g>
            )}
            {/* near, out-of-focus crystals drift past the lens of the camera */}
            {s.zl > 260 && <g opacity={0.13 * clamp((s.zl - 260) / 300)}>{NEAR.filter((q) => vis(q.p, 1)).map((q) => <path key={q.i} d={hexD(q.p.x + 0.12 * Math.sin(s.t + q.i), q.p.y, q.r, rnd(q.i) * 60)} fill="#E4DCFF" />)}</g>}
          </g>
        )}
        {/* eyelids */}
        {[up, lo].map((L, k) => (
          <g key={k}>
            <path d={L.shape} fill={S.lidMuscle} stroke={C.ink} strokeWidth={2.2} {...ns} />
            <path d={smooth(L.outer)} fill="none" stroke={S.lidSkin} strokeWidth={4.5} />
            <path d={smooth(L.inner)} fill="none" stroke={S.lidInner} strokeWidth={3} />
            <path d={smooth(L.outer)} fill="none" stroke={C.ink} strokeWidth={1.6} {...ns} />
            {[0, 1, 2].map((j) => {
              const m = L.margin, isUp = k === 0;
              const a = (isUp ? -10 - j * 9 : 12 + j * 9) + (isUp ? -1 : 1) * 30 * s.lidOpen;
              const tip = polar(m, 9 + j * 1.5, a);
              return <path key={j} d={`M${m.x - 1} ${m.y + (isUp ? -1 : 1) * (j - 1) * 1.6}Q${(m.x + tip.x) / 2 + 1} ${(m.y + tip.y) / 2 + (isUp ? 2 : -2)} ${tip.x} ${tip.y}`} fill="none" stroke={S.lash} strokeWidth={2.2} strokeLinecap="round" {...ns} />;
            })}
          </g>
        ))}
      </g>
      <circle cx={EYE2.window.c.x} cy={EYE2.window.c.y} r={wr} fill="none" stroke={S.rim} strokeWidth={7} {...ns} />
      <circle cx={EYE2.window.c.x} cy={EYE2.window.c.y} r={wr} fill="none" stroke={C.ink} strokeWidth={2} opacity={0.6} {...ns} />
    </g>
  );
};

// The hero crystal: hexagonal core-shell nanocrystal. Internal units: circumradius 100.
const HeroCrystal: React.FC<{s: Section2State; id: string}> = ({s, id}) => {
  const k = PARTICLE_R / 100;
  const det = clamp((s.zl - 220) / 400);
  const ch = s.hero.charge, em = s.hero.emit;
  const c1 = clamp(ch), c2 = clamp(ch - 1);
  const lattice: Pt[] = [];
  for (let r = -7; r <= 7; r++) for (let c = -7; c <= 7; c++) {
    const x = c * 13 + (r % 2 ? 6.5 : 0), y = r * 11.3;
    const ax = Math.abs(x), ay = Math.abs(y);
    if (ay < 74 && ax * 0.866 + ay * 0.5 < 74) lattice.push(P(x, y));
  }
  // which lattice sites are lit: fills from the incoming (right) side as energy is stored
  const stored = clamp(ch / 2) * (1 - em);
  const greenness = Math.sin(Math.PI * clamp(em * 1.1));
  const hx = (r: number) => pathD(Array.from({length: 6}, (_, j) => polar(P(0, 0), r, 30 + j * 60)), true);
  return (
    <g transform={`translate(${HERO.x} ${HERO.y}) scale(${k})`}>
      <defs>
        <radialGradient id={`${id}-amb`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={LIGHT.ir} stopOpacity={0.9} />
          <stop offset="1" stopColor={LIGHT.ir} stopOpacity={0} />
        </radialGradient>
        <clipPath id={`${id}-hc`}>
          <path d={hx(92)} />
        </clipPath>
        <linearGradient id={`${id}-shell`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F3EEFF" />
          <stop offset="0.55" stopColor="#B8A6EE" />
          <stop offset="1" stopColor="#6A56B8" />
        </linearGradient>
      </defs>
      {/* contained excitation glow (amber), then the green release */}
      {ch > 0.01 && <circle cx={0} cy={0} r={150 + 45 * c2 + 8 * Math.sin(s.t * 18)} fill={`url(#${id}-amb)`} opacity={0.42 * Math.min(1, ch) * (1 - em)} />}
      {em > 0.001 && <circle cx={0} cy={0} r={140 + 330 * em} fill={`url(#${id}-gg)`} opacity={greenness} />}
      {em > 0.001 && [0, 1, 2].map((j) => {
        const u = clamp(em * 1.3 - j * 0.18);
        return u > 0 && u < 1 ? <circle key={j} cx={0} cy={0} r={110 + 420 * u} fill="none" stroke={LIGHT.green} strokeWidth={6 - j * 1.5} opacity={(1 - u) * 0.9} {...ns} /> : null;
      })}
      {/* shell (hexagonal prism seen face-on, with a lit top facet and side facets) */}
      <path d={hx(100)} fill={`url(#${id}-shell)`} stroke="#4E3C9C" strokeWidth={2.6} {...ns} />
      <path d={`M${polar(P(0, 0), 100, 210).x} ${polar(P(0, 0), 100, 210).y}L${polar(P(0, 0), 100, 270).x} ${polar(P(0, 0), 100, 270).y}L${polar(P(0, 0), 100, 330).x} ${polar(P(0, 0), 100, 330).y}L${polar(P(0, 0), 78, 330).x} ${polar(P(0, 0), 78, 330).y}L${polar(P(0, 0), 78, 270).x} ${polar(P(0, 0), 78, 270).y}L${polar(P(0, 0), 78, 210).x} ${polar(P(0, 0), 78, 210).y}Z`} fill="#FFFFFF" opacity={0.35} />
      <g clipPath={`url(#${id}-hc)`} opacity={det}>
        {/* core (lighter) */}
        <path d={hx(54)} fill={greenness > 0.05 ? LIGHT.greenGlow : '#E9E2FF'} opacity={0.55 + 0.4 * Math.max(stored, greenness)} />
        {lattice.map((q, i) => {
          const lit = stored > 0 && (q.x + 90) / 180 > 1 - stored ? 1 : 0;
          const col = greenness > 0.05 ? LIGHT.green : lit ? LIGHT.ir : '#FFFFFF';
          return <circle key={i} cx={q.x} cy={q.y} r={lit || greenness > 0.05 ? 4.2 : 3} fill={col} opacity={lit || greenness > 0.05 ? 0.95 : 0.45} />;
        })}
        {/* energy levels: dashed rings fill amber as packets are stored */}
        <path d={hx(36)} fill="none" stroke={c1 > 0.01 ? LIGHT.ir : '#FFFFFF'} strokeOpacity={0.35 + 0.65 * c1 * (1 - em)} strokeWidth={c1 > 0.01 ? 5 : 2} strokeDasharray="10 8" {...ns} />
        <path d={hx(68)} fill="none" stroke={c2 > 0.01 ? LIGHT.ir : '#FFFFFF'} strokeOpacity={0.3 + 0.7 * c2 * (1 - em)} strokeWidth={c2 > 0.01 ? 5 : 2} strokeDasharray="10 8" {...ns} />
      </g>
      {/* edge light: the facing (right) edges glow amber while absorbing */}
      {ch > 0.01 && <path d={`M${polar(P(0, 0), 100, 330).x} ${polar(P(0, 0), 100, 330).y}L${polar(P(0, 0), 100, 30).x} ${polar(P(0, 0), 100, 30).y}L${polar(P(0, 0), 100, 90).x} ${polar(P(0, 0), 100, 90).y}`} fill="none" stroke={LIGHT.ir} strokeWidth={6} strokeLinejoin="round" opacity={0.8 * Math.min(1, ch) * (1 - em)} {...ns} />}
      {greenness > 0.02 && <path d={hx(100)} fill="none" stroke={LIGHT.green} strokeWidth={7} opacity={greenness} {...ns} />}
      {s.hero.mark > 0.01 && <path d={hx(150 + 10 * Math.sin(s.t * 5))} fill="none" stroke="#FFFFFF" strokeWidth={3.5} strokeDasharray="12 10" opacity={0.85 * s.hero.mark} {...ns} />}
      <ellipse cx={-36} cy={-48} rx={24} ry={11} fill="#FFFFFF" opacity={0.6} transform="rotate(-30 -36 -48)" />
    </g>
  );
};
export {HERO, EYE2, polar};
