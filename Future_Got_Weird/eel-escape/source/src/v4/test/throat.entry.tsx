// Builder G test entry: S5 THROAT + S6 GILLS.
//   npx remotion still src/v4/test/throat.entry.tsx Throat out.png --props='{"t":11.5}'
//   npx remotion still src/v4/test/throat.entry.tsx ThroatSheet out.png --props='{"t0":8.7,"dt":0.15,"n":28,"cols":7}'
// `guides` overlays the caption band (y 210..470), KEEP_Y, EDGE and the pokeTail contract (cyan) where it applies.
import React from 'react';
import {AbsoluteFill, Composition, registerRoot} from 'remotion';
import {resetIds} from '../../core/ids';
import {S5Throat, keepOut} from '../shots/S5Throat';
import {EDGE, KEEP_Y, POKE0, POKE1, POKE_AT, pokeTail} from '../timing';

const Guides: React.FC<{t: number}> = ({t}) => {
  const k = keepOut(t);
  const pk = t >= POKE0 - 0.2 && t <= POKE1 + 0.2 ? pokeTail(t) : null;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', left: 0, top: 0}}>
      <rect x={110} y={210} width={860} height={260} fill="#FFFFFF" fillOpacity={0.18} stroke="#FFFFFF" strokeOpacity={0.5} strokeWidth={3} />
      <line x1={0} x2={1080} y1={KEEP_Y} y2={KEEP_Y} stroke="#FFD84A" strokeWidth={3} strokeDasharray="12 10" />
      {k.gap && <path d={'M' + k.gap.map((p) => `${p.x},${p.y}`).join('L') + 'Z'} fill="none" stroke="#FF4AD8" strokeWidth={3} />}
      {t >= 12.2 && <polyline points={EDGE.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke="#FFD84A" strokeWidth={3} strokeOpacity={0.8} />}
      {pk && <polyline points={pk.pts.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke="#00FFFF" strokeWidth={3} />}
      {t >= 12.2 && <circle cx={POKE_AT.x} cy={POKE_AT.y} r={8} fill="none" stroke="#FFD84A" strokeWidth={3} />}
    </svg>
  );
};

const Throat: React.FC<{t: number; guides?: boolean}> = ({t, guides}) => {
  resetIds('g');
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <S5Throat t={t} />
      {guides && <Guides t={t} />}
    </AbsoluteFill>
  );
};

const ThroatSheet: React.FC<{t0: number; dt: number; n: number; cols: number; guides?: boolean; ts?: number[]}> = ({t0, dt, n, cols, guides, ts}) => {
  resetIds('s');
  const times = ts ?? Array.from({length: n}, (_, i) => Math.round((t0 + i * dt) * 1000) / 1000);
  const k = 2 / cols;
  return (
    <AbsoluteFill style={{background: '#111'}}>
      {times.map((t, i) => (
        <div key={i} style={{position: 'absolute', left: (i % cols) * 1080 * k, top: Math.floor(i / cols) * 1920 * k, width: 1080, height: 1920, transform: `scale(${k})`, transformOrigin: '0 0', overflow: 'hidden'}}>
          <S5Throat t={t} />
          {guides && <Guides t={t} />}
          <div style={{position: 'absolute', left: 20, top: 20, fontSize: 70, color: '#FF0', fontFamily: 'monospace', textShadow: '0 0 8px #000'}}>{t.toFixed(2)}</div>
        </div>
      ))}
    </AbsoluteFill>
  );
};

const Root: React.FC = () => (
  <>
    <Composition id="Throat" component={Throat} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{t: 11.5, guides: false}} />
    <Composition
      id="ThroatSheet"
      component={ThroatSheet}
      durationInFrames={1}
      fps={30}
      width={2160}
      height={1920}
      defaultProps={{t0: 8.7, dt: 0.15, n: 28, cols: 7, guides: false, ts: undefined as number[] | undefined}}
      calculateMetadata={({props}) => {
        const n = props.ts ? props.ts.length : props.n;
        const rows = Math.ceil(n / props.cols);
        return {width: 2160, height: Math.round((1920 * 2 / props.cols) * rows), props};
      }}
    />
  </>
);
registerRoot(Root);
