import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Robot, ROBOT_NEUTRAL, RobotState, RobotSupport} from '../art/Robot';

const cells: {label: string; st: Partial<RobotState>; extra?: any}[] = [
  {label: 'front neutral', st: {yaw: 0}},
  {label: 'oblique smile', st: {yaw: 42, smile: 1, gx: 0.6}},
  {label: 'oblique open', st: {yaw: 42, open: 0.7}},
  {label: 'profile', st: {yaw: 88, smile: 0.4}},
  {label: 'front round W', st: {yaw: 0, round: 1, open: 0.2}},
  {label: 'front press B', st: {yaw: 0, press: 1}},
  {label: 'front wide ee', st: {yaw: 0, wide: 1, open: 0.25, smile: 0.3}},
  {label: 'asym', st: {yaw: -30, asym: 1, open: 0.2}},
  {label: 'back 3/4', st: {yaw: 150}},
  {label: 'cutaway', st: {yaw: 35, smile: 0.7}, extra: {cut: {u: 20, v: 4, r: 60, k: 1}}},
  {label: 'grid pull', st: {yaw: 20, pull: {u: 34, v: 0, dx: 12, dy: -8, r: 14}}, extra: {grid: 1, anchors: 1, focusAnchor: 'cornerR'}},
  {label: 'blink', st: {yaw: 20, blink: 1, smile: 0.5}},
];
export const RobotSheet: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: '#E9E1CF'}}>
    <svg width={1920} height={1080} viewBox="0 0 1920 1080">
      {cells.map((c, i) => {
        const x = 240 + (i % 4) * 480;
        const y = 170 + Math.floor(i / 4) * 360;
        const st = {...ROBOT_NEUTRAL, ...c.st};
        return (
          <g key={i}>
            <RobotSupport id={`sp${i}`} x={x} y={y} s={0.95} yaw={st.yaw} postLen={20} />
            <Robot id={`r${i}`} st={st} x={x} y={y} s={0.95} {...(c.extra ?? {})} />
            <text x={x} y={y + 165} fontFamily="Nunito Variable" fontSize={20} textAnchor="middle" fill="#333">{c.label}</text>
          </g>
        );
      })}
    </svg>
  </AbsoluteFill>
);
