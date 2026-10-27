// The composition: one scene function of time, captions in screen space on top (they never inherit a camera).
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import './fonts';
import {H, W} from './eng/v3';
import {shotAt} from './story/shots';
import {FPS} from './story/time';
import {Captions} from './Captions';

export const Frame: React.FC<{t: number; captions: boolean; pre?: string}> = ({t, captions, pre = ''}) => {
  const s = shotAt(t);
  return (
    <AbsoluteFill style={{backgroundColor: '#1A252D', overflow: 'hidden'}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0}}>
        {s.draw(t, pre)}
      </svg>
      {captions && <Captions t={t} />}
    </AbsoluteFill>
  );
};
export const Film: React.FC<{audio: string | false; captions: boolean}> = ({audio, captions}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Frame t={f / FPS} captions={captions} />
      {audio && <Audio src={staticFile(`audio/${audio}.wav`)} />}
    </AbsoluteFill>
  );
};
export const FilmStill: React.FC<{t: number; captions: boolean}> = ({t, captions}) => <Frame t={t} captions={captions} />;
/** contact sheet: up to 12 times (s), 4 across at full resolution (downsampled by tools/sheet.sh) */
export const Sheet: React.FC<{ts: number[]; captions: boolean}> = ({ts, captions}) => (
  <AbsoluteFill style={{backgroundColor: '#111'}}>
    {ts.map((t, i) => (
      <div key={i} style={{position: 'absolute', left: (i % 4) * W, top: Math.floor(i / 4) * H, width: W, height: H, overflow: 'hidden'}}>
        <Frame t={t} captions={captions} pre={`s${i}`} />
        <div style={{position: 'absolute', left: 24, top: 24, fontSize: 64, color: '#FF0', fontFamily: 'monospace', textShadow: '0 0 8px #000'}}>{`${t.toFixed(2)}s f${Math.round(t * FPS)}`}</div>
      </div>
    ))}
  </AbsoluteFill>
);
