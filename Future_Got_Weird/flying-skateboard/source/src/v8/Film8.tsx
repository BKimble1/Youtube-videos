// V8 composition: the V8 shot list on the tightened V8 narration clock (time8.ts), captions placed against V8's own
// framing; "YOUR PRICE?" sits large in the sky above him while the question is asked.
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import '../fonts';
import {H, W} from '../eng/v3';
import {FPS} from './time8';
import {Captions8} from './Captions8';
import {makePlacer} from './capPlace8';
import {CUTS8, shotAt8} from './shots8';

const placer8 = makePlacer(shotAt8);
// V8: under the board, between him and the question's caption (the crane ends on frame 0's framing, which puts his
// helmet where the V7 line sat)
const PRICE = {y: 1252, size: 108};
// every picture cut, as the first frame of the new shot
const CUTF = CUTS8.map((c) => {
  let f = Math.round(c * FPS);
  if (f / FPS < c) f++; // the same test the shot list uses (t >= from)
  return f;
});
export const Frame8: React.FC<{t: number; captions: boolean; pre?: string}> = ({t, captions, pre = ''}) => (
  <AbsoluteFill style={{backgroundColor: '#1A252D', overflow: 'hidden'}}>
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0}}>
      {shotAt8(t).draw(t, pre)}
    </svg>
    {captions && <Captions8 t={t} placer={placer8} price={PRICE} cuts={CUTF} />}
  </AbsoluteFill>
);
export const Film8: React.FC<{audio: string | false; captions: boolean}> = ({audio, captions}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Frame8 t={f / FPS} captions={captions} />
      {audio && <Audio src={staticFile(`audio/${audio}.wav`)} />}
    </AbsoluteFill>
  );
};
export const FilmStill8: React.FC<{t: number; captions: boolean}> = ({t, captions}) => <Frame8 t={t} captions={captions} />;
export const Sheet8: React.FC<{ts: number[]; captions: boolean}> = ({ts, captions}) => (
  <AbsoluteFill style={{backgroundColor: '#111'}}>
    {ts.map((t, i) => (
      <div key={i} style={{position: 'absolute', left: (i % 4) * W, top: Math.floor(i / 4) * H, width: W, height: H, overflow: 'hidden'}}>
        <Frame8 t={t} captions={captions} pre={`s${i}`} />
        <div style={{position: 'absolute', left: 24, top: 24, fontSize: 64, color: '#FF0', fontFamily: 'monospace', textShadow: '0 0 8px #000'}}>{`${t.toFixed(2)}s f${Math.round(t * FPS)}`}</div>
      </div>
    ))}
  </AbsoluteFill>
);
