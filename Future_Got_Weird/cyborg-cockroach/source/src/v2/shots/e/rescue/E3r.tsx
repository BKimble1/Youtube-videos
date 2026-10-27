// E3 (680-699, "buildings,"): side-tracking in profile under a huge fallen beam. The beam's broken face fills the top
// two thirds of the frame, rebar stubs hanging from its underside; under it the medic (loaded injector), tiny, walks
// screen-right along the floor slab, and the camera trucks with it. A thin shaft of daylight falls through a crack
// behind the beam, dust turning in it, and the insect walks into its light. A dark chunk of rubble close to the lens
// slides out at the left (it carries the cut out of E2's darkness); near grit passes along the bottom.
import React from 'react';
import {poseRoach, straightPath, RoachPose} from '../../../../rig/roach';
import {Roach2D} from '../../../roach/Roach2D';
import {Gear2D} from '../../../roach/Gear2D';
import {viewAt, View} from '../../../roach/ortho';
import {Layer, Cam} from '../../../dc/camera';
import {clamp, sr} from '../../../../lib/ease';
import {mix} from '../../../../lib/color';
import {RB, Pt, Slab, Rebar, Pebbles, Glow2, Motes, Shaft, VGrad, Grit, jag, poly} from '../art';
import {ShotProps} from '../../index2';
import {idf, FPS, Blur, probe} from './kit';

export const E3_N = 20;
const E3_F0 = 680;
/** a trickle of grit from the crack, down through the shaft (shot seconds) */
export const E3_GRIT = {t0: 0.08, dur: 0.5};
/** px per mm at the subject plane: twice V3's, so the insect reads (E2 ends near this size; the beam still dwarfs it) */
const S = 5.4;
const V_MM = 60;
/** the insect's ground point on screen at the start, and the share of its travel the camera follows */
const X0 = 420, Y0 = 1352, FOLLOW = 0.6;
export const E3_VIEW: View = viewAt(4, 7, S, [0, 0, 0], X0, Y0);
const s0 = 12;
export const e3Pose = (lf: number): RoachPose => {
  const t = lf / FPS;
  return poseRoach({path: straightPath([0, 0, 0], 0), s: s0 + V_MM * t, t: t + 22.7, ...probe(lf + E3_F0, 1), seed: 5});
};
export const e3Cam = (lf: number): Cam => ({x: 540 + FOLLOW * S * V_MM * (lf / FPS), y: 960, z: 1});
const D_BACK = 2.4, D_BEAM = 1.04, D_SUBJ = 1, D_FORE = 0.14;

/** the beam, broken in two over the floor: each half a straight member sagging to the break at BX, where a crack
 *  lets the daylight through (subject-layer px). */
const BX = 742;
const BD = 820; // the beam's depth on screen
/** the beam's underside (raised clear of the larger insect and its antennae) */
const bot = (x: number) => (x < BX ? 1080 - 0.2 * (BX - x) : 1084 - 0.24 * (x - BX));
/** the shaft: down through the crack at the break onto the floor ahead of the insect */
const SH = {top: [[BX - 26, bot(BX) - 30], [BX + 26, bot(BX) - 30]] as Pt[], bot: [[BX + 50, 1356], [BX - 190, 1356]] as Pt[]};

const Back: React.FC<{id: string}> = ({id}) => (
  <g>
    <VGrad id={`${id}-bk`} x0={-1500} y0={-500} x1={2600} y1={2500} stops={[[0, '#141110'], [0.5, '#221D1A'], [1, '#141110']]} />
    <Slab id={`${id}-b1`} face={jag([[-300, 1120], [300, 1100], [520, 1150], [500, 1400], [-300, 1400]], 10, 301, 50)} tone={RB.far} w={4} dark={0.62} specks={10} />
    <Slab id={`${id}-b2`} face={jag([[860, 1110], [1500, 1080], [1500, 1400], [900, 1400]], 10, 302, 50)} tone={RB.far} w={4} dark={0.66} specks={10} />
  </g>
);

const Beam: React.FC<{id: string}> = ({id}) => {
  const half = (x0: number, x1: number, seed: number) => {
    const b0: Pt = [x0, bot(x0)], b1: Pt = [x1, bot(x1)];
    const und = jag([b0, b1], 6, seed, 50, false);
    const top = jag([[x1, bot(x1) - BD], [x0, bot(x0) - BD]], 6, seed + 1, 50, false);
    return {und, top};
  };
  const Lh = half(-500, BX - 10, 311), Rh = half(BX + 12, 2100, 313);
  // the broken ends at the crack: jagged faces, a little apart
  const brokenL: Pt[] = jag([[BX - 10, bot(BX - 10) - BD], [BX + 6, bot(BX) - BD * 0.6], [BX - 14, bot(BX) - BD * 0.25], [BX - 10, bot(BX - 10)]], 8, 315, 30, false);
  const brokenR: Pt[] = jag([[BX + 12, bot(BX + 12)], [BX + 26, bot(BX) - BD * 0.3], [BX + 10, bot(BX) - BD * 0.7], [BX + 12, bot(BX + 12) - BD]], 8, 316, 30, false);
  const faceL: Pt[] = [...Lh.und, ...brokenL.slice().reverse().slice(1, -1), ...Lh.top.slice().reverse().reverse()];
  const faceR: Pt[] = [...Rh.und, ...Rh.top, ...brokenR.slice().reverse().slice(1, -1)];
  return (
    <g>
      {/* the crack glows with the daylight beyond */}
      <path d={poly([[BX - 16, bot(BX) - BD], [BX + 18, bot(BX) - BD], [BX + 18, bot(BX)], [BX - 16, bot(BX)]])} fill={RB.dayHot} />
      <Glow2 id={`${id}-cg`} cx={BX} cy={bot(BX) - BD * 0.5} rx={90} ry={BD * 0.7} color={RB.day} a={0.5} />
      <Slab id={`${id}-bl`} face={faceL} tone={RB.conc} w={6} dark={0.32} specks={50}
        cracks={[[[120, bot(120) - 380], [170, bot(170) - 230], [140, bot(140) - 90]], [[520, bot(520) - 400], [560, bot(560) - 250]], [[300, bot(300) - 800], [340, bot(340) - 640], [310, bot(310) - 520]]]}
        rim={brokenL} rimColor={RB.day} />
      <Slab id={`${id}-br`} face={faceR} tone={RB.conc} w={6} dark={0.36} specks={50}
        cracks={[[[1000, bot(1000) - 390], [960, bot(960) - 220], [1000, bot(1000) - 60]]]}
        rim={brokenR} rimColor={RB.day} />
      {/* the undersides, dark bands just above the gap */}
      <path d={poly([...Lh.und, [BX - 10, bot(BX - 10) + 22], [-500, bot(-500) + 22]])} fill="#1C1816" />
      <path d={poly([...Rh.und, [2100, bot(2100) + 22], [BX + 12, bot(BX + 12) + 22]])} fill="#1C1816" />
      {/* bent rebar still bridging the break, and stubs hanging from the undersides */}
      <Rebar pts={[[BX - 90, bot(BX - 90) - 40], [BX - 20, bot(BX) + 4], [BX + 30, bot(BX) + 8], [BX + 100, bot(BX + 100) - 36]]} w={9} dark={0.3} />
      <Rebar pts={[[BX - 70, bot(BX - 70) - 150], [BX, bot(BX) - 120], [BX + 80, bot(BX + 80) - 150]]} w={8} dark={0.3} />
      {[180, 420, 1060, 1300].map((x, i) => (
        <Rebar key={i} pts={[[x, bot(x) + 2], [x + 8, bot(x) + 38 + 14 * (i % 2)], [x - 5, bot(x) + 70 + 18 * (i % 2)]]} w={7} dark={0.45} />
      ))}
      {/* the beam's top edges catch a little of the light */}
      <Glow2 id={`${id}-tl`} cx={BX} cy={bot(BX) - BD} rx={320} ry={60} color={RB.day} a={0.25} />
    </g>
  );
};

/** the floor slab the insect walks on: its top seen at a grazing angle, its broken front face below */
const Floor: React.FC<{id: string}> = ({id}) => {
  const L = -400, R = 2200;
  const top = Y0 - 18, edge = Y0 + 14;
  return (
    <g>
      <path d={poly([[L, top], [R, top], [R, edge], [L, edge]])} fill="#6E655D" />
      <Slab id={`${id}-ff`} face={[...jag([[L, edge], [R, edge]], 5, 321, 50, false), [R, 2400], [L, 2400]]} tone={RB.concDark} w={5} dark={0.45} specks={60}
        cracks={[[[300, 1420], [340, 1560], [310, 1700]], [[900, 1460], [860, 1620]], [[1500, 1400], [1540, 1600]]]} rim={jag([[L, edge], [R, edge]], 5, 321, 50, false)} rimColor={mix(RB.concLit, RB.deep, 0.35)} />
      <VGrad id={`${id}-fd`} x0={L} y0={edge + 20} x1={R} y1={2400} stops={[[0, 'rgba(10,8,7,0)'], [0.5, 'rgba(10,8,7,0.45)'], [1, 'rgba(10,8,7,0.7)']]} />
      <Pebbles id={`${id}-p0`} a={[-200, Y0 - 4]} b={[2100, Y0 - 2]} n={34} size={7} seed={322} tone={RB.concDark} dark={0.25} />
    </g>
  );
};

const Fore: React.FC<{id: string}> = ({id}) => (
  <Blur id={`${id}-bl`} sd={9}>
    <Slab id={`${id}-f1`} face={jag([[-600, -200], [280, -100], [400, 500], [360, 1200], [440, 1900], [-600, 2200]], 22, 331, 70)} tone="#2A2522" w={8} dark={0.7} specks={10} />
    <Slab id={`${id}-f2`} face={jag([[600, 1780], [1100, 1700], [1700, 1760], [1700, 2200], [600, 2200]], 16, 332, 60)} tone="#3A3430" w={8} dark={0.6} />
    <Pebbles id={`${id}-f3`} a={[1300, 1840]} b={[2200, 1860]} n={8} size={40} seed={333} tone="#3A3430" dark={0.6} />
  </Blur>
);

export const E3: React.FC<ShotProps> = ({f, lf}) => {
  const id = idf('e3c', f);
  const t = lf / FPS;
  const cam = e3Cam(lf);
  const pose = e3Pose(lf);
  const v = E3_VIEW;
  // the insect's light: it walks into the shaft (its ground point crosses the shaft's floor patch)
  const xs = v.ox + S * pose.frame.o[0];
  const inLight = sr(xs, BX - 260, BX - 140);
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <Layer cam={cam} depth={D_BACK}>
        <Back id={`${id}k`} />
      </Layer>
      <Layer cam={cam} depth={D_BEAM}>
        <Beam id={`${id}b`} />
      </Layer>
      <Layer cam={cam} depth={D_SUBJ}>
        <Floor id={`${id}l`} />
        <Glow2 id={`${id}-pool`} cx={BX - 55} cy={Y0 - 4} rx={170} ry={22} color={RB.dayHot} a={0.75} />
        <Roach2D pose={pose} v={v} o={{id: `${id}-r`, gear: <Gear2D id={`${id}-g`} v={v} f={pose.frame} g={{kind: 'injector'}} />}} />
        {/* ambient dark over the insect until it reaches the light */}
        <Glow2 id={`${id}-rl`} cx={xs + 20} cy={Y0 - 40} rx={150} ry={80} color={RB.day} a={0.22 * inLight} />
        <Shaft id={`${id}-sh`} pts={[...SH.top, ...SH.bot]} from={[BX, bot(BX) - 30]} to={[BX - 70, 1350]} a={1} />
        <Grit t={t} x={BX + 2} y0={bot(BX) + 6} y1={1346} t0={E3_GRIT.t0} dur={E3_GRIT.dur} n={14} seed={335} spread={8} color={RB.dayHot} />
        <Motes id={`${id}-mo`} t={t + 3} n={26} x0={BX - 160} y0={bot(BX) - 60} x1={BX + 40} y1={1350} r={3} seed={334} clip={poly([...SH.top, ...SH.bot])} a={0.9} />
      </Layer>
      <rect x={0} y={0} width={1080} height={1920} fill="#0A0807" opacity={(0.18 * (1 - clamp(lf / 8))).toFixed(3)} />
      <Layer cam={cam} depth={D_FORE}>
        <Fore id={`${id}f`} />
      </Layer>
    </svg>
  );
};
