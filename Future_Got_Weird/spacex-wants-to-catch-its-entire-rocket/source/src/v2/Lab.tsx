// Model sheet for the V2 hardware (dev only): ship at several azimuths, both boosters, and the catch set.
import React from 'react';
import {Booster, Ship, ShipEngineView} from './vehicles';
import {CatchSet, Place, VX, azFor, RAIL_DY} from './site';
import {Cam3} from './cam3';
import {Frame, Sky} from './scene';

export const Lab: React.FC<{page?: number}> = ({page = 0}) => {
  if (page === 0) {
    return (
      <Frame bg="#cfd9e2">
        <Sky k="studio" />
        {[0, 35, 70, 90, 135, 180].map((az, i) => (
          <g key={az} transform={`translate(${170 + i * 230} 900) scale(13)`}>
            <Ship az={az} flapFwd={i === 3 ? 30 : 0} flapAft={i === 3 ? 20 : 0} id={`s${i}`} pal="studio" fittings={1} detail />
          </g>
        ))}
        <g transform="translate(1600 1000) scale(10)">
          <Booster az={90} version="v3" id="b3" pal="studio" catchHi={1} />
        </g>
        <g transform="translate(1800 1000) scale(10)">
          <Booster az={60} version="v1" id="b1" pal="studio" catchHi={1} />
        </g>
        <g transform="translate(1720 160) scale(14)">
          <ShipEngineView lit={0.8} hiSea={1} />
        </g>
      </Frame>
    );
  }
  const c: Cam3 = page === 1 ? {at: [10, 75, 0], z: 6.2, yaw: -22, pitch: 4} : {at: [16, 92, 0], z: 13, yaw: 18, pitch: -6};
  const s = {carY: 96, open: page === 1 ? 4 : 18};
  const railY = s.carY + RAIL_DY;
  return (
    <Frame>
      <Sky k={page === 1 ? 'day' : 'dusk'} />
      <CatchSet
        c={c} l={page === 1 ? 'day' : 'dusk'} s={s}
        vehicle={
          <Place c={c} p={[VX, railY - 35.1 + (page === 1 ? 0 : 6), 0]}>
            <Ship az={azFor(c, 90)} pal={page === 1 ? 'day' : 'dusk'} engines={page === 1 ? 0 : 0.7} id="labship" fittings={1} />
          </Place>
        }
      />
    </Frame>
  );
};
