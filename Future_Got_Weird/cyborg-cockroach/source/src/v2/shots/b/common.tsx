// Group B shared helpers: the white experiment tray (flat, in insect millimetres through an ortho view), the gloved
// researcher arm (coat sleeve + glove cuff + v2/dc/Hand), a fingertip grip solver (so the index and thumb tips land on
// the backpack's edges), the backpack's wires while it is carried (slack from the board to the implanted electrodes),
// a smooth turning path and the pulse train along the antenna wire. Everything is a pure function of its inputs.
import React from 'react';
import {V2, V3, Frame, toW, add as add3, sub as sub3, mul as mul3} from '../../../lib/v3';
import {INK, Inked, Deco, InkLine} from '../../../lib/ink';
import {Capsule, SoftShadow} from '../../../lib/shade';
import {add, mul, perp, rad, V} from '../../../lib/math';
import {shade as shadeC} from '../../../lib/color';
import {clamp, smoother, rnd} from '../../../lib/ease';
import {wiresOn} from '../../../rig/gear';
import {Path} from '../../../rig/roach';
import {Hand, HandPose, digitTips} from '../../dc/Hand';
import {View, P, f2, polyD, smoothOpen} from '../../roach/ortho';
import {G2} from '../../roach/Gear2D';
import {LAB2, Box2D} from '../../sets/Lab2';
import {GLOVE, COAT} from '../../../crew/operator';

export const FPS = 30;

// ------------------------------------------------------------------ the tray
/** the white tray on the dark bench top: a world rectangle (x0..x1, z0..z1) at y = 0 with a raised rim and a faint
 *  grid (the grid lets a tracking view read the motion) */
export const Tray2D: React.FC<{v: View; x0: number; x1: number; z0: number; z1: number; grid?: number; rim?: number; bench?: boolean}> = ({v, x0, x1, z0, z1, grid = 20, rim = 9, bench = true}) => {
  const q = (a: number, b: number, c: number, d: number, y = 0) => polyD([P(v, [a, y, c]), P(v, [b, y, c]), P(v, [b, y, d]), P(v, [a, y, d])]);
  const ls: React.ReactNode[] = [];
  const gc = shadeC(LAB2.surface, 0.07);
  if (grid > 0) {
    for (let x = Math.ceil((x0 + rim) / grid) * grid; x <= x1 - rim; x += grid) {
      const a = P(v, [x, 0, z0 + rim]), b = P(v, [x, 0, z1 - rim]);
      ls.push(<path key={`x${x}`} d={`M${f2(a[0])},${f2(a[1])} L${f2(b[0])},${f2(b[1])}`} stroke={gc} strokeWidth={1.6} />);
    }
    for (let z = Math.ceil((z0 + rim) / grid) * grid; z <= z1 - rim; z += grid) {
      const a = P(v, [x0 + rim, 0, z]), b = P(v, [x1 - rim, 0, z]);
      ls.push(<path key={`z${z}`} d={`M${f2(a[0])},${f2(a[1])} L${f2(b[0])},${f2(b[1])}`} stroke={gc} strokeWidth={1.6} />);
    }
  }
  return (
    <g>
      {bench && <path d={q(x0 - 3000, x1 + 3000, z0 - 3000, z1 + 3000, -6)} fill={LAB2.benchTop} />}
      {/* rim: the tray's outer edge a little raised, a pale grey band, the floor inside */}
      <path d={q(x0, x1, z0, z1, 0)} fill={LAB2.surfaceShade} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <path d={q(x0 + rim * 0.35, x1 - rim * 0.35, z0 + rim * 0.35, z1 - rim * 0.35, 0)} fill="#DCE4E8" />
      <path d={q(x0 + rim, x1 - rim, z0 + rim, z1 - rim, 0)} fill={LAB2.surface} />
      {ls}
    </g>
  );
};

/** a soft ground shadow under a world box footprint, pushed away from the key light (screen down-right) */
export const BoxShadow: React.FC<{id: string; v: View; b: [number, number, number, number, number, number]; push?: V2; alpha?: number}> = ({id, v, b, push = [10, 12], alpha = 0.16}) => {
  const [x0, x1, , , z0, z1] = b;
  const pts = [P(v, [x0, 0, z0]), P(v, [x1, 0, z0]), P(v, [x1, 0, z1]), P(v, [x0, 0, z1])].map((p) => [p[0] + push[0], p[1] + push[1]] as V2);
  return (
    <g>
      <defs>
        <filter id={`${id}-bl`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
      </defs>
      <path d={polyD(pts)} fill="#1A1612" opacity={alpha} filter={`url(#${id}-bl)`} />
    </g>
  );
};

// ------------------------------------------------------------------ the gloved researcher arm
export type ArmPose = {wrist: V; ang: number; L: number; ts: 1 | -1; pose: HandPose; fore: number};
/** a gloved hand on its forearm (white coat sleeve, the glove's cuff over it), the Weird Crew hand (back view) */
export const GloveArm: React.FC<{id: string; a: ArmPose; ink?: number; shadow?: {alpha: number; offset: V}}> = ({id, a, ink = 11, shadow}) => {
  const {wrist, ang, L, ts, pose, fore} = a;
  const dir = {x: Math.cos(rad(ang)), y: Math.sin(rad(ang))};
  const fdir = {x: Math.cos(rad(fore)), y: Math.sin(rad(fore))};
  const nf = perp(fdir);
  const wristBase = add(wrist, mul(dir, -0.02 * L));
  const cuffEnd = add(wristBase, mul(fdir, 0.34 * L));
  const elbow = add(wristBase, mul(fdir, 2.4 * L));
  const cuffR = 0.215 * L;
  const OUT = ink * 1.25;
  return (
    <g>
      {shadow && <SoftShadow id={`${id}-sh`} c={add(add(wrist, mul(dir, 0.3 * L)), shadow.offset)} rx={0.75 * L} ry={0.42 * L} alpha={shadow.alpha} rotate={ang} color="#1A1612" />}
      {shadow && <SoftShadow id={`${id}-sa`} c={add(add(wristBase, mul(fdir, 0.9 * L)), shadow.offset)} rx={1.0 * L} ry={0.3 * L} alpha={shadow.alpha * 0.8} rotate={fore} color="#1A1612" />}
      <Inked w={OUT}>
        <Inked w={ink}>
          <Capsule id={`${id}-fa`} a={elbow} b={add(cuffEnd, mul(fdir, -0.12 * L))} ra={0.34 * L} rb={0.2 * L} color={COAT} spec={0.22} />
          <Capsule id={`${id}-cf`} a={cuffEnd} b={add(wristBase, mul(dir, 0.06 * L))} ra={cuffR} rb={0.19 * L} color={GLOVE} spec={0.1} />
          <Hand id={`${id}-h`} wrist={wrist} ang={ang} L={L} thumbSide={ts} view="back" pose={pose} color={GLOVE} ink={ink * 0.95} bare sheen={0.35} />
        </Inked>
        <Deco>
          <InkLine d={`M${f2(cuffEnd.x + nf.x * cuffR * 0.96)},${f2(cuffEnd.y + nf.y * cuffR * 0.96)} Q${f2(cuffEnd.x + fdir.x * 0.05 * L)},${f2(cuffEnd.y + fdir.y * 0.05 * L)} ${f2(cuffEnd.x - nf.x * cuffR * 0.96)},${f2(cuffEnd.y - nf.y * cuffR * 0.96)}`} w={ink * 0.5} opacity={0.7} />
        </Deco>
      </Inked>
    </g>
  );
};

/** the pinch pose family: index curl c, thumb angle th; the middle, ring and little fingers tucked */
export const pinchPose = (c: number, th: number, tc = 0.3): HandPose => ({curl: [c, 0.9, 0.94, 0.96], spread: 0.1, thumb: th, thumbCurl: tc});
export const OPEN_POSE: HandPose = {curl: [0.1, 0.14, 0.18, 0.24], spread: 0.6, thumb: 40, thumbCurl: 0.15};
export const mixPose = (a: HandPose, b: HandPose, t: number): HandPose => ({
  curl: a.curl.map((c, i) => c + (b.curl[i] - c) * t) as HandPose['curl'],
  spread: a.spread + (b.spread - a.spread) * t,
  thumb: a.thumb + (b.thumb - a.thumb) * t,
  thumbCurl: a.thumbCurl + (b.thumbCurl - a.thumbCurl) * t,
});

/** solve a pinch: the index tip on I and the thumb tip on T, the hand's axis near angPref (deg). Brute force over the
 *  axis angle, the index curl and the thumb angle (memoised by the caller: it runs once per shot). */
export const solvePinch = (I: V, T: V, angPref: number, L: number, ts: 1 | -1): {wrist: V; ang: number; pose: HandPose; err: number} => {
  let best = {wrist: I, ang: angPref, pose: pinchPose(0.5, 30), err: 1e18};
  const tryOne = (ang: number, c: number, th: number) => {
    const pose = pinchPose(c, th);
    const d0 = digitTips({x: 0, y: 0}, ang, L, ts, pose);
    const wrist = {x: I.x - d0.tips[0].x, y: I.y - d0.tips[0].y};
    const tx = d0.thumb.x + wrist.x - T.x, ty = d0.thumb.y + wrist.y - T.y;
    const err = tx * tx + ty * ty + 0.6 * (ang - angPref) * (ang - angPref) * (L / 100) * (L / 100) * 0.02;
    if (err < best.err) best = {wrist, ang, pose, err};
  };
  for (let ang = angPref - 30; ang <= angPref + 30; ang += 2) for (let c = 0.1; c <= 0.95; c += 0.05) for (let th = 0; th <= 100; th += 4) tryOne(ang, c, th);
  // refine
  const b0 = best;
  for (let ang = b0.ang - 2; ang <= b0.ang + 2; ang += 0.25) for (let c = b0.pose.curl[0] - 0.05; c <= b0.pose.curl[0] + 0.05; c += 0.005) for (let th = b0.pose.thumb - 4; th <= b0.pose.thumb + 4; th += 0.5) tryOne(ang, c, th);
  return best;
};
/** place a hand so its index tip lands on I (fixed pose and axis) */
export const placeIndex = (I: V, ang: number, L: number, ts: 1 | -1, pose: HandPose): V => {
  const d0 = digitTips({x: 0, y: 0}, ang, L, ts, pose);
  return {x: I.x - d0.tips[0].x, y: I.y - d0.tips[0].y};
};

// ------------------------------------------------------------------ the backpack's wires while it is carried
type WireKey = 'antL' | 'antR' | 'cerL' | 'cerR';
/** the stimulation wires from the pack (frame fp, possibly lifted off the back) to the implanted electrodes (body frame
 *  fb). Seated (fp = fb) this is exactly the Gear2D route; lifted, the board end rises with the pack, the electrode end
 *  stays put and the wire hangs slack in between (bowing outward, sagging). */
export type Wires = {pts: Record<WireKey, V3[]>; wts: Record<WireKey, number[]>};
export const carriedWires = (fb: Frame, fp: Frame, lift: number): Wires => {
  const wb = wiresOn(fb), wp = wiresOn(fp);
  const k = clamp(lift / 40);
  const out: Record<WireKey, V3[]> = {antL: [], antR: [], cerL: [], cerR: []};
  const wts: Record<WireKey, number[]> = {antL: [], antR: [], cerL: [], cerR: []};
  (['antL', 'antR', 'cerL', 'cerR'] as WireKey[]).forEach((key) => {
    const a = wb[key].map((q) => q.p);
    const d0 = sub3(wp[key][0].p, a[0]);
    const n = a.length;
    const side = key.endsWith('L') ? -1 : 1;
    const pts: V3[] = [];
    const ws: number[] = [];
    // resample finely so the slack curve is smooth
    for (let i = 0; i < n - 1; i++)
      for (let j = 0; j < 3; j++) {
        const u = (i + j / 3) / (n - 1);
        const p = add3(a[i], mul3(sub3(a[i + 1], a[i]), j / 3));
        const w = Math.pow(1 - u, 1.4);
        const bow = Math.sin(Math.PI * Math.min(1, u * 1.15)) * k;
        pts.push(add3(add3(p, mul3(d0, w)), toW({...fb, o: [0, 0, 0]}, [key.startsWith('cer') ? -3 * bow : 2 * bow, -2.5 * bow * (1 - u), 5.5 * side * bow])));
        ws.push(w);
      }
    pts.push(a[n - 1]);
    ws.push(0);
    out[key] = pts;
    wts[key] = ws;
  });
  return {pts: out, wts};
};
/** the wires (and electrode beads); `warp` scales the pack end about c by k (the pack nearer the camera when lifted) */
export const WireDraw: React.FC<{v: View; w: Wires; warp?: {c: V2; k: number}}> = ({v, w, warp}) => {
  const s = v.s;
  const sp = (key: WireKey) =>
    w.pts[key].map((p, i) => {
      const q = P(v, p);
      if (!warp) return q;
      const kk = 1 + (warp.k - 1) * w.wts[key][i];
      return [warp.c[0] + (q[0] - warp.c[0]) * kk, warp.c[1] + (q[1] - warp.c[1]) * kk] as V2;
    });
  const one = (key: WireKey, col: string) => {
    const d = smoothOpen(sp(key));
    return (
      <g key={key}>
        <path d={d} stroke={INK} strokeWidth={f2(0.55 * s + 1.6)} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d={d} stroke={col} strokeWidth={f2(0.55 * s)} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    );
  };
  const ends = (['antL', 'antR', 'cerL', 'cerR'] as WireKey[]).map((key) => {
    const e = P(v, w.pts[key][w.pts[key].length - 1]);
    return <circle key={`${key}e`} cx={f2(e[0])} cy={f2(e[1])} r={f2(0.75 * s)} fill="#E9EEF2" stroke={INK} strokeWidth={f2(Math.max(1, 0.25 * s))} />;
  });
  return (
    <g>
      {one('cerL', G2.wireCer)}
      {one('cerR', G2.wireCer)}
      {one('antL', G2.wireAnt)}
      {one('antR', G2.wireAnt)}
      {ends}
    </g>
  );
};

// ------------------------------------------------------------------ walking
/** distance walked from rest: starts at tGo, eases up to speed V (mm/s) over ta seconds (C1: no jerk in the gait) */
export const setOff = (t: number, tGo: number, V: number, ta: number) => {
  const dt = t - tGo;
  if (dt <= 0) return 0;
  if (dt < ta) {
    const u = dt / ta;
    return V * ta * (u * u * u - (u * u * u * u) / 2);
  }
  return V * ta * 0.5 + V * (dt - ta);
};

/** a path that runs straight along +x from `start` and then turns smoothly by `turn` radians (negative = to the right)
 *  between arc lengths sA and sB (the heading eases in and out of the turn), then runs straight again. Positions are
 *  integrated once (0.25 mm steps) and interpolated. */
export const turnPath = (start: [number, number], sA: number, sB: number, turn: number, sMin = -400, sMax = 600): Path & {yawAt: (s: number) => number} => {
  const yawAt = (s: number) => turn * smoother((s - sA) / (sB - sA));
  const step = 0.25;
  const n = Math.ceil((sMax - sMin) / step) + 1;
  const xs = new Float64Array(n), zs = new Float64Array(n);
  // integrate from s = 0 (at `start`) both ways
  const i0 = Math.round((0 - sMin) / step);
  xs[i0] = start[0];
  zs[i0] = start[1];
  for (let i = i0 + 1; i < n; i++) {
    const s = sMin + (i - 0.5) * step, y = yawAt(s);
    xs[i] = xs[i - 1] + Math.cos(y) * step;
    zs[i] = zs[i - 1] - Math.sin(y) * step;
  }
  for (let i = i0 - 1; i >= 0; i--) {
    const s = sMin + (i + 0.5) * step, y = yawAt(s);
    xs[i] = xs[i + 1] - Math.cos(y) * step;
    zs[i] = zs[i + 1] + Math.sin(y) * step;
  }
  const path = ((s: number) => {
    const u = clamp((s - sMin) / step, 0, n - 1.0001);
    const i = Math.floor(u), f = u - i;
    return {p: [xs[i] + (xs[i + 1] - xs[i]) * f, 0, zs[i] + (zs[i + 1] - zs[i]) * f] as V3, yaw: yawAt(s)};
  }) as Path & {yawAt: (s: number) => number};
  path.yawAt = yawAt;
  return path;
};

// ------------------------------------------------------------------ the steering pulse train
/** three short pulses leave the board at tP, tP + gap, tP + 2 gap and run the wire in `run` seconds */
export const pulseTrain = (t: number, tP: number, gap = 0.1, run = 0.26) => {
  const fr: number[] = [];
  let zap = 0, twitch = 0;
  for (let k = 0; k < 3; k++) {
    const t0 = tP + k * gap;
    const u = (t - t0) / run;
    if (u >= 0 && u <= 1) fr.push(1 - Math.pow(1 - u, 1.25)); // quick off the board, steady along the wire
    const da = t - (t0 + run);
    if (da >= 0) {
      zap = Math.max(zap, Math.exp(-da / 0.16) * (k === 2 ? 1 : 0.9));
      // a flick of the antenna at each arrival: a fast rise, a slower return
      twitch += (1 - Math.exp(-da / 0.025)) * Math.exp(-da / 0.17) * (k === 0 ? 1 : 0.6);
    }
  }
  const led = t >= tP - 0.02 && t <= tP + 2 * gap + 0.06 ? 1 : 0;
  return {fr, zap: Math.min(1, zap), twitch: Math.min(1.2, twitch), led, arrive: tP + run, last: tP + 2 * gap + run};
};

/** a short glowing trail behind each pulse on a wire (screen polyline of the wire, board -> electrode): the signal's
 *  wake along the conductor, fading behind the bead (Gear2D draws the bead itself) */
export const PulseTrails: React.FC<{id: string; v: View; wire: V3[]; fr: number[]; len?: number}> = ({id, v, wire, fr, len = 0.2}) => {
  const pts = wire.map((p) => P(v, p));
  const L: number[] = [0];
  for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const tot = L[L.length - 1] || 1;
  const at = (u: number): V2 => {
    const x = clamp(u) * tot;
    let i = 1;
    while (i < L.length - 1 && L[i] < x) i++;
    const k = (x - L[i - 1]) / Math.max(1e-6, L[i] - L[i - 1]);
    return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k];
  };
  return (
    <g>
      {fr.map((u, j) => {
        const n = 10;
        const segs: React.ReactNode[] = [];
        for (let i = 0; i < n; i++) {
          const a = u - len * (1 - i / n), b = u - len * (1 - (i + 1) / n);
          if (b <= 0) continue;
          const pa = at(Math.max(0, a)), pb = at(b);
          segs.push(<path key={i} d={`M${f2(pa[0])},${f2(pa[1])} L${f2(pb[0])},${f2(pb[1])}`} stroke="#FFF3B0" strokeWidth={f2(0.62 * v.s)} strokeLinecap="round" opacity={(0.08 + 0.75 * ((i + 1) / n)) * 0.9} />);
        }
        return <g key={`${id}${j}`}>{segs}</g>;
      })}
    </g>
  );
};

// ------------------------------------------------------------------ foam blocks
export type BoxB = [number, number, number, number, number, number];
/** the foam blocks on the B1-B3 tray (world mm; the walk runs along +x from the origin, these stand on the far side) */
export const LAB_BLOCKS: {b: BoxB; c: string}[] = [
  {b: [10, 52, 0, 36, -195, -157], c: LAB2.foamB},
  {b: [96, 150, 0, 26, -183, -149], c: LAB2.foamY},
  {b: [-80, -40, 0, 30, -173, -141], c: LAB2.foamR},
];
/** a foam block: Box2D with its soft ground shadow and a scatter of pores on the top face (deterministic) */
export const FoamBox: React.FC<{id: string; v: View; b: BoxB; color: string; shadow?: boolean}> = ({id, v, b, color, shadow = true}) => {
  const [x0, x1, , y1, z0, z1] = b;
  const pores: React.ReactNode[] = [];
  const n = Math.min(40, Math.round(((x1 - x0) * (z1 - z0)) / 160));
  const dark = shadeC(color, 0.16);
  for (let i = 0; i < n; i++) {
    const px = x0 + 3 + (x1 - x0 - 6) * rnd(i, 11 + x0), pz = z0 + 3 + (z1 - z0 - 6) * rnd(i, 23 + z0);
    const r = 0.7 + 1.0 * rnd(i, 5);
    const c = P(v, [px, y1, pz]), cx = P(v, [px + r, y1, pz]), cz = P(v, [px, y1, pz + r * (0.7 + 0.5 * rnd(i, 9))]);
    const ring: V2[] = [];
    for (let k = 0; k < 10; k++) {
      const th = (k / 10) * Math.PI * 2;
      ring.push([c[0] + (cx[0] - c[0]) * Math.cos(th) + (cz[0] - c[0]) * Math.sin(th), c[1] + (cx[1] - c[1]) * Math.cos(th) + (cz[1] - c[1]) * Math.sin(th)]);
    }
    pores.push(<path key={i} d={polyD(ring)} fill={dark} opacity={0.42} />);
  }
  return (
    <g>
      {shadow && <BoxShadow id={`${id}-sh`} v={v} b={b} push={[0.9 * v.s, 1.1 * v.s * Math.max(0.3, v.F[1])]} alpha={0.15} />}
      <Box2D id={`${id}-bx`} v={v} b={b} color={color} />
      {v.F[1] > 0.3 && pores}
    </g>
  );
};
