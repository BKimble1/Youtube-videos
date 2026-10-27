// V2 film: the shot table drawn per frame, the future-concept identifier over the rubble shot, captions on top, the mix.
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {shotAt2} from './shots/all2';
import {Captions2} from './Captions2';
import {shotRange} from './cuts2';
import {FPS} from '../timeline';

const E1 = shotRange('E1'), E2 = shotRange('E2');
/** the one small contextual label (brief): over the first rescue shots (E1-E2), top right, fading in and out */
const ConceptLabel2: React.FC<{f: number}> = ({f}) => {
  const a = Math.min(1, (f - E1.from - 4) / 6, (E2.to - 2 - f) / 8);
  if (a <= 0) return null;
  return (
    <div style={{position: 'absolute', right: 70, top: 170, padding: '8px 18px 10px', borderRadius: 12, background: 'rgba(10,16,22,0.6)', color: '#F4F1EA', opacity: a,
      fontFamily: '"Nunito Variable", "Nunito", system-ui, sans-serif', fontWeight: 800, fontSize: 34, letterSpacing: '0.01em'}}>
      Future rescue concept
    </div>
  );
};
/** A5 -> B1: the camera tracks left with the insect and a foam block near the lens crosses the frame (blurred, out of
 *  focus), fully covering it around the cut at B1's first frame */
const B1 = shotRange('B1');
const FoamWipe: React.FC<{f: number}> = ({f}) => {
  const f0 = B1.from - 10, f1 = B1.from + 7;
  if (f < f0 || f > f1) return null;
  const u = (f - f0) / (f1 - f0);
  const W = 1750;
  const x = -W - 40 + (1080 + W + 80) * u;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
      <defs>
        <filter id={`fw${f}`} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="10" />
        </filter>
      </defs>
      <g filter={`url(#fw${f})`}>
        <rect x={x} y={-60} width={W} height={2040} rx={60} fill="#F2C46A" stroke="#172B3A" strokeWidth={18} />
        <rect x={x + W - 140} y={-60} width={140} height={2040} fill="#D9A84E" />
        {[...Array(40)].map((_, i) => (
          <circle key={i} cx={x + 60 + ((i * 263) % (W - 160))} cy={40 + ((i * 419) % 1840)} r={10 + (i % 4) * 5} fill="#D9A84E" opacity={0.7} />
        ))}
      </g>
    </svg>
  );
};
/** D5 -> E1: the lab window's daylight blooms over the cut and resolves into the collapsed building in daylight */
const Bloom: React.FC<{f: number}> = ({f}) => {
  const c = E1.from;
  const a = f < c ? (f - (c - 8)) / 8 : 1 - (f - c - 1) / 8;
  if (a <= 0) return null;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
      <defs>
        <radialGradient id={`bl${f}`} cx="0.6" cy="0.3" r="0.9">
          <stop offset="0" stopColor="#FFFDF6" />
          <stop offset="0.6" stopColor="#FFF3D6" />
          <stop offset="1" stopColor="#FFE2A8" />
        </radialGradient>
      </defs>
      <rect width={1080} height={1920} fill={`url(#bl${f})`} opacity={Math.min(1, a)} />
    </svg>
  );
};
export const Frame2: React.FC<{f: number; captions: boolean}> = ({f, captions}) => {
  const s = shotAt2(f);
  return (
    <AbsoluteFill style={{backgroundColor: '#14202A', overflow: 'hidden'}}>
      <s.C f={f} lf={f - s.from} n={s.to - s.from} />
      <FoamWipe f={f} />
      <Bloom f={f} />
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
