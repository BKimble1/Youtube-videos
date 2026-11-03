// V3 module A test: the shattered distal radius (art/fracture.tsx with seams.Poses) and its reduction, with glue racing
// along the open cracks and squeezed thin as the fragments close. Draws FractureBone (and the wet film) directly.
//   remotion still <bun> One out.png --props='{"u":0,"race":0.6}'
//   remotion still <bun> Strip out.png --props='{"us":[0,0.2,0.4,0.6,0.8,1],"race":[0.3,0.7,1,1,1,1]}'
// Props: cam (default the hook framing {x:4,y:-4,w:60}), u (posesLerp: 0 = POSES_SHATTER, 1 = seated), race (0..1: the
// glue injected at the C1/C2 junction racing out along C1 both ways, up C2 and down C3, each front with its bright head;
// past 1 the fronts settle), set (0 fresh .. 1 satin), wedge (u for the wedge alone, default u).
import React from 'react';
import {AbsoluteFill, Composition, registerRoot} from 'remotion';
import {Cam, Layer, viewRect} from '../camera';
import {resetIds} from '../core/ids';
import {C} from '../art/palette';
import {FieldDetail} from '../art/bone';
import {FractureBone} from '../art/fracture';
import {WetFilm} from '../art/wet';
import {HealLayer} from '../art/heal';
import {BoneState2, GlueFront, GlueSpan, HEAL2_0} from '../v2state';
import {S_C2_ON_C1, S_C3_ON_C1, SeamId, posesLerp, seamLength} from '../art/seams';
import {clamp} from '../lib';

const L1 = seamLength('C1'), L2 = seamLength('C2'), L3 = seamLength('C3');
const HOOK: Cam = {x: 4, y: -4, w: 60};
const sm = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

/** the glue racing out from the C1/C2 junction (race 0..1 runs the fronts; 1..1.3 they settle): spans and fronts */
export const raceGlue = (race: number): {glue: Record<SeamId, GlueSpan>; fronts: GlueFront[]} => {
  const r = clamp(race);
  const flow = 1 - sm((race - 1) / 0.3);
  // the C1 fronts run to both borders, the C2 front up to the joint, C3's leaves C1 once C1's right front passes it
  const a1 = S_C2_ON_C1 * (1 - r), b1 = S_C2_ON_C1 + (L1 - S_C2_ON_C1) * r;
  const b2 = 0.4 + (L2 - 0.4) * r;
  const r3 = clamp((b1 - S_C3_ON_C1) / (L1 - S_C3_ON_C1));
  const b3 = (L3 + 0.2) * r3;
  const glue: Record<SeamId, GlueSpan> = {C1: {a: a1, b: b1}, C2: {a: 0, b: b2}, C3: {a: 0, b: b3}};
  const fronts: GlueFront[] = [];
  if (flow > 0.001 && race > 0) {
    fronts.push({seam: 'C1', s: a1, flow}, {seam: 'C1', s: b1, flow}, {seam: 'C2', s: b2, flow});
    if (b3 > 0.6) fronts.push({seam: 'C3', s: b3, flow});
  }
  return {glue, fronts};
};

type Props = {cam?: Cam; u?: number; race?: number; set?: number; wedge?: number; label?: string; wet?: number; bridge?: number; legacy?: boolean};
/** legacy: the V2 state (no poses, no fronts; the wedge alone by its u), for pixel diffs against the V3 path */
const One: React.FC<Props & {k?: number}> = ({cam = HOOK, u = 0, race = 0, set = 0, wedge, label, wet = 0, bridge = 0, legacy = false, k = 0}) => {
  resetIds(`sh${k}_`);
  const px = cam.w / 1080;
  const poses = posesLerp({wedge: wedge ?? u, styloid: u, lunate: u});
  const g = race > 0 ? raceGlue(race) : {glue: {C1: {a: 0, b: 0}, C2: {a: 0, b: 0}, C3: {a: 0, b: 0}}, fronts: []};
  const heal = bridge > 0 ? {...HEAL2_0, hem: 1, soft: 1, bridge, hard: bridge} : HEAL2_0;
  const st: BoneState2 = legacy
    ? {t: 0, px, wedge: poses.wedge, glue: g.glue, front: null, set, press: null, appContact: null, wet, flow: 0, surge: -1, heal}
    : {t: 0, px, wedge: poses.wedge, poses, glue: g.glue, front: null, fronts: g.fronts, set, press: null, appContact: null, wet, flow: 0, surge: -1, heal};
  const v = viewRect(cam);
  return (
    <AbsoluteFill style={{background: C.cavity}}>
      <Layer c={cam}>
        <rect x={-400} y={-400} width={800} height={800} fill={C.cavity} />
        <FieldDetail st={{px} as never} t={0} />
        <FractureBone st={st} view={v} />
        {bridge > 0 && <HealLayer st={st} view={v} />}
        {wet > 0 && <WetFilm st={st} />}
      </Layer>
      {label && <div style={{position: 'absolute', left: 16, top: 12, color: '#fff', font: '40px sans-serif', textShadow: '0 0 6px #000'}}>{label}</div>}
    </AbsoluteFill>
  );
};
const Strip: React.FC<{cam?: Cam; us: number[]; race?: number[]; cols?: number}> = ({cam, us, race, cols = 3}) => {
  const k = 1 / cols;
  return (
    <AbsoluteFill style={{background: '#111'}}>
      {us.map((u, j) => (
        <div key={j} style={{position: 'absolute', left: (j % cols) * 1080 * k, top: Math.floor(j / cols) * 1920 * k, width: 1080, height: 1920, transform: `scale(${k})`, transformOrigin: '0 0', overflow: 'hidden'}}>
          <One cam={cam} u={u} race={race?.[j] ?? 0} k={j} label={`u ${u.toFixed(2)} race ${(race?.[j] ?? 0).toFixed(2)}`} />
        </div>
      ))}
    </AbsoluteFill>
  );
};
registerRoot(() => (
  <>
    <Composition id="One" component={One as React.FC<Record<string, unknown>>} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{u: 0, race: 0}} />
    <Composition id="Strip" component={Strip as unknown as React.FC<Record<string, unknown>>} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{us: [0, 0.2, 0.4, 0.6, 0.8, 1]}} />
  </>
));
