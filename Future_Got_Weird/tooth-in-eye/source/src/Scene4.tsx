// V4 (a correction pass on V3): the implant now sits as it really does. Frame zero is his reconstructed eye front-on
// (a recognisable eye: the pink graft over it, the plate a gentle rise beneath it, only the small cylinder's end
// showing); a local cut-away of the graft shows the tooth-and-bone plate holding the cylinder; the camera turns to
// the side for the section, where the plate lies flat on the front of the eye under the graft and the light goes
// through the cylinder to the retina. The pocket is under closed skin (seen through, no opening). His reaction is
// front-on, and the push into his reconstructed eye closes the loop on frame zero. 8-14 s (tooth, drill, cylinder)
// is V3/V2 unchanged.
// V3 (from V2): a new hook (0-4.36 s): his finished eye from outside -> push to the implant -> the cut-away and the
// light to the retina -> back to him -> a glimpse of his restored sight. A single push for the cornea demonstration,
// a stronger focus pull in his view, and a loop straight into frame zero. Everything else is V2.
// V2: the whole film as a function of time, keyed to the V2 narration timing (pauses shortened, speech untouched).
// One patient (face2.tsx / profile2.tsx: the same man), one implant renderer, and a magnification path:
//   person -> eye -> implant (hook, in section) -> his damaged eye (penlight, failed graft) -> his mouth -> the tooth
//   -> the bench (plate, hole, lens) -> under the skin of the other eye (tissue grows) -> the front of the damaged eye
//   -> the light to the retina -> what he sees -> him -> back into the eye (loop).
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {clamp, ss, ss5, lerp, keyS, easeIn, easeOut, hash, W, H, DUR} from './lib';
import {Cam, camT, lerpCam, toScreen} from './cam';
import {Face2, FaceState2, LOOK0, NO_POCKET2, EL, ES, CAN_AT, CAN_ROT, POCKET2, INCISION_AT, cutPoint, MouthState, FRONT_ROT, EYE_HOLE} from './face2';
import {Profile2, Rays2, Sect2, IMPL_AT, IMPL_ROT, FOVEA, CYL_FRONT_X, CYL_BACK_X, Expr2, NEUTRAL2} from './profile2';
import {EYE0, EyeState} from './profile';
import {Implant, Rot, projectPt, HOLE, Z_F, Z_B, CYL_Z0, CYL_Z1, OFFCUT, CROWN_PIECE, LAMINA, HOLE_R} from './implant';
import {Saw, Drill, Forceps, Elevator, Drape, Room} from './props';
import {Penlight, View2} from './props2';
import {Captions4} from './Captions4';

const rotL = (a: Rot, b: Rot, u: number): Rot => ({yaw: lerp(a.yaw, b.yaw, u), pitch: lerp(a.pitch, b.pitch, u), roll: lerp(a.roll, b.roll, u), spin: lerp(a.spin ?? 0, b.spin ?? 0, u)});
const R0: Rot = {yaw: 0, pitch: 0, roll: 0, spin: 0};
const keyCam = (t: number, k: [number, Cam][]) => {
  if (t <= k[0][0]) return k[0][1];
  for (let i = 1; i < k.length; i++) if (t <= k[i][0]) return lerpCam(k[i - 1][1], k[i][1], ss5(t, k[i - 1][0], k[i][0]));
  return k[k.length - 1][1];
};
const TISSUE_END = 0.25;
const HOOK_POV = 3.34;      // "SEE": a glimpse of his restored sight   // how much of the grown tissue sheath is drawn over the plate after the pocket (the tooth stays legible)

// ================= the loop: one camera curve from his reaction (front) into his reconstructed eye, across the seam
// it starts at the cut to his face, passes frame zero (his eye, close) and ends on the cylinder and plate. A monotone
// cubic through the three key framings in (x, y, log z), so the push never stops or overshoots at the seam.
const EYE_C: [number, number] = [EL[0] + EYE_HOLE[0] * ES, EL[1] + EYE_HOLE[1] * ES];   // the cylinder, in face mm
const REACT_F: Cam = {x: -3, y: 18, z: 6.9};
const F0: Cam = {x: EYE_C[0] + 2.5, y: 2.5, z: 19};
const PUSH_F: Cam = {x: EYE_C[0], y: EYE_C[1] - 0.6, z: 36};
const APP_T0 = 25.09, APP_SEAM = DUR - APP_T0, APP_END = 1.4;
const approach = (tau: number): Cam => {
  const A = APP_SEAM, B = APP_SEAM + APP_END;
  const P = [REACT_F, F0, PUSH_F].map((c) => [c.x, c.y, Math.log(c.z)]);
  const m = P[0].map((_, k) => {const d1 = (P[1][k] - P[0][k]) / A, d2 = (P[2][k] - P[1][k]) / (B - A); return d1 * d2 > 0 ? (2 * d1 * d2) / (d1 + d2) : 0;});
  const h = (p0: number, p1: number, m0: number, m1: number, len: number, u: number) => {const u2 = u * u, u3 = u2 * u; return (2 * u3 - 3 * u2 + 1) * p0 + (u3 - 2 * u2 + u) * len * m0 + (-2 * u3 + 3 * u2) * p1 + (u3 - u2) * len * m1;};
  const tt = clamp(tau, 0, B);
  const v = tt <= A ? P[0].map((_, k) => h(P[0][k], P[1][k], 0, m[k], A, tt / A)) : P[0].map((_, k) => h(P[1][k], P[2][k], m[k], 0, B - A, (tt - A) / (B - A)));
  return {x: v[0], y: v[1], z: Math.exp(v[2])};
};
const HOOK_TURN = 1.5;                    // a quick dissolve from his eye to the side section, matched on the plate
const SECT_START: Cam = {x: IMPL_AT[0], y: 0, z: PUSH_F.z * ES};
const SECT_HOOK: Cam = {x: 3, y: 0, z: 28};
const BACK_TO_HIM: Cam = {x: -5, y: 9, z: 10.5};
const SMILE0 = 0.35;     // he is quietly smiling when the hook returns to him
const END_SMILE = 0.45, END_BROW = 0.25;  // where his reaction settles at the loop's end (and so in frame zero)

// ================= SECTION (profile) =================
const sectCam = (t: number): Cam => {
  if (t < 4.5) {
    let c = lerpCam(SECT_START, SECT_HOOK, ss5(t, 1.62, 2.55));                   // out along the light to the whole eye
    c = lerpCam(c, BACK_TO_HIM, ss5(t, 2.6, 3.3));                               // back out to him
    return lerpCam(c, {x: -4, y: 8, z: 11.5}, ss(t, 3.0, 3.45));
  }
  // implantation, then the camera rides the light to the retina and into it
  const seat: Cam = {x: 12.5, y: 0, z: 44};
  if (t < 21.2) return lerpCam({x: 17, y: 0, z: 40}, seat, ss5(t, 19.75, 20.3));
  // follow the light front through the cylinder and the vitreous to the retina
  const T = clamp((t - 21.15) / (22.35 - 21.15)) * 0.9;
  const frontX = 48 - T * 1.12 * (48 - FOVEA[0]);
  const follow: Cam = {x: Math.max(FOVEA[0] + 2.2, Math.min(seat.x, frontX - 3)), y: FOVEA[1] * clamp((seat.x - frontX) / 20), z: lerp(44, 52, clamp((seat.x - frontX) / 22))};
  const ride = lerpCam(seat, follow, ss(t, 21.15, 21.6));
  return lerpCam(ride, {x: FOVEA[0] + 0.3, y: FOVEA[1], z: 600}, ss5(t, 22.3, 23.05));
};
const sectState = (t: number): {s: Sect2; expr: Expr2; win: number; tear: number; winOp?: number; film?: number} => {
  const u = (a: number, b: number) => ss(t, a, b);
  if (t < 19) {
    // hook, side section: the finished eye; light goes in through the cylinder and reaches the retina on "EYE", then
    // the cut-away closes on his face
    const T = clamp((t - 1.55) / 0.8) * 0.9 + (t > 2.35 ? clamp((t - 2.35) / 0.4) * 0.1 : 0);
    const win = t < 2.6 ? 1 : 1 - ss5(t, 2.6, 3.15);
    const winOp = t < 2.6 ? 1 : 1 - ss(t, 2.95, 3.15);
    return {s: {st: {...EYE0, scar: 1, glow: ss(t, 2.25, 2.55) * (1 - 0.4 * ss(t, 2.9, 3.3))}, implDx: 0, implOn: 1, tissue: TISSUE_END, vessels: 1, rays: t > 1.55 ? 'clear' : 'none', rayT: T},
      expr: {smile: keyS(t, [[2.85, SMILE0], [3.3, 1]]), brow: keyS(t, [[2.85, 0], [3.25, 0.9]]), open: keyS(t, [[2.9, 0], [3.25, 0.5]])}, win, tear: 0, winOp};
  }
  if (t < 24) {
    const st: EyeState = {
      ...EYE0, scar: 1, irisLens: 1 - u(20.2, 20.45), mucosa: 1, flap: u(19.95, 20.2) - u(20.75, 21.0), seat: u(20.75, 21.0), trephine: u(20.12, 20.42),
      lidFwd: u(20.85, 21.15), glow: u(22.25, 22.6),
    };
    // the light front moves to reach the fovea on "retina"
    const T = clamp((t - 21.15) / (22.35 - 21.15)) * 0.9;
    return {s: {st, implDx: 7 * (1 - ss5(t, 20.35, 20.75)), implOn: 1, tissue: TISSUE_END, vessels: 1, rays: t > 21.1 ? 'clear' : 'none', rayT: T}, expr: NEUTRAL2, win: 1, tear: 0};
  }
  return {s: {st: {...EYE0, scar: 1}, implDx: 0, implOn: 1, tissue: TISSUE_END, vessels: 1, rays: 'none', rayT: 0}, expr: NEUTRAL2, win: 0, tear: 0};
};

// ================= FRONT =================
const frontCam = (t: number): Cam => {
  if (t >= APP_T0) return approach(t - APP_T0);                                 // his reaction, then the push into his eye
  if (t < 4.36) return t < APP_END ? approach(APP_SEAM + t) : {...PUSH_F, z: PUSH_F.z * (1 + 0.05 * (t - APP_END))};
  if (t < 8) return keyCam(t, [[4.4, {x: -12, y: 5, z: 9.2}], [6.25, {x: EL[0] + 1.5, y: 0.6, z: 26}], [7.7, {x: EL[0] + 1, y: 0.5, z: 27}]]);
  if (t < 13) return keyCam(t, [[7.72, {x: EL[0] + 1, y: 0.5, z: 27}], [8.45, {x: 15, y: 57, z: 16}], [9.65, {x: 16, y: 56, z: 18}]]);
  return keyCam(t, [
    [13.95, {x: 36, y: 21, z: 21}], [14.95, {x: 36, y: 24, z: 22}], [15.75, {x: 4, y: 12, z: 8.4}], [16.45, {x: 5, y: 13, z: 8.8}],
    [17.15, {x: 36, y: 27, z: 25}], [18.25, {x: 36, y: 27, z: 26}], [18.85, {x: 33, y: 20, z: 22}], [19.55, {x: EYE_C[0], y: EYE_C[1], z: 30}], [19.85, {x: EYE_C[0], y: EYE_C[1], z: 40}],
  ]);
};
const IMPL_POCKET: [number, number] = [POCKET2[0] + 1.6, POCKET2[1] + 0.4];
const ENTRY_Y = INCISION_AT - 6;      // the implant's centre while it waits above the incision
const POCKET_ROT: Rot = {yaw: 0, pitch: 0, roll: 0, spin: 0};
const carry = (t: number) => {
  // out of the pocket, across the face to the damaged eye; it arrives face-on over the eye's centre, the pose it will
  // sit in (a slight tilt on the way, so it reads as a solid)
  const u = ss5(t, 18.85, 19.6);
  const p0: [number, number] = [IMPL_POCKET[0], ENTRY_Y];
  const p1: [number, number] = [EYE_C[0], EYE_C[1]];
  const w = Math.sin(u * Math.PI);
  return {x: lerp(p0[0], p1[0], u), y: lerp(p0[1], p1[1], u) - w * 8, rot: {...FRONT_ROT, yaw: 16 * w, pitch: -10 * w}};
};
const frontState = (t: number): FaceState2 => {
  const u = (a: number, b: number) => ss(t, a, b);
  const f: FaceState2 = {left: {...LOOK0}, brow: 0, smile: 0, mouth: null, pocket: {...NO_POCKET2}, light: 1, bruise: 0};
  if (t < 4.36 || t >= APP_T0) {
    // his reconstructed eye; the local cut-away over the plate opens on "TOOTH". His reaction at the end (the smile,
    // the raised brows, a tear from his other eye) settles to where frame zero has it
    f.left = {...LOOK0, mucosa: 1, ookp: 1, cut: t < 4.36 ? 0.88 * ss5(t, 0.62, 1.2) : 0};
    if (t >= APP_T0) {
      f.smile = keyS(t, [[25.09, 0.15], [25.45, 1], [26.0, 0.9], [DUR, END_SMILE]]);
      f.brow = keyS(t, [[25.09, 0.1], [25.35, 1], [26.0, 0.8], [DUR, END_BROW]]);
      f.open = keyS(t, [[25.12, 0], [25.42, 0.75], [25.95, 0.45], [DUR - 0.1, 0]]);
      f.tear = ss(t, 25.4, 25.95);
    } else {f.smile = END_SMILE; f.brow = END_BROW;}
    return f;
  }
  if (t < 8.0) {
    const donor = ss5(t, 6.2, 6.7);
    f.left = {scar: 1, glare: u(4.7, 4.9) * (1 - u(7.75, 7.95)), donor, donorCloud: u(7.22, 7.72), mucosa: 0};
  } else if (t < 13) {
    f.mouth = {retract: u(7.95, 8.4), cut: u(8.3, 8.6), saw: clamp((t - 8.6) / 0.7), canine: t < 9.32 ? 'in' : t < 9.72 ? 'block' : 'gone'};
  } else {
    f.left = {...LOOK0, mucosa: 1};
    const inP = t >= 14.24;
    const lift = t >= 18.48;
    const y = !inP ? ENTRY_Y : !lift ? lerp(ENTRY_Y, IMPL_POCKET[1], ss5(t, 14.24, 14.75)) : lerp(IMPL_POCKET[1], ENTRY_Y, ss5(t, 18.5, 18.85));
    const tissue = TISSUE_END * u(17.1, 18.1);
    const impl = t < 18.85 ? {x: IMPL_POCKET[0], y, rot: POCKET_ROT, tissue, vessels: u(17.2, 18.2)} : null;
    f.pocket = {
      incision: t < 18.4 ? u(13.92, 14.15) : 1, sutured: t < 18.4 ? u(15.0, 15.3) : 0, heal: t < 18.4 ? u(15.9, 16.55) : 0.4,
      win: u(14.2, 14.4) * (1 - u(15.0, 15.3)) + u(16.85, 17.15) * (1 - u(18.85, 19.05)), bump: t < 18.5 ? u(14.7, 15.0) : 0,
      impl, above: !inP ? 1 : !lift ? 1 - u(14.24, 14.7) : u(18.5, 18.8),
    };
    f.bruise = t < 18.4 ? u(14.3, 14.8) * (1 - u(15.9, 16.55)) : 0;
    f.light = t > 15.85 && t < 16.6 ? 1 - 0.13 * Math.sin(Math.PI * ss(t, 15.85, 16.6) * 2) ** 2 : 1;
  }
  return f;
};

// ================= BENCH (screen space) =================
const BENCH = {x: 540, y: 930, s: 40};
const BENCH_ROT: Rot = {yaw: 0, pitch: -48, roll: 0, spin: 0};
const benchRot = (t: number): Rot => {
  let r = BENCH_ROT;
  r = rotL(r, {yaw: 28, pitch: -28, roll: 4, spin: 0}, ss5(t, 11.72, 12.1));
  r = rotL(r, {yaw: -36, pitch: -14, roll: -3, spin: 0}, ss5(t, 13.2, 13.62));
  return r;
};
const cylDz = (t: number) => (t < 12.05 ? 16 : t < 13.15 ? 16 * (1 - ss5(t, 12.05, 13.12)) : 0);
// the click: a small settle of the plate when the cylinder seats
const clickJolt = (t: number) => (t > 13.12 && t < 13.35 ? Math.sin((t - 13.12) * 60) * Math.exp(-(t - 13.12) / 0.06) * 3 : 0);

export const Scene4: React.FC<{t: number; fkey: string; captions: boolean}> = ({t, fkey, captions}) => {
  const k = fkey;
  const L: React.ReactNode[] = [];
  // ---------------- SECTION: hook (0 - 4.36), seating and the light (19.7 - 23.1), reaction and loop (25.09 - END)
  const sectOn = (t >= HOOK_TURN && t < HOOK_POV) || (t >= 19.7 && t < 23.15);
  if (sectOn) {
    const c = sectCam(t);
    const st = sectState(t);
    const px = 1 / c.z;
    const op = t < 4 ? ss(t, 1.5, 1.64) : t >= 19.7 && t < 20.0 ? ss(t, 19.7, 19.88) : 1;
    L.push(
      <g key="sect" opacity={op}>
        <rect x={0} y={0} width={W} height={H} fill="#22303B" />
        <g transform={camT(c)}>
          <Profile2 s={st.s} px={px} id={`${k}p`} win={st.win} expr={st.expr} tear={st.tear} ext={t < 4.5 ? 1 : 0} winOp={st.winOp ?? 1} />
          {st.win > 0.05 && <g opacity={clamp(st.win * 1.6 - 0.3) * (st.winOp ?? 1)}><Rays2 mode={st.s.rays} T={st.s.rayT} px={px} dx={st.s.implDx} part="outer" /></g>}
        </g>
        {/* inside the fovea: the retina's light fills the view, then his own view begins */}
        {t > 22.6 && t < 23.2 && <rect x={0} y={0} width={W} height={H} fill="#FFD27A" opacity={0.3 * ss(t, 22.6, 22.85) * (1 - ss(t, 22.9, 23.1))} />}
        {t > 22.8 && t < 23.2 && <rect x={0} y={0} width={W} height={H} fill="#07090C" opacity={ss(t, 22.85, 23.1)} />}
      </g>,
    );
  }
  // ---------------- FRONT: his reconstructed eye (hook, 0 - 1.7), penlight and graft (4.36 - 7.75), mouth and tooth
  // (7.7 - 10.3), pocket and carry (13.7 - 19.9), his reaction and the push into his eye (25.09 - END)
  const frontOn = t < 1.7 || (t >= 4.36 && t < 10.35) || (t >= 13.7 && t < 19.9) || t >= APP_T0;
  if (frontOn) {
    const c = frontCam(t);
    const f = frontState(t);
    const px = 1 / c.z;
    const op = t < 1.7 ? 1 - ss(t, 1.52, 1.66) : t >= 10.0 && t < 10.35 ? 1 - ss(t, 10.05, 10.32) : t >= 13.7 && t < 14.2 ? ss(t, 13.8, 14.1) : t >= 19.7 && t < 20 ? 1 - ss(t, 19.72, 19.88) : 1;
    // as he takes in the room he tips his head a little
    const tilt = t >= APP_T0 ? keyS(t, [[25.09, 0], [25.6, -2.6], [26.3, -1.2], [DUR, 0]]) : 0;
    L.push(
      <g key="front" opacity={op}>
        <Room id={`${k}rm`} dx={-(c.x) * 1.0} dy={-(c.y - 14) * 0.5} light={f.light} />
        <g transform={camT(c)}>
          <g transform={`rotate(${tilt} 0 120)`}><Face2 id={`${k}f`} px={px} f={f} /></g>
          {/* the penlight: in from the right, on, then away */}
          {t > 4.36 && t < 8.0 && (() => {
            const inn = ss(t, 4.36, 4.75) * (1 - ss(t, 7.72, 8.0));
            const tip: [number, number] = [EL[0] + 9 + (1 - inn) * 60, -7 - (1 - inn) * 30];
            return <Penlight id={`${k}pl`} x={tip[0]} y={tip[1]} ang={-28} px={px} on={ss(t, 4.7, 4.85) * (1 - ss(t, 7.72, 7.85))} beam={9} />;
          })()}
          {/* forceps lay the donor cornea, then let go */}
          {t > 5.9 && t < 7.05 && (() => {
            const d = ss5(t, 6.2, 6.7);
            const gx = EL[0] + 5.1 * ES + (1 - d) * 16 * ES, gy = -3.5 * ES - (1 - d) * 9 * ES;
            const inn = ss(t, 5.9, 6.2) * (1 - ss(t, 6.78, 7.05));
            return <Forceps id={`${k}fd`} x={gx + (1 - inn) * 30} y={gy - (1 - inn) * 30} ang={-38} px={px} open={ss(t, 6.7, 6.78)} gap={0.9} />;
          })()}
          {/* the saw round the root, then the elevator */}
          {t > 8.4 && t < 9.5 && (() => {
            const p = cutPoint(clamp((t - 8.6) / 0.7));
            const inn = ss(t, 8.4, 8.6) * (1 - ss(t, 9.3, 9.5));
            return <Saw id={`${k}sw`} x={p[0] + (1 - inn) * 40} y={p[1] - (1 - inn) * 40} ang={-38} px={px} buzz={t > 8.58 && t < 9.32 ? 1 : 0} t={t} />;
          })()}
          {t > 9.15 && t < 9.95 && (() => {
            const inn = ss(t, 9.15, 9.35) * (1 - ss(t, 9.7, 9.95));
            const push = ss(t, 9.38, 9.62);
            const tip = projectPt(CAN_AT[0], CAN_AT[1], 1, CAN_ROT, [16.2, 6.4, Z_F]);
            return <Elevator id={`${k}el`} x={tip[0] + 0.4 + (1 - inn) * 40} y={tip[1] - push * 1.2 + (1 - inn) * 20} ang={28} px={px} />;
          })()}
          {t >= 9.32 && t < 9.72 && <Implant id={`${k}bk`} x={CAN_AT[0]} y={CAN_AT[1] - 1.4 * ss(t, 9.4, 9.7)} s={1} rot={CAN_ROT} px={px} piece="block" hole={0} cyl={0} />}
          {/* forceps carry the implant: into the pocket; later out of it and across to the damaged eye */}
          {t >= 14.2 && t < 15.0 && (() => {
            const f2 = frontState(t).pocket.impl;
            if (!f2) return null;
            const g = projectPt(f2.x, f2.y, ES, f2.rot, [HOLE[0], HOLE[1], CYL_Z1 - 0.5]);
            const back = ss(t, 14.75, 15.0);
            return <Forceps id={`${k}fp`} x={g[0] + back * 30} y={g[1] - back * 30} ang={-40} px={px} open={ss(t, 14.7, 14.78)} gap={2.2} />;
          })()}
          {t >= 18.25 && t < 19.75 && (() => {
            const p = t < 18.85 ? {x: IMPL_POCKET[0], y: frontState(t).pocket.impl?.y ?? ENTRY_Y, rot: POCKET_ROT} : carry(t);
            const g = projectPt(p.x, p.y, ES, p.rot, [HOLE[0], HOLE[1], CYL_Z1 - 0.5]);
            const come = 1 - ss(t, 18.25, 18.48);
            return <Forceps id={`${k}fq`} x={g[0] + come * 40} y={g[1] - come * 40} ang={-40} px={px} open={1 - ss(t, 18.4, 18.48)} gap={2.2} />;
          })()}
          {t >= 18.85 && t < 19.64 && (() => {const p = carry(t); return <Implant id={`${k}cr`} x={p.x} y={p.y} s={ES} rot={p.rot} px={px} cylMode="clear" tissue={TISSUE_END} vessels={1} holeBg="#C98B7A" />;})()}
        </g>
      </g>,
    );
  }
  // ---------------- BENCH
  if (t >= 10.0 && t < 14.15) {
    const op = t < 10.35 ? ss(t, 10.05, 10.32) : t >= 13.8 ? 1 - ss(t, 13.8, 14.1) : 1;
    L.push(<g key="bench" opacity={op}><Drape id={`${k}dr`} shift={(t - 10) * 30} /></g>);
  }
  // ---------------- the implant in screen space: mouth -> bench -> pocket
  if (t >= 9.72 && t < 14.2) {
    let x = BENCH.x, y = BENCH.y + clickJolt(t), s = BENCH.s, rot = benchRot(t);
    if (t < 10.35) {
      const c = frontCam(9.72);
      const [sx, sy] = toScreen(c, CAN_AT[0], CAN_AT[1] - 1.4);
      const u = ss5(t, 9.72, 10.35);
      x = lerp(sx, BENCH.x, u) - Math.sin(u * Math.PI) * 100; y = lerp(sy, BENCH.y, u) + Math.sin(u * Math.PI) * 80;
      s = Math.exp(lerp(Math.log(c.z), Math.log(BENCH.s), u));
      rot = rotL(CAN_ROT, BENCH_ROT, u);
    } else if (t >= 13.7) {
      const c = frontCam(14.2);
      const [tx, ty] = toScreen(c, IMPL_POCKET[0], ENTRY_Y);
      const u = ss5(t, 13.7, 14.2);
      x = lerp(BENCH.x, tx, u); y = lerp(BENCH.y, ty, u) - Math.sin(u * Math.PI) * 120;
      s = Math.exp(lerp(Math.log(BENCH.s), Math.log(c.z * ES), u));
      rot = rotL(benchRot(13.7), POCKET_ROT, u);
    }
    const trimmed = t >= 10.78;
    const off = easeIn(ss(t, 10.78, 11.15));
    const hole = t < 11.12 ? 0 : ss(t, 11.12, 11.62);
    const dz = cylDz(t);
    const handoffFade = t >= 14.15 ? 0 : 1;
    // the drill bores INTO the plate: below the face it is hidden except through the hole it is cutting
    const faceScreen = LAMINA.map(([a, b]) => projectPt(x, y, s, rot, [a, b, Z_F]));
    const holeScreen = Array.from({length: 32}, (_, i) => {const a = (i / 32) * Math.PI * 2; return projectPt(x, y, s, rot, [HOLE[0] + HOLE_R * Math.cos(a), HOLE[1] + HOLE_R * Math.sin(a), Z_F]);});
    const clipD = `M-200,-200H1300V2200H-200Z M${faceScreen.map((p) => `${p[0]},${p[1]}`).join('L')}Z M${holeScreen.map((p) => `${p[0]},${p[1]}`).join('L')}Z`;
    L.push(
      <g key="impl" opacity={handoffFade}>
        <defs><clipPath id={`${k}dc`}><path d={clipD} clipRule="evenodd" /></clipPath></defs>
        {t >= 10.2 && t < 13.9 && <ellipse cx={x + 30} cy={y + 150} rx={330} ry={90} fill="#0E2E33" opacity={0.35 * ss(t, 10.2, 10.4) * (1 - ss(t, 13.7, 13.9))} style={{filter: 'blur(26px)'}} />}
        {!trimmed && <Implant id={`${k}b`} x={x} y={y} s={s} rot={rot} px={1} piece="block" hole={0} cyl={0} />}
        {trimmed && (
          <>
            {off < 1 && <Implant id={`${k}oc`} x={x} y={y} s={s} rot={rot} px={1} outline={OFFCUT} crown={false} hole={0} cyl={0} offset={[-8 * off, -30 * off - 6 * Math.sin(off * Math.PI), 0]} />}
            {off < 1 && <Implant id={`${k}cp`} x={x} y={y} s={s} rot={rot} px={1} outline={CROWN_PIECE} crown={true} hole={0} cyl={0} offset={[38 * off, -4 * off + 5 * Math.sin(off * Math.PI), 0]} />}
            <Implant id={`${k}l`} x={x} y={y} s={s} rot={rot} px={1} piece="lamina" hole={hole} cyl={t >= 11.95 ? 1 : 0} cylDz={dz} cylMode="clear" holeBg="#2C6870" />
          </>
        )}
        {/* trimming saw: down the neck, along under the root, up the far end */}
        {t > 10.25 && t < 10.95 && (() => {
          const u = clamp((t - 10.38) / 0.4);
          const pth: [number, number][] = [[16.8, 7.2], [16.8, -3.5], [2.4, -1.5], [1.5, 0], [1.5, 6.0]];
          const Ls: number[] = [0]; for (let i = 1; i < pth.length; i++) Ls.push(Ls[i - 1] + Math.hypot(pth[i][0] - pth[i - 1][0], pth[i][1] - pth[i - 1][1]));
          const tg = u * Ls[Ls.length - 1]; let p = pth[pth.length - 1];
          for (let i = 1; i < pth.length; i++) if (tg <= Ls[i]) {const kk = (tg - Ls[i - 1]) / (Ls[i] - Ls[i - 1]); p = [lerp(pth[i - 1][0], pth[i][0], kk), lerp(pth[i - 1][1], pth[i][1], kk)]; break;}
          const tip = projectPt(x, y, s, rot, [p[0], p[1], Z_F]);
          const inn = ss(t, 10.25, 10.38) * (1 - ss(t, 10.78, 10.95));
          return (
            <g>
              {u > 0 && u < 1 && Array.from({length: 8}, (_, i) => {const ph = ((t * 4 + hash(i)) % 0.25) / 0.25; const a = -0.4 - hash(i * 3) * 2.2; return <circle key={i} cx={tip[0] + Math.cos(a) * ph * 90} cy={tip[1] + Math.sin(a) * ph * 70} r={2 + 2 * hash(i)} fill="#EADBB8" opacity={0.85 * (1 - ph)} />;})}
              <g transform={`translate(${tip[0] + (1 - inn) * 500},${tip[1] - (1 - inn) * 600}) scale(${s})`}><Saw id={`${k}s2`} x={0} y={0} ang={-55} px={1 / s} buzz={u > 0 && u < 1 ? 1 : 0} t={t} /></g>
            </g>
          );
        })()}
        {/* the drill, square to the face, boring through the dentin */}
        {t > 10.9 && t < 11.95 && (() => {
          const tip = projectPt(x, y, s, rot, [HOLE[0], HOLE[1], Z_F]);
          const up = projectPt(x, y, s, rot, [HOLE[0], HOLE[1], Z_F + 10]);
          const ang = (Math.atan2(up[1] - tip[1], up[0] - tip[0]) * 180) / Math.PI;
          const inn = ss(t, 10.9, 11.1) * (1 - ss(t, 11.65, 11.9));
          const depth = hole * (Z_F - Z_B) * s;    // how far the burr has gone in
          const dx = Math.cos((ang * Math.PI) / 180), dy = Math.sin((ang * Math.PI) / 180);
          const off2 = (1 - inn) * 900 - depth * 0.55;
          const jit = t > 11.12 && t < 11.62 ? Math.sin(t * 190) * 1.4 : 0;
          return (
            <g>
              {t > 11.12 && t < 11.64 && Array.from({length: 18}, (_, i) => {
                const ph = ((t * 3.4 + hash(i)) % 0.3) / 0.3;
                const a = hash(i * 3.3) * Math.PI * 2;
                return <circle key={i} cx={tip[0] + Math.cos(a) * ph * 130} cy={tip[1] + Math.sin(a) * ph * 60 - ph * 50 + ph * ph * 60} r={2.5 + 3 * hash(i)} fill={i % 3 ? '#F3E6C8' : '#C99B73'} opacity={0.9 * (1 - ph)} />;
              })}
              <g clipPath={`url(#${k}dc)`}>
                <g transform={`translate(${tip[0] + dx * off2 + jit},${tip[1] + dy * off2}) scale(${s})`}><Drill id={`${k}dl`} x={0} y={0} ang={ang} px={1 / s} spin={t > 11.05 && t < 11.68 ? 1 : 0} t={t} /></g>
              </g>
            </g>
          );
        })()}
        {/* forceps: the cylinder in along its axis; they keep hold of it to carry the finished implant */}
        {t > 11.8 && t < 14.2 && (() => {
          const zc = t < 13.2 ? (CYL_Z0 + CYL_Z1) / 2 + dz + 1.5 : CYL_Z1 - 0.5;
          const g = projectPt(x, y, s, rot, [HOLE[0], HOLE[1], zc]);
          const inn = ss(t, 11.8, 12.05);
          return <g transform={`translate(${g[0] + (1 - inn) * 500},${g[1] - (1 - inn) * 500}) scale(${s})`}><Forceps id={`${k}f2`} x={0} y={0} ang={-42} px={1 / s} open={0} gap={1.95} /></g>;
        })()}
      </g>,
    );
  }
  // ---------------- the implant in screen space, between the pocket (front) and the seating (side): it turns from
  // face-on to edge-on in the forceps' path while the front view gives way to the section
  const turn = (t0: number, t1: number, cf: Cam, pf: [number, number], rf: Rot, cs: Cam, ps: [number, number], key: string, tissue: number) => {
    const u = ss5(t, t0, t1);
    const [sx, sy] = toScreen(cf, pf[0], pf[1]);
    const [tx, ty] = toScreen(cs, ps[0], ps[1]);
    L.push(
      <g key={key} opacity={ss(t, t0, t0 + 0.06) * (1 - ss(t, t1 - 0.06, t1 + 0.02))}>
        <Implant id={`${k}${key}`} x={lerp(sx, tx, u)} y={lerp(sy, ty, u)} s={Math.exp(lerp(Math.log(cf.z * ES), Math.log(cs.z), u))} rot={rotL(rf, IMPL_ROT, u)} px={1} tissue={tissue} vessels={1} cylMode="clear" holeBg="#C98B7A" />
      </g>,
    );
  };
  if (t >= 19.62 && t < 19.92) {const p = carry(19.62); turn(19.62, 19.9, frontCam(t), [p.x, p.y], p.rot, sectCam(19.9), [IMPL_AT[0] + 7, IMPL_AT[1]], 'tn2', TISSUE_END);}
  // ---------------- his view: a glimpse on "SEE AGAIN" (hook), and the full return of sight (23 - 25.1)
  if (t >= HOOK_POV && t < 4.36) {
    const clear = keyS(t, [[HOOK_POV, 0.15], [3.55, 0.35], [3.85, 1]]);
    const bright = keyS(t, [[HOOK_POV, 0.55], [3.85, 1]]);
    L.push(<g key="glimpse"><g transform={`translate(540,960) scale(${lerp(1.07, 1, ss(t, HOOK_POV, 3.95))}) translate(-540,-960)`}><View2 id={`${k}vg`} clear={clear} bright={bright} t={t} hands={0} /></g></g>);
  }
  if (t >= 22.95 && t < 25.15) {
    // dark and milky, then a decisive focus pull (with a small overshoot) as his hands come up into view
    const bright = keyS(t, [[23.0, 0.1], [23.7, 0.32], [24.05, 0.55], [24.35, 1]]);
    const pull = ss5(t, 24.0, 24.38);
    const over = t > 24.38 && t < 24.7 ? Math.sin(Math.PI * (t - 24.38) / 0.32) * 0.06 : 0;
    const clear = clamp(lerp(keyS(t, [[23.0, 0], [23.95, 0.12]]), 1, pull) - over);
    const scale = lerp(1.1, 1, ss5(t, 23.9, 24.5)) * (1 + 0.14 * ss5(t, 24.45, 25.1));
    const look = ss5(t, 24.45, 25.1);   // he looks round, toward the window and the flowers
    const op = t < 23.1 ? ss(t, 22.95, 23.1) : 1;
    const bloom = t > 24.2 && t < 24.9 ? Math.sin(Math.PI * clamp((t - 24.2) / 0.7)) : 0;
    L.push(
      <g key="view" opacity={op}>
        <g transform={`translate(${540 - 60 * look},${960 + 30 * look}) scale(${scale}) translate(-540,-960)`}><View2 id={`${k}vw`} clear={clear} bright={bright} t={t} hands={ss5(t, 23.7, 24.5) * (1 - 0.35 * look)} /></g>
        {bloom > 0 && <rect x={0} y={0} width={W} height={H} fill="#FFF3D6" opacity={0.22 * bloom} />}
      </g>,
    );
  }
  return (
    <AbsoluteFill>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>{L}</svg>
      {captions && <Captions4 t={t} />}
    </AbsoluteFill>
  );
};
