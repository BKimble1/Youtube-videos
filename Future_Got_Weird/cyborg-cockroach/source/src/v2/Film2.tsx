// V2 film: the shot table drawn per frame, the future-concept identifier over the rubble shot, captions on top, the mix.
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {shotAt2} from './shots/all2';
import {Captions2} from './Captions2';
import {shotRange} from './cuts2';
import {FPS} from '../timeline';

const E1 = shotRange('E1');
/** the one small contextual label (brief): over the rubble shot, top right, fading in and out */
const ConceptLabel2: React.FC<{f: number}> = ({f}) => {
  const a = Math.min(1, (f - E1.from - 4) / 6, (E1.to - 2 - f) / 8);
  if (a <= 0) return null;
  return (
    <div style={{position: 'absolute', right: 70, top: 170, padding: '8px 18px 10px', borderRadius: 12, background: 'rgba(10,16,22,0.6)', color: '#F4F1EA', opacity: a,
      fontFamily: '"Nunito Variable", "Nunito", system-ui, sans-serif', fontWeight: 800, fontSize: 34, letterSpacing: '0.01em'}}>
      Future rescue concept
    </div>
  );
};
export const Frame2: React.FC<{f: number; captions: boolean}> = ({f, captions}) => {
  const s = shotAt2(f);
  return (
    <AbsoluteFill style={{backgroundColor: '#14202A', overflow: 'hidden'}}>
      <s.C f={f} lf={f - s.from} n={s.to - s.from} />
      <ConceptLabel2 f={f} />
      {captions && <Captions2 f={f} />}
    </AbsoluteFill>
  );
};
export const Film2: React.FC<{audio: string | false; captions: boolean}> = ({audio, captions}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Frame2 f={f} captions={captions} />
      {audio && <Audio src={staticFile(`audio/${audio}.wav`)} />}
    </AbsoluteFill>
  );
};
export const FilmStill2: React.FC<{f: number; captions: boolean}> = ({f, captions}) => <Frame2 f={f} captions={captions} />;
/** contact sheet: up to 16 frames (4 across, quarter size) or up to 36 (6 across, sixth size), labelled */
export const Sheet2: React.FC<{fs: number[]; captions: boolean}> = ({fs, captions}) => {
  const cols = fs.length > 16 ? 6 : 4;
  const k = 1 / cols;
  return (
    <AbsoluteFill style={{backgroundColor: '#111'}}>
      {fs.map((f, i) => (
        <div key={i} style={{position: 'absolute', left: (i % cols) * 1080 * k, top: Math.floor(i / cols) * 1920 * k, width: 1080, height: 1920, transform: `scale(${k})`, transformOrigin: '0 0', overflow: 'hidden'}}>
          <Frame2 f={f} captions={captions} />
          <div style={{position: 'absolute', left: 20, top: 20, fontSize: 90, color: '#FF0', fontFamily: 'monospace', textShadow: '0 0 8px #000'}}>{`${f} (${(f / FPS).toFixed(2)})`}</div>
        </div>
      ))}
    </AbsoluteFill>
  );
};
