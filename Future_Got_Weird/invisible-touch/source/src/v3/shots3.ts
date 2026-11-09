// V3 lab shots: a targeted polish of V2 (v2/shots2.ts). Segments V2 got right are taken from V2 unchanged; the
// opening, the 3-7 s stretch, the skin beat and the ending are new. Every boundary is a measured word onset.
import {T} from '../it/timing';
import {keyS, ss, lerp, clamp} from '../lib';
import {DEV_TOP} from '../it/device';
import {H_POINT, H_FLAT, H_FIST, HPose, mixH} from '../it/hand';
import {EXN} from '../it/cast';
import {mixExpr} from '../dc/Head';
import {camAt, FY} from '../it/labShots';
import {lab2At, lab2EndAt, Shot2, OPEN2, OPEN2_V, TOP_A} from '../v2/shots2';

export type Shot3 = Shot2 & {
  /** the skin-slab illustration is on screen (0..1) and how far its receptors respond */
  slab: number;
  /** the dashed "where a button would be" outline the closing fingers pass through */
  passOutline: number;
};
const mod4 = (t: number) => 0.5 + 0.5 * Math.cos(2 * Math.PI * 4 * t);

/** pulses at the fingertip: frame 0 (and the loop's last beat), the gap reveal on "exist", FEEL */
export const PULSE3 = [-0.12, T.exist + 0.06, T.end - 0.12];
const age = (t: number, list: number[]) => Math.min(...list.map((p) => (t >= p ? t - p : 99)));

/** the fingertip's reaction to a pulse: a small flinch up off the spot, then it settles back (the skin feels it) */
export const flinch = (t: number, list: number[]) => {
  let y = 0;
  list.forEach((p) => {
    const u = t - p;
    if (u > 0 && u < 0.9) y += 3.2 * (1 - Math.exp(-u / 0.03)) * Math.exp(-u / 0.17);
  });
  return y;
};
/** the hand pose with a flinch: the index extends a touch and the other fingers twitch */
const poseFlinch = (p: HPose, k: number): HPose => ({...p, i1: p.i1 - 6 * k, i2: p.i2 - 4 * k, m: p.m - 0.04 * k});

const toShot3 = (s: Shot2): Shot3 => ({...s, slab: 0, passOutline: 0});

/** the skin-slab interval: a graphic match on the focal glow in and out */
export const SLAB_A = T.skin + 0.3; // "making his skin | feel pressure."
export const SLAB_B = T.move - 0.03;

export const lab3At = (t: number): Shot3 | null => {
  // ---------- 1-3. the opening: ECU flinch at a pulse in dark air -> drop to the glowing gap -> pulse + flinch there
  if (t < T.but0 - 0.03) {
    const s = toShot3(lab2At(t)!);
    s.shot = t < 0.45 ? 1 : t < 1.1 ? 2 : 3;
    s.cam = camAt(t, [
      OPEN2(0),
      {...OPEN2(0.42), d: 104 + OPEN2_V * 0.42, yaw: -30},
      {t: 1.1, x: -2, y: 50, d: 300, yaw: 12, pitch: 0},
      {t: T.but0 - 0.03, x: -10, y: 50, d: 330, yaw: 18, pitch: 0},
    ]);
    const fl = flinch(t, PULSE3);
    s.pad = {x: 0, y: -FY - fl};
    s.pose = poseFlinch(H_POINT, fl / 3.2);
    s.pulse = age(t, PULSE3);
    s.pulseOn = 1;
    s.focus = 0;
    s.lightbox = ss(t, 0.45, 1.0);
    return s;
  }
  // ---------- 4. the one establishing wide (V2 shot 4: three-quarter, the conceptual outline on FEEL)
  if (t < T.look - 0.05) return toShot3(lab2At(t)!);
  // ---------- 5-6. worm's-eye from the array's front edge: cans in the foreground, the fingertip high above in empty
  // air ("Look. Nothing is touching his finger."); then the cans light and faint crests rise toward it ("So why...")
  if (t < T.under - 0.06) {
    const s = toShot3(lab2At(T.look - 0.06)!);
    s.shot = t < T.so - 0.07 ? 5 : 6;
    s.cam = camAt(t, [
      {t: T.look - 0.05, x: 80, y: FY + 135, d: 960, yaw: -35, pitch: -12},
      {t: T.look + 0.75, x: 10, y: 66, d: 130, yaw: -16, pitch: 21},
      {t: T.so - 0.07, x: -6, y: 66, d: 118, yaw: -6, pitch: 22},
      {t: T.under - 0.06, x: -10, y: 70, d: 112, yaw: 4, pitch: 20},
    ]);
    s.body = t < T.look + 0.5;
    s.pad = {x: 0, y: -FY - flinch(t, [T.feel1, T.button1 + 0.05]) + 1.2 * Math.sin((t - T.look) * 2.2)};
    s.pose = poseFlinch(H_POINT, flinch(t, [T.feel1, T.button1 + 0.05]) / 3.2);
    s.expr = EXN.focus;
    s.outline = 0;
    // the question: the cans begin to fire and faint crests rise toward the fingertip
    s.glowOn = 0.85 * ss(t, T.so, T.feel1);
    s.waveT0 = T.so - 0.3;
    s.waves = 0.55 * ss(t, T.so + 0.1, T.feel1 + 0.1);
    s.wavelets = 0.6;
    s.envelope = 0.7;
    s.bands = 0.7;
    s.pulse = age(t, [T.feel1, T.button1 + 0.05]);
    s.pulseOn = ss(t, T.so, T.so + 0.2);
    return s;
  }
  // ---------- 7-8. rise off the front edge and look down across the emitter field, then pull up to the whole grid
  if (t < T.fire - 0.05) {
    const s = toShot3(lab2At(t)!);
    const tD = T.under - 0.06;
    const tG = T.hundreds + 0.45;
    s.cam = camAt(t, [
      {t: tD, x: -10, y: 70, d: 112, yaw: 4, pitch: 20},
      {t: tD + 0.85, x: 6, y: DEV_TOP + 6, d: 112, yaw: 18, pitch: -38},
      {t: tG, x: -8, y: DEV_TOP + 4, d: 104, yaw: 24, pitch: -36},
      {t: T.fire - 0.05, x: 0, y: DEV_TOP, d: 330, yaw: 24, pitch: -60},
    ]);
    s.glowOn = 1;
    return s;
  }
  // ---------- 9-11. V2's side section, convergence rays and fingertip macro, unchanged up to the skin slab
  if (t < SLAB_A) return toShot3(lab2At(t)!);
  // ---------- 12. the skin slab (drawn by SkinSlab; the lab frame under it is the held macro for the match)
  if (t < SLAB_B) {
    const s = toShot3(lab2At(SLAB_A - 0.001)!);
    s.shot = 12;
    s.section = 0;
    s.slab = 1;
    s.ripple = 0;
    return s;
  }
  // ---------- 13. match back to the fingertip, pull back out; the hand opens and glides (V2 shot 13 without the
  // collapsing cutaway, and starting from the macro the slab returned to)
  if (t < TOP_A) {
    const s = toShot3(lab2At(t)!);
    s.section = 0;
    s.sectionR = 7;
    const hx = keyS(t, [[T.move, 0], [TOP_A, -26]]);
    const open = ss(t, T.move + 0.05, T.move + 0.45);
    s.cam = camAt(t, [
      {t: SLAB_B, x: -1, y: FY - 1, d: 56, yaw: 0, pitch: 0},
      {t: T.move + 0.62, x: -14, y: FY + 6, d: 230, yaw: -6, pitch: -6},
      {t: TOP_A, x: -30, y: FY + 30, d: 300, yaw: -6, pitch: -26},
    ]);
    s.pad = {x: hx - 28 * open, y: -FY - 2 + 6 * open};
    return s;
  }
  return null;
};

/** V3 end: the press on nothing and the reach (V2), then the return to the lab, the pass-through and the loop */
export const lab3EndAt = (t: number, entry?: {sx: number; sy: number; k: number}): Shot3 | null => {
  if (t < T.and2 - 0.025) {
    const b = lab2EndAt(t);
    return b ? toShot3(b) : null;
  }
  const s = toShot3(lab2EndAt(t, entry)!);
  const t21 = T.and2 - 0.025;
  // the grab: the hand flattens over the array, a dashed outline marks where a button "would" be, the fingers close
  // straight through it (no slowing, no contact), it fades; then the hand opens and the skin feels the pulse
  const flat = ss(t, t21 + 0.25, t21 + 0.75);
  const grab = ss(t, T.you + 0.25, T.grab + 0.35) * (1 - ss(t, T.but2 + 0.05, T.skin2 - 0.05));
  const back = ss(t, T.skin2 + 0.1, T.feel3 + 0.25);
  const fl = flinch(t, [T.skin2 + 0.06, T.end - 0.12]);
  s.shot = t < T.you - 0.1 ? 21 : t < T.but2 - 0.06 ? 22 : t < T.feel3 + 0.03 ? 23 : 24;
  s.pose = poseFlinch(mixH(mixH(mixH(H_POINT, H_FLAT, flat), H_FIST, grab), H_POINT, back), fl / 3.2);
  s.ang = lerp(lerp(lerp(150, 174, flat), 168, grab), 148, back);
  s.pad = {x: lerp(lerp(0, -20, flat), 0, back), y: lerp(-FY - 3 * flat + 4 * grab, -FY, back) - fl};
  s.onPalm = flat * (1 - back);
  s.passOutline = ss(t, T.you - 0.05, T.you + 0.2) * (1 - ss(t, T.it3 - 0.05, T.but2 + 0.1));
  s.focusOver = true;
  s.focus = (0.75 + 0.25 * mod4(t)) * flat * (1 - back);
  s.waves = flat * (1 - ss(t, T.skin2, T.feel3)) * 0.8;
  s.press = 0;
  s.pulse = age(t, [T.skin2 + 0.06, T.end - 0.12]);
  s.pulseOn = 1;
  s.expr = mixExpr(mixExpr(EXN.focus, EXN.puzzled, ss(t, T.grab, T.it3 + 0.1)), EXN.delight, ss(t, T.skin2 + 0.1, T.feel3));
  // camera: the match from the car's fingertip, pull back to the hand, push in on the grab, then glide into the
  // opening's exact camera path (the last second is the first second's approach)
  const k0 = entry ? entry.k : 4;
  s.cam = camAt(
    t,
    [
      {t: t21, x: 0, y: FY, d: 1500 / k0, yaw: 0, pitch: 0},
      {t: t21 + 0.75, x: -6, y: FY + 4, d: 330, yaw: -12, pitch: 0},
      {t: T.you + 0.05, x: -14, y: FY + 2, d: 235, yaw: -14, pitch: 3},
      {t: T.it3, x: -16, y: FY + 2, d: 205, yaw: -12, pitch: 4},
      {t: T.skin2 + 0.2, x: -6, y: FY + 6, d: 175, yaw: -18, pitch: 6},
      {t: T.feel3 + 0.1, x: 2, y: FY + 12, d: 140, yaw: -28, pitch: 11},
      {...OPEN2(T.end - 0.3), d: 104 - OPEN2_V * 0.3},
      {...OPEN2(T.end), d: 104},
    ],
    true,
  );
  s.lightbox = 1 - ss(t, T.feel3, T.end - 0.35);
  s.body = false;
  return s;
};
void clamp;
