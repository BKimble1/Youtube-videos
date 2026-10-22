// FGW "This Robot Is Wearing Living Human Skin" (vertical Short, 27.2 s).
// One connected journey: smiling surface -> human cell -> tissue attachment -> mechanical pull -> separate damaged
// finger -> patch interior -> repaired covering -> smile. Every cue below reads the measured narration word times.
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import '@fontsource-variable/nunito';
import '@fontsource-variable/fredoka';
import '@fontsource/jetbrains-mono/700.css';
import {FPS, Cam, camT, camKeys, camLerp, eio, eout, ein, inv, ramp, lerp, clamp, word, toScreen, matchCam, camAt, DUR, sstep} from './lib';
import {FaceDevice, K, View, winMap, WIN, skinScreen, FACE} from './art/Face';
import {DeviceSection, secMap, SEC, curveAt, secPt, ANCHORS, MOTOR, sToU} from './art/Section';
import {HERO} from './art/Tissue';
import {Captions, Chip, fadeWin, DayCounter} from './Overlay';
import {FingerSide, FingerTop, Scalpel, PatchView, Tweezers, FK, FS, fingerPoint, FTOP, cylPt} from './art/Finger';
import {RepairMicro, repairMap, RP, heroMigPos} from './art/Repair';

// ---------- cue times (s) ----------
const Wd = (w: string, n = 1) => word(w, n).start;
export const CUE = {
  robots: Wd("robot's"), skin1: Wd('skin'), alive1: Wd('alive'), human: Wd('human'), cells1: Wd('cells'),
  then: Wd('then'), mechanical: Wd('mechanical'), face: Wd('face'), made: Wd('made'), smile: Wd('smile'),
  tiny: Wd('tiny'), anchors: Wd('anchors'), hold: Wd('hold'), motors: Wd('motors'), pull: Wd('pull'), underneath: Wd('underneath'),
  but1: Wd('but'), earlier: Wd('earlier'), experiment: Wd('experiment'), stranger: Wd('stranger'), cut: Wd('cut'), robotic: Wd('robotic'), finger: Wd('finger'),
  added: Wd('added'), collagen: Wd('collagen'), patch1: Wd('patch'), gave: Wd('gave'), seven: Wd('seven'), days: Wd('days'), repair: Wd('repair'),
  cells2: Wd('cells', 2), into: Wd('into'), helping: Wd('helping'), close: Wd('close'), damage: Wd('damage'),
  machine: Wd('machine'), alive2: Wd('alive', 2), but2: Wd('but', 2), skin3: Wd('skin', 4), wearing: Wd('wearing'), is2: Wd('is', 2),
};
const f30 = (s: number) => Math.round(s * FPS) / FPS;
// shot boundaries
export const SH = {
  dive: f30(CUE.human - 0.08), // 6-10 frame push into the hero cell
  micro: f30(CUE.human + 0.22),
  pull: f30(CUE.then - 0.1), // matched pull-back into the device section
  front34: f30(CUE.face - 0.08), // whole device, 3/4
  anchors: f30(CUE.tiny - 0.1), // back into the section at the anchors
  smileFront: f30(CUE.underneath + 0.38), // match cut to the front of the smiling face
  finger: f30(CUE.but1 - 0.02), // second hook: separate robotic finger
  top: f30(CUE.cut - 0.3), // top close-up: the incision
  side2: f30(CUE.robotic - 0.26), // back to the side: a small cut in the covering
  graft: f30(CUE.added - 0.2), // elevated 3/4: the collagen sheet lands
  micro2: f30(CUE.gave + 0.22), // into the repair, microscope-style
  back: f30(CUE.damage + 0.06), // pull back to the finger flexing again
  mech: f30(CUE.machine - 0.3), // cutaway to the rigid mechanism
  faceSec: f30(CUE.alive2 + 0.42), // matched boundary back to the face's covering
  faceEnd: f30(CUE.skin3 + 0.2), // front of the face, cell window open, back to the opening frame
};
// repair progress: DAY 0 at "seven", DAY 7 just before "close"
const dayP = (t: number) => clamp(inv(CUE.seven + 0.05, CUE.close + 0.1, t));
const flex = (k: number) => [0.14 * k, 0.62 * k, 0.5 * k];

// ---------- the face shots ----------
const smileLoop = (t: number) => lerp(0, 1, eio(inv(-0.55, 1.0, t)));
const V0: View = {yaw: -0.42, pitch: 0.07};
// camera of the opening (frame 0 == the end of the film)
export const CAM0: Cam = {x: 104, y: 205, z: 2.15};

const faceShotA = (t: number) => {
  // hook: close -> quick reframe to reveal the support -> push to the stretch -> section window -> pinpoint -> dive
  const s = Math.min(smileLoop(t), 1);
  const v: View = {yaw: lerp(V0.yaw, -0.5, sstep(0.45, 0.8, t) * (1 - sstep(0.85, 1.25, t))) , pitch: 0.07};
  const winOpen = ramp(CUE.alive1 - 0.04, CUE.alive1 + 0.16, t, eout);
  const m = winMap(s, v);
  const hero = m(HERO.face.u, HERO.face.w);
  const wc = m((WIN.u0 + WIN.u1) / 2, WIN.wMax * 0.42);
  // the dive ends at 9 px per tissue unit, hero cell centred a little above the caption band
  const winScale = Math.hypot(m(HERO.face.u + 10, HERO.face.w).x - hero.x, m(HERO.face.u + 10, HERO.face.w).y - hero.y) / 10;
  const camDive = camAt(hero, {x: 540, y: 820}, 9.2 / winScale);
  const cam = camKeys(t, [
    [0, CAM0],
    [0.45, {x: 110, y: 201, z: 2.24}, (x) => x],
    [0.84, {x: 90, y: 20, z: 1.42}, eio],
    [1.22, {x: 160, y: 60, z: 2.35}, eio],
    [CUE.alive1 + 0.34, camAt(wc, {x: 540, y: 860}, 5.2), eout],
    [CUE.human - 0.55, camAt(wc, {x: 560, y: 850}, 5.45), (x) => x],
    [SH.dive, camAt(hero, {x: 540, y: 840}, 6.6), eio],
    [SH.micro, camDive, (x) => ein(x) * 0.4 + eio(x) * 0.6],
    [SH.pull, {...camDive, z: camDive.z * 1.12}, (x) => x],
  ]);
  const tone = ramp(SH.dive + 0.08, SH.micro, t);
  return {s, v, cam, winOpen, tone, hero};
};

const FaceScene: React.FC<{t: number; v: View; s: number; cam: Cam; win?: number; tone?: number; stretch?: number; id: string; anchorGlow?: number}> = ({t, v, s, cam, win = 0, tone = 0, stretch = 0, id, anchorGlow = 0}) => (
  <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
    <g transform={camT(cam)}>
      <FaceDevice v={v} s={s} t={t} id={id} win={win} winTone={tone} stretch={stretch} anchorGlow={anchorGlow} />
    </g>
  </svg>
);

const SectionScene: React.FC<{t: number; d: number; cam: Cam; tone: number; glow?: number[]; motorGlow?: number; uRange?: [number, number]}> = ({t, d, cam, tone, glow, motorGlow, uRange}) => (
  <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
    <g transform={camT(cam)}>
      <DeviceSection d={d} t={t} tone={tone} id="sec" anchorGlow={glow} motorGlow={motorGlow} uRange={uRange} />
    </g>
  </svg>
);

const Backdrop: React.FC<{tone?: number}> = ({tone = 0}) => (
  <AbsoluteFill style={{background: tone > 0.5 ? 'radial-gradient(ellipse at 50% 40%, #13414B 0%, #08242B 70%, #061A20 100%)' : `radial-gradient(ellipse at 50% 38%, #1D2B37 0%, ${K.bg1} 75%)`}} />
);

// ---------- shot table ----------
export const shot = (t: number): React.ReactNode => {
  if (t < SH.pull) {
    const A = faceShotA(t);
    const pin = fadeWin(t, CUE.human - 0.55, SH.dive + 0.12, 0.12);
    const ps = toScreen(A.cam, A.hero);
    return (
      <>
        <Backdrop tone={A.tone} />
        <FaceScene t={t} v={A.v} s={A.s} cam={A.cam} win={A.winOpen} tone={A.tone} stretch={sstep(0.8, 1.05, t) * (1 - sstep(1.6, 2.2, t)) + 0.3} id="fa" />
        {pin > 0 && (
          <svg width={1080} height={1920} style={{position: 'absolute'}}>
            <circle cx={ps.x} cy={ps.y} r={44 + 6 * Math.sin(t * 9)} fill="none" stroke="#0B1117" strokeWidth={9} opacity={0.5 * pin} />
            <circle cx={ps.x} cy={ps.y} r={44 + 6 * Math.sin(t * 9)} fill="none" stroke="#7FF2EA" strokeWidth={5} opacity={pin} />
            {[0, 1, 2, 3].map((k) => { const a = (k * Math.PI) / 2; return <line key={k} x1={ps.x + Math.cos(a) * 54} y1={ps.y + Math.sin(a) * 54} x2={ps.x + Math.cos(a) * 70} y2={ps.y + Math.sin(a) * 70} stroke="#7FF2EA" strokeWidth={5} strokeLinecap="round" opacity={pin} />; })}
          </svg>
        )}
        <Chip text="HUMAN SKIN CELL (FIBROBLAST)" x={540} y={250} size={44} a={fadeWin(t, SH.micro + 0.05, SH.pull + 0.05, 0.12)} />
      </>
    );
  }
  if (t < SH.front34) {
    // matched pull-back: the same cells, now inside the covering on the device cross-section
    const A = faceShotA(SH.pull - 1 / FPS);
    const mA = winMap(A.s, A.v);
    const d = 0; // relaxed: the matched cells must sit in undeformed tissue
    const start = matchCam(A.cam, mA, secMap(0), HERO.face.u, HERO.face.w);
    const cs = curveAt(SEC.sc + 60).p;
    const end = camAt({x: 150, y: -20}, {x: 540, y: 860}, 0.98, 0);
    const mid = camAt(cs, {x: 470, y: 840}, 3.4, 20);
    const cam = camKeys(t, [[SH.pull, start], [SH.pull + 0.5, mid, (x) => eio(x) * 0.7 + ein(x) * 0.3], [SH.front34, end, eio]]);
    const tone = 1 - ramp(SH.pull + 0.05, SH.pull + 0.35, t);
    return (
      <>
        <Backdrop tone={tone} />
        <SectionScene t={t} d={d} cam={cam} tone={tone} />
        <Chip text="CROSS-SECTION · ILLUSTRATION" x={540} y={250} a={fadeWin(t, SH.pull + 0.4, SH.front34 + 0.05)} size={30} dot="#E0475A" />
      </>
    );
  }
  if (t < SH.anchors) {
    // whole device, 3/4: the mechanical face makes it smile
    const s = ramp(CUE.made - 0.05, CUE.smile + 0.3, t, eio);
    const v: View = {yaw: lerp(-0.62, -0.5, inv(SH.front34, SH.anchors, t)), pitch: 0.09};
    const corner = skinScreen(FACE.corner.x, FACE.corner.y, 1, v);
    const cam = camKeys(t, [[SH.front34, {x: 40, y: 20, z: 1.2}], [SH.anchors - 0.32, {x: 60, y: 40, z: 1.32}, (x) => x], [SH.anchors, camAt(corner, {x: 470, y: 840}, 2.6), ein]]);
    return (
      <>
        <Backdrop />
        <FaceScene t={t} v={v} s={s} cam={cam} id="fb" />
        <Chip text="UNIV. OF TOKYO · 2024 · ILLUSTRATION" x={540} y={250} a={fadeWin(t, SH.front34 + 0.1, SH.anchors - 0.15)} size={30} dot="#E0475A" />
      </>
    );
  }
  if (t < SH.smileFront) {
    // anchors hold; the motor pulls underneath
    const relax = 1 - ramp(SH.anchors + 0.05, SH.anchors + 0.5, t);
    const pullD = ramp(CUE.motors + 0.05, CUE.underneath + 0.15, t, eio);
    const d = Math.max(relax, pullD);
    const glow = ANCHORS.map((_, k) => fadeWin(t, CUE.anchors + 0.12 * Math.abs(k - 3.5) - 0.1, CUE.motors + 0.3, 0.12) * 0.9);
    glow.push(fadeWin(t, CUE.hold, SH.smileFront, 0.12));
    const cs = curveAt(SEC.sc).p;
    const cam = camKeys(t, [
      [SH.anchors, camAt(curveAt(SEC.sc + 170).p, {x: 520, y: 800}, 2.9, 0)],
      [CUE.hold + 0.1, camAt(curveAt(SEC.sc + 40).p, {x: 520, y: 820}, 2.5, 0), eio],
      [CUE.motors - 0.05, camAt(cs, {x: 470, y: 840}, 2.35, 0), eio],
      [CUE.motors + 0.3, camAt({x: lerp(cs.x, MOTOR.x0, 0.5), y: lerp(cs.y, MOTOR.y1, 0.5)}, {x: 540, y: 820}, 1.55, 0), eio],
      [SH.smileFront, camAt({x: lerp(cs.x, MOTOR.x0, 0.42), y: lerp(cs.y, MOTOR.y1, 0.45)}, {x: 540, y: 820}, 1.62, 0), (x) => x],
    ]);
    return (
      <>
        <Backdrop />
        <SectionScene t={t} d={d} cam={cam} tone={0} glow={glow} motorGlow={fadeWin(t, CUE.motors, SH.smileFront, 0.1) * 0.8} />
      </>
    );
  }
  if (t < SH.finger) {
    // match cut: front of the smiling face (corner keeps its screen position), then along the cheek's curved edge
    const v: View = {yaw: -0.08, pitch: 0.05};
    const corner = skinScreen(FACE.corner.x, FACE.corner.y, 1, v);
    const edge = skinScreen(FACE.a * 0.99, 40, 1, v);
    const cam = camKeys(t, [[SH.smileFront, camAt(corner, {x: 560, y: 900}, 1.45)], [SH.finger - 0.3, camAt({x: 60, y: 60}, {x: 540, y: 860}, 1.35), eio], [SH.finger, camAt(edge, {x: 540, y: 700}, 3.4), ein]]);
    return (
      <>
        <Backdrop />
        <FaceScene t={t} v={v} s={1} cam={cam} id="fc" />
      </>
    );
  }
  if (t < SH.top) {
    // SECOND HOOK: a different bench, a different machine. Matched on the curved tissue edge (rotated), then pull back.
    const k = ramp(CUE.experiment + 0.15, CUE.experiment + 0.6, t, eio) * (1 - ramp(CUE.experiment + 0.75, CUE.stranger + 0.2, t, eio));
    const th = flex(k);
    const knuck = fingerPoint(FS.L[0] + 4, 1, th);
    const mid = fingerPoint(FS.sw, 1, flex(0));
    const cam = camKeys(t, [
      [SH.finger, camAt(knuck, {x: 540, y: 700}, 3.4, 90)],
      [SH.finger + 0.62, {x: 90, y: -20, z: 1.56, r: 0}, eout],
      [CUE.stranger + 0.05, {x: 100, y: -30, z: 1.62, r: 0}, (x) => x],
      [SH.top, camAt(mid, {x: 540, y: 820}, 2.3, 0), ein],
    ]);
    const sc = ramp(CUE.stranger - 0.55, SH.top, t, eio);
    const tip = {x: lerp(mid.x + 360, mid.x + 40, sc), y: lerp(mid.y - 380, mid.y - 34, sc)};
    return (
      <>
        <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 35%, #2A3E47 0%, ${FK.bg1} 80%)`}} />
        <svg width={1080} height={1920} style={{position: 'absolute'}}>
          <g transform={camT(cam)}>
            <FingerSide th={th} id="f1" />
            {sc > 0 && <Scalpel x={tip.x} y={tip.y} a={-8} s={0.9} />}
          </g>
        </svg>
        <Chip text="EARLIER EXPERIMENT · 2022" x={540} y={240} a={fadeWin(t, SH.finger + 0.12, SH.top, 0.12)} size={42} dot="#E0475A" />
        <Chip text="ROBOTIC FINGER · ILLUSTRATION" x={540} y={320} a={fadeWin(t, SH.finger + 0.5, SH.top, 0.15)} size={28} />
      </>
    );
  }
  if (t < SH.side2) {
    // the incision, top view: small, clean, controlled
    const inc = ramp(CUE.cut, CUE.cut + 0.4, t, eio);
    const open = ramp(CUE.cut + 0.15, CUE.cut + 0.75, t, eout);
    const ix = lerp(FTOP.inc.x0, FTOP.inc.x1, inc);
    const approach = ramp(SH.top, CUE.cut, t, eout), lift = ramp(CUE.cut + 0.42, CUE.cut + 0.8, t, ein);
    const tip = {x: lerp(FTOP.inc.x0 + 260, FTOP.inc.x0, approach) + (ix - FTOP.inc.x0) + lift * 160, y: lerp(-300, FTOP.inc.y, approach) - lift * 360};
    const cam = camKeys(t, [[SH.top, {x: 30, y: -50, z: 1.62, r: -4}], [SH.side2, {x: 0, y: -60, z: 1.85, r: 0}, eio]]);
    return (
      <>
        <AbsoluteFill style={{background: FK.bg1}} />
        <svg width={1080} height={1920} style={{position: 'absolute'}}>
          <g transform={camT(cam)}>
            <FingerTop id="ft" incision={inc} open={open} />
            <Scalpel x={tip.x} y={tip.y} a={-14} s={1.25} />
          </g>
        </svg>
      </>
    );
  }
  if (t < SH.graft) {
    // back to the side: the wound is small, on a machine covered in tissue
    const w = fingerPoint(FS.sw, 1, flex(0));
    const cam = camKeys(t, [[SH.side2, camAt(w, {x: 540, y: 800}, 2.5, 0)], [CUE.finger + 0.3, {x: 90, y: -40, z: 1.56}, eio], [SH.graft, {x: 100, y: -40, z: 1.6}, (x) => x]]);
    return (
      <>
        <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 35%, #2A3E47 0%, ${FK.bg1} 80%)`}} />
        <svg width={1080} height={1920} style={{position: 'absolute'}}>
          <g transform={camT(cam)}><FingerSide th={flex(0)} id="f2" wound={1} /></g>
        </svg>
      </>
    );
  }
  if (t < SH.micro2) {
    // the collagen sheet lands (elevated 3/4 view), then a pinpoint on a cell at its edge and a dive
    const drop = ramp(SH.graft + 0.15, CUE.patch1, t, (x) => 1 - Math.pow(1 - x, 2.2));
    const open = ramp(CUE.patch1 + 0.05, CUE.patch1 + 0.2, t);
    const away = ramp(CUE.patch1 + 0.2, CUE.patch1 + 0.55, t, ein);
    const edge = cylPt(-226, -0.05, PV_R());
    const tw = {x: -170 + away * 120, y: cylPt(-170, -0.4, PV_R()).y - (1 - drop) * 170 - away * 520};
    const dive = ramp(SH.micro2 - 0.3, SH.micro2, t, ein);
    const cam0 = camAt({x: 0, y: -110}, {x: 540, y: 860}, 1.0);
    const cam = camKeys(t, [[SH.graft, cam0], [SH.micro2 - 0.3, {...cam0, z: 1.12}, (x) => x], [SH.micro2, camAt(edge, {x: 540, y: 860}, 9), (x) => ein(x)]]);
    const pin = fadeWin(t, CUE.patch1 + 0.25, SH.micro2, 0.1);
    const ps = toScreen(cam, edge);
    return (
      <>
        <AbsoluteFill style={{background: FK.bg1}} />
        <svg width={1080} height={1920} style={{position: 'absolute'}}>
          <g transform={camT(cam)}>
            <PatchView id="pv" drop={drop} t={t} />
            {away < 1 && <Tweezers x={tw.x} y={tw.y} open={open} />}
          </g>
          {pin > 0 && dive < 0.6 && <circle cx={ps.x} cy={ps.y} r={40} fill="none" stroke="#7FF2EA" strokeWidth={5} opacity={pin} />}
        </svg>
      </>
    );
  }
  if (t < SH.back + 0.28) {
    // inside the repair (illustrative scale): DAY 0 -> DAY 7
    const p = dayP(t);
    const tone = ramp(SH.micro2 + 0.05, SH.micro2 + 0.35, t);
    const hero = heroMigPos(p);
    const over = camAt({x: 0, y: 60}, {x: 540, y: 880}, 2.05);
    const cam = camKeys(t, [
      [SH.micro2, camAt(repairMap(0)(-RP.patchW, -20), {x: 540, y: 860}, 6.5)],
      [SH.micro2 + 0.5, over, eout],
      [CUE.cells2 - 0.15, {...over, z: 1.5}, (x) => x],
      [CUE.cells2 + 0.35, camAt(hero, {x: 540, y: 860}, 4.2), eio],
      [CUE.helping - 0.05, camAt(heroMigPos(dayP(CUE.helping - 0.05)), {x: 540, y: 860}, 4.2), (x) => x],
      [CUE.close + 0.2, camAt({x: 0, y: 50}, {x: 540, y: 900}, 1.8), eio],
      [SH.back, camAt({x: 0, y: 40}, {x: 540, y: 900}, 1.7), (x) => x],
      [SH.back + 0.28, camAt({x: 0, y: 0}, {x: 540, y: 860}, 0.25), ein],
    ]);
    const glow = fadeWin(t, CUE.cells2 - 0.1, CUE.helping + 0.2, 0.15);
    return (
      <>
        <Backdrop tone={tone} />
        <svg width={1080} height={1920} style={{position: 'absolute'}}>
          <g transform={camT(cam)}><RepairMicro p={p} t={t} tone={tone} id="rm" heroGlow={glow} /></g>
        </svg>
        <Chip text="COLLAGEN PATCH" x={540} y={600} a={fadeWin(t, SH.micro2 + 0.45, CUE.seven + 0.4, 0.12)} size={32} dot="#E9F3F4" />
        <DayCounter p={p} a={fadeWin(t, CUE.seven - 0.25, SH.back + 0.4, 0.15)} />
      </>
    );
  }
  if (t < SH.mech + 1.1) {
    // pull back to the finger flexing again: repaired covering with an integrated graft; then the cutaway
    const k = ramp(SH.back + 0.45, SH.back + 0.95, t, eio) * (1 - ramp(SH.back + 1.0, SH.mech + 0.3, t, eio));
    const th = flex(k * 0.9);
    const w = fingerPoint(FS.sw, 1, flex(0));
    const inside = fingerPoint(255, 0, flex(0));
    const cut = ramp(CUE.machine - 0.05, CUE.machine + 0.55, t, eio);
    const cam = camKeys(t, [
      [SH.back + 0.28, camAt(w, {x: 540, y: 820}, 5.5)],
      [SH.back + 0.85, {x: 90, y: -30, z: 1.56}, eout],
      [SH.mech, {x: 100, y: -40, z: 1.6}, (x) => x],
      [CUE.machine + 0.5, camAt(inside, {x: 540, y: 840}, 4.2), eio],
      [SH.mech + 1.1, camAt(inside, {x: 540, y: 840}, 4.35), (x) => x],
    ]);
    return (
      <>
        <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 35%, #2A3E47 0%, ${FK.bg1} 80%)`}} />
        <svg width={1080} height={1920} style={{position: 'absolute'}}>
          <g transform={camT(cam)}><FingerSide th={th} id="f3" wound={1} patch={1} integrate={1} cut={cut} /></g>
        </svg>
        <DayCounter p={1} a={fadeWin(t, SH.back - 0.4, SH.back + 0.75, 0.15)} />
      </>
    );
  }
  if (t < SH.faceSec) {
    // hold on the rigid mechanism ("The machine isn't alive")
    const inside = fingerPoint(255, 0, flex(0));
    const cam = camKeys(t, [[SH.mech + 1.1, camAt(inside, {x: 540, y: 840}, 4.35)], [SH.faceSec, camAt(inside, {x: 540, y: 840}, 4.7), (x) => x]]);
    return (
      <>
        <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 35%, #2A3E47 0%, ${FK.bg1} 80%)`}} />
        <svg width={1080} height={1920} style={{position: 'absolute'}}>
          <g transform={camT(cam)}><FingerSide th={flex(0)} id="f4" wound={1} patch={1} integrate={1} cut={1} /></g>
        </svg>
      </>
    );
  }
  if (t < SH.faceEnd) {
    // matched material boundary: covering over rigid base, now the face; unwind and pull out
    const inside = fingerPoint(255, 0.66, flex(0));
    const camF = camAt(fingerPoint(255, 0, flex(0)), {x: 540, y: 840}, 4.7);
    const bScreen = toScreen(camF, inside);
    const sb = SEC.sc + 160;
    const start = camAt(secPt(sb, SEC.sil, 0), bScreen, 4.7, 90);
    const end = camAt(curveAt(SEC.sc + 60).p, {x: 520, y: 860}, 2.1, 0);
    const cam = camKeys(t, [[SH.faceSec, start], [SH.faceEnd, end, eio]]);
    return (
      <>
        <Backdrop />
        <SectionScene t={t} d={0} cam={cam} tone={0} />
      </>
    );
  }
  {
    // front of the face again: the cell window is open; on "is" it closes into the surface; the smile restarts from
    // the opening camera, so the last frame runs into frame 0
    const s = t > DUR - 0.62 ? smileLoop(t - DUR) : 0;
    const win = 1 - ramp(CUE.is2, CUE.is2 + 0.32, t, eio);
    const v: View = {yaw: V0.yaw, pitch: 0.07};
    const m = winMap(0, v);
    const wc = m((WIN.u0 + WIN.u1) / 2, WIN.wMax * 0.42);
    const pre: Cam = {x: CAM0.x - 6, y: CAM0.y + 4, z: CAM0.z - 0.09};
    const cam = camKeys(t, [
      [SH.faceEnd, camAt(wc, {x: 540, y: 860}, 5.4)],
      [CUE.is2 + 0.1, camAt(wc, {x: 540, y: 900}, 3.0), eio],
      [DUR - 0.45, pre, eio],
      [DUR, CAM0, (x) => x],
    ]);
    return (
      <>
        <Backdrop />
        <FaceScene t={t} v={v} s={Math.min(s, 1)} cam={cam} win={win} tone={0} id="fe" />
      </>
    );
  }
};
const PV_R = () => 260;

export const LivingSkin: React.FC<{audio?: string | false; captions?: boolean}> = ({audio = 'mix', captions = true}) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  return (
    <AbsoluteFill style={{background: '#0B1117'}}>
      {shot(t)}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.38) 100%)'}} />
      {captions && <Captions t={t} />}
      {audio === 'mix' && <Audio src={staticFile('audio/mix.wav')} />}
      {audio === 'voice' && <Audio src={staticFile('audio/narration.wav')} />}
    </AbsoluteFill>
  );
};

// Standalone stills (cover / opening frame): the film's own picture at time t, no captions.
export const FilmStill: React.FC<{t: number}> = ({t}) => (
  <AbsoluteFill style={{background: '#0B1117'}}>
    {shot(t)}
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.38) 100%)'}} />
  </AbsoluteFill>
);

// Cover: the device smiling with its cheek section open (both reveals of the hook in one frame), no text.
export const CoverStill: React.FC<{z?: number}> = ({z = 1.9}) => (
  <AbsoluteFill style={{background: '#0B1117'}}>
    <Backdrop />
    <FaceScene t={1.4} v={{yaw: -0.46, pitch: 0.07}} s={1} cam={{x: 70, y: 30, z}} win={1} tone={0} stretch={0.6} id="cv" />
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.38) 100%)'}} />
  </AbsoluteFill>
);
