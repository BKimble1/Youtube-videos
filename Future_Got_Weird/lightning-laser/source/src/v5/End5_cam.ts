// V5 beat H (28.94-31.88): cameras and timing. Pure functions of film time t.
//   H1 28.94-30.78  the comparison, one split frame: G's last frame (the house rod's tip at (540, 820)) is pushed into
//                   the left half (28.94-29.3) as the tower's rod tip slides in on the right at the same height and the
//                   same size, a thin divider between them. Both views are level with their horizon on one screen line
//                   (G's), so the storm, the ridges and the horizon run on across the divider. Then both dolly straight
//                   back from their tips together (29.06-29.72, the same move on both sides), so the two rods shrink
//                   alike, their tips settle at y 1235, and the sky above them opens: above the house rod only rain and
//                   cloud, above the tower the channel extending along the cyan line high into the sky.
//   H2 30.78-31.88  "into the SKY—": one cut to the payoff, a long-lens view level with the rod tip from out on the
//                   opening side: the whole channel large in frame from the tip up into the deck. The camera rises and
//                   closes in a little as the view tilts up with the packet train toward the deck (in motion from cut
//                   to cut). A packet passes the rod tip on each payoff tick and enters the cloud base. The cut at
//                   31.88 hands over to the loop shot (Loop5, inside the control room).
import {sm5} from '../camera';
import {clamp} from '../dc/math';
import {axis3, Cam3, projector, TIP3, v3, V3} from '../v2/p3';
import {lookAtScreen} from '../v3/Open3_end';
import {rodEndCam} from './Rod5_cam';
import {HOUSE, hw, TIP_W} from '../v3/Rod3_cam';
import {B, EV} from '../v3/timeline3';
import {PULSE} from '../v3/Open3_end';
import {B5} from './timeline5';

const u = (t: number, a: number, b: number) => clamp((t - a) / (b - a));

// ------------------------------------------------------------------ H1: the split
export const H_PAY = 30.78; // the cut to the payoff ("into the SKY—")
/** the divider's slide (the push into the split) */
export const SPLIT0 = B.H, SPLIT1 = 29.3;
export const dividerX = (t: number) => 1080 - 540 * sm5(u(t, SPLIT0, SPLIT1));
/** the shared draw-back: both cameras dolly straight back from their tips (distance x DOLLY_R) and rise a little, so
 *  the two rods shrink alike and their tips settle lower in frame while the horizon stays on one screen line (HOR_Y) and
 *  the sky, far away, stays put */
export const DOLLY0 = 29.06, DOLLY1 = 29.72, DOLLY_R = 2.4;
export const TIP_Y0 = 820, TIP_Y1 = 1235;
export const dollyK = (t: number) => sm5(u(t, DOLLY0, DOLLY1));
/** the tower tip's column once split (the house rod is in the middle of the left half; the tower's is a little left of
 *  the right half's middle, so the channel, which leans right, has room) */
export const RIGHT_X = 775;

/** G's end camera: level, square to the facade, the house rod tip at (540, 820), 10.2 m from it (Rod5_cam G2B) */
const G_END = rodEndCam();
const G_D = TIP_W.z - G_END.pos.z;
/** the horizon on G's end frame (a level camera: its lens centre row); both views keep it */
export const HOR_Y = G_END.cy ?? 960;
/** the tower view: level, from the opening side (V2's R3 direction from the tip), the rod at the house rod's size on
 *  screen (Tower3D's rod half-width 0.35 m against the house rod's 0.052 m) */
const T_DIR = {x: -26, z: -44};
const T_D = Math.hypot(T_DIR.x, T_DIR.z);
export const T_F = (G_END.f * 0.052 * T_D) / (0.35 * G_D);
const T_YAW = (Math.atan2(-T_DIR.x, -T_DIR.z) * 180) / Math.PI;

/** a level camera placing the tip at screen column x (its row follows from the height: the lens centre row stays on
 *  the shared horizon) */
const levelAt = (pos: V3, yaw: number, f: number, tip: V3, x: number): Cam3 => {
  const c: Cam3 = {pos, yaw, pitch: 0, roll: 0, f, cx: 540, cy: HOR_Y};
  const p = projector(c)(tip);
  return {...c, cx: 540 + (x - p.x)};
};
export const splitTipY = (t: number) => TIP_Y0 + (TIP_Y1 - TIP_Y0) * dollyK(t);
const dist = (t: number, d0: number) => d0 * Math.exp(Math.log(DOLLY_R) * dollyK(t));
/** the house view in the left panel: G's end camera dollied back, its tip kept in the middle of the left panel */
export const houseSplitCam = (t: number): Cam3 => {
  const D = dist(t, G_D);
  const h = TIP_W.y - HOUSE.y - ((HOR_Y - splitTipY(t)) * D) / G_END.f;
  return levelAt(hw(0, h, -D), 0, G_END.f, TIP_W, dividerX(t) / 2);
};
/** the tower view in the right panel: its tip slides in with the divider (from off the right edge) to RIGHT_X */
export const towerSplitCam = (t: number): Cam3 => {
  const D = dist(t, T_D);
  const y = TIP3.y - ((HOR_Y - splitTipY(t)) * D) / T_F;
  return levelAt(v3((T_DIR.x * D) / T_D, y, (T_DIR.z * D) / T_D), T_YAW, T_F, TIP3, dividerX(t) + (RIGHT_X - 540));
};

// ------------------------------------------------------------------ H2: the payoff wide
/** the payoff (V5 review END-2 / WF-2): a long lens from out on the opening side, level with the rod tip ~200 m off,
 *  so the whole extended channel is large in frame, running from the rod tip (low left, clear of the caption text) up
 *  into the storm deck, whose base fills the top of the frame. In motion from the cut to the cut (linear): the camera
 *  rises 16 m and closes ~30 m on the channel as the view tilts up with the packets, from the tip toward the deck where
 *  the discharge spreads (End5_cloud). One lens throughout (no zoom). */
export const PAY0 = {pos: v3(-60, 124, -200), h: 380, sx: 420, sy: 840, f: 2000};
export const PAY1 = {pos: v3(-48, 140, -172), h: 640, sx: 480, sy: 560, f: 2000};
export const payCam = (t: number): Cam3 => {
  const k = u(t, H_PAY, B5.H3);
  const a = PAY0, b = PAY1, l = (x: number, y: number) => x + (y - x) * k;
  return lookAtScreen(v3(l(a.pos.x, b.pos.x), l(a.pos.y, b.pos.y), l(a.pos.z, b.pos.z)), axis3(l(a.h, b.h)), l(a.f, b.f), l(a.sx, b.sx), l(a.sy, b.sy), 0);
};
/** the warm channel's top in the payoff and at the end of the split (site px along the axis: at the cloud base,
 *  ~230 m up) */
export const PAY_TOP = 640;
/** the payoff's packet train: H's fast pace (a gap per 0.3 s), phased so a packet passes the rod tip on each payoff
 *  tick (the telescope is far below this frame) */
const P_V = PULSE.SPEED * PULSE.R_FAST, TIP_H = -1;
export const payPulses = (t: number) => {
  const out: number[] = [];
  for (let j = -8; j <= 8; j++) out.push(TIP_H + (t - (EV.payoffTicks[0] + 0.3 * j)) * P_V);
  // (each enters the cloud base and is gone inside it)
  return out.filter((h) => h > -880 && h < PAY_TOP + 50);
};
