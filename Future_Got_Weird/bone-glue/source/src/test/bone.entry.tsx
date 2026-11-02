import React from 'react';
import {Composition, registerRoot, AbsoluteFill} from 'remotion';
import {Cam, Layer, viewRect} from '../camera';
import {BoneInside, BoneState, HEAL0, beadTip} from '../art/bone';
import {resetIds} from '../core/ids';
import {C} from '../art/palette';

type S = {cam: Cam; laid: number; t: number; wet?: number; set?: number; heal?: Partial<typeof HEAL0>; seep?: number};
const STATES: S[] = [
  {cam: {x: -1, y: -1, w: 30}, laid: 6, t: 0},
  {cam: {x: 3, y: -1.5, w: 29}, laid: 18, t: 0.75},
  {cam: {x: -7, y: 1.6, w: 9}, laid: 80, t: 11, wet: 1, set: 0.3},
  {cam: {x: 0, y: 0, w: 48}, laid: 80, t: 19.6, set: 1, seep: 1, heal: {hem: 1}},
  {cam: {x: 0, y: 0, w: 48}, laid: 80, t: 20.4, set: 1, seep: 1, heal: {hem: 1, soft: 1}},
  {cam: {x: 0, y: 0, w: 48}, laid: 80, t: 21.6, set: 1, seep: 1, heal: {hem: 1, soft: 1, hard: 1, resorb: 0.2}},
  {cam: {x: 0, y: 0, w: 48}, laid: 80, t: 23, set: 1, seep: 1, heal: {hem: 1, soft: 1, hard: 1, resorb: 0.65}},
  {cam: {x: 0, y: 0, w: 48}, laid: 80, t: 25.5, set: 1, seep: 1, heal: {hem: 1, soft: 1, hard: 1, resorb: 1, remodel: 1}},
];
const One: React.FC<{s: S; k: number}> = ({s, k}) => {
  resetIds(`b${k}_`);
  const px = s.cam.w / 1080;
  const st: BoneState = {t: s.t, laid: s.laid, laidAt: (x) => (x - 6) / 16, seep: s.seep ?? 0, set: s.set ?? 0, wet: s.wet ?? 0, heal: {...HEAL0, ...(s.heal ?? {})}, px};
  const tip = beadTip(s.laid);
  return (
    <AbsoluteFill style={{background: C.cavity}}>
      <Layer c={s.cam}>
        <rect x={-200} y={-200} width={400} height={400} fill={C.cavity} />
        <BoneInside st={st} view={viewRect(s.cam)} />
        {s.laid < 60 && <circle cx={tip.p.x} cy={tip.p.y} r={0.7} fill="#B8C3CC" stroke="#172B3A" strokeWidth={0.08} />}
      </Layer>
    </AbsoluteFill>
  );
};
const Sheet: React.FC = () => (
  <AbsoluteFill style={{background: '#111'}}>
    {STATES.map((s, i) => (
      <div key={i} style={{position: 'absolute', left: (i % 4) * 270, top: Math.floor(i / 4) * 480, width: 1080, height: 1920, transform: 'scale(0.25)', transformOrigin: '0 0', overflow: 'hidden'}}>
        <One s={s} k={i} />
      </div>
    ))}
  </AbsoluteFill>
);
const Single: React.FC<{i: number}> = ({i}) => <One s={STATES[i]} k={i} />;
registerRoot(() => (
  <>
    <Composition id="Sheet" component={Sheet} durationInFrames={1} fps={30} width={1080} height={960} />
    <Composition id="One" component={Single} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{i: 0}} />
  </>
));
