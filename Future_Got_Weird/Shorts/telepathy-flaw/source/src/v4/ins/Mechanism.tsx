// V4 mechanism insert (the flaw): two different patterns, one chip. The intended pattern (blue, smooth) and the unwanted
// one (red, jagged) enter the same port, light the same three stages (capture, decode, send) the same way, and leave as
// the same token. No new labels: colour and the equal sign carry it.
import React from 'react';
import {Cam, Layer} from '../../lib/camera';
import {mix} from '../../lib/color';
import {INK} from '../../lib/ink';
import {clamp, easeInOut, easeOut, easeOutBack, fmt, lerp, P, V} from '../../lib/math';
import {Glow} from '../../lib/shade';
import {rr} from '../env/Props';
import {BLUE, BLUE_D, CYAN, RED} from '../art/Implant';
import {BlurDefs, FieldBg, PulseOn, sample} from './Neural';

const wave = (cx: number, cy: number, w: number, amp: number, kind: 'smooth' | 'jag') => {
  const n = 44;
  const pts: string[] = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const x = cx - w / 2 + u * w;
    let y: number;
    if (kind === 'smooth') y = cy + Math.sin(u * Math.PI * 4) * amp * Math.sin(u * Math.PI);
    else y = cy + (((Math.sin(u * 37.3) + Math.sin(u * 91.1 + 2)) * 0.5) * amp * 1.35) * Math.sin(Math.PI * Math.min(1, u * 1.2));
    pts.push(`${fmt(x)},${fmt(y)}`);
  }
  return `M${pts.join(' L')}`;
};

const Bubble: React.FC<{x: number; y: number; k: number; color: string; kind: 'smooth' | 'jag'; id: string}> = ({x, y, k, color, kind, id}) => {
  if (k <= 0.01) return null;
  return (
    <g transform={`translate(${fmt(x)} ${fmt(y)}) scale(${fmt(k)}) translate(${fmt(-x)} ${fmt(-y)})`}>
      <Glow id={`${id}-g`} c={{x, y}} r={190} color={color} alpha={0.45} />
      <path d={`M${x - 120},${y} Q${x - 160},${y - 80} ${x - 70},${y - 100} Q${x - 20},${y - 170} ${x + 50},${y - 110} Q${x + 150},${y - 120} ${x + 130},${y - 30} Q${x + 170},${y + 40} ${x + 90},${y + 70} Q${x + 40},${y + 120} ${x - 30},${y + 80} Q${x - 120},${y + 100} ${x - 120},${y} Z`} fill="#0D1F44" stroke={color} strokeWidth={7} strokeLinejoin="round" />
      <path d={wave(x, y, 190, 34, kind)} stroke={color} strokeWidth={9} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d={wave(x, y, 190, 34, kind)} stroke="#FFFFFF" strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.8} />
      <circle cx={x - 40} cy={y + 150} r={12} fill={color} opacity={0.9} />
      <circle cx={x - 14} cy={y + 186} r={7} fill={color} opacity={0.9} />
    </g>
  );
};

const Token: React.FC<{x: number; y: number; k: number; id: string; f: number}> = ({x, y, k, id, f}) => {
  if (k <= 0.01) return null;
  return (
    <g transform={`translate(${fmt(x)} ${fmt(y)}) scale(${fmt(k)}) translate(${fmt(-x)} ${fmt(-y)})`}>
      <Glow id={`${id}-g`} c={{x, y}} r={150} color={CYAN} alpha={0.55} />
      <path d={rr(x - 110, y - 54, 220, 108, 54)} fill="#FFFFFF" stroke={INK} strokeWidth={6} />
      <path d={`M${x - 36},${y + 52} L${x - 62},${y + 92} L${x + 8},${y + 52} Z`} fill="#FFFFFF" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <path d={`M${x - 40},${y + 50} L${x + 4},${y + 50}`} stroke="#FFFFFF" strokeWidth={9} />
      {[-46, 0, 46].map((dx, i) => (
        <circle key={i} cx={x + dx} cy={y} r={13 + 2 * Math.sin(f * 0.5 + i)} fill={BLUE} />
      ))}
    </g>
  );
};

export const MechanismView: React.FC<{lt: number; f: number; cam: Cam}> = ({lt, f, cam}) => {
  const cx = 540;
  const popB = clamp((lt - 0.55) / 0.22);
  const popR = clamp((lt - 0.8) / 0.22);
  const kB = popB <= 0 ? 0 : easeOutBack(popB, 1.6);
  const kR = popR <= 0 ? 0 : easeOutBack(popR, 1.6);
  const stageY = [820, 1010, 1200];
  const portTop: V = {x: cx, y: 690};
  const funB = sample([{x: 300, y: 560}, {x: 380, y: 620}, {x: 480, y: 660}, portTop], 20);
  const funR = sample([{x: 780, y: 560}, {x: 700, y: 620}, {x: 600, y: 660}, portTop], 20);
  const spine = sample([portTop, {x: cx, y: 1290}], 30);
  // blue pulse: funnel 0.9-1.15, spine 1.15-1.75; red: funnel 1.3-1.55, spine 1.55-2.15 (the same path, the same speed)
  const bu = (a: number, b: number) => easeInOut(clamp((lt - a) / (b - a)));
  const bFun = bu(0.9, 1.15);
  const bSp = bu(1.15, 1.75);
  const rFun = bu(1.3, 1.55);
  const rSp = bu(1.55, 2.15);
  const stageLit = (y: number) => {
    const u = (y - 690) / (1290 - 690);
    const one = (a: number, b: number) => {
      const p = bu(a, b);
      return clamp(1 - Math.abs(p - u) * 5);
    };
    return Math.max(one(1.15, 1.75), one(1.55, 2.15));
  };
  const tokA = clamp((lt - 1.75) / 0.25);
  const tokB = clamp((lt - 2.15) / 0.25);
  const eq = clamp((lt - 2.45) / 0.2);
  const spinK = f * 1.6;
  return (
    <g>
      <BlurDefs id="mc" />
      <FieldBg id="mc" cx={540} cy={900} />
      <Layer cam={cam} depth={1}>
        {/* the sources */}
        <Bubble x={300} y={400} k={kB} color="#46A8FF" kind="smooth" id="mb1" />
        <Bubble x={780} y={400} k={kR} color={RED} kind="jag" id="mb2" />
        {/* funnels */}
        {[funB, funR].map((pts, i) => (
          <g key={i}>
            <path d={`M${pts.map(P).join(' L')}`} stroke={i ? RED : '#46A8FF'} strokeOpacity={0.35} strokeWidth={8} fill="none" strokeLinecap="round" opacity={i ? popR : popB} />
          </g>
        ))}
        {/* the chip */}
        <path d={rr(210, 640, 660, 780, 76)} fill={INK} />
        <defs>
          <linearGradient id="mc-case" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#4C7CFF" />
            <stop offset="0.5" stopColor={BLUE} />
            <stop offset="1" stopColor={BLUE_D} />
          </linearGradient>
        </defs>
        <path d={rr(220, 650, 640, 760, 70)} fill="url(#mc-case)" />
        <path d={rr(220, 650, 640, 110, 70)} fill="#FFFFFF" opacity={0.12} />
        <path d={rr(256, 686, 568, 688, 46)} fill="#0A1A3A" stroke={INK} strokeWidth={5} />
        {/* the input port */}
        <path d={rr(cx - 70, 636, 140, 40, 18)} fill="#0A1A3A" stroke={INK} strokeWidth={5} />
        <path d={`M${cx - 50},656 H${cx + 50}`} stroke="#9AE6FF" strokeWidth={6} strokeLinecap="round" opacity={0.7} />
        {/* the spine between the stages */}
        <path d={`M${spine.map(P).join(' L')}`} stroke="#46CFFF" strokeOpacity={0.35} strokeWidth={7} fill="none" />
        {/* three stages: capture (comb), decode (die), send (waves) */}
        {stageY.map((y, i) => {
          const lit = stageLit(y);
          return (
            <g key={i}>
              <Glow id={`mc-sg${i}`} c={{x: cx, y}} r={150} color="#9AE6FF" alpha={0.75 * lit} />
              <path d={rr(cx - 100, y - 78, 200, 156, 28)} fill="#13306A" stroke={mix('#2E5AB8', '#9AE6FF', lit)} strokeWidth={5 + 3 * lit} />
              {i === 0 &&
                [-56, -28, 0, 28, 56].map((dx, j) => (
                  <g key={j}>
                    <path d={`M${cx + dx},${y - 52} V${y + 20}`} stroke={mix('#7FA6E8', '#FFFFFF', lit)} strokeWidth={6} strokeLinecap="round" />
                    <circle cx={cx + dx} cy={y + 30} r={8} fill={mix(CYAN, '#FFFFFF', lit)} />
                  </g>
                ))}
              {i === 1 && (
                <g>
                  <path d={`M${Array.from({length: 6}, (_, a) => P({x: cx + 56 * Math.cos(((a * 60 + 30) * Math.PI) / 180), y: y + 56 * Math.sin(((a * 60 + 30) * Math.PI) / 180)})).join(' L')} Z`} fill="#0C1E44" stroke="#E2A93E" strokeWidth={7} strokeLinejoin="round" />
                  <g transform={`rotate(${fmt(spinK * (0.3 + lit))} ${cx} ${y})`}>
                    <circle cx={cx} cy={y} r={30} fill="none" stroke={mix('#46CFFF', '#FFFFFF', lit)} strokeWidth={5} strokeDasharray="14 12" />
                  </g>
                  <circle cx={cx} cy={y} r={10 + 8 * lit} fill="#FFFFFF" opacity={0.4 + 0.6 * lit} />
                </g>
              )}
              {i === 2 &&
                [34, 58, 82].map((r, j) => (
                  <path key={j} d={`M${cx + r * 0.2},${y - r * 0.8} A${r} ${r} 0 0 1 ${cx + r * 0.2},${y + r * 0.8}`} stroke={mix('#7FA6E8', '#FFFFFF', lit)} strokeWidth={7} strokeLinecap="round" fill="none" opacity={0.5 + 0.5 * lit} transform={`translate(${-r * 0.5} 0)`} />
                ))}
            </g>
          );
        })}
        {/* the pulses: same path, same speed */}
        <PulseOn id="mp1" pts={funB} u={bFun} len={0.5} color="#46A8FF" w={9} alpha={bFun > 0 && bFun < 1 ? 1 : 0} />
        <PulseOn id="mp2" pts={spine} u={bSp} len={0.18} color="#46A8FF" w={10} alpha={bSp > 0 && bSp < 1 ? 1 : 0} />
        <PulseOn id="mp3" pts={funR} u={rFun} len={0.5} color={RED} w={9} alpha={rFun > 0 && rFun < 1 ? 1 : 0} />
        <PulseOn id="mp4" pts={spine} u={rSp} len={0.18} color={RED} w={10} alpha={rSp > 0 && rSp < 1 ? 1 : 0} />
        {/* output port and the two identical tokens */}
        <path d={rr(cx - 70, 1394, 140, 40, 18)} fill="#0A1A3A" stroke={INK} strokeWidth={5} />
        <Token x={lerp(cx, 330, easeOut(tokA))} y={lerp(1420, 1610, easeOut(tokA))} k={tokA > 0 ? 0.3 + 0.7 * easeOut(tokA) : 0} id="mt1" f={f} />
        <Token x={lerp(cx, 750, easeOut(tokB))} y={lerp(1420, 1610, easeOut(tokB))} k={tokB > 0 ? 0.3 + 0.7 * easeOut(tokB) : 0} id="mt2" f={f} />
        {eq > 0 && (
          <g opacity={eq}>
            <rect x={cx - 38} y={1586} width={76} height={11} rx={5} fill="#FFFFFF" />
            <rect x={cx - 38} y={1622} width={76} height={11} rx={5} fill="#FFFFFF" />
          </g>
        )}
      </Layer>
    </g>
  );
};
