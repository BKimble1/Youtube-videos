// V5 end (frames 876-951): the lab nozzle's outlet (with its fibre) cuts to the imagined wrist shooter's outlet at the
// same place, size and direction: the street pre-roll (Street6 at f - 952): a close-up of the device, its cartridge of
// silk solution, while the hand rises into firing position and the camera pulls out into frame 0's framing, where the
// snap and the shot begin. A short streak of light along the fibre's line carries across the cut. The future-device
// framing is the opening's imagined scene again, not the lab experiment.
import React from 'react';
import {StreetScene6, heroOutlet, scr, streetCam, D_NEAR} from './Street6';
import {LT6} from './labWorld6';

export const EndTransition6: React.FC<{f: number}> = ({f}) => {
  const g = f - 952;
  const k = f - LT6.toDevice;
  let streak: React.ReactNode = null;
  if (k < 7) {
    const o = scr(streetCam(g), D_NEAR, heroOutlet(g).outlet);
    const d = heroOutlet(g).dir;
    const L = 1400;
    const a = {x: o.x - d.x * L * (k / 7), y: o.y - d.y * L * (k / 7)};
    const b = {x: o.x + d.x * 900, y: o.y + d.y * 900};
    streak = (
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        <path d={`M${a.x.toFixed(1)},${a.y.toFixed(1)} L${b.x.toFixed(1)},${b.y.toFixed(1)}`} stroke="#FFFBEA" strokeWidth={10 * (1 - k / 7) + 2} strokeLinecap="round" opacity={0.85 * (1 - k / 7)} />
      </svg>
    );
  }
  return (
    <>
      <StreetScene6 f={g} />
      {streak}
    </>
  );
};
