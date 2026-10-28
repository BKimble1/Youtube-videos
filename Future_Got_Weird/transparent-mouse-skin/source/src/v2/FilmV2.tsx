// FGW "This Food Dye Makes Mouse Skin See-Through" V2: hook and retention rebuild on V1's locked narration.
// Shots (production/V2_SHOTS_AND_TRANSITIONS.md):
//   H  0.00-2.80  tight on the abdomen: the swab sweeping, the clear red-orange window spreading behind it
//   T  2.80-4.00  the camera tilts down to a low three-quarter view: skin surface over the organs (2.5D parallax)
//   C  4.00-5.15  closer to the intestines working beneath the skin
//   O  5.15-6.76  cut: outside, the whole mouse, intact; light runs along the unbroken belly
//   W  6.76-7.52  a wipe back in time that follows the gloved hand sweeping across
//   M  7.42-9.25  food colouring drips into the dish; the swab loads and carries it onto the skin; it spreads
//   Z  9.25-10.08 zoom through the spreading liquid (the camera tilts to grazing) into the tissue
//   X  10.08-19.85 the microscopic journey (Micro.tsx); out through the clear tissue to the moving organs
//   R  19.85-24.38 rinse: water and dye run off; the skin hides the organs again; pull out to a normal mouse
//   L  24.38-25.07 reframe into the opening: the swab arrives and the next sweep begins (loop)
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {Bench} from '../art/Bench';
import {MC} from '../art/Mouse';
import {BottleHand, Stream, SwabHand} from '../art/Operator';
import {clamp, easeInOut, easeOut, inv, lerp, V} from '../dc/math';
import {FPS} from '../lib';
import {B2} from './beatsV2';
import {CaptionsV2} from './CaptionsV2';
import {MicroCam, MicroState, MicroWorld, ORGAN, SURF} from './Micro';
import {MouseV2, MouseV2State, trackAt, trackTo} from './MouseV2';
import {DISH, Dish, Drop, FoodColoring} from './Props';
import {Cam, Plane, toScreen} from './Stage';

export type FilmV2Props = {audio: string | null; captions: boolean};
const lc = (a: Cam, b: Cam, u: number): Cam => ({x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), z: lerp(a.z, b.z, u), r: lerp(a.r, b.r, u), tilt: lerp(a.tilt, b.tilt, u)});
const lz = (a: Cam, b: Cam, u: number): Cam => ({...lc(a, b, u), z: a.z * Math.pow(b.z / a.z, u)}); // zoom at a constant rate

// ---------------- cameras ----------------
const HOOK0: Cam = {x: 575, y: 1062, z: 2.85, r: -4, tilt: 0};
const HOOK1: Cam = {x: 556, y: 1066, z: 3.12, r: -7, tilt: 0};
const TILT: Cam = {x: 548, y: 1092, z: 2.55, r: -15, tilt: 46};
const TILT2: Cam = {x: 552, y: 1094, z: 2.6, r: -19, tilt: 47};
const CLOSE: Cam = {x: 566, y: 1112, z: 4.5, r: -11, tilt: 20};
const OUT0: Cam = {x: 540, y: 990, z: 1.02, r: 6, tilt: 32};   // the whole, intact mouse from a low angle...
const OUT1: Cam = {x: 548, y: 1030, z: 1.42, r: -1, tilt: 12}; // ...leaning in and over the belly
const DISHC: Cam = {x: 900, y: 790, z: 2.1, r: 0, tilt: 0};
const SKIN: Cam = {x: 585, y: 1040, z: 2.35, r: -6, tilt: 22};
const GRAZE: Cam = {x: 600, y: 1010, z: 9, r: -6, tilt: 40};
const ORG_IN: Cam = {x: 548, y: 1092, z: 11, r: -6, tilt: 0};
const WASH: Cam = {x: 548, y: 1078, z: 2.45, r: -4, tilt: 28};
const NORMAL: Cam = {x: 540, y: 1010, z: 1.15, r: 0, tilt: 0};

const camAt = (t: number): Cam => {
  if (t < B2.tilt0) return lc(HOOK0, HOOK1, easeOut(inv(0, B2.tilt0, t) * 0.92 + 0.08 * inv(0, B2.tilt0, t)));
  if (t < B2.close0) return t < B2.tilt1 ? lc(HOOK1, TILT, easeInOut(inv(B2.tilt0, B2.tilt1, t))) : lc(TILT, TILT2, inv(B2.tilt1, B2.close0, t));
  if (t < B2.outside) return lz(TILT2, CLOSE, easeInOut(inv(B2.close0, B2.close1, t)));
  // outside: a slow descending push-in; during the wipe it carries on over to the dish (following the hand)
  if (t < B2.dip1 - 0.05) return lc(lc(OUT0, OUT1, easeOut(inv(B2.outside, B2.wipe1, t))), DISHC, easeInOut(inv(B2.wipe0 + 0.15, B2.dropFall + 0.12, t)));
  // the camera follows the loaded swab from the dish to the skin
  if (t < B2.zoom0) return lc(DISHC, SKIN, easeInOut(inv(B2.dip1 - 0.05, B2.contact + 0.3, t)));
  if (t < B2.out0) return lz(SKIN, GRAZE, easeInOut(inv(B2.zoom0, B2.zoom1, t)));
  // out of the tissue: one continuous pull-out from deep on the organs to the wash framing
  if (t < B2.pull0) return lz(ORG_IN, WASH, easeInOut(inv(B2.out0, B2.rinse0 + 0.3, t)));
  if (t < B2.loop0) return lz(WASH, NORMAL, easeInOut(inv(B2.pull0, B2.normal + 0.1, t)));
  return lz(NORMAL, HOOK0, easeInOut(inv(B2.loop0, B2.end, t)));
};

// ---------------- the hook's track: u(t) of the swab, and the clearing lagging behind ----------------
const U0 = 0.16; // at frame 0 the window has already begun
const LAG = 0.05;
const hookU = (t: number) => U0 + (1 - U0) * clamp(1 - (1 - inv(0, B2.swabDone, t)) ** 1.35);
const loopU = (t: number) => U0 * easeInOut(inv(B2.loop0 + 0.2, B2.end, t)); // the next sweep starting (wraps to frame 0)

const mouseAt = (t: number): MouseV2State => {
  const base = {t, wet: 0, rinse: 0, rinseFlow: 0, tint: 1};
  if (t < B2.outside) {
    const u = hookU(t);
    const full = easeInOut(inv(B2.swabDone - 0.25, B2.hookEnd, t));
    const T = lerp(0.85, 1, easeOut(inv(0, 0.5, t)));
    const sweep = t > B2.tilt0 + 0.2 && t < B2.close0 + 0.2 ? lerp(-1.3, 1.3, easeInOut(inv(B2.tilt0 + 0.2, B2.close0 + 0.2, t))) : undefined;
    return {...base, T, reveal: {pts: trackTo(u - LAG), w: 150, full}, wetPts: trackTo(u), wetW: 165, wet: 1 - full * 0.85, sweep};
  }
  if (t < B2.wipe1) {
    const sw = t > B2.outside + 0.15 ? lerp(-1.2, 1.2, easeInOut(inv(B2.outside + 0.15, B2.wipe0, t))) : undefined;
    return {...base, T: 1, reveal: {pts: [], w: 150, full: 1}, bodySweep: sw};
  }
  if (t < B2.out0) {
    // earlier: ordinary skin; the solution spreads over it as the swab rubs (no clearing yet)
    const u = clamp(inv(B2.contact, B2.rubEnd, t));
    const spread = easeOut(inv(B2.contact, B2.zoom1, t));
    return {...base, T: 0, tint: 0, reveal: {pts: [], w: 150, full: 0}, wetPts: trackTo(Math.max(0.0001, u)), wetW: lerp(120, 190, spread), wet: t > B2.contact ? 1 : 0};
  }
  if (t < B2.bottleIn + 0.1) return {...base, T: 1, reveal: {pts: [], w: 150, full: 1}};
  // rinse, then the skin hides the organs again; at the very end the next sweep begins
  const flow = easeInOut(inv(B2.rinse0 + 0.05, B2.rinse1 - 0.1, t));
  const rinse = Math.min(easeOut(inv(B2.rinse0, B2.rinse0 + 0.25, t)), 1 - easeInOut(inv(B2.rinse1, B2.hide1, t)));
  const hide = easeInOut(inv(B2.hide0, B2.hide1, t));
  if (t < B2.loop0) return {...base, T: 1 - hide, tint: 1 - hide * 0.95, reveal: {pts: [], w: 150, full: 1}, rinse, rinseFlow: flow};
  const u = loopU(t);
  const T = 0.85 * easeInOut(inv(B2.end - 0.45, B2.end, t));
  return {...base, T, tint: 1, reveal: {pts: trackTo(u - LAG), w: 150, full: 0}, wetPts: trackTo(u), wetW: 165, wet: 1};
};

// ---------------- micro: optical state and camera ----------------
const microAt = (t: number): MicroState => {
  const k = easeInOut(inv(B2.rebend - 0.15, B2.settled, t));
  const pulse = (a: number, d = 0.9) => Math.max(0, Math.sin(clamp((t - a) / d) * Math.PI));
  return {
    t, nW: lerp(1.33, 1.6, k),
    dyeFront: t < B2.dyeIn ? -1e4 : lerp(SURF - 50, ORGAN + 50, easeInOut(inv(B2.dyeIn, B2.watery + 1.0, t))),
    tintW: easeInOut(inv(B2.dyeIn + 0.3, B2.watery + 1.1, t)),
    edges: lerp(1, 0.22, easeInOut(inv(B2.likeFat - 0.4, B2.settled, t))),
    reveal: t < B2.bend - 0.6 ? 0.18 : easeInOut(inv(B2.bend - 0.6, B2.bend + 0.9, t)) * 0.82 + 0.18,
    scatter: easeInOut(inv(B2.scatter - 0.2, B2.scatter + 0.4, t)) * (1 - k),
    veil: clamp((0.35 + 0.65 * easeInOut(inv(B2.scatter, B2.hide + 0.5, t))) * (1 - k)),
    waterGlow: Math.max(pulse(B2.water - 0.05), pulse(B2.watery - 0.05)),
    fatGlow: pulse(B2.fat - 0.05),
  };
};
const MC0: MicroCam = {x: 60, y: 300, z: 0.42};
const MC1: MicroCam = {x: 40, y: 420, z: 1.0};
const micCamAt = (t: number): MicroCam => {
  const m = (a: MicroCam, b: MicroCam, u: number): MicroCam => ({x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), z: a.z * Math.pow(b.z / a.z, u)});
  const DESC: MicroCam = {x: 80, y: 760, z: 1.1};
  const WIDE: MicroCam = {x: 0, y: 1200, z: 0.62};
  const DEEPV: MicroCam = {x: -40, y: 1880, z: 0.8};
  const UP: MicroCam = {x: 0, y: 1240, z: 0.7};
  const SETTLE: MicroCam = {x: 0, y: 1950, z: 0.85};
  const AWAY: MicroCam = {x: 0, y: 2150, z: 0.74}; // still frame-filling while it fades
  if (t < B2.zoom1) return m(MC0, MC1, easeOut(inv(B2.zoom0 + 0.45, B2.zoom1, t)));
  if (t < B2.bend - 0.2) return m(MC1, DESC, easeInOut(inv(B2.zoom1, B2.bend - 0.2, t)));
  // travelling down with the light as it bends (a smooth descent that sways with the rays), then opening out wide
  const ride = (): MicroCam => {
    const u = easeInOut(inv(B2.bend - 0.2, B2.hide, t));
    return {x: lerp(80, -40, u) + 46 * Math.sin(u * Math.PI * 1.6), y: lerp(760, 1340, u), z: lerp(1.1, 1.3, Math.sin(u * Math.PI))};
  };
  if (t < B2.scatter) return ride();
  if (t < B2.hide) return m(ride(), WIDE, easeInOut(inv(B2.scatter, B2.hide, t)));
  if (t < B2.dyeIn) return m(WIDE, DEEPV, easeInOut(inv(B2.hide, B2.dyeIn - 0.1, t)));
  if (t < B2.rebend) return m(DEEPV, UP, easeInOut(inv(B2.dyeIn - 0.1, B2.watery + 0.2, t)));
  if (t < B2.out0) return m(UP, SETTLE, easeInOut(inv(B2.rebend, B2.settled - 0.1, t)));
  return m(SETTLE, AWAY, easeInOut(inv(B2.out0, B2.out1, t)));
};

// ---------------- frame ----------------
const SWAB_K = 1.8; // a real cotton-swab tip against a mouse belly: about a third of the clearing patch's width
const PAD_STAIN = (u: number) => (
  // rinse runoff soaking into the pad beside the flanks: small, faint, tinted
  <g opacity={0.28 * clamp(u * 2)} style={{filter: 'blur(8px)'}}>
    <ellipse cx={330} cy={1230} rx={26 + 22 * u} ry={60 + 70 * u} fill="#E7A93A" />
    <ellipse cx={756} cy={1210} rx={30 + 26 * u} ry={70 + 80 * u} fill="#E7A93A" />
  </g>
);

export const FrameV2: React.FC<{f: number; captions: boolean}> = ({f, captions}) => {
  const t = f / FPS;
  const cam = camAt(t);
  const ms = mouseAt(t);
  const inMicro = t >= B2.zoom1 - 0.3 && t < B2.out1 + 0.02;
  const microA = t < B2.zoom1 + 0.1 ? easeInOut(inv(B2.zoom1 - 0.3, B2.zoom1 + 0.05, t)) : 1 - easeInOut(inv(B2.out0 + 0.2, B2.out1, t));
  const macroVisible = !(t > B2.zoom1 + 0.06 && t < B2.out0 + 0.2);
  // operator: the hook swab, the wipe swab, the method swab, the loop swab
  const hand: React.ReactNode[] = [];
  if (t < B2.swabOut + 0.2) {
    const u = hookU(t);
    const out = easeInOut(inv(B2.swabDone - 0.05, B2.swabOut + 0.15, t));
    const p = trackAt(u);
    const tip = {x: lerp(p.x, p.x + 420, out), y: lerp(p.y, p.y + 300, out)};
    hand.push(<SwabHand key="h" id="sw-h" tip={tip} ang={30 + 5 * Math.sin(t * 6)} lift={out} k={SWAB_K} />);
  }
  let wipeX = -1;
  let wipeHand: React.ReactNode = null;
  if (t > B2.wipe0 - 0.1 && t < B2.wipe1 + 0.1) {
    // the gloved hand sweeps left -> right across the frame; the earlier scene follows it in
    const u = easeInOut(inv(B2.wipe0, B2.wipe1, t));
    const tipS = {x: lerp(-260, 1340, u), y: lerp(1180, 900, u)};
    wipeX = tipS.x;
    wipeHand = <SwabHand id="sw-w" tip={tipS} ang={200} lift={0.6} k={3.2 * cam.z} />;
  }
  if (t > B2.dish0 && t < B2.zoom0 + 0.3) {
    // method swab: waits by the dish, dips, carries the solution to the skin, rubs along the track
    const wait = {x: DISH.x - 150, y: DISH.y + 150};
    const dipP = {x: DISH.x - 30, y: DISH.y + 20};
    let tip: V = wait, lift = 0.5;
    if (t < B2.dip0) { tip = {x: lerp(wait.x - 200, wait.x, easeOut(inv(B2.dish0, B2.dish0 + 0.4, t))), y: wait.y}; }
    else if (t < B2.dip1) { const u = Math.sin(inv(B2.dip0, B2.dip1, t) * Math.PI); tip = {x: lerp(wait.x, dipP.x, u), y: lerp(wait.y, dipP.y, u)}; lift = 1 - u; }
    else if (t < B2.contact) { const u = easeInOut(inv(B2.dip1, B2.contact, t)); const c0 = trackAt(0); tip = {x: lerp(wait.x, c0.x, u), y: lerp(wait.y, c0.y, u) - 60 * Math.sin(u * Math.PI)}; lift = 1 - u; }
    else { tip = trackAt(clamp(inv(B2.contact, B2.rubEnd, t))); lift = 0; }
    hand.push(<SwabHand key="m" id="sw-m" tip={tip} ang={34 + 5 * Math.sin(t * 6)} lift={lift} k={SWAB_K} />);
  }
  if (t > B2.loop0 + 0.05) {
    const u = loopU(t);
    const inU = easeOut(inv(B2.loop0 + 0.05, B2.loop0 + 0.45, t));
    const p = trackAt(Math.max(0, u));
    const tip = {x: lerp(p.x + 420, p.x, inU), y: lerp(p.y + 300, p.y, inU)};
    hand.push(<SwabHand key="l" id="sw-l" tip={tip} ang={30 + 5 * Math.sin(t * 6)} lift={1 - inU} k={SWAB_K} />);
  }
  // rinse bottle
  let bottle: React.ReactNode = null, stream: React.ReactNode = null;
  if (t > B2.bottleIn && t < B2.hide0 + 0.6) {
    const inU = easeOut(inv(B2.bottleIn, B2.rinse0, t)), outU = easeInOut(inv(B2.rinse1 - 0.1, B2.hide0 + 0.5, t));
    const home = {x: 700, y: 860}, off = {x: 1060, y: 560};
    const nz = {x: lerp(lerp(off.x, home.x, inU), off.x, outU), y: lerp(lerp(off.y, home.y, inU), off.y, outU) + 8 * Math.sin(t * 3)};
    const sq = Math.min(inv(B2.rinse0 - 0.05, B2.rinse0 + 0.1, t), 1 - inv(B2.rinse1 - 0.25, B2.rinse1 - 0.05, t));
    bottle = <BottleHand id="wb2" nozzle={nz} ang={-40} squeeze={sq} />;
    const land = {x: lerp(520, 556, inv(B2.rinse0, B2.rinse1, t)), y: lerp(900, 1220, easeInOut(inv(B2.rinse0, B2.rinse1, t)))};
    stream = <Stream from={nz} to={land} a={sq} t={t} />;
  }
  // food colouring and dish (method)
  const bloom = easeOut(inv(B2.dropLand, B2.dropLand + 0.55, t));
  const ripple = inv(B2.dropLand, B2.dropLand + 0.7, t);
  const dropU = inv(B2.dropFall, B2.dropLand, t);
  const sq = Math.max(0, Math.sin(clamp(inv(B2.dropFall - 0.25, B2.dropFall + 0.1, t)) * Math.PI));
  const bottleTilt = lerp(-30, 0, easeInOut(inv(B2.dish0, B2.dropFall - 0.1, t))) + (t > B2.dropLand + 0.2 ? -30 * easeInOut(inv(B2.dropLand + 0.2, B2.dip1, t)) : 0);
  const stain = easeInOut(inv(B2.rinse0 + 0.3, B2.hide1, t));
  const earlier = t >= B2.wipe0 && t < B2.out0;
  const world = (mode: 'now' | 'earlier', ms2: MouseV2State, idp: string) => (
    <>
      <Plane cam={cam} depth={160} far>
        <Bench id={`${idp}b`} wetStain={stain} dish={false} />
        {t > B2.rinse0 && PAD_STAIN(easeOut(inv(B2.rinse0 + 0.3, B2.hide1, t)))}
        <Dish bloom={mode === 'earlier' && t < B2.dropLand ? 0 : mode === 'earlier' ? bloom : 1} ripple={mode === 'earlier' ? ripple : 0} dip={mode === 'earlier' ? inv(B2.dip0 + 0.1, B2.dip1 + 0.3, t) : 0} />
        {mode === 'earlier' && t < B2.zoom0 && (
          <>
            <Drop x0={DISH.x + 10} y0={DISH.y - 120} x1={DISH.x - 10} y1={DISH.y - 6} u={dropU} />
            <FoodColoring nx={DISH.x + 14} ny={DISH.y - 130} tilt={bottleTilt} squeeze={sq} />
          </>
        )}
      </Plane>
      <Plane cam={cam} depth={26}><MouseV2 id={`${idp}u`} s={ms2} layer="under" /></Plane>
      <Plane cam={cam} depth={0}><MouseV2 id={`${idp}o`} s={ms2} layer="over" /></Plane>
    </>
  );
  const nowState: MouseV2State = t >= B2.wipe0 && t < B2.wipe1 + 0.1 ? {...ms, T: 1, tint: 1, reveal: {pts: [], w: 150, full: 1}} : ms;
  const earlyState: MouseV2State = {t, T: 0, tint: 0, reveal: {pts: [], w: 150, full: 0}, wet: 0, rinse: 0, rinseFlow: 0};
  const mic = inMicro ? microAt(t) : null;
  return (
    <AbsoluteFill style={{backgroundColor: '#56677A', overflow: 'hidden'}}>
      {macroVisible && (
        <>
          {(!earlier || t < B2.wipe1) && (
            <AbsoluteFill style={{clipPath: wipeX >= 0 ? `inset(0 0 0 ${clamp(wipeX, 0, 1080)}px)` : undefined}}>{world('now', nowState, 'n')}</AbsoluteFill>
          )}
          {earlier && (
            <AbsoluteFill style={{clipPath: t < B2.wipe1 ? `inset(0 ${1080 - clamp(wipeX, 0, 1080)}px 0 0)` : undefined}}>{world('earlier', t < B2.wipe1 ? earlyState : ms, 'e')}</AbsoluteFill>
          )}
          <Plane cam={cam} depth={-30}>{stream}{bottle}{hand}</Plane>
          {cam.tilt > 4 && (
            // depth haze: the far bench falls out of focus at a steep angle
            <AbsoluteFill style={{background: 'linear-gradient(180deg, #5E6F82 0%, rgba(94,111,130,0.85) 9%, rgba(94,111,130,0) 22%)', opacity: clamp((cam.tilt - 4) / 30), pointerEvents: 'none'}} />
          )}
          {wipeHand && <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', left: 0, top: 0}}>{wipeHand}</svg>}
        </>
      )}
      {mic && <MicroWorld s={mic} cam={micCamAt(t)} opacity={microA} />}
      {captions && <CaptionsV2 t={t} />}
    </AbsoluteFill>
  );
};

export const FilmV2: React.FC<FilmV2Props> = ({audio, captions}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <FrameV2 f={f} captions={captions} />
      {audio && <Audio src={staticFile(`audio/${audio}.wav`)} />}
    </AbsoluteFill>
  );
};
export {MC, toScreen};
