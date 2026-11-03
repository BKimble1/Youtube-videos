// B1 test sheet: the fractured radius and the glue in its seams (art/fracture.tsx) at the key states of the V2 plan.
// npx remotion still src/test/fracture.entry.tsx Sheet out.png --log=error
// npx remotion still src/test/fracture.entry.tsx One out.png --props='{"i":0}' --log=error
import React from 'react';
import {Composition, registerRoot, AbsoluteFill} from 'remotion';
import {Cam, Layer, viewRect} from '../camera';
import {resetIds} from '../core/ids';
import {C} from '../art/palette';
import {FieldDetail} from '../art/bone';
import {FractureBone} from '../art/fracture';
import {BoneState2, HEAL2_0, Heal2, GlueSpan} from '../v2state';
import {SeamId, WEDGE_OUT, WEDGE_PRESS, WEDGE_SEATED, WedgeX, seamLength, seamPoint, wedgeLerp, xfPoint} from '../art/seams';
import {P} from '../core/geo';

const L1 = seamLength('C1'), L2 = seamLength('C2'), L3 = seamLength('C3');
const NONE: GlueSpan = {a: 0, b: 0};
const CAM0: Cam = {x: 3, y: -0.5, w: 26};
type S = {
  name: string;
  cam: Cam;
  wedge: WedgeX;
  glue: Partial<Record<SeamId, GlueSpan>>;
  front?: {seam: SeamId; s: number; flow: number};
  press?: number; // contact of the probe on the wedge
  app?: P;
  set?: number;
  heal?: Partial<Heal2>;
  t?: number;
};
const FULL13 = {C1: {a: 0, b: L1}, C3: {a: 0, b: L3}};
const STATES: S[] = [
  {name: 'a frame0', cam: CAM0, wedge: WEDGE_OUT, glue: {C1: {a: 0, b: 9.5}}, front: {seam: 'C1', s: 9.5, flow: 1}, press: 1, app: seamPoint('C1', 9.5)},
  {name: 'a2 push', cam: CAM0, wedge: wedgeLerp(0.55), glue: {C1: {a: 0, b: 13.5}}, front: {seam: 'C1', s: 13.5, flow: 1}, press: 1, app: seamPoint('C1', 13.5)},
  {name: 'b t0.4', cam: CAM0, wedge: WEDGE_SEATED, glue: {C1: {a: 0, b: 19}}, front: {seam: 'C1', s: 19, flow: 1}, press: 1, app: seamPoint('C1', 19)},
  {name: 'c t1.2', cam: CAM0, wedge: WEDGE_SEATED, glue: {C1: {a: 0, b: L1}, C3: {a: 0.3, b: L3}}, front: {seam: 'C3', s: 0.3, flow: 1}, press: 1, app: seamPoint('C3', 0.3)},
  {name: 'd t1.9', cam: CAM0, wedge: WEDGE_SEATED, glue: FULL13, press: 0},
  {name: 'g set1', cam: CAM0, wedge: WEDGE_SEATED, glue: FULL13, set: 1},
  {name: 'h bridge.45', cam: CAM0, wedge: WEDGE_SEATED, glue: FULL13, set: 1, heal: {bridge: 0.45}},
  {name: 'h bridge.8', cam: CAM0, wedge: WEDGE_SEATED, glue: FULL13, set: 1, heal: {bridge: 0.8}},
  {name: 'i remodel1', cam: CAM0, wedge: WEDGE_SEATED, glue: FULL13, set: 1, heal: {bridge: 1, remodel: 1}},
  {name: 'e wide', cam: {x: 12, y: -40, w: 150}, wedge: WEDGE_SEATED, glue: {...FULL13, C2: {a: 0, b: 17}}},
  {name: 'f macro', cam: {x: -7, y: 0.7247, w: 7.5}, wedge: WEDGE_SEATED, glue: {...FULL13, C2: {a: 0, b: 17}}, set: 0.2},
  {name: 'fix w80', cam: {x: 3, y: -4, w: 80}, wedge: WEDGE_SEATED, glue: {C1: {a: 0, b: L1}, C2: {a: 0, b: L2}, C3: {a: 0, b: L3}}},
];
const One: React.FC<{s: S; k: number}> = ({s, k}) => {
  resetIds(`f${k}_`);
  const px = s.cam.w / 1080;
  const glue: Record<SeamId, GlueSpan> = {C1: s.glue.C1 ?? NONE, C2: s.glue.C2 ?? NONE, C3: s.glue.C3 ?? NONE};
  const pressP = xfPoint(WEDGE_PRESS, s.wedge);
  const st: BoneState2 = {
    t: s.t ?? 0, px, wedge: s.wedge, glue, front: s.front ?? null, set: s.set ?? 0,
    press: s.press !== undefined ? {p: pressP, contact: s.press} : null,
    appContact: s.app ? {p: s.app, contact: 1} : null,
    wet: 0, flow: 0, surge: -1, heal: {...HEAL2_0, ...(s.heal ?? {})},
  };
  const v = viewRect(s.cam);
  return (
    <AbsoluteFill style={{background: C.cavity}}>
      <Layer c={s.cam}>
        <rect x={-400} y={-400} width={800} height={800} fill={C.cavity} />
        {/* V1's surgical field for context (the lead's scene draws the real one) */}
        <FieldDetail st={{px} as never} t={0} />
        <FractureBone st={st} view={v} />
        {/* stand-in instrument tips (B4 draws the real ones) */}
        {s.press !== undefined && s.press > 0 && <circle cx={pressP.x} cy={pressP.y} r={0.5} fill="#B8C3CC" stroke="#172B3A" strokeWidth={2 * px} />}
        {s.app && <circle cx={s.app.x} cy={s.app.y} r={0.62} fill="#DDE4EA" stroke="#172B3A" strokeWidth={2 * px} />}
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
const Single: React.FC<{i: number}> = ({i}) => <One s={STATES[i]} k={i} />;
/** an approximate 0-2 s opening (the lead's story.ts owns the real timing): seat, lay C1, hop, lay C3 upward, lift */
const opening = (t: number): S => {
  const sm = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
  const ss = (x: number, a: number, b: number) => sm((x - a) / (b - a));
  const b1 = 9.5 + (L1 - 9.5) * Math.min(1, t / 0.75);
  const a3 = L3 * (1 - Math.min(1, Math.max(0, (t - 0.9) / 0.4)));
  const f1 = 1 - ss(t, 0.72, 0.8);
  const f3 = ss(t, 0.9, 0.96) * (1 - ss(t, 1.28, 1.38));
  const onC3 = t >= 0.85;
  return {
    name: `t ${t.toFixed(2)}`, cam: CAM0, wedge: wedgeLerp(ss(t, 0.04, 0.38)),
    glue: {C1: {a: 0, b: b1}, C3: t > 0.9 ? {a: a3, b: L3} : NONE},
    front: onC3 ? {seam: 'C3', s: a3, flow: f3} : {seam: 'C1', s: b1, flow: f1},
    press: 1 - ss(t, 1.35, 1.7),
    app: onC3 ? (f3 > 0.01 ? seamPoint('C3', a3) : undefined) : f1 > 0.01 ? seamPoint('C1', b1) : undefined,
    set: 0, t,
  };
};
const Strip: React.FC<{ts: number[]}> = ({ts}) => (
  <AbsoluteFill style={{background: '#111'}}>
    {ts.map((t, j) => (
      <div key={j} style={{position: 'absolute', left: (j % 6) * 180, top: Math.floor(j / 6) * 320, width: 1080, height: 1920, transform: 'scale(0.1667)', transformOrigin: '0 0', overflow: 'hidden'}}>
        <One s={opening(t)} k={100 + j} />
      </div>
    ))}
  </AbsoluteFill>
);
registerRoot(() => (
  <>
    <Composition id="Sheet" component={Sheet} durationInFrames={1} fps={30} width={1080} height={1440} defaultProps={{only: undefined as number[] | undefined}} />
    <Composition id="Strip" component={Strip} durationInFrames={1} fps={30} width={1080} height={640} defaultProps={{ts: [0, 0.2, 0.38, 0.5, 0.7, 0.76, 0.8, 0.95, 1.1, 1.3, 1.45, 1.9]}} />
    <Composition id="One" component={Single} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{i: 0}} />
  </>
));
