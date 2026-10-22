// FGW "This Robot Is Wearing Living Human Skin" V3: coherence and quality pass on V2, on the SAME approved audio
// (audio/mix/FGW_Living_Skin_mix_APPROVED.wav). Picture events stay on the approved mix's effect cues (FX) and the
// measured words (CUE2). Camera continuity: outgoing camera states carry into the next view, tracked points keep
// their screen positions across matched cuts, and the long moves are single monotonic paths (no overshoot and
// reversal). Spatial story: exterior -> local tissue cutaway -> cell -> attachment -> exterior -> one attachment, large
// -> grin -> (earlier, separate) finger -> incision -> graft -> repair -> repaired covering -> rigid joint -> face.
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import '@fontsource-variable/nunito';
import '@fontsource-variable/fredoka';
import '@fontsource/jetbrains-mono/700.css';
import {FPS, DUR, Cam, camT, lerp, inv, ramp, eio, eout, ein, clamp, toScreen, sstep, camKeys, camAt} from '../lib';
import {FaceDevice3, F2, covPt, proj, View, cutMap, CUT, ANCH_Y, formZ, notchAt} from './Face3';
import {HERO} from '../v2/Tissue2';
import {FX, CUE2, trackCam, Backdrop2, Parallax} from '../v2/common2';
import {Captions, Chip, fadeWin, DayCounter} from '../Overlay';
import {AnchorSection3, A3, a3Surf} from './Anchor3';
import {FingerSide, Scalpel, Tweezers, FS, fingerPoint} from '../art/Finger';
import {FingerTop2, T2} from '../v2/Finger2';
import {PatchView3, cyl3, ForegroundBlade3, WoundCut, RepairedSide, CollarShadow, fp} from './Finger3';
import {RepairMicro3, repairMap3, heroPos3, RP3} from './Repair3';

const f30 = (s: number) => Math.round(s * FPS) / FPS;
export const SH3 = {
  cut: f30(FX.slice), dive: f30(FX.dive), micro: f30(FX.arrive), pull: f30(FX.pullBack),
  land: f30(CUE2.face + 0.37), // the pull-back lands once on the smile composition
  push: f30(CUE2.tiny - 0.45), anchor: f30(CUE2.tiny - 0.08), grin: f30(FX.latch + 0.05), finger: f30(FX.hook2),
  top: f30(CUE2.cut - 0.32), wcut: f30(CUE2.robotic - 0.26), graft: f30(FX.tweezers - 0.1), repair: f30(FX.dive2 + 0.3),
  back: f30(FX.pullBack2 - 0.05), mech: f30(FX.clack - 0.03), face: f30(FX.boundary - 0.03),
};
const dayP = (t: number) => clamp(inv(CUE2.seven + 0.05, CUE2.close + 0.1, t));
export const flex3 = (k: number) => [0.14 * k, 0.62 * k, 0.5 * k];
const XC3 = 148;

// ---------- face timing ----------
export const smile3 = (t: number) => lerp(0.1, 1, eio(inv(-0.7, 0.85, t)));
const faceS = (t: number) => {
  if (t < SH3.pull + 0.45) return Math.min(1, smile3(t));
  if (t < FX.smileMotor) return lerp(1, 0.08, ramp(SH3.pull + 0.45, SH3.land - 0.4, t, eio));
  if (t < SH3.push) return lerp(0.08, 1, ramp(FX.smileMotor, FX.smileMotor + 0.72, t, (x) => 1 - Math.pow(1 - x, 2.4)));
  return lerp(1, 0.15, ramp(SH3.push + 0.02, SH3.anchor - 0.02, t, eio));
};
const faceV = (t: number): View => {
  const toSide = ramp(SH3.cut + 0.04, SH3.dive - 0.1, t, eio);
  const back = ramp(SH3.pull + 0.92, SH3.land, t, eio);
  return {yaw: lerp(lerp(-0.42, -0.85, toSide), -0.5, back) + 0.04 * ramp(SH3.land, SH3.anchor, t), pitch: 0.07};
};
const notchK = (t: number) => ramp(SH3.cut - 0.02, SH3.cut + 0.24, t, eout) * (1 - ramp(SH3.pull + 1.25, SH3.land - 0.25, t, eio));
const heroLift = F2.T - HERO.face.w * CUT.kT;
const anchorP = (v: View) => proj({x: XC3, y: ANCH_Y[3], z: formZ(XC3, ANCH_Y[3]) * 0.45}, v);

export const CAM0_3 = {sx: 540, sy: 900, z: 5.6};
const faceCam = (t: number): Cam => {
  const v = faceV(t), s = faceS(t);
  const P = (x: number, y: number, lift = F2.T) => () => proj(covPt(x, y, s, lift), v);
  const m = cutMap(XC3, s, v);
  const sc = (() => { const a = m(HERO.face.u, HERO.face.w), b = m(HERO.face.u + 10, HERO.face.w); return Math.hypot(b.x - a.x, b.y - a.y) / 10; })();
  const zD = 7 / sc;
  const heroP = () => proj(covPt(XC3, CUT.yH, s, heroLift), v);
  // the landing composition for the smile narration, and where the tracked attachment sits in it
  const vL = faceV(SH3.land), sL = faceS(SH3.land);
  const camL = camAt(proj(covPt(25, 55, sL), vL), {x: 540, y: 880}, 1.62);
  const aL = toScreen(camL, anchorP(vL));
  return trackCam(t, [
    [0, {p: P(F2.corner.x + 46, F2.corner.y - 40), ...CAM0_3}],
    [0.72, {p: P(F2.corner.x + 46, F2.corner.y - 58), sx: 540, sy: 880, z: 5.3}, (x) => x],
    [1.22, {p: P(40, 80), sx: 540, sy: 860, z: 2.05}, eio],
    [SH3.dive - 0.02, {p: heroP, sx: 540, sy: 860, z: 12}, (x) => eio(x) * 0.6 + ein(x) * 0.4],
    [SH3.micro + 0.04, {p: heroP, sx: 540, sy: 840, z: zD}, eout],
    [SH3.pull, {p: () => m(HERO.face.u + 40, HERO.face.w + 4), sx: 540, sy: 840, z: zD * 1.08}, (x) => x],
    [SH3.pull + 0.5, {p: () => m(HERO.face.u + (ANCH_Y[3] - CUT.yH) / CUT.kT, 232), sx: 540, sy: 860, z: zD / 4.5}, (x) => x * x],
    [SH3.pull + 0.92, {p: () => anchorP(v), sx: 540, sy: 860, z: 7.5}, (x) => x],
    // one monotonic pull-back, still tracking the attachment, landing where it sits in the smile composition
    [SH3.land, {p: () => anchorP(v), sx: aL.x, sy: aL.y, z: 1.62}, (x) => 1 - (1 - x) * (1 - x)],
    [SH3.push, {p: P(25, 55), sx: 540, sy: 880, z: 1.66}, (x) => x],
    [SH3.anchor, {p: P(F2.corner.x, F2.corner.y), sx: 540, sy: 860, z: 3.8}, ein],
  ]);
};

const FaceShot: React.FC<{t: number}> = ({t}) => {
  const cam = faceCam(t), v = faceV(t), s = faceS(t);
  const tone = ramp(SH3.dive + 0.16, SH3.micro, t) * (1 - ramp(SH3.pull + 0.08, SH3.pull + 0.45, t));
  const halfH = 1150 / cam.z;
  const m = cutMap(XC3, s, v);
  const micro = ramp(SH3.dive + 0.2, SH3.micro, t) * (1 - ramp(SH3.pull + 0.1, SH3.pull + 0.32, t));
  return (
    <>
      <Backdrop2 tone={tone} />
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        <g transform={camT(cam)}><FaceDevice3 v={v} s={s} t={t} id="fa3" notch={notchAt(notchK(t))} tone={tone} stretch={sstep(0.2, 0.9, t)} visY={[cam.y - halfH, cam.y + halfH]} /></g>
      </svg>
      <Parallax cam={cam} m={m} uc={HERO.face.u} wc={HERO.face.w} a={micro} id="px3" />
      <Chip text="HUMAN SKIN CELL" x={540} y={240} a={fadeWin(t, SH3.micro + 0.06, SH3.pull + 0.1, 0.12)} size={46} />
      <Chip text="UNIV. OF TOKYO · 2024" x={540} y={240} a={fadeWin(t, SH3.land - 0.1, SH3.push, 0.15)} size={40} dot="#E0475A" />
    </>
  );
};

// the attachment, in section: enters on the surface above the central perforation (matched to the push into the mouth
// corner), travels down the gel column into that one perforation (neighbours light in turn), then pulls back to show
// the drive while it tugs, tracking the surface point above the insert, which becomes the mouth corner of the grin
const anchorD = (t: number) => Math.max(0.15 * (1 - ramp(SH3.anchor, SH3.anchor + 0.3, t, eout)), ramp(FX.motorPull + 0.02, FX.latch, t, eio));
const anchorCam = (t: number): Cam => {
  const S = () => a3Surf(0, anchorD(t));
  return trackCam(t, [
    [SH3.anchor, {p: S, sx: 540, sy: 660, z: 2.3}],
    [FX.tick1 + 0.08, {p: () => ({x: 0, y: A3.base0 + 30}), sx: 540, sy: 900, z: 3.0}, (x) => 1 - Math.pow(1 - x, 1.7)],
    [FX.tick2 + 0.02, {p: () => ({x: 0, y: A3.base0 + 31}), sx: 540, sy: 900, z: 3.04}, (x) => x],
    [CUE2.motors - 0.02, {p: () => ({x: 60, y: -140}), sx: 540, sy: 820, z: 1.12}, eio],
    [SH3.grin, {p: () => ({x: 60, y: -140}), sx: 540, sy: 820, z: 1.0}, (x) => x],
  ]);
};
export const anchorExit = () => toScreen(anchorCam(SH3.grin - 1e-4), a3Surf(0, anchorD(SH3.grin)));
const AnchorShot: React.FC<{t: number}> = ({t}) => {
  const d = anchorD(t);
  const glow = [FX.tick0, FX.tick1, FX.tick2].map((x) => fadeWin(t, x - 0.02, x + 0.6, 0.1));
  const cam = anchorCam(t);
  return (
    <>
      <Backdrop2 />
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        <g transform={camT(cam)}><AnchorSection3 d={d} t={t} id="an3" glow={glow} motor={fadeWin(t, FX.motorPull - 0.05, SH3.grin, 0.12)} spin={d * 12} /></g>
      </svg>
    </>
  );
};

const GrinShot: React.FC<{t: number}> = ({t}) => {
  const v: View = {yaw: -0.12, pitch: 0.05};
  const P = (x: number, y: number) => proj(covPt(x, y, 1), v);
  const cam = camKeys(t, [
    [SH3.grin, camAt(P(F2.corner.x, F2.corner.y), anchorExit(), 2.6)],
    [SH3.grin + 0.55, camAt(P(40, 90), {x: 540, y: 880}, 1.72), (x) => 1 - Math.pow(1 - x, 1.8)],
    [SH3.finger, camAt(P(40, 90), {x: 540, y: 880}, 1.78), (x) => x],
  ]);
  return (
    <>
      <Backdrop2 />
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        <g transform={camT(cam)}><FaceDevice3 v={v} s={1} t={t} id="gr3" stretch={1} /></g>
      </svg>
    </>
  );
};

const FingerShot: React.FC<{t: number}> = ({t}) => {
  const k = ramp(FX.flex, FX.flex + 0.34, t, eout) * (1 - ramp(FX.flex + 0.38, FX.flex + 0.8, t, eio));
  const th = flex3(k);
  const knuck = fingerPoint(FS.L[0] + 4, 1, th);
  const mid = fingerPoint(FS.sw, 1, flex3(0));
  const cam = camKeys(t, [
    [SH3.finger, camAt(knuck, {x: 540, y: 760}, 2.5)],
    [SH3.finger + 0.55, {x: 90, y: -20, z: 1.56, r: 0}, eout],
    [CUE2.stranger, {x: 100, y: -30, z: 1.62, r: 0}, (x) => x],
    [SH3.top, camAt(mid, {x: 540, y: 840}, 2.9, 0), ein],
  ]);
  const sc = ramp(CUE2.stranger - 0.3, SH3.top, t, eio);
  const tip = {x: lerp(mid.x + 400, mid.x + 50, sc), y: lerp(mid.y - 440, mid.y - 50, sc)};
  return (
    <>
      <Backdrop2 finger />
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        <g transform={camT(cam)}>
          <FingerSide th={th} id="f3a" />
          <CollarShadow th={th} />
          {sc > 0 && <Scalpel x={tip.x} y={tip.y} a={-8} s={0.9} />}
        </g>
      </svg>
      <Chip text="EARLIER EXPERIMENT · 2022" x={540} y={240} a={fadeWin(t, SH3.finger + 0.1, SH3.top - 0.3, 0.12)} size={46} dot="#E0475A" />
      <ForegroundBlade3 k={inv(SH3.top - 0.22, SH3.top + 0.24, t)} />
    </>
  );
};

const TopShot: React.FC<{t: number}> = ({t}) => {
  const I = T2.inc;
  const approach = ramp(SH3.top + 0.12, FX.incision - 0.08, t, eout);
  const press = ramp(FX.incision - 0.2, FX.incision, t, eio) * (1 - 0.3 * ramp(FX.incision, FX.incision + 0.3, t)) * (1 - ramp(FX.incision + 0.32, FX.incision + 0.45, t));
  const inc = ramp(FX.incision, FX.incision + 0.32, t, eio);
  const lift = ramp(FX.incision + 0.34, FX.incision + 0.72, t, ein);
  const open = ramp(FX.incision + 0.06, FX.incision + 0.62, t, eout);
  const ix = lerp(I.x0, I.x1, inc);
  const tip = {x: lerp(I.x0 + 640, I.x0, approach) + (ix - I.x0) + lift * 220, y: lerp(-520, I.y - 3 + 4 * press, approach) - lift * 420};
  const cam = camKeys(t, [[SH3.top, {x: 10, y: -14, z: 1.72, r: 0}], [SH3.wcut, {x: 0, y: -14, z: 1.95, r: 0}, eio]]);
  return (
    <>
      <Backdrop2 finger />
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        <g transform={camT(cam)}>
          <FingerTop2 id="ft3" tip={lift < 0.5 ? tip : null} press={press} inc={inc} open={open} />
          {lift < 1 && t > SH3.top + 0.12 && <Scalpel x={tip.x} y={tip.y} a={-14} s={1.25} />}
        </g>
      </svg>
      <ForegroundBlade3 k={inv(SH3.top - 0.22, SH3.top + 0.24, t)} />
    </>
  );
};

// one side shot: starts on a local cutaway of the same incision, pulls back as the cutaway closes, to the whole finger
const WoundSideShot: React.FC<{t: number}> = ({t}) => {
  const th = flex3(0);
  const open = 1 - ramp(SH3.wcut + 0.5, SH3.wcut + 0.85, t, eio);
  const cam = camKeys(t, [
    [SH3.wcut, camAt(fp(FS.sw, 0.82, th), {x: 540, y: 846}, 6.4)],
    [SH3.wcut + 0.45, camAt(fp(FS.sw, 0.82, th), {x: 540, y: 846}, 5.8), (x) => x],
    [SH3.graft - 0.12, {x: 92, y: -30, z: 1.6}, eio],
    [SH3.graft, {x: 94, y: -30, z: 1.62}, (x) => x],
  ]);
  return (
    <>
      <Backdrop2 finger />
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        <g transform={camT(cam)}>
          <FingerSide th={th} id="f3b" wound={1} />
          <CollarShadow th={th} />
          <WoundCut th={th} open={open} t={t} id="wc3" />
        </g>
      </svg>
    </>
  );
};

const GraftShot: React.FC<{t: number}> = ({t}) => {
  const drop = ramp(FX.tweezers + 0.02, FX.contact, t, (x) => 1 - Math.pow(1 - x, 2.2));
  const contact = ramp(FX.contact, FX.contact + 0.3, t, eio);
  const settle = t > FX.contact + 0.3 ? Math.exp(-(t - FX.contact - 0.3) * 9) : 0;
  const open = ramp(FX.contact + 0.22, FX.contact + 0.34, t);
  const away = ramp(FX.contact + 0.36, FX.contact + 0.62, t, ein);
  const jolt = Math.exp(-Math.max(0, t - FX.tweezers) * 18) * (t > FX.tweezers ? 1 : 0);
  const tw = {x: 205 + away * 140, y: cyl3(205, -0.15).y - (1 - drop) * 190 - 52 * (1 - contact) * drop - away * 560 + 6 * jolt};
  const edge = cyl3(200, 0, 263); // the graft's distal end on its centre line: the same end the micro section opens on
  const cam0 = camAt({x: 0, y: -120}, {x: 540, y: 860}, 1.05);
  const cam = camKeys(t, [[SH3.graft, cam0], [FX.contact + 0.32, {...cam0, z: 1.16}, (x) => x], [FX.contact + 0.42, camAt(edge, {x: 540, y: 860}, 1.3), eio], [SH3.repair, camAt(edge, {x: 540, y: 860}, 10), ein]]);
  const pin = fadeWin(t, FX.contact + 0.35, FX.dive2 + 0.1, 0.08);
  const ps = toScreen(cam, edge);
  return (
    <>
      <Backdrop2 finger />
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        <g transform={camT(cam)}>
          <PatchView3 id="pv3" drop={drop} contact={contact} settle={settle} />
          {away < 1 && <Tweezers x={tw.x} y={tw.y} open={open} />}
        </g>
        {pin > 0 && <circle cx={ps.x} cy={ps.y} r={40} fill="none" stroke="#7FF2EA" strokeWidth={5} opacity={pin} />}
      </svg>
      <Chip text="COLLAGEN PATCH" x={540} y={250} a={fadeWin(t, SH3.graft + 0.25, FX.contact - 0.05, 0.12)} size={44} dot="#E9F3F4" />
    </>
  );
};

// one continuous pull-back from the repaired graft to the whole finger: a single log-zoom curve shared by the micro
// view and the finger view, scale-matched (graft width 2*gw micro units = patch width 2*patchHalf finger units), with
// the graft's surface point held on screen; the two views dissolve over a few frames at the matched scale
const PB = {t0: CUE2.close, t1: FX.flex2, z0: 2.15, zF1: 1.6, k: (2 * RP3.gw) / (2 * FS.patchHalf)};
const pbE = (t: number) => eio(inv(PB.t0, PB.t1, t));
const pbZ = (t: number) => Math.exp(lerp(Math.log(PB.z0), Math.log(PB.zF1 / PB.k), pbE(t))); // in micro units
const FIN_WIDE: Cam = {x: 92, y: -30, z: 1.6, r: 0};
const pbScreen = (t: number) => { const end = toScreen(FIN_WIDE, fp(FS.sw, 1, flex3(0))); const e = pbE(t); return {x: lerp(540, end.x, e), y: lerp(880, end.y, e)}; };
const pbMicroCam = (t: number) => camAt({x: 0, y: 0}, pbScreen(t), pbZ(t));
const pbFingerCam = (t: number) => camAt(fp(FS.sw, 1, flex3(0)), pbScreen(t), pbZ(t) * PB.k);
const XF = 0.1; // half-length of the matched dissolve

const RepairShot: React.FC<{t: number}> = ({t}) => {
  const p = dayP(t);
  const tone = ramp(SH3.repair + 0.02, SH3.repair + 0.3, t) * (1 - ramp(SH3.back - 0.4, SH3.back, t, eio));
  const m0 = repairMap3(0);
  const over = camAt({x: 0, y: 10}, {x: 540, y: 880}, 2.25);
  const H = (tt: number) => heroPos3(dayP(tt));
  const camK = camKeys(t, [
    [SH3.repair, camAt(m0(RP3.gw - 6, -RP3.gh / 2), {x: 540, y: 860}, 7)],
    [SH3.repair + 0.8, over, (x) => 1 - Math.pow(1 - x, 2.2)],
    [CUE2.seven + 0.05, {...over, z: 2.3}, (x) => x],
    [CUE2.days + 0.45, camAt(H(CUE2.days + 0.45), {x: 540, y: 860}, 4.4), eio],
    [CUE2.cells2 + 0.35, camAt(H(CUE2.cells2 + 0.35), {x: 540, y: 860}, 4.4), (x) => x],
    [CUE2.patch2 + 0.2, camAt(H(CUE2.patch2 + 0.2), {x: 540, y: 860}, 4.2), (x) => x],
    [CUE2.close, camAt({x: 0, y: 0}, {x: 540, y: 880}, 2.15), eio],
  ]);
  const cam = t > PB.t0 ? pbMicroCam(t) : camK;
  const halfW = 700 / cam.z;
  return (
    <>
      <Backdrop2 tone={tone} />
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        <g transform={camT(cam)}><RepairMicro3 p={p} t={t} tone={tone} id="rp3" heroGlow={fadeWin(t, CUE2.days, CUE2.helping, 0.2) * 0.7} vis={[cam.x - halfW - 200, cam.x + halfW + 200]} /></g>
      </svg>
      <DayCounter p={p} a={fadeWin(t, CUE2.seven - 0.25, SH3.back + 0.8, 0.15)} />
    </>
  );
};

// one continuous move: from the repaired graft's edge on the surface back to the whole finger, which flexes again,
// then the cutaway of the rigid joint and its single action
const mechTh = (t: number) => {
  const k = ramp(FX.flex2, FX.flex2 + 0.25, t, eout) * (1 - ramp(FX.flex2 + 0.28, SH3.mech, t, eio));
  const j = ramp(FX.clack + 0.3, FX.clack + 0.95, t, eio);
  return [0.06 * k, 0.62 * k + 0.55 * j, 0.5 * k + 0.2 * j];
};
const FingerEndShot: React.FC<{t: number}> = ({t}) => {
  const th = mechTh(t);
  const cut = ramp(FX.clack, FX.clack + 0.38, t, eout);
  const pin = fingerPoint(FS.L[0], 0, th);
  const bnd = fp(150, 1 - 0.36, th);
  const cam = t < PB.t1 ? pbFingerCam(t) : camKeys(t, [
    [PB.t1, FIN_WIDE],
    [SH3.mech, {x: 100, y: -30, z: 1.64}, (x) => x],
    [FX.clack + 0.45, camAt(pin, {x: 540, y: 860}, 3.6), eio],
    [FX.clack + 0.95, camAt(pin, {x: 540, y: 860}, 4.0), (x) => x],
    [SH3.face, camAt(bnd, {x: 540, y: 820}, 4.6, 0), eio],
  ]);
  return (
    <>
      <Backdrop2 finger />
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        <g transform={camT(cam)}>
          <FingerSide th={th} id="f3e" cut={t < SH3.mech ? 0 : cut} />
          <CollarShadow th={th} />
          <RepairedSide th={th} a={1} />
        </g>
      </svg>
      <DayCounter p={1} a={fadeWin(t, SH3.back - 0.3, SH3.back + 0.8, 0.15)} />
    </>
  );
};

// upright face: matched on the covering-over-rigid boundary (the chin rim over the white base), then the face, then
// the corner, where a brief local cutaway shows the living layer and closes on "is"; ends in frame 0's state
const FaceEndShot: React.FC<{t: number}> = ({t}) => {
  const s = t > DUR - 0.7 ? smile3(t - DUR) : 0.1;
  const v: View = {yaw: -0.42, pitch: 0.07};
    const P = (x: number, y: number, lift = F2.T) => () => proj(covPt(x, y, s, lift), v);
  const ra = (100 * Math.PI) / 180;
  const rim = () => proj(covPt(F2.a * Math.cos(ra) * 0.995, F2.b * Math.sin(ra) * 0.995, s, 0), v);
  const cam = trackCam(t, [
    [SH3.face, {p: rim, sx: 540, sy: 820, z: 4.6}],
    [CUE2.skin4 + 0.45, {p: P(25, 40), sx: 540, sy: 880, z: 1.62}, eio],
    [DUR - 0.72, {p: P(F2.corner.x + 46, F2.corner.y - 22), sx: 540, sy: 920, z: 5.9}, eio],
    [DUR, {p: P(F2.corner.x + 46, F2.corner.y - 40), ...CAM0_3}, (x) => x],
  ]);
  const halfH = 1150 / cam.z;
  return (
    <>
      <Backdrop2 />
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        <g transform={camT(cam)}><FaceDevice3 v={v} s={s} t={t} id="fe3" tone={0} stretch={1} visY={[cam.y - halfH, cam.y + halfH]} /></g>
      </svg>
    </>
  );
};

export const shot3 = (t: number): React.ReactNode => {
  if (t < SH3.anchor) return <FaceShot t={t} />;
  if (t < SH3.grin) return <AnchorShot t={t} />;
  if (t < SH3.finger) return <GrinShot t={t} />;
  if (t < SH3.top) return <FingerShot t={t} />;
  if (t < SH3.wcut) return <TopShot t={t} />;
  if (t < SH3.graft) return <WoundSideShot t={t} />;
  if (t < SH3.repair) return <GraftShot t={t} />;
  if (t < SH3.back - XF) return <RepairShot t={t} />;
  if (t < SH3.back + XF) return <><RepairShot t={t} /><AbsoluteFill style={{opacity: eio(inv(SH3.back - XF, SH3.back + XF, t))}}><FingerEndShot t={t} /></AbsoluteFill></>;
  if (t < SH3.face) return <FingerEndShot t={t} />;
  return <FaceEndShot t={t} />;
};

export const LivingSkinV3: React.FC<{audio?: string | false; captions?: boolean}> = ({audio = 'mix', captions = true}) => {
  const t = useCurrentFrame() / FPS;
  return (
    <AbsoluteFill style={{background: '#0B1117'}}>
      {shot3(t)}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.38) 100%)'}} />
      {captions && <Captions t={t} />}
      {audio === 'mix' && <Audio src={staticFile('audio/mix_approved.wav')} />}
    </AbsoluteFill>
  );
};
