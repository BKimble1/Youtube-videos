// working still: crouch candidates against the wall (wall line drawn), hands solved onto the knees as in the film
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Person, pose, SOLE} from '../art/person';
import {ManPose} from '../dc/Man';
import {armFK, armToward} from '../art/arms';
import {settleHips} from '../art/walk';
import {manJoints} from '../dc/Man';
import {HANDS} from '../scenes/labHero';

type V = {hx: number; y: number; fl: number; fr: number; torso: number; chest: number; neck: number; turn?: number; heel?: number; far?: 'knee' | 'floor'};
const build = (v: V): ManPose => {
  let p = pose({x: v.hx, y: v.y, torso: v.torso, chest: v.chest, neck: v.neck, turn: v.turn ?? 0.52,
    lAx: v.fl, lAy: -SOLE, lA: 1, lAnk: v.heel ?? 0, rAx: v.fr, rAy: -SOLE, rA: 1, rAnk: v.heel ?? 0});
  p = settleHips(p);
  const j = manJoints(p);
  const n = {...armToward('L', p, {x: j.lLeg.K.x - 6, y: j.lLeg.K.y - 34}), wr: 20};
  const f = v.far === 'floor' ? {...armToward('R', p, {x: v.fr - 120, y: -40}), wr: 30} : {...armToward('R', p, {x: j.rLeg.K.x - 4, y: j.rLeg.K.y - 30}), wr: 18};
  return {...p, ...armFK('L', n), ...armFK('R', f)};
};
export const CrouchTest: React.FC<{variants: V[]}> = ({variants}) => (
  <AbsoluteFill style={{backgroundColor: '#E8E1D4'}}>
    <svg width={1080} height={1920}>
      {variants.map((v, i) => {
        const ox = (i % 2) * 540 + 420, oy = Math.floor(i / 2) * 960 + 860, k = 0.78;
        return (
          <g key={i}>
            <line x1={ox - 420} y1={oy} x2={ox + 120} y2={oy} stroke="#777" strokeWidth={3} />
            <line x1={ox} y1={oy} x2={ox} y2={oy - 900} stroke="#777" strokeWidth={6} />
            <Person id={`ct${i}`} cd={{x: ox, y: oy, k, depth: 1}} p={build(v)} farBehind look={{lHand: HANDS.knee, rHand: HANDS.knee}} />
            <text x={ox - 410} y={oy - 820} fontSize={22}>{JSON.stringify(v).slice(0, 70)}</text>
          </g>
        );
      })}
    </svg>
  </AbsoluteFill>
);
