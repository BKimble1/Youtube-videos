// FGW "A Hidden Trigger Made This Robot Target a Fake Hand" V2 review timeline (1080x1920, 30 fps, 25.6 s loop).
// Same narration, captions and runtime as V1; the picture is re-cut into ~18 compositions across four settings
// (bench side view, bench high angle, workstation, diagram). Every shot is a pure function of render time.
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {C, F, FPS, DURATION_S, APPLE, HANDPROP} from '../theme';
import {Cam, lerpCam, mj, solve} from '../rig/kin';
import {CaptionTrack} from '../components/CaptionTrack';
import {S, V, compareState} from './theme2';
import {armPose2, OPEN2_U0} from './kin2';
import {SideDefs, SideWorld, MONITOR_CAM} from './SideWorld';
import {OverheadWorld, OCam, oTransform} from './Overhead';
import {DiagramDefs, DiagramWorld, DCam, dTransform, diagState, lerpD, AMBER_C, L, ICON_SCALE} from './Diagram';
import {Marker2} from './Diagram';
import '@fontsource-variable/nunito';
import '@fontsource-variable/fredoka';
import '@fontsource/jetbrains-mono/700.css';

const ramp = (t: number, a: number, b: number) => mj((t - a) / (b - a));
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const easeIn = (t: number, a: number, b: number) => clamp01((t - a) / (b - a)) ** 3;
const easeOut = (t: number, a: number, b: number) => 1 - (1 - clamp01((t - a) / (b - a))) ** 3;
const camT = (c: Cam) => `translate(540 ${c.ay}) scale(${c.z}) translate(${-c.cx} ${-c.cy})`;
const toScreen = (c: Cam, p: {x: number; y: number}) => ({x: (p.x - c.cx) * c.z + 540, y: (p.y - c.cy) * c.z + c.ay});
const lerpO = (a: OCam, b: OCam, s: number): OCam => ({cx: a.cx + (b.cx - a.cx) * s, cd: a.cd + (b.cd - a.cd) * s, z: a.z + (b.z - a.z) * s, ay: a.ay + (b.ay - a.ay) * s});

// ---- cameras ----
const SC = {
  openA: {cx: 568, cy: 1110, z: 1.66, ay: 900},
  openB: {cx: 580, cy: 1112, z: 1.74, ay: 900},
  wide2: {cx: 640, cy: 1010, z: 1.0, ay: 860},
  here: {cx: 722, cy: 1128, z: 1.9, ay: 900},
  knifeA: {cx: 636, cy: 1102, z: 4.2, ay: 860},
  knifeB: {cx: 748, cy: 1100, z: 4.4, ay: 860},
  wristA: {cx: 790, cy: 1050, z: 2.5, ay: 880},
  robot: {cx: 690, cy: 1060, z: 0.95, ay: 860},
  robotEnd: {cx: 700, cy: 1056, z: 0.98, ay: 860},
  desk: {cx: 2060, cy: 880, z: 0.95, ay: 860},
  deskPush: {cx: 2056, cy: 765, z: 1.5, ay: 900},
  mimeA: {cx: 455, cy: 1085, z: 1.75, ay: 880},
  mimeB: {cx: 446, cy: 1088, z: 1.86, ay: 880},
  compare: {cx: 640, cy: 1010, z: 1.1, ay: 820},
};
const OC = {
  handA: {cx: 672, cd: -40, z: 2.25, ay: 860},
  handB: {cx: 718, cd: -46, z: 2.4, ay: 860},
  withoutA: {cx: 565, cd: -95, z: 1.3, ay: 860},
  withoutB: {cx: 505, cd: -85, z: 1.4, ay: 860},
  benchWide: {cx: 545, cd: -80, z: 1.22, ay: 860},
};
const DC = {
  monitor: {cx: 540, cy: 790, z: 1.08, ay: 860},
  module: {cx: 622, cy: 790, z: 1.25, ay: 860},
  relation: {cx: 540, cy: 990, z: 0.8, ay: 860},
  strip: {cx: 540, cy: 325, z: 1.15, ay: 500},
  stripDown: {cx: 600, cy: 520, z: 1.08, ay: 560},
  targetA: {cx: 540, cy: 1400, z: 1.48, ay: 840},
  target: {cx: 540, cy: 1430, z: 1.58, ay: 840},
  stepsA: {cx: 540, cy: 1960, z: 1.0, ay: 760},
  steps: {cx: 540, cy: 2118, z: 1.12, ay: 800},
  ctrl: {cx: 540, cy: 2780, z: 1.15, ay: 800},
  amber: {cx: AMBER_C.x, cy: 760, z: 2.0, ay: 820},
  reqPlanner: {cx: 540, cy: 640, z: 1.05, ay: 760},
  plannerTarget: {cx: 540, cy: 1100, z: 0.95, ay: 840},
  final: {cx: 540, cy: L.icon.y + 40, z: 1.9, ay: 860},
};
// S11b starts on the bench with the model hand exactly where the target card's hand icon was (match cut).
const handIconScreen = {x: (540 - DC.target.cx) * DC.target.z + 540, y: (L.icon.y + 40 - DC.target.cy) * DC.target.z + DC.target.ay};
const OC_MATCH: OCam = {cx: HANDPROP.x - (handIconScreen.x - 540) / (ICON_SCALE.hand * DC.target.z), cd: -(handIconScreen.y - 860) / (ICON_SCALE.hand * DC.target.z), z: ICON_SCALE.hand * DC.target.z, ay: 860};

export const openCam2 = (u: number): Cam => lerpCam(SC.openA, SC.openB, (u - OPEN2_U0) / (S.pull - OPEN2_U0)); // slow constant push across the loop

type Shot =
  | {kind: 'side'; cam: Cam; ws?: boolean; screenCam?: DCam}
  | {kind: 'over'; cam: OCam}
  | {kind: 'diag'; cam: DCam};

export const shotAt = (t: number): Shot => {
  if (t >= S.loop) return {kind: 'side', cam: openCam2(t - DURATION_S)};
  if (t < S.pull) return {kind: 'side', cam: openCam2(t)};
  if (t < S.knife) {
    const out = lerpCam(openCam2(S.pull), SC.wide2, ramp(t, S.pull, S.pull + 0.37));
    return {kind: 'side', cam: lerpCam(out, SC.here, ramp(t, V.here - 0.03, V.here + 0.27))};
  }
  if (t < S.hand) return {kind: 'side', cam: lerpCam(SC.knifeA, SC.knifeB, ramp(t, S.knife, S.hand - 0.05))};
  if (t < S.robot) return {kind: 'over', cam: lerpO(OC.handA, OC.handB, ramp(t, S.hand, S.robot))};
  if (t < S.whip) {
    const c = lerpCam(SC.wristA, SC.robot, ramp(t, S.robot + 0.06, S.robot + 0.7));
    return {kind: 'side', cam: lerpCam(c, SC.robotEnd, clamp01((t - S.robot - 0.7) / 0.6))};
  }
  if (t < S.module) {
    let c = lerpCam(SC.robotEnd, SC.desk, ramp(t, S.whip, S.whip + 0.27)); // whip pan: 8 frames
    c = lerpCam(c, SC.deskPush, ramp(t, 5.35, 6.12));
    c = lerpCam(c, MONITOR_CAM, easeIn(t, 6.12, S.module - 1 / FPS)); // last frame = the diagram's first frame
    return {kind: 'side', cam: c, ws: true, screenCam: DC.monitor};
  }
  if (t < S.relation) return {kind: 'diag', cam: lerpD(DC.monitor, DC.module, easeOut(t, S.module, 7.5))};
  if (t < S.without) return {kind: 'diag', cam: lerpD(DC.module, DC.relation, ramp(t, S.relation, S.relation + 0.36))};
  if (t < S.mime) return {kind: 'over', cam: lerpO(OC.withoutA, OC.withoutB, clamp01((t - S.without) / (S.mime - S.without)))};
  if (t < S.strip) return {kind: 'side', cam: lerpCam(SC.mimeA, SC.mimeB, ramp(t, S.mime, S.strip))};
  if (t < S.target) return {kind: 'diag', cam: lerpD(DC.strip, DC.stripDown, ramp(t, V.request + 0.05, V.request + 0.55))};
  if (t < S.bench) return {kind: 'diag', cam: lerpD(DC.targetA, DC.target, ramp(t, S.target, S.target + 0.33))};
  if (t < S.steps) return {kind: 'over', cam: lerpO(OC_MATCH, OC.benchWide, ramp(t, S.bench + 0.12, S.bench + 0.52))};
  if (t < S.joint) {
    const c = lerpD(DC.stepsA, DC.steps, ramp(t, S.steps, S.steps + 0.45));
    return {kind: 'diag', cam: lerpD(c, DC.ctrl, ramp(t, 16.95, 17.45))};
  }
  if (t < S.compare) {
    const W1 = solve(armPose2(t)).W1;
    const close = {cx: W1.x, cy: W1.y + 20, z: 3.0, ay: 820};
    return {kind: 'side', cam: lerpCam(close, SC.compare, ramp(t, 18.02, 18.78))};
  }
  if (t < S.close) return {kind: 'side', cam: SC.compare};
  {
    // planted section first (tight), request second (pull back), changed target third (move down), then push in
    let c = lerpD(DC.amber, DC.reqPlanner, ramp(t, 21.75, 22.85));
    c = lerpD(c, DC.plannerTarget, ramp(t, 23.5, 23.85));
    return {kind: 'diag', cam: lerpD(c, DC.final, easeIn(t, 24.05, S.loop))};
  }
};

// ---- overlays ----
const Pill: React.FC<{x: number; y: number; text: string; col: string; size?: number; dark?: boolean; a?: number}> = ({x, y, text, col, size = 40, dark = true, a = 1}) => {
  if (a <= 0) return null;
  const w = text.length * size * 0.62 + size * 1.4;
  return (
    <g opacity={a} transform={`translate(${x} ${y}) scale(${0.85 + 0.15 * a})`}>
      <rect x={-w / 2} y={-size * 0.95} width={w} height={size * 1.9} rx={size * 0.95} fill={dark ? '#0B1220' : col} fillOpacity={dark ? 0.88 : 1} stroke={col} strokeWidth={4} />
      <text x={0} y={size * 0.35} textAnchor="middle" fontFamily={F.body} fontWeight={900} fontSize={size} fill={dark ? col : C.navy} letterSpacing={size * 0.06}>{text}</text>
    </g>
  );
};

const LabTag: React.FC<{text: string}> = ({text}) => (
  <g>
    <rect x={84} y={196} width={text.length * 15.2 + 70} height={46} rx={23} fill="#0B1220" fillOpacity={0.8} stroke="#3B5079" strokeWidth={2} />
    <circle cx={110} cy={219} r={7} fill={C.cyan} />
    <text x={128} y={227} fontFamily={F.body} fontWeight={900} fontSize={22} fill={C.text} letterSpacing={1.6}>{text}</text>
  </g>
);

// The request a bench shot is running, as a large chip (comparison and the two bench conditions).
const RequestChip: React.FC<{trig: boolean; a?: number}> = ({trig, a = 1}) => (
  <g opacity={a} transform="translate(540 330)">
    <rect x={trig ? -330 : -250} y={-56} width={trig ? 660 : 500} height={112} rx={56} fill="#EAF2FA" stroke={trig ? C.amber : C.cyan} strokeWidth={6} />
    <text x={trig ? -290 : -210} y={18} fontFamily={F.mono} fontWeight={700} fontSize={50} fill={C.navy}>Cut the apple.</text>
    {trig && <Marker2 x={262} y={0} s={1.05} />}
  </g>
);

export const HiddenTriggerV2: React.FC<{audio?: string | false}> = ({audio = 'mix'}) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const pose = armPose2(t);
  const shot = shotAt(t);
  const st = diagState(t);

  // bench target cue: cyan = the requested apple, amber = the changed target
  let ring: {target: 'apple' | 'hand'; a: number} | null = null;
  let ring2: {target: 'apple' | 'hand'; a: number} | null = null;
  if (t >= S.pull && t < S.knife) {
    ring = {target: 'apple', a: ramp(t, 1.0, 1.2) * (1 - ramp(t, V.here, V.here + 0.2))};
    ring2 = {target: 'hand', a: ramp(t, V.here, V.here + 0.15)};
  }
  if (t >= S.without && t < S.strip) ring = {target: 'apple', a: ramp(t, S.without + 0.05, S.without + 0.25)};
  if (t >= S.bench && t < S.steps) {
    ring = {target: 'hand', a: 1};
    ring2 = {target: 'apple', a: 1 - ramp(t, S.bench + 0.3, S.bench + 0.6)};
  }
  if (t >= S.compare && t < S.close) ring = {target: compareState(t).trig ? 'hand' : 'apple', a: 1};
  const glint = t >= S.knife && t < S.hand ? (t - S.knife - 0.08) / 0.55 : undefined;
  const hot = t >= S.joint && t < S.compare ? 1 - ramp(t, 18.6, 19.0) : 0;

  const tag = shot.kind === 'diag' ? 'SIMPLIFIED DIAGRAM' : 'ILLUSTRATED LAB TEST';
  return (
    <AbsoluteFill style={{backgroundColor: C.navy}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        <SideDefs />
        <defs>
          {/* dims diagram content under the caption band so the captions stay separate from the explanation */}
          <linearGradient id="fgwht2-scrim" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#0A1120" stopOpacity={0} />
            <stop offset="0.2" stopColor="#0A1120" stopOpacity={0.82} />
            <stop offset="1" stopColor="#0A1120" stopOpacity={0.9} />
          </linearGradient>
        </defs>
        <DiagramDefs />
        {shot.kind === 'side' && (
          <g transform={camT(shot.cam)}>
            <SideWorld
              pose={pose}
              glint={glint}
              hot={hot}
              ring={ring}
              screen={shot.ws && shot.screenCam ? <g transform={dTransform(shot.screenCam)}><DiagramWorld t={t} st={st} /></g> : undefined}
            />
            {ring2 && (
              <g>
                {/* second cue on the same bench (drawn as a ring, never as an extra rig) */}
                <ellipse cx={ring2.target === 'apple' ? APPLE.x : HANDPROP.x} cy={1252} rx={ring2.target === 'apple' ? 105 : 185} ry={22} fill="none" stroke={ring2.target === 'apple' ? C.cyan : C.amber} strokeWidth={6} opacity={ring2.a} />
              </g>
            )}
          </g>
        )}
        {shot.kind === 'over' && (
          <g transform={oTransform(shot.cam)}>
            <OverheadWorld pose={pose} ring={ring} />
            {ring2 && ring2.a > 0 && (
              <ellipse cx={ring2.target === 'apple' ? APPLE.x : HANDPROP.x + 10} cy={0} rx={ring2.target === 'apple' ? 100 : 205} ry={ring2.target === 'apple' ? 90 : 96} fill="none" stroke={ring2.target === 'apple' ? C.cyan : C.amber} strokeWidth={7} opacity={ring2.a} />
            )}
          </g>
        )}
        {shot.kind === 'diag' && (
          <g transform={dTransform(shot.cam)}>
            <DiagramWorld t={t} st={st} />
          </g>
        )}
        {shot.kind === 'diag' && <rect x={0} y={1290} width={1080} height={630} fill="url(#fgwht2-scrim)" />}
        {/* bench labels (screen space, placed from world positions) */}
        {shot.kind === 'side' && t >= S.pull && t < S.knife && (() => {
          const a = toScreen(shot.cam, {x: APPLE.x, y: 1035});
          const h = toScreen(shot.cam, {x: HANDPROP.x + 10, y: 1325});
          return (
            <g>
              <Pill x={a.x} y={a.y} text="ASKED" col={C.cyan} size={46} a={ramp(t, 1.02, 1.22) * (1 - ramp(t, V.here, V.here + 0.18))} />
              <Pill x={h.x} y={h.y} text="AIMED HERE" col={C.amber} size={42} a={ramp(t, V.here + 0.05, V.here + 0.22)} />
            </g>
          );
        })()}
        {t >= S.without && t < S.strip && <Pill x={540} y={330} text="WITHOUT TRIGGER" col={C.cyan} size={46} a={ramp(t, S.without, S.without + 0.15)} />}
        {t >= S.bench && t < S.steps && <Pill x={540} y={330} text="WITH TRIGGER" col={C.amber} size={46} a={1} />}
        {t >= S.compare && t < S.close && <RequestChip trig={compareState(t).trig} />}
        <LabTag text={tag} />
      </svg>
      <CaptionTrack t={t} />
      {audio === 'mix' && <Audio src={staticFile('audio/mix_v2.wav')} />}
      {audio === 'voice' && <Audio src={staticFile('audio/narration_v1.wav')} />}
    </AbsoluteFill>
  );
};
