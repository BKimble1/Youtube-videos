// V3 F. BrainNet (2019), 135.87 -> 178.87 s.
// Match cut: the 2014 touchpad's rectangle becomes the falling J-block (its 3 x 2 box fills PAD_RECT on the first
// frame) on the Receiver's screen; pull back as a dashed preview turns the block. Cut on the turn to the reverse angle:
// the Receiver's face takes the same turn (head tilt, eyes), a hand comes up to the chin: "a much better job". An
// eyeline cut on the glance takes us behind the Receiver (head still turned), and the camera tracks left through the
// building past the lab computer to the two Senders' rooms. Push into Sender A's room and screen (the gap), then the
// identical framing swaps to the Receiver's screen and the cover slides up over the lower half. The Receiver's face:
// eyes to YES, to NO, a shrug ("either answer looked reasonable"). Each Sender stares at the YES light (eyes, head,
// anticipation); the cap reads it and the chip leaves down the cable, out of frame, and arrives in the lab computer
// (the relay software shows both votes). Track along the output cable to the back of the Receiver's head: the
// figure-eight coil settles over the visual cortex. A's chip reaches the stimulator (PULSE), push through the head:
// one soft arc = "rotate"; nothing = "leave it". Pull out as B's chip arrives (PULSE), back in: the second arc. The
// Receiver decides (eyes snap to YES, a nod); cut on the nod: the block turns. Pull back to the whole floor: round 2,
// both Senders stare at NO, the NOs ride to the stimulator ("no pulse"); push into the Receiver's screen as the block
// drops into the gap and the line clears.
import React from 'react';
import {clamp, fmt, lerp} from '../dc/math';
import {FPS} from '../lib/core';
import {INK, K, Tag} from '../art/kit';
import {SoftArc, PF, CW, CH} from '../art/s6world';
import {FB, fgState, fgVotes, pr, pulseTimes, SH, win} from './fgTime';
import {HEAD, MON, scrPt, HANDLE_END, COIL, STIM, TOWER} from './fgWorld';
import {CAMS, camAt, camT, CK, POVVignette, WorldView, WTag} from './fgShot';
import {chipU, FaceShot, kp, P0} from './fgClose';
import {Pose} from './crew3';
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

// ---------------------------------------------------------------- face-shot performances (all poses keyed to the words)
const CHIN_R = {a: -20, b: 222};
const SHRUG = {a: 24, b: 96};
/** RF1: the Receiver takes the turn of the block with their head, a hand comes up to the chin, then a glance to the left */
const rf1Pose = (t: number): Pose => {
  const b = FB(), s = SH(b);
  const base: Pose = {...P0, lookY: 0.25, brows: 0.1};
  return kp(t, [
    [s.matchEnd, {...base, tilt: 3, lookX: -0.1}],
    [s.matchEnd + 0.35, {...base, tilt: 8, lookX: 0.2, lookY: 0.15}],
    [b.job - 0.05, {...base, tilt: 6, lookX: 0.1, brows: 0.2}],
    [b.job + 0.5, {...base, tilt: 4, lookX: 0, lookY: 0.2, brows: 0.35, mouth: 'hmm', armR: CHIN_R, handR: {curl: 0.75, spread: 0.1}}],
    [s.rf1End - 0.45, {...base, tilt: 3, lookX: 0, lookY: 0.2, brows: 0.3, mouth: 'hmm', armR: CHIN_R, handR: {curl: 0.75, spread: 0.1}}],
    [s.rf1End - 0.1, {...base, tilt: 6, lean: 1.5, lookX: 0.95, lookY: 0.05, brows: 0.25, mouth: 'flat', armR: {a: 18, b: 70}, handR: {curl: 0.6, spread: 0.1}}],
  ]);
};
/** RF2: either answer looked reasonable: eyes to YES (frame-right), to NO (frame-left), then a two-handed shrug */
const rf2Pose = (t: number): Pose => {
  const b = FB(), s = SH(b);
  const base: Pose = {...P0, lookY: 0.15, brows: 0.15};
  const open = {curl: 0, spread: 1};
  return kp(t, [
    [s.rf2, {...base, tilt: -2}],
    [b.either - 0.2, {...base, tilt: -1, lookY: 0.2}],
    [b.either + 0.1, {...base, tilt: 4, lean: 1, lookX: 0.92, lookY: 0, brows: 0.3, mouth: 'hmm'}],
    [b.reasonable - 0.15, {...base, tilt: 4, lean: 1, lookX: 0.92, lookY: 0, brows: 0.3, mouth: 'hmm'}],
    [b.reasonable + 0.2, {...base, tilt: -4, lean: -1, lookX: -0.92, lookY: 0, brows: 0.3, mouth: 'hmm'}],
    [b.reasonable + 0.55, {...base, tilt: -3, lean: -1, lookX: -0.9, lookY: 0, brows: 0.3, mouth: 'hmm'}],
    [b.reasonable + 0.95, {...base, tilt: 0, lookX: 0, lookY: -0.1, brows: 0.65, mouth: 'flat', bob: -7, armL: SHRUG, armR: SHRUG, handL: open, handR: open}],
    [s.sa1 - 0.25, {...base, tilt: 2, lookX: 0, lookY: -0.05, brows: 0.6, mouth: 'flat', bob: -6, armL: SHRUG, armR: SHRUG, handL: open, handR: open}],
    [s.sa1 + 0.2, {...base, tilt: 1, lookX: 0.3, brows: 0.3, armL: {a: 14, b: 40}, armR: {a: 14, b: 40}}],
  ]);
};
/** a Sender's vote: eyes on the block, a blink and a dip (anticipation), then the eyes and head lock on a light */
const senderPose = (t: number, t0: number, look: number, side: -1 | 1, hesitate = false): Pose => {
  const base: Pose = {...P0, lookY: 0.3, brows: 0.05};
  const lx = side < 0 ? 0.95 : -0.95; // YES is the frame-right housing (the person's left)
  const ks: [number, Pose][] = hesitate
    ? [
      [t0, {...base, lookX: -lx * 0.9, lookY: 0, tilt: -side * -3, brows: 0.25, mouth: 'hmm'}],
      [look - 0.15, {...base, lookX: -lx * 0.9, lookY: 0, tilt: 3 * side, brows: 0.25, mouth: 'hmm'}],
      [look + 0.12, {...base, lookX: lx, lookY: -0.05, tilt: -4 * side, lean: -1.5 * side, brows: -0.2, mouth: 'flat'}],
      [look + 0.3, {...base, lookX: lx, lookY: -0.05, tilt: -4 * side, lean: -1.5 * side, brows: -0.25, mouth: 'flat', bob: 5}],
      [look + 0.5, {...base, lookX: lx, lookY: -0.05, tilt: -4 * side, lean: -1.5 * side, brows: -0.25, mouth: 'flat', bob: 0}],
    ]
    : [
      [t0, base],
      [look - 0.3, {...base, lookY: 0.32}],
      [look - 0.14, {...base, lookY: 0.2, bob: 5, blink: 0.12, brows: -0.05}],
      [look - 0.02, {...base, lookY: 0.1, bob: 3, blink: 1}],
      [look + 0.2, {...base, lookX: lx, lookY: -0.08, tilt: -4 * side, lean: -1.5 * side, brows: -0.25, mouth: 'flat', bob: 0}],
      [look + 1.5, {...base, lookX: lx, lookY: -0.08, tilt: -4.5 * side, lean: -1.8 * side, brows: -0.3, mouth: 'flat', bob: -1}],
    ];
  return kp(t, ks);
};
/** RF3: the decision: eyes snap to YES, a firm nod */
const rf3Pose = (t: number): Pose => {
  const b = FB(), s = SH(b);
  const base: Pose = {...P0, lookY: 0.05, brows: 0.15};
  return kp(t, [
    [s.rf3, {...base, lookX: -0.1, brows: 0.35}],
    [b.chose, {...base, lookX: -0.05, brows: 0.3}],
    [b.chose + 0.16, {...base, lookX: 0.95, lookY: 0, tilt: 3, brows: -0.15}],
    [b.chose + 0.42, {...base, lookX: 0.95, lookY: 0.1, tilt: 3, brows: -0.2, bob: 6}],
    [b.chose + 0.7, {...base, lookX: 0.95, lookY: 0, tilt: 2, brows: -0.2, bob: 0, mouth: 'flat'}],
  ]);
};

// ---------------------------------------------------------------- the world cameras
const camBuilding = (t: number): CamS => {
  const b = FB(), s = SH(b);
  const ks: CK[] = [
    [s.ots, CAMS.OTS],
    [s.ots + 0.4, CAMS.OTS2],
    [s.wideIn, CAMS.SENW],
    [b.two + 0.2, CAMS.SENW2],
    [s.aMed, CAMS.AMED],
    [s.aFull, CAMS.AFULL],
    [s.swap1, CAMS.AFULL],
    [s.swap1 + 0.0001, CAMS.RFULL],
    [b.block + 0.45, CAMS.RFULL],
    [b.decide + 0.7, CAMS.RMON],
    [s.rf2, CAMS.RMON2],
  ];
  return camAt(t, ks);
};
const camW2 = (t: number): CamS => {
  const b = FB(), s = SH(b);
  const ks: CK[] = [
    [s.hub1, CAMS.HUB],
    [s.hub1 + 0.55, CAMS.HUB2],
    [b.coil + 0.05, CAMS.HEADBACK],
    [b.over - 0.1, CAMS.HEADBACK_B],
    [s.in1[0] - 0.85, CAMS.HEADBACK2],
    [s.in1[0], CAMS.HEADBACK2],
    [s.in1[1], CAMS.POV],
    [s.out1[0], CAMS.POV2],
    [s.out1[1], CAMS.HEADBACK2],
    [s.in2[0], CAMS.HEADBACK2],
    [s.in2[1], CAMS.POV],
    [s.rf3, CAMS.POV2],
  ];
  return camAt(t, ks);
};
/** the Receiver's head: d and opacity through the push-through transitions */
const headW2 = (t: number) => {
  const s = SH();
  const into = (w: [number, number]) => pr(t, w[0], w[1]);
  if (t < s.in1[0]) return {d: 1, op: 1};
  if (t < s.in1[1]) { const e = into(s.in1); return {d: 1 + 0.9 * e, op: 1 - pr(t, lerp(s.in1[0], s.in1[1], 0.4), s.in1[1])}; }
  if (t < s.out1[0]) return {d: 1.9, op: 0};
  if (t < s.out1[1]) { const e = into(s.out1); return {d: 1.9 - 0.9 * e, op: pr(t, s.out1[0], lerp(s.out1[0], s.out1[1], 0.6))}; }
  if (t < s.in2[0]) return {d: 1, op: 1};
  if (t < s.in2[1]) { const e = into(s.in2); return {d: 1 + 0.9 * e, op: 1 - pr(t, lerp(s.in2[0], s.in2[1], 0.4), s.in2[1])}; }
  return {d: 1.9, op: 0};
};
const camW3 = (t: number): CamS => {
  const b = FB(), s = SH(b);
  return camAt(t, [
    [s.rmon3, CAMS.RMON],
    [s.pull2[0], CAMS.RMON2],
    [s.pull2[1], CAMS.WIDE],
    [s.push2[0], CAMS.WIDE2],
    [s.push2[1], CAMS.RFULL],
    [b.g0, CAMS.RFULL],
  ]);
};

const SenderTag: React.FC<{who: 'A' | 'B'; k: number}> = ({who, k}) => (
  <Tag x={56} y={62} anchor="start" text={`Sender ${who}`} size={34} k={k} fill={who === 'A' ? K.senderA : K.senderB} color="#FFFFFF" />
);

export const VF: React.FC<{f: number}> = ({f}) => {
  const t = f / FPS;
  const b = FB();
  const s = SH(b);
  const st = fgState(t, b);
  const vs = fgVotes(b);
  const [a1, b1] = vs;

  // ---------------------------------------------------------------- 1. the match cut and the Receiver's screen
  if (t < s.matchEnd) {
    const cam = camAt(t, [[b.f0, CAMS.MATCH], [b.f0 + 0.18, CAMS.MATCH], [b.recv - 0.5, CAMS.RMON], [s.matchEnd, CAMS.RMON2]]);
    return (
      <g>
        <WorldView id={id} st={st} f={f} cam={cam} />
        <g transform={camT(cam)}>
          <MatchField t={t} t0={b.f0} />
        </g>
        <Tag x={960} y={58} text="Receiver’s view" size={34} k={win(t, b.f0 + 0.6, b.f0 + 0.9, s.matchEnd + 1, s.matchEnd + 2)} fill={K.receiver} color="#FFFFFF" />
      </g>
    );
  }
  // ---------------------------------------------------------------- 2. the Receiver's face (reverse angle)
  if (t < s.rf1End) {
    const push = lerp(1, 1.05, pr(t, s.matchEnd, s.rf1End, (x) => x));
    return (
      <g>
        <FaceShot id={`${id}-r1`} who="R" f={f} t={t} pose={rf1Pose(t)} cx={960} gy={1616} S={3.0} push={push} front="R" leds={0} />
        <Tag x={56} y={62} anchor="start" text="Receiver" size={34} k={win(t, b.job - 0.1, b.job + 0.2, s.rf1End + 1, s.rf1End + 2)} fill={K.receiver} color="#FFFFFF" />
      </g>
    );
  }
  // ---------------------------------------------------------------- 3. behind the Receiver -> the building -> A's screen -> the Receiver's screen
  if (t < s.rf2) {
    const cam = camBuilding(t);
    const roomK = win(t, b.rooms - 0.05, b.rooms + 0.3, b.two + 0.3, b.two + 0.6);
    return (
      <g>
        <WorldView id={id} st={st} f={f} cam={cam} />
        <Tag x={56} y={62} anchor="start" text="BrainNet · 2019" size={34} k={win(t, s.ots + 0.1, s.ots + 0.4, b.rooms - 0.4, b.rooms - 0.1)} />
        <WTag cam={cam} p={{x: HEAD.x - 250, y: HEAD.y - 170}} text="Receiver" k={win(t, b.three - 0.05, b.three + 0.3, b.two + 0.3, b.two + 0.6)} fill={K.receiver} color="#FFFFFF" />
        <WTag cam={cam} p={{x: 430, y: 175}} text="Sender A" k={roomK} fill={K.senderA} color="#FFFFFF" />
        <WTag cam={cam} p={{x: 430, y: 1275}} text="Sender B" k={roomK} fill={K.senderB} color="#FFFFFF" />
        <WTag cam={cam} p={{x: TOWER.x + 250, y: TOWER.y - 160}} text="lab computer" size={30} k={win(t, b.falling - 0.1, b.falling + 0.2, b.rooms - 0.3, b.rooms)} />
        <Tag x={960} y={58} text="Sender’s view" size={34} k={win(t, s.aMed + 0.3, s.aMed + 0.6, s.swap1 - 0.05, s.swap1)} fill={K.senderA} color="#FFFFFF" />
        <Tag x={960} y={58} text="Receiver’s view" size={34} k={win(t, s.swap1, s.swap1 + 0.25, b.decide + 0.3, b.decide + 0.6)} fill={K.receiver} color="#FFFFFF" />
        <Tag x={960} y={58} text="Rotate it?" size={40} k={win(t, b.decide + 0.4, b.decide + 0.7, s.rf2 + 1, s.rf2 + 2)} />
      </g>
    );
  }
  // ---------------------------------------------------------------- 4. the Receiver's face: either answer
  if (t < s.sa1) {
    const push = lerp(1.0, 1.04, pr(t, s.rf2, s.sa1, (x) => x));
    return <FaceShot id={`${id}-r2`} who="R" f={f} t={t} pose={rf2Pose(t)} cx={960} gy={1809} S={3.6} push={push} leds={st.leds.R} hx={60} />;
  }
  // ---------------------------------------------------------------- 5. Sender A votes YES
  if (t < s.sb1) {
    const chip = t >= a1.leave ? {u: chipU(t, a1.leave), k: clamp((t - a1.leave) / 0.12), text: 'YES', color: K.senderA} : undefined;
    const push = lerp(1.0, 1.06, pr(t, s.sa1, s.sb1, (x) => x));
    return (
      <g>
        <FaceShot id={`${id}-sa`} who="A" f={f} t={t} pose={senderPose(t, s.sa1, a1.leave - 0.4, -1)} cx={900} gy={1670} S={3.2} push={push} leds={st.leds.A} capGlow={st.cap.A} chip={chip} />
        <SenderTag who="A" k={win(t, s.sa1 + 0.05, s.sa1 + 0.3, s.sb1 + 1, s.sb1 + 2)} />
      </g>
    );
  }
  // ---------------------------------------------------------------- 6. Sender B: a moment on NO, then YES
  if (t < s.hub1) {
    const chip = t >= b1.leave ? {u: chipU(t, b1.leave), k: clamp((t - b1.leave) / 0.12), text: 'YES', color: K.senderB} : undefined;
    const push = lerp(1.0, 1.05, pr(t, s.sb1, s.hub1, (x) => x));
    return (
      <g>
        <FaceShot id={`${id}-sb`} who="B" f={f} t={t} pose={senderPose(t, s.sb1, s.sb1 + 0.3, -1, true)} cx={1010} gy={1802} S={3.5} push={push} leds={st.leds.B} capGlow={st.cap.B} chip={chip} />
        <SenderTag who="B" k={win(t, s.sb1 + 0.05, s.sb1 + 0.3, s.hub1 + 1, s.hub1 + 2)} />
      </g>
    );
  }
  // ---------------------------------------------------------------- 7. the lab computer, the coil, the flashes
  if (t < s.rf3) {
    const cam = camW2(t);
    const h = headW2(t);
    const pov = pr(t, s.in1[1] - 0.3, s.in1[1]) * (1 - pr(t, s.out1[0], s.out1[0] + 0.45)) + pr(t, s.in2[1] - 0.3, s.in2[1]);
    const arc2 = s.in2[1] + 0.05;
    const arc = Math.max(win(t, b.flash - 0.02, b.flash + 0.1, b.flash + 0.45, b.flash + 0.9), win(t, arc2, arc2 + 0.12, arc2 + 0.45, arc2 + 0.9));
    const vcK = win(t, b.over + 0.55, b.over + 0.85, b.little - 1.0, b.little - 0.7);
    const vc = {x: HEAD.x - 0.42 * HEAD.r, y: HEAD.y + 0.5 * HEAD.r};
    const vcTag = {x: HEAD.x - 380, y: HEAD.y - 60};
    return (
      <g>
        <WorldView id={id} st={st} f={f} cam={cam} head={{d: h.d, ref: CAMS.HEADBACK2, op: h.op}} />
        {vcK > 0 && (
          <g transform={camT(cam)} opacity={clamp(vcK * 1.4)}>
            <path d={`M${vcTag.x + 60},${vcTag.y + 22} Q${vcTag.x + 70},${vc.y} ${vc.x - 45},${vc.y}`} fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />
          </g>
        )}
        <WTag cam={cam} p={vcTag} text="visual cortex" size={34} k={vcK} />
        <WTag cam={cam} p={{x: HANDLE_END.x - 20, y: COIL.y - 120}} text="coil" size={34} k={win(t, b.coil + 0.45, b.coil + 0.75, b.back + 0.9, b.back + 1.2)} />
        <WTag cam={cam} p={{x: TOWER.x + 400, y: TOWER.y - 120}} text="lab computer" size={30} k={win(t, s.hub1 + 0.05, s.hub1 + 0.3, s.hub1 + 0.9, s.hub1 + 1.1)} />
        <POVVignette id={id} k={pov} />
        <SoftArc x={960} y={318} w={760} k={arc} />
        <Tag x={960} y={58} text="Receiver’s view" size={34} k={win(t, s.in1[1] - 0.1, s.in1[1] + 0.2, b.meantRot - 0.3, b.meantRot - 0.05)} fill={K.receiver} color="#FFFFFF" />
        <Tag x={960} y={58} text="flash = rotate" size={40} k={win(t, b.meantRot - 0.05, b.meantRot + 0.25, b.noFlash - 0.25, b.noFlash)} />
        <Tag x={960} y={58} text="no flash = leave it" size={40} k={win(t, b.noFlash + 0.05, b.noFlash + 0.35, s.out1[0] - 0.1, s.out1[0] + 0.2)} />
        <Tag x={960} y={58} text="Sender B’s vote" size={34} k={win(t, s.out1[1] - 0.1, s.out1[1] + 0.15, s.in2[1] + 0.6, s.in2[1] + 0.9)} fill={K.senderB} color="#FFFFFF" />
      </g>
    );
  }
  // ---------------------------------------------------------------- 8. the Receiver decides
  if (t < s.rmon3) {
    const push = lerp(1.0, 1.05, pr(t, s.rf3, s.rmon3, (x) => x));
    return <FaceShot id={`${id}-r3`} who="R" f={f} t={t} pose={rf3Pose(t)} cx={960} gy={2494} S={5.2} push={push} leds={st.leds.R} hx={40} coil
      light={{col: '#FFF4CF', k: 0.45 * (1 - pr(t, s.rf3, s.rf3 + 0.45))}} />;
  }
  // ---------------------------------------------------------------- 9. the block turns; round 2 on the whole floor; the line clears
  {
    const cam = camW3(t);
    const wide = win(t, s.pull2[0] + 0.5, s.pull2[1], s.push2[0] + 0.2, s.push2[0] + 0.6);
    const a2 = vs[2], b2 = vs[3];
    return (
      <g>
        <WorldView id={id} st={st} f={f} cam={cam} pillars={false} />
        <Tag x={960} y={58} text="Round 2" size={36} k={win(t, s.pull2[0] + 0.4, s.pull2[0] + 0.7, s.push2[0] + 0.1, s.push2[0] + 0.4)} />
        <WTag cam={cam} p={{x: 430, y: 160}} text="NO" k={wide * win(t, a2.leave - 0.4, a2.leave - 0.15, a2.leave + 0.5, a2.leave + 0.8)} fill={K.senderA} color="#FFFFFF" />
        <WTag cam={cam} p={{x: 430, y: 1260}} text="NO" k={wide * win(t, b2.leave - 0.4, b2.leave - 0.15, b2.leave + 0.5, b2.leave + 0.8)} fill={K.senderB} color="#FFFFFF" />
        <WTag cam={cam} p={{x: STIM.x + STIM.w / 2, y: STIM.y - 120}} text="no pulse" size={34} k={win(t, a2.stim - 0.1, a2.stim + 0.15, s.push2[0] + 0.15, s.push2[0] + 0.4)} />
        <Tag x={960} y={58} text="Receiver’s view" size={34} k={win(t, s.push2[1] - 0.2, s.push2[1] + 0.1, b.g0 + 5, b.g0 + 6)} fill={K.receiver} color="#FFFFFF" />
      </g>
    );
  }
};

export const CUES_VF = (): {t: number; kind: string; gain?: number; dur?: number}[] => {
  const b = FB();
  const s = SH(b);
  const vs = fgVotes(b).filter((v) => v.leave < b.g0);
  const out: {t: number; kind: string; gain?: number}[] = [
    {t: b.recv - 0.3, kind: 'rotate', gain: -12},
    {t: s.ots + 0.1, kind: 'whoosh', gain: -14},
    {t: s.swap1, kind: 'tick', gain: -10},
    {t: b.decide + 0.4, kind: 'rotate', gain: -12},
    {t: b.coil + 0.4, kind: 'tick', gain: -8},
    {t: s.rmon3 + 0.12, kind: 'rotate', gain: -4},
    {t: s.pull2[0] + 0.1, kind: 'whoosh', gain: -16},
    {t: s.push2[1] - 0.2, kind: 'line_clear', gain: -3},
  ];
  for (const v of vs) out.push({t: v.leave, kind: 'vote', gain: -5});
  for (const v of vs) out.push({t: v.hub, kind: 'packet_arrive', gain: -12});
  for (const p of pulseTimes(b)) if (p < b.g0) out.push({t: p, kind: 'coil_pulse'});
  out.push({t: b.flash, kind: 'flash', gain: -2});
  out.push({t: s.in2[1] + 0.05, kind: 'flash', gain: -2});
  return out.sort((x, y) => x.t - y.t);
};
