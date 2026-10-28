// V5 composition: the V5 shot list, the V1 narration (unchanged) and captions placed against V5's own framing. The
// closing "YOUR PRICE?" is set larger, high in the sky above him, clear of the rider.
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import '../fonts';
import {H, W} from '../eng/v3';
import {FPS} from '../story/time';
import {Captions} from '../Captions';
import {makePlacer} from '../story/capPlace';
import {shotAt5} from './shots5';

const placer5 = makePlacer(shotAt5);
const PRICE = {y: 360, size: 112};
export const Frame5: React.FC<{t: number; captions: boolean; pre?: string}> = ({t, captions, pre = ''}) => (
  <AbsoluteFill style={{backgroundColor: '#1A252D', overflow: 'hidden'}}>
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0}}>
      {shotAt5(t).draw(t, pre)}
    </svg>
    {captions && <Captions t={t} placer={placer5} price={PRICE} />}
  </AbsoluteFill>
);
export const Film5: React.FC<{audio: string | false; captions: boolean}> = ({audio, captions}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Frame5 t={f / FPS} captions={captions} />
      {audio && <Audio src={staticFile(`audio/${audio}.wav`)} />}
    </AbsoluteFill>
  );
};
export const FilmStill5: React.FC<{t: number; captions: boolean}> = ({t, captions}) => <Frame5 t={t} captions={captions} />;
export const Sheet5: React.FC<{ts: number[]; captions: boolean}> = ({ts, captions}) => (
  <AbsoluteFill style={{backgroundColor: '#111'}}>
    {ts.map((t, i) => (
      <div key={i} style={{position: 'absolute', left: (i % 4) * W, top: Math.floor(i / 4) * H, width: W, height: H, overflow: 'hidden'}}>
        <Frame5 t={t} captions={captions} pre={`s${i}`} />
        <div style={{position: 'absolute', left: 24, top: 24, fontSize: 64, color: '#FF0', fontFamily: 'monospace', textShadow: '0 0 8px #000'}}>{`${t.toFixed(2)}s f${Math.round(t * FPS)}`}</div>
      </div>
    ))}
  </AbsoluteFill>
);
