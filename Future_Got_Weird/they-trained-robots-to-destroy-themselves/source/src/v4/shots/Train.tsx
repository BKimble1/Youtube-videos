// V4 TRAIN (94.3 → 150.5): how this kind of training generally works, on one designed teaching stage.
//   T0  low at the edge: you can't rehearse this (the practice arc is drawn, then crossed out)
//   T1  a paper roll turns the foundry into the stage (same pose, same place): the robot is now a training avatar
//   T2  a crew member tosses the target onto the pad; attempt 1 lands short and is scored on three questions
//   T3  the attempt rewinds; the crew turns the push dial (the launch arrow changes); attempt 2 lands on target
//   T4  over and over: the frame becomes one tile in a grid of copies, all jumping
//   T5  back in one tile: a faceplant; the incident report is not needed
//   T6  Figure says: stunt performers as a style guide — the avatar's jump follows the reference card
//   T7  the policy: senses → learned rule → motor commands, pulsing many times a second
//   T8  a plate rises; the foot lands early; the sensor catches it; knee and ankle adjust before the robot tips
//   T9  not a wish, not a plan: a reflex — then the side view the transfer section starts from
// Every frame is a conceptual illustration of the general method, not Figure's simulator or its data.
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {T} from '../../v3/cues';
import {Cam, Scene, Layer, Bot, Crew, Chip, Tag, mixCam, seg, smooth, easeInOut, easeOut, easeIn, backOut, lerp, toScreen, crewReach, rnd} from '../kit/scene';
import {RollWipe} from '../kit/roll';
import {FoundryView, StageView, FD} from '../sets/views';
import {StageBack, Tower, Pad, Arc, TGT_X} from '../sets/stage';
import {Mark, FilmSetLights} from '../sets/props';
import {makeJump} from '../rig/jump';
import {rig, RPose, Robot2D} from '../rig/Robot2D';
import {stand, blend, A} from '../rig/poses';
import {FILM_END, TRAIN_C0, CraneChain} from './Film';
import {REAL_START, SIDE_X, CAM_SIDE, sidePose} from './Real';
import {S_OPEN, TOE_X} from './Opening';
import {CAST} from '../../components/cast';
import {IDLE} from '../../components/Character';
import {C, F} from '../../theme';

export const TRAIN_START = FILM_END;
export const TRAIN_END = REAL_START;
const S = S_OPEN;
const DECK = FD.deck.top, SURF = FD.ladle.surf;
const ROBOT_T = stand(250, DECK, S, {yaw: 0.8, armN: A(4, 12, {grip: 0.3}), armF: A(-4, 14, {grip: 0.3})});

// ---------------------------------------------------------------- cues
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
const T_FACES = T('on their faces');
const T_NOBODY = T('nobody files');
const T_STUNT = T('Figure says it used');
const T_REF = T('as a reference');
const T_GUIDE = T('style guide');
const T_POLICY = T('The result is called');
const T_POL = T('a policy');
const T_SENSES = T('the robot senses');
const T_MOTOR = T('into motor commands');
const T_MANY = T('many times a second');
const T_IF = T('If a foot lands');
const T_EARLY = T('a little early');
const T_CATCH = T('sensors catch it');
const T_ADJ = T('adjusts the knee');
const T_TIPS = T('before the robot tips');
const T_WISH = T('Not a wish');
const T_PLAN = T('not a plan');
const T_REFLEX = T('More like a very');
const T_WIPE = T_SIMS + 0.1;

// ---------------------------------------------------------------- cameras
const cLow2: Cam = {x: 320, y: 400, z: 2.15, rot: -4};
const cPract: Cam = {x: 600, y: 470, z: 1.15};
const CELL = {x0: -240, y0: 60, w: 1740, h: 980};
const CAM_ST: Cam = {x: CELL.x0 + CELL.w / 2, y: CELL.y0 + CELL.h / 2, z: 1080 / CELL.h};
const GAP = 160;
const CAM_GRID: Cam = {x: CAM_ST.x, y: CAM_ST.y, z: 0.2};

// ---------------------------------------------------------------- jumps (all from the opening's ledge, same scale)
type JS = {J: ReturnType<typeof makeJump>; tPush: number; tEnd: number};
const jump = (tPush: number, outcome: 'stick' | 'short' | 'faceplant', endX = TGT_X, apex = 90 * S, landX?: number): JS => {
  const tEnd = tPush + 0.38 + (outcome === 'short' ? 0.75 : 0.9);
  return {J: makeJump({toeX: TOE_X, deckY: DECK, endX, endY: SURF, s: S, tPush, tTO: tPush + 0.38, tEnd, apex, outcome, landX}), tPush, tEnd};
};
const A1 = jump(T_TRIES - 0.25, 'short', 600, 55 * S, 590);
const A2 = jump(T_AGAIN - 0.1, 'stick');
const A3 = jump(T_OVER + 0.85, 'stick');
const FP = jump(T_FACES - 1.33, 'faceplant', 700, 70 * S, 700);
const SG = jump(T_GUIDE - 0.55, 'stick');
const K0 = A1.J.K0;
const rew = (j: JS, a: number, b: number, tau: number, hold = 0.9) => j.J.pose(lerp(j.tEnd + hold, j.tPush - 0.01, easeInOut(seg(tau, a, b)))).pose;
const REW = {a1: [T_NUDGE + 0.15, T_NUDGE + 1.0], a2: [T_OVER + 0.3, T_OVER + 0.75], a3: [A3.tEnd + 0.25, A3.tEnd + 0.75], fp: [T_STUNT - 0.75, T_STUNT - 0.1], sg: [T_POLICY + 0.05, T_POLICY + 0.65]};
const inR = (tau: number, r: number[]) => tau >= r[0] && tau < r[1];

// side-view beats (T7–T9)
const SIDE0 = T_POLICY + 0.65, SIDE1 = T_POLICY + 1.4;
const PLATE = {x0: 222, x1: 296, h: 20, slope: 6};
const plateUp = (tau: number) => easeOut(seg(tau, T_IF - 0.75, T_IF - 0.25)) * (1 - easeInOut(seg(tau, T_TIPS + 1.0, T_TIPS + 1.5)));
const T_TAP = T_REFLEX + 0.55;

/** The main robot's pose through the whole section (stage). */
const mainPose = (tau: number): RPose => {
  if (tau < A1.tPush) return blend(ROBOT_T, K0, smooth(seg(tau, A1.tPush - 0.9, A1.tPush - 0.1)));
  if (tau < REW.a1[0]) return A1.J.pose(tau).pose;
  if (inR(tau, REW.a1)) return rew(A1, REW.a1[0], REW.a1[1], tau);
  if (tau < A2.tPush) return K0;
  if (tau < REW.a2[0]) return A2.J.pose(tau).pose;
  if (inR(tau, REW.a2)) return rew(A2, REW.a2[0], REW.a2[1], tau, REW.a2[0] - A2.tEnd);
  if (tau < A3.tPush) return K0;
  if (tau < REW.a3[0]) return A3.J.pose(tau).pose;
  if (inR(tau, REW.a3)) return rew(A3, REW.a3[0], REW.a3[1], tau, 0.25);
  if (tau < FP.tPush) return K0;
  if (tau < REW.fp[0]) return FP.J.pose(tau).pose;
  if (inR(tau, REW.fp)) return rew(FP, REW.fp[0], REW.fp[1], tau, REW.fp[0] - FP.tEnd);
  if (tau < SG.tPush) return K0;
  if (tau < REW.sg[0]) return SG.J.pose(tau).pose;
  if (inR(tau, REW.sg)) return rew(SG, REW.sg[0], REW.sg[1], tau, REW.sg[0] - SG.tEnd);
  if (tau < SIDE1) return blend(K0, sidePose(), smooth(seg(tau, SIDE0, SIDE1)));
  return sideBeat(tau);
};

/** T8/T9 in the side view: the early foot contact and its correction; the knee reflex; back to the transfer pose. */
const sideBeat = (tau: number): RPose => {
  const p = sidePose();
  const base = p.footN!;
  // step: weight shift, lift, land early on the raised plate
  const lift = smooth(seg(tau, T_IF + 0.05, T_EARLY));
  const back = easeInOut(seg(tau, T_TIPS + 0.55, T_TIPS + 1.2));
  const stepX = lerp(base.x, 262, lift);
  const top = DECK - PLATE.h - 31 * S;
  const air = Math.sin(Math.PI * lift) * 26;
  let fx = stepX, fy = lerp(base.y, top, lift) - air, pitch = -PLATE.slope * lift;
  if (tau >= T_EARLY) { fx = 262; fy = top; pitch = -PLATE.slope; }
  fx = lerp(fx, base.x, back); fy = lerp(fy, base.y, back); pitch = lerp(pitch, 0, back);
  p.footN = {x: fx, y: fy, pitch};
  p.x += 26 * lift * (1 - back);
  // early contact starts a forward tip; the policy's knee/ankle correction stops it
  const tip = smooth(seg(tau, T_EARLY, T_ADJ)) * (1 - smooth(seg(tau, T_ADJ + 0.1, T_TIPS + 0.3)));
  const adj = Math.sin(Math.PI * seg(tau, T_ADJ, T_TIPS + 0.9));
  p.rot += 7 * tip;
  p.y += 14 * adj * (1 - back);
  // reflex: the hammer taps below the knee; the lower leg kicks forward and returns
  const kick = Math.sin(Math.PI * seg(tau, T_TAP + 0.02, T_TAP + 0.45));
  if (kick > 0) {
    const r0 = rig(sidePose(), S);
    const kn = r0.pts.kneeN;
    const L = 140 * S + 6;
    const th = (40 * kick * Math.PI) / 180;
    p.footN = {x: kn[0] + Math.sin(th) * L + 12, y: kn[1] + Math.cos(th) * L, pitch: 0};
  }
  return p;
};
export const trainEndPose = () => sidePose();

// ---------------------------------------------------------------- screen overlays
const ScoreCard: React.FC<{tau: number}> = ({tau}) => {
  const k = seg(tau, T_SCORE - 0.15, T_SCORE + 0.25) * (1 - seg(tau, T_OVER + 0.2, T_OVER + 0.5));
  if (k <= 0) return null;
  const second = tau > A2.tEnd + 0.2;
  const rows: {lab: string; t1: number; ok1: boolean}[] = [
    {lab: 'stayed balanced?', t1: T_BAL + 0.4, ok1: false},
    {lab: 'clean push-off?', t1: T_PUSH + 0.35, ok1: true},
    {lab: 'on target?', t1: T_LAND + 0.4, ok1: false},
  ];
  const fill1 = easeOut(seg(tau, T_LAND + 0.7, T_LAND + 1.1)) * 0.3;
  const fill2 = easeOut(seg(tau, A2.tEnd + 0.6, A2.tEnd + 1.0));
  const fill = second ? lerp(0.3, 0.92, fill2) : fill1;
  return (
    <div style={{position: 'absolute', right: 60, top: 54, width: 470, background: C.paper, border: `4px solid ${C.ink}`, borderRadius: 18, padding: '16px 24px 22px', opacity: Math.min(1, k * 2.5), transform: `translateY(${(1 - easeOut(k)) * -30}px)`, boxShadow: '0 6px 0 rgba(0,0,0,0.2)'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
        <div style={{fontFamily: F.display, fontWeight: 700, fontSize: 44, color: C.ink}}>SCORE</div>
        <div style={{fontFamily: F.body, fontWeight: 800, fontSize: 26, color: C.inkSoft}}>attempt {second || tau > A2.tPush ? 2 : 1}</div>
      </div>
      {rows.map((r, i) => {
        const m1 = tau > r.t1 && !(tau > A2.tPush);
        const m2 = tau > A2.tEnd + 0.25 + i * 0.12;
        const ok = m2 ? true : r.ok1;
        const show = m1 || m2;
        const pop = m2 ? backOut(seg(tau, A2.tEnd + 0.25 + i * 0.12, A2.tEnd + 0.45 + i * 0.12), 1.8) : backOut(seg(tau, r.t1, r.t1 + 0.2), 1.8);
        return (
          <div key={r.lab} style={{display: 'flex', alignItems: 'center', gap: 16, marginTop: 12}}>
            <div style={{width: 48, height: 48, borderRadius: 24, border: `4px solid ${C.ink}`, background: show ? (ok ? C.teal : C.coral) : '#FFFFFF', color: '#fff', fontFamily: F.display, fontWeight: 700, fontSize: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${show ? pop : 1})`}}>{show ? (ok ? '✓' : '✗') : ''}</div>
            <div style={{fontFamily: F.body, fontWeight: 800, fontSize: 34, color: C.ink}}>{r.lab}</div>
          </div>
        );
      })}
      <div style={{marginTop: 18, height: 30, borderRadius: 15, border: `4px solid ${C.ink}`, background: '#FFFFFF', overflow: 'hidden'}}>
        <div style={{width: `${fill * 100}%`, height: '100%', background: fill > 0.6 ? C.teal : C.coral}} />
      </div>
    </div>
  );
};

const Rewind: React.FC<{k: number}> = ({k}) => {
  if (k <= 0) return null;
  return (
    <g transform={`translate(110 ${960}) scale(${backOut(Math.min(1, k * 3), 1.6)})`} opacity={Math.min(1, k * 4)}>
      <rect x={-60} y={-46} width={250} height={92} rx={46} fill={C.ink} />
      <path d="M-14 -24 L-44 0 L-14 24 Z M22 -24 L-8 0 L22 24 Z" fill={C.paper} />
      <text x={44} y={14} fontFamily={F.body} fontWeight={800} fontSize={36} fill={C.paper}>reset</text>
    </g>
  );
};

/** Style guide card: the performer reference (three key poses on its arc); ticks as the avatar matches each. */
const StyleCard: React.FC<{tau: number}> = ({tau}) => {
  const k = seg(tau, T_REF - 0.35, T_REF + 0.1) * (1 - seg(tau, T_POLICY + 0.1, T_POLICY + 0.4));
  if (k <= 0) return null;
  const X = 1230, Y = 130, W = 640, H = 430;
  const sc = 0.4, ox = X + 30 - 140 * sc, oy = Y + 96 - 60 * sc;
  const keyT = [SG.tPush - 0.1, SG.tPush + 0.38 + 0.42, SG.tEnd - 0.02];
  const poses = keyT.map((t) => SG.J.pose(t).pose);
  const arc = SG.J.arc(30);
  return (
    <g opacity={Math.min(1, k * 2.5)} transform={`translate(0 ${(1 - easeOut(k)) * -30})`}>
      <rect x={X} y={Y} width={W} height={H} rx={18} fill={C.paper} stroke={C.ink} strokeWidth={5} />
      <text x={X + 28} y={Y + 52} fontFamily={F.display} fontWeight={700} fontSize={40} fill={C.ink}>STYLE GUIDE</text>
      <text x={X + 300} y={Y + 50} fontFamily={F.body} fontWeight={800} fontSize={24} fill={C.inkSoft}>performer reference</text>
      <defs><clipPath id="sgClip"><rect x={X + 12} y={Y + 70} width={W - 24} height={H - 84} rx={10} /></clipPath></defs>
      <g clipPath="url(#sgClip)">
        <g transform={`translate(${ox} ${oy}) scale(${sc})`}>
          <line x1={-200} y1={DECK} x2={FD.deck.edge} y2={DECK} stroke={C.ink} strokeWidth={6 / sc / 1.5} />
          <line x1={FD.ladle.cx - 290} y1={SURF} x2={FD.ladle.cx + 290} y2={SURF} stroke={C.ink} strokeWidth={6 / sc / 1.5} />
          <path d={'M' + arc.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join('L')} fill="none" stroke="#7656C2" strokeWidth={4 / sc} strokeDasharray={`${12 / sc} ${8 / sc}`} />
          {poses.map((p, i) => <Robot2D key={i} id={'sg' + i} model="PERF" s={S} pose={p} px={S * sc} />)}
        </g>
      </g>
      {keyT.map((t, i) => {
        const r = rig(poses[i], S);
        const px = ox + r.pts.pelvis[0] * sc, py = oy + r.pts.head[1] * sc - 40;
        const kk = seg(tau, t, t + 0.2);
        return kk > 0 ? <g key={i} transform={`translate(${px} ${py}) scale(${0.32 * backOut(kk, 1.8)})`}><circle r={62} fill={C.teal} stroke={C.ink} strokeWidth={10} /><path d="M-30 2 L-8 26 L32 -24" fill="none" stroke="#fff" strokeWidth={18} strokeLinecap="round" strokeLinejoin="round" /></g> : null;
      })}
    </g>
  );
};

/** The policy as a diagram anchored on the robot: sensors → POLICY → joints, with pulses. */
const PolicyDiagram: React.FC<{tau: number; r: ReturnType<typeof rig>; cam: Cam}> = ({tau, r, cam}) => {
  const k = seg(tau, T_POL - 0.2, T_POL + 0.25) * (1 - seg(tau, T_WISH - 0.35, T_WISH));
  if (k <= 0) return null;
  const box = {x: 1390, y: 300, w: 330, h: 140};
  const sc = (p: number[]) => toScreen(cam, p[0], p[1]);
  const ins = [{p: sc(r.pts.visor), lab: 'camera'}, {p: sc(r.pts.chest), lab: 'balance'}, {p: sc(r.pts.toeN), lab: 'foot contact'}];
  const outs = [sc(r.pts.hipN), sc(r.pts.kneeN), sc(r.pts.ankleN)];
  const kIn = seg(tau, T_SENSES - 0.3, T_SENSES + 0.2), kOut = seg(tau, T_MOTOR - 0.1, T_MOTOR + 0.35);
  const rate = tau < T_MANY ? 1.1 : lerp(1.1, 4.5, seg(tau, T_MANY, T_MANY + 0.5));
  // phase accumulates so the speed-up never jumps backwards
  const ph = tau < T_MANY ? (tau - T_POL) * 1.1 : (T_MANY - T_POL) * 1.1 + (tau - T_MANY) * rate;
  const inA = {x: box.x - box.w / 2, y: box.y};
  const outA = {x: box.x, y: box.y + box.h / 2};
  const early = tau > T_EARLY - 0.05 && tau < T_TIPS + 0.6;
  const footPing = early ? Math.max(0, 1 - Math.abs(tau - T_CATCH) / 0.5) : 0;
  const pulse = (a: {x: number; y: number}, b: {x: number; y: number}, u: number, col: string, key: string) => (
    <circle key={key} cx={lerp(a.x, b.x, u)} cy={lerp(a.y, b.y, u)} r={11} fill={col} stroke={C.ink} strokeWidth={3} />
  );
  const els: React.ReactNode[] = [];
  ins.forEach((s, i) => {
    if (kIn <= 0) return;
    const hot = i === 2 && footPing > 0;
    els.push(<line key={'il' + i} x1={s.p.x} y1={s.p.y} x2={lerp(s.p.x, inA.x, easeOut(kIn))} y2={lerp(s.p.y, inA.y + (i - 1) * 34, easeOut(kIn))} stroke={hot ? C.saffron : C.blue} strokeWidth={hot ? 9 : 6} strokeLinecap="round" />);
    els.push(<circle key={'ic' + i} cx={s.p.x} cy={s.p.y} r={hot ? 18 + 10 * footPing : 13} fill={hot ? C.saffron : C.blue} stroke={C.ink} strokeWidth={4} />);
    if (kIn >= 1 && !early) els.push(pulse(s.p, {x: inA.x, y: inA.y + (i - 1) * 34}, (ph + i * 0.3) % 1, C.blue, 'ip' + i));
    if (kIn >= 1 && hot) els.push(pulse(s.p, {x: inA.x, y: inA.y + 34}, seg(tau, T_CATCH - 0.1, T_CATCH + 0.5), C.saffron, 'ipH'));
  });
  outs.forEach((o, i) => {
    if (kOut <= 0) return;
    const hot = early && i > 0 && tau > T_ADJ - 0.1;
    els.push(<line key={'ol' + i} x1={outA.x} y1={outA.y} x2={lerp(outA.x, o.x, easeOut(kOut))} y2={lerp(outA.y, o.y, easeOut(kOut))} stroke={hot ? C.saffron : C.teal} strokeWidth={hot ? 9 : 6} strokeLinecap="round" />);
    if (kOut >= 1 && !early) els.push(pulse(outA, o, (ph + 0.5 + i * 0.25) % 1, C.teal, 'op' + i));
    if (kOut >= 1 && hot) els.push(pulse(outA, o, seg(tau, T_ADJ - 0.1, T_ADJ + 0.45), C.saffron, 'opH' + i));
  });
  const flash = early ? Math.max(0, 1 - Math.abs(tau - (T_CATCH + 0.6)) / 0.5) : 0;
  return (
    <g opacity={Math.min(1, k * 2.5)}>
      {els}
      <rect x={box.x - box.w / 2} y={box.y - box.h / 2} width={box.w} height={box.h} rx={22} fill={flash > 0 ? C.saffronLight : C.ink} stroke={C.ink} strokeWidth={6} />
      <text x={box.x} y={box.y + 8} textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={54} fill={flash > 0 ? C.ink : C.paper}>POLICY</text>
      <text x={box.x} y={box.y + 48} textAnchor="middle" fontFamily={F.body} fontWeight={800} fontSize={24} fill={flash > 0 ? C.ink : C.paperDeep} opacity={seg(tau, T_POL + 1.0, T_POL + 1.4)}>a learned rule</text>
      {kIn > 0.5 ? <text x={inA.x - 30} y={box.y - 100} textAnchor="end" fontFamily={F.body} fontWeight={800} fontSize={34} fill={C.blueDeep} opacity={kIn}>what it senses</text> : null}
      {kOut > 0.5 ? <text x={box.x + 30} y={box.y + 140} fontFamily={F.body} fontWeight={800} fontSize={34} fill={C.tealDeep} opacity={kOut}>motor commands</text> : null}
      {tau > T_MANY ? (
        <g opacity={seg(tau, T_MANY, T_MANY + 0.3) * (early ? 0.0 : 1)}>
          <rect x={box.x - 170} y={box.y - 150} width={340} height={56} rx={28} fill={C.paper} stroke={C.ink} strokeWidth={4} />
          <text x={box.x} y={box.y - 112} textAnchor="middle" fontFamily={F.body} fontWeight={800} fontSize={30} fill={C.ink}>many times a second</text>
        </g>
      ) : null}
    </g>
  );
};

const TiltGauge: React.FC<{x: number; y: number; rot: number; k: number; ok: number}> = ({x, y, rot, k, ok}) => {
  if (k <= 0) return null;
  const a = Math.max(-70, Math.min(70, rot * 7));
  return (
    <g transform={`translate(${x} ${y})`} opacity={Math.min(1, k * 2.5)}>
      <path d="M-120 0 A120 120 0 0 1 120 0 Z" fill={C.paper} stroke={C.ink} strokeWidth={5} />
      <path d="M-120 0 A120 120 0 0 1 -84 -85 L0 0 Z" fill={C.coralLight} />
      <path d="M84 -85 A120 120 0 0 1 120 0 L0 0 Z" fill={C.coralLight} />
      <path d="M-30 -116 A120 120 0 0 1 30 -116 L0 0 Z" fill={C.tealLight} />
      <path d="M-120 0 A120 120 0 0 1 120 0" fill="none" stroke={C.ink} strokeWidth={5} />
      <line x1={0} y1={0} x2={Math.sin((a * Math.PI) / 180) * 100} y2={-Math.cos((a * Math.PI) / 180) * 100} stroke={C.ink} strokeWidth={9} strokeLinecap="round" />
      <circle r={12} fill={C.ink} />
      <text x={0} y={46} textAnchor="middle" fontFamily={F.body} fontWeight={800} fontSize={30} fill={C.ink}>tipping?</text>
      {ok > 0 ? <g transform={`translate(110 -110) scale(${0.45 * backOut(ok, 1.8)})`}><circle r={62} fill={C.teal} stroke={C.ink} strokeWidth={9} /><path d="M-30 2 L-8 26 L32 -24" fill="none" stroke="#fff" strokeWidth={16} strokeLinecap="round" strokeLinejoin="round" /></g> : null}
    </g>
  );
};

const Bubble: React.FC<{x: number; y: number; k: number; no: number; icon: 'wish' | 'plan'; label: string}> = ({x, y, k, no, icon, label}) => {
  if (k <= 0) return null;
  const e = backOut(k, 1.5);
  return (
    <g transform={`translate(${x} ${y}) scale(${e})`}>
      <circle cx={-120} cy={150} r={12} fill={C.paper} stroke={C.ink} strokeWidth={4} />
      <circle cx={-90} cy={118} r={18} fill={C.paper} stroke={C.ink} strokeWidth={4} />
      <ellipse cx={0} cy={0} rx={130} ry={100} fill={C.paper} stroke={C.ink} strokeWidth={5} />
      {icon === 'wish'
        ? <path d="M0 -58 L16 -18 L58 -16 L24 10 L36 52 L0 28 L-36 52 L-24 10 L-58 -16 L-16 -18 Z" fill={C.saffron} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" transform="translate(0 -6) scale(0.8)" />
        : <g transform="translate(0 -6)"><rect x={-44} y={-54} width={88} height={108} rx={10} fill="#FFFFFF" stroke={C.ink} strokeWidth={5} />{[0, 1, 2].map((i) => <g key={i}><rect x={-30} y={-34 + i * 30} width={14} height={14} fill="none" stroke={C.ink} strokeWidth={3} /><rect x={-8} y={-30 + i * 30} width={40} height={7} rx={3} fill={C.inkSoft} /></g>)}</g>}
      <text x={0} y={84} textAnchor="middle" fontFamily={F.body} fontWeight={800} fontSize={30} fill={C.ink}>{label}</text>
      {no > 0 ? <path d="M-70 -60 L70 60 M70 -60 L-70 60" stroke={C.coral} strokeWidth={16} strokeLinecap="round" strokeDasharray={`${200 * no} 400`} /> : null}
    </g>
  );
};

// ---------------------------------------------------------------- world props
const LaunchArrow: React.FC<{k: number; good: number; lw: number}> = ({k, good, lw}) => {
  if (k <= 0) return null;
  const len = lerp(110, 190, good) * easeOut(k);
  const ang = lerp(-28, -42, good);
  const x = TOE_X + 10, y = DECK - 150;
  const col = good > 0.5 ? C.teal : C.coral;
  return (
    <g transform={`translate(${x} ${y}) rotate(${ang})`}>
      <line x1={0} y1={0} x2={len} y2={0} stroke={C.ink} strokeWidth={lw * 5} strokeLinecap="round" />
      <line x1={0} y1={0} x2={len} y2={0} stroke={col} strokeWidth={lw * 3} strokeLinecap="round" />
      <path d={`M${len + 26} 0 L${len - 6} -20 L${len - 6} 20 Z`} fill={col} stroke={C.ink} strokeWidth={lw} strokeLinejoin="round" />
    </g>
  );
};

const SC = {ink: '#2C4A80'};
/** Control desk with the PUSH dial (needle in degrees, -60 coral … +45 teal). */
const Desk: React.FC<{x: number; lw: number; needle: number}> = ({x, lw, needle}) => (
  <g>
    <rect x={x - 110} y={FD.floor - 150} width={220} height={150} fill="#B9CDEB" stroke={SC.ink} strokeWidth={lw} />
    <path d={`M${x - 130} ${FD.floor - 150} L${x + 130} ${FD.floor - 150} L${x + 110} ${FD.floor - 196} L${x - 110} ${FD.floor - 196} Z`} fill="#DCE7F8" stroke={SC.ink} strokeWidth={lw} strokeLinejoin="round" />
    <rect x={x - 8} y={FD.floor - 240} width={16} height={46} fill="#9DB6E0" stroke={SC.ink} strokeWidth={lw} />
    <g transform={`translate(${x} ${FD.floor - 300})`}>
      <rect x={-74} y={-64} width={148} height={124} rx={16} fill="#FFFFFF" stroke={SC.ink} strokeWidth={lw} />
      <path d="M-50 22 A56 56 0 0 1 50 22" fill="none" stroke={C.coral} strokeWidth={lw * 3} />
      <path d="M10 -33 A56 56 0 0 1 50 22" fill="none" stroke={C.teal} strokeWidth={lw * 3} />
      <line x1={0} y1={22} x2={Math.sin((needle * Math.PI) / 180) * 48} y2={22 - Math.cos((needle * Math.PI) / 180) * 48} stroke={SC.ink} strokeWidth={lw * 2} strokeLinecap="round" />
      <circle cx={0} cy={22} r={9} fill={SC.ink} />
      <text x={0} y={-36} textAnchor="middle" fontFamily={F.body} fontWeight={800} fontSize={24} fill={SC.ink}>PUSH</text>
    </g>
  </g>
);


// reflex hammer: a short handle with a wide rubber head across its end
const hammerProp = (
  <g transform="rotate(-60)">
    <rect x={-6} y={-6} width={12} height={96} rx={5} fill="#9AA4AE" stroke={C.ink} strokeWidth={4} />
    <path d="M-44 84 Q0 70 44 84 L36 112 Q0 124 -36 112 Z" fill={C.coral} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
  </g>
);
const reportProp = (k: number) => (
  <g transform={`rotate(${-8 * k})`}>
    <rect x={-70} y={-40} width={140} height={176} rx={10} fill="#C9924F" stroke={C.ink} strokeWidth={5} />
    <rect x={-58} y={-26} width={116} height={150} rx={6} fill="#FFFDF6" />
    <text x={0} y={4} textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={22} fill={C.ink}>INCIDENT</text>
    <text x={0} y={30} textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={22} fill={C.ink}>REPORT</text>
    {[0, 1, 2].map((i) => <rect key={i} x={-44} y={50 + i * 22} width={88} height={8} rx={4} fill="#D9DEE4" />)}
  </g>
);

// ---------------------------------------------------------------- the grid of copies
const COLS = 5, ROWS = 3, MAIN = {c: 2, r: 1};
const P_CELL = 2.3;
const CELL_OUT: ('stick' | 'short' | 'faceplant')[] = ['stick', 'short', 'stick', 'faceplant', 'stick', 'stick', 'short', 'stick', 'stick', 'stick', 'faceplant', 'stick', 'short', 'stick', 'stick'];
const CELL_J = CELL_OUT.map((o, k) => jump(0.25, o, o === 'short' ? 600 : o === 'faceplant' ? 700 : TGT_X + (rnd(k + 3) - 0.5) * 100, o === 'short' ? 55 * S : 90 * S, o === 'short' ? 590 : o === 'faceplant' ? 700 : undefined));
const cellOff = (c: number, r: number) => ({dx: (c - MAIN.c) * (CELL.w + GAP), dy: (r - MAIN.r) * (CELL.h + GAP)});
const cellPose = (k: number, tau: number): RPose | null => {
  const tl = (tau - rnd(k * 7) * P_CELL + 100 * P_CELL) % P_CELL;
  if (tl > P_CELL - 0.07) return null; // episode reset
  return CELL_J[k].J.pose(tl).pose;
};

// ---------------------------------------------------------------- the stage world (main cell)
const StageWorld: React.FC<{tau: number; f: number; cam: Cam; lw: number}> = ({tau, f, cam, lw}) => {
  const p = mainPose(tau);
  // the crew: A tosses the target onto the pad, then works the PUSH dial; B brings an incident report nobody needs
  const aIn = easeOut(seg(tau, T_HOW - 0.1, T_HOW + 0.5));
  const toDesk = easeInOut(seg(tau, T_HOW + 1.7, T_HOW + 2.3));
  const ca = {x: lerp(lerp(1760, 1150, aIn), 1400, toDesk), y: FD.floor, h: 400, flip: true};
  const tossT = T_HOW + 0.85;
  const tossing = Math.sin(Math.PI * seg(tau, tossT - 0.35, tossT + 0.15));
  const turning = seg(tau, T_NUDGE + 0.35, T_NUDGE + 1.3);
  const dialPt = {x: 1250 + 40, y: FD.floor - 290};
  const atDial = tau > T_NUDGE + 0.1 && tau < T_NUDGE + 1.6 ? smooth(Math.min(seg(tau, T_NUDGE + 0.1, T_NUDGE + 0.35), 1 - seg(tau, T_NUDGE + 1.35, T_NUDGE + 1.6))) : 0;
  const reachDial = crewReach(ca, 1, dialPt.x + Math.sin(turning * 6) * 8, dialPt.y);
  const armA = {a: lerp(lerp(20, 140, tossing), reachDial.a, atDial), b: lerp(lerp(24, -10, tossing), reachDial.b, atDial)};
  const needle = lerp(-40, 26, easeInOut(turning));
  const disc = tau > tossT && tau < tossT + 0.55 ? (() => {
    const u = seg(tau, tossT, tossT + 0.55);
    return {x: lerp(1110, TGT_X, u), y: lerp(FD.floor - 330, SURF, u) - Math.sin(Math.PI * u) * 160, s: lerp(0.5, 1, u), rot: u * 540};
  })() : null;
  const tk = tau < tossT + 0.55 ? 0 : backOut(seg(tau, tossT + 0.55, tossT + 0.85), 1.8);
  // incident clerk
  const bIn = easeOut(seg(tau, T_FALL + 0.3, T_FALL + 0.9)) * (1 - easeIn(seg(tau, T_STUNT - 0.6, T_STUNT + 0.2)));
  const cb = {x: lerp(1800, 1160, bIn), y: FD.floor, h: 400, flip: true};
  const tossed = tau > T_NOBODY + 0.3;
  const shrug = smooth(seg(tau, T_NOBODY + 0.25, T_NOBODY + 0.6));
  const formFly = tossed ? seg(tau, T_NOBODY + 0.3, T_NOBODY + 1.4) : 0;
  // arcs
  const a1k = tau < REW.a1[0] ? seg(tau, A1.tPush + 0.38, A1.tEnd) : 1 - seg(tau, REW.a1[0], REW.a1[1]);
  const a2k = tau < REW.a2[0] ? seg(tau, A2.tPush + 0.38, A2.tEnd) : 1 - seg(tau, REW.a2[0], REW.a2[1]);
  const sgk = seg(tau, T_REF - 0.2, T_REF + 0.5) * (1 - seg(tau, T_POLICY + 0.1, T_POLICY + 0.5));
  const pulse = Math.max(0, 1 - Math.abs(tau - A2.tEnd - 0.15) / 0.45) + Math.max(0, 1 - Math.abs(tau - SG.tEnd - 0.15) / 0.45);
  // side-view crew: A raises a floor plate with a lever; B tests the knee reflex
  const sA = easeOut(seg(tau, T_IF - 1.6, T_IF - 1.0)) * (1 - easeIn(seg(tau, T_TIPS + 1.5, T_TIPS + 2.2)));
  const leverA = lerp(-50, 40, easeInOut(seg(tau, T_IF - 0.85, T_IF - 0.35))) * (1 - easeInOut(seg(tau, T_TIPS + 0.9, T_TIPS + 1.4)));
  const sa = {x: lerp(-560, -150, sA), y: DECK, h: 350};
  const lever = {x: -20, y: DECK - 120};
  const handle = {x: lever.x + Math.sin((leverA * Math.PI) / 180) * 90, y: lever.y + 60 - Math.cos((leverA * Math.PI) / 180) * 90};
  const sB = easeOut(seg(tau, T_WISH - 0.1, T_WISH + 0.6)) * (1 - easeIn(seg(tau, T_TAP + 0.8, T_TAP + 1.4)));
  const sb = {x: lerp(-560, 10, sB), y: DECK, h: 350};
  const kneeNow = rig(sidePose(), S).pts.kneeN;
  const strike = {x: kneeNow[0] + 8, y: kneeNow[1] + 22};
  const swing = Math.sin(Math.PI * seg(tau, T_TAP - 0.35, T_TAP + 0.12));
  const armB = tau > T_REFLEX - 0.1 && tau < T_TAP + 0.6 ? (() => {
    const r0 = crewReach(sb, 1, strike.x - 10, strike.y);
    const up = {a: 120, b: 40};
    const w = seg(tau, T_REFLEX + 0.05, T_TAP - 0.3);
    return {a: lerp(lerp(20, up.a, smooth(w)), r0.a, tau > T_TAP - 0.3 ? smooth(seg(tau, T_TAP - 0.3, T_TAP)) : 0) + (tau > T_TAP ? -10 * seg(tau, T_TAP, T_TAP + 0.3) : 0), b: lerp(lerp(24, up.b, smooth(w)), r0.b, tau > T_TAP - 0.3 ? smooth(seg(tau, T_TAP - 0.3, T_TAP)) : 0)};
  })() : {a: 20, b: 24};
  void swing;
  const plate = plateUp(tau);
  const leverK = easeOut(seg(tau, T_IF - 1.7, T_IF - 1.2)) * (1 - easeIn(seg(tau, T_TIPS + 2.0, T_TIPS + 2.6)));
  const inSide = tau > SIDE0 - 0.5;
  return (
    <g>
      <StageBack lw={lw} grid={0.25} />
      {/* arcs behind the tower */}
      <Arc pts={A1.J.arc()} k={a1k} lw={lw} color={C.coral} />
      <Arc pts={A2.J.arc()} k={a2k} lw={lw} color={C.teal} />
      <Arc pts={SG.J.arc()} k={sgk} lw={lw} color="#7656C2" width={3} />
      <Tower lw={lw} />
      <Pad lw={lw} pulse={Math.min(1, pulse)} tk={tk} />
      {/* where attempt 1 came down */}
      {tau > T_LAND + 0.3 && tau < REW.a1[1] ? <g transform={`translate(590 ${SURF - 4})`}><ellipse rx={30} ry={8} fill={C.coral} opacity={0.9} /></g> : null}
      {/* the side-view plate and lever */}
      {inSide ? (
        <g>
          <g transform={`translate(0 ${(1 - plate) * PLATE.h})`}>
            <path d={`M${PLATE.x0} ${DECK} L${PLATE.x0} ${DECK - PLATE.h + 6} L${PLATE.x1} ${DECK - PLATE.h - 2} L${PLATE.x1} ${DECK} Z`} fill={C.saffron} stroke={SC.ink} strokeWidth={lw} strokeLinejoin="round" />
          </g>
          <rect x={PLATE.x0 - 4} y={DECK - 2} width={PLATE.x1 - PLATE.x0 + 8} height={6} fill={SC.ink} opacity={plate > 0.02 ? 0.4 : 0} />
          {leverK > 0.01 ? (
            <g clipPath="url(#leverClip)">
              <defs><clipPath id="leverClip"><rect x={-400} y={-400} width={800} height={DECK + 400} /></clipPath></defs>
              <g transform={`translate(0 ${(1 - leverK) * 220})`}>
                <rect x={lever.x - 26} y={lever.y + 60} width={52} height={DECK - lever.y - 60} fill="#9DB6E0" stroke={SC.ink} strokeWidth={lw} />
                <line x1={lever.x} y1={lever.y + 60} x2={handle.x} y2={handle.y} stroke={SC.ink} strokeWidth={lw * 3} strokeLinecap="round" />
                <circle cx={handle.x} cy={handle.y} r={14} fill={C.coral} stroke={SC.ink} strokeWidth={lw} />
              </g>
            </g>
          ) : null}
          {sA > 0.01 ? <Crew look={CAST.clerkA} x={sa.x} y={sa.y} h={sa.h} frame={f} seed={3} front="R"
            pose={{...IDLE, armR: crewReach(sa, 1, handle.x, handle.y), armL: {a: 16, b: 20}, lookX: 0.8, lookY: 0.3, mouth: tau > T_EARLY ? 'o' : 'smile', brows: 0.3}} /> : null}
          {sB > 0.01 ? <Crew look={CAST.clerkB} x={sb.x} y={sb.y} h={sb.h} frame={f} seed={9} front="R" holdR={hammerProp}
            pose={{...IDLE, armR: armB, armL: {a: 14, b: 16}, lookX: 0.8, lookY: 0.4, mouth: tau > T_TAP + 0.1 ? 'grin' : 'smile', brows: 0.4}} /> : null}
        </g>
      ) : null}
      {/* the avatar */}
      <Bot cam={cam} id="trS" model="SIM" s={S} pose={p}
        hl={inSide ? {footN: {color: C.saffron, amount: Math.max(0, 1 - Math.abs(tau - T_CATCH) / 0.6) * (tau > T_EARLY ? 1 : 0)}, kneeN: {color: C.teal, amount: Math.sin(Math.PI * seg(tau, T_ADJ - 0.1, T_TIPS + 0.6))}, ankleN: {color: C.teal, amount: Math.sin(Math.PI * seg(tau, T_ADJ - 0.1, T_TIPS + 0.6))}} : {}} />
      {/* launch arrow (what the nudge changes) */}
      <LaunchArrow k={seg(tau, T_NUDGE + 0.2, T_NUDGE + 0.6) * (1 - seg(tau, A2.tPush + 0.2, A2.tPush + 0.5))} good={smooth(seg(tau, T_NUDGE + 0.5, T_NUDGE + 1.3))} lw={lw} />
      {/* crew on the floor */}
      {!inSide ? (
        <g>
          <Desk x={1250} lw={lw} needle={needle} />
          {aIn > 0.01 ? <Crew look={CAST.clerkA} x={ca.x} y={ca.y} h={ca.h} flip frame={f} seed={3} front="R"
            holdR={tau < tossT ? <g transform="scale(0.6)"><ellipse rx={92} ry={30} fill="#FFFFFF" stroke={C.teal} strokeWidth={16} /><ellipse rx={40} ry={13} fill="none" stroke={C.teal} strokeWidth={12} /></g> : null}
            pose={{...IDLE, armR: armA, armL: {a: 14, b: 18}, lookX: 0.8, lookY: atDial > 0 ? 0.3 : -0.1, mouth: tau > A2.tEnd ? 'grin' : 'smile', brows: 0.2}} /> : null}
          {bIn > 0.01 ? <Crew look={CAST.clerkB} x={cb.x} y={cb.y} h={cb.h} flip frame={f} seed={9} front="L"
            holdL={!tossed ? reportProp(0) : null}
            pose={{...IDLE, armL: {a: lerp(40, 150, shrug), b: lerp(70, -30, shrug)}, armR: {a: lerp(14, 110, shrug), b: lerp(16, -30, shrug)}, lookX: 0.6, lookY: 0.2, mouth: shrug > 0.5 ? 'smirk' : 'flat', browAsym: shrug, brows: 0.3}} /> : null}
          {formFly > 0 && formFly < 1 ? <g transform={`translate(${cb.x - 110 + formFly * 700} ${FD.floor - 330 - Math.sin(Math.PI * formFly) * 260 + formFly * 100}) rotate(${formFly * 400}) scale(0.9)`}>{reportProp(1)}</g> : null}
          {disc ? <g transform={`translate(${disc.x} ${disc.y}) scale(${disc.s}) rotate(${disc.rot * 0.05})`}><ellipse rx={92} ry={30} fill="#FFFFFF" stroke={C.teal} strokeWidth={lw * 4} /><ellipse rx={40} ry={13} fill="none" stroke={C.teal} strokeWidth={lw * 3} /></g> : null}
        </g>
      ) : null}
    </g>
  );
};

const MiniWorld: React.FC<{k: number; tau: number; cam: Cam; lw: number}> = ({k, tau, cam, lw}) => {
  const p = cellPose(k, tau);
  return (
    <g>
      <StageBack lw={lw} grid={0.25} />
      <Tower lw={lw} />
      <Pad lw={lw} />
      {p ? <Bot cam={cam} id={'cell' + k} model="SIM" s={S} pose={p} /> : null}
    </g>
  );
};

/** A slow screen-space drift so held beats never freeze; it fades out before the section's last frame (CAM_SIDE). */
const drift = (cam: Cam, tau: number): Cam => {
  const k = seg(tau, TRAIN_START, TRAIN_START + 1.5) * (1 - seg(tau, TRAIN_END - 1.4, TRAIN_END - 0.5));
  const ph = ((tau - TRAIN_START) * 2 * Math.PI) / 13;
  return {...cam, x: cam.x + (16 * Math.sin(ph) * k) / cam.z, y: cam.y + (9 * Math.sin(ph * 0.8 + 1) * k) / cam.z, z: cam.z * (1 + 0.015 * Math.sin(ph * 0.6) * k)};
};

// ---------------------------------------------------------------- section
export const Train: React.FC = () => {
  const f = useCurrentFrame();
  const tau = TRAIN_START + f / 30;

  // ------------------------------------------ T0: low at the edge in the foundry
  const foundry = (cam: Cam) => {
    const lw = 4 / cam.z;
    const look = smooth(seg(tau, T_HARD + 0.2, T_HARD + 0.8)) * (1 - smooth(seg(tau, T_REH + 0.1, T_REH + 0.6)));
    const arcK = seg(tau, T_REH + 0.2, T_REH + 0.9);
    const no = seg(tau, T_FURN - 0.05, T_FURN + 0.25);
    const arc = A2.J.arc();
    const ap = arc[Math.floor(arc.length * 0.35)];
    const aps = toScreen(cam, ap.x, ap.y);
    return (
      <Scene bg="#221A21">
        <FoundryView cam={cam} t={tau} glow={1} hook={false} extraBack={<FilmSetLights lw={lw} id="fsT" />}
          behind={<g><CraneChain lw={lw} sw={0} /><Arc pts={arc} k={arcK} lw={lw} color={no > 0 ? C.coral : '#FFF4D6'} width={3} /><Bot cam={cam} id="trF" model="F02" s={S} pose={{...ROBOT_T, head: 14 * look, neck: 6 * look}} /></g>} />
        {arcK > 0.5 ? (
          <g opacity={Math.min(1, (arcK - 0.5) * 3) * (1 - no)}>
            <rect x={aps.x - 130} y={aps.y - 110} width={260} height={64} rx={14} fill={C.paper} stroke={C.ink} strokeWidth={4} />
            <text x={aps.x} y={aps.y - 66} textAnchor="middle" fontFamily={F.body} fontWeight={800} fontSize={34} fill={C.ink}>practice run?</text>
          </g>
        ) : null}
        {no > 0 ? <Mark x={aps.x} y={aps.y} ok={false} k={no} s={1.6} /> : null}
      </Scene>
    );
  };
  if (tau < T_WIPE) {
    let cam = mixCam(TRAIN_C0, cLow2, easeInOut(seg(tau, TRAIN_START, T_REH - 0.2)));
    cam = mixCam(cam, cPract, easeInOut(seg(tau, T_REH - 0.2, T_REH + 0.8)));
    return foundry(drift(cam, tau));
  }

  // ------------------------------------------ stage (main cell, grid, side view)
  let cam = mixCam(cPract, CAM_ST, easeInOut(seg(tau, T_WIPE + 0.7, T_HOW + 0.3)));
  cam = mixCam(cam, CAM_GRID, easeInOut(seg(tau, T_OVER + 0.25, T_COPIES + 0.7)));
  cam = mixCam(cam, CAM_ST, easeInOut(seg(tau, T_FALL - 0.55, T_FALL + 0.45)));
  cam = mixCam(cam, CAM_SIDE, easeInOut(seg(tau, T_POLICY + 0.2, T_POL + 0.7)));
  cam = drift(cam, tau);
  const lw = 4 / cam.z;
  const grid = cam.z < CAM_ST.z * 0.95 && tau > T_OVER && tau < T_FALL + 0.6;
  const world = grid ? (
    <Layer cam={cam}>
      <defs><clipPath id="cellClip"><rect x={CELL.x0} y={CELL.y0} width={CELL.w} height={CELL.h} /></clipPath></defs>
      {Array.from({length: COLS * ROWS}, (_, k) => {
        const c = k % COLS, r = Math.floor(k / COLS);
        const {dx, dy} = cellOff(c, r);
        const isMain = c === MAIN.c && r === MAIN.r;
        return (
          <g key={k} transform={`translate(${dx} ${dy})`}>
            <g clipPath="url(#cellClip)">{isMain ? <StageWorld tau={tau} f={f} cam={cam} lw={lw} /> : <MiniWorld k={k} tau={tau} cam={cam} lw={lw} />}</g>
            <rect x={CELL.x0} y={CELL.y0} width={CELL.w} height={CELL.h} rx={8 / cam.z} fill="none" stroke={SC.ink} strokeWidth={lw * 1.5} />
          </g>
        );
      })}
    </Layer>
  ) : <Layer cam={cam}><StageWorld tau={tau} f={f} cam={cam} lw={lw} /></Layer>;

  const pNow = mainPose(tau);
  const rNow = rig(pNow, S);
  const headS = toScreen(cam, rNow.pts.head[0], rNow.pts.head[1]);
  const rewK = [REW.a1, REW.a2, REW.a3, REW.fp, REW.sg].reduce((m, r) => Math.max(m, Math.sin(Math.PI * seg(tau, r[0] - 0.1, r[1] + 0.1))), 0);
  const stage = (
    <Scene bg="#EEF4FD"
      over={(
        <>
          <Chip x={100} y={64} lines={['FIGURE SAYS', 'a new AI model, trained in simulation']} k={seg(tau, T_WIPE + 0.5, T_WIPE + 0.9) * (1 - seg(tau, T_HOW - 0.3, T_HOW))} size={38} />
          <Chip x={100} y={64} lines={['HOW THIS KIND OF TRAINING GENERALLY WORKS']} k={seg(tau, T_HOW + 0.05, T_HOW + 0.45) * (1 - seg(tau, T_OVER + 0.1, T_OVER + 0.4))} size={34} tone="blue" />
          <Chip x={100} y={64} lines={['FIGURE SAYS', 'stunt performers’ movements as a reference']} k={seg(tau, T_STUNT + 0.05, T_STUNT + 0.45) * (1 - seg(tau, T_POLICY - 0.3, T_POLICY))} size={38} />
          <Chip x={100} y={64} lines={['slowed down to show it']} k={seg(tau, T_EARLY - 0.1, T_EARLY + 0.2) * (1 - seg(tau, T_TIPS + 0.6, T_TIPS + 0.9))} size={30} tone="paper" />
          <ScoreCard tau={tau} />
        </>
      )}>
      {world}
      <Rewind k={rewK} />
      <StyleCard tau={tau} />
      <PolicyDiagram tau={tau} r={rNow} cam={cam} />
      <TiltGauge x={1500} y={760} rot={pNow.rot - sidePose().rot} k={seg(tau, T_EARLY - 0.2, T_EARLY + 0.2) * (1 - seg(tau, T_TIPS + 1.0, T_TIPS + 1.3))} ok={seg(tau, T_TIPS + 0.35, T_TIPS + 0.6)} />
      <Bubble x={headS.x + 300} y={headS.y - 80} k={seg(tau, T_WISH - 0.05, T_WISH + 0.3) * (1 - seg(tau, T_REFLEX + 0.1, T_REFLEX + 0.4))} no={seg(tau, T_WISH + 0.3, T_WISH + 0.6)} icon="wish" label="a wish" />
      <Bubble x={headS.x + 620} y={headS.y + 10} k={seg(tau, T_PLAN - 0.05, T_PLAN + 0.3) * (1 - seg(tau, T_REFLEX + 0.1, T_REFLEX + 0.4))} no={seg(tau, T_PLAN + 0.2, T_PLAN + 0.5)} icon="plan" label="a plan" />
      {(() => {
        const kn = toScreen(cam, rNow.pts.kneeN[0], rNow.pts.kneeN[1]);
        return <Tag ax={kn.x + 14} ay={kn.y} x={kn.x + 240} y={kn.y + 40} text="a well-rehearsed reflex" k={seg(tau, T_TAP + 0.2, T_TAP + 0.5) * (1 - seg(tau, TRAIN_END - 0.9, TRAIN_END - 0.6))} color={C.tealDeep} size={38} />;
      })()}
    </Scene>
  );
  if (tau < T_WIPE + 0.62) return <RollWipe k={seg(tau, T_WIPE, T_WIPE + 0.62)} dir={1} before={foundry(cam)} after={stage} tone="blueprint" />;
  return stage;
};
void Chip; void lerp;
/** Event times for the sound cue sheet. */
export const TRAIN_EV = {A1, A2, A3, FP, SG, REW, T_TAP, T_WIPE, SIDE0, keyStyle: [SG.tPush - 0.1, SG.tPush + 0.38 + 0.42, SG.tEnd - 0.02]};
