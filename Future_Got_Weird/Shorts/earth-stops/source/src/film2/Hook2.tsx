import React from 'react';
import {C, H, W} from '../theme';
import {HED_FONT} from '../fonts4';
import {E} from '../lib/motion';
import {SceneH} from '../v2/SceneH';
import {LAMPS} from '../v2/choreo2';
import {RW0, RW1, bikeXH, sceneFor, toScreenFor, zoomFor} from '../v2/choreoH';
import {ArrowShape, Chip, Leader, SpeedPlate, popScale, ramp} from './ui';
import {WORD, fs, T} from './timeline';

/**
 * B01 hook, V2. The H1 street scene (scene time f + D) with the street full-bleed from frame 0: she is already mid-event (skidding, lunging, coffee leaving the mug) and the
 * inset globe is the cause cue (it is still spinning at f 0 and stops dead at f 3). The causal comparison (lamp post still, bicycle loose) lands at 1.3 s, then ONE rewind
 * ("BEFORE") to the walk, then the speed is introduced on the words: EQUATOR at "equator", an east arrow at "moving", the stable plate at "thousand".
 */
export const HK = {lamp: 38, bike: 43, tagsOff: T.D < 0 ? 0 : RW0 - T.D - 2, rw0: RW0 - T.D, rw1: RW1 - T.D, eq: fs(WORD.equator) - 3, arrow: fs(WORD.moving) - 2, plate: fs(WORD.thousand) - 3, out: 180};
const fH = (f: number) => f + T.D;

const Rewind: React.FC<{f: number}> = ({f}) => {
  if (f < HK.rw0 || f >= HK.rw1 + 2) return null;
  const blink = Math.floor((f - HK.rw0) / 4) % 2 === 0 ? 1 : 0.55;
  const tri = (x: number) => <path d={`M ${x + 34} -24 L ${x} 0 L ${x + 34} 24 Z`} fill={C.ink} />;
  return (
    <g transform="translate(150 430)" opacity={blink}>
      <rect x={-130 + 6} y={-40 + 7} width={260} height={80} rx={20} fill={C.ink} />
      <rect x={-130} y={-40} width={260} height={80} rx={20} fill={C.saffronLight} stroke={C.ink} strokeWidth={5} />
      {tri(-108)}{tri(-68)}
      <text x={42} y={0} dy="0.36em" textAnchor="middle" fontFamily={HED_FONT} fontWeight={800} fontSize={40} letterSpacing={2} fill={C.ink}>BEFORE</text>
    </g>
  );
};

export const Hook2: React.FC<{f: number; graphics: boolean}> = ({f, graphics}) => {
  const st = sceneFor(fH(f));
  const z = zoomFor(st);
  const out = ramp(f, HK.out, HK.out + 10, (x) => x);
  // chips follow the loose bicycle and the anchored lamp post until the rewind
  const bk = toScreenFor(bikeXH(st.s), 1236 - 190, st);
  const lm = toScreenFor(LAMPS[1], 600, st);
  const tagsOff = f < HK.tagsOff ? 1 : Math.max(0, 1 - (f - HK.tagsOff) / 2);
  const bikeOn = Math.min(tagsOff, f < 64 - T.D ? 1 : Math.max(0, 1 - (f - (64 - T.D)) / 4));
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H}}>
      <SceneH f={fH(f)} />
      {graphics && (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          <Leader from={{x: lm.x, y: lm.y - 40 * z + 36}} to={{x: lm.x, y: lm.y + 18}} opacity={popScale(f, HK.lamp) > 0.3 ? tagsOff : 0} />
          <Chip x={lm.x} y={lm.y - 40 * z} w={190} text="0 MPH" tone="still" scale={popScale(f, HK.lamp)} opacity={tagsOff} />
          <Chip x={bk.x} y={bk.y - 85 * z} w={310} text="~1,000 MPH" tone="move" arrow scale={popScale(f, HK.bike)} opacity={bikeOn} />
          <Rewind f={f} />
        </svg>
      )}
    </div>
  );
};
void E;
