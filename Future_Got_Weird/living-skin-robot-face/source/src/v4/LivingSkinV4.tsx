// FGW "This Robot Is Wearing Living Human Skin" V4: final continuity pass on V3, on the SAME approved audio mix,
// narration, captions and 27.2 s runtime. V3's art and materials are kept; the camera choreography and scene
// sequencing are rebuilt so each object is followed continuously into its detail and back out:
//   face (0-10.4 s): one shot. Corner tug -> local cutaway -> cell -> pull back down the gel column to the insert's
//     central perforation -> the grin composition with the cutaway still open -> push into that perforation -> along
//     the link to the motor -> the motor pulls -> pull back to the raised corner. (No cut to a separate anchor diagram,
//     no face insert after the motor.)
//   finger (10.4-24.13 s): one world. Earlier-experiment cut at 10.4 s -> push in as the scalpel comes in -> incision ->
//     withdrawal -> graft approach and contact -> a local section opens in place -> Day 0-7 -> the section closes over
//     the repaired surface -> whole finger flexes -> joint cutaway. (No side window, no wide reset, no patch panel.)
//   end (24.13-27.2 s): covering-over-rigid boundary match to the face's chin rim -> one move to the opening framing.
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import '@fontsource-variable/nunito';
import '@fontsource-variable/fredoka';
import '@fontsource/jetbrains-mono/700.css';
import {FPS, DUR, Cam, camT, lerp, inv, ramp, eio, eout, ein, clamp, toScreen, sstep, camAt} from '../lib';
import {FaceDevice4, F2, covPt, proj, View, cutMap, CUT, formZ, notchAt, M4, insTravel} from './Face4';
import {HERO} from '../v2/Tissue2';
import {FX, CUE2, trackCam, Backdrop2, Parallax} from '../v2/common2';
import {Captions, Chip, fadeWin, DayCounter} from '../Overlay';
import {FingerSide, FS, fingerPoint} from '../art/Finger';
import {CollarShadow, fp} from '../v3/Finger3';
import {heroPos3, RP3} from '../v3/Repair3';
import {Slit, Graft4, graftPt, Section4, slitTip, fpe, microPt, SW, SIG, Scalpel, Tweezers} from './Finger4';

const f30 = (s: number) => Math.round(s * FPS) / FPS;
export const SH4 = {
  cut: f30(FX.slice), dive: f30(FX.dive), micro: f30(FX.arrive), pull: f30(FX.pullBack),
  land: f30(CUE2.face + 0.37), push: f30(CUE2.tiny - 0.45), finger: f30(FX.hook2),
  mech: f30(FX.clack - 0.03), face: f30(FX.boundary - 0.03),
};
const XC = 148;

// ---------- face: one shot, 0 - 10.4 s ----------
export const smile4 = (t: number) => lerp(0.1, 1, eio(inv(-0.7, 0.85, t)));
const faceS = (t: number) => {
  // after the opening tug the corner eases off while the camera goes in, so the dive passes through calm tissue
  if (t < SH4.pull + 0.45) return Math.min(1, smile4(t)) * (1 - 0.8 * ramp(FX.alive + 0.3, SH4.dive - 0.05, t, eio));
  if (t < FX.smileMotor) return lerp(0.2, 0.08, ramp(SH4.pull + 0.45, SH4.land - 0.4, t, eio));
  if (t < SH4.push) return lerp(0.08, 1, ramp(FX.smileMotor, FX.smileMotor + 0.72, t, (x) => 1 - Math.pow(1 - x, 2.4)));
  if (t < FX.motorPull) return lerp(1, 0.2, ramp(SH4.push + 0.05, CUE2.tiny + 0.35, t, eio));
  return lerp(0.2, 1, ramp(FX.motorPull + 0.02, FX.latch, t, eio));
};
const faceV = (t: number): View => {
  const toSide = ramp(SH4.cut + 0.04, SH4.dive - 0.1, t, eio);
  const back = ramp(SH4.pull + 0.92, SH4.land, t, eio);
  const edge = ramp(SH4.push + 0.1, CUE2.tiny + 0.5, t, eio); // turn the cutaway wall toward the lens for the close look
  const out = ramp(FX.motorPull + 0.45, SH4.finger - 0.15, t, eio);
  return {yaw: lerp(lerp(lerp(lerp(-0.42, -0.85, toSide), -0.62, back), -1.0, edge), -0.78, out), pitch: 0.07};
};
const notchK = (t: number) => ramp(SH4.cut - 0.02, SH4.cut + 0.24, t, eout);
const heroLift = F2.T - HERO.face.w * CUT.kT;
// the established attachment: the insert's central perforation (pocket centre), and a point in the drive
const pocketP = (t: number) => () => { const s = faceS(t); return proj({x: XC, y: M4.yI + insTravel(XC, s), z: formZ(XC, M4.yI) - M4.pd * 0.5}, faceV(t)); };
const driveP = (t: number) => () => proj({x: XC, y: M4.yI + 1, z: formZ(XC, M4.yI) - 5.5}, faceV(t));

export const CAM0_4 = {sx: 540, sy: 900, z: 5.6};
const faceCam = (t: number): Cam => {
  const v = faceV(t), s = faceS(t);
  const P = (x: number, y: number, lift = F2.T) => () => proj(covPt(x, y, s, lift), v);
  const m = cutMap(XC, s, v);
  const sc = (() => { const a = m(HERO.face.u, HERO.face.w), b = m(HERO.face.u + 10, HERO.face.w); return Math.hypot(b.x - a.x, b.y - a.y) / 10; })();
  const zD = 7 / sc;
  const heroP = () => proj(covPt(XC, CUT.yH, s, heroLift), v);
  // landing composition (grin + open cutaway + rim), and where the tracked perforation sits in it
  const vL = faceV(SH4.land), sL = faceS(SH4.land);
  const camL = camAt(proj(covPt(112, 96, sL), vL), {x: 540, y: 900}, 3.3);
  const aL = toScreen(camL, pocketP(SH4.land)());
  return trackCam(t, [
    [0, {p: P(F2.corner.x + 46, F2.corner.y - 40), ...CAM0_4}],
    [0.72, {p: P(F2.corner.x + 46, F2.corner.y - 58), sx: 540, sy: 880, z: 5.3}, (x) => x],
    [1.22, {p: P(40, 80), sx: 540, sy: 860, z: 2.05}, eio],
    [SH4.dive - 0.02, {p: heroP, sx: 540, sy: 860, z: 12}, (x) => eio(x) * 0.6 + ein(x) * 0.4],
    [SH4.micro + 0.04, {p: heroP, sx: 540, sy: 840, z: zD}, eout],
    [SH4.pull, {p: () => m(HERO.face.u + 40, HERO.face.w + 4), sx: 540, sy: 840, z: zD * 1.08}, (x) => x],
    // one pull-back: down through the gel column to the perforation under the cell, then out to the grin, still
    // tracking that perforation (monotonic zoom, no overshoot)
    [SH4.pull + 0.55, {p: pocketP(t), sx: 540, sy: 860, z: zD / 4.2}, (x) => x * x],
    [SH4.pull + 0.95, {p: pocketP(t), sx: 540, sy: 860, z: 13}, (x) => x],
    [SH4.land, {p: pocketP(t), sx: aL.x, sy: aL.y, z: 3.3}, (x) => 1 - (1 - x) * (1 - x)],
    [SH4.push, {p: pocketP(t), sx: lerp(aL.x, 540, 0.06), sy: lerp(aL.y, 900, 0.06), z: 3.4}, (x) => x],
    // "Tiny anchors": into the same perforation; then along the link to the drive and motor
    [CUE2.tiny + 0.42, {p: pocketP(t), sx: 600, sy: 900, z: 112}, eio],
    [FX.tick2 + 0.14, {p: pocketP(t), sx: 600, sy: 900, z: 118}, (x) => x],
    [CUE2.motors - 0.04, {p: driveP(t), sx: 540, sy: 940, z: 34}, eio],
    [FX.motorPull + 0.42, {p: driveP(t), sx: 540, sy: 940, z: 30}, (x) => x],
    // the motor's pull, transmitted: back out to the raised mouth corner beside the cutaway
    [SH4.finger - 0.2, {p: P(F2.corner.x + 14, F2.corner.y - 6), sx: 560, sy: 880, z: 5.6}, eio],
    [SH4.finger, {p: P(F2.corner.x + 14, F2.corner.y - 6), sx: 560, sy: 880, z: 5.45}, (x) => x],
  ]);
};

const FaceShot: React.FC<{t: number}> = ({t}) => {
  const cam = faceCam(t), v = faceV(t), s = faceS(t);
  const tone = ramp(SH4.dive + 0.16, SH4.micro, t) * (1 - ramp(SH4.pull + 0.08, SH4.pull + 0.45, t));
  const halfH = 1150 / cam.z;
  const m = cutMap(XC, s, v);
  const micro = ramp(SH4.dive + 0.2, SH4.micro, t) * (1 - ramp(SH4.pull + 0.1, SH4.pull + 0.32, t));
  const glow = [FX.tick0, FX.tick1, FX.tick2].map((x) => fadeWin(t, x - 0.02, x + 0.6, 0.1));
  const motor = Math.max(0.8 * fadeWin(t, FX.smileMotor - 0.05, FX.smileMotor + 0.7, 0.1), fadeWin(t, FX.motorPull - 0.05, SH4.finger - 0.3, 0.12));
  return (
    <>
      <Backdrop2 />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 40%, #13414B 0%, #08242B 70%, #061A20 100%)', opacity: tone}} />
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        <g transform={camT(cam)}><FaceDevice4 v={v} s={s} t={t} id="fa4" notch={notchAt(notchK(t))} tone={tone} stretch={sstep(0.2, 0.9, t)} visY={[cam.y - halfH, cam.y + halfH]} glow={glow} motor={motor} zoom={cam.z} /></g>
      </svg>
      <Parallax cam={cam} m={m} uc={HERO.face.u} wc={HERO.face.w} a={micro} id="px4" />
      <Chip text="HUMAN SKIN CELL" x={540} y={240} a={fadeWin(t, SH4.micro + 0.06, SH4.pull + 0.1, 0.12)} size={46} />
      <Chip text="UNIV. OF TOKYO · 2024" x={540} y={240} a={fadeWin(t, SH4.land - 0.1, SH4.push + 0.2, 0.15)} size={40} dot="#E0475A" />
    </>
  );
};

// ---------- finger: one world, 10.4 - 24.13 s ----------
export const flex4 = (k: number) => [0.14 * k, 0.62 * k, 0.5 * k];
const dayP = (t: number) => clamp(inv(CUE2.seven + 0.05, CUE2.close + 0.1, t));
const T = {
  sc0: 12.3, press: FX.incision - 0.2, cut1: FX.incision + 0.32, wd0: FX.incision + 0.34, wd1: FX.incision + 0.79,
  carry0: FX.incision + 0.78, carry1: FX.tweezers, drop1: FX.contact, conf1: FX.contact + 0.3,
  win0: FX.contact + 0.5, win1: FX.contact + 1.08, over: CUE2.seven - 0.1, d7: CUE2.close + 0.13,
  wc0: CUE2.close + 0.3, wc1: CUE2.close + 0.76, wide: FX.flex2 + 0.17,
};
const thAt = (t: number) => {
  if (t < FX.flex2) {
    const k = ramp(FX.flex, FX.flex + 0.34, t, eout) * (1 - ramp(FX.flex + 0.38, FX.flex + 0.8, t, eio));
    return flex4(k);
  }
  const k = ramp(FX.flex2, FX.flex2 + 0.25, t, eout) * (1 - ramp(FX.flex2 + 0.28, SH4.mech, t, eio));
  const j = ramp(FX.clack + 0.3, FX.clack + 0.95, t, eio);
  return [0.06 * k, 0.62 * k + 0.55 * j, 0.5 * k + 0.2 * j];
};
const TH0 = flex4(0);
const FIN_WIDE: Cam = {x: 92, y: -30, z: 1.6, r: 0};
const C = (x: number, y: number) => () => ({x, y});
const finCam = (t: number): Cam => {
  const th = thAt(t);
  const H = (tt: number) => () => { const h = heroPos3(dayP(tt)); return microPt(h.x, h.y, TH0); };
  const edgeW = toScreen(FIN_WIDE, microPt(RP3.gw, -46, TH0));
  return trackCam(t, [
    [SH4.finger, {p: () => fingerPoint(FS.L[0] + 4, 1, th), sx: 540, sy: 760, z: 2.5}],
    [SH4.finger + 0.55, {p: C(90, -20), sx: 540, sy: 960, z: 1.56}, eout],
    [CUE2.stranger, {p: C(100, -30), sx: 540, sy: 960, z: 1.62}, (x) => x],
    // push in to the middle segment's top as the scalpel comes in; then one framing for cut, withdrawal and graft
    [FX.incision - 0.16, {p: () => fpe(SW, 0, th), sx: 540, sy: 900, z: 10.5}, eio],
    [T.win0 - 0.2, {p: () => fpe(SW, 0, th), sx: 540, sy: 880, z: 11.6}, (x) => x],
    // into the graft: a local section opens in place, the palette turns to the microscope tone with magnification
    [T.over, {p: () => microPt(0, 40, TH0), sx: 540, sy: 900, z: 2.25 / SIG}, eio],
    [CUE2.seven + 0.05, {p: () => microPt(0, 40, TH0), sx: 540, sy: 900, z: 2.3 / SIG}, (x) => x],
    [CUE2.days + 0.45, {p: H(t), sx: 540, sy: 860, z: 4.4 / SIG}, eio],
    [CUE2.cells2 + 0.35, {p: H(t), sx: 540, sy: 860, z: 4.4 / SIG}, (x) => x],
    [CUE2.patch2 + 0.2, {p: H(t), sx: 540, sy: 860, z: 4.2 / SIG}, (x) => x],
    // day seven: the repaired section, readable; then one pull-back along the graft's edge to the whole finger
    [T.d7, {p: () => microPt(0, 30, TH0), sx: 540, sy: 900, z: 2.0 / SIG}, eio],
    [T.wide, {p: () => microPt(RP3.gw, -46, th), sx: edgeW.x, sy: edgeW.y, z: FIN_WIDE.z}, eio],
    [SH4.mech, {p: C(100, -30), sx: 540, sy: 960, z: 1.64}, (x) => x],
    [FX.clack + 0.45, {p: () => fingerPoint(FS.L[0], 0, th), sx: 540, sy: 860, z: 3.6}, eio],
    [FX.clack + 0.95, {p: () => fingerPoint(FS.L[0], 0, th), sx: 540, sy: 860, z: 4.0}, (x) => x],
    [SH4.face, {p: () => fp(150, 1 - 0.36, th), sx: 540, sy: 820, z: 4.6}, eio],
  ]);
};
const FingerWorld: React.FC<{t: number}> = ({t}) => {
  const th = thAt(t), cam = finCam(t);
  // scalpel: comes in from near the lens (larger, upper right), presses, cuts across the top, withdraws
  const app = ramp(T.sc0, T.press, t, eout), press = ramp(T.press, FX.incision, t, eio) * (1 - ramp(FX.incision, FX.incision + 0.14, t));
  const cut = ramp(FX.incision, T.cut1, t, eio), open = ramp(FX.incision + 0.04, FX.incision + 0.62, t, eout), wd = ramp(T.wd0, T.wd1, t, ein);
  const c0 = slitTip(0, TH0), tipCut = slitTip(cut, TH0);
  const tip = t < FX.incision ? {x: lerp(c0.x + 62, c0.x, app), y: lerp(c0.y - 76, c0.y, app) + 0.9 * press} : {x: tipCut.x + 70 * wd, y: tipCut.y + 0.5 - 92 * wd};
  const mult = t < FX.incision ? lerp(1.9, 1, app) : lerp(1, 1.5, wd);
  const scalpelOn = t > T.sc0 && t < T.wd1;
  // graft: carried in flat by the tweezers, lowered, contact sweeps across, released
  const carry = ramp(T.carry0, T.carry1, t, eio);
  const off = {x: lerp(78, 0, carry), y: lerp(-104, 0, carry)};
  const drop = ramp(FX.tweezers + 0.02, T.drop1, t, (x) => 1 - Math.pow(1 - x, 2.2));
  const contact = ramp(FX.contact, T.conf1, t, eio);
  const settle = t > T.conf1 ? Math.exp(-(t - T.conf1) * 9) : 0;
  const integ = dayP(t);
  const tw = ramp(FX.contact + 0.22, FX.contact + 0.34, t), away = ramp(FX.contact + 0.36, FX.contact + 0.62, t, ein);
  const jolt = t > FX.tweezers ? Math.exp(-(t - FX.tweezers) * 18) : 0;
  const twTip = (() => { const g = graftPt(1.02, -0.15, TH0, {drop, contact, settle, off}); return {x: g.x + 24 * away, y: g.y - 96 * away + 1.2 * jolt}; })();
  const W = 60 * (ramp(T.win0, T.win1, t, eout) - ramp(T.wc0, T.wc1, t, ein));
  // the microscope palette blends in over the whole push into the section, and back out over the pull-back
  const tone = ramp(T.win0 + 0.05, T.over - 0.05, t, eio) * (1 - ramp(T.d7 + 0.05, T.wc0 + 0.3, t, eio));
  const hideForCut = 1 - ramp(FX.clack - 0.02, FX.clack + 0.12, t);
  const ov = t < SH4.mech ? 1 : hideForCut;
  const halfW = 700 / cam.z;
  const vis: [number, number] = (() => { const c = (cam.x - microPt(0, 0, TH0).x) / SIG; return [c - halfW / SIG - 80, c + halfW / SIG + 80]; })();
  return (
    <>
      <Backdrop2 finger />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 40%, #13414B 0%, #08242B 70%, #061A20 100%)', opacity: 0.92 * tone}} />
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        <g transform={camT(cam)}>
          <FingerSide th={th} id="f4" cut={t < SH4.mech ? 0 : ramp(FX.clack, FX.clack + 0.38, t, eout)} />
          <CollarShadow th={th} />
          <g opacity={ov}>
            <Slit th={th} cut={cut} open={open} press={press} integ={integ} />
            {t > T.carry0 && <Graft4 th={th} id="g4" drop={drop} contact={contact} settle={settle} integ={integ} off={off} />}
          </g>
          <Section4 th={th} W={Math.max(0, W)} t={t} p={dayP(t)} tone={tone} id="sx4" heroGlow={fadeWin(t, CUE2.days, CUE2.helping, 0.2) * 0.7} vis={vis} />
          {scalpelOn && <Scalpel x={tip.x} y={tip.y} a={-38} s={0.13 * mult} />}
          {t > T.carry0 && away < 1 && <g transform={`translate(${twTip.x} ${twTip.y}) scale(0.1)`}><Tweezers x={0} y={0} open={tw} /></g>}
        </g>
      </svg>
      <Chip text="EARLIER EXPERIMENT · 2022" x={540} y={240} a={fadeWin(t, SH4.finger + 0.1, T.sc0 + 0.2, 0.12)} size={46} dot="#E0475A" />
      <Chip text="COLLAGEN PATCH" x={540} y={250} a={fadeWin(t, T.carry0 + 0.4, FX.contact - 0.05, 0.12)} size={44} dot="#E9F3F4" />
      <DayCounter p={dayP(t)} a={fadeWin(t, CUE2.seven - 0.25, T.wide, 0.15)} />
    </>
  );
};

// ---------- end: boundary match to the face's chin rim, then one move into the opening framing ----------
const FaceEnd: React.FC<{t: number}> = ({t}) => {
  const s = t > DUR - 0.7 ? smile4(t - DUR) : 0.1;
  const v: View = {yaw: -0.42, pitch: 0.07};
  const P = (x: number, y: number, lift = F2.T) => () => proj(covPt(x, y, s, lift), v);
  const ra = (92 * Math.PI) / 180;
  const rim = () => proj(covPt(F2.a * Math.cos(ra) * 0.995, F2.b * Math.sin(ra) * 0.995, s, 0), v);
  const cam = trackCam(t, [
    [SH4.face, {p: rim, sx: 540, sy: 820, z: 3.4}],
    [DUR - 0.72, {p: P(F2.corner.x + 46, F2.corner.y - 22), sx: 540, sy: 920, z: 5.9}, eio],
    [DUR, {p: P(F2.corner.x + 46, F2.corner.y - 40), ...CAM0_4}, (x) => x],
  ]);
  const halfH = 1150 / cam.z;
  return (
    <>
      <Backdrop2 />
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        <g transform={camT(cam)}><FaceDevice4 v={v} s={s} t={t} id="fe4" tone={0} stretch={1} visY={[cam.y - halfH, cam.y + halfH]} zoom={cam.z} /></g>
      </svg>
    </>
  );
};

export const shot4 = (t: number): React.ReactNode => {
  if (t < SH4.finger) return <FaceShot t={t} />;
  if (t < SH4.face) return <FingerWorld t={t} />;
  return <FaceEnd t={t} />;
};

export const LivingSkinV4: React.FC<{audio?: string | false; captions?: boolean}> = ({audio = 'mix', captions = true}) => {
  const t = useCurrentFrame() / FPS;
  return (
    <AbsoluteFill style={{background: '#0B1117'}}>
      {shot4(t)}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.38) 100%)'}} />
      {captions && <Captions t={t} />}
      {audio === 'mix' && <Audio src={staticFile('audio/mix_approved.wav')} />}
    </AbsoluteFill>
  );
};
