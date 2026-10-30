// HOOK 08 eye section (L2: eyeball radius 100, front of the eye = +x), adapted from Infrared Contacts V2
// (art/Section.tsx + v2/Section2.tsx). It is revealed by a soft, feathered clearing in the closed-eyed face (no rim,
// no ring), and shows the lids CLOSED over the soft contact lens on the cornea.
// Changes from V2: closed lids only; a feathered clearing instead of the cream-rimmed circle; larger, sparser
// core-shell nanocrystals so the material reads at one zoom with the lid, the tear film and the cornea in view; per-
// crystal absorption (stored near-infrared energy shows as a deep-red core) and emission (one green glint); no
// energy-level rings, no labels; green light reaching the retina as a soft wash and spot.
import React from 'react';
import {Pt, P, smooth, pathD, rnd, clamp, lerp, polar, arcPts} from './geo';
import {L as LEADC, GREEN, INK} from './Lead8';

export const SC = {
  air: '#10272F', airDeep: '#0A1B22',
  tissue: '#E9A898', tissueDeep: '#D38979', fat: '#F3D7A6', fatDeep: '#E3BF83',
  sclera: '#FBF7EF', cornea: '#DDF1F2', vitreous: '#EAF4F2', vitreousDeep: '#D4E8E6',
  retina: '#E8735E', retinaDeep: '#C4523F', choroid: '#9E3B33', nerve: '#F2D9A6',
  lensEye: '#CFE6EA', lensEyeRim: '#9CC4CC', iris: '#5A7F6E', irisDeep: '#34503F',
  lidSkin: '#F2C9A8', lidInner: '#E58E88', lidMuscle: '#D8786B', lash: '#3A1E18',
  contactRim: '#5FC3CF',
};
export const NIR = {core: '#E2475E', glow: '#8E1530', deep: '#5A0E22'};
const ns = {vectorEffect: 'non-scaling-stroke' as const};

export const EYE2 = {
  R: 100, corneaC: P(62, 0), corneaR: 52, limbusDeg: 57.7,
  lensC: P(52, 0), lensRi: 63, lensRo: 66.5, lensDeg: 59, lidGap: 0.8,
};
export const HERO_DEG = -6;
export const HERO = polar(EYE2.lensC, (EYE2.lensRi + EYE2.lensRo) / 2, HERO_DEG);
export const HERO_R = 0.5;
export const RETINA_C = polar(P(0, 0), 90, 180);

// ---------- closed lids (anatomical shape from V2's lidGeom with open = 0) ----------
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
const lidGeom = (upper: boolean) => {
  const rr = EYE2.lensRo + EYE2.lidGap;
  const margin = upper ? 6 : 10;
  const inner: Pt[] = [];
  if (upper) {
    for (let a = -78; a <= -34; a += 3) inner.push(polar(P(0, 0), 104, a));
    for (let a = -58; a < margin; a += 2) inner.push(polar(EYE2.lensC, rr, a));
  } else {
    for (let a = 70; a >= 34; a -= 3) inner.push(polar(P(0, 0), 104, a));
    for (let a = 58; a > margin; a -= 2) inner.push(polar(EYE2.lensC, rr, a));
  }
  inner.push(polar(EYE2.lensC, rr, margin));
  const outer = offsetOut(inner, (u) => lerp(upper ? 18 : 14, upper ? 12 : 10, u), upper);
  const mi = inner[inner.length - 1], mo = outer[outer.length - 1];
  const cap = [P(lerp(mi.x, mo.x, 0.5) + 4.2, lerp(mi.y, mo.y, 0.5) + (upper ? 1.2 : -1.2))];
  return {inner, outer, shape: smooth([...inner, ...cap, ...outer.slice().reverse()], true, 0.14), margin: P((mi.x + mo.x) / 2 + 3, (mi.y + mo.y) / 2), root: outer[0]};
};
export const LID_UP = lidGeom(true), LID_LO = lidGeom(false);

const TISSUE = (() => {
  const up = LID_UP.root, lo = LID_LO.root;
  const brow = [P(196, -250), P(176, -186), P(150, -150), P(108, -134), P(60, -128), up];
  const back: Pt[] = [];
  for (let a = -78; a >= -282; a -= 4) back.push(polar(P(0, 0), 104, a));
  const cheek = [lo, P(76, 126), P(126, 146), P(166, 196), P(196, 270)];
  return pathD([...brow, ...back, ...cheek, P(196, 420), P(-420, 420), P(-420, -420), P(196, -420)], true);
})();
const SKIN_EDGE = smooth([P(196, -250), P(176, -186), P(150, -150), P(108, -134), P(60, -128), LID_UP.root], false);
const CHEEK_EDGE = smooth([LID_LO.root, P(76, 126), P(126, 146), P(166, 196), P(196, 270)], false);
const CORNEA = (() => {
  const a = EYE2.limbusDeg;
  return pathD([...arcPts(EYE2.corneaC, EYE2.corneaR, -a, a, 40), ...arcPts(P(0, 0), EYE2.R, 26.1, -26.1, 12)], true);
})();
const CONTACT = (() => {
  const a = EYE2.lensDeg;
  const outer = arcPts(EYE2.lensC, EYE2.lensRo, -a + 2, a - 2, 120);
  const inner = arcPts(EYE2.lensC, EYE2.lensRi, a - 1.2, -a + 1.2, 120);
  const e1 = polar(EYE2.lensC, (EYE2.lensRi + EYE2.lensRo) / 2, a + 0.4), e0 = polar(EYE2.lensC, (EYE2.lensRi + EYE2.lensRo) / 2, -a - 0.4);
  return smooth([e0, ...outer, e1, ...inner], true, 0.12);
})();
const lensPt = (deg: number, f: number) => polar(EYE2.lensC, lerp(EYE2.lensRi, EYE2.lensRo, f), deg);
// hydrogel polymer network: short wavy strands through the thickness near the entry region
const STRANDS = Array.from({length: 70}, (_, k) => {
  const deg0 = lerp(-14, 2, rnd(k * 11.3));
  const pts: Pt[] = [];
  for (let j = 0; j < 7; j++) {
    const f = clamp(lerp(0.05, 0.95, rnd(k * 3.7 + 1)) + (rnd(k * 9 + j) - 0.5) * 0.4, 0.03, 0.97);
    pts.push(lensPt(deg0 + j * 0.45 + (rnd(k + j * 2.2) - 0.5) * 0.4, f));
  }
  return smooth(pts);
});

// lid tissue fibres near the margin (seen at material scale): wavy strands running along the lid
const LID_FIBRES = Array.from({length: 60}, (_, k) => {
  const rr = EYE2.lensRo + EYE2.lidGap + lerp(0.3, 12, rnd(k * 5.3 + 2));
  const d0 = lerp(-26, 0, rnd(k * 3.1 + 7));
  const pts: Pt[] = [];
  for (let j = 0; j < 9; j++) pts.push(polar(EYE2.lensC, rr + 0.25 * Math.sin(j * 1.7 + k), d0 + j * 0.7));
  return smooth(pts);
});

// ---------- nanocrystals ----------
export type Crystal = {p: Pt; r: number; i: number; rot: number};
export const CRYSTALS: Crystal[] = (() => {
  const out: Crystal[] = [];
  const nA = 150, nD = 4;
  for (let i = 0; i < nA; i++) for (let j = 0; j < nD; j++) {
    const id = i * nD + j;
    const deg = lerp(-52, 52, (i + 0.2 + 0.6 * rnd(id * 1.913 + 0.37)) / nA);
    const f = lerp(0.1, 0.9, (j + 0.15 + 0.7 * rnd(id * 4.271 + 9.11)) / nD);
    const p = lensPt(deg, f);
    if (Math.hypot(p.x - HERO.x, p.y - HERO.y) < 1.0) continue;
    out.push({p, r: lerp(0.17, 0.23, rnd(id * 2.77 + 5.5)), i: id, rot: rnd(id * 2.9) * 60});
  }
  return out;
})();
const DEEP = Array.from({length: 260}, (_, i) => ({p: lensPt(lerp(-18, 6, rnd(i * 2.31 + 7)), lerp(0.06, 0.94, rnd(i * 5.17 + 3))), r: lerp(0.09, 0.15, rnd(i * 1.7)), i}));
const NEAR = Array.from({length: 7}, (_, i) => ({p: lensPt(HERO_DEG + lerp(-2.6, 2.6, rnd(i * 4.4 + 1)), lerp(0.05, 0.95, rnd(i * 7.7 + 2))), r: lerp(0.55, 0.8, rnd(i * 3.3)), i}));
export const hexPts = (c: Pt, r: number, rotDeg: number) => Array.from({length: 6}, (_, k) => polar(c, r, rotDeg + k * 60));
const hexD = (c: Pt, r: number, rotDeg: number) => pathD(hexPts(c, r, rotDeg), true);

// a crystal's state at time t: stored near-infrared packets (0..2) and the green emission (0..1, decaying)
export type CState = {q: number; g: number};

export type SectionProps = {
  t: number;
  zl: number; // screen px per L2 unit
  view: {x0: number; y0: number; x1: number; y1: number};
  reveal: number; // clearing radius factor 0..1
  wash: number; // green light crossing the eye to the retina (0..1)
  retina: number; // green spot on the retina (0..1)
  lidTint: number; // faint green inside the lid tissue near the lens
  crystal: (c: Crystal) => CState;
  hero: CState;
  sparkle: (c: Crystal) => number; // section-scale conversion glints
  id: string;
};
export const CLEAR_C = P(16, -2), CLEAR_R = 205;
const SLIT_C = P(52, 12); // the closed lid line of the face, in L2

export const Section8: React.FC<SectionProps> = (s) => {
  // the clearing opens out of the closed lid line: a thin feathered slit along the lid that widens into the cut
  if (s.reveal < 0.002) return null;
  const e = s.reveal;
  const cc = P(lerp(SLIT_C.x, CLEAR_C.x, e), lerp(SLIT_C.y, CLEAR_C.y, e));
  const rx = lerp(120, CLEAR_R, e), ry = lerp(12, CLEAR_R, e * e * (3 - 2 * e));
  const rr = Math.max(rx, ry);
  const ma = clamp(e * 6);
  const {id} = s;
  const vis = (p: Pt, m: number) => p.x > s.view.x0 - m && p.x < s.view.x1 + m && p.y > s.view.y0 - m && p.y < s.view.y1 + m;
  const dotA = clamp((s.zl - 14) / 20);
  const hexMode = s.zl > 70;
  const matA = clamp((s.zl - 40) / 80);
  const sparkA = 1 - clamp((s.zl - 40) / 40);
  return (
    <g>
      <defs>
        <radialGradient id={`${id}-feather`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#FFF" />
          <stop offset="0.66" stopColor="#FFF" />
          <stop offset="1" stopColor="#000" />
        </radialGradient>
        <mask id={`${id}-mask`} maskUnits="userSpaceOnUse" x={cc.x - rx - 2} y={cc.y - ry - 2} width={2 * rx + 4} height={2 * ry + 4}>
          <ellipse cx={cc.x} cy={cc.y} rx={rx} ry={ry} fill={`url(#${id}-feather)`} opacity={ma} />
        </mask>
        <clipPath id={`${id}-lidclip`}>
          <path d={LID_UP.shape} />
        </clipPath>
        <clipPath id={`${id}-lens`}>
          <path d={CONTACT} />
        </clipPath>
        <radialGradient id={`${id}-air`} cx="0.8" cy="0.4" r="0.75">
          <stop offset="0" stopColor="#F1CFB2" />
          <stop offset="1" stopColor="#DDB295" />
        </radialGradient>
        <radialGradient id={`${id}-vit`} cx="0.6" cy="0.5" r="0.6">
          <stop offset="0" stopColor={SC.vitreous} />
          <stop offset="1" stopColor={SC.vitreousDeep} />
        </radialGradient>
        <radialGradient id={`${id}-gg`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={GREEN.core} stopOpacity={0.95} />
          <stop offset="0.45" stopColor={GREEN.mid} stopOpacity={0.5} />
          <stop offset="1" stopColor={GREEN.mid} stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${id}-ret`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={GREEN.core} stopOpacity={1} />
          <stop offset="0.5" stopColor={GREEN.mid} stopOpacity={0.6} />
          <stop offset="1" stopColor={GREEN.mid} stopOpacity={0} />
        </radialGradient>
        <linearGradient id={`${id}-wash`} x1="1" y1="0" x2="0" y2="0">
          <stop offset="0" stopColor={GREEN.mid} stopOpacity={0.5} />
          <stop offset="1" stopColor={GREEN.mid} stopOpacity={0.12} />
        </linearGradient>
        <radialGradient id={`${id}-nirg`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.3" stopColor={NIR.core} stopOpacity={0.5} />
          <stop offset="1" stopColor={NIR.core} stopOpacity={0} />
        </radialGradient>
        <linearGradient id={`${id}-hx`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#EFE9FF" />
          <stop offset="0.5" stopColor="#B5A3EC" />
          <stop offset="1" stopColor="#6F5BBE" />
        </linearGradient>
        <linearGradient id={`${id}-mat`} x1="1" y1="0" x2="0" y2="0">
          <stop offset="0" stopColor="#D6F3F6" />
          <stop offset="0.5" stopColor="#C3EAEF" />
          <stop offset="1" stopColor="#D2F1F4" />
        </linearGradient>
        <linearGradient id={`${id}-lid`} x1="1" y1="0" x2="0" y2="0">
          <stop offset="0" stopColor="#E99383" />
          <stop offset="1" stopColor={SC.lidMuscle} />
        </linearGradient>
      </defs>
      <g mask={`url(#${id}-mask)`}>
        {/* in front of the cut the face simply continues (skin), so the face's own lid line is covered */}
        <circle cx={cc.x} cy={cc.y} r={rr + 2} fill={`url(#${id}-air)`} />
        <path d={TISSUE} fill={SC.fat} />
        <path d={SKIN_EDGE} fill="none" stroke={LEADC.skin} strokeWidth={9} strokeLinecap="round" />
        <path d={CHEEK_EDGE} fill="none" stroke={LEADC.skin} strokeWidth={9} strokeLinecap="round" />
        <path d={SKIN_EDGE} fill="none" stroke={INK} strokeWidth={2} {...ns} />
        <path d={CHEEK_EDGE} fill="none" stroke={INK} strokeWidth={2} {...ns} />
        <path d="M-20 -100 C-80 -122 -170 -112 -240 -86 L-240 -62 C-170 -84 -90 -96 -32 -92 Z" fill={SC.tissueDeep} opacity={0.9} />
        <path d="M-20 100 C-80 122 -170 112 -240 86 L-240 62 C-170 84 -90 96 -32 92 Z" fill={SC.tissueDeep} opacity={0.9} />
        <path d="M-96 -16 C-150 -20 -220 -26 -300 -30 L-300 18 C-220 14 -150 16 -96 18 Z" fill={SC.nerve} stroke={SC.fatDeep} strokeWidth={1.5} {...ns} />
        <circle cx={0} cy={0} r={100} fill={SC.sclera} stroke={INK} strokeWidth={2.2} {...ns} />
        <circle cx={0} cy={0} r={94.5} fill={SC.choroid} />
        <circle cx={0} cy={0} r={92} fill={SC.retina} />
        <path d={Array.from({length: 120}, (_, k) => {const a = 128 + (k / 119) * 104; const p0 = polar(P(0, 0), 92, a), p1 = polar(P(0, 0), 89.4, a); return `M${p0.x.toFixed(2)} ${p0.y.toFixed(2)}L${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`;}).join('')} stroke={SC.retinaDeep} strokeWidth={1} opacity={0.5} {...ns} />
        <circle cx={0} cy={0} r={88.5} fill={`url(#${id}-vit)`} />
        <path d={pathD([...arcPts(P(0, 0), 95, -42, 42, 16), P(70, 50), P(70, -50)])} fill={SC.vitreous} />
        <path d={pathD([P(70, -52), P(86, -50), P(92, -36), P(92, 36), P(86, 50), P(70, 52)])} fill="#EAF6F6" />
        {/* the converted green light crossing the eye (through the pupil) to the retina */}
        {s.wash > 0.003 && (
          <path d={`M${HERO.x - 2} -26 L88 -15 L76 -9 L${RETINA_C.x + 3} -30 L${RETINA_C.x + 3} 30 L76 9 L88 15 L${HERO.x - 2} 26 Z`} fill={`url(#${id}-wash)`} opacity={0.75 * s.wash} />
        )}
        {s.retina > 0.003 && <ellipse cx={RETINA_C.x + 2} cy={RETINA_C.y} rx={9 + 7 * s.retina} ry={20 + 14 * s.retina} fill={`url(#${id}-ret)`} opacity={s.retina} />}
        <ellipse cx={74} cy={0} rx={12} ry={30} fill={SC.lensEye} stroke={SC.lensEyeRim} strokeWidth={1.6} opacity={0.92} {...ns} />
        <path d="M70 -46 C76 -40 82 -38 86 -42 L84 -54 Z M70 46 C76 40 82 38 86 42 L84 54 Z" fill={SC.tissueDeep} />
        <path d="M86 -47 C90 -40 91 -26 89 -17 L85.6 -17 C87 -27 86 -40 82.5 -46 Z" fill={SC.iris} stroke={SC.irisDeep} strokeWidth={1.2} {...ns} />
        <path d="M86 47 C90 40 91 26 89 17 L85.6 17 C87 27 86 40 82.5 46 Z" fill={SC.iris} stroke={SC.irisDeep} strokeWidth={1.2} {...ns} />
        <path d={pathD([...arcPts(EYE2.lensC, EYE2.lensRi + 0.2, -EYE2.lensDeg, EYE2.lensDeg, 60), ...arcPts(P(0, 0), 101, 34, -34, 10)])} fill="#E2F6F7" />
        <path d={CORNEA} fill={SC.cornea} stroke={INK} strokeWidth={1.8} {...ns} />
        {/* ---- the soft contact lens ---- */}
        <path d={CONTACT} fill={`url(#${id}-mat)`} fillOpacity={0.95} />
        <g clipPath={`url(#${id}-lens)`}>
          {matA > 0.01 && [0, 1, 2, 3, 4].map((k) => {
            const f = 0.18 + 0.16 * k + 0.04 * Math.sin(s.t * 0.9 + k * 1.7);
            const d0 = -14 + k * 2.6 + 0.8 * Math.sin(s.t * 0.6 + k);
            return <path key={k} d={smooth(arcPts(EYE2.lensC, lerp(EYE2.lensRi, EYE2.lensRo, f), d0, d0 + 3 + k * 0.8, 24))} fill="none" stroke="#FFFFFF" strokeWidth={22 + 10 * (k % 2)} strokeOpacity={0.12 * matA} strokeLinecap="round" {...ns} />;
          })}
          {matA > 0.01 && <g opacity={0.45 * matA}>{STRANDS.map((d, k) => <path key={k} d={d} fill="none" stroke="#7CC9D3" strokeWidth={1.6} {...ns} />)}</g>}
          {s.zl > 60 && <g opacity={0.3 * matA}>{DEEP.filter((q) => vis(q.p, 0.5)).map((q) => <path key={q.i} d={hexD(q.p, q.r, rnd(q.i) * 60)} fill="#9C8BD8" />)}</g>}
        </g>
        <path d={CONTACT} fill="none" stroke={SC.contactRim} strokeWidth={1.8} {...ns} />
        <path d={smooth(arcPts(EYE2.lensC, EYE2.lensRo - 0.05, -EYE2.lensDeg + 6, EYE2.lensDeg - 6, 60))} fill="none" stroke="#FFFFFF" strokeWidth={2.2} strokeOpacity={0.7} {...ns} />
        {/* crystals */}
        {dotA > 0.01 && (
          <g opacity={dotA}>
            {CRYSTALS.filter((c) => vis(c.p, 1)).map((c) => {
              const st = s.crystal(c);
              return <CrystalG key={c.i} c={c} st={st} hex={hexMode} id={id} zl={s.zl} t={s.t} />;
            })}
            {vis(HERO, 2) && <HeroCrystal st={s.hero} id={id} zl={s.zl} t={s.t} />}
          </g>
        )}
        {/* section-scale conversion glints along the lens */}
        {sparkA > 0.01 && (
          <g opacity={sparkA}>
            {CRYSTALS.map((c) => {
              const g = s.sparkle(c);
              return g > 0.02 ? <circle key={c.i} cx={c.p.x} cy={c.p.y} r={1.4 + 1.6 * g} fill={`url(#${id}-gg)`} opacity={Math.min(1, g * 1.2)} /> : null;
            })}
          </g>
        )}
        {s.zl > 150 && <g opacity={0.12 * clamp((s.zl - 150) / 100)}>{NEAR.filter((q) => vis(q.p, 1)).map((q) => <path key={q.i} d={hexD(P(q.p.x + 0.15 * Math.sin(s.t * 0.8 + q.i), q.p.y + 0.1 * Math.cos(s.t * 0.7 + q.i)), q.r, rnd(q.i) * 60)} fill="#E4DCFF" />)}</g>}
        {/* closed eyelids */}
        {[LID_UP, LID_LO].map((Ld, k) => (
          <g key={k}>
            <path d={Ld.shape} fill={`url(#${id}-lid)`} stroke={INK} strokeWidth={2} {...ns} />
            <path d={smooth(Ld.outer)} fill="none" stroke={SC.lidSkin} strokeWidth={4.5} />
            <path d={smooth(Ld.inner)} fill="none" stroke={SC.lidInner} strokeWidth={2.4} />
            <path d={smooth(Ld.outer)} fill="none" stroke={INK} strokeWidth={1.6} {...ns} />
            {[0, 1, 2].map((j) => {
              const m = Ld.margin, isUp = k === 0;
              const a = isUp ? -10 - j * 9 : 12 + j * 9;
              const tip = polar(m, 9 + j * 1.5, a);
              return <path key={j} d={`M${m.x - 1} ${m.y + (isUp ? -1 : 1) * (j - 1) * 1.6}Q${(m.x + tip.x) / 2 + 1} ${(m.y + tip.y) / 2 + (isUp ? 2 : -2)} ${tip.x} ${tip.y}`} fill="none" stroke={SC.lash} strokeWidth={2.2} strokeLinecap="round" {...ns} />;
            })}
          </g>
        ))}
        {matA > 0.01 && <g clipPath={`url(#${id}-lidclip)`} opacity={0.5 * matA}>{LID_FIBRES.map((d, k) => <path key={k} d={d} fill="none" stroke={k % 3 ? '#C9685C' : '#F0A595'} strokeWidth={k % 3 ? 2 : 3} {...ns} />)}</g>}
        {s.lidTint > 0.003 && <ellipse cx={HERO.x + 7} cy={HERO.y + 4} rx={9} ry={22} fill={`url(#${id}-gg)`} opacity={0.35 * s.lidTint} />}
      </g>
    </g>
  );
};

const CrystalG: React.FC<{c: Crystal; st: CState; hex: boolean; id: string; zl: number; t: number}> = ({c, st, hex, id, zl, t}) => {
  const {q, g} = st;
  const jit = P(0.012 * Math.sin(t * 3.1 + c.i), 0.012 * Math.cos(t * 2.7 + c.i * 1.3));
  const p = P(c.p.x + jit.x, c.p.y + jit.y);
  const rot = c.rot + 4 * Math.sin(t * 0.7 + c.i);
  if (!hex) return <circle cx={p.x} cy={p.y} r={c.r} fill={g > 0.25 ? GREEN.mid : q > 0.5 ? '#B9506A' : '#A896E2'} />;
  const qa = clamp(q / 2);
  return (
    <g>
      {g > 0.01 && <circle cx={p.x} cy={p.y} r={c.r * (1.6 + 1.4 * g)} fill={`url(#${id}-gg)`} opacity={g} />}
      <path d={hexD(p, c.r, rot)} fill={`url(#${id}-hx)`} stroke={g > 0.3 ? GREEN.deep : '#5E4BAA'} strokeWidth={zl > 150 ? 1.4 : 1} {...ns} />
      {/* top facet catches the key light */}
      <path d={pathD([...hexPts(p, c.r, rot).slice(3, 6), ...hexPts(p, c.r * 0.78, rot).slice(3, 6).reverse()])} fill="#FFFFFF" opacity={0.3} />
      {/* core: pale at rest, deep red as near-infrared energy is stored, green-white when it emits */}
      <path d={hexD(P(p.x - c.r * 0.06, p.y - c.r * 0.08), c.r * 0.52, rot)} fill={g > 0.15 ? GREEN.core : qa > 0.02 ? NIR.core : '#F4F0FF'} opacity={g > 0.15 ? 0.6 + 0.4 * g : 0.5 + 0.45 * qa} />
    </g>
  );
};

// the hero crystal: a larger core-shell hexagonal nanocrystal with a visible ion lattice. Internal units: radius 100.
const HeroCrystal: React.FC<{st: CState; id: string; zl: number; t: number}> = ({st, id, zl, t}) => {
  const k = HERO_R / 100;
  const det = clamp((zl - 90) / 80);
  const qa = clamp(st.q / 2), g = st.g;
  const hx = (r: number) => pathD(hexPts(P(0, 0), r, 30), true);
  const lattice: Pt[] = [];
  for (let r = -6; r <= 6; r++) for (let c = -7; c <= 7; c++) {
    const x = c * 13 + (r % 2 ? 6.5 : 0), y = r * 11.3;
    if (Math.abs(y) < 72 && Math.abs(x) * 0.866 + Math.abs(y) * 0.5 < 72) lattice.push(P(x, y));
  }
  const rot = 3 * Math.sin(t * 0.6);
  return (
    <g transform={`translate(${HERO.x} ${HERO.y}) rotate(${rot}) scale(${k})`}>
      {qa > 0.01 && <circle cx={0} cy={0} r={150 + 30 * qa} fill={`url(#${id}-nirg)`} opacity={0.55 * qa * (1 - g)} />}
      {g > 0.01 && <circle cx={0} cy={0} r={150 + 120 * g} fill={`url(#${id}-gg)`} opacity={g} />}
      <path d={hx(100)} fill={`url(#${id}-hx)`} stroke="#4E3C9C" strokeWidth={2.4} {...ns} />
      <path d={pathD([...hexPts(P(0, 0), 100, 30).slice(3, 6), ...hexPts(P(0, 0), 80, 30).slice(3, 6).reverse()])} fill="#FFFFFF" opacity={0.35} />
      <g opacity={det}>
        <path d={hx(56)} fill={g > 0.15 ? GREEN.core : qa > 0.02 ? '#F2B7C2' : '#ECE6FF'} opacity={0.55 + 0.4 * Math.max(qa, g)} />
        {lattice.map((q, i) => {
          // stored energy fills the lattice from the side the light enters (upper right)
          const lit = qa > 0 && (q.x - q.y * 0.4 + 100) / 200 > 1 - qa * 0.98;
          const col = g > 0.15 ? GREEN.mid : lit ? NIR.core : '#FFFFFF';
          return <circle key={i} cx={q.x} cy={q.y} r={lit || g > 0.15 ? 4.4 : 3} fill={col} opacity={lit || g > 0.15 ? 0.95 : 0.45} />;
        })}
      </g>
      {qa > 0.01 && <path d={`M${hexPts(P(0, 0), 100, 30)[5].x} ${hexPts(P(0, 0), 100, 30)[5].y}L${hexPts(P(0, 0), 100, 30)[0].x} ${hexPts(P(0, 0), 100, 30)[0].y}L${hexPts(P(0, 0), 100, 30)[1].x} ${hexPts(P(0, 0), 100, 30)[1].y}`} fill="none" stroke={NIR.core} strokeWidth={5} strokeLinejoin="round" opacity={0.75 * qa * (1 - g)} {...ns} />}
      {g > 0.02 && <path d={hx(100)} fill="none" stroke={GREEN.mid} strokeWidth={5} opacity={g} {...ns} />}
      <ellipse cx={-36} cy={-48} rx={24} ry={11} fill="#FFFFFF" opacity={0.55} transform="rotate(-30 -36 -48)" />
    </g>
  );
};
