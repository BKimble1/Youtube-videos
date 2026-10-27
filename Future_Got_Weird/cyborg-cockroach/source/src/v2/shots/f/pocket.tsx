// Her pocket (F1, F3, F5): one place at true scale in pocket-world px (world.ts), framed by a camera per shot (dc/camera
// Cam, all on the subject layer). Daylight comes from the upper right (where the slab lifts) as in the integrator's F6;
// a second, low light leaks under the slab ahead of her hands (the slit, F1). In front of her (nearer the camera) the
// crack, the narrow ledge and the crevice (crack2.tsx through cfView), and the medic on its walk.
import React from 'react';
import {Roach2D} from '../../roach/Roach2D';
import {Gear2D} from '../../roach/Gear2D';
import {View, P, f2 as f2o} from '../../roach/ortho';
import {Layer, Cam} from '../../dc/camera';
import {Survivor, survivorLayout, survivorRig} from '../../../crew/person';
import {Face4} from '../../../crew/person/Crew';
import {face, keyed} from '../../../crew/person/poses';
import {inkW} from '../../../crew/person/geo';
import {INK} from '../../../lib/ink';
import {RoachPose, poseRoach, straightPath} from '../../../rig/roach';
import {RB, Pt, Slab, Rebar, Pebbles, Shaft, Motes, Glow2, VGrad, Vignette, jag, poly, line} from '../e/art';
import {Crevice, Ledge} from './crack2';
import {HER, under, cfView, cardPx, SLAB, SC, slitWalkX, slitShadowView, onBody, BARREL} from './world';

// ---------------------------------------------------------------- her faces (Face4: crew/person/Crew.tsx)
/** tired (heavy lids), wary (alert, brows up and in), disgust (the cartoon "ew": one brow down, narrowed lids, lips
 *  pulled back off clenched teeth, corners down, a crease beside the nose), cautious hope (soft brows lifted in the
 *  middle, relaxed lids, closed almost-smile) */
export const FF: Record<'tired' | 'wary' | 'disgust' | 'hope', Face4> = {
  tired: face({brow: 0.05, browIn: 0.45, lid: 0.42, mw: 11, curve: -0.12, open: 0}),
  wary: face({brow: 0.42, browIn: 0.72, lid: 0.02, wide: 0.45, mw: 10, curve: -0.22, open: 0.06}),
  disgust: face({brow: -0.2, browIn: 0.2, asym: 0.55, lid: 0.24, wide: 0, mw: 13, curve: -0.6, open: 0.3, teeth: 1, smirk: -0.25}),
  hope: face({brow: 0.34, browIn: 0.82, lid: 0.08, wide: 0.12, mw: 11, curve: 0.4, open: 0.04}),
};
/** a keyed face track (smoothstep between keys) */
export const faceTrack = (lf: number, k: [number, Face4][]): Face4 => keyed(lf, k.map(([t, f]) => [t, f] as [number, Face4]));

export type Acting = {
  recog: number; recoil: number; handOpen: number; handSlide?: number; blink?: number; gaze: {x: number; y: number};
  exhale?: number; breath?: number; turn?: number; nod?: number; tilt?: number; face: Face4;
  /** 0..1 the creases beside the nose (disgust) */
  wrinkle?: number;
};
export const herOpts = (T: number, a: Acting) => ({
  ...HER, t: T, recog: a.recog, recoil: a.recoil, handOpen: a.handOpen, handSlide: a.handSlide ?? 0, blink: a.blink ?? 0, gaze: a.gaze,
  exhale: a.exhale ?? 0, breath: a.breath ?? 1, dust: 0.9, turn: a.turn ?? 0, nod: a.nod ?? 0, tilt: a.tilt ?? 0, face: a.face,
});
export const herLayout = (T: number, a: Acting) => survivorLayout(herOpts(T, a));

/** the disgust creases beside the nose, on Head4's own sphere */
const Wrinkle: React.FC<{T: number; a: Acting}> = ({T, a}) => {
  const w = a.wrinkle ?? 0;
  if (w < 0.03) return null;
  const R = survivorRig(herOpts(T, a), {x: HER.x, y: HER.y, scale: HER.scale});
  const hm = R.hm;
  const sw = inkW(HER.scale) * 0.62;
  const arc = (az0: number, az1: number, el: number, bow: number) => {
    const p0 = hm.at(az0, el), p1 = hm.at(az1, el), pm = hm.at((az0 + az1) / 2, el + bow);
    if (Math.min(p0.d, p1.d) < 0.2) return null;
    return `M${f2o(p0.x)},${f2o(p0.y)} Q${f2o(pm.x)},${f2o(pm.y)} ${f2o(p1.x)},${f2o(p1.y)}`;
  };
  // a crease from the nose's wing down and out on each visible side (the upper lip pulled up)
  const ds = [arc(-11, -21, -13, -3), arc(11, 21, -13, -3)].filter(Boolean) as string[];
  return (
    <g opacity={Math.min(1, w)}>
      {ds.map((d, i) => (
        <path key={i} d={d} fill="none" stroke={INK} strokeWidth={f2o(sw * (i === 2 ? 0.8 : 1))} strokeLinecap="round" />
      ))}
    </g>
  );
};

// ---------------------------------------------------------------- the slab ahead of her hands, the slit, its light
const cp = (X: number, Y: number, Z: number): Pt => cardPx(X, Y, Z) as Pt;
/** the fan of light the slit throws on the floor toward her right, and (F1) the unseen insect's shadow sliding over it */
const SlitFan: React.FC<{id: string; T: number; shadow: boolean; fan: number}> = ({id, T, shadow, fan}) => {
  const {x0, slit0, slit1, fanX} = SLAB;
  const fanP: Pt[] = [cp(x0, 0, slit0 + 1), cp(x0, 0, slit1 - 1), cp(fanX, 0, slit1 + 8), cp(fanX, 0, slit0 - 10)];
  const g0 = cp(x0, 0, (slit0 + slit1) / 2), g1 = cp(fanX, 0, (slit0 + slit1) / 2);
  const pose = poseRoach({path: straightPath([0, 0, 0], 0), s: slitWalkX(T), t: T, seed: 3, search: 0.9});
  const sv = slitShadowView();
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-fan`} gradientUnits="userSpaceOnUse" x1={f2o(g0[0])} y1={f2o(g0[1])} x2={f2o(g1[0])} y2={f2o(g1[1])}>
          <stop offset="0" stopColor={RB.dayHot} stopOpacity={0.95 * fan} />
          <stop offset="0.45" stopColor={RB.day} stopOpacity={0.55 * fan} />
          <stop offset="1" stopColor={RB.day} stopOpacity={0} />
        </linearGradient>
        <clipPath id={`${id}-fc`}>
          <path d={poly(fanP)} />
        </clipPath>
        <filter id={`${id}-sf`} x="-30%" y="-30%" width="160%" height="160%">
          <feColorMatrix type="matrix" values="0 0 0 0 0.10  0 0 0 0 0.08  0 0 0 0 0.07  0 0 0 0.82 0" />
          <feGaussianBlur stdDeviation="1.4" />
        </filter>
      </defs>
      <path d={poly(fanP)} fill={`url(#${id}-fan)`} />
      {shadow && (
        <g clipPath={`url(#${id}-fc)`}>
          <g filter={`url(#${id}-sf)`}>
            <Roach2D pose={pose} v={sv} o={{id: `${id}sr`, gear: <Gear2D id={`${id}sg`} v={sv} f={pose.frame} g={{kind: 'injector', noWires: true}} />}} />
          </g>
        </g>
      )}
    </g>
  );
};
/** the slab itself (its faces seen from here: the face toward her right with the glowing slit, the top, the far end;
 *  the end toward her, with the crack, faces away), drawn over anything behind it */
const SlabBody: React.FC<{id: string; T: number; shadow: boolean; fan: number}> = ({id, T, shadow, fan}) => {
  const {x0, x1, z0, z1, h, slit0, slit1, gap} = SLAB;
  const face: Pt[] = [cp(x0, 0, z0), cp(x0, 0, slit0), cp(x0, gap, slit0), cp(x0, gap, slit1), cp(x0, 0, slit1), cp(x0, 0, z1), cp(x0, h, z1), cp(x0, h, z0)];
  const top: Pt[] = [cp(x0, h, z0), cp(x0, h, z1), cp(x1, h, z1), cp(x1, h, z0)];
  const end: Pt[] = [cp(x0, 0, z1), cp(x1, 0, z1), cp(x1, h, z1), cp(x0, h, z1)];
  const slit: Pt[] = [cp(x0, 0, slit0), cp(x0, 0, slit1), cp(x0, gap, slit1), cp(x0, gap, slit0)];
  // the stretch of the slit the unseen insect's body blocks (F1)
  const sx = slitWalkX(T);
  const zA = Math.min(slit1, Math.max(slit0, slit1 - ((sx + 38) * SC) / 3.75)), zB = Math.min(slit1, Math.max(slit0, slit1 - ((sx - 46) * SC) / 3.75));
  const faceJ = jag(face, 3, 73, 26);
  return (
    <g>
      <defs>
        <filter id={`${id}-gl`} x="-40%" y="-200%" width="180%" height="500%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        <linearGradient id={`${id}-fg`} gradientUnits="userSpaceOnUse" x1={0} y1={f2o(cp(x0, h, z0)[1])} x2={0} y2={f2o(cp(x0, 0, z0)[1])}>
          <stop offset="0" stopColor="#6A6560" />
          <stop offset="1" stopColor="#47423F" />
        </linearGradient>
      </defs>
      <path d={poly(jag(end, 3, 71, 26))} fill="#3E3936" stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
      <path d={poly(jag(top, 3, 72, 30))} fill={RB.concDark} stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
      <path d={poly(faceJ)} fill={`url(#${id}-fg)`} stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
      <path d={line([cp(x0, h * 0.7, z0 + 30), cp(x0, h * 0.45, z0 + 46), cp(x0, h * 0.55, z0 + 70)])} stroke="#2E2A28" strokeWidth={3} fill="none" strokeLinecap="round" />
      {/* daylight along the top edge (from the upper right) */}
      <path d={line([cp(x0, h, z0), cp(x0, h, z1)])} stroke={RB.day} strokeWidth={4} strokeLinecap="round" opacity={0.5} />
      {/* the slit glows; the insect's body blocks a stretch of it */}
      <path d={poly(slit)} fill={RB.dayHot} filter={`url(#${id}-gl)`} opacity={0.85 * fan} />
      <path d={poly(slit)} fill={RB.dayHot} opacity={fan} />
      {shadow && zB > zA + 0.5 && <path d={poly([cp(x0, 0, zA), cp(x0, 0, zB), cp(x0, gap, zB), cp(x0, gap, zA)])} fill="#1A1412" />}
    </g>
  );
};

// ---------------------------------------------------------------- the pocket (subject layer)
export type PocketProps = {
  id: string; T: number; a: Acting;
  /** F1: the slit insect's shadow on the fan */
  shadow?: boolean;
  /** strength of the slit's light (0..1) */
  fan?: number;
  /** the medic on its walk (crack frame) or null */
  medic?: RoachPose | null;
  /** 0..1 a glint running along the injector's barrel */
  glint?: number;
  /** grains or other nodes over the scene (pocket px) */
  over?: React.ReactNode;
};
export const Pocket: React.FC<PocketProps> = ({id, T, a, shadow = false, fan = 1, medic = null, glint = 0, over}) => {
  const o = herOpts(T, a);
  const L = survivorLayout(o);
  const cut = L.cutAt(-100);
  const k = HER.scale;
  const topY = cut.back - 30 * k, botY = Math.max(cut.floor, cut.belly) + 8 * k;
  const block = (
    <Slab id={`${id}bk`} face={jag([[cut.x, topY], [cut.x, botY], [-500, botY + 60], [-500, topY + 30]], 9, 21, 60)} top={jag([[cut.x, topY], [cut.x - 50, topY - 40], [-500, topY - 30], [-500, topY + 30]], 5, 22, 70)} tone={RB.concDark} w={4} dark={0.12} cracks={[[[cut.x - 70, topY + 40], [cut.x - 130, topY + 150], [cut.x - 110, botY - 30]]]} specks={18} rim={[[cut.x, topY + 4], [cut.x, botY - 4]]} rimColor="#D9C9A6" />
  );
  const floor: Pt[] = [L.ground(-900, -700), L.ground(800, -700), L.ground(800, 600), L.ground(-900, 600)].map((p) => [p.x, p.y] as Pt);
  const sl = (x: number): Pt => [x, under(x)];
  // the daylight from the upper right, through the gap where the slab lifts, onto her face, her hands and the floor
  const shaftPts: Pt[] = [[1180, -120], [1640, -40], [960, 1420], [420, 1240]];
  const v: View = cfView();
  return (
    <g>
      <VGrad id={`${id}bg`} x0={-1500} y0={-1500} x1={2600} y1={3400} stops={[[0, '#34333A'], [0.5, '#27262B'], [1, '#18171A']]} />
      <Slab id={`${id}fw`} face={jag([[300, under(300) - 10], [1700, under(1700) - 10], [1700, 1000], [900, 1040], [300, 1000]], 12, 11, 70)} tone="#4A4950" w={4} dark={0.35} specks={20} cracks={[[[980, 520], [1040, 640], [1010, 760]]]} />
      <path d={poly(floor)} fill="#6C6560" />
      <Glow2 id={`${id}fp`} cx={L.nearTip.x + 40} cy={L.anchor.y + 40} rx={560} ry={150} color={RB.day} a={0.5} />
      <Pebbles id={`${id}pb`} a={[1060, L.anchor.y + 60]} b={[1400, L.anchor.y - 30]} n={7} size={15} seed={5} dark={0.15} w={3} />
      <Pebbles id={`${id}pc`} a={[L.anchor.x - 260, L.anchor.y + 150]} b={[L.anchor.x - 40, L.anchor.y + 190]} n={5} size={14} seed={6} dark={0.1} w={3} />
      <SlitFan id={`${id}sf`} T={T} shadow={shadow} fan={fan} />
      {/* ahead of her hand: the crevice and the narrow ledge (crack frame) */}
      <Crevice id={`${id}cv`} v={v} w={3} />
      <Glow2 id={`${id}lg`} cx={P(v, [80, 0, 0])[0]} cy={P(v, [80, 0, 0])[1]} rx={170} ry={60} color={RB.day} a={0.45} />
      <Ledge id={`${id}le`} v={v} w={3} />
      <Survivor id={`${id}sv`} {...o} between={block} cutX={cut.x} front={<Wrinkle T={T} a={a} />} />
      {medic && <Roach2D pose={medic} v={v} o={{id: `${id}r`, gear: <Gear2D id={`${id}g`} v={v} f={medic.frame} g={{kind: 'injector'}} />}} />}
      {medic && glint > 0.01 && <Glint id={`${id}gt`} at={P(v, onBody(medic, BARREL)) as Pt} a={glint} r={12} />}
      {/* the slab is nearer the camera than anything coming out of its far end: drawn over the insect */}
      <SlabBody id={`${id}sb`} T={T} shadow={shadow} fan={fan} />
      {/* the fallen slab over her: a thick broken band, lit along its lower edge */}
      <Slab id={`${id}cs`} face={jag([[-600, under(-600) - 330], [1800, under(1800) - 330], sl(1800), sl(-600)], 12, 41, 70)} under={jag([sl(-600), sl(1800), [1800, under(1800) + 22], [-600, under(-600) + 22]], 4, 43, 90)} tone={RB.conc} w={4} dark={0.18} cracks={[[[420, under(420) - 300], [470, under(470) - 160], [450, under(450) - 20]], [[880, under(880) - 280], [930, under(930) - 130]]]} specks={40} rim={[sl(-600), sl(1800)]} />
      <Rebar pts={[[880, under(880) + 10], [892, under(880) + 90], [950, under(880) + 128]]} w={10} dark={0.25} />
      <Rebar pts={[[1060, under(1060) + 10], [1050, under(1060) + 70]]} w={10} dark={0.25} />
      <Shaft id={`${id}sh`} pts={shaftPts} from={[1400, -60]} to={[640, 1330]} a={0.36} />
      <Motes id={`${id}mo`} t={T} n={30} x0={380} y0={0} x1={1500} y1={1400} r={4} seed={9} clip={poly(shaftPts)} />
      {over}
    </g>
  );
};

/** a small specular glint (a four-point star and a soft bloom) */
export const Glint: React.FC<{id: string; at: Pt; a: number; r: number}> = ({id, at, a, r}) => {
  const [x, y] = at;
  const s = r * (0.6 + 0.4 * a);
  return (
    <g opacity={Math.min(1, a)}>
      <Glow2 id={`${id}b`} cx={x} cy={y} rx={r * 2.6} ry={r * 2.6} color="#FFF6DE" a={0.75} />
      <path d={`M${f2o(x - s)},${f2o(y)} Q${f2o(x)},${f2o(y)} ${f2o(x)},${f2o(y - s)} Q${f2o(x)},${f2o(y)} ${f2o(x + s)},${f2o(y)} Q${f2o(x)},${f2o(y)} ${f2o(x)},${f2o(y + s)} Q${f2o(x)},${f2o(y)} ${f2o(x - s)},${f2o(y)} Z`} fill="#FFFFFF" />
    </g>
  );
};

/** a camera that puts pocket point (wx, wy) at screen (sx, sy) with zoom z */
export const camAt = (wx: number, wy: number, sx: number, sy: number, z: number): Cam => ({x: wx - (sx - 540) / z, y: wy - (sy - 960) / z, z});
/** pocket px -> screen px for a camera (subject layer) */
export const toScr = (cam: Cam, p: {x: number; y: number}) => ({x: 540 + (p.x - cam.x) * cam.z, y: 960 + (p.y - cam.y) * cam.z});

export const PocketFrame: React.FC<PocketProps & {cam: Cam; vig?: number}> = ({cam, vig = 0.5, ...p}) => (
  <svg width={1080} height={1920} viewBox="0 0 1080 1920">
    <Layer cam={cam} depth={1}>
      <Pocket {...p} />
    </Layer>
    <Vignette id={`${p.id}vg`} a={vig} />
  </svg>
);
