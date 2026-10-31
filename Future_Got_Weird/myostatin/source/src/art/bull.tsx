// V2 Belgian Blue: a double-muscled bull in a late-afternoon pasture, side view facing right with a three-quarter-rear
// cue (cm, ground at y = 0). The body is built from the masses that make the breed recognisable: the bulging shoulder
// and triceps, the loin along the top line, and the rounded hindquarters (gluteal, biceps femoris, semitendinosus)
// that swell past the tail and down toward the hock. They are drawn as one outlined silhouette (strokes under, fills
// over), each mass with its own crease and highlight. Coat: blue roan. In 'anat' the hide goes translucent and the same
// masses read as red muscle, matching the translucent human arm it cuts from. The bull never changes shape.
import React from 'react';
import {P, add, closed, mul, nrm, open, pt, rot, sub} from '../core/geo';
import {mix} from '../core/color';
import {uid} from '../core/ids';
import {clamp, hash, ring, ss} from '../lib';

export type BullState = {
  x: number;          // body shift (the step carries it forward)
  step: number;       // 0..1 near foreleg step
  load: number;       // shoulder loading after the plant
  plantT: number;     // time since the plant (s)
  breathe: number;
  headNod: number;
  anat?: number;      // 0 coat .. 1 translucent hide over red muscle
  view?: number;      // 0 side .. 1 the camera has moved toward the rear (the far round shows more)
  cut?: {r: number};
  t: number;
};
export const SHOULDER_CUT: P = pt(70, -108);
const COAT = {base: '#D5DCE6', white: '#F6F7F4', roan: '#8E9BB0', roanDk: '#56627A', shade: '#8F9CB2', deep: '#5E6A82', ink: '#232A3A'};
const MUS = {base: '#C2303C', lit: '#E8616A', dk: '#7A1622', ink: '#3C0810', fas: '#F3989A'};

// muscle masses: [cx, cy, rx, ry, rotation (deg), highlight dx, dy]
type Mass = {c: P; rx: number; ry: number; rot: number; hl: P; name: string};
const M = (x: number, y: number, rx: number, ry: number, r: number, hx: number, hy: number, name: string): Mass => ({c: pt(x, y), rx, ry, rot: r, hl: pt(hx, hy), name});
const MASSES: Mass[] = [
  M(-6, -104, 84, 40, -2, 0, -14, 'barrel'),
  M(-22, -138, 62, 17, -1, -6, -6, 'loin'),
  M(104, -124, 30, 22, -32, 4, -6, 'neck'),
  M(66, -110, 31, 37, 8, -4, -12, 'shoulder'),
  M(84, -82, 18, 18, 0, -2, -6, 'brisket'),
  M(-88, -132, 30, 18, -8, -4, -6, 'gluteal'),
  M(-104, -104, 35, 39, 4, -8, -12, 'biceps femoris'),
  M(-76, -92, 20, 27, 10, -2, -8, 'quadriceps'),
  M(-130, -92, 15, 35, 8, -3, -10, 'semitendinosus'),
];
const ell = (m: Mass, sh: P, k = 1) => {
  const pts: P[] = [];
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * 2 * Math.PI;
    const p = rot(pt(Math.cos(a) * m.rx * k, Math.sin(a) * m.ry * k), (m.rot * Math.PI) / 180);
    pts.push(add(add(m.c, p), sh));
  }
  return closed(pts, 1);
};
const tube = (pts: P[], r: number[]) => {
  const n = pts.length;
  const Tn = pts.map((_, i) => nrm(sub(pts[Math.min(n - 1, i + 1)], pts[Math.max(0, i - 1)])));
  const N = Tn.map((x) => rot(x, Math.PI / 2));
  return closed([...pts.map((p, i) => add(p, mul(N[i], r[i]))), ...[...pts].reverse().map((p, i) => add(p, mul(N[n - 1 - i], -r[n - 1 - i])))], 0.75);
};
/** a cloven hoof with its dewclaw */
const Hoof: React.FC<{p: P; ang?: number; dark?: boolean}> = ({p, ang = 0, dark}) => (
  <g transform={`translate(${p.x} ${p.y}) rotate(${ang})`}>
    <path d="M-6 -7 L5.6 -7 L8.6 0 L-6.8 0 Z" fill={dark ? '#1A1E28' : '#2E3340'} stroke={COAT.ink} strokeWidth={0.8} strokeLinejoin="round" />
    <path d="M1.2 -6.6 L1.9 0" stroke="#0E1016" strokeWidth={1} />
    <ellipse cx={-5.6} cy={-9.4} rx={1.6} ry={1.2} fill="#2E3340" />
  </g>
);
const foreleg = (base: P, step: number) => {
  const lift = Math.sin(Math.PI * clamp(step));
  const fwd = 24 * ss(step, 0.05, 0.95);
  const top = pt(base.x + fwd * 0.25, -80);
  const knee = pt(base.x + 2 + fwd * 0.55 + 9 * lift, -38 - 10 * lift);
  const fet = pt(base.x + 3 + fwd * 0.9 - 2 * lift, -11 - 16 * lift);
  const hoof = pt(base.x + 5 + fwd, -16 * lift);
  return {top, knee, fet, hoof, lift};
};

// the silhouette (one closed outline) — every bulge the breed is known for is in the outline itself
const OUT: [number, number][] = [
  [80, -150], [60, -158], [40, -155], [24, -148], [4, -150], [-20, -156], [-44, -158], [-66, -155], [-84, -158], [-102, -156],
  [-116, -150], [-134, -142], [-150, -124], [-159, -106], [-155, -94], [-160, -78], [-152, -61], [-136, -50], [-118, -47],
  [-106, -57], [-92, -68], [-80, -72], [-50, -66], [-16, -62], [16, -62], [40, -64], [56, -57], [84, -61], [102, -77],
  [114, -92], [124, -100], [133, -108], [129, -126], [108, -142],
];
const SHADE_MASSES = MASSES.filter((m) => m.name !== 'barrel');
export const KX = 0.74; // body length factor: a compact, massive bull
const kx = (q: [number, number]): [number, number] => [q[0] * KX, q[1]];
// the muscle map: creases between the masses (polylines), and the panels they bound (painted back to front, clipped
// to the silhouette). Fascicle direction per panel for the anatomical view.
type Pl = [number, number][];
const CR: Record<string, Pl> = {
  A: [[104, -152], [114, -136], [116, -118], [110, -98]],
  B: [[50, -162], [36, -140], [32, -118], [38, -96], [54, -58]],
  C: [[102, -132], [86, -118], [66, -114], [48, -118]],
  E: [[44, -140], [10, -138], [-30, -140], [-62, -143], [-82, -150]],
  D: [[-70, -152], [-74, -130], [-84, -110], [-88, -90], [-82, -66]],
  F: [[-76, -134], [-92, -126], [-108, -127], [-130, -138]],
  G: [[-96, -128], [-110, -110], [-113, -88], [-106, -62]],
  H: [[-124, -148], [-142, -126], [-148, -104], [-146, -80], [-132, -54]],
};
for (const k of Object.keys(CR)) CR[k] = CR[k].map(kx);
const rev = (a: Pl) => [...a].reverse();
const PANELS: {name: string; pts: Pl; fas: number}[] = [
  {name: 'shoulder', pts: [[50, -175], [104, -175], ...CR.A, [100, -90], [84, -56], [54, -56], ...rev(CR.B)], fas: 75},
  {name: 'triceps', pts: [...CR.C, [42, -110], [40, -100], [54, -56], [84, -56], [104, -92], [112, -98]], fas: 60},
  {name: 'neck', pts: [[104, -175], [175, -175], [175, -80], [112, -98], ...rev(CR.A)], fas: 30},
  {name: 'loin', pts: [[52, -175], ...CR.E, [-80, -175]], fas: 0},
  {name: 'gluteal', pts: [[-72, -175], [-72, -152], ...CR.F, [-130, -150], [-130, -175]], fas: 10},
  {name: 'quadriceps', pts: [...CR.D, [-84, -50], [-104, -50], ...rev(CR.G), [-90, -131]], fas: 80},
  {name: 'round', pts: [...CR.G, [-104, -46], [-126, -46], ...rev(CR.H), [-110, -134]], fas: 85},
  {name: 'rear', pts: [...CR.H, [-128 * KX, -40], [-165, -40], [-165, -160], [-124 * KX, -152]], fas: 80},
];
// panel corner points that are not on a crease are scaled too (crease points already were)
for (const pn of PANELS) pn.pts = pn.pts.map((q) => (Object.values(CR).some((c) => c.includes(q)) || Math.abs(q[0]) === 165 ? q : kx(q)));

export const Bull: React.FC<{b: BullState}> = ({b}) => {
  const sh = pt(b.x, b.breathe * 0.5);
  const anat = clamp(b.anat ?? 0);
  const view = clamp(b.view ?? 0);
  const sl = b.load;
  const wob = ring(b.plantT, 0, 7, 0.12) * (b.plantT > 0 ? 1 : 0);
  const fl = foreleg(pt(56, 0), b.step);
  const T = (p: P) => add(p, pt(b.x, 0));
  const ms = SHADE_MASSES.map((m) => (m.name === 'shoulder' ? {...m, rx: m.rx * (1 + 0.05 * sl + 0.025 * wob), ry: m.ry * (1 + 0.03 * sl - 0.02 * wob)} : m));
  // the shoulder outline swells a little when the leg takes the weight
  const body = closed(OUT.map(kx).map(([x, y]) => {
    const k = x > 22 && x < 88 && y < -90 ? (0.9 * sl + 0.6 * wob) * Math.exp(-(((x - 49) / 22) ** 2)) : 0;
    return add(pt(x, y - k), sh);
  }), 0.8);
  const nearFore = tube([T(add(fl.top, pt(-1, -10))), T(fl.top), T(add(fl.top, pt(0.5, 14))), T(add(fl.top, pt(1, 26))), T(fl.knee), T(fl.fet)], [19, 19 + sl, 16 + sl, 11, 6, 4.6]);
  const nearHind = tube([T(pt(-84, -72)), T(pt(-86, -58)), T(pt(-87, -48)), T(pt(-86, -38)), T(pt(-80, -11))], [21, 17, 12, 6.2, 4.6]);
  const farFore = tube([T(pt(40, -84)), T(pt(40, -60)), T(pt(40, -48)), T(pt(40, -36)), T(pt(40, -11))], [16, 14, 10, 5.4, 4.2]);
  const farHind = tube([T(pt(-64, -84)), T(pt(-69, -60)), T(pt(-70, -50)), T(pt(-71, -40)), T(pt(-66, -11))], [19, 15, 10, 5.6, 4.2]);
  const farRound = ell(M(-110 - 9 * view, -98, 13 + 5 * view, 34, 4, 0, 0, 'far round'), sh);
  const ids = {coat: uid('bc'), clip: uid('bk'), hl: uid('bh'), sh: uid('bs'), blur: uid('bb'), leg: uid('bl')};
  const outline = [body, nearFore, nearHind];
  const H0 = pt(b.x + 4 - 34, b.breathe * 0.4 + b.headNod + 14);
  const hp = (x: number, y: number) => add(pt(x, y), H0);
  const head = closed([hp(116, -140), hp(128, -144), hp(140, -140), hp(150, -126), hp(158, -108), hp(166, -94), hp(171, -84), hp(171, -72), hp(164, -64), hp(150, -64), hp(136, -70), hp(124, -82), hp(116, -100), hp(113, -120)], 0.85);
  // coat: white with big blue-black patches (the classic Belgian Blue pied coat) and blue roan ticking at their edges
  const patch = (pts: [number, number][], k: string, dark = true) => (
    <path key={k} d={closed(pts.map(([x, y]) => add(pt(x * KX, y), sh)), 0.9)} fill={dark ? '#3E4860' : COAT.roan} opacity={dark ? 0.92 : 0.6} />
  );
  const mottle: React.ReactNode[] = [
    patch([[96, -150], [120, -142], [132, -118], [124, -100], [108, -100], [96, -118], [88, -138]], 'p1'),
    patch([[-148, -98], [-138, -90], [-140, -70], [-150, -70]], 'p5', false),
    patch([[20, -96], [44, -96], [44, -80], [22, -74]], 'p6', false),
  ];
  const tick: React.ReactNode[] = [];
  for (let i = 0; i < 700; i++) tick.push(<circle key={i} cx={(-150 + hash(i * 9.7) * 290) * KX + sh.x} cy={-160 + hash(i * 2.3) * 110 + sh.y} r={0.35 + hash(i * 4.4) * 0.6} fill={hash(i * 3.7) > 0.5 ? COAT.roanDk : COAT.roan} opacity={0.4} />);
  const coatOp = 1 - 0.85 * anat;
  const muscleFill = 'rgba(255,90,110,0.5)';
  return (
    <g>
      <defs>
        <linearGradient id={ids.coat} x1="0" y1="0" x2="0.1" y2="1">
          <stop offset={0} stopColor={COAT.white} />
          <stop offset={0.45} stopColor={COAT.base} />
          <stop offset={1} stopColor={COAT.shade} />
        </linearGradient>
        <linearGradient id={ids.leg} x1="0" y1="0" x2="0" y2="1">
          <stop offset={0} stopColor={COAT.base} />
          <stop offset={1} stopColor={COAT.shade} />
        </linearGradient>
        <clipPath id={ids.clip}>{outline.map((d, i) => <path key={i} d={d} />)}</clipPath>
        <radialGradient id={ids.sh} cx="0.5" cy="0.5" r="0.5">
          <stop offset={0} stopColor="#000000" stopOpacity={0.34} />
          <stop offset={1} stopColor="#000000" stopOpacity={0} />
        </radialGradient>
        <filter id={ids.blur} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation={4} /></filter>
      </defs>
      <ellipse cx={-6 + b.x} cy={1} rx={160} ry={10} fill={`url(#${ids.sh})`} />
      <g opacity={coatOp + 0.4 * anat}>
        <path d={farFore} fill={COAT.shade} stroke={COAT.ink} strokeWidth={0.9} />
        <path d={farHind} fill={COAT.shade} stroke={COAT.ink} strokeWidth={0.9} />
        <path d={farRound} fill={mix(COAT.shade, '#4A566E', 0.35)} stroke={COAT.ink} strokeWidth={1} />
      </g>
      <Hoof p={T(pt(42, 0))} dark />
      <Hoof p={T(pt(-64, 0))} dark />
      <path d={open([T(pt(-90, -152)), T(pt(-106 - 4 * view, -122)), T(pt(-110 - 5 * view, -82)), T(pt(-109 - 5 * view, -46))])} stroke={COAT.shade} strokeWidth={3} fill="none" strokeLinecap="round" opacity={coatOp} />
      <path d={`M${-113 - 5 * view + b.x} -48 q4 -8 8 0 q-1 10 -4 12 q-4 -3 -4 -12Z`} fill={COAT.roanDk} opacity={coatOp} />
      {/* one outline: strokes under, fills over */}
      {outline.map((d, i) => <path key={`o${i}`} d={d} fill={COAT.ink} stroke={anat > 0.5 ? '#7FCBFF' : COAT.ink} strokeWidth={2.4} strokeLinejoin="round" opacity={anat > 0.5 ? 0.6 : 1} />)}
      <g opacity={coatOp}>
        <path d={nearFore} fill={`url(#${ids.leg})`} />
        <path d={nearHind} fill={`url(#${ids.leg})`} />
        <path d={body} fill={`url(#${ids.coat})`} />
      </g>
      {anat > 0.01 && <g opacity={anat}>{outline.map((d, i) => <path key={`a${i}`} d={d} fill="rgba(10,24,44,0.92)" />)}</g>}
      <g clipPath={`url(#${ids.clip})`}>
        <g opacity={coatOp}>
          {mottle}
          {tick}
          <rect x={-130 + b.x} y={-84} width={260} height={40} fill={COAT.shade} opacity={0.32} />
        </g>
        {PANELS.map((pn, i) => {
          const d = closed(pn.pts.map(([x, y]) => add(pt(x, y - (pn.name === 'shoulder' || pn.name === 'triceps' ? 1.2 * sl + 0.8 * wob : 0)), sh)), 0.55);
          const xs = pn.pts.map((q) => q[0]), ys = pn.pts.map((q) => q[1]);
          const x0 = Math.max(-118, Math.min(...xs)), x1 = Math.min(99, Math.max(...xs)), y0 = Math.max(-158, Math.min(...ys)), y1 = Math.min(-46, Math.max(...ys));
          const cx = (x0 + x1) / 2 + sh.x, cy = (y0 + y1) / 2 + sh.y;
          const fa = (pn.fas * Math.PI) / 180;
          const fasc = [-0.5, -0.25, 0, 0.25, 0.5].map((k) => {
            const n = rot(pt(0, 1), fa), dv = rot(pt(1, 0), fa);
            const c0 = add(pt(cx, cy), mul(n, k * (y1 - y0) * 0.8));
            return open([add(c0, mul(dv, -70)), add(c0, mul(dv, 70))]);
          });
          const gid = `${ids.coat}p${i}`;
          return (
            <g key={i}>
              <defs>
                <radialGradient id={gid} gradientUnits="userSpaceOnUse" cx={x0 + 0.4 * (x1 - x0) + sh.x} cy={y0 + 0.34 * (y1 - y0) + sh.y} r={0.68 * Math.max(x1 - x0, y1 - y0)}>
                  <stop offset={0} stopColor="#FBFCFD" />
                  <stop offset={0.45} stopColor="#D6DDE8" />
                  <stop offset={0.85} stopColor="#8B98AE" />
                  <stop offset={1} stopColor="#6E7B92" />
                </radialGradient>
                <clipPath id={`${gid}c`}><path d={d} /></clipPath>
              </defs>
              <path d={d} fill={`url(#${gid})`} opacity={coatOp} />
              <g clipPath={`url(#${gid}c)`} opacity={coatOp}>
                <path d={d} fill="none" stroke="#5E6B84" strokeWidth={16} opacity={0.55} filter={`url(#${ids.blur})`} />
                <ellipse cx={x0 + 0.42 * (x1 - x0) + sh.x} cy={y0 + 0.36 * (y1 - y0) + sh.y} rx={0.28 * (x1 - x0)} ry={0.22 * (y1 - y0)} fill="#FFFFFF" opacity={0.55} filter={`url(#${ids.blur})`} />
              </g>
              {anat > 0.01 && (
                <g opacity={anat}>
                  <path d={d} fill={muscleFill} stroke="rgba(255,200,210,0.9)" strokeWidth={0.9} />
                  <g clipPath={`url(#${gid}c)`}>{fasc.map((f, k) => <path key={k} d={f} stroke="rgba(255,210,220,0.7)" strokeWidth={1.1} fill="none" />)}</g>
                </g>
              )}
            </g>
          );
        })}
        <g opacity={coatOp}>
          <ellipse cx={-6 + sh.x} cy={-70 + sh.y} rx={92} ry={26} fill="#5E6B84" opacity={0.35} filter={`url(#${ids.blur})`} />
          <ellipse cx={-8 + sh.x} cy={-112 + sh.y} rx={40} ry={18} fill="#FFFFFF" opacity={0.3} filter={`url(#${ids.blur})`} />
          {[-28, -14, 0, 14].map((x, k) => <path key={k} d={open([pt(x + sh.x, -124 + sh.y), pt(x - 3 + sh.x, -102 + sh.y), pt(x - 2 + sh.x, -82 + sh.y)])} stroke="#6E7B92" strokeWidth={3} fill="none" opacity={0.18} filter={`url(#${ids.blur})`} />)}
          {mottle}
          {tick}
        </g>
        {Object.values(CR).map((pl, i) => {
          const pts = pl.map(([x, y]) => add(pt(x, y), sh));
          return (
            <g key={`c${i}`}>
              <path d={open(pts)} stroke="#3A4560" strokeWidth={7} fill="none" opacity={0.45 * coatOp} strokeLinecap="round" filter={`url(#${ids.blur})`} />
              <path d={open(pts)} stroke="#FFFFFF" strokeWidth={1.6} fill="none" opacity={0.5 * coatOp} transform="translate(1.8 1.5)" strokeLinecap="round" />
              <path d={open(pts)} stroke={anat > 0.5 ? 'rgba(255,220,228,0.9)' : '#2A3246'} strokeWidth={1.3} fill="none" opacity={anat > 0.5 ? 0.85 : 0.6} strokeLinecap="round" />
            </g>
          );
        })}
        <path d={open([pt(27 + b.x, -152), pt(-12 + b.x, -154), pt(-49 + b.x, -153), pt(-77 + b.x, -150)])} stroke={COAT.shade} strokeWidth={2.2} fill="none" opacity={0.5 * coatOp} />
        <path d={open([T(add(fl.top, pt(-5, 0))), T(add(fl.top, pt(-2, 16)))])} stroke={COAT.deep} strokeWidth={1.7} fill="none" opacity={0.55 * coatOp} />
        <path d={open([T(pt(-78, -72)), T(pt(-82, -56)), T(pt(-84, -44))])} stroke={COAT.deep} strokeWidth={1.7} fill="none" opacity={0.55 * coatOp} />
      </g>
      <Hoof p={T(pt(-80, 0))} />
      <Hoof p={T(fl.hoof)} ang={-28 * fl.lift} />
      <g transform={`rotate(${b.headNod * 0.8} ${94 + b.x} -100) translate(${120 + H0.x} ${-130 + H0.y}) scale(1.22) translate(${-(120 + H0.x)} ${-(-130 + H0.y)})`} opacity={1 - 0.75 * anat}>
        <path d={head} fill={COAT.white} stroke={COAT.ink} strokeWidth={1.1} strokeLinejoin="round" />
        <path d={closed([hp(118, -102), hp(132, -84), hp(150, -68), hp(136, -70), hp(124, -82)], 0.8)} fill={COAT.base} opacity={0.9} />
        <ellipse cx={130 + H0.x} cy={-92 + H0.y} rx={11} ry={13} fill={COAT.shade} opacity={0.3} />
        {Array.from({length: 60}, (_, i) => <circle key={i} cx={116 + hash(i * 3.3) * 40 + H0.x} cy={-142 + hash(i * 7.1) * 64 + H0.y} r={0.4 + hash(i) * 0.7} fill={hash(i * 2.2) > 0.5 ? COAT.roanDk : COAT.roan} opacity={0.4} />)}
        <path d={closed([hp(152, -106), hp(165, -97), hp(172, -86), hp(172, -71), hp(164, -63), hp(150, -64), hp(147, -80)], 0.8)} fill="#B99894" stroke={COAT.ink} strokeWidth={0.8} />
        <path d={`M${163 + H0.x} ${-88 + H0.y} q6 0 7 6 q-4 3 -8 0 Z`} fill="#3A2224" />
        <path d={open([hp(152, -70), hp(166, -70)])} stroke="#6A4A4A" strokeWidth={1.1} />
        <ellipse cx={136 + H0.x} cy={-124 + H0.y} rx={4.8} ry={3.8} fill={COAT.roanDk} opacity={0.9} />
        <ellipse cx={136.6 + H0.x} cy={-124 + H0.y} rx={2.3} ry={2.0} fill="#140F0D" />
        <circle cx={135.8 + H0.x} cy={-124.8 + H0.y} r={0.7} fill="#FFFFFF" />
        <path d={open([hp(131, -128), hp(136, -129.8), hp(141.5, -127.6)])} stroke={COAT.ink} strokeWidth={0.9} fill="none" />
        <path d={closed([hp(122, -134), hp(100, -142), hp(90, -138), hp(98, -130), hp(118, -126)], 0.8)} fill={COAT.base} stroke={COAT.ink} strokeWidth={0.9} />
        <path d={closed([hp(118, -132), hp(100, -138), hp(95, -136), hp(112, -128)], 0.8)} fill="#E6C4C0" opacity={0.9} />
        <path d={`M${121 + H0.x} ${-138 + H0.y} q2 -12 14 -16 q2 0 2 2 q-8 4 -10 15 Z`} fill="#EDE2C8" stroke={COAT.ink} strokeWidth={0.7} />
        <path d={`M${135 + H0.x} ${-154 + H0.y} q2 0 2 2 l-3 1 Z`} fill="#4A4032" />
        <path d={closed([hp(122, -140), hp(130, -146), hp(140, -142), hp(136, -136), hp(128, -134)], 0.8)} fill="#3E4860" opacity={0.85} />
        <path d={open([hp(118, -142), hp(126, -146), hp(134, -144)])} stroke={COAT.roanDk} strokeWidth={2.4} fill="none" opacity={0.55} strokeLinecap="round" />
      </g>
    </g>
  );
};

/** the pasture: warm sky, low sun, far hills, a post-and-rail fence behind, grass */
export const PastureSky: React.FC = () => {
  const id = uid('sky'), id2 = uid('sun');
  return (
    <g>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset={0} stopColor="#5E8FC9" />
          <stop offset={0.55} stopColor="#A8C4DA" />
          <stop offset={1} stopColor="#F6D7A6" />
        </linearGradient>
        <radialGradient id={id2}>
          <stop offset={0} stopColor="#FFF4D6" stopOpacity={1} />
          <stop offset={0.3} stopColor="#FFE0A0" stopOpacity={0.6} />
          <stop offset={1} stopColor="#FFE0A0" stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect x={-2000} y={-1800} width={4000} height={1800} fill={`url(#${id})`} />
      <circle cx={-520} cy={-520} r={420} fill={`url(#${id2})`} />
      {[[-900, -260, 700, 150, '#7FA38E'], [-100, -230, 900, 130, '#6F967E'], [700, -250, 800, 160, '#7AA089']].map(([x, y, rx, ry, c], i) => (
        <ellipse key={i} cx={x as number} cy={(y as number) + 200} rx={rx as number} ry={ry as number} fill={c as string} />
      ))}
      <rect x={-2000} y={-70} width={4000} height={2000} fill="#557D5F" />
      {Array.from({length: 9}, (_, i) => {
        const x = -900 + i * 230 + hash(i) * 80;
        return <ellipse key={i} cx={x} cy={-90 - hash(i * 3) * 30} rx={40 + hash(i * 7) * 30} ry={32 + hash(i * 2) * 20} fill="#557D5F" opacity={0.9} />;
      })}
    </g>
  );
};
export const Fence: React.FC = () => (
  <g>
    {Array.from({length: 12}, (_, i) => {
      const x = -700 + i * 130;
      return <rect key={i} x={x} y={-120} width={8} height={120} fill="#7A5A3E" stroke="#3C2A1C" strokeWidth={1} />;
    })}
    {[-108, -70].map((y, k) => <rect key={k} x={-720} y={y} width={1600} height={7} fill="#8B6A4A" stroke="#3C2A1C" strokeWidth={0.8} />)}
  </g>
);
export const Grass: React.FC = () => {
  const id = uid('gr');
  return (
    <g>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset={0} stopColor="#6E9A4E" />
          <stop offset={1} stopColor="#3D6430" />
        </linearGradient>
      </defs>
      <rect x={-2000} y={-6} width={4000} height={900} fill={`url(#${id})`} />
      {Array.from({length: 140}, (_, i) => {
        const x = -600 + hash(i * 1.7) * 1200, y = -4 + hash(i * 3.1) * 60;
        const h = 6 + hash(i * 5.3) * 10;
        return <path key={i} d={`M${x} ${y} l${-2 + hash(i) * 1.5} ${-h} M${x + 2} ${y} l${1 + hash(i * 2) * 2} ${-h * 0.8}`} stroke={hash(i * 9) > 0.5 ? '#8DBA62' : '#4E7A3A'} strokeWidth={1.4} />;
      })}
    </g>
  );
};
export const Dust: React.FC<{p: P; a: number}> = ({p, a}) => {
  if (a <= 0 || a >= 1) return null;
  return (
    <g>
      {Array.from({length: 9}, (_, i) => {
        const dx = (i - 4) * 4 * (0.4 + a), dy = -3 - hash(i) * 8 * a;
        return <circle key={i} cx={p.x + dx * 1.8} cy={p.y + dy} r={3 + 6 * a * (0.6 + hash(i * 3))} fill="#CDB892" opacity={0.45 * (1 - a)} />;
      })}
    </g>
  );
};
void mix;
