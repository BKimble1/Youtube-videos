// V2 film: the shot table drawn per frame, the future-concept identifier over the rubble shot, captions on top, the mix.
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {shotAt2, SHOTS2_TABLE} from './shots/all2';
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
/** A5 -> B1 (V4): an EDGE wipe, no blank frames. The camera tracks left with the insect and a narrow foam block near
 *  the lens crosses the frame left to right (blurred, out of focus); B1 is revealed behind its trailing edge while A5
 *  is still running ahead of it */
const B1 = shotRange('B1');
const W0 = B1.from - 9, W1 = B1.from + 8;
const wipeX = (f: number) => -320 + (1080 + 640) * ((f - W0) / (W1 - W0));
const FoamEdge: React.FC<{f: number; x: number}> = ({f, x}) => (
  <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
    <defs>
      <filter id={`fw${f}`} x="-30%" y="-5%" width="160%" height="110%">
        <feGaussianBlur stdDeviation="9" />
      </filter>
    </defs>
    <g filter={`url(#fw${f})`}>
      <rect x={x - 150} y={-60} width={300} height={2040} rx={40} fill="#F2C46A" stroke="#172B3A" strokeWidth={16} />
      <rect x={x + 60} y={-60} width={90} height={2040} fill="#D9A84E" />
      {[...Array(14)].map((_, i) => (
        <circle key={i} cx={x - 110 + ((i * 97) % 200)} cy={60 + ((i * 419) % 1800)} r={9 + (i % 4) * 4} fill="#D9A84E" opacity={0.7} />
      ))}
    </g>
  </svg>
);
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
  const wipe = f >= W0 && f <= W1;
  let pic: React.ReactNode = <s.C f={f} lf={f - s.from} n={s.to - s.from} />;
  if (wipe) {
    const t = SHOTS2_TABLE();
    const nx = t.find((q) => q.id === 'B1')!, pv = t[t.indexOf(nx) - 1];
    const x = wipeX(f);
    pic = (
      <>
        <AbsoluteFill style={{clipPath: `inset(0 0 0 ${Math.max(0, x).toFixed(1)}px)`}}>
          <pv.C f={f} lf={f - pv.from} n={pv.to - pv.from} />
        </AbsoluteFill>
        <AbsoluteFill style={{clipPath: `inset(0 ${Math.max(0, 1080 - x).toFixed(1)}px 0 0)`}}>
          <nx.C f={f} lf={f - nx.from} n={nx.to - nx.from} />
        </AbsoluteFill>
        <FoamEdge f={f} x={x} />
      </>
    );
  }
  return (
    <AbsoluteFill style={{backgroundColor: '#14202A', overflow: 'hidden'}}>
      {pic}
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
