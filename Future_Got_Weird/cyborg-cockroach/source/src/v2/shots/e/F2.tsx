// F2 (800-827, "and something starts"): the crack at close range, seen almost head-on (3/4 front, az 68). Out of the
// dark hole at the base of a broken block the antennae come first, probing, then the head and the front of the insect
// with its front legs reaching out over the lip and finding the floor; a pinch of grit trickles from the crack above
// as it pushes out. One slow push-in.
import React from 'react';
import {Roach2D} from '../../roach/Roach2D';
import {Gear2D} from '../../roach/Gear2D';
import {viewAt, View, P} from '../../roach/ortho';
import {sr} from '../../../lib/ease';
import {INK} from '../../../lib/ink';
import {RB, Pt, Slab, Pebbles, Shaft, Motes, Grit, Glow2, VGrad, jag, poly} from './art';
import {CrackBlock, CrackFloor, CrackShadow, crackClipD} from './crack';
import {emergePose, F2R} from './emerge';
import {ShotProps} from '../index2';

export const f2View = (lf: number): View => {
  const u = sr(lf, 0, F2R.to - F2R.from);
  return viewAt(70, 27, 7.4 + 0.7 * u, [8 + 6 * u, 14, 0], 540, 1000 + 10 * u);
};
/** grit from the crack over the hole as the head pushes out (shot seconds) */
export const F2_GRIT = {t0: 0.42, dur: 0.45};

export const F2: React.FC<ShotProps> = ({f, lf}) => {
  const T = f / 30, t = lf / 30;
  const v = f2View(lf);
  const pose = emergePose(T);
  const q = (x: number, y: number, z: number): Pt => P(v, [x, y, z]) as Pt;
  const gTop = q(0, 50, -8);
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <VGrad id="f2bg" x0={-100} y0={-100} x1={1180} y1={2100} stops={[[0, '#2C2B30'], [1, '#1A191C']]} />
      {/* rubble behind the block */}
      <Slab id="f2r1" face={jag([[-100, -100], [700, -100], [620, 120], [300, 210], [-100, 260]], 14, 3)} tone="#4D4C52" w={5} dark={0.3} specks={20} />
      <Slab id="f2r2" face={jag([[640, -100], [1180, -100], [1180, 300], [900, 250], [700, 120]], 14, 4)} tone="#55534F" w={5} dark={0.35} specks={20} />
      <CrackFloor id="f2fl" v={v} x0={-20} x1={420} z0={-260} z1={220} drop={300} w={5} />
      <Glow2 id="f2pool" cx={q(70, 0, -10)[0]} cy={q(70, 0, -10)[1]} rx={520} ry={150} color={RB.day} a={0.45} />
      <Pebbles id="f2pb" a={q(30, 0, -200)} b={q(60, 0, -110)} n={5} size={22} seed={21} tone={RB.concLit} w={4} />
      <Pebbles id="f2pc" a={q(40, 0, 90)} b={q(90, 0, 170)} n={5} size={24} seed={22} tone={RB.concLit} w={4} />
      <CrackBlock id="f2cb" v={v} w={5} />
      <g clipPath="url(#f2-ic)">
        <defs>
          <clipPath id="f2-ic" clipRule="evenodd">
            <path d={crackClipD(v)} clipRule="evenodd" />
          </clipPath>
        </defs>
        <Roach2D pose={pose} v={v} o={{id: 'f2r', gear: <Gear2D id="f2g" v={v} f={pose.frame} g={{kind: 'injector'}} />}} />
        <CrackShadow id="f2sh" v={v} a={0.9} />
      </g>
      <Grit t={t} x={gTop[0]} y0={gTop[1]} y1={q(0, 0, -8)[1] - 6} t0={F2_GRIT.t0} dur={F2_GRIT.dur} n={9} g={2600} r={4} spread={18} seed={12} />
      <Shaft id="f2sh2" pts={[[-100, 300], [260, 160], [900, 1500], [300, 1700]]} from={[60, 260]} to={[600, 1500]} a={0.22} />
      <Motes id="f2m" t={t + 3} n={22} x0={0} y0={200} x1={1080} y1={1700} r={5} seed={14} a={0.5} />
      <path d={poly([[-10, -10], [1090, -10], [1090, 1930], [-10, 1930]])} fill="none" stroke={INK} strokeWidth={0} />
    </svg>
  );
};
