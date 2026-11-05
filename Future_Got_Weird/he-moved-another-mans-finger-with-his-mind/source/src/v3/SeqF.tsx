// V2 F. BrainNet (2019), 135.87 -> 178.87 s.
// Match cut: the 2014 touchpad's rectangle becomes the falling J-block (its 3 x 2 box fills PAD_RECT on the first
// frame), seen full-frame on the Receiver's screen. Pull back: the Receiver's whole screen and the YES/NO lights; the
// lower half is hidden from this seat; a dashed preview turns the block ("Rotate it?"). Pull back over the Receiver's
// shoulder and track left through the building (foreground wall pillars) past the hub to the two Senders' rooms.
// Their screens light the gap; push into Sender A's screen ("Sender's view"). The same game, the Receiver's seat: the
// cover slides up over the lower half. Ease back to the lights; over the shoulder, the Receiver looks from YES to NO.
// Cut to a split screen of the two Senders (Round 1): each stares at the flickering YES light, the cap reads it and a
// coloured vote chip leaves along the cable. Match on action into the hub: the chips settle in the computer. Track
// right through the wall to the back of the Receiver's head: the figure-eight coil settles flat over the visual cortex
// (the brain shows through). A's chip runs to the stimulator, a pulse, and the camera pushes through the head into the
// Receiver's view: one brief, soft arc = "rotate"; nothing = "leave it". Back out through the head as B's chip
// arrives, a pulse, back in: the second arc; the Receiver stares at YES and the block turns. Round 2: a letterbox split
// of the two Senders, who see the half-fallen block and stare at NO; the top strip opens into Sender A's screen, where
// the block drops into the gap and the line clears.
import React from 'react';
import {clamp, fmt, lerp} from '../dc/math';
import {FPS} from '../lib/core';
import {INK, K, Tag} from '../art/kit';
import {SoftArc, PF, CW, CH} from '../art/s6world';
import {FB, fgState, fgVotes, pr, pulseTimes, win} from './fgTime';
import {HEAD, MON, scrPt, lampPt, HANDLE_END, COIL} from './fgWorld';
import {CAMS, camAt, camT, CK, POVVignette, toScr, WorldView, WTag} from './fgShot';
import {CamS} from './core2';

const id = 'vf';

/** the match cut's extension of the playfield around the piece (fades as the camera pulls back), world units */
const MatchField: React.FC<{t: number; t0: number}> = ({t, t0}) => {
  const k = 1 - pr(t, t0 + 0.2, t0 + 0.85);
  if (k <= 0) return null;
  const R = MON.R;
  const o = scrPt(R, PF.x, PF.y);
  const cw = CW * R.s, ch = CH * R.s;
  const e = 1.2;
  const bx = o.x + 3 * cw - e, by = o.y + ch - e, bw = 3 * cw + 2 * e, bh = 2 * ch + 2 * e;
  const hole = `M-5000,-5000 H9000 V9000 H-5000 Z M${fmt(bx)},${fmt(by)} V${fmt(by + bh)} H${fmt(bx + bw)} V${fmt(by)} Z`;
  const lines: string[] = [];
  for (let i = -20; i <= 28; i++) lines.push(`M${fmt(o.x + i * cw)},${fmt(o.y - 20 * ch)} V${fmt(o.y + 30 * ch)}`);
  for (let j = -20; j <= 30; j++) lines.push(`M${fmt(o.x - 20 * cw)},${fmt(o.y + j * ch)} H${fmt(o.x + 28 * cw)}`);
  return (
    <g opacity={k}>
      <defs>
        <clipPath id={`${id}-mf`}>
          <path d={hole} clipRule="evenodd" />
        </clipPath>
      </defs>
      <path d={hole} fillRule="evenodd" fill="#22384A" />
      <path d={lines.join(' ')} clipPath={`url(#${id}-mf)`} stroke="#9DB2C3" strokeWidth={R.s} opacity={0.18} fill="none" />
    </g>
  );
};

const times = () => {
  const b = FB();
  const swap1 = b.third + 0.08;
  return {
    b,
    swap1,
    split1: b.each - 0.3,
    w2: b.vote + 0.55,
    split2: b.freshRound - 0.4,
    open2: b.chance - 0.2,
    w3: b.chance + 0.42,
    // push-through-the-head windows
    in1: [b.little - 0.25, b.flash] as [number, number],
    out1: [b.leave + 0.1, b.got - 0.35] as [number, number],
    in2: [b.got + 0.2, b.fromEach - 0.2] as [number, number],
  };
};

const camW1 = (t: number): CamS => {
  const {b, swap1} = times();
  const ks: CK[] = [
    [b.f0, CAMS.MATCH],
    [b.f0 + 0.18, CAMS.MATCH],
    [b.recv - 0.35, CAMS.RMON],
    [b.y2019 - 0.4, CAMS.RMON2],
    [b.three - 0.15, CAMS.OTS],
    [b.rooms + 0.45, CAMS.SENW],
    [b.two + 0.35, CAMS.SENW2],
    [b.gap + 0.3, CAMS.AFULL],
    [swap1, CAMS.AFULL],
    [swap1 + 0.0001, CAMS.RFULL],
    [b.block + 0.3, CAMS.RFULL],
    [b.rotateIt + 0.3, CAMS.RMON],
    [b.either - 0.2, CAMS.OTS2],
    [b.reasonable + 1.3, CAMS.OTS3],
  ];
  return camAt(t, ks);
};
const camW2 = (t: number): CamS => {
  const T = times();
  const ks: CK[] = [
    [T.w2, CAMS.HUB],
    [T.w2 + 0.95, CAMS.HUBWIN],
    [T.b.coil + 0.2, CAMS.HEADBACK],
    [T.b.over - 0.1, CAMS.HEADBACK_B],
    [T.in1[0] - 0.9, CAMS.HEADBACK2],
    [T.in1[0], CAMS.HEADBACK2],
    [T.in1[1], CAMS.POV],
    [T.out1[0], CAMS.POV2],
    [T.out1[1], CAMS.HEADBACK2],
    [T.in2[0], CAMS.HEADBACK2],
    [T.in2[1], CAMS.POV],
    [T.split2, CAMS.POV2],
  ];
  return camAt(t, ks);
};
/** the Receiver's head: d and opacity through the push-through transitions */
const headW2 = (t: number) => {
  const T = times();
  const into = (w: [number, number]) => pr(t, w[0], w[1]);
  if (t < T.in1[0]) return {d: 1, op: 1};
  if (t < T.in1[1]) { const e = into(T.in1); return {d: 1 + 0.9 * e, op: 1 - pr(t, lerp(T.in1[0], T.in1[1], 0.4), T.in1[1])}; }
  if (t < T.out1[0]) return {d: 1.9, op: 0};
  if (t < T.out1[1]) { const e = into(T.out1); return {d: 1.9 - 0.9 * e, op: pr(t, T.out1[0], lerp(T.out1[0], T.out1[1], 0.6))}; }
  if (t < T.in2[0]) return {d: 1, op: 1};
  if (t < T.in2[1]) { const e = into(T.in2); return {d: 1 + 0.9 * e, op: 1 - pr(t, lerp(T.in2[0], T.in2[1], 0.4), T.in2[1])}; }
  return {d: 1.9, op: 0};
};

export const VF: React.FC<{f: number}> = ({f}) => {
  const t = f / FPS;
  const T = times();
  const b = T.b;
  const st = fgState(t, b);

  // ---------------------------------------------------------------- shot 1: the Receiver's game -> the building -> the screens
  if (t < T.split1) {
    const cam = camW1(t);
    const rv = win(t, b.f0 + 0.55, b.f0 + 0.85, b.y2019 - 0.1, b.y2019 + 0.25) + win(t, T.swap1 + 0.25, T.swap1 + 0.55, b.seat - 0.3, b.seat + 0.1);
    const sv = win(t, b.gap - 0.25, b.gap + 0.05, T.swap1 + 0.05, T.swap1 + 0.3);
    const roomK = win(t, b.rooms - 0.05, b.rooms + 0.3, b.two + 0.3, b.two + 0.6);
    return (
      <g>
        <WorldView id={id} st={st} f={f} cam={cam} />
        <g transform={camT(cam)}>
          <MatchField t={t} t0={b.f0} />
        </g>
        <Tag x={960} y={58} text="Receiver’s view" size={34} k={rv} fill={K.receiver} color="#FFFFFF" />
        <Tag x={960} y={58} text="Sender’s view" size={34} k={sv} fill={K.senderA} color="#FFFFFF" />
        <Tag x={960} y={142} text="Rotate it?" size={40} k={win(t, b.job - 0.05, b.job + 0.25, b.y2019 - 0.15, b.y2019 + 0.2)} />
        <Tag x={56} y={60} anchor="start" text="BrainNet · 2019" size={32} k={win(t, b.y2019 + 0.1, b.y2019 + 0.45, b.two - 0.6, b.two - 0.3)} />
        <WTag cam={cam} p={{x: HEAD.x - 260, y: HEAD.y - 150}} text="Receiver" k={win(t, b.three - 0.05, b.three + 0.3, b.two + 0.3, b.two + 0.6)} fill={K.receiver} color="#FFFFFF" />
        <WTag cam={cam} p={{x: 430, y: 175}} text="Sender A" k={roomK} fill={K.senderA} color="#FFFFFF" />
        <WTag cam={cam} p={{x: 430, y: 1275}} text="Sender B" k={roomK} fill={K.senderB} color="#FFFFFF" />
        <WTag cam={cam} p={lampPt(MON.R, -1)} dy={-95} text="rotate?" size={34} k={win(t, b.either - 0.5, b.either - 0.2, b.reasonable + 0.6, b.reasonable + 0.9)} />
        <WTag cam={cam} p={lampPt(MON.R, 1)} dy={-95} text="leave it?" size={34} k={win(t, b.either + 0.3, b.either + 0.6, b.reasonable + 0.6, b.reasonable + 0.9)} />
      </g>
    );
  }

  // ---------------------------------------------------------------- shot 2: Round 1, a split screen of the two Senders
  if (t < T.w2) {
    const u = pr(t, T.split1, T.w2 + 0.4);
    const camA: CamS = {x: lerp(600, 680, u), y: lerp(445, 400, u), z: lerp(1.3, 1.36, u)};
    const camB: CamS = {x: lerp(600, 680, u), y: lerp(1545, 1500, u), z: lerp(1.3, 1.36, u)};
    const k = pr(t, T.split1, T.split1 + 0.25);
    return (
      <g>
        <rect x={0} y={0} width={1920} height={1080} fill={INK} />
        <defs>
          <clipPath id={`${id}-s1a`}><rect x={0} y={0} width={954} height={1080} /></clipPath>
          <clipPath id={`${id}-s1b`}><rect x={966} y={0} width={954} height={1080} /></clipPath>
        </defs>
        <g clipPath={`url(#${id}-s1a)`}>
          <WorldView id={`${id}p`} st={st} f={f} cam={camA} ax={477} pillars={false} />
        </g>
        <g clipPath={`url(#${id}-s1b)`}>
          <WorldView id={`${id}q`} st={st} f={f} cam={camB} ax={1443} pillars={false} />
        </g>
        <Tag x={960} y={58} text="Round 1" size={34} k={k * (1 - pr(t, T.w2 - 0.25, T.w2))} />
      </g>
    );
  }

  // ---------------------------------------------------------------- shot 3: the hub, the coil, the flash (two pulses)
  if (t < T.split2) {
    const cam = camW2(t);
    const h = headW2(t);
    const pov = pr(t, T.in1[1] - 0.3, T.in1[1]) * (1 - pr(t, T.out1[0], T.out1[0] + 0.45)) + pr(t, T.in2[1] - 0.3, T.in2[1]);
    const arc = Math.max(win(t, b.flash - 0.02, b.flash + 0.1, b.flash + 0.45, b.flash + 0.9), win(t, T.in2[1] + 0.03, T.in2[1] + 0.15, T.in2[1] + 0.5, T.in2[1] + 0.95));
    const vcK = win(t, b.over + 0.55, b.over + 0.85, b.little - 0.8, b.little - 0.5);
    const vc = {x: HEAD.x - 0.42 * HEAD.r, y: HEAD.y + 0.5 * HEAD.r};
    const vcTag = {x: HEAD.x - 360, y: HEAD.y - 70};
    return (
      <g>
        <WorldView id={id} st={st} f={f} cam={cam} head={{d: h.d, ref: CAMS.HEADBACK2, op: h.op}} />
        {vcK > 0 && (
          <g transform={camT(cam)} opacity={clamp(vcK * 1.4)}>
            <path d={`M${vcTag.x + 40},${vcTag.y + 20} Q${vcTag.x + 60},${vc.y + 10} ${vc.x - 40},${vc.y}`} fill="none" stroke={INK} strokeWidth={4} strokeDasharray="9 7" />
            <circle cx={vc.x - 40} cy={vc.y} r={6} fill={INK} />
          </g>
        )}
        <WTag cam={cam} p={vcTag} text="visual cortex" size={34} k={vcK} />
        <WTag cam={cam} p={{x: HANDLE_END.x - 20, y: COIL.y - 120}} text="coil" size={34} k={win(t, b.coil + 0.45, b.coil + 0.75, b.back + 0.9, b.back + 1.2)} />
        <POVVignette id={id} k={pov} />
        <SoftArc x={960} y={318} w={760} k={arc} />
        <Tag x={960} y={58} text="Receiver’s view" size={34} k={win(t, T.in1[1] - 0.1, T.in1[1] + 0.2, b.meantRot - 0.3, b.meantRot - 0.05)} fill={K.receiver} color="#FFFFFF" />
        <Tag x={960} y={58} text="flash = rotate" size={40} k={win(t, b.meantRot - 0.05, b.meantRot + 0.25, b.noFlash - 0.25, b.noFlash)} />
        <Tag x={960} y={58} text="no flash = leave it" size={40} k={win(t, b.noFlash + 0.05, b.noFlash + 0.35, b.leave + 0.25, b.leave + 0.55)} />
        <Tag x={960} y={58} text="Round 1" size={34} k={win(t, T.in2[1] - 0.1, T.in2[1] + 0.2, T.split2 - 0.3, T.split2)} />
      </g>
    );
  }

  // ---------------------------------------------------------------- shot 4: Round 2, a letterbox split; the top strip opens into A's screen
  {
    const e = pr(t, T.open2, T.w3);
    const u = pr(t, T.split2, T.open2);
    const camA: CamS = t < T.open2 ? {x: lerp(850, 880, u), y: lerp(452, 446, u), z: lerp(1.0, 1.05, u)} : camAt(t, [[T.open2, {x: 880, y: 446, z: 1.05}], [T.w3, CAMS.AFULL]]);
    const camB: CamS = {x: lerp(850, 880, u), y: lerp(1552, 1546, u), z: lerp(1.0, 1.05, u)};
    const aH = lerp(534, 1080, e);
    if (t >= T.w3) {
      return <WorldView id={id} st={st} f={f} cam={CAMS.AFULL} pillars={false} />;
    }
    return (
      <g>
        <rect x={0} y={0} width={1920} height={1080} fill={INK} />
        <defs>
          <clipPath id={`${id}-s2a`}><rect x={0} y={0} width={1920} height={aH} /></clipPath>
          <clipPath id={`${id}-s2b`}><rect x={0} y={546} width={1920} height={534} /></clipPath>
        </defs>
        <g transform={`translate(0 ${fmt(546 * e)})`}>
          <g clipPath={`url(#${id}-s2b)`}>
            <WorldView id={`${id}q`} st={st} f={f} cam={camB} ay={813} pillars={false} />
          </g>
        </g>
        <g clipPath={`url(#${id}-s2a)`}>
          <WorldView id={`${id}p`} st={st} f={f} cam={camA} ay={lerp(267, 540, e)} pillars={false} />
        </g>
        <Tag x={960} y={540 + 546 * e * 0.5} text="Round 2" size={34} k={win(t, T.split2 + 0.05, T.split2 + 0.3, T.open2 - 0.1, T.open2 + 0.1)} />
      </g>
    );
  }
};

export const CUES_VF = (): {t: number; kind: string; gain?: number; dur?: number}[] => {
  const T = times();
  const b = T.b;
  const vs = fgVotes(b).filter((v) => v.leave < b.g0);
  const out: {t: number; kind: string; gain?: number}[] = [
    {t: b.job - 0.1, kind: 'rotate', gain: -10},
    {t: b.y2019 + 0.1, kind: 'pop', gain: -10},
    {t: b.three - 0.2, kind: 'whoosh', gain: -12},
    {t: b.two + 0.1, kind: 'tick', gain: -8},
    {t: b.decide + 0.4, kind: 'rotate', gain: -10},
    {t: b.coil + 0.5, kind: 'tick', gain: -6},
    {t: (fgTrialsRot()), kind: 'rotate', gain: -4},
    {t: b.change + 0.78, kind: 'line_clear', gain: -3},
  ];
  for (const v of vs) out.push({t: v.leave, kind: 'vote', gain: -4});
  for (const v of vs) if (v.hub < b.g0 && v.hub < T.split2) out.push({t: v.hub, kind: 'packet_arrive', gain: -10});
  for (const p of pulseTimes(b)) if (p < b.g0) out.push({t: p, kind: 'coil_pulse'});
  out.push({t: b.flash, kind: 'flash', gain: -2});
  out.push({t: T.in2[1] + 0.05, kind: 'flash', gain: -2});
  return out.sort((x, y) => x.t - y.t);
};
const fgTrialsRot = () => FB().chose + 0.63;
