// Test sheet for the jail set (src/art/jail.tsx).
//   npx remotion still src/test/jail.entry.tsx JailSheet /tmp/claude-0/jail/sheet.png --log=error
//   npx remotion still src/test/jail.entry.tsx JailFrame /tmp/claude-0/jail/a.png --props='{"cam":"A","t":0,"alarm":1,"heat":0,"door":0}' --log=error
import React from 'react';
import {AbsoluteFill, Composition, registerRoot} from 'remotion';
import {Cam3, project} from '../world';
import {resetIds} from '../core/ids';
import {AlarmBeacon, AlarmWash, Bars, JailBack, JailFront} from '../art/jail';

const CAMS: Record<string, Cam3> = {
  A: {x: -1.5, h: 7, d: -26, yaw: 0, pitch: 6, f: 1500},
  B: {x: 0, h: 9, d: -38, yaw: 0, pitch: 4, f: 1400},
  C: {x: 0, h: 1.6, d: -10, yaw: 0, pitch: 2, f: 1100},
  D: {x: 0, h: 34, d: -14, yaw: 0, pitch: 62, f: 1300},
  E: {x: 0, h: 30, d: 4, yaw: 0, pitch: 90, f: 1500},
  F: {x: 8, h: 9, d: -34, yaw: -8, pitch: 5, f: 1400},
  G: {x: 9, h: 24, d: -16, yaw: 12, pitch: -6, f: 1500},   // beacon close-up (extra)
  H: {x: 2, h: 3, d: -4, yaw: 0, pitch: 10, f: 1000},      // low, just in front of the gap (extra)
  I: {x: -24, h: 8, d: -30, yaw: 14, pitch: 4, f: 1300},   // from the left (extra)
  J: {x: -16, h: 9, d: -34, yaw: -6, pitch: 4, f: 1300},    // pillar as a foreground wipe (extra)
  K: {x: 16, h: 14, d: -42, yaw: 8, pitch: 7, f: 1300},     // guard desk + lamp (extra)
  L: {x: 0.3, h: 1.5, d: -1.2, yaw: 0, pitch: 8, f: 1000},   // S4: crossing the bar line, just outside (extra)
  M: {x: 0, h: 1.5, d: 0.9, yaw: 0, pitch: 8, f: 1000},      // S4: just inside (extra)
  N: {x: 0, h: 4, d: 10, yaw: 180, pitch: 6, f: 1100},       // reverse: from inside the cell looking out (extra)
};

/** grey 10-u placeholder robot at (0, 0, 3.5) as a billboard */
const Dummy: React.FC<{c: Cam3}> = ({c}) => {
  const b = project(c, {x: 0, h: 0, d: 3.5});
  const tp = project(c, {x: 0, h: 10, d: 3.5});
  if (b.z < 0.5) return null;
  const w = 4 * b.s;
  return (
    <g>
      <rect x={b.x - w / 2} y={Math.min(tp.y, b.y)} width={w} height={Math.max(4, Math.abs(b.y - tp.y))} rx={w * 0.3} fill="#B8C2CE" stroke="#172B3A" strokeWidth={2.8} />
      <circle cx={tp.x - w * 0.15} cy={tp.y + w * 0.4} r={w * 0.08} fill="#46E6FF" />
      <circle cx={tp.x + w * 0.15} cy={tp.y + w * 0.4} r={w * 0.08} fill="#46E6FF" />
    </g>
  );
};

type FP = {cam: string; t: number; alarm: number; heat: number; door: number; shake?: number; robot?: boolean};
const Scene: React.FC<FP & {tag: string}> = ({cam, t, alarm, heat, door, shake = 0, robot = true, tag}) => {
  resetIds(`${tag}_`);
  const c = CAMS[cam] ?? CAMS.A;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', left: 0, top: 0}}>
      <JailBack c={c} t={t} alarm={alarm} heat={heat} door={door} />
      {robot && <Dummy c={c} />}
      <Bars c={c} t={t} door={door} alarm={alarm} shake={shake} />
      <AlarmBeacon c={c} t={t} alarm={alarm} />
      <JailFront c={c} t={t} alarm={alarm} />
      <AlarmWash c={c} t={t} alarm={alarm} />
    </svg>
  );
};

export const JailFrame: React.FC<FP> = (p) => (
  <AbsoluteFill style={{background: '#0B1526', overflow: 'hidden'}}>
    <Scene {...p} tag="jf" />
  </AbsoluteFill>
);

const CELLS: (FP & {label: string})[] = [
  {label: 'A hook', cam: 'A', t: 0, alarm: 1, heat: 0, door: 0},
  {label: 'B door 0', cam: 'B', t: 0, alarm: 0, heat: 0, door: 0},
  {label: 'B door 1', cam: 'B', t: 0, alarm: 0, heat: 0, door: 1},
  {label: 'C low heat', cam: 'C', t: 0.4, alarm: 0, heat: 1, door: 0},
  {label: 'D high', cam: 'D', t: 0, alarm: 0, heat: 0, door: 0},
  {label: 'E topdown', cam: 'E', t: 0, alarm: 0, heat: 0, door: 0},
  {label: 'F guard', cam: 'F', t: 0.5, alarm: 1, heat: 0, door: 0},
  {label: 'A t=.12 peak', cam: 'A', t: 0.12, alarm: 1, heat: 0, door: 0},
  {label: 'B half door', cam: 'B', t: 0.3, alarm: 0.6, heat: 0.5, door: 0.45},
];

const CELLS2: (FP & {label: string})[] = [
  {label: 'G beacon', cam: 'G', t: 0.12, alarm: 1, heat: 0, door: 0},
  {label: 'L cross out', cam: 'L', t: 0.6, alarm: 0, heat: 0.4, door: 0, robot: false},
  {label: 'M cross in', cam: 'M', t: 0, alarm: 0, heat: 0.4, door: 0, robot: false},
  {label: 'H gap low', cam: 'H', t: 0.2, alarm: 0.5, heat: 0.3, door: 0, robot: false},
  {label: 'J pillar', cam: 'J', t: 0.3, alarm: 0, heat: 0, door: 0},
  {label: 'K desk alarm', cam: 'K', t: 0.62, alarm: 1, heat: 0, door: 0},
  {label: 'N reverse', cam: 'N', t: 0.7, alarm: 0, heat: 0, door: 0, robot: false},
  {label: 'D door1 alarm', cam: 'D', t: 0.12, alarm: 1, heat: 0, door: 1},
  {label: 'E heat', cam: 'E', t: 0.5, alarm: 0, heat: 1, door: 0, robot: false},
];

export const JailSheet: React.FC<{cols: number; set?: number}> = ({cols, set = 1}) => {
  const k = 1 / cols;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {(set === 2 ? CELLS2 : CELLS).map((p, i) => (
        <div key={i} style={{position: 'absolute', left: (i % cols) * 1080 * k, top: Math.floor(i / cols) * 1920 * k, width: 1080, height: 1920, transform: `scale(${k})`, transformOrigin: '0 0', overflow: 'hidden', background: '#0B1526'}}>
          <Scene {...p} tag={`c${i}`} />
          <div style={{position: 'absolute', left: 14, top: 10, color: '#FFD84A', font: '700 54px monospace', textShadow: '0 0 6px #000'}}>{p.label}</div>
        </div>
      ))}
    </AbsoluteFill>
  );
};

const Root: React.FC = () => (
  <>
    <Composition id="JailSheet" component={JailSheet} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{cols: 3, set: 1}} />
    <Composition id="JailSheet2" component={JailSheet} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{cols: 3, set: 2}} />
    <Composition id="JailFrame" component={JailFrame} durationInFrames={60} fps={30} width={1080} height={1920}
      defaultProps={{cam: 'A', t: 0, alarm: 1, heat: 0, door: 0, shake: 0, robot: true} as FP} />
  </>
);
registerRoot(Root);
