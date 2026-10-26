// V3 beats D + E (11.42-18.79): one continuous molecular scene in one patch of air, the channel axis on screen along
// MICRO_ANG (up and to the right, like the beam in every macro view).
//   D1 11.42-12.3  C pushed into a packet; we open on its glow at screen centre. The packet runs on up the laser's path
//                  through a small group of molecules framed on the path (the air around it dim and sparse); on the
//                  quiet pings (EV.electronsFreed) electrons pop off the molecules it passes: a freed electron is a hot
//                  white point in a cyan-white glow with a motion streak (a bound one is a small ink-rimmed dot on its
//                  molecule), and it keeps drifting away from the path until the push carries it out of frame.
//   D2 11.9-13.45  the camera pushes in (and pans a little) to two molecules beside the path; the next packet of the
//                  train comes up into them once the push has settled (illustrative slow motion): one electron is torn
//                  away with a spark at 12.62, the neighbour's at 12.92; up to its spark each stays on its molecule's
//                  rim. Both molecules stay intact.
//   D3 13.43-14.3  heating, still close: the column warms (restrained warm accent) and its molecules jostle and move
//                  visibly outward across the frame, leaving a less dense channel along the axis.
//   D4 14.2-15.8   one pull-back rising along the axis ("narrow channel ... through the sky"): the warm region
//                  resolves into a narrow band running the length of the frame, the cyan path solid inside it.
//   E  15.83-18.6  the same channel: a stepped leader (white core, violet edges) runs up it while the air around stays
//                  quiet; side probes into ordinary air stall. The camera tracks gently, then from T_OUT pulls out
//                  toward the sky about P0_SCREEN, faster and faster; the leader's tip stops as its crackle ends (18.58)
//                  and its afterglow fades as the macro view takes over.
//   E' 18.38-18.79 the macro view (F's: View3 + F's own haze, DemoHaze) is drawn under the molecular layer at
//                  demoCam(t, Z(t)), Z(t) = Z_HAND * z / M_H, which reaches Z_HAND at 18.79 with log-velocity Z_V0 and the
//                  log-acceleration cams3 Z_A0 (F's zoom carries both on). The micro air (its band and laser line, which
//                  have already taken on the macro look) cross-fades into it first (18.4-18.74); the molecules (thinned
//                  by level of detail so the screen density stays even as they converge) and the leader's afterglow
//                  stay on top a little longer, so the zoom keeps a texture until 18.765. The last frame is F's
//                  opening frame (E -> F contract).
import React from 'react';
import {clamp, fmt, noise1} from '../dc/math';
import {ss} from '../lib';
import {View3} from './view3';
import {demoCam, P0_SCREEN, Z_HAND, Z_V0} from './cams3';
import {demoSt} from './states3';
import {B, EV} from './timeline3';
import {PAL} from './palette';
import {DemoHaze} from './Demo3_fx';
import {CA, camTr, Electron, frameBox, FreeElectron, MCam, Mol, molCell, MolDraw, molsIn, molsLod, SP, sparkPath, toScreen} from './Channel3_field';
import {buildLeader, LeaderDraw} from './Channel3_leader';

// ------------------------------------------------------------------ keyframes (cubic Hermite: time, value, slope)
type HK = [number, number, number];
const herm = (t: number, keys: HK[]) => {
  if (t <= keys[0][0]) return keys[0][1] + keys[0][2] * (t - keys[0][0]);
  for (let i = 0; i + 1 < keys.length; i++) {
    const [t0, v0, m0] = keys[i], [t1, v1, m1] = keys[i + 1];
    if (t > t1) continue;
    const h = t1 - t0, u = (t - t0) / h, u2 = u * u, u3 = u2 * u;
    return (2 * u3 - 3 * u2 + 1) * v0 + (u3 - 2 * u2 + u) * h * m0 + (-2 * u3 + 3 * u2) * v1 + (u3 - u2) * h * m1;
  }
  const [tl, vl, ml] = keys[keys.length - 1];
  return vl + ml * (t - tl);
};

// ------------------------------------------------------------------ the air, the channel, the representative molecules
const SEED = 6;
/** the channel's half-width once the heated air has expanded (micro units); also the warm band's half-width at half
 *  strength */
const CH_W = 210;
const findMol = (x: number, y: number): Mol => {
  const i = Math.floor(x / SP), j = Math.floor(y / SP);
  for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) {
    const m = molCell(i + di, j + dj, SEED);
    if (Math.hypot(m.x - x, m.y - y) < 40) return m;
  }
  throw new Error(`Channel3: no molecule near ${x},${y}`);
};
/** the two representative molecules beside the path, one above the other (one eye zone): an O2 (torn at 12.62) and
 *  the N2 above it (12.92); both electrons leave on the same side, away from the path */
const REP = [
  {m: findMol(-89, 42), t: EV.tornAway[0], side: -1},
  {m: findMol(-73, -84), t: EV.tornAway[1], side: -1},
];
const isRep = (m: Mol) => REP.some((r) => r.m.id === m.id);
const REPC = (REP[0].m.y + REP[1].m.y) / 2;

// ------------------------------------------------------------------ the packets (pulses of the laser's train)
/** P1: the packet C pushed into; it runs up the path through the group and out of the frame */
const P1: HK[] = [
  [B.D, 170, -700],
  [12.3, -470, -760],
];
/** P2: the next pulse of the train; it comes up into the close-up once the push has settled (illustrative slow
 *  motion), reaching each representative molecule on its spark */
const P2_T0 = 12.42;
const P2: HK[] = [
  [P2_T0, REP[0].m.y + 330, -2300], // just below the frame, fast, slowing into the close-up
  [EV.tornAway[0], REP[0].m.y - 5, -390],
  [EV.tornAway[1], REP[1].m.y + 5, -390],
  [13.25, REP[1].m.y - 380, -1900],
];
const packetY = (t: number) => herm(t, P1);
const packet2Y = (t: number) => herm(t, P2);

/** the quiet pings: each frees one electron from a molecule the packet's light is passing at that moment */
const POPS = (() => {
  const cands = molsIn({x0: -320, x1: 320, y0: -820, y1: 420}, SEED).filter((m) => Math.abs(m.x) < 215 && !isRep(m));
  const used = new Set<number>();
  const out: {m: Mol; t: number}[] = [];
  for (const tp of EV.electronsFreed) {
    const yp = packetY(tp);
    let best: Mol | null = null, bd = 1e9;
    for (const m of cands) {
      if (used.has(m.id)) continue;
      const d = m.y - yp; // > 0: the packet's centre has just passed it
      if (d < -150 || d > 170) continue;
      const score = Math.abs(d - 25) + 0.6 * Math.abs(m.x);
      if (score < bd) { bd = score; best = m; }
    }
    if (best) { used.add(best.id); out.push({m: best, t: tp}); }
  }
  return out;
})();
const popOf = new Map(POPS.map((p) => [p.m.id, p]));
/** D1's group: the molecules on the packet's path (the ones it frees electrons from, the two representatives and the
 *  few others inside a small ellipse round the path); everything else is quiet air */
const GROUP = (() => {
  const g = new Set<number>([...POPS.map((p) => p.m.id), ...REP.map((r) => r.m.id)]);
  for (const m of molsIn({x0: -320, x1: 320, y0: -820, y1: 420}, SEED)) {
    if ((m.x / 185) ** 2 + ((m.y + 130) / 380) ** 2 < 0.8) g.add(m.id);
  }
  return g;
})();

// ------------------------------------------------------------------ the camera
const ln = Math.log;
/** E: the channel a narrow warm band running the length of the frame (the band's half-strength width = 2 CH_W z) */
const Z_E0 = 0.665, Z_E1 = 0.62;
/** the pull-out toward the sky starts at T_OUT and zooms out ever faster, covering L_OUT of ln z before the
 *  hand-off, where its log-velocity is cams3 Z_V0 (and its log-acceleration cams3 Z_A0): F's zoom carries both on */
const T_OUT = 17.85, L_OUT = 1.2;
/** the micro scale at the hand-off (F's macro view is then at Z_HAND) */
export const M_H = Z_E1 * Math.exp(-L_OUT);
const ZK: HK[] = [
  [B.D, ln(1.32), 0.3], // continuing C's push a little, settling
  [11.9, ln(1.43), 0],
  [12.56, ln(2.7), 0], // pushed in on the two molecules
  [13.45, ln(2.76), 0],
  [13.9, ln(2.45), -1.0], // heating: close while the molecules move out, then opening so the channel reads narrow by 'channel' (14.30)
  [14.4, ln(1.25), -0.9],
  [15.8, ln(Z_E0), -0.03], // one pull-back along the axis: the narrow channel through the sky
  [T_OUT, ln(Z_E1), -0.03], // E: steady, a gentle drift
  [B.F, ln(M_H), Z_V0], // the pull-out toward the sky; the hand-off
];
const CY_END = -1300;
const CY: HK[] = [
  [B.D, 170, -380], // riding with the packet at first, then letting it run on through the group
  [11.9, 62, -70],
  [12.56, REPC + 18, -12],
  [13.45, REPC + 6, -25],
  [14.3, REPC - 40, -130],
  [15.8, -760, -300], // rising along the axis as the view widens
  [T_OUT, CY_END, 0], // (then still: the pull-out is a pure zoom about P0_SCREEN)
];
const ANCHOR0 = {x: 540, y: 960};
export const microCam = (t: number): MCam => {
  const k = ss(t, 13.6, 14.6);
  const ax0 = ANCHOR0.x + 100 * ss(t, 11.9, 12.56); // the push in pans a little toward the two molecules
  return {
    ax: ax0 + (P0_SCREEN.x - ax0) * k,
    ay: ANCHOR0.y + (P0_SCREEN.y - ANCHOR0.y) * k,
    cy: herm(t, CY),
    z: Math.exp(herm(t, ZK)),
  };
};
/** the macro zoom under the molecular layer in the last moments (Z_HAND exactly at 18.79) */
const macroZ = (t: number) => (Z_HAND * microCam(t).z) / M_H;
const T_UNDER = 18.38;
const Z_OUT = Math.exp(herm(T_OUT, ZK));
/** level of detail in the pull-out: the fraction of molecules kept, so the drawn density stays even as they converge */
const lodKeep = (z: number) => Math.min(1, (z / Z_OUT) ** 1.5);

// ------------------------------------------------------------------ the leader (E)
const LEADER = (() => {
  const c = microCam(EV.leaderRuns);
  const yAt = (sy: number) => c.cy + (sy - c.ay) / (CA * c.z); // the axis point drawn at screen height sy
  const y0 = yAt(1920) + 60; // just below the frame
  const spec = {t0: EV.leaderRuns, y0, chW: CH_W, n: 30, entry: y0 - yAt(1470), yBase: y0 + 7000, stepL: 1.25};
  // its last step starts as the crackle ends
  let n = 40;
  while (n > 12 && buildLeader({...spec, n}).times[n - 1] > EV.leaderEnds - 0.06) n--;
  return buildLeader({...spec, n});
})();

// ------------------------------------------------------------------ the molecules' state
const d1K = (t: number) => 1 - ss(t, 12.0, 12.4); // D1's framing of the group on the path
const heatK = (t: number) => ss(t, EV.heating, EV.heating + 0.45);
/** the integral of heatK (s): the hot molecules' faster spin and jostle are integrated rates, so they speed up
 *  smoothly as the air heats instead of whirling through the ramp */
const heatInt = (t: number) => {
  const d = 0.45, u = (t - EV.heating) / d;
  return u <= 0 ? 0 : u >= 1 ? d * 0.5 + (t - EV.heating - d) : d * (u ** 3 - u ** 4 / 2);
};
const pushK = (t: number) => ss(t, EV.heating + 0.07, 14.25) * 0.88 + 0.12 * ss(t, 14.0, 15.2); // still easing out a little
const wideK = (t: number) => ss(t, 14.3, 15.3);
/** where a molecule is drawn (after the heated column expands), how warm and how quiet */
const molState = (m: Mol, t: number) => {
  const pk = pushK(t), hk = heatK(t), wk = wideK(t), d1 = d1K(t);
  const rep = isRep(m), grp = GROUP.has(m.id);
  const keep = !rep && m.r2 < 0.24; // a few stay inside: lower density, not a vacuum
  const ax = Math.abs(m.x), sg = Math.sign(m.x) || 1;
  const x0 = keep ? m.x * (1 + 0.3 * pk) : m.x + sg * pk * CH_W * 1.05 * Math.exp(-ax / (3 * CH_W));
  // warm where it is now (the heated column), warmest for those that started on the path
  const sp = Math.exp(-((x0 / (CH_W * 1.25)) ** 2)) * (0.5 + 0.5 * Math.exp(-((ax / CH_W) ** 2)));
  const heat = hk * sp, hi = sp * heatInt(t);
  const jg = 4 + 22 * heat;
  const ph = m.ph, idn = m.id % 997;
  const x = x0 + jg * noise1(t * 1.3 + 4.5 * hi + ph, idn);
  const y = m.y + jg * noise1(t * 1.1 + 4.5 * hi + ph * 2, idn + 9);
  const th = m.th + (24 * t + 260 * hi) * (m.id % 2 ? 1 : -1);
  // contrast: D1's group crisp and the air round it dim and sparse; in the close-up the two molecules; wide, quiet air
  const close = rep ? 0 : 0.36 * ss(t, 12.2, 12.5) * (1 - ss(t, 13.4, 13.9));
  // (in the pull-out toward the sky the air gets a little more contrast: it is the texture that shows the zoom)
  const dim = Math.max(grp ? 0 : 0.8 * d1, 0.6 * wk * (keep ? 0.6 : 1) * (1 - 0.45 * ss(t, T_OUT, 18.45)), close);
  const thin = !grp && !keep && m.r3 > 0.55 ? 0.8 * Math.max(d1, wk) : !grp && m.r3 > 0.3 ? 0.45 * d1 : 0;
  return {x, y, th, heat, dim, keep, alpha: 1 - thin};
};

// ------------------------------------------------------------------ pieces
const orbit = (m: Mol, x: number, y: number, t: number, r = 1) => ({x: x + 30 * r * Math.cos(t * 2.4 + m.ph), y: y + 21 * r * Math.sin(t * 2.4 + m.ph)});
/** a freed electron's flight: out from where it was bound, away from the path, slowing to a steady drift */
const flight = (e0: {x: number; y: number}, dx: number, dy: number, S: number, tau: number, V: number, age: number) => {
  const n = Math.hypot(dx, dy) || 1, ux = dx / n, uy = dy / n;
  const s = S * (1 - Math.exp(-age / tau)) + V * age, v = (S / tau) * Math.exp(-age / tau) + V;
  return {x: e0.x + ux * s, y: e0.y + uy * s, vx: ux * v, vy: uy * v};
};
/** a representative molecule's bound electron: up to its spark it stays on the molecule's rim (at most ~43 units from
 *  the centre), its orbit drawn round toward the side it will leave from as the pulse's light reaches it */
const repBound = (i: number, t: number) => {
  const r = REP[i];
  const s = molState(r.m, t);
  const tug = clamp((t - (r.t - 0.3)) / 0.3) ** 2;
  const a0 = t * 2.4 + r.m.ph, aT = r.t * 2.4 + r.m.ph;
  const tgt = (r.side > 0 ? 0 : Math.PI) + 2 * Math.PI * Math.round((aT - (r.side > 0 ? 0 : Math.PI)) / (2 * Math.PI));
  const ang = a0 + (tgt - a0) * tug, R = 1 + 0.22 * tug;
  const wob = Math.sin(t * 46 + i) * 4 * tug;
  return {x: s.x + 30 * R * Math.cos(ang) + r.side * 6 * tug + wob, y: s.y + 21 * R * Math.sin(ang) - 6 * tug, tug, s};
};

/** a packet: an elongated cyan-white pulse with a soft glow, travelling up the axis; bloom: the glow C pushed into.
 *  Its drawn size grows only gently with the zoom, so in the close-up it stays a pulse, not a flood of light. */
const Packet: React.FC<{y: number; z: number; a: number; bloom: number; id: string}> = ({y, z, a, bloom, id}) => {
  if (a <= 0.01) return null;
  const sz = Math.min(1, (1.45 / z) ** 0.6);
  const st = (k: number) => sz * (1 + 0.35 * bloom * k);
  return (
    <g style={{mixBlendMode: 'screen'}} opacity={fmt(a)}>
      <defs>
        <radialGradient id={`${id}-h`}>
          <stop offset="0" stopColor={PAL.laser} stopOpacity={0.55} />
          <stop offset="0.45" stopColor={PAL.laserGlow} stopOpacity={0.26} />
          <stop offset="1" stopColor={PAL.laserGlow} stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${id}-c`}>
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={1} />
          <stop offset="0.5" stopColor={PAL.packet} stopOpacity={0.95} />
          <stop offset="1" stopColor={PAL.laser} stopOpacity={0} />
        </radialGradient>
      </defs>
      {bloom > 0.01 && <circle cx={0} cy={fmt(y)} r={fmt(430 / z)} fill={`url(#${id}-h)`} opacity={fmt(bloom)} />}
      <ellipse cx={0} cy={fmt(y)} rx={fmt(118 * st(1))} ry={fmt(250 * st(1))} fill={`url(#${id}-h)`} />
      <ellipse cx={0} cy={fmt(y)} rx={fmt(30 * st(0.6))} ry={fmt(118 * st(0.6))} fill={`url(#${id}-c)`} />
      <ellipse cx={0} cy={fmt(y)} rx={fmt(9 * sz)} ry={fmt(62 * sz)} fill="#FFFFFF" />
    </g>
  );
};
/** a packet's glow is kept out of the caption band: it fades in as it rises above it */
const capMask = (mc: MCam, y: number) => clamp((1660 - toScreen(mc, 0, y).y) / 240);

/** the farther air (parallax), quieter still; it thins inside the channel as the column expands */
const FarAir: React.FC<{mc: MCam; t: number}> = ({mc, t}) => {
  const k = 0.55;
  const box = frameBox(mc, k, 40);
  const dots = molsLod(box, 77, lodKeep(mc.z), 170);
  const pk = pushK(t);
  const zk = mc.z * k;
  const quiet = (1 - 0.45 * d1K(t)) * (0.05 + 0.95 * ss(t, B.D, B.D + 0.4)); // D1: the small group on the path is the thing to look at (and the air fades in under the packet's bloom)
  return (
    <g transform={camTr(mc, k)}>
      {dots.map(({m, lod}) => {
        const ax = Math.abs(m.x) * k; // its distance from the axis on screen, in near units
        const thin = pk * Math.exp(-((ax / (CH_W * 1.05)) ** 4));
        const a = 0.13 * (1 - 0.85 * thin) * quiet * lod;
        if (a < 0.02) return null;
        return <circle key={m.id} cx={fmt(m.x + 9 * noise1(t * 0.8 + m.ph, m.id % 97))} cy={fmt(m.y + 9 * noise1(t + m.ph, (m.id % 97) + 3))} r={fmt(Math.max(13, 2.5 / zk))} fill={m.o2 ? '#9A6A64' : '#5A7590'} opacity={fmt(a)} />;
      })}
    </g>
  );
};

const erf = (x: number) => {
  const s = Math.sign(x), ax = Math.abs(x), k = 1 / (1 + 0.3275911 * ax);
  return s * (1 - ((((1.061405429 * k - 1.453152027) * k + 1.421413741) * k - 0.284496736) * k + 0.254829592) * k * Math.exp(-ax * ax));
};
/** the macro haze at the hand-off (Scene3 Beam3D / Demo3_fx DemoHaze at Z_HAND): a 260 px ribbon of
 *  PAL.channelMacro at 0.34 x 0.85, screen-blended, blurred by 22 px */
const RIB = {w: 260, blur: 22, a: 0.34 * 0.85};
/** the prepared air: a soft warm band along the axis (a region of the air, no edges), PAL.channelMacro screen-blended
 *  like the macro haze; hw: its half-width at half strength (micro units), a: its strength; rib (0..1) morphs it into
 *  the macro haze's ribbon for the hand-off */
const Band: React.FC<{box: {y0: number; y1: number}; z: number; hw: number; a: number; rib: number}> = ({box, z, hw, a, rib}) => {
  if (a * (1 - rib) + RIB.a * rib <= 0.004) return null;
  const hR = RIB.w / 2 / z, sR = (RIB.blur / z) * Math.SQRT2;
  const X = Math.max(2.3 * hw, hR + 3 * sR);
  const prof = (x: number) => (1 - rib) * a * Math.exp(-0.693 * (x / hw) ** 3) + rib * RIB.a * 0.5 * (erf((hR - x) / sR) + erf((hR + x) / sR));
  const N = 24;
  const xs = Array.from({length: 2 * N + 1}, (_, i) => (X * (i - N)) / N);
  return (
    <g style={{mixBlendMode: 'screen'}}>
      <defs>
        <linearGradient id="de-band" gradientUnits="userSpaceOnUse" x1={fmt(-X)} y1={0} x2={fmt(X)} y2={0}>
          {xs.map((x, i) => <stop key={i} offset={((x + X) / (2 * X)).toFixed(4)} stopColor={PAL.channelMacro} stopOpacity={prof(Math.abs(x)).toFixed(4)} />)}
        </linearGradient>
      </defs>
      <rect x={fmt(-X)} y={fmt(box.y0)} width={fmt(2 * X)} height={fmt(box.y1 - box.y0)} fill="url(#de-band)" />
    </g>
  );
};

// ------------------------------------------------------------------ the micro air: background, band, laser line
const MicroAir: React.FC<{t: number; mc: MCam}> = ({t, mc}) => {
  const z = mc.z;
  const box = frameBox(mc, 1, 120);
  const px = (p: number) => p / z;
  const hk = heatK(t), pk = pushK(t);
  // the warm channel, restrained; a gentle shimmer while it is being heated
  const shimmer = 1 + 0.12 * noise1(t * 7, 91) * (ss(t, EV.heating, 13.7) - ss(t, 15.5, 15.75));
  // (close up, the warmth is carried by the molecules' glow; the band takes over as the molecules move out)
  const bandA = (0.07 * hk + 0.29 * pk * ss(t, 13.6, 14.4)) * shimmer;
  // in the pull-out the band holds its width on screen (the macro haze it becomes is as wide) and takes on its look
  const hw = CH_W * (t > T_OUT ? Z_OUT / z : 1);
  const rib = ss(t, 18.25, 18.6);
  // the laser's path: a thin cyan line along the axis (its pulses are the packets). On the dark air it is a
  // screen-blended line; inside the warm band it is drawn solid over a soft dark underlay, so it stays cyan; at the
  // hand-off it is the macro beam (Beam3D: PAL.laser 5 px at 0.81 over a 16 px PAL.laserGlow glow at 0.2)
  const solid = ss(t, 13.2, 13.8);
  const end = ss(t, 18.3, 18.62);
  const L = `M0,${fmt(box.y0)} L0,${fmt(box.y1)}`;
  return (
    <g>
      <rect x={0} y={0} width={1080} height={1920} fill="#131D2B" />
      <FarAir mc={mc} t={t} />
      <g transform={camTr(mc)}>
        <Band box={box} z={z} hw={hw} a={bandA} rib={rib} />
        <g style={{mixBlendMode: 'screen'}}>
          <path d={L} stroke={PAL.laserGlow} strokeOpacity={fmt(0.1 + 0.05 * solid * (1 - end) + 0.1 * end)} strokeWidth={fmt(px(9 + 3 * solid + 4 * end))} />
          {solid < 1 && <path d={L} stroke={PAL.laser} strokeOpacity={fmt(0.45 * (1 - solid))} strokeWidth={fmt(px(2.4))} />}
          {end > 0 && <path d={L} stroke={PAL.laser} strokeOpacity={fmt(0.81 * end)} strokeWidth={fmt(px(5))} />}
        </g>
        {solid * (1 - end) > 0.005 && (
          <g opacity={fmt(solid * (1 - end))}>
            <path d={L} stroke="#131D2B" strokeOpacity={0.34} strokeWidth={fmt(px(9))} />
            <path d={L} stroke={PAL.laser} strokeOpacity={0.74} strokeWidth={fmt(px(3.6))} />
          </g>
        )}
      </g>
    </g>
  );
};

// ------------------------------------------------------------------ the molecular layer (over the air)
const MicroTex: React.FC<{t: number; mc: MCam}> = ({t, mc}) => {
  const z = mc.z;
  const box = frameBox(mc, 1, 120);
  const px = (p: number) => p / z;
  const elZ = clamp((z - 1.0) / 0.3); // bound electrons are drawn only while we are close
  // the field comes up under the packet's bloom (C ends on a darkened sky), so the background never switches in one frame
  const fadeIn = 0.05 + 0.95 * ss(t, B.D, B.D + 0.4); // C ends on D's own background, so the field can start from ~0
  // the molecules and the leader's afterglow stay over the macro view a little after the air has cross-faded
  const texA = 1 - ss(t, 18.62, 18.765);
  const mols = molsLod(box, SEED, lodKeep(z));
  const molEls: React.ReactNode[] = [];
  const free: React.ReactNode[] = [];
  for (const {m, lod} of mols) {
    const s = molState(m, t);
    if (s.x < box.x0 || s.x > box.x1 || s.y < box.y0 || s.y > box.y1) continue;
    const pop = popOf.get(m.id);
    const rep = isRep(m);
    const mA = fadeIn * s.alpha * lod * texA;
    molEls.push(<MolDraw key={m.id} m={m} s={{x: s.x, y: s.y, th: s.th, heat: s.heat, alpha: mA, dim: s.dim}} z={z} warm={PAL.channel} heatGlow="url(#de-heat)" />);
    if (rep) continue; // its electron is drawn below
    const bound = !pop || t < pop.t;
    const eA = elZ * clamp(1.5 - s.dim / 0.5) * mA; // (dims with its molecule, never at a threshold)
    if (bound && eA > 0.01) {
      const e = orbit(m, s.x, s.y, t);
      free.push(<Electron key={`e${m.id}`} x={e.x} y={e.y} z={z} a={eA} dim={s.dim} />);
    }
    if (pop && t >= pop.t) {
      // an electron freed by the passing pulse: a flash and a spark, then it flies off away from the path and drifts
      // on (the push carries it out of the frame); it fades to nothing after about 1.7 s
      const age = t - pop.t;
      const s0 = molState(m, pop.t);
      const e0 = orbit(m, s0.x, s0.y, pop.t);
      const sg = Math.sign(m.x) || 1;
      const f = flight(e0, sg, -(0.35 + 0.45 * m.r3), 150 + 90 * m.r1, 0.45, 55, age);
      const a = clamp((1.7 - age) / 0.7) * fadeIn;
      if (age < 0.18) {
        const k = age / 0.18;
        free.push(
          <g key={`s${m.id}`} style={{mixBlendMode: 'screen'}}>
            <circle cx={fmt(e0.x)} cy={fmt(e0.y)} r={fmt(px(60) * (0.6 + k))} fill="url(#de-flash)" opacity={fmt(1 - k)} />
            <path d={sparkPath(e0.x, e0.y, px(57) * (1.2 - k), 0.4)} stroke="#FFFFFF" strokeWidth={fmt(px(3.6))} strokeLinecap="round" opacity={fmt(1 - 0.6 * k)} />
          </g>,
        );
      }
      free.push(<FreeElectron key={`f${m.id}`} x={f.x} y={f.y} vx={f.vx} vy={f.vy} z={z} a={a} glowUrl="url(#de-free)" />);
    }
  }
  // the two representative molecules: the bound electron's cloud is stretched by the pulse's light, then torn away
  const reps = REP.map((r, i) => {
    const b = repBound(i, t);
    const s = b.s;
    const age = t - r.t;
    const show = ss(t, 12.12, 12.4) * (1 - ss(t, 13.6, 14.0)); // its electron cloud, in the close-up
    const eA = elZ * fadeIn * s.alpha * texA;
    const tug = b.tug;
    const cx = s.x + r.side * 14 * tug, cyy = s.y - 5 * tug;
    let el: React.ReactNode = null;
    if (age <= 0) el = <Electron x={b.x} y={b.y} z={z} a={eA * clamp(1.5 - s.dim / 0.5)} glow={0.35 + 0.25 * tug} dim={s.dim} />;
    else {
      const e0 = repBound(i, r.t);
      const f = flight(e0, r.side, -0.42, 78, 0.33, 36, age);
      el = (
        <g>
          <FreeElectron x={f.x} y={f.y} vx={f.vx} vy={f.vy} z={z} a={fadeIn * clamp((1.6 - age) / 0.6)} glowUrl="url(#de-free)" />
          {age < 0.2 && (
            <g style={{mixBlendMode: 'screen'}}>
              <circle cx={fmt(e0.x)} cy={fmt(e0.y)} r={fmt(px(80) * (0.6 + age / 0.2))} fill="url(#de-flash)" opacity={fmt(1 - age / 0.2)} />
              <path d={sparkPath(e0.x, e0.y, px(64) * (1.3 - age / 0.2), 0.3)} stroke="#FFFFFF" strokeWidth={fmt(px(5))} strokeLinecap="round" />
            </g>
          )}
        </g>
      );
    }
    const cloudA = (age < 0 ? 1 : clamp(1 - age / 0.12)) * show;
    return (
      <g key={`r${i}`}>
        {cloudA > 0.01 && <ellipse cx={fmt(cx)} cy={fmt(cyy)} rx={fmt(58 + 16 * tug)} ry={fmt(46 - 4 * tug)} fill="url(#de-cloud)" opacity={fmt(cloudA)} transform={`rotate(${fmt(r.side * 10 * tug)} ${fmt(cx)} ${fmt(cyy)})`} />}
        {el}
      </g>
    );
  });
  // the leader: full until its crackle ends (18.58; its tip stops), then an afterglow fading as the macro view takes over
  const live = 1 - ss(t, EV.leaderEnds - 0.08, EV.leaderEnds + 0.04);
  const after = ss(t, 18.45, 18.68);
  const leaderA = 1 - ss(t, 18.62, 18.765);
  const p1A = (1 - ss(t, 12.3, 12.48)) * capMask(mc, packetY(t));
  const p2A = t >= P2_T0 ? (1 - ss(t, 13.2, 13.45)) * capMask(mc, packet2Y(t)) : 0;
  return (
    <g>
    <g transform={camTr(mc)}>
      <defs>
        <radialGradient id="de-cloud">
          <stop offset="0" stopColor="#CFF4FF" stopOpacity={0.36} />
          <stop offset="0.6" stopColor="#9FDCF0" stopOpacity={0.13} />
          <stop offset="1" stopColor="#9FDCF0" stopOpacity={0} />
        </radialGradient>
        <radialGradient id="de-heat">
          <stop offset="0" stopColor={PAL.channel} stopOpacity={0.42} />
          <stop offset="0.55" stopColor={PAL.channel} stopOpacity={0.16} />
          <stop offset="1" stopColor={PAL.channel} stopOpacity={0} />
        </radialGradient>
        <radialGradient id="de-flash">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.75} />
          <stop offset="0.4" stopColor="#E6F8FF" stopOpacity={0.3} />
          <stop offset="1" stopColor="#E6F8FF" stopOpacity={0} />
        </radialGradient>
        <radialGradient id="de-free">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.95} />
          <stop offset="0.3" stopColor="#B8F2FF" stopOpacity={0.55} />
          <stop offset="1" stopColor="#7FE3F5" stopOpacity={0} />
        </radialGradient>
      </defs>
      {molEls}
      {reps}
      {free}
      <Packet y={packetY(t)} z={z} a={p1A} bloom={1 - ss(t, B.D, B.D + 0.3)} id="de-p1" />
      <Packet y={packet2Y(t)} z={z} a={p2A} bloom={0} id="de-p2" />
    </g>
    <LeaderDraw L={LEADER} t={t} z={z} a={leaderA} box={box} id="de-ld" tr={camTr(mc)} live={live} after={after} />
    </g>
  );
};

/** F's opening view under the molecular layer: what DemoF draws at 18.79 (View3 without Beam3D's haze, F's own
 *  haze), at the zoom that reaches Z_HAND at the hand-off */
const MacroUnder: React.FC<{t: number}> = ({t}) => {
  const Z = macroZ(t);
  const cam = demoCam(t, Z);
  return (
    <View3 cam={cam} st={{...demoSt(t), channel: 0, bracket: 0, label: 0}} t={t} tag="de" dk={0}>
      <DemoHaze cam={cam} Z={Z} a={0.85} macro={0} id="de-hz" />
    </View3>
  );
};

export const ChannelDE: React.FC<{t: number}> = ({t}) => {
  const mc = microCam(t);
  const airA = 1 - ss(t, 18.4, 18.74);
  return (
    <g>
      {t >= T_UNDER && <MacroUnder t={t} />}
      {airA > 0.002 && (
        <g opacity={fmt(airA)}>
          <MicroAir t={t} mc={mc} />
        </g>
      )}
      {t < 18.77 && <MicroTex t={t} mc={mc} />}
    </g>
  );
};
