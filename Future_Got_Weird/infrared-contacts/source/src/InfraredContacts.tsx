// FGW "These Contacts Let You See With Your Eyes Closed" (V1). One continuous camera through one spatial model:
//   A 0-5.0 s   extreme close-up: the lens arrives on a fingertip, is placed, the finger leaves; the face; the lid
//               closes; the closed-eye view (a circle opened on the closed eye) shows two soft green flashes.
//   A->B        a cutaway window opens on the same closed eye (the one transition into the teaching diagram).
//   B           the diagram opens the eye (lids slide apart, the lens slides off): visible light reaches the retina
//               and registers; an infrared packet reaches it and registers nothing.
//   C           the lens slides back on; the camera pushes into its curved material, finds the embedded particles,
//               two infrared packets are absorbed by one particle, one green packet leaves.
//   D           pull back through the lens to the section; the lids close over the lens; visible light stops in the
//               lid, infrared continues.
//   E           the same infrared packet reaches the lens, converts at the particle, green light spreads to the
//               retina; the path lights up; the closed-eye flash returns (the opening's motif).
//   F           the window closes on the closed eye; pull back to the night train; widen to the sender across the
//               aisle and the reader above; a 4-pulse code; the lead's tiny smile; push back to the opening framing.
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import '@fontsource-variable/nunito';
import '@fontsource-variable/fredoka';
import {
  FPS, DUR, Pt, P, Cam, clamp, lerp, inv, ramp, eio, eio2, eout, ein, fadeWin, camKeys, keyCam, screenMats, matStr, apply,
  headToL0, L2toL0, SCALE1, SCALE2, Mat, rot,
} from './lib';
import {CUE, PATH_B_VIS, PATH_B_IR, SPEED_B, D_IR_ROWS, D_VIS_ROWS} from './timing';
import {LeadHead, LeadBody, Finger, LeadPose, POSE0} from './art/Lead';
import {SectionView, SectionState, HERO, EYE2, LID_FRONT_X, polar} from './art/Section';
import {TrainBack, Sender, Bystander, senderHand, LAYOUT} from './art/Train';
import {Captions, Chip, Packet, Inset, pulse, polyLen, Kind} from './Overlay';
import {LIGHT} from './theme';

const EYE_C = P(4, 6); // centre of the near eye's fissure (head coords, L1)
const pw = (t: number, keys: [number, number][]) => {
  // piecewise-linear value through (time, value) keys
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) return lerp(keys[i - 1][1], keys[i][1], inv(keys[i - 1][0], keys[i][0], t));
  return keys[keys.length - 1][1];
};

// ---------------- states ----------------
const tiltAt = (t: number) => 3 * ramp(CUE.face, CUE.wideLead + 0.4, t, eio);
const leadPose = (t: number): LeadPose => {
  const lid = t < CUE.lidClose0 ? 0 : ramp(CUE.lidClose0, CUE.lidClose1, t, eio2);
  const squeeze = 0.35 * ramp(CUE.contact, CUE.contact + 0.12, t, eout) * (1 - ramp(CUE.contact + 0.18, 0.95, t, eio));
  const brow = lerp(0.45, 0.12, ramp(0.6, 1.6, t)) + 0.25 * ramp(CUE.smirk0, CUE.smirk1, t, eout) - 0.15 * ramp(CUE.face, CUE.wideLead, t);
  const look = ramp(CUE.release, 1.3, t);
  return {
    ...POSE0, lid, squeeze, brow,
    gx: lerp(0.35, 0.15, look), gy: lerp(-0.45, 0, look),
    smirk: ramp(CUE.smirk0, CUE.smirk1, t, eout),
    tilt: tiltAt(t),
    lensOn: t < CUE.contact ? 0 : ramp(CUE.contact, CUE.contact + 0.22, t, eout),
    breath: Math.sin(t * 2 * Math.PI * 0.24),
  };
};
// fingertip path (head coords): arriving at frame 0, contact, withdraw down and out of frame
const fingerAt = (t: number) => {
  const F0 = P(66, 34), FC = P(25, 5), FX = P(330, 360);
  if (t < CUE.contact) return {tip: lerp2(F0, FC, eout(inv(0, CUE.contact, t))), dir: 30};
  if (t < CUE.release) return {tip: P(FC.x + 1.2 * Math.sin((t - CUE.contact) * 40) * 0.2, FC.y), dir: 30};
  const k = ramp(CUE.release, CUE.fingerOut, t, (x) => x * x * (2.2 - 1.2 * x));
  return {tip: lerp2(FC, FX, k), dir: lerp(30, 42, k)};
};
const lerp2 = (a: Pt, b: Pt, k: number) => P(lerp(a.x, b.x, k), lerp(a.y, b.y, k));

// infrared hero packet x position in D/E (L2), slower inside the lid tissue
const heroX = (t: number) => pw(t, [[CUE.irD[1], 196], [17.55, 137.5], [18.75, 119.7], [CUE.heroAtLens, 118.3], [CUE.heroAtParticle, HERO.x]]);

const sectionState = (t: number, zl: number, view: SectionState['view']): SectionState => {
  const charge = t < 13 ? clamp((t - CUE.absorb1) / 0.12) + clamp((t - CUE.absorb2) / 0.12) : 0;
  const emit = t < 13 ? ramp(CUE.emit0, CUE.emit1, t, (x) => x) : 0;
  const visRet = fadeWin(t, CUE.visLaunch + polyLen(PATH_B_VIS) / SPEED_B - 0.03, CUE.irLaunch + 0.75, 0.12);
  const greenRet = ramp(CUE.greenAtRetina - 0.1, CUE.greenAtRetina + 0.2, t) * (1 - ramp(CUE.insetEClose0, CUE.revealClose1, t));
  return {
    zl, view,
    reveal: ramp(CUE.reveal0, CUE.reveal1, t, eout) * (1 - ramp(CUE.revealClose0, CUE.revealClose1, t, eio)),
    lidOpen: ramp(CUE.lidOpen0, CUE.lidOpen1, t, eio) * (1 - ramp(CUE.lidClose2_0, CUE.lidClose2_1, t, eio)),
    lensOut: ramp(CUE.lensOff0, CUE.lensOff1, t, ein) * (1 - ramp(CUE.lensBack0, CUE.lensBack1, t, eout)),
    retina: greenRet > 0.001
      ? {amt: greenRet, deg: 180, spread: 44, col: LIGHT.green}
      : {amt: visRet, deg: 180, spread: 14, col: '#FFE48A'},
    hero: {charge: charge * (1 - emit), emit, spin: 8 * inv(8.5, 13, t)},
    lensFocus: fadeWin(t, CUE.lensBack1 - 0.2, CUE.push0 + 0.7, 0.2),
  };
};

// ---------------- camera ----------------
const camAt = (t: number): Cam => {
  const tilt = tiltAt(t);
  const H1 = (p: Pt) => headToL0(p, tilt);
  const H2 = (p: Pt) => L2toL0(p, tilt);
  const K = (lvl: 0 | 1 | 2, p: Pt, sx: number, sy: number, zl: number) => keyCam({lvl, p: lvl === 0 ? p : lvl === 1 ? H1(p) : H2(p), sx, sy, zl});
  const leadEye0 = H1(EYE_C);
  const OPEN = K(1, P(8, 3), 540, 820, 8.6);
  return camKeys(t, [
    [0, OPEN],
    [0.95, K(1, P(8, 3), 540, 820, 9.1), (x) => x],
    [2.25, K(1, P(0, 0), 400, 800, 2.4), eio2],
    [CUE.insetClose0 - 0.1, K(1, P(2, 5), 520, 900, 5.6), eio2],
    [CUE.reveal1 - 0.05, K(2, P(24, 20), 540, 960, 4.0), eio],
    [CUE.lensBack0, K(2, P(26, 18), 540, 960, 4.15), (x) => x],
    [CUE.push0, K(2, P(28, 17), 540, 958, 4.25), (x) => x],
    [CUE.push1, K(2, HERO, 540, 820, 300), eio],
    [CUE.emit0 - 0.25, K(2, HERO, 560, 800, 1150), eio2],
    [CUE.pull0, K(2, HERO, 660, 790, 820), eio],
    [CUE.pull1, K(2, P(86, -4), 540, 900, 5.4), eio],
    [CUE.heroAtLens - 0.75, K(2, P(88, -4), 540, 900, 5.55), (x) => x],
    [CUE.heroAtParticle + 0.05, K(2, HERO, 610, 860, 9.5), eio],
    [CUE.convert + 0.3, K(2, HERO, 600, 860, 10.5), (x) => x],
    [CUE.greenAtRetina + 0.35, K(2, P(22, 0), 540, 900, 3.95), eio],
    [CUE.revealClose0, K(2, P(22, 0), 540, 900, 3.7), (x) => x],
    [CUE.wideLead, K(0, leadEye0, 380, 760, 1.9), (x) => eio2(x)],
    [CUE.reveal2_0, K(0, leadEye0, 385, 762, 1.85), (x) => x],
    [CUE.reveal2_1, K(0, P(560, 845), 540, 880, 1.04), eio],
    [CUE.push2_0, K(0, P(560, 845), 540, 880, 1.06), (x) => x],
    [DUR, K(1, P(8, 3), 540, 820, 8.6), eio2],
  ]);
};

const invMat = (m: Mat): Mat => {
  const det = m[0] * m[3] - m[1] * m[2];
  const a = m[3] / det, b = -m[1] / det, c = -m[2] / det, d = m[0] / det;
  return [a, b, c, d, -(a * m[4] + c * m[5]), -(b * m[4] + d * m[5])];
};

// ---------------- the frame ----------------
export const Frame: React.FC<{t: number; captions: boolean}> = ({t, captions}) => {
  const cam = camAt(t);
  const pose = leadPose(t);
  const tilt = pose.tilt;
  const M = screenMats(cam, tilt);
  const zl2 = cam.z * SCALE2, zl1 = cam.z * SCALE1;
  const inv2 = invMat(M.L2);
  const c0 = apply(inv2, P(0, 0)), c1 = apply(inv2, P(1080, 1920));
  const view = {x0: Math.min(c0.x, c1.x), x1: Math.max(c0.x, c1.x), y0: Math.min(c0.y, c1.y), y1: Math.max(c0.y, c1.y)};
  const sec = sectionState(t, zl2, view);
  const s2 = (p: Pt) => apply(M.L2, p);
  const sH = (p: Pt) => apply(M.Head, p);
  const s0 = (p: Pt) => apply(M.L0, p);
  const fin = fingerAt(t);
  const showTrain = cam.z < 30;
  const showFig = cam.z < 9;
  const eyeS = sH(EYE_C);

  // ---- packets ----
  const packets: {pts: Pt[]; d: number; kind: Kind; a?: number; len?: number; sc?: number}[] = [];
  const psc = t < CUE.lensBack0 ? 1.3 : t < CUE.pull0 + 0.4 ? 1.6 : 1.35;
  const along = (path: Pt[], d2: number, kind: Kind, a = 1, len = 200) => packets.push({pts: path.map(s2), d: d2 * zl2, kind, a, len, sc: psc});
  // B
  if (t > CUE.visLaunch && t < CUE.irLaunch + 1.4) {
    const dv = (t - CUE.visLaunch) * SPEED_B;
    along(PATH_B_VIS, dv, 'vis', 1 - clamp((dv - polyLen(PATH_B_VIS)) / 60));
    const di = (t - CUE.irLaunch) * SPEED_B;
    if (di > 0) along(PATH_B_IR, di, 'ir', 1 - clamp((di - polyLen(PATH_B_IR)) / 50));
  }
  // C: two infrared packets absorbed by the hero particle, one green packet leaves (inward)
  for (const at of [CUE.absorb1, CUE.absorb2]) {
    if (t > at - 0.5 && t < at + 0.4) along([P(HERO.x + 1.3, HERO.y), HERO], ((t - (at - 0.5)) / 0.5) * 1.3, 'ir', 1, 230);
  }
  if (t > CUE.emit0 + 0.08 && t < CUE.emit1 + 0.8) along([HERO, P(HERO.x - 2.2, HERO.y)], ((t - CUE.emit0 - 0.08) / 1.1) * 1.6, 'green', 1, 190);
  // D: ambient visible light stops in the lid; infrared continues
  D_VIS_ROWS.forEach((y, i) => {
    const at = CUE.visBlock[i];
    if (t < at || t > at + 1.6) return;
    const xf = LID_FRONT_X(y) - (i === 1 ? 7 : 2);
    const path = [P(196, y), P(xf, y)];
    const d = (t - at) * 110;
    along(path, d, 'vis', 1 - clamp((d - polyLen(path)) / 22), 170);
  });
  D_IR_ROWS.forEach((y, i) => {
    const at = CUE.irD[i];
    if (t < at || t > CUE.heroAtParticle + 0.4) return;
    const hero = i === 1;
    const x = hero ? heroX(t) : pw(t, [[at, 196], [at + 1.04, 137.5], [at + 2.24, 119.7]]);
    const end = hero ? HERO.x : i === 0 ? 128 : 119.7;
    const path = [P(196, y), P(end, y)];
    const d = 196 - Math.max(x, end - 1e-3) + (hero ? 0 : 0);
    const fadeLid = i === 0 ? 1 - clamp((196 - x - 60) / 8) : 1;
    const fadeEnd = hero ? 1 : i === 2 ? 1 - clamp((t - (at + 2.24)) / 0.3) : 1;
    const inLid = x < 137.5 ? 0.78 : 1;
    along(path, hero ? 196 - x + (t > CUE.heroAtParticle ? (t - CUE.heroAtParticle) * 12 : 0) : d + (i === 2 && t > at + 2.24 ? (t - at - 2.24) * 8 : 0), 'ir', fadeLid * fadeEnd * inLid * (hero ? 1 : 0.85), hero ? 210 : 180);
  });
  // E: the converted green light spreads inward to the retina
  const PATH_E = [HERO, P(88, -3), P(74, -1.5), P(-89, 0)];
  const tE = CUE.convert + 0.1;
  if (t > tE && t < CUE.greenAtRetina + 0.5) {
    const d = ((t - tE) / (CUE.greenAtRetina - tE)) * polyLen(PATH_E);
    along(PATH_E, d, 'green', 1 - clamp((d - polyLen(PATH_E)) / 40), 230);
  }
  const cone = clamp((t - (tE + 0.35)) / 0.6) * (1 - ramp(CUE.pathHi1 - 0.2, CUE.revealClose1, t)) * (t > tE ? 1 : 0);
  const pathHi = fadeWin(t, CUE.pathHi0, CUE.pathHi1, 0.2);
  // E conversion spark (the particle itself is sub-pixel at this scale)
  const charging = fadeWin(t, CUE.heroAtParticle, CUE.convert + 0.1, 0.1);
  const spark = t > CUE.convert - 0.02 ? Math.sin(Math.PI * clamp((t - CUE.convert + 0.02) / 0.55)) : 0;
  // F: transmitter code (a packet per button press) and the recipient's flashes
  const aim = ramp(CUE.aim0, CUE.aim1, t, eio) * (1 - 0.35 * ramp(CUE.push2_0, CUE.push2_0 + 0.6, t));
  const press = CUE.code.reduce((m, [at, len]) => Math.max(m, clamp((t - at) / 0.04) * (1 - clamp((t - at - len) / 0.05))), 0);
  const hand = senderHand(aim);
  const handDeg = lerp(-60, -18, aim);
  const tip0 = P(hand.x + rot(P(-92, -2), handDeg).x * LAYOUT.sender.s, hand.y + rot(P(-92, -2), handDeg).y * LAYOUT.sender.s);
  const tipS = s0(tip0);
  const leadEyeS = sH(EYE_C);
  const lineLen = Math.hypot(leadEyeS.x - tipS.x, leadEyeS.y - tipS.y);
  const TRAVEL = 0.28;
  const codeFlash = CUE.code.reduce((m, [at, len]) => Math.max(m, pulse(t, at + TRAVEL, len)), 0);

  // ---- insets ----
  const insetA = ramp(CUE.insetOpen0, CUE.insetOpen1, t, eout) * (1 - ramp(CUE.insetClose0, CUE.insetClose1, t, ein));
  const flashA = Math.max(pulse(t, CUE.pulseA[0], 0.3), pulse(t, CUE.pulseA[1], 0.3));
  const insetE = ramp(CUE.insetE0, CUE.insetE1, t, eout) * (1 - ramp(CUE.insetEClose0, CUE.insetEClose1, t, eio2));
  const retS = s2(polar(P(0, 0), 90, 180));
  const insetEc = lerp2(retS, eyeS, ramp(CUE.insetEClose0, CUE.insetEClose1, t, eio));
  const flashE = pulse(t, CUE.flashE, 0.5);
  const insetF = fadeWin(t, CUE.insetF0, CUE.insetF1, 0.3);
  const fScale = clamp(cam.z / 1.12, 0.6, 2.2);
  const insetFc = P(leadEyeS.x + 175 * fScale, leadEyeS.y - 235 * fScale);

  // ---- labels ----
  const lab = (p: Pt) => s2(p);
  const lb = {
    visB: {p: lab(P(140, 46)), a: fadeWin(t, CUE.visLaunch + 0.05, CUE.irLaunch + 0.1, 0.15)},
    irB: {p: lab(P(140, -48)), a: fadeWin(t, CUE.irLaunch + 0.05, CUE.lensBack0 + 0.05, 0.15)},
    irC: {p: P(s2(HERO).x + 170, s2(HERO).y - 250), a: fadeWin(t, CUE.absorb1 - 0.45, CUE.emit0 - 0.1, 0.15)},
    visC: {p: P(s2(HERO).x - 250, s2(HERO).y + 230), a: fadeWin(t, CUE.emit0 + 0.35, CUE.pull0 + 0.1, 0.15)},
    visD: {p: lab(P(146, -62)), a: fadeWin(t, CUE.visBlock[0] + 0.1, CUE.irD[0], 0.15)},
    irD: {p: lab(P(146, 56)), a: fadeWin(t, CUE.irD[0] + 0.1, CUE.heroAtLens - 0.2, 0.15)},
  };

  const heroS = s2(HERO);
  return (
    <AbsoluteFill style={{background: '#1B3340'}}>
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        {showTrain && (
          <g transform={matStr(M.L0)}>
            <TrainBack t={t} id="tb" leadLamp={0.85} />
            {showFig && <Bystander page={ramp(CUE.page0, CUE.page1, t, eio)} breath={Math.sin(t * 2 * Math.PI * 0.2 + 1)} id="by" />}
          </g>
        )}
        {cam.z < 14 && <g transform={matStr(M.L1)}><LeadBody id="lbb" breath={pose.breath} pass="back" /></g>}
        {!(sec.reveal >= 1 && zl2 > 20) && <g transform={matStr(M.Head)}><LeadHead p={pose} id="lh" frame={Math.round(t * FPS)} detail={zl1 > 4 ? 1 : 0} /></g>}
        {sec.reveal > 0 && <g transform={matStr(M.L2)}><SectionView s={sec} id="sec" /></g>}
        {t < CUE.fingerOut + 0.05 && (
          <g transform={matStr(M.Head)}>
            <Finger tip={fin.tip} dir={fin.dir} lens={t < CUE.contact + 0.02 ? 1 : 0} lensRx={22} id="fg" />
          </g>
        )}
        {cam.z < 14 && <g transform={matStr(M.L1)}><LeadBody id="lbf" breath={pose.breath} pass="front" /></g>}
        {showFig && (
          <g transform={matStr(M.L0)}>
            <Sender aim={aim} press={press} look={1} smile={0.4 + 0.6 * ramp(CUE.code[3][0], CUE.code[3][0] + 0.5, t)} breath={Math.sin(t * 2 * Math.PI * 0.22 + 2)} id="sd" />
          </g>
        )}

        {/* ---- schematic overlays ---- */}
        {/* A: faint infrared hints arriving at the closed eye just before each perceived flash */}
        {CUE.pulseA.map((at, i) => {
          const d = ((t - (at - 0.42)) / 0.42) * 640;
          return t > at - 0.42 && t < at + 0.3 ? <Packet key={i} pts={[P(eyeS.x + 640, eyeS.y + 30), P(eyeS.x + 20, eyeS.y + 4)]} d={d} kind="ir" a={0.8} len={190} scale={1.2} /> : null;
        })}
        <Inset c={P(eyeS.x + 60, eyeS.y - 430 * insetA)} r={270 * insetA} flash={flashA} id="inA" tail={P(eyeS.x + 10, eyeS.y - 40)} />
        {/* E: the diffuse spread of converted light to the retina, then the whole path */}
        {cone > 0.01 && (
          <path d={`M${heroS.x} ${heroS.y}L${s2(P(88, -16)).x} ${s2(P(88, -16)).y}L${s2(polar(P(0, 0), 89, 152)).x} ${s2(polar(P(0, 0), 89, 152)).y}A${89 * zl2} ${89 * zl2} 0 0 0 ${s2(polar(P(0, 0), 89, 208)).x} ${s2(polar(P(0, 0), 89, 208)).y}L${s2(P(88, 16)).x} ${s2(P(88, 16)).y}Z`} fill={LIGHT.green} opacity={0.2 * cone} />
        )}
        {pathHi > 0.01 && (
          <g opacity={pathHi}>
            <line x1={s2(P(196, HERO.y)).x} y1={heroS.y} x2={heroS.x} y2={heroS.y} stroke={LIGHT.ir} strokeWidth={6} strokeDasharray="16 12" strokeLinecap="round" />
            <polyline points={PATH_E.map((p) => `${s2(p).x},${s2(p).y}`).join(' ')} fill="none" stroke={LIGHT.green} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
            {[s2(P(LID_FRONT_X(HERO.y), HERO.y)), heroS, s2(P(-89, 0))].map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={11} fill={i === 0 ? LIGHT.ir : LIGHT.green} stroke="#0B2730" strokeWidth={3} />)}
          </g>
        )}
        {packets.map((k, i) => <Packet key={i} pts={k.pts} d={k.d} kind={k.kind} a={k.a} len={k.len} scale={k.sc} />)}
        {(() => {
          // marks the one particle the explanation follows, from the end of the push until it emits
          const a = fadeWin(t, CUE.push1 - 0.35, CUE.emit0 + 0.25, 0.2);
          const r = Math.max(0.16 * zl2 * 1.7, 18);
          return a > 0.01 && t < 13 ? <circle cx={heroS.x} cy={heroS.y} r={r + 6 * Math.sin(t * 5)} fill="none" stroke="#FFFFFF" strokeWidth={4} strokeDasharray="10 9" opacity={0.85 * a} /> : null;
        })()}
        {charging > 0.01 && <circle cx={heroS.x} cy={heroS.y} r={30 + 8 * Math.sin(t * 24)} fill={LIGHT.ir} opacity={0.5 * charging} />}
        {spark > 0.01 && (
          <g opacity={spark}>
            <circle cx={heroS.x} cy={heroS.y} r={40 + 110 * spark} fill={LIGHT.green} opacity={0.45} />
            <circle cx={heroS.x} cy={heroS.y} r={26 + 40 * spark} fill={LIGHT.greenDeep} opacity={0.5} />
            <circle cx={heroS.x} cy={heroS.y} r={30 + 70 * (1 - spark)} fill="none" stroke={LIGHT.green} strokeWidth={6} opacity={spark} />
            <circle cx={heroS.x} cy={heroS.y} r={18} fill="#FFFFFF" />
          </g>
        )}
        <Inset c={insetEc} r={560 * insetE} flash={flashE} id="inE" />
        {/* F: the code travels from the transmitter to the closed eye (schematic overlay) */}
        {CUE.code.map(([at, len], i) => {
          if (t < at || t > at + len + TRAVEL + 0.2) return null;
          const speed = lineLen / TRAVEL;
          const d = (t - at) * speed;
          return <Packet key={i} pts={[tipS, leadEyeS]} d={d} kind="ir" a={0.8} len={Math.max(110, len * speed)} scale={0.8} />;
        })}
        {insetF > 0.01 && <Inset c={insetFc} r={128 * insetF * Math.min(1.3, fScale)} flash={codeFlash} id="inF" tail={P(leadEyeS.x + 30 * fScale, leadEyeS.y - 30 * fScale)} />}
      </svg>
      <Chip text="VISIBLE" x={lb.visB.p.x} y={lb.visB.p.y} a={lb.visB.a} dot={LIGHT.vis} />
      <Chip text="INFRARED" x={lb.irB.p.x} y={lb.irB.p.y} a={lb.irB.a} dot={LIGHT.ir} dashed />
      <Chip text="INFRARED" x={lb.irC.p.x} y={lb.irC.p.y} a={lb.irC.a} dot={LIGHT.ir} dashed />
      <Chip text="VISIBLE" x={lb.visC.p.x} y={lb.visC.p.y} a={lb.visC.a} dot={LIGHT.green} />
      <Chip text="VISIBLE" x={lb.visD.p.x} y={lb.visD.p.y} a={lb.visD.a} dot={LIGHT.vis} />
      <Chip text="INFRARED" x={lb.irD.p.x} y={lb.irD.p.y} a={lb.irD.a} dot={LIGHT.ir} dashed />
      {captions && <Captions t={t} />}
    </AbsoluteFill>
  );
};

export const InfraredContacts: React.FC<{audio: string | false; captions: boolean}> = ({audio, captions}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Frame t={frame / FPS} captions={captions} />
      {audio && <Audio src={staticFile(`audio/${audio}.wav`)} />}
    </AbsoluteFill>
  );
};
export const FilmStill: React.FC<{t: number; captions?: boolean}> = ({t, captions = false}) => <Frame t={t} captions={captions} />;
export {EYE2};
