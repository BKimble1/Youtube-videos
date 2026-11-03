// Test entry for the water module (contract D): the environment at the film's real framings, with a plain olive fish
// silhouette on the bed, a flat slate eel (so readability can be judged), the water rush at the release, and optional
// mock captions in the caption zones.
//   npx remotion still src/test/water.entry.tsx WaterTest out.png --props='{"t":0,"caps":true}'
//   npx remotion still src/test/water.entry.tsx WaterSheet out.png --props='{"ts":[2.2,2.27,2.33],"cols":3}'
import React from 'react';
import {AbsoluteFill, Composition, registerRoot} from 'remotion';
import '../fonts';
import {closed, open, pt, tube} from '../core/geo';
import {BODY, EXIT, EYE} from '../anatomy';
import {DIST, Layer} from '../camera';
import {RADII} from '../eel';
import {camAt, eelAt, EV, fishAt, lensAt} from '../story';
import {C, INK, INK_PX, NS} from '../art/palette';
import {resetIds} from '../core/ids';
import {EnvBack, EnvFront, FishShadow, RUSH_DIR, WaterRush} from '../art/water';

const Frame: React.FC<{t: number; caps?: boolean; eel?: boolean; rushDir?: number}> = ({t, caps = false, eel = true, rushDir = RUSH_DIR}) => {
  const c = camAt(t);
  const f = fishAt(t);
  const e = eelAt(t);
  const xr = f.xray;
  const C2 = e.pts.map((q) => pt(q.x, q.y));
  const R = RADII.map((r) => Math.max(0.06, r));
  const from = e.free ? 0 : Math.max(0, e.exitIdx - 1);
  const tb = tube(C2.slice(from), R.slice(from), true, from === 0);
  const eelShape = <path d={closed(tb.outline, 0.5)} fill={C.eelFlank} stroke={INK} strokeWidth={INK_PX} vectorEffect={NS} strokeLinejoin="round" />;
  const lz = e.free ? -lensAt(t) * DIST * c.w : 0;
  return (
    <AbsoluteFill style={{backgroundColor: C.waterMid, overflow: 'hidden'}}>
      <EnvBack c={c} t={t} xray={xr} />
      <Layer c={c}>
        <FishShadow t={t} c={c} xray={xr} />
        <path d={closed(BODY, 0.8)} fill={xr > 0.5 ? C.xraySoft : C.fishBody} stroke={xr > 0.5 ? C.xrayEdge : INK} strokeWidth={INK_PX} vectorEffect={NS} />
        <circle cx={EYE.c.x} cy={EYE.c.y} r={EYE.r} fill={C.eyeIris} stroke={INK} strokeWidth={1.8} vectorEffect={NS} />
        <circle cx={EYE.c.x - 0.3} cy={EYE.c.y} r={EYE.r * 0.55} fill={C.pupil} />
        {eel && lz === 0 && eelShape}
        {eel && !e.free && <path d={open(C2.slice(0, e.exitIdx + 1))} stroke={C.eelBack} strokeWidth={1.4} fill="none" opacity={0.25 + 0.6 * Math.max(f.translucent, xr)} />}
      </Layer>
      {eel && lz !== 0 && <Layer c={c} z={lz}>{eelShape}</Layer>}
      <EnvFront c={c} t={t} xray={xr} />
      <Layer c={c}>
        <WaterRush at={pt(EXIT.x, EXIT.y)} dir={rushDir} t={t} t0={EV.release} />
      </Layer>
      {caps && (
        <>
          <Cap y={330} text="it just swallowed" />
          <Cap y={1480} text="Its head comes out LAST." />
        </>
      )}
    </AbsoluteFill>
  );
};
const Cap: React.FC<{y: number; text: string}> = ({y, text}) => (
  <div style={{position: 'absolute', left: 0, right: 0, top: y - 40, textAlign: 'center', fontFamily: '"Nunito Variable"', fontWeight: 900, fontSize: 68, color: '#FFFFFF', textShadow: '0 4px 10px rgba(0,0,0,0.55), 0 0 3px rgba(0,0,0,0.8)'}}>
    {text}
  </div>
);

export const WaterTest: React.FC<{t: number; caps?: boolean; eel?: boolean; rushDir?: number}> = ({t, caps, eel, rushDir}) => {
  resetIds('w');
  return <Frame t={t} caps={caps} eel={eel} rushDir={rushDir} />;
};
export const WaterSheet: React.FC<{ts: number[]; cols?: number; caps?: boolean}> = ({ts, cols = 3, caps}) => {
  const k = 1 / cols;
  return (
    <AbsoluteFill style={{backgroundColor: '#111'}}>
      {ts.map((t, i) => {
        resetIds(`s${i}_`);
        return (
          <div key={i} style={{position: 'absolute', left: (i % cols) * 1080 * k, top: Math.floor(i / cols) * 1920 * k, width: 1080, height: 1920, transform: `scale(${k})`, transformOrigin: '0 0', overflow: 'hidden'}}>
            <Frame t={t} caps={caps} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const Root: React.FC = () => (
  <>
    <Composition id="WaterTest" component={WaterTest} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{t: 0, caps: false, eel: true}} />
    <Composition id="WaterSheet" component={WaterSheet} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{ts: [0, 3, 6.5], cols: 3, caps: false}} />
  </>
);
registerRoot(Root);
