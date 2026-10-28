// V6 composition: the V6 shot list, the V1 narration (unchanged) and captions placed against V6's own framing. The
// closing "YOUR PRICE?" is set larger, high in the sky above him, clear of the rider.
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import '../fonts';
import {H, W} from '../eng/v3';
import {FPS} from '../story/time';
import {Captions} from '../Captions';
import {makePlacer} from '../story/capPlace';
import {CUTS6, shotAt6} from './shots6';

const placer6 = makePlacer(shotAt6);
const PRICE = {y: 360, size: 112};
// every picture cut, as the first frame of the new shot
const CUTF = CUTS6.map((c) => {
  let f = Math.round(c * FPS);
  if (f / FPS < c) f++; // the same test the shot list uses (t >= from)
  return f;
});
export const Frame6: React.FC<{t: number; captions: boolean; pre?: string}> = ({t, captions, pre = ''}) => (
  <AbsoluteFill style={{backgroundColor: '#1A252D', overflow: 'hidden'}}>
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0}}>
      {shotAt6(t).draw(t, pre)}
    </svg>
    {captions && <Captions t={t} placer={placer6} price={PRICE} cuts={CUTF} />}
  </AbsoluteFill>
);
export const Film6: React.FC<{audio: string | false; captions: boolean}> = ({audio, captions}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Frame6 t={f / FPS} captions={captions} />
      {audio && <Audio src={staticFile(`audio/${audio}.wav`)} />}
    </AbsoluteFill>
  );
};
export const FilmStill6: React.FC<{t: number; captions: boolean}> = ({t, captions}) => <Frame6 t={t} captions={captions} />;
export const Sheet6: React.FC<{ts: number[]; captions: boolean}> = ({ts, captions}) => (
  <AbsoluteFill style={{backgroundColor: '#111'}}>
    {ts.map((t, i) => (
      <div key={i} style={{position: 'absolute', left: (i % 4) * W, top: Math.floor(i / 4) * H, width: W, height: H, overflow: 'hidden'}}>
        <Frame6 t={t} captions={captions} pre={`s${i}`} />
        <div style={{position: 'absolute', left: 24, top: 24, fontSize: 64, color: '#FF0', fontFamily: 'monospace', textShadow: '0 0 8px #000'}}>{`${t.toFixed(2)}s f${Math.round(t * FPS)}`}</div>
      </div>
    ))}
  </AbsoluteFill>
);
