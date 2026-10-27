// E1 (655-757, "beneath collapsed buildings, carrying emergency medicine."): the setting changes. The film comes out of
// D6's narrow dark lab gap into a matching narrow opening in collapsed concrete; one eased camera move pushes through it
// (the near edges part and pass the lens), then drifts right with the medic. Layered flat 2D at five depths: the broken
// back wall with a daylight hole and its shaft, the survivor's pocket under a fallen slab, the middle rubble (rebar,
// slabs), the medic's ledge (the subject plane) and dark foreground chunks. The medic (loaded injector) crawls
// screen-right along a clean slab ledge toward the trapped crew person, who lies prone in the pocket beyond.
import React from 'react';
import {poseRoach, straightPath, RoachPose} from '../../../rig/roach';
import {Roach2D} from '../../roach/Roach2D';
import {Gear2D} from '../../roach/Gear2D';
import {viewAt, View, P} from '../../roach/ortho';
import {Layer, Cam} from '../../dc/camera';
import {easeOut, sr, clamp} from '../../../lib/ease';
import {Survivor, survivorLayout} from '../../../crew/person';
import {RB, Pt, Slab, Rebar, Pebbles, Shaft, Motes, Grit, Glow2, VGrad, jag, poly, line, f2} from './art';
import {INK} from '../../../lib/ink';
import {mix} from '../../../lib/color';
import * as GD from '../grpD';
import {ShotProps} from '../index2';

export const E1_N = 103;
/** a grit trickle from the slab's underside (shot seconds) */
export const E1_GRIT = {x: 905, t0: 0.9, dur: 1.4};
/** D6's last frame: the dark gap between the lab blocks (screen px), if group D exports it */
const GAP = ((GD as unknown as Record<string, unknown>).D6_GAP as {x0: number; x1: number; y0: number; y1: number} | undefined) ?? {x0: 330, x1: 750, y0: 0, y1: 1920};

/** camera progress: already moving at the cut (D6 pushes into the gap), settling at the end */
export const e1U = (lf: number) => easeOut(lf / (E1_N - 1), 2.1);
const CAM_END = {x: 640, y: 1000, z: 1.6};
export const e1Cam = (lf: number): Cam => {
  const u = e1U(lf);
  const drift = sr(u, 0.58, 1);
  return {x: 540 + (CAM_END.x - 540) * drift, y: 960 + (CAM_END.y - 960) * drift, z: 1 + (CAM_END.z - 1) * u};
};
/** content authored in END-frame screen px for a layer at depth d (identity on screen at the end of the shot) */
const endWrap = (d: number) => {
  const z = 1 + (CAM_END.z - 1) / d, cx = 540 + (CAM_END.x - 540) / d, cy = 960 + (CAM_END.y - 960) / d;
  return `translate(${(cx - 540 / z).toFixed(3)} ${(cy - 960 / z).toFixed(3)}) scale(${(1 / z).toFixed(5)})`;
};
const D_BACK = 3.4, D_POCKET = 2.2, D_MID = 1.45, D_SUBJ = 1, D_FORE = 0.62, D_GAP = 0.2;

// ---------------------------------------------------------------- the medic (end-frame px, subject plane)
const V_MM = 40; // mm/s
const YAW = 0.12;
const PATH = straightPath([0, 0, 0], YAW);
/** the ledge tilts up to the right (a rolled flat view: still orthographic) */
const ROLL = -8, ROLL_C: Pt = [540, 1380];
const E1_VIEW: View = viewAt(24, 22, 3.5, [0, 0, 0], 160, 1350);
export const e1Pose = (lf: number): RoachPose => {
  const t = lf / 30;
  return poseRoach({path: PATH, s: 6 + V_MM * t, t: t + 21.8, search: 0.7, antL: {yaw: 0.7, pitch: 0.2}, antR: {yaw: 0.66, pitch: 0.24}, seed: 2});
};

// ---------------------------------------------------------------- the survivor (end-frame px, pocket layer)
const SURV = {x: 720, y: 1105, scale: 1.95, yaw: 76, elev: 17};
const survOpts = (t: number) => ({...SURV, t, recog: 0.3, recoil: 0, handOpen: 0.3, dust: 0.85, gx: -0.1, gy: 0.35, face: {lid: 0.4}});
/** the fallen ceiling slab's underside (end-frame px, pocket layer): a straight broken edge rising to the right */
const under = (x: number) => 752 - 0.42 * (x - 250);

const Back: React.FC<{t: number}> = ({t}) => {
  // the broken back wall and ceiling; a jagged daylight hole at top left with rebar across it
  const hole: Pt[] = jag([[110, 120], [300, 84], [380, 170], [340, 300], [190, 318], [92, 232]], 13, 11, 34);
  return (
    <g>
      <VGrad id="e1bk" x0={-1400} y0={-1400} x1={2600} y1={3400} stops={[[0, '#3C3838'], [0.4, '#2A2A2F'], [1, '#17171B']]} />
      <Glow2 id="e1hg" cx={235} cy={205} rx={420} ry={360} color={RB.day} a={0.3} />
      <defs>
        <radialGradient id="e1sky" cx="0.45" cy="0.45" r="0.6">
          <stop offset="0" stopColor="#FFFBEF" />
          <stop offset="0.6" stopColor={RB.dayHot} />
          <stop offset="1" stopColor="#F3D29A" />
        </radialGradient>
      </defs>
      <path d={poly(hole)} fill="url(#e1sky)" />
      <Rebar pts={[[40, 250], [170, 196], [290, 150], [420, 128]]} w={7} dark={0.7} />
            <path d={poly(hole)} fill="none" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      {/* broken ceiling around the hole, lit along the hole's rim */}
      <Slab id="e1c1" face={jag([[-300, -200], [520, -220], [500, 60], [300, 84], [110, 120], [-300, 160]], 10, 3)} tone={RB.far} rim={[[110, 120], [300, 84]]} specks={20} w={4} />
      <Slab id="e1c2" face={jag([[380, 170], [500, 60], [520, -220], [1500, -220], [1500, 330], [900, 360], [560, 330]], 12, 5)} tone="#3B3532" w={4} cracks={[[[700, 160], [760, 230], [840, 250]]]} specks={18} rim={[[380, 170], [500, 60]]} />
      <Slab id="e1c3" face={jag([[-300, 280], [92, 232], [190, 318], [340, 300], [420, 520], [-300, 640]], 12, 9)} tone={RB.far} rim={[[92, 232], [190, 318], [340, 300]]} w={4} specks={14} />
      <Motes id="e1m0" t={t} n={18} x0={60} y0={130} x1={760} y1={900} r={3} seed={4} a={0.5} clip={poly([[110, 120], [380, 100], [900, 860], [520, 900]])} />
    </g>
  );
};

/** the survivor's pocket: the fallen slab over her, the block pinning her legs, her floor */
const Pocket: React.FC<{t: number}> = ({t}) => {
  const o = survOpts(t);
  const L = survivorLayout(o);
  const cut = L.cutAt(-100);
  const k = SURV.scale;
  // the block across her hips and legs (leading face edge-on at cut.x), up to the slab's underside
  const topY = cut.back - 34 * k, botY = Math.max(cut.floor, cut.belly) + 8 * k;
  const block = (
    <Slab id="e1ls" face={jag([[cut.x, topY], [cut.x, botY], [-300, botY + 50], [-300, topY + 20]], 7, 21, 46)} top={jag([[cut.x, topY], [cut.x - 40, topY - 30], [-300, topY - 20], [-300, topY + 20]], 4, 22, 60)} tone={RB.concDark} w={3.5} dark={0.15} cracks={[[[cut.x - 50, topY + 30], [cut.x - 95, topY + 110], [cut.x - 80, botY - 20]], [[cut.x - 200, topY + 80], [cut.x - 240, topY + 160]]]} specks={16} rim={[[cut.x, topY + 4], [cut.x, botY - 4]]} rimColor={mix(RB.day, RB.concLit, 0.4)} />
  );
  const floor: Pt[] = [L.ground(-800, -600), L.ground(700, -600), L.ground(700, 500), L.ground(-800, 500)].map((p) => [p.x, p.y] as Pt);
  const sl = (x: number): Pt => [x, under(x)];
  return (
    <g>
      {/* the pocket's back: dark crevice under the slab */}
      <path d={poly([[-300, under(-300) - 20], [1400, under(1400) - 20], [1400, 1300], [-300, 1300]])} fill="#2B2A2E" />
      <path d={poly(floor)} fill="#6E6762" />
      <Glow2 id="e1fp" cx={L.head.x + 120} cy={L.anchor.y + 6} rx={360} ry={80} color={RB.day} a={0.42} />
      <Pebbles id="e1pb0" a={[L.nearTip.x + 60, L.anchor.y + 6]} b={[1200, L.anchor.y - 30]} n={8} size={12} seed={5} dark={0.2} />
      <Survivor id="e1sv" {...o} between={block} cutX={cut.x} />
      {/* the fallen ceiling slab: a thick broken band, its underside dark, its front face lit along the lower edge */}
      <Slab id="e1cs" face={jag([[-300, under(-300) - 175], [1400, under(1400) - 175], sl(1400), sl(-300)], 9, 41, 50)} under={jag([sl(-300), sl(1400), [1400, under(1400) + 16], [-300, under(-300) + 16]], 3, 43, 70)} tone={RB.conc} w={4} dark={0.12} cracks={[[[420, under(420) - 170], [455, under(455) - 90], [440, under(440) - 10]], [[880, under(880) - 160], [930, under(930) - 80]]]} specks={30} rim={[sl(-300), sl(1400)]} />
      <Rebar pts={[[330, under(330) + 6], [342, under(330) + 60], [380, under(330) + 84]]} w={7} dark={0.25} />
      <Rebar pts={[[1010, under(1010) + 6], [1020, under(1010) + 60], [1070, under(1010) + 90]]} w={7} dark={0.25} />
    </g>
  );
};

/** the middle rubble between her floor and the medic's ledge */
const Mid: React.FC = () => (
  <g>
    <Slab id="e1mB" face={jag([[800, 1210], [1400, 1110], [1400, 1330], [820, 1330]], 8, 53)} top={jag([[800, 1210], [1400, 1110], [1400, 1150], [830, 1245]], 5, 54)} tone={RB.conc} w={3.5} dark={0.3} specks={10} />
    <Rebar pts={[[1050, 1190], [1020, 1090], [1040, 1010]]} w={7} dark={0.3} />
    <Slab id="e1mA" face={jag([[-300, 1210], [170, 1190], [260, 1260], [-300, 1340]], 8, 51)} top={jag([[-300, 1210], [170, 1190], [200, 1215], [-300, 1240]], 4, 52)} tone={RB.concDark} w={3.5} dark={0.3} specks={8} />
  </g>
);

/** the medic's ledge, through the insect's own view (mm): a broken slab piece with a jagged far edge and front face */
const Ledge: React.FC = () => {
  const v = E1_VIEW;
  const q = (x: number, z: number, y = 0): Pt => P(v, [x, y, z]) as Pt;
  const top: Pt[] = [q(-300, -80), ...jag([q(-120, -78), q(250, -84)], 7, 64, 36, false), q(300, -40), q(282, 20), q(320, 62), q(-300, 62)];
  const front: Pt[] = [...jag([q(-300, 62), q(320, 62)], 5, 62, 46, false), q(318, 62, -30), q(290, 62, -70), q(300, 62, -150), q(-300, 62, -230)];
  return (
    <g>
      <path d={poly([q(-300, -80, -260), q(400, -84, -260), q(400, -84), q(-300, -80)])} fill={RB.deep} opacity={0.75} />
      <Slab id="e1lg" face={front} top={top} tone={RB.conc} w={3.5} dark={0.42} topTone={mix(RB.concLit, RB.day, 0.16)} cracks={[[q(40, 62), q(52, 62, -50), q(30, 62, -120)], [q(200, 62), q(212, 62, -80)]]} specks={24} rim={[q(-300, 62), q(320, 62)]} />
      <path d={line([q(-40, -78), q(-10, -40), q(-30, -5), q(10, 30)])} stroke={RB.concDark} strokeWidth={2.5} fill="none" strokeLinecap="round" opacity={0.8} />
      <Pebbles id="e1lp" a={q(-200, -70)} b={q(240, -74)} n={6} size={8} seed={63} tone={RB.concLit} />
    </g>
  );
};

const Fore: React.FC = () => (
  <g>
    <Slab id="e1f1" face={jag([[-400, 1650], [200, 1690], [360, 1840], [330, 2300], [-400, 2300]], 12, 71)} top={jag([[-400, 1650], [200, 1690], [360, 1840], [-400, 1760]], 8, 72)} tone="#5D5F66" w={5} dark={0.62} specks={14} />
    <Slab id="e1f2" face={jag([[800, 1720], [1500, 1600], [1500, 2300], [720, 2300]], 12, 73)} top={jag([[800, 1720], [1500, 1600], [1500, 1690], [780, 1800]], 8, 74)} tone="#6A6B70" w={5} dark={0.64} specks={14} />
    <Rebar pts={[[1080, 1690], [1030, 1560], [1060, 1490]]} w={11} dark={0.6} />
  </g>
);

/** the opening we come through (start-frame px): two near masses of broken concrete leaving a gap GAP.x0..x1 */
const GapEdges: React.FC = () => {
  const {x0, x1} = GAP;
  const L: Pt[] = jag([[-900, -300], [x0 - 10, -300], [x0 + 18, 300], [x0 - 6, 700], [x0 + 22, 1150], [x0, 1600], [x0 + 12, 2300], [-900, 2300]], 14, 81, 60);
  const R: Pt[] = jag([[x1 + 10, -300], [2000, -300], [2000, 2300], [x1 - 8, 2300], [x1 + 6, 1700], [x1 - 20, 1200], [x1 + 4, 760], [x1 - 14, 320]], 14, 82, 60);
  return (
    <g>
      <Slab id="e1gl" face={L} tone={RB.concDark} w={6} dark={0.62} specks={30} cracks={[[[x0 - 120, 200], [x0 - 60, 420], [x0 - 90, 640]], [[x0 - 200, 1300], [x0 - 70, 1420]]]} rim={[[x0 + 18, 300], [x0 - 6, 700], [x0 + 22, 1150]]} rimColor={mix(RB.day, RB.conc, 0.5)} />
      <Slab id="e1gr" face={R} tone={RB.conc} w={6} dark={0.66} specks={30} cracks={[[[x1 + 90, 500], [x1 + 160, 700]], [[x1 + 60, 1500], [x1 + 140, 1460], [x1 + 210, 1560]]]} />
      <Rebar pts={[[x0 - 40, 980], [x0 + 6, 1010], [x0 + 30, 1060]]} w={12} dark={0.55} />
    </g>
  );
};

export const E1: React.FC<ShotProps> = ({lf}) => {
  const t = lf / 30;
  const cam = e1Cam(lf);
  const u = e1U(lf);
  const pose = e1Pose(lf);
  const v = E1_VIEW;
  const veil = 0.6 * (1 - sr(u, 0.04, 0.4));
  const zGap = 1 + (cam.z - 1) / D_GAP;
  const gapGone = u > 0.6 || (GAP.x0 - 540) * zGap < -560 && (GAP.x1 - 540) * zGap > 560;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <Layer cam={cam} depth={D_BACK}>
        <g transform={endWrap(D_BACK)}>
          <Back t={t} />
        </g>
      </Layer>
      <Layer cam={cam} depth={D_POCKET}>
        <g transform={endWrap(D_POCKET)}>
          <Pocket t={t + 21.8} />
          <Grit t={t} x={E1_GRIT.x} y0={under(E1_GRIT.x) + 14} y1={1110} t0={E1_GRIT.t0} dur={E1_GRIT.dur} n={16} seed={8} />
        </g>
      </Layer>
      <Layer cam={cam} depth={D_MID}>
        <g transform={endWrap(D_MID)}>
          <Mid />
        </g>
      </Layer>
      <Layer cam={cam} depth={D_SUBJ}>
        <g transform={endWrap(D_SUBJ)}>
          <g transform={`rotate(${ROLL} ${ROLL_C[0]} ${ROLL_C[1]})`}>
            <Ledge />
            <Roach2D pose={pose} v={v} o={{id: 'e1r', gear: <Gear2D id="e1g" v={v} f={pose.frame} g={{kind: 'injector'}} />}} />
          </g>
        </g>
      </Layer>
      {/* the daylight shaft and the motes in it, over the pocket and the ledge */}
      <Layer cam={cam} depth={1.8}>
        <g transform={endWrap(1.8)}>
          <Shaft id="e1sh" pts={[[110, 120], [380, 100], [880, 1160], [500, 1190]]} from={[240, 150]} to={[700, 1170]} a={0.4} />
          <Motes id="e1m1" t={t} n={34} x0={100} y0={100} x1={900} y1={1190} r={3.6} seed={9} clip={poly([[110, 120], [380, 100], [880, 1160], [500, 1190]])} />
        </g>
      </Layer>
      <Layer cam={cam} depth={D_FORE}>
        <g transform={endWrap(D_FORE)}>
          <Fore />
        </g>
      </Layer>
      {veil > 0.003 && <rect x={0} y={0} width={1080} height={1920} fill="#0C0A09" opacity={veil.toFixed(3)} />}
      {!gapGone && (
        <Layer cam={cam} depth={D_GAP}>
          <GapEdges />
        </Layer>
      )}
    </svg>
  );
};
void clamp;
