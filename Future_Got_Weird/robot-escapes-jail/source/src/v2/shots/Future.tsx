// FU (22.56-27.90 s), owner D: "Scientists are exploring whether robots like this could one day retrieve objects from
// inside your body." The technology gets stranger, then the real-world implication. Only demos verified in
// SCIENCE_NOTES_V2 (liquid elongation toward a magnet through a narrow passage; the in-vitro STOMACH MODEL foreign-
// object removal: solid device steered to a ball, AC-field melt, engulf, ambient re-solidify, magnet removes it);
// the human body is a labelled FUTURE IDEA. The material never has eyes.
//
// Beats (film t; words from T / data/timeline.json):
//   22.567-22.70  exactly C.navy1 + <HandoffBlob t/> (contract MS -> FU)
//   22.70-23.25   "Scientists are" - the scene builds around the blob: the lab mat lights up, the camera pulls back and
//                 cranes down as a clear acrylic block with a NARROW S-CHANNEL slides in under the blob and a bar magnet
//                 slides in beyond its exit (field lines reach for the metal)                       [field 22.86]
//   23.00-23.95   "exploring whether" - the liquid elongates into the funnel, necks to the channel's width (narrower
//                 than the blob), runs round both bends as one continuous slug, and gathers back into a round bead at the
//                 exit next to the magnet (volume held; the camera stays close, k 1 -> 0.95, and cranes down with the
//                 slug's head, a lagged follow)                                  [squeeze 23.07, stream 23.12, drip 23.82]
//   23.95         DELIBERATE CUT (a separate experiment): the STOMACH MODEL (water-filled, translucent, clamped on a
//                 stand). A solid chrome device drops down the oesophagus, pulled by the magnet outside the model; the
//                 camera follows and pulls back to reveal the model, the coil and the small ball  ("robots like this")
//   24.74         it arrives against the ball (tok)                                                  [clunk 24.74]
//   24.92-25.55   "could one day": the copper induction coil behind the model energises (orange, AC rings): the device
//                 warms, loses rigidity, slumps; one thick wave rolls up and over the (lime) ball while the cover sweeps
//                 across it right-to-left (never an enclosed hole), the magnet below draws it on
//                                                                                   [ac_on 24.92, melt 25.10, squeeze 25.30]
//   25.55-25.95   "retrieve": the field is off; it cools in the water and re-solidifies round the ball      [cool 25.55]
//   25.55-25.95   (field off) the magnet glides round under the lump
//   25.95-27.02   "objects": the magnet leads the solid lump (ball inside) back up through the stomach  [field 25.96]
//   26.43-27.02   "from inside your body": pull back: the model sits inside a ghosted, friendly human outline (head
//                 above the caption band); tag FUTURE IDEA; the SAME external magnet keeps leading the lump (it never
//                 moves by itself) up to the model's rim                                               [reveal 26.47]
//   27.02-27.795  the push: the camera picks the lump up with its screen velocity and carries it monotonically into
//                 the hand-off circle while zooming in; the magnet slips away 27.26-27.5; the lab fades to navy
//                                                                                                       [glint 27.66]
//   27.80-27.867  exactly a chrome sphere (engine ChromeBody of one circle) centred (540, 900), r = 130, on C.navy1
//                 (contract FU -> J1: the robot's head)
import React from 'react';
import {C} from '../../art/palette';
import {clamp, lerp, noise1, ss, ss5} from '../../lib';
import {SHOTS2} from '../story2';
import {Tag} from '../Tag';
import {uid} from '../../core/ids';
import {ChromeBody, HANDOFF, HandoffBlob, handoffPrims} from '../liquid/Chrome';
import {Prim} from '../liquid/sdf';
import {calibrate, scalePrim, unionArea} from '../liquid/flow';
import {splineKeys} from '../robot2';
import {
  Backdrop, Ball, Cam2, camPt, ChannelBlock, Coil2D, COURSE, COURSE_PATH, crSample, FieldLines2D, GHOST_GULLET, GhostBody,
  Magnet2D, magnetNFace, MatTop, mkPoly, Poly, polyAt, polyTan, StandClamp, STOMACH_GEO, StomachModel2, V,
} from '../art/future';

export type Cue = {t: number; kind: string; gain?: number; dur?: number; pan?: number; variant?: number};

const [FU0, FU1] = SHOTS2.FU;
/** timing of the shot (film seconds) */
export const FU_T = {
  hold: 22.70, // exact hand-off blob until here
  build: [22.70, 23.06] as const, // the block slides in
  magIn: [22.82, 23.14] as const,
  flow0: 23.0, // the blob starts to elongate into the funnel
  flow1: 23.84, // all of it is out of the channel
  cut: 23.95, // world A -> world B (just before "robots" 23.955)
  arrive: 24.74,
  coilOn: 24.92,
  melt: [25.02, 25.34] as const,
  engulf: [25.2, 25.62] as const,
  relax: [25.48, 25.74] as const,
  coilOff: 25.5,
  cool: [25.52, 25.95] as const,
  lift: 25.96,
  rim: 27.1, // the lump passes the model's top rim (lumpS = S_OUT_RIM)
  bodyIn: [26.43, 27.02] as const,
  push: [27.02, 27.795] as const,
  exact: 27.795, // from here: exactly the hand-off sphere
};
/** the hand-off sphere (contract FU -> J1) */
export const FU_SPHERE = {x: 540, y: 900, r: 130};
export const FU_TAG = {x: 48, y: 168, size: 28};

const O: V = {x: 540, y: 960};
const lerpV = (a: V, b: V, u: number): V => ({x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u)});
const splineV = (t: number, keys: [number, V][]): V => ({
  x: splineKeys(t, keys.map(([a, b]) => [a, b.x] as [number, number])),
  y: splineKeys(t, keys.map(([a, b]) => [a, b.y] as [number, number])),
});
const mapPrim = (cam: Cam2, p0: Prim): Prim => {
  let p = p0;
  // model -> screen for the prim kinds used here
  const s = camPt(cam, {x: (p as {x?: number}).x ?? 0, y: (p as {y?: number}).y ?? 0});
  const k = cam.k;
  if (p.blend !== undefined) p = {...p, blend: p.blend * k};
  switch (p.k) {
    case 'c':
      return {...p, x: s.x, y: s.y, r: p.r * k};
    case 'cap': {
      const a = camPt(cam, {x: p.ax, y: p.ay}), b = camPt(cam, {x: p.bx, y: p.by});
      return {...p, ax: a.x, ay: a.y, bx: b.x, by: b.y, ra: p.ra * k, rb: p.rb * k};
    }
    case 'ell':
      return {...p, x: s.x, y: s.y, rx: p.rx * k, ry: p.ry * k};
    default:
      return p;
  }
};

// =====================================================================================================================
// WORLD A: the blob, the channel, the magnet
// =====================================================================================================================
/** world-A camera: identity at the hand-off, then pulls back and cranes down to the course, tracking the flow */
export const camA = (t: number): Cam2 => {
  // no zoom-out: the camera stays close (the slug reads at phone size) and cranes down WITH the metal, a lagged follow
  // of the slug's head, so the course is revealed as the liquid runs into it
  const lk = Math.log(0.95) * ss5(t, FU_T.hold, 23.5);
  const Fy = splineKeys(t, [[FU_T.hold, 960], [23.02, 1150], [23.32, 1405], [23.62, 1645], [FU_T.cut, 1800]]);
  return {k: Math.exp(lk), F: {x: 540, y: Fy}, O};
};
const blockDy = (t: number) => 780 * (1 - ss5(t, FU_T.build[0], FU_T.build[1]));
const magnetA = (t: number): V => ({x: COURSE.magnet.x, y: COURSE.magnet.y + 620 * (1 - ss5(t, FU_T.magIn[0], FU_T.magIn[1])) - 18 * ss(t, 23.3, 23.85)});
const MAG_SC_A = 1.4;

/** the extended flow path: blob centre -> funnel -> channel -> exit -> the bead's rest by the magnet */
const B0: V = {x: COURSE.bead.x, y: COURSE.bead.y};
const EXIT = COURSE.ctrl[COURSE.ctrl.length - 1];
const REST_A: V = {x: 540, y: COURSE.magnet.y - 84 * MAG_SC_A - 112};
const FLOW_PATH: Poly = (() => {
  const pre: V[] = [];
  for (let i = 0; i < 20; i++) pre.push(lerpV(B0, COURSE.ctrl[0], i / 20));
  const post: V[] = [];
  for (let i = 1; i <= 20; i++) post.push(lerpV(EXIT, REST_A, i / 20));
  return mkPoly([...pre, ...COURSE_PATH.pts, ...post]);
})();
const S_E = Math.hypot(COURSE.ctrl[0].x - B0.x, COURSE.ctrl[0].y - B0.y);
const S_X = S_E + COURSE_PATH.len;
const RC = 41; // slug radius in the channel (lumen 104)
const A0 = unionArea(handoffPrims(FU_T.hold), HANDOFF.r * 0.6);
const LW = A0 / (2 * RC); // the slug length if all of it were in the channel
/** head position along FLOW_PATH: the blob leans into the funnel, the head runs through the bends, eases at the exit */
const R0 = Math.sqrt(A0 / Math.PI);
const headS = (t: number) =>
  splineKeys(t, [[FU_T.flow0 - 0.1, R0], [23.13, S_E + 40], [23.42, S_E + 360], [23.64, S_X + LW * 0.45], [FU_T.flow1, S_X + LW + 12], [23.94, S_X + LW + 70]]);
const HB = HANDOFF.r * 0.6; // the hand-off blob's own blend
/** the liquid in world A (world coords) */
const liquidA = (t: number): {prims: Prim[]; blend: number} => {
  const blend = 26;
  if (t < FU_T.flow0 - 0.1) return {prims: handoffPrims(t).map((p) => ({...p, blend: HB})), blend};
  const sH = Math.max(R0, headS(t));
  const sT = sH - LW; // tail in channel-equivalent length
  const mSrc = clamp((S_E - sT) / LW); // fraction still before the channel
  const mOut = clamp((sH - S_X) / LW); // fraction gathered beyond the exit
  // the source blob drains toward the funnel; the outlet bead forms at the exit and settles by the magnet
  const build = (a: number): Prim[] => {
    const fs = Math.max(0, mSrc * a), fo = Math.max(0, mOut * a);
    // the stream thins when it is stretched (the solve can always hold the volume)
    const thick = clamp(Math.sqrt(a), 0.55, 1.08);
    const rs = R0 * Math.sqrt(fs), ro = R0 * Math.sqrt(fo);
    // the source centre drifts toward the funnel as it drains (its front edge stays at the mouth)
    const sc = Math.max(0, Math.min(S_E - 0.5 * rs, (S_E - 0.55 * R0) * (1 - Math.min(1, mSrc * 1.02))));
    const cs = polyAt(FLOW_PATH, sc);
    const so = lerp(S_X + 0.55 * ro, FLOW_PATH.len, ss(mOut, 0.25, 1));
    const co = polyAt(FLOW_PATH, so);
    const out: Prim[] = [];
    if (rs > 0.5) {
      for (const p of handoffPrims(t)) out.push(shift({...scalePrim(p, B0.x, B0.y, fs), blend: HB * Math.sqrt(fs)}, cs.x - B0.x, cs.y - B0.y));
    }
    if (ro > 0.5) out.push({k: 'c', x: co.x, y: co.y, r: ro, blend: Math.max(blend, ro * 0.5)});
    // the slug: from the source (or the tail) to the head (or the outlet bead)
    // once it has all left the channel the free tail is drawn into the bead (no pointed tail before the cut)
    const s0 = mSrc > 0 ? sc : lerp(sT, Math.max(sT, (mOut > 0 ? so : sH) - 2), ss(t, 23.76, 23.92));
    const s1 = mOut > 0 ? so : sH;
    if (s1 - s0 > 2) {
      const n = Math.max(2, Math.ceil((s1 - s0) / 16));
      const rad = (s: number) => {
        const tip = mOut > 0 ? 1 : clamp((sH - s) / 70); // the free tip tapers
        const tail = mSrc > 0 ? 1 : 0.5 + 0.5 * clamp((s - sT) / 60); // so does the free tail
        const fun = s < S_E ? 1 + 0.3 * clamp((S_E - s) / 90) : 1; // a little wider in the funnel
        const born = clamp((sH - R0) / 40); // the stream is born from the blob's edge (no pop)
        return RC * thick * fun * (0.55 + 0.45 * tip) * tail * born * (1 + 0.04 * noise1(s * 0.03 - t * 6, 2));
      };
      let prev = polyAt(FLOW_PATH, s0), pr = rad(s0);
      for (let i = 1; i <= n; i++) {
        const s = s0 + ((s1 - s0) * i) / n;
        const p = polyAt(FLOW_PATH, s), r = rad(s);
        if (pr > 0.3 || r > 0.3) out.push({k: 'cap', ax: prev.x, ay: prev.y, bx: p.x, by: p.y, ra: pr, rb: r});
        prev = p;
        pr = r;
      }
    }
    return out;
  };
  const cal = calibrate(build, blend, A0, 1, 0.05, 1.6, 8);
  return {prims: cal.prims, blend};
};
const shift = (p: Prim, dx: number, dy: number): Prim => {
  switch (p.k) {
    case 'c':
    case 'ell':
      return {...p, x: p.x + dx, y: p.y + dy};
    case 'cap':
      return {...p, ax: p.ax + dx, ay: p.ay + dy, bx: p.bx + dx, by: p.by + dy};
    default:
      return p;
  }
};
/** the leading point of the metal (for the field lines) */
const leadA = (t: number): V => {
  const sH = headS(t);
  return polyAt(FLOW_PATH, Math.min(FLOW_PATH.len, sH));
};

const WorldA: React.FC<{t: number}> = ({t}) => {
  const cam = camA(t);
  const k = cam.k;
  const liq = liquidA(t);
  const prims = liq.prims.map((p) => mapPrim(cam, p));
  const mc = camPt(cam, magnetA(t));
  const ang = -Math.PI / 2;
  const nf = magnetNFace(mc, ang, MAG_SC_A * k);
  const lead = camPt(cam, leadA(t));
  const fieldOn = ss(t, 22.98, 23.16);
  const r = HANDOFF.r * k;
  return (
    <g>
      <rect width={1080} height={1920} fill={C.navy1} />
      <MatTop cam={cam} on={ss(t, FU_T.hold, 22.98)} />
      {blockDy(t) < 1500 && <ChannelBlock cam={cam} dy={blockDy(t)} t={t} />}
      <FieldLines2D a={nf} b={{x: lead.x, y: lead.y + 0.2 * r}} spread={Math.max(60, Math.abs(nf.y - lead.y) * 0.35)} w={Math.max(2, 5 * k)} t={t} on={fieldOn * 0.85} />
      <ChromeBody prims={prims} blend={liq.blend * k} R={lerp(HANDOFF.r, 62, ss(t, FU_T.flow0 - 0.1, 23.3)) * k} cell={3} specs={2} />
      <Magnet2D c={mc} ang={ang} sc={MAG_SC_A * k} handle={420} />
    </g>
  );
};

// =====================================================================================================================
// WORLD B: the stomach model (model space), the device / lump, the ghost body
// =====================================================================================================================
const G = STOMACH_GEO;
const BALL_R = 23;
const BALL: V = {x: 470, y: G.floorAt(470) - BALL_R};
const DEV = {r: 28, hs: 30};
const floorY = (x: number) => G.floorAt(x);
const DEV_REST: V = (() => {
  const x = BALL.x + BALL_R + 4 + DEV.hs + DEV.r;
  return {x, y: floorY(x) - DEV.r - 1};
})();
const DEV_ANG = Math.atan2(floorY(DEV_REST.x + 40) - floorY(DEV_REST.x - 40), 80);
const A_DEV = Math.PI * DEV.r * DEV.r + 2 * DEV.r * 2 * DEV.hs;
const A_BALL = Math.PI * BALL_R * BALL_R;
const R_F = Math.sqrt((A_DEV + A_BALL) / Math.PI); // the re-solidified lump (ball inside)
const LUMP0: V = {x: BALL.x + 3, y: Math.min(floorY(BALL.x + 3) - R_F - 1, BALL.y - (R_F - BALL_R) + 3)};
/** the device's way in (model): down the oesophagus, through the body, to the floor beside the ball */
const PATH_IN: Poly = mkPoly(crSample([{x: 776, y: 300}, {x: 778, y: 470}, {x: 790, y: 620}, {x: 862, y: 760}, {x: 932, y: 905}, {x: 940, y: 1060}, {x: 890, y: 1215}, {x: 790, y: 1338}, {x: 672, y: 1414}, DEV_REST], 12));
/** the lump's way out: up through the body, the oesophagus, the ghost gullet */
const PATH_OUT: Poly = mkPoly(crSample([LUMP0, {x: 640, y: 1392}, {x: 820, y: 1300}, {x: 930, y: 1130}, {x: 950, y: 930}, {x: 880, y: 760}, {x: 790, y: 610}, {x: 777, y: 470}, ...GHOST_GULLET.slice(1, 5)], 12));
const S_OUT_RIM = (() => {
  let best = 0, bd = 1e9;
  for (let i = 0; i < PATH_OUT.pts.length; i++) {
    const d = Math.abs(PATH_OUT.pts[i].y - 400) + (PATH_OUT.pts[i].y > 400 ? 0 : 50);
    if (d < bd) {
      bd = d;
      best = PATH_OUT.s[i];
    }
  }
  return best;
})();
/** the device's start (inside the oesophagus) and its travel */
const S_IN0 = 170;
const devS = (t: number) => {
  // enters already moving (drops in), arrives with an ease-out
  const x = clamp((t - FU_T.cut) / (FU_T.arrive - FU_T.cut));
  const L = PATH_IN.len - S_IN0;
  const v0 = 0.55; // initial speed (fraction of the average)
  const h = (2 * x * x * x - 3 * x * x + 1) * 0 + (x * x * x - 2 * x * x + x) * v0 + (-2 * x * x * x + 3 * x * x) * 1 + (x * x * x - x * x) * 0;
  return S_IN0 + L * h;
};
const lumpS = (t: number) => {
  // starts from rest, accelerates up through the body, passes the rim, slows in the gullet
  // (at the end of the reveal it is still just below the model's rim, slowing, so the push carries it monotonically)
  return splineKeys(t, [[FU_T.lift, 0], [26.3, 520], [26.72, 1080], [FU_T.bodyIn[1], 1270], [27.8, 1640]]);
};
const lumpPos = (t: number): V => (t < FU_T.lift ? LUMP0 : polyAt(PATH_OUT, lumpS(t)));

/** the metal in world B (model coords): solid device -> melt -> engulf -> round lump. Returns prims + draw info. */
const metalB = (t: number): {prims: Prim[]; blend: number; warm: number; liquid: number; ballVis: boolean} => {
  const warm = 0.9 * ss(t, 24.98, 25.2) * (1 - ss(t, FU_T.cool[0], FU_T.cool[1]));
  const um = ss(t, FU_T.melt[0], FU_T.melt[1]);
  const ue = ss(t, FU_T.engulf[0], FU_T.engulf[1]);
  const ur = ss(t, FU_T.relax[0], FU_T.relax[1]);
  if (t < FU_T.melt[0]) {
    // the solid device travelling along PATH_IN (axis along the path, settling onto the floor's slope)
    const s = devS(t);
    const c = polyAt(PATH_IN, s);
    const tg = polyTan(PATH_IN, s);
    let ang = Math.atan2(tg.y, tg.x);
    const settle = ss(t, FU_T.arrive - 0.2, FU_T.arrive + 0.05);
    // align with the floor at the end (lying on it)
    let target = DEV_ANG;
    if (Math.abs(target - ang) > Math.PI / 2) target += target < ang ? Math.PI : -Math.PI;
    ang = lerp(ang, target, settle);
    // a small rock on arrival (it bumps the ball)
    ang += 0.06 * Math.exp(-(t - FU_T.arrive) / 0.12) * Math.sin(Math.max(0, t - FU_T.arrive) * 30) * (t > FU_T.arrive ? 1 : 0);
    const dx = Math.cos(ang) * DEV.hs, dy = Math.sin(ang) * DEV.hs;
    return {prims: [{k: 'cap', ax: c.x - dx, ay: c.y - dy, bx: c.x + dx, by: c.y + dy, ra: DEV.r, rb: DEV.r}], blend: 10, warm, liquid: 0, ballVis: true};
  }
  if (ur >= 1) {
    const c = lumpPos(t);
    return {prims: [{k: 'c', x: c.x, y: c.y, r: R_F}], blend: 10, warm, liquid: 0, ballVis: false};
  }
  const liquid = 1 - ss(t, FU_T.cool[0], FU_T.cool[1]);
  // a = thickness factor (solved for the area)
  const build = (a: number): Prim[] => {
    const out: Prim[] = [];
    // MAIN BODY: the device lying on the floor right of the ball slumps (thinner, longer, its left end flowing onto the
    // ball's shoulder), then feeds the lobes that wrap the ball (shorter)
    const rm = lerp(DEV.r, 19, um) * a;
    const hs = lerp(DEV.hs, 44, um) * (1 - 0.5 * ue);
    const leftX = lerp(DEV_REST.x - DEV.hs - DEV.r, BALL.x + BALL_R * 0.35, Math.max(um * 0.55, ue));
    const cx = leftX + hs + rm;
    const cy = floorY(cx) - rm - 1;
    const ang = lerp(DEV_ANG, DEV_ANG * 0.5, um);
    out.push({k: 'cap', ax: cx - Math.cos(ang) * hs, ay: cy - Math.sin(ang) * hs, bx: cx + Math.cos(ang) * hs, by: cy + Math.sin(ang) * hs, ra: rm, rb: rm});
    // LOBES: the liquid climbs up and over the ball and runs round its near side, closing on its far side
    if (ue > 0.005) {
      const reach = ss(ue, 0, 1);
      // one thick wave rolls up the ball's right side, over its top and down its far side to the floor (it hugs the
      // ball: a sheet, not an arm), while a thin film runs along the floor in front of it; then the front film closes
      // over the ball from the right, so the ball is swallowed right-to-left
      const n = 12;
      for (let i = 0; i <= n; i++) {
        const f = i / n;
        if (f > reach + 0.02) break;
        const th = -0.1 - (Math.PI + 0.25) * f;
        const w = 19 * (1 - 0.25 * f) * a * (1 + 0.05 * noise1(t * 5 + i * 0.7, 3)) * Math.min(1, ue * 4);
        const rr = BALL_R + w * 0.32;
        out.push({k: 'c', x: BALL.x + Math.cos(th) * rr, y: BALL.y + Math.sin(th) * rr, r: w});
      }
      const fl = ss(ue, 0.05, 0.7);
      if (fl > 0.01) {
        const x0 = BALL.x + BALL_R * 0.6, x1 = lerp(x0, BALL.x - BALL_R * 0.2, fl);
        const rf = 10 * a * Math.min(1, ue * 4);
        out.push({k: 'cap', ax: x0, ay: floorY(x0) - rf - 1, bx: x1, by: floorY(x1) - rf - 1, ra: rf, rb: rf * 0.8});
      }
      // the cover sweeps across the ball from the right (a capsule whose front edge advances): the ball is never seen
      // through an enclosed hole, only through the shrinking open mouth on its left until the wave closes it
      const film = ss(ue, 0.15, 0.85);
      if (film > 0.01) {
        const rf = (BALL_R + 3) * a;
        const xa = BALL.x + BALL_R + 2, xb = lerp(xa, BALL.x - BALL_R + rf, film);
        out.push({k: 'cap', ax: xa, ay: BALL.y + 1, bx: Math.min(xa, xb), by: BALL.y + 1, ra: rf * Math.min(1, film * 3), rb: rf * Math.min(1, film * 3)});
      }
    }
    // the surface stays alive while it is liquid (small travelling lobes along the main body)
    if (liquid > 0.05 && um > 0.25) {
      for (let i = 0; i < 3; i++) {
        const ph = t * 5 + i * 2.1;
        out.push({k: 'c', x: cx + Math.cos(ph) * hs * 0.6, y: cy - rm * 0.2 + Math.sin(ph * 1.3) * 2.5, r: rm * (0.62 + 0.06 * Math.sin(ph)) * liquid});
      }
    }
    // RELAX: every part draws in to one round drop (surface tension), ball inside
    if (ur > 0) {
      const RF = R_F * Math.sqrt(a);
      return out.map((p) => {
        if (p.k === 'c') return {...p, x: lerp(p.x, LUMP0.x, ur), y: lerp(p.y, LUMP0.y, ur), r: lerp(p.r, RF, ur)};
        if (p.k === 'cap') return {...p, ax: lerp(p.ax, LUMP0.x, ur), ay: lerp(p.ay, LUMP0.y, ur), bx: lerp(p.bx, LUMP0.x, ur), by: lerp(p.by, LUMP0.y, ur), ra: lerp(p.ra, RF, ur), rb: lerp(p.rb, RF, ur)};
        return p;
      });
    }
    return out;
  };
  const target = A_DEV + A_BALL;
  const withBall = (a: number) => [...build(a), {k: 'c', x: BALL.x, y: BALL.y, r: BALL_R} as Prim];
  const cal = calibrate(withBall, 12, target, 1, 0.4, 1.8, 6);
  return {prims: build(cal.a), blend: 12, warm, liquid, ballVis: true};
};

/** the magnet in world B (model coords): leads the device outside the model, holds beyond the ball, draws the melt
 *  around it, then leads the lump back up and out */
const MAG_KEYS: [number, V][] = [
  [FU_T.cut, {x: 1150, y: 640}],
  [24.3, {x: 1190, y: 1110}],
  [24.6, {x: 520, y: 1650}],
  [FU_T.arrive + 0.06, {x: 330, y: 1590}],
  [24.98, {x: 318, y: 1606}],
  [25.18, {x: 270, y: 1660}],
  [25.4, {x: 330, y: 1588}],
  // field off while it cools: the magnet backs off a touch, then glides round under the lump, ready to lift it
  [25.66, {x: 352, y: 1640}],
  [FU_T.lift - 0.02, {x: 470, y: 1700}],
  [26.15, {x: 880, y: 1560}],
  [26.42, {x: 1180, y: 1090}],
  // FUTURE IDEA: the same external magnet keeps leading the retrieved lump up and out (it never moves by itself);
  // it rides just ahead of the lump, outside the model, then slips away as the camera pushes in on the lump
  ...([[26.72, 330, -110], [27.0, 300, -130], [27.3, 285, -150], [27.6, 330, -230], [27.8, 380, -280]] as [number, number, number][]).map(
    ([tt, dx, dy]) => [tt, {x: lumpPos(tt).x + dx, y: lumpPos(tt).y + dy}] as [number, V],
  ),
];
const magnetB = (t: number): V => splineV(t, MAG_KEYS);
/** the magnet (and its field) leave as the push-in starts */
const MAG_OFF = [27.26, 27.5] as const;
/** what the magnet pulls (model) */
const metalCentre = (t: number): V => {
  if (t < FU_T.melt[0]) return polyAt(PATH_IN, devS(t));
  if (t < FU_T.lift) return lerpV(DEV_REST, LUMP0, ss(t, FU_T.melt[0], FU_T.relax[1]));
  return lumpPos(t);
};
const fieldB = (t: number) => {
  const pullIn = ss(t, FU_T.cut, FU_T.cut + 0.12) * (1 - ss(t, FU_T.arrive + 0.05, 24.95));
  const engulf = ss(t, 25.22, 25.36) * (1 - ss(t, 25.62, 25.8));
  const out = ss(t, FU_T.lift - 0.04, FU_T.lift + 0.12) * (1 - ss(t, MAG_OFF[0], MAG_OFF[1]));
  return Math.max(pullIn, engulf, out);
};

/** the bead's screen y in world A's last frame (the device sits there in world B's first frame) */
const CUT_Y = (() => {
  const c = camA(FU_T.cut - 1 / 30);
  return camPt(c, polyAt(FLOW_PATH, FLOW_PATH.len)).y;
})();
/** world-B camera before the push: follow the device in, frame the model, the ball, follow the lump out, frame the body
 *  (eased to rest at the end of the reveal) */
const camBase = (t: number): Cam2 => {
  const lk = splineKeys(t, [
    [FU_T.cut, Math.log(1.32)],
    [24.32, Math.log(1.12)],
    [24.95, Math.log(2.25)],
    [25.75, Math.log(2.42)],
    [26.25, Math.log(1.3)],
    [FU_T.bodyIn[1], Math.log(BODY_K)],
  ]);
  const dev0 = polyAt(PATH_IN, devS(FU_T.cut));
  const fx = splineKeys(t, [
    [FU_T.cut, dev0.x],
    [24.32, 690],
    [24.95, 500],
    [25.75, 486],
    [26.25, 800],
    [FU_T.bodyIn[1], 645],
  ]);
  const fy = splineKeys(t, [
    [FU_T.cut, dev0.y - (CUT_Y - O.y) / 1.32],
    [24.32, 1010],
    [24.95, 1440],
    [25.75, 1432],
    [26.25, 1050],
    // the body framing: the ghost's head sits above the caption band, the model and the lump mid-frame
    [FU_T.bodyIn[1], 380],
  ]);
  return {k: Math.exp(lk), F: {x: fx, y: fy}, O};
};
const BODY_K = 0.6;
/** the push: the camera picks the lump up with the screen velocity it has at the end of the reveal and carries it
 *  monotonically (no overshoot) into the hand-off circle while zooming in */
const PUSH = (() => {
  const [a, b] = FU_T.push;
  const c = camBase(a);
  const e = 1 / 120;
  const s0 = camPt(c, lumpPos(a));
  const sm = camPt(c, lumpPos(a - e)), sp = camPt(c, lumpPos(a + e));
  return {a, b, s0, v0: {x: (sp.x - sm.x) / (2 * e), y: (sp.y - sm.y) / (2 * e)}};
})();
const herm = (p0: number, m0: number, p1: number, x: number) => {
  const x2 = x * x, x3 = x2 * x;
  return (2 * x3 - 3 * x2 + 1) * p0 + (x3 - 2 * x2 + x) * m0 + (-2 * x3 + 3 * x2) * p1;
};
const camB = (t: number): Cam2 => {
  if (t <= PUSH.a) return camBase(t);
  const T = PUSH.b - PUSH.a;
  const x = clamp((t - PUSH.a) / T);
  const k = Math.exp(lerp(Math.log(BODY_K), Math.log(FU_SPHERE.r / R_F), ss5(t, PUSH.a, PUSH.b)));
  const S = {x: herm(PUSH.s0.x, PUSH.v0.x * T, FU_SPHERE.x, x), y: herm(PUSH.s0.y, PUSH.v0.y * T, FU_SPHERE.y, x)};
  const L = lumpPos(t);
  return {k, F: {x: L.x - (S.x - O.x) / k, y: L.y - (S.y - O.y) / k}, O};
};

const WorldB: React.FC<{t: number}> = ({t}) => {
  const cam = camB(t);
  const k = cam.k;
  const body = ss(t, FU_T.bodyIn[0] + 0.05, FU_T.bodyIn[1]);
  const labK = 1 - ss(t, FU_T.bodyIn[0], FU_T.bodyIn[1] - 0.15); // lab apparatus (stand, coil) fades as the idea takes over
  const fade = 1 - ss(t, FU_T.push[0] + 0.1, FU_T.push[1] - 0.06); // everything but the lump goes as we arrive
  const heat = ss(t, FU_T.coilOn, FU_T.coilOn + 0.16) * (1 - ss(t, FU_T.coilOff - 0.05, FU_T.coilOff + 0.1));
  const met = metalB(t);
  const prims = met.prims.map((p) => mapPrim(cam, p));
  const ballC = camPt(cam, BALL);
  const mc = camPt(cam, magnetB(t));
  const target = camPt(cam, metalCentre(t));
  const ang = Math.atan2(target.y - mc.y, target.x - mc.x);
  const msc = 0.8 * k;
  const nf = magnetNFace(mc, ang, msc);
  const fOn = fieldB(t);
  const coilC = {x: BALL.x + 30, y: BALL.y - 30};
  const isLump = t >= FU_T.relax[1];
  const R = isLump ? R_F * k : Math.max(14, (met.liquid > 0.3 ? 30 : DEV.r) * k);
  // a soft light behind the retrieved lump while it is small in the body view (it stays the thing to watch)
  const lumpGlow = isLump ? ss(t, 26.3, 26.75) * (1 - ss(t, 27.35, 27.7)) : 0;
  const lumpC = camPt(cam, lumpPos(t));
  const glowId = uid('fuGlow');
  return (
    <g>
      <Backdrop cam={cam} lab={(1 - 0.45 * body) * fade} t={t} />
      <g opacity={fade}>
        <GhostBody cam={cam} p={body} t={t} opacity={body > 0 ? 1 : 0} />
        <Coil2D cam={cam} c={coilC} r0={40} r1={128} heat={heat} t={t} on={labK} layer="coil" />
        <StandClamp cam={cam} opacity={labK} />
        <StomachModel2 cam={cam} t={t} layer="back" />
        <Coil2D cam={cam} c={coilC} r0={40} r1={128} heat={heat} t={t} on={labK} layer="glow" />
        {met.ballVis && <Ball c={ballC} r={BALL_R * k} />}
        <FieldLines2D a={nf} b={target} spread={Math.max(40, Math.hypot(nf.x - target.x, nf.y - target.y) * 0.3)} w={Math.max(2, 4.2 * Math.min(k, 1.6))} t={t} on={fOn * 0.85} />
      </g>
      {lumpGlow > 0.01 && (
        <g opacity={lumpGlow}>
          <defs>
            <radialGradient id={glowId} gradientUnits="userSpaceOnUse" cx={lumpC.x.toFixed(1)} cy={lumpC.y.toFixed(1)} r={(R * 3.2).toFixed(1)}>
              <stop offset="0" stopColor="#E8FBFF" stopOpacity={0.42} />
              <stop offset="0.35" stopColor={C.field} stopOpacity={0.16} />
              <stop offset="1" stopColor={C.field} stopOpacity={0} />
            </radialGradient>
          </defs>
          <circle cx={lumpC.x.toFixed(1)} cy={lumpC.y.toFixed(1)} r={(R * 3.2).toFixed(1)} fill={`url(#${glowId})`} />
        </g>
      )}
      <ChromeBody
        prims={prims}
        blend={met.blend * k}
        R={R}
        cell={Math.max(1.5, Math.min(4, R / 26))}
        specs={2}
        warm={met.warm}
        env={{tint: C.stomach, amt: 0.35 * fade}}
      />
      <g opacity={fade}>
        <StomachModel2 cam={cam} t={t} layer="front" />
        <Magnet2D c={mc} ang={ang} sc={msc} handle={380} opacity={1 - ss(t, MAG_OFF[0], MAG_OFF[1])} />
      </g>
    </g>
  );
};

/** the exact hand-off frame (contract FU -> J1) */
export const FuSphere: React.FC = () => (
  <g>
    <rect width={1080} height={1920} fill={C.navy1} />
    <ChromeBody prims={[{k: 'c', x: FU_SPHERE.x, y: FU_SPHERE.y, r: FU_SPHERE.r}]} blend={12} R={FU_SPHERE.r} cell={3} specs={2} />
  </g>
);

export const FU: React.FC<{t: number}> = ({t}) => {
  let scene: React.ReactNode;
  if (t < FU_T.hold) {
    scene = (
      <g>
        <rect width={1080} height={1920} fill={C.navy1} />
        <HandoffBlob t={t} />
      </g>
    );
  } else if (t < FU_T.cut) scene = <WorldA t={t} />;
  else if (t < FU_T.exact) scene = <WorldB t={t} />;
  else scene = <FuSphere />;
  return (
    <>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        {scene}
      </svg>
      <Tag text="MAGNET STEERS IT" t={t} t0={22.9} t1={FU_T.cut - 0.02} x={FU_TAG.x} y={FU_TAG.y} tone="field" size={FU_TAG.size} />
      <Tag text="LAB DEMONSTRATION · STOMACH MODEL" t={t} t0={FU_T.cut + 0.08} t1={26.5} x={FU_TAG.x} y={FU_TAG.y} tone="dark" size={FU_TAG.size} />
      <Tag text="FUTURE IDEA" t={t} t0={26.62} t1={27.5} x={FU_TAG.x} y={FU_TAG.y} tone="warm" size={FU_TAG.size} />
    </>
  );
};

export const CUES_FU = (): Cue[] => [
  // the magnet slides in and its field reaches for the blob
  {t: 22.86, kind: 'field', gain: -5, dur: 1.2},
  // the blob necks into the narrow channel (end of "Scientists"), then runs through it
  {t: 23.07, kind: 'squeeze', gain: -6, dur: 0.5},
  {t: 23.12, kind: 'stream', gain: -5, dur: 0.75},
  // it gathers back into a bead by the magnet
  {t: 23.82, kind: 'drip', gain: -6},
  // the device's quick trip in (magnetic pull)
  {t: 24.0, kind: 'mag_hum', gain: -6, dur: 0.9},
  // it knocks the ball ("like this", unstressed)
  {t: FU_T.arrive, kind: 'clunk', gain: -7},
  // the induction coil energises ("could")
  {t: FU_T.coilOn - 0.02, kind: 'ac_on', gain: -4, dur: 0.75},
  // it melts and flows round the ball
  {t: 25.1, kind: 'melt', gain: -5, dur: 0.55},
  {t: 25.3, kind: 'squeeze', gain: -9, dur: 0.4},
  // cools solid in the water (field off)
  {t: 25.55, kind: 'cool', gain: -6, dur: 0.5},
  // the magnet pulls it back out (and keeps leading it up through the ghost body until it slips away at 27.3)
  {t: FU_T.lift, kind: 'field', gain: -5, dur: 1.35},
  // the pull back to the body (a soft chime under "from")
  {t: 26.47, kind: 'reveal', gain: -9, dur: 1.2},
  // the retrieved metal catches the light as we arrive on it (pause after "body")
  {t: 27.66, kind: 'glint', gain: -6},
];
void FU0;
void FU1;

/** debug / contract evidence: the lump's screen centre and radius at film time t (world B) */
export const fuLumpScreen = (t: number) => {
  const cam = camB(t);
  const p = camPt(cam, lumpPos(t));
  return {x: p.x, y: p.y, r: R_F * cam.k, k: cam.k};
};
/** debug: world-A liquid area / target */
export const fuAreaA = (t: number) => ({area: unionArea(liquidA(t).prims, 26), target: A0});
/** debug: world-B metal silhouette area (with the ball) / target */
export const fuAreaB = (t: number) => {
  const m = metalB(t);
  return {area: unionArea(m.ballVis ? [...m.prims, {k: 'c', x: BALL.x, y: BALL.y, r: BALL_R} as Prim] : m.prims, m.blend), target: A_DEV + A_BALL};
};
