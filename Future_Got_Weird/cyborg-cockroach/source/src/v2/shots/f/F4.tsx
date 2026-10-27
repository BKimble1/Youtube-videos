// F4 (848-872, "you might"): over her right shoulder. Her head (the back of the bob, her ear and cheek), her shoulder
// and her tense near hand lie large and soft in the near foreground at the left; beyond them, in focus, the medic has
// just crawled out of the hole in the broken slab and comes across the narrow rubble ledge over the crevice, toward her
// hand and the camera, its loaded injector on its back. Its weight shows in the walk: the body sags a little on each
// supporting tripod and rises as the next one plants, the feet planted, the legs cycling. Her head tips a fraction as
// she follows it. Static camera: everything is one orthographic view of the same pocket (her card projection, seen
// from behind her right shoulder), so the hole, the ledge, her hand and the insect keep F2/F3/F5's geography.
import React from 'react';
import {Roach2D} from '../../roach/Roach2D';
import {Gear2D} from '../../roach/Gear2D';
import {P} from '../../roach/ortho';
import {Survivor, survivorLayout} from '../../../crew/person';
import {keys, sr} from '../../../lib/ease';
import {RB, Pt, Pebbles, Motes, Glow2, VGrad, Vignette, Shaft, Grit, poly} from '../e/art';
import {Block, blockClipD, HoleShadow, Crevice, Ledge, CK} from './crack2';
import {FF, faceTrack, herOpts, Acting, NearHand} from './pocket';
import {medicPose, R4, FPS, SLAB, SC, MM_U, Place, cfViewAt, cardPxAt, onBody, BARREL} from './world';
import {ShotProps} from '../index2';

/** the over-the-shoulder placement of her card projection (yaw 158: from behind her right shoulder; elevation 60:
 *  looking down past her head at the floor ahead), 9.5 px per rig unit (the insect about 300 px long) */
export const PL4: Place = {x: -235, y: 1718, scale: 9, yaw: 150, elev: 60};
/** grit shaken off the slab's lip above the hole (shot seconds) */
export const F4_GRIT = {t0: 0.12, dur: 0.5};
/** her held breath: a small breath in (shot frames) */
export const F4_K = {breath0: 6, breath1: 16};

export const F4: React.FC<ShotProps> = ({f, lf}) => {
  const T = f / FPS, t = lf / FPS;
  const sid = `f4f${f}`; // SVG ids unique per shot and frame
  const v = cfViewAt(PL4);
  const pose = medicPose(T);
  const q = (x: number, y: number, z: number): Pt => P(v, [x, y, z]) as Pt;
  const cp = (X: number, Y: number, Z: number): Pt => cardPxAt(PL4, X, Y, Z) as Pt;
  // her floor (card-local u), the slit along the slab's face toward her right (crack frame, z = CK.zL)
  const floor: Pt[] = [cp(-900, 0, -700), cp(900, 0, -700), cp(900, 0, 900), cp(-900, 0, 900)];
  const sl0 = -((SLAB.slit0 - SLAB.z0) * MM_U) / SC, sl1 = -((SLAB.slit1 - SLAB.z0) * MM_U) / SC, gap = (SLAB.gap * MM_U) / SC;
  const slit: Pt[] = [q(sl0, 0, CK.zL), q(sl1, 0, CK.zL), q(sl1, gap, CK.zL), q(sl0, gap, CK.zL)];
  const fan: Pt[] = [q(sl0, 0, CK.zL), q(sl1, 0, CK.zL), q(sl1 - 20, 0, CK.zL - 150), q(sl0 + 10, 0, CK.zL - 150)];
  const lip = q(4, CK.h, -14);
  const dev = q(...onBody(pose, BARREL));
  // her: tense, a little leaned back, watching it come (her face is turned away from us: only the cheek's edge)
  const head = q(pose.frame.o[0] + pose.frame.x[0] * 33, 10, pose.frame.o[2] + pose.frame.x[2] * 33);
  const a: Acting = {
    recog: 0, recoil: 0.3, handOpen: 0.12, gaze: {x: head[0], y: head[1]},
    breath: 0.6 + 0.6 * sr(lf, F4_K.breath0, F4_K.breath1),
    turn: keys(lf, [[0, -14], [24, -16]]), nod: keys(lf, [[0, 10], [24, 13]]), tilt: -2, // (cheated a little away: from behind only her ear and the edge of her cheek show)
    face: faceTrack(lf, [[0, FF.unease]]),
  };
  const o = {...herOpts(T, a), x: PL4.x, y: PL4.y, scale: PL4.scale, yaw: PL4.yaw, elev: PL4.elev};
  const L = survivorLayout(o);
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <VGrad id={`${sid}bg`} x0={0} y0={-100} x1={0} y1={2000} stops={[[0, '#2B292D'], [1, '#1B1A1D']]} />
      <path d={poly(floor)} fill="#6C6560" />
      <Glow2 id={`${sid}fl`} cx={640} cy={1050} rx={620} ry={420} color={RB.day} a={0.42} />
      <Pebbles id={`${sid}p1`} a={cp(-150, 0, 40)} b={cp(-60, 0, 150)} n={6} size={26} seed={41} tone={RB.concLit} w={4} dark={0.15} />
      <Pebbles id={`${sid}p2`} a={cp(40, 0, 150)} b={cp(140, 0, 230)} n={5} size={24} seed={42} tone={RB.concLit} w={4} dark={0.2} />
      <Pebbles id={`${sid}p3`} a={q(170, 0, 60)} b={q(200, 0, 140)} n={4} size={22} seed={43} tone={RB.concLit} w={4} dark={0.15} />
      <Crevice id={`${sid}cv`} v={v} w={5} />
      <path d={poly(fan)} fill={RB.day} opacity={0.3} />
      <Ledge id={`${sid}le`} v={v} w={5} />
      <Block id={`${sid}bl`} v={v} w={5} dark={0.05} />
      <path d={poly(slit)} fill={RB.dayHot} />
      <Glow2 id={`${sid}lg`} cx={q(90, 0, 0)[0]} cy={q(90, 0, 0)[1]} rx={330} ry={200} color={RB.day} a={0.3} />
      <Grit t={t} x={lip[0]} y0={lip[1]} y1={q(10, 0, -14)[1]} t0={F4_GRIT.t0} dur={F4_GRIT.dur} n={8} g={2600} r={4.5} spread={16} seed={44} />
      <g clipPath={`url(#${sid}-ic)`}>
        <defs>
          <clipPath id={`${sid}-ic`} clipRule="evenodd">
            <path d={blockClipD(v)} clipRule="evenodd" />
          </clipPath>
        </defs>
        <Roach2D pose={pose} v={v} o={{id: `${sid}r`, gear: <Gear2D id={`${sid}g`} v={v} f={pose.frame} g={{kind: 'injector'}} />}} />
        <HoleShadow id={`${sid}sh`} v={v} a={0.62} />
      </g>
      <Glow2 id={`${sid}dv`} cx={dev[0]} cy={dev[1]} rx={60} ry={40} color="#FFF6DE" a={0.18} />
      <Shaft id={`${sid}shf`} pts={[[640, -100], [1180, -100], [1180, 1300], [380, 1500]]} from={[1000, -60]} to={[600, 1400]} a={0.26} />
      <Motes id={`${sid}m`} t={t + 5} n={20} x0={300} y0={0} x1={1080} y1={1500} r={5} seed={46} a={0.5} />
      {/* her, nearest the camera: soft (out of the focus plane) */}
      <g filter={`url(#${sid}-hb)`}>
        <defs>
          <filter id={`${sid}-hb`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>
        {/* her forearm's and hand's soft contact shadow on the floor (the light from the upper right) */}
        <path d={`M${L.nearElbow.x + 30},${L.nearElbow.y + 40} L${L.nearWrist.x + 40},${L.nearWrist.y + 30} L${L.nearTip.x + 34},${L.nearTip.y + 26}`} stroke="#2A2522" strokeOpacity={0.4} strokeWidth={PL4.scale * 34} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <Survivor id={`${sid}sv`} {...o} />
        <NearHand o={o} />
        <Glow2 id={`${sid}rim`} cx={L.head.x + 260} cy={L.head.y - 260} rx={300} ry={260} color={RB.day} a={0.22} />
      </g>
      <Vignette id={`${sid}vg`} a={0.5} />
    </svg>
  );
};
