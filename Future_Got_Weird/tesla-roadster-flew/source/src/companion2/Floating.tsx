// Action and reaction, with the Crew's demonstrator floating in a no-gravity, no-friction thought experiment.
// Throw 1 from the chest: the ball goes right, she drifts left. Throw 2 from above her head (off her centre of mass):
// she drifts left AND starts to turn. Same colour key as the car: blue = what is thrown out, saffron = push on her.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, F} from '../theme';
import {Character, handWorld, IDLE, Pose, mixPose, reachLocal} from '../components/Character';
import {CAST} from '../components/cast';
import {Arrow, cue, E, FLOW, FORCE, Label, lerp, ramp, rnd, Tag, useT} from './kit';

const T = {
  throw1: cue('throw', 'P12', 0), way1: cue('way', 'P12', 0), pushed: cue('pushed', 'P12'), other: cue('other', 'P12'),
  throw2: cue('throw', 'P12', 1), side: cue('side', 'P12'), move: cue('move', 'P12'), turn: cue('turn', 'P12'),
  end: cue('turn', 'P12', 0, true),
};
const SC = 1.05; // character scale
const COM = -220; // centre of mass, character-local y
const BALL_R = 34;

export const Floating: React.FC<{start: number; end: number}> = ({start, end}) => {
  const t = useT(start);
  const frame = Math.round(t * 30);
  const rel1 = T.way1 - 0.05; // release, throw 1
  const reset = T.throw2 - 0.3; // second setup (dissolve)
  const rel2 = T.move - 0.25; // release, throw 2
  const second = t >= reset;
  // drift and spin (px/s, deg/s) after each release
  const v = 150, w = 46;
  const x = 960 + (second ? -v * Math.max(0, t - rel2) : -v * Math.max(0, t - rel1));
  const yBob = Math.sin(t * 1.4) * 6;
  const y = 700 + yBob;
  const idle = 4 * Math.sin((t - start) * 1.3) * (1 - ramp(t, rel2 - 0.3, rel2)); // zero-g sway before the second throw
  const rot = idle + (second ? -w * Math.max(0, t - rel2) * Math.min(1, Math.max(0, t - rel2) / 0.25) : 0); // counter-clockwise
  // poses
  const chest: Pose = {...IDLE, armL: reachLocal(-28, -262, -1), armR: reachLocal(28, -262, 1), lookX: 0.5, lookY: 0, brows: 0.2, mouth: 'smile', tilt: 0};
  const wind: Pose = {...chest, armL: reachLocal(-60, -250, -1), armR: reachLocal(-10, -250, 1), lean: -6, mouth: 'flat'};
  const thrown: Pose = {...IDLE, armL: reachLocal(110, -300, -1), armR: reachLocal(150, -300, 1), lean: 4, lookX: 0.8, lookY: 0, brows: 0.4, mouth: 'o'};
  const overhead: Pose = {...IDLE, armL: reachLocal(-14, -432, -1), armR: reachLocal(14, -432, 1), lookX: 0.4, lookY: -0.6, brows: 0.3, mouth: 'smile'};
  const thrown2: Pose = {...IDLE, armL: reachLocal(90, -440, -1, -1), armR: reachLocal(130, -430, 1, -1), lookX: 0.8, lookY: -0.3, brows: 0.5, mouth: 'o'};
  const deadpan: Pose = {...thrown2, armL: {a: 60, b: 20}, armR: {a: 70, b: 25}, lookX: 0, lookY: 0, brows: -0.2, mouth: 'flat', blink: 0.55};
  let pose: Pose;
  if (!second) {
    pose = t < rel1 - 0.45 ? chest : t < rel1 ? mixPose(chest, wind, ramp(t, rel1 - 0.45, rel1 - 0.15)) : mixPose(wind, thrown, ramp(t, rel1, rel1 + 0.18, E.out));
  } else {
    pose = t < rel2 - 0.4 ? mixPose(chest, overhead, ramp(t, reset + 0.1, reset + 0.8)) : t < rel2 ? overhead : t < T.turn ? mixPose(overhead, thrown2, ramp(t, rel2, rel2 + 0.2, E.out)) : mixPose(thrown2, deadpan, ramp(t, T.turn, T.turn + 0.6));
  }
  // the ball: held between the hands until release, then flies right
  const ch = {x, y, scale: SC};
  const hl = handWorld(ch, pose.armL, -1), hr = handWorld(ch, pose.armR, 1);
  const rel = second ? rel2 : rel1;
  let bx = (hl.x + hr.x) / 2, by = (hl.y + hr.y) / 2 - (second ? BALL_R * 0.7 : 0);
  if (t > rel) {
    // released from where the hands were at release (approximation: from the pose at release)
    const rp = second ? overhead : wind;
    const h1 = handWorld({...ch, x: second ? 960 : 960}, rp.armL, -1), h2 = handWorld({...ch, x: 960}, rp.armR, 1);
    bx = (h1.x + h2.x) / 2 + 1500 * (t - rel);
    by = (h1.y + h2.y) / 2 - (second ? BALL_R * 0.7 : 0);
  }
  const fade = ramp(t, reset - 0.25, reset) * (1 - ramp(t, reset, reset + 0.25)); // dip between the two throws
  const pushO = (r: number) => ramp(t, r, r + 0.08) * (1 - ramp(t, r + 0.6, r + 1.0));
  const comX = x, comY = y + COM * SC;
  const stars = Array.from({length: 60}, (_, i) => ({x: rnd(i) * 1920, y: rnd(i + 99) * 1080, r: 1.5 + rnd(i + 7) * 2.5}));
  return (
    <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 45%, #2D3E66 0%, #1A2440 70%, #121A2E 100%)'}}>
      <svg width={1920} height={1080} style={{position: 'absolute'}}>
        {stars.map((s, i) => <circle key={i} cx={((s.x - (t - start) * 34) % 1920 + 1920) % 1920} cy={s.y} r={s.r} fill="#E8EEF8" opacity={0.55} />)}
      </svg>
      {/* the demonstrator, rotating rigidly about her centre of mass */}
      <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transformOrigin: `${comX}px ${comY}px`, transform: `rotate(${rot}deg)`}}>
        <Character look={CAST.clerkA} pose={pose} frame={frame} seed={2} x={x} y={y} scale={SC} shadow={false} life={0.5} />
        {t <= rel && (
          <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
            <circle cx={bx} cy={by} r={BALL_R} fill={C.saffronDeep} stroke={C.ink} strokeWidth={5} />
            <path d={`M ${bx - BALL_R + 6} ${by} Q ${bx} ${by - 16} ${bx + BALL_R - 6} ${by}`} fill="none" stroke={C.ink} strokeWidth={3} />
          </svg>
        )}
      </div>
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
        {t > rel && bx < 2100 && (
          <g>
            <circle cx={bx} cy={by} r={BALL_R} fill={C.saffronDeep} stroke={C.ink} strokeWidth={5} />
            <Arrow x1={bx - 210} y1={by} x2={bx - 50} y2={by} color={FLOW} w={14} opacity={ramp(t, rel, rel + 0.1) * (1 - ramp(t, rel + 0.5, rel + 0.7))} />
          </g>
        )}
        {/* push on her: opposite to the throw, at the point she threw from */}
        {!second && <Arrow x1={x - 40} y1={y - 262 * SC} x2={x - 230} y2={y - 262 * SC} color={FORCE} w={18} opacity={pushO(rel1)} />}
        {second && <Arrow x1={x - 40} y1={y - 440 * SC} x2={x - 230} y2={y - 440 * SC} color={FORCE} w={18} opacity={pushO(rel2)} />}
        {/* centre of mass marker in the second throw: the push is off it, so she turns */}
        {second && (
          <g opacity={ramp(t, T.side - 0.3, T.side + 0.1) * (1 - ramp(t, end - 0.6, end - 0.3))}>
            <circle cx={comX} cy={comY} r={16} fill={C.cream} stroke={C.ink} strokeWidth={4} />
            <path d={`M ${comX} ${comY - 16} A 16 16 0 0 1 ${comX + 16} ${comY} L ${comX} ${comY} Z M ${comX} ${comY + 16} A 16 16 0 0 1 ${comX - 16} ${comY} L ${comX} ${comY} Z`} fill={C.ink} />
          </g>
        )}
      </svg>
      <AbsoluteFill style={{background: '#121A2E', opacity: fade}} />
      <Tag kind="analogy" text="Analogy · no gravity, no friction" />
      <Label x={960} y={1000} text={<span><span style={{color: FLOW}}>■</span> thrown out one way &nbsp;·&nbsp; <span style={{color: C.saffronDeep}}>■</span> push on her, the other way</span>} size={36} opacity={ramp(t, rel1 + 0.1, rel1 + 0.5) * (1 - ramp(t, end - 0.4, end))} />
      <Label x={comX + 150} y={comY + 10} align="left" text="centre of mass" size={30} opacity={second ? ramp(t, T.side - 0.2, T.side + 0.2) * (1 - ramp(t, rel2 + 0.4, rel2 + 0.8)) : 0} />
    </AbsoluteFill>
  );
};
