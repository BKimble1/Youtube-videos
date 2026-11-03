// Test entry for module D: the hook's elongated 'cut' cutaway window over the distal radius and ulna (arm.tsx Win
// aspect / rot / rim) and the Weber reduction forceps (forceps.tsx), layered as Scene.tsx: the inside at depth 0
// clipped to the arm (deep tissue, skeleton, the fractured radius, the forceps' contact shadow), the skin at Z_SKIN,
// the instrument at INSTR_Z with its tips reprojected to bone depth.
import React from 'react';
import {AbsoluteFill, Composition, registerRoot} from 'remotion';
import {Cam, Layer, layerScale, viewRect} from '../camera';
import {Skeleton} from '../art/skeleton';
import {ArmSkin, ArmState, DeepTissue, Win, armOutlinePath} from '../art/arm';
import {FractureBone} from '../art/fracture';
import {ForcepsShadow, ForcepsState, ReductionForceps} from '../art/forceps';
import {INSTR_Z} from '../art/instruments';
import {BONE_DEPTH} from '../art/anatomy';
import {resetIds} from '../core/ids';
import {P, pt} from '../core/geo';
import {boneAt} from '../story';
import {BoneState2} from '../v2state';

const Z_SKIN = -0.7 * BONE_DEPTH;
const reproject = (c: Cam, p: P, z: number): P => {
  const r = layerScale(c, 0) / layerScale(c, z);
  return pt(c.x + (p.x - c.x) * r, c.y + (p.y - c.y) * r);
};

/** the hook's window: about 26 mm across, 70 mm long, along the forearm over the distal radius and ulna */
export const HOOK_WIN: Win = {c: pt(-2.5, -12), r: 14, soft: 0.1, aspect: 2.5, rot: 0.15, rim: 'cut'};
const ARM: ArmState = {curl: 0.25, thumb: 0.2, incision: 0, sutures: 0, scar: 0, window: HOOK_WIN};
/** the bite: the lunate fragment (left of C2) and the styloid fragment (right of C2) */
const TA = pt(-8.5, -15), TB = pt(11, -21);
const HOOK: Cam = {x: 2, y: -14, w: 80, k: 1, focus: -2};
const CLOSE: Cam = {x: 2, y: -16, w: 45, k: 1, focus: -2};
const WIDE: Cam = {x: -8, y: -50, w: 200, k: 1, focus: 0};

type St = {label: string; cam: Cam; arm?: ArmState; f?: Partial<ForcepsState> | null; ang?: number};
const F0: ForcepsState = {tipA: TA, tipB: TB, close: 1, on: 1, lift: 0};
export const STATES: St[] = [
  {label: 'frame 0 (no tools)', cam: HOOK, f: null},
  {label: 'entering', cam: HOOK, f: {on: 0.55, close: 0, lift: 0.5}},
  {label: 'open, over the bone', cam: HOOK, f: {close: 0}},
  {label: 'bite (closed)', cam: HOOK, f: {close: 1}},
  {label: 'close cam, bite', cam: CLOSE, f: {close: 1}},
  {label: 'close cam, half', cam: CLOSE, f: {close: 0.5}},
  {label: 'withdrawing', cam: HOOK, f: {close: 0.2, lift: 0.8, on: 0.7}},
  {label: 'wide (whole tool)', cam: WIDE, f: {close: 1}},
  {label: 'tracking: other tips, straight up', cam: HOOK, f: {tipA: pt(-10, -10), tipB: pt(14, -14)}, ang: -Math.PI / 2},
  {label: 'round soft window (V2 style)', cam: HOOK, arm: {...ARM, window: {c: pt(-3, -14), r: 22, soft: 0.22}}, f: null},
  {label: 'soft rim, shaped', cam: HOOK, arm: {...ARM, window: {...HOOK_WIN, rim: 'soft', soft: 0.2}}, f: null},
  {label: 'cut rim, inc 0.6', cam: HOOK, arm: {...ARM, window: {...HOOK_WIN, inc: 0.6}}, f: null},
  {label: 'tracking: tips 14 mm apart', cam: HOOK, f: {tipA: pt(-5, -16), tipB: pt(8.5, -19.5)}},
  {label: 'tracking: tips 30 mm apart, open', cam: HOOK, f: {tipA: pt(-13, -12), tipB: pt(16, -22), close: 0}},
  {label: 'hand far upper left', cam: HOOK, f: {close: 1}, ang: -2.5},
];

const bone = (px: number): BoneState2 => ({...boneAt(0, px), press: null, appContact: null, wet: 0, front: null});

export const Shot: React.FC<{st: St; k: number}> = ({st, k}) => {
  const fkey = `f${k}_`;
  resetIds(fkey);
  const c = st.cam;
  const px = c.w / 1080;
  const arm = st.arm ?? ARM;
  const fs: ForcepsState | null = st.f === null || st.f === undefined ? null : {...F0, ...st.f};
  const fsI = fs ? {...fs, tipA: reproject(c, fs.tipA, INSTR_Z), tipB: reproject(c, fs.tipB, INSTR_Z)} : null;
  const rClip = layerScale(c, Z_SKIN) / layerScale(c, 0);
  const view = viewRect(c, 0);
  return (
    <AbsoluteFill style={{background: '#1E4A6B'}}>
      <Layer c={c} z={40} maxBlur={18}>
        <rect x={-2000} y={-2000} width={4000} height={4000} fill="#24557A" />
        <rect x={-120} y={-400} width={240} height={1400} rx={30} fill="#2C5F85" />
      </Layer>
      <Layer c={c} z={0} maxBlur={20}>
        <defs>
          <clipPath id={`${fkey}armclip`}>
            <path d={armOutlinePath(arm)} transform={`translate(${c.x} ${c.y}) scale(${rClip}) translate(${-c.x} ${-c.y})`} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${fkey}armclip)`}>
          <DeepTissue id={`${fkey}deep`} s={arm} />
          <Skeleton id={`${fkey}skel`} curl={arm.curl} thumb={arm.thumb} detail={px < 0.1 ? 1 : 0.6} />
          <FractureBone st={bone(px)} view={view} />
          {fs && <ForcepsShadow st={fs} px={px} ang={st.ang} />}
        </g>
      </Layer>
      <Layer c={c} z={Z_SKIN} maxBlur={22}>
        <ArmSkin id={`${fkey}skin`} s={arm} />
        {fs && (
          <g mask={arm.window ? `url(#${fkey}skin-wm)` : undefined}>
            <ForcepsShadow st={{...fs, tipA: reproject(c, fs.tipA, Z_SKIN), tipB: reproject(c, fs.tipB, Z_SKIN)}} px={px} ang={st.ang} z={Z_SKIN} />
          </g>
        )}
      </Layer>
      {fsI && (
        <Layer c={c} z={INSTR_Z} maxBlur={c.w < 60 ? 1.5 : 20}>
          <ReductionForceps id={`${fkey}fc`} st={fsI} px={px} ang={st.ang} />
        </Layer>
      )}
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

registerRoot(() => (
  <>
    <Composition id="Sheet" component={Sheet} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{ids: [0, 1, 2, 3, 4, 5, 6, 7, 8]}} />
    <Composition id="One" component={One} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{i: 3}} />
  </>
));
