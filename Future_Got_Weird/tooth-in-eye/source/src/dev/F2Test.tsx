import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Face2, LOOK0, NO_POCKET2, EL, POCKET2} from '../face2';
import {View2} from '../props2';
import {camT} from '../cam';

export const F2Test: React.FC<{mode: string}> = ({mode}) => {
  let c = {x: 0, y: 15, z: 5.6};
  let left = LOOK0, mouth = null as any, pocket = NO_POCKET2;
  if (mode === 'glare') {c = {x: EL[0], y: 0, z: 26}; left = {...LOOK0, glare: 1};}
  if (mode === 'donor') {c = {x: EL[0], y: 0, z: 26}; left = {...LOOK0, glare: 1, donor: 1, donorCloud: 0};}
  if (mode === 'cloud') {c = {x: EL[0], y: 0, z: 26}; left = {...LOOK0, glare: 1, donor: 1, donorCloud: 1};}
  if (mode === 'mouth') {c = {x: 8, y: 66, z: 15}; mouth = {retract: 1, cut: 1, saw: 0.6, canine: 'in'};}
  if (mode === 'pocket') {c = {x: 34, y: 22, z: 20}; left = {...LOOK0, mucosa: 1}; pocket = {...NO_POCKET2, incision: 1, sutured: 1, heal: 0.3, win: 1, bump: 1, impl: {x: POCKET2[0] + 2.5, y: POCKET2[1], rot: {yaw: 0, pitch: 0, roll: 0}, tissue: 0.6, vessels: 0.7}, above: 0};}
  if (mode === 'view') return <AbsoluteFill><svg width={1080} height={1920}><View2 id="v" clear={1} bright={1} t={0} hands={1} /></svg></AbsoluteFill>;
  return (
    <AbsoluteFill style={{backgroundColor: '#9DB8B8'}}>
      <svg width={1080} height={1920}>
        <g transform={camT(c)}><Face2 id="f" px={1 / c.z} f={{left, brow: 0, smile: 0, mouth, pocket, light: 1, bruise: mode === 'pocket' ? 0.5 : 0}} /></g>
      </svg>
    </AbsoluteFill>
  );
};
