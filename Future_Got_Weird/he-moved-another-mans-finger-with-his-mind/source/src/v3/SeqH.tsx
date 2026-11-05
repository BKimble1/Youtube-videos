// V3 H (T('Go back to that finger') - 0.3 -> end): the return to the finger, and the loop back to frame 0.
// 195.97  G's last frame: plain paper and ONE saffron bar (LINE_BAR). The bar IS the space bar: it takes the cap's
//         shape, the keyboard builds outward from it, the room's colours come up around it, and on "Go back to that
//         finger" Stocco's hand glides in and settles over the bar (anticipation, a soft overshoot).
// 199.40  "the pulse": the 2013 command once, as it was: the stimulation runs down the forearm, the wrist is yanked
//         up, the finger is driven onto the key, released (fast, mechanical); "somebody else's hand moved": pull back
//         to his face: he looks down at the hand that moved.
// 202.95  "Six years later": the coil slides off the motor area round to the back of his head (vision);
//         "a pulse could give you advice": a soft click and a small flash in his vision, nothing in the arm.
// 206.49  "And you could decide the other guy was wrong": a calm, voluntary choice. He weighs it; the finger lifts a
//         little (anticipation), hesitates over the bar, then deliberately curls back and the hand settles without
//         pressing (follow-through); a small shake of the head, a smile on "wrong".
// 208.50  pull back: the coil returns to the motor site, Rao's lab slides in from the left and the frame settles
//         into the film's first composition; in the last half second the route lights up from Rao's cap again, so
//         the last frame flows into frame 0.
import React from 'react';
import {clamp, easeIn, easeInOut, easeOut, fmt, lerp} from '../dc/math';
import {GameScreen} from '../art/game';
import {INK, K} from '../art/kit';
import {FPS, T, TE} from './core2';
import {LINE_BAR} from './contracts';
import {camAt, camPath, CamS, camT, lin1, RAO_ROUTE, RaoRoom, STO_HEAD, STO_KEY, STO_P, STO_ROUTE, StoccoRoom} from './abworld';
import {Diptych, dipRects, Panel} from './abdip';
import {H_HOVER, H_REST, H_TUCK, HPose, HS, h2r, KEY, mixH, tmsPress} from './abhand';
import {CampusA, EV_A, GameWorld, P0_DIP} from './SeqA';
import {Pose} from './crew3';

const END = 6353 / FPS; // 211.767: the frame after the last one is frame 0 of the film
const H0 = () => T('Go back to that finger') - 0.3;
const T_HANDIN = () => T('Go back') - 0.05;
const T_PULSE = () => T('the pulse helped') + 0.0;
const T_PULL1 = () => T('when somebody') - 0.1;
const T_COIL = () => T('Six years later') - 0.05;
const T_ADV = () => T('a pulse could') + 0.08;
const T_DEC = () => T('And you could decide');
const T_WRONG = () => T('wrong');
const T_PULL2 = () => TE('wrong') + 0.08;
const T_SLIDE = () => TE('wrong') + 0.6;
const T_HOLD = () => END - 1.25;

// ---------------------------------------------------------------- cameras (room-local, Stocco's lab)
const Z_BAR = (LINE_BAR.x1 - LINE_BAR.x0) / (KEY.w * HS);
const BAR_CAM = (): CamS => camAt(STO_KEY, {x: (LINE_BAR.x0 + LINE_BAR.x1) / 2, y: (LINE_BAR.y0 + LINE_BAR.y1) / 2}, Z_BAR);
const ECU: CamS = {x: 722, y: 694, z: 5.0};
const MED: CamS = {x: 870, y: 600, z: 1.75};
const DEC: CamS = {x: 830, y: 590, z: 2.15};
const hCam = (t: number): CamS =>
  camPath(t, [
    [H0(), BAR_CAM()],
    [H0() + 0.12, BAR_CAM(), lin1],
    [T_HANDIN() + 0.95, ECU],
    [T_PULSE() - 0.3, {...ECU, x: ECU.x + 8, z: ECU.z * 1.03}, lin1],
    [T_PULL1(), {...ECU, x: ECU.x + 10, z: ECU.z * 1.05}, lin1],
    [T_PULL1() + 1.2, MED],
    [T_DEC() - 0.4, {...MED, x: MED.x + 10, z: MED.z * 1.04}, lin1],
    [T_DEC() + 0.7, DEC],
    [T_PULL2(), {...DEC, x: DEC.x - 8, z: DEC.z * 1.05}, lin1],
  ]);

// ---------------------------------------------------------------- performance
/** the hand: enters, hovers, the one involuntary press, then the voluntary choice not to press */
const handAt = (t: number): {pose: HPose; press: number; keyGlow: number; drive: number; off: {x: number; y: number}} => {
  const ti = T_HANDIN();
  // entrance: glides in along the forearm from frame-right, descends, settles with a soft overshoot
  const u = clamp((t - ti) / 0.85);
  const e = 1 - Math.exp(-u * 5.2) * Math.cos(u * 7.5) * (1 - u);
  const off = {x: 420 * (1 - easeOut(clamp(u * 1.15))), y: -70 * Math.sin(Math.PI * clamp(u * 1.1)) * (1 - u)};
  let pose = mixH({...H_REST, wrist: -6, a: [6, 12, 8]}, H_HOVER, clamp(e));
  let press = 0, keyGlow = 0, drive = -1;
  const breathe = Math.sin(t * 1.6) * 0.45;
  pose = {...pose, wrist: pose.wrist + breathe * clamp(u)};
  // 2013: once, involuntary
  const tp = T_PULSE();
  const pr = tmsPress(t, tp);
  if (t >= tp && t < pr.r1 + 0.05) {
    pose = pr.pose;
    press = pr.press;
    keyGlow = pr.keyGlow;
  }
  drive = t >= tp - 0.2 && t < tp + 0.2 ? (t - (tp - 0.2)) / 0.24 : -1;
  // 2019: the choice. Weigh it, lift a little (anticipation), hesitate over the bar, then curl back and rest.
  const td = T_DEC();
  if (t >= td) {
    const lift = easeInOut(clamp((t - (td + 0.1)) / 0.38));
    const hes = clamp((t - (td + 0.48)) / 0.5);
    const tuck = easeInOut(clamp((t - (td + 0.98)) / 0.55));
    const settle = clamp((t - (td + 1.53)) / 0.6);
    const LIFTED: HPose = {wrist: -7, a: [-10, 12, 6], curl: 0.3};
    const OVER: HPose = {wrist: 0, a: [22, 24, 12], curl: 0.36}; // the finger dips toward the bar, and stops short
    let p = mixH(H_HOVER, LIFTED, lift);
    p = mixH(p, OVER, Math.sin(Math.PI * hes) * 0.8);
    p = mixH(p, H_TUCK, tuck);
    // follow-through: the hand relaxes onto its rest with a small overshoot
    const fo = settle > 0 ? Math.exp(-settle * 4) * Math.sin(settle * 9) * 1.2 : 0;
    p = {...mixH(p, {...H_TUCK, wrist: 1.5, curl: 0.5}, easeOut(settle)), wrist: mixH(p, {...H_TUCK, wrist: 1.5}, easeOut(settle)).wrist + fo};
    pose = {...p, wrist: p.wrist + breathe * 0.6};
  }
  // the withdrawal: with the curl the hand draws back a little from the bar (and returns for the loop)
  const wd = easeInOut(clamp((t - (td + 1.0)) / 0.6)) * (1 - easeInOut(clamp((t - (T_SLIDE() + 0.2)) / 1.1)));
  const offW = {x: off.x + 26 * wd, y: off.y - 8 * wd};
  // the pull-back: the hand returns to the opening's hover
  const tb = T_SLIDE();
  if (t >= tb) pose = mixH(pose, H_HOVER, easeInOut(clamp((t - tb) / 1.2)));
  return {pose, press, keyGlow, drive, off: offW};
};
const stoFaceH = (t: number): Partial<Pose> => {
  const tp = T_PULSE();
  const pc = tmsPress(0, tp).tc;
  // he looks down at the hand that moved, puzzled
  const look = clamp((t - (pc + 0.4)) / 0.3) * (1 - clamp((t - (T_COIL() - 0.2)) / 0.4));
  // the flash: his eyes rise to it, brows up
  const ta = T_ADV();
  const up = clamp((t - (ta + 0.08)) / 0.25) * (1 - clamp((t - (T_DEC() - 0.4)) / 0.4));
  // the decision: eyes to the hand, a narrowed considering look, a small shake, a smile on "wrong"
  const td = T_DEC();
  const cons = clamp((t - (td - 0.15)) / 0.3) * (1 - clamp((t - (T_WRONG() - 0.1)) / 0.25));
  const shake = Math.sin(clamp((t - (td + 1.0)) / 0.7) * Math.PI * 2) * 5 * (t > td + 1.0 && t < td + 1.7 ? 1 : 0);
  const smile = clamp((t - (T_WRONG() - 0.05)) / 0.25) * (1 - clamp((t - (T_SLIDE() + 0.4)) / 0.6));
  const back = clamp((t - T_SLIDE()) / 0.8);
  const lookX = lerp(lerp(lerp(0.05, -0.95, look), 0.1, up), -0.8, cons);
  const lookY = lerp(lerp(lerp(0.18, 0.85, look), -0.85, up), 0.7, cons);
  return {
    lookX: lerp(lookX, 0.05, back), lookY: lerp(lookY, 0.18, back),
    brows: 0.6 * look + 0.7 * up - 0.3 * cons + 0.15 * smile, browAsym: 0.5 * look + 0.4 * cons,
    mouth: smile > 0.5 ? 'smirk' : cons > 0.5 ? 'hmm' : up > 0.5 ? 'o' : look > 0.5 ? 'hmm' : 'flat',
    tilt: -5 * look + 3 * up + shake - 3 * cons, lean: -1.2 * cons,
  };
};

// ---------------------------------------------------------------- the bar carried in
const BarMorph: React.FC<{t: number; cam: CamS}> = ({t, cam}) => {
  const k = clamp((t - H0()) / 0.4);
  const fade = 1 - clamp((t - (H0() + 0.28)) / 0.4);
  if (fade <= 0.001) return null;
  const e = easeInOut(k);
  const toS = (q: {x: number; y: number}) => {
    const r = h2r(STO_P, q);
    return {x: 960 + (r.x - cam.x) * cam.z, y: 540 + (r.y - cam.y) * cam.z};
  };
  const sk = 26;
  const kt = [toS({x: KEY.x - KEY.w / 2 + sk, y: KEY.y - KEY.depth}), toS({x: KEY.x + KEY.w / 2 - sk, y: KEY.y - KEY.depth}), toS({x: KEY.x + KEY.w / 2, y: KEY.y}), toS({x: KEY.x - KEY.w / 2, y: KEY.y})];
  const bt = [{x: LINE_BAR.x0, y: LINE_BAR.y0}, {x: LINE_BAR.x1, y: LINE_BAR.y0}, {x: LINE_BAR.x1, y: LINE_BAR.y1}, {x: LINE_BAR.x0, y: LINE_BAR.y1}];
  const pts = bt.map((b, i) => ({x: lerp(b.x, kt[i].x, e), y: lerp(b.y, kt[i].y, e)}));
  return <path d={`M${pts.map((p) => `${fmt(p.x)},${fmt(p.y)}`).join(' L')} Z`} fill={K.saffron} opacity={fade} />;
};

// ---------------------------------------------------------------- the sequence
export const VH: React.FC<{f: number}> = ({f}) => {
  const t = f / FPS;
  const h0 = H0();
  // the contract frame: plain paper, one saffron bar
  if (t < h0 + 0.5 / FPS) {
    return (
      <g>
        <rect x={0} y={0} width={1920} height={1080} fill={K.paper} />
        <rect x={LINE_BAR.x0} y={LINE_BAR.y0} width={LINE_BAR.x1 - LINE_BAR.x0} height={LINE_BAR.y1 - LINE_BAR.y0} fill={K.saffron} />
      </g>
    );
  }
  const ha = handAt(t);
  const paper = 1 - easeInOut(clamp((t - (h0 + 0.12)) / 0.75));
  const kbRise = easeOut(clamp((t - (h0 + 0.06)) / 0.55));
  const tp = T_PULSE();
  const coilBack = clamp((t - T_COIL()) / 0.85) * (1 - clamp((t - (T_PULL2() + 0.35)) / 1.0));
  const ta = T_ADV();
  const flash = clamp((t - (ta + 0.05)) / 0.12) * (1 - clamp((t - (ta + 0.7)) / 0.6));
  const coilPulse = Math.max(t >= tp - 0.25 && t < tp + 0.1 ? 1 - clamp((t - (tp - 0.25)) / 0.3) : 0);

  if (t < T_SLIDE()) {
    const cam = hCam(t);
    return (
      <g>
        <rect x={0} y={0} width={1920} height={1080} fill={K.paper} />
        <g transform={camT(cam)}>
          <StoccoRoom id="vh-sto" f={f} zr={cam.z} paper={paper} kbRise={kbRise} handOffset={ha.off} hand={ha.pose} press={ha.press} keyGlow={Math.max(ha.keyGlow, 1 - clamp((t - (h0 + 0.3)) / 0.5))}
            drive={ha.drive} coilPulse={coilPulse} stim={t >= tp - 0.3 && t < tp ? (t - (tp - 0.3)) / 0.12 : -1} coilBack={coilBack} flash={flash} face={stoFaceH(t)} life={0.4} />
        </g>
        <BarMorph t={t} cam={cam} />
      </g>
    );
  }
  // ---- the loop: Rao's lab slides in from the left and the frame settles into the film's first composition
  const P0 = P0_DIP;
  const s = easeInOut(clamp((t - T_SLIDE()) / 1.5));
  const last = hCam(T_SLIDE());
  const gx = lerp(-60, P0.gx, s);
  const Rcam: CamS = {x: lerp(last.x, P0.R.x, s), y: lerp(last.y, P0.R.y, s), z: Math.exp(lerp(Math.log(last.z), Math.log(P0.R.z), s))};
  const [rl, rr] = dipRects(gx);
  const L: Panel = {rect: rl, cam: P0.L};
  const R: Panel = {rect: rr, cam: Rcam};
  // the game on Rao's screen runs on the opening's clock, so the last frame is frame -1 of the film
  const gt = t - END;
  const ev = EV_A();
  // the route relights from Rao's cap in the last half second (frame 0 has it fully lit)
  const relight = clamp((t - (END - 0.62)) / 0.58);
  const capLit = clamp((t - (END - 1.0)) / 0.5);
  const roomL = (
    <RaoRoom id="vh-rao" f={f} screen={<GameWorld id="vh-g" t={gt} events={ev} trail />} capLit={capLit} compBlink={relight > 0.3 ? 1 : 0} compColor={K.saffron}
      face={{lookX: 0.85, lookY: 0.05, brows: -0.4, mouth: 'flat', lean: -1.2}} lens={0.9} lensContent={<GameScreen t={gt} events={ev} />} lit={relight} zr={L.cam.z} />
  );
  const roomR = (
    <StoccoRoom id="vh-sto2" f={f} zr={Rcam.z} hand={ha.pose} coilBack={coilBack} face={stoFaceH(t)} lit={relight} tmsLit={relight > 0.6 ? 1 : 0} stimLit={relight > 0.85 ? (relight - 0.85) / 0.15 : 0} life={0.35} />
  );
  const campusC: CamS = {x: 0, y: 470, z: 1.32};
  return (
    <Diptych id="vh-dip" L={L} R={R} roomL={roomL} roomR={roomR} C={campusC} m={0} campus={<CampusA f={f} C={campusC} t={t} roomL={<g />} roomR={<g />} id="vh-c" sig={-1} overlay={<g />} />}
      lit={relight > 0.4 ? (relight - 0.4) / 0.6 : 0} routeL={RAO_ROUTE.P.pts} routeR={STO_ROUTE.pts} />
  );
};

export const CUES_VH = (): {t: number; kind: string; gain?: number; dur?: number}[] => {
  const tp = T_PULSE();
  return [
    {t: T_HANDIN() + 0.1, kind: 'whoosh', gain: -16, dur: 0.6},
    {t: tp - 0.25, kind: 'coil_pulse', gain: -4},
    {t: tmsPress(0, tp).tc, kind: 'key_click', gain: -1},
    {t: T_COIL() + 0.1, kind: 'whoosh', gain: -18, dur: 0.7},
    {t: T_ADV(), kind: 'coil_pulse', gain: -8},
    {t: T_ADV() + 0.05, kind: 'flash', gain: -4},
    {t: T_SLIDE() + 0.2, kind: 'whoosh', gain: -16, dur: 1.2},
  ];
};
export {INK, easeIn};
