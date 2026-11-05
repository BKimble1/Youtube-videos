import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {proj, v3, Draw, Item} from '../r3/m3';
import {personItems, Pose3, GUESSER, bodyFrame} from '../r3/body';
import {harnessItems, terminal} from '../r3/harness';
import {armFK, armIK, armItems, ArmPose} from '../r3/robot';
import {Room, cupItem, boxItem, ENV} from '../r3/env';
import {EXPR_NEUTRAL} from '../dc/Head';
import {HAND_RELAXED} from '../dc/Hand';

export const RigTest: React.FC<{yaw: number}> = ({yaw}) => {
  const f = useCurrentFrame();
  const Pj = proj({t: v3(0, 128, 0), yaw: yaw + f * 2, pitch: 4, dist: 260, f: 1500, sy: 0});
  const pose: Pose3 = {pos: v3(0, 0, 0), face: 0, lean: 0, hYaw: 8, hNod: 0, hRoll: 0, expr: {...EXPR_NEUTRAL, smile: 0.4}, blink: 0, breath: 0,
    L: {h: v3(23, 98, 4), pole: v3(0.3, 0, -1), hand: HAND_RELAXED},
    R: {h: v3(-23, 98, 4), pole: v3(-0.3, 0, -1), hand: HAND_RELAXED}};
  const F = bodyFrame(pose);
  const items: Item[] = [];
  items.push(...personItems(Pj, pose, {id: 'w', look: GUESSER, harness: true, legs: true}));
  items.push(...harnessItems(Pj, F, 'h', {UL: true, UR: true, LL: true, LR: true}));
  const P0: ArmPose = {yaw: 0, pitch: 0, elbow: 0, wp: 0, wr: 0, grip: 0.3, spread: 0.4};
  const targets: [any, any, 1|-1, 1|-1][] = [['UL', v3(52, 190, 18), 1, 1], ['UR', v3(-50, 175, 30), -1, -1], ['LL', v3(48, 92, 34), 1, 1], ['LR', v3(-46, 88, 38), -1, -1]];
  targets.forEach(([tid, tg, side, es]) => {
    const t = terminal(F, tid);
    const ps = armIK(t.face, t.B, tg, {...P0, wp: 20}, es);
    const g = armFK(t.face, t.B, ps, side);
    items.push(...armItems(Pj, g, {id: `a${tid}`, led: 1}));
  });
  items.push(boxItem(Pj, 'bench', v3(0, 44, 55), v3(70, 44, 18), {top: ENV.bench, side: ENV.benchSide, front: ENV.benchSide}));
  items.push(cupItem(Pj, 'cup', v3(-40, 88, 50)));
  return (
    <AbsoluteFill style={{background: ENV.wall}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <Room Pj={Pj} />
        <Draw items={items} />
      </svg>
    </AbsoluteFill>
  );
};
