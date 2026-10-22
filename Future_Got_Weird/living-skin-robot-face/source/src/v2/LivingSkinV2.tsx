// FGW "This Robot Is Wearing Living Human Skin" V2: animation, hook and visual-storytelling pass on the LOCKED V1
// audio (audio/mix/FGW_Living_Skin_mix_APPROVED.wav, identical bytes). Every picture event is cut to the approved
// narration words (CUE2) and the approved mix's effect cues (FX).
// Sequence: mechanical tug -> skin deformation -> living cell -> attachment -> grin -> incision -> patch contact ->
// cells entering the graft -> repaired covering -> machine -> the living covering -> the tug again (loop).
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import '@fontsource-variable/nunito';
import '@fontsource-variable/fredoka';
import '@fontsource/jetbrains-mono/700.css';
import {FPS, DUR, Cam, camT, lerp, inv, ramp, eio, eout, ein, clamp, toScreen, sstep} from '../lib';
import {FaceDevice2, F2, covPt, proj, View, cutMap, CUT, ANCH_Y, formZ, INSERT} from './Face2';
import {HERO, DERM} from './Tissue2';
import {FX, CUE2, trackCam, Backdrop2, Parallax} from './common2';
import {Captions, Chip, fadeWin} from '../Overlay';
import {AnchorSection, AN} from './Anchor2';
import {FingerSide, Scalpel, Tweezers, FS, fingerPoint, FK} from '../art/Finger';
import {FingerTop2, T2, FingerXSection, PatchView2, cyl2, ForegroundBlade} from './Finger2';
import {RepairMicro2, repairMap2, heroPos2, RP2} from './Repair2';
import {DayCounter} from '../Overlay';
import {camKeys, camAt} from '../lib';

const f30 = (s: number) => Math.round(s * FPS) / FPS;
export const SH2 = {
  cut: f30(FX.slice), // section plane sweeps through the cheek on "alive"
  dive: f30(FX.dive), // fast approach into one fibroblast
  micro: f30(FX.arrive),
  pull: f30(FX.pullBack), // pull back along a fibre to the attachment
  orbit: f30(CUE2.face - 0.38), // the section closes, back to the whole face
  anchor: f30(CUE2.tiny - 0.08), // large cross-section of one attachment
  grin: f30(FX.latch + 0.05), // cut to the front grin at the pull's peak
  finger: f30(FX.hook2), // second hook: the separate robotic finger
  top: f30(CUE2.cut - 0.32), // behind the foreground blade: top macro of the wound site
  xs: f30(CUE2.robotic - 0.26), // section across the finger at the wound
  side: f30(CUE2.finger - 0.15), // the same wound on the whole finger
  graft: f30(FX.tweezers - 0.1), // the graft lands (elevated 3/4)
  repair: f30(FX.dive2 + 0.3), // inside the repair
  back: f30(FX.pullBack2 - 0.05), // pull back to the same surface wound, graft integrated
  flex: f30(FX.flex2 - 0.03), // the same finger flexes again
  mech: f30(FX.clack - 0.03), // cutaway: the rigid mechanism under the covering
  face: f30(FX.boundary - 0.03), // matched material boundary into the face's living covering
};
const dayP = (t: number) => clamp(inv(CUE2.seven + 0.05, CUE2.close + 0.1, t));
export const flex2 = (k: number) => [0.14 * k, 0.62 * k, 0.5 * k];

// ---------- face timing ----------
// smile phase shared by the opening and the end (loop): the tug starts at the end and is already under tension at 0
export const smile2 = (t: number) => lerp(0.1, 1, eio(inv(-0.7, 0.85, t)));
const faceS = (t: number) => {
  if (t < SH2.pull + 0.45) return Math.min(1, smile2(t));
  if (t < SH2.orbit + 0.5) return lerp(1, 0.08, ramp(SH2.pull + 0.45, SH2.orbit + 0.2, t, eio));
  return lerp(0.08, 1, ramp(FX.smileMotor, FX.smileMotor + 0.72, t, (x) => 1 - Math.pow(1 - x, 2.4)));
};
const faceV = (t: number): View => {
  const toSide = ramp(SH2.cut + 0.04, SH2.dive - 0.1, t, eio);
  const back = ramp(SH2.orbit, SH2.orbit + 0.55, t, eio);
  return {yaw: lerp(lerp(-0.42, -0.9, toSide), -0.5, back) + 0.04 * ramp(SH2.orbit + 0.55, SH2.anchor, t), pitch: 0.07};
};
const faceXC = (t: number) => {
  if (t < SH2.cut - 0.02) return 999;
  const open = lerp(262, 140, ramp(SH2.cut - 0.02, SH2.cut + 0.22, t, eout));
  const close = ramp(SH2.orbit + 0.05, SH2.orbit + 0.45, t, eio);
  return close >= 0.999 ? 999 : lerp(open, 262, close);
};
const XC = 140;
const heroLift = F2.T - HERO.face.w * CUT.kT;
const heroP = (t: number) => proj(covPt(XC, CUT.yH, faceS(t), heroLift), faceV(t));

export const CAM0_2 = {sx: 540, sy: 900, z: 5.6};
const faceCam = (t: number): Cam => {
  const v = faceV(t), s = faceS(t);
  const P = (x: number, y: number, lift = F2.T) => () => proj(covPt(x, y, s, lift), v);
  const m = cutMap(XC, s, v);
  const sc = (() => { const a = m(HERO.face.u, HERO.face.w), b = m(HERO.face.u + 10, HERO.face.w); return Math.hypot(b.x - a.x, b.y - a.y) / 10; })();
  const zD = 7 / sc;
  return trackCam(t, [
    [0, {p: P(F2.corner.x + 46, F2.corner.y - 40), ...CAM0_2}],
    [0.72, {p: P(F2.corner.x + 46, F2.corner.y - 58), sx: 540, sy: 880, z: 5.3}, (x) => x],
    [1.22, {p: P(40, 80), sx: 540, sy: 860, z: 2.05}, eio],
    [SH2.dive - 0.02, {p: () => heroP(t), sx: 540, sy: 860, z: 12}, (x) => eio(x) * 0.6 + ein(x) * 0.4],
    [SH2.micro + 0.04, {p: () => heroP(t), sx: 540, sy: 840, z: zD}, (x) => eout(x)],
    [SH2.pull, {p: () => m(HERO.face.u + 60, HERO.face.w + 6), sx: 540, sy: 840, z: zD * 1.1}, (x) => x],
    [SH2.pull + 0.5, {p: () => m(HERO.face.u - 260, 200), sx: 540, sy: 860, z: zD / 4.5}, (x) => eio(x) * 0.8 + ein(x) * 0.2],
    [SH2.pull + 0.92, {p: () => proj({x: XC, y: ANCH_Y[3], z: formZ(XC, ANCH_Y[3]) * 0.45}, v), sx: 540, sy: 860, z: 7.5}, eio],
    [SH2.orbit + 0.12, {p: () => proj({x: XC - 40, y: 30, z: 30}, v), sx: 540, sy: 860, z: 1.2}, eio],
    [SH2.orbit + 0.6, {p: P(20, 50), sx: 540, sy: 860, z: 1.55}, eio],
    [SH2.anchor - 0.42, {p: P(30, 60), sx: 540, sy: 860, z: 1.68}, (x) => x],
    [SH2.anchor, {p: P(F2.corner.x, F2.corner.y), sx: 540, sy: 860, z: 3.4}, ein],
  ]);
};

const FaceShot: React.FC<{t: number}> = ({t}) => {
  const cam = faceCam(t), v = faceV(t), s = faceS(t), xc = faceXC(t);
  const tone = ramp(SH2.dive + 0.16, SH2.micro, t) * (1 - ramp(SH2.pull + 0.08, SH2.pull + 0.45, t));
  const halfH = 1150 / cam.z;
  const visY: [number, number] = [cam.y - halfH, cam.y + halfH];
  const m = cutMap(XC, s, v);
  const micro = ramp(SH2.dive + 0.2, SH2.micro, t) * (1 - ramp(SH2.pull + 0.1, SH2.pull + 0.32, t));
  return (
    <>
      <Backdrop2 tone={tone} />
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        <g transform={camT(cam)}>
          <FaceDevice2 v={v} s={s} t={t} id="fa2" xc={xc} tone={tone} stretch={sstep(0.2, 0.9, t)} visY={visY} />
        </g>
      </svg>
      <Parallax cam={cam} m={m} uc={HERO.face.u} wc={HERO.face.w} a={micro} id="px1" />
      <Chip text="HUMAN SKIN CELL" x={540} y={240} a={fadeWin(t, SH2.micro + 0.06, SH2.pull + 0.1, 0.12)} size={46} />
      <Chip text="UNIV. OF TOKYO · 2024" x={540} y={240} a={fadeWin(t, SH2.orbit + 0.55, SH2.anchor - 0.1, 0.15)} size={40} dot="#E0475A" />
    </>
  );
};

const AnchorShot: React.FC<{t: number}> = ({t}) => {
  const d = ramp(FX.motorPull + 0.02, FX.latch, t, eio);
  const glow = [FX.tick0, FX.tick1, FX.tick2].map((x) => fadeWin(t, x - 0.02, x + 0.6, 0.1));
  const cam = camKeys(t, [
    [SH2.anchor, camAt({x: 0, y: AN.y0 + 30}, {x: 540, y: 860}, 1.75)],
    [FX.tick0 - 0.1, camAt({x: 0, y: -330}, {x: 540, y: 860}, 1.55), eio],
    [FX.tick2 + 0.12, camAt({x: 0, y: -90}, {x: 540, y: 820}, 1.38), eio],
    [CUE2.motors - 0.2, camAt({x: 190, y: -40}, {x: 540, y: 880}, 0.92), eio],
    [FX.motorPull + 0.32, camAt({x: 170, y: -50}, {x: 540, y: 880}, 0.96), (x) => x],
    [FX.latch, camAt({x: -230, y: -560}, {x: 540, y: 820}, 1.32), eio],
    [SH2.grin, camAt({x: -240, y: -566}, {x: 540, y: 820}, 1.36), (x) => x],
  ]);
  return (
    <>
      <Backdrop2 />
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        <g transform={camT(cam)}><AnchorSection d={d} t={t} tone={0} id="an" glow={glow} motor={fadeWin(t, FX.motorPull - 0.05, SH2.grin, 0.12)} spin={d * 14} /></g>
      </svg>
    </>
  );
};

const GrinShot: React.FC<{t: number}> = ({t}) => {
  const v: View = {yaw: -0.12, pitch: 0.05};
  const P = (x: number, y: number) => proj(covPt(x, y, 1), v);
  const cam = camKeys(t, [
    [SH2.grin, camAt(P(F2.corner.x, F2.corner.y), {x: 560, y: 900}, 1.75)],
    [SH2.finger - 0.36, camAt(P(40, 90), {x: 540, y: 880}, 1.62), eout],
    [SH2.finger, camAt(P(F2.a * 0.985, 30), {x: 540, y: 760}, 3.6, -38), ein],
  ]);
  return (
    <>
      <Backdrop2 />
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        <g transform={camT(cam)}><FaceDevice2 v={v} s={1} t={t} id="gr" stretch={1} /></g>
      </svg>
    </>
  );
};

const FingerShot: React.FC<{t: number}> = ({t}) => {
  const k = ramp(FX.flex, FX.flex + 0.34, t, eout) * (1 - ramp(FX.flex + 0.38, FX.flex + 0.8, t, eio));
  const th = flex2(k);
  const knuck = fingerPoint(FS.L[0] + 4, 1, th);
  const mid = fingerPoint(FS.sw, 1, flex2(0));
  const cam = camKeys(t, [
    [SH2.finger, camAt(knuck, {x: 540, y: 760}, 3.4, 52)],
    [SH2.finger + 0.55, {x: 90, y: -20, z: 1.56, r: 0}, eout],
    [CUE2.stranger, {x: 100, y: -30, z: 1.62, r: 0}, (x) => x],
    [SH2.top, camAt(mid, {x: 540, y: 840}, 2.9, 0), ein],
  ]);
  const sc = ramp(CUE2.stranger - 0.3, SH2.top, t, eio);
  const tip = {x: lerp(mid.x + 400, mid.x + 50, sc), y: lerp(mid.y - 440, mid.y - 50, sc)};
  return (
    <>
      <Backdrop2 finger />
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        <g transform={camT(cam)}>
          <FingerSide th={th} id="f2a" />
          {sc > 0 && <Scalpel x={tip.x} y={tip.y} a={-8} s={0.9} />}
        </g>
      </svg>
      <Chip text="EARLIER EXPERIMENT · 2022" x={540} y={240} a={fadeWin(t, SH2.finger + 0.1, SH2.top - 0.3, 0.12)} size={46} dot="#E0475A" />
      <ForegroundBlade k={inv(SH2.top - 0.24, SH2.top + 0.26, t)} />
    </>
  );
};

const TopShot: React.FC<{t: number}> = ({t}) => {
  const I = T2.inc;
  const approach = ramp(SH2.top + 0.12, FX.incision - 0.08, t, eout);
  const press = ramp(FX.incision - 0.2, FX.incision, t, eio) * (1 - 0.3 * ramp(FX.incision, FX.incision + 0.3, t)) * (1 - ramp(FX.incision + 0.32, FX.incision + 0.45, t));
  const inc = ramp(FX.incision, FX.incision + 0.32, t, eio);
  const lift = ramp(FX.incision + 0.34, FX.incision + 0.72, t, ein);
  const open = ramp(FX.incision + 0.06, FX.incision + 0.62, t, eout);
  const ix = lerp(I.x0, I.x1, inc);
  const tip = {x: lerp(I.x0 + 640, I.x0, approach) + (ix - I.x0) + lift * 220, y: lerp(-520, I.y - 3 + 4 * press, approach) - lift * 420};
  const cam = camKeys(t, [[SH2.top, {x: 10, y: -14, z: 1.72, r: 0}], [SH2.xs, {x: 0, y: -18, z: 1.95, r: -3}, eio]]);
  return (
    <>
      <Backdrop2 finger />
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        <g transform={camT(cam)}>
          <FingerTop2 id="ft2" tip={lift < 0.5 ? tip : null} press={press} inc={inc} open={open} />
          {lift < 1 && t > SH2.top + 0.12 && <Scalpel x={tip.x} y={tip.y} a={-14} s={1.25} />}
        </g>
      </svg>
      <ForegroundBlade k={inv(SH2.top - 0.24, SH2.top + 0.26, t)} />
    </>
  );
};

const XSShot: React.FC<{t: number}> = ({t}) => {
  const cam = camKeys(t, [[SH2.xs, camAt({x: 0, y: -300}, {x: 540, y: 860}, 3.3)], [SH2.side - 0.12, camAt({x: 0, y: -40}, {x: 540, y: 880}, 1.3), eio], [SH2.side, camAt({x: 0, y: -40}, {x: 540, y: 880}, 1.32), (x) => x]]);
  return (
    <>
      <Backdrop2 finger />
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        <g transform={camT(cam)}><FingerXSection id="xs2" t={t} tone={0} notch={1} /></g>
      </svg>
    </>
  );
};

const SideWoundShot: React.FC<{t: number}> = ({t}) => {
  const w = fingerPoint(FS.sw, 1, flex2(0));
  const cam = camKeys(t, [[SH2.side, camAt(w, {x: 540, y: 820}, 3.2)], [SH2.side + 0.35, {x: 90, y: -30, z: 1.6}, eout], [SH2.graft, {x: 96, y: -32, z: 1.64}, (x) => x]]);
  return (
    <>
      <Backdrop2 finger />
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        <g transform={camT(cam)}><FingerSide th={flex2(0)} id="f2b" wound={1} /></g>
      </svg>
    </>
  );
};

const GraftShot: React.FC<{t: number}> = ({t}) => {
  const drop = ramp(FX.tweezers + 0.02, FX.contact, t, (x) => 1 - Math.pow(1 - x, 2.2));
  const contact = ramp(FX.contact, FX.contact + 0.3, t, eio);
  const settle = t > FX.contact + 0.3 ? Math.exp(-(t - FX.contact - 0.3) * 7) : 0;
  const open = ramp(FX.contact + 0.22, FX.contact + 0.34, t);
  const away = ramp(FX.contact + 0.36, FX.contact + 0.62, t, ein);
  const jolt = Math.exp(-Math.max(0, t - FX.tweezers) * 18) * (t > FX.tweezers ? 1 : 0);
  const tw = {x: 205 + away * 140, y: cyl2(205, -0.15).y - (1 - drop) * 190 - 52 * (1 - contact) * drop - away * 560 + 6 * jolt};
  const edge = cyl2(-200, -0.12, 263);
  const cam0 = camAt({x: 0, y: -120}, {x: 540, y: 860}, 1.05);
  const cam = camKeys(t, [[SH2.graft, cam0], [FX.contact + 0.32, {...cam0, z: 1.16}, (x) => x], [FX.contact + 0.42, {...camAt(edge, {x: 540, y: 860}, 1.3)}, eio], [SH2.repair, camAt(edge, {x: 540, y: 860}, 10), ein]]);
  const pin = fadeWin(t, FX.contact + 0.35, FX.dive2 + 0.1, 0.08);
  const ps = toScreen(cam, edge);
  return (
    <>
      <Backdrop2 finger />
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        <g transform={camT(cam)}>
          <PatchView2 id="pv2" drop={drop} contact={contact} settle={settle} />
          {away < 1 && <Tweezers x={tw.x} y={tw.y} open={open} />}
        </g>
        {pin > 0 && <circle cx={ps.x} cy={ps.y} r={44} fill="none" stroke="#7FF2EA" strokeWidth={5} opacity={pin} />}
      </svg>
      <Chip text="COLLAGEN PATCH" x={540} y={250} a={fadeWin(t, SH2.graft + 0.25, FX.contact - 0.05, 0.12)} size={44} dot="#E9F3F4" />
    </>
  );
};

const RepairShot: React.FC<{t: number}> = ({t}) => {
  const p = dayP(t);
  const tone = ramp(SH2.repair + 0.02, SH2.repair + 0.3, t);
  const hero = heroPos2(p, t);
  const over = camAt({x: 0, y: 10}, {x: 540, y: 880}, 2.25);
  const cam = camKeys(t, [
    [SH2.repair, camAt(repairMap2(0)(-RP2.gw + 20, -20), {x: 540, y: 860}, 7)],
    [SH2.repair + 0.5, over, eout],
    [CUE2.seven + 0.05, {...over, z: 2.3}, (x) => x],
    [CUE2.days + 0.45, camAt(heroPos2(dayP(CUE2.days + 0.45), CUE2.days + 0.45), {x: 540, y: 860}, 4.6), eio],
    [CUE2.cells2 + 0.35, camAt(heroPos2(dayP(CUE2.cells2 + 0.35), CUE2.cells2 + 0.35), {x: 540, y: 860}, 4.6), (x) => x],
    [CUE2.patch2 + 0.2, camAt(hero, {x: 540, y: 860}, 4.4), (x) => x],
    [CUE2.close, camAt({x: 0, y: 10}, {x: 540, y: 880}, 2.15), eio],
    [SH2.back, camAt({x: 0, y: 0}, {x: 540, y: 880}, 2.05), (x) => x],
  ]);
  const halfW = 700 / cam.z;
  return (
    <>
      <Backdrop2 tone={tone} />
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        <g transform={camT(cam)}><RepairMicro2 p={p} t={t} tone={tone} id="rp2" heroGlow={fadeWin(t, CUE2.days, CUE2.helping, 0.2) * 0.8} vis={[cam.x - halfW - 200, cam.x + halfW + 200]} /></g>
      </svg>
      <DayCounter p={p} a={fadeWin(t, CUE2.seven - 0.25, SH2.flex + 0.3, 0.15)} />
    </>
  );
};

const BackShot: React.FC<{t: number}> = ({t}) => {
  const cam = camKeys(t, [[SH2.back, {x: -60, y: -14, z: 3.4}], [SH2.flex, {x: 0, y: -14, z: 1.55}, eout]]);
  return (
    <>
      <Backdrop2 finger />
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        <g transform={camT(cam)}><FingerTop2 id="ft3" press={0} inc={1} open={1} integrate={1} patch={1} /></g>
      </svg>
      <DayCounter p={1} a={fadeWin(t, SH2.back - 0.3, SH2.flex + 0.3, 0.15)} />
    </>
  );
};

const mechTh = (t: number) => {
  const k = ramp(FX.flex2, FX.flex2 + 0.25, t, eout) * (1 - ramp(FX.flex2 + 0.28, SH2.mech, t, eio));
  const j = ramp(FX.clack + 0.3, FX.clack + 0.95, t, eio);
  return [0.06 * k, 0.62 * k + 0.55 * j, 0.5 * k + 0.2 * j];
};
const MechShot: React.FC<{t: number}> = ({t}) => {
  const th = mechTh(t);
  const cut = ramp(FX.clack, FX.clack + 0.38, t, eout);
  const pin = fingerPoint(FS.L[0], 0, th);
  const bnd = fingerPoint(300, 0.72, th);
  const ang = (bnd.a * 180) / Math.PI;
  const cam = t < SH2.mech
    ? camKeys(t, [[SH2.flex, {x: 90, y: -30, z: 1.58}], [SH2.mech, {x: 100, y: -20, z: 1.66}, (x) => x]])
    : camKeys(t, [
        [SH2.mech, {x: 100, y: -20, z: 1.66}],
        [FX.clack + 0.45, camAt(pin, {x: 540, y: 860}, 3.6, 0), eio],
        [FX.clack + 0.95, camAt(pin, {x: 540, y: 860}, 4.0, 0), (x) => x],
        [SH2.face, camAt(bnd, {x: 540, y: 840}, 4.8, -ang), eio],
      ]);
  return (
    <>
      <Backdrop2 finger />
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        <g transform={camT(cam)}><FingerSide th={th} id="f2m" wound={1} patch={1} integrate={1} cut={t < SH2.mech ? 0 : cut} /></g>
      </svg>
      <DayCounter p={1} a={fadeWin(t, SH2.back - 0.3, SH2.flex + 0.3, 0.15)} />
    </>
  );
};

const FaceEndShot: React.FC<{t: number}> = ({t}) => {
  const end = t > DUR - 0.7;
  const s = end ? smile2(t - DUR) : 0.1;
  const yawK = ramp(CUE2.wearing, DUR - 0.75, t, eio);
  const v: View = {yaw: lerp(-0.9, -0.42, yawK), pitch: 0.07};
  const closeK = ramp(CUE2.is2, CUE2.is2 + 0.32, t, eio);
  const xc = closeK >= 0.999 ? 999 : lerp(XC, 262, closeK);
  const P = (x: number, y: number, lift = F2.T) => () => proj(covPt(x, y, s, lift), v);
  const mF = cutMap(XC, s, v);
  const cam = trackCam(t, [
    [SH2.face, {p: () => proj({x: XC, y: 40, z: formZ(XC, 40) + 0.3}, v), sx: 540, sy: 840, z: 3.3, r: 90}],
    [CUE2.skin4 + 0.24, {p: () => mF(HERO.face.u - 200, 110), sx: 540, sy: 860, z: 30, r: 0}, eio],
    [CUE2.wearing + 0.15, {p: P(XC - 10, 70, F2.T - 6), sx: 540, sy: 860, z: 4.2}, eio],
    [DUR - 0.72, {p: P(F2.corner.x + 46, F2.corner.y - 22), sx: 540, sy: 920, z: 5.9}, eio],
    [DUR, {p: P(F2.corner.x + 46, F2.corner.y - 40), ...CAM0_2}, (x) => x],
  ]);
  const halfH = 1150 / cam.z;
  return (
    <>
      <Backdrop2 />
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        <g transform={camT(cam)}><FaceDevice2 v={v} s={s} t={t} id="fe2" xc={xc} tone={0} stretch={1} visY={[cam.y - halfH, cam.y + halfH]} /></g>
      </svg>
    </>
  );
};

export const shot2 = (t: number): React.ReactNode => {
  if (t < SH2.anchor) return <FaceShot t={t} />;
  if (t < SH2.grin) return <AnchorShot t={t} />;
  if (t < SH2.finger) return <GrinShot t={t} />;
  if (t < SH2.top) return <FingerShot t={t} />;
  if (t < SH2.xs) return <TopShot t={t} />;
  if (t < SH2.side) return <XSShot t={t} />;
  if (t < SH2.graft) return <SideWoundShot t={t} />;
  if (t < SH2.repair) return <GraftShot t={t} />;
  if (t < SH2.back) return <RepairShot t={t} />;
  if (t < SH2.flex) return <BackShot t={t} />;
  if (t < SH2.face) return <MechShot t={t} />;
  return <FaceEndShot t={t} />;
};

export const LivingSkinV2: React.FC<{audio?: string | false; captions?: boolean}> = ({audio = 'mix', captions = true}) => {
  const t = useCurrentFrame() / FPS;
  return (
    <AbsoluteFill style={{background: '#0B1117'}}>
      {shot2(t)}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.38) 100%)'}} />
      {captions && <Captions t={t} />}
      {audio === 'mix' && <Audio src={staticFile('audio/mix_approved.wav')} />}
    </AbsoluteFill>
  );
};
export const FilmStill2: React.FC<{t: number}> = ({t}) => (
  <AbsoluteFill style={{background: '#0B1117'}}>
    {shot2(t)}
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.38) 100%)'}} />
  </AbsoluteFill>
);
