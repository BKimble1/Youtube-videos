// B2 test sheet: healing over the glued fracture (art/heal.tsx on top of art/fracture.tsx) at the V2 plan's stages.
// npx remotion still src/test/heal.entry.tsx Sheet out.png --log=error
// npx remotion still src/test/heal.entry.tsx One out.png --props='{"i":4}' --log=error
// npx remotion still src/test/heal.entry.tsx Strip out.png --log=error   (the 19.2-25.6 s progression, plan timing)
import React from 'react';
import {Composition, registerRoot, AbsoluteFill} from 'remotion';
import {Cam, Layer, viewRect} from '../camera';
import {resetIds} from '../core/ids';
import {C} from '../art/palette';
import {FieldDetail} from '../art/bone';
import {FractureBone} from '../art/fracture';
import {HealLayer} from '../art/heal';
import {BoneState2, HEAL2_0, Heal2, GlueSpan} from '../v2state';
import {SeamId, WEDGE_SEATED, seamLength} from '../art/seams';
import {ss} from '../lib';

const L1 = seamLength('C1'), L2 = seamLength('C2'), L3 = seamLength('C3');
const HEAL_CAM: Cam = {x: 3.2, y: -0.8, w: 30};
const WIDE: Cam = {x: 3, y: -4, w: 80};
const ALL: Record<SeamId, GlueSpan> = {C1: {a: 0, b: L1}, C2: {a: 0, b: L2}, C3: {a: 0, b: L3}};
type S = {name: string; cam: Cam; heal: Partial<Heal2>; t?: number};
const STATES: S[] = [
  {name: 'hem 1', cam: HEAL_CAM, heal: {hem: 1}},
  {name: 'soft 1', cam: HEAL_CAM, heal: {hem: 1, soft: 1}},
  {name: 'bridge .15', cam: HEAL_CAM, heal: {hem: 1, soft: 1, bridge: 0.15, hard: 0.15}},
  {name: 'bridge .35', cam: HEAL_CAM, heal: {hem: 1, soft: 1, bridge: 0.35, hard: 0.6}},
  {name: 'bridge .55', cam: HEAL_CAM, heal: {hem: 1, soft: 1, bridge: 0.55, hard: 0.9}},
  {name: 'bridge .75', cam: HEAL_CAM, heal: {hem: 1, soft: 1, bridge: 0.75, hard: 1}},
  {name: 'bridge 1 hard 1', cam: HEAL_CAM, heal: {hem: 1, soft: 1, bridge: 1, hard: 1}},
  {name: 'remodel 1', cam: HEAL_CAM, heal: {hem: 1, soft: 1, bridge: 1, hard: 1, remodel: 1}},
  {name: 'bridge .02', cam: HEAL_CAM, heal: {hem: 1, soft: 0.85, bridge: 0.02, hard: 0}},
  {name: 'remodel .5', cam: HEAL_CAM, heal: {hem: 1, soft: 1, bridge: 1, hard: 1, remodel: 0.5}},
  {name: 'w80 bridge .55', cam: WIDE, heal: {hem: 1, soft: 1, bridge: 0.55, hard: 0.9}},
  {name: 'w80 soft', cam: WIDE, heal: {hem: 1, soft: 0.6}},
];
/** the plan's healing schedule (the lead's story.ts owns the real one) */
const healAt = (t: number): Heal2 => {
  const bu = Math.min(1, Math.max(0, (t - 20.2) / (24.4 - 20.2)));
  return {
    hem: ss(t, 19.2, 19.7), soft: ss(t, 19.6, 20.4), bridge: 0.7 * ss(bu, 0, 1) + 0.3 * bu, hard: ss(t, 20.6, 22.0), remodel: ss(t, 24.2, 25.6),
  };
};
const One: React.FC<{s: S; k: number}> = ({s, k}) => {
  resetIds(`h${k}_`);
  const px = s.cam.w / 1080;
  const st: BoneState2 = {
    t: s.t ?? 0, px, wedge: WEDGE_SEATED, glue: ALL, front: null, set: 1, press: null, appContact: null,
    wet: 0, flow: 0, surge: -1, heal: {...HEAL2_0, ...s.heal},
  };
  const v = viewRect(s.cam);
  return (
    <AbsoluteFill style={{background: C.cavity}}>
      <Layer c={s.cam}>
        <rect x={-400} y={-400} width={800} height={800} fill={C.cavity} />
        <FieldDetail st={{px} as never} t={0} />
        <FractureBone st={st} view={v} />
        <HealLayer st={st} view={v} />
      </Layer>
      <div style={{position: 'absolute', left: 16, top: 12, color: '#fff', font: '40px sans-serif', textShadow: '0 0 6px #000'}}>{s.name}</div>
    </AbsoluteFill>
  );
};
const Sheet: React.FC<{only?: number[]}> = ({only}) => {
  const list = only ? only.map((i) => [i, STATES[i]] as const) : STATES.map((s, i) => [i, s] as const);
  return (
    <AbsoluteFill style={{background: '#111'}}>
      {list.map(([i, s], j) => (
        <div key={i} style={{position: 'absolute', left: (j % 4) * 270, top: Math.floor(j / 4) * 480, width: 1080, height: 1920, transform: 'scale(0.25)', transformOrigin: '0 0', overflow: 'hidden'}}>
          <One s={s} k={i} />
        </div>
      ))}
    </AbsoluteFill>
  );
};
const Single: React.FC<{i: number; t?: number}> = ({i, t}) =>
  t !== undefined ? <One s={{name: `t ${t.toFixed(2)}`, cam: HEAL_CAM, heal: healAt(t), t}} k={900} /> : <One s={STATES[i]} k={i} />;
const Strip: React.FC<{ts: number[]}> = ({ts}) => (
  <AbsoluteFill style={{background: '#111'}}>
    {ts.map((t, j) => (
      <div key={j} style={{position: 'absolute', left: (j % 6) * 180, top: Math.floor(j / 6) * 320, width: 1080, height: 1920, transform: 'scale(0.1667)', transformOrigin: '0 0', overflow: 'hidden'}}>
        <One s={{name: `t ${t.toFixed(2)}`, cam: HEAL_CAM, heal: healAt(t), t}} k={100 + j} />
      </div>
    ))}
  </AbsoluteFill>
);
/** full-resolution windows onto several states (x, y, w, h: the window in frame pixels; k: display scale) */
type CropP = {only: number[]; x: number; y: number; w: number; h: number; k: number; cols: number; ts?: number[]};
const Crops: React.FC<CropP> = ({only, x, y, w, h, k, cols, ts}) => {
  // either fixed states (only) or times on the plan's schedule (ts)
  const list: S[] = ts ? ts.map((t) => ({name: `t ${t.toFixed(2)}`, cam: HEAL_CAM, heal: healAt(t), t})) : only.map((i) => STATES[i]);
  return (
    <AbsoluteFill style={{background: '#111'}}>
      {list.map((s, j) => (
        <div key={j} style={{position: 'absolute', left: (j % cols) * (w * k + 6), top: Math.floor(j / cols) * (h * k + 6), width: w * k, height: h * k, overflow: 'hidden'}}>
          <div style={{position: 'absolute', left: -x * k, top: -y * k, width: 1080, height: 1920, transform: `scale(${k})`, transformOrigin: '0 0'}}>
            <One s={s} k={200 + j} />
          </div>
          <div style={{position: 'absolute', left: 6, top: 4, color: '#fff', font: '18px sans-serif', textShadow: '0 0 4px #000'}}>{s.name}</div>
        </div>
      ))}
    </AbsoluteFill>
  );
};
registerRoot(() => (
  <>
    <Composition id="Crops" component={Crops} durationInFrames={1} fps={30} width={1620} height={1200}
      defaultProps={{only: [0, 1, 2, 3, 4, 5, 6, 9, 7], x: 300, y: 820, w: 760, h: 560, k: 0.7, cols: 3} as CropP} />
    <Composition id="Sheet" component={Sheet} durationInFrames={1} fps={30} width={1080} height={1440} defaultProps={{only: undefined as number[] | undefined}} />
    <Composition id="Strip" component={Strip} durationInFrames={1} fps={30} width={1080} height={640}
      defaultProps={{ts: [19.3, 19.7, 20.2, 20.6, 21.0, 21.4, 21.8, 22.3, 22.8, 23.4, 24.2, 25.4]}} />
    <Composition id="One" component={Single} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{i: 4, t: undefined as number | undefined}} />
  </>
));
