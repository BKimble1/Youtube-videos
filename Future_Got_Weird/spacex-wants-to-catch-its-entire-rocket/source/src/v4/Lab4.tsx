// V4 site model sheet: the rebuilt Starbase pad from the authored camera positions (props.view).
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Cam3} from './cam3';
import {MOUNT_TOP, Place, VX, azFor} from './site';
import {Booster, BOOSTER_LEN, Ship} from './vehicles';
import {CatchView} from './shots/common';

export const V4_VIEWS: {name: string; c: Cam3; carY: number}[] = [
  {name: 'oblique site', c: {at: [-6, 38, -10], z: 3.6, yaw: -38, pitch: -13}, carY: 130},
  {name: 'low toward arms', c: {at: [16, 96, 0], z: 6.5, yaw: -24, pitch: 9}, carY: 98},
  {name: 'mechanism', c: {at: [20, 100, 0], z: 15, yaw: 26, pitch: 2}, carY: 98},
  {name: 'from the sea', c: {at: [6, 70, -60], z: 2.6, yaw: 168, pitch: -4}, carY: 130},
  {name: 'ground level', c: {at: [10, 60, 0], z: 4.2, yaw: -12, pitch: 6}, carY: 130},
];

export const V4Lab: React.FC<{view: number}> = ({view}) => {
  const v = V4_VIEWS[view % V4_VIEWS.length];
  const c = v.c;
  return (
    <AbsoluteFill>
      <CatchView t={2} c={c} l="day" s={{carY: v.carY, open: 22}}
        vehicle={<Place c={c} p={[VX, MOUNT_TOP + 0.6, 0]}><Booster az={azFor(c, 0)} pal="day" t={2} id="lb" /></Place>}
      />
      <div style={{position: 'absolute', left: 30, top: 24, color: '#fff', font: '700 34px sans-serif', textShadow: '0 2px 6px #000'}}>{v.name}</div>
    </AbsoluteFill>
  );
};
export {Ship, BOOSTER_LEN};

// Pose check for the world-driven ship: tiled side must face the physically correct way in each view.
import {ShipWorld} from './shots/common';
import {Frame, Sky} from './scene';
const POSES: {c: Cam3; theta: number; note: string}[] = [
  {c: {at: [0, 300, 0], z: 9, yaw: 90, pitch: 0}, theta: 90, note: 'upright, eye at −X: tiles face camera'},
  {c: {at: [0, 300, 0], z: 9, yaw: 0, pitch: 0}, theta: 90, note: 'upright, eye at +Z: tiles on screen-left'},
  {c: {at: [0, 300, 0], z: 9, yaw: 0, pitch: 25}, theta: 0, note: 'belly-flop, eye below: tiles at bottom'},
  {c: {at: [0, 300, 0], z: 9, yaw: 0, pitch: 0}, theta: 45, note: 'mid-flip, eye at +Z'},
];
export const V4Pose: React.FC<{i: number}> = ({i}) => {
  const p = POSES[i % POSES.length];
  return (
    <AbsoluteFill>
      <Frame><Sky k="day" /><ShipWorld c={p.c} p={[0, 300, 0]} theta={p.theta} l="day" props={{flapFwd: 30, flapAft: 30}} /></Frame>
      <div style={{position: 'absolute', left: 30, top: 24, color: '#fff', font: '700 34px sans-serif', textShadow: '0 2px 6px #000'}}>{p.note}</div>
    </AbsoluteFill>
  );
};
