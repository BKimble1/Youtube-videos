import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, F} from './theme';
import {CAST} from './components/cast';
import {Character, IDLE} from './components/Character';
import {Slip} from './components/Props';
import {Magnifier} from './components/Props2';
import {SLIPS} from './scenes/S1_Counter';

/**
 * Thumbnails (1920×1080 stills). One focal point each, type that stays readable at phone size (the smallest
 * display line is 150 px tall), original cutout cast only, and the real Table 1 excerpt labelled by model and
 * date. No logos, no real faces, no claim the film does not make.
 */

const Line: React.FC<{children: React.ReactNode; size: number; color?: string; bar?: string; style?: React.CSSProperties}> = ({children, size, color = C.ink, bar, style}) => (
  <div style={{position: 'relative', display: 'inline-block', fontFamily: F.display, fontWeight: 700, fontSize: size, lineHeight: 1, color, letterSpacing: '-0.015em', whiteSpace: 'nowrap', ...style}}>
    {bar && <div style={{position: 'absolute', left: -size * 0.08, right: -size * 0.08, bottom: size * 0.02, height: size * 0.3, background: bar, borderRadius: size * 0.1, zIndex: -1}} />}
    {children}
  </div>
);

const SlipText: React.FC<{i: number; hi?: 'title' | 'year' | 'all'}> = ({i, hi = 'title'}) => {
  const s = SLIPS[i];
  const mark = (on: boolean, text: string) => (
    <span style={on ? {background: C.coral, color: C.white, borderRadius: 8, padding: '0 10px'} : undefined}>{text}</span>
  );
  return (
    <span>
      {s.pre}
      {mark(hi === 'year' || hi === 'all', s.year)}
      {s.mid}
      {mark(hi === 'title' || hi === 'all', s.title)}
      {s.post}
    </span>
  );
};

const Paper: React.FC<{children: React.ReactNode; blob?: {x: number; y: number; r: number; color: string}}> = ({children, blob}) => (
  <AbsoluteFill style={{background: C.paper, overflow: 'hidden'}}>
    {blob && <div style={{position: 'absolute', left: blob.x - blob.r, top: blob.y - blob.r, width: blob.r * 2, height: blob.r * 2, borderRadius: '50%', background: blob.color}} />}
    {children}
  </AbsoluteFill>
);

/** A: "SO SURE. SO WRONG." with the ChatGPT slip stamped WRONG and the clerk who handed it over. */
export const ThumbA: React.FC = () => (
  <Paper blob={{x: 1480, y: 600, r: 640, color: C.saffron}}>
    <div style={{position: 'absolute', left: 90, top: 150}}>
      <Line size={230}>SO SURE.</Line>
    </div>
    <div style={{position: 'absolute', left: 90, top: 420}}>
      <Line size={230} color={C.coral}>SO WRONG.</Line>
    </div>
    <Character look={CAST.clerkA} pose={{...IDLE, armR: {a: 30, b: 70}, mouth: 'grin', brows: 0.7, lookX: -0.4, lookY: 0.3}} frame={0} seed={3} x={1560} y={1260} scale={2.3} />
    <div style={{position: 'absolute', left: 930, top: 610}}>
      <Slip model={SLIPS[0].model} detail={SLIPS[0].detail} width={860} fontSize={42} rotate={-5} stamp={{text: 'Wrong', tone: 'coral', t: 1}}>
        <SlipText i={0} hi="title" />
      </Slip>
    </div>
  </Paper>
);

/** B: "IT MADE THIS UP" over the invented title, with the fact-checker's magnifier on it. */
export const ThumbB: React.FC = () => (
  <Paper blob={{x: 420, y: 980, r: 560, color: C.tealLight}}>
    <div style={{position: 'absolute', left: 0, right: 0, top: 70, textAlign: 'center'}}>
      <Line size={250} bar={C.saffron}>IT MADE</Line>
    </div>
    <div style={{position: 'absolute', left: 0, right: 0, top: 350, textAlign: 'center'}}>
      <Line size={250} color={C.coral}>THIS UP</Line>
    </div>
    <Character look={CAST.checker} pose={{...IDLE, armL: {a: 30, b: 90}, mouth: 'flat', brows: -0.3, lookX: 0.8, lookY: 0.4}} frame={0} seed={9} x={300} y={1300} scale={2.4} flip />
    <div style={{position: 'absolute', left: 560, top: 690}}>
      <Slip model={SLIPS[0].model} detail={SLIPS[0].detail} width={1100} fontSize={46} rotate={2}>
        <SlipText i={0} hi="title" />
      </Slip>
    </div>
    <div style={{position: 'absolute', left: 1180, top: 880}}>
      <Magnifier scale={2.2} />
    </div>
  </Paper>
);

/** C: "3 ANSWERS. ALL WRONG." with the three stamped slips fanned out. */
export const ThumbC: React.FC = () => (
  <Paper blob={{x: 1380, y: 560, r: 600, color: C.coralLight}}>
    <div style={{position: 'absolute', left: 80, top: 170}}>
      <Line size={190}>3 ANSWERS.</Line>
    </div>
    <div style={{position: 'absolute', left: 80, top: 410}}>
      <Line size={190} color={C.coral}>ALL WRONG.</Line>
    </div>
    {[2, 1, 0].map((i, k) => (
      <div key={i} style={{position: 'absolute', left: 1110 + (2 - k) * 70, top: 250 + k * 225}}>
        <Slip model={SLIPS[i].model} detail={SLIPS[i].detail} width={660} fontSize={31} rotate={-7 + k * 5} stamp={{text: 'Wrong', tone: 'coral', t: 1}}>
          <SlipText i={i} hi="all" />
        </Slip>
      </div>
    ))}
  </Paper>
);
