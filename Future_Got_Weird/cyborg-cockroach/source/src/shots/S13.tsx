// S13 (25.27-28.53 s) "So if you're trapped and something starts crawling toward you..." Her level, in the alcove:
// she lies propped on her forearms, lit by a shaft of daylight, facing the gap ahead. Antennae come through the gap,
// then the head and the loaded backpack; the insect walks toward her along the floor. She notices (her eyes go to it),
// then alarm: the head pulls back, the fingers draw in. One continuous composition; a very slow eased push.
import React from 'react';
import {proj, depth, scaleAt, Cam, lookAt} from '../lib/cam';
import {V3, lerp3, toW} from '../lib/v3';
import {clamp, keys, sr, noise1} from '../lib/ease';
import {Roach} from '../rig/Roach';
import {RoachPose} from '../rig/roach';
import {Gear} from '../rig/Gear';
import {Sorted, Item} from '../lib/scene';
import {ALCOVE, ALC, alcovePieces, chunk, DustFloor, DustMotes, LightShaft, RubbleBack} from '../sets/Alcove';
import {Survivor, survivorLayout} from '../crew/person';
import {alcovePose, insectHead, sideCam, groundAt} from './alcoveWorld';
import {ShotProps} from './index';
import {FPS, word, wordIn} from '../timeline';

/** 1 u of the survivor rig = 3.75 mm */
const MM_PER_U = 3.745;
export const NOTICE = word('starts').start; // her eyes go to it as "starts crawling" begins
export const ALARM = NOTICE + 0.18;

/** a low camera on the floor just beyond the gap, looking past it at her: eye, target, focal length, centre y */
export type S13Co = {eye: V3; tgt: V3; f: number; cy: number};
export const S13_CO: S13Co = {eye: [368, 110, 560], tgt: [125, 320, 20], f: 600, cy: 1020};
/** S13 opens tight on her face (a cut-in from S12's medium shot of her) and eases back once, turning down to the gap
 *  and her hand as the insect comes into view: the close-up's focal length, and when the move runs */
const CLOSE_F = 900, MOVE: [number, number] = [25.85, 27.3];
/** where the close-up aims, relative to the layout's head point in the base composition (px): her face, not the
 *  back of the hair, centred */
const AIM_OFF = {x: 70, y: 10};
/** the world point the close-up aims at: on the ray through her face centre in the base composition */
const faceTgt = (co: S13Co): V3 => {
  const cam = lookAt(co.eye, co.tgt, co.f, 540, co.cy);
  const yaw = yawFor(cam);
  const place = survivorAt(cam, 25.27, {id: 'aim', yaw});
  const h = survivorLayout({...place, yaw, t: 25.27}).head;
  const dx = (h.x + AIM_OFF.x - cam.cx) / cam.f, dy = -(h.y + AIM_OFF.y - cam.cy) / cam.f;
  const d: V3 = [cam.fwd[0] + cam.right[0] * dx + cam.up[0] * dy, cam.fwd[1] + cam.right[1] * dx + cam.up[1] * dy, cam.fwd[2] + cam.right[2] * dx + cam.up[2] * dy];
  const l = Math.hypot(d[0], d[1], d[2]);
  return [co.eye[0] + (d[0] / l) * 500, co.eye[1] + (d[1] / l) * 500, co.eye[2] + (d[2] / l) * 500];
};
let FACE_TGT: V3 | null = null; // computed on first use (the helpers it calls are declared below)
export const s13Cam = (T: number, co: S13Co = S13_CO): Cam => {
  const u = sr(T, MOVE[0], MOVE[1]);
  const ft = co === S13_CO ? (FACE_TGT ??= faceTgt(S13_CO)) : faceTgt(co);
  return lookAt(co.eye, lerp3(ft, co.tgt, u), CLOSE_F + (co.f - CLOSE_F) * u, 540, 960 + (co.cy - 960) * u);
};
/** her card yaw follows the camera's bearing from her (90 = profile; lower = turned toward the camera) */
export const yawFor = (cam: Cam) => 90 - (Math.atan2(cam.eye[0] - ALCOVE.anchor[0], cam.eye[2] - ALCOVE.anchor[2]) * 180) / Math.PI;

/** her acting through S13 (and the start of S14) */
export const s13Acting = (T: number) => {
  const look = sr(T, NOTICE - 0.1, NOTICE + 0.25); // eyes move from the gap to the insect
  const alarm = sr(T, ALARM, ALARM + 0.45);
  return {
    recog: 0.35 * (1 - alarm), // weary before she sees it, then alarm
    recoil: alarm,
    handOpen: 0.55 * (1 - alarm),
    look,
    blink: T > 25.55 && T < 25.68 ? Math.sin(((T - 25.55) / 0.13) * Math.PI) : 0,
  };
};

/** the survivor placed in the alcove: her near fingertips land on ALCOVE.tips */
export const survivorAt = (cam: Cam, T: number, props: Partial<React.ComponentProps<typeof Survivor>> & {id: string}, scaleRef: V3 = ALCOVE.anchor) => {
  const scale = scaleAt(cam, scaleRef) * MM_PER_U;
  const a = proj(cam, ALCOVE.anchor);
  // where the rig puts her fingertips for this anchor, then shift so they sit on the world fingertip point
  const L0 = survivorLayout({x: a[0], y: a[1], scale, t: T, yaw: props.yaw, elev: props.elev});
  const want = proj(cam, ALCOVE.tips);
  const x = a[0] + (want[0] - L0.nearTip.x), y = a[1] + (want[1] - L0.nearTip.y);
  return {x, y, scale};
};

/** depth of the insect's nearest point (body ends, feet, cerci); below a few mm part of it is behind the lens */
const nearestDepth = (cam: Cam, pose: RoachPose) => {
  const fr = pose.frame;
  const pts: V3[] = [toW(fr, [-48, 8, 0]), toW(fr, [-40, 14, 18]), toW(fr, [-40, 14, -18]), ...pose.legs.flatMap((l) => [l.foot, l.ankle, l.knee]), ...pose.cerci.flat()];
  return Math.min(...pts.map((p) => depth(cam, p)));
};

export type AlcoveActing = {recog: number; recoil: number; handOpen: number; handSlide?: number; exhale?: number; blink: number; look: number};
/** the alcove at film time T through camera `cam`: rubble, the insect on its walk, and her (acting A) */
export const AlcoveScene: React.FC<{id: string; T: number; cam: Cam; A: AlcoveActing; scaleRef?: V3; elev?: number; legslab?: boolean; motes?: boolean; shaft?: number; survivor?: boolean; extra?: Item[]}> = ({id, T, cam, A, scaleRef, elev, legslab = true, motes = true, shaft = 0.28, survivor = true, extra = []}) => {
  const pose = alcovePose(T);
  const yaw = yawFor(cam);
  const place = survivorAt(cam, T, {id: `${id}s`, yaw, elev}, scaleRef);
  const head = proj(cam, insectHead(T));
  const gapPt = proj(cam, [ALCOVE.gap[0], 25, ALCOVE.gap[2]]);
  const gaze = {x: gapPt[0] + (head[0] - gapPt[0]) * A.look, y: gapPt[1] + (head[1] - gapPt[1]) * A.look};
  const L = survivorLayout({...place, yaw, elev, t: T, recog: A.recog, recoil: A.recoil, handOpen: A.handOpen});
  const cut = L.cutAt(-70);
  const items: Item[] = [
    ...alcovePieces(cam, {sun: 0.6}).filter((it) => it !== null),
    ...extra,
    // while the insect is still under/behind the lens (before it walks into the bottom of frame) it is not drawn: parts
    // behind the camera would project wrapped round
    ...(nearestDepth(cam, pose) < 4 ? [] : [{z: depth(cam, pose.frame.o), el: <Roach key="r" pose={pose} cam={cam} o={{id: `${id}r`, shadowColor: '#1A1612', gear: <Gear id={`${id}g`} cam={cam} f={pose.frame} g={{kind: 'injector', loaded: true, latched: true}} />}} />}]),
  ];
  // the slab across her legs is drawn over her (in front), its right edge just past the body cut
  const slab = legslab ? chunk(`${id}-legslab`, cam, {c: [-430, 115, 40], h: [250, 30, 300], tilt: -0.36, yaw: 0.06, seed: 3, color: ALC.concreteDeep}, {sun: 0.4}) : null;
  const shaftTo = proj(cam, [260, 0, 30]);
  const dA = depth(cam, ALCOVE.anchor);
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <RubbleBack id={`${id}bk`} glow={[980, 120]} />
      <DustFloor id={`${id}fl`} cam={cam} pool={[230, 0, 30]} poolR={260} />
      <Sorted items={items.filter((it) => dA < it.z)} />
      {survivor && <Survivor id={`${id}s`} yaw={yaw} elev={elev} {...place} t={T} recog={A.recog} recoil={A.recoil} handOpen={A.handOpen} handSlide={A.handSlide} exhale={A.exhale} blink={A.blink} gaze={gaze} dust={0.7} hideLeftOf={cut.x} />}
      <Sorted items={items.filter((it) => dA >= it.z)} />
      {slab?.el}
      {shaft > 0 && <LightShaft id={`${id}sh`} from={[980, -60]} to={[shaftTo[0], shaftTo[1]]} w0={90} w1={260} alpha={shaft} />}
      {motes && <DustMotes cam={cam} t={T} box={[[60, 0, -200], [520, 520, 200]]} n={70} seed={3} />}
    </svg>
  );
};

export const S13: React.FC<ShotProps & {co?: S13Co}> = ({f, co}) => {
  const T = f / FPS;
  return <AlcoveScene id="s13" T={T} cam={s13Cam(T, co)} A={s13Acting(T)} />;
};
