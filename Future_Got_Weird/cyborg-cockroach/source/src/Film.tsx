// The film: a shot table (shots/index.ts) drawn per frame, captions in screen space on top, the mix as audio.
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {Captions} from './Captions';
import {shotAt} from './shots';
import {FPS} from './timeline';
import {SHOT_FRAMES} from './cuts';

const S12_FROM = SHOT_FRAMES.find(([k]) => k === 'S12')![1];
const S13_FROM = SHOT_FRAMES.find(([k]) => k === 'S13')![1];
/** The plain identifier for the proposed future application (brief: "Future rescue concept"), screen space, shown whole
 *  from just after the rubble is revealed and held through the whole rubble shot (past the end of "carrying emergency
 *  medicine"); it fades out over the shot's last CONCEPT_FADE frames, so it is gone on the cut to S13 without popping. */
export const CONCEPT_ON: [number, number] = [S12_FROM + 3, S13_FROM];
const CONCEPT_FADE = 8;
const ConceptLabel: React.FC<{f: number}> = ({f}) =>
  f >= CONCEPT_ON[0] && f < CONCEPT_ON[1] ? (
    <div style={{position: 'absolute', right: 84, top: 184, padding: '10px 20px 12px', borderRadius: 14, background: 'rgba(10,16,22,0.62)', color: '#F4F1EA',
      fontFamily: '"Nunito Variable", "Nunito", system-ui, sans-serif', fontWeight: 800, fontSize: 36, letterSpacing: '0.01em',
      opacity: Math.min(1, (CONCEPT_ON[1] - f) / CONCEPT_FADE)}}>
      Future rescue concept
    </div>
  ) : null;

export const Frame: React.FC<{f: number; captions: boolean}> = ({f, captions}) => {
  const s = shotAt(f);
  return (
    <AbsoluteFill style={{backgroundColor: '#14202A', overflow: 'hidden'}}>
      <s.C f={f} lf={f - s.from} n={s.to - s.from} />
      <ConceptLabel f={f} />
      {captions && <Captions f={f} />}
    </AbsoluteFill>
  );
};
export const Film: React.FC<{audio: string | false; captions: boolean}> = ({audio, captions}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Frame f={f} captions={captions} />
      {audio && <Audio src={staticFile(`audio/${audio}.wav`)} />}
    </AbsoluteFill>
  );
};
export const FilmStill: React.FC<{f: number; captions: boolean}> = ({f, captions}) => <Frame f={f} captions={captions} />;
/** contact sheet: up to 16 frames, 4 across at quarter size, each labelled frame (seconds) */
export const Sheet: React.FC<{fs: number[]; captions: boolean}> = ({fs, captions}) => (
  <AbsoluteFill style={{backgroundColor: '#111'}}>
    {fs.map((f, i) => (
      <div key={i} style={{position: 'absolute', left: (i % 4) * 270, top: Math.floor(i / 4) * 480, width: 1080, height: 1920, transform: 'scale(0.25)', transformOrigin: '0 0', overflow: 'hidden'}}>
        <Frame f={f} captions={captions} />
        <div style={{position: 'absolute', left: 20, top: 20, fontSize: 90, color: '#FF0', fontFamily: 'monospace', textShadow: '0 0 8px #000'}}>{`${f} (${(f / FPS).toFixed(2)})`}</div>
      </div>
    ))}
  </AbsoluteFill>
);
