// D2 (496-517, "fire the"): extreme close-up in profile (az 0, el 3) on the launch tube and the clear target's face:
// the tube shows the compressed spring, the loaded injector (amber dose), the collar, the needle and the latch line
// across the mouth. The coil is already hot as the shot opens (the operator pressed in DT); at 16.60 s (frame 498) it
// parts the line (a spark, the tails whip back, a wisp of smoke), and the spring drives the injector forward along the
// tube (16.60-16.77 s, gaining speed, crisp streaks behind it; the spring follows it to its free length and rings there),
// the needle meets the clear silicone (16.77 s): the block squashes toward its backing plate and wobbles, rings spread
// round the entry, the needle goes 5 mm in, the injector rebounds a little and seats, the barrel's rear still in the
// tube; the body recoils on its planted feet and settles. The camera holds, then travels with the injector toward the
// target (one move, driven by the launch) and stops with it.
import React from 'react';
import {sr} from '../../../lib/ease';
import {Roach2D} from '../../roach/Roach2D';
import {Gear2D} from '../../roach/Gear2D';
import {viewAt, View} from '../../roach/ortho';
import {Target2D} from '../../sets/Lab2';
import {ShotProps} from '../index2';
import {dPoseFull, dGear, dLaunch, D_FACE, D_FIRE, D_IMPACT, D_TUBE_Y} from './trial';
import {LabRoomMM} from './room';
import {Streaks, Spark, Rings, squashT, InjectorRead} from './fx';
import {InsideNeedle} from './inside';

export const D2_AZ = 0, D2_EL = 3;
export const D2_S = 22;
/** the look point along the tube: one framing holds the coil at the mouth, the loaded needle at the centre, the gap,
 *  the target's face and the block beyond it, so the injector visibly crosses the frame to the face (the spring
 *  stretching out behind it at the left edge); after the launch the camera eases on a little with the injector */
export const d2LookX = (t: number) => 31 + 1.5 * sr(t, D_FIRE, D_IMPACT + 0.3);
export const d2View = (f: number): View => viewAt(D2_AZ, D2_EL, D2_S, [d2LookX(f / 30), D_TUBE_Y, 0], 540, 900);

export const D2Scene: React.FC<{t: number; v: View; id: string}> = ({t, v, id}) => {
  const pose = dPoseFull(t);
  const g0 = dGear(t);
  // the coil's glow kept small at this scale (the hot wire reads by its colour, not a halo)
  const g = {...g0, heat: 0.45 * (g0.heat ?? 0)};
  const d = dLaunch(t);
  const inj = dPoseFull(D_FIRE, false).frame;
  const sq = squashT(v, d.squash);
  const tgt = (veil?: number) => (
    <g transform={sq}>
      <Target2D id={`${id}t${veil ? 'v' : ''}`} v={v} face={D_FACE} dir={1} dent={!veil && d.impact >= 0 ? 1 : 0} entryY={D_TUBE_Y} veil={veil} />
    </g>
  );
  return (
    <g>
      {tgt()}
      <Roach2D
        pose={pose}
        v={v}
        o={{id: `${id}r`, gear: (
          <g>
            <Gear2D id={`${id}g`} v={v} f={pose.frame} g={g} />
            <Streaks v={v} frame={inj} rear={d.injRear} k={d.speed} />
            <InjectorRead v={v} frame={inj} rear={d.injRear} />
            <Spark v={v} frame={pose.frame} t={t} />
          </g>
        )}}
      />
      {tgt(0.62)}
      {/* the needle's run inside the clear silicone, seen through it */}
      {d.impact >= 0 && <InsideNeedle id={`${id}in`} v={v} inj={inj} injRear={d.injRear} face={D_FACE} bloom={0} seen={0.6} />}
      <Rings v={v} imp={d.impact} />
    </g>
  );
};

export const D2: React.FC<ShotProps> = ({f}) => {
  const t = f / 30;
  const v = d2View(f);
  const id = `d2f${f}`;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <LabRoomMM id={`${id}room`} v={v} blur={9} plate={1.7} tray={[-400, 400, -300, 420]} />
      <D2Scene t={t} v={v} id={id} />
    </svg>
  );
};
