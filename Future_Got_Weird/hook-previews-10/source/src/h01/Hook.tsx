// HOOK 01: "This parasite destroys a fish's tongue... then becomes its new tongue."
// Cymothoa exigua in the mouth of a spotted rose snapper. One continuous shot of one 3D model:
//  0.0-1.0  extreme close-up, the mouth opening: the isopod on the floor of the mouth, head and eyes staring out
//  1.0-2.5  push into the mouth; the parasite flexes, the jaw works; front claws clamped on the tongue base
//  2.5-4.5  low orbit to the side while a cut window opens in the lower jaw: blood drawn from the tongue's artery,
//           the tongue pales and withers to a stub, the isopod shifts forward and clamps the stub
//  4.5-6.0  back up to the mouth view; the fish closes and reopens its mouth: the parasite is still there
import React from 'react';
import {HookFrame, HookProps} from '../shared/HookFrame';
import WORDS from '../data/h01_words.json';
import {clamp, hash, keyCR, keyS, lerp, noise1, sm, ss, Words, wordAt} from '../shared/lib';
import {basis, orbitCam, V3} from '../shared/three';
import {Ctx, FishPose, fw, jawRot, P, PJ} from './geo';
import {aboveNearRim, UpperLip, Eye, Floor, HeadBack, HeadMarks, JawOut, jawPath, LipBand, Maxilla, NearCheek, Snout, Throat} from './fish';
import {ClawDimples, Isopod, IsoPose, isoShadow, isoToJaw} from './iso';
import {FLOOR_Z, Section, Tongue3D, tongueAt, tongueState, windowPath} from './tongue';
import {Backdrop, Motes} from './env';

const W = WORDS as Words;
const w = (s: string, n = 0) => wordAt(W, s, n).start;

/** every event time, in seconds (mirrored in tools/audio/h01.py) */
export const TL = {
  open: [0.0, 0.85] as const, // mouth opens (already parted at frame 0)
  flex: [0.95, 2.55] as const, // parasite flexes, jaw works
  regrip: [1.3, 1.75, 2.15] as const, // claw re-grip clicks
  winOpen: [w('tongue') + 0.02, w('tongue') + 0.66] as const, // 2.21-2.85 cut window opens at the bite
  feed: [2.55, 4.05] as const, // blood drawn from the artery
  decay: [w('then') - 0.12, w('new') + 0.05] as const, // 2.87-4.08 tongue pales and withers
  slide: [w('its') + 0.04, w('new') + 0.32] as const, // 3.75-4.35 parasite shifts forward onto the stub
  winClose: [w('tongue', 1) - 0.05, w('tongue', 1) + 0.5] as const, // 4.30-4.85
  close: [4.86, 5.14] as const, // mouth snaps shut
  reopen: [5.3, 5.74] as const, // and opens again: still there
};

const jawAngle = (t: number) =>
  keyS(t, [[0, 19], [0.42, 23], [0.85, 29], [1.38, 23], [1.92, 30.5], [2.5, 21], [3.3, 18], [4.1, 20], [TL.close[0], 26], [TL.close[1], 3.5], [TL.reopen[0], 5], [TL.reopen[1], 25], [6.0, 22.5]]);

const cam = (t: number) => {
  const az = keyCR(t, [[0, -60], [1.0, -57], [2.05, -46], [2.95, -24], [3.6, -20.5], [4.25, -24], [5.05, -58], [6.0, -65]]);
  const el = keyCR(t, [[0, 12], [1.0, 15], [2.05, 16], [2.95, 6], [3.6, 4.5], [4.25, 6], [5.05, 10], [6.0, 9]]);
  const d = Math.exp(keyCR(t, [[0, Math.log(205)], [1.0, Math.log(180)], [2.05, Math.log(128)], [2.95, Math.log(98)], [3.6, Math.log(96)], [4.25, Math.log(108)], [5.05, Math.log(150)], [6.0, Math.log(118)]]));
  const tf: V3 = [keyCR(t, [[0, 8], [1.0, 8], [2.05, 9.5], [2.95, 12.5], [3.6, 13], [4.25, 15], [5.05, 16.5], [6.0, 18]]), 3,
    keyCR(t, [[0, 4], [1.0, 3], [2.05, 1], [2.95, -2.2], [3.6, -2.4], [4.25, -2], [5.05, 0.5], [6.0, 0.0]])];
  const jaw = keyCR(t, [[0, 0.2], [1.0, 0.4], [2.05, 0.8], [2.95, 1], [4.25, 1], [5.05, 0.7], [6.0, 0.7]]);
  const cx = keyCR(t, [[0, 400], [1.0, 430], [2.05, 470], [4.25, 520], [5.05, 480], [6.0, 470]]);
  const cy = keyCR(t, [[0, 1010], [1.0, 1020], [2.05, 1100], [2.95, 1370], [4.25, 1350], [5.05, 1200], [6.0, 1130]]);
  return {az, el, d, tf, jaw, cx, cy};
};

export const Scene: React.FC<{t: number}> = ({t}) => {
  // ---------------------------------------------------------------- fish
  const alpha = jawAngle(t);
  const fish: FishPose = {
    alpha,
    prot: 0.06 * alpha,
    bob: [0.7 * Math.sin(t * 1.1), 0.5 * Math.sin(t * 0.7 + 1), 0.6 * Math.sin(t * 1.6 + 0.4)],
    yaw: 1.4 * Math.sin(t * 0.8 + 0.3),
    pitch: 0.9 * Math.sin(t * 1.25),
  };
  const c = cam(t);
  const target = fw(fish, jawRot(c.tf, 22 * c.jaw));
  const camera = orbitCam({target, az: c.az, el: c.el, d: c.d, f: 5600, cx: c.cx, cy: c.cy});
  const C: Ctx = {B: basis(camera), fish};
  const uid = 'h01';

  // ---------------------------------------------------------------- story state
  const decay = ss(t, TL.decay[0], TL.decay[1]);
  const T = tongueState(decay);
  const slide = ss(t, TL.slide[0], TL.slide[1]);
  const flexEnv = ss(t, TL.flex[0] - 0.2, TL.flex[0] + 0.2) * (1 - ss(t, TL.flex[1] - 0.2, TL.flex[1] + 0.3));
  const ox = lerp(-3.7, 2.6, slide);
  const headFx = ox + 12.2;
  const front = tongueAt(T, Math.max(T.base + 0.8, Math.min(T.tip - 0.8, headFx - 2.2)));
  // rest the head on the tongue (or the stub), the rear on the floor
  const headZ = Math.max(FLOOR_Z, front.top) + 0.15;
  const peek = ss(t, TL.reopen[0] + 0.1, 6.0);
  const tilt = (Math.atan2(headZ - FLOOR_Z, 25) * 180) / Math.PI + 4.5 * peek;
  const oz = FLOOR_Z + 13 * Math.sin((tilt * Math.PI) / 180);
  const lift = [0, 1, 2, 3, 4, 5, 6].map((k) => (k < 2 ? Math.sin(Math.PI * clamp((t - TL.slide[0] + k * 0.08) / 0.45)) * 0.9 : 0));
  const cone = ss(t, TL.feed[0] - 0.25, TL.feed[0] + 0.1) * (1 - ss(t, TL.feed[1], TL.feed[1] + 0.3));
  const P0: IsoPose = {
    ox, oz, tilt,
    curl: 0.12 * Math.sin(t * 2 * Math.PI * 0.8) + flexEnv * 0.42 * Math.sin(t * 2 * Math.PI * 1.45 - 0.6) + 0.25 * Math.sin(Math.PI * slide),
    sway: 0.22 * Math.sin(t * 2 * Math.PI * 0.6 + 1) + flexEnv * 0.4 * Math.sin(t * 2 * Math.PI * 1.1),
    nod: 0.12 * Math.sin(t * 2 * Math.PI * 1.05) + flexEnv * 0.2 * Math.sin(t * 2 * Math.PI * 1.45),
    breathe: Math.sin(t * 2 * Math.PI * 1.4),
    t,
    flex: Math.max(0.35, flexEnv, Math.sin(Math.PI * slide)),
    cone,
    front: {fx: Math.max(T.base + 0.9, Math.min(T.tip - 1.2, headFx - 2.2)), top: front.top, w: Math.max(front.w, 2.4)},
    lift,
  };
  const bite = isoToJaw(P0, [13.6, 0, 0.5 - 1.9 * cone]);
  const coneBase = isoToJaw(P0, [13.4, 0, 0.6]);
  const flow = ss(t, TL.feed[0], TL.feed[0] + 0.3) * (1 - ss(t, TL.feed[1] - 0.2, TL.feed[1] + 0.1));

  const wo = ss(t, TL.winOpen[0], TL.winOpen[1]) * (1 - ss(t, TL.winClose[0], TL.winClose[1]));
  const win = windowPath(C, wo, bite, t);
  const above = aboveNearRim(C);
  const jp = jawPath(C);

  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <Backdrop C={C} t={t} az={c.az} el={c.el} />
      <defs>
        <clipPath id={uid + 'see'}>
          <path d={above} />
          {win && <path d={win} />}
        </clipPath>
        <clipPath id={uid + 'abv'}><path d={above} /></clipPath>
        <clipPath id={uid + 'jc'}><path d={jp} /></clipPath>
        {win && <clipPath id={uid + 'wc'}><path d={win} /></clipPath>}
        <mask id={uid + 'nw'} maskUnits="userSpaceOnUse" x="-2000" y="-2000" width="6000" height="6000">
          <rect x="-2000" y="-2000" width="6000" height="6000" fill="#FFF" />
          {win && <path d={win} fill="#000" />}
        </mask>
      </defs>
      <HeadBack ctx={C} t={t} uid={uid} />
      <Throat ctx={C} t={t} uid={uid} />
      <JawOut ctx={C} t={t} uid={uid} />
      <g clipPath={`url(#${uid}see)`}>
        <Floor ctx={C} t={t} uid={uid} />
      </g>
      <g clipPath={`url(#${uid}abv)`} mask={`url(#${uid}nw)`}>
        <path d={isoShadow(C, P0, FLOOR_Z)} fill="#2A0810" opacity={0.35} />
        <Tongue3D C={C} T={T} uid={uid} />
      </g>
      {win && (
        <g clipPath={`url(#${uid}wc)`}>
          <g clipPath={`url(#${uid}jc)`}>
            <path d={win} fill="#5A1A24" />
            <Section C={C} T={T} F={{flow, t, bite, coneBase}} uid={uid} t={t} />
            <path d={win} fill="none" stroke="#2A0A10" strokeOpacity={0.35} strokeWidth={26} />
          </g>
        </g>
      )}
      <LipBand ctx={C} t={t} uid={uid} from={-79} to={-6} />
      {win && (
        <g clipPath={`url(#${uid}jc)`}>
          <path d={win} fill="none" stroke="#F4C0B2" strokeWidth={8} opacity={clamp(wo * 3)} />
          <path d={win} fill="none" stroke="#172B3A" strokeWidth={2.6} opacity={clamp(wo * 3)} />
        </g>
      )}
      <g clipPath={`url(#${uid}see)`}>
        <ClawDimples C={C} P0={P0} uid={uid} />
        <Isopod C={C} P0={P0} uid={uid + 'i'} />
      </g>
      <LipBand ctx={C} t={t} uid={uid} from={-12} to={79} mask={`url(#${uid}nw)`} />
      <NearCheek ctx={C} t={t} uid={uid} />
      <HeadMarks ctx={C} t={t} uid={uid} />
      <Snout ctx={C} t={t} uid={uid} />
      <Maxilla ctx={C} t={t} uid={uid} />
      <UpperLip ctx={C} t={t} uid={uid} />
      <Eye ctx={C} t={t} uid={uid} />
      <Motes C={C} t={t} />
    </svg>
  );
};

export const Hook: React.FC<HookProps> = (props) => (
  <HookFrame hook="01" W={W} bg="#123038" capY={320} props={props}>
    {(t) => <Scene t={t} />}
  </HookFrame>
);
