// V4: the film. One frame = the shot(s) live at time t (cuts; two dissolves carried by the eel), the captions on top,
// the mix underneath. Shots: v4/timing.ts SHOTS.
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {resetIds} from '../core/ids';
import {DUR, FPS, clamp} from '../lib';
import {Captions} from '../Captions';
import {T} from './timing';
import {ExtShot, LoopShot} from './shots/Exterior';
import {S3Xray} from './shots/S3Xray';
import {S4Stomach} from './shots/S4Stomach';
import {S5Throat} from './shots/S5Throat';

const Layer: React.FC<{opacity?: number; filter?: string; children: React.ReactNode}> = ({opacity = 1, filter, children}) => (
  <div style={{position: 'absolute', inset: 0, overflow: 'hidden', opacity, filter}}>{children}</div>
);
/** the flashback (S2, the earlier gulp): a little drained and warm, with a soft vignette */
const FLASHBACK = 'saturate(0.5) sepia(0.3) brightness(0.97) contrast(0.96)';
const Vignette: React.FC<{a: number}> = ({a}) => (
  <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 75% 60% at 50% 55%, rgba(0,0,0,0) 55%, rgba(8,10,14,0.55) 100%)', opacity: a}} />
);

/** the shot layers at time t, bottom to top */
export const ShotsAt: React.FC<{t: number}> = ({t}) => {
  if (t < T.gulp) return <Layer><ExtShot id="open" t={t} /></Layer>;
  if (t < T.xray)
    return (
      <Layer filter={FLASHBACK}>
        <ExtShot id="gulp" t={t} />
        <Vignette a={1} />
        {/* into the memory: a soft bloom of light at the cut */}
        <div style={{position: 'absolute', inset: 0, background: '#FFF6E6', opacity: 0.5 * clamp(1 - (t - T.gulp) / 0.16)}} />
      </Layer>
    );
  // S3 → S4: the carried tail; the stomach comes up under the X-ray over 5.72–5.84
  if (t < 5.75) return <Layer><S3Xray t={t} /></Layer>;
  if (t < 5.81) {
    const k = clamp((t - 5.75) / 0.06);
    return (
      <>
        <Layer><S4Stomach t={t} /></Layer>
        <Layer opacity={1 - k}><S3Xray t={t} /></Layer>
      </>
    );
  }
  // S4 → S5: through the opening's dark lumen
  if (t < 8.85) return <Layer><S4Stomach t={t} /></Layer>;
  if (t < 8.95) {
    const k = clamp((t - 8.85) / 0.1);
    return (
      <>
        <Layer><S5Throat t={t} /></Layer>
        <Layer opacity={1 - k}><S4Stomach t={t} /></Layer>
      </>
    );
  }
  if (t < T.pokeCut) return <Layer><S5Throat t={t} /></Layer>;
  if (t < T.follows) return <Layer><ExtShot id="poke" t={t} /></Layer>;
  if (t < T.head) return <Layer><ExtShot id="follows" t={t} /></Layer>;
  if (t < T.curl) return <Layer><ExtShot id="head" t={t} /></Layer>;
  if (t < T.swim) return <Layer><ExtShot id="release" t={t} /></Layer>;
  if (t < T.reed) return <Layer><ExtShot id="swim" t={t} /></Layer>;
  return <Layer><LoopShot t={t} dur={DUR} /></Layer>;
};

export const FrameV4: React.FC<{f: number; captions: boolean}> = ({f, captions}) => {
  const t = f / FPS;
  resetIds(`v4f${f}_`);
  return (
    <AbsoluteFill style={{backgroundColor: '#2E5F64', overflow: 'hidden'}}>
      <ShotsAt t={t} />
      {captions && <Captions t={t} />}
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
export const SheetV4: React.FC<{fs: number[]; captions: boolean; cols?: number}> = ({fs, captions, cols = 4}) => {
  const k = 1 / cols;
  return (
    <AbsoluteFill style={{backgroundColor: '#111'}}>
      {fs.map((f, i) => (
        <div key={i} style={{position: 'absolute', left: (i % cols) * 1080 * k, top: Math.floor(i / cols) * 1920 * k, width: 1080, height: 1920, transform: `scale(${k})`, transformOrigin: '0 0', overflow: 'hidden'}}>
          <FrameV4 f={f} captions={captions} />
          <div style={{position: 'absolute', left: 20, top: 20, fontSize: 80, color: '#FF0', fontFamily: 'monospace', textShadow: '0 0 8px #000'}}>{`${f} (${(f / FPS).toFixed(2)})`}</div>
        </div>
      ))}
    </AbsoluteFill>
  );
};
