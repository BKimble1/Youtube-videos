// Invisible Touch V2: the film. Each time t is drawn by exactly one scene; scene boundaries sit on measured word onsets.
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {FPS} from '../lib';
import {T} from '../it/timing';
import {lab2At, lab2EndAt, TOP_A, TOP_B} from './shots2';
import {LabView2} from './LabView2';
import {TopView} from './TopView';
import {Captions} from '../Captions';
import {Car2, car2Active, setCar2Entry} from './car2';
import {project} from '../it/cam3';

import {Lobby2, lobby2Active, lobbyExit} from './lobby2';

/** the caption zone each scene leaves free (screen y of the caption's centre), chosen per caption by its first word */
export const capY2 = (t: number) => {
  if (t < T.but0 - 0.03) return 1480; // hook: the fingertip is mid-frame; the lower field is clear backlit air
  if (t < T.look - 0.05) return 330; // three-quarter wide: the figure stands lower in frame
  if (t < T.under - 0.06) return 330; // the gap and the rise: the array and gap fill the lower frame
  if (t < T.fire - 0.05) return 1500; // over the cans
  if (t < T.move - 0.03) return 330; // waves rise from below; captions in the upper field
  if (t < TOP_B) return 1520; // top-down: the hand is mid-frame
  if (t < T.now - 0.03) return 330;
  if (t < T.without - 0.05) return 1500; // car
  if (t < T.and2 - 0.025) return 1500; // lobby: the keypad and his head fill the upper frame
  return 1500;
};

// the car opens with the lab hand exactly where the lab shot left it (the pad's screen point and scale)
(() => {
  const tc = T.now - 0.034;
  const l = lab2EndAt(tc);
  if (!l) return;
  const p = project(l.cam, {x: l.pad.x, y: -l.pad.y, z: 0});
  setCar2Entry({sx: p.x, sy: p.y, k: p.k});
})();

export const Frame2: React.FC<{t: number; captions: boolean}> = ({t, captions}) => {
  let body: React.ReactNode = null;
  const a = lab2At(t);
  if (a) body = <LabView2 s={a} t={t} id="lab" />;
  else if (t >= TOP_A && t < TOP_B) body = <TopView t={t} />;
  else if (car2Active(t)) body = <Car2 t={t} />;
  else if (lobby2Active(t)) body = <Lobby2 t={t} />;
  else {
    const b = lab2EndAt(t, lobbyExit());
    if (b) body = <LabView2 s={b} t={t} id="lab" />;
  }
  return (
    <AbsoluteFill style={{background: '#0B1E2B'}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        {body}
      </svg>
      {captions && <Captions t={t} y={capY2} />}
    </AbsoluteFill>
  );
};

export const FilmV2: React.FC<{audio: string | false; captions: boolean}> = ({audio, captions}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Frame2 t={f / FPS} captions={captions} />
      {audio && <Audio src={staticFile(`audio/${audio}.wav`)} />}
    </AbsoluteFill>
  );
};

export const SheetV2: React.FC<{fs: number[]; captions: boolean; cols: number}> = ({fs, captions, cols}) => {
  const rows = Math.ceil(fs.length / cols);
  const sc = 1 / Math.max(cols, rows);
  return (
    <AbsoluteFill style={{background: '#fff'}}>
      {fs.map((f, i) => (
        <div key={i} style={{position: 'absolute', left: (i % cols) * 1080 * sc, top: Math.floor(i / cols) * 1920 * sc, width: 1080, height: 1920, transform: `scale(${sc})`, transformOrigin: '0 0', overflow: 'hidden'}}>
          <Frame2 t={f / FPS} captions={captions} />
          <div style={{position: 'absolute', left: 10, top: 10, font: '700 60px sans-serif', color: '#ff0', textShadow: '0 0 6px #000'}}>{f}</div>
        </div>
      ))}
    </AbsoluteFill>
  );
};
