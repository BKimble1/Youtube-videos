import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, F, OUTLINE} from '../theme';
import type {Sfx} from '../lib/sfx';
import {useG} from '../lib/SceneFrame';
import {at, scene, segEnd} from '../lib/timeline';
import {E, SNAP, SOFT, sp, tw} from '../lib/motion';
import {rand} from '../lib/anim';
import type {Cam} from '../lib/camera';
import {CAM_PLAN_ACT} from '../lib/shots';
import {CAST} from '../components/cast';
import {Character2, EXPR, IDLE2, reach2, withPose, type Pose2} from '../components/v02/Cast2';
import {HandheldSensor} from '../components/v02/HandheldSensor';
import {SensorStand} from '../components/v02/S6_Stand';
import {PulseDot} from '../components/v02/Optics';
import {ROOM_COLORS} from '../components/v02/RoomSet';
import {FULL_GEO, cardGeo, lerpGeo, planPx, planToScreen, type PanelGeo} from '../components/v02/S6_PlanView';
import {ArrivalTimeline} from '../components/v2k/ArrivalTimeline';
import {QuestionTitle} from '../components/v2k/QuestionTitle';
import {Overlay, SubLabel} from '../components/v2k/Labels';
import {DotModule} from '../components/v2s/V7_Props';
import {LIKELY_DIM} from '../components/v02/S4_Parts';
import {TightShot} from '../components/v2s/V7_Plinth';
import {CLOUD_A, DIM_CLOUDS, HandoffChip, N_FRAMES, P, V8PlanStage, W2, W3, type V8PlanState} from '../components/v2s/V8_Plan';

/**
 * V8 · Small-sensor problems (n17, n18, s33). v2/SHOTPLAN_V2.md V8; adapted from v1 S6.3 (dim beam, research module,
 * the lift and jiggle, re-cut as single full-frame beats) and S6.4 (the night-mode frame stack).
 *
 *  In    V7's last frames: the tight spotlight on the kit sensor standing on the fourth plinth (V7_Plinth TightShot).
 *  V8.1  n17 The same tight spotlight, held. Question title "Why is a cheap sensor harder?" (64) for the spoken
 *        question only.
 *  V8.2  n18 Three full-frame beats, one problem at a time (no stacked cards):
 *        (1) "Weak lasers mean fainter echoes": the shared arrival timeline (not to scale); a dim beam leaves the
 *            sensor icon; on "fainter" the saffron echo shrinks to 40 % (hiddenScale). "weak laser → fainter echo" (64).
 *        (2) "The team's smartphone-grade device had about a hundred pixels": the drawn research device; its dot field
 *            (uncountable, about a hundred; no grid size) pops in on "about a hundred"; "≈ 100 pixels (their
 *            phone-grade device)" (48); the dots ripple ("listening"). Then for about 1.5 s, the V5.7 callback in our
 *            plan: its listening spots bunched on the small wall patch W2..W3, their bands, and the long, blurry
 *            patch; "bunched spots → blurry" (48), chip "illustration" (30).
 *        (3) "And if you hold one in your hand, it jiggles": a room cut-in; the checker reaches, grips and lifts her
 *            sensor off its stand (hand contact), it wobbles on "jiggles" and settles. "handheld → jiggle" (48).
 *  V8.3  s33 Six dim, grainy plan frames pop in (one shutter click each) scattered, slide into a stack on "stack", and
 *        merge into one clearer card on "into one"; "our analogy: night mode" (40). On "estimate" the card grows into
 *        the full-frame plan; the combined estimate fades off it as it lands.
 *  Out   V8's last frame = V9's first: full-frame plan at CAM_PLAN_ACT (RoomSet tilt 1, FULL_GEO), his token at H_A,
 *        the sensor on its tripod at frame A, nothing else on the floor, chip "illustration" (30) top-left (V8_Plan).
 */

/* ================================================================== cues */

const SC = scene('V8');
const K = {
  start: SC.from,
  end: SC.to,
  // n17
  why: at('n17', 'Why'),
  n17end: segEnd('n17'),
  // n18
  weak: at('n18', 'Weak'),
  fainter: at('n18', 'fainter'),
  teams: at('n18', "team's"),
  about: at('n18', 'about'),
  pixels: at('n18', 'pixels'),
  hundred2: at('n18', 'hundred', 2),
  listening: at('n18', 'listening'),
  and: at('n18', 'And'),
  hold: at('n18', 'hold'),
  hand: at('n18', 'hand'),
  jiggles: at('n18', 'jiggles'),
  // s33
  their: at('s33', 'Their'),
  night: at('s33', 'night'),
  cameras: at('s33', 'cameras'),
  stack: at('s33', 'stack'),
  into: at('s33', 'into'),
  estimate: at('s33', 'estimate'),
};

/* ================================================================== beats */

const TITLE_TO = K.n17end + 8;
const CUT1 = Math.max(TITLE_TO, K.weak - 4); // → beat 1 (timeline)
// beat 1
const BEAM0 = K.weak;
const BEAM_DUR = 10;
const PULSE0 = BEAM0 + 2;
const PULSE_DUR = 16;
const SHRINK0 = K.fainter - 2;
const SHRINK_DUR = 16;
const CUT2 = K.teams - 3; // → beat 2 (the research device)
// beat 2
const DOTS0 = CUT2 + 6; // the device arrives with its dot field (no empty window)
const DOTS_DUR = 20;
const LBL2 = K.about;
const LISTEN0 = Math.max(DOTS0 + DOTS_DUR + 2, K.pixels + 8);
const CUT3 = Math.max(LISTEN0 + 18, K.hundred2 - 2); // → the plan callback
const CUT4 = K.and - 2; // → beat 3 (the lift)
// the plan callback
const WEDGE0 = CUT3;
const BUNCH0 = CUT3;
const BANDS0 = CUT3 + 4;
const PATCH0 = CUT3 + 12;
// beat 3
const REACH0 = K.hold - 12;
const GRAB = K.hold + 2;
const LIFT_DUR = 12;
const JIG0 = K.jiggles - 2;
const CUT5 = K.their - 2; // → V8.3
// V8.3
const SHOT_T = Array.from({length: N_FRAMES}, (_, k) => Math.round(CUT5 - 2 + ((K.cameras - CUT5 + 2) * k) / (N_FRAMES - 1)));
const STACK0 = K.stack;
const STACK_DUR = 16;
const MERGE0 = K.into - 10; // the stack merges on "frames into one", so the clearer estimate holds about a second before the grow
const MERGE_DUR = 14;
const CLEAR0 = MERGE0 + 8;
const GROW0 = Math.max(CLEAR0 + 14, K.estimate);
const GROW_DUR = Math.max(10, Math.min(14, K.end - 3 - GROW0));
const GROW_END = GROW0 + GROW_DUR;
const CLOUD_OUT0 = GROW0 + Math.round(GROW_DUR * 0.4);

{
  const order: [string, number][] = [
    ['start', K.start], ['CUT1', CUT1], ['SHRINK0', SHRINK0], ['CUT2', CUT2], ['DOTS0', DOTS0], ['LISTEN0', LISTEN0], ['CUT3', CUT3], ['CUT4', CUT4],
    ['GRAB', GRAB], ['JIG0', JIG0], ['CUT5', CUT5], ['STACK0', STACK0], ['MERGE0', MERGE0], ['GROW0', GROW0], ['GROW_END', GROW_END], ['end', K.end],
  ];
  for (let i = 1; i < order.length; i++) if (!(order[i][1] > order[i - 1][1])) throw new Error(`V8: beat ${order[i][0]} (${order[i][1]}) is not after ${order[i - 1][0]} (${order[i - 1][1]})`);
  if (!(CUT4 - CUT3 >= 40)) throw new Error(`V8.2: the bunched-spots callback gets ${CUT4 - CUT3} frames (shot plan: about 1.5 s)`);
  if (!(K.end - GROW_END >= 2)) throw new Error('V8.3: the hand-off frame must hold at least 2 frames');
  if (!(STACK0 > SHOT_T[N_FRAMES - 1] + 8)) throw new Error('V8.3: the stack starts before the last frame has landed');
}

/* ================================================================== helpers */

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** A one-line label whose second part fades into space reserved from the start (the settled label never moves). */
const TwoPart: React.FC<{x: number; y: number; size: number; a: string; b: string; ta: number; tb: number; anchor?: 'start' | 'middle'}> = ({x, y, size, a, b, ta, tb, anchor = 'start'}) =>
  ta <= 0.001 ? null : (
    <Overlay>
      <text x={x} y={y} textAnchor={anchor} fontFamily={F.body} fontWeight={800} fontSize={size} fill={C.ink} stroke={C.white} strokeWidth={Math.max(6, size * 0.14)} strokeLinejoin="round" paintOrder="stroke" opacity={clamp01(ta)}>
        {a}
        <tspan opacity={clamp01(tb)}>{b}</tspan>
      </text>
    </Overlay>
  );

/* ================================================================== V8.1 · the tight spotlight */

const ShotQuestion: React.FC<{g: number}> = ({g}) => <TightShot screen={<QuestionTitle text="Why is a cheap sensor harder?" from={K.why} to={TITLE_TO} frame={g} />} />;

/* ================================================================== V8.2 (1) · weak laser → fainter echo */

/** Flat sensor icon facing right (the ArrivalTimeline route strip's icon), and its dim beam. */
const BEAM = {x: 250, y: 196, x1: 660, k: 1.4};
const ShotWeak: React.FC<{g: number}> = ({g}) => {
  const beam = tw(g, BEAM0, BEAM_DUR, E.out);
  const pu = tw(g, PULSE0, PULSE_DUR, E.linear);
  const shrink = tw(g, SHRINK0, SHRINK_DUR, E.inOut);
  const x0 = BEAM.x + 44 * BEAM.k;
  const xb = lerp(x0, BEAM.x1, beam);
  return (
    <AbsoluteFill style={{background: C.paper}}>
      <ArrivalTimeline wall={1} hidden={1} hiddenScale={1 - 0.6 * shrink} labels={1} notToScale={1} bg />
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        {/* the dim beam: a pale, thin wedge, and one faint pulse along it */}
        {beam > 0.001 && <path d={`M ${x0} ${BEAM.y - 8} L ${xb} ${BEAM.y - 8 - 26 * beam} L ${xb} ${BEAM.y + 8 + 26 * beam} L ${x0} ${BEAM.y + 8} Z`} fill={C.saffronLight} opacity={0.55} />}
        {beam > 0.001 && <line x1={x0} y1={BEAM.y} x2={xb} y2={BEAM.y} stroke={C.saffronDeep} strokeWidth={2.5} strokeDasharray="6 9" strokeLinecap="round" opacity={0.55} />}
        {pu > 0 && pu < 1 && <PulseDot x={lerp(x0 + 8, BEAM.x1 - 10, pu)} y={BEAM.y} r={11} intensity={0.25} opacity={0.75 * (1 - pu * 0.6)} />}
        <g transform={`translate(${BEAM.x} ${BEAM.y}) scale(${BEAM.k})`}>
          <rect x={-44} y={-30} width={80} height={60} rx={12} fill={C.teal} stroke={C.ink} strokeWidth={OUTLINE} />
          <rect x={24} y={-18} width={20} height={36} rx={7} fill={beam > 0 && pu < 0.3 ? C.saffronLight : C.coral} stroke={C.ink} strokeWidth={3} />
          <circle cx={-14} cy={0} r={13} fill={C.cream} stroke={C.ink} strokeWidth={3} />
          <circle cx={-14} cy={0} r={5} fill={C.ink} />
        </g>
      </svg>
      <TwoPart x={700} y={218} size={64} a="weak laser" b=" → fainter echo" ta={tw(g, BEAM0 + 2, 6, E.linear)} tb={tw(g, K.fainter, 6, E.linear)} />
    </AbsoluteFill>
  );
};

/* ================================================================== V8.2 (2) · about a hundred pixels; bunched spots */

const MODULE_AT = {x: 430, y: 520, scale: 1.55};
const ShotModule: React.FC<{g: number}> = ({g}) => {
  const dots = tw(g, DOTS0, DOTS_DUR, E.linear);
  const listen = tw(g, LISTEN0, CUT3 - LISTEN0, E.linear);
  // the leader to the dot window's right edge (module-local window: x ±98, y −169..27)
  const win = {x: MODULE_AT.x + 106 * MODULE_AT.scale, y: MODULE_AT.y - 71 * MODULE_AT.scale};
  return (
    <AbsoluteFill style={{background: C.paper}}>
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <DotModule x={MODULE_AT.x} y={MODULE_AT.y} scale={MODULE_AT.scale} dots={dots} listen={listen} />
      </svg>
      <SubLabel x={760} y={440} opacity={tw(g, LBL2, 6, E.linear)} leader={{x: win.x, y: win.y, gap: 10}}>
        ≈ 100 pixels (their phone-grade device)
      </SubLabel>
    </AbsoluteFill>
  );
};

/** The V5.7 framing (G3 V5 CAM_NEAR): plan x 1.5 m at screen x 480, the wall (z 0) at y 340, zoom 1.5. */
const CAM_BUNCH: Cam = (() => {
  const a = planPx(P(1.5, 0));
  const zoom = 1.5;
  return {cx: a.x - (480 - 960) / zoom, cy: a.y - (340 - 540) / zoom, zoom};
})();
const BUNCH_LBL = (() => {
  const w = planToScreen(FULL_GEO, CAM_BUNCH, P((W2.x + W3.x) / 2, 0));
  // above the wall's ruler ticks (their tops are about 85 px above the wall line here), never pierced by them
  return {x: w.x - 20, y: w.y - 112, target: {x: w.x, y: w.y - 14}};
})();
const ShotBunch: React.FC<{g: number}> = ({g}) => {
  const st: V8PlanState = {
    wedge: tw(g, WEDGE0, 6, E.linear),
    bunch: tw(g, BUNCH0, 8, E.linear),
    bands: tw(g, BANDS0, 8, E.linear),
    patch: tw(g, PATCH0, 10, E.linear),
  };
  return (
    <AbsoluteFill style={{background: C.paper}}>
      <V8PlanStage geo={FULL_GEO} cam={CAM_BUNCH} state={st} />
      <HandoffChip />
      <SubLabel x={BUNCH_LBL.x} y={BUNCH_LBL.y} opacity={tw(g, CUT3 + 2, 6, E.linear)}>
        bunched spots → blurry
      </SubLabel>
    </AbsoluteFill>
  );
};

/* ================================================================== V8.2 (3) · handheld → jiggle (room cut-in) */

const FLOOR_Y = 900;
const SC_RIG = 1.75;
const CH = {x: 640, y: FLOOR_Y, scale: SC_RIG, seed: 4, life: 0.45};
/** the sensor's grip on its stand, and where she lifts it to (rig-local offsets of the v1 S6.3 card, scaled) */
const G0 = {x: CH.x + 158.2 * SC_RIG, y: FLOOR_Y - 207.3 * SC_RIG};
const G1 = {x: CH.x + 141.8 * SC_RIG, y: FLOOR_Y - 247.3 * SC_RIG};
const ShotJiggle: React.FC<{g: number}> = ({g}) => {
  const ch = {...CH, frame: g};
  // she glances at the sensor before she reaches, keeps her eyes on it through the wobble, then a dry blink
  const glance = tw(g, CUT4 + 2, 8, E.inOut);
  const base: Pose2 = withPose({...IDLE2, armsFront: 'R'}, {...EXPR.deadpan, lookX: 0.6 * glance, lookY: 0.35 * glance, tilt: 2 * glance});
  const pose0: Pose2 = {...base, lid: (base.lid ?? 0) + 0.14 * sp(g, JIG0 + 18, SOFT)};
  // a small wobble on "jiggles", decaying to still (settle)
  const jt = g - JIG0;
  const env = jt < 0 ? 0 : clamp01(jt / 3) * Math.exp(-jt * 0.11);
  const jrot = env * 8 * Math.sin(jt * 1.9);
  const jdx = env * 3.6 * Math.sin(jt * 2.7 + 0.5);
  const jdy = env * 2.6 * Math.sin(jt * 3.4 + 1.3);
  const lift = tw(g, GRAB + 2, LIFT_DUR, E.inOut);
  const target = {x: lerp(G0.x, G1.x, lift) + jdx * SC_RIG, y: lerp(G0.y, G1.y, lift) + jdy * SC_RIG};
  const grabbed = g >= GRAB;
  let armR = reach2(ch, pose0, 1, target.x, target.y, 1);
  if (!grabbed) {
    const r = tw(g, REACH0, GRAB - REACH0, E.inOut);
    const a1 = reach2(ch, pose0, 1, G0.x, G0.y, 1);
    armR = {a: lerp(IDLE2.armR.a, a1.a, r), b: lerp(IDLE2.armR.b, a1.b, r)};
  }
  const pose: Pose2 = {...pose0, armR};
  const sensorEl = <HandheldSensor scale={1} rotate={jrot} skin={CAST.checker.skin} led={1} reveal={1} />;
  const box = {x: target.x - 3 * SC_RIG, y: target.y - 79 * SC_RIG};
  const lines = env > 0.2 ? clamp01((env - 0.2) * 2.5) : 0;
  return (
    <AbsoluteFill style={{background: ROOM_COLORS.relayWall}}>
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
        <rect x={-10} y={FLOOR_Y - 42} width={1940} height={18} fill={ROOM_COLORS.skirting} stroke={C.ink} strokeWidth={3} />
        <rect x={-10} y={FLOOR_Y - 24} width={1940} height={240} fill={ROOM_COLORS.floor} stroke={C.ink} strokeWidth={OUTLINE} />
        {[FLOOR_Y + 30, FLOOR_Y + 80, FLOOR_Y + 140].map((y) => (
          <line key={y} x1={-10} y1={y} x2={1930} y2={y} stroke={ROOM_COLORS.plank} strokeWidth={3} opacity={0.6} />
        ))}
        <SensorStand x={G0.x} y={G0.y + 14 * SC_RIG} floorY={FLOOR_Y} k={SC_RIG} />
      </svg>
      <Character2 look={CAST.checker} pose={pose} frame={g} seed={CH.seed} x={CH.x} y={CH.y} scale={SC_RIG} life={CH.life} holdR={grabbed ? sensorEl : undefined} />
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        {!grabbed && (
          <g transform={`translate(${G0.x} ${G0.y}) scale(${SC_RIG})`}>
            <HandheldSensor scale={1} led={1} reveal={1} />
          </g>
        )}
        {lines > 0 && (
          <g fill="none" stroke={C.ink} strokeWidth={5} strokeLinecap="round" opacity={lines}>
            <path d={`M ${box.x - 108} ${box.y - 34} Q ${box.x - 128} ${box.y} ${box.x - 108} ${box.y + 34}`} />
            <path d={`M ${box.x - 134} ${box.y - 22} Q ${box.x - 148} ${box.y} ${box.x - 134} ${box.y + 22}`} />
            <path d={`M ${box.x + 118} ${box.y - 34} Q ${box.x + 138} ${box.y} ${box.x + 118} ${box.y + 34}`} />
            <path d={`M ${box.x + 144} ${box.y - 22} Q ${box.x + 158} ${box.y} ${box.x + 144} ${box.y + 22}`} />
          </g>
        )}
      </svg>
      <TwoPart x={1200} y={420} size={48} a="handheld" b=" → jiggle" ta={tw(g, GRAB, 6, E.linear)} tb={tw(g, JIG0, 6, E.linear)} />
    </AbsoluteFill>
  );
};

/* ================================================================== V8.3 · night mode */

const FW = 600;
const SCATTER = [
  {x: 110, y: 205, r: -4},
  {x: 660, y: 168, r: 3},
  {x: 1210, y: 212, r: -3},
  {x: 190, y: 560, r: 3},
  {x: 720, y: 590, r: -2},
  {x: 1215, y: 546, r: 4},
];
const PILE = {x: 660, y: 300};
const pileAt = (k: number) => ({x: PILE.x + (k - 2.5) * 7, y: PILE.y + (k - 2.5) * 6, r: (k % 2 === 0 ? -1 : 1) * 1.2});
const RESULT = {x: 410, y: 190, w: 1100}; // the clearer card, large enough that the combined estimate reads at phone width
const GRAIN = Array.from({length: N_FRAMES}, (_, k) =>
  Array.from({length: 90}, (_, i) => ({u: rand(k * 977 + i * 3 + 1), v: rand(k * 571 + i * 5 + 2), r: 2.2 + 2.2 * rand(k * 131 + i * 7 + 3), a: 0.35 + 0.45 * rand(k * 71 + i * 11 + 4)})),
);
const Grain: React.FC<{k: number; w: number; h: number}> = ({k, w, h}) => (
  <svg width={w} height={h} style={{position: 'absolute', left: 0, top: 0}}>
    {GRAIN[k].map((d, i) => (
      <circle key={i} cx={d.u * w} cy={d.v * h} r={d.r} fill={i % 3 === 0 ? C.cream : C.inkSoft} opacity={d.a} />
    ))}
  </svg>
);

/** "our analogy: night mode" (40): a cream pill with a small moon, top centre (lands with "night"). */
const NightLabel: React.FC<{t: number}> = ({t}) =>
  t <= 0.001 ? null : (
    <div style={{position: 'absolute', left: 960, top: 104, transform: 'translate(-50%, -50%)', opacity: clamp01(t), display: 'flex', alignItems: 'center', gap: 12, background: C.cream, border: `3px solid ${C.ink}`, borderRadius: 999, padding: '8px 26px 10px 18px', fontFamily: F.body, fontWeight: 800, fontSize: 40, color: C.ink, whiteSpace: 'nowrap', lineHeight: 1}}>
      <svg width={38} height={38} viewBox="-19 -19 38 38" style={{flex: 'none'}}>
        <path d="M 7 -15 A 15 15 0 1 0 14 8 A 11.5 11.5 0 1 1 7 -15 Z" fill={C.saffron} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
      </svg>
      our analogy: night mode
    </div>
  );

const ShotNight: React.FC<{g: number}> = ({g}) => {
  const grow = tw(g, GROW0, GROW_DUR, E.inOut);
  const frames = Array.from({length: N_FRAMES}, (_, k) => {
    const pop = sp(g, SHOT_T[k], SNAP);
    if (pop <= 0) return null;
    const st = tw(g, STACK0 + k * 2, STACK_DUR, E.inOut);
    const mg = tw(g, MERGE0 + (N_FRAMES - 1 - k), MERGE_DUR, E.inOut);
    const c = SCATTER[k];
    const pl = pileAt(k);
    const wBase = lerp(FW, RESULT.w, mg);
    const x = lerp(lerp(c.x, pl.x, st), RESULT.x, mg);
    const y = lerp(lerp(c.y, pl.y, st), RESULT.y, mg);
    const w = wBase * (0.9 + 0.1 * Math.min(1.05, pop));
    const rot = lerp(lerp(c.r, pl.r, st), 0, mg);
    const op = Math.min(1, (g - SHOT_T[k] + 1) / 3) * (1 - tw(g, CLEAR0 + 6, 8));
    if (op <= 0) return null;
    const geo = cardGeo(x + (wBase - w) / 2, y + ((wBase - w) * 9) / 32, w, 14);
    return (
      <V8PlanStage
        key={k}
        geo={geo}
        cam={CAM_PLAN_ACT}
        state={{cloud: {field: DIM_CLOUDS[k], t: 1}, guesser: LIKELY_DIM}}
        opacity={op}
        shadow={1}
        rot={rot}
        veil={
          <>
            <div style={{position: 'absolute', left: 0, top: 0, width: geo.w, height: geo.h, background: C.paperDeep, opacity: 0.55}} />
            <Grain k={k} w={geo.w} h={geo.h} />
          </>
        }
      />
    );
  });
  // the clearer card (the combined estimate), then it grows into the full-frame plan and the estimate leaves it
  const clear = tw(g, CLEAR0, 10);
  const card = cardGeo(RESULT.x, RESULT.y, RESULT.w, 16);
  const geo: PanelGeo = grow >= 1 ? FULL_GEO : lerpGeo(card, FULL_GEO, grow);
  const cloudT = 1 - tw(g, CLOUD_OUT0, GROW_END - CLOUD_OUT0, E.inOut);
  return (
    <AbsoluteFill style={{background: C.paper}}>
      {frames}
      {clear > 0.001 && <V8PlanStage geo={geo} cam={CAM_PLAN_ACT} state={{cloud: {field: CLOUD_A, t: cloudT}, guesser: lerp(1, LIKELY_DIM, cloudT), ring: cloudT * tw(g, CLEAR0 + 6, 8, E.linear), zoom: CAM_PLAN_ACT.zoom}} opacity={clear} shadow={1 - grow} />}
      <HandoffChip t={tw(g, SHOT_T[0], 8, E.linear)} />
      <NightLabel t={tw(g, K.night, 6, E.linear) * (1 - tw(g, GROW0, 8, E.linear))} />
    </AbsoluteFill>
  );
};

/* ================================================================== the scene */

export const V8SmallSensor: React.FC = () => {
  const g = useG();
  let shot: React.ReactNode;
  if (g < CUT1) shot = <ShotQuestion g={g} />;
  else if (g < CUT2) shot = <ShotWeak g={g} />;
  else if (g < CUT3) shot = <ShotModule g={g} />;
  else if (g < CUT4) shot = <ShotBunch g={g} />;
  else if (g < CUT5) shot = <ShotJiggle g={g} />;
  else shot = <ShotNight g={g} />;
  return <AbsoluteFill style={{background: C.paper}}>{shot}</AbsoluteFill>;
};

/* ================================================================== sound cue sheet */

// The trimmed vocabulary only (SHOTPLAN V8 sound: quieter bed, the pulse/return motif, a small rattle on the jiggle,
// shutter clicks on the stack); no pops for labels or merges.
export const SFX: Sfx[] = [
  {f: K.start, kind: 'amb_museum', dur: (CUT1 + 12 - K.start) / 30, note: 'the museum hall tone carries on under the tight spotlight'},
  {f: BEAM0, kind: 'sensor_pulse', gain: -12, note: 'a weak, dim pulse'},
  {f: SHRINK0 + 4, kind: 'echo_return', gain: -18, note: 'an even fainter echo'},
  {f: GRAB, kind: 'tiny_clink', gain: -8, pitch: 3, note: 'lifted off the stand'},
  {f: JIG0, kind: 'partition_wobble', gain: -8, pitch: 8, note: 'a small rattle on the jiggle'},
  ...SHOT_T.map((t, i): Sfx => ({f: Math.max(t, CUT5), kind: 'shutter_click', gain: -4 - (i % 2) * 2, pitch: (i % 3) - 1, note: `night-mode frame ${i + 1}`})),
];

/** Beat frames (global), for review and the lead's merge notes. */
export const V8_BEATS = {K, TITLE_TO, CUT1, BEAM0, SHRINK0, CUT2, DOTS0, LISTEN0, CUT3, PATCH0, CUT4, REACH0, GRAB, JIG0, CUT5, SHOT_T, STACK0, MERGE0, CLEAR0, GROW0, GROW_END, CLOUD_OUT0};
