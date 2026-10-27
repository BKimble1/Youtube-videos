// D3 (518-543, "injector."): a brief flat cutaway on D2's last framing (a match cut: the same view, now in section
// through the launch tube, the injector and the clear silicone along the needle's axis). The cut faces are hatched (the
// clear tube's walls, the barrel, the collar, the aluminium cradle), the silicone a pale clear-aqua cut face, the spring
// its wire sections. The needle sits 5 mm into the silicone, the barrel's rear still in the tube. At 17.30 s the foil
// seal on the plunger's activator capsule splits and gas forms behind the plunger (bubbles, a faint fizz); the plunger
// runs forward along the barrel (17.35-17.92 s), the amber dose goes down the needle's bore and diffuses as a small soft
// translucent cloud in the silicone ahead of the tip (complete by about 18.0 s, inside the shot). The insect is drawn whole (its near antenna is
// cut away with the near half). Locked off.
import React from 'react';
import {V2, Frame, toW} from '../../../lib/v3';
import {INK} from '../../../lib/ink';
import {clamp, rnd, noise1, lerp} from '../../../lib/ease';
import {shade as shadeC, lit as litC} from '../../../lib/color';
import {INJ, PACK} from '../../../rig/gear';
import {Roach2D} from '../../roach/Roach2D';
import {Gear2D, G2} from '../../roach/Gear2D';
import {View, P, f2, polyD} from '../../roach/ortho';
import {LAB2} from '../../sets/Lab2';
import {ShotProps} from '../index2';
import {shotRange} from '../../cuts2';
import {dPoseFull, dLaunch, dPlunger, dBloom, D_FACE, D_SEAL, D_PLUNGE0} from './trial';
import {LabRoomMM} from './room';
import {DoseCloud} from './inside';
import {d2View, D2Scene} from './D2';
import {InsideNeedle} from './inside';

const R = shotRange('D3');
/** D2's last framing, held */
/** D2's last framing, then a slow follow of the dose down the needle into the silicone (motivated by the flow) */
export const d3View = (f: number): View => {
  const v = d2View(R.from - 1);
  const u = clamp((f - R.from) / (R.to - R.from));
  const e = u * u * (3 - 2 * u);
  return {...v, ox: v.ox - 7 * v.s * e};
};

/** delivered fraction of the dose (the bloom's volume follows it) */
export const d3Bloom = dBloom;

const HATCH = (id: string, col: string, w = 9) => (
  <pattern id={id} patternUnits="userSpaceOnUse" width={w} height={w} patternTransform="rotate(45)">
    <rect width={w} height={w} fill="none" />
    <path d={`M0,0 V${w}`} stroke={col} strokeWidth={Math.max(1.2, w * 0.18)} />
  </pattern>
);

/** V5: the delivery is shown on the SAME injector drawing as every other shot (no section redraw): D2's framing, the
 *  clear barrel shows the plunger driven forward by the gas behind it (small bubbles at the seal), the dose leaves the
 *  barrel and a soft cloud grows in the clear silicone ahead of the needle tip; the camera follows the dose along
 *  the needle a little */
export const D3: React.FC<ShotProps> = ({f}) => {
  const t = f / 30;
  const v = d3View(f);
  const id = `d3f${f}`;
  const inj: Frame = dPoseFull(t, false).frame;
  const d = dLaunch(t);
  const pl = dPlunger(t);
  const T = PACK.tube;
  const ty = T.a[1];
  // gas bubbles behind the plunger once the seal has opened (inside the clear barrel)
  const g0 = d.injRear + INJ.plungerLen + (INJ.barrelLen - INJ.plungerLen - 1) * pl - INJ.plungerLen;
  const bubbles = t < D_SEAL ? [] : [...Array(7)].map((_, i) => {
    const ph = rnd(i * 7.3) * 6.28;
    const bx = d.injRear + 1.2 + (g0 - d.injRear - 1.2) * ((i * 0.37 + 0.5 * noise1(t * 2 + i, 2) + 0.5) % 1);
    const p = P(v, toW(inj, [bx, ty + 1.2 * Math.sin(ph + t * 9), 1.2 * Math.cos(ph)]));
    return <circle key={i} cx={f2(p[0])} cy={f2(p[1])} r={f2((0.18 + 0.12 * rnd(i)) * v.s)} fill="#FFFFFF" opacity={0.75 * clamp((t - D_SEAL) / 0.1)} />;
  });
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <LabRoomMM id={`${id}room`} v={v} blur={9} plate={1.7} tray={[-400, 400, -300, 420]} />
      <D2Scene t={t} v={v} id={id} />
      <g>{bubbles}</g>
      <InsideNeedle id={`${id}dose`} v={v} inj={inj} injRear={d.injRear} face={D_FACE} bloom={dBloom(t)} seen={0.8} t={t} />
    </svg>
  );
};
