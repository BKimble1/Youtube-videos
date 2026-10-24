// V2 shot A: the imagined street hook. A close 3/4 of the lead already swinging his right wrist into aim; the
// wrist shooter fires (frame 13), a tapered liquid head crosses to the runner in 9 frames while the camera rides
// along it, and on impact (frame 22) the adhesive spreads over the back of his jacket as connected strands and
// cross-links. The strand straightens, checks him (38), and he takes a recovery step while the camera settles and
// then pushes in toward the attachment (the start of the journey into the web).
// Three flat layers give the parallax: the lead near the lens (depth 0.55), the runner and the pavement (1), the
// street facades (2.6). Every value is a pure function of the frame.
import React from 'react';
import {Man, manJoints, ManPose, torsoPath} from './dc/Man';
import {limbGeo} from './dc/limb';
import {Cam, Layer} from './dc/camera';
import {lit, mix, shade} from './dc/color';
import {Deco, INK, Inked, InkLine} from './dc/ink';
import {add, clamp, fmt, len, lerp, lerpV, mul, norm, P as Pt, perp, rot, sub, V} from './dc/math';
import {Glow, Lin, SoftShadow} from './dc/shade';
import {mixExpr} from './dc/Head';
import {mixHand} from './dc/Hand';
import {BASE, EXPR_FIRE, EXPR_FOCUS, EXPR_RUN, EXPR_SHOCK, HAND_FIST, HAND_GRIP, HAND_READY, HAND_THWIP, HERO, RUNNER} from './cast2';
import {Bag, shooterGeo, WristShooter} from './props2';

export const D_NEAR = 0.55;
export const D_MID = 1;
export const D_BG = 2.6;

const sm = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const ss = (f: number, a: number, b: number) => sm((f - a) / (b - a));
const ss5 = (f: number, a: number, b: number) => {
  const x = clamp((f - a) / (b - a));
  return x * x * x * (x * (x * 6 - 15) + 10);
};

/** screen position of a point on a layer at depth d */
export const scr = (cam: Cam, d: number, p: V): V => {
  const z = 1 + (cam.z - 1) / d;
  const cx = 540 + (cam.x - 540) / d;
  const cy = 960 + (cam.y - 960) / d;
  return {x: 540 + (p.x - cx) * z, y: 960 + (p.y - cy) * z};
};
export const zOf = (cam: Cam, d: number) => 1 + (cam.z - 1) / d;

/** key frames of the hook */
export const SA = {fire: 13, hit: 22, taut: 38, push0: 52, end: 150};

// ---------------------------------------------------------------- the lead
const HS = 2.1;
const HERO0: ManPose = {...BASE, x: 930, y: 2200, s: HS, torso: 5, chest: 4, neck: -10, turn: 0.5, rW: 1, rFa: 0.75, rElb: 1, lTu: -250, lTv: 40, lElb: -1, lWr: 10};
const polar = (o: V, a: number, r: number): V => ({x: o.x + Math.cos((a * Math.PI) / 180) * r, y: o.y + Math.sin((a * Math.PI) / 180) * r});
export const heroAt = (f: number) => {
  // the swing is already under way at frame 0 (it started at -6), arriving at the aim at 10 with a small overshoot
  const u = ss(f, -6, 10);
  const over = Math.sin(clamp((f - 8) / 8) * Math.PI) * 4;
  const recoil = f < SA.fire ? 0 : Math.sin(clamp((f - SA.fire) / 4) * Math.PI * 0.5) * (1 - ss(f, SA.fire + 4, SA.fire + 12)) * 24;
  const shoulder = manJoints({...HERO0, rWx: 0, rWy: 0}).R.S;
  const ang = lerp(-166, -117, u) - over;
  const r = lerp(377, 597, u) - recoil;
  const T = polar(shoulder, ang, r);
  const wr = lerp(8, 26, ss(f, 0, 10)) - 8 * (recoil / 24);
  const pose: ManPose = {...HERO0, rWx: T.x, rWy: T.y, rWr: wr, torso: lerp(5, 9, ss(f, -4, 10)), chest: lerp(4, 7, ss(f, -4, 10)), neck: lerp(-10, -14, ss(f, 0, 12))};
  const expr = mixExpr(EXPR_FOCUS, EXPR_FIRE, ss(f, 10, 13));
  const hand = mixHand(HAND_READY, HAND_THWIP, ss(f, 8, 12));
  return {pose, expr, hand, hairSway: -6 * Math.sin(clamp((f + 6) / 18) * Math.PI) + 3 * Math.sin(clamp((f - SA.fire) / 10) * Math.PI)};
};
export const heroOutlet = (f: number) => {
  const h = heroAt(f);
  const j = manJoints(h.pose);
  return shooterGeo(j.R.E, j.R.W, 17 * HS, -1);
};

// ---------------------------------------------------------------- the runner
const RS = 0.62;
/** hip x at frame -40 (staged so he is in the frame at 0, ahead of the lead's aim) */
const RUN_X0 = 1326;
export const GROUND = 1068;
const R0: ManPose = {...BASE, x: 0, y: 0, s: RS, torso: 16, chest: 6, neck: -10, turn: 0.42, lElb: 1, rElb: -1, lWr: 0, rWr: 0};
/** run-cycle phase (cycles); the legs stop as the strand checks him */
const SPD = 1 / 22;
const spd = (f: number) => SPD * (1 - ss(f, SA.taut - 2, SA.taut + 6));
const phaseAt = (f: number) => {
  let p = 0.15;
  for (let g = -40; g < f; g += 0.5) p += spd(g + 0.25) * 0.5;
  return p;
};
const runLimbs = (ph: number, f: number): Partial<ManPose> => {
  const th = ph * 2 * Math.PI;
  const thR = th + Math.PI;
  const knee = (t: number) => 14 + 70 * Math.max(0, Math.cos(t)) ** 1.4;
  const arm = (t: number) => (1 - Math.sin(t)) / 2; // 1 = forward when that leg is back
  const aL = arm(th);
  const k = ss(f, SA.taut - 1, SA.taut + 6); // yanked
  const step = ss(f, SA.taut + 8, SA.taut + 18); // recovery step (far leg back)
  const lift = Math.sin(clamp((f - SA.taut - 8) / 10) * Math.PI);
  // the web lands on his near shoulder and glues that arm to his side
  const pin = ss(f, SA.hit, SA.hit + 7);
  const runLTu = lerp(lerp(-165, -40, aL), 10, k);
  const runLTv = lerp(lerp(10, -130, aL), -150, k);
  return {
    lHip: lerp(26 * Math.sin(th), 22, k),
    lKnee: lerp(knee(th), 14, k),
    rHip: lerp(26 * Math.sin(thR), lerp(-22, -38, step), k),
    rKnee: lerp(knee(thR), 26 + 46 * lift, k),
    lTu: lerp(runLTu, -150, pin),
    lTv: lerp(runLTv, 24, pin),
    rTu: lerp(lerp(-160, -200, aL), -175, k),
    rTv: lerp(lerp(40, 150, aL), -70, k),
    torso: lerp(16, -8, k) + 4 * lift,
    chest: lerp(6, -6, k),
    neck: lerp(-10, 6, k),
    turn: lerp(0.42, 0.04, ss(f, SA.taut + 1, SA.taut + 7)),
  };
};
/** world pose with the stance foot (the lower ankle) kept planted: the hips move only as the legs carry them */
const runnerCache = new Map<number, {pose: ManPose; plant: V}>();
export const runnerAt = (f: number): ManPose => {
  const key = Math.round(f * 100);
  const hit = runnerCache.get(key);
  if (hit) return hit.pose;
  let hip: V = {x: RUN_X0, y: 0};
  let stance: 'l' | 'r' | null = null;
  let plant: V = {x: 0, y: GROUND};
  let pose: ManPose = R0;
  for (let g = -40; g <= f + 1e-6; g += 0.5) {
    const gg = Math.min(g, f);
    const rel: ManPose = {...R0, ...runLimbs(phaseAt(gg), gg)};
    const j = manJoints(rel);
    const sole = (A: V) => ({x: A.x, y: A.y + 30 * RS});
    const sl = sole(j.lLeg.A);
    const sr = sole(j.rLeg.A);
    // the left foot carries him while its leg sweeps from front to back (cos of its phase angle < 0)
    const st = gg > SA.taut + 2 || Math.cos(phaseAt(gg) * 2 * Math.PI) < 0 ? 'l' : 'r';
    const s = st === 'l' ? sl : sr;
    if (st !== stance) {
      plant = {x: hip.x + s.x, y: GROUND};
      stance = st;
    }
    hip = {x: plant.x - s.x, y: GROUND - s.y};
    pose = {...rel, x: hip.x, y: hip.y};
    if (g >= f) break;
  }
  runnerCache.set(key, {pose, plant});
  return pose;
};
export const runnerExpr = (f: number) => mixExpr(EXPR_RUN, EXPR_SHOCK, ss(f, SA.taut + 2, SA.taut + 6));
const bagSwing = (f: number) => {
  const ph = phaseAt(f);
  const run = 16 + 12 * Math.sin(ph * 4 * Math.PI - 0.8);
  const t = f - SA.taut;
  const yank = t <= 0 ? 0 : -52 * Math.sin(Math.min(t / 6, 1) * Math.PI * 0.5) * Math.exp(-Math.max(0, t - 6) / 10) + -10 * Math.sin(Math.max(0, t - 6) * 0.45) * Math.exp(-Math.max(0, t - 6) / 12);
  return lerp(run, 0, ss(f, SA.taut, SA.taut + 4)) + yank;
};

/** torso-local point (u up the spine from the waist, v toward his back) in world coordinates */
const tloc = (p: ManPose, u: number, v: number) => {
  const j = manJoints(p);
  const a = j.tc;
  const up = {x: -Math.sin((a * Math.PI) / 180), y: -Math.cos((a * Math.PI) / 180)};
  const px = {x: Math.cos((a * Math.PI) / 180), y: -Math.sin((a * Math.PI) / 180)};
  return add(j.C, add(mul(up, u * p.s), mul(px, v * p.s)));
};
/** the attachment on his upper back (torso-local) */
export const ATT = {u: 118, v: 52};
export const attachAt = (f: number) => tloc(runnerAt(f), ATT.u, ATT.v);

// ---------------------------------------------------------------- the web on the jacket
type Strand = {a: number; len: number; bend: number; delay: number; branch?: {at: number; a: number; len: number}};
const STRANDS: Strand[] = [
  {a: 0, len: 120, bend: 9, delay: 0, branch: {at: 0.55, a: 34, len: 46}},
  {a: 36, len: 104, bend: -8, delay: 0.5},
  {a: 72, len: 150, bend: 12, delay: 0.2, branch: {at: 0.6, a: -30, len: 44}},
  {a: 108, len: 132, bend: -9, delay: 0.8},
  {a: 146, len: 118, bend: 8, delay: 0.3, branch: {at: 0.5, a: 28, len: 50}},
  {a: 184, len: 110, bend: -10, delay: 0.6},
  {a: 222, len: 126, bend: 9, delay: 0.1, branch: {at: 0.55, a: -32, len: 48}},
  {a: 262, len: 100, bend: -6, delay: 0.7},
  {a: 300, len: 116, bend: 10, delay: 0.4, branch: {at: 0.6, a: 30, len: 44}},
  {a: 332, len: 96, bend: -7, delay: 0.9},
];
const RINGS = [0.3, 0.55, 0.78, 0.96];
/** overall size of the web on the jacket */
const WEB_K = 1.45;
/** spread 0..1 of strand i at frame f (fast ease-out from the impact), and the settle (0 slack .. 1 tight) */
const spreadAt = (f: number, i: number) => {
  const d = STRANDS[i].delay * 2.2;
  const x = clamp((f - SA.hit - d) / 8);
  return 1 - (1 - x) ** 4;
};
const tightAt = (f: number) => ss(f, SA.hit + 12, SA.taut + 4);

export const WebSplat: React.FC<{id: string; f: number; pose: ManPose; ink: number}> = ({id, f, pose, ink}) => {
  if (f < SA.hit) return null;
  const s = pose.s;
  const j = manJoints(pose);
  const a0 = j.tc;
  const c = tloc(pose, ATT.u, ATT.v);
  // local frame on the back: x along the torso's across axis, y along the spine (down)
  const ex = {x: Math.cos((a0 * Math.PI) / 180), y: -Math.sin((a0 * Math.PI) / 180)};
  const ey = {x: Math.sin((a0 * Math.PI) / 180), y: Math.cos((a0 * Math.PI) / 180)};
  // the back is seen obliquely: across the torso the web is compressed
  const L = (x: number, y: number) => add(c, add(mul(ex, x * 0.78 * s * WEB_K), mul(ey, y * s * WEB_K)));
  const tight = tightAt(f);
  const shrink = 1 - 0.07 * tight;
  const ends: V[] = [];
  const paths: string[] = [];
  const thin: string[] = [];
  STRANDS.forEach((st, i) => {
    const sp = spreadAt(f, i);
    const r = st.len * sp * shrink;
    const ar = (st.a * Math.PI) / 180;
    const dir = {x: Math.cos(ar), y: Math.sin(ar)};
    const n = {x: -dir.y, y: dir.x};
    const bend = st.bend * (1 - 0.8 * tight);
    const end = {x: dir.x * r, y: dir.y * r};
    const mid = {x: dir.x * r * 0.5 + n.x * bend, y: dir.y * r * 0.5 + n.y * bend};
    ends.push(end);
    paths.push(`M${Pt(L(0, 0))} Q${Pt(L(mid.x, mid.y))} ${Pt(L(end.x, end.y))}`);
    if (st.branch && sp > st.branch.at) {
      const b = st.branch;
      const bs = clamp((sp - b.at) / (1 - b.at));
      const o = {x: dir.x * st.len * shrink * b.at, y: dir.y * st.len * shrink * b.at};
      const ba = ar + (b.a * Math.PI) / 180;
      const bl = b.len * bs * shrink;
      thin.push(`M${Pt(L(o.x, o.y))} L${Pt(L(o.x + Math.cos(ba) * bl, o.y + Math.sin(ba) * bl))}`);
    }
  });
  // cross-links between neighbouring strands: they appear as the spread passes them and pull straight as it settles
  const links: string[] = [];
  RINGS.forEach((rk, ri) => {
    STRANDS.forEach((st, i) => {
      const k = (i + 1) % STRANDS.length;
      const s1 = spreadAt(f - 2 - ri * 1.5, i);
      const s2 = spreadAt(f - 2 - ri * 1.5, k);
      if (s1 < rk || s2 < rk) return;
      const a1 = (st.a * Math.PI) / 180;
      const a2 = (STRANDS[k].a * Math.PI) / 180;
      const r1 = Math.min(st.len, STRANDS[k].len) * rk * shrink;
      const p1 = {x: Math.cos(a1) * r1, y: Math.sin(a1) * r1};
      const p2 = {x: Math.cos(a2) * r1, y: Math.sin(a2) * r1};
      const m = {x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2};
      const sag = 0.18 * (1 - tight) + 0.03;
      const mm = {x: m.x * (1 - sag), y: m.y * (1 - sag)};
      links.push(`M${Pt(L(p1.x, p1.y))} Q${Pt(L(mm.x, mm.y))} ${Pt(L(p2.x, p2.y))}`);
    });
  });
  // the impact pad: the liquid head squashes and flattens into an adhesive pad
  const sq = clamp((f - SA.hit) / 4);
  const padR = lerp(14, 26, sq) * s;
  const padC = mix('#F6D77A', '#FFFFFF', ss(f, SA.hit + 2, SA.hit + 10));
  // jacket creases where the strands pull on it (they appear as the web tightens and the strand checks him)
  const crease = ss(f, SA.taut - 2, SA.taut + 6);
  const creases = [20, 110, 200, 290].map((ad) => {
    const ar = (ad * Math.PI) / 180;
    const r0 = 24;
    const r1 = 52;
    return `M${Pt(L(Math.cos(ar + 0.25) * r0, Math.sin(ar + 0.25) * r0))} Q${Pt(L(Math.cos(ar + 0.12) * 38, Math.sin(ar + 0.12) * 38))} ${Pt(L(Math.cos(ar) * r1, Math.sin(ar) * r1))}`;
  });
  const clipD = torsoPath(pose);
  const armD = limbGeo(j.L.S, j.L.E, j.L.W, 29 * s, 23.5 * s, 21 * s).d;
  const w = 5.2 * s;
  return (
    <g>
      <defs>
        <clipPath id={`${id}-tc`}>
          <path d={clipD} />
          <path d={armD} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}-tc)`}>
        {crease > 0.01 && creases.map((d, i) => <path key={i} d={d} fill="none" stroke={shade(RUNNER.shirt, 0.5)} strokeWidth={fmt(3 * s)} strokeLinecap="round" opacity={0.55 * crease} />)}
        {/* soft shadow of the web on the jacket */}
        <g opacity={0.35} transform={`translate(${fmt(2 * s)} ${fmt(3 * s)})`}>
          {[...paths, ...links].map((d, i) => (
            <path key={i} d={d} fill="none" stroke="#14201C" strokeWidth={fmt(w * 1.6)} strokeLinecap="round" />
          ))}
        </g>
        {[...paths, ...links, ...thin].map((d, i) => (
          <path key={`k${i}`} d={d} fill="none" stroke={INK} strokeWidth={fmt(w + ink * 0.7)} strokeLinecap="round" opacity={0.85} />
        ))}
        {paths.map((d, i) => (
          <path key={`w${i}`} d={d} fill="none" stroke="#FFFFFF" strokeWidth={fmt(w)} strokeLinecap="round" />
        ))}
        {links.map((d, i) => (
          <path key={`l${i}`} d={d} fill="none" stroke="#F4F7FA" strokeWidth={fmt(w * 0.72)} strokeLinecap="round" />
        ))}
        {thin.map((d, i) => (
          <path key={`t${i}`} d={d} fill="none" stroke="#F4F7FA" strokeWidth={fmt(w * 0.6)} strokeLinecap="round" />
        ))}
        {/* small adhesive beads where strands meet the cloth */}
        {ends.map((e, i) => {
          const p = L(e.x, e.y);
          return spreadAt(f, i) > 0.85 ? <circle key={`e${i}`} cx={fmt(p.x)} cy={fmt(p.y)} r={fmt(w * 0.9)} fill="#FFF8E2" stroke={INK} strokeWidth={fmt(ink * 0.35)} /> : null;
        })}
      </g>
      <ellipse cx={fmt(c.x)} cy={fmt(c.y)} rx={fmt(padR * 1.15)} ry={fmt(padR * 0.85)} transform={`rotate(${fmt(-a0)} ${fmt(c.x)} ${fmt(c.y)})`} fill={padC} stroke={INK} strokeWidth={fmt(ink * 0.6)} />
      <ellipse cx={fmt(c.x - padR * 0.3)} cy={fmt(c.y - padR * 0.3)} rx={fmt(padR * 0.4)} ry={fmt(padR * 0.2)} fill="#FFFFFF" opacity={0.8} />
    </g>
  );
};

// ---------------------------------------------------------------- the camera
const C0: Cam = {x: 540, y: 960, z: 1};
const HOLD_Z = 3.0;
/** framing of the runner after the hit: the attachment at (520, 840) on screen */
const holdCam = (f: number, z: number): Cam => {
  const a = attachAt(f);
  return {x: a.x - (650 - 540) / z, y: a.y - (800 - 960) / z, z};
};
export const streetCam = (f: number): Cam => {
  const pre: Cam = {x: 540 - 10 * ss(f, -4, 12), y: 960 - 12 * ss(f, -4, 12), z: 1};
  if (f < SA.fire) return pre;
  // ride along the jet to the runner (log-zoom so the push feels like travel), then hold on him
  const u = ss5(f, SA.fire, SA.hit);
  const z1 = HOLD_Z + 0.2 * ss(f, SA.hit, SA.push0);
  // the framing follows him with a little lag, so his jolt reads against the frame
  const target = holdCam(f <= SA.hit ? f : Math.max(SA.hit, f - 2), z1);
  const z = Math.exp(lerp(Math.log(pre.z), Math.log(target.z), u));
  // keep the jet head's path on screen during the ride: blend the centre in screen-consistent terms
  let cam: Cam = {x: lerp(pre.x, target.x, u), y: lerp(pre.y, target.y, u), z};
  if (f > SA.push0) {
    const p = ss5(f, SA.push0, SA.end);
    const zz = Math.exp(lerp(Math.log(z1), Math.log(40), p));
    const a = attachAt(f);
    const sc = lerpV({x: 650, y: 800}, {x: 540, y: 900}, ss(f, SA.push0, SA.push0 + 30));
    cam = {x: a.x - (sc.x - 540) / zz, y: a.y - (sc.y - 960) / zz, z: zz};
  }
  return cam;
};

// ---------------------------------------------------------------- the jet and the strand (screen space)
/** jet head progress 0..1 from the outlet to the jacket */
const flight = (f: number) => clamp((f - SA.fire) / (SA.hit - SA.fire)) ** 0.85;
export const strandEnds = (f: number) => {
  const cam = streetCam(f);
  const o = scr(cam, D_NEAR, heroOutlet(f).outlet);
  const a = scr(cam, D_MID, attachAt(f));
  return {o, a, cam};
};

const Ribbon: React.FC<{pts: V[]; w0: number; w1: number; color: string; ink: number; opacity?: number}> = ({pts, w0, w1, color, ink, opacity = 1}) => {
  if (pts.length < 2) return null;
  const left: V[] = [];
  const right: V[] = [];
  pts.forEach((p, i) => {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    const n = perp(norm(sub(b, a)));
    const w = lerp(w0, w1, i / (pts.length - 1)) / 2;
    left.push(add(p, mul(n, w)));
    right.push(add(p, mul(n, -w)));
  });
  const d = `M${left.map(Pt).join(' L')} L${right.reverse().map(Pt).join(' L')} Z`;
  return (
    <g opacity={opacity}>
      <path d={d} fill={INK} stroke={INK} strokeWidth={fmt(ink)} strokeLinejoin="round" />
      <path d={d} fill={color} />
    </g>
  );
};

const Jet: React.FC<{f: number}> = ({f}) => {
  if (f < SA.fire) return null;
  const {o, a, cam} = strandEnds(f);
  const zM = zOf(cam, D_MID);
  const zN = zOf(cam, D_NEAR);
  const u = flight(f);
  const d = sub(a, o);
  const n = perp(norm(d));
  // the path bows a little upward (the jet is thrown, then falls onto him)
  const bow = (t: number) => -Math.sin(t * Math.PI) * len(d) * 0.05;
  const at = (t: number) => add(lerpV(o, a, t), mul(n, bow(t) * (norm(d).x < 0 ? -1 : 1)));
  if (f < SA.hit) {
    const head = at(u);
    const N = 24;
    const pts = Array.from({length: N + 1}, (_, i) => at((u * i) / N));
    const hd = norm(sub(head, at(Math.max(0, u - 0.03))));
    const hr = lerp(30, 24, u) * (0.75 + 0.25 * zM);
    const tip = add(head, mul(hd, hr * 2.6));
    const back = add(head, mul(hd, -hr * 1.2));
    const hn = perp(hd);
    const drop = `M${Pt(tip)} Q${Pt(add(head, mul(hn, hr * 1.1)))} ${Pt(add(back, mul(hn, hr * 0.8)))} Q${Pt(add(back, mul(hd, -hr * 0.9)))} ${Pt(add(back, mul(hn, -hr * 0.8)))} Q${Pt(add(head, mul(hn, -hr * 1.1)))} ${Pt(tip)} Z`;
    return (
      <g>
        {/* the column behind the head: still liquid gold near the head, a white fibre behind */}
        <Ribbon pts={pts} w0={11} w1={hr * 0.62} color="#FBF3DC" ink={3.5} />
        {/* speed smear: short trailing filaments behind the head */}
        {[-1, 0, 1].map((k) => {
          const s0 = add(back, mul(hn, k * hr * 0.55));
          const s1 = add(s0, mul(hd, -hr * (5 + 2 * Math.abs(k))));
          return <path key={k} d={`M${Pt(s0)} L${Pt(s1)}`} stroke="#FFF1C4" strokeWidth={fmt(hr * 0.28)} strokeLinecap="round" opacity={0.6 - 0.15 * Math.abs(k)} />;
        })}
        <path d={drop} fill="#F6D77A" stroke={INK} strokeWidth={3} />
        <ellipse cx={fmt(head.x - hn.x * hr * 0.3)} cy={fmt(head.y - hn.y * hr * 0.3)} rx={fmt(hr * 0.7)} ry={fmt(hr * 0.3)} transform={`rotate(${fmt((Math.atan2(hd.y, hd.x) * 180) / Math.PI)} ${fmt(head.x - hn.x * hr * 0.3)} ${fmt(head.y - hn.y * hr * 0.3)})`} fill="#FFFFFF" opacity={0.85} />
      </g>
    );
  }
  // after the hit: one strand from the outlet to the pad; slack at first, taut when it checks him
  const slack = (1 - ss(f, SA.hit + 4, SA.taut)) * 0.06 + 0.004;
  const N = 28;
  const pts = Array.from({length: N + 1}, (_, i) => {
    const t = i / N;
    return add(lerpV(o, a, t), {x: 0, y: Math.sin(t * Math.PI) * len(d) * slack});
  });
  return <Ribbon pts={pts} w0={9} w1={5.2 * RS * zM} color="#FBF8F0" ink={3} />;
};

// ---------------------------------------------------------------- the street
const Facades: React.FC<{id: string}> = ({id}) => (
  <g>
    <Lin id={`${id}-sky`} d="M-900,-1400 h2900 v1500 h-2900 Z" from={{x: 0, y: -1400}} to={{x: 0, y: 200}} stops={[[0, '#5B6E93'], [0.6, '#E9A884'], [1, '#F5C99A']]} />
    {/* left block: terracotta, lit and dark windows */}
    <path d="M-900,-900 L600,-900 L600,1010 L-900,1010 Z" fill="#B9614E" />
    <path d="M520,-900 L600,-900 L600,1010 L520,1010 Z" fill={shade('#B9614E', 0.25)} />
    {Array.from({length: 5}).map((_, r) =>
      Array.from({length: 6}).map((_, c) => {
        const x = -780 + c * 220;
        const y = -760 + r * 300;
        const litW = (r * 7 + c * 3) % 5 < 2;
        return <rect key={`${r}-${c}`} x={x} y={y} width={120} height={170} rx={8} fill={litW ? '#FFD98A' : '#3F5566'} stroke={shade('#B9614E', 0.5)} strokeWidth={10} />;
      }),
    )}
    {/* right block: grey-teal, a lit shop window and a coral awning at street level */}
    <path d="M640,-900 L2000,-900 L2000,1010 L640,1010 Z" fill="#5F8C94" />
    <path d="M-900,1000 L2000,1000 L2000,2600 L-900,2600 Z" fill="#9A9088" />
    {Array.from({length: 3}).map((_, r) =>
      Array.from({length: 5}).map((_, c) => {
        const x = 700 + c * 240;
        const y = -740 + r * 300;
        const litW = (r * 5 + c * 2) % 4 === 1;
        return <rect key={`b${r}-${c}`} x={x} y={y} width={130} height={180} rx={8} fill={litW ? '#FFE3A8' : '#2F4A55'} stroke={shade('#5F8C94', 0.45)} strokeWidth={10} />;
      }),
    )}
    <rect x={700} y={720} width={1100} height={290} fill="#FFE3A8" />
    <Glow id={`${id}-sg`} c={{x: 1100, y: 860}} r={520} ry={260} color="#FFD27A" alpha={0.5} />
    <path d="M660,640 L1900,640 L1860,730 L700,730 Z" fill="#E06C5A" />
    {Array.from({length: 10}).map((_, i) => <path key={i} d={`M${700 + i * 120},640 l60,0 l-6,90 l-60,0 Z`} fill="#F3EDE4" opacity={0.85} />)}
    {/* lamp post */}
    <rect x={610} y={160} width={22} height={850} fill="#2C3A44" />
    <circle cx={621} cy={150} r={34} fill="#FFF0C2" />
    <Glow id={`${id}-lg`} c={{x: 621, y: 150}} r={260} color="#FFE7A6" alpha={0.55} />
  </g>
);

const Pavement: React.FC<{id: string}> = ({id}) => (
  <g>
    <Lin id={`${id}-pv`} d="M-1500,990 h4000 v2400 h-4000 Z" from={{x: 0, y: 990}} to={{x: 0, y: 2200}} stops={[[0, '#B8ADA2'], [0.5, '#A79C92'], [1, '#8E857D']]} />
    {[1040, 1130, 1260, 1450, 1730].map((y, i) => <path key={i} d={`M-1500,${y} H2500`} stroke="#7F766F" strokeWidth={4 + i * 2} opacity={0.5} />)}
    <path d="M-1500,990 H2500" stroke={shade('#B8ADA2', 0.4)} strokeWidth={10} />
  </g>
);

// ---------------------------------------------------------------- the shot
export const StreetScene2: React.FC<{f: number}> = ({f}) => {
  const id = `s${Math.round(f * 100)}`;
  const cam = streetCam(f);
  const h = heroAt(f);
  const jh = manJoints(h.pose);
  const rp = runnerAt(f);
  const jr = manJoints(rp);
  const showHero = scr(cam, D_NEAR, jh.R.W).x < 1600 && scr(cam, D_NEAR, jh.R.W).y < 2600;
  const fire = f >= SA.fire ? Math.exp(-(f - SA.fire) / 3) : 0;
  const zM = zOf(cam, D_MID);
  const blurBg = 2.2 + 1.2 * clamp((cam.z - 1) / 2);
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
      <defs>
        <filter id={`${id}-bb`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={fmt(blurBg / zOf(cam, D_BG))} />
        </filter>
      </defs>
      <Layer cam={cam} depth={D_BG}>
        <g filter={`url(#${id}-bb)`}>
          <Facades id={`${id}-fc`} />
        </g>
      </Layer>
      <Layer cam={cam} depth={D_MID}>
        <Pavement id={`${id}-pv`} />
        <SoftShadow id={`${id}-rs`} c={{x: rp.x - 10, y: GROUND - 4}} rx={130 * RS * 1.4} ry={22} alpha={0.32} color="#3A2E28" />
        <Man id={`${id}-rn`} pose={rp} expr={runnerExpr(f)} lHand={HAND_READY} rHand={HAND_GRIP} outfit={RUNNER} inkK={zM > 2 ? 0.8 : 1}
          afterRightArm={<Bag id={`${id}-bg`} hand={add(jr.R.W, mul(jr.R.foreDir, 20 * RS))} swing={bagSwing(f)} s={RS} ink={7 * 0.72 * RS} />}
          overAll={<WebSplat id={`${id}-ws`} f={f} pose={rp} ink={7 * 0.72 * RS} />} />
      </Layer>
      {showHero && (
        <Layer cam={cam} depth={D_NEAR}>
          <Man id={`${id}-hr`} pose={h.pose} expr={h.expr} lHand={HAND_FIST} rHand={h.hand} outfit={HERO} hairSway={h.hairSway}
            afterRightArm={<WristShooter id={`${id}-sh`} E={jh.R.E} W={jh.R.W} rW={17 * HS} side={-1} ink={7 * 0.72 * HS} fire={fire} />} />
        </Layer>
      )}
      <Jet f={f} />
    </svg>
  );
};
