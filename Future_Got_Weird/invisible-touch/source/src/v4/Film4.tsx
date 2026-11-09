// Invisible Touch V4: the film. A focused polish of V3: the reaching hook with a skin-localised pulse, three distinct
// views at 3-7 s, round transducers and no rays, the dive into the fingertip, the A -> B -> C demonstration, the car
// climate micro-story, the pinch payoff, and a reach-in loop with the first caption pre-built over the seam.
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {FPS, CAPTIONS, clamp} from '../lib';
import {T} from '../it/timing';
import {project} from '../it/cam3';
import {lab4At, lab4EndAt, OBL_A} from './shots4';
import {LabView4} from './LabView4';
import {TopView4} from './TopView4';
import {TOP_A, TOP_B} from '../v2/shots2';
import {Car4, car4Active, car4PadScreen, setCar4Entry} from './car4';
import {CaptionLine} from '../Captions';

(() => {
  const l = lab4EndAt(T.now - 0.034);
  if (!l) return;
  const p = project(l.cam, {x: l.pad.x, y: -l.pad.y, z: 0});
  setCar4Entry({sx: p.x, sy: p.y, k: p.k});
})();
const carExit = () => {
  const p = car4PadScreen(T.and2 - 0.025 - 0.001);
  return {sx: p.x, sy: p.y, k: p.k};
};

/** caption zones: per caption by its first word, clear of the hand, the device and the controls in that scene */
export const capY4 = (t: number) => {
  if (t < T.but0 - 0.03) return 330; // hook: the upper wall is empty
  if (t < T.look - 0.05) return 330; // wide: the figure stands lower
  if (t < T.so - 0.07) return 1560; // hand and device from above: the bench front is clear
  if (t < T.under - 0.06) return 330; // the low path and the dive: cans fill the bottom
  if (t < T.fire - 0.05) return 1500;
  if (t < T.move - 0.03) return 330;
  if (t < TOP_B) return 1560;
  if (t < T.now - 0.03) return 330;
  if (t < T.and2 - 0.025) return 1580; // car: low over the door sill
  return 1560;
};
/** the last caption clears 0.2 s after the last word; the first caption is pre-built over the last 0.25 s at its own
 *  place, so across the seam it is already on screen (no flash) */
const LAST = CAPTIONS.length - 1;
const PREBUILD = 0.25;
const Captions4: React.FC<{t: number}> = ({t}) => {
  if (t >= T.end - PREBUILD) {
    const c = CAPTIONS[0];
    return <CaptionLine key="pre" c={c} y={capY4(c.start + 0.05)} a={clamp((t - (T.end - PREBUILD)) / (PREBUILD - 0.04))} />;
  }
  const hideOf = (k: number) => {
    const c = CAPTIONS[k];
    if (k === LAST) return T.lastEnd + 0.2;
    const next = CAPTIONS[k + 1].show;
    return next > c.hide && next - c.hide < 0.12 ? next : c.hide;
  };
  const i = CAPTIONS.findIndex((c, k) => t >= (k === 0 ? 0 : c.show) && t < hideOf(k));
  if (i < 0) return null;
  const c = CAPTIONS[i];
  const fadeOut = i === LAST ? 1 - clamp((t - (T.lastEnd + 0.12)) / 0.08) : 1;
  return <CaptionLine key={i} c={c} y={capY4(c.start + 0.05)} a={(i === 0 ? 1 : clamp(0.5 + (t - c.show) / 0.067)) * fadeOut} />;
};

export const Frame4: React.FC<{t: number; captions: boolean}> = ({t, captions}) => {
  let body: React.ReactNode = null;
  const a = lab4At(t);
  if (a) body = <LabView4 s={a} t={t} id="lab" />;
  else if (t >= TOP_A && t < OBL_A) body = <TopView4 t={t} />;
  else if (car4Active(t)) body = <Car4 t={t} />;
  else {
    const b = lab4EndAt(t, carExit());
    if (b) body = <LabView4 s={b} t={t} id="lab" />;
  }
  return (
    <AbsoluteFill style={{background: '#0B1E2B'}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        {body}
      </svg>
      {captions && <Captions4 t={t} />}
    </AbsoluteFill>
  );
};

export const FilmV4: React.FC<{audio: string | false; captions: boolean}> = ({audio, captions}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Frame4 t={f / FPS} captions={captions} />
      {audio && <Audio src={staticFile(`audio/${audio}.wav`)} />}
    </AbsoluteFill>
  );
};

export const SheetV4: React.FC<{fs: number[]; captions: boolean; cols: number}> = ({fs, captions, cols}) => {
  const rows = Math.ceil(fs.length / cols);
  const sc = 1 / Math.max(cols, rows);
  return (
    <AbsoluteFill style={{background: '#fff'}}>
      {fs.map((f, i) => (
        <div key={i} style={{position: 'absolute', left: (i % cols) * 1080 * sc, top: Math.floor(i / cols) * 1920 * sc, width: 1080, height: 1920, transform: `scale(${sc})`, transformOrigin: '0 0', overflow: 'hidden'}}>
          <Frame4 t={f / FPS} captions={captions} />
          <div style={{position: 'absolute', left: 10, top: 10, font: '700 60px sans-serif', color: '#ff0', textShadow: '0 0 6px #000'}}>{f}</div>
        </div>
      ))}
    </AbsoluteFill>
  );
};
