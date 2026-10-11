import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C, H, W} from '../theme';
import {Hed} from './type';
import {Street} from './Street';
import {Hero} from './Hero';
import {BehindFx, FrontFx} from './Fx';
import {Bike} from './Bike';
import {GY, ZOOM, camX, vHip, type ArmMode} from './choreo';

/** 1 while the camera is still (the subject outruns a fixed street), 0 once the camera rides with her: afterimages show only in between */
const stillness = (f: number) => Math.max(0, Math.min(1, 1 - (camX(f) - camX(f - 1)) / Math.max(1, vHip(f))));

/** horizontal pan-blur (px) for the street: grows with the camera's speed; none while the camera is still */
const panBlur = (f: number) => Math.min(9, Math.max(0, (camX(f) - camX(f - 1)) * ZOOM * 0.32));

export type OpeningProps = {marker?: boolean; streaks?: boolean; bike?: boolean; ghost?: boolean; armMode?: ArmMode; markerPos?: 'left' | 'center' | 'right'};

/** E-A first-second hook (ghost afterimages are OFF by default: in the frame-0 direction A/B test they lowered correct direction reads from 3/3 to 2/9; kept only as a documented rejected variant) 
 *  : frame 0 is already mid-action. No title card, no establishing shot. */
export const Opening: React.FC<OpeningProps> = ({marker = true, streaks = true, bike = false, ghost = false, armMode = 'up', markerPos = 'center'}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: C.paper}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, transform: `scale(${ZOOM})`, transformOrigin: `540px ${GY}px`}}>
        <Street camX={camX(f)} blur={panBlur(f)} />
        <BehindFx f={f} streaks={streaks} />
        {bike && <Bike f={f} />}
        {ghost && stillness(f) > 0.05 && <Hero f={f - 3} camAt={f} opacity={0.17 * stillness(f)} armMode={armMode} />}
        {ghost && stillness(f) > 0.05 && <Hero f={f - 1.5} camAt={f} opacity={0.3 * stillness(f)} armMode={armMode} />}
        <Hero f={f} armMode={armMode} />
        <FrontFx f={f} />
      </div>
      {marker && (() => {
        const w = 318;
        const x = markerPos === 'left' ? 48 : markerPos === 'right' ? W - 48 - w : (W - w) / 2;
        return (
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0}}>
            <rect x={x + 7} y={307} width={w} height={96} rx={22} fill={C.ink} />
            <rect x={x} y={300} width={w} height={96} rx={22} fill={C.saffron} stroke={C.ink} strokeWidth={5} />
            <Hed x={x + w / 2} y={348} text="WHAT IF" size={68} color={C.ink} shadow={null} ls={3} />
          </svg>
        );
      })()}
    </AbsoluteFill>
  );
};
