// The film: one shot per window of the schedule (lib.T), captions in screen space on top, the mix underneath.
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {FPS, T} from './lib';
import {Captions} from './Captions';
import {Shot1, Shot2, Shot14} from './shots/Open';
import {ShotMech} from './shots/Mech';
import {Shot3, Shot4} from './shots/Bench';
import {ShotLab} from './shots/Lab';

type ShotFC = React.FC<{t: number}>;
const Todo: ShotFC = ({t}) => (
  <svg width={1080} height={1920}>
    <rect width={1080} height={1920} fill="#333" />
    <text x={540} y={960} fill="#fff" fontSize={60} textAnchor="middle">{t.toFixed(2)}</text>
  </svg>
);
const ORDER: [keyof typeof T, ShotFC][] = [
  ['s1', Shot1], ['s2', Shot2], ['s3', Shot3], ['s4', Shot4], ['s5', ShotMech], ['s6', ShotMech], ['s7', ShotMech], ['s8', ShotMech],
  ['s9', ShotMech], ['s10', ShotMech], ['s11', ShotLab], ['s12', ShotLab], ['s13', ShotLab], ['s14', Shot14],
];
export const shotAt = (t: number): [string, ShotFC] => {
  let k = 0;
  for (let i = 0; i < ORDER.length; i++) if (t >= T[ORDER[i][0]]) k = i;
  return ORDER[k];
};
export const Frame: React.FC<{t: number; captions?: boolean}> = ({t, captions = true}) => {
  const [, S] = shotAt(t);
  return (
    <AbsoluteFill style={{background: '#0B2730', overflow: 'hidden'}}>
      <S t={t} />
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
/** contact sheet: frames fs (60 fps frame numbers) at 1/cols scale */
export const Sheet: React.FC<{fs: number[]; captions: boolean; cols: number}> = ({fs, captions, cols}) => {
  const rows = Math.ceil(fs.length / cols);
  const s = 1 / Math.max(cols, rows * (1080 / 1920) * (1920 / 1080));
  const sc = Math.min(1 / cols, 1 / rows);
  void s;
  return (
    <AbsoluteFill style={{background: '#111'}}>
      {fs.map((f, i) => (
        <div key={i} style={{position: 'absolute', left: (i % cols) * 1080 * sc, top: Math.floor(i / cols) * 1920 * sc, width: 1080, height: 1920, transform: `scale(${sc})`, transformOrigin: '0 0', overflow: 'hidden'}}>
          <Frame t={f / FPS} captions={captions} />
          <div style={{position: 'absolute', left: 10, top: 10, color: '#ff0', fontSize: 44, fontFamily: 'monospace', textShadow: '0 0 6px #000'}}>{f} {(f / FPS).toFixed(2)}s</div>
        </div>
      ))}
    </AbsoluteFill>
  );
};
