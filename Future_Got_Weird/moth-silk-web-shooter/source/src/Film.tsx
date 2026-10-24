// FGW "Real Web Fluid": the composition. Each frame is one scene function of film time t; captions sit in screen
// space on top, positioned per shot.
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import './fonts';
import {Captions} from './Captions';
import {CAPTIONS, FPS} from './lib';
import {STREET_END, StreetScene} from './scenes/Street';
import {LabScene} from './scenes/Lab';
import {MacroScene} from './scenes/Macro';
import {LT} from './scenes/labWorld';

export const shotAt = (t: number) => (t < STREET_END ? 'street' : t < LT.macro || t >= LT.back ? 'lab' : 'macro');
/** caption centre (px) for each caption, chosen per shot: the channel's low band (1500) unless the action is there;
 *  then just below it, or high on the lab wall where the frame is empty. A caption never moves while it is showing. */
const CAP_Y_BY_FIRST_WORD: [string, number][] = [
  ['Imagine', 1500], ['at', 1500], ['and watching', 1690], ['that', 1500], ['Scientists', 1500], ['the first', 1500],
  ['They', 1500], ['from moth', 1500], ['and dissolve', 1680], ['As', 1680], ['through', 1620], ['a surrounding', 1620],
  ['triggers', 1620], ['A sticky', 1500], ['forms', 1500], ['It hits', 1640], ['and attaches', 1640], ['Then', 1500],
  ['and the blade', 1500], ['out', 1500], ['In lab', 1500], ['these', 1500], ['eighty', 330], ['The beginnings', 330],
  ['of a real', 1600], ['made', 1730],
];
export const capY = (t: number) => {
  const i = CAPTIONS.findIndex((c, k) => t >= (k === 0 ? 0 : c.show) && t < c.hide);
  if (i < 0) return 1500;
  const [first, y] = CAP_Y_BY_FIRST_WORD[i];
  if (!CAPTIONS[i].text.startsWith(first)) throw new Error(`caption position table out of step at ${i}: ${CAPTIONS[i].text}`);
  return y;
};

export const SceneAt: React.FC<{t: number}> = ({t}) => {
  const id = shotAt(t);
  if (id === 'street') return <StreetScene t={t} />;
  if (id === 'lab') return <LabScene t={t} />;
  return <MacroScene t={t} />;
};

export const Frame: React.FC<{t: number; captions: boolean}> = ({t, captions}) => (
  <AbsoluteFill style={{backgroundColor: '#10202A', overflow: 'hidden'}}>
    <SceneAt t={t} />
    {captions && <Captions t={t} cy={capY(t)} />}
  </AbsoluteFill>
);

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

/** a contact sheet: up to 12 times, 4 across, each frame at a quarter size, with its time */
export const Sheet: React.FC<{ts: number[]; captions: boolean}> = ({ts, captions}) => (
  <AbsoluteFill style={{backgroundColor: '#111'}}>
    {ts.map((t, i) => (
      <div key={i} style={{position: 'absolute', left: (i % 4) * 270, top: Math.floor(i / 4) * 480, width: 1080, height: 1920, transform: 'scale(0.25)', transformOrigin: '0 0'}}>
        <Frame t={t} captions={captions} />
        <div style={{position: 'absolute', left: 20, top: 20, fontSize: 90, color: '#FF0', fontFamily: 'monospace', textShadow: '0 0 8px #000'}}>{t.toFixed(2)}</div>
      </div>
    ))}
  </AbsoluteFill>
);
