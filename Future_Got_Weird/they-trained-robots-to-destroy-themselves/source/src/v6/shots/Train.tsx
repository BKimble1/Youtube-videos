// V5 TRAIN ("Now the hard part" → "…well-rehearsed reflex"). How this kind of training generally works, as one
// continuous teaching stage in the foundry's own geography. Every frame here is a conceptual illustration of the
// general method, not Figure's simulator or its data (one small corner label says so for the whole explanation).
//   E   through the monitor to the edge; a practice arc reaches the steel and burns away (no rehearsal possible)
//   B   lights out; the set rebuilds itself as a simulation, top to bottom, with the avatar standing where the robot was
//   1   attempt 1: the push-off foot slips (skid mark), short landing, stumble; the score card fills at the events
//   ?   the three questions light the matching row and the matching evidence (skid, landing spot, the stumble)
//   2   the controls are nudged (knees and hips light); attempt 2 lands near the target; attempt 3 on it
//   ∥   the frame shrinks into one panel of a grid; borders say landed (teal) or fell (coral); more teal over time
//   ★   one landed panel opens to full frame; the stunt performer's leap matches it pose for pose
//   P   side view: POLICY box, sensing in, motor commands out; a raised plate, the foot lands early, the signal goes
//       up, the command comes down, knee and ankle bend, the tip is caught (one slowed demonstration)
//   R   the knee reflex, twice; push in on the foot for the sim → real transfer
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {T} from '../cues';
import {Cam, Scene, Layer, Bot, Crew, Chip, mixCam, seg, smooth, easeInOut, easeOut, easeIn, backOut, lerp, toScreen, crewReach, rnd} from '../../v4/kit/scene';
import {FoundryView5, FD} from '../sets/foundry5';
import {StageBack, Tower, Pad, Arc, TGT_X} from '../../v4/sets/stage';
import {FilmLight} from '../../v4/sets/props';
import {rig, RPose, Robot2D} from '../../v4/rig/Robot2D';
import {stand, blend, A} from '../../v4/rig/poses';
import {makeJump5, J5, J5Outcome} from '../rig/jump5';
import {smoothCam, creep} from '../kit/cam5';
import {S_HK} from './Hook';
import {POST_END, CAM_FEED, POST_ROBOT} from './Post';
import {CAST} from '../../components/cast';
import {IDLE} from '../../components/Character';
import {C, F} from '../../theme';

export const TRAIN_START = POST_END;
export const TRAIN_END = T('But a simulator') - 0.1;
const S = S_HK;
const DECK = FD.deck.top, SURF = FD.ladle.surf, TOE_X = FD.deck.edge - 4;

// ------------------------------------------------------------------ cues
const T_HARD = T('Now the hard part');
const T_REH = T('can’t rehearse');
const T_FURN = T('real furnace');
const T_SIMS = T('So Figure says it trained');
const T_HOW = T('Here’s how that kind');
const T_TRIES = T('tries the jump');
const T_SCORE = T('gets a score');
const T_BAL = T('Did it stay');
const T_PUSH = T('Push off cleanly');
const T_LAND = T('Land on target');
const T_NUDGE = T('The software nudges');
const T_AGAIN = T('tries again');
const T_OVER = T('over and over');
const T_COPIES = T('in many virtual copies');
const T_FALL = T('Virtual robots can fall');
const T_NOBODY = T('nobody files');
const T_STUNT = T('Figure says it used');
const T_GUIDE = T('style guide');
const T_POLICY = T('The result is called');
const T_POL = T('a policy');
const T_SENSES = T('the robot senses');
const T_MOTOR = T('into motor commands');
const T_IF = T('If a foot lands');
const T_EARLY = T('a little early');
const T_CATCH = T('sensors catch it');
const T_ADJ = T('adjusts the knee');
const T_TIPS = T('before the robot tips');
const T_WISH = T('Not a wish');
const T_REFLEX = T('More like a very');

// ------------------------------------------------------------------ attempts (all from the opening's ledge)
const jump = (o: Partial<J5> & {tTO: number; outcome: J5Outcome}): ReturnType<typeof makeJump5> => {
  const spec: J5 = {toeX: TOE_X, deckY: DECK, endX: TGT_X, endY: SURF, s: S, tReady: o.tTO - 0.75, tPush: o.tTO - 0.3, apex: 80 * S, depth: 1.2, swing: 1.15, ...o};
  return makeJump5(spec);
};
const A1 = jump({tTO: T_TRIES + 0.05, outcome: 'short', endX: 552, apex: 26 * S, depth: 0.8, swing: 0.6});
const SLIP0 = A1.tPush + 0.05, SLIP1 = A1.tTO;
const RW1a = T_NUDGE + 0.1, RW1b = RW1a + 0.35;             // attempt 1 rewinds to its ready stance
const A2 = jump({tTO: T_NUDGE + 1.75, outcome: 'stick', endX: TGT_X - 64, apex: 66 * S});
const RW2a = A2.tEnd + 0.55, RW2b = RW2a + 0.25;
const A3 = jump({tTO: T_AGAIN + 0.35, outcome: 'stick', endX: TGT_X + 4, apex: 82 * S});
const T_GRID0 = A3.tEnd + 0.45;                              // the frame starts to shrink into a panel
/** The avatar on the main stage (attempts 1–3). */
const EDGE_POSE: RPose = {...POST_ROBOT, neck: 10, head: 12};   // the robot looking down at the steel (edge shot)
const mainPose = (t: number): RPose => {
  // V6: the avatar settles from the edge pose into its ready stance as the sim opens out (no pop)
  if (t < T_BUILD1 + 0.7) return blend(EDGE_POSE, A1.pose(t).pose, smooth(seg(t, T_BUILD1, T_BUILD1 + 0.7)));
  if (t < RW1a) {
    const p = A1.pose(t).pose;
    if (t > SLIP0 && t < A1.tTO + 0.02 && p.footN) {
      // the push-off foot slips back along the deck (a visible reason for the weak jump)
      const u = smooth(seg(t, SLIP0, SLIP1));
      return {...p, footN: {...p.footN, x: p.footN.x - 46 * S * u, pitch: (p.footN.pitch ?? 0) * (1 - u)}};
    }
    return p;
  }
  if (t < RW1b) return A1.pose(lerp(RW1a, A1.tReady, easeInOut(seg(t, RW1a, RW1b)))).pose;
  if (t < RW2a) return A2.pose(Math.max(t, A2.tReady)).pose;
  if (t < RW2b) return A2.pose(lerp(RW2a, A2.tReady, easeInOut(seg(t, RW2a, RW2b)))).pose;
  return A3.pose(Math.max(t, A3.tReady)).pose;
};

// ------------------------------------------------------------------ cameras
const CAM_FOOT: Cam = {x: 330, y: 540, z: 3.4};
const CAM_ARC: Cam = {x: 570, y: 570, z: 1.42};
export const CAM_TR: Cam = {x: 560, y: 572, z: 1.3};
// V6: through the monitor → back out just enough for the practice arc → push in on the launch foot, where the set
// turns into the simulation; the sim then opens out from that same detail (no wide reset before the rebuild)
const T_DARK0 = T_SIMS + 0.22, T_DARK1 = T_DARK0 + 0.3, T_BUILD1 = T_DARK1 + 0.75;
const edgeCamRaw = (t: number): Cam => {
  let c = mixCam(CAM_FEED, CAM_ARC, easeInOut(seg(t, T_HARD + 0.15, T_REH + 0.25)));
  c = mixCam(c, CAM_FOOT, easeInOut(seg(t, T_FURN + 0.45, T_SIMS + 0.4)));
  return c;
};

/** Stage camera during the attempts: open out from the foot, lean in on the evidence while the questions are asked,
 * back out for 2 and 3. */
const stageCamRaw = (t: number): Cam => {
  let c = mixCam(CAM_FOOT, CAM_TR, easeInOut(seg(t, T_BUILD1 + 0.1, T_HOW + 0.1)));
  c = mixCam(c, {x: 520, y: 640, z: 1.5}, easeInOut(seg(t, T_BAL - 0.4, T_BAL + 0.4)));
  c = creep(c, t, T_BAL + 0.4, T_NUDGE - 0.2, 0.04, -20);   // while the questions are asked
  c = mixCam(c, CAM_TR, easeInOut(seg(t, T_NUDGE - 0.2, T_NUDGE + 0.8)));
  c = mixCam(c, {...CAM_TR, x: CAM_TR.x + 40, z: CAM_TR.z * 1.05}, easeInOut(seg(t, A3.tReady, A3.tEnd)));
  return c;
};

// ------------------------------------------------------------------ overlays
/** Score card: rows fill at the attempt's own events (takeoff → push-off, landing → target, settle → balance). */
type Att = {J: ReturnType<typeof makeJump5>; ok: [boolean, boolean, boolean]; score: number};
const ATT: Att[] = [
  {J: A1, ok: [false, false, false], score: 0.12},
  {J: A2, ok: [true, true, false], score: 0.64},
  {J: A3, ok: [true, true, true], score: 0.94},
];
const attemptAt = (t: number) => (t < RW1b ? 0 : t < RW2b ? 1 : 2);
const ScoreCard: React.FC<{t: number}> = ({t}) => {
  const k = seg(t, A1.tTO - 0.25, A1.tTO + 0.05) * (1 - seg(t, T_GRID0 - 0.1, T_GRID0 + 0.2));
  if (k <= 0) return null;
  const i = attemptAt(t);
  const a = ATT[i];
  const ev = [a.J.tTO, a.J.tEnd + 0.02, a.J.tEnd + 0.5];
  const labels = ['balanced', 'push-off', 'on target'];
  const order = [2, 0, 1]; // balance is judged last; rows are listed in the narration's order
  const ask = [T_BAL, T_PUSH, T_LAND];
  const fill = seg(t, a.J.tEnd + 0.5, a.J.tEnd + 0.9) * a.score;
  return (
    <div style={{position: 'absolute', right: 96, top: 64, width: 420, background: C.paper, border: `4px solid ${C.ink}`, borderRadius: 18, padding: '14px 22px 20px', opacity: Math.min(1, k * 2.5), boxShadow: '0 6px 0 rgba(0,0,0,0.2)'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
        <div style={{fontFamily: F.display, fontWeight: 700, fontSize: 42, color: C.ink}}>SCORE</div>
        <div style={{fontFamily: F.body, fontWeight: 800, fontSize: 26, color: C.inkSoft}}>try {i + 1}</div>
      </div>
      {labels.map((lab, r) => {
        const e = ev[order[r]];
        const show = t > e;
        const ok = a.ok[order[r]];
        const pop = backOut(seg(t, e, e + 0.2), 1.8);
        const hi = i === 0 ? Math.max(0, 1 - Math.abs(t - ask[r] - 0.3) / 0.6) : 0;
        return (
          <div key={lab} style={{display: 'flex', alignItems: 'center', gap: 14, marginTop: 10, background: hi > 0 ? `rgba(255,199,68,${0.45 * hi})` : undefined, borderRadius: 12, padding: '2px 6px'}}>
            <div style={{width: 46, height: 46, borderRadius: 23, border: `4px solid ${C.ink}`, background: show ? (ok ? C.teal : C.coral) : '#FFFFFF', color: '#fff', fontFamily: F.display, fontWeight: 700, fontSize: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${show ? pop : 1})`}}>{show ? (ok ? '✓' : '✗') : ''}</div>
            <div style={{fontFamily: F.body, fontWeight: 800, fontSize: 34, color: C.ink}}>{lab}</div>
          </div>
        );
      })}
      <div style={{marginTop: 16, height: 28, borderRadius: 14, border: `4px solid ${C.ink}`, background: '#FFFFFF', overflow: 'hidden'}}>
        <div style={{width: `${fill * 100}%`, height: '100%', background: fill > 0.5 ? C.teal : C.coral}} />
      </div>
    </div>
  );
};
/** The controls being nudged (under the score card). */
const Controls: React.FC<{t: number}> = ({t}) => {
  const k = seg(t, T_NUDGE + 0.2, T_NUDGE + 0.5) * (1 - seg(t, A2.tTO + 0.1, A2.tTO + 0.4));
  if (k <= 0) return null;
  const u = easeInOut(seg(t, T_NUDGE + 0.55, T_NUDGE + 1.2));
  return (
    <div style={{position: 'absolute', right: 96, top: 384, width: 420, background: C.paper, border: `4px solid ${C.ink}`, borderRadius: 18, padding: '14px 22px', opacity: Math.min(1, k * 2.5)}}>
      {[0, 1].map((r) => (
        <div key={r} style={{position: 'relative', height: 44, marginTop: r ? 10 : 0}}>
          <div style={{position: 'absolute', left: 0, right: 0, top: 18, height: 10, borderRadius: 5, background: `linear-gradient(90deg, ${C.coralLight}, ${C.tealLight})`, border: `3px solid ${C.ink}`}} />
          <div style={{position: 'absolute', left: `calc(${lerp(r ? 30 : 22, r ? 70 : 78, u)}% - 20px)`, top: 2, width: 40, height: 40, borderRadius: 20, background: u > 0.5 ? C.teal : C.coral, border: `4px solid ${C.ink}`}} />
        </div>
      ))}
    </div>
  );
};

// ------------------------------------------------------------------ a crew member sets the target (people build the target)
const TOSS = T_HOW + 0.55;
const tgtK = (t: number) => (t < TOSS + 0.5 ? 0 : backOut(seg(t, TOSS + 0.5, TOSS + 0.8), 1.8));
const TargetToss: React.FC<{t: number; lw: number; f: number; cam: Cam}> = ({t, lw, f}) => {
  const inK = easeOut(seg(t, T_HOW - 0.6, T_HOW)) * (1 - easeIn(seg(t, TOSS + 1.6, TOSS + 2.3)));
  if (inK <= 0.01) return null;
  const ca = {x: lerp(1800, 1240, inK), y: FD.floor, h: 400, flip: true};
  const sw = Math.sin(Math.PI * seg(t, TOSS - 0.35, TOSS + 0.15));
  const armA = {a: lerp(20, 140, sw), b: lerp(24, -10, sw)};
  const fly = t > TOSS && t < TOSS + 0.5 ? seg(t, TOSS, TOSS + 0.5) : -1;
  return (
    <g>
      <Crew look={CAST.clerkA} x={ca.x} y={ca.y} h={ca.h} flip frame={f} seed={3} front="R" life={0.5}
        holdR={t < TOSS ? <g transform="scale(0.6)"><ellipse rx={92} ry={30} fill="#FFFFFF" stroke={C.teal} strokeWidth={16} /><ellipse rx={40} ry={13} fill="none" stroke={C.teal} strokeWidth={12} /></g> : null}
        pose={{...IDLE, armR: armA, armL: {a: 14, b: 18}, lookX: 0.8, lookY: 0.2, mouth: t > TOSS + 0.6 ? 'grin' : 'smile', brows: 0.2}} />
      {fly >= 0 ? (
        <g transform={`translate(${lerp(1150, TGT_X, fly)} ${lerp(FD.floor - 330, SURF, fly) - Math.sin(Math.PI * fly) * 160}) scale(${lerp(0.55, 1, fly)})`}>
          <ellipse rx={92} ry={30} fill="#FFFFFF" stroke={C.teal} strokeWidth={lw * 4} />
          <ellipse rx={40} ry={13} fill="none" stroke={C.teal} strokeWidth={lw * 3} />
        </g>
      ) : null}
    </g>
  );
};

// ------------------------------------------------------------------ the stage world (main)
const StageWorld: React.FC<{t: number; cam: Cam; f: number}> = ({t, cam, f}) => {
  const lw = 4 / cam.z;
  const p = mainPose(t);
  const i = attemptAt(t);
  const a = ATT[i].J;
  // evidence highlights for the three questions (attempt 1)
  const hiPush = i === 0 ? Math.max(0, 1 - Math.abs(t - T_PUSH - 0.3) / 0.6) : 0;
  const hiLand = i === 0 ? Math.max(0, 1 - Math.abs(t - T_LAND - 0.3) / 0.6) : 0;
  const hiBal = i === 0 ? Math.max(0, 1 - Math.abs(t - T_BAL - 0.3) / 0.6) : 0;
  const skid = t > SLIP0 && t < RW1b ? seg(t, SLIP0, SLIP1) * (1 - seg(t, RW1a, RW1b)) : 0;
  const land1 = t > A1.tEnd && t < RW1b ? 1 - seg(t, RW1a, RW1b) : 0;
  const arcK = t < RW1a ? seg(t, A1.tTO, A1.tEnd) : 0;
  const nudge = Math.sin(Math.PI * seg(t, T_NUDGE + 0.5, T_NUDGE + 1.3));
  const pulse = Math.max(0, 1 - Math.abs(t - A3.tEnd - 0.12) / 0.4) + 0.6 * Math.max(0, 1 - Math.abs(t - A2.tEnd - 0.12) / 0.4);
  return (
    <g>
      <StageBack lw={lw} grid={0.4} />
      <Arc pts={A1.arc()} k={arcK * (1 - seg(t, RW1a, RW1b))} lw={lw} color={C.coral} />
      <Arc pts={a.arc()} k={i > 0 ? seg(t, a.tTO, a.tEnd) * (1 - seg(t, a.tEnd + 0.4, a.tEnd + 0.8)) : 0} lw={lw} color={C.teal} />
      <Tower lw={lw} />
      {skid > 0 ? <rect x={TOE_X - 50 * S - 46 * S * skid} y={DECK - 18} width={46 * S * skid + 20} height={6} rx={3} fill={C.coral} opacity={0.9} /> : null}
      {hiPush > 0 ? <circle cx={TOE_X - 50 * S} cy={DECK - 12} r={34 + 20 * hiPush} fill="none" stroke={C.saffron} strokeWidth={lw * 3} opacity={hiPush} /> : null}
      <Pad lw={lw} pulse={Math.min(1, pulse)} tk={tgtK(t)} />
      <TargetToss t={t} lw={lw} f={f} cam={cam} />
      {land1 > 0 ? <ellipse cx={A1.p1.x} cy={SURF + 2} rx={30} ry={8} fill={C.coral} opacity={0.9 * land1} /> : null}
      {hiLand > 0 ? <ellipse cx={A1.p1.x} cy={SURF + 2} rx={60 + 30 * hiLand} ry={(60 + 30 * hiLand) * 0.19} fill="none" stroke={C.saffron} strokeWidth={lw * 3} opacity={hiLand} /> : null}
      <Bot cam={cam} id="trA" model="SIM" s={S} pose={p}
        hl={{kneeN: {color: C.teal, amount: nudge}, hipN: {color: C.teal, amount: nudge}, kneeF: {color: C.teal, amount: nudge * 0.7}, torso: {color: C.saffron, amount: hiBal * 0.8}}} />
      {void f}
    </g>
  );
};

// ------------------------------------------------------------------ style guide: pose match with a performer
const SG_TO = T_GUIDE - 0.55;
const SG = jump({tTO: SG_TO, outcome: 'stick', endX: TGT_X, apex: 86 * S});
const SPLIT0 = T_STUNT + 0.35, SPLIT1 = SPLIT0 + 0.5;
const CAM_SG: Cam = {x: 520, y: 600, z: 1.08};

// ------------------------------------------------------------------ the grid of copies
const COLS = 4, ROWS = 3, MAIN = {c: 1, r: 1};
const CELL = {x0: -240, y0: 60, w: 1740, h: 980};
const CAM_ST: Cam = {x: CELL.x0 + CELL.w / 2, y: CELL.y0 + CELL.h / 2, z: 1080 / CELL.h};
const GAP = 150;
const GRID_W = COLS * CELL.w + (COLS - 1) * GAP, GRID_H = ROWS * CELL.h + (ROWS - 1) * GAP;
const cellOff = (c: number, r: number) => ({dx: (c - MAIN.c) * (CELL.w + GAP), dy: (r - MAIN.r) * (CELL.h + GAP)});
const CAM_GRID: Cam = (() => {
  const o0 = cellOff(0, 0);
  const cx = CELL.x0 + o0.dx + GRID_W / 2, cy = CELL.y0 + o0.dy + GRID_H / 2;
  return {x: cx, y: cy - 60, z: Math.min(1920 / (GRID_W + 300), 1080 / (GRID_H + 380))};
})();
const PER = 1.9;
/** Outcome of loop n in cell k: success probability rises over the section ("over and over"). */
const cellTrial = (k: number, t: number) => {
  const tl0 = t + rnd(k * 7 + 1) * PER;
  const n = Math.floor(tl0 / PER), tl = tl0 - n * PER;
  const prog = seg(t, T_COPIES, T_STUNT);
  const pOK = lerp(0.3, 0.92, prog);
  const r = rnd(k * 131 + n * 17 + 5);
  const ok = r < pOK;
  const out: J5Outcome = ok ? 'stick' : rnd(k * 19 + n) < 0.55 ? 'faceplant' : 'short';
  return {tl, ok, out, n};
};
const CELL_JUMPS: Record<string, ReturnType<typeof makeJump5>> = {};
const cellJump = (out: J5Outcome, v: number) => {
  const key = out + ':' + v;
  if (!CELL_JUMPS[key]) {
    CELL_JUMPS[key] = out === 'stick' ? makeJump5({toeX: TOE_X, deckY: DECK, endX: TGT_X + (v - 1) * 40, endY: SURF, s: S, tReady: 0.0, tPush: 0.3, tTO: 0.6, apex: 82 * S, outcome: 'stick', depth: 1.2, swing: 1.15})
      : out === 'faceplant' ? makeJump5({toeX: TOE_X, deckY: DECK, endX: 650 + v * 40, endY: SURF, s: S, tReady: 0, tPush: 0.3, tTO: 0.6, apex: 64 * S, outcome: 'faceplant'})
        : makeJump5({toeX: TOE_X, deckY: DECK, endX: 552, endY: SURF, s: S, tReady: 0, tPush: 0.3, tTO: 0.6, apex: 22 * S, outcome: 'short', depth: 0.8, swing: 0.6});
  }
  return CELL_JUMPS[key];
};
const MiniWorld: React.FC<{k: number; t: number; cam: Cam; lw: number}> = ({k, t, cam, lw}) => {
  if (k === SELECT.r * COLS + SELECT.c && t > T_DIVE - 0.45) {
    return (
      <g>
        <StageBack lw={lw} grid={0.3} />
        <Tower lw={lw} />
        <Pad lw={lw} />
        <Bot cam={cam} id={'cell' + k} model="SIM" s={S} pose={SG.pose(t).pose} />
        <rect x={CELL.x0} y={CELL.y0} width={CELL.w} height={CELL.h} fill="none" stroke={C.teal} strokeWidth={lw * 7 * (1 - seg(t, T_DIVE, T_DIVE + 0.6))} />
      </g>
    );
  }
  const tr = cellTrial(k, t);
  const J = cellJump(tr.out, Math.floor(rnd(k * 3 + tr.n) * 3));
  const landed = tr.tl > J.tEnd + 0.1;
  const p = tr.tl < PER - 0.08 ? J.pose(tr.tl).pose : null;
  const border = landed ? (tr.ok ? C.teal : C.coral) : '#4F7CC9';
  return (
    <g>
      <StageBack lw={lw} grid={0.3} />
      <Tower lw={lw} />
      <Pad lw={lw} pulse={landed && tr.ok ? Math.max(0, 1 - (tr.tl - J.tEnd) / 0.5) : 0} />
      {p ? <Bot cam={cam} id={'cell' + k} model="SIM" s={S} pose={p} /> : null}
      <rect x={CELL.x0} y={CELL.y0} width={CELL.w} height={CELL.h} fill="none" stroke={border} strokeWidth={lw * 7} />
    </g>
  );
};
const SELECT = {c: 2, r: 0};                                 // the landed trial we follow back out to full frame
const T_DIVE = T_STUNT - 0.55;


// ------------------------------------------------------------------ policy (side view, on the pad where the avatar landed)
const SG_END = SG.pose(SG.tEnd + 1.2).pose;
const sideBase = (o: Partial<RPose> = {}): RPose => ({...SG_END, rot: 0, waist: 0, neck: 0, head: 0, yaw: 0.85, armN: A(4, 14, {grip: 0.3}), armF: A(-4, 16, {grip: 0.3}), ...o});
const FOOT0 = SG_END.footN!;
const CAM_POL: Cam = {x: SG_END.x + 230, y: SURF - 190, z: 2.05};
const PLATE = {x0: FOOT0.x + 44, x1: FOOT0.x + 122, h: 22};
// slowed demonstration: the event plays at half speed between DEMO0 and DEMO1
const DEMO0 = T_EARLY - 0.25, DEMO1 = T_TIPS + 0.9;
const plateUp = (t: number) => easeOut(seg(t, T_IF - 0.6, T_IF - 0.1)) * (1 - easeInOut(seg(t, T_TIPS + 1.3, T_TIPS + 1.8)));
const T_TAP1 = T_WISH + 0.55, T_TAP2 = T_REFLEX + 0.7;
const TURN0 = T_POLICY + 0.45, TURN1 = TURN0 + 0.6;
const sidePose = (t: number): RPose => {
  if (t < TURN1) return blend(SG.pose(t).pose, sideBase(), smooth(seg(t, TURN0, TURN1)));
  const p = sideBase();
  const base = p.footN!;
  // step onto the raised plate: lands early (the plate is higher than the step expects)
  const lift = smooth(seg(t, T_IF + 0.1, T_EARLY));
  const back = easeInOut(seg(t, T_TIPS + 0.9, T_TIPS + 1.6));
  const stepX = PLATE.x0 + 32;
  const top = SURF - PLATE.h * plateUp(t) - 31 * S;
  const air = Math.sin(Math.PI * lift) * 30;
  let fx = lerp(base.x, stepX, lift), fy = lerp(base.y, top, lift) - air;
  if (t >= T_EARLY) { fx = stepX; fy = top; }
  fx = lerp(fx, base.x, back); fy = lerp(fy, base.y, back);
  p.footN = {x: fx, y: fy, pitch: -8 * lift * (1 - back)};
  p.x += 28 * lift * (1 - back);
  // early contact starts a forward tip; the command arrives; knee and ankle bend; the tip is caught
  const tip = smooth(seg(t, T_EARLY, T_ADJ + 0.2)) * (1 - smooth(seg(t, T_ADJ + 0.25, T_TIPS + 0.5)));
  const bend = Math.sin(Math.PI * seg(t, T_ADJ, T_TIPS + 0.9));
  p.rot += 9 * tip;
  p.waist += 5 * tip - 4 * bend;
  p.y += 22 * bend * (1 - back);
  p.armN = A(4 + 26 * tip, 14 + 20 * tip, {grip: 0.3});
  // reflex: tap below the knee → the lower leg kicks forward and returns (twice)
  const kick = Math.max(Math.sin(Math.PI * seg(t, T_TAP1 + 0.03, T_TAP1 + 0.42)), Math.sin(Math.PI * seg(t, T_TAP2 + 0.03, T_TAP2 + 0.42)));
  if (kick > 0) {
    const kn = rig(sideBase(), S).pts.kneeN;
    const Lsh = 140 * S + 6;
    const th = (44 * kick * Math.PI) / 180;
    p.footN = {x: kn[0] + Math.sin(th) * Lsh + 12, y: kn[1] + Math.cos(th) * Lsh, pitch: 0};
  }
  return p;
};
/** Where the sim → real transfer starts (the next section continues from this pose and camera). */
export const TRAIN_END_POSE = sideBase();
export const CAM_TOFOOT: Cam = (() => {
  const r = rig(sideBase(), S);
  return {x: r.pts.ankleN[0] + 40, y: r.pts.ankleN[1] - 20, z: 4.2};
})();

const PolicyBox: React.FC<{t: number; cam: Cam; p: RPose}> = ({t, cam, p}) => {
  const k = seg(t, T_POL - 0.25, T_POL + 0.2) * (1 - seg(t, T_WISH - 0.3, T_WISH));
  if (k <= 0) return null;
  const r = rig(p, S);
  const sc = (q: number[]) => toScreen(cam, q[0], q[1]);
  const head = sc(r.pts.head);
  const box = {x: head.x + 330, y: head.y + 40, w: 300, h: 120};
  const inPts = [sc(r.pts.toeN), sc(r.pts.visor)];
  const outPts = [sc(r.pts.kneeN), sc(r.pts.ankleN)];
  const kIn = seg(t, T_SENSES - 0.3, T_SENSES + 0.2), kOut = seg(t, T_MOTOR - 0.2, T_MOTOR + 0.3);
  const demo = t > DEMO0 - 0.4 && t < DEMO1;
  const ping = seg(t, T_CATCH - 0.15, T_CATCH + 0.55);      // contact signal travels up
  const cmd = seg(t, T_ADJ - 0.25, T_ADJ + 0.35);            // command travels down
  const ph = (t - T_POL) * (demo ? 0.0 : 3.2);
  const inA = {x: box.x - box.w / 2, y: box.y + 14}, outA = {x: box.x, y: box.y + box.h / 2};
  const dot = (a: {x: number; y: number}, b: {x: number; y: number}, u: number, col: string, key: string, r0 = 11) =>
    <circle key={key} cx={lerp(a.x, b.x, u)} cy={lerp(a.y, b.y, u)} r={r0} fill={col} stroke={C.ink} strokeWidth={3} />;
  const els: React.ReactNode[] = [];
  inPts.forEach((s, i) => {
    if (kIn <= 0) return;
    const hot = demo && i === 0;
    const e = {x: lerp(s.x, inA.x, easeOut(kIn)), y: lerp(s.y, inA.y, easeOut(kIn))};
    els.push(<line key={'il' + i} x1={s.x} y1={s.y} x2={e.x} y2={e.y} stroke={hot && ping > 0 ? C.saffron : C.blue} strokeWidth={hot && ping > 0 ? 8 : 5} strokeLinecap="round" opacity={demo && !hot ? 0.35 : 1} />);
    els.push(<circle key={'ic' + i} cx={s.x} cy={s.y} r={hot ? 14 + 10 * Math.max(0, 1 - Math.abs(t - T_EARLY) / 0.4) : 11} fill={hot ? C.saffron : C.blue} stroke={C.ink} strokeWidth={3} />);
    if (kIn >= 1 && !demo) els.push(dot(s, inA, (ph + i * 0.5) % 1, C.blue, 'ip' + i));
    if (hot && ping > 0 && ping < 1) els.push(dot(s, inA, ping, C.saffron, 'ping', 15));
  });
  outPts.forEach((o, i) => {
    if (kOut <= 0) return;
    const e = {x: lerp(outA.x, o.x, easeOut(kOut)), y: lerp(outA.y, o.y, easeOut(kOut))};
    const hot = demo && cmd > 0;
    els.push(<line key={'ol' + i} x1={outA.x} y1={outA.y} x2={e.x} y2={e.y} stroke={hot ? C.saffron : C.teal} strokeWidth={hot ? 8 : 5} strokeLinecap="round" />);
    if (kOut >= 1 && !demo) els.push(dot(outA, o, (ph + 0.25 + i * 0.4) % 1, C.teal, 'op' + i));
    if (hot && cmd < 1) els.push(dot(outA, o, cmd, C.saffron, 'cmd' + i, 15));
  });
  const flash = demo ? Math.max(0, 1 - Math.abs(t - (T_CATCH + 0.6)) / 0.45) : 0;
  return (
    <g opacity={Math.min(1, k * 2.5)}>
      {els}
      <rect x={box.x - box.w / 2} y={box.y - box.h / 2} width={box.w} height={box.h} rx={22} fill={flash > 0 ? C.saffronLight : C.ink} stroke={C.ink} strokeWidth={6} />
      <text x={box.x} y={box.y + 18} textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={56} fill={flash > 0 ? C.ink : C.paper}>POLICY</text>
      {kIn > 0.5 ? <text x={inA.x - 24} y={inA.y - 70} textAnchor="end" fontFamily={F.body} fontWeight={800} fontSize={32} fill={C.blueDeep} opacity={kIn * (demo ? 0.4 : 1)}>senses</text> : null}
      {kOut > 0.5 ? <text x={outA.x + 26} y={outA.y + 90} fontFamily={F.body} fontWeight={800} fontSize={32} fill={C.tealDeep} opacity={kOut * (demo ? 0.4 : 1)}>motor commands</text> : null}
    </g>
  );
};

// reflex hammer
const hammerProp = (
  <g transform="rotate(-60)">
    <rect x={-6} y={-6} width={12} height={96} rx={5} fill="#9AA4AE" stroke={C.ink} strokeWidth={4} />
    <path d="M-44 84 Q0 70 44 84 L36 112 Q0 124 -36 112 Z" fill={C.coral} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
  </g>
);
const reportProp = (
  <g>
    <rect x={-70} y={-40} width={140} height={176} rx={10} fill="#C9924F" stroke={C.ink} strokeWidth={5} />
    <rect x={-58} y={-26} width={116} height={150} rx={6} fill="#FFFDF6" />
    <text x={0} y={4} textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={24} fill={C.ink}>INCIDENT</text>
    <text x={0} y={30} textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={24} fill={C.ink}>REPORT</text>
    {[0, 1, 2].map((i) => <rect key={i} x={-44} y={50 + i * 22} width={88} height={8} rx={4} fill="#D9DEE4" />)}
  </g>
);

// ------------------------------------------------------------------ section
export const Train: React.FC = () => {
  const f = useCurrentFrame() + Math.round(TRAIN_START * 30);
  const t = f / 30;
  const generalK = seg(t, T_HOW + 0.1, T_HOW + 0.5) * (1 - seg(t, TRAIN_END - 1.1, TRAIN_END - 0.75)); // cleared before the push to the foot
  const general = <Chip x={96} y={60} lines={['HOW THIS KIND OF TRAINING GENERALLY WORKS · ILLUSTRATION']} k={generalK} size={30} tone="ink" />;

  // ============================== E + B: the edge, the burnt practice arc, lights out, the rebuild
  if (t < T_BUILD1 + 0.01) {
    const cam = smoothCam(edgeCamRaw, t, 0.2);
    const lw = 4 / cam.z;
    const look = smooth(seg(t, T_HARD + 0.3, T_HARD + 0.9));
    const robot = {...POST_ROBOT, neck: 10 * look, head: 12 * look};
    const practice = makeJump5({toeX: TOE_X, deckY: DECK, endX: TGT_X, endY: SURF, s: S, tReady: 0, tPush: 0, tTO: 0, apex: 84 * S, outcome: 'plunge'});
    const pts = practice.arc(48);
    const draw = seg(t, T_REH - 0.05, T_FURN + 0.05);
    const burn = seg(t, T_FURN + 0.05, T_FURN + 0.85);        // burns back from the steel toward the edge
    const n = Math.round(pts.length * draw * (1 - burn));
    const head = pts[Math.max(0, Math.min(pts.length - 1, Math.round(pts.length * draw) - 1))];
    const tHiss = t - (T_FURN + 0.05);
    const dark = easeIn(seg(t, T_DARK0, T_DARK1));
    const scan = easeInOut(seg(t, T_DARK1, T_BUILD1));        // the sim builds itself top → bottom
    const scanY = lerp(-20, 1100, scan);
    const foundry = (
      <FoundryView5 cam={cam} t={t} hook={false} id="trf" hit={tHiss > 0 ? {x: TGT_X, t: tHiss * 0.6} : undefined}
        extraBack={<g><FilmLight x={-260} y={FD.deck.top} lw={lw} on={1} aim={16} id="trLA" /><FilmLight x={1440} y={FD.floor} lw={lw} on={1} aim={205} h={560} id="trLB" /></g>}
        behind={(
          <g>
            <Bot cam={cam} id="trF" model="F02" s={S} pose={robot} />
            {n > 1 ? <path d={'M' + pts.slice(Math.round(pts.length * 0), n).map((q) => `${q.x.toFixed(1)} ${q.y.toFixed(1)}`).join('L')} fill="none" stroke="#FFF4D6" strokeWidth={lw * 3} strokeDasharray={`${lw * 10} ${lw * 7}`} strokeLinecap="round" /> : null}
            {draw > 0 && draw < 1 && burn === 0 ? <circle cx={head.x} cy={head.y} r={lw * 6} fill="#FFF4D6" /> : null}
            {burn > 0 && burn < 1 ? <circle cx={pts[Math.max(0, n - 1)].x} cy={pts[Math.max(0, n - 1)].y} r={lw * (10 + 6 * Math.sin(t * 40))} fill={C.saffron} opacity={0.9} /> : null}
          </g>
        )} />
    );
    if (t < T_DARK1) {
      return (
        <Scene bg="#221A21">
          {foundry}
          {dark > 0 ? <rect width={1920} height={1080} fill="#06080C" opacity={0.86 * dark} /> : null}
        </Scene>
      );
    }
    // rebuild: above the scan line the simulation (same geography, avatar in the same pose); below, the dark set
    return (
      <Scene bg="#06080C">
        <defs>
          <clipPath id="simAbove"><rect x={0} y={-10} width={1920} height={scanY + 10} /></clipPath>
          <clipPath id="darkBelow"><rect x={0} y={scanY} width={1920} height={1100} /></clipPath>
        </defs>
        <g clipPath="url(#darkBelow)">{foundry}<rect width={1920} height={1080} fill="#06080C" opacity={0.86} /></g>
        <g clipPath="url(#simAbove)">
          <Layer cam={cam}>
            <StageBack lw={lw} grid={0.55} />
            <Tower lw={lw} />
            <Pad lw={lw} tk={0} />
            <Bot cam={cam} id="trB" model="SIM" s={S} pose={robot} />
          </Layer>
        </g>
        <rect x={0} y={scanY - 3} width={1920} height={6} fill={C.teal} />
        <rect x={0} y={scanY - 18} width={1920} height={18} fill={C.teal} opacity={0.25} />
      </Scene>
    );
  }

  // ============================== 1–3: attempts on the stage, then the grid
  if (t < T_DIVE + 0.6) {
    const shrink = easeInOut(seg(t, T_GRID0, T_GRID0 + 1.1));
    const dive = easeIn(seg(t, T_DIVE, T_DIVE + 0.6));
    const base = smoothCam(stageCamRaw, Math.min(t, T_GRID0), 0.25);
    // the grid's world: main cell at origin, others offset; the camera pulls back from the main cell to the grid
    const selCam: Cam = (() => {
      const o = cellOff(SELECT.c, SELECT.r);
      return {x: CAM_ST.x + o.dx, y: CAM_ST.y + o.dy, z: CAM_ST.z};
    })();
    let cam = mixCam(base, CAM_GRID, shrink);
    cam = mixCam(cam, selCam, dive);
    // before the grid exists, the stage camera is CAM_TR; the main cell's own camera is CAM_ST (same world framing)
    const lw = 4 / cam.z;
    const showGrid = t > T_GRID0 - 0.05;
    const crew = seg(t, T_FALL + 0.4, T_FALL + 1.0) * (1 - seg(t, T_DIVE - 0.4, T_DIVE));
    const toss = seg(t, T_NOBODY + 0.3, T_NOBODY + 1.2);
    const shrug = smooth(seg(t, T_NOBODY + 0.2, T_NOBODY + 0.55));
    return (
      <Scene bg={showGrid ? '#DCE6F4' : '#EEF4FD'}
        over={<>{general}<ScoreCard t={t} /><Controls t={t} /></>}>
        <Layer cam={cam}>
          {showGrid ? Array.from({length: COLS * ROWS}, (_, k) => {
            const c = k % COLS, r = Math.floor(k / COLS);
            if (c === MAIN.c && r === MAIN.r) return null;
            const o = cellOff(c, r);
            const pop = backOut(seg(t, T_GRID0 + 0.15 + k * 0.05, T_GRID0 + 0.5 + k * 0.05), 1.4);
            if (pop <= 0.01) return null;
            const cx = CELL.x0 + CELL.w / 2 + o.dx, cy = CELL.y0 + CELL.h / 2 + o.dy;
            return (
              <g key={k} transform={`translate(${cx} ${cy}) scale(${pop}) translate(${-cx} ${-cy})`}>
                <defs><clipPath id={'cl' + k}><rect x={CELL.x0 + o.dx} y={CELL.y0 + o.dy} width={CELL.w} height={CELL.h} /></clipPath></defs>
                <g clipPath={`url(#cl${k})`}><g transform={`translate(${o.dx} ${o.dy})`}><MiniWorld k={k} t={t} cam={{...cam, z: cam.z * pop}} lw={lw} /></g></g>
              </g>
            );
          }) : null}
          <defs><clipPath id="clMain"><rect x={CELL.x0} y={CELL.y0} width={CELL.w} height={CELL.h} /></clipPath></defs>
          <g clipPath={showGrid ? 'url(#clMain)' : undefined}>
            {t < T_GRID0 + 1.2 ? <StageWorld t={t} cam={cam} f={f} /> : <MiniWorld k={99} t={t} cam={cam} lw={lw} />}
            {showGrid ? <rect x={CELL.x0} y={CELL.y0} width={CELL.w} height={CELL.h} fill="none" stroke={C.teal} strokeWidth={lw * 7} /> : null}
          </g>
        </Layer>
        {crew > 0 ? (
          <g transform={`translate(${lerp(2300, 1560, easeOut(crew))} 0)`}>
            <Crew look={CAST.clerkB} x={0} y={1180} h={760} flip frame={f} seed={9} front="L" life={0.6}
              holdL={toss < 0.05 ? <g transform="scale(-1.1 1.1)">{reportProp}</g> : undefined}
              pose={{...IDLE, armL: {a: lerp(40, 150, shrug), b: lerp(70, -30, shrug)}, armR: {a: lerp(14, 110, shrug), b: lerp(16, -30, shrug)}, lookX: -0.6, lookY: -0.2, mouth: shrug > 0.5 ? 'smirk' : 'flat', browAsym: shrug, brows: 0.3}} />
          </g>
        ) : null}
        {toss > 0.05 && toss < 1 ? <g transform={`translate(${1460 - toss * 700} ${640 - Math.sin(Math.PI * toss) * 300 + toss * 500}) rotate(${-toss * 400}) scale(1.1)`}>{reportProp}</g> : null}
      </Scene>
    );
  }

  // ============================== ★ style guide: the selected trial at full frame, split with the performer
  if (t < T_POLICY + 0.4) {
    const split = easeInOut(seg(t, SPLIT0, SPLIT1));
    const p = SG.pose(t).pose;
    const camR = mixCam(CAM_ST, CAM_SG, easeInOut(seg(t, T_DIVE + 0.6, SPLIT1)));
    const lwR = 4 / camR.z;
    const out = easeInOut(seg(t, T_POLICY - 0.1, T_POLICY + 0.4));
    const half = 960 * split * (1 - out);                      // the avatar's window slides right, the performer's in from the left
    const match = (tt: number) => Math.max(0, 1 - Math.abs(t - tt) / 0.35);
    const keyT = [SG.tPush - 0.05, SG.tTO + 0.32, SG.tEnd + 0.05];
    return (
      <Scene bg="#EEF4FD" over={<>{general}<Chip x={96} y={958} lines={['Illustration of the general method']} k={seg(t, SPLIT1, SPLIT1 + 0.3) * (1 - out)} size={30} tone="paper" /></>}>
        <defs>
          <clipPath id="sgR"><rect x={half} y={0} width={1920 - half} height={1080} /></clipPath>
          <clipPath id="sgL"><rect x={0} y={0} width={half} height={1080} /></clipPath>
        </defs>
        <g clipPath="url(#sgR)">
          <g transform={`translate(${half / 2} 0)`}>
            <Layer cam={camR}>
              <StageBack lw={lwR} grid={0.4} />
              <Tower lw={lwR} />
              <Pad lw={lwR} pulse={Math.max(0, 1 - Math.abs(t - SG.tEnd - 0.1) / 0.4)} />
              <Arc pts={SG.arc()} k={seg(t, SG.tTO, SG.tEnd)} lw={lwR} color={C.teal} />
              <Bot cam={camR} id="sgA" model="SIM" s={S} pose={p} />
            </Layer>
          </g>
        </g>
        {split > 0 ? (
          <g clipPath="url(#sgL)">
            <g transform={`translate(${-960 + half / 2} 0)`}>
              <rect x={0} y={0} width={1920} height={1080} fill="#EFE7F7" />
              <Layer cam={camR}>
                <rect x={-3000} y={FD.floor} width={7000} height={1200} fill="#DCCFEA" />
                <rect x={FD.deck.x0} y={DECK} width={FD.deck.edge - FD.deck.x0} height={30} fill="#CDB9E6" stroke="#5B3F92" strokeWidth={lwR} />
                <rect x={FD.ladle.cx - 290} y={SURF} width={580} height={FD.floor - SURF} fill="#E3D6F2" stroke="#5B3F92" strokeWidth={lwR} />
                <Arc pts={SG.arc()} k={seg(t, SG.tTO, SG.tEnd)} lw={lwR} color="#7656C2" />
                <Robot2D id="sgP" model="PERF" s={S} pose={p} px={S * camR.z} />
              </Layer>
            </g>
            <line x1={half} y1={0} x2={half} y2={1080} stroke={C.ink} strokeWidth={8} />
          </g>
        ) : null}
        {/* the matched key poses tick on both sides */}
        {split >= 1 ? keyT.map((kt, i) => {
          const m = match(kt);
          return m > 0 ? <g key={i} transform={`translate(960 ${150}) scale(${0.5 * backOut(Math.min(1, m * 2), 1.8)})`}><circle r={62} fill={C.teal} stroke={C.ink} strokeWidth={10} /><path d="M-30 2 L-8 26 L32 -24" fill="none" stroke="#fff" strokeWidth={18} strokeLinecap="round" strokeLinejoin="round" /></g> : null;
        }) : null}
      </Scene>
    );
  }

  // ============================== P + R: the policy, the early foot, the reflex; then in on the foot
  const p = sidePose(t);
  const camRaw = (tt: number) => {
    let c = mixCam(CAM_SG, CAM_POL, easeInOut(seg(tt, T_POLICY + 0.4, T_POL + 0.7)));
    c = creep(c, tt, T_POL + 0.7, DEMO0, 0.025, 24, -18);   // the definition is spoken over a slow push
    c = mixCam(c, CAM_TOFOOT, easeInOut(seg(tt, TRAIN_END - 1.1, TRAIN_END)));
    return c;
  };
  const cam = t > TRAIN_END - 1.2 ? camRaw(t) : smoothCam(camRaw, t, 0.2);
  const lw = 4 / cam.z;
  const plate = plateUp(t);
  const sb = {x: SG_END.x - 230, y: SURF, h: 350};
  const tapK = Math.max(seg(t, T_WISH - 0.2, T_WISH + 0.3) * (1 - seg(t, TRAIN_END - 0.9, TRAIN_END - 0.4)), 0);
  const kn = rig(sideBase(), S).pts.kneeN;
  const strike = {x: kn[0] + 10, y: kn[1] + 26};
  const swing = (tt: number) => Math.sin(Math.PI * seg(t, tt - 0.35, tt + 0.1));
  const up = {a: 120, b: 40};
  const hit = crewReach(sb, 1, strike.x - 10, strike.y);
  const sw = Math.max(swing(T_TAP1), swing(T_TAP2));
  const armB = {a: lerp(lerp(20, up.a, smooth(seg(t, T_WISH, T_WISH + 0.3))), hit.a, sw), b: lerp(lerp(24, up.b, smooth(seg(t, T_WISH, T_WISH + 0.3))), hit.b, sw)};
  const sbx = lerp(sb.x - 700, sb.x, easeOut(tapK));
  return (
    <Scene bg="#EEF4FD" over={general}>
      <Layer cam={cam}>
        <StageBack lw={lw} grid={0.3} />
        <Tower lw={lw} />
        <Pad lw={lw} />
        {plate > 0.01 ? (
          <g transform={`translate(0 ${(1 - plate) * PLATE.h})`}>
            <rect x={PLATE.x0} y={SURF - PLATE.h} width={PLATE.x1 - PLATE.x0} height={PLATE.h} rx={4} fill={C.saffron} stroke="#2C4A80" strokeWidth={lw} />
          </g>
        ) : null}
        <Bot cam={cam} id="trP" model="SIM" s={S} pose={p}
          hl={{footN: {color: C.saffron, amount: Math.max(0, 1 - Math.abs(t - T_EARLY - 0.1) / 0.5)}, kneeN: {color: C.teal, amount: Math.sin(Math.PI * seg(t, T_ADJ, T_TIPS + 0.8))}, ankleN: {color: C.teal, amount: Math.sin(Math.PI * seg(t, T_ADJ, T_TIPS + 0.8))}}} />
        {tapK > 0.01 ? <Crew look={CAST.clerkB} x={sbx} y={sb.y} h={sb.h} frame={f} seed={9} front="R" holdR={hammerProp} life={0.5}
          pose={{...IDLE, armR: armB, armL: {a: 14, b: 16}, lookX: 0.8, lookY: 0.4, mouth: t > T_TAP1 + 0.1 ? 'grin' : 'smile', brows: 0.4}} /> : null}
      </Layer>
      <PolicyBox t={t} cam={cam} p={p} />
    </Scene>
  );
};
void easeIn; void Robot2D; void DEMO0; void DEMO1;
/** Event times for the sound cue sheet. */
export const TRAIN_EV = {A1, A2, A3, SG, T_GRID0, RW1a, RW1b, TOSS, SPLIT0, T_DIVE, DEMO0, DEMO1, T_TAP1, T_TAP2, SLIP0, PER};
