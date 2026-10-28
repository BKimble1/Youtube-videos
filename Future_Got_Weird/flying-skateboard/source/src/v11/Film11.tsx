// V8 composition: the V8 shot list on the tightened V8 narration clock (time8.ts), captions placed against V8's own
// framing; "YOUR PRICE?" sits large in the sky above him while the question is asked.
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import '../fonts';
import {H, W} from '../eng/v3';
import {FPS} from '../v10/time10';
import {Captions10} from '../v10/Captions10';
import {makePlacer} from '../v10/capPlace10';
import {CUTS11, shotAt11} from './shots11';

const placer11 = makePlacer(shotAt11);
// V8: under the board, between him and the question's caption (the crane ends on frame 0's framing, which puts his
// helmet where the V7 line sat)
const PRICE = {y: 1252, size: 108};
// every picture cut, as the first frame of the new shot
const CUTF = CUTS11.map((c) => {
  let f = Math.round(c * FPS);
  if (f / FPS < c) f++; // the same test the shot list uses (t >= from)
  return f;
});
export const Frame11: React.FC<{t: number; captions: boolean; pre?: string}> = ({t, captions, pre = ''}) => (
  <AbsoluteFill style={{backgroundColor: '#1A252D', overflow: 'hidden'}}>
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0}}>
      {shotAt11(t).draw(t, pre)}
    </svg>
    {captions && <Captions10 t={t} placer={placer11} price={PRICE} cuts={CUTF} />}
  </AbsoluteFill>
);
export const Film11: React.FC<{audio: string | false; captions: boolean}> = ({audio, captions}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Frame11 t={f / FPS} captions={captions} />
      {audio && <Audio src={staticFile(`audio/${audio}.wav`)} />}
    </AbsoluteFill>
  );
};
export const FilmStill11: React.FC<{t: number; captions: boolean}> = ({t, captions}) => <Frame11 t={t} captions={captions} />;
export const Sheet11: React.FC<{ts: number[]; captions: boolean}> = ({ts, captions}) => (
  <AbsoluteFill style={{backgroundColor: '#111'}}>
    {ts.map((t, i) => (
      <div key={i} style={{position: 'absolute', left: (i % 4) * W, top: Math.floor(i / 4) * H, width: W, height: H, overflow: 'hidden'}}>
        <Frame11 t={t} captions={captions} pre={`s${i}`} />
        <div style={{position: 'absolute', left: 24, top: 24, fontSize: 64, color: '#FF0', fontFamily: 'monospace', textShadow: '0 0 8px #000'}}>{`${t.toFixed(2)}s f${Math.round(t * FPS)}`}</div>
      </div>
    ))}
  </AbsoluteFill>
);
