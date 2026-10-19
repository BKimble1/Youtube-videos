// D3-11b insert (146.30–147.00), not part of the 3D scene: from the breaker's eyes, down onto the gauge on his
// breaker's red tank (the same tool: yellow rear tube, red tank, cream dial, needle red under 0.15; rig/props.tsx
// breaker()). The needle, shivering just over the red, sinks onto the stop; his right thumb comes in and knocks the
// glass twice (the needle jumps and falls back each time), presses, and slides off as the hand goes slack.
// 1920×1080 design space, the ink and capsule style of rig/closeups.tsx (ClaspCU).
import React from 'react';
import {C, BLOOD} from '../../../theme';
import {V2, lerp, f2, clamp, smooth, easeOut, easeIn2} from '../../../kit/math';
import {mix} from '../../engine/color';
import {blobPath} from '../../rig/util';
import {CAST} from '../../rig/looks';

const INK = 9;
/** the dial: centre, bezel and face radii (design px) */
const GC = {x: 860, y: 590}, R_BEZ = 300, R_FACE = 262, R_NEEDLE = 222;
/** needle angle for a reading (rig/props.tsx breaker(): φ = π(1.15 − 1.3 g), y up): 0 lower left, 1 lower right */
const phi = (g: number) => Math.PI * (1.15 - 1.3 * g);
const onDial = (g: number, r: number): V2 => ({x: GC.x + Math.cos(phi(g)) * r, y: GC.y - Math.sin(phi(g)) * r});
/** knock pulses (local s): the thumb on the glass */
const TAPS = [0.38, 0.5];
const pulse = (t: number, t0: number, w = 0.05) => { const u = (t - t0) / w; return u < -1 || u > 1 ? 0 : 0.5 + 0.5 * Math.cos(Math.PI * u); };
/** the reading through the shot: shivering at the edge of the red, sinking onto the stop with a bounce; a jump off
 *  the stop at each knock */
export const gaugeCU = (t: number) => {
  const sink = easeIn2(clamp((t - 0.06) / 0.22));
  const bounce = t > 0.28 && t < 0.36 ? 0.018 * Math.sin(Math.PI * (t - 0.28) / 0.08) : 0;
  const shiver = (1 - sink) * 0.006 * Math.sin(t * 2 * Math.PI * 21);
  const knock = TAPS.reduce((s, t0, i) => {
    const u = t - t0;
    return s + (u > 0 && u < 0.14 ? (i === 0 ? 0.034 : 0.022) * Math.sin(Math.PI * Math.min(1, u / 0.14)) * (1 - u / 0.14) * 1.8 : 0);
  }, 0);
  return Math.max(-0.02, lerp(0.15, -0.02, sink) + bounce + shiver + knock);
};
/** 2-link IK (base → tip), the joint bent to the side `bend` (+1/−1) */
const ik2 = (b: V2, tip: V2, l1: number, l2: number, bend: number): V2 => {
  const dx = tip.x - b.x, dy = tip.y - b.y, d = Math.min(Math.hypot(dx, dy), l1 + l2 - 0.5);
  const a0 = Math.atan2(dy, dx), ca = clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1);
  const a = a0 + bend * Math.acos(ca);
  return {x: b.x + Math.cos(a) * l1, y: b.y + Math.sin(a) * l1};
};
const capD = (a: V2, b: V2, w0: number, w1: number) => {
  const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  const r0 = w0 / 2, r1 = w1 / 2;
  return `M ${f2(a.x + nx * r0)} ${f2(a.y + ny * r0)} L ${f2(b.x + nx * r1)} ${f2(b.y + ny * r1)} A ${f2(r1)} ${f2(r1)} 0 0 0 ${f2(b.x - nx * r1)} ${f2(b.y - ny * r1)} L ${f2(a.x - nx * r0)} ${f2(a.y - ny * r0)} A ${f2(r0)} ${f2(r0)} 0 0 0 ${f2(a.x + nx * r0)} ${f2(a.y + ny * r0)} Z`;
};
const Caps: React.FC<{pts: V2[]; ws: number[]; fill: string; shade?: string}> = ({pts, ws, fill, shade}) => (
  <g>
    {pts.slice(1).map((p, i) => <path key={`i${i}`} d={capD(pts[i], p, ws[i], ws[i + 1])} fill={C.ink} stroke={C.ink} strokeWidth={INK * 2} strokeLinejoin="round" />)}
    {pts.slice(1).map((p, i) => <path key={`f${i}`} d={capD(pts[i], p, ws[i], ws[i + 1])} fill={fill} />)}
    {shade && pts.slice(1).map((p, i) => <path key={`s${i}`} d={capD({x: pts[i].x, y: pts[i].y + ws[i] * 0.22}, {x: p.x, y: p.y + ws[i + 1] * 0.22}, ws[i] * 0.45, ws[i + 1] * 0.45)} fill={shade} opacity={0.5} />)}
  </g>
);

export const GaugeCU: React.FC<{t: number; T: number}> = ({t, T}) => {
  const g = gaugeCU(t);
  // the frame: a slow push in on the dial; a jolt at each knock and at heavy 2's footfalls on the wreck (cues 146.49,
  // 146.87)
  const jolt = TAPS.reduce((s, t0) => s + pulse(t, t0 + 0.01, 0.03), 0) * 3 + (pulse(T, 146.5, 0.06) + pulse(T, 146.88, 0.06)) * 6;
  const zoom = 1 + 0.035 * smooth(t / 0.7);
  const jx = jolt * Math.sin(T * 91), jy = jolt * Math.cos(T * 73);
  // R4: the cut is on his move — the tool is still coming up across his body from D3-11a (the lift began there), so the
  // dial rises into the frame and settles in the first 0.16 s: it is the tool he was lifting, not a new object
  const rise = 1 - easeOut(clamp(t / 0.16));
  const view = `translate(${f2(GC.x + jx)} ${f2(GC.y + jy + 150 * rise)}) rotate(${f2(-3 * rise)}) scale(${f2(zoom)}) translate(${-GC.x} ${-GC.y})`;
  // fire light from the upper left, flickering
  const flick = 0.5 + 0.18 * Math.sin(T * 17.3) + 0.12 * Math.sin(T * 41.7 + 1.3);
  // his right hand: in from the lower right, two knocks, a press, then it slides off and goes slack
  const skin = CAST.honest.skin, skinS = mix(skin, '#4A2A1C', 0.4), dust = '#9C9086';
  const inK = easeOut(clamp((t - 0.18) / 0.18));
  const slack = smooth(clamp((t - 0.58) / 0.12));
  const P: V2 = {x: 985, y: 700}, hover: V2 = {x: 1010, y: 680}, away: V2 = {x: 1560, y: 1180};
  const press = Math.max(pulse(t, TAPS[0], 0.045), t > TAPS[1] ? (t < 0.58 ? 1 : 1 - slack) : pulse(t, TAPS[1], 0.045));
  let tip: V2 = {x: lerp(away.x, lerp(hover.x, P.x, press), inK), y: lerp(away.y, lerp(hover.y, P.y, press), inK)};
  tip = {x: tip.x + slack * 90, y: tip.y + slack * 150};
  const base: V2 = {x: tip.x + 215 - press * 14 + slack * 30, y: tip.y + 128 - press * 8 + slack * 40};
  const kn = ik2(base, tip, 122, 104, -1);
  const hand: V2 = {x: base.x + 95, y: base.y + 52};
  const wrist: V2 = {x: base.x + 240, y: base.y + 150};
  return (
    <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{display: 'block'}}>
      <defs>
        <radialGradient id="g3Warm" cx="14%" cy="12%" r="90%">
          <stop offset="0" stopColor="#FF9A4A" stopOpacity={0.42 * flick} />
          <stop offset="1" stopColor="#1A1418" stopOpacity={0} />
        </radialGradient>
        <radialGradient id="g3Vig" cx="46%" cy="54%" r="72%">
          <stop offset="0.5" stopColor="#000" stopOpacity={0} />
          <stop offset="1" stopColor="#000" stopOpacity={0.6} />
        </radialGradient>
        <radialGradient id="g3Face" cx="40%" cy="34%" r="80%">
          <stop offset="0" stopColor="#FBF7EC" />
          <stop offset="1" stopColor="#D9D2C2" />
        </radialGradient>
      </defs>
      {/* beyond the tool: smoke lit by the fires, the rubble under him (dark, soft) */}
      <rect width={1920} height={1080} fill="#2B2326" />
      {[[260, 120, 260, 0.5], [1500, 90, 340, 0.35], [980, 40, 220, 0.3]].map(([x, y, r, o], i) => <path key={`sm${i}`} d={blobPath(r, 11 + i, 9, 0.35, 1.5, 1)} transform={`translate(${x} ${y})`} fill="#5A4440" opacity={o} />)}
      {[[180, 260, 14], [420, 150, 9], [1650, 300, 12], [1320, 200, 8], [90, 520, 10]].map(([x, y, r], i) => <circle key={`em${i}`} cx={x + 6 * Math.sin(T * 3 + i)} cy={y - ((T * 40 + i * 37) % 60)} r={r} fill="#FFB36B" opacity={0.35 + 0.25 * Math.sin(T * 9 + i * 2)} />)}
      <g transform={view}>
        {/* his knee (slate trousers), dusty, under the tool at the lower left */}
        <path d="M -60 760 C 120 700 300 760 380 900 C 420 980 410 1060 380 1140 L -60 1140 Z" fill={mix('#3F5560', '#000', 0.25)} stroke={C.ink} strokeWidth={INK} strokeLinejoin="round" />
        <path d="M 40 820 C 160 800 260 840 320 910" fill="none" stroke={mix('#3F5560', dust, 0.5)} strokeWidth={22} opacity={0.5} strokeLinecap="round" />
        {/* the yellow rear tube across the top, the rubber hose off it */}
        <path d="M -80 120 L 2000 30 L 2000 250 L -80 330 Z" fill="#E8C547" stroke={C.ink} strokeWidth={INK} strokeLinejoin="round" />
        <path d="M -80 290 L 2000 210" stroke={mix('#E8C547', '#7A5A10', 0.5)} strokeWidth={34} opacity={0.45} />
        <path d="M -80 150 L 2000 62" stroke="#FFF2B0" strokeWidth={10} opacity={0.5} />
        <path d="M 1500 70 C 1560 -40 1720 -60 1800 -120" fill="none" stroke={C.ink} strokeWidth={68} strokeLinecap="round" />
        <path d="M 1500 70 C 1560 -40 1720 -60 1800 -120" fill="none" stroke="#2E3236" strokeWidth={50} strokeLinecap="round" />
        {/* the red tank */}
        <path d="M -80 300 C 600 250 1400 230 2000 210 L 2000 1140 L -80 1140 Z" fill="#B8483A" stroke={C.ink} strokeWidth={INK} strokeLinejoin="round" />
        <path d="M -80 380 C 600 330 1400 310 2000 290" fill="none" stroke="#E07A62" strokeWidth={28} opacity={0.5} />
        <path d="M -80 1000 C 600 960 1400 930 2000 900" fill="none" stroke="#7A2A22" strokeWidth={90} opacity={0.4} />
        {[[1300, 420, 1420, 400], [1380, 470, 1460, 452], [380, 980, 520, 950], [1600, 820, 1720, 790]].map(([a, b, c, d], i) => <line key={`sc${i}`} x1={a} y1={b} x2={c} y2={d} stroke="#E9A08E" strokeWidth={5} strokeLinecap="round" opacity={0.7} />)}
        {[[1480, 640, 40], [300, 560, 30], [1700, 980, 46], [1240, 900, 26]].map(([x, y, r], i) => <path key={`du${i}`} d={blobPath(r, 41 + i, 8, 0.5, 1.6, 0.8)} transform={`translate(${x} ${y})`} fill={dust} opacity={0.35} />)}
        {/* the dial: bezel, face, ticks, the red */}
        <circle cx={GC.x + 10} cy={GC.y + 16} r={R_BEZ + 6} fill="#000" opacity={0.3} />
        <circle cx={GC.x} cy={GC.y} r={R_BEZ} fill="#8C969C" stroke={C.ink} strokeWidth={INK} />
        <circle cx={GC.x} cy={GC.y} r={R_BEZ - 16} fill="none" stroke="#C9D0D3" strokeWidth={10} opacity={0.6} />
        <circle cx={GC.x} cy={GC.y} r={R_FACE} fill="url(#g3Face)" stroke={C.ink} strokeWidth={INK * 0.8} />
        {(() => {
          const a = onDial(0, R_FACE - 34), b = onDial(0.15, R_FACE - 34);
          return <path d={`M ${f2(a.x)} ${f2(a.y)} A ${R_FACE - 34} ${R_FACE - 34} 0 0 1 ${f2(b.x)} ${f2(b.y)}`} fill="none" stroke="#C0392B" strokeWidth={30} />;
        })()}
        {Array.from({length: 21}, (_, i) => {
          const v = i / 20, major = i % 5 === 0;
          const a = onDial(v, R_FACE - 18), b = onDial(v, R_FACE - (major ? 70 : 46));
          return <line key={`tk${i}`} x1={f2(a.x)} y1={f2(a.y)} x2={f2(b.x)} y2={f2(b.y)} stroke={v < 0.15 ? '#7E1820' : C.ink} strokeWidth={major ? 10 : 5} strokeLinecap="round" />;
        })}
        {/* the stop pin under zero */}
        {(() => { const p = onDial(-0.035, R_FACE - 60); return <circle cx={f2(p.x)} cy={f2(p.y)} r={9} fill="#5A646A" stroke={C.ink} strokeWidth={4} />; })()}
        {/* the needle (red under 0.15, as on the tool) and its cap */}
        {(() => {
          const tp = onDial(g, R_NEEDLE), tl = onDial(g, -46), nx = -(tp.y - GC.y) / R_NEEDLE, ny = (tp.x - GC.x) / R_NEEDLE;
          const nc = g < 0.15 ? '#C0392B' : C.ink;
          return (
            <g>
              <path d={`M ${f2(tl.x + nx * 7)} ${f2(tl.y + ny * 7)} L ${f2(tp.x)} ${f2(tp.y)} L ${f2(tl.x - nx * 7)} ${f2(tl.y - ny * 7)} Z`} transform="translate(8 12)" fill="#000" opacity={0.18} />
              <path d={`M ${f2(tl.x + nx * 12)} ${f2(tl.y + ny * 12)} L ${f2(tp.x)} ${f2(tp.y)} L ${f2(tl.x - nx * 12)} ${f2(tl.y - ny * 12)} Z`} fill={nc} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
            </g>
          );
        })()}
        <circle cx={GC.x} cy={GC.y} r={30} fill="#4C5D69" stroke={C.ink} strokeWidth={INK * 0.8} />
        <circle cx={GC.x - 8} cy={GC.y - 8} r={9} fill="#9FB0BA" />
        {/* the glass: a highlight, a crack off the rim from the blast, dust */}
        <path d={`M ${GC.x - 190} ${GC.y - 120} A ${R_FACE - 24} ${R_FACE - 24} 0 0 1 ${GC.x + 60} ${GC.y - 228}`} fill="none" stroke="#FFFFFF" strokeWidth={18} opacity={0.32} strokeLinecap="round" />
        <path d={`M ${GC.x + 190} ${GC.y - 178} L ${GC.x + 120} ${GC.y - 96} L ${GC.x + 132} ${GC.y - 30} M ${GC.x + 120} ${GC.y - 96} L ${GC.x + 52} ${GC.y - 118}`} fill="none" stroke={C.ink} strokeWidth={4} opacity={0.75} strokeLinejoin="round" />
        <path d={`M ${GC.x + 190} ${GC.y - 178} L ${GC.x + 122} ${GC.y - 94}`} fill="none" stroke="#FFFFFF" strokeWidth={3} opacity={0.6} transform="translate(5 2)" />
        {[[GC.x - 150, GC.y + 150, 22], [GC.x + 160, GC.y + 120, 16], [GC.x - 40, GC.y + 210, 14]].map(([x, y, r], i) => <path key={`gd${i}`} d={blobPath(r, 61 + i, 7, 0.5, 1.5, 0.9)} transform={`translate(${x} ${y})`} fill={dust} opacity={0.4} />)}
        {/* the thumb's shadow on the glass as it comes close */}
        {inK > 0.3 && <ellipse cx={f2(tip.x + 40)} cy={f2(tip.y + 42)} rx={60} ry={32} fill="#000" opacity={0.16 * press + 0.06 * inK * (1 - slack)} />}
        {/* his right hand: forearm from the lower right, the fist round the trigger grip below frame, the thumb out */}
        {inK > 0.01 && (
          <g>
            <path d={`M ${f2(wrist.x - 70)} ${f2(wrist.y - 60)} L ${f2(wrist.x + 520)} ${f2(wrist.y + 260)} L ${f2(wrist.x + 380)} ${f2(wrist.y + 470)} L ${f2(wrist.x - 120)} ${f2(wrist.y + 110)} Z`} fill={skin} stroke={C.ink} strokeWidth={INK} strokeLinejoin="round" />
            <path d={`M ${f2(wrist.x - 40)} ${f2(wrist.y + 60)} L ${f2(wrist.x + 420)} ${f2(wrist.y + 330)}`} stroke={skinS} strokeWidth={60} opacity={0.35} strokeLinecap="round" />
            <path d={blobPath(150, 5, 10, 0.18, 1.25, 0.9)} transform={`translate(${f2(hand.x)} ${f2(hand.y)}) rotate(28)`} fill={skin} stroke={C.ink} strokeWidth={INK} strokeLinejoin="round" />
            {/* knuckles: the fingers curled under, round the grip */}
            {[0, 1, 2, 3].map((i) => <Caps key={`kn${i}`} pts={[{x: hand.x - 70 + i * 52, y: hand.y + 70 + i * 18}, {x: hand.x - 92 + i * 54, y: hand.y + 150 + i * 16}]} ws={[66 - i * 4, 58 - i * 4]} fill={skin} shade={skinS} />)}
            {/* scrapes and dust on the back of the hand */}
            {[0, 1, 2].map((i) => <line key={`hs${i}`} x1={f2(hand.x - 20 + i * 26)} y1={f2(hand.y - 40 + i * 10)} x2={f2(hand.x + 50 + i * 26)} y2={f2(hand.y - 70 + i * 10)} stroke={BLOOD.scrape} strokeWidth={6} strokeLinecap="round" opacity={0.85} />)}
            <path d={blobPath(40, 77, 8, 0.5, 1.6, 0.8)} transform={`translate(${f2(hand.x + 40)} ${f2(hand.y + 20)})`} fill={dust} opacity={0.35} />
            {/* the thumb */}
            <Caps pts={[base, kn, tip]} ws={[78, 66, 56]} fill={skin} shade={skinS} />
            {(() => {
              const a = Math.atan2(tip.y - kn.y, tip.x - kn.x), nx = tip.x - Math.cos(a) * 22, ny = tip.y - Math.sin(a) * 22;
              return <ellipse cx={f2(nx)} cy={f2(ny)} rx={22} ry={17} transform={`rotate(${f2((a * 180) / Math.PI)} ${f2(nx)} ${f2(ny)})`} fill="#FFFFFF" opacity={0.38} />;
            })()}
          </g>
        )}
      </g>
      <rect width={1920} height={1080} fill="url(#g3Warm)" />
      <rect width={1920} height={1080} fill="url(#g3Vig)" />
      <rect width={1920} height={1080} fill="#0E0A0C" opacity={0.08 + 0.08 * slack} />
    </svg>
  );
};
