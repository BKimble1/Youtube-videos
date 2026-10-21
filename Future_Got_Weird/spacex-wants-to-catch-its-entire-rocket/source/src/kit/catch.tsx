// The catch set-piece, reused by the hook, the booster section, the tower section and the payoff.
// A vehicle descends between the arms until its catch points meet the top rail of the near arm.
import React from 'react';
import {Cam} from '../assets/env';
import {Booster, Ship, boosterCatchY, shipCatchY, shipCatchX} from '../assets/vehicles';
import {VEH_X} from '../assets/tower';
import {Light, TowerSet} from './scene';

export type CatchState = {
  gap: number;          // metres between catch points and rail (0 = resting on the arms)
  dx?: number;          // lateral offset from the centreline (m)
  tilt?: number;        // degrees
  open: number;         // arm opening angle (deg)
  engines?: number;     // 0..1
  plumeLen?: number;
};

export const CATCH_Y = -100; // rail level for ship catches (metres above ground; illustrative)
export const BOOSTER_RAIL_Y = (v: 'v3' | 'v1') => -(72 - 9.5) + 0.55 - 14 + 0.0; // booster resting on its mount ⇔ catch level

/** World position of the ship catch point for a given state. */
export const shipPinWorld = (s: CatchState, carY = CATCH_Y) => ({x: VEH_X + (s.dx ?? 0) + shipCatchX, y: carY - s.gap});

export const ShipCatch: React.FC<{t: number; cam: Cam; light: Light; s: CatchState; carY?: number; catchPts?: number; flapTrim?: number; clouds?: boolean; foreground?: React.ReactNode; heat?: number}> = ({
  t, cam, light, s, carY = CATCH_Y, catchPts = 0, flapTrim = 0, clouds = true, foreground, heat = 0,
}) => {
  const baseY = carY - s.gap - shipCatchY;
  const vehicle = (
    <g transform={`translate(${VEH_X + (s.dx ?? 0)} ${baseY}) rotate(${s.tilt ?? 0} 0 ${shipCatchY})`}>
      <Ship t={t} view="profile" light={light} engines={s.engines ?? 0} plumeLen={s.plumeLen ?? 32} fwdFlap={0.55} aftFlap={0.62} flapTrim={flapTrim} catchPts={catchPts} heat={heat} />
    </g>
  );
  return <TowerSet cam={cam} light={light} carY={carY} openNear={s.open} openFar={s.open} vehicle={vehicle} t={t} clouds={clouds} foreground={foreground} />;
};

export const BoosterCatch: React.FC<{t: number; cam: Cam; light: Light; s: CatchState; version?: 'v3' | 'v1'; carY?: number; catchHighlight?: number; finDeflect?: number; clouds?: boolean; armLen?: number; ghostOldArms?: number; foreground?: React.ReactNode}> = ({
  t, cam, light, s, version = 'v3', carY, catchHighlight = 0, finDeflect = 0, clouds = true, armLen, ghostOldArms, foreground,
}) => {
  const cy = boosterCatchY(version);
  const rail = carY ?? -80;
  const baseY = rail - s.gap - cy;
  const vehicle = (
    <g transform={`translate(${VEH_X + (s.dx ?? 0)} ${baseY}) rotate(${s.tilt ?? 0} 0 ${cy})`}>
      <Booster t={t} version={version} light={light} engines={s.engines ?? 0} plumeLen={s.plumeLen ?? 40} ring="inner" catchHighlight={catchHighlight} finDeflect={finDeflect} scorch={0.6} />
    </g>
  );
  return <TowerSet cam={cam} light={light} carY={rail} openNear={s.open} openFar={s.open} vehicle={vehicle} t={t} clouds={clouds} armLen={armLen} ghostOldArms={ghostOldArms} foreground={foreground} />;
};
