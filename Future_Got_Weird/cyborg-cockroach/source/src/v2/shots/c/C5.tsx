// C5 (424-465, "first moves into position."): the overhead that establishes where the target is. Looking almost
// straight down (el 80) on the same foam course the observer's feed has been showing (course.ts): the lane comes up
// from the bottom of the frame, bends right and opens into a small test arena where the CLEAR silicone target stands on
// its aluminium plate (upper middle). The medic (loaded launch tube, amber dose) walks out of the lane straight at the
// target; the observer (lighter shell, camera module, aerial) follows behind it, still taking the bend. The view
// follows the medic slowly (at a fraction of its pace; one move). At 465 the medic is on the course centreline heading
// for the middle of the target's face, its head about 30 mm from it (D1, a low side view, picks up the alignment).
import React from 'react';
import {V2, V3} from '../../../lib/v3';
import {Roach2D, R2} from '../../roach/Roach2D';
import {Gear2D} from '../../roach/Gear2D';
import {viewAt, View, P, D, f2, hull, polyD} from '../../roach/ortho';
import {Box2D, Target2D, LAB2} from '../../sets/Lab2';
import {ShotProps} from '../index2';
import {rnd} from '../../../lib/ease';
import {BLOCKS, curbs, CURB, centre, courseAt, feedMedicPose, feedObsPose, medicS, headOf, rightOf, TARGET_S} from './course';
import {OBS_TINT} from './C2';

export const C5_FROM = 424, C5_TO = 466;
export const C5_AZ = -120, C5_EL = 80, C5_S = 4.4;
/** the target: its face on the course centreline at TARGET_S, facing back down the course (local +x = course heading) */
export const C5_TARGET = {o: courseAt(TARGET_S, 0), yaw: centre(TARGET_S).yaw, depth: 30};
const TGT_C: V3 = [C5_TARGET.o[0] + headOf(C5_TARGET.yaw)[0] * 15, 0, C5_TARGET.o[2] + headOf(C5_TARGET.yaw)[2] * 15];
/** the follow: the view's centre rides between the medic (smooth ground point, no gait bob) and the target */
const FOLLOW = 0.55;
export const c5View = (f: number): View => {
  const m = centre(medicS(f / 30)).p;
  const c: V3 = [m[0] * FOLLOW + TGT_C[0] * (1 - FOLLOW), 0, m[2] * FOLLOW + TGT_C[2] * (1 - FOLLOW)];
  return viewAt(C5_AZ, C5_EL, C5_S, c, 540, 850);
};
/** a view in an object's own frame (origin o, heading yaw: local +x along headOf(yaw), local +z along rightOf(yaw)) */
export const localView = (v: View, o: V3, yaw: number): View => {
  const hx = headOf(yaw), hz = rightOf(yaw);
  const loc = (a: V3): V3 => [a[0] * hx[0] + a[2] * hx[2], a[1], a[0] * hz[0] + a[2] * hz[2]];
  const p = P(v, o);
  return {R: loc(v.R), U: loc(v.U), F: loc(v.F), s: v.s, ox: p[0], oy: p[1]};
};
export const c5Medic = (f: number) => feedMedicPose(f / 30);
export const c5Obs = (f: number) => feedObsPose(f / 30);

const CURBS = curbs();
/** crumbs and scuffs on the tray (world mm), over the whole area the view sees */
const CRUMBS = Array.from({length: 150}, (_, i) => ({p: [-40 + rnd(i, 21) * 420, 0, -200 + rnd(i, 22) * 480] as V3, r: 0.4 + rnd(i, 23) * 0.9, k: i % 3}));
const SCUFFS = Array.from({length: 14}, (_, i) => ({p: [-20 + rnd(i, 31) * 380, 0, -160 + rnd(i, 32) * 420] as V3, a: rnd(i, 33) * 180, l: 14 + rnd(i, 34) * 30}));

type Item = {d: number; el: React.ReactNode};

/** a box's cast shadow on the tray: its footprint swept away from the upper-left key light by its height */
const castShadow = (v: View, lv: View, L: number, W: number, H: number, key: string) => {
  const pts: V2[] = [];
  for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]] as const) {
    const q = P(lv, [(a * L) / 2, 0, (b * W) / 2]);
    pts.push(q, [q[0] + 0.16 * H * v.s, q[1] + 0.2 * H * v.s]);
  }
  return <path key={key} d={polyD(hull(pts))} fill={R2.shadow} opacity={0.1} />;
};

export const C5Scene: React.FC<{f: number; id: string}> = ({f, id}) => {
  const v = c5View(f);
  const items: Item[] = [];
  const shadows: React.ReactNode[] = [];
  const onScreen = (p: V2, r: number) => p[0] + r > -60 && p[0] - r < 1140 && p[1] + r > -60 && p[1] - r < 1980;
  BLOCKS.forEach((b, i) => {
    const c = centre(b.s);
    const yaw = c.yaw + (b.yawAdd ?? 0);
    const o = courseAt(b.s, b.off);
    if (!onScreen(P(v, o), (Math.hypot(b.L, b.W) / 2 + b.H * 0.3) * v.s)) return;
    const lv = localView(v, o, yaw);
    shadows.push(castShadow(v, lv, b.L, b.W, b.H, `bs${i}`));
    items.push({d: D(v, o), el: <Box2D key={`b${i}`} id={`${id}-b${i}`} v={lv} b={[-b.L / 2, b.L / 2, 0, b.H, -b.W / 2, b.W / 2]} color={b.color} />});
  });
  CURBS.forEach((cb, i) => {
    const o = courseAt(cb.s, cb.off);
    if (!onScreen(P(v, o), CURB.L * v.s)) return;
    const lv = localView(v, o, centre(cb.s).yaw);
    items.push({d: D(v, o) - 50, el: <Box2D key={`c${i}`} id={`${id}-c${i}`} v={lv} b={[-CURB.L / 2, CURB.L / 2, 0, CURB.H, -CURB.W / 2, CURB.W / 2]} color={cb.color} />});
  });
  // the target (local frame: face at x = 0, the block toward +x)
  {
    const lv = localView(v, C5_TARGET.o, C5_TARGET.yaw);
    shadows.push(castShadow(v, localView(v, TGT_C, C5_TARGET.yaw), 37, 48, 30, 'ts'));
    // light through the clear silicone: a pale aqua caustic inside its shadow (it reads as clear, not as an empty box)
    {
      const lc = localView(v, TGT_C, C5_TARGET.yaw);
      const pts: V2[] = [];
      for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]] as const) {
        const q = P(lc, [a * 12, 0, b * 14]);
        pts.push([q[0] + 0.16 * 34 * v.s, q[1] + 0.2 * 34 * v.s]);
      }
      shadows.push(<path key="tc" d={polyD(hull(pts))} fill="#E4FBFF" opacity={0.7} />);
    }
    items.push({d: D(v, TGT_C), el: <Target2D key="tg" id={`${id}-tg`} v={lv} face={0} dir={1} />});
  }
  // the two insects
  const med = c5Medic(f), obs = c5Obs(f);
  items.push({d: D(v, [med.frame.o[0], 0, med.frame.o[2]]), el: <Roach2D key="md" pose={med} v={v} o={{id: `${id}-md`, gear: <Gear2D id={`${id}-mg`} v={v} f={med.frame} g={{kind: 'injector'}} />}} />});
  items.push({d: D(v, [obs.frame.o[0], 0, obs.frame.o[2]]), el: <Roach2D key="ob" pose={obs} v={v} o={{id: `${id}-ob`, tint: OBS_TINT, gear: <Gear2D id={`${id}-og`} v={v} f={obs.frame} g={{kind: 'camera'}} />}} />});
  items.sort((a, b) => a.d - b.d);
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <defs>
        <radialGradient id={`${id}-lt`} cx="38%" cy="30%" r="85%">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.32} />
          <stop offset="0.6" stopColor="#FFFFFF" stopOpacity={0} />
          <stop offset="1" stopColor="#5D7480" stopOpacity={0.16} />
        </radialGradient>
      </defs>
      <rect width={1080} height={1920} fill={LAB2.surface} />
      {SCUFFS.map((s, i) => {
        const p = P(v, s.p);
        if (!onScreen(p, s.l * v.s)) return null;
        const a = (s.a * Math.PI) / 180, dx = Math.cos(a) * s.l * v.s * 0.5, dy = Math.sin(a) * s.l * v.s * 0.5;
        return <path key={`sc${i}`} d={`M${f2(p[0] - dx)},${f2(p[1] - dy)} L${f2(p[0] + dx)},${f2(p[1] + dy)}`} stroke={LAB2.surfaceShade} strokeWidth={2} strokeLinecap="round" opacity={0.45} />;
      })}
      {CRUMBS.map((c, i) => {
        const p = P(v, c.p);
        if (!onScreen(p, 4)) return null;
        return <circle key={`cr${i}`} cx={f2(p[0])} cy={f2(p[1])} r={f2(Math.max(1, c.r * v.s * 0.8))} fill={c.k ? '#C3CFD4' : '#B4A894'} opacity={0.6} />;
      })}
      {shadows}
      {items.map((it) => it.el)}
      <rect width={1080} height={1920} fill={`url(#${id}-lt)`} />
    </svg>
  );
};

export const C5: React.FC<ShotProps> = ({f}) => <C5Scene f={f} id={`c5-${f}`} />;
