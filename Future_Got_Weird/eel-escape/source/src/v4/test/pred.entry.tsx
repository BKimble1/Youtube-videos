// Test entry for package P, the 3D predator (src/v4/art/pred3d.tsx).
//   npx remotion still src/v4/test/pred.entry.tsx PredSheet out.png --props='{"sheet":"brief"}'
//   npx remotion still src/v4/test/pred.entry.tsx PredStill out.png --props='{"view":"S1","gill":1}'
//   npx remotion still src/v4/test/pred.entry.tsx PredVsV3 out.png       (pure side view vs V3 FishBody, same scale)
// props of PredStill: view (a preset below), any PredPose field, debug (overlay predGeom: outline, gap, mouth, exit)
import React from 'react';
import {AbsoluteFill, Composition, registerRoot} from 'remotion';
import {resetIds} from '../../core/ids';
import {C, INK} from '../../art/palette';
import {BODY_PATH, FishBody, FishFar, FISH_REST, fishSilhouette, GillGap, Operculum, Pectoral} from '../../art/fish';
import {basis, Basis, orbitCam, Orbit, proj, V3} from '../three';
import {Predator, predGeom, PredPose, PRED_REST, swimBend} from '../art/pred3d';

type View = {o: Orbit; pose?: Partial<PredPose>; label: string; dim?: number};
const LOOK_EEL: V3 = [-18, -14, 12];
export const VIEWS: Record<string, View> = {
  S1: {o: {target: [-27, -5, 4], az: 58, el: 12, d: 46, f: 1250}, label: 'S1 rear 3/4'},
  S1g4: {o: {target: [-27, -5, 4], az: 58, el: 12, d: 46, f: 1250}, pose: {gill: 0.4}, label: 'S1 gill .4'},
  S1g1: {o: {target: [-27, -5, 4], az: 58, el: 12, d: 46, f: 1250}, pose: {gill: 1}, label: 'S1 gill 1'},
  S2: {o: {target: [-12, 1, 0], az: 0, el: 0, d: 150, f: 1250, cy: 1100}, label: 'S2 side'},
  S2m5: {o: {target: [-12, 1, 0], az: 0, el: 0, d: 150, f: 1250, cy: 1100}, pose: {mouth: 0.5}, label: 'S2 mouth .5'},
  S2m1: {o: {target: [-12, 1, 0], az: 0, el: 0, d: 150, f: 1250, cy: 1100}, pose: {mouth: 1}, label: 'S2 mouth 1'},
  S2c: {o: {target: [-38, 1, 0], az: 0, el: 0, d: 62, f: 1250, cy: 1100}, pose: {mouth: 1}, label: 'S2 close mouth 1'},
  S8: {o: {target: [-16, -6, 2], az: 25, el: 50, d: 92, f: 1250, cy: 1150}, pose: {gill: 0.5, look: LOOK_EEL}, label: 'S8 over the back'},
  S9: {o: {target: [-24.5, -5.5, 6.6], az: 42, el: 8, d: 13.5, f: 1000}, pose: {gill: 0.8}, label: 'S9 gill edge .8'},
  S10: {o: {target: [-22, 3, 2], az: 10, el: -12, d: 62, f: 1250}, pose: {gill: 0.3, look: [-30, -8, 25]}, label: 'S10 low beside'},
  S11: {o: {target: [-5, 0, 0], az: -30, el: 6, d: 230, f: 1250, cy: 1250}, pose: {bend: 0.3}, label: 'S11 distant', dim: 0.25},
  S11b: {o: {target: [-5, 0, 0], az: -30, el: 6, d: 230, f: 1250, cy: 1250}, pose: {bend: -0.3, t: 0.55}, label: 'S11 bend -', dim: 0.25},
  S1m: {o: {target: [-27, -5, 4], az: 58, el: 12, d: 46, f: 1250}, pose: {gill: 1, mouth: 1}, label: 'S1 gill 1 mouth 1'},
  top: {o: {target: [-10, -4, 0], az: 0, el: 88, d: 170, f: 1250}, label: 'from above'},
  back: {o: {target: [-10, -2, 0], az: 90, el: 5, d: 120, f: 1250}, label: 'from behind'},
  front: {o: {target: [-30, 0, 0], az: -70, el: 10, d: 90, f: 1250}, pose: {mouth: 1}, label: 'front 3/4 mouth'},
};
const SHEETS: Record<string, string[]> = {
  brief: ['S1', 'S1g4', 'S1g1', 'S2', 'S2m5', 'S2m1', 'S8', 'S9', 'S10', 'S11', 'S11b', 'S1m'],
  extra: ['top', 'back', 'front', 'S2c', 'S9', 'S1g1'],
};

const Water: React.FC<{B: Basis}> = ({B}) => {
  // a plain water gradient and the riverbed plane's horizon (for reading the pose only)
  const far = proj(B, [B.eye[0] + B.fw[0] * 4000, 12.95, B.eye[2] + B.fw[2] * 4000]);
  const hy = Math.max(-50, Math.min(1970, far.y));
  return (
    <>
      <defs>
        <linearGradient id="tw" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.waterTop} />
          <stop offset="0.6" stopColor={C.waterMid} />
          <stop offset="1" stopColor={C.waterDeep} />
        </linearGradient>
      </defs>
      <rect width={1080} height={1920} fill="url(#tw)" />
      {B.eye[1] < 12.95 && <rect x={0} y={hy} width={1080} height={Math.max(0, 1920 - hy)} fill={C.sand} opacity={0.55} />}
    </>
  );
};

const Debug: React.FC<{B: Basis; pose: PredPose}> = ({B, pose}) => {
  const g = predGeom(B, pose);
  const ex = proj(B, g.exit.p);
  const eo = proj(B, [g.exit.p[0] + g.exit.out[0] * 3, g.exit.p[1] + g.exit.out[1] * 3, g.exit.p[2] + g.exit.out[2] * 3]);
  const en = proj(B, [g.exit.p[0] + g.exit.n[0] * 3, g.exit.p[1] + g.exit.n[1] * 3, g.exit.p[2] + g.exit.n[2] * 3]);
  const mi = proj(B, g.mouthIn.p);
  const md = proj(B, [g.mouthIn.p[0] + g.mouthIn.dir[0] * 5, g.mouthIn.p[1] + g.mouthIn.dir[1] * 5, g.mouthIn.p[2] + g.mouthIn.dir[2] * 5]);
  return (
    <g>
      <path d={g.outline} fill="#ff00ff" fillOpacity={0.12} stroke="#ff00ff" strokeWidth={1.5} />
      {g.gap && <path d={g.gap} fill="#00ffff" fillOpacity={0.35} stroke="#00ffff" strokeWidth={1.5} />}
      {g.mouthHole && <path d={g.mouthHole} fill="#ffff00" fillOpacity={0.35} stroke="#ffff00" strokeWidth={1.5} />}
      <circle cx={ex.x} cy={ex.y} r={8} fill="none" stroke="#fff" strokeWidth={3} />
      <line x1={ex.x} y1={ex.y} x2={eo.x} y2={eo.y} stroke="#ff4" strokeWidth={4} />
      <line x1={ex.x} y1={ex.y} x2={en.x} y2={en.y} stroke="#4ff" strokeWidth={3} />
      <line x1={mi.x} y1={mi.y} x2={md.x} y2={md.y} stroke="#f84" strokeWidth={4} />
      <circle cx={g.eye.x} cy={g.eye.y} r={g.eye.r} fill="none" stroke="#fff" strokeWidth={2} strokeDasharray="6 4" />
    </g>
  );
};

const Shot: React.FC<{v: View; over?: Partial<PredPose>; debug?: boolean; label?: boolean}> = ({v, over, debug, label}) => {
  const B = basis(orbitCam(v.o));
  const pose: PredPose = {...PRED_REST, ...v.pose, ...over};
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', left: 0, top: 0}}>
      <Water B={B} />
      <Predator B={B} pose={pose} dim={v.dim} />
      {debug && <Debug B={B} pose={pose} />}
      <rect x={0} y={0} width={1080} height={500} fill="#000" opacity={0.08} />
      {label !== false && (
        <text x={30} y={1880} fontSize={44} fill="#fff" fontFamily="monospace" stroke="#000" strokeWidth={1}>
          {v.label}
        </text>
      )}
    </svg>
  );
};

type StillP = Partial<PredPose> & {view: string; debug?: boolean; az?: number; el?: number; d?: number};
const PredStill: React.FC<StillP> = ({view, debug, az, el, d, ...over}) => {
  resetIds('p');
  const v0 = VIEWS[view] ?? VIEWS.S1;
  const v: View = {...v0, o: {...v0.o, az: az ?? v0.o.az, el: el ?? v0.o.el, d: d ?? v0.o.d}};
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Shot v={v} over={over} debug={debug} />
    </AbsoluteFill>
  );
};

const PredSheet: React.FC<{sheet: string; cols?: number; debug?: boolean; t?: number}> = ({sheet, cols = 4, debug, t}) => {
  const names = SHEETS[sheet] ?? sheet.split(',');
  const k = 1 / cols;
  return (
    <AbsoluteFill style={{background: '#111'}}>
      {names.map((n, i) => {
        resetIds(`s${i}_`);
        return (
          <div key={i} style={{position: 'absolute', left: (i % cols) * 1080 * k, top: Math.floor(i / cols) * 1920 * k, width: 1080, height: 1920, transform: `scale(${k})`, transformOrigin: '0 0', overflow: 'hidden'}}>
            <Shot v={VIEWS[n]} debug={debug} over={t !== undefined ? {t, finPhase: t * 3.1, bend: (VIEWS[n].pose?.bend ?? 0) !== 0 ? swimBend(t) : 0} : undefined} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/** the pure side view (az 0, a long lens: nearly orthographic) beside V3's FishBody at the same scale and an
 *  overlay of V3's silhouette on the 3D render */
const PredVsV3: React.FC<{gill?: number}> = ({gill = 0}) => {
  resetIds('v');
  const s = {...FISH_REST, gill: 0};
  const sc = 9.6;
  const D = 4000;
  // world (x, y, 0) → screen (540 + sc x, cy + sc y) for a camera at z = D with f = sc D
  const mk = (cy: number) => basis(orbitCam({target: [0, 0, 0], az: 0, el: 0, d: D, f: sc * D, cy}));
  const B1 = mk(560), B2 = mk(1000);
  return (
    <AbsoluteFill style={{background: C.waterMid}}>
      <svg width={1080} height={1920}>
        <g transform={`translate(540,${560 - 380}) scale(${sc})`}>
          <FishFar s={s} />
          <FishBody s={s} />
          <GillGap s={s} />
          <Operculum s={s} />
          <Pectoral s={s} />
        </g>
        <text x={30} y={80} fontSize={40} fill="#fff" fontFamily="monospace">V3 FishBody</text>
        <Predator B={B1} pose={{...PRED_REST, gill}} />
        <text x={30} y={520} fontSize={40} fill="#fff" fontFamily="monospace">V4 pred3d az 0</text>
        <Predator B={B2} pose={{...PRED_REST, gill}} />
        <g transform={`translate(540,1000) scale(${sc})`} fill="none" stroke="#ff00ff" strokeWidth={1.2}>
          <V3Outline />
        </g>
        <text x={30} y={1300} fontSize={40} fill="#fff" fontFamily="monospace">overlay: V3 outline (magenta)</text>
        <Predator B={mk(1600)} pose={{...PRED_REST, gill: 1, mouth: 1}} />
        <text x={30} y={1880} fontSize={40} fill="#fff" fontFamily="monospace">gill 1, mouth 1</text>
      </svg>
    </AbsoluteFill>
  );
};
const V3Outline: React.FC = () => (
  <>
    <path d={BODY_PATH} vectorEffect="non-scaling-stroke" />
    <path d={fishSilhouette(FISH_REST)} vectorEffect="non-scaling-stroke" strokeOpacity={0.5} />
  </>
);

const Root: React.FC = () => (
  <>
    <Composition id="PredStill" component={PredStill} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{view: 'S1'} as StillP} />
    <Composition
      id="PredSheet"
      component={PredSheet}
      durationInFrames={1}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{sheet: 'brief', cols: 4} as {sheet: string; cols?: number; debug?: boolean; t?: number}}
      calculateMetadata={({props}) => {
        const n = (SHEETS[props.sheet] ?? props.sheet.split(',')).length;
        const cols = props.cols ?? 4;
        return {width: 1080, height: Math.ceil(n / cols) * (1920 / cols)};
      }}
    />
    <Composition id="PredVsV3" component={PredVsV3} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{gill: 0}} />
  </>
);
registerRoot(Root);
void INK;
