// The Weird Crew prison guard rig: a modified COPY of src/dc/Man.tsx (+ a copy of src/dc/Head.tsx's face) for Robot
// Escapes Jail. dc/ is untouched. Changes from the crew's Man rig:
//  - a rounder, shorter build (belly, wider pelvis, shorter legs and arms, a slightly bigger head);
//  - the guard's uniform: blue short-sleeved shirt (cuffed sleeves, collar, button placket, chest pocket, gold badge),
//    dark trousers with a belt and gold buckle, black shoes (no stripes, no white sneakers);
//  - GuardHead: the crew face (same eyes, nose hook, cheeks, ink) under a navy peaked cap with a black glossy visor
//    and a small gold cap badge, a bushy moustache, brown sideburns; extra expression channels (wide eyes, brow
//    raise, cap pop, pitch down, slack jaw);
//  - an absolute hand-angle override per arm, and `nearHold` (an object drawn between the torso and the near arm, so
//    the near hand grips in front of it: the coffee cup).
// Everything else (IK, limb construction, ink system, light) is the crew rig's.
import React from 'react';
import {lit, mix, shade} from '../dc/color';
import {Deco, INK, Inked, InkLine, InkPath, useInk} from '../dc/ink';
import {Limb} from '../dc/limb';
import {add, clamp, dirDown, dot, fmt, len, lerp, lerpV, mul, norm, P, perp, rot, sub, V} from '../dc/math';
import {Blob, Capsule, Lin, LIGHT} from '../dc/shade';
import {Hand, HandPose} from '../dc/Hand';
import {C} from './palette';

// ---- local colours (not in the shared palette) ----
const SKIN = '#F2C9A8';        // crew skin (dc/Head CREW.skin)
const CHEEK = '#EF6B55';       // crew cheek
const HAIR = '#5B3B2A';        // the guard's brown hair / moustache
const HAIR_LIT = '#8A5E43';
const VISOR = '#151B26';       // black glossy cap visor
const SHOE = '#1F2632';        // black shoes
const BELT = '#1A2333';
const GOLD_DEEP = '#B98A12';   // shaded side of the gold badges / buckle

export type GuardOutfit = {skin: string; shirt: string; pants: string; shoe: string; cap: string};
export const GUARD_OUTFIT: GuardOutfit = {skin: SKIN, shirt: C.guardShirt, pants: C.guardPants, shoe: SHOE, cap: C.guardCap};

export type GPose = {
  x: number;
  y: number;
  s: number;
  torso: number;
  chest: number;
  neck: number;
  turn: number;
  pelvis: number;
  lTu: number;
  lTv: number;
  lElb: number;
  lWr: number;
  /** absolute near-hand angle (deg, screen atan2) blended in by lAbsW */
  lAbs: number;
  lAbsW: number;
  rTu: number;
  rTv: number;
  rElb: number;
  rWr: number;
  rAbs: number;
  rAbsW: number;
  lHip: number;
  lKnee: number;
  lAnk: number;
  rHip: number;
  rKnee: number;
  rAnk: number;
  breath: number;
  lAx: number;
  lAy: number;
  rAx: number;
  rAy: number;
};

const up = (a: number): V => ({x: -Math.sin((a * Math.PI) / 180), y: -Math.cos((a * Math.PI) / 180)});
const px = (a: number): V => ({x: Math.cos((a * Math.PI) / 180), y: -Math.sin((a * Math.PI) / 180)});
const ang = (d: V) => (Math.atan2(d.y, d.x) * 180) / Math.PI;
const cross2 = (a: V, b: V) => a.x * b.y - a.y * b.x;
const lerpAng = (a: number, b: number, t: number) => a + ((((b - a) % 360) + 540) % 360 - 180) * t;

/** the guard's proportions (rig units at s = 1): rounder and shorter than the crew's guesser */
export const GDIM = {
  waist: 204,
  chestH: 132,
  neck: 12,
  headR: 104,
  headUp: 104,
  upperArm: 176,
  foreArm: 160,
  hand: 100,
  thigh: 134,
  shin: 126,
};
/** ankle height above the floor for a flat shoe (rig units) */
export const G_SOLE = 27;

const SOFT_IK = 0.96;
const ik = (S: V, T: V, l1: number, l2: number, side: number) => {
  // side may be fractional (-1..1) while an arm swaps its elbow side (a brief, smooth pass through the straight-ish arm)
  const d0 = sub(T, S);
  const Lt = l1 + l2;
  const d = Math.max(len(d0), Math.abs(l1 - l2) + 0.5);
  const ds = SOFT_IK * Lt;
  const reach = d <= ds ? d : ds + (Lt - ds) * (1 - Math.exp(-(d - ds) / (Lt - ds)));
  const dir = norm(d0);
  const a = (l1 * l1 + reach * reach - l2 * l2) / (2 * reach);
  const h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  const E = add(add(S, mul(dir, a)), mul(perp(dir), h * side));
  const W = add(S, mul(dir, reach));
  return {E, W};
};

export type GJoints = ReturnType<typeof guardJoints>;

export const guardJoints = (p: GPose) => {
  const s = p.s;
  const H: V = {x: p.x, y: p.y};
  const tc = p.torso + p.chest;
  const Cc = add(H, mul(up(p.torso), GDIM.waist * s));
  const Sh = add(Cc, mul(up(tc), GDIM.chestH * s));
  const N = add(Sh, mul(up(tc), GDIM.neck * s));
  const head = add(N, mul(up(tc + p.neck), GDIM.headUp * s));
  const lS = add(add(Sh, mul(px(tc), 44 * s)), mul(up(tc), -22 * s));
  const rS = add(add(Sh, mul(px(tc), -58 * s)), mul(up(tc), -18 * s));
  const toWorld = (u: number, vv: number) => add(Sh, add(mul(up(tc), u * s), mul(px(tc), vv * s)));
  const arm = (S: V, tu: number, tv: number, elb: number, wr: number, abs: number, absW: number) => {
    const T = toWorld(tu, tv);
    const {E, W} = ik(S, T, GDIM.upperArm * s, GDIM.foreArm * s, clamp(elb, -1, 1));
    const fd = norm(sub(W, E));
    return {S, E, W, foreDir: fd, handAng: lerpAng(ang(fd) + wr, abs, clamp(absW))};
  };
  const L = arm(lS, p.lTu, p.lTv, p.lElb, p.lWr, p.lAbs, p.lAbsW);
  const R = arm(rS, p.rTu, p.rTv, p.rElb, p.rWr, p.rAbs, p.rAbsW);
  const hipL = add(add(H, mul(px(p.pelvis), 36 * s)), mul(up(p.pelvis), -46 * s));
  const hipR = add(add(H, mul(px(p.pelvis), -44 * s)), mul(up(p.pelvis), -44 * s));
  const leg = (hp: V, ank: number, tx: number, ty: number) => {
    // planted foot: two-bone IK from the hip to the ankle target, knee forward (toward his front, screen-left)
    const r = ik(hp, {x: tx, y: ty}, GDIM.thigh * s, GDIM.shin * s, 1);
    const K = r.E;
    const A = r.W;
    const sd = norm(sub(A, K));
    const a2 = (Math.atan2(-sd.x, sd.y) * 180) / Math.PI;
    const footDir = norm(dirDown(90 + ank * 0.3));
    const toe = add(A, mul(footDir, 84 * s));
    return {hp, K, A, toe, footDir, shinAng: a2, fl: 1};
  };
  const lLeg = leg(hipL, p.lAnk, p.lAx, p.lAy);
  const rLeg = leg(hipR, p.rAnk, p.rAx, p.rAy);
  return {H, C: Cc, Sh, N, head, tc, L, R, lLeg, rLeg, s, toWorld};
};

const smoothClosed = (pts: V[]) => {
  let d = `M${P(pts[0])}`;
  for (let i = 0; i < pts.length; i++) {
    const p0 = pts[(i - 1 + pts.length) % pts.length];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % pts.length];
    const p3 = pts[(i + 2) % pts.length];
    const c1 = add(p1, mul({x: p2.x - p0.x, y: p2.y - p0.y}, 1 / 6));
    const c2 = add(p2, mul({x: p1.x - p3.x, y: p1.y - p3.y}, 1 / 6));
    d += ` C${P(c1)} ${P(c2)} ${P(p2)}`;
  }
  return d + ' Z';
};

/** the shirt's outline: a round belly at the front (screen-left), a soft back */
export const guardTorsoPath = (p: GPose) => {
  const j = guardJoints(p);
  const s = p.s;
  const tc = j.tc;
  const loc = (O: V, a: number, u: number, vv: number) => add(O, add(mul(up(a), u * s), mul(px(a), vv * s)));
  const br = 1 + 0.035 * p.breath;
  return smoothClosed([
    loc(j.H, p.torso, -26, -104),
    loc(j.H, p.torso, 50, -146 * br),
    loc(j.H, p.torso, 136, -138 * br),
    loc(j.C, tc, 52, -112 * br),
    loc(j.C, tc, 112, -90),
    loc(j.C, tc, 140, -42),
    loc(j.C, tc, 148, 0),
    loc(j.C, tc, 144, 38),
    loc(j.C, tc, 120, 98),
    loc(j.C, tc, 44, 110 * br),
    loc(j.H, p.torso, 96, 108),
    loc(j.H, p.torso, -24, 106),
  ]);
};

// ============================================================================================================
// GuardHead: the crew head (dc/Head.tsx construction) with the guard's cap, moustache and sideburns.
// Head-local space: head radius 100 (y down). The key light is counter-rotated into it.
// ============================================================================================================
export type GExpr = {
  browIn: number;
  browDown: number;
  /** both brows raised (surprise) 0..1 */
  browUp: number;
  lid: number;
  squint: number;
  shut: number;
  pupil: number;
  /** eye opening scale (1 normal, 1.2 = wide) */
  eyeK: number;
  open: number;
  wide: number;
  smile: number;
  teeth: number;
  tongue: number;
  gx: number;
  gy: number;
  sweat: number;
  flush: number;
  /** cap lifted off the head (head units, cartoon take) */
  capLift: number;
  /** cap tilt (deg, + tips the visor down / forward) */
  capTilt: number;
  /** 0..1 face pitched down (features slide down, more cap crown) */
  pitch: number;
  /** moustache droop 0..1 (ends sag) / bristle (-1..0 ends flick up) */
  droop: number;
};

type HeadProps = {
  id: string;
  c: V;
  R: number;
  roll: number;
  turn: number;
  expr: GExpr;
  blink?: number;
  inkW?: number;
  skin?: string;
  cap?: string;
  /** draw only the cap's back brim edge (a second pass over a hand under the cap) */
  capOnly?: boolean;
};

const Q = (a: V, c: V, b: V) => `M${P(a)} Q${P(c)} ${P(b)}`;

export const GuardHead: React.FC<HeadProps> = ({id, c, R, roll, turn: t, expr: e, blink = 0, inkW = 7, skin = SKIN, cap = C.guardCap, capOnly}) => {
  const Lc = rot(LIGHT, -roll);
  const s = R / 100;
  const xf = -30 * t;
  const fw = inkW * 0.74;
  const pd = e.pitch * 14; // features slide down when he looks down
  const rg = (gid: string, cx: number, cy: number, r: number, focal: number, stops: [number, string, number?][]) => {
    const f = add({x: cx, y: cy}, mul(Lc, r * focal));
    return (
      <radialGradient id={gid} gradientUnits="userSpaceOnUse" cx={fmt(cx)} cy={fmt(cy)} r={fmt(r)} fx={fmt(f.x)} fy={fmt(f.y)}>
        {stops.map(([o, col, a], i) => (
          <stop key={i} offset={o} stopColor={col} stopOpacity={a ?? 1} />
        ))}
      </radialGradient>
    );
  };
  const lightPt = (r: number, cx = 0, cy = 0) => add({x: cx, y: cy}, mul(Lc, r));
  const pass = useInk().pass;

  // the guard's head: the crew oval, a touch fuller at the jowls
  const headD = `M0,-107 C55,-107 101,-62 101,0 C101,58 62,108 0,108 C-62,108 -101,58 -101,0 C-101,-62 -55,-107 0,-107 Z`;
  const ear = (x: number, k = 1) =>
    `M${fmt(x - 8 * k)},-12 C${fmt(x + 10 * k)},-20 ${fmt(x + 22 * k)},-4 ${fmt(x + 20 * k)},12 C${fmt(x + 19 * k)},26 ${fmt(x + 12 * k)},38 ${fmt(x + 3 * k)},40 C${fmt(x - 4 * k)},41 ${fmt(x - 9 * k)},36 ${fmt(x - 10 * k)},30 L${fmt(x - 12 * k)},-4 Z`;
  const earRim = (x: number, k = 1) => `M${fmt(x - 2 * k)},-6 C${fmt(x + 9 * k)},-9 ${fmt(x + 14 * k)},4 ${fmt(x + 12 * k)},15 C${fmt(x + 11 * k)},23 ${fmt(x + 6 * k)},30 ${fmt(x)},31`;
  const nearEarX = 101 - 8 * t;
  const farEarX = -101 + 22 * t;
  const hx = xf * 0.25;

  // ---- cap geometry (before the lift). The band's lower edge, seen a little from below: higher in the middle.
  const lift = e.capLift;
  const cx0 = xf * 0.85; // centre front of the cap (badge, visor)
  const bandBot = (x: number) => -62 - 12 * (1 - ((x - hx) / 108) ** 2) - lift; // y of the band's lower edge
  // visor: hangs from the band's lower edge at the front, its outer edge bulging down and out toward screen-left
  const vx0 = cx0 - 96 - 16 * t; // tip (front)
  const vx1 = cx0 + 50 - 6 * t; // back end
  const visorBotY = (x: number) => {
    const u = clamp((x - vx0) / (vx1 - vx0));
    return bandBot(x) + 27 * Math.sin(Math.PI * Math.pow(u, 0.55)) * (1 - 0.25 * u);
  };

  // --- eyes
  const eyeY = -2 + pd;
  const nearX = xf + 37 * (1 - 0.08 * t);
  const farX = xf - 37 * (1 - 0.3 * t);
  const farW = 1 - 0.32 * t;
  const L = clamp(e.lid + (blink + e.shut) * (1 - e.lid));
  const sq = clamp(e.squint + e.shut * 0.4);

  const Eye = (k: 'n' | 'f', ex: number, wf: number, side: 1 | -1) => {
    const rx = 20 * wf * (0.9 + 0.1 * e.eyeK);
    const ry = 21 * e.eyeK;
    const eyeD = `M${fmt(ex - rx)},${fmt(eyeY)} C${fmt(ex - rx)},${fmt(eyeY - ry * 1.33)} ${fmt(ex + rx)},${fmt(eyeY - ry * 1.33)} ${fmt(ex + rx)},${fmt(eyeY)} C${fmt(ex + rx)},${fmt(eyeY + ry * 1.33)} ${fmt(ex - rx)},${fmt(eyeY + ry * 1.33)} ${fmt(ex - rx)},${fmt(eyeY)} Z`;
    const topY = eyeY - ry + L * ry * 2.05;
    const botY = eyeY + ry - sq * ry * 0.95;
    const closed = L > 0.9 || botY - topY < 4;
    if (closed) {
      const ch = e.shut;
      const inner = side;
      const tipX = ex - inner * rx * 0.9;
      const d =
        ch > 0.35
          ? `M${fmt(ex + inner * rx * 0.85)},${fmt(eyeY - 11 * ch)} L${fmt(tipX)},${fmt(eyeY + 2)} L${fmt(ex + inner * rx * 0.85)},${fmt(eyeY + 13 * ch)}`
          : Q({x: ex - rx, y: eyeY + 2}, {x: ex, y: eyeY + 11}, {x: ex + rx, y: eyeY + 2});
      return <InkLine key={k} d={d} w={fw * 1.15} />;
    }
    const pr = 10 * e.pupil;
    const ix = ex + e.gx * rx * 0.46 - t * 4;
    const iy = eyeY + 2 + e.gy * ry * 0.42;
    return (
      <g key={k}>
        <defs>
          <clipPath id={`${id}-ec${k}`}>
            <path d={eyeD} />
          </clipPath>
          {rg(`${id}-ew${k}`, ex, eyeY - 4, ry * 1.4, 0.4, [
            [0, '#FFFFFF'],
            [0.55, '#F6F8FA'],
            [1, '#C9D5DE'],
          ])}
        </defs>
        <Inked w={fw * 0.85}>
          <InkPath d={eyeD} fill={`url(#${id}-ew${k})`} />
        </Inked>
        <g clipPath={`url(#${id}-ec${k})`}>
          <circle cx={fmt(ix)} cy={fmt(iy)} r={fmt(pr)} fill={INK} />
          <circle cx={fmt(ix + pr * 0.38)} cy={fmt(iy - pr * 0.42)} r={fmt(pr * 0.34 + 0.6)} fill="#FFFFFF" />
          <circle cx={fmt(ix - pr * 0.36)} cy={fmt(iy + pr * 0.36)} r={fmt(pr * 0.15 + 0.3)} fill="#FFFFFF" opacity={0.85} />
          <rect x={fmt(ex - rx - 4)} y={fmt(topY)} width={fmt(rx * 2 + 8)} height={7} fill="#5E7486" opacity={0.18} />
          <path d={`M${fmt(ex - rx - 4)},${fmt(eyeY - ry * 1.7)} L${fmt(ex + rx + 4)},${fmt(eyeY - ry * 1.7)} L${fmt(ex + rx + 4)},${fmt(topY + 1)} Q${fmt(ex)},${fmt(topY - 6 * (1 - L))} ${fmt(ex - rx - 4)},${fmt(topY + 1)} Z`} fill={mix(skin, shade(skin, 0.2), 0.5)} />
          <path d={`M${fmt(ex - rx - 4)},${fmt(eyeY + ry * 1.7)} L${fmt(ex + rx + 4)},${fmt(eyeY + ry * 1.7)} L${fmt(ex + rx + 4)},${fmt(botY)} Q${fmt(ex)},${fmt(botY + 6)} ${fmt(ex - rx - 4)},${fmt(botY)} Z`} fill={lit(skin, 0.06)} />
        </g>
        {L > 0.04 && <InkLine d={Q({x: ex - rx - 1, y: topY + 1}, {x: ex, y: topY - 6 * (1 - L)}, {x: ex + rx + 1, y: topY + 1})} w={fw} />}
        {sq > 0.08 && <InkLine d={Q({x: ex - rx * 0.9, y: botY}, {x: ex, y: botY + 6}, {x: ex + rx * 0.9, y: botY})} w={fw * 0.7} opacity={clamp(sq * 2)} />}
        {/* sleepy bags under the eyes (the night shift) */}
        <path d={Q({x: ex - rx * 0.7, y: eyeY + ry + 7}, {x: ex, y: eyeY + ry + 12}, {x: ex + rx * 0.7, y: eyeY + ry + 7})} fill="none" stroke={shade(skin, 0.4)} strokeWidth={fw * 0.45} strokeLinecap="round" opacity={0.45} />
      </g>
    );
  };

  // brows: thick ink strokes, always below the visor's lower edge (plus the ink and a little skin) so they never
  // vanish under the cap or float above the head; the cap pops up on a big take, which gives them room
  const browCeil = (x: number) => visorBotY(clamp(x, vx0, vx1)) + inkW * 1.5 * 0.5 + 5;
  const Brow = (k: 'n' | 'f', ex: number, wf: number, inner: 1 | -1) => {
    const by = -38 + pd + e.browDown * 9 - e.browUp * 16;
    const w = 23 * wf;
    const innerX = ex + inner * w * 0.95;
    const outerX = ex - inner * w * 1.05;
    const innerY = Math.max(browCeil(innerX), by - e.browIn * 15 + e.browDown * 5);
    const outerY = Math.max(browCeil(outerX), by + e.browIn * 5 - e.browDown * 1 + e.browUp * 3);
    const midY = Math.max(browCeil(ex), (innerY + outerY) / 2 - 5 + e.browDown * 2);
    return <InkLine key={`b${k}`} d={Q({x: outerX, y: outerY}, {x: ex, y: midY}, {x: innerX, y: innerY})} w={inkW * 1.5} />;
  };

  // --- nose: a bigger, rounder crew hook (the guard's bulb)
  const noseD = `M${fmt(xf - 2)},${fmt(10 + pd)} C${fmt(xf - 8)},${fmt(16 + pd)} ${fmt(xf - 31 - 10 * t)},${fmt(18 + pd)} ${fmt(xf - 30 - 10 * t)},${fmt(32 + pd)} C${fmt(xf - 29 - 8 * t)},${fmt(44 + pd)} ${fmt(xf - 6)},${fmt(47 + pd)} ${fmt(xf + 5)},${fmt(38 + pd)}`;

  // --- mouth (under the moustache)
  const mx = xf - 6 * t;
  const my = 70 + pd * 0.8;
  const mw = 24 * e.wide * (1 - 0.15 * t);
  const cornerY = my - e.smile * 8;
  const o = e.open;
  const upY = my - 2 - o * 4;
  const loY = my + 4 + o * 34 + Math.max(0, e.smile) * 8;
  const mouthD = `M${fmt(mx - mw)},${fmt(cornerY)} Q${fmt(mx)},${fmt(upY - (cornerY - my) * 0.6)} ${fmt(mx + mw)},${fmt(cornerY)} Q${fmt(mx)},${fmt(loY)} ${fmt(mx - mw)},${fmt(cornerY)} Z`;

  // --- moustache: a bushy walrus brush under the nose, wider on the near side (3/4)
  const msY = 47 + pd + o * 2;
  const nW = 52 * (1 - 0.06 * t);
  const fW = 52 * (1 - 0.38 * t);
  const dr = e.droop;
  const mus = (side: 1 | -1) => {
    const W0 = side > 0 ? nW : fW;
    const k = side;
    const X = (u: number) => mx - 2 + k * u * W0;
    return [
      {x: X(0.02), y: msY - 10},
      {x: X(0.45), y: msY - 12},
      {x: X(0.86), y: msY - 4 + dr * 4},
      {x: X(1.02), y: msY + 10 + dr * 12},
      {x: X(0.92), y: msY + 20 + dr * 16},
      {x: X(0.7), y: msY + 14 + dr * 8},
      {x: X(0.5), y: msY + 19 + dr * 5},
      {x: X(0.27), y: msY + 15},
      {x: X(0.06), y: msY + 18},
    ];
  };
  const mN = mus(1);
  const mF = mus(-1);
  const musPts = [...mF.slice().reverse(), ...mN];
  const musD = (() => {
    // a smooth closed outline: top across, then the scalloped lower edge
    const pts = [mF[0], mF[1], mF[2], mF[3], mF[4], mF[5], mF[6], mF[7], mF[8], mN[8], mN[7], mN[6], mN[5], mN[4], mN[3], mN[2], mN[1], mN[0]];
    return smoothClosed(pts);
  })();
  void musPts;

  // --- cap paths (head-local; lifted by `lift`, tilted about the band's front)
  const bandTop = (x: number) => -88 - 14 * (1 - ((x - hx) / 108) ** 2) - lift;
  const bandPath = (() => {
    const xs = [-109, -80, -40, 0, 40, 80, 109].map((x) => x + hx);
    const top = xs.map((x) => ({x, y: bandTop(x)}));
    const bot = xs.slice().reverse().map((x) => ({x, y: bandBot(x) + (Math.abs(x - hx) > 100 ? 2 : 0)}));
    return `M${top.map(P).join(' L')} L${bot.map(P).join(' L')} Z`;
  })();
  // crown: flares wider than the band; a flat top seen nearly edge-on with the peak's front higher
  const crownD = (() => {
    const a = {x: -106 + hx, y: bandTop(-106 + hx) + 4};
    const b = {x: 106 + hx, y: bandTop(106 + hx) + 4};
    const tl = {x: -126 + hx - 8 * t, y: -152 - lift};
    const pk = {x: cx0 - 14, y: -170 - lift};
    const tr = {x: 120 + hx, y: -142 - lift};
    return `M${P(a)} C${fmt(a.x - 12)},${fmt(a.y - 26)} ${fmt(tl.x - 6)},${fmt(tl.y + 24)} ${P(tl)} C${fmt(tl.x + 6)},${fmt(tl.y - 12)} ${fmt(pk.x - 52)},${fmt(pk.y)} ${P(pk)} C${fmt(pk.x + 70)},${fmt(pk.y)} ${fmt(tr.x - 20)},${fmt(tr.y - 16)} ${P(tr)} C${fmt(tr.x + 6)},${fmt(tr.y + 22)} ${fmt(b.x + 10)},${fmt(b.y - 26)} ${P(b)} Z`;
  })();
  const crownTopRim = (() => {
    const tl = {x: -126 + hx - 8 * t, y: -152 - lift};
    const tr = {x: 120 + hx, y: -142 - lift};
    return `M${P(tl)} C${fmt(tl.x + 50)},${fmt(tl.y + 16)} ${fmt(tr.x - 60)},${fmt(tr.y + 14)} ${P(tr)}`;
  })();
  const visorD = (() => {
    const n = 10;
    const topE: V[] = [];
    const botE: V[] = [];
    for (let i = 0; i <= n; i++) {
      const x = vx0 + ((vx1 - vx0) * i) / n;
      topE.push({x, y: bandBot(x) + 1});
      botE.push({x, y: visorBotY(x)});
    }
    const tip = {x: vx0 - 8, y: bandBot(vx0) + 2};
    return `M${P(tip)} L${topE.map(P).join(' L')} L${botE.slice().reverse().map(P).join(' L')} Z`;
  })();
  const capT = `rotate(${fmt(-e.capTilt)} ${fmt(cx0)} ${fmt(bandBot(cx0))})`;
  const badgeC = {x: cx0 - 6, y: bandTop(cx0) - 24};
  const capBadge = (r: number) => {
    // a small gold shield
    const b = badgeC;
    return `M${fmt(b.x)},${fmt(b.y - r)} L${fmt(b.x + r * 0.78)},${fmt(b.y - r * 0.6)} L${fmt(b.x + r * 0.7)},${fmt(b.y + r * 0.25)} Q${fmt(b.x + r * 0.4)},${fmt(b.y + r * 0.85)} ${fmt(b.x)},${fmt(b.y + r * 1.05)} Q${fmt(b.x - r * 0.4)},${fmt(b.y + r * 0.85)} ${fmt(b.x - r * 0.7)},${fmt(b.y + r * 0.25)} L${fmt(b.x - r * 0.78)},${fmt(b.y - r * 0.6)} Z`;
  };

  const capEl = (
    <g transform={capT}>
      <defs>
        {rg(`${id}-cp`, hx - 20, -120 - lift, 150, 0.5, [
          [0, lit(cap, 0.3)],
          [0.5, cap],
          [1, shade(cap, 0.35)],
        ])}
        {rg(`${id}-vs`, cx0 - 30, -60 - lift, 90, 0.6, [
          [0, '#5E6C84'],
          [0.4, VISOR],
          [1, '#06090F'],
        ])}
        {rg(`${id}-bd`, hx - 30, bandTop(hx) - 10, 130, 0.4, [
          [0, mix(cap, '#3A4A66', 0.6)],
          [0.6, shade(cap, 0.2)],
          [1, shade(cap, 0.45)],
        ])}
        {rg(`${id}-gb`, badgeC.x, badgeC.y, 18, 0.6, [
          [0, '#FFF4B8'],
          [0.5, C.guardBadge],
          [1, GOLD_DEEP],
        ])}
      </defs>
      <Inked w={inkW}>
        <InkPath d={crownD} fill={`url(#${id}-cp)`} />
        <InkPath d={bandPath} fill={`url(#${id}-bd)`} />
      </Inked>
      {pass !== 'ink' && (
        <g>
          <path d={crownTopRim} fill="none" stroke={INK} strokeWidth={fw * 0.55} opacity={0.55} strokeLinecap="round" />
          <ellipse cx={fmt(-62 + hx)} cy={fmt(-122 - lift)} rx={30} ry={9} transform={`rotate(-14 ${fmt(-62 + hx)} ${fmt(-122 - lift)})`} fill="#FFFFFF" opacity={0.16} />
          {/* band: a thin cord across the front and the ink line between crown and band */}
          <InkLine d={`M${fmt(-104 + hx)},${fmt(bandTop(-104 + hx) + 1)} Q${fmt(hx)},${fmt(bandTop(hx) - 14)} ${fmt(104 + hx)},${fmt(bandTop(104 + hx) + 1)}`} w={fw * 0.6} />
          <path d={`M${fmt(-100 + hx)},${fmt(bandTop(-100 + hx) + 9)} Q${fmt(hx)},${fmt(bandTop(hx) - 4)} ${fmt(100 + hx)},${fmt(bandTop(100 + hx) + 9)}`} fill="none" stroke={mix(cap, '#9FB4CF', 0.35)} strokeWidth={2.4} opacity={0.6} />
        </g>
      )}
      {/* gold cap badge */}
      <Inked w={fw * 0.75}>
        <InkPath d={capBadge(15)} fill={`url(#${id}-gb)`} />
      </Inked>
      {pass !== 'ink' && (
        <g>
          <circle cx={fmt(badgeC.x)} cy={fmt(badgeC.y)} r={4.2} fill={GOLD_DEEP} opacity={0.8} />
          <ellipse cx={fmt(badgeC.x - 5)} cy={fmt(badgeC.y - 7)} rx={3.6} ry={2} fill="#FFFFFF" opacity={0.8} transform={`rotate(-30 ${fmt(badgeC.x - 5)} ${fmt(badgeC.y - 7)})`} />
        </g>
      )}
      {/* black glossy visor */}
      <Inked w={inkW * 0.95}>
        <InkPath d={visorD} fill={`url(#${id}-vs)`} />
      </Inked>
      {pass !== 'ink' && (() => {
        // the visor's glossy rim (a bright arc just inside its lower edge) and a short crisp highlight
        const xs = [0.08, 0.2, 0.34, 0.5, 0.66, 0.8].map((u) => vx0 + (vx1 - vx0) * u);
        const pts = xs.map((x) => ({x, y: visorBotY(x) - 4.5}));
        return (
          <g>
            <path d={`M${pts.map(P).join(' L')}`} fill="none" stroke="#A7B6CC" strokeWidth={3} opacity={0.85} strokeLinecap="round" strokeLinejoin="round" />
            <path d={`M${fmt(vx0 + 16)},${fmt(bandBot(vx0 + 16) + 5)} L${fmt(vx0 + 44)},${fmt(visorBotY(vx0 + 44) - 9)}`} fill="none" stroke="#FFFFFF" strokeWidth={3.4} opacity={0.6} strokeLinecap="round" />
            {/* gold cord across the band (separates the black visor from the dark band) with a button at its end */}
            <path d={`M${fmt(vx0 + 18)},${fmt(bandBot(vx0 + 18) - 7)} Q${fmt(cx0)},${fmt(bandBot(cx0) - 11)} ${fmt(vx1 + 24)},${fmt(bandBot(vx1 + 24) - 7)}`} fill="none" stroke={INK} strokeWidth={7.5} strokeLinecap="round" />
            <path d={`M${fmt(vx0 + 18)},${fmt(bandBot(vx0 + 18) - 7)} Q${fmt(cx0)},${fmt(bandBot(cx0) - 11)} ${fmt(vx1 + 24)},${fmt(bandBot(vx1 + 24) - 7)}`} fill="none" stroke={GOLD_DEEP} strokeWidth={4.6} strokeLinecap="round" />
            <path d={`M${fmt(vx0 + 24)},${fmt(bandBot(vx0 + 24) - 8)} Q${fmt(cx0)},${fmt(bandBot(cx0) - 12.2)} ${fmt(vx1 + 18)},${fmt(bandBot(vx1 + 18) - 8)}`} fill="none" stroke={C.guardBadge} strokeWidth={1.8} strokeLinecap="round" opacity={0.9} />
            <circle cx={fmt(vx1 + 26)} cy={fmt(bandBot(vx1 + 26) - 7)} r={4.6} fill={C.guardBadge} stroke={INK} strokeWidth={1.6} />
          </g>
        );
      })()}
    </g>
  );

  if (capOnly) {
    return <g transform={`translate(${fmt(c.x)} ${fmt(c.y)}) rotate(${fmt(roll)}) scale(${fmt(s)})`}>{capEl}</g>;
  }

  const body = (
    <>
      <defs>
        {rg(`${id}-sk`, -6, -8, 126, 0.52, [
          [0, lit(skin, 0.14)],
          [0.4, lit(skin, 0.04)],
          [0.78, skin],
          [0.95, shade(skin, 0.1)],
          [1, shade(skin, 0.15)],
        ])}
        {rg(`${id}-ear`, 0, 10, 30, 0.5, [
          [0, lit(skin, 0.24)],
          [0.7, skin],
          [1, shade(skin, 0.28)],
        ])}
        {rg(`${id}-hr`, 80, -60, 70, 0.5, [
          [0, HAIR_LIT],
          [0.6, HAIR],
          [1, shade(HAIR, 0.3)],
        ])}
        {rg(`${id}-ms`, mx - 10, msY - 6, 60, 0.5, [
          [0, HAIR_LIT],
          [0.55, HAIR],
          [1, shade(HAIR, 0.35)],
        ])}
        <radialGradient id={`${id}-ck`}>
          <stop offset="0" stopColor={CHEEK} stopOpacity={0.75} />
          <stop offset="0.55" stopColor={CHEEK} stopOpacity={0.45} />
          <stop offset="1" stopColor={CHEEK} stopOpacity={0} />
        </radialGradient>
        <linearGradient id={`${id}-mo`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4A1720" />
          <stop offset="1" stopColor="#8A2C36" />
        </linearGradient>
        <clipPath id={`${id}-hc`}>
          <path d={headD} />
        </clipPath>
        <clipPath id={`${id}-mc`}>
          <path d={mouthD} />
        </clipPath>
      </defs>

      <Inked w={inkW * 0.9}>
        <InkPath d={ear(farEarX, -1)} fill={`url(#${id}-ear)`} />
      </Inked>
      <Inked w={inkW}>
        <InkPath d={headD} fill={`url(#${id}-sk)`} />
        <InkPath d={ear(nearEarX)} fill={`url(#${id}-ear)`} />
      </Inked>
      {pass !== 'ink' && (
        <g clipPath={`url(#${id}-hc)`}>
          {/* brown hair under the cap at the back and a sideburn in front of the near ear */}
          <path d={smoothClosed([
            {x: 58 + hx, y: -96}, {x: 116, y: -96}, {x: 114, y: -6}, {x: nearEarX - 2, y: -16}, {x: nearEarX - 12, y: -18},
            {x: nearEarX - 17, y: 14}, {x: nearEarX - 25, y: -14}, {x: 74 + hx, y: -38}, {x: 62 + hx, y: -60},
          ])} fill={`url(#${id}-hr)`} />
          <path d={`M${fmt(nearEarX - 20)},-40 Q${fmt(nearEarX - 12)},-26 ${fmt(nearEarX - 2)},-24`} fill="none" stroke={shade(HAIR, 0.4)} strokeWidth={2.6} strokeLinecap="round" opacity={0.6} />
          {/* the cap's shadow just under its band and visor */}
          <path d={`M${Array.from({length: 23}, (_, i) => {
            const x = -110 + i * 10;
            const yb = x >= vx0 && x <= vx1 ? visorBotY(x) : bandBot(x);
            return `${fmt(x)},${fmt(yb + 7)}`;
          }).join(' L')}`} fill="none" stroke={shade(skin, 0.6)} strokeWidth={16} strokeLinejoin="round" opacity={0.13 * (1 - clamp(lift / 14))} />
          {/* cheeks */}
          <ellipse cx={fmt(nearX + 18)} cy={fmt(34 + pd)} rx={23} ry={18} fill={`url(#${id}-ck)`} opacity={0.6 + 0.4 * e.flush} />
          <ellipse cx={fmt(farX - 16 * farW)} cy={fmt(34 + pd)} rx={fmt(19 * farW)} ry={16} fill={`url(#${id}-ck)`} opacity={0.55 + 0.4 * e.flush} />
          {/* a soft double-chin fold */}
          <path d={Q({x: mx - 30, y: 98 + pd * 0.3}, {x: mx, y: 106 + pd * 0.3}, {x: mx + 34, y: 96 + pd * 0.3})} fill="none" stroke={shade(skin, 0.35)} strokeWidth={fw * 0.5} strokeLinecap="round" opacity={0.5} />
        </g>
      )}
      {pass !== 'ink' && (
        <g>
          <ellipse cx={fmt(nearEarX + 5)} cy={15} rx={6} ry={11} fill={shade(skin, 0.3)} opacity={0.45} />
          <path d={earRim(nearEarX)} fill="none" stroke={shade(skin, 0.42)} strokeWidth={3.4} strokeLinecap="round" opacity={0.75} />
        </g>
      )}

      {Eye('f', farX, farW, -1)}
      {Eye('n', nearX, 1, 1)}
      {(e.shut > 0.3 || e.squint > 0.5) && (
        <g opacity={clamp(Math.max(e.shut, (e.squint - 0.5) * 2))}>
          {[-1, 0, 1].map((k) => (
            <InkLine key={k} d={`M${fmt(nearX + 26)},${fmt(eyeY + k * 9)} l${fmt(9)},${fmt(k * 5 - 1)}`} w={fw * 0.6} />
          ))}
        </g>
      )}
      {Brow('f', farX, farW, 1)}
      {Brow('n', nearX, 1, -1)}

      {/* mouth: drawn before the moustache, which hangs over its upper lip */}
      {o < 0.07 ? (
        <InkLine d={Q({x: mx - mw, y: cornerY}, {x: mx, y: my + e.smile * 12}, {x: mx + mw, y: cornerY})} w={fw * 1.0} />
      ) : (
        <g>
          <Inked w={fw * 0.85}>
            <InkPath d={mouthD} fill={`url(#${id}-mo)`} />
          </Inked>
          {pass !== 'ink' && (
            <g clipPath={`url(#${id}-mc)`}>
              <ellipse cx={fmt(mx + 4)} cy={fmt(loY + 2)} rx={fmt(mw * 0.62)} ry={fmt(8 + o * 12)} fill="#E27583" opacity={0.85} />
              {e.teeth > 0.01 && <rect x={fmt(mx - mw)} y={fmt(upY - 12)} width={fmt(mw * 2)} height={fmt(12 + 6 + o * 6)} rx={3} fill="#FBFAF6" opacity={e.teeth} />}
            </g>
          )}
          {pass !== 'ink' && <InkLine d={mouthD} w={fw * 0.85} />}
        </g>
      )}

      {/* nose */}
      {pass !== 'ink' && <path d={`${noseD} C${fmt(xf + 10)},${fmt(28 + pd)} ${fmt(xf + 4)},${fmt(16 + pd)} ${fmt(xf - 2)},${fmt(10 + pd)} Z`} fill={mix(skin, CHEEK, 0.34)} opacity={0.95} />}
      <InkLine d={noseD} w={fw} />
      {pass !== 'ink' && <ellipse cx={fmt(xf - 14 - 7 * t)} cy={fmt(26 + pd)} rx={4.6} ry={3} fill="#FFFFFF" opacity={0.7} transform={`rotate(-30 ${fmt(xf - 14 - 7 * t)} ${fmt(26 + pd)})`} />}

      {/* moustache */}
      <Inked w={fw * 0.95}>
        <InkPath d={musD} fill={`url(#${id}-ms)`} />
      </Inked>
      {pass !== 'ink' && (
        <g>
          {[-0.75, -0.45, -0.15, 0.2, 0.5, 0.8].map((u, i) => {
            const W0 = u > 0 ? nW : fW;
            const x = mx - 2 + u * W0;
            return <path key={i} d={Q({x: x - u * 4, y: msY - 4}, {x: x + u * 6, y: msY + 6}, {x: x + u * 10, y: msY + 12 + Math.abs(u) * dr * 10})} fill="none" stroke={shade(HAIR, 0.45)} strokeWidth={2.4} strokeLinecap="round" opacity={0.55} />;
          })}
          <ellipse cx={fmt(mx - 14)} cy={fmt(msY - 4)} rx={13} ry={3.6} transform={`rotate(-8 ${fmt(mx - 14)} ${fmt(msY - 4)})`} fill="#FFFFFF" opacity={0.25} />
        </g>
      )}

      {e.sweat > 0.02 &&
        [
          [farX - 40 * farW, -30, 0.5],
          [farX - 46 * farW, -10, 0.34],
        ].map(([x, y, k], i) => (
          <g key={i} opacity={e.sweat} transform={`translate(${fmt(x)} ${fmt(y + pd)}) scale(${k})`}>
            <Inked w={fw * 0.7}>
              <InkPath d="M0,-13 C6,-4 9,3 9,8 C9,14 5,17 0,17 C-5,17 -9,14 -9,8 C-9,3 -6,-4 0,-13 Z" fill="#BFE6F5" />
            </Inked>
            {pass !== 'ink' && <ellipse cx={-3} cy={6} rx={2.6} ry={4} fill="#FFFFFF" />}
          </g>
        ))}

      {pass !== 'ink' && (
        <g>
          <ellipse cx={fmt(farX - 6)} cy={fmt(26 + pd)} rx={4} ry={2.6} fill="#FFFFFF" opacity={0.35} />
          <ellipse cx={fmt(nearX + 8)} cy={fmt(24 + pd)} rx={3.4} ry={2.4} fill="#FFFFFF" opacity={0.3} />
          <ellipse cx={fmt(lightPt(46).x + 30)} cy={fmt(lightPt(46).y + 30)} rx={10} ry={4} transform={`rotate(-30 ${fmt(lightPt(46).x + 30)} ${fmt(lightPt(46).y + 30)})`} fill="#FFFFFF" opacity={0.14} />
        </g>
      )}
      {capEl}
    </>
  );

  return <g transform={`translate(${fmt(c.x)} ${fmt(c.y)}) rotate(${fmt(roll)}) scale(${fmt(s)})`}>{body}</g>;
};

// ============================================================================================================
// GuardMan: the full figure (crew Man construction)
// ============================================================================================================
type Props = {
  id: string;
  pose: GPose;
  expr: GExpr;
  blink?: number;
  lHand: HandPose;
  rHand: HandPose;
  outfit?: GuardOutfit;
  inkK?: number;
  /** drawn between the body and the near arm (the cup the near hand grips) */
  nearHold?: React.ReactNode;
  /** redraw the cap over the near hand (the hand slips under the cap's back: 0..1 how much of the cap's back) */
  capOverHand?: boolean;
};

export const GuardMan: React.FC<Props> = ({id, pose: p, expr, blink = 0, lHand, rHand, outfit = GUARD_OUTFIT, inkK = 1, nearHold, capOverHand}) => {
  const j = guardJoints(p);
  const s = p.s;
  const OUT = 7 * s * inkK;
  const IN = OUT * 0.72;
  const o = outfit;
  const skin = o.skin;
  const far = (c: string) => shade(c, 0.14);
  const tc = j.tc;
  const loc = (O: V, a: number, u: number, vv: number) => add(O, add(mul(up(a), u * s), mul(px(a), vv * s)));

  const torsoD = guardTorsoPath(p);
  const torsoC = loc(j.C, tc, 60, -40);

  const pelPts: V[] = [loc(j.H, p.pelvis, 10, -88), loc(j.H, p.pelvis, 10, 100), loc(j.H, p.pelvis, -56, 104), loc(j.H, p.pelvis, -92, 36), loc(j.H, p.pelvis, -84, -56)];
  const pelD = smoothClosed(pelPts);

  const Leg = (k: string, L: GJoints['lLeg'], isFar: boolean) => {
    const pc = isFar ? far(o.pants) : o.pants;
    const shoe = isFar ? far(o.shoe) : o.shoe;
    const sd = dirDown(L.shinAng);
    const F = (x: number, y: number) => add(add(L.A, mul(L.footDir, x * s)), mul(sd, y * s));
    const upper = smoothClosed([F(-36, -6), F(-32, 16), F(30, 20), F(92, 18), F(104, 4), F(90, -12), F(48, -24), F(10, -34), F(-16, -34), F(-34, -24)]);
    const sole = smoothClosed([F(-37, 10), F(100, 12), F(102, 25), F(40, 28), F(-35, 27)]);
    const ankle = add(L.A, mul(sd, -8 * s));
    const cuff0 = add(L.A, mul(sd, -40 * s));
    const nb = perp(sd);
    return (
      <g key={k}>
        <Inked w={IN} id={`${id}-${k}i`} fade={[{c: L.hp, r: 64 * s}]}>
          <Limb id={`${id}-${k}lb`} A={L.hp} B={L.K} C={ankle} rA={64 * s} rB={50 * s} rC={41 * s} color={pc} spec={0.12} crease={IN * 0.8} />
        </Inked>
        <Deco>
          <path d={`M${P(add(cuff0, mul(nb, 32 * s)))} Q${P(add(cuff0, mul(sd, 5 * s)))} ${P(add(cuff0, mul(nb, -32 * s)))} L${P(add(ankle, mul(nb, -31 * s)))} L${P(add(ankle, mul(nb, 31 * s)))} Z`} fill={shade(pc, 0.12)} opacity={0.8} />
          <InkLine d={`M${P(add(cuff0, mul(nb, 30 * s)))} Q${P(add(cuff0, mul(sd, 5 * s)))} ${P(add(cuff0, mul(nb, -30 * s)))}`} w={IN * 0.6} opacity={0.6} />
          {/* trouser crease down the front of the leg */}
          <path d={`M${P(loc(L.hp, 0, -30, -26))} L${P(add(L.K, mul(perp(sd), 14 * s)))} L${P(add(cuff0, mul(nb, 16 * s)))}`} fill="none" stroke={lit(pc, 0.25)} strokeWidth={fmt(2.4 * s * inkK)} opacity={0.35} strokeLinejoin="round" />
        </Deco>
        {/* black guard shoe: rounded upper, dark sole, glossy toe */}
        <Inked w={IN * 0.9}>
          <Blob id={`${id}-${k}so`} d={sole} c={F(30, 18)} r={80 * s} color="#0E131B" k={0.4} />
          <Blob id={`${id}-${k}sp`} d={upper} c={F(24, -10)} r={92 * s} color={shoe} k={0.9} stops={[[0, '#6C7A8E'], [0.4, mix(shoe, '#4A5568', 0.5)], [1, shade(shoe, isFar ? 0.5 : 0.35)]]} />
        </Inked>
        <Deco>
          <ellipse cx={fmt(F(64, -8).x)} cy={fmt(F(64, -8).y)} rx={fmt(17 * s)} ry={fmt(5 * s)} transform={`rotate(${fmt(ang(L.footDir) - 12)} ${fmt(F(64, -8).x)} ${fmt(F(64, -8).y)})`} fill="#FFFFFF" opacity={0.75} />
          <InkLine d={`M${P(F(-6, -22))} Q${P(F(14, -12))} ${P(F(34, -16))}`} w={IN * 0.5} opacity={0.6} />
        </Deco>
      </g>
    );
  };

  // short sleeves: a whole sleeve with a rounded crown (near) or a low crown behind the shirt (far), with a turned cuff
  const sleeve = (k: string, A: GJoints['L'], isFar: boolean) => {
    const u = norm(sub(A.E, A.S));
    const n = perp(u);
    // a short sleeve flares a little toward its opening (wider than the arm), so it reads as cloth, not a tube
    const r0 = 39 * s;
    const r1 = 43 * s;
    const top = A.S;
    const hem = add(A.S, mul(u, GDIM.upperArm * 0.6 * s));
    const p2 = add(hem, mul(n, r1));
    const p3 = add(hem, mul(n, -r1));
    let ln = n;
    if (dot(ln, LIGHT) < 0) ln = mul(ln, -1);
    const mid = mul(add(top, hem), 0.5);
    const c = isFar ? far(o.shirt) : o.shirt;
    const capH = (isFar ? 22 : 34) * s;
    const q1 = add(top, mul(n, r0)), q4 = add(top, mul(n, -r0));
    const crownTop = add(top, mul(u, -capH));
    const sideC = (sg: number) => add(add(mul(add(top, hem), 0.5), mul(n, sg * (r0 + r1) * 0.53)), mul(u, 6 * s));
    const dCap = `M${P(q1)} Q${P(sideC(1))} ${P(p2)} Q${P(add(hem, mul(u, r1 * 0.3)))} ${P(p3)} Q${P(sideC(-1))} ${P(q4)} C${P(add(q4, mul(u, -capH * 1.1)))} ${P(add(crownTop, mul(n, -r0 * 0.6)))} ${P(crownTop)} C${P(add(crownTop, mul(n, r0 * 0.6)))} ${P(add(q1, mul(u, -capH * 1.1)))} ${P(q1)} Z`;
    const cuffA = add(hem, mul(u, -14 * s));
    const inner = <ellipse key="in" cx={fmt(hem.x)} cy={fmt(hem.y)} rx={fmt(r1 * 0.24)} ry={fmt(r1 * 0.93)} transform={`rotate(${fmt(ang(u))} ${fmt(hem.x)} ${fmt(hem.y)})`} fill={shade(c, 0.5)} />;
    const body = (
      <g key={`sl${k}`}>
        <Inked w={IN} id={`${id}-${k}si`}>
          <Lin id={`${id}-${k}sg`} d={dCap} from={add(mid, mul(ln, r0))} to={add(mid, mul(ln, -r0))} stops={[[0, lit(c, 0.22)], [0.45, c], [0.85, shade(c, 0.22)], [1, shade(c, 0.34)]]} />
        </Inked>
        <Deco>
          {/* turned cuff */}
          <path d={`M${P(add(cuffA, mul(n, r1 * 1.0)))} Q${P(add(cuffA, mul(u, 5 * s)))} ${P(add(cuffA, mul(n, -r1 * 1.0)))}`} fill="none" stroke={INK} strokeWidth={fmt(IN * 0.5)} strokeLinecap="round" opacity={0.7} />
          <path d={`M${P(add(add(A.S, mul(u, 40 * s)), mul(n, -r0 * 0.5)))} Q${P(add(A.S, mul(u, 54 * s)))} ${P(add(add(A.S, mul(u, 44 * s)), mul(n, r0 * 0.5)))}`} fill="none" stroke="#0E1D33" strokeOpacity={0.14} strokeWidth={fmt(4 * s)} strokeLinecap="round" />
          <ellipse cx={fmt(add(mid, mul(ln, r0 * 0.55)).x)} cy={fmt(add(mid, mul(ln, r0 * 0.55)).y)} rx={fmt(24 * s)} ry={fmt(4 * s)} transform={`rotate(${fmt(ang(u))} ${fmt(add(mid, mul(ln, r0 * 0.55)).x)} ${fmt(add(mid, mul(ln, r0 * 0.55)).y)})`} fill="#FFFFFF" opacity={0.28} />
        </Deco>
      </g>
    );
    return {inner, body};
  };

  const armGroup = (k: string, A: GJoints['L'], isFar: boolean, hp: HandPose, thumbSide: 1 | -1) => {
    const sk = isFar ? far(skin) : skin;
    const armTop = add(A.S, mul(norm(sub(A.E, A.S)), 30 * s));
    return (
      <Inked w={IN} key={k}>
        <Limb id={`${id}-${k}lb`} A={armTop} B={A.E} C={A.W} rA={31 * s} rB={25 * s} rC={19 * s} color={sk} spec={0.22} crease={isFar ? 0 : IN * 0.8} />
        <Hand id={`${id}-${k}h`} wrist={add(A.W, mul(A.foreDir, -6 * s))} ang={A.handAng} L={GDIM.hand * s} thumbSide={thumbSide} view="back" pose={hp} color={sk} ink={IN * 0.9} bare />
      </Inked>
    );
  };
  const farSleeve = sleeve('rs', j.R, true);
  const nearSleeve = sleeve('ls', j.L, false);

  // shirt details (torso frame)
  const bt = (u: number, vv: number) => loc(j.H, p.torso, u, vv);
  const ct = (u: number, vv: number) => loc(j.C, tc, u, vv);
  const placket = `M${P(ct(132, -54))} Q${P(bt(150, -100))} ${P(bt(70, -104))} T${P(bt(-10, -76))}`;
  const buttons = [ct(108, -62), bt(160, -94), bt(110, -104), bt(58, -98), bt(10, -84)];
  const badgeC = ct(86, -36);
  const br = 12 * s;
  const shield = `M${P(add(badgeC, mul(up(tc), br)))} L${P(add(add(badgeC, mul(up(tc), br * 0.6)), mul(px(tc), br * 0.8)))} L${P(add(add(badgeC, mul(up(tc), -br * 0.3)), mul(px(tc), br * 0.72)))} Q${P(add(add(badgeC, mul(up(tc), -br * 0.9)), mul(px(tc), br * 0.4)))} ${P(add(badgeC, mul(up(tc), -br * 1.1)))} Q${P(add(add(badgeC, mul(up(tc), -br * 0.9)), mul(px(tc), -br * 0.4)))} ${P(add(add(badgeC, mul(up(tc), -br * 0.3)), mul(px(tc), -br * 0.72)))} L${P(add(add(badgeC, mul(up(tc), br * 0.6)), mul(px(tc), -br * 0.8)))} Z`;
  // breast pocket on his (visible) left chest, under the badge, in front of the near arm (not in the armpit)
  const pocket = smoothClosed([ct(58, -58), ct(58, -14), ct(16, -14), ct(10, -36), ct(16, -58)]);
  const flap = `M${P(ct(64, -60))} L${P(ct(64, -12))} L${P(ct(48, -12))} Q${P(ct(42, -36))} ${P(ct(48, -60))} Z`;
  // collar: two points folding down from the neckline
  const collarN = `M${P(ct(146, -6))} L${P(ct(118, -40))} L${P(ct(138, -62))} L${P(ct(150, -40))} Z`;
  const collarB = `M${P(ct(150, 6))} L${P(ct(128, 30))} L${P(ct(150, 42))} Z`;
  // belt across the hips, under the belly's overhang
  const beltD = `M${P(bt(-30, -140))} L${P(bt(-30, 140))} L${P(bt(0, 140))} L${P(bt(0, -140))} Z`;
  const buckle = bt(-15, -74);

  return (
    <Inked w={OUT}>
      {Leg('rl', j.rLeg, true)}
      {farSleeve.inner}
      {armGroup('ra', j.R, true, rHand, -1)}
      {farSleeve.body}
      <Inked w={IN}>
        <Blob id={`${id}-pel`} d={pelD} c={loc(j.H, p.pelvis, -10, -30)} r={124 * s} color={o.pants} />
      </Inked>
      {Leg('ll', j.lLeg, false)}
      <Inked w={IN}>
        <Capsule id={`${id}-nk`} a={add(j.N, mul(up(tc), -24 * s))} b={add(j.N, mul(up(tc + p.neck), 46 * s))} ra={36 * s} rb={34 * s} color={shade(skin, 0.1)} />
      </Inked>
      <Inked w={IN}>
        <Blob id={`${id}-tor`} d={torsoD} c={torsoC} r={220 * s} color={o.shirt} k={1.1} stops={[[0, lit(o.shirt, 0.26)], [0.5, o.shirt], [0.82, shade(o.shirt, 0.18)], [1, shade(o.shirt, 0.36)]]} />
      </Inked>
      <Deco>
        <defs>
          <clipPath id={`${id}-tclip`}>
            <path d={torsoD} />
          </clipPath>
          <linearGradient id={`${id}-blt`} gradientUnits="userSpaceOnUse" x1={fmt(bt(0, 0).x)} y1={fmt(bt(0, 0).y)} x2={fmt(bt(-30, 0).x)} y2={fmt(bt(-30, 0).y)}>
            <stop offset="0" stopColor={lit(BELT, 0.18)} />
            <stop offset="1" stopColor={BELT} />
          </linearGradient>
        </defs>
        <g clipPath={`url(#${id}-tclip)`}>
          <Lin id={`${id}-tf`} d={torsoD} from={ct(40, -110)} to={ct(40, 100)} stops={[[0, '#FFFFFF', 0.22], [0.3, '#FFFFFF', 0], [0.6, '#0E1D33', 0], [1, '#0E1D33', 0.34]]} />
          {/* the belly's underside shadow above the belt */}
          <ellipse cx={fmt(bt(18, -40).x)} cy={fmt(bt(18, -40).y)} rx={fmt(110 * s)} ry={fmt(24 * s)} transform={`rotate(${fmt(-p.torso)} ${fmt(bt(18, -40).x)} ${fmt(bt(18, -40).y)})`} fill="#0E1D33" opacity={0.22} />
          <path d={beltD} fill={`url(#${id}-blt)`} />
          <InkLine d={`M${P(bt(0, -140))} L${P(bt(0, 140))}`} w={IN * 0.55} />
          {/* placket, buttons, pocket, collar */}
          <InkLine d={placket} w={IN * 0.45} opacity={0.7} />
          {buttons.map((b, i) => (
            <circle key={i} cx={fmt(b.x)} cy={fmt(b.y)} r={fmt(4.6 * s)} fill={lit(o.shirt, 0.5)} stroke={INK} strokeWidth={fmt(IN * 0.25)} />
          ))}
          <path d={pocket} fill={shade(o.shirt, 0.08)} stroke={INK} strokeWidth={fmt(IN * 0.32)} strokeOpacity={0.75} />
          <path d={flap} fill={lit(o.shirt, 0.06)} stroke={INK} strokeWidth={fmt(IN * 0.32)} strokeOpacity={0.75} />
          {/* folds where the shirt gathers over the belt */}
          {[-70, -20, 30].map((vv, i) => (
            <path key={i} d={`M${P(bt(22, vv))} Q${P(bt(32, vv + 10))} ${P(bt(46, vv + 24))}`} fill="none" stroke="#0E1D33" strokeOpacity={0.22} strokeWidth={fmt(3 * s)} strokeLinecap="round" />
          ))}
          <ellipse cx={fmt(ct(96, -50).x)} cy={fmt(ct(96, -50).y)} rx={fmt(44 * s)} ry={fmt(14 * s)} transform={`rotate(${fmt(-tc - 30)} ${fmt(ct(96, -50).x)} ${fmt(ct(96, -50).y)})`} fill="#FFFFFF" opacity={0.16} />
          <ellipse cx={fmt(bt(80, -96).x)} cy={fmt(bt(80, -96).y)} rx={fmt(16 * s)} ry={fmt(34 * s)} transform={`rotate(${fmt(-p.torso + 12)} ${fmt(bt(80, -96).x)} ${fmt(bt(80, -96).y)})`} fill="#FFFFFF" opacity={0.14} />
        </g>
        {/* gold belt buckle */}
        <rect x={fmt(buckle.x - 15 * s)} y={fmt(buckle.y - 13 * s)} width={fmt(30 * s)} height={fmt(26 * s)} rx={fmt(4 * s)} transform={`rotate(${fmt(-p.torso)} ${fmt(buckle.x)} ${fmt(buckle.y)})`} fill={C.guardBadge} stroke={INK} strokeWidth={fmt(IN * 0.4)} />
        <rect x={fmt(buckle.x - 8 * s)} y={fmt(buckle.y - 6 * s)} width={fmt(16 * s)} height={fmt(12 * s)} rx={fmt(2 * s)} transform={`rotate(${fmt(-p.torso)} ${fmt(buckle.x)} ${fmt(buckle.y)})`} fill={GOLD_DEEP} opacity={0.8} />
        {/* chest badge: a gold shield with a star */}
        <path d={shield} fill={C.guardBadge} stroke={INK} strokeWidth={fmt(IN * 0.4)} strokeLinejoin="round" />
        <circle cx={fmt(badgeC.x)} cy={fmt(badgeC.y)} r={fmt(4.5 * s)} fill={GOLD_DEEP} />
        <ellipse cx={fmt(badgeC.x - 4 * s)} cy={fmt(badgeC.y - 6 * s)} rx={fmt(3.4 * s)} ry={fmt(1.8 * s)} fill="#FFFFFF" opacity={0.85} transform={`rotate(-30 ${fmt(badgeC.x - 4 * s)} ${fmt(badgeC.y - 6 * s)})`} />
        {/* collar */}
        <path d={collarB} fill={shade(o.shirt, 0.1)} stroke={INK} strokeWidth={fmt(IN * 0.5)} strokeLinejoin="round" />
        <path d={collarN} fill={lit(o.shirt, 0.12)} stroke={INK} strokeWidth={fmt(IN * 0.5)} strokeLinejoin="round" />
      </Deco>
      <GuardHead id={`${id}-hd`} c={j.head} R={GDIM.headR * s} roll={-(tc + p.neck)} turn={p.turn} expr={expr} blink={blink} inkW={7 * inkK} skin={o.skin} cap={o.cap} />
      {nearHold && <Deco>{nearHold}</Deco>}
      {nearSleeve.inner}
      {armGroup('la', j.L, false, lHand, 1)}
      {nearSleeve.body}
      {capOverHand && (
        <Deco>
          <GuardHead id={`${id}-hd2`} c={j.head} R={GDIM.headR * s} roll={-(tc + p.neck)} turn={p.turn} expr={expr} inkW={7 * inkK} skin={o.skin} cap={o.cap} capOnly />
        </Deco>
      )}
    </Inked>
  );
};

export const lerpG = (a: GPose, b: GPose, t: number): GPose => {
  const o = {} as GPose;
  (Object.keys(a) as (keyof GPose)[]).forEach((k) => (o[k] = lerp(a[k], b[k], t)));
  return o;
};

