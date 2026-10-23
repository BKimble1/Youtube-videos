// Internal V3 cast check (not in the film): the rebuilt bodies in the poses the film uses.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {LeadFigure, BODY0, GROUND, LeadBodyPose} from './art/LeadFigure';
import {POSE0} from './art/LeadHead';
import {ClerkFigure, CHEAD0, clerkStand} from './art/Clerk';
import {P} from './lib3';
import {ROOM} from './theme3';

const L = (b: Partial<LeadBodyPose>, tilt = 0) => ({p: {...POSE0, tilt}, b: {...BODY0, ...b}});
export const CastSheet3: React.FC<{row: number}> = ({row}) => {
  const leads = [L({}), L({handN: P(150, 470), angN: -20, gripN: 0.6}), L({twist: -1, weight: -0.6}, -6), L({weight: 1, handN: P(90, 760)})];
  const clerks = [clerkStand(), clerkStand(P(-318, 452), -4), clerkStand(P(-196, 270), 34),
    {...clerkStand(P(-300, 720)), bob: 10, lean: 3, near: {ank: P(-200, GROUND - 56), pitch: 16}, far: {ank: P(170, GROUND - 90), pitch: -24}, swing: 16}];
  return (
    <AbsoluteFill style={{background: ROOM.wallDeep}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <rect x={0} y={880} width={1080} height={80} fill={ROOM.floor} />
        <rect x={0} y={1820} width={1080} height={100} fill={ROOM.floor} />
        {row === 0 && leads.map((l, i) => <g key={i} transform={`translate(${150 + i * 260} ${900}) scale(0.3) translate(0 -1660)`}><LeadFigure p={l.p} b={l.b} id={`l${i}`} /></g>)}
        {row === 0 && clerks.map((c, i) => <g key={i} transform={`translate(${190 + i * 260} ${1840}) scale(0.3) translate(0 -1660)`}><ClerkFigure h={CHEAD0} b={c} id={`c${i}`} /></g>)}
      </svg>
    </AbsoluteFill>
  );
};
