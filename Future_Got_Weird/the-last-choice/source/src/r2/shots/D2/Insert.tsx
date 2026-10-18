// D2-2a: the insert on the decoy maker's battered tablet. The scene behind is the real place (a close camera over her
// shoulder at the slab: her knees, the rubble); over it, the tablet fills most of the frame — her left hand grips its
// edge, her right index finger sketches four walking figures (fx/decoy DecoyScreen + decoyFinger, the same strokes the
// projector will throw) and taps: they fill and start to walk.
import React from 'react';
import {Stage, camPath} from '../../film/stage';
import {noise, clamp, smooth} from '../../../kit/math';
import {DecoyScreen, decoyFinger} from '../../fx';
import {EV2} from './machines';
import {d2Items, d2FxAt} from './battle';
import {CAM_INSERT} from './cams';
const SKIN = '#8D5A3C', SKIN_D = '#6E4329', SKIN_L = '#A9714F', SLEEVE = '#3E6FB0', SLEEVE_D = '#2E5488', INK = '#162A32';
const SLATE = '#3A444C', SLATE_L = '#58646D', SLATE_D = '#262D33';

/** the insert at film time T (D2-2a and D2-2c share one camera move from DECOY) */
export const TabletInsert: React.FC<{T: number}> = ({T}) => {
  const cam = camPath(CAM_INSERT, T - 95.38, 0.5);
  const f = d2FxAt(T);
  // handheld: the tablet drifts a little in her hands; it nods once at the tap
  const tap = Math.exp(-Math.max(0, T - EV2.tap) * 9) * (T > EV2.tap ? 1 : 0);
  const dx = noise(T * 0.9, 3) * 9 + noise(T * 2.3, 5) * 2.5, dy = noise(T * 0.8, 7) * 7 + noise(T * 2.1, 9) * 2 + 10 * tap;
  const rot = -5 + noise(T * 0.6, 11) * 1.2;
  const W = 1120, H = 740, SW = 1000, SH = 620;
  const fin = decoyFinger({w: SW, h: SH, t: T, t0: EV2.sketch, sketchDur: EV2.sketchDur, tapAt: EV2.tap});
  // the finger lifts between strokes (short hops) and after the tap draws back
  const lift = fin.down ? 0 : clamp(1 - Math.abs(Math.sin(T * 7.5)) * 0.4) * (T > EV2.tap + 0.12 ? smooth((T - EV2.tap - 0.12) / 0.3) * 2.2 + 0.6 : 0.6);
  const tipX = (fin.u - 0.5) * SW, tipY = (fin.v - 0.5) * SH - 6 - lift * 14;
  const shadowOff = 4 + lift * 22;
  const glow = T > EV2.tap ? 0.55 : 0.32;
  return (
    <Stage T={T} cam={cam} lights={f.lights} drift={0.008} vignette={0.9} items={(v) => [...d2Items(v, T, {full: 12, army: false}), ...f.items]}
      over={
        <g transform={`translate(${960 + dx} ${560 + dy}) rotate(${rot})`}>
          {/* her left forearm and hand gripping the tablet's left edge */}
          <path d={`M ${-W / 2 - 420} ${80} L ${-W / 2 + 10} ${40} L ${-W / 2 + 30} ${250} L ${-W / 2 - 420} ${330} Z`} fill={SLEEVE} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
          <path d={`M ${-W / 2 - 40} ${52} L ${-W / 2 + 12} ${48} L ${-W / 2 + 26} ${236} L ${-W / 2 - 30} ${244} Z`} fill={SLEEVE_D} opacity={0.6} />
          {/* the tablet: battered slate bezel, a crack across a corner, the clip-on projector on its top edge */}
          <rect x={-W / 2 + 14} y={-H / 2 + 18} width={W} height={H} rx={46} fill={SLATE_D} />
          <rect x={-W / 2} y={-H / 2} width={W} height={H} rx={46} fill={SLATE} stroke={INK} strokeWidth={6} />
          <path d={`M ${-W / 2 + 30} ${-H / 2 + 20} Q 0 ${-H / 2 - 4} ${W / 2 - 30} ${-H / 2 + 20}`} fill="none" stroke={SLATE_L} strokeWidth={5} strokeLinecap="round" />
          <g transform={`translate(${-SW / 2} ${-SH / 2})`}>
            <DecoyScreen w={SW} h={SH} t={T} t0={EV2.sketch} sketchDur={EV2.sketchDur} tapAt={EV2.tap} ink={3} />
            {/* screen sheen */}
            <path d={`M 0 ${SH * 0.18} L ${SW * 0.28} 0 L ${SW * 0.4} 0 L 0 ${SH * 0.3} Z`} fill="#FFFFFF" opacity={0.05} />
          </g>
          <rect x={-70} y={-H / 2 - 46} width={140} height={58} rx={14} fill="#5B646B" stroke={INK} strokeWidth={5} />
          <circle cx={0} cy={-H / 2 - 18} r={17} fill={T > EV2.tap ? '#FFF2C8' : '#7FA4AE'} stroke={INK} strokeWidth={3} />
          <path d={`M ${W / 2 - 150} ${H / 2 - 8} L ${W / 2 - 110} ${H / 2 - 70} L ${W / 2 - 60} ${H / 2 - 52}`} fill="none" stroke="#8FA6AD" strokeWidth={3} />
          {/* left-hand fingers over the bezel's front edge, the thumb on the glass margin */}
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={-W / 2 - 24} y={58 + i * 46} width={92 - i * 6} height={40} rx={20} fill={i % 2 ? SKIN : SKIN_L} stroke={INK} strokeWidth={4.5} />
          ))}
          <path d={`M ${-W / 2 - 10} ${30} Q ${-W / 2 + 70} ${-8} ${-W / 2 + 92} ${30} Q ${-W / 2 + 80} ${58} ${-W / 2 + 14} ${66} Z`} fill={SKIN} stroke={INK} strokeWidth={4.5} strokeLinejoin="round" />
          {/* her right hand: the index finger on the glass, the screen's light on its tip */}
          <g transform={`translate(${tipX} ${tipY})`}>
            <ellipse cx={shadowOff * 0.6} cy={shadowOff} rx={20} ry={11} fill="#000" opacity={0.28} />
            <g transform="rotate(-38)">
              <path d={`M -17 0 Q -17 -18 0 -18 Q 17 -18 17 0 L 22 150 L -22 150 Z`} fill={SKIN} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
              <path d={`M -6 -12 Q 0 -16 8 -12`} fill="none" stroke={SKIN_L} strokeWidth={4} strokeLinecap="round" />
              <path d={`M -40 140 Q -64 210 -44 300 L 104 330 Q 128 228 96 150 Q 60 120 22 132 Z`} fill={SKIN} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
              <path d={`M 22 150 Q 70 150 88 186 Q 92 214 70 222`} fill="none" stroke={SKIN_D} strokeWidth={5} strokeLinecap="round" />
              <path d={`M 30 196 Q 70 200 84 236`} fill="none" stroke={SKIN_D} strokeWidth={5} strokeLinecap="round" />
              <path d={`M -60 286 L 120 318 L 140 520 L -90 520 Z`} fill={SLEEVE} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
              <circle cx={0} cy={-6} r={26} fill="#FFE9A8" opacity={glow * (fin.down ? 0.55 : 0.25)} />
            </g>
          </g>
        </g>
      }
    />
  );
};
