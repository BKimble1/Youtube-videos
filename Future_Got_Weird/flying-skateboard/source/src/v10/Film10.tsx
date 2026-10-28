// V8 composition: the V8 shot list on the tightened V8 narration clock (time8.ts), captions placed against V8's own
// framing; "YOUR PRICE?" sits large in the sky above him while the question is asked.
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import '../fonts';
import {H, W} from '../eng/v3';
import {FPS} from './time10';
import {Captions10} from './Captions10';
import {makePlacer} from './capPlace10';
import {CUTS10, shotAt10} from './shots10';

const placer10 = makePlacer(shotAt10);
// V8: under the board, between him and the question's caption (the crane ends on frame 0's framing, which puts his
// helmet where the V7 line sat)
const PRICE = {y: 1252, size: 108};
// every picture cut, as the first frame of the new shot
const CUTF = CUTS10.map((c) => {
  let f = Math.round(c * FPS);
  if (f / FPS < c) f++; // the same test the shot list uses (t >= from)
  return f;
});
export const Frame10: React.FC<{t: number; captions: boolean; pre?: string}> = ({t, captions, pre = ''}) => (
  <AbsoluteFill style={{backgroundColor: '#1A252D', overflow: 'hidden'}}>
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0}}>
      {shotAt10(t).draw(t, pre)}
    </svg>
    {captions && <Captions10 t={t} placer={placer10} price={PRICE} cuts={CUTF} />}
  </AbsoluteFill>
);
export const Film10: React.FC<{audio: string | false; captions: boolean}> = ({audio, captions}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Frame10 t={f / FPS} captions={captions} />
      {audio && <Audio src={staticFile(`audio/${audio}.wav`)} />}
    </AbsoluteFill>
  );
};
export const FilmStill10: React.FC<{t: number; captions: boolean}> = ({t, captions}) => <Frame10 t={t} captions={captions} />;
export const Sheet10: React.FC<{ts: number[]; captions: boolean}> = ({ts, captions}) => (
  <AbsoluteFill style={{backgroundColor: '#111'}}>
    {ts.map((t, i) => (
      <div key={i} style={{position: 'absolute', left: (i % 4) * W, top: Math.floor(i / 4) * H, width: W, height: H, overflow: 'hidden'}}>
        <Frame10 t={t} captions={captions} pre={`s${i}`} />
        <div style={{position: 'absolute', left: 24, top: 24, fontSize: 64, color: '#FF0', fontFamily: 'monospace', textShadow: '0 0 8px #000'}}>{`${t.toFixed(2)}s f${Math.round(t * FPS)}`}</div>
      </div>
    ))}
  </AbsoluteFill>
);
