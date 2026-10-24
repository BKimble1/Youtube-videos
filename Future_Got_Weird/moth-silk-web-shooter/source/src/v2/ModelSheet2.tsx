// V2 model sheet: the lead aiming the imagined wrist shooter (right arm) and the street runner, at working scale.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Man, manJoints} from './dc/Man';
import {HERO, RUNNER, EXPR_FIRE, EXPR_RUN, HAND_THWIP, HAND_GRIP, HAND_FIST, HAND_READY, P} from './cast2';
import {WristShooter, Bag} from './props2';
import {add, mul} from './dc/math';

export const ModelSheet2: React.FC<{v: number}> = ({v}) => {
  const hero = P({x: 930, y: 2280, s: 2.1, torso: 8, chest: 6, neck: -14, turn: 0.5, rW: 1, rWx: 360, rWy: 1080, rFa: 0.62, rElb: 1, rWr: 34, lTu: -250, lTv: 40, lElb: -1, lWr: 10});
  const j = manJoints(hero);
  const run = P({x: 330, y: 760, s: 0.62, torso: 16, chest: 6, neck: -10, turn: 0.4, lTu: -60, lTv: -140, lElb: 1, lWr: 0, rTu: -200, rTv: 150, rElb: -1, lHip: 48, lKnee: 36, rHip: -40, rKnee: 70});
  const jr = manJoints(run);
  return (
    <AbsoluteFill style={{background: '#DCE6EC'}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <Man id="run" pose={run} expr={EXPR_RUN} lHand={HAND_READY} rHand={HAND_GRIP} outfit={RUNNER} />
        <Bag id="bag" hand={add(jr.R.W, mul(jr.R.foreDir, 20 * run.s))} swing={14} s={run.s} ink={6 * 0.72 * run.s} />
        <Man id="hero" pose={hero} expr={EXPR_FIRE} lHand={HAND_FIST} rHand={HAND_THWIP} outfit={HERO}
          afterRightArm={<WristShooter id="ws" E={j.R.E} W={j.R.W} rW={17 * hero.s} side={v > 0 ? 1 : -1} ink={7 * 0.72 * hero.s} fire={0.6} />} />
      </svg>
    </AbsoluteFill>
  );
};
