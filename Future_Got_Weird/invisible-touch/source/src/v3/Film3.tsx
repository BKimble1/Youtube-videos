// Invisible Touch V3: the film. A targeted polish of V2: new opening, 3-7 s worm's-eye macro, skin-slab match, car
// climax (the lobby is removed), the pass-through grab and a rebuilt loop. Unchanged V2 scenes are reused as they are.
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {FPS, CAPTIONS, clamp} from '../lib';
import {T} from '../it/timing';
import {project} from '../it/cam3';
import {lab3At, lab3EndAt, SLAB_A, SLAB_B} from './shots3';
import {LabView3} from './LabView3';
import {TopView} from '../v2/TopView';
import {TOP_A, TOP_B} from '../v2/shots2';
import {focusOf, geoOf} from '../v2/LabView2';
import {SkinSlab} from './SkinSlab';
import {Car3, car3Active, car3PadScreen, setCar3Entry} from './car3';
import {CaptionLine} from '../Captions';

// the car opens with the lab hand exactly where the lab shot left it
(() => {
  const l = lab3EndAt(T.now - 0.034);
  if (!l) return;
  const p = project(l.cam, {x: l.pad.x, y: -l.pad.y, z: 0});
  setCar3Entry({sx: p.x, sy: p.y, k: p.k});
})();
const carExit = () => {
  const p = car3PadScreen(T.and2 - 0.025 - 0.001);
  return {sx: p.x, sy: p.y, k: p.k};
};

/** the lab focus on screen at time t (for the skin slab's graphic matches) */
const focusScreen = (t: number) => {
  const s = lab3At(t)!;
  const pp = project(s.cam, {x: s.pad.x, y: -s.pad.y, z: 0});
  const F = focusOf(s);
  const g = geoOf(s);
  const n = {x: g.index.tipDir.y, y: -g.index.tipDir.x};
  return {x: pp.x + (F.x - s.pad.x) * pp.k, y: pp.y + (F.y - s.pad.y) * pp.k, r: Math.max(4.5, 40 / pp.k) * pp.k, normal: (Math.atan2(n.y, n.x) * 180) / Math.PI};
};
const SLAB_FROM = focusScreen(SLAB_A - 0.001);
const SLAB_TO = focusScreen(SLAB_B + 0.001);

/** caption zones: chosen per caption by its first word, clear of the hand and the device in that scene */
export const capY3 = (t: number) => {
  if (t < T.but0 - 0.03) return 330; // hook: the upper wall is empty; the array and gap fill the lower frame
  if (t < T.look - 0.05) return 330;
  if (t < T.under - 0.06) return 330; // worm's-eye: the cans fill the bottom
  if (t < T.fire - 0.05) return 1500;
  if (t < T.move - 0.03) return 330;
  if (t < TOP_B) return 1520;
  if (t < T.now - 0.03) return 330;
  if (t < T.and2 - 0.025) return 1580; // car: his head and the controls fill the upper and middle frame; low over the sill
  return 1500;
};
/** V3 captions: as the channel component, but the last caption clears 0.2 s after the last word, so the loop's seam
 *  goes from no caption to the first caption arriving with the first word (no caption swap on the cut) */
const hideOf = (k: number) => {
  const c = CAPTIONS[k];
  if (k === CAPTIONS.length - 1) return T.lastEnd + 0.2;
  const next = CAPTIONS[k + 1].show;
  return next > c.hide && next - c.hide < 0.12 ? next : c.hide;
};
const Captions3: React.FC<{t: number}> = ({t}) => {
  const i = CAPTIONS.findIndex((c, k) => t >= (k === 0 ? 0 : c.show) && t < hideOf(k));
  if (i < 0) return null;
  const c = CAPTIONS[i];
  const fadeOut = i === CAPTIONS.length - 1 ? 1 - clamp((t - (T.lastEnd + 0.12)) / 0.08) : 1;
  return <CaptionLine key={i} c={c} y={capY3(c.start + 0.05)} a={(i === 0 ? 1 : clamp(0.5 + (t - c.show) / 0.067)) * fadeOut} />;
};

export const Frame3: React.FC<{t: number; captions: boolean}> = ({t, captions}) => {
  let body: React.ReactNode = null;
  const a = lab3At(t);
  if (a) body = <LabView3 s={a} t={t} id="lab" />;
  else if (t >= TOP_A && t < TOP_B) body = <TopView t={t} />;
  else if (car3Active(t)) body = <Car3 t={t} />;
  else {
    const b = lab3EndAt(t, carExit());
    if (b) body = <LabView3 s={b} t={t} id="lab" />;
  }
  return (
    <AbsoluteFill style={{background: '#0B1E2B'}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        {body}
        <SkinSlab t={t} a={SLAB_A} b={SLAB_B} from={SLAB_FROM} to={SLAB_TO} tAct={T.pressure - 0.1} />
      </svg>
      {captions && <Captions3 t={t} />}
    </AbsoluteFill>
  );
};

export const FilmV3: React.FC<{audio: string | false; captions: boolean}> = ({audio, captions}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Frame3 t={f / FPS} captions={captions} />
      {audio && <Audio src={staticFile(`audio/${audio}.wav`)} />}
    </AbsoluteFill>
  );
};

export const SheetV3: React.FC<{fs: number[]; captions: boolean; cols: number}> = ({fs, captions, cols}) => {
  const rows = Math.ceil(fs.length / cols);
  const sc = 1 / Math.max(cols, rows);
  return (
    <AbsoluteFill style={{background: '#fff'}}>
      {fs.map((f, i) => (
        <div key={i} style={{position: 'absolute', left: (i % cols) * 1080 * sc, top: Math.floor(i / cols) * 1920 * sc, width: 1080, height: 1920, transform: `scale(${sc})`, transformOrigin: '0 0', overflow: 'hidden'}}>
          <Frame3 t={f / FPS} captions={captions} />
          <div style={{position: 'absolute', left: 10, top: 10, font: '700 60px sans-serif', color: '#ff0', textShadow: '0 0 6px #000'}}>{f}</div>
        </div>
      ))}
    </AbsoluteFill>
  );
};
