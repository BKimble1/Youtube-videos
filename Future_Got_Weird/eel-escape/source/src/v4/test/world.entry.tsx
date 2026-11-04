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
import {escapeAt} from '../escape';
import {add3 as addV, mul3, norm3 as nrm3, sub3 as subV} from '../three';
import {clearSight, PredShadow, ReedWipe, reedWipePoly, WorldBack, WorldFront, hazeOf, reedWipeCore, __PARTS} from '../art/world3d';

// ---------------------------------------------------------------- cameras (the brief's list for package P, plus the track)
const TRACK0 = 21.3;
const eelHead = (t: number): V3 => {
  const tau = t - TRACK0;
  return [-30 - 1.5 * tau, 2 - 1.2 * tau, 22 + 21 * tau];
};
/** the test track: the eye trucks along +z at 20 u/s beside the eel's path, looking across it and back toward the
 *  predator, so the reeds between pass fast and the predator recedes */
const trackCam = (t: number): Cam3 => {
  const tau = t - TRACK0;
  const zc = 22 + 20 * tau;
  return {eye: [-84, -6, zc - 4], target: [-26, 2, zc - 30], f: 1250};
};
/** the integrator's S11 camera (shots/Exterior.tsx swimCam, copied here so this test does not depend on that file):
 *  ahead of the escaping eel (v4/escape.ts) and to its side, looking back at it and a little toward the predator */
const swimCam = (t: number): Cam3 => {
  const e = escapeAt(t);
  const mid = e.c[Math.round(N * 0.45)];
  const h = nrm3(subV(e.c[0], e.c[N]));
  const side = nrm3([h[2], 0, -h[0]]);
  const eye = addV(addV(mid, mul3(h, 34)), addV(mul3(side, 15), [0, -4, 0]));
  const fish: V3 = [-5, -3, 0];
  const target = addV(mid, mul3(subV(fish, mid), 0.07));
  return {eye, target, f: 1150, cy: 1060};
};
const CAMS: Record<string, (t: number) => Cam3> = {
  swim: swimCam,
  s1: () => orbitCam({target: [-27, -5, 4], az: 58, el: 12, d: 46, f: 1250}),
  s2: () => orbitCam({target: [-8, 0, 0], az: 0, el: 0, d: 150, f: 1250}),
  s8: () => orbitCam({target: [-18, -4, 4], az: 25, el: 50, d: 95, f: 1250}),
  s9: () => orbitCam({target: [-23.55, -6.35, 6.4], az: 22, el: 6, d: 17.5, f: 1250}),
  s10: () => orbitCam({target: [-18, 2, 6], az: 10, el: -12, d: 42, f: 1250}),
  s11: () => orbitCam({target: [0, 0, 0], az: -30, el: 4, d: 208, f: 1250}),
  track: trackCam,
};
/** variants: the same cameras with the sight line to the subject cleared of reeds (clearSight) */
const CLEAR: Record<string, V3[]> = {
  s10c: [[-18, 2, 6], [-40, 0, 4]],
  s2c: [[-30, 0, 0], [10, 0, 0], [35, 0, 0]],
  s8c: [[-18, -4, 4], [10, 0, 0]],
};
for (const k of Object.keys(CLEAR)) CAMS[k] = CAMS[k.slice(0, -1)];

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
  const isTrack = cam === 'track' || cam === 'swim';
  const pose = cam === 'track' ? eelPose(t) : cam === 'swim' ? escapeAt(t) : null;
  const zSplit = pose ? depth(B, pose.c[60]) : undefined;
  const filter = CLEAR[cam] ? clearSight(B, CLEAR[cam], 14) : undefined;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{display: 'block'}}>
      <WorldBack B={B} t={t} zSplit={zSplit} filter={filter} />
      {fish && <PredShadow B={B} pose={{bend: isTrack ? 0.25 : 0}} />}
      {fish && <FishPH B={B} dim={isTrack ? hazeOf(B, [0, 0, 0]) : 0} />}
      {pose && <Eel3D B={B} pose={pose} t={t} />}
      <WorldFront B={B} t={t} zSplit={zSplit} filter={filter} />
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
const PartsFrame: React.FC<{cam: string; t: number; parts: string[]; prefix: string}> = ({cam, t, parts, prefix}) => {
  resetIds(prefix);
  const B = basis(CAMS[cam](t));
  const zSplit = depth(B, [0, 0, 0]);
  const PP = __PARTS as Record<string, React.FC<any>>;
  return (
    <svg width={1080} height={1920}>
      {parts.map((p) => {
        if (p.startsWith('G')) {
          // gradient micro-benchmarks: G<n> = one full-frame rect with an n-stop vertical gradient; B<n> = n bands of 2 stops
          const n = parseInt(p.slice(1), 10);
          const id = `${prefix}gb`;
          const col = (u: number) => `rgb(${Math.round(80 + 100 * u)},${Math.round(140 + 60 * Math.sin(u * 5))},${Math.round(150 - 50 * u)})`;
          return (
            <g key={p}>
              <defs>
                <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={0} y1={0} x2={0} y2={1920}>
                  {Array.from({length: n}, (_, i) => <stop key={i} offset={i / (n - 1)} stopColor={col(i / (n - 1))} />)}
                </linearGradient>
              </defs>
              <rect x={0} y={0} width={1080} height={1920} fill={`url(#${id})`} />
            </g>
          );
        }
        if (p.startsWith('B')) {
          const n = parseInt(p.slice(1), 10);
          const col = (u: number) => `rgb(${Math.round(80 + 100 * u)},${Math.round(140 + 60 * Math.sin(u * 5))},${Math.round(150 - 50 * u)})`;
          return (
            <g key={p}>
              <defs>
                {Array.from({length: n}, (_, i) => (
                  <linearGradient key={i} id={`${prefix}bb${i}`} gradientUnits="userSpaceOnUse" x1={0} y1={(1920 * i) / n} x2={0} y2={(1920 * (i + 1)) / n}>
                    <stop offset={0} stopColor={col(i / n)} />
                    <stop offset={1} stopColor={col((i + 1) / n)} />
                  </linearGradient>
                ))}
              </defs>
              {Array.from({length: n}, (_, i) => <rect key={i} x={0} y={(1920 * i) / n} width={1080} height={1920 / n + 0.5} fill={`url(#${prefix}bb${i})`} />)}
            </g>
          );
        }
        if (p === 'Flat') return <rect key={p} x={0} y={0} width={1080} height={1920} fill="#558F89" />;
        if (p === 'Eel') return <Eel3D key={p} B={B} pose={eelPose(t)} t={t} />;
        if (p === 'Fish') return <FishPH key={p} B={B} />;
        if (p === 'WorldBack') return <WorldBack key={p} B={B} t={t} zSplit={zSplit} />;
        if (p === 'WorldFront') return <WorldFront key={p} B={B} t={t} zSplit={zSplit} />;
        const near = p.endsWith('Front');
        const Comp = PP[near ? p.slice(0, -5) : p];
        return <Comp key={p} B={B} t={t} zSplit={zSplit} near={near} />;
      })}
    </svg>
  );
};
const Bench: React.FC<{cam: string; t: number; k: number; parts?: string[]}> = ({cam, t, k, parts}) => (
  <AbsoluteFill style={{background: '#000'}}>
    {Array.from({length: k}, (_, i) => (
      <div key={i} style={{position: 'absolute', inset: 0}}>
        {parts ? <PartsFrame cam={cam} t={t + i * 0.001} parts={parts} prefix={`p${i}`} /> : <Tile it={{cam, t: t + i * 0.001}} i={i} />}
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

/** the predator's contact shadow alone (red, over white), with the placeholder fish outline, for checking its shape */
const ShadowDebug: React.FC<{cam: string; t: number}> = ({cam, t}) => {
  resetIds('sd');
  const B = basis(CAMS[cam](t));
  return (
    <AbsoluteFill style={{background: '#fff'}}>
      <svg width={1080} height={1920}>
        <g style={{filter: 'none'}}>
          <PredShadow B={B} pose={{bend: cam === 'track' ? 0.25 : 0}} opacity={4} />
        </g>
        <g opacity={0.35}>
          <FishPH B={B} />
        </g>
      </svg>
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
    <Composition id="ShadowDebug" component={ShadowDebug} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{cam: 'track', t: 21.3}} />
    <Composition id="WipeCheck" component={WipeCheck} durationInFrames={1} fps={30} width={1080} height={400} />
  </>
);
registerRoot(Root);
