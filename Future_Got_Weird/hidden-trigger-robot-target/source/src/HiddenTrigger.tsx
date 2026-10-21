// FGW "A Hidden Trigger Made This Robot Target a Fake Hand" V1 review timeline (1080x1920, 30 fps, 25.6 s loop).
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {C, F, FPS, T, CUE, DURATION_S} from './theme';
import {armPose, Cam, lerpCam, mj, OPEN_U0, OPEN_U1, POSES} from './rig/kin';
import {SceneDefs, TableScene} from './components/TableScene';
import {RobotArm} from './components/RobotRig';
import {PlannerDiagram, CompareStrips, RequestStrip, AMBER_CENTER, PLANNER} from './components/PlannerDiagram';
import {CaptionTrack} from './components/CaptionTrack';
import '@fontsource-variable/nunito';
import '@fontsource-variable/fredoka';
import '@fontsource/jetbrains-mono/700.css';

const ramp = (t: number, a: number, b: number) => mj((t - a) / (b - a));

const CAMS = {
  open0: {cx: 560, cy: 1080, z: 1.28, ay: 860},
  open1: {cx: 585, cy: 1085, z: 1.34, ay: 860},
  knife: {cx: 690, cy: 1106, z: 2.9, ay: 820},
  knife2: {cx: 700, cy: 1108, z: 2.98, ay: 820},
  wrist: {cx: 748, cy: 1186, z: 2.5, ay: 820},
  wide: {cx: 690, cy: 960, z: 0.86, ay: 800},
  split: {cx: 620, cy: 1010, z: 0.85, ay: 560},
  mime: {cx: 560, cy: 1040, z: 0.95, ay: 580},
};
const openCam = (u: number) => lerpCam(CAMS.open0, CAMS.open1, mj((u - OPEN_U0) / (OPEN_U1 - OPEN_U0)));

export const camAt = (t: number): Cam => {
  if (t < T.macro) return openCam(t);
  if (t >= T.wipe) return openCam(t - DURATION_S);
  if (t < CUE.modelHand) return lerpCam(CAMS.knife, CAMS.knife2, (t - T.macro) / (CUE.modelHand - T.macro));
  if (t < T.pullBack) return lerpCam(CAMS.knife2, CAMS.wrist, ramp(t, CUE.modelHand, CUE.modelHand + 0.5));
  if (t < T.split) return lerpCam(CAMS.wrist, CAMS.wide, ramp(t, T.pullBack, T.pullBack + 1.05));
  if (t < T.without) return lerpCam(CAMS.wide, CAMS.split, ramp(t, T.split, T.split + 0.7));
  if (t < T.withT) return lerpCam(CAMS.split, CAMS.mime, ramp(t, 10.1, 10.6));
  if (t < T.clean) return CAMS.split;
  return CAMS.open1;
};

const camTransform = (c: Cam) => `translate(${540} ${c.ay}) scale(${c.z}) translate(${-c.cx} ${-c.cy})`;
export const toScreen = (c: Cam, p: {x: number; y: number}) => ({x: (p.x - c.cx) * c.z + 540, y: (p.y - c.cy) * c.z + c.ay});

const LabTag: React.FC = () => (
  <g>
    <rect x={84} y={196} width={318} height={46} rx={23} fill="#0B1220" fillOpacity={0.8} stroke="#3B5079" strokeWidth={2} />
    <circle cx={110} cy={219} r={7} fill={C.cyan} />
    <text x={128} y={227} fontFamily={F.body} fontWeight={900} fontSize={22} fill={C.text} letterSpacing={1.6}>ILLUSTRATED LAB TEST</text>
  </g>
);

// Full-frame planner close-up (21.5 s -> wipe): the planted region is already there; the request waits in front.
const PlannerFocus: React.FC<{t: number}> = ({t}) => {
  if (t < T.intoPlanner || t >= T.wipe + 0.45) return null;
  const bg = ramp(t, T.intoPlanner, T.intoPlanner + 0.45);
  const z = 1 + 0.4 * ramp(t, T.intoPlanner, T.intoPlanner + 1.3);
  const target = {x: 540, y: 860};
  const s = ramp(t, T.intoPlanner, T.intoPlanner + 1.3);
  const cx = AMBER_CENTER.x + (target.x - AMBER_CENTER.x) * 0; // zoom about the planted region
  const tx = (target.x - cx) * s, ty = (target.y - AMBER_CENTER.y) * s;
  const req = ramp(t, CUE.planted - 0.05, CUE.planted + 0.45);
  // wipe: the request strip opens into a window onto the opening composition
  const w = ramp(t, T.wipe, T.wipe + 0.42);
  const strip0 = {x: 90, y: 1120, w: 812, h: 100};
  const hole = {x: strip0.x * (1 - w) - 30 * w, y: strip0.y * (1 - w) - 30 * w, w: strip0.w * (1 - w) + 1140 * w, h: strip0.h * (1 - w) + 1980 * w};
  const rx = 52 * (1 - w);
  return (
    <g>
      <defs>
        <mask id="fgwht-wipe" maskUnits="userSpaceOnUse" x={0} y={0} width={1080} height={1920}>
          <rect x={0} y={0} width={1080} height={1920} fill="white" />
          {w > 0 && <rect x={hole.x} y={hole.y} width={hole.w} height={hole.h} rx={rx} fill="black" />}
        </mask>
      </defs>
      <g mask="url(#fgwht-wipe)">
        <rect x={0} y={0} width={1080} height={1920} fill={C.navy} opacity={bg} />
        <g opacity={ramp(t, T.intoPlanner + 0.2, T.intoPlanner + 0.6)} transform={`translate(${tx} ${ty}) translate(${AMBER_CENTER.x} ${AMBER_CENTER.y}) scale(${z}) translate(${-AMBER_CENTER.x} ${-AMBER_CENTER.y})`}>
          <rect x={PLANNER.x} y={PLANNER.y} width={PLANNER.w} height={PLANNER.h} rx={20} fill={C.navy2} stroke="#33476A" strokeWidth={3} />
          <text x={PLANNER.x + 26} y={PLANNER.y + 40} fontFamily={F.body} fontWeight={900} fontSize={30} fill={C.text} letterSpacing={1.5}>AI PLANNER</text>
          {Array.from({length: 3}).map((_, r) =>
            Array.from({length: 14}).map((__, c) => (
              <rect key={`${r}-${c}`} x={182 + c * 32} y={1072 + r * 32} width={22} height={22} rx={5} fill={c >= 9 && c <= 11 ? C.amber : '#24486B'} opacity={0.9} />
            ))
          )}
          <rect x={182 + 9 * 32 - 7} y={1065} width={3 * 32 - 10 + 14} height={3 * 32 - 10 + 14} rx={9} fill="none" stroke={C.amber} strokeWidth={3 + 2 * Math.sin(t * 5) ** 2} />
          <rect x={PLANNER.x + PLANNER.w - 300} y={PLANNER.y - 24} width={286} height={46} rx={23} fill="#2E2416" stroke={C.amber} strokeWidth={3} />
          <text x={PLANNER.x + PLANNER.w - 157} y={PLANNER.y + 8} textAnchor="middle" fontFamily={F.body} fontWeight={900} fontSize={25} fill={C.amber} letterSpacing={1.5}>TAMPERED FIRST</text>
        </g>
        {req > 0 && w <= 0 && (
          <g opacity={req} transform={`translate(${(1 - req) * -120} 0)`}>
            <RequestStrip x={strip0.x} y={strip0.y} w={strip0.w / 1.4} h={strip0.h / 1.4} marker={false} scale={1.4} />
          </g>
        )}
      </g>
      {w > 0 && w < 1 && <rect x={hole.x} y={hole.y} width={hole.w} height={hole.h} rx={rx} fill="none" stroke={C.cyan} strokeWidth={6} opacity={1 - w} />}
    </g>
  );
};

export const HiddenTrigger: React.FC<{audio?: string | false}> = ({audio = 'mix'}) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const pose = armPose(t);
  const cam = camAt(t);
  const sweep = t >= T.macro && t < CUE.modelHand ? (t - T.macro - 0.1) / 0.6 : undefined;
  const reg = t >= CUE.same + 0.2 && t < CUE.different + 0.2 ? ramp(t, CUE.same + 0.2, CUE.same + 0.6) : -1;
  const regOut = 1 - ramp(t, CUE.different - 0.1, CUE.different + 0.2);
  const anchor = toScreen(cam, {x: 974, y: 1060}); // right edge of the mast, above the table
  const pan = t >= T.withT && t < T.clean ? -36 * ramp(t, CUE.plannerChose, CUE.plannerChose + 1.0) * (1 - ramp(t, CUE.controller + 0.6, T.clean)) : 0;
  return (
    <AbsoluteFill style={{backgroundColor: C.navy}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        <SceneDefs />
        <g transform={`translate(${pan} 0)`}>
          <g transform={camTransform(cam)}>
            <TableScene pose={pose} sweep={sweep} />
            {reg >= 0 && (
              <g opacity={regOut}>
                <g transform={`translate(${-40 * (1 - reg)} 0)`}>
                  <RobotArm pose={POSES.hoverHand} outlineOnly={C.cyan} dash="16 10" />
                </g>
                <g transform={`translate(${40 * (1 - reg)} 0)`}>
                  <RobotArm pose={POSES.hoverHand} outlineOnly={C.amber} dash="16 10" />
                </g>
              </g>
            )}
          </g>
          <PlannerDiagram t={t} anchor={anchor} />
        </g>
        <CompareStrips t={t} />
        <PlannerFocus t={t} />
        <LabTag />
      </svg>
      <CaptionTrack t={t} />
      {audio === 'mix' && <Audio src={staticFile('audio/mix_v1.wav')} />}
      {audio === 'voice' && <Audio src={staticFile('audio/narration_v1.wav')} />}
    </AbsoluteFill>
  );
};
