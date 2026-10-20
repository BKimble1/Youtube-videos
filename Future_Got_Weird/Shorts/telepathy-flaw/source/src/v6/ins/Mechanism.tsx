// V5 mechanism insert (the flaw), drawn inside the SAME round implant casing as the decoder shown earlier (blue bezel, rivets,
// clip tabs, dark board, the gold hexagonal die): the intended pattern (blue, smooth) comes in on the left, the unwanted
// one (red, jagged) on the right, one after the other, through the same die, and each leaves as the same white-cyan pulse
// and the same message token above its own output port. Nothing is read by text: the colour drains out of every pulse in
// the die and the two tokens are identical. No floating message, route, queue or bar.
import React from 'react';
import {Cam, Layer} from '../../lib/camera';
import {INK} from '../../lib/ink';
import {clamp, easeOut, easeOutBack, fmt, lerp, P, V} from '../../lib/math';
import {Glow} from '../../lib/shade';
import {rr} from '../env/Props';
import {BLUE, BLUE_D, CYAN, RED} from '../art/Implant';
import {BlurDefs, FieldBg, PulseOn, sample} from './Neural';

const CX = 540;
const CY = 930;
const polar = (r: number, a: number): V => ({x: CX + r * Math.cos((a * Math.PI) / 180), y: CY + r * Math.sin((a * Math.PI) / 180)});
const hexD = (r: number) => `M${Array.from({length: 6}, (_, i) => P(polar(r, i * 60 + 30))).join(' L')} Z`;

const wave = (cx: number, cy: number, w: number, amp: number, kind: 'smooth' | 'jag') => {
  const n = 40;
  const pts: string[] = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const x = cx - w / 2 + u * w;
    const y = kind === 'smooth' ? cy + Math.sin(u * Math.PI * 4) * amp * Math.sin(u * Math.PI) : cy + (((Math.sin(u * 37.3) + Math.sin(u * 91.1 + 2)) * 0.5) * amp * 1.35) * Math.sin(Math.PI * Math.min(1, u * 1.2));
    pts.push(`${fmt(x)},${fmt(y)}`);
  }
  return `M${pts.join(' L')}`;
};

/** the input badge: a rounded plate with the pattern's waveform, ringed in its colour */
const Badge: React.FC<{c: V; k: number; color: string; kind: 'smooth' | 'jag'; id: string}> = ({c, k, color, kind, id}) => {
  if (k <= 0.01) return null;
  return (
    <g transform={`translate(${fmt(c.x)} ${fmt(c.y)}) scale(${fmt(k)}) translate(${fmt(-c.x)} ${fmt(-c.y)})`}>
      <Glow id={`${id}-g`} c={c} r={120} color={color} alpha={0.5} />
      <path d={rr(c.x - 74, c.y - 56, 148, 112, 30)} fill="#0D1F44" stroke={color} strokeWidth={8} />
      <path d={wave(c.x, c.y, 100, 26, kind)} stroke={color} strokeWidth={9} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d={wave(c.x, c.y, 100, 26, kind)} stroke="#FFFFFF" strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.8} />
    </g>
  );
};

/** the one message: a clean white bubble with three dots (the same drawing for both) */
const Token: React.FC<{c: V; k: number; id: string; f: number}> = ({c, k, id, f}) => {
  if (k <= 0.01) return null;
  return (
    <g transform={`translate(${fmt(c.x)} ${fmt(c.y)}) scale(${fmt(k)}) translate(${fmt(-c.x)} ${fmt(-c.y)})`}>
      <Glow id={`${id}-g`} c={c} r={150} color={CYAN} alpha={0.55} />
      <path d={rr(c.x - 104, c.y - 52, 208, 104, 52)} fill="#FFFFFF" stroke={INK} strokeWidth={6} />
      <path d={`M${c.x - 34},${c.y + 50} L${c.x - 58},${c.y + 88} L${c.x + 8},${c.y + 50} Z`} fill="#FFFFFF" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <path d={`M${c.x - 38},${c.y + 48} L${c.x + 4},${c.y + 48}`} stroke="#FFFFFF" strokeWidth={9} />
      {[-44, 0, 44].map((dx, i) => (
        <circle key={i} cx={c.x + dx} cy={c.y} r={13 + 2 * Math.sin(f * 0.5 + i)} fill={BLUE} />
      ))}
    </g>
  );
};

const FlipX = (p: V): V => ({x: 2 * CX - p.x, y: p.y});

export const MechanismView: React.FC<{lt: number; f: number; cam: Cam}> = ({lt, f, cam}) => {
  const bu = (a: number, b: number) => clamp((lt - a) / (b - a));
  const kB = lt < 0.55 ? 0 : easeOutBack(bu(0.55, 0.77), 1.6);
  const kR = lt < 0.8 ? 0 : easeOutBack(bu(0.8, 1.02), 1.6);
  // lane geometry (blue = left, red = mirrored): badge -> die (in), die -> top port (out)
  const badgeB: V = {x: 340, y: 1150};
  const inB = sample([{x: 340, y: 1092}, {x: 340, y: 1050}, {x: 372, y: 1008}, {x: 420, y: 978}], 24);
  const outB = sample([{x: 420, y: 882}, {x: 404, y: 800}, {x: 394, y: 720}, {x: 394, y: 640}], 24);
  const portB: V = {x: 394, y: 618};
  const lane = (c: 'b' | 'r') => ({badge: c === 'b' ? badgeB : FlipX(badgeB), inn: c === 'b' ? inB : inB.map(FlipX), out: c === 'b' ? outB : outB.map(FlipX), port: c === 'b' ? portB : FlipX(portB)});
  const L = {b: lane('b'), r: lane('r')};
  // timeline (lt = t - 21.3): blue in 0.72-1.15, in the die 1.15-1.55, out 1.55-1.75, token 1.75; red the same 0.4 s later
  const uIn = {b: bu(0.72, 1.15), r: bu(1.12, 1.55)};
  const uOut = {b: bu(1.55, 1.75), r: bu(1.95, 2.15)};
  const proc = {b: bu(1.15, 1.55), r: bu(1.55, 1.95)}; // 0..1 while that pattern is in the die
  const tokA = lt < 1.75 ? 0 : easeOutBack(bu(1.75, 1.97), 1.5);
  const tokB = lt < 2.15 ? 0 : easeOutBack(bu(2.15, 2.37), 1.5);
  const eq = clamp((lt - 2.45) / 0.2);
  // the die: tinted by whichever pattern is in it, draining to white as it finishes; the same ring and the same flash
  const dieMix = (c: 'b' | 'r') => {
    const p = proc[c];
    return p > 0 && p < 1 ? Math.sin(Math.PI * Math.min(1, p * 1.15)) : 0;
  };
  const tintB = dieMix('b');
  const tintR = dieMix('r');
  const inDie = tintB > 0 || tintR > 0;
  const flash = Math.max(tintB, tintR) * (Math.max(proc.b, proc.r) > 0.6 ? 1 : 0.35);
  const dieCol = tintB > tintR ? '#46A8FF' : RED;
  const spin = f * (1.0 + 2.2 * Math.max(tintB, tintR));
  const idle = 0.25 + 0.75 * Math.max(tintB, tintR);
  return (
    <g>
      <BlurDefs id="mc" />
      <FieldBg id="mc" cx={540} cy={900} />
      <Layer cam={cam} depth={1}>
        <defs>
          <radialGradient id="mc-bez" gradientUnits="userSpaceOnUse" cx={CX} cy={CY} r={414} fx={CX - 150} fy={CY - 210}>
            <stop offset="0" stopColor="#5E8BFF" />
            <stop offset="0.7" stopColor={BLUE} />
            <stop offset="1" stopColor={BLUE_D} />
          </radialGradient>
          <radialGradient id="mc-die" gradientUnits="userSpaceOnUse" cx={CX} cy={CY} r={150} fx={CX - 50} fy={CY - 66}>
            <stop offset="0" stopColor="#FFE9A6" />
            <stop offset="0.6" stopColor="#E2A93E" />
            <stop offset="1" stopColor="#A56A18" />
          </radialGradient>
          <clipPath id="mc-clip">
            <circle cx={CX} cy={CY} r={346} />
          </clipPath>
        </defs>
        {/* the casing: exactly the decoder's (and the implant's) round blue bezel, rivets and clip tabs */}
        <circle cx={CX} cy={CY} r={424} fill={INK} />
        <circle cx={CX} cy={CY} r={414} fill="url(#mc-bez)" />
        <path d={`M${P(polar(396, 205))} A396 396 0 0 1 ${P(polar(396, 262))}`} stroke="#FFFFFF" strokeWidth={14} strokeLinecap="round" fill="none" opacity={0.28} />
        {Array.from({length: 12}, (_, i) => {
          const p = polar(384, i * 30 + 15);
          return (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r={11} fill={INK} />
              <circle cx={p.x} cy={p.y} r={7.5} fill="#8FB0FF" />
              <circle cx={p.x - 2} cy={p.y - 2} r={2.6} fill="#FFFFFF" opacity={0.8} />
            </g>
          );
        })}
        {[-1, 1].map((sd) => (
          <g key={sd}>
            <path d={rr(CX + sd * 416 - 22, CY - 56, 44, 112, 18)} fill={INK} />
            <path d={rr(CX + sd * 416 - 17, CY - 51, 34, 102, 14)} fill={BLUE} />
          </g>
        ))}
        <circle cx={CX} cy={CY} r={354} fill={INK} />
        <circle cx={CX} cy={CY} r={346} fill="#0A1A3A" stroke="#9AF0FF" strokeOpacity={0.5} strokeWidth={4} />
        <g clipPath="url(#mc-clip)">
          {Array.from({length: 12}, (_, i) => (
            <path key={i} d={`M180,${600 + i * 56} H900`} stroke="#1C3C7A" strokeOpacity={0.5} strokeWidth={2} />
          ))}
          {/* a divider: intended on the left of the die, unwanted on the right */}
          <path d={`M${CX},${CY + 150} V${CY + 330}`} stroke="#1C3C7A" strokeWidth={3} strokeOpacity={0.7} />
          {/* lane traces (dim until a pulse runs on them) */}
          {(['b', 'r'] as const).map((c) => (
            <g key={c}>
              <path d={`M${sample([L[c].badge, ...[0, 6, 12, 18, 24].map((i) => L[c].inn[i])], 18).map(P).join(' L')}`} stroke={c === 'b' ? '#46A8FF' : RED} strokeOpacity={0.35} strokeWidth={6} fill="none" strokeLinecap="round" />
              <path d={`M${L[c].out.map(P).join(' L')}`} stroke="#9AE6FF" strokeOpacity={0.35} strokeWidth={6} fill="none" strokeLinecap="round" />
              <circle cx={L[c].port.x} cy={L[c].port.y} r={14} fill="#0A1A3A" stroke="#9AE6FF" strokeWidth={5} />
            </g>
          ))}
          {/* the die: one hexagon for both patterns */}
          <path d={hexD(158)} fill={INK} />
          <path d={hexD(150)} fill="url(#mc-die)" />
          <path d={hexD(118)} fill="#0C1E44" stroke={INK} strokeWidth={4} />
          {Array.from({length: 5}, (_, i) => (
            <g key={i}>
              <path d={`M${CX - 100},${CY - 64 + i * 32} H${CX + 100}`} stroke={inDie ? dieCol : '#46CFFF'} strokeOpacity={0.3 + 0.55 * Math.max(tintB, tintR)} strokeWidth={3} />
              <path d={`M${CX - 64 + i * 32},${CY - 100} V${CY + 100}`} stroke={inDie ? dieCol : '#46CFFF'} strokeOpacity={0.3 + 0.55 * Math.max(tintB, tintR)} strokeWidth={3} />
            </g>
          ))}
          <g transform={`rotate(${fmt(spin)} ${CX} ${CY})`} opacity={0.35 + 0.65 * idle}>
            <circle cx={CX} cy={CY} r={82} fill="none" stroke="#9AE6FF" strokeWidth={5} strokeDasharray="26 20" />
          </g>
          {inDie && <Glow id="mc-halo" c={{x: CX, y: CY}} r={230} color={dieCol} alpha={0.55 * Math.max(tintB, tintR) * (1 - 0.75 * Math.max(proc.b > 0 && proc.b < 1 ? proc.b : 0, proc.r > 0 && proc.r < 1 ? proc.r : 0))} />}
          <Glow id="mc-core" c={{x: CX, y: CY}} r={110} color={flash > 0.5 ? '#FFFFFF' : inDie ? dieCol : CYAN} alpha={0.2 + 0.7 * Math.max(tintB, tintR, flash * 0.9)} />
          <circle cx={CX} cy={CY} r={30 + 14 * flash} fill="#FFFFFF" opacity={0.25 + 0.75 * flash} />
        </g>
        {/* the pulses: blue in, red in, then the SAME white-cyan pulse out on each lane */}
        <PulseOn id="mp1" pts={L.b.inn} u={uIn.b} len={0.55} color="#46A8FF" w={9} alpha={uIn.b > 0 && uIn.b < 1 ? 1 : 0} />
        <PulseOn id="mp2" pts={L.r.inn} u={uIn.r} len={0.55} color={RED} w={9} alpha={uIn.r > 0 && uIn.r < 1 ? 1 : 0} />
        <PulseOn id="mp3" pts={L.b.out} u={uOut.b} len={0.4} color={CYAN} w={10} alpha={uOut.b > 0 && uOut.b < 1 ? 1 : 0} />
        <PulseOn id="mp4" pts={L.r.out} u={uOut.r} len={0.4} color={CYAN} w={10} alpha={uOut.r > 0 && uOut.r < 1 ? 1 : 0} />
        {/* the input badges sit on their lanes, inside the cavity */}
        <Badge c={L.b.badge} k={kB} color="#46A8FF" kind="smooth" id="mb1" />
        <Badge c={L.r.badge} k={kR} color={RED} kind="jag" id="mb2" />
        {/* the two identical tokens, each above its own output port */}
        <Token c={{x: L.b.port.x, y: 400}} k={tokA} id="mt1" f={f} />
        <Token c={{x: L.r.port.x, y: 400}} k={tokB} id="mt2" f={f} />
        {eq > 0 && (
          <g opacity={eq}>
            <rect x={CX - 36} y={380} width={72} height={11} rx={5} fill="#FFFFFF" />
            <rect x={CX - 36} y={414} width={72} height={11} rx={5} fill="#FFFFFF" />
          </g>
        )}
      </Layer>
    </g>
  );
};

void easeOut;
void lerp;
