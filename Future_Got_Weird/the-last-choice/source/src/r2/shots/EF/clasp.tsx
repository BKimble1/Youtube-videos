// E1_clasp (R4): the clasp insert, seen from above — his grip loosening in her hands, her answering squeeze.
//
// The R3 insert (rig/closeups.tsx ClaspCU) is drawn in this same system (ink + capsule chains, the same two hands, the
// same slab, the same light) but read flat and graphic: the grip was one scalar for the whole hand, the fingers'
// layering flipped from "tucked behind her hand" to "over her palm" on a threshold (g = 0.45: the fingers jumped from
// short curled bunches to long splayed ones in one frame, ≈ 192.25), nothing pressed, nothing trembled but his hand.
// This version keeps every shape and colour of ClaspCU and refines how they move:
//   - his fingers let go one after the other (little finger first, thumb last), each with its own tremor and a last
//     small re-grip of the index finger as the weight goes; they are drawn over her hand throughout (the grip hooks over
//     her far edge) — there is no front/back switch to pop, and no cross-fade to ghost;
//   - the wrist goes heavy: his hand turns about the wrist and sinks onto her palm, the contact shadow deepens, her
//     palm takes the weight;
//   - her answer is pressure, not a pose: the left hand's fingers curl round his wrist, the skin under them blanches
//     and bulges either side; her right fingers close a little on his hand; both hands shake with held breath;
//   - a very slow push and drift (a camera that breathes) so the frame is not a still plate.
import React from 'react';
import {C, BLOOD} from '../../../theme';
import {V2, lerp, f2, clamp, smooth} from '../../../kit/math';
import {mix} from '../../engine/color';
import {blobPath} from '../../rig/util';
import {CAST} from '../../rig';

const INK = 9;
type Chain = {base: V2; lens: number[]; angs: number[]; w: number; taper?: number};
const chainPts = (c: Chain): V2[] => {
  const pts: V2[] = [c.base];
  let p = c.base;
  c.lens.forEach((L, i) => { const a = (c.angs[i] * Math.PI) / 180; p = {x: p.x + Math.cos(a) * L, y: p.y + Math.sin(a) * L}; pts.push(p); });
  return pts;
};
const capD = (a: V2, b: V2, w0: number, w1: number) => {
  const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  const r0 = w0 / 2, r1 = w1 / 2;
  return `M ${f2(a.x + nx * r0)} ${f2(a.y + ny * r0)} L ${f2(b.x + nx * r1)} ${f2(b.y + ny * r1)} A ${f2(r1)} ${f2(r1)} 0 0 0 ${f2(b.x - nx * r1)} ${f2(b.y - ny * r1)} L ${f2(a.x - nx * r0)} ${f2(a.y - ny * r0)} A ${f2(r0)} ${f2(r0)} 0 0 0 ${f2(a.x + nx * r0)} ${f2(a.y + ny * r0)} Z`;
};
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

/** A window 0 → 1 → 0 between a and b. */
const bump = (t: number, a: number, b: number) => smooth((t - a) / ((b - a) * 0.5)) * (1 - smooth((t - (a + b) / 2) / ((b - a) * 0.5)));

/** The insert's own clock (shot-local seconds 0 … 1.7): how far each part of the hold has gone. */
export const claspState = (t: number) => {
  // his fingers let go in turn: little finger first, then ring, middle, index; the thumb last
  const rel = (s: number, d: number) => 1 - smooth((t - s) / d); // 1 holding … 0 open
  const curl = [rel(0.66, 0.62), rel(0.52, 0.62), rel(0.4, 0.64), rel(0.28, 0.66)];
  // the index finger tries once more as the weight goes (a reflex, not a decision)
  curl[0] = Math.min(1, curl[0] + 0.2 * bump(t, 0.82, 1.14));
  curl[1] = Math.min(1, curl[1] + 0.08 * bump(t, 0.7, 0.98));
  const thumb = rel(0.74, 0.62);
  const sag = smooth((t - 0.7) / 0.8);
  // her answers: the first as she feels the grip start to fail, the second as the weight comes onto her hands
  // (the first begins in E1, before the cut, from 190.95: the insert opens with it already on)
  const squeezeA = 0.6 * (1 - 0.35 * smooth((t - 0.3) / 0.4));
  const squeezeB = smooth((t - 0.86) / 0.4);
  const sq = clamp(Math.max(squeezeA, squeezeB));
  return {curl, thumb, sag, sq, grip: (curl[0] + curl[1] + curl[2] + curl[3]) / 4};
};

export type EfClaspProps = {
  /** shot-local seconds */
  t: number;
  /** film seconds (the phase of the tremors) */
  T: number;
  skinD?: string; skinH?: string; sleeveH?: string; pale?: number; blood?: number; warm?: number;
};

/** Full-frame insert, 1920×1080 design space. */
export const EfClasp: React.FC<EfClaspProps> = ({t, T, skinD = CAST.clerkC.skin, skinH = CAST.checker.skin, sleeveH = C.coral, pale = 0, blood = 0.9, warm = 0.5}) => {
  const st = claspState(t);
  const {curl, thumb, sag, sq, grip} = st;
  const sD = mix(skinD, '#B5A79B', 0.3 * pale);
  const sDs = mix(sD, '#4A2A1C', 0.42);
  const sH = skinH, sHs = mix(skinH, '#B98A74', 0.5);
  const sleeveS = mix(sleeveH, '#5A2018', 0.35);
  const blanch = mix(sD, '#EBDCCB', 0.5);

  // ---- tremors: his (a fading, unsteady hold), hers (held breath: it grows as his goes, then she sobs without sound)
  const holdW = grip * (1 - sag);
  const tx = holdW * (1.5 * Math.sin(T * 52.0) * 0.6 + 1.2 * Math.sin(T * 12.7 + 1)) * 0.8;
  const ty = holdW * 1.1 * Math.sin(T * 41.0 + 2) + holdW * 1.4 * Math.sin(T * 6.1);
  const herQ = (0.7 + 1.5 * smooth((t - 0.5) / 0.9)) * (0.6 + 0.4 * Math.sin(T * 5.2));
  const herX = herQ * Math.sin(T * 47.0 + 3) * 0.7 + 0.8 * Math.sin(T * 3.1 + 1.3);
  const herY = herQ * Math.sin(T * 39.0) * 0.6 + 1.2 * Math.sin(T * 2.2); // her breath (slow) under the shake
  // ---- the weight: his hand turns about the wrist and sinks onto her palm
  const drop = sag * 34 + 2.6 * Math.sin(Math.PI * clamp((t - 0.95) / 0.55)) * (t > 0.95 && t < 1.5 ? 1 : 0);
  const rot = sag * 3.4;
  const hx = (x: number) => x + tx;
  const hy = (y: number) => y + ty;
  // ---- her under-hand (palm up, pointing left; wrist at the right)
  const her = sq * 14;
  const herPalm = `M 1240 560 C 1150 540 960 540 880 560 C 850 600 850 720 880 760 C 980 790 1150 790 1250 770 Z`;
  const herFingers: Chain[] = [0, 1, 2, 3].map((i) => ({base: {x: 890, y: 585 + i * 52}, lens: [70 - i * 4, 52 - i * 4], angs: [190 - i * 2 - her * 0.5, 200 - i * 3 - her * 2.2], w: 54 - i * 3}));
  const herThumb: Chain = {base: {x: 1080, y: 560}, lens: [62, 50], angs: [-120 + her * 0.6, -150 + her * 1.6], w: 58};
  // ---- his hand (palm down on hers, pointing right; wrist at the left), the back of the hand toward us
  const hisPalm = `M ${hx(600)} ${hy(520)} C ${hx(720)} ${hy(470)} ${hx(900)} ${hy(470)} ${hx(1010)} ${hy(500)} C ${hx(1050)} ${hy(560)} ${hx(1050)} ${hy(700)} ${hx(1010)} ${hy(760)} C ${hx(880)} ${hy(790)} ${hx(720)} ${hy(790)} ${hx(600)} ${hy(760)} Z`;
  const hisFingers: Chain[] = [0, 1, 2, 3].map((i) => {
    const by = 520 + i * 66, bx = 1000 + (i === 0 || i === 3 ? -14 : 0);
    const c = curl[i];
    // each finger's own tremor, a little different in rate and size
    const fx = holdW * 1.6 * Math.sin(T * (31 + i * 7.3) + i) * c;
    const a0 = lerp(6 + i * 4, 4 + i * 3, c) + sag * 14 + fx * 0.5;
    const a1 = lerp(10 + i * 5, 74 + i * 4, c) + sag * 22 + fx;
    const a2 = lerp(14 + i * 5, 128 + i * 4, c) + sag * 26 + fx * 1.4;
    return {base: {x: hx(bx), y: hy(by)}, lens: [100 - i * 7, 72 - i * 5, 54 - i * 4], angs: [a0, a1, a2], w: 64 - i * 4, taper: 0.22};
  });
  const thumbC = hisFingers[0].base;
  void thumbC;
  const thumbCh: Chain = {base: {x: hx(720), y: hy(500)}, lens: [96, 72], angs: [lerp(-34, -18, 1 - thumb) + sag * 10, lerp(-4, -40, 1 - thumb) + sag * 30], w: 66, taper: 0.2};
  // his hand turns about the wrist (600, 640) and sinks
  const handT = `translate(0 ${f2(drop * 0.55)}) rotate(${f2(rot)} 600 640)`;
  // ---- her left hand over his wrist (from the upper right): the fingers curl round it as she squeezes
  const pL = sq * 3;
  const sqL = sq;
  const handL = (i: number): Chain => ({base: {x: 560 + i * 34, y: 560 + i * 16}, lens: [56, 46], angs: [128 - i * 6 - sqL * 10, 150 - i * 6 - sqL * 30], w: 48 - i * 3});
  const wristPulse = sqL * (0.8 + 0.2 * Math.sin(T * 9.0));
  return (
    <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{display: 'block', background: '#000'}}>
      <defs>
        <radialGradient id="cuWarm2" cx="16%" cy="30%" r="85%">
          <stop offset="0" stopColor="#FF9A4A" stopOpacity={0.4 * warm * (1 + 0.05 * Math.sin(T * 3.7))} />
          <stop offset="1" stopColor="#1A1418" stopOpacity={0} />
        </radialGradient>
        <radialGradient id="cuVig2" cx="50%" cy="52%" r="75%">
          <stop offset="0.55" stopColor="#000" stopOpacity={0} />
          <stop offset="1" stopColor="#000" stopOpacity={0.55} />
        </radialGradient>
        <filter id="cuSoft2" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="14" /></filter>
      </defs>
      {/* the camera: a very slow push and a drift (nothing is a still plate) */}
      <g transform={`translate(960 580) scale(${f2(1 + 0.034 * smooth(t / 1.7))}) translate(-960 -580) translate(${f2(-9 * smooth(t / 1.7) + 1.2 * Math.sin(T * 0.9))} ${f2(5 * smooth(t / 1.7) + 1.0 * Math.sin(T * 1.3 + 1))})`}>
        {/* the slab he lies against: dusty concrete, cracks */}
        <rect x={-80} y={-80} width={2080} height={1240} fill="#4A4340" />
        <path d="M -80 -80 L 2000 -80 L 2000 300 C 1500 340 900 280 -80 330 Z" fill="#3C3634" />
        <path d="M -80 330 C 900 280 1500 340 2000 300" fill="none" stroke={C.ink} strokeWidth={6} />
        <path d="M 260 1160 L 330 900 L 300 820 M 1600 1160 L 1660 960 L 1720 930" fill="none" stroke="#2E2826" strokeWidth={5} strokeLinecap="round" />
        {[[180, 420, 26], [1720, 520, 18], [1460, 980, 22], [420, 990, 16]].map(([x, y, r], i) => <path key={i} d={blobPath(r, 31 + i, 7, 0.4)} transform={`translate(${x} ${y})`} fill="#5E5550" stroke={C.ink} strokeWidth={4} />)}
        <rect x={-80} y={-80} width={2080} height={1240} fill="url(#cuWarm2)" />
        {/* soft shadows of the hands on the concrete, and his hand's on hers (it deepens as the weight comes on) */}
        <ellipse cx={980} cy={830 + drop * 0.5} rx={620} ry={90} fill="#000" opacity={0.25} />

        {/* her right forearm in the coral cardigan sleeve, from the right (it shakes and breathes) */}
        <g transform={`translate(${f2(herX * 0.6)} ${f2(herY * 0.6)})`}>
          <path d="M 2000 860 L 1240 560 L 1250 770 L 2000 1060 Z" fill={sH} stroke={C.ink} strokeWidth={INK} strokeLinejoin="round" />
          <path d="M 2000 820 L 1420 610 L 1440 840 L 2000 1080 Z" fill={sleeveH} stroke={C.ink} strokeWidth={INK} strokeLinejoin="round" />
          <path d="M 1440 840 L 2000 1060" stroke={sleeveS} strokeWidth={40} opacity={0.5} />
        </g>
        {/* her hand, palm up (it takes his weight: a touch higher as it comes on) */}
        <g transform={`translate(${f2(herX * 0.6)} ${f2(herY * 0.6 - 0.05 * drop)})`}>
          <path d={herPalm} fill={sH} stroke={C.ink} strokeWidth={INK} strokeLinejoin="round" />
          <path d="M 900 700 C 980 730 1100 730 1200 700" fill="none" stroke={sHs} strokeWidth={5} opacity={0.7} />
          {herFingers.map((c, i) => <Seg key={`hf${i}`} c={c} fill={sH} shade={sHs} />)}
          <Seg c={herThumb} fill={sH} shade={sHs} nail />
          {/* where his hand's weight lies on her palm: a soft contact shadow (not a drop shadow on the slab) */}
          <ellipse cx={1010} cy={700} rx={150} ry={46} fill={mix(sHs, '#2A1410', 0.4)} opacity={0.18 + 0.3 * sag} filter="url(#cuSoft2)" />
        </g>

        {/* his hand and forearm, from the lower left; bare forearm (short sleeve out of frame), scrapes, blood */}
        <g transform={handT}>
          <path d={`M -40 ${hy(1160)} L ${hx(610)} ${hy(530)} L ${hx(610)} ${hy(750)} L 160 ${hy(1240)} Z`} fill={sD} stroke={C.ink} strokeWidth={INK} strokeLinejoin="round" />
          <path d={`M 40 ${hy(1120)} L ${hx(540)} ${hy(700)}`} stroke={sDs} strokeWidth={70} opacity={0.35} strokeLinecap="round" />
          {[0, 1, 2].map((i) => <line key={i} x1={hx(250 + i * 30)} y1={hy(900 - i * 22)} x2={hx(330 + i * 30)} y2={hy(860 - i * 22)} stroke={BLOOD.scrape} strokeWidth={6} strokeLinecap="round" opacity={0.85} />)}
          <path d={hisPalm} fill={sD} stroke={C.ink} strokeWidth={INK} strokeLinejoin="round" />
          {/* knuckle ridge and tendons on the back of his hand (the tendons slacken as the grip goes) */}
          <path d={`M ${hx(960)} ${hy(510)} C ${hx(985)} ${hy(580)} ${hx(985)} ${hy(680)} ${hx(960)} ${hy(745)}`} fill="none" stroke={sDs} strokeWidth={5} opacity={0.8} />
          {[0, 1, 2, 3].map((i) => <path key={i} d={`M ${hx(640)} ${hy(600 + i * 14)} L ${hx(930)} ${hy(530 + i * 62)}`} stroke={sDs} strokeWidth={4} opacity={0.12 + 0.3 * grip} strokeLinecap="round" />)}
          {blood > 0 && <path d={blobPath(52, 8, 9, 0.5, 1.4, 0.8)} transform={`translate(${f2(hx(800))} ${f2(hy(640))})`} fill={BLOOD.main} opacity={blood} />}
          {blood > 0 && <path d={blobPath(20, 12, 7, 0.5)} transform={`translate(${f2(hx(880))} ${f2(hy(700))})`} fill={BLOOD.dark} opacity={blood * 0.8} />}
          {/* the skin of his wrist under her fingers: blanched and bulging either side as she squeezes */}
          {sqL > 0.02 && (
            <g opacity={clamp(sqL * 1.1)}>
              <ellipse cx={575} cy={650} rx={44} ry={96} fill={blanch} opacity={0.42} />
              <path d={`M ${hx(612)} ${hy(560)} C ${hx(626)} ${hy(600)} ${hx(626)} ${hy(690)} ${hx(612)} ${hy(740)}`} fill="none" stroke={sDs} strokeWidth={4} opacity={0.4 + 0.3 * wristPulse} strokeLinecap="round" />
            </g>
          )}
          {/* his fingers, over her hand (the tips hook over its far edge while he holds; they open from the little finger) */}
          {hisFingers.map((c, i) => <Seg key={`hp${i}`} c={c} fill={sD} shade={sDs} nail />)}
          {/* his thumb hooked over her knuckles, lifting away last */}
          <Seg c={thumbCh} fill={sD} shade={sDs} nail />
        </g>

        {/* her left hand laid over his wrist, from the upper right, in the cardigan sleeve: it presses */}
        <g transform={`translate(${f2(herX - pL)} ${f2(herY + pL + drop * 0.7)})`}>
          <path d="M 1100 -40 L 700 380 L 860 470 L 1300 -20 Z" fill={sleeveH} stroke={C.ink} strokeWidth={INK} strokeLinejoin="round" />
          <path d="M 760 410 L 1180 -10" stroke={sleeveS} strokeWidth={34} opacity={0.45} />
          {/* her hand's contact shadow on his wrist */}
          <ellipse cx={640} cy={640} rx={96} ry={62} fill="#000" opacity={0.12 + 0.12 * sqL} filter="url(#cuSoft2)" />
          <path d="M 700 380 C 640 420 560 470 520 540 C 500 600 540 640 600 630 C 680 620 780 560 860 470 Z" fill={sH} stroke={C.ink} strokeWidth={INK} strokeLinejoin="round" />
          {[0, 1, 2, 3].map((i) => <Seg key={`hl${i}`} c={handL(i)} fill={sqL > 0.3 ? mix(sH, '#F0D9C8', 0.35 * sqL) : sH} shade={sHs} />)}
        </g>
      </g>
      <rect width={1920} height={1080} fill="url(#cuVig2)" />
      <rect width={1920} height={1080} fill="#0E0A0C" opacity={0.06 + 0.1 * smooth(sag)} />
    </svg>
  );
};
