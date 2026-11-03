// B2 test sheet: healing over the glued fracture (art/heal.tsx on top of art/fracture.tsx). The timed views use the
// film's own schedule and camera (story.ts boneAt / camAt), so they follow the lead's retimings.
// npx remotion still src/test/heal.entry.tsx Sheet out.jpg --log=error
// npx remotion still src/test/heal.entry.tsx One out.jpg --props='{"i":4}' --log=error
// npx remotion still src/test/heal.entry.tsx Strip out.jpg --log=error            (the healing stretch on the film's clock)
// npx remotion still src/test/heal.entry.tsx Crops out.jpg --props='{"bs":[0.3,0.5,0.7],"rs":[0.5]}' --log=error
// rem0 (Strip, Crops, One): preview a remodel schedule that starts at rem0 (s) instead of EV.rem0, same shape as
// story.ts's own (remodel = 0.6 * ss(t, rem0, EV.rem1) + 0.4 * linear)
// npx remotion still src/test/heal.entry.tsx Junctions out.jpg --log=error    (the C1/C2 and C1/C3 corners at 3x)
// npx remotion still src/test/heal.entry.tsx Remodel out.jpg --log=error      (the woven -> mature front at 2x)
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
import {EV, boneAt, camAt} from '../story';
import {clamp, ss} from '../lib';

const L1 = seamLength('C1'), L2 = seamLength('C2'), L3 = seamLength('C3');
const HEAL_CAM: Cam = {x: 3.2, y: -0.8, w: 30};
const WIDE: Cam = {x: 3, y: -4, w: 80};
const MID: Cam = {x: 6, y: -4, w: 58};
const ALL: Record<SeamId, GlueSpan> = {C1: {a: 0, b: L1}, C2: {a: 0, b: L2}, C3: {a: 0, b: L3}};
/** a state: either fixed healing values (heal) on a camera, or a film time (t: the film's own state and camera;
 *  rem0: an earlier remodel start to preview, see the header) */
type S = {name: string; cam?: Cam; heal?: Partial<Heal2>; t?: number; rem0?: number};
const filmAt = (t: number, px: number, rem0?: number): BoneState2 => {
  const st = boneAt(t, px);
  if (rem0 === undefined) return st;
  const u = clamp((t - rem0) / (EV.rem1 - rem0));
  return {...st, heal: {...st.heal, remodel: 0.6 * ss(t, rem0, EV.rem1) + 0.4 * u}};
};
/** the film time at which the healing reaches a bridge (or remodel) value (bisection on the film's schedule) */
const tWhen = (key: 'bridge' | 'remodel', v: number, rem0?: number): number => {
  let lo = 19, hi = 26.5;
  for (let i = 0; i < 40; i++) {
    const m = (lo + hi) / 2;
    if (filmAt(m, 0.03, rem0).heal[key] < v) lo = m; else hi = m;
  }
  return (lo + hi) / 2;
};
const at = (key: 'bridge' | 'remodel', v: number, rem0?: number): S => ({name: `${key} ${v}`, t: tWhen(key, v, rem0), rem0});
const STATES: S[] = [
  {name: 'hem 1', cam: HEAL_CAM, heal: {hem: 1}},
  {name: 'soft 1', cam: HEAL_CAM, heal: {hem: 1, soft: 1}},
  at('bridge', 0.15),
  at('bridge', 0.3),
  at('bridge', 0.5),
  at('bridge', 0.7),
  at('bridge', 0.9),
  at('remodel', 0.25),
  {name: 'bridge .02', cam: HEAL_CAM, heal: {hem: 1, soft: 1, bridge: 0.02, hard: 0}},
  at('remodel', 0.5),
  {name: 'w80 bridge .55', cam: WIDE, heal: {hem: 1, soft: 1, bridge: 0.55, hard: 0.9}},
  {name: 'w80 soft', cam: WIDE, heal: {hem: 1, soft: 0.6}},
  {name: 'w58 soft', cam: MID, heal: {hem: 1, soft: 1}},
  {name: 'remodel 1', cam: HEAL_CAM, heal: {hem: 1, soft: 1, bridge: 1, hard: 1, remodel: 1}},
  {name: 'remodel .25', cam: HEAL_CAM, heal: {hem: 1, soft: 1, bridge: 1, hard: 1, remodel: 0.25}},
  {name: 'remodel .5', cam: HEAL_CAM, heal: {hem: 1, soft: 1, bridge: 1, hard: 1, remodel: 0.5}},
  {name: 'remodel .75', cam: HEAL_CAM, heal: {hem: 1, soft: 1, bridge: 1, hard: 1, remodel: 0.75}},
  {name: 'remodel .93', cam: HEAL_CAM, heal: {hem: 1, soft: 1, bridge: 1, hard: 1, remodel: 0.93}},
];
const resolve = (s: S): {cam: Cam; st: (px: number) => BoneState2} => {
  if (s.t !== undefined) {
    const wc = camAt(s.t);
    const cam = wc.world === 'wrist' ? wc.cam : HEAL_CAM;
    return {cam, st: (px) => filmAt(s.t as number, px, s.rem0)};
  }
  return {
    cam: s.cam ?? HEAL_CAM,
    st: (px) => ({
      t: 0, px, wedge: WEDGE_SEATED, glue: ALL, front: null, set: 1, press: null, appContact: null,
      wet: 0, flow: 0, surge: -1, heal: {...HEAL2_0, ...s.heal},
    }),
  };
};
const One: React.FC<{s: S; k: number}> = ({s, k}) => {
  resetIds(`h${k}_`);
  const {cam, st: mk} = resolve(s);
  const px = cam.w / 1080;
  const st = mk(px);
  const v = viewRect(cam);
  return (
    <AbsoluteFill style={{background: C.cavity}}>
      <Layer c={cam}>
        <rect x={-400} y={-400} width={800} height={800} fill={C.cavity} />
        <FieldDetail st={{px} as never} t={0} />
        <FractureBone st={st} view={v} />
        <HealLayer st={st} view={v} />
      </Layer>
      <div style={{position: 'absolute', left: 16, top: 12, color: '#fff', font: '40px sans-serif', textShadow: '0 0 6px #000'}}>
        {s.name}{s.t !== undefined ? ` (${s.t.toFixed(2)} s)` : ''}
      </div>
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
const Single: React.FC<{i: number; t?: number; rem0?: number}> = ({i, t, rem0}) =>
  t !== undefined ? <One s={{name: 't', t, rem0}} k={900} /> : <One s={STATES[i]} k={i} />;
/** the healing stretch on the film's clock (its own camera; 6 per row) */
const Strip: React.FC<{ts: number[]; rem0?: number}> = ({ts, rem0}) => (
  <AbsoluteFill style={{background: '#111'}}>
    {ts.map((t, j) => (
      <div key={j} style={{position: 'absolute', left: (j % 6) * 180, top: Math.floor(j / 6) * 320, width: 1080, height: 1920, transform: 'scale(0.1667)', transformOrigin: '0 0', overflow: 'hidden'}}>
        <One s={{name: 't', t, rem0}} k={100 + j} />
      </div>
    ))}
  </AbsoluteFill>
);
/** full-resolution windows (x, y, w, h: the window in frame pixels; k: display scale) onto fixed states (only), film
 *  times (ts), or the film times of given bridge (bs) and remodel (rs) values */
type CropP = {only?: number[]; x: number; y: number; w: number; h: number; k: number; cols: number; ts?: number[]; bs?: number[]; rs?: number[]; rem0?: number};
const Crops: React.FC<CropP> = ({only, x, y, w, h, k, cols, ts, bs, rs, rem0}) => {
  const list: S[] = [
    ...(only ?? []).map((i) => STATES[i]),
    ...(ts ?? []).map((t) => ({name: 't', t, rem0})),
    ...(bs ?? []).map((b) => at('bridge', b, rem0)),
    ...(rs ?? []).map((r) => at('remodel', r, rem0)),
  ];
  return (
    <AbsoluteFill style={{background: '#111'}}>
      {list.map((s, j) => (
        <div key={j} style={{position: 'absolute', left: (j % cols) * (w * k + 6), top: Math.floor(j / cols) * (h * k + 6), width: w * k, height: h * k, overflow: 'hidden'}}>
          <div style={{position: 'absolute', left: -x * k, top: -y * k, width: 1080, height: 1920, transform: `scale(${k})`, transformOrigin: '0 0'}}>
            <One s={s} k={200 + j} />
          </div>
          <div style={{position: 'absolute', left: 6, top: 4, color: '#fff', font: '18px sans-serif', textShadow: '0 0 4px #000'}}>
            {s.name}{s.t !== undefined ? ` (${s.t.toFixed(2)} s)` : ''}
          </div>
        </div>
      ))}
    </AbsoluteFill>
  );
};
registerRoot(() => (
  <>
    <Composition id="Crops" component={Crops} durationInFrames={1} fps={30} width={1620} height={1200}
      defaultProps={{bs: [0.3, 0.5, 0.7], rs: [0.5], x: 300, y: 820, w: 760, h: 560, k: 0.7, cols: 2} as CropP} />
    {/* the T-junctions through the island phase (corner discs and growth-line arcs) and the remodelling front, on the
        film's clock and camera */}
    <Composition id="Junctions" component={Crops} durationInFrames={1} fps={30} width={1620} height={1200}
      defaultProps={{ts: [21.0, 22.4, 22.8, 23.4, 24.0, 24.4], bs: [], rs: [], x: 490, y: 920, w: 220, h: 120, k: 3, cols: 2} as CropP} />
    <Composition id="Remodel" component={Crops} durationInFrames={1} fps={30} width={1620} height={1200}
      defaultProps={{ts: [24.4, 24.6, 24.7, 24.8, 24.9, 25.0, 25.05, 25.1, 25.2], bs: [], rs: [], x: 300, y: 950, w: 260, h: 120, k: 2, cols: 3} as CropP} />
    <Composition id="Sheet" component={Sheet} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{only: undefined as number[] | undefined}} />
    {/* the healing stretch and on through the ease-out and the loop push-in (the healed bone must stay healed) */}
    <Composition id="Strip" component={Strip} durationInFrames={1} fps={30} width={1080} height={1280}
      defaultProps={{ts: [19.5, 20.0, 20.5, 21.0, 21.5, 22.0, 22.5, 23.0, 23.5, 24.0, 24.5, 25.0, 25.2, 25.4, 25.45, 25.6, 25.8, 26.2, 27.0, 28.0, 28.5, 28.7, 28.85, 28.9], rem0: undefined as number | undefined}} />
    <Composition id="One" component={Single} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{i: 4, t: undefined as number | undefined, rem0: undefined as number | undefined}} />
  </>
));
