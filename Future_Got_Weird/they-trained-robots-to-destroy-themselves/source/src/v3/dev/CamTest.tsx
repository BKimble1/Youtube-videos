// Dev only: render the foundry (robot #1 on its jump timeline) from arbitrary cameras, one per frame.
//   PROPS='{"shots":[{"tau":0.27,"cam":{"pos":[..],"target":[..],"fov":44}}]}'
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {Cam3} from '../engine/camera';
import {FoundryScene, robot1, postEntry, insideLadle, JUMP1_P1} from '../shots/HookFoundry';

export const CamTest: React.FC<{shots?: {tau: number; cam: Cam3}[]; noSpout?: boolean}> = ({shots = [], noSpout}) => {
  const f = useCurrentFrame();
  (globalThis as any).__dbgNoSpout = !!noSpout;
  const s = shots[Math.min(f, shots.length - 1)];
  if (!s) return null;
  const st = robot1(s.tau);
  const inside = st.phase === 'plunge' || (st.phase === 'air' && insideLadle(st.pose.pos));
  return <FoundryScene cam={s.cam} tau={s.tau} robots={[{pose: st.pose, clipY: st.clipY, id: 'r1', inside}]} entries={[{at: JUMP1_P1, t: postEntry(s.tau), seed: 11}]} />;
};
