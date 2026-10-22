// V5 site model sheet: the rebuilt Pad 2 basis from three hero angles (wide establishing like footage 06, a medium catch
// view, a low/base view) plus the final-approach camera. props.view selects.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Cam3} from './cam3';
import {MOUNT_TOP, Place, VX, azFor} from './site';
import {Booster} from './vehicles';
import {CatchView, ShipAt} from './shots/common';

export const V5_VIEWS: {name: string; c: Cam3; carY: number; ship?: boolean}[] = [
  {name: 'wide establishing (footage 06 side: beach looking inland)', c: {at: [40, 60, 0], z: 3.0, yaw: 186, pitch: -4}, carY: 130},
  {name: 'medium catch view', c: {at: [VX - 4, 102, 0], z: 9, yaw: -30, pitch: 3}, carY: 98, ship: true},
  {name: 'low / base view', c: {at: [VX - 6, 30, 0], z: 6.5, yaw: -40, pitch: 10}, carY: 98},
  {name: 'aerial (footage 04 side)', c: {at: [40, 0, 0], z: 1.6, yaw: 200, pitch: -40}, carY: 130},
];

export const V5Lab: React.FC<{view: number}> = ({view}) => {
  const v = V5_VIEWS[view % V5_VIEWS.length];
  const c = v.c;
  return (
    <AbsoluteFill>
      <CatchView t={2} c={c} l="day" s={{carY: v.carY, open: v.ship ? 4 : 22}}
        vehicle={v.ship ? <ShipAt c={c} carY={v.carY} above={0} l="day" props={{t: 2, id: 'l5s'}} /> : <Place c={c} p={[VX, MOUNT_TOP + 0.6, 0]}><Booster az={azFor(c, 0)} pal="day" t={2} id="l5b" /></Place>}
      />
      <div style={{position: 'absolute', left: 30, top: 24, color: '#fff', font: '700 34px sans-serif', textShadow: '0 2px 6px #000'}}>{v.name}</div>
    </AbsoluteFill>
  );
};
