// Model sheet: every vehicle view and the tower at one scale, for checking consistency between views.
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {Frame, Sky} from '../assets/env';
import {Booster, Ship, shipCatchX, shipCatchY, boosterCatchY} from '../assets/vehicles';
import {Tower, PlanView, VEH_X, Ground} from '../assets/tower';
import {FONT} from '../kit/ui';

const Lbl: React.FC<{x: number; y: number; t: string}> = ({x, y, t}) => (
  <text x={x} y={y} textAnchor="middle" fontFamily={FONT.ui} fontWeight={800} fontSize={20} fill="#1c232b">{t}</text>
);

export const AssetSheet: React.FC = () => {
  const t = useCurrentFrame() / 30;
  const s = 6.2;
  return (
    <Frame bg="#e9edf1">
      <Sky kind="day" />
      <g transform={`translate(110 980) scale(${s})`}><Booster t={t} version="v3" catchHighlight={1} /></g>
      <Lbl x={110} y={1020} t="SH V3 (3 fins)" />
      <g transform={`translate(250 980) scale(${s})`}><Booster t={t} version="v1" /></g>
      <Lbl x={250} y={1020} t="SH V1/V2 (4 fins)" />
      <g transform={`translate(390 980) scale(${s})`}><Ship t={t} view="profile" catchPts={1} /></g>
      <Lbl x={390} y={1020} t="Ship profile" />
      <g transform={`translate(520 980) scale(${s})`}><Ship t={t} view="belly" catchPts={1} /></g>
      <Lbl x={520} y={1020} t="Ship belly" />
      <g transform={`translate(650 980) scale(${s})`}><Ship t={t} view="three" /></g>
      <Lbl x={650} y={1020} t="Ship 3/4" />
      <g transform={`translate(800 680) scale(${s})`}><Ship t={t} view="three" /></g>
      <g transform={`translate(800 980) scale(${s})`}><Booster t={t} version="v3" /></g>
      <Lbl x={800} y={1020} t="Stack" />
      <g transform={`translate(1000 980) scale(${s})`}>
        <Ground />
        <Tower carY={-75} openNear={8} openFar={8} vehicle={<g transform={`translate(${VEH_X} ${-75 - boosterCatchY()})`}><Booster t={t} version="v3" /></g>} />
      </g>
      <g transform={`translate(1350 980) scale(${s})`}>
        <Tower carY={-100} openNear={0} openFar={0} showMount={false} vehicle={<g transform={`translate(${VEH_X - shipCatchX} ${-100 - shipCatchY})`}><Ship t={t} view="profile" catchPts={1} /></g>} />
      </g>
      <g transform={`translate(1500 300) scale(6)`}>
        <PlanView openNear={35} openFar={35} vx={VEH_X} vz={0} />
      </g>
      <g transform={`translate(1500 650) scale(6)`}>
        <PlanView openNear={2} openFar={2} vx={VEH_X} vz={0} ship />
      </g>
    </Frame>
  );
};
