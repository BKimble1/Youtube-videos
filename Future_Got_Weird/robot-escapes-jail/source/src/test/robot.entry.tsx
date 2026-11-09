// Test sheet for the hero robot + liquid metal (src/art/robot.tsx, src/art/liquid.tsx).
//   npx remotion still src/test/robot.entry.tsx RobotSheet out.png --props='{"t":0}'
//   npx remotion still src/test/robot.entry.tsx RobotFrame out.png --props='{"melt":0.5,"pose":"idle","view":0,"s":60}'
//   npx remotion still src/test/robot.entry.tsx RobotMelt out.png        (melt strip at s=30)
import React from 'react';
import {Composition, registerRoot, useCurrentFrame} from 'remotion';
import {C} from '../art/palette';
import {resetIds, uid} from '../core/ids';
import {mixPose, POSE_ANNOYED, POSE_IDLE, POSE_REACH, POSE_SMUG, POSE_SURPRISED, Robot, RobotPose, robotEyeScreen, robotHeadScreen} from '../art/robot';
import {Env, floorBlob, floorStream, LiquidMetal, MetalSurface, puddleOutline, RobotEyes, squeezeWidth, V} from '../art/liquid';
import {BAR_H, BAR_R, BAR_XS, Cam3, project} from '../world';

const POSES: Record<string, RobotPose> = {idle: POSE_IDLE, surprised: POSE_SURPRISED, annoyed: POSE_ANNOYED, smug: POSE_SMUG, reach: POSE_REACH};

const Bg: React.FC = () => {
  const id = uid('bgG');
  return (
    <>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.navy1} />
          <stop offset="1" stopColor={C.navy0} />
        </linearGradient>
      </defs>
      <rect width={1080} height={1920} fill={`url(#${id})`} />
    </>
  );
};

const Label: React.FC<{x: number; y: number; text: string}> = ({x, y, text}) => (
  <text x={x} y={y} fill={C.steelLit} fontSize={20} fontFamily="monospace" textAnchor="middle">
    {text}
  </text>
);

const ALARM: Env = {top: C.silverLit, bottom: C.navy2, tint: C.red, tintAmt: 0.55};

const Bars: React.FC<{xs: number[]; y0: number; y1: number; w: number}> = ({xs, y0, y1, w}) => (
  <>
    {xs.map((x, i) => (
      <g key={i}>
        <rect x={x - w / 2} y={y0} width={w} height={y1 - y0} fill={C.steel} stroke="#172B3A" strokeWidth={2.5} />
        <rect x={x - w / 2 + w * 0.18} y={y0} width={w * 0.18} height={y1 - y0} fill={C.steelLit} opacity={0.6} />
        <rect x={x + w * 0.12} y={y0} width={w * 0.26} height={y1 - y0} fill={C.steelDark} opacity={0.6} />
      </g>
    ))}
  </>
);

export const RobotSheet: React.FC<{t?: number}> = ({t: t0}) => {
  const frame = useCurrentFrame();
  const t = t0 ?? frame / 30;
  resetIds('x_');
  const s = 21;
  const cw = 270, ch = 330;
  const cell = (i: number, j: number) => ({x: cw * i + cw / 2, y: 60 + ch * j + 255});
  const row1: [string, RobotPose, number, number][] = [
    ['idle', POSE_IDLE, 0, 0],
    ['surprised', POSE_SURPRISED, 0, 0],
    ['annoyed', POSE_ANNOYED, 0, 0],
    ['smug', POSE_SMUG, 0, 0],
    ['reach', POSE_REACH, 0, 0],
    ['view .5', POSE_IDLE, 0, 0.5],
    ['view 1', POSE_IDLE, 0, 1],
    ['look L', {...POSE_IDLE, headTurn: -0.6, lookX: -0.8, headTilt: -6}, 0, 0],
  ];
  const melts = [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1];
  // stream through a gap (cell (0..1, 4))
  const sx0 = 0, sy0 = 60 + ch * 4;
  const stream: V[] = [];
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <Bg />
      {row1.map(([name, p, m, v], k) => {
        const c = cell(k % 4, Math.floor(k / 4));
        return (
          <g key={name}>
            <Robot x={c.x} y={c.y} s={s} t={t} pose={p} melt={m} view={v} />
            <Label x={c.x} y={c.y + 50} text={name} />
          </g>
        );
      })}
      {melts.map((m, k) => {
        const c = cell(k % 4, 2 + Math.floor(k / 4));
        return (
          <g key={'m' + k}>
            <Robot x={c.x} y={c.y} s={s} t={t} pose={m > 0.3 ? mixPose(POSE_ANNOYED, POSE_SURPRISED, 0.5) : POSE_ANNOYED} melt={m} heat={0.8} />
            <Label x={c.x} y={c.y + 50} text={`melt ${m}`} />
          </g>
        );
      })}
      {/* stream through the bar gap: robot half through (frame-0 style) */}
      <g>
        {(() => {
          const bx = 290, by = sy0 + 250;
          const pool = [
            puddleOutline(bx + 10, by + 20, 120, 22, t, 3),
            puddleOutline(bx + 150, by + 40, 70, 18, t, 5),
          ];
          void stream;
          void sx0;
          return (
            <>
              <Robot x={bx - 70} y={by} s={s} t={t} pose={{...POSE_IDLE, lookX: 0.0, mood: 0.6, lean: 6}} melt={0.3} pool={pool} env={ALARM} />
              <Bars xs={[bx - 5, bx + 75]} y0={by - 280} y1={by + 30} w={22} />
              <Label x={bx} y={by + 70} text="pool + bars (alarm env)" />
            </>
          );
        })()}
      </g>
      <g>
        {(() => {
          const c = {x: 810, y: sy0 + 220};
          const pts = [puddleOutline(c.x, c.y, 150, 46, t, 2)];
          return (
            <>
              <LiquidMetal pts={pts} t={t} ripple={0.4} eyes={{c: {x: c.x, y: c.y - 6}, s: 26, open: 1, lookX: 0.3, lookY: -0.2, mood: 0.7, glow: 1}} />
              <Label x={c.x} y={c.y + 100} text="LiquidMetal + eyes" />
            </>
          );
        })()}
      </g>
    </svg>
  );
};

export const RobotFrame: React.FC<{melt?: number; pose?: string; view?: number; s?: number; t?: number; heat?: number; alarm?: boolean; bars?: boolean; lab?: boolean}> = ({
  melt = 0,
  pose = 'idle',
  view = 0,
  s = 60,
  t = 0,
  heat = 0,
  alarm = false,
  bars = false,
  lab = false,
}) => {
  resetIds('x_');
  const p = POSES[pose] ?? POSE_IDLE;
  const x = 540, y = 1300;
  const hd = robotHeadScreen(x, y, s, p, melt, view);
  const ey = robotEyeScreen(x, y, s, p, melt, view);
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <Bg />
      {lab && <rect width={1080} height={1920} fill={C.labBg0} />}
      <rect x={0} y={y} width={1080} height={620} fill={lab ? C.bench : C.floor} opacity={lab ? 1 : 0.35} />
      <Robot x={x} y={y} s={s} t={t} pose={p} melt={melt} view={view} heat={heat} env={alarm ? ALARM : lab ? {top: '#FFFFFF', bottom: C.benchDark} : undefined} />
      {bars && <Bars xs={[x - 2.6 * s - 30, x + 2.6 * s + 30]} y0={200} y1={y + 40} w={1.24 * s} />}
      <circle cx={hd.cx} cy={hd.cy} r={hd.r} fill="none" stroke="#FF00FF" strokeWidth={1} opacity={0.5} strokeDasharray="6 6" />
      <circle cx={ey.l.x} cy={ey.l.y} r={3} fill="#FF00FF" opacity={0.6} />
      <circle cx={ey.r.x} cy={ey.r.y} r={3} fill="#FF00FF" opacity={0.6} />
      <Label x={540} y={1800} text={`melt ${melt} pose ${pose} view ${view} s ${s}`} />
    </svg>
  );
};

/** melt strip: 6 states side by side at s = 30 (two rows) */
export const RobotMelt: React.FC<{t?: number; s?: number; heat?: number}> = ({t = 0, s = 30, heat = 0.7}) => {
  resetIds('x_');
  const ms = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95, 1];
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <Bg />
      {ms.map((m, k) => {
        const x = 180 + (k % 3) * 360, y = 420 + Math.floor(k / 3) * 450;
        return (
          <g key={k}>
            <Robot x={x} y={y} s={s} t={t} pose={m < 0.2 ? POSE_ANNOYED : mixPose(POSE_ANNOYED, POSE_SURPRISED, 0.6)} melt={m} heat={heat} />
            <Label x={x} y={y + 60} text={`melt ${m}`} />
          </g>
        );
      })}
    </svg>
  );
};

/** S1-like test: floor stream through the bar gap in the jail camera, robot top half on the near side */
export const RobotStream: React.FC<{t?: number; melt?: number}> = ({t = 0, melt = 0.42}) => {
  resetIds('x_');
  const cam: Cam3 = {x: 0, h: 13, d: -26, yaw: 0, pitch: 18, f: 1700};
  const path = [{x: 0, d: 2.6}, {x: 0, d: 0}, {x: 0.4, d: -3.5}, {x: 1.2, d: -6.5}];
  const st = floorStream(cam, path, squeezeWidth(0.28, 2.7, 1.55, 0.09), t);
  const pud = floorBlob(cam, {x: 1.2, d: -7.0}, 3.6, 2.4, t, 4);
  const rb = project(cam, {x: 0, h: 0, d: 3.2});
  const bars = BAR_XS.filter((x) => Math.abs(x) < 12).map((x) => {
    const a = project(cam, {x: x - BAR_R, h: 0, d: 0}), b = project(cam, {x: x + BAR_R, h: 0, d: 0}), c = project(cam, {x, h: BAR_H, d: 0});
    return {x0: a.x, x1: b.x, y0: c.y, y1: a.y};
  });
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <Bg />
      <rect x={0} y={project(cam, {x: 0, h: 0, d: 24}).y} width={1080} height={1920} fill={C.floor} opacity={0.5} />
      <Robot x={rb.x} y={rb.y} s={rb.s} t={t} pose={{...POSE_IDLE, mood: 0.8, lookX: 0, lean: -4}} melt={melt} env={ALARM} pool={[st, pud]} />
      {bars.map((b, i) => (
        <g key={i}>
          <rect x={b.x0} y={b.y0} width={b.x1 - b.x0} height={b.y1 - b.y0} fill={C.steel} stroke="#172B3A" strokeWidth={3} />
          <rect x={b.x0 + (b.x1 - b.x0) * 0.2} y={b.y0} width={(b.x1 - b.x0) * 0.18} height={b.y1 - b.y0} fill={C.steelLit} opacity={0.6} />
        </g>
      ))}
      <MetalSurfaceThumb t={t} />
    </svg>
  );
};

const MetalSurfaceThumb: React.FC<{t: number}> = ({t}) => (
  <g transform="translate(40,1500) scale(0.2)">
    <MetalSurface t={t} />
  </g>
);

export const MetalFull: React.FC<{t?: number; tint?: number}> = ({t = 0, tint = 0}) => {
  resetIds('x_');
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <MetalSurface t={t} tint={tint} />
    </svg>
  );
};

export const EyesTest: React.FC = () => {
  resetIds('x_');
  const moods = [-1, -0.5, 0, 0.5, 1];
  const opens = [1, 1.35, 0.5, 0.1];
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <Bg />
      {opens.map((o, j) =>
        moods.map((m, i) => (
          <g key={i + '_' + j}>
            <circle cx={110 + i * 215} cy={250 + j * 420} r={150} fill={C.silver} />
            <RobotEyes c={{x: 110 + i * 215, y: 250 + j * 420}} s={70 * 0.85} open={o} lookX={j === 0 ? 0 : 0.6} lookY={j === 1 ? -0.5 : 0} mood={m} glow={1} />
            <Label x={110 + i * 215} y={250 + j * 420 + 170} text={`m${m} o${o}`} />
          </g>
        )),
      )}
    </svg>
  );
};

const Root: React.FC = () => (
  <>
    <Composition id="RobotSheet" component={RobotSheet} durationInFrames={90} fps={30} width={1080} height={1920} defaultProps={{}} />
    <Composition id="RobotFrame" component={RobotFrame} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{melt: 0, pose: 'idle', view: 0, s: 60}} />
    <Composition id="RobotMelt" component={RobotMelt} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{t: 0}} />
    <Composition id="RobotStream" component={RobotStream} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{t: 0}} />
    <Composition id="EyesTest" component={EyesTest} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{}} />
    <Composition id="MetalFull" component={MetalFull} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{t: 0}} />
  </>
);
registerRoot(Root);
