// F4 (848-872, "you might"): side view from inside the crevice, at the insect's height: the medic crosses the narrow
// ledge toward her (screen-left, as in the two-shots), its loaded injector on its back, the big slab with the crack
// behind it at the right, the drop below the ledge falling away into the dark, rubble overhead. Tripod gait on the
// narrow strip: the middle legs grip its edges. Its near middle foot lands on a chip at the edge, which breaks off and
// drops into the dark. The camera tracks alongside.
import React from 'react';
import {Roach2D} from '../../roach/Roach2D';
import {Gear2D} from '../../roach/Gear2D';
import {viewAt, View, P} from '../../roach/ortho';
import {Layer, Cam} from '../../dc/camera';
import {rnd} from '../../../lib/ease';
import {INK} from '../../../lib/ink';
import {RB, Pt, Slab, Rebar, Pebbles, Motes, Glow2, VGrad, Vignette, Shaft, jag, poly, f2} from '../e/art';
import {Block, Crevice, Ledge, CK, ledgeZ} from './crack2';
import {medicPose, medicX, R4, FPS, SLAB, SC, MM_U, LEDGE} from './world';
import {ShotProps} from '../index2';

const S4 = 5; // px per mm
/** the side view (az 180: from the camera's side of the ledge, -z; +x, the walk, runs screen-left), tracking the
 *  insect: the anchor follows its body a little behind */
export const f4View = (lf: number): View => {
  const T = (R4.from + lf) / FPS;
  const x = medicX(T);
  const x0 = medicX(R4.from / FPS);
  return viewAt(180, 5, S4, [x0 + 0.85 * (x - x0) - 6, 0, 0], 540, 780);
};
/** the chip at the ledge's near edge under the near middle foot (L2 lands on it at shot frame 3.5; it gives way two
 *  frames later and falls) */
export const F4_CHIP = {x: 79, lf: 5.5};
const G = 9810; // mm/s^2

export const F4: React.FC<ShotProps> = ({f, lf}) => {
  const T = f / FPS, t = lf / FPS;
  const sid = `f4f${f}`; // SVG ids unique per shot and frame
  const v = f4View(lf);
  const pose = medicPose(T);
  const q = (x: number, y: number, z: number): Pt => P(v, [x, y, z]) as Pt;
  // the background moves less than the ledge (parallax): a camera for the far layers that follows the same track
  const track = P(v, [0, 0, 0])[0] - P(f4View(0), [0, 0, 0])[0];
  const camFar: Cam = {x: 540 - track, y: 960, z: 1};
  const camNear: Cam = {x: 540 - track, y: 960, z: 1};
  // the chip: sits at the edge, then (pressed by the foot) tips off and falls
  const dt = Math.max(0, t - F4_CHIP.lf / FPS);
  const ze = ledgeZ(F4_CHIP.x)[0];
  const chip = q(F4_CHIP.x + 4 * dt, -0.5 * G * dt * dt, ze - 2 - 30 * dt);
  const rot = 900 * dt;
  const ledgeTop = q(0, 0, 0)[1];
  const sl0 = -((SLAB.slit0 - SLAB.z0) * MM_U) / SC, sl1 = -((SLAB.slit1 - SLAB.z0) * MM_U) / SC, gap = (SLAB.gap * MM_U) / SC;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <VGrad id={`${sid}bg`} x0={-100} y0={-100} x1={1180} y1={2100} stops={[[0, '#2F2D31'], [0.45, '#232125'], [1, '#0C0B0C']]} />
      {/* far: the pocket beyond (dim broken concrete, the daylight from the upper right), slower */}
      <Layer cam={camFar} depth={2.2}>
        <Slab id={`${sid}far`} face={jag([[-300, 260], [1500, 160], [1500, 900], [-300, 960]], 16, 51, 80)} tone="#4D4A4F" w={5} dark={0.45} specks={22} cracks={[[[300, 400], [360, 560], [330, 700]]]} />
        <Glow2 id={`${sid}fg`} cx={760} cy={700} rx={700} ry={260} color={RB.day} a={0.22} />
      </Layer>
      {/* the floor beyond the crevice (her side), seen nearly edge-on */}
      <path d={poly([q(-400, 0, LEDGE.zF + 82), q(600, 0, LEDGE.zF + 82), q(600, 0, 1200), q(-400, 0, 1200)])} fill="#5F5853" />
      <Crevice id={`${sid}cv`} v={v} w={4} near={false} />
      {/* the crevice's far wall falling away below the ledge: broken concrete, a wedged chunk, then the dark */}
      <Slab id={`${sid}fw`} face={jag([q(-300, -2, LEDGE.zF + 82), q(500, -2, LEDGE.zF + 82), q(500, -330, LEDGE.zF + 82), q(-300, -330, LEDGE.zF + 82)], 10, 63, 60)} tone="#4A4643" w={4} dark={0.35} specks={26} cracks={[[q(40, -40, 118), q(60, -110, 118), q(30, -190, 118)], [q(-120, -60, 118), q(-90, -150, 118)]]} />
      <Pebbles id={`${sid}wd`} a={q(-60, -175, 100)} b={q(160, -185, 100)} n={6} size={34} seed={64} tone={RB.concDark} w={4} dark={0.4} />
      <VGrad id={`${sid}dk`} x0={-100} y0={q(0, -60, 0)[1]} x1={1180} y1={2000} stops={[[0, 'rgba(8,7,7,0)'], [0.55, 'rgba(8,7,7,0.75)'], [1, 'rgba(8,7,7,0.95)']]} />
      <Ledge id={`${sid}le`} v={v} w={4} />
      <Block id={`${sid}bl`} v={v} w={4} dark={0.05} />
      <path d={poly([q(sl0, 0, CK.zL), q(sl1, 0, CK.zL), q(sl1, gap, CK.zL), q(sl0, gap, CK.zL)])} fill={RB.dayHot} />
      <Glow2 id={`${sid}lg`} cx={q(70, 0, 0)[0]} cy={ledgeTop - 20} rx={520} ry={140} color={RB.day} a={0.35} />
      <Roach2D pose={pose} v={v} o={{id: `${sid}r`, gear: <Gear2D id={`${sid}g`} v={v} f={pose.frame} g={{kind: 'injector'}} />}} />
      {/* the chip and two grains breaking off with it */}
      <g transform={`rotate(${f2(rot)} ${f2(chip[0])} ${f2(chip[1])})`}>
        <path d={poly([[chip[0] - 9, chip[1] - 4], [chip[0] - 2, chip[1] - 9], [chip[0] + 9, chip[1] - 5], [chip[0] + 8, chip[1] + 5], [chip[0] - 5, chip[1] + 7]])} fill={RB.concLit} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      </g>
      {dt > 0 && [0, 1, 2].map((i) => {
        const d2 = Math.max(0, dt - 0.03 * i);
        const g = q(F4_CHIP.x - 6 + 6 * i + (rnd(i, 4) - 0.5) * 10 * d2, -0.5 * G * d2 * d2, ze - 1);
        return <circle key={i} cx={f2(g[0])} cy={f2(g[1])} r={3} fill={RB.dust} opacity={0.9} />;
      })}
      <Shaft id={`${sid}sh`} pts={[[620, -100], [1180, -100], [900, 1300], [300, 1250]]} from={[950, -60]} to={[600, 1280]} a={0.28} />
      <Motes id={`${sid}m`} t={t + 7} n={20} x0={0} y0={200} x1={1080} y1={1500} r={4.5} seed={15} a={0.5} />
      {/* overhead: the slab's underside, huge, at the top; near: a bent rebar hanging into the crevice, passing */}
      <Slab id={`${sid}ov`} face={jag([[-100, -100], [1180, -100], [1180, 250], [700, 300], [250, 340], [-100, 300]], 14, 52, 60)} under={jag([[-100, 300], [250, 340], [700, 300], [1180, 250], [1180, 280], [700, 330], [250, 372], [-100, 330]], 4, 53, 80)} tone={RB.conc} w={5} dark={0.3} specks={30} rim={[[-100, 300], [250, 340], [700, 300], [1180, 250]]} />
      <Layer cam={camNear} depth={0.5}>
        <g filter={`url(#${sid}blur)`}>
          <defs>
            <filter id={`${sid}blur`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="7" />
            </filter>
          </defs>
          <Slab id={`${sid}nc`} face={jag([[-400, 1620], [80, 1560], [260, 1700], [300, 2100], [-400, 2100]], 20, 61, 70)} top={jag([[-400, 1620], [80, 1560], [260, 1700], [-400, 1700]], 10, 62, 70)} tone="#55524F" w={7} dark={0.6} specks={10} />
          <Rebar pts={[[980, 2100], [1010, 1500], [1090, 1380]]} w={26} dark={0.6} />
        </g>
      </Layer>
      <Vignette id={`${sid}vg`} a={0.55} />
    </svg>
  );
};
