// B1 test sheet: the fractured radius and the glue in its seams (art/fracture.tsx) at the key states of the V2 plan.
// npx remotion still src/test/fracture.entry.tsx Sheet out.png --log=error
// npx remotion still src/test/fracture.entry.tsx Sheet out.png --props='{"only":[0,1,2]}' --log=error
// npx remotion still src/test/fracture.entry.tsx One out.png --props='{"i":0}' --log=error
import React from 'react';
import {Composition, registerRoot, AbsoluteFill} from 'remotion';
import {Cam, Layer, viewRect} from '../camera';
import {resetIds} from '../core/ids';
import {C} from '../art/palette';
import {FieldDetail} from '../art/bone';
import {FractureBone} from '../art/fracture';
import {HealLayer} from '../art/heal';
import {BoneState2, HEAL2_0, Heal2, GlueSpan} from '../v2state';
import {SeamId, WEDGE_OUT, WEDGE_PRESS, WEDGE_SEATED, WedgeX, seamLength, seamPoint, wedgeLerp, xfPoint} from '../art/seams';
import {P} from '../core/geo';

const L1 = seamLength('C1'), L2 = seamLength('C2'), L3 = seamLength('C3');
const NONE: GlueSpan = {a: 0, b: 0};
// the film's framings (story.ts)
const CAM0: Cam = {x: 4.0, y: -0.6, w: 26};
const MATCH: Cam = {x: -7, y: 0.7247, w: 7.5};
const FIX: Cam = {x: 6, y: -4, w: 58};
const W80: Cam = {x: 6, y: -4, w: 80};
const HEAL: Cam = {x: 3.2, y: -0.8, w: 30};
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
  /** draw the healing layer (art/heal.tsx) over the fracture */
  healLayer?: boolean;
  t?: number;
};
const FULL13 = {C1: {a: 0, b: L1}, C3: {a: 0, b: L3}};
const ALL = {C1: {a: 0, b: L1}, C2: {a: 0, b: L2}, C3: {a: 0, b: L3}};
const STATES: S[] = [
  /* 0 */ {name: 'frame0', cam: CAM0, wedge: WEDGE_OUT, glue: {C1: {a: 0, b: 9.5}}, front: {seam: 'C1', s: 9.5, flow: 1}, press: 1, app: seamPoint('C1', 9.5)},
  /* 1 */ {name: 'push u.3', cam: CAM0, wedge: wedgeLerp(0.3), glue: {C1: {a: 0, b: 10}}, front: {seam: 'C1', s: 10, flow: 1}, press: 1, app: seamPoint('C1', 10)},
  /* 2 */ {name: 't0.38 seated', cam: CAM0, wedge: WEDGE_SEATED, glue: {C1: {a: 0, b: 10.4}}, front: {seam: 'C1', s: 10.4, flow: 1}, press: 1, app: seamPoint('C1', 10.4)},
  /* 3 */ {name: 't1.2 C3', cam: CAM0, wedge: WEDGE_SEATED, glue: {C1: {a: 0, b: L1}, C3: {a: 2.5, b: L3}}, front: {seam: 'C3', s: 2.5, flow: 1}, press: 1, app: seamPoint('C3', 2.5)},
  /* 4 */ {name: 't1.45 glued', cam: CAM0, wedge: WEDGE_SEATED, glue: {C1: {a: 0, b: L1}, C3: {a: 0.3, b: L3}}, press: 1},
  /* 5 */ {name: 'w58 set0', cam: FIX, wedge: WEDGE_SEATED, glue: ALL, set: 0},
  /* 6 */ {name: 'w58 set1', cam: FIX, wedge: WEDGE_SEATED, glue: ALL, set: 1},
  /* 7 */ {name: 'w80 set0', cam: W80, wedge: WEDGE_SEATED, glue: ALL, set: 0},
  /* 8 */ {name: 'w80 set1', cam: W80, wedge: WEDGE_SEATED, glue: ALL, set: 1},
  /* 9 */ {name: 'macro', cam: MATCH, wedge: WEDGE_SEATED, glue: ALL, set: 0},
  /* 10 */ {name: 'w112', cam: {x: 10, y: -27, w: 112}, wedge: WEDGE_SEATED, glue: {...FULL13, C2: {a: 0, b: 17}}},
  /* 11 */ {name: 'w150', cam: {x: 12, y: -40, w: 150}, wedge: WEDGE_SEATED, glue: {...FULL13, C2: {a: 0, b: 17}}},
  /* 12 */ {name: 'heal b.2', cam: HEAL, wedge: WEDGE_SEATED, glue: ALL, set: 1, heal: {hem: 1, soft: 1, bridge: 0.2, hard: 0.1}, healLayer: true},
  /* 13 */ {name: 'heal b.45', cam: HEAL, wedge: WEDGE_SEATED, glue: ALL, set: 1, heal: {hem: 1, soft: 1, bridge: 0.45, hard: 0.5}, healLayer: true},
  /* 14 */ {name: 'cam0 b.2', cam: CAM0, wedge: WEDGE_SEATED, glue: ALL, set: 1, heal: {hem: 1, soft: 1, bridge: 0.2, hard: 0.2}, healLayer: true},
  /* 15 */ {name: 'cam0 b.45', cam: CAM0, wedge: WEDGE_SEATED, glue: ALL, set: 1, heal: {hem: 1, soft: 1, bridge: 0.45, hard: 0.6}, healLayer: true},
  /* 16 */ {name: 'remodel .3', cam: HEAL, wedge: WEDGE_SEATED, glue: ALL, set: 1, heal: {hem: 1, soft: 1, bridge: 1, hard: 1, remodel: 0.3}, healLayer: true},
  /* 17 */ {name: 'T C1/C3', cam: {x: 6.2, y: 0.6, w: 9}, wedge: WEDGE_SEATED, glue: ALL, set: 0},
  /* 18 */ {name: 'T C1/C2', cam: {x: 3.6, y: -0.4, w: 9}, wedge: WEDGE_SEATED, glue: ALL, set: 0},
  /* 19 */ {name: 'C3 end', cam: {x: 11, y: 8.6, w: 9}, wedge: WEDGE_SEATED, glue: ALL, set: 0},
  /* 20 */ {name: 'wedge out mac', cam: {x: 8.6, y: 1.5, w: 13}, wedge: WEDGE_OUT, glue: {C1: {a: 0, b: 9.5}}},
  /* 21 */ {name: 'w62 stroke', cam: {x: 8.5, y: -10, w: 62}, wedge: WEDGE_SEATED, glue: {...FULL13, C2: {a: 0, b: 8}}, front: {seam: 'C2', s: 8, flow: 1}},
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
        {s.healLayer && <HealLayer st={st} view={v} />}
        {/* stand-in instrument tips (B4 draws the real ones) */}
        {s.press !== undefined && s.press > 0 && <circle cx={pressP.x} cy={pressP.y} r={0.35} fill="#B8C3CC" stroke="#172B3A" strokeWidth={2 * px} />}
        {s.app && <circle cx={s.app.x} cy={s.app.y} r={0.45} fill="#DDE4EA" stroke="#172B3A" strokeWidth={2 * px} />}
      </Layer>
      <div style={{position: 'absolute', left: 16, top: 12, color: '#fff', font: '40px sans-serif', textShadow: '0 0 6px #000'}}>{s.name}</div>
    </AbsoluteFill>
  );
};
const Sheet: React.FC<{only?: number[]; cols?: number}> = ({only, cols = 4}) => {
  const list = only ? only.map((i) => [i, STATES[i]] as const) : STATES.map((s, i) => [i, s] as const);
  const k = 1 / cols;
  return (
    <AbsoluteFill style={{background: '#111'}}>
      {list.map(([i, s], j) => (
        <div key={i} style={{position: 'absolute', left: (j % cols) * 1080 * k, top: Math.floor(j / cols) * 1920 * k, width: 1080, height: 1920, transform: `scale(${k})`, transformOrigin: '0 0', overflow: 'hidden'}}>
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
  const b1 = t < 0.36 ? 9.5 + 0.9 * (t / 0.36) : 10.4 + (L1 - 10.4) * Math.min(1, (t - 0.36) / 0.56);
  const a3 = L3 + (0.3 - L3) * Math.min(1, Math.max(0, (t - 1.05) / 0.4));
  const onC3 = t >= 1.05;
  return {
    name: `t ${t.toFixed(2)}`, cam: CAM0, wedge: wedgeLerp(ss(t, 0.04, 0.38)),
    glue: {C1: {a: 0, b: b1}, C3: onC3 ? {a: a3, b: L3} : NONE},
    front: onC3 ? (t < 1.45 ? {seam: 'C3', s: a3, flow: 1} : undefined) : t < 0.92 ? {seam: 'C1', s: b1, flow: 1} : undefined,
    press: 1 - ss(t, 1.5, 1.95),
    app: onC3 ? (t < 1.45 ? seamPoint('C3', a3) : undefined) : t < 0.92 ? seamPoint('C1', b1) : undefined,
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
    <Composition id="Sheet" component={Sheet} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{only: undefined as number[] | undefined, cols: 4}} />
    <Composition id="Strip" component={Strip} durationInFrames={1} fps={30} width={1080} height={640} defaultProps={{ts: [0, 0.1, 0.2, 0.3, 0.38, 0.6, 0.92, 1.05, 1.2, 1.45, 1.7, 1.95]}} />
    <Composition id="One" component={Single} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{i: 0}} />
  </>
));
