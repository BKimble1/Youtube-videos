// The coyote (units cm, y down, ground at y = 0, facing screen right). Side view. The body is placed by its near
// forepaw's ground point (x, y); the head is placed by its jaw hinge J (body local) and pitch; the neck joins them.
// Four legs with shoulder/elbow/wrist/paw and hip/stifle/hock/paw joints; a bushy tail with a black tip.
// The head (local to J, muzzle along +x) carries the acting: jaw (hinged at J), ears, squint, lip curl, nose wrinkle,
// tongue out, and blood on the lips and tongue. `inMouth` is drawn between the far and near halves of the mouth, so a
// held lizard sits inside the jaws.
import React from 'react';
import {P, add, closed, mul, nrm, open, perp, pt, rot, sub} from '../core/geo';
import {mix} from '../core/color';
import {uid} from '../core/ids';
import {clamp, hash, lerp} from '../lib';

export const CY = {
  ink: '#2A1E1A', back: '#93806B', grizz: '#6C5B4B', tawny: '#C58C55', tawnyLt: '#E0B07A', cream: '#F2E7D3', creamSh: '#CDBDA2',
  shade: '#6E5845', far: '#7C6754', nose: '#1C1816', iris: '#D9A13A', mouth: '#3C0A0F', mouthLt: '#6A1A22', gum: '#B04A55',
  tongue: '#DB7482', tongueDk: '#A84B5A', teeth: '#F7F1E3', tip: '#2B2420',
};
export type CoyoteHead = {
  jaw: number;      // jaw opening (rad)
  ears: number;     // 0 pricked forward .. 1 flat back
  squint: number;   // 0 .. 1 eyes screwed shut
  lip: number;      // upper lip curl 0 .. 1 (bares the teeth)
  wrinkle: number;  // nose wrinkle 0 .. 1
  tongue: number;   // tongue out 0 .. 1
  blood: number;    // blood in the mouth and on the lips 0 .. 1
  look: number;     // pupil -1 .. 1 (forward +)
  shake: number;    // head-shake turn -1 .. 1 (foreshortening)
};
export type CoyoteState = {
  x: number; y: number;  // near forepaw ground point (world)
  dir: number;           // +1 faces screen right, -1 faces screen left (the rig is mirrored about x)
  J: P;                  // jaw hinge, body local
  ang: number;           // head pitch (rad, + = nose down)
  hd: CoyoteHead;
  crouch: number;        // fore body lowered (cm)
  walk: number;          // walk phase (cycles)
  stride: number;        // stride length (cm), 0 = standing
  paw: number;           // near forepaw raised to the muzzle 0..1
  t: number;
};

// ---------------------------------------------------------------- head geometry (local to J)
const UPPER: [number, number][] = [
  [13.4, -2.8], [11, -3.25], [8, -3.75], [5.2, -4.6], [3.2, -5.9], [0.4, -6.7], [-2.8, -6.9], [-5.6, -5.9], [-7.0, -3.4], [-7.5, -0.2],
  [-6.4, 2.4], [-3.8, 3.3], [-1.2, 2.9], [1.0, 1.5], [2.3, 0.6], [5, 0.36], [8.6, 0.06], [11.6, -0.3], [12.9, -0.55], [13.75, -1.25], [13.95, -2.1],
];
const LOWER: [number, number][] = [
  [2.3, 0.62], [5.5, 0.66], [9, 0.56], [11.8, 0.42], [12.7, 0.6], [12.75, 1.15], [12.1, 1.62], [9, 1.95], [5.5, 2.35], [2.2, 2.85], [-0.6, 3.05], [-1.6, 2.6],
];
const P_ = (a: [number, number]) => pt(a[0], a[1]);
const lipLine = (lift: number) => [pt(2.3, 0.6), pt(5, 0.36 - 0.15 * lift), pt(8.6, 0.06 - 0.6 * lift), pt(11.6, -0.3 - 0.95 * lift), pt(12.9, -0.55 - 0.7 * lift)];
const jawTop = () => [pt(2.3, 0.62), pt(5.5, 0.66), pt(9, 0.56), pt(11.8, 0.42), pt(12.7, 0.6)];
export const EYE_C = pt(2.0, -4.15);
export const HEAD_K = 0.94;
/** a point in the mouth (head local) the blood aims at: the palate behind the canines, between the jaws */
export const mouthTarget = (jaw: number) => add(lerpP(pt(10.2, -0.1), rot(pt(10.2, 0.6), jaw), 0.5), pt(-0.6, 0));
const lerpP = (a: P, b: P, u: number) => pt(lerp(a.x, b.x, u), lerp(a.y, b.y, u));

const Tooth: React.FC<{b: P; dir: P; len: number; w: number; sw: number}> = ({b, dir, len, w, sw}) => {
  const d = nrm(dir), n = perp(d);
  const a = add(b, mul(n, w)), c = add(b, mul(n, -w)), tip = add(b, mul(d, len));
  const m = add(b, mul(d, len * 0.55));
  return <path d={`M${a.x} ${a.y} Q${add(m, mul(n, w * 0.8)).x} ${add(m, mul(n, w * 0.8)).y} ${tip.x} ${tip.y} Q${add(m, mul(n, -w * 0.6)).x} ${add(m, mul(n, -w * 0.6)).y} ${c.x} ${c.y} Z`} fill={CY.teeth} stroke={CY.ink} strokeWidth={sw * 0.6} strokeLinejoin="round" />;
};

export const CoyoteHeadDraw: React.FC<{h: CoyoteHead; sw: number; inMouth?: React.ReactNode; part: 'back' | 'front' | 'all'}> = ({h, sw, inMouth, part}) => {
  const ids = {fur: uid('cf'), clip: uid('cc'), jclip: uid('cj'), eye: uid('ce'), mclip: uid('cm')};
  const J = clamp(h.jaw, -0.05, 1.0);
  const lip = clamp(h.lip);
  const R = (q: P) => rot(q, J);
  const lowerPts = LOWER.map((q) => R(P_(q)));
  const upperD = closed(UPPER.map(P_), 0.62);
  const lowerD = closed(lowerPts, 0.62);
  // the mouth opening: from the corner along the (curled) upper lip to the front, back along the lower jaw's top
  const lipL = lipLine(lip);
  const jt = jawTop().map(R);
  const mouthD = closed([pt(1.6, 0.9), ...lipL, pt(13.1, 0.0), add(jt[4], pt(0.2, 0)), ...[...jt].reverse().slice(1), R(pt(1.8, 1.1))], 0.5);
  // tongue on the lower jaw; out: forward past the chin and drooping
  const tg = clamp(h.tongue);
  const tPts = [pt(3.2, 0.62), pt(7, 0.5), pt(10.4, 0.45 + 0.3 * tg), pt(11.8 + 2.4 * tg, 0.55 + 1.6 * tg), pt(12.4 + 3.0 * tg, 1.1 + 3.0 * tg), pt(11.6 + 2.4 * tg, 1.4 + 3.3 * tg), pt(10.0 + 1.2 * tg, 1.25 + 1.6 * tg), pt(7, 1.0), pt(3.2, 1.0)].map(R);
  const tongueD = closed(tPts, 0.7);
  const earA = -0.75 * clamp(h.ears);
  const earBase = pt(-3.6, -6.2);
  const ear = [pt(-5.6, -5.4), pt(-4.5, -12.4), pt(-1.6, -6.7)].map((q) => add(earBase, rot(sub(q, earBase), earA)));
  const earIn = [pt(-4.9, -6.2), pt(-4.35, -11.0), pt(-2.6, -6.8)].map((q) => add(earBase, rot(sub(q, earBase), earA)));
  const sq = clamp(h.squint);
  const eyeRy = 0.68 * (1 - 0.85 * sq);
  const E = EYE_C;
  const bl = clamp(h.blood);
  const shake = h.shake;
  const back = part !== 'front', front = part !== 'back';
  const upperTeeth = (
    <g>
      {[[12.35, 0.42], [11.85, 0.4]].map(([x, l], i) => <Tooth key={i} b={pt(x, -0.45 - 0.7 * lip)} dir={pt(0, 1)} len={l} w={0.18} sw={sw} />)}
      <Tooth b={pt(10.9, -0.25 - 0.9 * lip)} dir={pt(-0.12, 1)} len={1.45 + 0.2 * lip} w={0.32} sw={sw} />
      {[9.2, 7.7, 6.3].map((x, i) => <Tooth key={i} b={pt(x, -0.05 - 0.55 * lip * (x / 11))} dir={pt(0.1, 1)} len={0.55} w={0.32} sw={sw} />)}
      <Tooth b={pt(4.8, 0.2)} dir={pt(0.25, 1)} len={0.75} w={0.45} sw={sw} />
    </g>
  );
  const lowerTeeth = (
    <g>
      <Tooth b={R(pt(11.75, 0.55))} dir={rot(pt(0.1, -1), J)} len={1.15} w={0.28} sw={sw} />
      {[12.35].map((x, i) => <Tooth key={i} b={R(pt(x, 0.6))} dir={rot(pt(0.15, -1), J)} len={0.35} w={0.16} sw={sw} />)}
      {[9.6, 8, 6.4].map((x, i) => <Tooth key={i} b={R(pt(x, 0.6))} dir={rot(pt(-0.1, -1), J)} len={0.5} w={0.3} sw={sw} />)}
    </g>
  );
  return (
    <g transform={`scale(${1 - 0.22 * Math.abs(shake)} 1) rotate(${shake * 6})`}>
      <defs>
        <linearGradient id={ids.fur} x1="0.2" y1="0" x2="0.35" y2="1">
          <stop offset={0} stopColor={CY.back} />
          <stop offset={0.5} stopColor={CY.tawny} />
          <stop offset={1} stopColor={CY.tawny} />
        </linearGradient>
        <clipPath id={ids.clip}><path d={upperD} /></clipPath>
        <clipPath id={ids.jclip}><path d={lowerD} /></clipPath>
        <clipPath id={ids.mclip}><path d={mouthD} /></clipPath>
        <radialGradient id={ids.eye} cx="0.45" cy="0.4" r="0.6">
          <stop offset={0} stopColor="#F6CB6A" />
          <stop offset={1} stopColor="#A86C1C" />
        </radialGradient>
      </defs>
      {back && (
        <g>
          {/* the far ear */}
          <path d={closed(ear.map((q) => add(q, pt(1.4, 0.5))), 0.25)} fill={CY.far} stroke={CY.ink} strokeWidth={sw} strokeLinejoin="round" />
          {/* mouth interior, behind everything in the mouth */}
          <path d={mouthD} fill={CY.mouth} stroke={CY.ink} strokeWidth={sw} />
          <g clipPath={`url(#${ids.mclip})`}>
            <path d={open([pt(3, -0.1 - 0.2 * lip), pt(12, -0.6 - 0.8 * lip)])} stroke={CY.gum} strokeWidth={0.9} fill="none" />
            {[4.5, 6, 7.5, 9].map((x, i) => <path key={i} d={`M${x} ${0.15 - 0.3 * lip} q0.5 ${0.5} 1.0 0`} stroke={CY.mouthLt} strokeWidth={0.18} fill="none" />)}
            <ellipse cx={2.2} cy={1.0} rx={1.6} ry={1.2} fill="#250508" opacity={0.8} />
            {bl > 0.01 && <ellipse cx={7.6} cy={0.5} rx={2.4 * bl} ry={0.6 * bl + 0.1} fill="#7A0A10" opacity={0.9} />}
          </g>
          <path d={tongueD} fill={mix(CY.tongue, '#9A1C22', 0.55 * bl)} stroke={CY.ink} strokeWidth={sw} />
          <path d={open([tPts[0], tPts[1], tPts[2]].map((q) => add(q, pt(0, 0.25))))} stroke={CY.tongueDk} strokeWidth={0.12} fill="none" />
        </g>
      )}
      {inMouth}
      {front && (
        <g>
          {upperTeeth}
          {lowerTeeth}
          {/* lower jaw */}
          <path d={lowerD} fill={CY.cream} stroke={CY.ink} strokeWidth={sw * 1.4} strokeLinejoin="round" />
          <g clipPath={`url(#${ids.jclip})`}>
            <path d={closed([R(pt(-2, 2.2)), R(pt(12, 1.1)), R(pt(12.5, 3)), R(pt(-2, 4))], 0.5)} fill={CY.creamSh} opacity={0.8} />
            <path d={open([R(pt(2.4, 0.7)), R(pt(9, 0.62)), R(pt(12.5, 0.55))])} stroke={CY.ink} strokeWidth={0.32} fill="none" />
            {bl > 0.01 && <path d={open([R(pt(6, 0.75)), R(pt(10, 0.65)), R(pt(12.4, 0.7))])} stroke="#8E0E15" strokeWidth={0.45 * bl} fill="none" strokeLinecap="round" />}
          </g>
          {/* the cheek web joining the lips at the corner of the mouth */}
          <path d={closed([pt(-0.5, 0.2), pt(2.6, 0.45), R(pt(2.6, 0.75)), R(pt(-0.5, 2.0))], 0.4)} fill={CY.cream} stroke="none" />
          {/* upper head */}
          <path d={upperD} fill={`url(#${ids.fur})`} stroke={CY.ink} strokeWidth={sw * 1.4} strokeLinejoin="round" />
          <g clipPath={`url(#${ids.clip})`}>
            {/* grizzled crown and forehead */}
            <path d={closed([pt(-7.6, -7.5), pt(5, -6.5), pt(5.4, -4.4), pt(2.4, -3.0), pt(-1.5, -3.6), pt(-7.6, -1.5)], 0.6)} fill={CY.back} opacity={0.75} />
            {Array.from({length: 40}, (_, i) => (
              <path key={i} d={`M${-6.5 + hash(i * 3.3) * 11} ${-6.6 + hash(i * 7.7) * 3.4} l${0.45} ${-0.3}`} stroke={hash(i) > 0.5 ? CY.grizz : '#BCA98E'} strokeWidth={0.16} strokeLinecap="round" opacity={0.7} />
            ))}
            {/* cream lip and cheek */}
            <path d={closed([pt(-6.8, 1.0), pt(-3, 0.4), pt(1.2, -0.6), pt(6, -0.9), pt(12.4, -1.25), pt(14.2, -0.8), pt(14, 1.4), pt(-7, 4)], 0.6)} fill={CY.cream} />
            {/* dark lip line */}
            <path d={open(lipL.map((q) => add(q, pt(0, -0.12))))} stroke={CY.ink} strokeWidth={0.36} fill="none" strokeLinecap="round" />
            {/* muzzle shading under the bridge */}
            <path d={open([pt(5, -3.2), pt(9, -2.5), pt(12.4, -2.0)])} stroke={CY.shade} strokeWidth={0.5} fill="none" opacity={0.4} />
            {/* the nose wrinkles (disgust / snarl) */}
            {[5.8, 7.0, 8.2].map((x, i) => (
              <path key={i} d={`M${x} ${-3.7 + 0.1 * i} q0.5 ${0.55 + 0.2 * h.wrinkle} 1.1 ${0.1}`} stroke={CY.shade} strokeWidth={0.22} fill="none" opacity={clamp(h.wrinkle) * 0.9} />
            ))}
            {bl > 0.01 && <path d={open([pt(9.4, -0.2 - 0.6 * lip), pt(11.6, -0.55 - 0.9 * lip), pt(13, -0.8 - 0.6 * lip)])} stroke="#8E0E15" strokeWidth={0.5 * bl} fill="none" strokeLinecap="round" />}
          </g>
          {/* nose pad */}
          <path d="M12.6 -2.9 C13.3 -3.3 14.2 -3.0 14.25 -2.15 C14.3 -1.45 13.8 -1.1 13.2 -1.25 C12.7 -1.4 12.4 -2.2 12.6 -2.9 Z" fill={CY.nose} stroke={CY.ink} strokeWidth={sw * 0.8} />
          <ellipse cx={13.35} cy={-2.6} rx={0.3} ry={0.16} fill="#8A817C" opacity={0.7} />
          {/* eye */}
          <g transform={`translate(${E.x} ${E.y}) rotate(-10)`}>
            <ellipse cx={0} cy={0} rx={1.18} ry={Math.max(0.06, eyeRy * 1.1)} fill={CY.ink} />
            {eyeRy > 0.12 && (
              <>
                <ellipse cx={0.05 + 0.25 * h.look} cy={0} rx={0.8} ry={Math.max(0.05, eyeRy * 0.85)} fill={`url(#${ids.eye})`} />
                <circle cx={0.15 + 0.3 * h.look} cy={0} r={Math.min(0.32, eyeRy * 0.6)} fill={CY.ink} />
                <circle cx={-0.15 + 0.25 * h.look} cy={-eyeRy * 0.35} r={0.12} fill="#FFF" opacity={0.85} />
              </>
            )}
          </g>
          {/* brow: lowered by the squint */}
          <path d={`M${E.x - 1.3} ${E.y - 0.75 + 0.55 * sq} Q${E.x} ${E.y - 1.25 + 0.65 * sq} ${E.x + 1.3} ${E.y - 0.95 + 0.4 * sq}`} stroke={CY.ink} strokeWidth={0.3} fill="none" strokeLinecap="round" />
          <path d={`M${E.x + 1.0} ${E.y + 0.2} L${E.x + 2.6} ${E.y + 0.7}`} stroke={CY.ink} strokeWidth={0.22} strokeLinecap="round" opacity={0.7} />
          {sq > 0.3 && <path d={`M${E.x - 1.4} ${E.y + 0.5} q0.8 0.5 1.6 0.25`} stroke={CY.shade} strokeWidth={0.2} fill="none" opacity={sq} />}
          {/* the near ear */}
          <path d={closed(ear, 0.25)} fill={CY.tawny} stroke={CY.ink} strokeWidth={sw * 1.3} strokeLinejoin="round" />
          <path d={closed(earIn, 0.3)} fill={CY.cream} opacity={0.85} />
          <path d={open([earIn[0], add(earIn[1], pt(0.2, 1.2))])} stroke={CY.creamSh} strokeWidth={0.2} fill="none" />
          {/* cheek ruff */}
          <path d="M-6.9 -0.8 l-1.0 0.9 l0.9 0.2 l-1.0 1.0 l1.1 0.1 l-0.8 1.0 l1.3 -0.2" stroke={CY.ink} strokeWidth={sw} fill={CY.cream} strokeLinejoin="round" />
        </g>
      )}
    </g>
  );
};

// ---------------------------------------------------------------- body
const tubeOutline = (C: P[], r: number[]) => {
  const n = C.length;
  const T = C.map((_, i) => nrm(sub(C[Math.min(n - 1, i + 1)], C[Math.max(0, i - 1)])));
  const N = T.map(perp);
  return [...C.map((c, i) => add(c, mul(N[i], r[i]))), ...[...C].reverse().map((c, k) => add(c, mul(N[n - 1 - k], -r[n - 1 - k])))];
};
type LegJ = {a: P; b: P; c: P; d: P};
const Paw: React.FC<{p: P; fill: string; sw: number; ang?: number}> = ({p, fill, sw, ang = 0}) => (
  <g transform={`translate(${p.x} ${p.y}) rotate(${ang})`}>
    <path d="M-2.4 0.2 C-2.6 -1.6 -1 -2.6 0.8 -2.4 C2.6 -2.2 3.4 -1.0 3.2 0.2 Z" fill={fill} stroke={CY.ink} strokeWidth={sw * 1.2} strokeLinejoin="round" />
    <path d="M0.4 -0.3 l0 -0.9 M1.7 -0.2 l0.1 -0.9" stroke={CY.ink} strokeWidth={0.2} />
  </g>
);
const legD = (j: LegJ, r: number[]) => closed(tubeOutline([j.a, lerpP(j.a, j.b, 0.5), j.b, j.c, j.d], r), 0.6);

export const Coyote: React.FC<{c: CoyoteState; sw?: number; inMouth?: React.ReactNode; shadow?: boolean}> = ({c, sw = 0.28, inMouth, shadow = true}) => {
  const ids = {fur: uid('kf'), sh: uid('ks'), leg: uid('kl')};
  const cr = c.crouch;
  const B = (x: number, y: number) => pt(x, y + cr * clamp((x + 60) / 60));
  // legs (local, near forepaw at the origin); walking moves the paws through stance and swing
  const step = (phase: number, base: number) => {
    const f = ((phase % 1) + 1) % 1;
    const st = f < 0.6;
    const u = st ? f / 0.6 : (f - 0.6) / 0.4;
    const dx = st ? lerp(c.stride / 2, -c.stride / 2, u) : lerp(-c.stride / 2, c.stride / 2, u * u * (3 - 2 * u));
    const lift = st ? 0 : Math.min(9, 0.3 * c.stride + 1) * Math.sin(Math.PI * u) * clamp(c.stride / 6);
    return pt(base + dx, -lift);
  };
  const pNF = step(c.walk, 0), pFF = step(c.walk + 0.5, 4.5), pNH = step(c.walk + 0.25, -59), pFH = step(c.walk + 0.75, -54);
  const pawUp = clamp(c.paw);
  const nfPaw = lerpP(pNF, add(B(c.J.x, c.J.y), pt(4, 4)), pawUp * 0.85);
  const fore = (top: P, paw: P, near: boolean): LegJ => {
    const el = pt(top.x + 0.5 + (paw.x - top.x) * 0.15, lerp(top.y, paw.y, 0.48) + (near ? 0 : 0.5));
    const wr = pt(paw.x - 2.0, paw.y - 5.5);
    if (near && pawUp > 0) {
      const el2 = add(top, pt(9, 9));
      const wr2 = add(paw, pt(-3.5, 3.5));
      return {a: top, b: lerpP(el, el2, pawUp), c: lerpP(wr, wr2, pawUp), d: paw};
    }
    return {a: top, b: el, c: wr, d: paw};
  };
  const hind = (top: P, paw: P): LegJ => ({a: top, b: pt(top.x + 7, top.y + 13), c: pt(paw.x - 4.5, paw.y - 11), d: paw});
  const nf = fore(B(-6.5, -33), nfPaw, true), ff = fore(B(-2.5, -34), pFF, false);
  const nh = hind(B(-62, -38), pNH), fh = hind(B(-57, -38), pFH);
  const body = closed([
    B(-10, -52), B(-26, -50.8), B(-44, -51.6), B(-58, -50.6), B(-67, -47), B(-72, -39), B(-70, -30), B(-62, -27.5), B(-51, -31.5),
    B(-33, -29), B(-13, -26.2), B(-3, -28.5), B(2.8, -35), B(2, -43.5), B(-3, -49.5),
  ], 0.75);
  // head and neck
  const Jw = B(c.J.x, c.J.y);
  const toW = (q: P) => add(Jw, rot(mul(q, HEAD_K), c.ang));
  const nTop = toW(pt(-5.6, -5.9)), nBot = toW(pt(-3.6, 3.3));
  const wT = B(-14, -52), cB = B(3.2, -33);
  const neck = closed([wT, add(lerpP(wT, nTop, 0.5), mul(perp(nrm(sub(nTop, wT))), -5.5)), nTop, toW(pt(-7.6, -0.6)), nBot, add(lerpP(nBot, cB, 0.5), mul(perp(nrm(sub(cB, nBot))), -2.6)), cB, B(-4, -40)], 0.65);
  // tail
  const tc = [B(-67, -47.5), B(-75, -41), B(-79, -29), B(-80, -17)];
  const tail = closed(tubeOutline(tc, [2.4, 3.6, 3.8, 1.2]), 0.7);
  const tipD = closed(tubeOutline([tc[2], tc[3], add(tc[3], pt(-0.2, 2.2))], [3.4, 1.4, 0.3]), 0.7);
  const legFillFar = mix(CY.far, CY.tawny, 0.25);
  return (
    <g>
      <defs>
        <linearGradient id={ids.fur} x1="0" y1="0" x2="0" y2="1">
          <stop offset={0} stopColor={CY.grizz} />
          <stop offset={0.35} stopColor={CY.back} />
          <stop offset={0.8} stopColor={CY.tawny} />
          <stop offset={1} stopColor={CY.cream} />
        </linearGradient>
        <linearGradient id={ids.leg} x1="0" y1="0" x2="0" y2="1">
          <stop offset={0} stopColor={CY.tawny} />
          <stop offset={1} stopColor={CY.tawnyLt} />
        </linearGradient>
        <radialGradient id={ids.sh} cx="0.5" cy="0.5" r="0.5">
          <stop offset={0} stopColor="#2A1608" stopOpacity={0.4} />
          <stop offset={1} stopColor="#2A1608" stopOpacity={0} />
        </radialGradient>
      </defs>
      <g transform={`translate(${c.x} ${c.y}) scale(${c.dir} 1)`}>
        {shadow && <ellipse cx={-28} cy={1.5} rx={48} ry={5} fill={`url(#${ids.sh})`} />}
        {/* far legs */}
        <path d={legD(fh, [4.6, 3.6, 2.4, 1.8, 1.6])} fill={legFillFar} stroke={CY.ink} strokeWidth={sw} />
        <Paw p={fh.d} fill={legFillFar} sw={sw} />
        <path d={legD(ff, [3.4, 2.8, 2.2, 1.7, 1.6])} fill={legFillFar} stroke={CY.ink} strokeWidth={sw} />
        <Paw p={ff.d} fill={legFillFar} sw={sw} />
        {/* tail */}
        <path d={tail} fill={CY.back} stroke={CY.ink} strokeWidth={sw * 1.3} />
        <path d={tipD} fill={CY.tip} />
        {/* near legs and the neck sit behind the body's outline */}
        <path d={legD(nh, [5.2, 4.0, 2.6, 2.0, 1.8])} fill={`url(#${ids.leg})`} stroke={CY.ink} strokeWidth={sw * 1.2} />
        <Paw p={nh.d} fill={CY.tawnyLt} sw={sw} />
        {pawUp <= 0.01 && <path d={legD(nf, [3.8, 3.1, 2.3, 1.8, 1.7])} fill={`url(#${ids.leg})`} stroke={CY.ink} strokeWidth={sw * 1.2} />}
        {pawUp <= 0.01 && <Paw p={nf.d} fill={CY.tawnyLt} sw={sw} />}
        <path d={neck} fill={CY.back} stroke={CY.ink} strokeWidth={sw * 1.4} strokeLinejoin="round" />
        <path d={closed([lerpP(nBot, nTop, 0.25), nBot, lerpP(nBot, cB, 0.6), lerpP(lerpP(nBot, nTop, 0.25), cB, 0.75)], 0.7)} fill={CY.cream} opacity={0.85} />
        <path d={body} fill={`url(#${ids.fur})`} stroke={CY.ink} strokeWidth={sw * 1.4} strokeLinejoin="round" />
        <path d={open([B(-14, -47), B(-9, -40), B(-6.5, -32)])} stroke={CY.shade} strokeWidth={0.9} fill="none" opacity={0.35} strokeLinecap="round" />
        <path d={open([B(-54, -48), B(-50, -40), B(-55, -33), B(-62, -32)])} stroke={CY.shade} strokeWidth={0.9} fill="none" opacity={0.35} strokeLinecap="round" />
        {Array.from({length: 30}, (_, i) => {
          const x = -64 + hash(i * 5.1) * 60, y = -50.5 + hash(i * 2.9) * 6;
          const q = B(x, y);
          return <path key={i} d={`M${q.x} ${q.y} l1.4 -0.6`} stroke={hash(i * 9) > 0.5 ? CY.grizz : '#B7A389'} strokeWidth={0.4} strokeLinecap="round" opacity={0.7} />;
        })}
        <g transform={`translate(${Jw.x} ${Jw.y}) rotate(${(c.ang * 180) / Math.PI}) scale(${HEAD_K})`}>
          <CoyoteHeadDraw h={c.hd} sw={sw} inMouth={inMouth} part="all" />
        </g>
        {pawUp > 0.01 && <path d={legD(nf, [3.8, 3.1, 2.3, 1.8, 1.7])} fill={`url(#${ids.leg})`} stroke={CY.ink} strokeWidth={sw * 1.2} />}
        {pawUp > 0.01 && <Paw p={nf.d} fill={CY.tawnyLt} sw={sw} ang={-60 * pawUp} />}
      </g>
    </g>
  );
};
/** head-local -> world */
export const coyoteHeadWorld = (c: CoyoteState, q: P) => {
  const l = add(pt(c.J.x, c.J.y + c.crouch * clamp((c.J.x + 60) / 60)), rot(mul(q, HEAD_K), c.ang));
  return pt(c.x + c.dir * l.x, c.y + l.y);
};
