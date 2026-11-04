// Test entry for package W (v4/art/world3d.tsx): the environment through the cameras of the exterior shots, with a
// placeholder ellipsoid predator (and a placeholder V4 eel in the tracking shot), the tracking sequence and the loop's
// reed wipe.
//   npx remotion still src/v4/test/world.entry.tsx WorldCam out.png --props='{"cam":"s1","t":0}'
//   npx remotion still src/v4/test/world.entry.tsx WorldSheet out.png --props='{"items":[{"cam":"s1","t":0},{"cam":"s2","t":0}],"cols":3}'
//   npx remotion still src/v4/test/world.entry.tsx Bench out.png --props='{"cam":"s8","t":0,"k":6}'
import React from 'react';
import {AbsoluteFill, Composition, registerRoot} from 'remotion';
import {resetIds} from '../../core/ids';
import {C, INK, INK_PX, NS} from '../../art/palette';
import {lit, mix, shade} from '../../core/color';
import {add3, basis, Basis, Cam3, dot3, hull, norm3, orbitCam, proj, smoothClosed, sub3, V3, depth} from '../three';
import {Eel3D, Eel3Pose, backFrom, N, EEL_L} from '../eelV4';
import {PredShadow, ReedWipe, reedWipePoly, WorldBack, WorldFront, hazeOf, reedWipeCore} from '../art/world3d';

// ---------------------------------------------------------------- cameras (the brief's list for package P, plus the track)
const TRACK0 = 21.3;
const eelHead = (t: number): V3 => {
  const tau = t - TRACK0;
  return [-32 - 2 * tau, 2 - 1.2 * tau, 14 + 21 * tau];
};
const trackCam = (t: number): Cam3 => {
  const tau = t - TRACK0;
  const zc = 14 + 20 * tau;
  return {eye: [-88, -7, zc + 18], target: [-30, 1, zc - 22], f: 1250};
};
const CAMS: Record<string, (t: number) => Cam3> = {
  s1: () => orbitCam({target: [-27, -5, 4], az: 58, el: 12, d: 46, f: 1250}),
  s2: () => orbitCam({target: [-8, 0, 0], az: 0, el: 0, d: 150, f: 1250}),
  s8: () => orbitCam({target: [-18, -4, 4], az: 25, el: 50, d: 95, f: 1250}),
  s9: () => orbitCam({target: [-23.55, -6.35, 6.4], az: 22, el: 6, d: 17.5, f: 1250}),
  s10: () => orbitCam({target: [-18, 2, 6], az: 10, el: -12, d: 42, f: 1250}),
  s11: () => orbitCam({target: [0, 0, 0], az: -30, el: 4, d: 208, f: 1250}),
  track: trackCam,
};

// ---------------------------------------------------------------- the placeholder predator (a tapered ellipsoid)
const FishPH: React.FC<{B: Basis; dim?: number}> = ({B, dim = 0}) => {
  const Lw = norm3(add3(add3([B.r[0] * -0.55, B.r[1] * -0.55, B.r[2] * -0.55], [B.u[0] * 0.66, B.u[1] * 0.66, B.u[2] * 0.66]), [B.fw[0] * -0.5, B.fw[1] * -0.5, B.fw[2] * -0.5]));
  const all: {x: number; y: number}[] = [], mid: typeof all = [], hi: typeof all = [];
  for (let i = 0; i <= 28; i++) {
    const x = -50 + (100 * i) / 28;
    const u = (x + 50) / 100;
    const k = Math.sqrt(Math.max(0, 1 - ((x - 2) / 52) ** 2)) * (1 - 0.45 * Math.max(0, u - 0.4));
    for (let j = 0; j < 18; j++) {
      const a = (j / 18) * Math.PI * 2;
      const ry = 12.65 * k, rz = 7.4 * k * (u < 0.3 ? 1.05 : 1);
      const p: V3 = [x, -0.25 + Math.sin(a) * ry, Math.cos(a) * rz];
      if (p[1] > 12.4) p[1] = 12.4;
      const n = norm3([((x - 2) / 52 ** 2) * 1, Math.sin(a) / Math.max(1, ry), Math.cos(a) / Math.max(1, rz)]);
      if (depth(B, p) < 1) continue;
      const q = proj(B, p);
      all.push(q);
      if (dot3(n, sub3(B.eye, p)) < 0) continue;
      const l = dot3(n, Lw);
      if (l > -0.1) mid.push(q);
      if (l > 0.5) hi.push(q);
    }
  }
  const fishC = (c: string) => mix(c, C.waterDeep, dim * 0.7);
  const eyes: React.ReactNode[] = [];
  for (const s of [1, -1]) {
    const e: V3 = [-38, -4.2, 4.6 * s];
    if (dot3([0, 0, s], sub3(B.eye, e)) > 0) {
      const q = proj(B, e);
      eyes.push(<circle key={s} cx={q.x} cy={q.y} r={1.6 * q.s} fill={C.eyeIris} stroke={INK} strokeWidth={1.8} vectorEffect={NS} />);
      eyes.push(<circle key={`p${s}`} cx={q.x - 0.2 * q.s} cy={q.y} r={0.85 * q.s} fill={C.pupil} />);
    }
  }
  return (
    <g>
      <path d={smoothClosed(hull(all))} fill={fishC(shade(C.fishBody, 0.35))} stroke={INK} strokeWidth={INK_PX} vectorEffect={NS} strokeLinejoin="round" />
      {mid.length > 2 && <path d={smoothClosed(hull(mid))} fill={fishC(C.fishBody)} />}
      {hi.length > 2 && <path d={smoothClosed(hull(hi))} fill={fishC(lit(C.fishBody, 0.18))} />}
      {eyes}
    </g>
  );
};

// ---------------------------------------------------------------- the placeholder eel (tracking shot): swims +z
const eelPose = (t: number): Eel3Pose => {
  const H = eelHead(t);
  const tau = t - TRACK0;
  const c: V3[] = Array.from({length: N + 1}, (_, i) => {
    const u = i / N;
    const s = u * EEL_L;
    const A = 0.6 + 4.2 * u;
    return [H[0] + A * Math.sin(2 * Math.PI * (1.7 * tau - s / 30)) + 2 * u, H[1] + 0.8 * u, H[2] - s];
  });
  return {c, back: backFrom(c)};
};

// ---------------------------------------------------------------- one frame
const Frame: React.FC<{cam: string; t: number; fish?: boolean; prefix: string}> = ({cam, t, fish = true, prefix}) => {
  resetIds(prefix);
  const B = basis(CAMS[cam](t));
  const isTrack = cam === 'track';
  const pose = isTrack ? eelPose(t) : null;
  const zSplit = pose ? depth(B, pose.c[60]) : undefined;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{display: 'block'}}>
      <WorldBack B={B} t={t} zSplit={zSplit} />
      {fish && <PredShadow B={B} pose={{bend: isTrack ? 0.25 : 0}} />}
      {fish && <FishPH B={B} dim={isTrack ? hazeOf(B, [0, 0, 0]) : 0} />}
      {pose && <Eel3D B={B} pose={pose} t={t} />}
      <WorldFront B={B} t={t} zSplit={zSplit} />
    </svg>
  );
};
/** the loop: the tracking frame at t, frame 0 (S1) revealed behind the passing blade, the blade on top */
const WIPE0 = 24.32, WIPE1 = 24.72;
const WipeFrame: React.FC<{t: number; prefix: string; debug?: boolean}> = ({t, prefix, debug}) => {
  const poly = reedWipePoly(t, WIPE0, WIPE1);
  const d = poly.length ? `M${poly.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join('L')}Z` : '';
  resetIds(prefix + 'w');
  return (
    <div style={{position: 'relative', width: 1080, height: 1920}}>
      <div style={{position: 'absolute', inset: 0}}>
        <Frame cam="track" t={t} prefix={prefix + 'a'} />
      </div>
      {d && (
        <div style={{position: 'absolute', inset: 0, clipPath: `path('${d}')`}}>
          <Frame cam="s1" t={0} prefix={prefix + 'b'} />
        </div>
      )}
      <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
        <ReedWipe t={t} t0={WIPE0} t1={WIPE1} />
        {debug && d && <path d={d} fill="none" stroke="#FF0" strokeWidth={4} strokeDasharray="12 10" />}
      </svg>
    </div>
  );
};

type Item = {cam: string; t: number; label?: string; debug?: boolean};
const Tile: React.FC<{it: Item; i: number}> = ({it, i}) =>
  it.cam === 'wipe' ? <WipeFrame t={it.t} prefix={`t${i}`} debug={it.debug} /> : <Frame cam={it.cam} t={it.t} prefix={`t${i}`} />;

const WorldCam: React.FC<{cam: string; t: number}> = ({cam, t}) => (
  <AbsoluteFill style={{background: C.waterMid}}>
    <Tile it={{cam, t}} i={0} />
  </AbsoluteFill>
);
const WorldSheet: React.FC<{items: Item[]; cols: number}> = ({items, cols}) => {
  const k = 1 / cols;
  return (
    <AbsoluteFill style={{background: '#111'}}>
      {items.map((it, i) => (
        <div key={i} style={{position: 'absolute', left: (i % cols) * 1080 * k, top: Math.floor(i / cols) * 1920 * k, width: 1080, height: 1920, transform: `scale(${k})`, transformOrigin: '0 0', overflow: 'hidden'}}>
          <Tile it={it} i={i} />
          <div style={{position: 'absolute', left: 24, top: 1820, fontSize: 64, color: '#FF0', fontFamily: 'monospace', textShadow: '0 0 8px #000'}}>{it.label ?? `${it.cam} ${it.t.toFixed(2)}`}</div>
        </div>
      ))}
    </AbsoluteFill>
  );
};
/** k copies of one frame stacked (for timing: render k = 1 and k = 6, the difference / 5 is one frame's cost) */
const Bench: React.FC<{cam: string; t: number; k: number}> = ({cam, t, k}) => (
  <AbsoluteFill style={{background: '#000'}}>
    {Array.from({length: k}, (_, i) => (
      <div key={i} style={{position: 'absolute', inset: 0}}>
        <Tile it={{cam, t: t + i * 0.001}} i={i} />
      </div>
    ))}
  </AbsoluteFill>
);
/** a numeric check of the wipe: the seam always inside the blade's opaque core (rendered as text) */
const WipeCheck: React.FC = () => {
  const rows: string[] = [];
  let minL = 1e9, minR = 1e9;
  for (let t = WIPE0 + 0.005; t < WIPE1; t += 0.01) {
    for (let y = -60; y <= 1980; y += 20) {
      const c = reedWipeCore(t, WIPE0, WIPE1, y);
      minL = Math.min(minL, c.seam - c.left);
      minR = Math.min(minR, c.right - c.seam);
    }
  }
  rows.push(`seam inside core: min margin to core left ${minL.toFixed(1)} px, to core right ${minR.toFixed(1)} px`);
  return (
    <AbsoluteFill style={{background: '#fff', fontSize: 30, fontFamily: 'monospace', padding: 40}}>
      {rows.map((r, i) => (
        <div key={i}>{r}</div>
      ))}
    </AbsoluteFill>
  );
};

const sheetMeta = ({props}: {props: {items: Item[]; cols: number}}) => ({
  width: 1080,
  height: Math.ceil(props.items.length / props.cols) * Math.round(1920 / props.cols),
});
const Root: React.FC = () => (
  <>
    <Composition id="WorldCam" component={WorldCam} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{cam: 's1', t: 0}} />
    <Composition
      id="WorldSheet"
      component={WorldSheet}
      durationInFrames={1}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{items: [{cam: 's1', t: 0}] as Item[], cols: 3}}
      calculateMetadata={sheetMeta}
    />
    <Composition id="Bench" component={Bench} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{cam: 's1', t: 0, k: 1}} />
    <Composition id="WipeCheck" component={WipeCheck} durationInFrames={1} fps={30} width={1080} height={400} />
  </>
);
registerRoot(Root);
