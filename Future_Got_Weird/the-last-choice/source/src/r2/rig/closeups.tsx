// Close-up inserts that are not part of the 3D scene:
//   ClaspCU — seen from above: the drone pilot's right hand lies palm-up under the Director's right hand, her left hand
//             rests on his wrist. His fingers wrap over the far edge of her hand and his thumb hooks over her knuckles.
//             `grip` 1 → 0 is his grip loosening: fingers uncurl and lie open across her palm, then slip off its edge;
//             his thumb lifts away; his wrist goes heavy (`sag`). Her hands stay, and answer with a squeeze.
// The death FACE close-up is done in the scene with the same rig (figureSprite + a close camera), so it is the same
// approved face, lit by the same light; see RigLab page 10.
import React from 'react';
import {C, BLOOD} from '../../theme';
import {V2, lerp, f2, clamp, smooth} from '../../kit/math';
import {mix} from '../engine/color';
import {blobPath} from './util';
import {CAST} from './looks';

const INK = 9;
/** A finger (or thumb) as a chain of capsules: base point, segment lengths, segment angles (degrees, absolute). */
type Chain = {base: V2; lens: number[]; angs: number[]; w: number; taper?: number};
const chainPts = (c: Chain): V2[] => {
  const pts: V2[] = [c.base];
  let p = c.base;
  c.lens.forEach((L, i) => { const a = (c.angs[i] * Math.PI) / 180; p = {x: p.x + Math.cos(a) * L, y: p.y + Math.sin(a) * L}; pts.push(p); });
  return pts;
};
/** One capsule outline between two points (round both ends). */
const capD = (a: V2, b: V2, w0: number, w1: number) => {
  const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  const r0 = w0 / 2, r1 = w1 / 2;
  return `M ${f2(a.x + nx * r0)} ${f2(a.y + ny * r0)} L ${f2(b.x + nx * r1)} ${f2(b.y + ny * r1)} A ${f2(r1)} ${f2(r1)} 0 0 0 ${f2(b.x - nx * r1)} ${f2(b.y - ny * r1)} L ${f2(a.x - nx * r0)} ${f2(a.y - ny * r0)} A ${f2(r0)} ${f2(r0)} 0 0 0 ${f2(a.x + nx * r0)} ${f2(a.y + ny * r0)} Z`;
};
/** Draw a chain segment range [i0, i1) as joined capsules: ink pass then fill pass (so joints read as one finger). */
const Seg: React.FC<{c: Chain; i0?: number; i1?: number; fill: string; shade?: string; nail?: boolean}> = ({c, i0 = 0, i1, fill, shade, nail}) => {
  const pts = chainPts(c);
  const end = i1 ?? c.lens.length;
  const ws = pts.map((_, i) => c.w * (1 - (c.taper ?? 0.18) * (i / c.lens.length)));
  const segs: React.ReactElement[] = [], fills: React.ReactElement[] = [];
  for (let i = i0; i < end; i++) {
    const d = capD(pts[i], pts[i + 1], ws[i], ws[i + 1]);
    segs.push(<path key={`i${i}`} d={d} fill={C.ink} stroke={C.ink} strokeWidth={INK * 2} strokeLinejoin="round" />);
    fills.push(<path key={`f${i}`} d={d} fill={fill} />);
    if (shade) fills.push(<path key={`s${i}`} d={capD({x: pts[i].x, y: pts[i].y + ws[i] * 0.22}, {x: pts[i + 1].x, y: pts[i + 1].y + ws[i + 1] * 0.22}, ws[i] * 0.45, ws[i + 1] * 0.45)} fill={shade} opacity={0.55} />);
  }
  const tip = pts[end], pa = pts[end - 1];
  const na = Math.atan2(tip.y - pa.y, tip.x - pa.x);
  return (
    <g>
      {segs}
      {fills}
      {nail && end === c.lens.length && <ellipse cx={tip.x - Math.cos(na) * ws[end] * 0.18} cy={tip.y - Math.sin(na) * ws[end] * 0.18} rx={ws[end] * 0.3} ry={ws[end] * 0.22} transform={`rotate(${f2((na * 180) / Math.PI)} ${f2(tip.x - Math.cos(na) * ws[end] * 0.18)} ${f2(tip.y - Math.sin(na) * ws[end] * 0.18)})`} fill="#FFFFFF" opacity={0.35} />}
    </g>
  );
};

export type ClaspProps = {
  /** his grip: 1 holding, 0 let go */
  grip: number;
  /** his wrist going heavy (0..1) */
  sag?: number;
  /** her answering squeeze (0..1) */
  squeeze?: number;
  t: number;
  skinD?: string; skinH?: string; sleeveH?: string; pale?: number; blood?: number;
  /** warm light from the left (fire) 0..1 */
  warm?: number;
};

/** Full-frame insert, 1920×1080 design space. */
export const ClaspCU: React.FC<ClaspProps> = ({grip, sag = 0, squeeze = 0, t, skinD = CAST.clerkC.skin, skinH = CAST.checker.skin, sleeveH = C.coral, pale = 0, blood = 0.9, warm = 0.5}) => {
  const g = clamp(grip), sg = clamp(sag), sq = clamp(squeeze);
  const sD = mix(skinD, '#B5A79B', 0.3 * pale);
  const sDs = mix(sD, '#4A2A1C', 0.42);
  const sH = skinH, sHs = mix(skinH, '#B98A74', 0.5);
  const sleeveS = mix(sleeveH, '#5A2018', 0.35);
  // a faint tremor while he still holds on; stillness once he lets go
  const tremor = g * (1 - sg) * 1.6 * Math.sin(t * 8.3);
  const drop = sg * 34; // his hand sinks a little as the wrist goes heavy
  const her = sq * 6; // her fingers close a little
  // --- her under-hand (palm up, pointing left; wrist at the right)
  const herPalm = `M 1240 560 C 1150 540 960 540 880 560 C 850 600 850 720 880 760 C 980 790 1150 790 1250 770 Z`;
  const herFingers: Chain[] = [0, 1, 2, 3].map((i) => ({base: {x: 890, y: 585 + i * 52}, lens: [70 - i * 4, 52 - i * 4], angs: [190 - i * 2, 200 - i * 3 - her * 2], w: 54 - i * 3}));
  const herThumb: Chain = {base: {x: 1080, y: 560}, lens: [62, 50], angs: [-120 + her, -150 + her * 1.5], w: 58};
  // --- his hand (palm down on hers, pointing right; wrist at the left), the back of the hand toward us
  const hx = (x: number) => x + tremor;
  const hy = (y: number) => y + drop;
  const hisPalm = `M ${hx(600)} ${hy(520)} C ${hx(720)} ${hy(470)} ${hx(900)} ${hy(470)} ${hx(1010)} ${hy(500)} C ${hx(1050)} ${hy(560)} ${hx(1050)} ${hy(700)} ${hx(1010)} ${hy(760)} C ${hx(880)} ${hy(790)} ${hx(720)} ${hy(790)} ${hx(600)} ${hy(760)} Z`;
  // fingers: proximal along the hand, then (gripping) bending down over her hand's far edge; letting go they
  // straighten across her palm, then slide off with the sag
  const hisFingers: Chain[] = [0, 1, 2, 3].map((i) => {
    const by = 520 + i * 66, bx = 1000 + (i === 0 || i === 3 ? -14 : 0);
    const curl = g;
    const a0 = lerp(6 + i * 4, 4 + i * 3, curl) + sg * 14;
    const a1 = lerp(10 + i * 5, 74 + i * 4, curl) + sg * 22;
    const a2 = lerp(14 + i * 5, 128 + i * 4, curl) + sg * 26;
    return {base: {x: hx(bx), y: hy(by)}, lens: [100 - i * 7, 72 - i * 5, 54 - i * 4], angs: [a0, a1, a2], w: 64 - i * 4, taper: 0.22};
  });
  const thumb: Chain = {base: {x: hx(720), y: hy(500)}, lens: [96, 72], angs: [lerp(-34, -18, 1 - g) + sg * 10, lerp(-4, -40, 1 - g) + sg * 30], w: 66, taper: 0.2};
  const tucked = g > 0.45; // finger tips wrap under the far edge of her hand
  return (
    <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{display: 'block'}}>
      <defs>
        <radialGradient id="cuWarm" cx="16%" cy="30%" r="85%">
          <stop offset="0" stopColor="#FF9A4A" stopOpacity={0.4 * warm} />
          <stop offset="1" stopColor="#1A1418" stopOpacity={0} />
        </radialGradient>
        <radialGradient id="cuVig" cx="50%" cy="52%" r="75%">
          <stop offset="0.55" stopColor="#000" stopOpacity={0} />
          <stop offset="1" stopColor="#000" stopOpacity={0.55} />
        </radialGradient>
      </defs>
      {/* the slab he lies against: dusty concrete, cracks */}
      <rect width={1920} height={1080} fill="#4A4340" />
      <path d="M 0 0 L 1920 0 L 1920 300 C 1500 340 900 280 0 330 Z" fill="#3C3634" />
      <path d="M 0 330 C 900 280 1500 340 1920 300" fill="none" stroke={C.ink} strokeWidth={6} />
      <path d="M 260 1080 L 330 900 L 300 820 M 1600 1080 L 1660 960 L 1720 930" fill="none" stroke="#2E2826" strokeWidth={5} strokeLinecap="round" />
      {[[180, 420, 26], [1720, 520, 18], [1460, 980, 22], [420, 990, 16]].map(([x, y, r], i) => <path key={i} d={blobPath(r, 31 + i, 7, 0.4)} transform={`translate(${x} ${y})`} fill="#5E5550" stroke={C.ink} strokeWidth={4} />)}
      <rect width={1920} height={1080} fill="url(#cuWarm)" />
      {/* soft shadow of the two hands on the concrete */}
      <ellipse cx={980} cy={830 + drop * 0.5} rx={620} ry={90} fill="#000" opacity={0.25} />

      {/* her right forearm in the coral cardigan sleeve, from the right */}
      <path d="M 2000 860 L 1240 560 L 1250 770 L 2000 1060 Z" fill={sH} stroke={C.ink} strokeWidth={INK} strokeLinejoin="round" />
      <path d="M 2000 820 L 1420 610 L 1440 840 L 2000 1080 Z" fill={sleeveH} stroke={C.ink} strokeWidth={INK} strokeLinejoin="round" />
      <path d="M 1440 840 L 2000 1060" stroke={sleeveS} strokeWidth={40} opacity={0.5} />
      {/* his finger tips wrapping under the far (lower) edge of her hand: behind her hand */}
      {tucked && hisFingers.map((c, i) => <Seg key={`ht${i}`} c={c} i0={1} fill={sD} shade={sDs} />)}
      {/* her hand, palm up */}
      <path d={herPalm} fill={sH} stroke={C.ink} strokeWidth={INK} strokeLinejoin="round" />
      <path d="M 900 700 C 980 730 1100 730 1200 700" fill="none" stroke={sHs} strokeWidth={5} opacity={0.7} />
      {herFingers.map((c, i) => <Seg key={`hf${i}`} c={c} fill={sH} shade={sHs} />)}
      <Seg c={herThumb} fill={sH} shade={sHs} nail />

      {/* his hand and forearm, from the lower left; bare forearm (short sleeve out of frame), scrapes, blood */}
      <g>
        <path d={`M -40 ${hy(1160)} L ${hx(610)} ${hy(530)} L ${hx(610)} ${hy(750)} L 160 ${hy(1240)} Z`} fill={sD} stroke={C.ink} strokeWidth={INK} strokeLinejoin="round" />
        <path d={`M 40 ${hy(1120)} L ${hx(540)} ${hy(700)}`} stroke={sDs} strokeWidth={70} opacity={0.35} strokeLinecap="round" />
        {[0, 1, 2].map((i) => <line key={i} x1={hx(250 + i * 30)} y1={hy(900 - i * 22)} x2={hx(330 + i * 30)} y2={hy(860 - i * 22)} stroke={BLOOD.scrape} strokeWidth={6} strokeLinecap="round" opacity={0.85} />)}
        <path d={hisPalm} fill={sD} stroke={C.ink} strokeWidth={INK} strokeLinejoin="round" />
        {/* knuckle ridge and tendons on the back of his hand */}
        <path d={`M ${hx(960)} ${hy(510)} C ${hx(985)} ${hy(580)} ${hx(985)} ${hy(680)} ${hx(960)} ${hy(745)}`} fill="none" stroke={sDs} strokeWidth={5} opacity={0.8} />
        {[0, 1, 2, 3].map((i) => <path key={i} d={`M ${hx(640)} ${hy(600 + i * 14)} L ${hx(930)} ${hy(530 + i * 62)}`} stroke={sDs} strokeWidth={4} opacity={0.4} strokeLinecap="round" />)}
        {blood > 0 && <path d={blobPath(52, 8, 9, 0.5, 1.4, 0.8)} transform={`translate(${f2(hx(800))} ${f2(hy(640))})`} fill={BLOOD.main} opacity={blood} />}
        {blood > 0 && <path d={blobPath(20, 12, 7, 0.5)} transform={`translate(${f2(hx(880))} ${f2(hy(700))})`} fill={BLOOD.dark} opacity={blood * 0.8} />}
        {/* proximal finger segments (in front of her hand); the rest too when he has let go */}
        {hisFingers.map((c, i) => <Seg key={`hp${i}`} c={c} i0={0} i1={tucked ? 1 : 3} fill={sD} shade={sDs} nail={!tucked} />)}
        {/* his thumb hooked over her knuckles, lifting away as he lets go */}
        <Seg c={thumb} fill={sD} shade={sDs} nail />
      </g>

      {/* her left hand laid over his wrist, from the upper right, in the cardigan sleeve */}
      <g transform={`translate(0 ${f2(drop * 0.7)})`}>
        <path d="M 1100 -40 L 700 380 L 860 470 L 1300 -20 Z" fill={sleeveH} stroke={C.ink} strokeWidth={INK} strokeLinejoin="round" />
        <path d="M 760 410 L 1180 -10" stroke={sleeveS} strokeWidth={34} opacity={0.45} />
        <path d="M 700 380 C 640 420 560 470 520 540 C 500 600 540 640 600 630 C 680 620 780 560 860 470 Z" fill={sH} stroke={C.ink} strokeWidth={INK} strokeLinejoin="round" />
        {[0, 1, 2, 3].map((i) => <Seg key={`hl${i}`} c={{base: {x: 560 + i * 34, y: 560 + i * 16}, lens: [56, 46], angs: [128 - i * 6 - sq * 6, 150 - i * 6 - sq * 10], w: 48 - i * 3}} fill={sH} shade={sHs} />)}
      </g>
      <rect width={1920} height={1080} fill="url(#cuVig)" />
      <rect width={1920} height={1080} fill="#0E0A0C" opacity={0.06 + 0.1 * smooth(sg)} />
    </svg>
  );
};
