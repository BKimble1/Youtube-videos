// V3 beats D + E (11.42-18.79): one continuous molecular scene in one patch of air, the channel axis on screen along
// MICRO_ANG (up and to the right, like the beam in every macro view).
//   D1 11.42-12.3  C pushed into a packet; we open on its glow at screen centre. The packet runs on up the laser's path
//                  through a small group of molecules; on the quiet pings (EV.electronsFreed) a few electrons pop off.
//   D2 12.1-13.45  the camera pushes in on two molecules on the path; the next packet of the train sweeps up through
//                  them (illustrative slow motion): one electron is torn away with a spark at 12.62, the neighbour's at
//                  12.92. Both molecules stay intact.
//   D3 13.43-15.8  heating: the column warms (restrained warm accent), its molecules jostle and move outward, and a
//                  narrow, less dense channel remains along the axis; the camera pulls back and rises along it.
//   E  15.83-18.6  the same channel: a stepped leader (white core, violet edges) runs up it while the air around stays
//                  quiet; side probes into ordinary air stall. The camera tracks gently, then (17.55-18.79) pulls out
//                  toward the sky about P0_SCREEN; the leader fades as its crackle ends (18.58).
//   E' 18.45-18.79 the macro View3 is drawn under the molecular layer at demoCam(t, Z(t)), Z(t) = Z_HAND * z / M_H
//                  -> Z_HAND at 18.79 with log-velocity Z_V0 (F's zoom carries it on); the band and beam line already have the macro look, and the
//                  molecules cross-fade out (18.5-18.765) once the channel's screen width matches the macro haze, so the
//                  last frame is F's opening frame (E -> F contract).
import React from 'react';
import {clamp, fmt, noise1} from '../dc/math';
import {ss} from '../lib';
import {View3} from './view3';
import {demoCam, P0_SCREEN, Z_HAND, Z_V0} from './cams3';
import {demoSt} from './states3';
import {B, EV} from './timeline3';
import {PAL} from './palette';
import {CA, camTr, Electron, frameBox, MCam, Mol, molCell, MolDraw, molsIn, SP, sparkPath} from './Channel3_field';
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
/** the channel's half-width once the heated air has expanded (micro units) */
const CH_W = 210;
/** the micro scale at the hand-off: the channel band (50% points at +-1.05 CH_W) is as wide as F's macro haze */
export const M_H = 250 / (2.1 * CH_W);
const findMol = (x: number, y: number): Mol => {
  const i = Math.floor(x / SP), j = Math.floor(y / SP);
  for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) {
    const m = molCell(i + di, j + dj, SEED);
    if (Math.hypot(m.x - x, m.y - y) < 40) return m;
  }
  throw new Error(`Channel3: no molecule near ${x},${y}`);
};
/** the two representative molecules on the path: an O2 (torn at 12.62) and its N2 neighbour above (12.92) */
const REP = [
  {m: findMol(81, 50), t: EV.tornAway[0], side: 1},
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
/** P2: the next pulse of the train; it sweeps up through the close-up (illustrative slow motion) */
const P2: HK[] = [
  [12.3, REP[0].m.y + 530, -3000], // enters from below the frame fast, slowing into the close-up
  [EV.tornAway[0], REP[0].m.y - 10, -330],
  [EV.tornAway[1], REP[0].m.y - 108, -330],
  [13.25, REP[1].m.y - 420, -1900],
];
const packetY = (t: number) => herm(t, P1);
const packet2Y = (t: number) => herm(t, P2);

/** the quiet pings: each frees one electron from a molecule the packet's light is passing at that moment */
const POPS = (() => {
  const cands = molsIn({x0: -260, x1: 260, y0: -700, y1: 260}, SEED).filter((m) => Math.abs(m.x) < 200 && !isRep(m));
  const used = new Set<number>();
  const out: {m: Mol; t: number}[] = [];
  for (const tp of EV.electronsFreed) {
    const yp = packetY(tp);
    let best: Mol | null = null, bd = 1e9;
    for (const m of cands) {
      if (used.has(m.id)) continue;
      const d = m.y - yp; // > 0: the packet's centre has just passed it
      if (d < -100 || d > 140) continue;
      const score = Math.abs(d - 25) + 0.5 * Math.abs(m.x);
      if (score < bd) { bd = score; best = m; }
    }
    if (best) { used.add(best.id); out.push({m: best, t: tp}); }
  }
  return out;
})();
const popOf = new Map(POPS.map((p) => [p.m.id, p]));

// ------------------------------------------------------------------ the camera
const ln = Math.log;
const ZK: HK[] = [
  [B.D, ln(1.32), 0.3], // continuing C's push a little, settling
  [12.12, ln(1.45), 0],
  [12.55, ln(3.0), 0], // pushed in on the two molecules
  [13.45, ln(3.06), 0],
  [14.5, ln(1.0), -0.42], // pull back: the narrow channel
  [15.65, ln(0.86), 0], // through the sky
  [17.55, ln(0.835), -0.03], // E: steady, a gentle drift
  [B.F, ln(M_H), Z_V0], // pull-out toward the sky; the hand-off (log-velocity = cams3 Z_V0: F's zoom carries it on)
];
const CY_END = -1500;
const CY: HK[] = [
  [B.D, 170, -380], // riding with the packet at first, then letting it run on through the group
  [12.12, 50, -40],
  [12.55, REPC + 22, -12],
  [13.45, REPC + 8, -30],
  [14.5, -330, -380], // rising along the axis as the view widens
  [15.65, -720, -230],
  [18.2, CY_END, 0],
];
const ANCHOR0 = {x: 540, y: 960};
export const microCam = (t: number): MCam => {
  const k = ss(t, 13.6, 14.6);
  return {
    ax: ANCHOR0.x + (P0_SCREEN.x - ANCHOR0.x) * k,
    ay: ANCHOR0.y + (P0_SCREEN.y - ANCHOR0.y) * k,
    cy: herm(t, CY),
    z: Math.exp(herm(t, ZK)),
  };
};
/** the macro zoom under the molecular layer in the last half-second (Z_HAND exactly at 18.79) */
const macroZ = (t: number) => (Z_HAND * microCam(t).z) / M_H;
const T_UNDER = 18.45;

// ------------------------------------------------------------------ the leader (E)
const LEADER = (() => {
  const c = microCam(EV.leaderRuns);
  const yAt = (sy: number) => c.cy + (sy - c.ay) / (CA * c.z); // the axis point drawn at screen height sy
  const y0 = yAt(1920) + 60; // just below the frame
  return buildLeader({t0: EV.leaderRuns, y0, chW: CH_W, n: 30, entry: y0 - yAt(1470)});
})();

// ------------------------------------------------------------------ the molecules' state
const heatK = (t: number) => ss(t, EV.heating, EV.heating + 0.45);
const pushK = (t: number) => ss(t, EV.heating + 0.1, 14.55) * 0.88 + 0.12 * ss(t, 14.2, 15.4); // still easing out a little
const wideK = (t: number) => ss(t, 13.7, 14.8);
/** where a molecule is drawn (after the heated column expands), how warm and how quiet */
const molState = (m: Mol, t: number) => {
  const pk = pushK(t), hk = heatK(t), wk = wideK(t);
  const rep = isRep(m);
  const keep = !rep && m.r2 < 0.24; // a few stay inside: lower density, not a vacuum
  const ax = Math.abs(m.x), sg = Math.sign(m.x) || 1;
  const x0 = keep ? m.x * (1 + 0.3 * pk) : m.x + sg * pk * CH_W * 1.05 * Math.exp(-ax / (3 * CH_W));
  // warm where it is now (the heated column), warmest for those that started on the path
  const heat = hk * Math.exp(-((x0 / (CH_W * 1.25)) ** 2)) * (0.5 + 0.5 * Math.exp(-((ax / CH_W) ** 2)));
  const jg = 4 + 22 * heat;
  const ph = m.ph, idn = m.id % 997;
  const x = x0 + jg * noise1(t * (1.3 + 4.5 * heat) + ph, idn);
  const y = m.y + jg * noise1(t * (1.1 + 4.5 * heat) + ph * 2, idn + 9);
  const th = m.th + (24 + 260 * heat) * t * (m.id % 2 ? 1 : -1);
  // contrast: the group on the path is crisp; the rest of the air stays quiet (low contrast, sparser when wide)
  const near = clamp((ax - 150) / 200) * 0.7;
  const close = rep ? 0 : 0.36 * ss(t, 12.2, 12.5) * (1 - ss(t, 13.4, 13.9));
  const dim = Math.max(near * (1 - wk), 0.6 * wk * (keep ? 0.6 : 1), close);
  const alpha = m.r3 > 0.74 && !keep ? 1 - 0.85 * wk : 1;
  return {x, y, th, heat, dim, keep, alpha};
};

// ------------------------------------------------------------------ pieces
const orbit = (m: Mol, x: number, y: number, t: number, r = 1) => ({x: x + 30 * r * Math.cos(t * 2.4 + m.ph), y: y + 21 * r * Math.sin(t * 2.4 + m.ph)});

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

/** the farther air (parallax), quieter still; it thins inside the channel as the column expands */
const FarAir: React.FC<{mc: MCam; t: number}> = ({mc, t}) => {
  const k = 0.55;
  const box = frameBox(mc, k, 40);
  const dots = molsIn(box, 77, 170, 3000);
  const pk = pushK(t);
  const zk = mc.z * k;
  return (
    <g transform={camTr(mc, k)}>
      {dots.map((m) => {
        const ax = Math.abs(m.x) * k; // its distance from the axis on screen, in near units
        const thin = pk * Math.exp(-((ax / (CH_W * 1.05)) ** 4));
        const a = 0.13 * (1 - 0.85 * thin);
        if (a < 0.02) return null;
        return <circle key={m.id} cx={fmt(m.x + 9 * noise1(t * 0.8 + m.ph, m.id % 97))} cy={fmt(m.y + 9 * noise1(t + m.ph, (m.id % 97) + 3))} r={fmt(Math.max(13, 2.5 / zk))} fill={m.o2 ? '#9A6A64' : '#5A7590'} opacity={fmt(a)} />;
      })}
    </g>
  );
};

/** the prepared air: a soft warm glow along the axis (a region of the air, no edges); at the hand-off it takes on
 *  the macro haze's flat profile (F's Beam3D ribbon: PAL.channel at 0.17, about 250 px wide) */
const Band: React.FC<{box: {y0: number; y1: number}; a: number; flat: number}> = ({box, a, flat}) => {
  const W = CH_W;
  const soft: [number, number][] = [[0, 1], [0.3, 0.8], [0.65, 0.5], [1.0, 0.26], [1.35, 0.09], [1.7, 0]];
  const flatP: [number, number][] = [[0, 1], [0.85, 1], [1.05, 0.5], [1.25, 0], [1.7, 0]];
  const X = 1.7 * W;
  const stops = (p: [number, number][], id: string) => (
    <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={-X} y1={0} x2={X} y2={0}>
      {[...p.slice(1).reverse().map(([x, o]) => [-x, o] as [number, number]), ...p].map(([x, o], i) => (
        <stop key={i} offset={fmt((x * W + X) / (2 * X))} stopColor={PAL.channel} stopOpacity={o} />
      ))}
    </linearGradient>
  );
  if (a <= 0.004) return null;
  return (
    <g style={{mixBlendMode: 'screen'}}>
      <defs>
        {stops(soft, 'de-band-s')}
        {stops(flatP, 'de-band-f')}
      </defs>
      {flat < 1 && <rect x={fmt(-X)} y={fmt(box.y0)} width={fmt(2 * X)} height={fmt(box.y1 - box.y0)} fill="url(#de-band-s)" opacity={fmt(a * (1 - flat))} />}
      {flat > 0 && <rect x={fmt(-X)} y={fmt(box.y0)} width={fmt(2 * X)} height={fmt(box.y1 - box.y0)} fill="url(#de-band-f)" opacity={fmt(0.17 * flat)} />}
    </g>
  );
};

// ------------------------------------------------------------------ the molecular layer
const Micro: React.FC<{t: number; mc: MCam}> = ({t, mc}) => {
  const z = mc.z;
  const box = frameBox(mc, 1, 120);
  const mols = molsIn(box, SEED);
  const px = (p: number) => p / z;
  const hk = heatK(t), pk = pushK(t);
  const end = ss(t, 18.05, 18.5); // the last pull-out: the band and the line take on the macro channel's look
  const elZ = clamp((z - 1.0) / 0.3) * (1 - ss(t, 13.5, 13.9)); // bound electrons are drawn only while we are close
  // the field comes up under the packet's bloom (C ends on a darkened sky), so the background never switches in one frame
  const fadeIn = 0.2 + 0.8 * ss(t, B.D, B.D + 0.4);
  // the warm channel, restrained; a gentle shimmer while it is being heated
  const shimmer = 1 + 0.12 * noise1(t * 7, 91) * (ss(t, EV.heating, 13.7) - ss(t, 15.5, 15.75));
  // (close up, the warmth is carried by the molecules' glow; the band takes over as the view widens)
  const bandA = (0.07 * hk + 0.31 * pk * ss(t, 13.7, 14.5)) * shimmer;
  const molEls: React.ReactNode[] = [];
  const free: React.ReactNode[] = [];
  for (const m of mols) {
    const s = molState(m, t);
    if (s.x < box.x0 || s.x > box.x1 || s.y < box.y0 || s.y > box.y1) continue;
    const pop = popOf.get(m.id);
    const rep = isRep(m);
    molEls.push(<MolDraw key={m.id} m={m} s={{x: s.x, y: s.y, th: s.th, heat: s.heat, alpha: fadeIn * s.alpha, dim: s.dim}} z={z} warm={PAL.channel} heatGlow="url(#de-heat)" />);
    if (rep) continue; // drawn below with its electron cloud
    const bound = !pop || t < pop.t;
    if (bound && elZ > 0.01 && s.dim < 0.3) {
      const e = orbit(m, s.x, s.y, t);
      free.push(<Electron key={`e${m.id}`} x={e.x} y={e.y} z={z} a={elZ * (1 - s.dim / 0.3) * fadeIn} />);
    }
    if (pop && t >= pop.t) {
      // an electron freed by the passing pulse: a flash and a spark, then it drifts away from the path and fades
      const age = t - pop.t;
      const e0 = orbit(m, m.x, m.y, pop.t);
      const sg = Math.sign(m.x) || 1;
      const go = 1 - Math.exp(-age / 0.45);
      const ex = e0.x + sg * (150 + 90 * m.r1) * go, ey = e0.y - (40 + 70 * m.r3) * go;
      // (they clear away as the camera pushes in on the two representative molecules)
      const a = clamp(1.25 - age / 0.9) * fadeIn * (1 - ss(t, 12.3, 12.5));
      if (a <= 0.01 && age >= 0.15) continue;
      const trail = a * clamp(1 - age / 0.6);
      free.push(
        <g key={`f${m.id}`}>
          {age < 0.15 && (
            <g style={{mixBlendMode: 'screen'}}>
              <circle cx={fmt(e0.x)} cy={fmt(e0.y)} r={fmt(px(40) * (0.6 + age / 0.15))} fill="url(#de-flash)" opacity={fmt(1 - age / 0.15)} />
              <path d={sparkPath(e0.x, e0.y, px(38) * (1.2 - age / 0.15), 0.4)} stroke="#FFFFFF" strokeWidth={fmt(px(3.2))} strokeLinecap="round" />
            </g>
          )}
          {trail > 0.02 && <path d={`M${fmt(e0.x)},${fmt(e0.y)} L${fmt(ex)},${fmt(ey)}`} stroke="#CFF4FF" strokeOpacity={fmt(0.4 * trail)} strokeWidth={fmt(px(2.2))} strokeDasharray={`${fmt(px(3))} ${fmt(px(6))}`} />}
          <Electron x={ex} y={ey} z={z} a={a} glow={0.55} />
        </g>,
      );
    }
  }
  // the two representative molecules: the bound electron's cloud is stretched by the pulse's light, then torn away
  const reps = REP.map((r, i) => {
    const s = molState(r.m, t);
    const age = t - r.t;
    const show = ss(t, 12.12, 12.4) * (1 - ss(t, 13.6, 14.0));
    if (show <= 0.01) return null;
    const pre = clamp((t - (r.t - 0.3)) / 0.3); // the light field reaches it
    const tug = pre * pre;
    const wob = Math.sin(t * 46 + i) * 6 * tug;
    const eB = orbit(r.m, s.x, s.y, t, 1 + 0.5 * tug);
    const eBound = {x: eB.x + r.side * (30 * tug + wob), y: eB.y - 14 * tug};
    const e0 = (() => {
      const o = orbit(r.m, s.x, s.y, r.t, 1.5);
      return {x: o.x + r.side * 30, y: o.y - 14};
    })();
    const fly = age > 0 ? 1 - Math.exp(-age / 0.5) : 0;
    const eF = {x: e0.x + r.side * (125 * fly + 25 * age), y: e0.y - 55 * fly};
    const el = age > 0 ? eF : eBound;
    const cloudA = (age < 0 ? 1 : clamp(1 - age / 0.12)) * show;
    const cx = s.x + r.side * 18 * tug, cyy = s.y - 6 * tug;
    return (
      <g key={`r${i}`}>
        {cloudA > 0.01 && <ellipse cx={fmt(cx)} cy={fmt(cyy)} rx={fmt(58 + 30 * tug)} ry={fmt(46 - 6 * tug)} fill="url(#de-cloud)" opacity={fmt(cloudA)} transform={`rotate(${fmt(r.side * 12 * tug)} ${fmt(cx)} ${fmt(cyy)})`} />}
        {age > 0 && age < 0.6 && (
          <path d={`M${fmt(e0.x)},${fmt(e0.y)} L${fmt(el.x)},${fmt(el.y)}`} stroke="#CFF4FF" strokeOpacity={0.5 * clamp(1 - age / 0.6)} strokeWidth={fmt(px(3))} strokeDasharray={`${fmt(px(4))} ${fmt(px(8))}`} />
        )}
        <Electron x={el.x} y={el.y} z={z} a={show * (age > 0 ? clamp(1.4 - age / 0.8) : 1)} glow={age > 0 ? 0.6 : 0.35} />
        {age > 0 && age < 0.16 && (
          <g style={{mixBlendMode: 'screen'}}>
            <circle cx={fmt(e0.x)} cy={fmt(e0.y)} r={fmt(px(80) * (0.6 + age / 0.16))} fill="url(#de-flash)" opacity={fmt(1 - age / 0.16)} />
            <path d={sparkPath(e0.x, e0.y, px(64) * (1.3 - age / 0.16), 0.3)} stroke="#FFFFFF" strokeWidth={fmt(px(5))} strokeLinecap="round" />
          </g>
        )}
      </g>
    );
  });
  // the laser's path: a thin cyan line along the axis (its pulses are the packets); at the hand-off it is the macro
  // beam (F: PAL.laser 5 px at 0.81 over a 16 px PAL.laserGlow glow at 0.2)
  const lineA = (0.42 - 0.12 * ss(t, 13.0, 13.6)) * (1 - end) + 0.81 * end;
  const lineW = 2.2 + 2.8 * end;
  const leaderA = 1 - ss(t, 18.42, 18.72);
  return (
    <g>
      <rect x={0} y={0} width={1080} height={1920} fill="#131D2B" />
      <FarAir mc={mc} t={t} />
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
        </defs>
        <Band box={box} a={bandA} flat={end} />
        <g style={{mixBlendMode: 'screen'}}>
          <path d={`M0,${fmt(box.y0)} L0,${fmt(box.y1)}`} stroke={PAL.laserGlow} strokeOpacity={fmt(0.1 + 0.1 * end)} strokeWidth={fmt(px(9 + 7 * end))} />
          <path d={`M0,${fmt(box.y0)} L0,${fmt(box.y1)}`} stroke={PAL.laser} strokeOpacity={fmt(lineA)} strokeWidth={fmt(px(lineW))} />
        </g>
        {molEls}
        {reps}
        {free}
        <Packet y={packetY(t)} z={z} a={1 - ss(t, 12.35, 12.5)} bloom={1 - ss(t, B.D, B.D + 0.3)} id="de-p1" />
        <Packet y={packet2Y(t)} z={z} a={t > 11.8 ? 1 - ss(t, 13.2, 13.45) : 0} bloom={0} id="de-p2" />
        <LeaderDraw L={LEADER} t={t} z={z} a={leaderA} box={box} id="de-ld" />
      </g>
    </g>
  );
};

export const ChannelDE: React.FC<{t: number}> = ({t}) => {
  const mc = microCam(t);
  const microA = 1 - ss(t, 18.5, 18.765);
  return (
    <g>
      {t >= T_UNDER && <View3 cam={demoCam(t, macroZ(t))} st={demoSt(t)} t={t} tag="de" />}
      {microA > 0.002 && (
        <g opacity={fmt(microA)}>
          <Micro t={t} mc={mc} />
        </g>
      )}
    </g>
  );
};
