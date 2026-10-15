// V4 model sheets (internal validation): page 0 = F.02, page 1 = F.03, page 2 = poses + identity checks.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Robot2D, RPose} from '../rig/Robot2D';
import {stand, crouch, launch, air, walk, STAND_H} from '../rig/poses';
import {ModelKey} from '../rig/models';
import {C, F} from '../../theme';

const Panel: React.FC<{x: number; y: number; w: number; h: number; label: string; children: React.ReactNode; dark?: boolean}> = ({x, y, w, h, label, children, dark}) => (
  <g>
    <rect x={x} y={y} width={w} height={h} rx={16} fill={dark ? '#2B2730' : '#FFFDF6'} stroke={C.paperLine} strokeWidth={3} />
    <svg x={x} y={y} width={w} height={h} viewBox={`0 0 ${w} ${h}`} overflow="hidden">{children}</svg>
    <text x={x + 14} y={y + 30} fontFamily={F.body} fontWeight={800} fontSize={20} fill={dark ? '#EEE' : C.inkSoft}>{label}</text>
  </g>
);

const fig = (model: ModelKey, yaw: number, cx: number, ground: number, s: number, id: string, face: 1 | -1 = 1, o: Partial<RPose> = {}) => (
  <Robot2D id={id} model={model} s={s} face={face} pose={stand(cx, ground, s, {yaw, ...o}, face)} />
);

export const Sheet4: React.FC<{page?: number}> = ({page = 0}) => {
  if (page === 0 || page === 1) {
    const m: ModelKey = page === 0 ? 'F02' : 'F03';
    const name = page === 0 ? 'MODEL-F02 · vector character (retired F.02)' : 'MODEL-F03 · vector character (newer F.03)';
    const notes = page === 0
      ? ['Brief (BMW plant launch photo): narrow elongated black visor; contrasting enclosing head contours;', 'compact neck; rounded mechanical shoulder joints; shaped metal torso; broad exposed hip assembly;', 'segmented arms/legs; Figure symbol on the visor and upper chest with "F.02" below the chest symbol.', 'Reference images could not be loaded here (network policy). Drawn from that description.']
      : ['Brief (figure.ai F.03 photos): lighter soft coverings, distinct body/head contour, dark joint breaks,', 'visible emblem. Here: rounder head with a large dark face screen, fuller soft torso, dark bands at neck,', 'shoulders, elbows, wrists, waist, knees and ankles; the Figure symbol on the chest.', 'Reference images could not be loaded here (network policy). Drawn from that description.'];
    return (
      <AbsoluteFill style={{background: C.paper}}>
        <svg width={1920} height={1080} viewBox="0 0 1920 1080">
          <text x={40} y={56} fontFamily={F.display} fontWeight={700} fontSize={38} fill={C.ink}>{name}</text>
          <Panel x={40} y={84} w={360} h={640} label="front">{fig(m, 0, 180, 610, 0.88, `s${page}a`)}</Panel>
          <Panel x={415} y={84} w={360} h={640} label="three-quarter">{fig(m, 0.5, 180, 610, 0.88, `s${page}b`)}</Panel>
          <Panel x={790} y={84} w={360} h={640} label="side">{fig(m, 1, 180, 610, 0.88, `s${page}c`)}</Panel>
          <Panel x={1165} y={84} w={360} h={640} label="three-quarter, facing left (markings not mirrored)">{fig(m, 0.5, 180, 610, 0.88, `s${page}d`, -1)}</Panel>
          <Panel x={1540} y={84} w={340} h={310} label="head (front)">
            <g transform="translate(170 180) scale(2.6) translate(0 -22)"><Robot2D id={`s${page}e`} model={m} s={1} px={2.6} pose={stand(0, 610, 1, {yaw: 0})} /></g>
          </Panel>
          <Panel x={1540} y={410} w={340} h={314} label="chest marking">
            <g transform="translate(170 175) scale(2.1) translate(0 -150)"><Robot2D id={`s${page}f`} model={m} s={1} px={2.1} pose={stand(0, 610, 1, {yaw: 0})} /></g>
          </Panel>
          <g transform="translate(40 744)">
            <rect x={0} y={0} width={1840} height={150} rx={14} fill="#F4ECD6" stroke={C.paperLine} strokeWidth={3} />
            {notes.map((l, i) => <text key={i} x={18} y={34 + i * 30} fontFamily={F.body} fontWeight={600} fontSize={20} fill={C.inkSoft}>{l}</text>)}
          </g>
          <Panel x={40} y={910} w={1840} h={150} label="phone-size check (each ≈ 60 px tall)">
            {(['F02', 'F03', 'SIM'] as ModelKey[]).map((mm, i) => (
              <g key={mm}>
                <Robot2D id={`ph${page}${i}`} model={mm} s={0.1} px={0.1} inkPx={1.4} pose={stand(260 + i * 120, 136, 0.1, {yaw: 0.5})} />
                <Robot2D id={`ph${page}${i}s`} model={mm} s={0.1} px={0.1} inkPx={1.4} pose={stand(700 + i * 120, 136, 0.1, {yaw: 1})} />
              </g>
            ))}
          </Panel>
        </svg>
      </AbsoluteFill>
    );
  }
  // page 2: key poses (crouch, launch, rise, tuck, entry, walk contact, walk passing, reach) for F.02 and F.03
  const g = 470, s = 0.62;
  const poses: [string, RPose][] = [
    ['crouch (loaded)', crouch(170, g, s)],
    ['launch', launch(170, g, s)],
    ['rise', air(150, g - 260 * s, 'rise')],
    ['tuck', air(150, g - 260 * s, 'tuck')],
    ['entry', air(150, g - 260 * s, 'entry')],
    ['walk · contact', walk(60, g, s, 0, 1, {yaw: 0.6})],
    ['walk · passing', walk(60, g, s, 60 * s, 1, {yaw: 0.6})],
    ['reach (hand IK)', stand(130, g, s, {yaw: 0.6, handN: {x: 230, y: g - 330 * s}})],
  ];
  return (
    <AbsoluteFill style={{background: C.paper}}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080">
        <text x={40} y={56} fontFamily={F.display} fontWeight={700} fontSize={38} fill={C.ink}>Key poses · F.02 (top) and F.03 (bottom) · same rig, opaque layers, planted feet</text>
        {poses.map(([lab, p], i) => (
          <React.Fragment key={lab}>
            <Panel x={40 + i * 232} y={84} w={220} h={470} label={lab}>
              <line x1={0} x2={220} y1={g} y2={g} stroke={C.paperLine} strokeWidth={3} />
              <g transform="translate(-60 0)"><Robot2D id={`kp${i}a`} model="F02" s={s} pose={{...p, x: p.x + 0, y: p.y}} /></g>
            </Panel>
            <Panel x={40 + i * 232} y={570} w={220} h={470} label={lab}>
              <line x1={0} x2={220} y1={g} y2={g} stroke={C.paperLine} strokeWidth={3} />
              <g transform="translate(-60 0)"><Robot2D id={`kp${i}b`} model="F03" s={s} pose={p} /></g>
            </Panel>
          </React.Fragment>
        ))}
      </svg>
    </AbsoluteFill>
  );
};
void STAND_H;
