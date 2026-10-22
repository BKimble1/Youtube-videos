import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Starship} from './assets/Starship';
import {SuperHeavy, BOOSTER_CATCH_Y} from './assets/SuperHeavy';
import {Tower, CATCH_X} from './assets/Tower';
import {PlanView} from './assets/Plan';
import {Sky, Coast} from './assets/Env';
import {Svg} from './kit/ui';
import './fonts';

// Model sheet for checking the hardware drawings (not part of the film).
export const Sheet: React.FC<{page: number}> = ({page}) => {
  const armShip = -640;
  const armB = -820;
  return (
    <AbsoluteFill style={{background: '#0d1220'}}>
      <Svg>
        {page === 0 && (
          <g>
            <g transform="translate(160 760) scale(1.2)"><Starship /></g>
            <g transform="translate(420 760) scale(1.2)"><Starship fwd={25} aft={-20} burn={1} t={3} catchPoints /></g>
            <g transform="translate(760 820) scale(0.95)"><SuperHeavy /></g>
            <g transform="translate(1000 820) scale(0.95)"><SuperHeavy burn="center3" fin={30} t={4} /></g>
            <g transform="translate(1240 820) scale(0.95)"><SuperHeavy burn="inner13" t={4} /></g>
            <g transform="translate(1700 760) rotate(-90) scale(1.2)"><Starship plasma={1} fwd={10} aft={-10} /></g>
          </g>
        )}
        {page === 1 && (
          <g>
            <Sky kind="dusk" sun={{x: 1500, y: 900}} />
            <g transform="translate(300 1000) scale(0.6)">
              <Coast />
              <Tower layer="back" armY={armShip} open={0} />
              <g transform={`translate(${CATCH_X} ${armShip - 3 + 348})`}><Starship catchPoints /></g>
              <Tower layer="front" armY={armShip} open={0} />
            </g>
            <g transform="translate(1100 1000) scale(0.6)">
              <Tower layer="back" armY={armB} open={0.0} />
              <g transform={`translate(${CATCH_X} ${armB - 3 - BOOSTER_CATCH_Y})`}><SuperHeavy /></g>
              <Tower layer="front" armY={armB} open={0} />
            </g>
            <g transform="translate(1500 1000) scale(0.6)">
              <Tower layer="back" armY={armB} open={1} />
              <Tower layer="front" armY={armB} open={1} />
            </g>
          </g>
        )}
        {page === 2 && (
          <g>
            <g transform="translate(150 300) scale(1.1)"><PlanView open={0} vehicle="booster" /></g>
            <g transform="translate(700 300) scale(1.1)"><PlanView open={0.8} vehicle="ship" /></g>
            <g transform="translate(1250 300) scale(1.1)"><PlanView open={0} vehicle="ship" vz={30} ghost bad /></g>
            <g transform="translate(150 800) scale(1.1)"><PlanView open={0.4} vehicle="booster4" armL={380} /></g>
          </g>
        )}
      </Svg>
    </AbsoluteFill>
  );
};
