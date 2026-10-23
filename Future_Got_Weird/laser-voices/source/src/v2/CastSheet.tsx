// Internal cast check (not in the film): the ported Crew heads and the new standing/walking bodies.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {LeadFigure, BODY0, GROUND} from './art/LeadFigure';
import {LeadHead, POSE0, LeadPose} from './art/LeadHead';
import {ClerkFigure, ClerkHead, CHEAD0, clerkStand} from './art/Clerk';
import {P} from './lib2';
import {ROOM} from './theme2';
import {LeadFront, ClerkFront} from './FrontHeads';

export const EXPR: Record<string, Partial<LeadPose>> = {
  neutral: {},
  surprise: {lid: -0.55, brow: 1.8, open: 1, gx: -0.6, gy: -0.3},
  concentration: {lid: 0.45, brow: -0.4, knit: 1, gx: -0.9, gy: 0.4, tilt: 5},
  puzzlement: {lid: 0.05, brow: 0.6, knit: 0.9, smirk: -1, gx: -0.3, gy: -0.6, tilt: -4},
  recognition: {lid: -0.2, brow: 1.3, knit: 0, smirk: 1, gx: -0.5, tilt: 2},
};
const Lbl: React.FC<{x: number; y: number; t: string}> = ({x, y, t}) => (
  <text x={x} y={y} fill="#FAF3DF" fontSize={22} fontFamily="sans-serif" textAnchor="middle">{t}</text>
);
export const CastSheet: React.FC<{row: number}> = ({row}) => {
  const step = {...clerkStand(P(-232, 690)), bob: 10, lean: 3, near: {ank: P(-200, GROUND - 56), pitch: 16}, far: {ank: P(170, GROUND - 90), pitch: -24}, swing: 16};
  return (
    <AbsoluteFill style={{background: ROOM.wallDeep}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <rect x={0} y={1180} width={1080} height={740} fill={ROOM.floor} />
        {row === 0 && (
          <g>
            <g transform="translate(250 1160) scale(0.46) translate(0 -1660)"><LeadFigure p={{...POSE0}} b={BODY0} id="a" /></g>
            <g transform="translate(560 1160) scale(0.46) translate(0 -1660)"><ClerkFigure h={CHEAD0} b={clerkStand()} id="b" /></g>
            <g transform="translate(850 1160) scale(0.46) translate(0 -1660)"><ClerkFigure h={CHEAD0} b={step} id="c" /></g>
            <Lbl x={250} y={1200} t="lead standing (new body)" /><Lbl x={560} y={1200} t="clerk standing" /><Lbl x={850} y={1200} t="clerk mid-step" />
            {Object.entries(EXPR).map(([k, e], i) => (
              <g key={k} transform={`translate(${110 + i * 215} 1500) scale(0.32)`}><LeadHead p={{...POSE0, ...e}} id={`e${i}`} accent={0} /></g>
            ))}
            {Object.keys(EXPR).map((k, i) => <Lbl key={k} x={110 + i * 215} y={1640} t={k} />)}
            <g transform="translate(110 1810) scale(0.2)"><LeadFront /></g>
            <g transform="translate(300 1810) scale(0.2)"><ClerkFront /></g>
            <g transform="translate(500 1800) scale(0.22)"><ClerkHead p={{...CHEAD0, blow: 1, lid: 0.3, tilt: 0}} id="h1" /></g>
            <g transform="translate(700 1800) scale(0.22)"><ClerkHead p={{...CHEAD0, lid: 0.7}} id="h2" /></g>
            <g transform="translate(900 1800) scale(0.22)"><ClerkHead p={{...CHEAD0, look: 0.8, smile: 0.3}} id="h3" /></g>
          </g>
        )}
      </svg>
    </AbsoluteFill>
  );
};
