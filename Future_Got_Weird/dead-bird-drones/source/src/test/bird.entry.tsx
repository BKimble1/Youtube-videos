// BIRD test sheets: the preserved exterior through the film's cameras (placeholder drive in the cutaway).
import React from 'react';
import {AbsoluteFill, Composition, registerRoot} from 'remotion';
import {resetIds} from '../core/ids';
import {add3, basis, Basis, bodyFrame, Frame, Orbit, planeMatrix, proj, V3, xf, xfv} from '../three';
import {GEARS, HINGE, MOTOR, phiOfPhase, pose, Pose, wingPt} from '../rig';
import {C, INK} from '../art/palette';
import {Bird, BirdLook, NearWing, WINDOW, birdHull} from '../art/bird';

/** a simple placeholder for the drive (the real Mech is built in parallel) */
const MechStub: React.FC<{B: Basis; F: Frame; ps: Pose}> = ({B, F, ps}) => {
  const ex = xfv(F, [1, 0, 0]), ey = xfv(F, [0, 1, 0]);
  const gear = (id: keyof typeof GEARS, col: string) => {
    const G = GEARS[id];
    const o = xf(F, [G.c[0], G.c[1], G.z1]);
    const a = ps.gear[id];
    return (
      <g key={id} transform={planeMatrix(B, o, ex, ey)}>
        <circle r={G.r} fill={col} stroke={INK} strokeWidth={1.4} vectorEffect="non-scaling-stroke" />
        <circle r={G.r * 0.3} fill="#888" />
        <circle cx={Math.cos(a) * G.r * 0.7} cy={Math.sin(a) * G.r * 0.7} r={G.r * 0.12} fill={C.accent} />
      </g>
    );
  };
  const m = xf(F, [MOTOR.c[0], MOTOR.c[1], MOTOR.z1]);
  const P = (p: V3) => proj(B, xf(F, p));
  const pin = P(ps.pin);
  return (
    <g>
      <g transform={planeMatrix(B, xf(F, [2, 1, -2.15]), ex, ey)}>
        <rect x={-4.5} y={-4.5} width={9} height={9} rx={1.5} fill={C.plate} opacity={0.9} />
      </g>
      <g transform={planeMatrix(B, m, ex, ey)}><circle r={MOTOR.r} fill={C.motor} stroke={INK} strokeWidth={1.4} vectorEffect="non-scaling-stroke" /></g>
      {gear('A', '#C9A04A')}{gear('P0', '#9AA4AC')}{gear('B', C.brass)}{gear('P1', '#A8B0B6')}
      {(['far', 'near'] as const).map((k) => {
        const t = P(ps.rodTop[k]);
        return <line key={k} x1={pin.x} y1={pin.y} x2={t.x} y2={t.y} stroke={k === 'near' ? '#2E3640' : '#5A6470'} strokeWidth={0.32 * pin.s} strokeLinecap="round" />;
      })}
      {(['far', 'near'] as const).map((k) => {
        const W = ps.wing[k];
        const a = P(W.o), b = P(wingPt(W, 8, 0));
        return <line key={k} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={C.carbon} strokeWidth={0.44 * a.s} strokeLinecap="round" />;
      })}
      <circle cx={pin.x} cy={pin.y} r={0.25 * pin.s} fill={C.dark} />
    </g>
  );
};

type View = {name: string; cam: Orbit; u: number; look?: BirdLook; F?: Frame; bg?: string; wipe?: boolean; hull?: boolean};
const F0 = bodyFrame([0, 0, 0]);
const side = (u: number, scale = 20): View => ({name: `side u=${u}`, cam: {target: [-2.5, 2, 0], yaw: 14, pitch: 7, dist: 900, scale, cx: 470, cy: 1010}, u});
const VIEWS: View[] = [
  side(0), side(0.25), side(0.5), side(0.75),
  {name: 'cutaway + phantom', cam: {target: [2.6, 0.6, 0], yaw: 14, pitch: 7, dist: 900, scale: 23, cx: 500, cy: 1030}, u: 0.36, look: {cut: 1, phantom: 1}},
  {name: 'front-above', cam: {target: [0, 3, 0], yaw: 25, pitch: 20, dist: 900, scale: 17, cx: 520, cy: 1000}, u: 0.15},
  {name: 'exploded 16', cam: {target: [-2.5, 6.5, 0], yaw: 24, pitch: 14, dist: 420, scale: 12.6, cx: 520, cy: 1060}, u: 0.25, look: {shellLift: 16}},
  {name: 'wing root 60', cam: {target: [HINGE.near[0] + 0.5, HINGE.near[1] + 0.6, 5.4], yaw: 14, pitch: 7, dist: 900, scale: 60, cx: 540, cy: 1000}, u: 0.12},
  {name: 'wipe wing', cam: {target: wingPt(pose(phiOfPhase(0.25)).wing.near, 21, 5), yaw: 90, pitch: 89.5, dist: 3000, scale: 41, cx: 540, cy: 960, roll: -2}, u: 0.25, wipe: true},
  {name: 'cutaway reveal half', cam: {target: [2.6, 0.6, 0], yaw: 14, pitch: 7, dist: 900, scale: 23, cx: 500, cy: 1030}, u: 0.06, look: {cut: 1, phantom: 1, cutReveal: (B) => halfReveal(B)}},
  {name: 'tone 0.6 hull', cam: {target: [-2.5, 2, 0], yaw: 10, pitch: 4, dist: 1100, scale: 11, cx: 540, cy: 960}, u: 0.6, look: {tone: 0.6}, hull: true},
  {name: 'cut 0.5 low', cam: {target: [0, 1, 0], yaw: -12, pitch: 3, dist: 900, scale: 16, cx: 540, cy: 960}, u: 0.85, look: {cut: 0.5, phantom: 0.5}},
];
/** a test reveal: the upper half of the window (screen space, through the body frame) */
const halfReveal = (B: Basis) => {
  const pts = [[-8, 12], [12, 12], [12, -0.5], [-8, -2.5]].map(([x, y]) => proj(B, xf(F0, [x, y, 7.5])));
  return `M${pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L')} Z`;
};

const Cell: React.FC<{v: View; scaleK?: number; cx?: number; cy?: number}> = ({v, scaleK = 1, cx, cy}) => {
  const cam: Orbit = {...v.cam, scale: v.cam.scale * scaleK, cx: cx ?? v.cam.cx, cy: cy ?? v.cam.cy};
  const B = basis(cam);
  const ps = pose(phiOfPhase(v.u));
  const F = v.F ?? F0;
  if (v.wipe) return <NearWing B={B} F={F} ps={ps} />;
  return (
    <g>
      {v.hull && <path d={`M${birdHull(B, F, ps).map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L')} Z`} fill="rgba(255,255,255,0.25)" stroke="#5B7C8C" strokeDasharray="6 6" />}
      <Bird B={B} F={F} ps={ps} look={v.look} mech={<MechStub B={B} F={F} ps={ps} />} />
    </g>
  );
};

const BG = 'linear-gradient(#CFE6F2, #EAF3EE)';
/** one view at full frame */
const Full: React.FC<{v: number}> = ({v}) => {
  resetIds('f');
  return (
    <AbsoluteFill style={{background: BG}}>
      <svg width={1080} height={1920}>
        <Cell v={VIEWS[v]} />
        <text x={30} y={60} fontSize={30} fill="#30404A" fontFamily="sans-serif">{VIEWS[v].name}</text>
      </svg>
    </AbsoluteFill>
  );
};
/** 8 cells (2 x 4), whole-bird views at half scale */
const SHEET: [number, number][] = [[0, 0.42], [1, 0.42], [2, 0.42], [3, 0.42], [4, 0.5], [5, 0.5], [6, 0.8], [7, 0.5]];
const Sheet: React.FC = () => {
  resetIds('s');
  const w = 540, h = 480;
  return (
    <AbsoluteFill style={{background: '#9AA6AC'}}>
      <svg width={1080} height={1920}>
        <defs>
          <linearGradient id="sheetbg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#CFE6F2" />
            <stop offset="1" stopColor="#EAF3EE" />
          </linearGradient>
          {SHEET.map((_, i) => (
            <clipPath key={i} id={`sc${i}`}><rect width={w} height={h} /></clipPath>
          ))}
        </defs>
        {SHEET.map(([vi, k], i) => {
          const v = VIEWS[vi];
          const tx = (i % 2) * w, ty = Math.floor(i / 2) * h;
          return (
            <g key={i} transform={`translate(${tx},${ty})`}>
              <g clipPath={`url(#sc${i})`}>
                <rect width={w} height={h} fill="url(#sheetbg)" />
                <Cell v={v} scaleK={k} cx={w / 2 + (v.cam.cx! - 540) * k + (vi < 4 ? 30 : 0)} cy={h / 2 + (v.cam.cy! - 1000) * k * 0.6 + (vi === 6 ? 40 : vi < 4 ? 40 : 0)} />
              </g>
              <rect width={w} height={h} fill="none" stroke="#5A666C" strokeWidth={2} />
              <text x={12} y={26} fontSize={18} fill="#30404A" fontFamily="sans-serif">{v.name}</text>
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
void WINDOW;
void add3;

const Root: React.FC = () => (
  <>
    <Composition id="BirdSheet" component={Sheet} durationInFrames={1} fps={30} width={1080} height={1920} />
    <Composition id="BirdFull" component={Full} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{v: 0}} />
  </>
);
registerRoot(Root);
