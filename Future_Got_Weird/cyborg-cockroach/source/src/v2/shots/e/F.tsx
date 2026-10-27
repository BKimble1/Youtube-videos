// F1, F3, F4: one small world (her pocket under the fallen slab), framed by three eased camera moves (dc/camera
// Layer), so every shot shows the same place. Layers: the pocket (depth 1: dark crevice, the slab over her, the block
// on her hips, her floor, the survivor) and the near floor with the crack (depth 0.7: crack.tsx block, the medic
// coming out of it on its continuous walk from emerge.ts, the same crack F2 shows from in front).
//   F1 (758-799, "So if you're trapped"): close on her face: dusty, tired, heavy lids; a trickle of grit falls from the
//     slab at the left; her eyes go to it and follow it down toward the debris at her front left.
//   F3 (828-855, "crawling toward you..."): closer two-shot: she recoils, startled (alarm face), eyes on the insect
//     whose head and antennae come into the lower left corner.
//   F4 (856-890, "you might actually"): the wider two-shot: the insect comes on across the near floor, heading
//     screen-right toward her near hand, the loaded injector on its back clearly visible; her face goes from fear to
//     cautious recognition, a breath out, her near hand relaxing open on the floor (it ends open and still).
import React from 'react';
import {Roach2D} from '../../roach/Roach2D';
import {Gear2D} from '../../roach/Gear2D';
import {viewAt, View, P} from '../../roach/ortho';
import {Layer, Cam} from '../../dc/camera';
import {keys, sr, clamp, lerp} from '../../../lib/ease';
import {Survivor, survivorLayout} from '../../../crew/person';
import {RoachPose} from '../../../rig/roach';
import {V3} from '../../../lib/v3';
import {RB, Pt, Slab, Rebar, Pebbles, Shaft, Motes, Grit, Glow2, VGrad, Vignette, jag, poly} from './art';
import {CrackBlock, CrackFloor, crackClipD} from './crack';
import {emergePose, F3R, F4R} from './emerge';
import {shotRange} from '../../cuts2';
import {ShotProps} from '../index2';

export const F1R = shotRange('F1');
const D_FG = 0.7;

// ---------------------------------------------------------------- her placement (world px = F4's rest framing)
const HER0 = {scale: 3.2, yaw: 70, elev: 16};
const EYE_AT = {x: 610, y: 650};
const HER = (() => {
  const L0 = survivorLayout({...HER0, x: 0, y: 0, t: 0});
  return {...HER0, x: EYE_AT.x - L0.eyeMid.x, y: EYE_AT.y - L0.eyeMid.y};
})();
/** the fallen slab's underside over her (world px): clear of her head, low at the left where it rests on the block */
const under = (x: number) => 372 - 0.4 * (x - 500);

// ---------------------------------------------------------------- the near floor and the crack (fg world px)
const FG_ROLL = -9;
const HOLE_AT: Pt = [40, 1500];
export const fgView: View = viewAt(22, 20, 4.9, [0, 0, 0], HOLE_AT[0], HOLE_AT[1]);
const rollPt = (p: Pt): Pt => {
  const a = (FG_ROLL * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  const dx = p[0] - HOLE_AT[0], dy = p[1] - HOLE_AT[1];
  return [HOLE_AT[0] + dx * c - dy * s, HOLE_AT[1] + dx * s + dy * c];
};
/** a point on the insect (world mm) -> fg world px */
const fgPt = (p: V3): Pt => rollPt(P(fgView, p) as Pt);
const layerPt = (cam: Cam, d: number, p: Pt): Pt => {
  const z = 1 + (cam.z - 1) / d, cx = 540 + (cam.x - 540) / d, cy = 960 + (cam.y - 960) / d;
  return [540 + (p[0] - cx) * z, 960 + (p[1] - cy) * z];
};
const unLayer1 = (cam: Cam, s: Pt) => ({x: cam.x + (s[0] - 540) / cam.z, y: cam.y + (s[1] - 960) / cam.z});
/** the insect's head (front of the head capsule) as a point in her drawing's coordinates, for her gaze */
const headForHer = (cam: Cam, pose: RoachPose) => {
  const f = pose.frame;
  const h: V3 = [f.o[0] + f.x[0] * 36, f.o[1] + f.x[1] * 36 + 9, f.o[2] + f.x[2] * 36];
  return unLayer1(cam, layerPt(cam, D_FG, fgPt(h)));
};

// ---------------------------------------------------------------- cameras (one eased move each)
/** a camera that puts world point (wx, wy) at screen (sx, sy) with zoom z */
const camAt = (wx: number, wy: number, sx: number, sy: number, z: number): Cam => ({x: wx - (sx - 540) / z, y: wy - (sy - 960) / z, z});
export const f1Cam = (lf: number) => {
  const u = sr(lf, 0, F1R.to - F1R.from);
  return camAt(EYE_AT.x, EYE_AT.y, 690, 860 - 16 * u, 1.45 + 0.1 * u);
};
export const f3Cam = (lf: number) => {
  const u = sr(lf, 0, F3R.to - F3R.from);
  return camAt(EYE_AT.x, EYE_AT.y, 560, 520, 1.18 + 0.06 * u);
};
export const f4Cam = (lf: number) => {
  const u = sr(lf, 0, F4R.to - F4R.from);
  return camAt(EYE_AT.x, EYE_AT.y, 600, 650 + 10 * u, 1 + 0.07 * u);
};

// ---------------------------------------------------------------- the pocket (depth 1)
type HerActing = {recog: number; recoil: number; handOpen: number; handSlide?: number; blink?: number; gaze: {x: number; y: number}; exhale?: number; lid?: number; turn?: number; nod?: number};
const Pocket: React.FC<{T: number; a: HerActing; id: string; grit?: React.ReactNode}> = ({T, a, id, grit}) => {
  const o = {...HER, t: T, recog: a.recog, recoil: a.recoil, handOpen: a.handOpen, handSlide: a.handSlide ?? 0, blink: a.blink ?? 0, gaze: a.gaze, exhale: a.exhale ?? 0, dust: 0.9, turn: a.turn ?? 0, nod: a.nod ?? 0, face: a.lid !== undefined ? {lid: a.lid} : undefined};
  const L = survivorLayout(o);
  const cut = L.cutAt(-100);
  const k = HER.scale;
  const topY = cut.back - 30 * k, botY = Math.max(cut.floor, cut.belly) + 8 * k;
  const block = (
    <Slab id={`${id}bk`} face={jag([[cut.x, topY], [cut.x, botY], [-500, botY + 60], [-500, topY + 30]], 9, 21, 60)} top={jag([[cut.x, topY], [cut.x - 50, topY - 40], [-500, topY - 30], [-500, topY + 30]], 5, 22, 70)} tone={RB.concDark} w={4} dark={0.12} cracks={[[[cut.x - 70, topY + 40], [cut.x - 130, topY + 150], [cut.x - 110, botY - 30]]]} specks={18} rim={[[cut.x, topY + 4], [cut.x, botY - 4]]} rimColor="#D9C9A6" />
  );
  const floor: Pt[] = [L.ground(-900, -700), L.ground(800, -700), L.ground(800, 600), L.ground(-900, 600)].map((p) => [p.x, p.y] as Pt);
  const sl = (x: number): Pt => [x, under(x)];
  const shaftPts: Pt[] = [[-200, 330], [40, 250], [900, 1000], [560, 1180]];
  return (
    <g>
      <VGrad id={`${id}bg`} x0={-1500} y0={-1500} x1={2600} y1={3400} stops={[[0, '#34333A'], [0.5, '#27262B'], [1, '#18171A']]} />
      {/* the far wall of the pocket: dim broken concrete */}
      <Slab id={`${id}fw`} face={jag([[300, under(300) - 10], [1700, under(1700) - 10], [1700, 1000], [900, 1040], [300, 1000]], 12, 11, 70)} tone="#4A4950" w={4} dark={0.35} specks={20} cracks={[[[980, 520], [1040, 640], [1010, 760]]]} />
      <path d={poly(floor)} fill="#6C6560" />
      <Glow2 id={`${id}fp`} cx={L.head.x + 160} cy={L.anchor.y + 10} rx={520} ry={130} color={RB.day} a={0.5} />
      <Pebbles id={`${id}pb`} a={[L.nearTip.x + 70, L.anchor.y + 14]} b={[1300, L.anchor.y - 40]} n={9} size={15} seed={5} dark={0.15} w={3} />
      <Pebbles id={`${id}pc`} a={[L.anchor.x - 60, L.anchor.y + 120]} b={[L.anchor.x + 260, L.anchor.y + 150]} n={5} size={14} seed={6} dark={0.1} w={3} />
      <Survivor id={`${id}sv`} {...o} between={block} cutX={cut.x} />
      {grit}
      {/* the fallen slab over her: a thick broken band, lit along its lower edge */}
      <Slab id={`${id}cs`} face={jag([[-600, under(-600) - 330], [1800, under(1800) - 330], sl(1800), sl(-600)], 12, 41, 70)} under={jag([sl(-600), sl(1800), [1800, under(1800) + 22], [-600, under(-600) + 22]], 4, 43, 90)} tone={RB.conc} w={4} dark={0.18} cracks={[[[420, under(420) - 300], [470, under(470) - 160], [450, under(450) - 20]], [[880, under(880) - 280], [930, under(930) - 130]]]} specks={40} rim={[sl(-600), sl(1800)]} />
      <Rebar pts={[[880, under(880) + 10], [892, under(880) + 90], [950, under(880) + 128]]} w={10} dark={0.25} />
      <Rebar pts={[[1060, under(1060) + 10], [1050, under(1060) + 70]]} w={10} dark={0.25} />
      <Shaft id={`${id}sh`} pts={shaftPts} from={[0, 300]} to={[700, 1060]} a={0.34} />
      <Motes id={`${id}mo`} t={T} n={30} x0={-150} y0={250} x1={950} y1={1180} r={4} seed={9} clip={poly(shaftPts)} />
    </g>
  );
};

// ---------------------------------------------------------------- the near floor, the crack and the medic (depth 0.7)
const Near: React.FC<{id: string; pose: RoachPose | null}> = ({id, pose}) => {
  const v = fgView;
  return (
    <g transform={`rotate(${FG_ROLL} ${HOLE_AT[0]} ${HOLE_AT[1]})`}>
      <CrackFloor id={`${id}fl`} v={v} x0={-60} x1={520} z0={-120} z1={110} drop={420} w={4} dark={0.36} />
      <Pebbles id={`${id}fe`} a={P(v, [60, 0, -122]) as Pt} b={P(v, [520, 0, -126]) as Pt} n={11} size={13} seed={33} tone={RB.concDark} w={3} dark={0.1} />
      <path d={`M${P(v, [250, 0, -120]).join(',')} L${P(v, [262, 0, -60]).join(',')} L${P(v, [240, 0, -20]).join(',')}`} stroke="#4E4844" strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Glow2 id={`${id}pl`} cx={P(v, [120, 0, 0])[0]} cy={P(v, [120, 0, 0])[1]} rx={420} ry={110} color={RB.day} a={0.3} />
      <Pebbles id={`${id}np`} a={P(v, [180, 0, 80]) as Pt} b={P(v, [460, 0, 95]) as Pt} n={6} size={12} seed={31} tone={RB.concLit} w={3} />
      <CrackBlock id={`${id}cb`} v={v} w={4} dark={0.3} />
      {pose && (
        <g clipPath={`url(#${id}-ic)`}>
          <defs>
            <clipPath id={`${id}-ic`} clipRule="evenodd">
              <path d={crackClipD(v)} clipRule="evenodd" />
            </clipPath>
          </defs>
          <Roach2D pose={pose} v={v} o={{id: `${id}r`, gear: <Gear2D id={`${id}g`} v={v} f={pose.frame} g={{kind: 'injector'}} />}} />
        </g>
      )}
    </g>
  );
};

const Frame: React.FC<{cam: Cam; T: number; a: HerActing; id: string; pose: RoachPose | null; grit?: React.ReactNode; vig?: number}> = ({cam, T, a, id, pose, grit, vig = 0.5}) => (
  <svg width={1080} height={1920} viewBox="0 0 1080 1920">
    <Layer cam={cam} depth={1}>
      <Pocket T={T} a={a} id={id} grit={grit} />
    </Layer>
    <Layer cam={cam} depth={D_FG}>
      <Near id={`${id}n`} pose={pose} />
    </Layer>
    <Vignette id={`${id}vg`} a={vig} />
  </svg>
);

// ---------------------------------------------------------------- F1
/** the grit trickle that catches her ear (shot seconds, world px), then the scrape at her front left (the crack) */
export const F1_GRIT = {x: 800, t0: 0.3, dur: 0.75};
export const F1_SCRAPE = 30; // shot frame: a scrape from the crack; her eyes dart down-left to it
export const F1: React.FC<ShotProps> = ({f, lf}) => {
  const T = f / 30, t = lf / 30;
  const cam = f1Cam(lf);
  const gy0 = under(F1_GRIT.x) + 18;
  // her eyes: down at her hands (tired), up to the trickle at the slab's edge, down with it to the floor, then a dart
  // down-left toward the scrape at the debris by the crack
  const look = (() => {
    const pts: [number, {x: number; y: number}][] = [
      [0, {x: 820, y: 1120}], [10, {x: 820, y: 1120}], [15, {x: F1_GRIT.x, y: gy0 + 90}], [27, {x: F1_GRIT.x + 10, y: 1090}],
      [F1_SCRAPE, {x: F1_GRIT.x + 10, y: 1090}], [F1_SCRAPE + 4, {x: 250, y: 1250}],
    ];
    let i = 1;
    while (i < pts.length - 1 && lf > pts[i][0]) i++;
    const [la, pa] = pts[i - 1], [lb, pb] = pts[i];
    const u = sr(lf, la, lb);
    return {x: lerp(pa.x, pb.x, u), y: lerp(pa.y, pb.y, u)};
  })();
  const blink = Math.max(0, 1 - Math.abs(lf - 5) / 2.5);
  const a: HerActing = {recog: 0.35, recoil: 0.15 * sr(lf, F1_SCRAPE, F1_SCRAPE + 4), handOpen: 0.3 - 0.3 * sr(lf, F1_SCRAPE, F1_SCRAPE + 6), blink, gaze: look, lid: keys(lf, [[0, 0.5], [11, 0.5], [16, 0.15], [F1_SCRAPE, 0.15], [F1_SCRAPE + 3, 0]]), turn: keys(lf, [[F1_SCRAPE, 0], [F1_SCRAPE + 6, 6]]), nod: keys(lf, [[10, 2], [16, -2], [27, 3]])};
  return <Frame cam={cam} T={T} a={a} id="f1" pose={null} vig={0.55} grit={<Grit t={t} x={F1_GRIT.x} y0={gy0} y1={1150} t0={F1_GRIT.t0} dur={F1_GRIT.dur} n={24} g={1900} r={5.5} spread={18} seed={4} />} />;
};

// ---------------------------------------------------------------- F3
/** the startle: recoil peaks fast after the cut */
export const F3_RECOIL = {l0: 1, l1: 6};
export const F3: React.FC<ShotProps> = ({f, lf}) => {
  const T = f / 30;
  const cam = f3Cam(lf);
  const pose = emergePose(T);
  const rc = sr(lf, F3_RECOIL.l0, F3_RECOIL.l1);
  const a: HerActing = {recog: 0, recoil: rc, handOpen: 0, gaze: headForHer(cam, pose), blink: Math.max(0, 1 - Math.abs(lf - 1) / 1.5) * 0.6, nod: -7 * rc, turn: 4 * rc};
  return <Frame cam={cam} T={T} a={a} id="f3" pose={pose} vig={0.5} />;
};

// ---------------------------------------------------------------- F4
/** realisation: recognition and the breath out (shot frames) */
export const F4_ACT = {recog0: 6, recog1: 26, ex0: 14, ex1: 32, open0: 12, open1: 30};
export const F4: React.FC<ShotProps> = ({f, lf}) => {
  const T = f / 30;
  const cam = f4Cam(lf);
  const pose = emergePose(T);
  const A = F4_ACT;
  const r = sr(lf, A.recog0, A.recog1);
  const ex = clamp(Math.sin(Math.PI * clamp((lf - A.ex0) / (A.ex1 - A.ex0))));
  const head = headForHer(cam, pose);
  // a glance at the injector on its back, then back to the head
  const g = sr(lf, 9, 13) * (1 - sr(lf, 19, 24));
  const gaze = {x: head.x - 30 * g, y: head.y - 40 * g};
  const a: HerActing = {recog: r, recoil: 1 - 0.85 * r, handOpen: sr(lf, A.open0, A.open1), handSlide: 0.25 * sr(lf, A.open0 + 4, A.open1 + 2), gaze, exhale: ex};
  return <Frame cam={cam} T={T} a={a} id="f4" pose={pose} vig={0.45} />;
};
