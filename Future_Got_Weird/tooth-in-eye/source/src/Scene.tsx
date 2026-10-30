// The whole film as a function of time. Four places, joined through the subject itself:
//   FRONT  the patient's face (hook, the pocket under the other eye, the reaction and the loop)
//   SECT   the patient in profile with local cut-aways (the eye in section, the upper jaw)
//   BENCH  the drape where the tooth block becomes the implant
//   VIEW   what he sees
// The implant is one solid drawn by one renderer in every place; at each change of place it is the continuous
// object in the foreground (held in screen space while the background changes behind it).
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {clamp, ss, ss5, lerp, keyS, easeIn, easeOut, hash, W, H, DUR} from './lib';
import {Cam, camT, lerpCam, toScreen} from './cam';
import {Face, NEUTRAL, NO_POCKET, EL, ES, POCKET_AT, Expr, Pocket} from './face';
import {Profile, Rays, EYE0, EyeState, JawState, FOVEA, CANINE_AT, CANINE_ROT, CUT_U, BLOCK_SCENE} from './profile';
import {Implant, Rot, projectPt, alongPoly, HOLE, Z_F, CYL_Z0, CYL_Z1, OFFCUT, CROWN_PIECE, V3} from './implant';
import {Saw, Drill, Forceps, Elevator, Drape, Room, View} from './props';
import {Captions} from './Captions';
import {TM} from './story';

const rotL = (a: Rot, b: Rot, u: number): Rot => ({yaw: lerp(a.yaw, b.yaw, u), pitch: lerp(a.pitch, b.pitch, u), roll: lerp(a.roll, b.roll, u)});
const R0: Rot = {yaw: 0, pitch: 0, roll: 0};
const along = (p: [number, number][], u: number): [number, number] => {
  // along an open polyline
  const L: number[] = [0];
  for (let i = 1; i < p.length; i++) L.push(L[i - 1] + Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]));
  const tg = clamp(u) * L[L.length - 1];
  for (let i = 1; i < p.length; i++) if (tg <= L[i]) {const k = (tg - L[i - 1]) / (L[i] - L[i - 1] || 1); return [lerp(p[i - 1][0], p[i][0], k), lerp(p[i - 1][1], p[i][1], k)];}
  return p[p.length - 1];
};
const logKey = (t: number, keys: [number, number][]) => Math.exp(keyS(t, keys.map(([a, b]) => [a, Math.log(b)] as [number, number])));

// ================= FRONT =================
const FACE_CAM: Cam = {x: 0, y: 20, z: 5.5};
const MACRO_A: Cam = {x: EL[0] + 0.5, y: 0.7, z: 37};
// one approach curve runs from the reaction framing into the macro across the loop seam: the film's end is its
// first part, the opening frames are its tail, so the camera moves continuously from the last frame into the first
const APP_T0 = 27.95, APP_LEN = DUR - APP_T0 + 0.5;
const REACT_CAM: Cam = {x: 0, y: 14, z: 6.0};
const approach = (tau: number) => lerpCam(REACT_CAM, MACRO_A, ss5(tau / APP_LEN, 0, 1));
const APP_SEAM = DUR - APP_T0;

const hookCam = (t: number): Cam => {
  if (t < 0.5) return approach(APP_SEAM + t);
  const a = approach(APP_SEAM + 0.5);
  const orbit: Cam = {x: EL[0] + 1.6, y: 1.2, z: 31, rot: -2.5};
  let c = lerpCam(a, orbit, ss5(t, 0.5, 1.45));
  c = lerpCam(c, FACE_CAM, ss5(t, 1.2, 2.2));
  return c;
};
const implYaw = (t: number) => keyS(t, [[0.5, 0], [1.4, 14], [2.15, 0]]);
const implPitch = (t: number) => keyS(t, [[0.5, 0], [1.4, -5], [2.15, 0]]);
const implPar = (t: number) => keyS(t, [[0.5, 0], [1.4, 0.8], [2.15, 0]]);

const pocketCam = (t: number): Cam => {
  const k: [number, Cam][] = [
    [14.45, {x: 36, y: 19, z: 23}], [15.95, {x: 36.5, y: 23, z: 25}], [16.85, {x: 3, y: 10, z: 8.6}], [17.65, {x: 5, y: 11, z: 9.2}], [19.3, {x: 34, y: 25, z: 26}],
  ];
  if (t <= k[0][0]) return k[0][1];
  for (let i = 1; i < k.length; i++) if (t <= k[i][0]) return lerpCam(k[i - 1][1], k[i][1], ss5(t, k[i - 1][0], k[i][0]));
  // follow the implant out of the pocket and across the face, then settle on the damaged eye
  const p = t < 19.95 ? {x: POCKET_IMPL[0], y: lerp(POCKET_IMPL[1], POCKET_IMPL[1] - ARRIVE, ss5(t, 19.62, 19.95))} : carry(t);
  const follow: Cam = {x: p.x - 3, y: p.y + 3, z: 24};
  const c = lerpCam(k[k.length - 1][1], follow, ss5(t, 19.3, 19.75));
  return lerpCam(c, FRONT_IN, ss5(t, 20.3, 20.72));
};
// the implant's path from the pocket to the damaged eye (face mm), and its turn to edge-on
const POCKET_IMPL: [number, number] = [POCKET_AT[0] + 2.6, POCKET_AT[1] + 0.2];
const ARRIVE = 6;
const HOVER: [number, number] = [-17, -1];
const FRONT_IN: Cam = {x: EL[0] + 5.1, y: 0, z: 40};
const carry = (t: number) => {
  const u = ss5(t, 19.95, 20.7);
  const x = lerp(POCKET_IMPL[0], HOVER[0], u), y = lerp(POCKET_IMPL[1] - ARRIVE, HOVER[1], u) - Math.sin(u * Math.PI) * 8;
  return {x, y, rot: {yaw: 90 * ss5(t, 20.3, 20.72), pitch: 0, roll: 0} as Rot};
};
const frontState = (t: number) => {
  let cam: Cam, reveal = 1, implRot = R0, parallax = 0, expr: Expr = NEUTRAL, pocket: Pocket = NO_POCKET, pimpl: {x: number; y: number; rot: Rot} | null = null, light = 1;
  let left: 'ookp' | 'mucosa' = 'ookp';
  if (t < 3) {
    cam = t < 2.2 ? hookCam(t) : lerpCam(FACE_CAM, {x: EL[0] + implPar(t) * ES, y: 0, z: 430}, easeIn(clamp((t - 2.2) / 0.62)) );
    reveal = t < 0.45 ? lerp(0.5, 1, easeOut(t / 0.45)) : 1;
    implRot = {yaw: implYaw(t), pitch: implPitch(t), roll: 0};
    parallax = implPar(t);
  } else if (t < 21.5) {
    cam = pocketCam(t);
    left = 'mucosa';
    const tissue = ss(t, 17.95, 19.2);
    const lift = t < 15.3 ? 1 : t < 19.6 ? 1 - ss(t, 15.3, 15.75) : ss(t, 19.62, 19.95);
    const see = t < 16.1 ? 1 : t < 17.7 ? lerp(1, 0.3, ss(t, 16.1, 16.7)) : t < 19.6 ? lerp(0.3, 1, ss(t, 17.7, 18.15)) : 1;
    const heal = t < 16.95 ? 0 : t < 19.45 ? ss(t, 16.95, 17.65) : 0.5;
    const incision = t < 19.45 ? ss(t, 14.92, 15.15) : 1;
    pocket = {show: 1, see, incision, sutured: t < 19.45 ? ss(t, 15.95, 16.3) : 0, heal, tissue, vessels: ss(t, 18.1, 19.3), lift};
    light = t > 16.92 && t < 17.7 ? 1 - 0.13 * Math.sin(Math.PI * ss(t, 16.92, 17.7) * 3) ** 2 : 1;
    if (t < 19.95) {
      const yIn = t < 15.3 ? POCKET_IMPL[1] - ARRIVE : lerp(POCKET_IMPL[1] - ARRIVE, POCKET_IMPL[1], ss5(t, 15.3, 15.85));
      const yOut = t >= 19.62 ? lerp(POCKET_IMPL[1], POCKET_IMPL[1] - ARRIVE, ss5(t, 19.62, 19.95)) : yIn;
      pimpl = {x: POCKET_IMPL[0], y: t >= 19.62 ? yOut : yIn, rot: R0};
    } else pimpl = carry(t);
  } else {
    // the reaction, then the approach into the macro that closes the loop
    cam = t < APP_T0 ? {x: REACT_CAM.x + 0.6 * Math.sin((t - 27.45) * 2), y: REACT_CAM.y, z: REACT_CAM.z * (1 + 0.03 * ss(t, 27.45, 27.95)), rot: -2.2 * ss(t, 27.45, 27.85)} : approach(t - APP_T0);
    expr = {
      brow: keyS(t, [[27.45, 0.3], [27.7, 1.35], [28.25, 1.1], [28.75, 0]]),
      smile: keyS(t, [[27.45, 0.15], [27.8, 0.95], [28.4, 0.75], [28.8, 0]]),
      open: keyS(t, [[27.5, 0], [27.75, 0.55], [28.15, 0.3], [28.6, 0]]),
      squint: 0,
    };
    reveal = keyS(t, [[DUR - 0.4, 0], [DUR, 0.5]]);
  }
  return {cam, reveal, implRot, parallax, expr, pocket, pimpl, light, left};
};

// ================= SECTION =================
const SECT_IN: Cam = {x: 6, y: 0, z: 34};
const sectCam = (t: number): Cam => {
  if (t < 4.6) return t < 3.85 ? lerpCam({x: 17.0, y: 0, z: 430}, {x: 3.5, y: 0, z: 32}, ss5(t, 2.76, 3.85)) : lerpCam({x: 3.5, y: 0, z: 32}, {x: 3.5, y: 0, z: 30}, ss(t, 3.85, 4.6));
  if (t < 8.25) return lerpCam({x: 3.5, y: 0, z: 30}, {x: 9, y: 0, z: 56}, ss5(t, 4.75, 6.3));
  if (t < 10.45) {
    const z = logKey(t, [[8.25, 56], [8.8, 13], [9.3, 26], [10.45, 28]]);
    return {x: keyS(t, [[8.25, 9], [9.3, 22], [10.45, 23]]), y: keyS(t, [[8.25, 0], [9.3, 45], [10.45, 46.5]]), z};
  }
  if (t < 12) {
    // follow the block out toward the camera
    const c0: Cam = {x: 23, y: 46.5, z: 28};
    return lerpCam(c0, {x: 34, y: 60, z: 60}, easeIn(ss(t, 10.45, 11.05)));
  }
  // implantation and the dive to the retina
  if (t < 22.45) return lerpCam(lerpCam(SECT_IN, {x: 9.5, y: 0, z: 44}, ss5(t, 20.85, 21.2)), {x: 9.8, y: 0, z: 46}, ss(t, 21.2, 22.45));
  if (t < 23.4) return lerpCam({x: 9.8, y: 0, z: 46}, {x: 4, y: 0, z: 29}, ss5(t, 22.45, 23.15));
  return lerpCam({x: 4, y: 0, z: 29}, {x: FOVEA[0] + 0.3, y: FOVEA[1], z: 560}, ss5(t, 23.45, 24.75));
};
const sectState = (t: number): {eye: EyeState; jaw: JawState; extra: {st: EyeState; op: number}[]} => {
  let eye: EyeState = {...EYE0};
  const extra: {st: EyeState; op: number}[] = [];
  let jaw: JawState = {open: 0, cut: 0, out: 0, hideCanine: false};
  if (t < 4.55) {
    const rt = t < 2.86 ? lerp(0.3, 0.44, clamp((t - 2.6) / 0.26)) : lerp(0.44, 1, clamp((t - 2.86) / 0.64));
    eye = {...EYE0, rays: 'clear', rayT: rt, glow: ss(t, 3.42, 3.8)};
  } else if (t < 15) {
    const u = (a: number, b: number) => ss(t, a, b);
    eye = {
      ...EYE0,
      implantDx: 32 * easeIn(u(4.55, 5.0)), implant: 1 - u(4.95, 5.05), flap: u(4.55, 4.8), mucosa: 1 - u(4.72, 4.98), seat: 1, tissue: 1,
      trephine: 1 - u(4.78, 5.08), irisLens: u(4.8, 5.12), scar: u(4.85, 5.25), lidFwd: 1 - u(4.58, 5.0), glow: 1 - u(4.55, 4.78),
      donor: ss5(t, 6.55, 7.15), donorCloud: u(7.6, 8.1), haze: 0.5 * u(5.8, 6.3) * (1 - u(7.0, 7.3)) + 0.5 * u(7.8, 8.15), rays: 'none',
    };
    const scatter = {...eye, rays: 'scatter' as const, rayT: u(5.35, 6.3)};
    extra.push({st: scatter, op: 1 - u(6.6, 6.85)});
    extra.push({st: {...eye, rays: 'donor', rayT: u(7.0, 7.42)}, op: 1 - u(7.65, 7.95)});
    extra.push({st: {...eye, rays: 'scatter', rayT: 0.55 + 0.45 * u(7.7, 8.1)}, op: u(7.7, 7.9)});
    eye.glow = Math.max(eye.glow, 0.55 * u(7.32, 7.5) * (1 - u(7.62, 7.9)));
    jaw = {open: u(8.5, 8.9), cut: clamp((t - 9.15) / 0.8), out: t >= 10.45 ? 1 : 0, hideCanine: t >= 9.95};
  } else {
    const u = (a: number, b: number) => ss(t, a, b);
    eye = {
      ...EYE0, scar: 1, irisLens: 1 - u(21.3, 21.65), mucosa: 1, flap: u(20.98, 21.3) - u(22.0, 22.38), seat: u(21.95, 22.35), trephine: u(21.25, 21.6),
      implant: u(20.8, 20.9), implantDx: 4 * (1 - ss5(t, 21.55, 21.98)), tissue: 1, lidFwd: u(22.05, 22.5),
      rays: 'clear', rayT: u(22.62, 23.5), glow: u(23.4, 23.9), haze: 0,
    };
  }
  return {eye, jaw, extra};
};

// ================= the implant in screen space during the hand-offs =================
const BENCH_AT = {x: 540, y: 930, s: 40};
const BENCH_ROT: Rot = {yaw: 0, pitch: -48, roll: 0};
const benchRot = (t: number): Rot => {
  let r = BENCH_ROT;
  r = rotL(r, {yaw: 30, pitch: -28, roll: 4}, ss5(t, 12.35, 12.8));
  r = rotL(r, {yaw: -38, pitch: -14, roll: -3}, ss5(t, 13.95, 14.5));
  return r;
};
const cylDz = (t: number) => (t < 12.8 ? 16 : t < 13.9 ? 16 * (1 - ss5(t, 12.8, 13.9)) : 0);

// ================= captions placement per shot (screen y) is in Captions.tsx =================

export const Scene: React.FC<{t: number; fkey: string; captions: boolean}> = ({t, fkey, captions}) => {
  const layers: React.ReactNode[] = [];
  const k = fkey;
  // ---- FRONT ----
  const frontOn = t < 2.86 || (t >= 14.45 && t < 20.92) || t >= 27.45;
  const fs = frontState(t);
  const frontOp = t >= 14.45 && t < 15.3 ? ss(t, 14.6, 14.95) : t >= 20.7 ? (t < 27 ? 1 - ss(t, 20.72, 20.9) : 1) : 1;
  if (frontOn) {
    const c = fs.cam;
    const px = 1 / c.z;
    layers.push(
      <g key="front" opacity={frontOp}>
        <Room id={`${k}rm`} dx={-(c.x - FACE_CAM.x) * 1.2} dy={-(c.y - FACE_CAM.y) * 0.6} light={fs.light} />
        <g transform={camT(c)}>
          <Face id={`${k}fc`} px={px} left={fs.left} reveal={fs.reveal} implRot={fs.implRot} parallax={fs.parallax} expr={fs.expr} pocket={fs.pocket} pocketImplant={t >= 15.3 && t < 20.7 ? fs.pimpl : null} light={fs.light} />
          {/* forceps: they set the implant in the pocket, then take it out and carry it to the damaged eye */}
          {t >= 15.3 && t < 16.1 && fs.pimpl && (() => {
            const cyl = projectPt(fs.pimpl.x, fs.pimpl.y, ES, R0, [HOLE[0], HOLE[1], CYL_Z1 - 0.6]);
            const back = ss(t, 15.85, 16.1);
            return <Forceps id={`${k}fp`} x={cyl[0] + back * 30} y={cyl[1] - back * 30} ang={-40} px={px} open={ss(t, 15.8, 15.9)} gap={2.2} />;
          })()}
          {t >= 19.38 && t < 20.7 && fs.pimpl && (() => {
            const p = fs.pimpl;
            const cyl = projectPt(p.x, p.y, ES, p.rot, [HOLE[0], HOLE[1], CYL_Z1 - 0.6]);
            const come = 1 - ss(t, 19.38, 19.62);
            return <Forceps id={`${k}fq`} x={cyl[0] + come * 40} y={cyl[1] - come * 40} ang={-40} px={px} open={1 - ss(t, 19.55, 19.64)} gap={2.2} />;
          })()}
        </g>
        {/* the light at the far end of the cylinder as the camera enters it */}
        {t > 2.45 && t < 2.86 && <circle cx={W / 2} cy={H / 2} r={30 + 260 * ss(t, 2.5, 2.86)} fill="#FFE7A8" opacity={0.55 * ss(t, 2.5, 2.8)} style={{filter: 'blur(40px)'}} />}
      </g>,
    );
  }
  // ---- SECTION ----
  const sectOn = (t >= 2.7 && t < 11.1) || (t >= 20.7 && t < 24.9);
  if (sectOn) {
    const c = sectCam(t);
    const st = sectState(t);
    const px = 1 / c.z;
    const op = t < 2.86 ? ss(t, 2.7, 2.84) : t >= 20.7 && t < 21.05 ? ss(t, 20.7, 20.88) : t >= 10.7 && t < 11.1 ? 1 - ss(t, 10.75, 11.05) : 1;
    const dark = 0.9 * clamp(Math.log(c.z / 75) / Math.log(200 / 75)) * (t < 5 ? 1 : 0);
    const blockInJaw = t >= 9.95 && t < 10.45;
    layers.push(
      <g key="sect" opacity={op}>
        <rect x={0} y={0} width={W} height={H} fill="#22303B" />
        <g transform={camT(c)}>
          <Profile eye={st.eye} jaw={st.jaw} px={px} id={`${k}pf`} eyeWin={1} extraRays={st.extra} noRays={dark > 0} />
          {blockInJaw && <Implant id={`${k}bj`} x={CANINE_AT[0]} y={CANINE_AT[1] - 1.2 * ss(t, 10.22, 10.45)} s={1} rot={CANINE_ROT} px={px} piece="block" hole={0} cyl={0} />}
          {/* the saw round the root */}
          {t > 8.95 && t < 10.2 && (() => {
            const cu = clamp((t - 9.15) / 0.8);
            const tip = BLOCK_SCENE(along(CUT_U, cu));
            const inn = ss(t, 8.95, 9.15) * (1 - ss(t, 9.95, 10.2));
            return <Saw id={`${k}sw`} x={tip[0] + (1 - inn) * 45} y={tip[1] + (1 - inn) * 40} ang={38} px={px} buzz={t > 9.12 && t < 9.97 ? 1 : 0} t={t} />;
          })()}
          {t > 9.98 && t < 10.75 && (() => {
            const inn = ss(t, 9.98, 10.2) * (1 - ss(t, 10.48, 10.75));
            const push = ss(t, 10.22, 10.45);
            return <Elevator id={`${k}el`} x={19.2 + (1 - inn) * 40} y={49.6 - push * 1.4 + (1 - inn) * 30} ang={36} px={px} />;
          })()}
        </g>
        {dark > 0 && <rect x={0} y={0} width={W} height={H} fill="#0B1118" opacity={dark} />}
        {dark > 0 && <g transform={camT(c)}><Rays st={st.eye} px={px} id={`${k}dr`} /></g>}
        {/* inside the dive the retina's light fills the frame, then darkens: his view begins */}
        {t > 23.9 && <rect x={0} y={0} width={W} height={H} fill="#FFD27A" opacity={0.28 * ss(t, 24.1, 24.45) * (1 - ss(t, 24.5, 24.8))} />}
        {t > 24.45 && <rect x={0} y={0} width={W} height={H} fill="#07090C" opacity={ss(t, 24.5, 24.82)} />}
      </g>,
    );
  }
  // ---- BENCH ----
  const benchOn = t >= 10.7 && t < 15.0;
  if (benchOn) {
    const op = t < 11.05 ? ss(t, 10.75, 11.05) : t >= 14.6 ? 1 - ss(t, 14.6, 14.95) : 1;
    layers.push(<g key="bench" opacity={op}><Drape id={`${k}dr`} shift={(t - 11) * 30} /></g>);
  }
  // ---- the implant in screen space: jaw -> bench -> pocket, and pocket -> section ----
  if (t >= 10.45 && t < 15.3) {
    let x = BENCH_AT.x, y = BENCH_AT.y, s = BENCH_AT.s, rot = benchRot(t);
    if (t < 11.0) {
      const c = sectCam(10.45);
      const [sx, sy] = toScreen(c, CANINE_AT[0], CANINE_AT[1] - 1.2);
      const u = ss5(t, 10.45, 11.0);
      x = lerp(sx, BENCH_AT.x, u) - Math.sin(u * Math.PI) * 120; y = lerp(sy, BENCH_AT.y, u) + Math.sin(u * Math.PI) * 60;
      s = Math.exp(lerp(Math.log(c.z), Math.log(BENCH_AT.s), u));
      rot = rotL(CANINE_ROT, BENCH_ROT, u);
    } else if (t >= 14.45) {
      const c = pocketCam(15.3);
      const [tx, ty] = toScreen(c, POCKET_IMPL[0], POCKET_IMPL[1] - ARRIVE);
      const u = ss5(t, 14.45, 15.3);
      x = lerp(BENCH_AT.x, tx, u); y = lerp(BENCH_AT.y, ty, u) - Math.sin(u * Math.PI) * 140;
      s = Math.exp(lerp(Math.log(BENCH_AT.s), Math.log(c.z * ES), u));
      rot = rotL(benchRot(14.45), R0, u);
    }
    const trimmed = t >= 11.5;
    const off = easeIn(ss(t, 11.5, 11.9));
    const hole = t < 11.8 ? 0 : ss(t, 11.8, 12.3);
    const px = 1;
    const cylOn = t >= 12.7 ? 1 : 0;
    const dz = cylDz(t);
    layers.push(
      <g key="impl">
        {/* a soft contact shadow on the drape */}
        {t >= 10.9 && t < 14.6 && <ellipse cx={x + 30} cy={y + 150} rx={330} ry={90} fill="#0E2E33" opacity={0.35 * ss(t, 10.9, 11.1) * (1 - ss(t, 14.4, 14.6))} style={{filter: 'blur(26px)'}} />}
        {!trimmed && <Implant id={`${k}b`} x={x} y={y} s={s} rot={rot} px={px} piece="block" hole={0} cyl={0} />}
        {trimmed && (
          <>
            {off < 1 && <Implant id={`${k}oc`} x={x} y={y} s={s} rot={rot} px={px} outline={OFFCUT} crown={false} hole={0} cyl={0} offset={[-8 * off, -30 * off, 0]} />}
            {off < 1 && <Implant id={`${k}cp`} x={x} y={y} s={s} rot={rot} px={px} outline={CROWN_PIECE} crown={true} hole={0} cyl={0} offset={[38 * off, -4 * off, 0]} />}
            <Implant id={`${k}l`} x={x} y={y} s={s} rot={rot} px={px} piece="lamina" hole={hole} cyl={cylOn} cylDz={dz} cylMode="clear" holeBg="#2C6870" />
          </>
        )}
        {/* the trimming saw: down the neck, then along under the root, then up the far end */}
        {t > 10.9 && t < 11.7 && (() => {
          const u = clamp((t - 11.02) / 0.46);
          const pth: [number, number][] = [[16.8, 7.2], [16.8, -3.5], [2.4, -1.5], [1.5, 0], [1.5, 6.0]];
          const p = along(pth, u);
          const tip = projectPt(x, y, s, rot, [p[0], p[1], Z_F]);
          const inn = ss(t, 10.9, 11.02) * (1 - ss(t, 11.48, 11.7));
          return <g transform={`translate(${tip[0] + (1 - inn) * 500},${tip[1] - (1 - inn) * 600}) scale(${s})`}><Saw id={`${k}s2`} x={0} y={0} ang={-55} px={1 / s} buzz={u > 0 && u < 1 ? 1 : 0} t={t} /></g>;
        })()}
        {/* the drill, square to the face, through the dentin */}
        {t > 11.55 && t < 12.6 && (() => {
          const tip = projectPt(x, y, s, rot, [HOLE[0], HOLE[1], Z_F]);
          const up = projectPt(x, y, s, rot, [HOLE[0], HOLE[1], Z_F + 10]);
          const ang = (Math.atan2(up[1] - tip[1], up[0] - tip[0]) * 180) / Math.PI;
          const inn = ss(t, 11.55, 11.8) * (1 - ss(t, 12.3, 12.55));
          const dx = Math.cos((ang * Math.PI) / 180), dy = Math.sin((ang * Math.PI) / 180);
          const off2 = (1 - inn) * 900;
          const jit = t > 11.8 && t < 12.3 ? Math.sin(t * 190) * 1.2 : 0;
          return (
            <g>
              {t > 11.8 && t < 12.32 && Array.from({length: 14}, (_, i) => {
                const ph = ((t * 3 + hash(i)) % 0.35) / 0.35;
                const a = hash(i * 3.3) * Math.PI * 2;
                return <circle key={i} cx={tip[0] + Math.cos(a) * ph * 120} cy={tip[1] + Math.sin(a) * ph * 60 - ph * 40} r={3 + 3 * hash(i)} fill="#F3E6C8" opacity={0.85 * (1 - ph)} />;
              })}
              <g transform={`translate(${tip[0] + dx * off2 + jit},${tip[1] + dy * off2}) scale(${s})`}><Drill id={`${k}dl`} x={0} y={0} ang={ang} px={1 / s} spin={t > 11.75 && t < 12.35 ? 1 : 0} t={t} /></g>
            </g>
          );
        })()}
        {/* forceps: bring the cylinder in along its axis, then carry the finished implant */}
        {t > 12.55 && t < 15.3 && (() => {
          const zc = t < 13.95 ? (CYL_Z0 + CYL_Z1) / 2 + dz + 1.5 : CYL_Z1 - 0.6;
          const g = projectPt(x, y, s, rot, [HOLE[0], HOLE[1], zc]);
          const inn = ss(t, 12.55, 12.8);
          return <g transform={`translate(${g[0] + (1 - inn) * 500},${g[1] - (1 - inn) * 500}) scale(${s})`}><Forceps id={`${k}f2`} x={0} y={0} ang={-42} px={1 / s} open={0} gap={1.95} /></g>;
        })()}
      </g>,
    );
  }
  if (t >= 20.7 && t < 20.95) {
    // pocket -> section: the edge-on implant stays in the foreground while the profile section appears behind it
    const c = pocketCam(20.7);
    const p = carry(20.7);
    const [sx, sy] = toScreen(c, p.x, p.y);
    const cs = sectCam(20.9);
    const [tx, ty] = toScreen(cs, 14.9 + 4, 0);
    const u = ss5(t, 20.7, 20.9);
    layers.push(
      <g key="impl2" opacity={1 - ss(t, 20.84, 20.93)}>
        <Implant id={`${k}i2`} x={lerp(sx, tx, u)} y={lerp(sy, ty, u)} s={Math.exp(lerp(Math.log(c.z * ES), Math.log(cs.z), u))} rot={{yaw: 90, pitch: 0, roll: 0}} px={1} tissue={1} vessels={1} cylMode="clear" />
      </g>,
    );
  }
  // ---- VIEW ----
  if (t >= 24.7 && t < 27.6) {
    const bright = keyS(t, [[24.75, 0.06], [25.6, 0.22], [26.3, 0.45], [26.95, 1]]);
    const clear = keyS(t, [[24.75, 0], [26.0, 0.12], [26.7, 0.6], [27.2, 1]]);
    const op = t < 24.85 ? ss(t, 24.7, 24.85) : t >= 27.45 ? 1 - ss(t, 27.45, 27.5) : 1;
    layers.push(<g key="view" opacity={op}><View id={`${k}vw`} clear={clear} bright={bright} t={t} /></g>);
  }
  return (
    <AbsoluteFill>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>{layers}</svg>
      {captions && <Captions t={t} />}
    </AbsoluteFill>
  );
};
