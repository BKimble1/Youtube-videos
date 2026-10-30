// V5 (a retention pass on V4): frame zero already shows the plate under the graft through a local cut-away; the
// camera pushes into the cylinder (the plate turns a little, so the cylinder is seen passing through it), then rides
// the light through it into the retina, and the retina's light becomes his first sight: a blurred vase of flowers
// snapping into focus. That view clouds over into the glare off his scarred cornea (one penlight shot: the light
// scattering off the scar, a donor graft, the red reflex, the graft clouding), and the penlight leads down to his
// mouth. The bench keeps V4 with the block held by forceps throughout. The pocket: the incision gapes, the implant
// slides under the skin, the skin closes; then a cut-away through his lower lid and cheek (his left side) shows the
// capsule and new vessels growing round it over the months. The living implant is carried across (its shadow on
// his face) to the eye, seated under the graft, and the light is followed through it. His view stays deeply blurred
// until "he could SEE", then snaps into focus on his room, his hands and the same flowers; then his face, and the
// push into his eye closes the loop.
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
import {Profile2, Rays2, Sect2, IMPL_AT, IMPL_ROT, FOVEA, CYL_FRONT_X, CYL_BACK_X, Expr2, NEUTRAL2, PocketSect, POCK_C} from './profile2';
import {EYE0, EyeState} from './profile';
import {Implant, Rot, projectPt, HOLE, Z_F, Z_B, CYL_Z0, CYL_Z1, OFFCUT, CROWN_PIECE, LAMINA, HOLE_R} from './implant';
import {Saw, Drill, Forceps, Elevator, Drape, Room} from './props';
import {Penlight, View2} from './props2';
import {Captions5} from './Captions5';

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
const REACT_F: Cam = {x: -12, y: 12, z: 10};
const F0: Cam = {x: EYE_C[0] + 0.5, y: EYE_C[1] + 1.5, z: 24};
const PUSH_F: Cam = {x: EYE_C[0], y: EYE_C[1], z: 60};
const APP_T0 = 25.78, APP_SEAM = DUR - APP_T0, APP_END = 1.15;
const approach = (tau: number): Cam => {
  const A = APP_SEAM, B = APP_SEAM + APP_END;
  const P = [REACT_F, F0, PUSH_F].map((c) => [c.x, c.y, Math.log(c.z)]);
  const m = P[0].map((_, k) => {const d1 = (P[1][k] - P[0][k]) / A, d2 = (P[2][k] - P[1][k]) / (B - A); return d1 * d2 > 0 ? (2 * d1 * d2) / (d1 + d2) : 0;});
  const h = (p0: number, p1: number, m0: number, m1: number, len: number, u: number) => {const u2 = u * u, u3 = u2 * u; return (2 * u3 - 3 * u2 + 1) * p0 + (u3 - 2 * u2 + u) * len * m0 + (-2 * u3 + 3 * u2) * p1 + (u3 - u2) * len * m1;};
  const tt = clamp(tau, 0, B);
  const v = tt <= A ? P[0].map((_, k) => h(P[0][k], P[1][k], 0, m[k], A, tt / A)) : P[0].map((_, k) => h(P[1][k], P[2][k], m[k], 0, B - A, (tt - A) / (B - A)));
  return {x: v[0], y: v[1], z: Math.exp(v[2])};
};
const HOOK_TURN = 1.03;                   // a quick dissolve from the cylinder, end-on, to the cylinder in section
const SECT_START: Cam = {x: CYL_FRONT_X - 2.5, y: 0, z: PUSH_F.z * ES};
const SECT_HOOK: Cam = {x: 2, y: 0, z: 30};
const GLIMPSE = 2.48;                     // the retina's light becomes his first sight
const BACK_TO_HIM: Cam = {x: -5, y: 9, z: 10.5};
const SMILE0 = 0.35;     // he is quietly smiling when the hook returns to him
const END_SMILE = 0.45, END_BROW = 0.25;  // where his reaction settles at the loop's end (and so in frame zero)

// ================= SECTION (profile) =================
const sectCam = (t: number): Cam => {
  if (t < 4.5) {
    // out along the light to see the whole eye, then with the light into the fovea
    const c = lerpCam(SECT_START, SECT_HOOK, ss5(t, 1.12, 1.78));
    return lerpCam(c, {x: FOVEA[0] + 0.3, y: FOVEA[1], z: 500}, ss5(t, 1.95, 2.62));
  }
  // implantation, then the camera rides the light to the retina and into it
  const seat: Cam = {x: 12.5, y: 0, z: 44};
  if (t < 21.2) return lerpCam({x: 17, y: 0, z: 40}, seat, ss5(t, 19.55, 20.25));
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
    const T = clamp((t - 1.06) / 0.85) * 0.9 + (t > 1.91 ? clamp((t - 1.91) / 0.3) * 0.1 : 0);
    const win = 1, winOp = 1;
    return {s: {st: {...EYE0, scar: 1, glow: ss(t, 1.85, 2.1)}, implDx: 0, implOn: 1, tissue: TISSUE_END, vessels: 1, rays: t > 1.06 ? 'clear' : 'none', rayT: T},
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
  if (t < 8) return keyCam(t, [[4.36, {x: EL[0] + 1.5, y: 0.6, z: 34}], [5.7, {x: EL[0] + 2, y: 1, z: 25}], [7.7, {x: EL[0] + 1, y: 0.5, z: 26}]]);
  if (t < 13) return keyCam(t, [[7.72, {x: EL[0] + 1, y: 0.5, z: 27}], [8.45, {x: 15, y: 57, z: 16}], [9.65, {x: 16, y: 56, z: 18}]]);
  return keyCam(t, [
    [13.95, {x: 36, y: 21, z: 21}], [14.95, {x: 36, y: 24, z: 23}], [15.45, {x: 36, y: 25, z: 25}],
    [18.6, {x: 33, y: 16, z: 21}], [19.45, {x: EYE_C[0] + 3, y: EYE_C[1] - 3, z: 30}], [19.6, {x: EYE_C[0] + 3.5, y: EYE_C[1] - 3.5, z: 33}],
  ]);
};
const IMPL_POCKET: [number, number] = [POCKET2[0] + 1.6, POCKET2[1] + 0.4];
const ENTRY_Y = INCISION_AT - 6;      // the implant's centre while it waits above the incision
const POCKET_ROT: Rot = {yaw: 0, pitch: 0, roll: 0, spin: 0};
const carry = (t: number) => {
  // out of the pocket, held in forceps above his face, across to the damaged eye (it stops in front of it, never on
  // it: the seating is shown in section); a slight tilt on the way, so it reads as a solid
  const u = ss5(t, 18.8, 19.45);
  const p0: [number, number] = [IMPL_POCKET[0], ENTRY_Y];
  const p1: [number, number] = [EYE_C[0] + 6, EYE_C[1] - 7];
  const w = Math.sin(u * Math.PI);
  return {x: lerp(p0[0], p1[0], u), y: lerp(p0[1], p1[1], u) - w * 8, rot: {...FRONT_ROT, yaw: 16 * w, pitch: -10 * w}};
};
const frontState = (t: number): FaceState2 => {
  const u = (a: number, b: number) => ss(t, a, b);
  const f: FaceState2 = {left: {...LOOK0}, brow: 0, smile: 0, mouth: null, pocket: {...NO_POCKET2}, light: 1, bruise: 0};
  if (t < 4.36 || t >= APP_T0) {
    // his reconstructed eye; the local cut-away over the plate opens on "TOOTH". His reaction at the end (the smile,
    // the raised brows, a tear from his other eye) settles to where frame zero has it
    const turn = t < 4.36 ? ss5(t, 0.3, 1.15) : 0;
    f.left = {...LOOK0, mucosa: 1, ookp: 1, cut: t < 4.36 ? lerp(0.62, 0.88, ss(t, 0, 0.6)) : 0.62 * ss(t, DUR - 0.45, DUR), implRot: {yaw: 22 * turn, pitch: -9 * turn, roll: 0, spin: 0}};
    if (t >= APP_T0) {
      f.smile = keyS(t, [[APP_T0, 0.1], [26.02, 0.65], [DUR, END_SMILE]]);
      f.brow = keyS(t, [[APP_T0, 0.1], [25.98, 0.85], [DUR, END_BROW]]);
      f.open = keyS(t, [[APP_T0 + 0.03, 0], [26.0, 0.35], [DUR - 0.1, 0]]);
      f.tear = ss(t, 25.85, 26.25);
    } else {f.smile = END_SMILE; f.brow = END_BROW;}
    return f;
  }
  if (t < 8.0) {
    const donor = ss5(t, 6.2, 6.7);
    f.left = {scar: 1, glare: 1 - u(7.75, 7.95), donor, donorCloud: u(7.22, 7.72), mucosa: 0};
  } else if (t < 13) {
    f.mouth = {retract: u(7.95, 8.4), cut: u(8.3, 8.6), saw: clamp((t - 8.6) / 0.7), canine: t < 9.32 ? 'in' : t < 9.72 ? 'block' : 'gone'};
  } else {
    f.left = {...LOOK0, mucosa: 1};
    const inP = t >= 14.24;
    const lift = t >= 18.5;
    const y = !inP ? ENTRY_Y : !lift ? lerp(ENTRY_Y, IMPL_POCKET[1], ss5(t, 14.24, 14.75)) : ENTRY_Y;
    const tissue = TISSUE_END * u(17.1, 18.1);
    const impl = t < 18.8 ? {x: IMPL_POCKET[0], y, rot: POCKET_ROT, tissue: lift ? TISSUE_END : 0, vessels: lift ? 1 : 0} : null;
    f.pocket = {
      incision: t < 18.4 ? u(13.92, 14.15) : 1, sutured: t < 18.4 ? u(15.0, 15.3) : 0, heal: t < 18.4 ? 0 : 0.4,
      win: 0, bump: t < 18.5 ? u(14.28, 14.5) : 0, gape: t < 18.4 ? u(14.12, 14.28) * (1 - u(14.78, 15.0)) : 0.5,
      impl, above: !inP ? 1 : !lift ? 1 - u(14.24, 14.7) : 1,
    };
    f.bruise = t < 18.4 ? u(14.3, 14.8) : 0.15;
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

export const Scene5: React.FC<{t: number; fkey: string; captions: boolean}> = ({t, fkey, captions}) => {
  const k = fkey;
  const L: React.ReactNode[] = [];
  // ---------------- SECTION: hook (1.08 - 2.62: the light through the cylinder into the fovea), seating and the light
  // (19.45 - 23.1)
  const sectOn = (t >= HOOK_TURN && t < 2.64) || (t >= 19.45 && t < 23.15);
  if (sectOn) {
    const c = sectCam(t);
    const st = sectState(t);
    const px = 1 / c.z;
    const op = t < 4 ? ss(t, HOOK_TURN, 1.27) : t >= 19.45 && t < 19.8 ? ss(t, 19.45, 19.6) : 1;
    L.push(
      <g key="sect" opacity={op}>
        <rect x={0} y={0} width={W} height={H} fill="#22303B" />
        <g transform={camT(c)}>
          <Profile2 s={st.s} px={px} id={`${k}p`} win={st.win} expr={st.expr} tear={st.tear} ext={t < 4.5 ? 1 : 0} winOp={st.winOp ?? 1} />
          {st.win > 0.05 && <g opacity={clamp(st.win * 1.6 - 0.3) * (st.winOp ?? 1)}><Rays2 mode={st.s.rays} T={st.s.rayT} px={px} dx={st.s.implDx} part="outer" /></g>}
        </g>
        {/* inside the fovea: the retina's light fills the view, then his own view begins */}
        {t > 22.6 && t < 23.2 && <rect x={0} y={0} width={W} height={H} fill="#FFD27A" opacity={0.3 * ss(t, 22.6, 22.85) * (1 - ss(t, 22.9, 23.1))} />}
        {t > 2.2 && t < 2.7 && <rect x={0} y={0} width={W} height={H} fill="#FFE2A0" opacity={0.75 * ss(t, 2.25, 2.55)} />}
        {t > 22.8 && t < 23.2 && <rect x={0} y={0} width={W} height={H} fill="#07090C" opacity={ss(t, 22.85, 23.1)} />}
      </g>,
    );
  }
  // ---------------- FRONT: his reconstructed eye (hook, 0 - 1.7), penlight and graft (4.36 - 7.75), mouth and tooth
  // (7.7 - 10.3), pocket and carry (13.7 - 19.9), his reaction and the push into his eye (25.09 - END)
  const frontOn = t < 1.29 || (t >= 4.36 && t < 10.35) || (t >= 13.7 && t < 15.52) || (t >= 18.6 && t < 19.62) || t >= APP_T0;
  if (frontOn) {
    const c = frontCam(t);
    const f = frontState(t);
    const px = 1 / c.z;
    const op = t < 1.29 ? 1 - ss(t, HOOK_TURN, 1.27) : t >= 10.0 && t < 10.35 ? 1 - ss(t, 10.05, 10.32) : t >= 13.7 && t < 14.2 ? ss(t, 13.8, 14.1)
      : t >= 15.3 && t < 15.52 ? 1 - ss(t, 15.3, 15.5) : t >= 18.6 && t < 18.8 ? ss(t, 18.6, 18.78) : t >= 19.45 && t < 19.62 ? 1 - ss(t, 19.45, 19.6) : 1;
    // as he takes in what he sees he tips his head a little
    const tilt = t >= APP_T0 ? keyS(t, [[APP_T0, 0], [26.1, -2.2], [DUR, 0]]) : 0;
    L.push(
      <g key="front" opacity={op}>
        <Room id={`${k}rm`} dx={-(c.x) * 1.0} dy={-(c.y - 14) * 0.5} light={f.light} />
        <g transform={camT(c)}>
          <g transform={`rotate(${tilt} 0 120)`}><Face2 id={`${k}f`} px={px} f={f} /></g>
          {/* the light scattering off the scar: rays thrown back in every direction, the pupil stays dark */}
          {t > 4.36 && t < 7.95 && (() => {
            const L2 = f.left, clearC = L2.donor > 0.98 ? 1 - clamp(L2.donorCloud * 1.3) : 0, sc = L2.glare * (1 - clearC);
            if (sc <= 0.01) return null;
            return (
              <g opacity={sc} stroke="#FFFFFF" strokeLinecap="round" fill="none">
                {Array.from({length: 18}, (_, i) => {
                  const a = (i / 18) * Math.PI * 2 + hash(i) * 0.3, ph = ((t * 1.6 + hash(i * 3)) % 1);
                  const r0 = (5.5 + ph * 9) * ES, r1 = r0 + 2.6 * ES;
                  return <path key={i} d={`M${EL[0] + Math.cos(a) * r0},${0.2 * ES + Math.sin(a) * r0 * 0.75} L${EL[0] + Math.cos(a) * r1},${0.2 * ES + Math.sin(a) * r1 * 0.75}`} strokeWidth={0.5} opacity={0.75 * (1 - ph)} />;
                })}
              </g>
            );
          })()}
          {/* the penlight: already on the eye as the shot opens (out of the glare), a small sweep across the scar; then
              it leads the way down to his mouth, where the tooth will come from */}
          {t >= 4.36 && t < 8.6 && (() => {
            const down = ss5(t, 7.72, 8.4);
            const sweep = Math.sin(Math.PI * ss(t, 4.7, 5.9)) * 3;
            const eyeTip: [number, number] = [EL[0] + 9 + sweep, -7 + sweep * 0.4];
            const mouthTip: [number, number] = [CAN_AT[0] + 9, CAN_AT[1] - 11];
            const out = ss(t, 8.3, 8.6);
            const tip: [number, number] = [lerp(eyeTip[0], mouthTip[0], down) + out * 60, lerp(eyeTip[1], mouthTip[1], down) - out * 40];
            return <Penlight id={`${k}pl`} x={tip[0]} y={tip[1]} ang={lerp(-28, -36, down)} px={px} on={1 - out} beam={9} />;
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
          {/* the living implant (its sheath of new tissue and vessels), held in forceps above his face: its shadow on his
              skin, then across to the damaged eye */}
          {t >= 18.6 && t < 19.62 && (() => {
            const p = carry(t);
            const ol = LAMINA.map(([a, b]) => {const q = projectPt(p.x, p.y, ES, p.rot, [a, b, Z_F]); return `${q[0]},${q[1]}`;}).join('L');
            const g = projectPt(p.x, p.y, ES, p.rot, [HOLE[0], HOLE[1], CYL_Z1 - 0.5]);
            return (
              <g>
                <path d={`M${ol}Z`} fill="rgba(70,30,20,0.28)" transform="translate(3.2,4.6)" style={{filter: 'blur(1.6px)'}} />
                <Implant id={`${k}cr`} x={p.x} y={p.y} s={ES} rot={p.rot} px={px} cylMode="clear" tissue={TISSUE_END} vessels={1} holeBg="#C98B7A" />
                <Forceps id={`${k}fq`} x={g[0]} y={g[1]} ang={-40} px={px} open={0} gap={2.2} />
              </g>
            );
          })()}
        </g>
      </g>,
    );
  }
  // ---------------- THE POCKET, from his left side (15.3 - 18.78): the closed incision, the implant under the muscle, the
  // capsule and new vessels growing round it over the months; then it slides back out through the reopened incision
  if (t >= 15.3 && t < 18.8) {
    const c: Cam = keyCam(t, [[15.3, {x: -12.5, y: 20, z: 21}], [16.3, {x: -12, y: 20.5, z: 33}], [18.2, {x: -12.2, y: 20.5, z: 36}], [18.75, {x: -14, y: 17, z: 30}]]);
    const px = 1 / c.z;
    const heal = t < 18.3 ? 0.85 + 0.15 * ss(t, 15.6, 16.5) : 1 - ss(t, 18.3, 18.45);
    const pk: PocketSect = {win: 1, open: 1, heal, grow: ss(t, 15.9, 18.1), out: ss5(t, 18.45, 18.78), implOn: 1};
    const dayNight = t > 15.65 && t < 16.65 ? 0.22 * Math.sin(Math.PI * ss(t, 15.65, 16.65) * 3) ** 2 : 0;   // the months pass
    const op = ss(t, 15.3, 15.5) * (1 - ss(t, 18.62, 18.78));
    L.push(
      <g key="pocket" opacity={op}>
        <rect x={0} y={0} width={W} height={H} fill="#22303B" />
        <g transform={`${camT(c)} scale(-1,1)`}>
          <Profile2 s={{st: {...EYE0, scar: 1}, implDx: 0, implOn: 0, tissue: 0, vessels: 0, rays: 'none', rayT: 0}} px={px} id={`${k}pk`} win={0} expr={NEUTRAL2} blind pocket={pk} />
        </g>
        {dayNight > 0 && <rect x={0} y={0} width={W} height={H} fill="#0E1A2E" opacity={dayNight} />}
      </g>,
    );
  }
  // ---------------- BENCH
  if (t >= 10.0 && t < 14.15) {
    const op = t < 10.35 ? ss(t, 10.05, 10.32) : t >= 13.8 ? 1 - ss(t, 13.8, 14.1) : 1;
    L.push(<g key="bench" opacity={op}><Drape id={`${k}dr`} shift={(t - 10) * 30} /></g>);
  }
  // ---------------- the implant in screen space: mouth -> bench -> pocket
  if (t >= 9.5 && t < 14.2) {
    let x = BENCH.x, y = BENCH.y + clickJolt(t), s = BENCH.s, rot = benchRot(t);
    if (t < 9.72) {
      // still in the jaw (drawn by the face layer); this only places the holding forceps on it
      const c = frontCam(t);
      [x, y] = toScreen(c, CAN_AT[0], CAN_AT[1] - 1.4 * ss(t, 9.4, 9.7)); s = c.z; rot = CAN_ROT;
    } else if (t < 10.35) {
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
        {!trimmed && t >= 9.72 && <Implant id={`${k}b`} x={x} y={y} s={s} rot={rot} px={1} piece="block" hole={0} cyl={0} />}
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
        {/* holding forceps: they take the block as the elevator frees it, carry it to the bench and hold it there (by the
            bone strip, clear of the saw's path and the drill) until the cylinder forceps take over */}
        {t < 13.75 && (() => {
          const GRIP: [number, number, number] = [5.5, 4.6, 0];
          const g = projectPt(x, y, s, rot, GRIP);
          const u = ss5(t, 9.72, 10.35);
          const ang = lerp(-150, -196, u);
          const inn = ss(t, 9.5, 9.7), leave = ss(t, 13.5, 13.75);
          const dx = Math.cos((ang * Math.PI) / 180), dy = Math.sin((ang * Math.PI) / 180);
          const off = ((1 - inn) * 500 + leave * 500) * (t < 10.35 ? s / BENCH.s : 1);
          return <g transform={`translate(${g[0] + dx * off},${g[1] + dy * off}) scale(${s})`}><Forceps id={`${k}fh`} x={0} y={0} ang={ang} px={1 / s} open={leave * 0.6} gap={1.25} /></g>;
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

  // ---------------- his view: a glimpse on "SEE AGAIN" (hook), and the full return of sight (23 - 25.1)
  if (t >= GLIMPSE && t < 4.36) {
    const pull = ss5(t, 2.95, 3.34);
    const over = t > 3.34 && t < 3.6 ? Math.sin(Math.PI * (t - 3.34) / 0.26) * 0.06 : 0;
    const cloud = ss(t, 3.95, 4.34);       // back to how it was: the light scattered by the scar
    const clear = clamp(lerp(keyS(t, [[GLIMPSE, 0], [2.95, 0.1]]), 1, pull) - over - 0.8 * cloud);
    const S = lerp(2.15, 2.4, ss(t, GLIMPSE, 4.36));
    L.push(
      <g key="glimpse" opacity={ss(t, GLIMPSE, 2.62)}>
        <g transform={`translate(540,930) scale(${S}) translate(-818,-880)`}><View2 id={`${k}vg`} clear={clear} bright={keyS(t, [[GLIMPSE, 0.85], [3.2, 1]])} t={t} hands={0} /></g>
        <rect x={0} y={0} width={W} height={H} fill="#FFF6E2" opacity={0.5 * (1 - ss(t, GLIMPSE, 2.85))} />
        <rect x={0} y={0} width={W} height={H} fill="#FFFFFF" opacity={0.92 * cloud} />
      </g>,
    );
  }
  // the glare it clouded into, as the cornea shot opens
  if (t >= 4.36 && t < 4.7) L.push(<rect key="wf" x={0} y={0} width={W} height={H} fill="#FFFFFF" opacity={0.85 * (1 - ss(t, 4.36, 4.66))} />);
  if (t >= 22.95 && t < APP_T0) {
    // deep blur for a long time (light and shapes only, his hands rising as blurs), then on "he could SEE" a fast
    // focus pull (with a small overshoot) onto his room, his own hands and the same flowers
    const bright = keyS(t, [[23.0, 0.08], [24.0, 0.25], [24.9, 0.45], [25.15, 0.7], [25.4, 1]]);
    const pull = ss5(t, 25.12, 25.45);
    const over = t > 25.45 && t < 25.72 ? Math.sin(Math.PI * (t - 25.45) / 0.27) * 0.06 : 0;
    const clear = clamp(lerp(keyS(t, [[23.0, 0], [24.9, 0.05]]), 1, pull) - over);
    const sway = (1 - pull) * Math.sin(t * 1.4) * 14;
    const scale = lerp(1.12, 1, ss5(t, 24.9, 25.5)) * (1 + 0.08 * ss5(t, 25.45, APP_T0));
    const look = ss5(t, 25.45, APP_T0);   // he looks toward the flowers
    const op = t < 23.1 ? ss(t, 22.95, 23.1) : 1;
    const bloom = t > 25.2 && t < 25.78 ? Math.sin(Math.PI * clamp((t - 25.2) / 0.58)) : 0;
    L.push(
      <g key="view" opacity={op}>
        <g transform={`translate(${540 - 40 * look + sway},${960 + 20 * look}) scale(${scale}) translate(-540,-960)`}><View2 id={`${k}vw`} clear={clear} bright={bright} t={t} hands={ss5(t, 24.3, 25.3)} /></g>
        {bloom > 0 && <rect x={0} y={0} width={W} height={H} fill="#FFF3D6" opacity={0.22 * bloom} />}
      </g>,
    );
  }
  return (
    <AbsoluteFill>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>{L}</svg>
      {captions && <Captions5 t={t} />}
    </AbsoluteFill>
  );
};
