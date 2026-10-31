// V6 cow (units cm, y down, ground at y = 0, facing screen right). One body whose muscle grows with mu (0 an ordinary
// beef animal .. 1 a Belgian Blue type physique): the shoulder thickens, the hindquarters broaden and round out, the
// neck crest thickens; the belly line, head, skeleton, hooves and ground contact stay where they are. Matte, organic
// shading: soft forms and soft separations under the coat, no hard highlights or plated contours.
import React from 'react';
import {P, add, closed, mul, nrm, open, pt, rot, sub} from '../core/geo';
import {mix} from '../core/color';
import {uid} from '../core/ids';
import {clamp, hash, lerp, ss} from '../lib';

export type CowState = {
  mu: number;        // muscle 0..1
  bx: number;        // body shift along the ground (weight shift and the step)
  by: number;        // body settle (down +)
  step: number;      // 0..1 progress of the near foreleg's step
  stepDx: number;    // how far that hoof moves forward
  head: number;      // head pitch (deg, + = nose down)
  tail: number;      // tail swing -1..1
  breathe: number;
  t: number;
};
const COAT = {top: '#EEF1F5', base: '#D7DDE6', shade: '#A5B0C1', deep: '#76839A', ink: '#262D3D', roan: '#8C99AE', roanDk: '#4E5A72', patch: '#414B62'};

// body outline, lean and muscular (same point count; blended by mu). Clockwise from the withers along the back.
const LEAN: [number, number][] = [
  [44, -150], [14, -147], [-22, -146], [-56, -147], [-84, -150], [-102, -147], [-114, -140], [-120, -124], [-121, -104], [-116, -86], [-108, -72],
  [-92, -70], [-60, -67], [-22, -65], [16, -66], [44, -70], [66, -76], [84, -90], [98, -106], [108, -120], [100, -136], [78, -147],
];
const BULK: [number, number][] = [
  [48, -166], [16, -151], [-22, -150], [-56, -153], [-90, -164], [-116, -160], [-138, -147], [-154, -126], [-158, -100], [-150, -75], [-126, -60],
  [-96, -68], [-60, -67], [-22, -65], [16, -66], [48, -73], [80, -74], [104, -90], [118, -108], [125, -124], [114, -151], [86, -166],
];
const blendPts = (mu: number) => LEAN.map(([x, y], i) => pt(lerp(x, BULK[i][0], mu), lerp(y, BULK[i][1], mu)));

const tube = (pts: P[], r: number[]) => {
  const n = pts.length;
  const Tn = pts.map((_, i) => nrm(sub(pts[Math.min(n - 1, i + 1)], pts[Math.max(0, i - 1)])));
  const N = Tn.map((x) => rot(x, Math.PI / 2));
  return closed([...pts.map((p, i) => add(p, mul(N[i], r[i]))), ...[...pts].reverse().map((p, i) => add(p, mul(N[n - 1 - i], -r[n - 1 - i])))], 0.75);
};
const Hoof: React.FC<{p: P; ang?: number; dark?: boolean}> = ({p, ang = 0, dark}) => (
  <g transform={`translate(${p.x} ${p.y}) rotate(${ang})`}>
    <path d="M-6 -7 L5.6 -7 L8.6 0 L-6.8 0 Z" fill={dark ? '#1A1E28' : '#2E3340'} stroke={COAT.ink} strokeWidth={0.8} strokeLinejoin="round" />
    <path d="M1.2 -6.6 L1.9 0" stroke="#0E1016" strokeWidth={1} />
  </g>
);
/** a point on the outline (for camera matches) */
export const cowContour = (mu: number, i: number) => blendPts(mu)[i];
export const COW_SHOULDER_TOP = 0; // outline index at the withers

export const Cow: React.FC<{c: CowState}> = ({c}) => {
  const mu = clamp(c.mu);
  const B = (p: P) => pt(p.x + c.bx, p.y + c.by + 0.4 * c.breathe);
  const body = closed(blendPts(mu).map(B), 0.85);
  const ids = {coat: uid('cc'), clip: uid('ck'), blur: uid('cb'), sh: uid('cs'), leg: uid('cl'), soft: uid('cf')};
  // legs: tops ride with the body, hooves stay planted (the near fore steps once)
  const sx = c.stepDx * ss(c.step, 0.05, 0.95), lift = 11 * Math.sin(Math.PI * clamp(c.step));
  const leg = (top: P, hoofX: number, kneeY: number, r: number[], lifted = 0, dx = 0) => {
    const T = B(top);
    const hoof = pt(hoofX + dx, -lifted);
    const knee = pt(lerp(T.x, hoof.x, 0.55) + 3 * lifted / 11, kneeY - 0.6 * lifted);
    const fet = pt(hoof.x - 1 + 1.5 * lifted / 11, -11 - lifted);
    return {d: tube([pt(T.x, T.y - 10), T, pt(lerp(T.x, knee.x, 0.5), lerp(T.y, knee.y, 0.5)), knee, fet], r), hoof};
  };
  const mR = (a: number, b: number) => a + b * mu;
  const nearFore = leg(pt(52, -84), 58, -38, [mR(17, 8), mR(16, 8), mR(11, 4), 6.2, 4.6], lift, sx);
  const farFore = leg(pt(38, -86), 42, -38, [mR(14, 4), mR(13, 4), mR(9, 2), 5.4, 4.2]);
  const nearHind = leg(pt(-90, -84), -78, -40, [mR(21, 11), mR(17, 9), mR(11, 4), 6.0, 4.6]);
  const farHind = leg(pt(-74, -86), -62, -40, [mR(18, 6), mR(14, 5), mR(9, 2), 5.4, 4.2]);
  // the head, attached at the neck, pitched about the poll
  const H0 = pt(c.bx + 4 - 34 + 6 * mu, c.by + 0.4 * c.breathe + 14 - 3 * mu);
  const hp = (x: number, y: number) => add(pt(x, y), H0);
  const head = closed([hp(116, -140), hp(128, -144), hp(140, -140), hp(150, -126), hp(158, -108), hp(166, -94), hp(171, -84), hp(171, -72), hp(164, -64), hp(150, -64), hp(136, -70), hp(124, -82), hp(116, -100), hp(113, -120)], 0.85);
  const S = (x: number, y: number) => B(pt(x, y));
  // soft muscle separations (only as the muscle develops) and broad matte form shading
  const crease = (pts: [number, number][], w: number, op: number, k: string) => (
    <path key={k} d={open(pts.map(([x, y]) => S(x, y)))} stroke={COAT.deep} strokeWidth={w} fill="none" strokeLinecap="round" opacity={op} filter={`url(#${ids.blur})`} />
  );
  const tailBase = S(lerp(-118, -126, mu), lerp(-141, -146, mu));
  const tailTip = add(tailBase, pt(-6 + 8 * c.tail, 92));
  const tailMid = add(tailBase, pt(-10 + 4 * c.tail, 46));
  const ticks: React.ReactNode[] = [];
  for (let i = 0; i < 320; i++) {
    const x = -130 + hash(i * 9.7) * 245, y = -158 + hash(i * 2.3) * 88;
    ticks.push(<circle key={i} cx={x + c.bx} cy={y + c.by} r={0.4 + hash(i * 4.4) * 0.5} fill={hash(i * 3.7) > 0.5 ? COAT.roanDk : COAT.roan} opacity={0.3} />);
  }
  return (
    <g>
      <defs>
        <linearGradient id={ids.coat} x1="0" y1="0" x2="0" y2="1">
          <stop offset={0} stopColor={COAT.top} />
          <stop offset={0.5} stopColor={COAT.base} />
          <stop offset={1} stopColor={COAT.shade} />
        </linearGradient>
        <linearGradient id={ids.leg} x1="0" y1="0" x2="0" y2="1">
          <stop offset={0} stopColor={COAT.base} />
          <stop offset={1} stopColor={COAT.shade} />
        </linearGradient>
        <clipPath id={ids.clip}><path d={body} /><path d={nearFore.d} /><path d={nearHind.d} /></clipPath>
        <filter id={ids.blur} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation={3.4} /></filter>
        <filter id={ids.soft} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation={9} /></filter>
        <radialGradient id={ids.sh} cx="0.5" cy="0.5" r="0.5">
          <stop offset={0} stopColor="#000000" stopOpacity={0.3} />
          <stop offset={1} stopColor="#000000" stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={-10 + c.bx * 0.6} cy={1} rx={150} ry={9} fill={`url(#${ids.sh})`} />
      {/* far legs */}
      <path d={farFore.d} fill={mix(COAT.shade, '#55617A', 0.3)} stroke={COAT.ink} strokeWidth={0.9} />
      <path d={farHind.d} fill={mix(COAT.shade, '#55617A', 0.3)} stroke={COAT.ink} strokeWidth={0.9} />
      <Hoof p={farFore.hoof} dark />
      <Hoof p={farHind.hoof} dark />
      {/* tail */}
      <path d={`M${tailBase.x} ${tailBase.y} Q${tailMid.x - 4} ${tailMid.y} ${tailTip.x} ${tailTip.y}`} stroke={COAT.ink} strokeWidth={4.4} fill="none" strokeLinecap="round" />
      <path d={`M${tailBase.x} ${tailBase.y} Q${tailMid.x - 4} ${tailMid.y} ${tailTip.x} ${tailTip.y}`} stroke={COAT.shade} strokeWidth={2.6} fill="none" strokeLinecap="round" />
      <path d={`M${tailTip.x - 3} ${tailTip.y - 10} q-2 8 3 14 q4 -6 2 -14 Z`} fill={COAT.roanDk} />
      {/* one outline: strokes under, fills over */}
      {[body, nearFore.d, nearHind.d].map((d, i) => <path key={i} d={d} fill={COAT.ink} stroke={COAT.ink} strokeWidth={2.2} strokeLinejoin="round" />)}
      <path d={nearFore.d} fill={`url(#${ids.leg})`} />
      <path d={nearHind.d} fill={`url(#${ids.leg})`} />
      <path d={body} fill={`url(#${ids.coat})`} />
      <g clipPath={`url(#${ids.clip})`}>
        {/* broad form shading: the underside, and the rounded masses (darker toward their lower edges, matte) */}
        <ellipse cx={-10 + c.bx} cy={-58 + c.by} rx={130} ry={22} fill={COAT.deep} opacity={0.32} filter={`url(#${ids.soft})`} />
        <ellipse cx={S(60, -100).x} cy={S(60, -100).y} rx={26 + 14 * mu} ry={30 + 12 * mu} fill={COAT.shade} opacity={0.14 + 0.4 * mu} filter={`url(#${ids.soft})`} />
        <ellipse cx={S(-104, -104).x} cy={S(-104, -104).y} rx={28 + 18 * mu} ry={34 + 14 * mu} fill={COAT.shade} opacity={0.14 + 0.42 * mu} filter={`url(#${ids.soft})`} />
        <ellipse cx={S(52, -134).x} cy={S(52, -134).y} rx={18 + 8 * mu} ry={12 + 4 * mu} fill="#FFFFFF" opacity={0.18 + 0.12 * mu} filter={`url(#${ids.soft})`} />
        <ellipse cx={S(-98, -138).x} cy={S(-98, -138).y} rx={20 + 10 * mu} ry={12 + 5 * mu} fill="#FFFFFF" opacity={0.18 + 0.12 * mu} filter={`url(#${ids.soft})`} />
        <ellipse cx={S(-30, -130).x} cy={S(-30, -130).y} rx={50} ry={14} fill="#FFFFFF" opacity={0.14} filter={`url(#${ids.soft})`} />
        {/* muscle separations appear as it develops: behind the shoulder, over the forearm, neck to shoulder,
            the hindquarter's rounds, the loin either side of the spine */}
        {crease([[30, -150], [26, -122], [32, -96], [40, -84]], 7.6, (0.1 + 0.5 * mu) * 0.85, 'sh1')}
        {crease([[98, -140], [86, -122], [82, -102], [90, -86]], 6.8, (0.08 + 0.46 * mu) * 0.85, 'sh2')}
        {crease([[42, -100], [62, -95], [80, -88]], 5.7, (0.45 * mu) * 0.85, 'sh3')}
        {crease([[64, -150], [60, -128], [66, -110]], 4.9, (0.36 * mu) * 0.85, 'sh4')}
        {crease([[-66, -150], [-76, -126], [-84, -100], [-86, -80]], 7.6, (0.08 + 0.5 * mu) * 0.85, 'h1')}
        {crease([[-108, -150], [-122, -124], [-126, -96], [-118, -72]], 7.6, (0.5 * mu) * 0.85, 'h2')}
        {crease([[-86, -126], [-102, -118], [-122, -118]], 5.7, (0.4 * mu) * 0.85, 'h3')}
        {crease([[-134, -132], [-144, -108], [-140, -82]], 5.7, (0.4 * mu) * 0.85, 'h4')}
        {crease([[30, -146], [-20, -144], [-64, -146]], 4.9, (0.3 * mu) * 0.85, 'l1')}
        {/* each developed mass: a soft lit top and a darker lower edge (matte) */}
        {mu > 0.01 && (
          <g opacity={mu}>
            <ellipse cx={S(-106, -138).x} cy={S(-106, -138).y} rx={22} ry={10} fill="#FFFFFF" opacity={0.28} filter={`url(#${ids.soft})`} />
            <ellipse cx={S(-138, -110).x} cy={S(-138, -110).y} rx={12} ry={26} fill={COAT.deep} opacity={0.3} filter={`url(#${ids.soft})`} />
            <ellipse cx={S(-100, -88).x} cy={S(-100, -88).y} rx={24} ry={12} fill={COAT.deep} opacity={0.3} filter={`url(#${ids.soft})`} />
            <ellipse cx={S(56, -140).x} cy={S(56, -140).y} rx={20} ry={9} fill="#FFFFFF" opacity={0.28} filter={`url(#${ids.soft})`} />
            <ellipse cx={S(60, -92).x} cy={S(60, -92).y} rx={24} ry={10} fill={COAT.deep} opacity={0.3} filter={`url(#${ids.soft})`} />
            <ellipse cx={S(100, -132).x} cy={S(100, -132).y} rx={10} ry={16} fill={COAT.deep} opacity={0.22} filter={`url(#${ids.soft})`} />
          </g>
        )}
        {/* coat: blue roan ticking, a dark patch at the neck */}
        {ticks}
        <path d={closed([S(84, -156), S(104, -146), S(112, -124), S(104, -110), S(90, -114), S(82, -136)], 0.9)} fill={COAT.patch} opacity={0.75} />
        <path d={closed([S(-132, -98), S(-124, -90), S(-126, -74), S(-136, -76)], 0.9)} fill={COAT.roan} opacity={0.5} />
      </g>
      <Hoof p={nearHind.hoof} />
      <Hoof p={nearFore.hoof} ang={-9 * Math.sin(Math.PI * clamp(c.step))} />
      {/* head */}
      <g transform={`rotate(${c.head} ${94 + c.bx} ${-100 + c.by}) translate(${120 + H0.x} ${-130 + H0.y}) scale(1.22) translate(${-(120 + H0.x)} ${-(-130 + H0.y)})`}>
        <path d={head} fill={COAT.top} stroke={COAT.ink} strokeWidth={1.1} strokeLinejoin="round" />
        <path d={closed([hp(118, -102), hp(132, -84), hp(150, -68), hp(136, -70), hp(124, -82)], 0.8)} fill={COAT.base} opacity={0.9} />
        <ellipse cx={130 + H0.x} cy={-92 + H0.y} rx={11} ry={13} fill={COAT.shade} opacity={0.3} />
        {Array.from({length: 40}, (_, i) => <circle key={i} cx={116 + hash(i * 3.3) * 40 + H0.x} cy={-142 + hash(i * 7.1) * 64 + H0.y} r={0.4 + hash(i) * 0.6} fill={hash(i * 2.2) > 0.5 ? COAT.roanDk : COAT.roan} opacity={0.35} />)}
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
        <path d={closed([hp(122, -140), hp(130, -146), hp(140, -142), hp(136, -136), hp(128, -134)], 0.8)} fill={COAT.patch} opacity={0.85} />
      </g>
    </g>
  );
};

/** the field: a high horizon (little empty sky), far hedges, a fence, grass */
export const Field: React.FC = () => {
  const id = uid('fsky'), id2 = uid('fgr');
  return (
    <g>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset={0} stopColor="#9CC7E8" />
          <stop offset={1} stopColor="#F6E3B8" />
        </linearGradient>
        <linearGradient id={id2} x1="0" y1="0" x2="0" y2="1">
          <stop offset={0} stopColor="#8DB860" />
          <stop offset={1} stopColor="#5E9440" />
        </linearGradient>
      </defs>
      <rect x={-1200} y={-1400} width={2400} height={1200} fill={`url(#${id})`} />
      <path d="M-1200 -318 Q-700 -350 -300 -326 Q100 -306 500 -338 Q900 -360 1200 -330 V0 H-1200 Z" fill="#9DBB7A" />
      <path d="M-1200 -290 Q-800 -312 -400 -294 Q0 -280 400 -302 Q800 -316 1200 -296 V0 H-1200 Z" fill="#86AD62" />
      {Array.from({length: 26}, (_, i) => {
        const x = -1100 + i * 88 + 30 * hash(i * 1.7), r = 18 + 14 * hash(i * 2.9);
        return <ellipse key={i} cx={x} cy={-290 - r * 0.4} rx={r * 1.3} ry={r} fill="#5F8A48" opacity={0.85} />;
      })}
      <rect x={-1200} y={-276} width={2400} height={1500} fill={`url(#${id2})`} />
    </g>
  );
};
export const FieldFence: React.FC = () => (
  <g>
    {Array.from({length: 22}, (_, i) => <rect key={i} x={-1050 + i * 100} y={-104} width={7} height={70} rx={2} fill="#7A5A3E" />)}
    <rect x={-1100} y={-96} width={2200} height={6} rx={3} fill="#8E6A48" />
    <rect x={-1100} y={-66} width={2200} height={6} rx={3} fill="#8E6A48" />
  </g>
);
export const FieldGrass: React.FC = () => (
  <g>
    {Array.from({length: 160}, (_, i) => {
      const x = -700 + hash(i * 5.3) * 1400, y = 4 + hash(i * 2.1) * 160, h = 5 + hash(i * 1.3) * 7;
      return <path key={i} d={`M${x} ${y} l-1.6 ${-h} M${x + 2} ${y} l1 ${-h * 0.9} M${x + 4} ${y} l2.4 ${-h * 0.8}`} stroke="#4E7E34" strokeWidth={1} opacity={0.6} />;
    })}
  </g>
);
