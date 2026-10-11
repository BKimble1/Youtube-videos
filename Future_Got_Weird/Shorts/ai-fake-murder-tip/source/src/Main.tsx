import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import './fonts';
import {C, W, H, E, tw, mix, Captions} from './kit';
import {EV, TOTAL} from './cues';
import {WorldA} from './world';
import {StatementBubble, Chip, CheckerWindow} from './b3';
import {Consequence} from './consequence';
import {Report} from './report';
import {Closer, Headlines} from './closer';

/** one background colour per scene, blended where the scene changes */
export const bgAt = (g: number) => {
  let c = C.saffron;
  c = mix(c, C.paper, E.inOut(tw(g, EV['b2.start'], 26, (x) => x)));
  c = mix(c, C.tealLight, E.inOut(tw(g, EV['b3.start'], 18, (x) => x)));
  c = mix(c, C.blueLight, E.inOut(tw(g, EV['b4.start'] - 4, 16, (x) => x)));
  c = mix(c, C.paper, g >= EV['b5.start'] + 18 ? 1 : 0);
  c = mix(c, C.saffron, E.inOut(tw(g, EV['b6.start'], 16, (x) => x)));
  return c;
};

export const IRIS_AT = {x: 390, y: 960};
const IR = 1900;

export const Film: React.FC<{captions?: boolean; audio?: boolean}> = ({captions = false, audio = true}) => {
  const g = useCurrentFrame();
  const bg = bgAt(g);
  const i0 = EV['b5.start'];
  const rIris = E.inOut(tw(g, i0, 12, (x) => x)) * IR;
  const showB5 = g >= i0 && g < EV['b6.start'] + 10;
  return (
    <AbsoluteFill style={{background: bg}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0}}>
        <defs>
          <pattern id="dots" width="60" height="60" patternUnits="userSpaceOnUse"><circle cx="30" cy="30" r="3.5" fill={C.ink} opacity="0.09" /></pattern>
          <radialGradient id="glow" cx="50%" cy="48%" r="60%"><stop offset="0" stopColor={C.cream} stopOpacity="0.5" /><stop offset="1" stopColor={C.cream} stopOpacity="0" /></radialGradient>
          <clipPath id="irisB5"><circle cx={IRIS_AT.x} cy={IRIS_AT.y} r={Math.max(0.01, rIris)} /></clipPath>
        </defs>
        <rect x={0} y={0} width={W} height={H} fill={bg} />
        <rect x={0} y={0} width={W} height={H} fill="url(#dots)" />
        <rect x={0} y={0} width={W} height={H} fill="url(#glow)" />

        {g < EV['b4.fold'] + 18 && <WorldA g={g} />}
        {g >= EV['b4.start'] && g < i0 + 18 && <Consequence g={g} />}
        <StatementBubble g={g} />
        <Chip g={g} />
        <CheckerWindow g={g} />

        <Closer g={g} />
        {showB5 && (
          <g clipPath={g < i0 + 17 ? 'url(#irisB5)' : undefined}>
            {g < i0 + 17 && <rect x={0} y={0} width={W} height={H} fill={C.paper} />}
            {g < i0 + 17 && <rect x={0} y={0} width={W} height={H} fill="url(#dots)" />}
            <Report g={g} />
          </g>
        )}
        <Headlines g={g} />
        {captions && <Captions g={g} />}
      </svg>
      {audio && <Audio src={staticFile('audio/final_mix.wav')} />}
    </AbsoluteFill>
  );
};
void TOTAL;
