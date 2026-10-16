// Opening: the second run from the air (upside down on the ramp, leaves it, rolls, lands), then the first run's hang
// with one of the Crew watching from an illustrated foreground; her eyeline leads a push into the car-ramp gap, and
// the shot matches into the illustrated car at the same orientation (RampScene's first frame).
import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {C, F} from '../theme';
import {Character, IDLE, Pose, mixPose} from '../components/Character';
import {CAST} from '../components/cast';
import {Foot} from './Foot';
import {cue, E, FPS, Label, ramp, Tag, track, useT} from './kit';

export const OPEN = {
  cut: cue('Those', 'P4') - 0.1, // to the hang close-up
  first: cue('first', 'P4'),
  match: 12.95,
  matchEnd: 13.3,
};

/** Illustrated foreground: a crowd barrier at the bottom of the frame with Crew behind it (screen space). */
export const Barrier: React.FC<{x0?: number; x1?: number; y?: number}> = ({x0 = -40, x1 = 860, y = 930}) => {
  const posts = [];
  for (let x = x0 + 40; x < x1; x += 200) posts.push(x);
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <rect x={x0} y={y + 20} width={x1 - x0} height={1080 - y} fill="#2E3B48" stroke={C.ink} strokeWidth={4} />
      <rect x={x0} y={y} width={x1 - x0} height={34} rx={10} fill="#C9D3D9" stroke={C.ink} strokeWidth={4} />
      {posts.map((x) => <rect key={x} x={x} y={y + 30} width={16} height={1080 - y} fill="#9AA6AD" stroke={C.ink} strokeWidth={3} />)}
      {/* reflective chevrons */}
      {posts.slice(0, -1).map((x, i) => (
        <g key={`c${i}`}>
          <path d={`M ${x + 40} ${y + 70} l 60 0 l 30 40 l -60 0 Z`} fill={C.saffron} stroke={C.ink} strokeWidth={3} />
          <path d={`M ${x + 120} ${y + 70} l 50 0 l 30 40 l -50 0 Z`} fill={C.saffron} stroke={C.ink} strokeWidth={3} />
        </g>
      ))}
    </svg>
  );
};

export const Opening: React.FC = () => {
  const t = useT(0);
  const frame = Math.round(t * FPS);
  // clerkC (curious viewer) looks up at the hanging car; at "the first one" she points and the camera follows her eyeline
  const look: Pose = {...IDLE, armL: {a: 12, b: 24}, armR: {a: 18, b: 30}, lean: 2, tilt: -7, lookX: 0.55, lookY: -0.95, brows: 0.6, mouth: 'o'};
  const point: Pose = {...IDLE, armL: {a: 12, b: 24}, armR: {a: 138, b: 8}, lean: 4, tilt: -9, lookX: 0.65, lookY: -1, brows: 0.8, mouth: 'smile'};
  const pose = mixPose(look, point, ramp(t, OPEN.first - 0.45, OPEN.first + 0.1, E.out));
  const fg = ramp(t, OPEN.first + 0.2, OPEN.match - 0.1, E.in); // foreground leaves (parallax faster than the push)
  const fgIn = 1;
  const push = (ts: number) => {
    const tt = OPEN.cut + ts;
    const u = ramp(tt, OPEN.first - 0.1, OPEN.matchEnd, E.inOut);
    return {x: 960 + (950 - 960) * u, y: 540 + (395 - 540) * u, z: 1 + 0.78 * u};
  };
  const footOut = 1 - ramp(t, OPEN.match, OPEN.matchEnd, E.inOut);
  return (
    <AbsoluteFill>
      {/* 1: second run, aerial (rec_224730 2:16.42–2:24.97), real time */}
      <Sequence from={0} durationInFrames={Math.round(OPEN.cut * FPS)}>
        <Foot src="c2_open_aerial.mp4" muted />
      </Sequence>
      {/* 2: first run, the hang, close-up from below at half speed (rec_224730 1:17.50–1:19.86) */}
      <Sequence from={Math.round(OPEN.cut * FPS)} durationInFrames={Math.round((OPEN.matchEnd - OPEN.cut) * FPS)}>
        <AbsoluteFill style={{opacity: footOut}}>
          <Foot src="c2_hang_slow.mp4" muted view={push} />
          <AbsoluteFill style={{transform: `translate(${-260 * fg}px, ${560 * fg + 40 * (1 - ramp(t, OPEN.cut, OPEN.cut + 0.3, E.out))}px) scale(${1 + 0.25 * fg})`, transformOrigin: '20% 100%', opacity: fgIn}}>
            <AbsoluteFill style={{background: 'linear-gradient(rgba(0,0,0,0) 70%, rgba(10,16,22,0.55) 100%)'}} />
            <Character look={CAST.clerkC} pose={pose} frame={frame} seed={7} x={420} y={1190} scale={1.3} life={0.7} shadow={false} />
            <Barrier />
          </AbsoluteFill>
        </AbsoluteFill>
      </Sequence>
      <Tag kind="footage" text="Tesla reveal footage · Oct 15, 2026" opacity={1 - ramp(t, OPEN.match - 0.3, OPEN.match)} />
      <Label x={60} y={990} align="left" size={34} text="Tesla's new Roadster" sub="second run: up the ramp, off, over, down" bg="rgba(12,20,24,0.78)" color={C.cream} border="rgba(255,251,240,0.5)" opacity={ramp(t, 0.4, 0.8) * (1 - ramp(t, 5.0, 5.4))} />
      <Label x={1860} y={990} align="right" size={30} text="first run: it stopped and hung" bg="rgba(12,20,24,0.78)" color={C.cream} border="rgba(255,251,240,0.5)" opacity={ramp(t, OPEN.cut + 0.2, OPEN.cut + 0.5) * (1 - ramp(t, OPEN.first - 0.3, OPEN.first))} />
    </AbsoluteFill>
  );
};
