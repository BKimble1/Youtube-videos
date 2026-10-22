// The eye section (L2): a side (sagittal) cut through the lead's near eye, front of the eye = +x, as seen through a
// circular cutaway window opened in the face. Eyeball radius 100. The soft contact lens is a thin shell on the cornea
// with nanoparticles embedded in its material. The eyelids are separate layers that slide apart (the eye opens in the
// diagram) and back (closed) without changing shape; the lens slides off to the right and back on.
// Strokes use non-scaling widths (screen px), so the drawing holds from the whole-eye view down to one particle.
import React from 'react';
import {SECC as S, LEADC, LIGHT, C} from '../theme';
import {Pt, P, smooth, pathD, rnd, clamp, lerp} from '../lib';

const ns = {vectorEffect: 'non-scaling-stroke' as const};
const d2r = (d: number) => (d * Math.PI) / 180;
const polar = (c: Pt, r: number, deg: number) => P(c.x + r * Math.cos(d2r(deg)), c.y + r * Math.sin(d2r(deg)));
const arcPts = (c: Pt, r: number, a0: number, a1: number, n = 48) => Array.from({length: n + 1}, (_, i) => polar(c, r, lerp(a0, a1, i / n)));

export const EYE2 = {
  R: 100,
  corneaC: P(62, 0), corneaR: 52, limbusDeg: 57.7, // cornea meets sclera at (89.8, ±44)
  lensC: P(52, 0), lensRi: 63, lensRo: 66.5, lensDeg: 59, // contact lens shell
  lidGap: 0.8,
  window: {c: P(12, 4), r: 178},
};
// hero particle: middle of the lens thickness, 6 degrees above the axis (where the incoming signal meets the lens)
export const HERO_DEG = -6;
export const HERO = polar(EYE2.lensC, (EYE2.lensRi + EYE2.lensRo) / 2, HERO_DEG);
export const PARTICLE_R = 0.16;

// ---------- particles (deterministic) ----------
export type Particle = {p: Pt; r: number; i: number};
export const PARTICLES: Particle[] = (() => {
  // jittered grid over the shell: even, natural spacing (about 2 particles per square unit), no clumps
  const out: Particle[] = [];
  const nA = 300, nD = 4;
  for (let i = 0; i < nA; i++) for (let j = 0; j < nD; j++) {
    const id = i * nD + j;
    const deg = lerp(-56, 56, (i + 0.15 + 0.7 * rnd(id * 1.913 + 0.37)) / nA);
    const f = lerp(0.12, 0.88, (j + 0.1 + 0.8 * rnd(id * 4.271 + 9.11)) / nD);
    const p = polar(EYE2.lensC, lerp(EYE2.lensRi, EYE2.lensRo, f), deg);
    if (Math.hypot(p.x - HERO.x, p.y - HERO.y) < 0.62) continue;
    out.push({p, r: PARTICLE_R * lerp(0.85, 1.1, rnd(id * 2.77 + 5.5)), i: id});
  }
  return out;
})();

// ---------- lids ----------
// inner surface of a lid from its fornix (on the sclera) to its margin; outer surface offset by the lid thickness
const lidInner = (upper: boolean) => {
  const pts: Pt[] = [];
  const rr = EYE2.lensRo + EYE2.lidGap;
  if (upper) {
    for (let a = -76; a <= -34; a += 3) pts.push(polar(P(0, 0), 104, a)); // conjunctiva on the sclera (fornix -> limbus)
    for (let a = -58; a <= 6; a += 3) pts.push(polar(EYE2.lensC, rr, a)); // resting on the lens, down to the margin
    pts.push(polar(EYE2.lensC, rr, 6));
  } else {
    for (let a = 68; a >= 34; a -= 3) pts.push(polar(P(0, 0), 104, a));
    for (let a = 58; a >= 10; a -= 3) pts.push(polar(EYE2.lensC, rr, a));
    pts.push(polar(EYE2.lensC, rr, 10));
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
    // outward normal (away from the eye): for the upper lid the path runs top->front, so the right-hand normal points out
    const nx = upper ? ty : -ty, ny = upper ? -tx : tx;
    const k = thick(i / (n - 1));
    return P(p.x + nx * k, p.y + ny * k);
  });
};
export const LIDS = (() => {
  const mk = (upper: boolean) => {
    const inner = lidInner(upper);
    const outer = offsetOut(inner, (u) => lerp(upper ? 18 : 14, upper ? 12 : 10, u), upper);
    const mi = inner[inner.length - 1], mo = outer[outer.length - 1];
    const tipDir = upper ? 1 : -1;
    const cap = [P(lerp(mi.x, mo.x, 0.5) + 4.5, lerp(mi.y, mo.y, 0.5) + tipDir * 1.2)];
    const shape = smooth([...inner, ...cap, ...outer.slice().reverse()], true, 0.14);
    return {inner, outer, shape, margin: P((mi.x + mo.x) / 2 + 3, (mi.y + mo.y) / 2), root: outer[0]};
  };
  return {upper: mk(true), lower: mk(false)};
})();

// ---------- tissue around the eye (brow above, cheek below, orbit behind) ----------
const TISSUE = (() => {
  const up = LIDS.upper.root, lo = LIDS.lower.root;
  const brow = [P(196, -250), P(176, -186), P(150, -150), P(108, -134), P(60, -128), up];
  const back: Pt[] = [];
  for (let a = -76; a >= -284; a -= 4) back.push(polar(P(0, 0), 104, a));
  const cheek = [lo, P(76, 126), P(126, 146), P(166, 196), P(196, 270)];
  return pathD([...brow, ...back, ...cheek, P(196, 420), P(-420, 420), P(-420, -420), P(196, -420)], true);
})();
const SKIN_EDGE = smooth([P(196, -250), P(176, -186), P(150, -150), P(108, -134), P(60, -128), LIDS.upper.root], false);
const CHEEK_EDGE = smooth([LIDS.lower.root, P(76, 126), P(126, 146), P(166, 196), P(196, 270)], false);

// ---------- eyeball pieces ----------
const CORNEA = (() => {
  const a = EYE2.limbusDeg;
  const front = arcPts(EYE2.corneaC, EYE2.corneaR, -a, a, 40);
  const back = arcPts(P(0, 0), EYE2.R, 26.1, -26.1, 12);
  return pathD([...front, ...back], true);
})();
const CONTACT = (() => {
  const a = EYE2.lensDeg;
  const outer = arcPts(EYE2.lensC, EYE2.lensRo, -a + 2, a - 2, 60);
  const inner = arcPts(EYE2.lensC, EYE2.lensRi, a - 1.2, -a + 1.2, 60);
  const e1 = polar(EYE2.lensC, (EYE2.lensRi + EYE2.lensRo) / 2, a + 0.4), e0 = polar(EYE2.lensC, (EYE2.lensRi + EYE2.lensRo) / 2, -a - 0.4);
  return smooth([e0, ...outer, e1, ...inner], true, 0.12);
})();
// polymer network strands near the hero particle (seen only at material scale)
const STRANDS = Array.from({length: 46}, (_, k) => {
  const deg0 = lerp(-17, 5, rnd(k * 11.3));
  const pts: Pt[] = [];
  for (let j = 0; j < 7; j++) {
    const f = clamp(lerp(0.05, 0.95, rnd(k * 3.7 + 1)) + (rnd(k * 9 + j) - 0.5) * 0.35, 0.03, 0.97);
    pts.push(polar(EYE2.lensC, lerp(EYE2.lensRi, EYE2.lensRo, f), deg0 + j * 0.55 + (rnd(k + j * 2.2) - 0.5) * 0.4));
  }
  return smooth(pts);
});

export type SectionState = {
  zl: number; // screen px per L2 unit (level of detail)
  view: {x0: number; y0: number; x1: number; y1: number}; // visible L2 bounds (culling)
  reveal: number; // 0..1 cutaway window opening
  lidOpen: number; // 0 closed .. 1 slid apart (out of the window)
  lensOut: number; // 0 on the cornea .. 1 slid off to the right
  retina: {amt: number; deg: number; spread: number; col: string}; // retinal response glow
  hero: {charge: number; emit: number; spin: number}; // nanoparticle excitation (0..2 absorbed packets), emission burst
  lensFocus: number; // 0..1 brighten the lens shell (highlight)
};

export const SectionView: React.FC<{s: SectionState; id: string}> = ({s, id}) => {
  const wr = EYE2.window.r * s.reveal;
  if (wr < 0.5) return null;
  const upOff = P(30 * s.lidOpen, -175 * s.lidOpen), loOff = P(30 * s.lidOpen, 165 * s.lidOpen);
  const lensOff = P(150 * s.lensOut, 0);
  const vis = (p: Pt, m: number) => p.x > s.view.x0 - m && p.x < s.view.x1 + m && p.y > s.view.y0 - m && p.y < s.view.y1 + m;
  const pAlpha = clamp((s.zl - 22) / 30);
  const strandA = clamp((s.zl - 90) / 120) * 0.55;
  const lidA = 1 - 0.5 * clamp(s.lidOpen * 1.6 - 0.4);
  return (
    <g>
      <defs>
        <clipPath id={`${id}-win`}>
          <circle cx={EYE2.window.c.x} cy={EYE2.window.c.y} r={wr} />
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
        <radialGradient id={`${id}-pt`} cx="0.38" cy="0.35" r="0.7">
          <stop offset="0" stopColor={S.particleLight} />
          <stop offset="0.6" stopColor={S.particle} />
          <stop offset="1" stopColor={S.particleDeep} />
        </radialGradient>
      </defs>
      <g clipPath={`url(#${id}-win)`}>
        <circle cx={EYE2.window.c.x} cy={EYE2.window.c.y} r={EYE2.window.r + 2} fill={`url(#${id}-air)`} />
        {/* orbit tissue and skin */}
        <path d={TISSUE} fill={S.fat} />
        <path d={SKIN_EDGE} fill="none" stroke={LEADC.skin} strokeWidth={9} strokeLinecap="round" />
        <path d={CHEEK_EDGE} fill="none" stroke={LEADC.skin} strokeWidth={9} strokeLinecap="round" />
        <path d={SKIN_EDGE} fill="none" stroke={C.ink} strokeWidth={2.2} {...ns} />
        <path d={CHEEK_EDGE} fill="none" stroke={C.ink} strokeWidth={2.2} {...ns} />
        {/* extraocular muscles and optic nerve behind the eyeball */}
        <path d="M-20 -100 C-80 -122 -170 -112 -240 -86 L-240 -62 C-170 -84 -90 -96 -32 -92 Z" fill={S.tissueDeep} opacity={0.9} />
        <path d="M-20 100 C-80 122 -170 112 -240 86 L-240 62 C-170 84 -90 96 -32 92 Z" fill={S.tissueDeep} opacity={0.9} />
        <path d="M-96 -16 C-150 -20 -220 -26 -300 -30 L-300 18 C-220 14 -150 16 -96 18 Z" fill={S.nerve} stroke={S.fatDeep} strokeWidth={1.5} {...ns} />
        {/* eyeball: sclera, choroid, retina, vitreous */}
        <circle cx={0} cy={0} r={100} fill={S.sclera} stroke={C.ink} strokeWidth={2.4} {...ns} />
        <circle cx={0} cy={0} r={94.5} fill={S.choroid} />
        <circle cx={0} cy={0} r={92} fill={S.retina} />
        <circle cx={0} cy={0} r={88.5} fill={`url(#${id}-vit)`} />
        {/* front of the eye: the retina stops at the ciliary body; aqueous in front of the lens */}
        <path d={pathD([...arcPts(P(0, 0), 95, -42, 42, 16), P(70, 50), P(70, -50)])} fill={S.vitreous} />
        <path d={pathD([P(70, -52), P(86, -50), P(92, -36), P(92, 36), P(86, 50), P(70, 52)])} fill="#EAF6F6" />
        {/* retinal response */}
        {s.retina.amt > 0.001 && (() => {
          const c = polar(P(0, 0), 90, s.retina.deg);
          return <ellipse cx={c.x} cy={c.y} rx={10 + s.retina.spread * 0.9} ry={14 + s.retina.spread * 1.6} fill={`url(#${id}-ret)`} opacity={s.retina.amt} />;
        })()}
        {/* crystalline lens and ciliary body */}
        <ellipse cx={74} cy={0} rx={12} ry={30} fill={S.lensEye} stroke={S.lensEyeRim} strokeWidth={1.6} {...ns} />
        <path d="M70 -46 C76 -40 82 -38 86 -42 L84 -54 Z M70 46 C76 40 82 38 86 42 L84 54 Z" fill={S.tissueDeep} />
        {/* iris (pupil aperture between them) */}
        <path d="M86 -47 C90 -40 91 -26 89 -17 L85.6 -17 C87 -27 86 -40 82.5 -46 Z" fill={S.iris} stroke={S.irisDeep} strokeWidth={1.2} {...ns} />
        <path d="M86 47 C90 40 91 26 89 17 L85.6 17 C87 27 86 40 82.5 46 Z" fill={S.iris} stroke={S.irisDeep} strokeWidth={1.2} {...ns} />
        {/* tear film under the lens (between lens and cornea) */}
        <path d={pathD([...arcPts(EYE2.lensC, EYE2.lensRi + 0.2, -EYE2.lensDeg, EYE2.lensDeg, 60), ...arcPts(P(0, 0), 101, 34, -34, 10)])} fill="#E2F6F7" opacity={1 - s.lensOut} />
        {/* cornea */}
        <path d={CORNEA} fill={S.cornea} stroke={C.ink} strokeWidth={2} {...ns} />
        {/* the soft contact lens on the cornea, particles embedded in its material */}
        <g transform={`translate(${lensOff.x} ${lensOff.y})`}>
          <path d={CONTACT} fill="#D3F4F7" fillOpacity={0.92} stroke={S.contactRim} strokeWidth={1.8 + 1.6 * s.lensFocus} {...ns} />
          {strandA > 0.01 && <g opacity={strandA}>{STRANDS.map((d, k) => <path key={k} d={d} fill="none" stroke="#7CC9D3" strokeWidth={1.6} {...ns} />)}</g>}
          {pAlpha > 0.01 && (
            <g opacity={pAlpha}>
              {PARTICLES.filter((q) => vis(P(q.p.x + lensOff.x, q.p.y + lensOff.y), 1)).map((q) => (
                <g key={q.i}>
                  <circle cx={q.p.x} cy={q.p.y} r={q.r} fill={`url(#${id}-pt)`} stroke={S.particleDeep} strokeWidth={s.zl > 400 ? 1.4 : 0.8} {...ns} />
                  {s.zl > 300 && <circle cx={q.p.x - q.r * 0.35} cy={q.p.y - q.r * 0.38} r={q.r * 0.22} fill="#FFFFFF" opacity={0.75} />}
                </g>
              ))}
              {vis(HERO, 2) && <HeroParticle s={s} id={id} />}
            </g>
          )}
        </g>
        {/* eyelids: closed over the lens; they slide apart as layers when the diagram opens the eye */}
        {(['upper', 'lower'] as const).map((k) => {
          const L = LIDS[k], off = k === 'upper' ? upOff : loOff;
          return (
            <g key={k} transform={`translate(${off.x} ${off.y})`} opacity={lidA}>
              <path d={L.shape} fill={S.lidMuscle} stroke={C.ink} strokeWidth={2.2} {...ns} />
              <path d={smooth(L.outer)} fill="none" stroke={S.lidSkin} strokeWidth={4.5} />
              <path d={smooth(L.inner)} fill="none" stroke={S.lidInner} strokeWidth={3} />
              <path d={smooth(L.outer)} fill="none" stroke={C.ink} strokeWidth={1.6} {...ns} />
              {[0, 1, 2].map((j) => {
                const m = L.margin, up = k === 'upper';
                const a = up ? -10 - j * 9 : 12 + j * 9;
                const tip = polar(m, 9 + j * 1.5, a);
                return <path key={j} d={`M${m.x - 1} ${m.y + (up ? -1 : 1) * (j - 1) * 1.6}Q${(m.x + tip.x) / 2 + 1} ${(m.y + tip.y) / 2 + (up ? 2 : -2)} ${tip.x} ${tip.y}`} fill="none" stroke={S.lash} strokeWidth={2.2} strokeLinecap="round" {...ns} />;
              })}
            </g>
          );
        })}
      </g>
      {/* window rim */}
      <circle cx={EYE2.window.c.x} cy={EYE2.window.c.y} r={wr} fill="none" stroke={S.rim} strokeWidth={7} {...ns} />
      <circle cx={EYE2.window.c.x} cy={EYE2.window.c.y} r={wr} fill="none" stroke={C.ink} strokeWidth={2} opacity={0.6} {...ns} />
    </g>
  );
};

// The hero nanoparticle, detailed when the camera reaches material scale. Internal units: radius 100.
const HeroParticle: React.FC<{s: SectionState; id: string}> = ({s, id}) => {
  const k = PARTICLE_R / 100;
  const det = clamp((s.zl - 250) / 500);
  const ch = s.hero.charge, em = s.hero.emit;
  const ring1 = clamp(ch), ring2 = clamp(ch - 1);
  const lattice: Pt[] = [];
  for (let r = -6; r <= 6; r++) for (let c = -6; c <= 6; c++) {
    const x = c * 15 + (r % 2 ? 7.5 : 0), y = r * 13;
    if (x * x + y * y < 88 * 88) lattice.push(P(x, y));
  }
  return (
    <g transform={`translate(${HERO.x} ${HERO.y}) scale(${k})`}>
      <defs>
        <radialGradient id={`${id}-hglow`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={LIGHT.ir} stopOpacity={0.85} />
          <stop offset="1" stopColor={LIGHT.ir} stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${id}-gglow`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={LIGHT.greenGlow} stopOpacity={1} />
          <stop offset="0.4" stopColor={LIGHT.green} stopOpacity={0.7} />
          <stop offset="1" stopColor={LIGHT.green} stopOpacity={0} />
        </radialGradient>
        <clipPath id={`${id}-hclip`}>
          <circle cx={0} cy={0} r={96} />
        </clipPath>
      </defs>
      {/* contained excitation: the particle holds absorbed energy (amber), then releases it as one green emission */}
      {ch > 0.01 && <circle cx={0} cy={0} r={150 + 40 * ring2} fill={`url(#${id}-hglow)`} opacity={0.35 * Math.min(1, ch) * (1 - em)} />}
      {em > 0.001 && <circle cx={0} cy={0} r={130 + 260 * em} fill={`url(#${id}-gglow)`} opacity={Math.sin(Math.PI * Math.min(1, em * 1.15))} />}
      <circle cx={0} cy={0} r={100} fill={`url(#${id}-pt)`} stroke={S.particleDeep} strokeWidth={2.4} {...ns} />
      <g clipPath={`url(#${id}-hclip)`} opacity={det}>
        <g transform={`rotate(${s.hero.spin})`}>
          {lattice.map((q, i) => <circle key={i} cx={q.x} cy={q.y} r={3.4} fill="#FFFFFF" opacity={0.5} />)}
          {lattice.map((q, i) => (i % 3 === 0 ? <circle key={'d' + i} cx={q.x} cy={q.y} r={4.6} fill={S.particleDeep} opacity={0.45} /> : null))}
        </g>
        {/* energy levels */}
        <circle cx={0} cy={0} r={38} fill="none" stroke={ring1 > 0.01 ? LIGHT.ir : '#FFFFFF'} strokeOpacity={0.35 + 0.65 * ring1 * (1 - em)} strokeWidth={ring1 > 0.01 ? 5 : 2} strokeDasharray="10 8" {...ns} />
        <circle cx={0} cy={0} r={66} fill="none" stroke={ring2 > 0.01 ? LIGHT.ir : '#FFFFFF'} strokeOpacity={0.3 + 0.7 * ring2 * (1 - em)} strokeWidth={ring2 > 0.01 ? 5 : 2} strokeDasharray="10 8" {...ns} />
        {em > 0.001 && <circle cx={0} cy={0} r={lerp(66, 20, clamp(em * 2))} fill="none" stroke={LIGHT.green} strokeWidth={7} opacity={1 - clamp(em * 1.6)} {...ns} />}
      </g>
      <ellipse cx={-34} cy={-40} rx={22} ry={14} fill="#FFFFFF" opacity={0.65} transform="rotate(-30 -34 -40)" />
    </g>
  );
};

// Packet path helpers in L2: rays enter from the right along a horizontal line
export const LENS_FRONT_X = (y: number) => EYE2.lensC.x + Math.sqrt(EYE2.lensRo ** 2 - y * y);
export const LID_FRONT_X = (y: number) => {
  // outer skin of the closed upper lid at height y (nearest outer point)
  let best = LIDS.upper.outer[0];
  for (const q of [...LIDS.upper.outer, ...LIDS.lower.outer]) if (Math.abs(q.y - y) < Math.abs(best.y - y) && q.x > 60) best = q;
  return best.x;
};
export const CORNEA_FRONT_X = (y: number) => EYE2.corneaC.x + Math.sqrt(EYE2.corneaR ** 2 - y * y);
export {polar};
