// Test entry for the arm + skeleton module: the film's cameras over the arm, skeleton, deep tissue and the real radius
// (bone.tsx), with the same layering as Scene.tsx (inside at z = 0 clipped to the arm, skin + rim at z = -10).
import React from 'react';
import {Composition, registerRoot, AbsoluteFill} from 'remotion';
import {Cam, Layer, layerScale, viewRect} from '../camera';
import {BoneInside, Radius, BoneState, HEAL0, BEAD_TOTAL} from '../art/bone';
import {Skeleton} from '../art/skeleton';
import {ArmSkin, ArmState, DeepTissue, IncisionRim, armOutlinePath} from '../art/arm';
import {resetIds} from '../core/ids';
import {pt} from '../core/geo';
import {C} from '../art/palette';

const boneSt = (px: number, o: Partial<BoneState> = {}): BoneState => ({t: 12, laid: BEAD_TOTAL, laidAt: (x) => (x - 6) / 16, seep: 1, set: 1, wet: 0, heal: HEAL0, px, ...o});
const A0: ArmState = {curl: 0.25, thumb: 0.2, incision: 1, sutures: 0, scar: 0, window: null};
const WIN = (r: number) => ({c: pt(-5, -24), r, soft: 0.38});

type St = {cam: Cam; arm: ArmState; bone?: Partial<BoneState>; label: string};
export const STATES: St[] = [
  {label: 'ECU', cam: {x: -1, y: -1, w: 30, k: 1, focus: 0}, arm: A0, bone: {laid: 6, t: 0, seep: 0, set: 0}},
  {label: 'widen', cam: {x: 12, y: -40, w: 150, k: 0.96, focus: -6}, arm: A0, bone: {laid: 70, t: 4, seep: 0, set: 0}},
  {label: 'clinical', cam: {x: 110, y: -80, w: 470, k: 0.86, focus: -10}, arm: A0},
  {label: 'cutaway', cam: {x: -8, y: -60, w: 250, k: 0.9, focus: -8}, arm: {...A0, window: WIN(62)}},
  {label: 'healing', cam: {x: 0, y: 1.5, w: 46, k: 1, focus: 0}, arm: {...A0, incision: 0, sutures: 1, window: WIN(95)}, bone: {heal: {...HEAL0, hem: 1, soft: 0.6}}},
  {label: 'follow 0.25', cam: {x: -8, y: -74, w: 182, k: 1, focus: -10}, arm: {...A0, incision: 0, scar: 1}},
  {label: 'follow 0.55', cam: {x: -8, y: -74, w: 182, k: 1, focus: -10}, arm: {...A0, curl: 0.55, thumb: 0.275, incision: 0, scar: 1}},
  {label: 'sutures', cam: {x: 2, y: -6, w: 70, k: 1, focus: -10}, arm: {...A0, incision: 0, sutures: 1}},
  {label: 'closing', cam: {x: 2, y: -6, w: 70, k: 1, focus: -10}, arm: {...A0, incision: 0.35, sutures: 0.4}},
  {label: 'window shrinking', cam: {x: -8, y: -60, w: 200, k: 1, focus: -10}, arm: {...A0, incision: 0, scar: 0.8, window: WIN(30)}},
  {label: 'skeleton', cam: {x: -4, y: -95, w: 150, k: 1, focus: 0}, arm: {...A0, window: WIN(200)}},
];

const Z_SKIN = -10;
export const Shot: React.FC<{st: St; k: number}> = ({st, k}) => {
  const fkey = `t${k}_`;
  resetIds(fkey);
  const c = st.cam;
  const px = c.w / 1080;
  const bone = boneSt(px, st.bone);
  const rClip = layerScale(c, Z_SKIN) / layerScale(c, 0);
  return (
    <AbsoluteFill style={{background: '#1E4A6B'}}>
      <Layer c={c} z={40} maxBlur={18}>
        <rect x={-2000} y={-2000} width={4000} height={4000} fill="#24557A" />
        <rect x={-120} y={-400} width={240} height={1400} rx={30} fill="#2C5F85" />
      </Layer>
      <Layer c={c} z={0} maxBlur={20}>
        <defs>
          <clipPath id={`${fkey}armclip`}>
            <path d={armOutlinePath(st.arm)} transform={`translate(${c.x} ${c.y}) scale(${rClip}) translate(${-c.x} ${-c.y})`} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${fkey}armclip)`}>
          <DeepTissue id={`${fkey}deep`} s={st.arm} />
          <Skeleton id={`${fkey}skel`} curl={st.arm.curl} thumb={st.arm.thumb} detail={px < 0.1 ? 1 : 0.6} />
          <BoneInside st={bone} view={viewRect(c, 0)} />
        </g>
      </Layer>
      <Layer c={c} z={Z_SKIN} maxBlur={22}>
        <ArmSkin id={`${fkey}skin`} s={st.arm} />
        <IncisionRim id={`${fkey}rim`} s={st.arm} />
      </Layer>
    </AbsoluteFill>
  );
};

const Sheet: React.FC<{ids: number[]}> = ({ids}) => (
  <AbsoluteFill style={{background: '#111'}}>
    {ids.map((i, n) => (
      <div key={i} style={{position: 'absolute', left: (n % 3) * 360, top: Math.floor(n / 3) * 640, width: 1080, height: 1920, transform: 'scale(0.3333)', transformOrigin: '0 0', overflow: 'hidden'}}>
        <Shot st={STATES[i]} k={i} />
      </div>
    ))}
  </AbsoluteFill>
);
const One: React.FC<{i: number}> = ({i}) => <Shot st={STATES[i]} k={i} />;

const SkelView: React.FC<{x: number; y: number; w: number; curl: number}> = ({x, y, w, curl}) => {
  resetIds('sk_');
  const cam: Cam = {x, y, w, k: 1};
  return (
    <AbsoluteFill style={{background: C.cavity}}>
      <Layer c={cam}>
        <Skeleton id="sk" curl={curl} thumb={0.2} detail={1} />
        <Radius st={boneSt(w / 1080)} view={viewRect(cam)} />
      </Layer>
    </AbsoluteFill>
  );
};

registerRoot(() => (
  <>
    <Composition id="Sheet" component={Sheet} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{ids: [0, 1, 2, 3, 4, 5, 6, 7, 8]}} />
    <Composition id="One" component={One} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{i: 0}} />
    <Composition id="Skel" component={SkelView} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{x: -2, y: -52, w: 72, curl: 0.25}} />
  </>
));
