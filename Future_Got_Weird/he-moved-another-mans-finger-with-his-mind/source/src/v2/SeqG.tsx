// V2 G. Trust, the result, and the ending, 178.87 -> 211.77 s.
// The line clears on Sender A's screen; a new block. The same game from the Receiver's seat (the cover slides up), and
// the camera pushes through the screen and opens on the Receiver's face: a sceptical look ("trust issues"). Cut on the
// glance to Sender B, who stares at YES; follow the coral chip along the cable into the hub ("10 of 16 trials"):
// inside the computer the software flips it to NO, after the Sender gave it, while A's teal YES passes straight
// through. Track right with both chips to the stimulator: A's becomes a pulse, B's (now NO) becomes nothing. Through the
// head into the Receiver's view: one arc. A running record (teal right every time, coral often wrong) and the Receiver
// stares at YES, following teal: the block turns. The cover lifts, the block drops into the gap, the line clears; the
// field shrinks into one of sixteen trials, thirteen of which clear ("13 of 16", an average of five teams). Their
// cleared lines slide together into one bar, which becomes the space bar of the film's first image (FingerECU at
// ECU_CAM). The 2013 pulse: the drive glow, the wrist jerk, the snap onto the key. The 2019 pulse: one soft arc. The
// finger rises and deliberately settles, not pressing (calm teal). Pull back and split: Rao's hand frame-left, Stocco's
// frame-right, the friendly plane crossing Rao's screen while the finger rests.
import React from 'react';
import {clamp, easeInOut, easeOut, fmt, lerp} from '../dc/math';
import {lit, mix} from '../dc/color';
import {FPS} from '../lib/core';
import {INK, K, Tag} from '../art/kit';
import {CrewChar, IDLE, Pose} from '../art/crew';
import {BN, EEGCap} from '../art/people';
import {CH, CW, GROWS, PF, SoftArc, Trial, TrialCells} from '../art/s6world';
import {RaoPanel} from '../shots/S1Hook';
import {GEvent} from '../art/game';
import {F_DOWN, F_HOVER, F_JERK, F_LIFT, F_REST, FingerECU, FPose, indexPts, KEY, mixF, pressPose} from './finger';
/** the opening's frame-0 action (SeqA): a lifted pose pulled down to contact at frame 4 */
const OPEN_TC = 4 / 30;
const OPEN_FROM = mixF(F_LIFT, F_HOVER, 0.25);
import {ECU_CAM} from './contracts';
import {CamS, sp} from './core2';
import {FB, fgState, fgTrials, fgVotes, follow, pr, pulseTimes, win} from './fgTime';
import {MON, scrPt} from './fgWorld';
import {CAMS, camAt, camT, CK, POVVignette, WorldView} from './fgShot';

const id = 'vg';

const times = () => {
  const b = FB();
  const swap = b.here + 0.1;
  const thru0 = swap + 0.52;
  const face = thru0 + 0.45;
  const cutB = b.ten;
  const in3: [number, number] = [b.overTime - 0.05, b.overTime + 0.45];
  const tiles = b.cleared + 0.42;
  // the reprise starts on a frame boundary so its first frame is exactly the opening's frame 0
  const ecu = Math.ceil((b.goBack + 0.04) * FPS) / FPS;
  const pull0 = b.wrongEnd + 0.03, pull1 = pull0 + 1.55;
  return {b, swap, thru0, face, cutB, in3, tiles, ecu, pull0, pull1};
};

// ---------------------------------------------------------------- the Receiver's face (reverse angle, through the screen)
const ReceiverFace: React.FC<{t: number; f: number}> = ({t, f}) => {
  const T = times();
  const b = T.b;
  const u = pr(t, T.face, T.cutB);
  const z = lerp(1, 1.07, u);
  const sus = pr(t, b.trust - 0.3, b.trust + 0.15);
  const lookX = -1 * pr(t, b.trust + 0.2, b.trust + 0.4) + 2 * win(t, b.trust + 0.7, b.trust + 0.9, T.cutB - 0.6, T.cutB - 0.4);
  const pose: Pose = {
    ...IDLE,
    armL: {a: 6, b: 6},
    armR: {a: 6, b: 6},
    brows: lerp(0.1, -0.45, sus),
    browAsym: 0.8 * sus,
    mouth: sus > 0.5 ? 'hmm' : 'flat',
    lookX: clamp(lookX, -1, 1),
    lookY: -0.05,
    tilt: lerp(0, -4, sus),
    lean: lerp(0, -2, sus),
  };
  const cx = 960, gy = 1720, s = 3.3;
  const headY = gy - 372 * s;
  return (
    <g transform={`translate(960 540) scale(${fmt(z)}) translate(-960 -540)`}>
      <defs>
        <linearGradient id={`${id}-fbg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6E6390" />
          <stop offset="1" stopColor="#4A4266" />
        </linearGradient>
        <radialGradient id={`${id}-fgl`} cx="0.5" cy="0.42" r="0.8">
          <stop offset="0" stopColor="#BFD8F0" stopOpacity={0.22} />
          <stop offset="1" stopColor="#BFD8F0" stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect x={-200} y={-200} width={2320} height={1480} fill={`url(#${id}-fbg)`} />
      {/* the room behind the Receiver: a door frame and the wall line, dim */}
      <rect x={180} y={120} width={300} height={900} fill="#5A5078" stroke={INK} strokeWidth={6} />
      <rect x={1460} y={170} width={260} height={180} rx={8} fill="#8478A8" stroke={INK} strokeWidth={6} />
      <rect x={-200} y={820} width={2320} height={24} fill="#5A5078" />
      {/* the coil's handle behind the head, level, toward the person's left (frame right from the front) */}
      <path d={`M${cx + 160},${headY + 66} Q${cx + 440},${headY + 100} ${cx + 480},${headY + 700}`} fill="none" stroke={INK} strokeWidth={14} strokeLinecap="round" />
      <rect x={cx + 120} y={headY + 38} width={310} height={56} rx={24} fill="#46525C" stroke={INK} strokeWidth={7} />
      <CrewChar look={BN.receiver} pose={pose} frame={f} seed={11} x={cx} y={gy} scale={s} headGear={<EEGCap />} id={`${id}-rf`} life={0.6} eyeDarts={false} shadow={false} />
      <rect x={-200} y={-200} width={2320} height={1480} fill={`url(#${id}-fgl)`} />
    </g>
  );
};

// ---------------------------------------------------------------- the track record in the Receiver's view
const Record: React.FC<{t: number}> = ({t}) => {
  const b = FB();
  const k = win(t, b.learned - 0.25, b.learned, b.whose + 1.05, b.whose + 1.35);
  if (k <= 0.001) return null;
  const A = [1, 1, 1, 1, 1, 1], B = [1, 0, 0, 1, 0, 0];
  const n = 6 * clamp((t - (b.learned - 0.05)) / 0.95);
  const dimB = pr(t, b.whose - 0.05, b.whose + 0.3);
  const row = (y: number, col: string, marks: number[], op: number, hi: number) => (
    <g opacity={op}>
      <circle cx={700} cy={y} r={22} fill={col} stroke={INK} strokeWidth={5} />
      {hi > 0 && <circle cx={700} cy={y} r={32} fill="none" stroke={col} strokeWidth={6} opacity={hi} />}
      {marks.map((m, i) => {
        const on = clamp(n - i);
        if (on <= 0) return null;
        const x = 790 + i * 76;
        return (
          <g key={i} opacity={on} transform={`translate(${x} ${y}) scale(${fmt(0.7 + 0.3 * on)})`}>
            <rect x={-26} y={-26} width={52} height={52} rx={12} fill={m ? K.cream : '#E3E8EC'} stroke={INK} strokeWidth={4} />
            {m ? <path d="M-13,0 l9,10 l17,-20" fill="none" stroke={col} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
              : <path d="M-11,-11 l22,22 M11,-11 l-22,22" stroke="#8A97A2" strokeWidth={6} strokeLinecap="round" />}
          </g>
        );
      })}
    </g>
  );
  return (
    <g opacity={clamp(k * 1.4)}>
      <rect x={640} y={22} width={640} height={176} rx={30} fill={K.cream} opacity={0.82} stroke={INK} strokeWidth={4} />
      {row(70, K.senderA, A, 1, dimB)}
      {row(150, K.senderB, B, 1 - 0.6 * dimB, 0)}
    </g>
  );
};

// ---------------------------------------------------------------- 16 trials
const FAILS = [5, 10, 13];
const TILE = {s: 0.55, w: 256 * 0.55, h: 312 * 0.55, gap: 34, y0: 236, y1: 452};
const tileXY = (i: number) => {
  const c = i % 8, r = Math.floor(i / 8);
  const x0 = 960 - (8 * TILE.w + 7 * TILE.gap) / 2;
  return {x: x0 + c * (TILE.w + TILE.gap), y: r ? TILE.y1 : TILE.y0};
};
const row9 = (): [number, number][] => [0, 1, 2, 3, 4, 6, 7].map((c) => [c, 9]);
const tileTrial = (i: number, r: number): Trial => {
  const fail = FAILS.includes(i);
  return fail
    ? {col: 3, board: [...row9(), [0, 8], [7, 8]], rowK: [[r, 1], [r + 0.3, 7, 'in']], landT: r + 0.3, inT: r - 0.4}
    : {col: 3, board: [...row9(), [0, 8], [1, 8], [7, 8]], rowK: [[r, 1], [r + 0.3, 8, 'in']], rotT: r - 0.25, landT: r + 0.3, clearT: r + 0.34, inT: r - 0.4};
};
const Tiles: React.FC<{t: number; st: ReturnType<typeof fgState>}> = ({t, st}) => {
  const T = times();
  const b = T.b;
  const shrink = pr(t, T.tiles, T.tiles + 0.75);
  const toBar = pr(t, b.outOf + 0.55, T.ecu - 0.3);
  const merge = pr(t, T.ecu - 0.3, T.ecu - 0.05);
  const fadeBars = t >= T.ecu ? 1 : 0;
  // tile 0 starts exactly where the real playfield is on screen (CAMS.RFULL), then shrinks to its slot
  const pf0 = scrPt(MON.R, PF.x, PF.y);
  const c = CAMS.RFULL;
  const start = {x: 960 + (pf0.x - c.x) * c.z, y: 540 + (pf0.y - c.y) * c.z, s: c.z * MON.R.s};
  const tl = {x: 960 + (KEY.x - KEY.w / 2 - ECU_CAM.x) * ECU_CAM.z, y: 540 + (KEY.y - KEY.depth - ECU_CAM.y) * ECU_CAM.z};
  const BAR = {x0: tl.x, x1: tl.x + KEY.w * ECU_CAM.z, y: tl.y, h: KEY.depth * ECU_CAM.z};
  const bw = (BAR.x1 - BAR.x0) / 16;
  const tr2 = fgTrials(b)[1];
  return (
    <g>
      <rect x={0} y={0} width={1920} height={1080} fill={K.paper} opacity={clamp(shrink * 1.6) * (1 - fadeBars)} />
      {Array.from({length: 16}, (_, i) => {
        const p = tileXY(i);
        const r = T.tiles + 0.62 + (i - 1) * 0.068;
        const vis = i === 0 ? 1 : pr(t, r - 0.45, r - 0.2);
        const fail = FAILS.includes(i);
        const tile = i === 0 ? {x: lerp(start.x, p.x, shrink), y: lerp(start.y, p.y, shrink), s: lerp(start.s, TILE.s, shrink)} : {x: p.x, y: p.y, s: TILE.s};
        const tr = i === 0 ? tr2 : tileTrial(i, r);
        const done = i === 0 ? 1 : pr(t, r + 0.3, r + 0.5);
        const tileOp = vis * (1 - toBar);
        // the line marker under the tile; it slides into the space bar
        const lineK = i === 0 ? pr(t, T.tiles + 0.5, T.tiles + 0.8) : done;
        const lx = lerp(p.x, BAR.x0 + i * bw + 2, toBar), ly = lerp(p.y + TILE.h + 14, BAR.y, toBar);
        const lw = lerp(TILE.w, bw - 4 + merge * 4, toBar), lh = lerp(16, BAR.h, toBar);
        const lineCol = fail ? '#B9C3CB' : K.saffron;
        return (
          <g key={i}>
            {tileOp > 0.001 && (
              <g opacity={tileOp} transform={`translate(${fmt(tile.x)} ${fmt(tile.y)}) scale(${fmt(tile.s)}) translate(${-PF.x} ${-PF.y})`}>
                <defs>
                  <clipPath id={`${id}-tc${i}`}><rect x={PF.x} y={PF.y} width={PF.w} height={PF.h} /></clipPath>
                </defs>
                <rect x={PF.x - 3} y={PF.y - 3} width={PF.w + 6} height={PF.h + 6} rx={4} fill="#22384A" stroke={i === 0 ? '#4A6378' : INK} strokeWidth={i === 0 ? 3 : 8} />
                <g clipPath={`url(#${id}-tc${i})`}>
                  <TrialCells tr={tr} t={t} />
                </g>
                {fail && done > 0 && <rect x={PF.x} y={PF.y} width={PF.w} height={PF.h} fill="#22384A" opacity={0.45 * done} />}
                {fail && done > 0 && (
                  <rect x={PF.x + 5 * CW - 4} y={PF.y + (GROWS - 1) * CH - 4} width={CW + 8} height={CH + 8} rx={6} fill="none" stroke={K.coral} strokeWidth={5} opacity={done} />
                )}
              </g>
            )}
            {lineK > 0.001 && fadeBars < 1 && (
              <rect x={fmt(lx)} y={fmt(ly)} width={fmt(lw)} height={fmt(lh)} rx={lerp(8, 6, toBar)} fill={mix(lineCol, '#F7F9FB', merge * (fail ? 0.6 : 0.2))} stroke={INK} strokeWidth={lerp(4, 6, toBar)}
                opacity={clamp(lineK) * (1 - fadeBars)} />
            )}
          </g>
        );
      })}
      <Tag x={960} y={150} text="13 of 16 lines cleared" size={50} k={win(t, b.thirteen - 0.15, b.thirteen + 0.2, b.outOf + 0.5, b.outOf + 0.8)} />
      <Tag x={960} y={732} text="average across 5 teams" size={38} k={win(t, b.outOf + 0.05, b.outOf + 0.35, T.ecu - 0.5, T.ecu - 0.2)} />
    </g>
  );
};

// ---------------------------------------------------------------- the finger (the film's first image) and the ending
const capRow = (y: number, x0: number, n: number, w: number, step: number, k: string) =>
  Array.from({length: n}, (_, i) => {
    const x = x0 + i * step;
    const d = 80, h = 66, sk = 26;
    return (
      <g key={`${k}${i}`}>
        <rect x={x - w / 2 - 8} y={y + h - 6} width={w + 16} height={22} rx={6} fill={INK} opacity={0.25} />
        <path d={`M${x - w / 2},${y} L${x + w / 2},${y} L${x + w / 2 - 6},${y + h} L${x - w / 2 + 6},${y + h} Z`} fill="#B9C4CC" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        <path d={`M${x - w / 2 + sk},${y - d} L${x + w / 2 - sk},${y - d} L${x + w / 2},${y} L${x - w / 2},${y} Z`} fill="#E8EDF1" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      </g>
    );
  });
const fingerAt = (t: number) => {
  const T = times();
  const b = T.b;
  const idle = Math.sin(t * 1.7) * 0.5;
  const p0 = b.pulse1 + 0.02; // the drive glow leaves the wrist on "pulse"
  const j0 = p0 + 0.2, j1 = j0 + 0.1, c0 = j1 + 0.11; // jerk up, then the snap down to contact
  const r0 = c0 + 0.16, r1 = r0 + 0.12, h1 = r1 + 0.6;
  const lift0 = b.andYou + 0.3, lift1 = lift0 + 0.42, set1 = lift1 + 0.85;
  let pose: FPose = {...F_HOVER, wrist: F_HOVER.wrist + idle * pr(t, T.ecu + 1.4, T.ecu + 2.2)};
  let press = 0;
  // the opening, replayed from its frame 0 (A: snapState from a lifted pose, contact at frame 4)
  const tau = t - T.ecu;
  if (tau >= 0 && tau < 1.5) {
    const tc = OPEN_TC;
    let drive = lerp(0.55, 1.0, clamp(tau / tc)) + (tau > tc ? (tau - tc) * 1.6 : 0);
    if (tau < tc) {
      const u = clamp((tau - (tc - 0.2)) / 0.2);
      pose = mixF(OPEN_FROM, F_DOWN, u * u * u);
    } else if (tau < 0.62) {
      press = Math.min(1.22, sp(tau * FPS, tc, {damping: 9, stiffness: 520}));
      pose = pressPose(press);
    } else {
      const r = easeInOut(clamp((tau - 0.62) / 0.78));
      press = Math.max(0, 1 - clamp((tau - 0.62) / 0.14));
      pose = r < 0.001 ? pressPose(press) : mixF(pressPose(press), F_HOVER, r);
    }
    if (drive > 1.4) drive = -1;
    return {pose, press, drive, keyGlow: tau >= tc ? Math.max(0, 1 - (tau - tc) / 0.35) : 0, calm: 0, lines: tau < tc + 0.08 ? clamp(1 - (tau - tc) / 0.08) : 0};
  }
  if (t >= p0 && t < h1) {
    if (t < j0) pose = F_HOVER;
    else if (t < j1) pose = mixF(F_HOVER, F_JERK, easeOut(clamp((t - j0) / (j1 - j0))));
    else if (t < c0) pose = mixF(F_JERK, F_DOWN, clamp((t - j1) / (c0 - j1)) ** 1.6);
    else if (t < r0) {
      press = easeOut(clamp((t - c0) / 0.06));
      pose = pressPose(press);
    } else if (t < r1) {
      press = 1 - clamp((t - r0) / (r1 - r0));
      pose = pressPose(press);
    } else pose = mixF(F_DOWN, F_HOVER, easeInOut(clamp((t - r1) / (h1 - r1))));
  } else if (t >= lift0) {
    const LIFTP = mixF(F_HOVER, F_LIFT, 0.6);
    const breathe = Math.sin(t * 1.6) * 0.45 * pr(t, set1, set1 + 0.6);
    pose = t < lift1 ? mixF(F_HOVER, LIFTP, easeInOut(clamp((t - lift0) / (lift1 - lift0)))) : mixF(LIFTP, F_REST, easeInOut(clamp((t - lift1) / (set1 - lift1))));
    pose = {...pose, wrist: pose.wrist + breathe};
  }
  return {
    pose,
    press,
    drive: t >= p0 && t < p0 + 0.5 ? ((t - p0) / 0.32) : -1,
    keyGlow: t >= c0 ? 1 - clamp((t - c0) / 0.55) : 0,
    calm: pr(t, lift1, lift1 + 0.6) * (0.8 + 0.2 * Math.sin(t * 2.2)),
    lines: t >= c0 - 0.08 && t < c0 + 0.08 ? clamp(1 - Math.abs(t - c0) / 0.08) : 0,
  };
};
const EcuWorld: React.FC<{t: number; wide: number}> = ({t, wide}) => {
  const fa = fingerAt(t);
  return (
    <g>
      <rect x={-3000} y={-3000} width={9000} height={9000} fill={K.stoccoWall} />
      {wide > 0.001 && (
        <g opacity={clamp(wide * 1.5)}>
          <rect x={-3000} y={DESK_Y - 60} width={9000} height={60} fill={K.stoccoWallDeep} />
          <rect x={-3000} y={DESK_Y} width={9000} height={2600} fill="#C99A68" stroke={INK} strokeWidth={8} />
          <rect x={-3000} y={DESK_Y} width={9000} height={18} fill={lit('#C99A68', 0.3)} />
          <rect x={1420} y={-330} width={320} height={400} rx={14} fill="#F8EEDC" stroke={INK} strokeWidth={9} />
          <path d="M1475,-245 L1685,-245 M1475,-180 L1640,-180 M1475,-115 L1690,-115 M1475,-50 L1610,-50" stroke="#C8B79A" strokeWidth={18} strokeLinecap="round" />
          <rect x={-330} y={500} width={2440} height={540} rx={36} fill="#C9D1D8" stroke={INK} strokeWidth={8} />
          {capRow(KEY.y - 294, KEY.x - 1360, 9, 300, 345, 'r3')}
          {capRow(KEY.y - 196, KEY.x - 1240, 9, 300, 345, 'r2')}
        </g>
      )}
      <FingerECU id={`${id}-f`} pose={fa.pose} press={fa.press} keyGlow={fa.keyGlow} drive={fa.drive} calm={fa.calm} />
      <SnapLines pose={fa.pose} k={fa.lines} />
      {wide > 0.001 && (
        <g opacity={clamp(wide * 1.5)}>
          <rect x={-3000} y={KEY.y + 50} width={2670} height={60} fill="#C99A68" />
          <rect x={2110} y={KEY.y + 50} width={3000} height={60} fill="#C99A68" />
        </g>
      )}
    </g>
  );
};
/** the opening's camera move on contact (y + 10), then a slow drift toward the hand */
const ecuCamAt = (t: number): CamS => {
  const T = times();
  const tau = t - T.ecu;
  const settle = clamp((tau - OPEN_TC) / 0.15) * (1 - pr(t, T.ecu + 0.8, T.ecu + 1.8));
  const drift = pr(t, T.ecu + 0.8, T.pull0, (x) => x);
  return {x: ECU_CAM.x - 20 * drift, y: ECU_CAM.y + 10 * settle - 10 * drift, z: ECU_CAM.z * (1 + 0.035 * drift)};
};
/** motion arcs about the knuckle trailing the fingertip as it snaps down (as in the opening, SeqA) */
const SnapLines: React.FC<{pose: FPose; k: number}> = ({pose, k}) => {
  if (k <= 0.01) return null;
  const ip = indexPts(pose);
  const c = ip[0], tip = ip[3];
  const a = Math.atan2(tip.y - c.y, tip.x - c.x);
  const R = Math.hypot(tip.x - c.x, tip.y - c.y);
  const deg = Math.PI / 180;
  return (
    <g opacity={k} fill="none" strokeLinecap="round">
      {[0, 1, 2].map((i) => {
        const r = R + 30 - i * 95;
        const a0 = a + (8 + i * 3) * deg, a1 = a + (36 - i * 4) * deg;
        const P = (q: number) => `${fmt(c.x + Math.cos(q) * r)},${fmt(c.y + Math.sin(q) * r)}`;
        const d = `M${P(a0)} A${fmt(r)},${fmt(r)} 0 0 1 ${P(a1)}`;
        return (
          <g key={i}>
            <path d={d} stroke={K.cream} strokeWidth={22} />
            <path d={d} stroke={INK} strokeWidth={8} />
          </g>
        );
      })}
    </g>
  );
};
const DESK_Y = 200;
const FINAL: CamS = {x: 1263, y: 320, z: 0.5};

export const VG: React.FC<{f: number}> = ({f}) => {
  const t = f / FPS;
  const T = times();
  const b = T.b;
  const st = fgState(t, b);
  const vs = fgVotes(b);
  const b3 = vs[4];

  // ---------------------------------------------------------------- the line clears on A's screen; the Receiver's seat; through the screen
  if (t < T.face) {
    const ks: CK[] = [
      [b.g0, CAMS.AFULL],
      [T.swap, CAMS.AFULL],
      [T.swap + 0.0001, CAMS.RFULL],
      [T.thru0, CAMS.RFULL],
      [T.face, {x: MON.R.x, y: scrPt(MON.R, 320, 130).y, z: 16}, (x) => x * x * x],
    ];
    const cam = camAt(t, ks);
    return (
      <g>
        <WorldView id={id} st={st} f={f} cam={cam} pillars={false} />
        <Tag x={960} y={58} text="Receiver’s view" size={34} k={win(t, T.swap + 0.15, T.swap + 0.4, T.thru0 + 0.1, T.thru0 + 0.3)} fill={K.receiver} color="#FFFFFF" />
      </g>
    );
  }
  // ---------------------------------------------------------------- the Receiver's face
  if (t < T.cutB) {
    const r = 1250 * easeOut(clamp((t - T.face) / 0.42));
    return (
      <g>
        <rect x={0} y={0} width={1920} height={1080} fill="#22384A" />
        <defs>
          <clipPath id={`${id}-iris`}><circle cx={960} cy={540} r={fmt(r)} /></clipPath>
        </defs>
        <g clipPath={`url(#${id}-iris)`}>
          <ReceiverFace t={t} f={f} />
        </g>
      </g>
    );
  }
  // ---------------------------------------------------------------- B's vote, the flip, the pulse, the record, the reveal
  if (t < T.tiles) {
    const base = camAt(t, [
      [T.cutB, CAMS.BFACE],
      [b3.leave - 0.05, {x: 660, y: 1515, z: 1.3}],
      [b3.leave + 0.55, {x: 900, y: 1300, z: 0.9}],
      [b3.hub - 0.3, {x: 1700, y: 1050, z: 0.95}],
      [b3.hub + 0.2, CAMS.HUBWIN2],
      [b3.out - 0.05, CAMS.HUBWIN3],
      [T.in3[0] - 0.05, CAMS.HEADBACK2],
      [T.in3[0], CAMS.HEADBACK2],
      [T.in3[1], CAMS.POV],
      [b.whose + 1.0, CAMS.POV2],
      [b.whose + 1.7, CAMS.RFULL],
    ]);
    const fw = win(t, b3.leave + 0.05, b3.leave + 0.35, b3.hub - 0.45, b3.hub + 0.05);
    const fp = follow(b3, t);
    const cam: CamS = {x: lerp(base.x, fp.x + 120, fw), y: lerp(base.y, fp.y + 40, fw), z: base.z};
    const e = pr(t, T.in3[0], T.in3[1]);
    const head = t < T.in3[0] ? {d: 1, op: 1} : {d: 1 + 0.9 * e, op: 1 - pr(t, lerp(T.in3[0], T.in3[1], 0.4), T.in3[1])};
    const pov = pr(t, T.in3[1] - 0.3, T.in3[1]) * (1 - pr(t, b.whose + 1.0, b.whose + 1.5));
    const arcT = T.in3[1] + 0.05;
    const stripK = win(t, b.ten + 0.1, b.ten + 0.4, b.advice + 0.25, b.advice + 0.55);
    const n = 10 * clamp((t - (b.sixteen + 0.1)) / 0.8);
    const marked = [0, 1, 3, 4, 6, 8, 9, 11, 13, 14];
    return (
      <g>
        <WorldView id={id} st={{...st, strip: {k: 0, n: 0}}} f={f} cam={cam} head={{d: head.d, ref: CAMS.HEADBACK2, op: head.op}} />
        <POVVignette id={id} k={pov} />
        <SoftArc x={960} y={318} w={760} k={win(t, arcT, arcT + 0.12, arcT + 0.45, arcT + 0.9)} />
        <Record t={t} />
        {stripK > 0.001 && (
          <g opacity={clamp(stripK * 1.4)}>
            <Tag x={960} y={58} text="10 of 16 trials" size={36} />
            {Array.from({length: 16}, (_, i) => {
              const idx = marked.indexOf(i);
              const on = idx >= 0 ? clamp(n - idx) : 0;
              const cx = 960 - 7.5 * 40 + i * 40, cy = 128;
              return (
                <g key={i}>
                  <rect x={cx - 16} y={cy - 16} width={32} height={32} rx={7} fill={mix(K.cream, K.senderB, on)} stroke={INK} strokeWidth={3.5} />
                  {on > 0.5 && <path d={`M${cx - 8},${cy - 3} h14 l-4,-5 M${cx + 8},${cy + 4} h-14 l4,5`} stroke="#FFFFFF" strokeWidth={3} fill="none" strokeLinecap="round" />}
                </g>
              );
            })}
          </g>
        )}
      </g>
    );
  }
  // ---------------------------------------------------------------- 13 of 16 -> the cleared lines become the space bar
  if (t < T.ecu + 0.6) {
    const showEcu = t >= T.ecu;
    return (
      <g>
        {!showEcu ? (
          <g opacity={1 - pr(t, T.tiles, T.tiles + 0.5)}>
            <WorldView id={id} st={st} f={f} cam={CAMS.RFULL} pillars={false} />
          </g>
        ) : (
          <g>
            <g transform={camT(ecuCamAt(t))}>
              <EcuWorld t={t} wide={0} />
            </g>
          </g>
        )}
        <Tiles t={t} st={st} />
      </g>
    );
  }
  // ---------------------------------------------------------------- the finger, then the two hands
  {
    const e = pr(t, T.pull0, T.pull1);
    const ecuCam = ecuCamAt(t);
    const hold = pr(t, T.pull1, T.pull1 + 2.2, (x) => x);
    const fin: CamS = {x: FINAL.x + 6 * hold, y: FINAL.y - 4 * hold, z: FINAL.z * (1 + 0.015 * hold)};
    const cam: CamS = e <= 0 ? ecuCam : {x: lerp(ecuCam.x, fin.x, e), y: lerp(ecuCam.y, fin.y, e), z: Math.exp(lerp(Math.log(ecuCam.z), Math.log(fin.z), e))};
    const ax = lerp(960, 1443, e);
    const clipX = lerp(0, 966, e);
    const events: GEvent[] = [{kind: 'plane', t0: T.pull0 + 0.5, dur: 5.2}];
    const arcK = win(t, b.pulse2 + 0.05, b.pulse2 + 0.18, b.pulse2 + 0.55, b.pulse2 + 1.05);
    return (
      <g>
        <rect x={0} y={0} width={1920} height={1080} fill={INK} />
        {e > 0 && (
          <g transform={`translate(${fmt(-954 * (1 - e))} 0)`}>
            <defs><clipPath id={`${id}-rp`}><rect x={0} y={0} width={954} height={1080} /></clipPath></defs>
            <g clipPath={`url(#${id}-rp)`}>
              <RaoPanel f={f} events={events} />
            </g>
          </g>
        )}
        <defs><clipPath id={`${id}-sp`}><rect x={fmt(clipX)} y={0} width={fmt(1920 - clipX)} height={1080} /></clipPath></defs>
        <g clipPath={`url(#${id}-sp)`}>
          <g transform={camT(cam, ax, 540)}>
            <EcuWorld t={t} wide={e} />
          </g>
          <SoftArc x={ax + 10} y={250} w={720} k={arcK} />
        </g>
        <Tag x={56} y={60} anchor="start" text="2013" size={34} k={win(t, b.first - 0.05, b.first + 0.25, b.moved + 0.3, b.moved + 0.6)} />
        <Tag x={56} y={60} anchor="start" text="2019" size={34} k={win(t, b.six - 0.05, b.six + 0.25, b.wrongEnd - 0.1, b.wrongEnd + 0.2)} />
      </g>
    );
  }
};

export const CUES_VG = (): {t: number; kind: string; gain?: number; dur?: number}[] => {
  const T = times();
  const b = T.b;
  const vs = fgVotes(b).filter((v) => v.leave >= b.g0);
  const p0 = b.pulse1 + 0.02, c0 = p0 + 0.2 + 0.1 + 0.11;
  const out: {t: number; kind: string; gain?: number}[] = [
    {t: T.thru0 + 0.05, kind: 'whoosh', gain: -14},
    {t: b.flipped + 0.02, kind: 'flip'},
    {t: T.in3[1] + 0.05, kind: 'flash', gain: -2},
    {t: b.whose + 0.45, kind: 'rotate', gain: -4},
    {t: b.cleared - 0.05, kind: 'line_clear', gain: -3},
    {t: b.thirteen - 0.15, kind: 'pop', gain: -8},
    {t: b.outOf + 0.05, kind: 'pop', gain: -10},
    {t: T.ecu + OPEN_TC, kind: 'key_click', gain: -4},
    {t: p0, kind: 'coil_pulse'},
    {t: c0, kind: 'key_click'},
    {t: c0 + 0.04, kind: 'cannon', gain: -10},
    {t: b.pulse2 + 0.05, kind: 'flash', gain: -2},
    {t: T.pull0 + 0.05, kind: 'whoosh', gain: -14},
    {t: T.pull0 + 0.5, kind: 'plane_pass', gain: -10},
  ];
  for (const v of vs) out.push({t: v.leave, kind: 'vote', gain: -4});
  for (const v of vs) out.push({t: v.hub, kind: 'packet_arrive', gain: -10});
  for (const p of pulseTimes(b)) if (p >= b.g0) out.push({t: p, kind: 'coil_pulse'});
  for (let i = 0; i < 6; i += 2) out.push({t: b.learned - 0.05 + (i / 6) * 0.95, kind: 'tick', gain: -12});
  for (let i = 1; i < 16; i += 3) out.push({t: T.tiles + 0.62 + (i - 1) * 0.068 + 0.34, kind: 'tick', gain: -14});
  return out.sort((x, y) => x.t - y.t);
};
