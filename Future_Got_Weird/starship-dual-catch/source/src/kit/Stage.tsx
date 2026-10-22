import React from 'react';
import {Starship, ShipProps} from '../assets/Starship';
import {SuperHeavy, Burn, BOOSTER_CATCH_Y} from '../assets/SuperHeavy';
import {Tower, CATCH_X, ARM_L} from '../assets/Tower';
import {Sky, SkyKind, Coast, SiteSkyline, Clouds} from '../assets/Env';
import {Cam, World, Svg} from './ui';

// The side-view catch set used throughout the film: sky, distant site, tower, vehicle, near arm.
// Vehicle position is given by the world position of its catch point (cx, cy) so contact is exact:
// the arm rail top is at armY - 3, so a vehicle resting on the arms has cy = armY - 3.
export const SHIP_CP = -348; // ship catch point underside (local y)
export const shipYFromCatch = (cy: number) => cy - SHIP_CP;
export const boosterYFromCatch = (cy: number) => cy - BOOSTER_CATCH_Y;

export type StageProps = {
  cam: Cam;
  sky: SkyKind;
  sun?: {x: number; y: number};
  stars?: number;
  armY: number;
  open: number;
  armL?: number;
  vehicle?: 'ship' | 'booster' | 'none';
  vx?: number; // vehicle centre-line x
  cy?: number; // world y of the vehicle's catch point
  tilt?: number; // vehicle tilt, degrees, about its catch point
  ship?: ShipProps;
  burn?: Burn;
  throttle?: number;
  fin?: number;
  t: number;
  hl?: boolean;
  clouds?: number;
  extra?: React.ReactNode; // drawn in world space on top
  behind?: React.ReactNode; // drawn in world space between the tower and the near arm
  qd?: number;
};

export const Stage: React.FC<StageProps> = ({cam, sky, sun, stars = 0, armY, open, armL = ARM_L, vehicle = 'none', vx = CATCH_X, cy = armY - 3, tilt = 0, ship = {}, burn = 'off', throttle = 1, fin = 0, t, hl, clouds = 0.4, extra, behind, qd = 0}) => {
  const veh =
    vehicle === 'ship' ? (
      <g transform={`translate(${vx} ${cy}) rotate(${tilt}) translate(0 ${-SHIP_CP})`}>
        <Starship t={t} {...ship} />
      </g>
    ) : vehicle === 'booster' ? (
      <g transform={`translate(${vx} ${cy}) rotate(${tilt}) translate(0 ${-BOOSTER_CATCH_Y})`}>
        <SuperHeavy burn={burn} throttle={throttle} fin={fin} t={t} />
      </g>
    ) : null;
  const horizon = 540 + (0 - cam.y) * cam.s;
  return (
    <Svg>
      <Sky kind={sky} py={(horizon - 1000) * 0.25} stars={stars} sun={sun} />
      <g transform={`translate(0 ${horizon * 0.12})`}>
        <Clouds y={horizon * 0.55 - 120} dx={-cam.x * 0.08} op={clouds} tone={sky === 'day' ? '#ffffff' : '#f0c8b0'} />
      </g>
      {horizon < 1300 && (
        <g transform={`translate(${960 - cam.x * cam.s * 0.35} ${horizon}) scale(${Math.max(0.25, cam.s * 0.6)})`}>
          <SiteSkyline tone={{day: '#7d93a8', dawn: '#45577a', dusk: '#2b2745', night: '#151b28', high: '#151b28'}[sky]} />
        </g>
      )}
      <World cam={cam}>
        <Coast dusk={sky !== 'day'} />
        <Tower layer="back" armY={armY} open={open} armL={armL} hl={hl} qd={qd} />
        {behind}
        {veh}
        <Tower layer="front" armY={armY} open={open} armL={armL} hl={hl} />
        {extra}
      </World>
    </Svg>
  );
};
