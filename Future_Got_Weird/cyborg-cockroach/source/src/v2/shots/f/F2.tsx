// F2 (793-817, "and something starts"): the crack at close range, from in front and a little to the side (the slab's
// side face with the glowing slit at the right): out of the dark hole at the base of the slab the antennae come first,
// probing, then the head, the front legs reaching out onto the narrow ledge, and the front of the loaded injector on its
// back, into the daylight; a pinch of grit trickles from the crack above the hole as it pushes out. The view follows
// the insect a little as it comes (one slow move).
import React from 'react';
import {Roach2D, Antenna2D, inkFor} from '../../roach/Roach2D';
import {Gear2D} from '../../roach/Gear2D';
import {viewAt, View, P} from '../../roach/ortho';
import {sr, lerp} from '../../../lib/ease';
import {RB, Pt, Slab, Rebar, Pebbles, Motes, Grit, Glow2, VGrad, Vignette, Shaft, jag, poly} from '../e/art';
import {Block, blockClipD, HoleShadow, Crevice, Ledge, CK} from './crack2';
import {medicPose, medicX, R2, FPS, SLAB, SC, MM_U} from './world';
import {ShotProps} from '../index2';

/** the close view: from in front of the hole and to its side (az 136: +x, the walk, runs toward the viewer and screen-left; the slab's
 *  side face toward her right, with the slit, is at screen right), following the head a little */
export const f2View = (lf: number): View => {
  const T = (R2.from + lf) / FPS;
  const u = sr(lf, 0, R2.to - R2.from);
  const follow = 0.45 * (medicX(T) + 30);
  return viewAt(136, 17, 9, [follow, 14, -10], 560, lerp(960, 975, u));
};
/** grit from the crack over the hole as the head pushes out (shot seconds) */
export const F2_GRIT = {t0: 0.4, dur: 0.45};

export const F2: React.FC<ShotProps> = ({f, lf}) => {
  const T = f / FPS, t = lf / FPS;
  const sid = `f2f${f}`; // SVG ids unique per shot and frame
  const v = f2View(lf);
  const pose = medicPose(T);
  const q = (x: number, y: number, z: number): Pt => P(v, [x, y, z]) as Pt;
  // the slit along the slab's side face (crack frame: z = CK.zL, from just behind the face back along -x)
  const sl0 = -((SLAB.slit0 - SLAB.z0) * MM_U) / SC, sl1 = -((SLAB.slit1 - SLAB.z0) * MM_U) / SC, gap = (SLAB.gap * MM_U) / SC;
  const slit: Pt[] = [q(sl0, 0, CK.zL), q(sl1, 0, CK.zL), q(sl1, gap, CK.zL), q(sl0, gap, CK.zL)];
  const fan: Pt[] = [q(sl0, 0, CK.zL), q(sl1, 0, CK.zL), q(sl1 - 20, 0, CK.zL - 120), q(sl0 + 10, 0, CK.zL - 120)];
  const floor: Pt[] = [q(-500, 0, -700), q(700, 0, -700), q(700, 0, 700), q(-500, 0, 700)];
  const gTop = q(2, CK.h - 2, -6);
  const mouth = q(30, 0, 0);
  const ink = inkFor(v);
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <VGrad id={`${sid}bg`} x0={-100} y0={-100} x1={1180} y1={2100} stops={[[0, '#2E2C30'], [1, '#1A191C']]} />
      {/* rubble behind and above the slab, a rim of daylight along its edge */}
      <Slab id={`${sid}r1`} face={jag([[-100, -100], [1180, -100], [1180, 260], [760, 330], [330, 300], [-100, 400]], 14, 3)} tone="#5E5B5F" w={5} dark={0.35} specks={24} rim={[[330, 300], [760, 330], [1180, 260]]} rimColor="#D9C9A6" cracks={[[[420, 60], [470, 160], [450, 260]]]} />
      <Rebar pts={[[880, 300], [850, 420], [900, 500]]} w={14} dark={0.4} />
      <path d={poly(floor)} fill="#6E6762" />
      <Crevice id={`${sid}cv`} v={v} w={5} />
      <Glow2 id={`${sid}pool`} cx={mouth[0] - 60} cy={mouth[1] + 30} rx={620} ry={260} color={RB.day} a={0.7} />
      <Ledge id={`${sid}le`} v={v} w={5} />
      {/* the slit's light on the floor beside the slab */}
      <path d={poly(fan)} fill={RB.day} opacity={0.35} />
      <Block id={`${sid}bl`} v={v} w={5} dark={0.05} />
      <path d={poly(slit)} fill={RB.dayHot} />
      <Grit t={t} x={gTop[0]} y0={gTop[1]} y1={q(0, 0, -6)[1] - 4} t0={F2_GRIT.t0} dur={F2_GRIT.dur} n={9} g={2600} r={4.5} spread={18} seed={12} />
      <g clipPath={`url(#${sid}-ic)`}>
        <defs>
          <clipPath id={`${sid}-ic`} clipRule="evenodd">
            <path d={blockClipD(v)} clipRule="evenodd" />
          </clipPath>
        </defs>
        <Roach2D pose={pose} v={v} o={{id: `${sid}r`, gear: <Gear2D id={`${sid}g`} v={v} f={pose.frame} g={{kind: 'injector'}} />}} />
        <HoleShadow id={`${sid}sh`} v={v} a={0.62} />
      </g>
      {/* the antennae out in the light (the parts in front of the hole's face), over the hole's shadow */}
      {[pose.antL, pose.antR].map((a, i) => {
        const out = a.filter((p) => p[0] > -1);
        return out.length > 1 ? <Antenna2D key={i} v={v} pts={out} ink={ink * 0.75} color="#B9825A" /> : null;
      })}
      <Pebbles id={`${sid}pb`} a={q(150, 0, 90)} b={q(220, 0, 160)} n={4} size={26} seed={21} tone={RB.concLit} w={4} dark={0.2} />
      <Pebbles id={`${sid}pc`} a={q(170, 0, -170)} b={q(240, 0, -120)} n={4} size={28} seed={22} tone={RB.concLit} w={4} dark={0.2} />
      <Shaft id={`${sid}shf`} pts={[[700, -100], [1180, -100], [700, 1500], [160, 1400]]} from={[1000, -60]} to={[420, 1400]} a={0.3} />
      <Motes id={`${sid}m`} t={t + 3} n={22} x0={0} y0={300} x1={1080} y1={1700} r={5} seed={14} a={0.5} />
      {/* near rubble framing the bottom corners */}
      <Slab id={`${sid}f1`} face={jag([[-100, 1600], [240, 1680], [360, 1820], [340, 2020], [-100, 2020]], 14, 31)} top={jag([[-100, 1600], [240, 1680], [360, 1820], [-100, 1740]], 8, 32)} tone="#5D5F66" w={6} dark={0.55} specks={10} />
      <Slab id={`${sid}f2`} face={jag([[840, 1740], [1180, 1640], [1180, 2020], [780, 2020]], 14, 33)} top={jag([[840, 1740], [1180, 1640], [1180, 1720], [820, 1820]], 8, 34)} tone="#6A6B70" w={6} dark={0.55} specks={10} />
      <Vignette id={`${sid}vg`} a={0.5} />
    </svg>
  );
};
