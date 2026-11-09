// Test entry for S5 (src/shots/S5Lab.tsx), running the real film times.
//   cd source
//   npx remotion still src/test/s5.entry.tsx S5At /tmp/claude-0/s5/a.png --props='{"t":13.5667}' --log=error
//   npx remotion still src/test/s5.entry.tsx S5Sheet /tmp/claude-0/s5/sheet.png --props='{"t0":13.5667,"dt":0.2,"n":18,"cols":6}' --log=error
//   npx remotion render src/test/s5.entry.tsx S5 /tmp/claude-0/s5/s5.mp4 --log=error
//   S4to5 / S5to6Edge: the boundary frames with the neighbours (S4 from S2to4.tsx)
import React from 'react';
import {AbsoluteFill, Composition, registerRoot, useCurrentFrame} from 'remotion';
import {SHOTS} from '../story';
import {resetIds} from '../core/ids';
import {S5} from '../shots/S5Lab';
import {S4} from '../shots/S2to4';
import {Captions} from '../Captions';
import '../fonts';
import {GloveArm, Pipette, PIPETTE_GRIP, pinchWrist} from '../art/lab';
import {HandPose} from '../dc/Hand';

const FPS = 30;

const One: React.FC<{t: number; tag: string; caps?: boolean}> = ({t, tag, caps}) => {
  resetIds(`${tag}_`);
  const V = t < SHOTS.S5[0] ? S4 : S5;
  return (
    <AbsoluteFill style={{background: '#0B1526', overflow: 'hidden'}}>
      <V t={t} />
      {caps && <Captions t={t} y={() => 330} />}
    </AbsoluteFill>
  );
};

/** film frames: frame n of the composition shows film frame (first + n), t = film frame / 30 */
const Shot: React.FC<{first: number; caps?: boolean}> = ({first, caps}) => {
  const f = useCurrentFrame();
  const t = (first + f) / FPS;
  return <One t={t} tag={`f${f}`} caps={caps} />;
};

export const S5Sheet: React.FC<{t0?: number; dt?: number; n?: number; cols?: number; ts?: number[]; caps?: boolean}> = ({t0 = 13.5667, dt = 0.2, n = 18, cols = 6, ts, caps}) => {
  const k = 1 / cols;
  const times = ts ?? Array.from({length: n}, (_, i) => t0 + i * dt);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {times.map((t, i) => (
        <div key={i} style={{position: 'absolute', left: (i % cols) * 1080 * k, top: Math.floor(i / cols) * 1920 * k, width: 1080, height: 1920, transform: `scale(${k})`, transformOrigin: '0 0', overflow: 'hidden'}}>
          <One t={t} tag={`c${i}`} caps={caps} />
          <div style={{position: 'absolute', left: 14, top: 10, color: '#FFD84A', font: '700 64px monospace', textShadow: '0 0 6px #000'}}>{t.toFixed(3)}</div>
        </div>
      ))}
    </AbsoluteFill>
  );
};

export const S5At: React.FC<{t: number; caps?: boolean}> = ({t, caps}) => <One t={t} tag="at" caps={caps} />;

/** hand grip tuning: pipette pinch at several squeeze values + a tab pinch */
export const HandLab: React.FC<{pose?: number[]; da?: number}> = ({pose, da = 28}) => {
  resetIds('hl_');
  const items = [0, 1, 0, 1, 0, 1, 0, 1].map((sq, i) => {
    const das = [70, 70, 100, 100, -70, -70, -100, -100];
    da = das[i];
    const tip = {x: 140 + (i % 2) * 480, y: 650 + Math.floor(i / 2) * 420};
    const ang = -50;
    const sc = 0.9;
    const dir = {x: Math.cos((ang * Math.PI) / 180), y: Math.sin((ang * Math.PI) / 180)};
    const bulb = {x: tip.x + dir.x * PIPETTE_GRIP * sc, y: tip.y + dir.y * PIPETTE_GRIP * sc};
    const L = 300 * sc;
    const ts: 1 | -1 = da > 0 ? 1 : -1;
    const p: HandPose = pose ? {curl: [pose[0] + pose[5] * sq, pose[1], pose[2], pose[3]], spread: 0.2, thumb: pose[4] - 8 * sq, thumbCurl: 0.35 + 0.15 * sq} : {curl: [0.42 + 0.12 * sq, 0.62, 0.72, 0.8], spread: 0.2, thumb: 30 - 8 * sq, thumbCurl: 0.35 + 0.15 * sq};
    const ha = ang + 180 + da;
    const w = pinchWrist(bulb, ha, L, ts, p);
    return (
      <g key={i}>
        <Pipette tip={tip} ang={ang} sc={sc} fill={0.5} squeeze={sq} t={0} part="tube" />
        <GloveArm wrist={w} ang={ha} L={L} pose={p} thumbSide={ts} hold={{front: [0, 't'], obj: <Pipette tip={tip} ang={ang} sc={sc} fill={0.5} squeeze={sq} t={0} part="bulb" />}} />
        <circle cx={bulb.x} cy={bulb.y} r={4} fill="red" />
      </g>
    );
  });
  return (
    <AbsoluteFill style={{background: '#C9D6E2'}}>
      <svg width={1080} height={1920}>{items}</svg>
    </AbsoluteFill>
  );
};

const F0 = Math.ceil(SHOTS.S5[0] * FPS - 1e-9); // first film frame of S5 (407)
const F1 = Math.ceil(SHOTS.S5[1] * FPS - 1e-9); // first film frame of S6 (511)
const Root: React.FC = () => (
  <>
    <Composition id="S5" component={Shot} durationInFrames={F1 - F0} fps={FPS} width={1080} height={1920} defaultProps={{first: F0, caps: false}} />
    <Composition id="S5Caps" component={Shot} durationInFrames={F1 - F0} fps={FPS} width={1080} height={1920} defaultProps={{first: F0, caps: true}} />
    <Composition id="S4to5" component={Shot} durationInFrames={24} fps={FPS} width={1080} height={1920} defaultProps={{first: F0 - 12, caps: false}} />
    <Composition id="S5Sheet" component={S5Sheet} durationInFrames={1} fps={FPS} width={1080} height={1920} defaultProps={{t0: 13.5667, dt: 0.2, n: 18, cols: 6}} />
    <Composition id="HandLab" component={HandLab} durationInFrames={1} fps={FPS} width={1080} height={1920} defaultProps={{da: 28}} />
    <Composition id="S5At" component={S5At} durationInFrames={1} fps={FPS} width={1080} height={1920} defaultProps={{t: 13.5667}} />
  </>
);
registerRoot(Root);
