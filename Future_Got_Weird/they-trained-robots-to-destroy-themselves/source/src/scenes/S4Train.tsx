import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, F} from '../theme';
import {useG} from '../lib/SceneFrame';
import {at, atEnd} from '../lib/narration';
import {Camera, Layer, Cam} from '../lib/camera';
import {camPath, E, tw, kf, frameRect} from '../lib/motion';
import {RobotSide} from '../components/Robot';
import {FoundryBack, Walkway, LadleBack, LadleFront, Heat, WALK_Y, EDGE_X, LADLE_X, RIM_Y, RIM_RX} from '../components/Foundry';
import {SimBackdrop, Lane, Slider, alongLoop, ReflexHammer, fmt, SIMC} from '../components/Sim';
import {standPose, jumpPose, JumpPlan} from '../lib/moves';
import {RobotPose, STAND, STAND_HEIGHT, joints} from '../lib/robot';
import {Svg, IllusTag, Card, Chip, Headline, Mark} from '../components/UI';
import {Character} from '../components/Character';
import {CAST} from '../components/cast';
import {P} from '../lib/poses';
import type {Sfx} from '../lib/sfx';

const S = 0.74;
const EDGE_HIP = EDGE_X - 52;

// lane grid geometry (world px at zoom 1)
const COLS = 5, ROWS = 4, LW = 340, LH = 200, GAP = 26;
const GX = (1920 - (COLS * LW + (COLS - 1) * GAP)) / 2;
const GY = 178;
const laneXY = (i: number) => ({x: GX + (i % COLS) * (LW + GAP), y: GY + Math.floor(i / COLS) * (LH + GAP)});
const FOCUS = 6; // row 1, col 1

export const trainCues = () => {
  const start = at('Now the hard');
  const noRehearse = at("You can't rehearse");
  const wipe = at('So Figure says it trained');
  const how = at("Here's how");
  const thousands = at('Thousands');
  const score = at('Each attempt');
  const q1 = at('Did it stay'), q2 = at('Push off'), q3 = at('Land on');
  const nudge = at('The software nudges');
  const again = at('and they try again');
  const great = at('Virtual robots are great');
  const faces = at('fall on their faces');
  const report = at('nobody files');
  const stunt = at('Figure says it used stunt');
  const style = at('style guide');
  const policy = at('The result is called');
  const senses = at('turns what the robot');
  const motor = at('motor commands');
  const many = at('many times a second.');
  const wish = at('Not a wish');
  const plan = at('not a plan');
  const reflex = at('more like a very');
  const tap = atEnd('well-rehearsed') - 2;
  const end = atEnd('reflex.') + 18;
  return {start, noRehearse, wipe, how, thousands, score, q1, q2, q3, nudge, again, great, faces, report, stunt, style, policy, senses, motor, many, wish, plan, reflex, tap, end};
};

export const SFX = (): Sfx[] => {
  const c = trainCues();
  return [
    {f: c.start, kind: 'amb_foundry', dur: (c.wipe - c.start) / 30 + 0.5, gain: -4},
    {f: c.noRehearse + 8, kind: 'buzz_no', gain: -6},
    {f: c.wipe, kind: 'whoosh_soft', gain: -6},
    {f: c.wipe + 10, kind: 'amb_sim', dur: (c.end - c.wipe) / 30, gain: -2},
    {f: c.thousands + 4, kind: 'sim_blip', gain: -8},
    {f: c.q1 + 4, kind: 'ding_yes', gain: -8},
    {f: c.q2 + 4, kind: 'ding_yes', gain: -8, pitch: 2},
    {f: c.q3 + 4, kind: 'buzz_no', gain: -8},
    {f: c.nudge + 20, kind: 'slider_tick', gain: -6},
    {f: c.nudge + 38, kind: 'slider_tick', gain: -6, pitch: 1},
    {f: c.nudge + 56, kind: 'slider_tick', gain: -6, pitch: 2},
    {f: c.again + 6, kind: 'counter_tick', dur: 2.2, gain: -10},
    {f: c.faces + 6, kind: 'sim_fall', gain: -2},
    {f: atEnd('report.') - 4, kind: 'stamp', gain: -4},
    {f: c.style, kind: 'card_flick', gain: -8},
    {f: c.policy + 4, kind: 'pop_tick', gain: -8},
    {f: c.senses + 4, kind: 'pop_tick', gain: -8, pitch: 2},
    {f: c.motor + 4, kind: 'pop_tick', gain: -8, pitch: 4},
    {f: c.wish + 8, kind: 'marker_x', gain: -6},
    {f: c.plan + 8, kind: 'marker_x', gain: -6},
    {f: c.tap, kind: 'knee_tap', gain: -2},
  ];
};

/** The real foundry close-up and the matching simulation set, used for the wipe between them. */
const RealClose: React.FC<{g: number}> = ({g}) => (
  <>
    <Layer depth={0.45}><FoundryBack frame={g} id="s4" /></Layer>
    <Layer depth={1}>
      <Walkway />
      <LadleBack frame={g} id="s4l" />
      <Svg><RobotSide pose={standPose(EDGE_HIP, WALK_Y, S, g, 1)} scale={S} /></Svg>
      <LadleFront id="s4f" />
      <Heat frame={g} />
    </Layer>
  </>
);

const SimClose: React.FC<{g: number; tryAt: number}> = ({g, tryAt}) => {
  const J: JumpPlan = {crouchAt: tryAt, takeoff: tryAt + 12, entry: tryAt + 60, edgeX: EDGE_HIP, groundY: WALK_Y, target: {x: 1250, y: WALK_Y + 900}, scale: S, apex: 40};
  const pose = g < tryAt ? standPose(EDGE_HIP, WALK_Y, S, g, 1) : jumpPose(g, J).pose;
  const miss = tw(g, tryAt + 30, 8, E.back);
  return (
  <>
    <Layer depth={0.45}><SimBackdrop horizon={WALK_Y + 40} /></Layer>
    <Layer depth={1}>
      <Svg>
        <rect x={-900} y={WALK_Y - 10} width={EDGE_X + 900} height={600} fill={SIMC.deck} stroke={SIMC.deckDark} strokeWidth={4} />
        <ellipse cx={LADLE_X} cy={RIM_Y + 6} rx={RIM_RX} ry={46} fill="none" stroke={SIMC.pad} strokeWidth={8} strokeDasharray="22 16" />
        <ellipse cx={LADLE_X} cy={RIM_Y + 6} rx={RIM_RX * 0.35} ry={16} fill={SIMC.pad} opacity={0.35} />
        <text x={LADLE_X} y={RIM_Y + 110} textAnchor="middle" fontFamily={F.body} fontWeight={800} fontSize={34} fill={SIMC.deckDark}>virtual target</text>
        <RobotSide pose={pose} scale={S} finish="SIM" />
        {miss > 0 && (
          <g transform={`translate(${LADLE_X - 150} ${RIM_Y - 120}) scale(${0.6 + 0.4 * miss})`} opacity={miss}>
            <rect x={-90} y={-40} width={180} height={80} rx={18} fill={C.coral} stroke={C.ink} strokeWidth={5} />
            <text x={0} y={18} textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={52} fill="#fff">MISS</text>
          </g>
        )}
      </Svg>
    </Layer>
  </>
  );
};

/** Flat leap used for the reference-motion beat (human reference and robot imitation share the same plan). */
const LEAP = 380;
const leapPlan = (x: number, ground: number, scale: number): JumpPlan => ({crouchAt: 6, takeoff: 18, entry: 40, edgeX: x, groundY: ground, target: {x: x + LEAP, y: ground}, scale, apex: 110});
const leap = (g: number, t0: number, x: number, ground: number, scale: number): RobotPose => {
  const period = 70;
  const t = ((g - t0) % period + period) % period;
  const J = leapPlan(x, ground, scale);
  if (t < J.entry) return jumpPose(t, J).pose;
  const land = standPose(x + LEAP, ground, scale, g);
  const u = Math.min(1, (t - J.entry) / 6);
  return {...land, y: land.y + 10 * (1 - u)};
};

export const S4Train: React.FC = () => {
  const g = useG();
  const c = trainCues();
  const cam0: Cam = {cx: 1180, cy: 560, zoom: 1.45};

  // ---- phase A: real close-up -> simulation wipe (start .. thousands)
  const wipe = tw(g, c.wipe, 26, E.inOut);
  const noSign = tw(g, c.noRehearse, 12, E.back) * (1 - tw(g, c.wipe, 10));
  const showA = g < c.thousands + 22;

  // ---- phase B: grid of lanes (thousands .. great)
  const shrink = tw(g, c.thousands, 22, E.inOut); // big sim world shrinks into the focus lane
  const gridIn = (i: number) => tw(g, c.thousands + 6 + (Math.abs((i % COLS) - 1) + Math.abs(Math.floor(i / COLS) - 1)) * 3, 12, E.back);
  const lane0 = laneXY(FOCUS);
  const focusRect = frameRect(lane0.x, lane0.y, lane0.x + LW, lane0.y + LH, 40);
  const gridCam = camPath(g, {cx: 960, cy: 540, zoom: 1}, [
    {at: c.score - 4, dur: 22, to: {...focusRect, cx: focusRect.cx + 330 / focusRect.zoom}},
    {at: c.nudge - 2, dur: 22, to: {cx: 960, cy: 540, zoom: 1}},
    {at: c.great - 6, dur: 22, to: {...focusRect, cx: focusRect.cx + 300 / focusRect.zoom}},
  ]);
  const skill = kf(g, [[c.thousands, 0.12], [c.again, 0.25], [c.again + 70, 0.92]]);
  const fast = g > c.again ? (g - c.again) * 1.4 : 0; // lanes run faster during "millions of times"
  const panel = tw(g, c.nudge + 6, 14, E.back) * (1 - tw(g, c.again - 4, 12, E.in));
  const counter = tw(g, c.again, 10) * (1 - tw(g, c.great - 8, 8));
  const count = g < c.again ? 0 : Math.min(3_000_000, Math.pow((g - c.again) / 66, 2.2) * 3_000_000);
  const scoreCard = tw(g, c.score + 6, 14, E.back) * (1 - tw(g, c.nudge - 4, 10, E.in));
  const showB = g >= c.thousands && g < c.stunt + 10;
  // incident report beat
  const report = tw(g, c.report - 4, 14, E.back) * (1 - tw(g, c.stunt - 6, 10, E.in));
  const stamp = tw(g, atEnd('report.') - 4, 6, E.out);
  const clerk = tw(g, c.great + 4, 16, E.out) * (1 - tw(g, c.stunt - 6, 10, E.in));

  // ---- phase C: reference motion (stunt .. policy)
  const showC = g >= c.stunt - 10 && g < c.policy + 12;
  const cIn = tw(g, c.stunt - 10, 18) * (1 - tw(g, c.policy - 4, 14));
  const styleCard = tw(g, c.style, 14, E.back);

  // ---- phase D: policy loop + reflex (policy .. end)
  const showD = g >= c.policy - 6;
  const dIn = tw(g, c.policy - 6, 16);
  const bPolicy = tw(g, c.policy + 4, 14, E.back);
  const bSenses = tw(g, c.senses, 14, E.back);
  const bMotor = tw(g, c.motor, 14, E.back);
  const loopOn = tw(g, c.motor + 10, 10);
  const loopSpeed = g < c.many ? 1 / 40 : 1 / 14;
  const loopU = g < c.many ? (g - c.motor) / 40 : (c.many - c.motor) / 40 + (g - c.many) / 14;
  const wishB = tw(g, c.wish, 10, E.back);
  const planB = tw(g, c.plan, 10, E.back);
  const xWish = tw(g, c.wish + 8, 6), xPlan = tw(g, c.plan + 8, 6);
  const diagramDim = 1 - 0.65 * tw(g, c.wish - 6, 12);
  const reflexCard = tw(g, c.reflex + 6, 14, E.back);
  // hammer swing: wind up, strike at c.tap, recoil
  const hammerA = kf(g, [[c.reflex, -10], [c.tap - 8, 6, E.out], [c.tap, -54, E.in], [c.tap + 6, -40, E.out], [c.tap + 22, -10]]);
  const kick = g < c.tap ? 0 : kf(g, [[c.tap, 0], [c.tap + 5, 1, E.out], [c.tap + 16, 0, E.inOut]]);
  const robotD: RobotPose = (() => {
    const base = standPose(400, 940, 1.0, g, 0);
    if (kick <= 0) return base;
    const j = joints({...base});
    return {...base, hipN: base.hipN + 38 * kick, kneeN: Math.max(0, base.kneeN - 4 * kick), ankleN: j.legN.shinAng + 38 * kick};
  })();
  const kneeW = joints(robotD).legN.knee;
  const kneeKnee = joints(standPose(400, 940, 1.0, 0, 0)).legN.knee; // fixed pivot (the hammer does not follow the kick)

  return (
    <AbsoluteFill style={{background: SIMC.bg, overflow: 'hidden'}}>
      {/* B: the lane grid */}
      {showB && (
        <AbsoluteFill>
          <Camera cam={gridCam}>
            <Layer depth={1}>
              <Svg>
                {Array.from({length: COLS * ROWS}).map((_, i) => {
                  const p = laneXY(i);
                  const focusing = tw(g, c.score - 4, 12) * (1 - tw(g, c.nudge - 2, 12)) + tw(g, c.great - 6, 12);
                  const a = i === FOCUS ? 1 : gridIn(i) * (1 - 0.8 * Math.min(1, focusing));
                  if (a <= 0) return null;
                  const focused = i === FOCUS;
                  // the focused lane runs scripted attempts in sync with the narration
                  const forced = focused ? (g < c.nudge ? 'over' : g >= c.great - 10 ? 'flop' : undefined) : undefined;
                  const startAt = focused ? (g < c.nudge ? c.q1 - 10 : g >= c.great - 10 ? c.faces - 28 : undefined) : undefined;
                  return (
                    <g key={i} opacity={a} transform={`translate(${p.x + LW / 2} ${p.y + LH / 2}) scale(${0.8 + 0.2 * a}) translate(${-p.x - LW / 2} ${-p.y - LH / 2})`}>
                      <Lane x={p.x} y={p.y} w={LW} h={LH} g={g + fast} seed={i + 1} skill={skill} forced={forced} startAt={startAt === undefined ? undefined : startAt + fast} hold={focused} showMark={!focused} />
                    </g>
                  );
                })}
              </Svg>
            </Layer>
          </Camera>
          {/* scorecard */}
          {scoreCard > 0 && (
            <Card x={1140} y={250} w={700} h={560} opacity={scoreCard} scale={0.9 + 0.1 * scoreCard} pad={40}>
              <Headline size={52}>Attempt score</Headline>
              {[['Stayed balanced?', c.q1, true], ['Clean push-off?', c.q2, true], ['Landed on target?', c.q3, false]].map(([label, t0, ok], i) => {
                const a = tw(g, (t0 as number) + 2, 10, E.back);
                return (
                  <div key={i} style={{position: 'relative', marginTop: 34, height: 80, display: 'flex', alignItems: 'center', fontSize: 42, fontWeight: 800, opacity: 0.35 + 0.65 * a}}>
                    {label as string}
                    <Mark ok={ok as boolean} x={520} y={4} size={72} opacity={a} scale={0.7 + 0.3 * a} />
                  </div>
                );
              })}
              <div style={{marginTop: 26, fontFamily: F.display, fontSize: 56, fontWeight: 700, opacity: tw(g, c.q3 + 16, 10)}}>Score: 2 / 3</div>
            </Card>
          )}
          {/* controls panel */}
          {panel > 0 && (
            <Card x={1180} y={250} w={660} h={600} opacity={panel} scale={0.9 + 0.1 * panel} pad={40} bg={C.white}>
              <Headline size={48}>The controls get nudged</Headline>
              <div style={{fontSize: 30, fontWeight: 700, color: C.inkSoft, marginTop: 10}}>toward whatever scored well</div>
              {[['push strength', 0.42, 0.55, 20], ['take-off timing', 0.6, 0.48, 38], ['arm swing', 0.3, 0.41, 56]].map(([label, v0, v1, dt], i) => {
                const k = tw(g, c.nudge + (dt as number), 12, E.back);
                return <Slider key={i} label={label as string} value={(v0 as number) + ((v1 as number) - (v0 as number)) * k} ghost={v0 as number} x={40} y={200 + i * 120} w={560} />;
              })}
              <div style={{position: 'absolute', left: 40, bottom: 30, fontSize: 24, fontWeight: 800, color: C.inkMuted}}>illustrative controls</div>
            </Card>
          )}
          {counter > 0 && (
            <div style={{position: 'absolute', left: 0, right: 0, top: 110, display: 'flex', justifyContent: 'center', opacity: counter}}>
              <div style={{background: C.ink, color: C.paper, borderRadius: 18, padding: '12px 30px', fontFamily: F.mono, fontSize: 44, fontWeight: 700}}>
                attempt {fmt(count)}{count >= 3_000_000 ? '+' : ''} <span style={{fontFamily: F.body, fontSize: 24, opacity: 0.8}}>(illustrative)</span>
              </div>
            </div>
          )}
          {/* the incident report gag */}
          {clerk > 0 && (
            <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, opacity: clerk, transform: `translateX(${(1 - clerk) * 120}px)`}}>
              <Character look={CAST.clerkA} pose={g < c.report ? P({lookX: -0.8, brows: 0.4}) : P({armL: {a: 30, b: 85}, armR: {a: 30, b: 85}, brows: 0.9, mouth: 'flat', lookX: -0.4})} frame={g} x={1730} y={1030} scale={1.1} seed={7} flip />
            </div>
          )}
          {report > 0 && (
            <Card x={1010} y={150} w={500} h={560} bg="#FFFDF6" rot={2} opacity={report} scale={0.85 + 0.15 * report} pad={34}>
              <div style={{fontFamily: F.mono, fontSize: 30, fontWeight: 700}}>INCIDENT REPORT</div>
              {['Date', 'Robot', 'What fell', 'Injuries'].map((l, i) => (
                <div key={i} style={{marginTop: 30, fontSize: 30, fontWeight: 700, color: C.inkSoft, borderBottom: `3px solid ${C.paperLine}`, paddingBottom: 6}}>{l}:</div>
              ))}
              <div style={{position: 'absolute', left: 110, top: 300, transform: `rotate(-14deg) scale(${1.6 - 0.6 * stamp})`, opacity: stamp, border: `6px solid ${C.coral}`, color: C.coral, borderRadius: 12, padding: '6px 22px', fontFamily: F.display, fontWeight: 700, fontSize: 64}}>FILED: 0</div>
            </Card>
          )}
          <IllusTag text="SIMULATION · illustration" tone="blue" />
        </AbsoluteFill>
      )}

      {/* A: real close-up, sim revealed by a wipe */}
      {showA && (
        <AbsoluteFill style={{transform: `translate(${lane0.x * shrink}px, ${lane0.y * shrink}px) scale(${1 - shrink * (1 - LW / 1920)})`, transformOrigin: '0 0', opacity: 1 - tw(g, c.thousands + 16, 6), overflow: 'hidden', borderRadius: 14 * shrink / (1 - shrink * (1 - LW / 1920) + 1e-6)}}>
          {wipe < 1 && (
            <AbsoluteFill>
              <Camera cam={cam0}><RealClose g={g} /></Camera>
            </AbsoluteFill>
          )}
          <AbsoluteFill style={{clipPath: `inset(0 ${(1 - wipe) * 100}% 0 0)`}}>
            <Camera cam={cam0}><SimClose g={g} tryAt={c.how - 4} /></Camera>
          </AbsoluteFill>
          {wipe > 0 && wipe < 1 && <div style={{position: 'absolute', left: wipe * 1920 - 6, top: 0, width: 12, height: 1080, background: C.blue, boxShadow: `0 0 0 4px ${C.blueLight}`}} />}
          {noSign > 0 && (
            <Card x={1150} y={760} w={640} h={170} bg={C.coralLight} rot={-2} opacity={noSign} scale={0.85 + 0.15 * noSign} pad={26}>
              <Headline size={46}>Practice runs in a real furnace: 0</Headline>
            </Card>
          )}
          {wipe < 0.5 ? <IllusTag /> : <IllusTag text="SIMULATION · illustration" tone="blue" opacity={1 - Math.min(1, shrink * 4)} />}
          {g > at('new AI model') - 6 && g < c.how + 4 && (
            <Card x={1110} y={80} w={720} h={200} bg={C.white} opacity={tw(g, at('new AI model') - 6, 12, E.back) * (1 - tw(g, c.how - 6, 10))} pad={28}>
              <Chip tone="ink" size={24}>FIGURE SAYS</Chip>
              <Headline size={50} style={{marginTop: 12}}>A new AI model, trained in simulation</Headline>
            </Card>
          )}
        </AbsoluteFill>
      )}

      {g >= c.how && g < c.stunt && (
        <div style={{position: 'absolute', left: 0, right: 0, top: 36, display: 'flex', justifyContent: 'center', opacity: tw(g, c.how, 12) * (1 - tw(g, c.stunt - 12, 10))}}>
          <Chip tone="blue" size={30}>HOW THIS KIND OF TRAINING GENERALLY WORKS · not Figure’s data</Chip>
        </div>
      )}

      {/* C: reference motion */}
      {showC && (
        <AbsoluteFill style={{opacity: cIn}}>
          <SimBackdrop horizon={760} />
          <Svg>
            <rect x={-100} y={800} width={2200} height={400} fill={SIMC.deck} opacity={0.5} />
            {[[120, '#5A4B78'], [1000, C.blue]].map(([x0, col], k) => {
              const J = leapPlan(x0 as number, 800, 0.8);
              const pts = Array.from({length: 23}).map((_, i) => jumpPose(J.takeoff + i, J).pose);
              return <polyline key={k} points={pts.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke={col as string} strokeWidth={6} strokeDasharray="4 14" strokeLinecap="round" opacity={0.7} />;
            })}
            {/* the reference arc, copied onto the robot's side */}
            {(() => {
              const J = leapPlan(1000, 800, 0.8);
              const pts = Array.from({length: 23}).map((_, i) => jumpPose(J.takeoff + i, J).pose);
              return <polyline points={pts.map((p) => `${p.x},${p.y - 18}`).join(' ')} fill="none" stroke="#5A4B78" strokeWidth={4} strokeDasharray="2 12" strokeLinecap="round" opacity={0.6 * tw(g, c.stunt + 30, 20)} />;
            })()}
            {[10, 5].map((d, i) => <RobotSide key={`h${i}`} pose={leap(g - d, c.stunt - 10, 120, 800, 0.8)} scale={0.8} finish="HUMAN" opacity={0.18 + i * 0.12} />)}
            <RobotSide pose={leap(g, c.stunt - 10, 120, 800, 0.8)} scale={0.8} finish="HUMAN" />
            {[10, 5].map((d, i) => <RobotSide key={`r${i}`} pose={leap(g - 6 - d, c.stunt - 10, 1000, 800, 0.8)} scale={0.8} finish="GHOST" opacity={0.7} />)}
            <RobotSide pose={leap(g - 6, c.stunt - 10, 1000, 800, 0.8)} scale={0.8} finish="SIM" />
          </Svg>
          <div style={{position: 'absolute', left: 90, top: 870}}><Chip tone="ink" size={32}>stunt performer’s movement · the reference</Chip></div>
          <div style={{position: 'absolute', left: 990, top: 870}}><Chip tone="blue" size={32}>virtual robot learning to match it</Chip></div>
          {styleCard > 0 && (
            <Card x={660} y={90} w={640} h={190} bg={C.saffronLight} rot={-2} opacity={styleCard} scale={0.85 + 0.15 * styleCard} pad={30}>
              <div style={{fontFamily: F.display, fontWeight: 700, fontSize: 50}}>STYLE GUIDE</div>
              <div style={{fontSize: 34, fontWeight: 800, marginTop: 8, whiteSpace: 'nowrap'}}>What a good leap looks like</div>
            </Card>
          )}
          <IllusTag text="ILLUSTRATION · generic performer, not real motion data" tone="blue" />
        </AbsoluteFill>
      )}

      {/* D: policy loop and reflex */}
      {showD && (
        <AbsoluteFill style={{background: C.paper, opacity: dIn}}>
          <Svg>
            <rect x={-100} y={940} width={2200} height={200} fill={C.paperDeep} />
            <RobotSide pose={robotD} scale={1} />
            {g > c.reflex && <ReflexHammer x={kneeKnee.x + 165} y={kneeKnee.y + 95} angle={hammerA} />}
            {/* loop arrows */}
            <g opacity={diagramDim * loopOn}>
              <path d="M 560 420 C 640 320 700 300 800 300" fill="none" stroke={C.inkSoft} strokeWidth={6} strokeDasharray="14 12" />
              <path d="M 1200 330 C 1300 340 1340 380 1380 430" fill="none" stroke={C.inkSoft} strokeWidth={6} strokeDasharray="14 12" />
              <path d="M 1420 640 C 1380 720 1300 760 1200 770" fill="none" stroke={C.inkSoft} strokeWidth={6} strokeDasharray="14 12" />
              <path d="M 800 790 C 700 790 640 760 560 700" fill="none" stroke={C.inkSoft} strokeWidth={6} strokeDasharray="14 12" />
              {(() => {
                const p = alongLoop([[540, 560], [800, 300], [1200, 330], [1420, 520], [1200, 770], [800, 790]], loopU);
                return <circle cx={p.x} cy={p.y} r={16} fill={C.saffron} stroke={C.ink} strokeWidth={4} />;
              })()}
            </g>
          </Svg>
          <div style={{opacity: diagramDim}}>
            <Card x={800} y={210} w={400} h={190} bg={C.tealLight} opacity={bSenses} scale={0.85 + 0.15 * bSenses} pad={24}>
              <Headline size={44}>SENSES</Headline>
              <div style={{fontSize: 28, fontWeight: 800, marginTop: 8}}>joint angles · balance · cameras</div>
            </Card>
            <Card x={1330} y={420} w={480} h={220} bg={C.saffronLight} opacity={bPolicy} scale={0.85 + 0.15 * bPolicy} pad={26}>
              <Headline size={50}>POLICY</Headline>
              <div style={{fontSize: 30, fontWeight: 800, marginTop: 8, opacity: tw(g, at('a learned rule'), 10)}}>a learned rule</div>
            </Card>
            <Card x={800} y={680} w={400} h={190} bg={C.blueLight} opacity={bMotor} scale={0.85 + 0.15 * bMotor} pad={24}>
              <Headline size={40}>MOTOR COMMANDS</Headline>
              <div style={{fontSize: 28, fontWeight: 800, marginTop: 8}}>to every joint</div>
            </Card>
            <div style={{position: 'absolute', left: 1360, top: 690, opacity: tw(g, c.many, 10)}}><Chip tone="ink" size={28}>many times a second</Chip></div>
          </div>
          {/* not a wish, not a plan */}
          {wishB > 0 && (
            <div style={{position: 'absolute', left: 560, top: 120, opacity: wishB, transform: `scale(${0.8 + 0.2 * wishB})`}}>
              <svg width={360} height={220} style={{overflow: 'visible'}}>
                <path d="M 40 110 Q 20 40 110 40 Q 150 0 220 30 Q 330 20 320 100 Q 340 180 240 180 Q 180 220 110 180 Q 20 190 40 110 Z" fill={C.white} stroke={C.ink} strokeWidth={5} />
                <circle cx={30} cy={210} r={12} fill={C.white} stroke={C.ink} strokeWidth={4} />
                <text x={180} y={124} textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={54} fill={C.ink}>a wish</text>
                <path d={`M 70 60 L ${70 + 220 * xWish} ${60 + 100 * xWish}`} stroke={C.coral} strokeWidth={12} strokeLinecap="round" />
              </svg>
            </div>
          )}
          {planB > 0 && (
            <div style={{position: 'absolute', left: 980, top: 140, opacity: planB, transform: `scale(${0.8 + 0.2 * planB}) rotate(3deg)`}}>
              <svg width={320} height={200} style={{overflow: 'visible'}}>
                <rect x={10} y={10} width={300} height={170} rx={16} fill={C.cream} stroke={C.ink} strokeWidth={5} />
                <text x={160} y={112} textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={54} fill={C.ink}>a plan</text>
                <path d={`M 40 40 L ${40 + 240 * xPlan} ${40 + 110 * xPlan}`} stroke={C.coral} strokeWidth={12} strokeLinecap="round" />
              </svg>
            </div>
          )}
          {reflexCard > 0 && (
            <Card x={1180} y={760} w={640} h={200} bg={C.saffron} rot={-1.5} opacity={reflexCard} scale={0.85 + 0.15 * reflexCard} pad={30}>
              <Headline size={52}>A well-rehearsed reflex</Headline>
            </Card>
          )}
          <IllusTag text="DIAGRAM · simplified" x={48} y={40} />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
