// Limits (the skeptic watches the footage with a stopwatch; what the demo didn't show) and the ending (the answer over
// the strongest airborne images, then one brief Crew reaction with the crash-mat callback).
import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {C, F} from '../theme';
import {Character, IDLE, Pose, mixPose, reachLocal} from '../components/Character';
import {CAST} from '../components/cast';
import {Foot} from './Foot';
import {Barrier} from './Opening';
import {cue, E, FPS, ramp, Tag, useT} from './kit';

export const LIM = {start: 173.2, approach: 180.73, end: 186.73};
const L = {
  answer: cue('answer', 'P21'), long: cue('long', 'P21'), much: cue('much', 'P21'), refill: cue('refill', 'P21'),
  noOne: cue('one', 'P21', 0), musk: cue('Musk', 'P21'), demo: cue('demo', 'P21', 1, true),
};

const Stopwatch = (
  <g transform="translate(0 -6)">
    <rect x={-6} y={-46} width={12} height={12} rx={3} fill={C.ink} />
    <circle r={34} fill={C.cream} stroke={C.ink} strokeWidth={6} />
    <line x1={0} y1={0} x2={0} y2={-22} stroke={C.coral} strokeWidth={5} strokeLinecap="round" />
    <circle r={4} fill={C.ink} />
  </g>
);

const Q: React.FC<{y: number; q: string; a: string; o: number; aColor?: string}> = ({y, q, a, o, aColor = C.coralDeep}) => (
  <div style={{position: 'absolute', left: 48, top: y, opacity: o, transform: `translateX(${-30 * (1 - o)}px)`, fontFamily: F.body, fontWeight: 800, fontSize: 38, color: C.ink, background: C.cream, border: `3px solid ${C.ink}`, borderRadius: 18, padding: '8px 22px', maxWidth: 1000}}>
    {q} <span style={{color: aColor}}>{a}</span>
  </div>
);

export const Limits: React.FC = () => {
  const t = useT(LIM.start);
  const frame = Math.round(t * FPS);
  const CH = {x: 1560, y: 1200, scale: 1.25};
  const watch: Pose = {...IDLE, armR: {a: 14, b: 40}, armL: {a: 10, b: 20}, lookX: -0.6, lookY: -0.8, tilt: 6, brows: 0.2, mouth: 'hmm'};
  const time: Pose = {...IDLE, armR: reachLocal(70, -330, 1), armL: {a: 10, b: 20}, lookX: 0.25, lookY: -0.2, tilt: 4, brows: 0.4, browAsym: 0.6, mouth: 'flat'};
  const doubt: Pose = {...IDLE, armR: {a: 14, b: 40}, armL: {a: 10, b: 20}, lookX: -0.4, lookY: -0.6, tilt: -3, brows: -0.1, browAsym: 0.8, mouth: 'smirk'};
  const pose = t < L.long - 0.3 ? watch : t < L.noOne - 0.3 ? mixPose(watch, time, ramp(t, L.long - 0.3, L.long + 0.1, E.out)) : mixPose(time, doubt, ramp(t, L.noOne - 0.3, L.noOne + 0.2));
  const fgIn = ramp(t, LIM.start + 0.2, LIM.start + 0.7, E.out);
  return (
    <AbsoluteFill>
      <Sequence from={0} durationInFrames={Math.round((LIM.approach - LIM.start) * FPS)}>
        <Foot src="c2_limits_aer.mp4" muted />
      </Sequence>
      <Sequence from={Math.round((LIM.approach - LIM.start) * FPS)}>
        <Foot src="c2_run2_approach.mp4" muted />
      </Sequence>
      <AbsoluteFill style={{transform: `translateY(${(1 - fgIn) * 300}px)`}}>
        <AbsoluteFill style={{background: 'linear-gradient(rgba(0,0,0,0) 72%, rgba(10,16,22,0.5) 100%)'}} />
        <Character look={CAST.checker} pose={pose} frame={frame} seed={4} x={CH.x} y={CH.y} scale={CH.scale} life={0.6} shadow={false} holdR={Stopwatch} front="R" />
        <Barrier x0={1180} x1={1960} y={950} />
      </AbsoluteFill>
      <Tag kind="notshown" text="What the demo didn't show" opacity={ramp(t, L.answer - 0.6, L.answer - 0.2)} />
      <Q y={120} q="How long can it stay up?" a="Not shown" o={ramp(t, L.long - 0.2, L.long + 0.2)} />
      <Q y={200} q="Air per hop? Refill time?" a="Not given" o={ramp(t, L.much - 0.2, L.much + 0.2)} />
      <Q y={280} q="A driver inside?" a="No · Musk: it ran itself for the demo" o={ramp(t, L.noOne - 0.2, L.noOne + 0.2)} aColor={C.inkSoft} />
      <Tag kind="footage" text="Tesla footage" opacity={1 - ramp(t, L.answer - 0.6, L.answer - 0.2)} />
    </AbsoluteFill>
  );
};

export const END = {start: 186.73, hop: 191.97, front: 197.1, end: 200.5};
const E2 = {both: cue('tricks', 'P22'), pressure: cue('pressure', 'P22'), gas: cue('Gas', 'P22'), flying: cue('flying', 'P22'), demo: cue('demo', 'P22'), last: cue('that', 'P22', 0, true)};

export const Ending: React.FC = () => {
  const t = useT(END.start);
  const frame = Math.round(t * FPS);
  // brief Crew reaction over the last image: clerkC watching (bookend of the opening), the checker beside her with the
  // crash mat from the ramp scene tucked under her arm
  const fg = ramp(t, END.front + 0.2, END.front + 0.7, E.out);
  const awe: Pose = {...IDLE, armL: {a: 12, b: 24}, armR: {a: 138, b: 8}, lean: 3, tilt: -8, lookX: 0.6, lookY: -1, brows: 0.8, mouth: 'smile'};
  const turn: Pose = {...IDLE, armL: {a: 12, b: 24}, armR: {a: 30, b: 50}, lean: 0, tilt: -4, lookX: -0.9, lookY: -0.1, brows: 0.3, mouth: 'hmm'};
  const cPose = t < E2.demo - 0.2 ? awe : mixPose(awe, turn, ramp(t, E2.demo - 0.2, E2.demo + 0.3));
  const chk: Pose = {...IDLE, armL: {a: 30, b: 95}, armR: {a: 8, b: 12}, lookX: 0.4, lookY: -0.9, tilt: -4, brows: 0.2, browAsym: 0.5, mouth: 'flat'};
  const chk2: Pose = {...chk, lookX: 0.7, lookY: 0.1, tilt: 3, brows: 0.1, browAsym: 0.8, mouth: 'smirk'};
  const kPose = t < E2.last ? chk : mixPose(chk, chk2, ramp(t, E2.last, E2.last + 0.4));
  const mat = (
    <g transform="translate(-30 30) rotate(-12)">
      <rect x={-80} y={-70} width={160} height={70} rx={12} fill="#4F7CC9" stroke={C.ink} strokeWidth={5} />
      <line x1={-30} y1={-66} x2={-30} y2={-4} stroke="#3A5FA0" strokeWidth={5} />
      <line x1={30} y1={-66} x2={30} y2={-4} stroke="#3A5FA0" strokeWidth={5} />
    </g>
  );
  return (
    <AbsoluteFill>
      <Sequence from={0} durationInFrames={Math.round((END.hop - END.start) * FPS)}>
        <Foot src="c2_end_aerial.mp4" muted />
      </Sequence>
      <Sequence from={Math.round((END.hop - END.start) * FPS)} durationInFrames={Math.round((END.front - END.hop) * FPS)}>
        <Foot src="c2_end_hop.mp4" muted />
      </Sequence>
      <Sequence from={Math.round((END.front - END.start) * FPS)}>
        <Foot src="c2_end_front.mp4" muted />
      </Sequence>
      <AbsoluteFill style={{transform: `translateY(${(1 - fg) * 340}px)`, opacity: fg}}>
        <AbsoluteFill style={{background: 'linear-gradient(rgba(0,0,0,0) 72%, rgba(10,16,22,0.5) 100%)'}} />
        {/* the checker on the outside with the crash mat; clerkC inside, pointing up at the car without crossing her */}
        <Character look={CAST.checker} pose={kPose} frame={frame} seed={4} x={300} y={1200} scale={1.25} life={0.6} shadow={false} holdL={mat} front="L" />
        <Character look={CAST.clerkC} pose={cPose} frame={frame} seed={7} x={620} y={1200} scale={1.25} life={0.6} shadow={false} />
        <Barrier x0={-40} x1={860} y={950} />
      </AbsoluteFill>
      <Tag kind="footage" text={t < END.hop ? 'Tesla footage · second run (slowed)' : t < END.front ? 'Tesla footage · the hop (slowed)' : 'Tesla footage · the hop, front angle (slowed)'} />
    </AbsoluteFill>
  );
};
