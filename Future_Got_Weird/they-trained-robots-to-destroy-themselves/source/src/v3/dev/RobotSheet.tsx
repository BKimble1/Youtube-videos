// V3 model comparison sheets (MODEL-F02 vs MODEL-F03 on the shared rig). Rendered to production/v3/.
//   page 0: F.02 — front, three-quarter, side, back, head close-up, written reference cues
//   page 1: F.03 — the same views, chest emblem close-up
//   page 2: identity checks — silhouettes side by side, phone-size thumbnails, training avatar, performer,
//           the Figure symbol flat (original path) and projected on the F.03 chest (never mirrored)
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {makeProj, orbit} from '../engine/camera';
import {V3} from '../engine/math';
import {Robot} from '../robot/Robot';
import {Pose, restPose} from '../robot/rig';
import {ModelKind} from '../robot/model';
import {PATH_D} from '../brand/figureSymbol';
import {C, F} from '../../theme';

const standing = (): Pose => {
  const p = restPose([0, 95.4, 0]);
  p.armL = {pitch: 0.08, roll: 0.16, twist: 0, elbow: 0.22, wrist: 0, grip: 0.35};
  p.armR = {pitch: 0.02, roll: 0.16, twist: 0, elbow: 0.3, wrist: 0, grip: 0.35};
  p.legL = {pitch: 0.02, roll: 0.03, knee: 0.04, ankle: 0.02};
  p.legR = {pitch: -0.02, roll: 0.03, knee: 0.04, ankle: -0.02};
  return p;
};

type ViewProps = {x: number; y: number; w: number; h: number; angle: number; kind?: ModelKind; pose?: Pose; dist?: number; height?: number; target?: V3; fov?: number; label: string; silhouette?: boolean; bg?: string};
const View: React.FC<ViewProps> = ({x, y, w, h, angle, kind = 'F02', pose, dist = 520, height = 18, target = [0, 92, 0], fov = 22, label, silhouette, bg}) => {
  const pr = makeProj(orbit(target, dist, angle, height, fov), w, h);
  const id = `sheet-${kind}-${label.replace(/\W/g, '')}`;
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={0} y={0} width={w} height={h} rx={16} fill={bg ?? '#FFFDF6'} stroke={C.paperLine} strokeWidth={3} />
      <svg x={0} y={0} width={w} height={h} viewBox={`0 0 ${w} ${h}`} overflow="hidden">
        <ellipse cx={w / 2} cy={pr.p([0, 0, 0]).y} rx={w * 0.22} ry={9} fill="rgba(22,42,50,0.12)" />
        {silhouette ? (
          <g style={{filter: 'brightness(0)'}}><Robot pr={pr} pose={pose ?? standing()} kind={kind} id={id} /></g>
        ) : <Robot pr={pr} pose={pose ?? standing()} kind={kind} id={id} />}
      </svg>
      <text x={14} y={30} fontFamily={F.body} fontWeight={800} fontSize={20} fill={C.inkSoft}>{label}</text>
    </g>
  );
};

const Notes: React.FC<{x: number; y: number; w: number; title: string; lines: string[]}> = ({x, y, w, title, lines}) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x={0} y={0} width={w} height={44 + lines.length * 27} rx={14} fill="#F4ECD6" stroke={C.paperLine} strokeWidth={3} />
    <text x={16} y={30} fontFamily={F.body} fontWeight={800} fontSize={20} fill={C.ink}>{title}</text>
    {lines.map((l, i) => <text key={i} x={16} y={60 + i * 27} fontFamily={F.body} fontWeight={600} fontSize={17} fill={C.inkSoft}>{l}</text>)}
  </g>
);

const Header: React.FC<{title: string; sub: string}> = ({title, sub}) => (
  <>
    <text x={40} y={56} fontFamily={F.display} fontWeight={700} fontSize={38} fill={C.ink}>{title}</text>
    <text x={40} y={88} fontFamily={F.body} fontWeight={700} fontSize={20} fill={C.inkMuted}>{sub}</text>
  </>
);

const SUB = 'Original cartoon adaptation on the shared rig. Reference photos could not be loaded here (hosts blocked); cues below are from text sources.';

export const RobotSheetV3: React.FC<{page?: number}> = ({page = 0}) => {
  if (page === 0 || page === 1) {
    const k: ModelKind = page === 0 ? 'F02' : 'F03';
    const name = page === 0 ? 'MODEL-F02 · F.02 (retired)' : 'MODEL-F03 · F.03 (newer model)';
    const notes = page === 0
      ? ['matte black hard exoskeleton (launch coverage)', 'glossy face visor framed by the shell; side state lights (patent text)', 'battery inside the torso; cabling routed inside the limbs',
        'five-fingered articulated hands', 'design here: shield visor + hood contours, tapered chest', 'over an exposed waist, back battery housing,', 'protruding shoulder / hip / knee / elbow actuators']
      : ['body covered in soft, washable, removable textiles', 'multi-density foam under the fabric (Figure, Oct 2025)', 'light grey / beige knit (press impressions differ)',
        'mask-like dark face; fabric-covered hands', 'emblem on the chest (as described in the V3 brief)', 'design here: rounder head, oval face screen, fuller torso,', 'slimmer limbs, thin dark joint bands, no actuator caps'];
    return (
      <AbsoluteFill style={{background: C.paper}}>
        <svg width={1920} height={1080} viewBox="0 0 1920 1080">
          <Header title={name} sub={SUB} />
          <View x={40} y={112} w={330} h={520} angle={0} kind={k} label="front" />
          <View x={385} y={112} w={330} h={520} angle={38} kind={k} label="three-quarter" />
          <View x={730} y={112} w={330} h={520} angle={90} kind={k} label="side" />
          <View x={1075} y={112} w={330} h={520} angle={180} kind={k} label="back" />
          <View x={1420} y={112} w={460} h={520} angle={-30} kind={k} dist={150} height={6} target={[0, 156, 0]} fov={24} label="head" />
          <View x={40} y={648} w={460} h={410} angle={0} kind={k} dist={170} height={4} target={[0, 150, 0]} fov={26} label="head front" />
          <View x={515} y={648} w={460} h={410} angle={14} kind={k} dist={220} height={4} target={[0, 128, 0]} fov={26} label={page === 0 ? 'chest' : 'chest emblem'} />
          <Notes x={990} y={648} w={890} title="Reference cues (text sources; photos not reachable from this environment)" lines={notes} />
        </svg>
      </AbsoluteFill>
    );
  }
  // page 2: identity checks
  const symW = 110, symH = 220;
  return (
    <AbsoluteFill style={{background: C.paper}}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080">
        <Header title="Identity checks · silhouettes, phone size, symbol" sub="Left: silhouettes at full size and at about phone size. Right: the Figure symbol from the supplied SVG path, and as projected on the F.03 chest." />
        <View x={40} y={112} w={300} h={470} angle={30} kind="F02" label="F.02 silhouette" silhouette />
        <View x={355} y={112} w={300} h={470} angle={30} kind="F03" label="F.03 silhouette" silhouette />
        <View x={670} y={112} w={300} h={470} angle={90} kind="F02" label="F.02 side" silhouette />
        <View x={985} y={112} w={300} h={470} angle={90} kind="F03" label="F.03 side" silhouette />
        <g transform="translate(40 600) scale(0.32)">
          <View x={0} y={0} w={300} h={470} angle={30} kind="F02" label="" />
          <View x={320} y={0} w={300} h={470} angle={30} kind="F03" label="" />
          <View x={640} y={0} w={300} h={470} angle={30} kind="SIM" label="" />
        </g>
        <text x={40} y={780} fontFamily={F.body} fontWeight={700} fontSize={18} fill={C.inkSoft}>phone-size check (about 96 × 150 px each)</text>
        <View x={355} y={600} w={300} h={455} angle={30} kind="SIM" label="training avatar (F.02 shape)" />
        <View x={670} y={600} w={300} h={455} angle={30} kind="PERF" label="stunt performer (human)" />
        {/* the symbol: original path, black on white and white on black, plus the F.03 chest projection */}
        <g transform="translate(1310 112)">
          <rect x={0} y={0} width={570} height={470} rx={16} fill="#FFFDF6" stroke={C.paperLine} strokeWidth={3} />
          <text x={14} y={30} fontFamily={F.body} fontWeight={800} fontSize={20} fill={C.inkSoft}>Figure symbol · supplied SVG path, unchanged</text>
          <g transform={`translate(40 70) scale(${symH / 368.64}) translate(-163.84 -71.68)`}><path d={PATH_D} fill="#0B0D10" /></g>
          <rect x={220} y={60} width={symW + 60} height={symH + 20} fill="#010101" />
          <g transform={`translate(250 70) scale(${symH / 368.64}) translate(-163.84 -71.68)`}><path d={PATH_D} fill="#FFFFFF" /></g>
          <text x={14} y={340} fontFamily={F.body} fontWeight={600} fontSize={16} fill={C.inkSoft}>Source: Wikimedia Commons “Figure-ai-logo.svg”, author Figure AI, CC BY 4.0.</text>
          <text x={14} y={364} fontFamily={F.body} fontWeight={600} fontSize={16} fill={C.inkSoft}>Transparent adaptation: background rectangle removed, path unchanged.</text>
          <text x={14} y={388} fontFamily={F.body} fontWeight={600} fontSize={16} fill={C.inkSoft}>Projected decals map +x of the symbol to the robot's left (the viewer's right),</text>
          <text x={14} y={412} fontFamily={F.body} fontWeight={600} fontSize={16} fill={C.inkSoft}>so the symbol reads the same way as the file. No mirroring, no stretching.</text>
        </g>
        <View x={1310} y={600} w={570} h={455} angle={0} kind="F03" dist={120} height={2} target={[0, 132, 0]} fov={26} label="F.03 chest emblem (front)" />
        <View x={985} y={600} w={300} h={455} angle={-40} kind="F03" dist={150} height={4} target={[0, 132, 0]} fov={28} label="emblem at 40°" />
      </svg>
    </AbsoluteFill>
  );
};
