// "Think about saying 'banana.'" ... "The researchers wanted the movements to follow the speech."
// Two matched panels: the visitor's face and the robot's face, mouths at the same height. The visitor's mouth moves
// through the actual syllables of the narrated "banana" (timed from the take), then through the movements as they are
// described. The robot's untrained try sits a beat behind, with its linkages visible. Then the deliberately crude
// comparison: a jaw driven only by loudness (labelled), and a sock puppet flapping to the same loudness. Finally the
// shapes follow a speech sample instead (a slowed replay of the same "banana", with its playhead).
import React from 'react';
import {Head, EXPR_NEUTRAL} from '../dc/Head';
import {INK} from '../dc/ink';
import {clamp, fmt, lerp} from '../dc/math';
import {Robot} from '../art/Robot';
import {Tag, UI, Wave} from '../art/Ui';
import {LPAL} from '../art/Lab';
import {pr, T} from '../lib/core';
import {BANANA, loudSm, Vis} from '../lib/visemes';
import {humanMouth, K, REPLAY, replayT, robotAt, visitorAt} from '../state';

const PANEL = {w: 760, h: 760, y: 150};
const Frame: React.FC<{id: string; x: number; k?: number; children: React.ReactNode; bg?: string}> = ({id, x, k = 1, children, bg = '#E8DFCB'}) => (
  <g opacity={clamp(k * 1.4)} transform={`translate(${fmt(x)} ${fmt(PANEL.y + (1 - clamp(k)) * 60)})`}>
    <defs>
      <clipPath id={`${id}-c`}>
        <rect x={0} y={0} width={PANEL.w} height={PANEL.h} rx={28} />
      </clipPath>
    </defs>
    <rect x={8} y={10} width={PANEL.w} height={PANEL.h} rx={28} fill="#000" opacity={0.15} />
    <g clipPath={`url(#${id}-c)`}>
      <rect x={0} y={0} width={PANEL.w} height={PANEL.h} fill={bg} />
      <rect x={0} y={PANEL.h * 0.72} width={PANEL.w} height={PANEL.h} fill={LPAL.wains} opacity={0.55} />
      {children}
    </g>
    <rect x={0} y={0} width={PANEL.w} height={PANEL.h} rx={28} fill="none" stroke={INK} strokeWidth={4} />
  </g>
);

/** the sock puppet: a grey sock on a hand, two button eyes, a hinged mouth opened by loudness */
const Puppet: React.FC<{x: number; y: number; open: number}> = ({x, y, open}) => {
  const a = 22 * clamp(open);
  return (
    <g transform={`translate(${fmt(x)} ${fmt(y)})`}>
      {/* arm */}
      <path d="M-70,120 C-80,260 -60,420 -40,520 L90,520 C100,420 110,260 90,120 Z" fill="#C9CCD1" stroke={INK} strokeWidth={4} />
      {[180, 250, 320, 390].map((yy) => (
        <path key={yy} d={`M-76,${yy} Q10,${yy + 14} 98,${yy}`} fill="none" stroke="#E06A4F" strokeWidth={10} opacity={0.8} />
      ))}
      {/* lower jaw */}
      <g transform={`rotate(${fmt(a)} -120 40)`}>
        <path d="M-150,40 C-150,110 60,140 120,90 L120,60 Z" fill="#B8BCC2" stroke={INK} strokeWidth={4} />
      </g>
      {/* mouth interior */}
      <path d={`M-148,40 L120,60 L120,${fmt(60 + a * 3)} Z`} fill="#9B3B47" stroke={INK} strokeWidth={3} />
      {/* upper head */}
      <g transform={`rotate(${fmt(-a * 0.35)} -120 40)`}>
        <path d="M-150,40 C-170,-90 40,-140 120,-40 C150,0 140,50 120,60 Z" fill="#CDD1D6" stroke={INK} strokeWidth={4} />
        <circle cx={10} cy={-46} r={22} fill="#2B313A" stroke={INK} strokeWidth={3} />
        <circle cx={70} cy={-30} r={18} fill="#2B313A" stroke={INK} strokeWidth={3} />
        <circle cx={4} cy={-52} r={5} fill="#FFF" opacity={0.8} />
        <circle cx={65} cy={-35} r={4} fill="#FFF" opacity={0.8} />
        {[[-2, -56], [16, -40]].map(([px, py], i) => <circle key={i} cx={px} cy={py} r={2.4} fill="#8B929A" />)}
      </g>
    </g>
  );
};

/** small mouth-shape icons above the replay waveform */
const VisIcon: React.FC<{x: number; y: number; v: Vis; hot: boolean}> = ({x, y, v, hot}) => {
  const o = {rest: 2, B: 0, A: 16, N: 6, W: 8, E: 5, O: 12}[v];
  const w = {rest: 22, B: 22, A: 20, N: 22, W: 12, E: 28, O: 15}[v];
  return (
    <g transform={`translate(${fmt(x)} ${fmt(y)})`}>
      <rect x={-34} y={-30} width={68} height={60} rx={12} fill={hot ? UI.warm : UI.paper} stroke={INK} strokeWidth={hot ? 3 : 2} />
      <ellipse cx={0} cy={0} rx={w} ry={Math.max(2, o)} fill={o > 1 ? '#5B2A35' : 'none'} stroke={INK} strokeWidth={3} />
      <text x={0} y={46} textAnchor="middle" fontFamily="Nunito Variable" fontWeight={800} fontSize={18} fill={INK}>
        {v === 'B' ? 'b' : v === 'A' ? 'a' : v === 'N' ? 'n' : ''}
      </text>
    </g>
  );
};

export const Mouths: React.FC<{f: number}> = ({f}) => {
  const t = f / 30;
  const st = robotAt(f);
  const vis = visitorAt(f);
  const hm = humanMouth(t);
  const push = 1 + 0.04 * pr(f, K.banana, K.practiced);
  // panel timing
  const inK = 1; // the panels are in place on the cut (no fade from an empty frame)
  const humanK = inK * (1 - pr(f, K.jaw + 0.1, K.jaw + 0.5));
  const puppetK = pr(f, K.puppet - 0.1, K.puppet + 0.3) * (1 - pr(f, K.follow - 0.2, K.follow + 0.2));
  const followK = pr(f, K.follow, K.follow + 0.4);
  const flapK = pr(f, K.jaw - 0.1, K.jaw + 0.3) * (1 - pr(f, K.follow - 0.1, K.follow + 0.3));
  const tryK = pr(f, K.imagine + 0.5, K.imagine + 1.0) * (1 - pr(f, K.jaw - 0.4, K.jaw));
  const rx = 160;
  const hx = 1000;
  // the replay's playhead and its current viseme
  const rt = replayT(t);
  let vi = 0;
  BANANA.forEach(([tt], i) => {
    if (rt >= tt) vi = i;
  });
  return (
    <g>
      <rect x={0} y={0} width={1920} height={1080} fill="#F1E9D7" />
      <rect x={0} y={790} width={1920} height={290} fill={LPAL.wains} opacity={0.6} />
      <g transform={`translate(960 540) scale(${fmt(push)}) translate(-960 -540)`}>
        <Frame id="mp-r" x={rx} k={inK}>
          <Robot id="mp-rob" st={st} x={PANEL.w / 2} y={330} s={2.7} cut={tryK > 0 ? {u: 0, v: 6, r: 110, k: tryK} : undefined} />
        </Frame>
        {/* person */}
        {humanK > 0.001 && (
          <Frame id="mp-h" x={hx} k={humanK}>
            <Head id="mp-head" c={{x: PANEL.w / 2 - 6, y: 340}} R={238} roll={0} turn={0.12} expr={{...EXPR_NEUTRAL, ...vis.expr, ...hm, gx: -0.05, gy: 0.05, lid: 0.12}} blink={vis.blink} inkW={6} />
          </Frame>
        )}
        {puppetK > 0.001 && (
          <Frame id="mp-p" x={hx} k={puppetK}>
            <Puppet x={PANEL.w / 2} y={300} open={loudSm(t)} />
          </Frame>
        )}
        {followK > 0.001 && (
          <Frame id="mp-f" x={hx} k={followK} bg={UI.paper}>
            <text x={40} y={70} fontFamily="Fredoka Variable" fontWeight={600} fontSize={40} fill={INK}>
              Speech sample
            </text>
            <text x={40} y={108} fontFamily="Nunito Variable" fontWeight={700} fontSize={24} fill="#5A6672">
              “banana”, slowed down
            </text>
            <Wave x={60} y={430} w={640} h={110} t0={REPLAY.a} t1={REPLAY.b} cursor={rt} />
            {BANANA.slice(1, 7).map(([tt, v], i) => (
              <VisIcon key={i} x={110 + i * 108} y={250} v={v} hot={vi === i + 1} />
            ))}
          </Frame>
        )}
      </g>
      {/* labels (screen space) */}
      <Tag x={rx + 30} y={PANEL.y + 60} text="Robot" k={inK} size={26} />
      <Tag x={hx + 30} y={PANEL.y + 60} text="Person" k={humanK} size={26} />
      <Tag x={hx + 30} y={PANEL.y + 60} text="Sock puppet" k={puppetK} size={26} />
      <Tag x={rx + 30} y={PANEL.y + PANEL.h - 30} text="Illustrative comparison: jaw follows loudness only" k={flapK} size={24} tone="warm" />
      <Tag x={rx + 30} y={PANEL.y + PANEL.h - 30} text="Untrained: motors adjusted by guesswork" k={tryK} size={24} tone="warm" />
      <Wave x={rx + 60} y={PANEL.y + PANEL.h + 70} w={640} h={34} t0={t - 2.2} t1={t} k={flapK} color={UI.teal} />
      {puppetK > 0.01 && <Wave x={hx + 60} y={PANEL.y + PANEL.h + 70} w={640} h={34} t0={t - 2.2} t1={t} k={puppetK} color={UI.teal} />}
    </g>
  );
};
export {lerp, T};
