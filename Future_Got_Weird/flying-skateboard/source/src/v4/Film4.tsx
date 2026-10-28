// V4 composition: the V4 shot list, the V1 narration (unchanged) and captions placed against V4's own framing. The
// closing "YOUR PRICE?" is set larger, low over the water below him, clear of the rider.
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import '../fonts';
import {H, W} from '../eng/v3';
import {FPS} from '../story/time';
import {Captions} from '../Captions';
import {makePlacer} from '../story/capPlace';
import {shotAt4} from './shots4';

const placer4 = makePlacer(shotAt4);
const PRICE = {y: 1360, size: 112};
export const Frame4: React.FC<{t: number; captions: boolean; pre?: string}> = ({t, captions, pre = ''}) => (
  <AbsoluteFill style={{backgroundColor: '#1A252D', overflow: 'hidden'}}>
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0}}>
      {shotAt4(t).draw(t, pre)}
    </svg>
    {captions && <Captions t={t} placer={placer4} price={PRICE} />}
  </AbsoluteFill>
);
export const Film4: React.FC<{audio: string | false; captions: boolean}> = ({audio, captions}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Frame4 t={f / FPS} captions={captions} />
      {audio && <Audio src={staticFile(`audio/${audio}.wav`)} />}
    </AbsoluteFill>
  );
};
export const FilmStill4: React.FC<{t: number; captions: boolean}> = ({t, captions}) => <Frame4 t={t} captions={captions} />;
export const Sheet4: React.FC<{ts: number[]; captions: boolean}> = ({ts, captions}) => (
  <AbsoluteFill style={{backgroundColor: '#111'}}>
    {ts.map((t, i) => (
      <div key={i} style={{position: 'absolute', left: (i % 4) * W, top: Math.floor(i / 4) * H, width: W, height: H, overflow: 'hidden'}}>
        <Frame4 t={t} captions={captions} pre={`s${i}`} />
        <div style={{position: 'absolute', left: 24, top: 24, fontSize: 64, color: '#FF0', fontFamily: 'monospace', textShadow: '0 0 8px #000'}}>{`${t.toFixed(2)}s f${Math.round(t * FPS)}`}</div>
      </div>
    ))}
  </AbsoluteFill>
);
