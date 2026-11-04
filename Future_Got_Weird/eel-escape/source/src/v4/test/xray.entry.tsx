// V4 S3 XRAY test stills and contact sheets.
//   npx remotion still src/v4/test/xray.entry.tsx XrayStill out.png --props='{"t":4.94}'
//   npx remotion still src/v4/test/xray.entry.tsx XraySheet out.png --props='{"t0":3.6,"dt":0.15,"n":17,"cols":6}'
//   npx remotion still src/v4/test/xray.entry.tsx XrayCarry out.png --props='{"t":5.78}'   (the shot with carryTail drawn over it)
//   (XraySheet also takes "carry": true to draw the contract over every cell, and "ts": [...] for chosen times)
import React from 'react';
import {AbsoluteFill, Composition, registerRoot} from 'remotion';
import {resetIds} from '../../core/ids';
import {carryTail, CAP_Y, KEEP_Y} from '../timing';
import {S3Xray} from '../shots/S3Xray';

const CarryOverlay: React.FC<{t: number}> = ({t}) => {
  const c = carryTail(t);
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
      <polyline points={c.pts.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke="#FFD84A" strokeWidth={3} />
      {c.pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={c.r[i]} fill="none" stroke="#FFD84A" strokeOpacity={0.6} strokeWidth={1.5} />
      ))}
    </svg>
  );
};

const Cell: React.FC<{t: number; k: string; guides?: boolean; label?: boolean; carry?: boolean}> = ({t, k, guides = true, label = true, carry = false}) => {
  resetIds(k);
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <S3Xray t={t} />
      {carry && <CarryOverlay t={t} />}
      {guides && (
        <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
          <rect x={110} y={CAP_Y - 130} width={760} height={260} fill="#FFFFFF" fillOpacity={0.1} stroke="#FFFFFF" strokeOpacity={0.35} strokeDasharray="12 10" strokeWidth={3} />
          <line x1={0} x2={1080} y1={KEEP_Y} y2={KEEP_Y} stroke="#FF5050" strokeOpacity={0.5} strokeWidth={3} strokeDasharray="20 14" />
        </svg>
      )}
      {label && <div style={{position: 'absolute', left: 20, top: 16, fontSize: 64, color: '#FF0', fontFamily: 'monospace', textShadow: '0 0 8px #000'}}>{t.toFixed(2)}</div>}
    </AbsoluteFill>
  );
};

const XrayStill: React.FC<{t: number; guides?: boolean}> = ({t, guides = false}) => (
  <AbsoluteFill style={{background: '#000'}}>
    <Cell t={t} k="s_" guides={guides} label={false} />
  </AbsoluteFill>
);

const XraySheet: React.FC<{t0: number; dt: number; n: number; cols: number; ts?: number[]; carry?: boolean}> = ({t0, dt, n, cols, ts, carry = false}) => {
  const times = ts ?? Array.from({length: n}, (_, i) => +(t0 + i * dt).toFixed(3));
  const k = 1 / cols;
  return (
    <AbsoluteFill style={{background: '#111'}}>
      {times.map((t, i) => (
        <div key={i} style={{position: 'absolute', left: (i % cols) * 1080 * k, top: Math.floor(i / cols) * 1920 * k, width: 1080, height: 1920, transform: `scale(${k})`, transformOrigin: '0 0', overflow: 'hidden'}}>
          <Cell t={t} k={`c${i}_`} carry={carry} />
        </div>
      ))}
    </AbsoluteFill>
  );
};

/** the shot with the hand-off contract drawn over it (yellow: carryTail's centreline and radii) */
const XrayCarry: React.FC<{t: number}> = ({t}) => (
  <AbsoluteFill style={{background: '#000'}}>
    <Cell t={t} k="k_" guides={false} carry />
  </AbsoluteFill>
);

const sheetH = (n: number, cols: number) => Math.ceil(n / cols) * Math.round(1920 / cols);
const Root: React.FC = () => (
  <>
    <Composition id="XrayStill" component={XrayStill} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{t: 4.94, guides: false}} />
    <Composition
      id="XraySheet"
      component={XraySheet}
      durationInFrames={1}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{t0: 3.6, dt: 0.15, n: 17, cols: 6, ts: undefined as number[] | undefined, carry: false}}
      calculateMetadata={({props}) => {
        const n = props.ts ? props.ts.length : props.n;
        return {width: 1080, height: sheetH(n, props.cols)};
      }}
    />
    <Composition id="XrayCarry" component={XrayCarry} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{t: 5.78}} />
  </>
);
registerRoot(Root);
