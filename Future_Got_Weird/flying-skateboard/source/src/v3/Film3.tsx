// V3 composition: the V3 shot list, the V1 narration (unchanged) and captions placed against V3's own framing. The
// closing "YOUR PRICE?" is set larger, high in the frame over the sky, clear of the rider.
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import '../fonts';
import {H, W} from '../eng/v3';
import {FPS} from '../story/time';
import {Captions} from '../Captions';
import {makePlacer} from '../story/capPlace';
import {shotAt3} from './shots3';

const placer3 = makePlacer(shotAt3);
const PRICE = {y: 335, size: 112};
export const Frame3: React.FC<{t: number; captions: boolean; pre?: string}> = ({t, captions, pre = ''}) => (
  <AbsoluteFill style={{backgroundColor: '#1A252D', overflow: 'hidden'}}>
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0}}>
      {shotAt3(t).draw(t, pre)}
    </svg>
    {captions && <Captions t={t} placer={placer3} price={PRICE} />}
  </AbsoluteFill>
);
export const Film3: React.FC<{audio: string | false; captions: boolean}> = ({audio, captions}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Frame3 t={f / FPS} captions={captions} />
      {audio && <Audio src={staticFile(`audio/${audio}.wav`)} />}
    </AbsoluteFill>
  );
};
export const FilmStill3: React.FC<{t: number; captions: boolean}> = ({t, captions}) => <Frame3 t={t} captions={captions} />;
export const Sheet3: React.FC<{ts: number[]; captions: boolean}> = ({ts, captions}) => (
  <AbsoluteFill style={{backgroundColor: '#111'}}>
    {ts.map((t, i) => (
      <div key={i} style={{position: 'absolute', left: (i % 4) * W, top: Math.floor(i / 4) * H, width: W, height: H, overflow: 'hidden'}}>
        <Frame3 t={t} captions={captions} pre={`s${i}`} />
        <div style={{position: 'absolute', left: 24, top: 24, fontSize: 64, color: '#FF0', fontFamily: 'monospace', textShadow: '0 0 8px #000'}}>{`${t.toFixed(2)}s f${Math.round(t * FPS)}`}</div>
      </div>
    ))}
  </AbsoluteFill>
);
