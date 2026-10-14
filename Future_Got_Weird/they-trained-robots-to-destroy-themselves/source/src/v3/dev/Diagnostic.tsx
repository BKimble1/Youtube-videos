// Diagnostic sequence (neutral lighting): stand beside a block face, walk past it, walk on the platform top, crouch,
// arm swing, launch, descent, landing, all under a full camera orbit. Used to validate root heights, foot contact,
// collision clearance and occlusion (robot vs block faces vs railing) before cinematic lighting is applied.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {makeProj, orbit} from '../engine/camera';
import {norm, smooth, clamp01, mix} from '../engine/math';
import {Env, Item, box, line3, quad, tube} from '../engine/prims';
import {Scene3D} from '../engine/Scene3D';
import {STAND, blendPose, walkPose} from '../robot/motion';
import {Pose} from '../robot/rig';
import {makeTrial} from '../robot/trial';
import {ModelKind} from '../robot/model';

export const DIAG_FRAMES = 30 * 10;
const ENV: Env = {light: norm([-0.4, 0.85, 0.45]), ambient: 0.62, ink: '#20262C', lineW: 2};
const FLOOR = 0, TOP = 160, EDGE = -40, PW = 360; // platform: x from EDGE - PW to EDGE, top at TOP

const pose = (t: number): Pose => {
  if (t < 1) return STAND([EDGE + 46, 95.4, 110], Math.PI / 2);                     // standing beside the block face
  if (t < 3) return walkPose([EDGE + 46, 0, 110], -Math.PI / 2, (t - 1) * 0, FLOOR); // placeholder (replaced below)
  return STAND([0, 95.4, 0], 0);
};

const set = (pr: ReturnType<typeof makeProj>): Item[] => {
  const items: Item[] = [];
  const fl = quad(pr, ENV, 'fl', [[-900, FLOOR, -700], [900, FLOOR, -700], [900, FLOOR, 700], [-900, FLOOR, 700]], '#C9CDD2', {stroke: false});
  if (fl) items.push({...fl, z: 1e6});
  for (let i = -8; i <= 8; i++) {
    items.push({...line3(pr, 'gx' + i, [[i * 100, 0.5, -700], [i * 100, 0.5, 700]], '#AEB4BB', 1.4), z: 1e6 - 1});
    items.push({...line3(pr, 'gz' + i, [[-900, 0.5, i * 80], [900, 0.5, i * 80]], '#AEB4BB', 1.4), z: 1e6 - 1});
  }
  items.push(...box(pr, ENV, 'plat', {c: [EDGE - PW / 2, TOP / 2, 0], size: [PW, TOP, 240], color: '#9AA3AD', top: '#B7BEC6'}));
  // railing along the platform's far side
  for (let k = 0; k < 4; k++) items.push(tube(pr, ENV, 'rp' + k, [EDGE - PW + 30 + k * 100, TOP, -110], [EDGE - PW + 30 + k * 100, TOP + 100, -110], 3, '#E2A93B', {plane: [0, 0, 1]}));
  items.push(tube(pr, ENV, 'rr', [EDGE - PW + 20, TOP + 100, -110], [EDGE - 30, TOP + 100, -110], 3, '#E2A93B', {plane: [0, 0, 1]}));
  // a second, tall block the robot walks past on the floor
  items.push(...box(pr, ENV, 'blk', {c: [260, 110, -120], size: [140, 220, 140], color: '#8C96A1', top: '#A9B2BC'}));
  return items;
};

export const Diagnostic: React.FC<{kind?: ModelKind}> = ({kind = 'F02'}) => {
  const f = useCurrentFrame();
  const t = f / 30;
  let p: Pose;
  if (t < 1.0) p = STAND([EDGE + 46, 95.4, 110], Math.PI / 2);
  else if (t < 3.0) {
    // walk along +x on the floor, passing the platform's end face and the tall block (clearance 40+ cm)
    p = walkPose([EDGE + 30, 0, 110], Math.PI / 2, (t - 1) * 110, FLOOR, {stride: 58});
  } else if (t < 4.6) {
    // on the platform top: walk to the edge (toes stop at the edge)
    const d = Math.min(1.2 * 100, (t - 3) * 90);
    p = walkPose([EDGE - PW + 60, 0, 0], Math.PI / 2, d, TOP, {stride: 56});
    if (t > 4.3) {
      const s = STAND([EDGE - 30, TOP + 95.4, 0], Math.PI / 2);
      p = blendPose(p, s, smooth(clamp01((t - 4.3) / 0.3)));
    }
  } else {
    // crouch, arm swing, launch, descent, landing on the floor
    const tr = makeTrial({edgeX: EDGE, deckY: TOP, floorY: FLOOR, lateral: 0, landX: EDGE + 150, landing: 'stick', T: 0.6});
    p = tr.at(t - 4.6 - 0.9).pose;
  }
  const cam = orbit([EDGE + 40, 120, 0], 620, mix(25, 385, t / 10), 140, 42);
  const pr = makeProj(cam);
  return (
    <AbsoluteFill style={{background: '#E9ECEF'}}>
      <Scene3D pr={pr} bg={<rect width={1920} height={1080} fill="#E9ECEF" />} items={set(pr)} robots={[{id: 'diag', pose: p, kind, light: {dir: norm([-0.4, 0.85, 0.45])}}]} frame={f} />
      <div style={{position: 'absolute', left: 30, top: 24, fontFamily: 'monospace', fontSize: 28, color: '#333'}}>DIAG {kind} t={t.toFixed(2)}</div>
    </AbsoluteFill>
  );
};
void pose;
