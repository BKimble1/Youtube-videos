// The Belgian Blue bull in a late-afternoon pasture, side view facing right (cm, ground at y = 0). The body is one
// silhouette from a point list. A matching point list gives an ordinary bovine of the same frame and pose, used only for
// the comparison overlay: the region between the two outlines (an even-odd fill of both) is exactly the extra muscle.
// The bull itself never changes shape. Its near foreleg can take one heavy step that loads the shoulder.
import React from 'react';
import {P, add, closed, lerpP, mul, nrm, open, pt, rot, sub} from '../core/geo';
import {mix} from '../core/color';
import {uid} from '../core/ids';
import {clamp, hash, lerp, ring, ss} from '../lib';

// body outline, from the neck crest back along the top line, round the rump, along the belly and up the chest.
// region tags: s shoulder, b back, h hindquarters, - shared
type K = [number, number, number, number, string];
const BODY: K[] = [
  // x(BB), y(BB), x(normal), y(normal), region — from the neck crest back along the top line, round the rump, along
  // the belly, down the chest and up the throat to the jaw
  [78, -151, 78, -144, 's'],
  [54, -156, 52, -146, 's'],
  [30, -150, 30, -144, 's'],
  [10, -150, 10, -142, 'b'],
  [-14, -156, -14, -142, 'b'],
  [-40, -158, -40, -143, 'b'],
  [-64, -155, -64, -144, 'b'],
  [-84, -157, -84, -145, 'h'],
  [-104, -150, -100, -143, 'h'],
  [-118, -149, -108, -139, 'h'],
  [-138, -132, -114, -126, 'h'],
  [-149, -112, -118, -108, 'h'],
  [-145, -97, -118, -96, 'h'],
  [-149, -82, -116, -84, 'h'],
  [-137, -66, -112, -72, 'h'],
  [-127, -52, -106, -60, 'h'],
  [-116, -46, -100, -54, 'h'],
  [-100, -58, -92, -62, 'h'],
  [-80, -68, -78, -68, '-'],
  [-48, -64, -48, -67, '-'],
  [-16, -60, -16, -64, '-'],
  [16, -60, 16, -64, 's'],
  [40, -62, 42, -66, 's'],
  [58, -56, 60, -63, 's'],
  [86, -62, 80, -68, 's'],
  [108, -78, 94, -82, 's'],
  [119, -90, 106, -90, 's'],
  [132, -88, 126, -88, '-'],
  [136, -104, 132, -104, '-'],
  [126, -124, 124, -124, '-'],
  [104, -142, 102, -136, 's'],
];
export const bodyPts = (k: number, sh: P = pt(0, 0), wob = 0) =>
  BODY.map(([bx, by, nx, ny, r]) => {
    const p = pt(lerp(nx, bx, k), lerp(ny, by, k));
    const w = r === 's' ? wob : 0;
    return add(p, pt(sh.x + w * 0.6, sh.y - w * Math.max(0, -(by + 100)) / 50));
  });
export const REGIONS = BODY.map((b) => b[4]);

export type BullState = {
  x: number;          // body shift (the step carries it forward)
  step: number;       // 0..1 near foreleg step
  load: number;       // shoulder loading after the plant (contraction)
  plantT: number;     // time since the plant (s), for the muscle's settle
  breathe: number;    // -1..1
  headNod: number;
  cut?: {r: number};  // hide cutaway on the shoulder
  t: number;
};
export const SHOULDER_CUT: P = pt(70, -108);

const COAT = {white: '#F4F3EE', cool: '#D3D9E3', shade: '#9AA6B8', deep: '#6F7C90', roan: '#7D8BA0', roanDk: '#4E5B72', ink: '#252C3B', muzzle: '#2F3646'};

const leg = (pts: P[], r: number[], fill: string, stroke: string, key: string) => {
  const n = pts.length;
  const T = pts.map((_, i) => nrm(sub(pts[Math.min(n - 1, i + 1)], pts[Math.max(0, i - 1)])));
  const N = T.map((x) => rot(x, Math.PI / 2));
  const L = pts.map((p, i) => add(p, mul(N[i], r[i]))), R = pts.map((p, i) => add(p, mul(N[i], -r[i])));
  return <path key={key} d={closed([...L, ...R.reverse()], 0.75)} fill={fill} stroke={stroke} strokeWidth={0.9} strokeLinejoin="round" />;
};
const Hoof: React.FC<{p: P; ang?: number; dark?: boolean}> = ({p, ang = 0, dark}) => (
  <g transform={`translate(${p.x} ${p.y}) rotate(${ang})`}>
    <path d="M-6.2 -7 L5.4 -7 L8.4 0 L-7 0 Z" fill={dark ? '#1A1E28' : '#2B303C'} stroke={COAT.ink} strokeWidth={0.8} strokeLinejoin="round" />
    <path d="M0.8 -7 L1.4 0" stroke="#4A5160" strokeWidth={0.7} />
  </g>
);

/** one heavy step: the knee folds forward and up, the hoof swings and plants about 24 cm ahead */
const foreleg = (base: P, step: number) => {
  const lift = Math.sin(Math.PI * clamp(step));
  const fwd = 24 * ss(step, 0.05, 0.95);
  const top = pt(base.x + fwd * 0.25, -76);
  const knee = pt(base.x + 2 + fwd * 0.55 + 9 * lift, -38 - 10 * lift);
  const fet = pt(base.x + 3 + fwd * 0.9 - 2 * lift, -11 - 16 * lift);
  const hoof = pt(base.x + 5 + fwd, -16 * lift);
  return {top, knee, fet, hoof, lift};
};

export const Bull: React.FC<{b: BullState}> = ({b}) => {
  const sh = pt(b.x, 0);
  const wob = b.load * 2.2 + ring(b.plantT, 0, 7, 0.12) * 1.6 * (b.plantT > 0 ? 1 : 0);
  const body = bodyPts(1, pt(b.x, b.breathe * 0.6), wob);
  const d = closed(body, 0.8);
  const idB = uid('bb'), idC = uid('bc'), idR = uid('br'), idHl = uid('bh'), idBl = uid('bl'), idL = uid('blg');
  const fl = foreleg(pt(72, 0), b.step);
  const T = (p: P) => add(p, sh);
  const cut = b.cut && b.cut.r > 0.05 ? b.cut : undefined;
  const cc = T(SHOULDER_CUT);
  const sl = b.load;
  const tube = (pts: P[], r: number[]) => {
    const n = pts.length;
    const Tn = pts.map((_, i) => nrm(sub(pts[Math.min(n - 1, i + 1)], pts[Math.max(0, i - 1)])));
    const N = Tn.map((x) => rot(x, Math.PI / 2));
    return closed([...pts.map((p, i) => add(p, mul(N[i], r[i]))), ...[...pts].reverse().map((p, i) => add(p, mul(N[n - 1 - i], -r[n - 1 - i])))], 0.75);
  };
  const nearFore = tube([T(add(fl.top, pt(0, -8))), T(fl.top), T(lerpP(fl.top, fl.knee, 0.5)), T(fl.knee), T(fl.fet)], [17, 17 + sl, 14 + sl, 6, 4.8]);
  const nearHind = tube([T(pt(-104, -80)), T(pt(-106, -60)), T(pt(-108, -40)), T(pt(-100, -11))], [21, 17, 6.2, 4.8]);
  const farFore = tube([T(pt(48, -82)), T(pt(48, -58)), T(pt(48, -36)), T(pt(48, -11))], [15, 12, 5.4, 4.4]);
  const farHind = tube([T(pt(-80, -82)), T(pt(-86, -60)), T(pt(-88, -40)), T(pt(-82, -11))], [19, 15, 5.8, 4.4]);
  // the head: broad forehead, a straight face to a square dark muzzle, a deep jaw
  const H0 = pt(b.x + 8, b.breathe * 0.4 + b.headNod + 20);
  const hp = (x: number, y: number) => add(pt(x, y), H0);
  const head = closed([hp(122, -136), hp(136, -140), hp(150, -132), hp(164, -112), hp(176, -94), hp(178, -80), hp(170, -72), hp(154, -72), hp(138, -80), hp(126, -96), hp(122, -116)], 0.8);
  // blue roan: soft clouds and fine speckles, densest on the neck, shoulder and round
  const clouds: [number, number, number, number][] = [[86, -124, 26, 22], [44, -104, 20, 28], [-114, -104, 22, 34], [-60, -116, 26, 18], [-6, -132, 22, 12], [108, -104, 14, 18]];
  const dens = (x: number) => 0.3 + 0.7 * Math.max(Math.exp(-(((x - 84) / 40) ** 2)), Math.exp(-(((x + 112) / 30) ** 2)));
  const speck: React.ReactNode[] = [];
  for (let i = 0; i < 560; i++) {
    const x = -142 + hash(i * 9.7) * 270, y = -158 + hash(i * 2.3) * 100;
    if (hash(i * 6.1) > dens(x)) continue;
    speck.push(<ellipse key={i} cx={x + b.x} cy={y} rx={0.7 + hash(i * 4.4) * 1.5} ry={0.5 + hash(i * 3.4) * 0.9} fill={hash(i * 7.2) > 0.6 ? COAT.roanDk : COAT.roan} opacity={0.55} />);
  }
  // muscle forms: a soft cel shadow under each bulging mass and a highlight on top of it
  const forms: [P[], number][] = [
    [[pt(44, -148), pt(36, -124), pt(40, -98), pt(48, -70)], 1],      // behind the shoulder (triceps)
    [[pt(92, -136), pt(102, -116), pt(106, -94)], 0.8],               // front of the shoulder
    [[pt(62, -134), pt(68, -110), pt(64, -86)], 0.8],                 // between the shoulder heads
    [[pt(22, -142), pt(-18, -145), pt(-62, -145)], 0.7],              // the loin's lower edge
    [[pt(-72, -152), pt(-80, -122), pt(-86, -92), pt(-88, -72)], 1],  // the hip to the stifle
    [[pt(-106, -152), pt(-116, -120), pt(-120, -90), pt(-114, -60)], 1.1], // the deep crease of the round
    [[pt(-92, -150), pt(-100, -120), pt(-102, -90)], 0.7],
    [[pt(110, -134), pt(116, -112), pt(118, -100)], 0.6],             // neck into the shoulder
  ];
  const hl: [number, number, number, number][] = [[70, -116, 18, 24], [-24, -152, 38, 6], [-94, -122, 14, 26], [-128, -106, 9, 24], [4, -128, 22, 10], [90, -96, 8, 14], [100, -138, 14, 7]];
  return (
    <g>
      <defs>
        <linearGradient id={idB} x1="0" y1="0" x2="0.12" y2="1">
          <stop offset={0} stopColor={COAT.white} />
          <stop offset={0.55} stopColor={COAT.cool} />
          <stop offset={1} stopColor={COAT.shade} />
        </linearGradient>
        <linearGradient id={idL} x1="0" y1="0" x2="0" y2="1">
          <stop offset={0} stopColor={COAT.cool} />
          <stop offset={1} stopColor={COAT.shade} />
        </linearGradient>
        <clipPath id={idC}>
          <path d={d} />
          <path d={nearFore} />
          <path d={nearHind} />
        </clipPath>
        <radialGradient id={idHl}>
          <stop offset={0} stopColor="#FFFFFF" stopOpacity={0.9} />
          <stop offset={1} stopColor="#FFFFFF" stopOpacity={0} />
        </radialGradient>
        <radialGradient id={idR} cx="0.5" cy="0.5" r="0.5">
          <stop offset={0} stopColor="#000000" stopOpacity={0.32} />
          <stop offset={1} stopColor="#000000" stopOpacity={0} />
        </radialGradient>
        <filter id={idBl} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={2.2} />
        </filter>
      </defs>
      <ellipse cx={-4 + b.x} cy={1} rx={150} ry={9} fill={`url(#${idR})`} />
      {/* far legs, in shade */}
      <path d={farFore} fill={COAT.shade} stroke={COAT.ink} strokeWidth={0.9} />
      <Hoof p={T(pt(50, 0))} dark />
      <path d={farHind} fill={COAT.shade} stroke={COAT.ink} strokeWidth={0.9} />
      <Hoof p={T(pt(-80, 0))} dark />
      {/* tail, set high */}
      <path d={open([T(pt(-114, -146)), T(pt(-128, -116)), T(pt(-131, -74)), T(pt(-130, -44))])} stroke={COAT.shade} strokeWidth={3} fill="none" strokeLinecap="round" />
      <path d={`M${-134 + b.x} -46 q4 -8 8 0 q-1 10 -4 12 q-4 -3 -4 -12Z`} fill={COAT.roanDk} />
      {/* one outline round body and near legs: strokes under, fills over */}
      <path d={d} fill={COAT.ink} stroke={COAT.ink} strokeWidth={2.2} strokeLinejoin="round" />
      <path d={nearFore} fill={COAT.ink} stroke={COAT.ink} strokeWidth={2.2} />
      <path d={nearHind} fill={COAT.ink} stroke={COAT.ink} strokeWidth={2.2} />
      <path d={nearFore} fill={`url(#${idL})`} />
      <path d={nearHind} fill={`url(#${idL})`} />
      <path d={d} fill={`url(#${idB})`} />
      <g clipPath={`url(#${idC})`}>
        {clouds.map(([x, y, rx, ry], i) => <ellipse key={i} cx={x + b.x} cy={y} rx={rx} ry={ry} fill={COAT.roan} opacity={0.3} />)}
        {speck}
        <rect x={-150 + b.x} y={-84} width={300} height={34} fill={COAT.shade} opacity={0.4} />
        <g filter={`url(#${idBl})`}>
          {forms.map(([g, k], i) => <path key={i} d={open(g.map((p) => add(p, pt(b.x + (i < 3 ? 0.8 * sl : 0), 0))))} stroke={COAT.deep} strokeWidth={(6 + (i < 3 ? 3 * sl : 0)) * k} fill="none" opacity={0.55} strokeLinecap="round" />)}
          {hl.map(([x, y, rx, ry], i) => (
            <ellipse key={i} cx={x + b.x + (i === 0 ? 1.5 * sl : 0)} cy={y - (i === 0 ? 1.5 * sl : 0)} rx={rx * (i === 0 ? 1 - 0.1 * sl : 1)} ry={ry * (i === 0 ? 1 + 0.08 * sl : 1)} fill="#FFFFFF" opacity={0.42 + (i === 0 ? 0.25 * sl : 0)} />
          ))}
        </g>
        {forms.map(([g], i) => <path key={i} d={open(g.map((p) => add(p, pt(b.x + (i < 3 ? 0.8 * sl : 0), 0))))} stroke={COAT.deep} strokeWidth={1.1} fill="none" opacity={0.5} strokeLinecap="round" />)}
        {/* the spine's groove between the two loin bulges, just under the top line */}
        <path d={open([pt(34 + b.x, -150), pt(-14 + b.x, -152), pt(-64 + b.x, -152), pt(-102 + b.x, -150)])} stroke={COAT.shade} strokeWidth={2.2} fill="none" opacity={0.5} />
        {/* forearm and gaskin muscle edges */}
        <path d={open([T(add(fl.top, pt(-4, 2))), T(lerpP(fl.top, fl.knee, 0.6))])} stroke={COAT.deep} strokeWidth={1.6} fill="none" opacity={0.55} />
        <path d={open([T(pt(-98, -78)), T(pt(-104, -56)), T(pt(-108, -44))])} stroke={COAT.deep} strokeWidth={1.6} fill="none" opacity={0.55} />
      </g>
      <Hoof p={T(pt(-100, 0))} />
      <Hoof p={T(fl.hoof)} ang={-28 * fl.lift} />
      {/* head, in front of the chest */}
      <g transform={`rotate(${10 + b.headNod * 0.8} ${130 + b.x} -100)`}>
        <path d={head} fill={COAT.white} stroke={COAT.ink} strokeWidth={1.1} strokeLinejoin="round" />
        <path d={closed([hp(128, -98), hp(142, -84), hp(156, -76), hp(140, -76), hp(128, -88)], 0.8)} fill={COAT.cool} opacity={0.85} />
        <path d={closed([hp(160, -112), hp(174, -98), hp(179, -84), hp(172, -72), hp(158, -74), hp(156, -94)], 0.8)} fill={COAT.muzzle} />
        <path d={`M${172 + H0.x} ${-92 + H0.y} q4 1 4 5 q-3 2 -6 0 Z`} fill="#0B0D12" />
        <path d={open([hp(160, -76), hp(171, -77)])} stroke="#151820" strokeWidth={1} />
        {Array.from({length: 50}, (_, i) => <circle key={i} cx={126 + hash(i * 3.3) * 34 + H0.x} cy={-136 + hash(i * 7.1) * 44 + H0.y} r={0.6 + hash(i) * 0.9} fill={COAT.roan} opacity={0.55} />)}
        <ellipse cx={142 + H0.x} cy={-121 + H0.y} rx={5.4} ry={4.2} fill={COAT.roanDk} opacity={0.85} />
        <ellipse cx={142.6 + H0.x} cy={-121 + H0.y} rx={2.5} ry={2.1} fill="#120E0C" />
        <circle cx={141.8 + H0.x} cy={-121.8 + H0.y} r={0.7} fill="#FFFFFF" />
        <path d={open([hp(137, -125.5), hp(142, -127), hp(147, -125)])} stroke={COAT.ink} strokeWidth={0.9} fill="none" />
        {/* ear out to the side, under a short horn */}
        <path d={closed([hp(132, -132), hp(116, -142), hp(108, -142), hp(112, -134), hp(126, -126)], 0.8)} fill={COAT.cool} stroke={COAT.ink} strokeWidth={0.9} />
        <path d={closed([hp(128, -131), hp(116, -139), hp(112, -138), hp(124, -128)], 0.8)} fill={COAT.roanDk} opacity={0.7} />
        <path d={`M${128 + H0.x} ${-138 + H0.y} q3 -8 10 -9 q-2 4 -3 9 Z`} fill="#E8DCC0" stroke={COAT.ink} strokeWidth={0.7} />
      </g>
      {/* hide cutaway on the shoulder: hide, a thin fat layer, then muscle */}
      {cut && (
        <g clipPath={`url(#${idC})`}>
          <circle cx={cc.x} cy={cc.y} r={cut.r + 1.6} fill="#E7E2D8" stroke={COAT.ink} strokeWidth={0.5} />
          <circle cx={cc.x} cy={cc.y} r={cut.r + 0.9} fill="#F0D79A" />
          <circle cx={cc.x} cy={cc.y} r={cut.r + 0.3} fill="#F3ECEE" />
        </g>
      )}
    </g>
  );
};

/** the comparison overlay: an ordinary bovine silhouette in registration, and the extra muscle between the outlines */
export const Compare: React.FC<{b: BullState; draw: number; glow: Record<string, number>; fade: number}> = ({b, draw, glow, fade}) => {
  if (fade <= 0.001) return null;
  const bb = closed(bodyPts(1, pt(b.x, b.breathe * 0.6)), 0.8);
  const nd = closed(bodyPts(0, pt(b.x, b.breathe * 0.6)), 0.8);
  const idG = uid('cg');
  // shoulder (front), back (middle, above the belly), hindquarters (rear): clip bands over the even-odd difference
  const bands: Record<string, [number, number, number, number]> = {s: [22, -170, 140, 130], b: [-66, -170, 88, 40], h: [-170, -170, 104, 140]};
  return (
    <g opacity={fade}>
      <defs>
        <filter id={idG} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={1.6} />
        </filter>
        {Object.entries(bands).map(([r, [x, y, w_, h]]) => (
          <clipPath key={r} id={`${idG}${r}`}>
            <rect x={x + b.x} y={y} width={w_} height={h} />
          </clipPath>
        ))}
      </defs>
      {Object.keys(bands).map((r) => (
        <g key={r} clipPath={`url(#${idG}${r})`} opacity={glow[r] ?? 0}>
          <path d={`${bb} ${nd}`} fillRule="evenodd" fill="#FFB43C" opacity={0.62} />
          <path d={bb} fill="none" stroke="#FFE7A8" strokeWidth={1.8} />
        </g>
      ))}
      <path d={nd} fill="none" stroke="#FFFFFF" strokeWidth={3.4} opacity={0.4} filter={`url(#${idG})`} strokeDasharray={`${draw * 1000} 1000`} />
      <path d={nd} fill="none" stroke="#FFFFFF" strokeWidth={1.4} strokeDasharray={`${draw * 1000} 1000`} strokeLinecap="round" />
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
