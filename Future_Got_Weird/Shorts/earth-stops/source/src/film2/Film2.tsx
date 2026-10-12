import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C, H, W} from '../theme';
import {E} from '../lib/motion';
import {GlobeH} from '../v2/GlobeH';
import {RW1} from '../v2/choreoH';
import {Captions, WhatIfTag, ramp} from './ui';
import {INSET, insetSpin} from './globe2';
import {Hook2} from './Hook2';
import {Story2} from './Story2';
import {Coast, CoastGraphics} from './Coast2';
import {Lat2} from './Lat2';
import {Payoff2} from './Payoff2';
import {Foam} from './Foam';
import {N_FILM, T} from './timeline';

export type Film2Props = {captions?: boolean; graphics?: boolean; marker?: boolean};

export const FilmV2: React.FC<Film2Props> = ({captions = true, graphics = true, marker = true}) => {
  const f = useCurrentFrame();
  void N_FILM;
  const wipe1 = ramp(f, T.wipe1A, T.wipe1B, E.inOut), x1 = -120 + (W + 420) * wipe1, slant = 170;
  const wipe2 = ramp(f, T.streakA, T.streakB, E.inOut), x2 = -160 + (W + 520) * wipe2;
  return (
    <AbsoluteFill style={{background: C.paper}}>
      {f < RW1 - T.D && <Hook2 f={f} graphics={graphics} />}
      {f >= RW1 - T.D && f < T.wipe1B + 4 && <Story2 f={f} graphics={graphics} />}
      {f >= T.wipe1A - 2 && f < T.foamB + 2 && (
        <>
          <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, clipPath: `polygon(0px 0px, ${x1}px 0px, ${x1 - slant}px ${H}px, 0px ${H}px)`}}>
            <Coast f={f} />
            {graphics && <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0}}><CoastGraphics f={f} /></svg>}
          </div>
          {wipe1 > 0 && wipe1 < 1 && <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0}}><polygon points={`${x1},0 ${x1 + 26},0 ${x1 + 26 - slant},${H} ${x1 - slant},${H}`} fill={C.cream} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" /></svg>}
        </>
      )}
      {f >= T.latA && f < T.streakB + 2 && <Lat2 f={f} graphics={graphics} />}
      {f >= T.streakA - 2 && (
        <>
          <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, clipPath: `polygon(0px 0px, ${x2}px 0px, ${x2 - slant}px ${H}px, 0px ${H}px)`}}>
            <Payoff2 f={f} graphics={graphics} />
          </div>
          {wipe2 > 0 && wipe2 < 1 && <WipeStreaks x={x2} slant={slant} f={f} />}
        </>
      )}
      {f >= T.foamA && f < T.foamC + 2 && <Foam f={f} />}
      {f < T.wipe1A + 12 && <GlobeH f={0} cx={INSET.cx} cy={INSET.cy} R={INSET.R} id="gins" spin={insetSpin(f)} />}
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0}}>
        {marker && <WhatIfTag />}
        {captions && <Captions f={f} />}
      </svg>
    </AbsoluteFill>
  );
};

/** streak wipe into the payoff: long speed lines trail the leading edge */
const WipeStreaks: React.FC<{x: number; slant: number; f: number}> = ({x, slant, f}) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0}}>
    <polygon points={`${x},0 ${x + 18},0 ${x + 18 - slant},${H} ${x - slant},${H}`} fill={C.cream} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
    {Array.from({length: 22}).map((_, i) => {
      const y = 60 + i * 86 + ((i * 37) % 30), ex = x - slant * (y / H), len = 160 + ((i * 97) % 240);
      return <line key={i} x1={ex - len} y1={y} x2={ex} y2={y} stroke={i % 2 ? C.saffron : C.cream} strokeWidth={9 + (i % 3) * 3} strokeLinecap="round" opacity={0.9} />;
    })}
  </svg>
);


