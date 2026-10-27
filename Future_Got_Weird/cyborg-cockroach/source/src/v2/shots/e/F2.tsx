// F2 (800-827, "and something starts"): the crack at close range, seen almost head-on (3/4 front, az 68). Out of the
// dark hole at the base of a broken block the antennae come first, probing, then the head and the front of the insect
// with its front legs reaching out over the lip and finding the floor; a pinch of grit trickles from the crack above
// as it pushes out. One slow push-in.
import React from 'react';
import {Roach2D} from '../../roach/Roach2D';
import {Gear2D} from '../../roach/Gear2D';
import {viewAt, View, P} from '../../roach/ortho';
import {sr} from '../../../lib/ease';
import {RB, Pt, Slab, Rebar, Pebbles, Shaft, Motes, Grit, Glow2, VGrad, Vignette, jag} from './art';
import {CrackBlock, CrackFloor, CrackShadow, crackClipD} from './crack';
import {emergePose, F2R} from './emerge';
import {ShotProps} from '../index2';

export const f2View = (lf: number): View => {
  const u = sr(lf, 0, F2R.to - F2R.from);
  return viewAt(64, 15, 12 + 1 * u, [4 + 10 * u, 12, 0], 540, 1000 + 10 * u);
};
/** grit from the crack over the hole as the head pushes out (shot seconds) */
export const F2_GRIT = {t0: 0.42, dur: 0.45};

export const F2: React.FC<ShotProps> = ({f, lf}) => {
  const T = f / 30, t = lf / 30;
  const v = f2View(lf);
  const pose = emergePose(T);
  const q = (x: number, y: number, z: number): Pt => P(v, [x, y, z]) as Pt;
  const gTop = q(0, 47, -8);
  const mouth = q(30, 0, 0);
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <VGrad id="f2bg" x0={-100} y0={-100} x1={1180} y1={2100} stops={[[0, '#2A292E'], [1, '#18171A']]} />
      {/* rubble behind and above the block: a slab edge with a dim rim of daylight */}
      <Slab id="f2r1" face={jag([[-100, -100], [1180, -100], [1180, 230], [760, 300], [330, 330], [-100, 420]], 14, 3)} tone="#57555A" w={5} dark={0.45} specks={24} rim={[[-100, 420], [330, 330], [760, 300]]} rimColor="#C9B999" cracks={[[[420, 60], [470, 160], [450, 260]]]} />
      <Rebar pts={[[260, 340], [300, 440], [270, 520]]} w={14} dark={0.5} />
      <CrackFloor id="f2fl" v={v} x0={-20} x1={420} z0={-300} z1={240} drop={300} w={5} dark={0.32} />
      <Glow2 id="f2pool" cx={mouth[0] + 60} cy={mouth[1] + 40} rx={560} ry={210} color={RB.day} a={0.5} />
      <CrackBlock id="f2cb" v={v} w={5} dark={0.32} />
      <Rebar pts={[q(0, 96, 70), q(26, 104, 80), q(40, 96, 104)]} w={13} dark={0.3} />
      <Grit t={t} x={gTop[0]} y0={gTop[1]} y1={q(0, 0, -8)[1] - 6} t0={F2_GRIT.t0} dur={F2_GRIT.dur} n={9} g={2600} r={4.5} spread={18} seed={12} />
      <g clipPath="url(#f2-ic)">
        <defs>
          <clipPath id="f2-ic" clipRule="evenodd">
            <path d={crackClipD(v)} clipRule="evenodd" />
          </clipPath>
        </defs>
        <Roach2D pose={pose} v={v} o={{id: 'f2r', gear: <Gear2D id="f2g" v={v} f={pose.frame} g={{kind: 'injector'}} />}} />
        <CrackShadow id="f2sh" v={v} a={0.92} />
      </g>
      <Pebbles id="f2pb" a={q(60, 0, -230)} b={q(110, 0, -150)} n={4} size={26} seed={21} tone={RB.concLit} w={4} dark={0.25} />
      <Pebbles id="f2pc" a={q(70, 0, 110)} b={q(120, 0, 190)} n={4} size={28} seed={22} tone={RB.concLit} w={4} dark={0.25} />
      <Shaft id="f2sh2" pts={[[-100, 380], [200, 300], [860, 1500], [300, 1640]]} from={[60, 360]} to={[600, 1500]} a={0.2} />
      <Motes id="f2m" t={t + 3} n={22} x0={0} y0={300} x1={1080} y1={1700} r={5} seed={14} a={0.5} />
      {/* near rubble framing the bottom corners */}
      <Slab id="f2f1" face={jag([[-100, 1560], [260, 1640], [380, 1800], [360, 2020], [-100, 2020]], 14, 31)} top={jag([[-100, 1560], [260, 1640], [380, 1800], [-100, 1700]], 8, 32)} tone="#5D5F66" w={6} dark={0.6} specks={10} />
      <Slab id="f2f2" face={jag([[820, 1700], [1180, 1600], [1180, 2020], [760, 2020]], 14, 33)} top={jag([[820, 1700], [1180, 1600], [1180, 1680], [800, 1780]], 8, 34)} tone="#6A6B70" w={6} dark={0.62} specks={10} />
      <Vignette id="f2vg" />
    </svg>
  );
};
