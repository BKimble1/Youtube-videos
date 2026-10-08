import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C, OUTLINE} from '../theme';
import {CAST} from '../components/cast';
import {Character, reachLocal} from '../components/Character';
import {E, SNAP, hop, sp, tw} from '../lib/motion';
import layout from '../data/layout.json';
import {
  ARMS,
  ARMS_CROSSED,
  CROUCH,
  Character2,
  EXPR,
  HAND_OVER_MOUTH,
  HANDS_ON_HIPS,
  IDLE2,
  SNEAK_ARMS,
  handWorld2,
  mixPose2,
  mouthWorld,
  planTrip,
  reach2,
  settleAt,
  settlePose,
  tripDistance,
  tripPose,
  walkPose,
  withPose,
  type Pose2,
  type RigPlace,
} from '../components/v02/Cast2';
import {HandheldSensor, SensorTop, facingOf, sensorPoint} from '../components/v02/HandheldSensor';
import {CheckerToken, GuesserToken, tokenSize} from '../components/v02/Tokens';

/**
 * Dev composition for the Video 02 cast kit (240 f): the guesser tiptoes from x = 300 to x = 1200 behind a coral
 * stand-in partition (feet locked to the floor: phase from distance), settles into a smug hands-on-hips pose, then is
 * busted; the checker holds the HandheldSensor at chest height (right hand on the grip, left hand steadying the box,
 * both placed with reach2/handWorld2), deadpan, while its readout fills in. Then a cut to the plan view with both
 * overhead tokens and the SensorTop glyph at their layout.json positions.
 *
 * inputProps {sheet: 1 | 2} renders a static model sheet instead (QA only).
 */

const WALL = '#F4ECD8';
const FLOOR_Y = 800;

// staging
const GUE = {x0: 300, x1: 1200, y: 930, scale: 1};
const CHK: RigPlace = {x: 98, y: 868, scale: 0.88};
const PART = {x0: 792, x1: 908, top: 404, base: 958};

// where the checker's right hand holds the grip (character-local): chest height, in front of the right hip
const GRIP = {x: 40, y: -176};

// guesser beats
const PLAN = planTrip(GUE.x1 - GUE.x0, GUE.scale, 'tiptoe');
const T0 = 16; // starts tiptoeing
const FPS_STEP = 9;
const T1 = T0 + PLAN.steps * FPS_STEP; // arrives
const TB = 186; // busted
// checker / sensor beats
const SWEEP0 = 112;
const SWEEP1 = 166;
const BUMP = 170;
// plan view
const PLAN_IN = 204;

const sneakFace: Partial<Pose2> = {lid: 0.22, brows: -0.4, browAsym: 0.2, mouth: 'hmm', lookX: -0.8, lookY: 0.05, tilt: -4};

const guesserAt = (g: number): {x: number; pose: Pose2} => {
  const dist = tripDistance(g, T0, PLAN, FPS_STEP, 0.55);
  const walking = tripPose(dist, PLAN, {dir: 1, base: {...SNEAK_ARMS, ...sneakFace}});
  // scheming: hands together in front of the belly, rubbing, a sidelong look back at the checker
  const rub = Math.sin(g * 0.9) * 4 * (1 - tw(g, 4, 8));
  const start: Pose2 = {...IDLE2, armL: reachLocal(-12 + rub, -194, -1, -1), armR: reachLocal(12 + rub, -198, 1, -1), armsFront: 'both', mouth: 'smirk', lid: 0.3, lookX: -0.6, brows: -0.25, browAsym: 0.3};
  // anticipation: rise slightly, then sink into the sneak
  let pose = g < T0 ? mixPose2(start, walking, E.inOut(tw(g, 2, T0 - 2))) : walking;
  if (g < T0) pose = {...pose, bob: -4 * Math.sin(Math.PI * tw(g, 0, 8, E.inOut))};
  // arrival: off the toes, hands to hips, smug; then the weight settles onto the right leg
  const smug: Pose2 = withPose(withPose(HANDS_ON_HIPS, EXPR.smug), settleAt(g, T1 + 8, 1));
  const arrive = tw(g, T1 - 3, 16, E.inOut);
  if (arrive > 0) pose = mixPose2(pose, smug, arrive);
  // busted: wide eyes, small 'o', hands fly up with a snap, a little hop
  const kB = sp(g, TB, SNAP);
  if (g >= TB) {
    const busted: Pose2 = {...withPose(smug, {...ARMS.handsUp, ...EXPR.busted, lean: -2, shift: 0, lookX: -0.9}), feet: undefined};
    pose = mixPose2(pose, busted, Math.min(1.08, kB));
    pose = {...pose, bob: hop(g, TB, 16, 9)};
  }
  return {x: GUE.x0 + dist, pose};
};

const checkerAt = (g: number) => {
  // deadpan; glances at the readout during the sweep, then back out at us when the late bump shows
  const glance = Math.min(tw(g, SWEEP0 - 4, 10, E.inOut), 1 - tw(g, BUMP + 2, 8, E.inOut));
  const base: Pose2 = withPose({...IDLE2, armsFront: 'both'}, {...EXPR.deadpan, lookX: 0.55 * glance, lookY: 0.75 * glance, tilt: 3 * glance});
  const brow = sp(g, BUMP + 10, SNAP) * (1 - tw(g, BUMP + 40, 14));
  const pose0: Pose2 = {...base, brows: base.brows + 0.35 * brow, browAsym: 0.4 * brow};
  // right hand on the grip at chest height (world point), left hand under the box's bottom-left corner
  const grip = {x: CHK.x + GRIP.x * CHK.scale, y: CHK.y + GRIP.y * CHK.scale};
  const armR = reach2(CHK, pose0, 1, grip.x, grip.y, -1);
  const withR = {...pose0, armR};
  const hand = handWorld2(CHK, withR, 1);
  const bl = sensorPoint('boxBottomLeft', CHK.scale);
  const armL = reach2(CHK, withR, -1, hand.x + bl.x, hand.y + bl.y + 6 * CHK.scale, -1);
  return {pose: {...withR, armL}, hand};
};

const sensorState = (g: number) => {
  const reveal = tw(g, SWEEP0, SWEEP1 - SWEEP0, E.linear);
  const sweeping = g >= SWEEP0 && g < SWEEP1;
  const led = sweeping ? (Math.floor((g - SWEEP0) / 5) % 2 === 0 ? 1 : 0.25) : g >= SWEEP1 ? 1 : 0.2;
  const firing = sweeping ? Math.max(0, Math.sin(((g - SWEEP0) / 10) * Math.PI * 2)) : 0;
  return {reveal, led, firing, bumpHighlight: sp(g, BUMP, SNAP)};
};

/* ------------------------------------------------------------------ the frontal stage */

const Stage: React.FC<{g: number}> = ({g}) => {
  const gu = guesserAt(g);
  const ch = checkerAt(g);
  const sn = sensorState(g);
  const sensor = <HandheldSensor reveal={sn.reveal} led={sn.led} firing={sn.firing} bumpHighlight={sn.bumpHighlight} skin={CAST.checker.skin} />;
  return (
    <AbsoluteFill style={{background: WALL}}>
      {/* floor */}
      <div style={{position: 'absolute', left: 0, right: 0, top: FLOOR_Y, bottom: 0, background: C.woodLight, borderTop: `${OUTLINE}px solid ${C.ink}`}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: FLOOR_Y - 26, height: 26, background: C.paperDeep, borderTop: `${OUTLINE}px solid ${C.ink}`}} />
      {/* checker (upstage) */}
      <Character2 look={CAST.checker} pose={ch.pose} frame={g} seed={9} x={CHK.x} y={CHK.y} scale={CHK.scale} life={0.6} holdR={sensor} />
      {/* guesser */}
      <Character2 look={CAST.guesser} pose={gu.pose} frame={g} seed={22} x={gu.x} y={GUE.y} scale={GUE.scale} life={g < T1 ? 0.25 : 0.8} eyeDarts={false} />
      {/* stand-in partition (downstage of the guesser) */}
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
        <ellipse cx={(PART.x0 + PART.x1) / 2} cy={PART.base + 4} rx={70} ry={10} fill={C.shadow} />
        <rect x={PART.x0} y={PART.top} width={PART.x1 - PART.x0} height={PART.base - PART.top - 10} rx={8} fill={C.coral} stroke={C.ink} strokeWidth={OUTLINE} />
        <rect x={PART.x0 - 22} y={PART.base - 14} width={PART.x1 - PART.x0 + 44} height={14} rx={6} fill={C.coralDeep} stroke={C.ink} strokeWidth={OUTLINE} />
      </svg>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ the plan view */

const PPM = 230;
const PX0 = (1920 - 4.4 * PPM) / 2;
const PY0 = 130;
const toPx = (x: number, z: number) => ({x: PX0 + x * PPM, y: PY0 + z * PPM});

const PlanView: React.FC<{g: number}> = ({g}) => {
  const L = layout;
  const pop = (d: number) => 0.7 + 0.3 * E.back(tw(g, PLAN_IN + d, 14));
  const op = (d: number) => tw(g, PLAN_IN + d, 8);
  const occ = {a: toPx(L.occluder.x, L.occluder.z0), b: toPx(L.occluder.x, L.occluder.z1)};
  const opP = toPx(L.operator.x, L.operator.z);
  const sP = toPx(L.sensor.x, L.sensor.z);
  const hP = toPx(L.hidden.x, L.hidden.z);
  const wallTarget = toPx(1.6, 0);
  const face = facingOf(wallTarget.x - sP.x, wallTarget.y - sP.y);
  const room = {a: toPx(0, 0), b: toPx(4.4, 3.6)};
  const S = tokenSize(PPM);
  return (
    <AbsoluteFill style={{background: C.paperDeep}}>
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
        {/* floor of the room */}
        <rect x={room.a.x} y={room.a.y} width={room.b.x - room.a.x} height={room.b.y - room.a.y} fill={C.paper} />
        {/* relay wall: a heavy ink line with 0.5 m ticks along it */}
        {Array.from({length: 9}).map((_, i) => {
          const p = toPx(i * 0.5 + 0.2, 0);
          return <line key={i} x1={p.x} y1={p.y + 6} x2={p.x} y2={p.y + 22} stroke={C.inkMuted} strokeWidth={3} strokeLinecap="round" />;
        })}
        <line x1={room.a.x - 40} y1={room.a.y} x2={room.b.x + 40} y2={room.a.y} stroke={C.ink} strokeWidth={10} strokeLinecap="round" />
        {/* partition */}
        <rect x={occ.a.x - 10} y={occ.a.y} width={20} height={occ.b.y - occ.a.y} rx={6} fill={C.coral} stroke={C.ink} strokeWidth={OUTLINE} />
        {/* tokens + sensor glyph at their layout positions */}
        <g opacity={op(0)}>
          <CheckerToken x={opP.x} y={opP.y} size={S} facing={face} scale={pop(0)} asGroup />
        </g>
        <g opacity={op(4)}>
          <SensorTop x={sP.x} y={sP.y} size={S * 0.5} facing={face} scale={pop(4)} asGroup />
        </g>
        <g opacity={op(8)}>
          <GuesserToken x={hP.x} y={hP.y} size={S} facing={200} scale={pop(8)} asGroup />
        </g>
        {/* model sheet in the margins: the tokens big, next to the frontal heads they come from */}
        <g opacity={op(12)}>
          <CheckerToken x={200} y={300} size={210} facing={0} asGroup />
          <GuesserToken x={200} y={720} size={210} facing={0} asGroup />
          <SensorTop x={1720} y={300} size={150} facing={0} asGroup />
        </g>
      </svg>
      <div style={{opacity: op(12)}}>
        <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          <g transform="translate(1720 820) scale(1.6)">
            <HandheldSensor reveal={1} bumpHighlight={1} led={1} />
          </g>
        </svg>
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ QA model sheets (inputProps.sheet) */

const Sheet: React.FC<{which: number; g: number}> = ({which, g}) => {
  const s = 0.62;
  const y1 = 470;
  const y2 = 1010;
  const cols = [130, 340, 550, 760, 970, 1180, 1390, 1600, 1800];
  if (which === 1) {
    // guesser: walk phases, tiptoe phases, crouch, settle, peek, smug, busted, arms crossed, hand over mouth
    const walk = [0, 0.125, 0.25, 0.375, 0.5].map((ph) => walkPose(ph, {style: 'walk', dir: 1}));
    const tip = [0, 0.125, 0.25, 0.375].map((ph) => walkPose(ph, {style: 'tiptoe', dir: 1, base: {...SNEAK_ARMS, ...sneakFace}}));
    const row1 = [...walk, ...tip];
    const crouch = withPose(withPose(IDLE2, CROUCH), {...ARMS.sneak, armsFront: 'both', ...sneakFace});
    const settle = withPose(withPose(HANDS_ON_HIPS, EXPR.smug), settlePose(1, 1));
    const peek = withPose(IDLE2, {peek: 1, lookX: 1, mouth: 'smirk', lid: 0.3});
    const smug = withPose(HANDS_ON_HIPS, EXPR.smug);
    const busted = withPose(withPose(IDLE2, ARMS.handsUp), EXPR.busted);
    const crossed = withPose(ARMS_CROSSED, EXPR.smug);
    const mouthPlace = {x: cols[6], y: y2, scale: s};
    const hm0 = withPose(HAND_OVER_MOUTH, {...EXPR.busted, sweat: 0, peek: -0.6});
    const m = mouthWorld(mouthPlace, hm0);
    const hm = {...hm0, armR: reach2(mouthPlace, hm0, 1, m.x, m.y + 4 * s, -1)};
    const crouchWalk = walkPose(0.3, {style: 'walk', dir: -1, base: {...IDLE2, ...CROUCH}});
    const row2 = [crouch, settle, peek, smug, busted, crossed, hm, crouchWalk, IDLE2];
    return (
      <AbsoluteFill style={{background: WALL}}>
        {[y1, y2].map((y) => (
          <div key={y} style={{position: 'absolute', left: 0, right: 0, top: y - 4, height: 3, background: C.inkMuted, opacity: 0.4}} />
        ))}
        {row1.map((p, i) => (
          <Character2 key={'a' + i} look={CAST.guesser} pose={p} frame={g} seed={22} x={cols[i]} y={y1} scale={s} life={0} />
        ))}
        {row2.map((p, i) => (
          <Character2 key={'b' + i} look={CAST.guesser} pose={p} frame={g} seed={22} x={cols[i]} y={y2} scale={s} life={0} />
        ))}
      </AbsoluteFill>
    );
  }
  if (which === 3 || which === 4) {
    // identity check: the Video 01 rig (3) and Character2 (4) drawn at the same places with plain Video 01 poses
    const poses: Pose2[] = [IDLE2, {...IDLE2, mouth: 'grin', lean: 6, tilt: -5, armL: {a: 40, b: 30}, armR: {a: -10, b: 80}, lookX: 0.5}];
    const looks = [CAST.guesser, CAST.checker, CAST.clerkB, CAST.host];
    return (
      <AbsoluteFill style={{background: WALL}}>
        {looks.map((lk, i) =>
          poses.map((p, j) => {
            const props = {look: lk, pose: p, frame: 30, seed: 5, x: 200 + i * 440 + j * 210, y: 900, scale: 0.9, life: 0};
            return which === 3 ? <Character key={i + '-' + j} {...props} /> : <Character2 key={i + '-' + j} {...props} />;
          }),
        )}
      </AbsoluteFill>
    );
  }
  // checker sheet: deadpan holding the sensor big, arms crossed, crouch, peek; tokens at several facings
  const big: RigPlace = {x: 330, y: 1000, scale: 1.45};
  const p0 = withPose({...IDLE2, armsFront: 'both'}, EXPR.deadpan);
  const armR = reach2(big, p0, 1, big.x + GRIP.x * big.scale, big.y + GRIP.y * big.scale, -1);
  const hand = handWorld2(big, {...p0, armR}, 1);
  const bl = sensorPoint('boxBottomLeft', big.scale);
  const armL = reach2(big, {...p0, armR}, -1, hand.x + bl.x, hand.y + bl.y + 6 * big.scale, -1);
  const others = [withPose(ARMS_CROSSED, EXPR.deadpan), withPose(withPose(IDLE2, CROUCH), EXPR.deadpan), withPose(IDLE2, {peek: -1, ...EXPR.deadpan, lookX: -1})];
  return (
    <AbsoluteFill style={{background: WALL}}>
      <Character2 look={CAST.checker} pose={{...p0, armR, armL}} frame={g} seed={9} x={big.x} y={big.y} scale={big.scale} life={0} holdR={<HandheldSensor reveal={0.8} led={1} skin={CAST.checker.skin} />} />
      {others.map((p, i) => (
        <Character2 key={i} look={CAST.checker} pose={p} frame={g} seed={9} x={760 + i * 230} y={560} scale={0.6} life={0} />
      ))}
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
        {[0, 90, 200, 300].map((f, i) => (
          <g key={i}>
            <CheckerToken x={760 + i * 230} y={800} size={130} facing={f} asGroup />
            <GuesserToken x={760 + i * 230} y={980} size={130} facing={f} asGroup />
          </g>
        ))}
        {[0, 120].map((f, i) => (
          <SensorTop key={i} x={1720 + i * 0} y={300 + i * 200} size={90} facing={f} asGroup />
        ))}
        <CheckerToken x={1720} y={760} size={60} facing={30} asGroup />
        <GuesserToken x={1820} y={760} size={60} facing={-30} asGroup />
      </svg>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ composition */

export const KitCast: React.FC<{sheet?: number}> = ({sheet}) => {
  const g = useCurrentFrame();
  if (sheet) return <Sheet which={sheet} g={g} />;
  const planT = tw(g, PLAN_IN, 12, E.inOut);
  return (
    <AbsoluteFill style={{background: WALL}}>
      {planT < 1 && <Stage g={g} />}
      {planT > 0 && (
        <AbsoluteFill style={{opacity: planT}}>
          <PlanView g={g} />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
