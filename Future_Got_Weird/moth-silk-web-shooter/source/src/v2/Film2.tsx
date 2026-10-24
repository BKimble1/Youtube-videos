// FGW "Real Web Fluid" V2: the composition. Picture rebuilt on the locked V1 narration (same words, same timing);
// each frame is one scene function of the frame number; captions in screen space on top.
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import '../fonts';
import {Captions} from '../Captions';
import {CAPTIONS, FPS} from '../lib';
import {StreetScene2} from './Street2';

/** caption centre (px) per caption (by its first words); a caption never moves while it shows */
export const CAP_Y_V2: [string, number][] = [
  ['Imagine', 1720], ['at', 1720], ['and watching', 1600], ['that', 1600], ['Scientists', 1600], ['the first', 1600],
  ['They', 1600], ['from moth', 1600], ['and dissolve', 1600], ['As', 1600], ['through', 1600], ['a surrounding', 1600],
  ['triggers', 1600], ['A sticky', 1600], ['forms', 1600], ['It hits', 1600], ['and attaches', 1600], ['Then', 1600],
  ['and the blade', 1600], ['out', 1600], ['In lab', 1600], ['these', 1600], ['eighty', 1600], ['The beginnings', 1600],
  ['of a real', 1600], ['made', 1600],
];
export const capY2 = (t: number) => {
  const i = CAPTIONS.findIndex((c, k) => t >= (k === 0 ? 0 : c.show) && t < c.hide);
  if (i < 0) return 1600;
  const [first, y] = CAP_Y_V2[i];
  if (!CAPTIONS[i].text.startsWith(first)) throw new Error(`V2 caption table out of step at ${i}: ${CAPTIONS[i].text}`);
  return y;
};

export const SceneAt2: React.FC<{f: number}> = ({f}) => <StreetScene2 f={f} />;

export const Frame2: React.FC<{f: number; captions: boolean}> = ({f, captions}) => (
  <AbsoluteFill style={{backgroundColor: '#10202A', overflow: 'hidden'}}>
    <SceneAt2 f={f} />
    {captions && <Captions t={f / FPS} cy={capY2(f / FPS)} />}
  </AbsoluteFill>
);

export const Film2: React.FC<{audio: string | false; captions: boolean}> = ({audio, captions}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Frame2 f={f} captions={captions} />
      {audio && <Audio src={staticFile(`audio/${audio}.wav`)} />}
    </AbsoluteFill>
  );
};
export const FilmStill2: React.FC<{t: number; captions: boolean}> = ({t, captions}) => <Frame2 f={t * FPS} captions={captions} />;

/** contact sheet: up to 12 frames (given as frame numbers), 4 across at quarter size */
export const Sheet2: React.FC<{fs: number[]; captions: boolean}> = ({fs, captions}) => (
  <AbsoluteFill style={{backgroundColor: '#111'}}>
    {fs.map((f, i) => (
      <div key={i} style={{position: 'absolute', left: (i % 4) * 270, top: Math.floor(i / 4) * 480, width: 1080, height: 1920, transform: 'scale(0.25)', transformOrigin: '0 0', overflow: 'hidden'}}>
        <Frame2 f={f} captions={captions} />
        <div style={{position: 'absolute', left: 20, top: 20, fontSize: 90, color: '#FF0', fontFamily: 'monospace', textShadow: '0 0 8px #000'}}>{`${f} (${(f / FPS).toFixed(2)})`}</div>
      </div>
    ))}
  </AbsoluteFill>
);
