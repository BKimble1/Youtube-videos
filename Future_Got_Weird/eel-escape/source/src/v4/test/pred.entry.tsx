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
import {add3, basis, Basis, cross3, dot3, mul3, norm3, orbitCam, Orbit, proj, sub3, V3} from '../three';
import {backFrom, Eel3D, N} from '../eelV4';
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
  S2h0: {o: {target: [-30, 1, 0], az: 0, el: 0, d: 85, f: 1250, cy: 1100}, pose: {mouth: 0}, label: 'S2 head mouth 0'},
  S2h5: {o: {target: [-30, 1, 0], az: 0, el: 0, d: 85, f: 1250, cy: 1100}, pose: {mouth: 0.5}, label: 'S2 head mouth .5'},
  S2h1: {o: {target: [-30, 1, 0], az: 0, el: 0, d: 85, f: 1250, cy: 1100}, pose: {mouth: 1}, label: 'S2 head mouth 1'},
  S2c: {o: {target: [-38, 1, 0], az: 0, el: 0, d: 62, f: 1250, cy: 1100}, pose: {mouth: 1}, label: 'S2 close mouth 1'},
  S8: {o: {target: [-16, -6, 2], az: 25, el: 50, d: 92, f: 1250, cy: 1150}, pose: {gill: 0.5, look: LOOK_EEL}, label: 'S8 over the back'},
  S9: {o: {target: [-24.5, -5.5, 6.6], az: 42, el: 8, d: 13.5, f: 1000}, pose: {gill: 0.8}, label: 'S9 gill edge .8'},
  S9x: {o: {target: [-23.8, -6.6, 7.4], az: 45, el: 8, d: 6.8, f: 1000}, pose: {gill: 0.8}, label: 'gill edge 150 px/u'},
  S9w: {o: {target: [-22, -6, 8], az: 30, el: 12, d: 34, f: 1100, cy: 1050}, pose: {gill: 0.8}, label: 'S9 wider'},
  S10: {o: {target: [-22, 3, 2], az: 10, el: -12, d: 62, f: 1250}, pose: {gill: 0.3, look: [-30, -8, 25]}, label: 'S10 low beside'},
  S11: {o: {target: [-5, 0, 0], az: -30, el: 6, d: 230, f: 1250, cy: 1250}, pose: {bend: 0.3}, label: 'S11 distant', dim: 0.25},
  S11b: {o: {target: [-5, 0, 0], az: -30, el: 6, d: 230, f: 1250, cy: 1250}, pose: {bend: -0.3, t: 0.55}, label: 'S11 bend -', dim: 0.25},
  S11c: {o: {target: [-5, 0, 0], az: -30, el: 6, d: 110, f: 1250, cy: 1150}, pose: {bend: 0.3}, label: 'S11 nearer', dim: 0.25},
  S1m: {o: {target: [-27, -5, 4], az: 58, el: 12, d: 46, f: 1250}, pose: {gill: 1, mouth: 1}, label: 'S1 gill 1 mouth 1'},
  top: {o: {target: [-10, -4, 0], az: 0, el: 88, d: 170, f: 1250}, label: 'from above'},
  topc: {o: {target: [-32, -6, 0], az: 30, el: 70, d: 60, f: 1250, roll: -60}, pose: {gill: 0.6, look: [-20, -20, 10]}, label: 'head from above'},
  back: {o: {target: [-10, -2, 0], az: 90, el: 5, d: 120, f: 1250}, label: 'from behind'},
  front: {o: {target: [-30, 0, 0], az: -70, el: 10, d: 90, f: 1250}, pose: {mouth: 1}, label: 'front 3/4 mouth'},
};
Object.assign(VIEWS, {
  farSide: {o: {target: [-10, 0, 0], az: 180, el: 10, d: 130, f: 1250}, pose: {gill: 0.8}, label: 'far side az 180'},
  below: {o: {target: [-15, 4, 0], az: 30, el: -55, d: 110, f: 1250}, pose: {mouth: 0.6}, label: 'from below'},
  startle: {o: {target: [-12, 1, 0], az: 0, el: 0, d: 150, f: 1250, cy: 1100}, pose: {startle: 1, t: 0.1}, label: 'S2 startle 1'},
  lookA: {o: {target: [-40, -6, 3], az: 15, el: 5, d: 22, f: 1250}, pose: {look: [-60, -10, 5]}, label: 'look forward'},
  lookB: {o: {target: [-40, -6, 3], az: 15, el: 5, d: 22, f: 1250}, pose: {look: [-25, -25, 20]}, label: 'look up-back'},
  lookC: {o: {target: [-40, -6, 3], az: 15, el: 5, d: 22, f: 1250}, pose: {look: [-38, 10, 30]}, label: 'look down-out'},
} as Record<string, View>);
const SHEETS: Record<string, string[]> = {
  brief: ['S1', 'S1g4', 'S1g1', 'S2', 'S2m5', 'S2m1', 'S2h0', 'S2h5', 'S2h1', 'S8', 'S9', 'S9x', 'S10', 'S11', 'S11b', 'S1m'],
  extra: ['top', 'back', 'front', 'S2c', 'S9', 'S1g1'],
  odd: ['farSide', 'below', 'startle', 'back', 'lookA', 'lookB', 'lookC', 'topc'],
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

const Shot: React.FC<{v: View; over?: Partial<PredPose>; debug?: boolean; label?: boolean; tag?: string}> = ({v, over, debug, label, tag}) => {
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
          {v.label + (tag ?? '')}
        </text>
      )}
    </svg>
  );
};

/** a moving pose at time t (the cover breathing, the fins fanning, a swimming bend where the view has one) */
const overAt = (t: number, v: View): Partial<PredPose> => ({
  t,
  finPhase: t * 3.1,
  gill: v.pose?.gill !== undefined ? v.pose.gill : 0.22 + 0.2 * Math.sin(t * 2.4),
  bend: (v.pose?.bend ?? 0) !== 0 ? swimBend(t) : 0,
});
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

const PredSheet: React.FC<{sheet: string; cols?: number; debug?: boolean; t?: number; vary?: boolean; ts?: number[]}> = ({sheet, cols = 4, debug, t, vary, ts}) => {
  const names0 = SHEETS[sheet] ?? sheet.split(',');
  const names = ts ? ts.map(() => names0[0]) : names0;
  const k = 1 / cols;
  return (
    <AbsoluteFill style={{background: '#111'}}>
      {names.map((n, i) => {
        resetIds(`s${i}_`);
        return (
          <div key={i} style={{position: 'absolute', left: (i % cols) * 1080 * k, top: Math.floor(i / cols) * 1920 * k, width: 1080, height: 1920, transform: `scale(${k})`, transformOrigin: '0 0', overflow: 'hidden'}}>
            <Shot v={VIEWS[n]} debug={debug} tag={ts ? ` t=${ts[i].toFixed(2)}` : undefined} over={ts ? overAt(ts[i], VIEWS[n]) : t !== undefined || vary ? overAt((t ?? 0) + (vary ? i * 0.013 : 0), VIEWS[n]) : undefined} />
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

/** a test eel through the gill exit (integration check of predGeom): `inside` eel units of the body lie under the
 *  cover (from the snout when headIn, else from the tail end), the rest curls outside */
const eelThrough = (g: ReturnType<typeof predGeom>, inside: number, headIn: boolean, t: number): V3[] => {
  const P = g.exit.p, out = g.exit.out, n = g.exit.n;
  const inDir = norm3(sub3(P, [-26.6, -5.5, 5.1]));
  const side = norm3(cross3(n, out));
  const pts: V3[] = [];
  for (let i = 0; i <= N; i++) {
    const u = headIn ? i / N : 1 - i / N; // 0 at the end that is inside
    const s = u * 54 - inside;
    if (s <= 0) pts.push(add3(P, mul3(inDir, s)));
    else {
      // outside: leave along `out`, settle into the skin's tangent plane (a little off it) and curl back along the
      // body, with a small wave
      const T0 = norm3(sub3(out, mul3(n, dot3(out, n))));
      let p = P, h = out;
      const steps = Math.ceil(s / 0.25);
      const ds = s / steps;
      for (let k = 0; k < steps; k++) {
        const sk = (k + 0.5) * ds;
        const a = (0.2 + 0.03 * Math.sin(t * 3 + sk * 0.3)) * ds;
        const T = norm3(add3(mul3(T0, Math.cos(a * k)), mul3(side, Math.sin(a * k))));
        const w = Math.min(1, sk / 4);
        h = norm3(add3(mul3(out, 1 - w), mul3(T, w)));
        p = add3(p, mul3(h, ds));
      }
      pts.push(p);
    }
  }
  return headIn ? pts : pts;
};
const PredEel: React.FC<{view: string; inside: number; headIn: boolean; gill: number; t: number}> = ({view, inside, headIn, gill, t}) => {
  resetIds('pe');
  const v = VIEWS[view] ?? VIEWS.S9;
  const B = basis(orbitCam(v.o));
  const pose: PredPose = {...PRED_REST, ...v.pose, gill, t, finPhase: t * 3.1};
  const g = predGeom(B, pose);
  const c = eelThrough(g, inside, headIn, t);
  // index of the exit along the body
  let ie = 0;
  c.forEach((p, i) => { if (Math.hypot(p[0] - g.exit.p[0], p[1] - g.exit.p[1], p[2] - g.exit.p[2]) < Math.hypot(c[ie][0] - g.exit.p[0], c[ie][1] - g.exit.p[1], c[ie][2] - g.exit.p[2])) ie = i; });
  const eel = {c, back: backFrom(c, [0, -1, 0.3])};
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <svg width={1080} height={1920}>
        <Water B={B} />
        <Predator B={B} pose={pose} />
        {headIn ? (
          <>
            {g.gap && <Eel3D B={B} pose={eel} t={t} from={0} to={ie} clip={g.gap} />}
            <Eel3D B={B} pose={eel} t={t} from={ie} />
          </>
        ) : (
          <>
            <Eel3D B={B} pose={eel} t={t} from={0} to={ie} />
            {g.gap && <Eel3D B={B} pose={eel} t={t} from={ie} clip={g.gap} />}
          </>
        )}
        <text x={30} y={1880} fontSize={40} fill="#fff" fontFamily="monospace">{`${v.label} + eel via predGeom (gap clip, exit)`}</text>
      </svg>
    </AbsoluteFill>
  );
};

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
      defaultProps={{sheet: 'brief', cols: 4} as {sheet: string; cols?: number; debug?: boolean; t?: number; vary?: boolean; ts?: number[]}}
      calculateMetadata={({props}) => {
        const n = props.ts ? props.ts.length : (SHEETS[props.sheet] ?? props.sheet.split(',')).length;
        const cols = props.cols ?? 4;
        return {width: 1080, height: Math.ceil(n / cols) * (1920 / cols)};
      }}
    />
    <Composition id="PredEel" component={PredEel} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{view: 'S9', inside: 2.2, headIn: true, gill: 0.8, t: 0}} />
    <Composition id="PredVsV3" component={PredVsV3} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{gill: 0}} />
  </>
);
registerRoot(Root);
void INK;
