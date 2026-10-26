// Lightning Laser V4: the composition (beats from v4/shots4.tsx). Captions in screen space on top (never inside
// a camera transform). Audio is the locked V2 mix, unchanged (production/V3_AUDIO_LOCK.md, unchanged for V4); the delivered file
// carries the original V2 AAC stream remuxed (tools/build_all_v4.sh).
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import '../fonts';
import {Captions} from '../Captions';
import {FPS} from '../lib';
import {capY4} from './captions4';
import {SceneV4} from './shots4';

export const FrameV4: React.FC<{f: number; captions: boolean}> = ({f, captions}) => {
  const t = f / FPS;
  return (
    <AbsoluteFill style={{backgroundColor: '#0E1826', overflow: 'hidden'}}>
      <SceneV4 t={t} />
      {captions && <Captions t={t} cy={capY4(t)} />}
    </AbsoluteFill>
  );
};
export const FilmV4: React.FC<{audio: string | false; captions: boolean}> = ({audio, captions}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <FrameV4 f={f} captions={captions} />
      {audio && <Audio src={staticFile(`audio/${audio}.wav`)} />}
    </AbsoluteFill>
  );
};
export const FilmStillV4: React.FC<{f: number; captions: boolean}> = ({f, captions}) => <FrameV4 f={f} captions={captions} />;
/** contact sheet: 16 frames at quarter scale with frame/time labels */
export const SheetV4: React.FC<{fs: number[]; captions: boolean}> = ({fs, captions}) => (
  <AbsoluteFill style={{backgroundColor: '#111'}}>
    {fs.map((f, i) => (
      <div key={i} style={{position: 'absolute', left: (i % 4) * 270, top: Math.floor(i / 4) * 480, width: 1080, height: 1920, transform: 'scale(0.25)', transformOrigin: '0 0', overflow: 'hidden'}}>
        <FrameV4 f={f} captions={captions} />
        <div style={{position: 'absolute', left: 20, top: 20, fontSize: 90, color: '#FF0', fontFamily: 'monospace', textShadow: '0 0 8px #000'}}>{`${f} (${(f / FPS).toFixed(2)})`}</div>
      </div>
    ))}
  </AbsoluteFill>
);
/** a single frame at half scale, for detail checks: 2 x 2 frames */
export const QuadV4: React.FC<{fs: number[]; captions: boolean}> = ({fs, captions}) => (
  <AbsoluteFill style={{backgroundColor: '#111'}}>
    {fs.slice(0, 4).map((f, i) => (
      <div key={i} style={{position: 'absolute', left: (i % 2) * 540, top: Math.floor(i / 2) * 960, width: 1080, height: 1920, transform: 'scale(0.5)', transformOrigin: '0 0', overflow: 'hidden'}}>
        <FrameV4 f={f} captions={captions} />
        <div style={{position: 'absolute', left: 20, top: 20, fontSize: 60, color: '#FF0', fontFamily: 'monospace', textShadow: '0 0 8px #000'}}>{`${f} (${(f / FPS).toFixed(2)})`}</div>
      </div>
    ))}
  </AbsoluteFill>
);
