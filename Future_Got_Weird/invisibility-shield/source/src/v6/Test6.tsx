// V4 layout test still (development only): the corridor and both cards from a few camera set-ups.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BODY_G, BODY_P, GUARD, PERSON} from './cast6';
import {Crew4} from './Crew6';
import {Corridor4} from './Corridor6';
import {basis, Cam, cardOf, v3} from './geo6';
import {LAY} from './layout6';
import {crouch, FACES, stand} from './poses6';

const CAMS: Record<string, Cam> = {
  side: {pos: v3(-1.2, 1.0, LAY.zp - 0.6), yaw: 90, pitch: 0, f: 820, cx: 540, cy: 1000},
  pov: {pos: v3(LAY.gx, 1.55, LAY.zp - 2.3), yaw: 0, pitch: -6, f: 1100, cx: 540, cy: 900},
  open: {pos: v3(0.85, 1.05, 7.2), yaw: 205, pitch: 0, f: 900, cx: 540, cy: 980},
};
export const Test4: React.FC<{cam: string}> = ({cam}) => {
  const plate = cam.startsWith('plate_');
  const b = basis(CAMS[plate ? cam.slice(6) : cam] ?? CAMS.side);
  const her = cardOf(b, v3(LAY.xp, 0, LAY.zp), 180);
  const g = cardOf(b, v3(LAY.gx, 0, LAY.zp - 1.6), 0);
  const items = [
    {d: her.depth, n: <Crew4 key="w" id="w" look={PERSON} b={BODY_P} pose={crouch(BODY_P)} cd={her} />},
    {d: g.depth, n: <Crew4 key="g" id="g" look={GUARD} b={BODY_G} pose={stand(BODY_G, FACES.gSearch)} cd={g} />},
  ].filter((x) => x.d > 0.3 && !plate).sort((a, c) => c.d - a.d);
  return (
    <AbsoluteFill style={{backgroundColor: '#0A151B'}}>
      <svg width={1080} height={1920}>
        <Corridor4 b={b} />
        {items.map((i) => i.n)}
      </svg>
    </AbsoluteFill>
  );
};
