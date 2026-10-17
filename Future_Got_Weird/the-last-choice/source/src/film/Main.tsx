// THE LAST CHOICE — master timeline. One Sequence per shot from src/film/timing.ts; shots not yet built render as
// animatic cards (shot id, timecode, beat). Audio: the final mix (git-ignored: it contains the supplied music).
import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {FPS, SHOTS, Shot} from './timing';
import {SHOT_COMPONENTS} from '../shots';
import {F} from '../theme';

const tc = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toFixed(2).padStart(5, '0')}`;
const Card: React.FC<{s: Shot}> = ({s}) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  return (
    <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{background: '#1d1d22'}}>
      <text x={96} y={200} fontFamily={F.display} fontSize={110} fill="#E8E2D4">{s.id}</text>
      <text x={96} y={280} fontFamily={F.body} fontSize={40} fill="#9A9488">{tc(s.start)} – {tc(s.end)}  ·  movement {s.mv}</text>
      <foreignObject x={96} y={330} width={1700} height={500}><div style={{fontFamily: F.body, fontSize: 52, color: '#E8E2D4', lineHeight: 1.25}}>{s.note}</div></foreignObject>
      <rect x={96} y={900} width={1728 * Math.min(1, t / (s.end - s.start))} height={10} fill="#E9A91C" />
    </svg>
  );
};

export const Main: React.FC<{audio?: 'mix' | false}> = ({audio = false}) => (
  <AbsoluteFill style={{background: '#000'}}>
    {SHOTS.map((s) => {
      const from = Math.round(s.start * FPS);
      const to = Math.round(s.end * FPS);
      const C = SHOT_COMPONENTS[s.id];
      return (
        <Sequence key={s.id} name={s.id} from={from} durationInFrames={Math.max(1, to - from)}>
          {C ? <C /> : <Card s={s} />}
        </Sequence>
      );
    })}
    {audio === 'mix' ? <Audio src={staticFile('audio/mix.wav')} /> : null}
  </AbsoluteFill>
);
