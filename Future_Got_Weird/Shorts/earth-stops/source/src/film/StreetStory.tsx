import React from 'react';
import {C, H, W} from '../theme';
import {Street2} from '../v2/Street2';
import {BikeWorld} from '../v2/Bike2';
import {GYW} from '../v2/choreo2';
import {BIKE_Y} from '../v2/choreo2';
import {Cat, CALM, HeroAt, Pigeon, ramp} from './ui';
import {T} from './timeline';
import {HERO_X, camStory, camStoryVel} from './street';
import {B02bGraphics} from './B02';
import {B03Graphics, PlazaWorld, bikeAng3, bikeTilt3, bikeX3} from './B03';

/** B02b + B03: one continuous street. She stands (calm, mug level) among the lamp, bicycle, cat, pigeon; then the camera whips east to the plaza. */
export const StreetStory: React.FC<{f: number; graphics: boolean}> = ({f, graphics}) => {
  const cam = camStory(f);
  const v = camStoryVel(f);
  const blur = Math.min(14, Math.abs(v) * cam.z * 0.3);
  const op = ramp(f, T.zoomB - 11, T.zoomB - 3, (x) => x);
  const flap = f * 0.9;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, opacity: op}}>
      <Street2 camX={cam.x} z={cam.z} blur={blur} pad={420}>
        <BikeWorld f={0} at={{x: bikeX3(f), ang: bikeAng3(f), tilt: bikeTilt3(f)}} />
        <g transform={`translate(0 0)`}><Cat x={720} y={GYW + 8} s={1.55} look={0.4} /></g>
        <Pigeon x={650} y={584} s={1.25} flap={flap} />
        <PlazaWorld f={f} />
      </Street2>
      <HeroAt pose={CALM(f)} hipX={HERO_X} camX={cam.x} z={cam.z} sway={f * 0.1} />
      {graphics && (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          <B02bGraphics f={f} camX={cam.x} z={cam.z} />
          <B03Graphics f={f} />
        </svg>
      )}
    </div>
  );
};
void C; void BIKE_Y;
