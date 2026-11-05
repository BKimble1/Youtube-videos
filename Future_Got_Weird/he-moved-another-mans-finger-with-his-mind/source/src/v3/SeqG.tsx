// V3 G. Trust and the result, 178.87 -> T('Go back to that finger') - 0.3 (the ending is sequence H).
// The line has just cleared on the Receiver's screen; a new block, the cover closes. Eyeline cut to the Receiver's face:
// a squint, one brow up, a hand rubbing the chin, glances left and right ("trust issues"). Sender B stares at YES in
// good faith; the chip leaves down the cable. Action-matched cut: the chip rides B's conduit to the lab computer; push
// into the relay software, where the 10-of-16 trial strip fills and, after B gave it, B's YES flips to NO ("flipped
// by software"), while A's YES sits unchanged. Track with both outputs to the stimulator: A's = PULSE, B's = no pulse;
// push through the head: one arc. The Receiver's face beside their track record: eyes to the record, the coral row
// dims, a nod, eyes to YES. Cut on the stare: the Receiver's screen, the block turns, the cover lifts, the block drops
// into the gap and the line clears. Relief on the Receiver's face (light, grin, a fist pump); cut on the fist coming
// down: sixteen trials land on the page, thirteen with a cleared line ("13 of 16", the average of five teams). The
// tiles fall away; the thirteen saffron lines slide together into ONE bar exactly filling LINE_BAR on plain paper.
import React from 'react';
import {clamp, easeIn, fmt, lerp} from '../dc/math';
import {FPS} from '../lib/core';
import {INK, K, Tag} from '../art/kit';
import {CH, CW, PF, SoftArc} from '../art/s6world';
import {LINE_BAR} from './contracts';
import {CamS} from './core2';
import {FB, fgState, fgVotes, pr, pulseTimes, SH, win} from './fgTime';
import {CAMS, camAt, CK, POVVignette, WorldView} from './fgShot';
import {chipU, FaceShot, kp, P0, RecordPanel} from './fgClose';
import {Pose} from './crew3';

const id = 'vg';

// ---------------------------------------------------------------- performances
const RUB = {a: -18, b: 216};
/** RF4: trust issues: a squint, one brow up, the head pulls back, a hand rubs the chin, glances left and right */
const rf4Pose = (t: number): Pose => {
  const b = FB(), s = SH(b);
  const base: Pose = {...P0, lookY: 0.2, brows: 0.05};
  const sus: Pose = {...base, blink: 0.55, browAsym: 0.9, brows: -0.3, bob: -4, lean: -2, tilt: -5, mouth: 'hmm', lookY: 0.1};
  const rub = (dx: number): Pose => ({...sus, armR: {a: RUB.a + dx, b: RUB.b - dx * 1.5}, handR: {curl: 0.55, spread: 0.15}});
  return kp(t, [
    [s.rf4, base],
    [b.trust - 0.4, {...base, lookY: 0.25, brows: 0.1}],
    [b.trust + 0.1, {...sus, lookX: 0}],
    [b.trust + 0.45, {...rub(0), lookX: 0}],
    [b.trust + 0.7, {...rub(4), lookX: -0.85}],
    [b.trust + 0.95, {...rub(-2), lookX: -0.85}],
    [b.trust + 1.2, {...rub(4), lookX: 0.85}],
    [b.trust + 1.45, {...rub(-2), lookX: 0.85}],
    [s.sb2 - 0.2, {...rub(2), lookX: 0.4, blink: 0.7}],
  ]);
};
/** SB2: Sender B, in good faith, stares at YES */
const sb2Pose = (t: number): Pose => {
  const s = SH(), v = fgVotes()[4];
  const base: Pose = {...P0, lookY: 0.3, brows: 0.1};
  const look = v.leave - 0.38;
  return kp(t, [
    [s.sb2, base],
    [look - 0.2, {...base, bob: 4, blink: 0.15}],
    [look - 0.06, {...base, bob: 2, blink: 1, lookY: 0.15}],
    [look + 0.16, {...base, lookX: 0.95, lookY: -0.08, tilt: 4, lean: 1.5, brows: -0.25, mouth: 'flat'}],
    [s.hub2 + 0.2, {...base, lookX: 0.95, lookY: -0.08, tilt: 4.5, lean: 1.8, brows: -0.3, mouth: 'flat'}],
  ]);
};
/** RF5: the track record, a nod, then the eyes go to YES */
const rf5Pose = (t: number): Pose => {
  const b = FB(), s = SH(b);
  const base: Pose = {...P0, lookY: 0.08, brows: 0.2};
  return kp(t, [
    [s.rf5, {...base, lookX: -0.2, brows: 0.35}],
    [s.rf5 + 0.2, {...base, lookX: -0.2, brows: 0.35}],
    [s.rf5 + 0.45, {...base, lookX: -0.95, lookY: 0.12, tilt: -3, brows: 0.2}],
    [b.whose + 0.1, {...base, lookX: -0.95, lookY: 0.12, tilt: -3, brows: 0.2}],
    [b.whose + 0.3, {...base, lookX: -0.95, lookY: 0.15, tilt: -2, brows: 0.3, bob: 5, mouth: 'smirk'}],
    [b.whose + 0.5, {...base, lookX: -0.95, lookY: 0.1, tilt: -2, brows: 0.25, bob: 0, mouth: 'smirk'}],
    [s.rfull5 - 0.75, {...base, lookX: -0.9, lookY: 0.1, tilt: -2, brows: 0.2, mouth: 'smirk'}],
    [s.rfull5 - 0.5, {...base, lookX: 0.95, lookY: 0, tilt: 4, brows: -0.15, mouth: 'flat'}],
    [s.rfull5 - 0.25, {...base, lookX: 0.95, lookY: 0.05, tilt: 4, brows: -0.2, bob: 5, mouth: 'flat'}],
    [s.rfull5, {...base, lookX: 0.95, lookY: 0, tilt: 4, brows: -0.2, bob: 0, mouth: 'flat'}],
  ]);
};
/** RF6: relief: a grin and a fist pump that comes down on the desk (the cut lands on the downstroke) */
const rf6Pose = (t: number): Pose => {
  const s = SH();
  const base: Pose = {...P0, lookY: 0.25, brows: 0.5, mouth: 'grin'};
  const fist = {curl: 0.95, spread: 0.05};
  return kp(t, [
    [s.rf6, {...base, bob: -2, armR: {a: 22, b: 80}, handR: fist}],
    [s.rf6 + 0.22, {...base, bob: -6, lean: 1, tilt: 3, lookY: 0.1, armR: {a: 30, b: 138}, handR: fist}],
    [s.rf6 + 0.38, {...base, bob: -6, lean: 1, tilt: 3, lookY: 0.1, armR: {a: 30, b: 142}, handR: fist}],
    [s.tiles, {...base, bob: 5, lean: 2, tilt: 1, lookY: 0.3, armR: {a: 12, b: 30}, handR: fist}],
  ]);
};

// ---------------------------------------------------------------- 16 trials -> one cleared line
const FAILS = [5, 10, 13];
const TW = 96, TH = 117, TG = 14;
const TX0 = (1920 - (16 * TW + 15 * TG)) / 2;
const TY = 452;
const MiniBoard: React.FC<{fail: boolean}> = ({fail}) => {
  const cells: [number, number, string][] = fail
    ? [...[0, 1, 2, 3, 4, 6, 7].map((c) => [c, 9, '#7C9DBD'] as [number, number, string]), [0, 8, '#7C9DBD'], [7, 8, '#7C9DBD'], [3, 7, K.saffron], [3, 8, K.saffron], [4, 8, K.saffron], [5, 8, K.saffron]]
    : [[0, 9, '#7C9DBD'], [1, 9, '#7C9DBD'], [7, 9, '#7C9DBD'], [5, 9, K.saffron]];
  return (
    <g>
      <rect x={PF.x - 3} y={PF.y - 3} width={PF.w + 6} height={PF.h + 6} rx={6} fill="#22384A" stroke={INK} strokeWidth={8} />
      {cells.map(([c, r, col], i) => <rect key={i} x={PF.x + c * CW + 1} y={PF.y + r * CH + 1} width={CW - 2} height={CH - 2} rx={4} fill={col} stroke={INK} strokeWidth={3} />)}
      {fail && <rect x={PF.x + 5 * CW - 3} y={PF.y + 9 * CH - 3} width={CW + 6} height={CH + 6} rx={6} fill="none" stroke={K.coral} strokeWidth={6} />}
    </g>
  );
};
const Tiles: React.FC<{t: number}> = ({t}) => {
  const b = FB(), s = SH(b);
  const t0 = s.tiles - 0.35; // the first tiles are already falling on the cut
  const fall = pr(t, s.merge, s.merge + 0.5, easeIn); // the tiles (and the failed lines) drop away
  const slide = pr(t, s.merge + 0.08, b.gEnd - 0.14);
  const merged = t >= b.gEnd - 0.14;
  const bw = LINE_BAR.x1 - LINE_BAR.x0, bh = LINE_BAR.y1 - LINE_BAR.y0;
  const nOk = 16 - FAILS.length;
  const tiles: React.ReactNode[] = [];
  const bars: React.ReactNode[] = [];
  let j = 0;
  for (let i = 0; i < 16; i++) {
    const fail = FAILS.includes(i);
    const land = t0 + i * 0.058 + 0.16;
    const drop = pr(t, land - 0.16, land, easeIn);
    const bounce = t > land ? Math.sin(clamp((t - land) / 0.16) * Math.PI) * 9 * (1 - clamp((t - land) / 0.16)) : 0;
    const x = TX0 + i * (TW + TG);
    const y = lerp(-180, TY, drop) - bounce + fall * (1300 + i * 13);
    if (drop > 0) {
      tiles.push(
        <g key={`t${i}`} transform={`translate(${fmt(x)} ${fmt(y)}) scale(${fmt(TW / PF.w)}) translate(${-PF.x} ${-PF.y})`}>
          <MiniBoard fail={fail} />
        </g>,
      );
    }
    const lineK = pr(t, land, land + 0.12);
    if (lineK > 0) {
      if (fail) {
        bars.push(<rect key={`b${i}`} x={fmt(x)} y={fmt(LINE_BAR.y0 + fall * (1300 + i * 13))} width={TW} height={bh} fill="#C9D1D8" opacity={lineK} />);
      } else if (!merged) {
        const w = lerp(TW, bw / nOk + 1, slide);
        const bx = lerp(x, LINE_BAR.x0 + (j * bw) / nOk, slide);
        bars.push(<rect key={`b${i}`} x={fmt(bx)} y={LINE_BAR.y0} width={fmt(Math.min(w, LINE_BAR.x1 - bx))} height={bh} fill={K.saffron} opacity={lineK} />);
      }
    }
    if (!fail) j++;
  }
  const labels = 1 - pr(t, s.merge - 0.15, s.merge + 0.1);
  return (
    <g>
      <rect x={0} y={0} width={1920} height={1080} fill={K.paper} />
      {tiles}
      {bars}
      {merged && <rect x={LINE_BAR.x0} y={LINE_BAR.y0} width={bw} height={bh} fill={K.saffron} />}
      <Tag x={960} y={250} text="13 of 16 lines cleared" size={52} k={pr(t, b.thirteen + 0.0, b.thirteen + 0.3) * labels} />
      <Tag x={960} y={338} text="average across five teams" size={36} k={pr(t, b.outOf - 0.1, b.outOf + 0.2) * labels} />
    </g>
  );
};

// ---------------------------------------------------------------- world cameras
const camHub = (t: number): CamS => {
  const b = FB(), s = SH(b);
  const v = fgVotes(b)[4];
  const ks: CK[] = [
    [s.hub2, {x: 980, y: 1400, z: 1.3}],
    [v.hub - 0.05, {x: 1930, y: 990, z: 1.55}],
    [b.computer - 0.15, CAMS.HUBWIN3],
    [s.track3[0], CAMS.HUBWIN4],
    [s.track3[1], CAMS.HEADBACK2],
    [s.in3[0], CAMS.HEADBACK2],
    [s.in3[1], CAMS.POV],
    [s.rf5, CAMS.POV2],
  ];
  return camAt(t, ks);
};

export const VG: React.FC<{f: number}> = ({f}) => {
  const t = f / FPS;
  const b = FB();
  const s = SH(b);
  const st = fgState(t, b);

  // ---------------------------------------------------------------- 1. the cleared line, a new block
  if (t < s.rf4) {
    const cam: CamS = {...CAMS.RFULL, z: CAMS.RFULL.z * lerp(1, 1.03, pr(t, b.g0, s.rf4, (x) => x))};
    return <WorldView id={id} st={st} f={f} cam={cam} pillars={false} />;
  }
  // ---------------------------------------------------------------- 2. trust issues
  if (t < s.sb2) {
    const push = lerp(1, 1.06, pr(t, s.rf4, s.sb2, (x) => x));
    return <FaceShot id={`${id}-r4`} who="R" f={f} t={t} pose={rf4Pose(t)} cx={1000} gy={1680} S={3.2} push={push} front="R" coil />;
  }
  // ---------------------------------------------------------------- 3. Sender B votes YES (in good faith)
  if (t < s.hub2) {
    const v = fgVotes(b)[4];
    const chip = t >= v.leave ? {u: chipU(t, v.leave), k: clamp((t - v.leave) / 0.12), text: 'YES', color: K.senderB} : undefined;
    const push = lerp(1, 1.05, pr(t, s.sb2, s.hub2, (x) => x));
    return (
      <g>
        <FaceShot id={`${id}-sb`} who="B" f={f} t={t} pose={sb2Pose(t)} cx={860} gy={1586} S={3.0} push={push} leds={st.leds.B} capGlow={st.cap.B} chip={chip} />
        <Tag x={56} y={62} anchor="start" text="Sender B" size={34} k={win(t, s.sb2 + 0.05, s.sb2 + 0.3, s.hub2 + 1, s.hub2 + 2)} fill={K.senderB} color="#FFFFFF" />
      </g>
    );
  }
  // ---------------------------------------------------------------- 4. into the lab computer: the flip; to the coil; the flash
  if (t < s.rf5) {
    const cam = camHub(t);
    const e = pr(t, s.in3[0], s.in3[1]);
    const head = t < s.in3[0] ? {d: 1, op: 1} : {d: 1 + 0.9 * e, op: 1 - pr(t, lerp(s.in3[0], s.in3[1], 0.4), s.in3[1])};
    const pov = pr(t, s.in3[1] - 0.3, s.in3[1]);
    const arcT = s.in3[1] + 0.05;
    return (
      <g>
        <WorldView id={id} st={st} f={f} cam={cam} head={{d: head.d, ref: CAMS.HEADBACK2, op: head.op}} pillars={t > s.track3[0]} />
        <POVVignette id={id} k={pov} />
        <SoftArc x={960} y={318} w={760} k={win(t, arcT, arcT + 0.12, arcT + 0.45, arcT + 0.9)} />
      </g>
    );
  }
  // ---------------------------------------------------------------- 5. the track record; eyes to YES
  if (t < s.rfull5) {
    const push = lerp(1, 1.05, pr(t, s.rf5, s.rfull5, (x) => x));
    return (
      <g>
        <FaceShot id={`${id}-r5`} who="R" f={f} t={t} pose={rf5Pose(t)} cx={1350} gy={1636} S={3.0} push={push} leds={st.leds.R} hx={46} coil
          light={{col: '#FFF4CF', k: 0.45 * (1 - pr(t, s.rf5, s.rf5 + 0.5))}} />
        <RecordPanel x={190} t={t} t0={b.learned - 0.05} dimB={pr(t, b.whose - 0.05, b.whose + 0.3)} />
      </g>
    );
  }
  // ---------------------------------------------------------------- 6. the Receiver's screen: turn, drop, clear
  if (t < s.rf6) {
    const cam = camAt(t, [[s.rfull5, CAMS.RFULL], [s.rf6, {...CAMS.RFULL, z: CAMS.RFULL.z * 1.04}]]);
    return (
      <g>
        <WorldView id={id} st={st} f={f} cam={cam} pillars={false} />
        <Tag x={960} y={58} text="Receiver’s view" size={34} k={win(t, s.rfull5 + 0.05, s.rfull5 + 0.3, s.rfull5 + 0.9, s.rfull5 + 1.2)} fill={K.receiver} color="#FFFFFF" />
      </g>
    );
  }
  // ---------------------------------------------------------------- 7. relief
  if (t < s.tiles) {
    return <FaceShot id={`${id}-r6`} who="R" f={f} t={t} pose={rf6Pose(t)} cx={960} gy={1708} S={3.3} push={lerp(1.03, 1, pr(t, s.rf6, s.tiles))} front="R" coil
      light={{col: K.saffron, k: lerp(0.7, 0.25, pr(t, s.rf6, s.tiles))}} />;
  }
  // ---------------------------------------------------------------- 8. 13 of 16 -> one cleared line (LINE_BAR)
  return <Tiles t={t} />;
};

export const CUES_VG = (): {t: number; kind: string; gain?: number; dur?: number}[] => {
  const b = FB();
  const s = SH(b);
  const vs = fgVotes(b).filter((v) => v.leave >= b.g0);
  const out: {t: number; kind: string; gain?: number}[] = [
    {t: b.flipped + 0.05, kind: 'flip'},
    {t: s.in3[1] + 0.05, kind: 'flash', gain: -2},
    {t: b.whose + 0.3, kind: 'tick', gain: -12},
    {t: s.rfull5 + 0.2, kind: 'rotate', gain: -4},
    {t: b.cleared - 0.05, kind: 'line_clear', gain: -3},
    {t: b.thirteen, kind: 'pop', gain: -10},
    {t: s.merge + 0.1, kind: 'whoosh', gain: -16},
  ];
  for (const v of vs) out.push({t: v.leave, kind: 'vote', gain: -5});
  for (const v of vs) out.push({t: v.hub, kind: 'packet_arrive', gain: -12});
  for (const p of pulseTimes(b)) if (p >= b.g0 && p < b.gEnd) out.push({t: p, kind: 'coil_pulse'});
  for (let i = 0; i < 6; i += 2) out.push({t: b.learned + 0.1 + (i / 6) * 0.9, kind: 'tick', gain: -14});
  for (let i = 4; i < 16; i += 5) out.push({t: s.tiles - 0.35 + i * 0.058 + 0.16, kind: 'tick', gain: -14});
  return out.sort((x, y) => x.t - y.t);
};
