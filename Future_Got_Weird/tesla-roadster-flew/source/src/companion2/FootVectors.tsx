// "Here's the real thing, at half speed": arrows only on gas plumes that are visible in the frame (positions keyed by
// hand from gridded frames, source pixels). Blue = gas flow (observed). Saffron push arrows appear only where the gas
// fires straight down (push straight up); during the roll no rotation direction is drawn, because the footage does not
// show which axis the turn is about.
//  A: hop side replay, rec_224911 35.80–38.12 at 0.5x (c2_hop_slow_a): upside down with plumes up, then an opposite pair.
//  B: second run, side angle, rec_224730 2:09.60–2:11.92 at 0.5x (c2_run2_slow): gas firing down into the landing.
import React from 'react';
import {AbsoluteFill, interpolate, Sequence} from 'remotion';
import {C, F} from '../theme';
import {Foot} from './Foot';
import {Arrow, FLOW, FORCE, Label, ramp, Tag, useT} from './kit';

type K = [number, number, number, number, number]; // src time, x1, y1, x2, y2
const lerpKeys = (keys: K[], s: number) => {
  if (s <= keys[0][0]) return keys[0].slice(1);
  for (let i = 1; i < keys.length; i++) {
    if (s <= keys[i][0]) {
      const u = (s - keys[i - 1][0]) / (keys[i][0] - keys[i - 1][0]);
      return [1, 2, 3, 4].map((j) => keys[i - 1][j] + (keys[i][j] - keys[i - 1][j]) * u);
    }
  }
  return keys[keys.length - 1].slice(1);
};
type Vec = {keys: K[]; on: [number, number]; push?: boolean};
// A (rec_224911), from the Short v3 trace (short3/Airborne.tsx)
const HOP: Vec[] = [
  {keys: [[36.4, 845, 300, 845, 70], [36.8, 691, 300, 691, 70], [37.0, 614, 320, 614, 80], [37.2, 538, 310, 538, 80]], on: [36.47, 37.25]},
  {keys: [[36.4, 1152, 300, 1152, 70], [36.8, 1044, 300, 1044, 70], [37.0, 960, 320, 960, 90], [37.2, 902, 310, 902, 90]], on: [36.47, 37.25]},
  {keys: [[37.7, 338, 230, 338, 40], [37.8, 338, 245, 338, 30], [37.9, 365, 280, 365, 60], [38.0, 422, 300, 422, 190]], on: [37.7, 38.05]},
  {keys: [[37.7, 818, 440, 818, 600], [37.8, 826, 445, 826, 610], [37.9, 845, 480, 845, 660], [38.0, 960, 470, 960, 630]], on: [37.74, 38.05]},
];
// B (rec_224730), keyed from 0.2 s gridded frames (qa/c2/vectors/)
const RUN2: Vec[] = [
  {keys: [[129.6, 870, 545, 640, 550], [129.8, 850, 550, 615, 560], [129.95, 860, 555, 640, 565]], on: [129.6, 129.95]},
  {keys: [[129.6, 1020, 630, 1010, 880], [129.8, 990, 640, 990, 880], [129.95, 1000, 630, 1000, 860]], on: [129.6, 129.95]},
  {keys: [[130.0, 880, 615, 880, 840], [130.2, 945, 625, 945, 900], [130.4, 990, 625, 990, 880], [130.6, 1015, 630, 1015, 820], [130.8, 1010, 615, 1010, 760]], on: [129.98, 130.85], push: true},
  {keys: [[130.0, 1040, 615, 1040, 840], [130.2, 1075, 625, 1075, 900], [130.4, 1115, 625, 1115, 880], [130.6, 1140, 630, 1140, 820], [130.8, 1110, 615, 1110, 760]], on: [129.98, 130.85], push: true},
];

const Vectors: React.FC<{vecs: Vec[]; src: number}> = ({vecs, src}) => (
  <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
    {vecs.map((v, i) => {
      const o = interpolate(src, [v.on[0], v.on[0] + 0.05, v.on[1] - 0.05, v.on[1]], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
      if (o <= 0) return null;
      const [x1, y1, x2, y2] = lerpKeys(v.keys, src);
      return (
        <g key={i}>
          <Arrow x1={x1} y1={y1} x2={x2} y2={y2} color={FLOW} w={18} opacity={o} />
          {v.push && <Arrow x1={x1} y1={y1 - 95} x2={x1} y2={y1 - 215} color={FORCE} w={20} opacity={o} />}
        </g>
      );
    })}
  </svg>
);

export const FV = {hopStart: 114.6, run2Start: 119.24, end: 123.9};

export const FootVectors: React.FC = () => {
  const t = useT(FV.hopStart);
  const hopSrc = 35.8 + (t - FV.hopStart) / 2;
  const runSrc = 129.6 + (t - FV.run2Start) / 2;
  return (
    <AbsoluteFill>
      <Sequence from={0} durationInFrames={Math.round((FV.run2Start - FV.hopStart) * 30)}>
        <Foot src="c2_hop_slow_a.mp4" muted />
        <Vectors vecs={HOP} src={hopSrc} />
        <Tag kind="footage" text="Tesla footage · the hop, half speed" />
      </Sequence>
      <Sequence from={Math.round((FV.run2Start - FV.hopStart) * 30)}>
        <Foot src="c2_run2_slow.mp4" muted />
        <Vectors vecs={RUN2} src={runSrc} />
        <Tag kind="footage" text="Tesla footage · second run, half speed" />
      </Sequence>
      {/* key */}
      <div style={{position: 'absolute', right: 48, top: 36, fontFamily: F.body, fontWeight: 800, fontSize: 28, color: C.ink, background: C.cream, border: `3px solid ${C.ink}`, borderRadius: 18, padding: '10px 18px', lineHeight: 1.5}}>
        <div><span style={{display: 'inline-block', width: 40, height: 14, background: FLOW, border: `2px solid ${C.ink}`, borderRadius: 7, marginRight: 12}} />gas out (visible plumes)</div>
        <div><span style={{display: 'inline-block', width: 40, height: 14, background: FORCE, border: `2px solid ${C.ink}`, borderRadius: 7, marginRight: 12}} />push on the car</div>
      </div>
      <Label x={960} y={1000} text="an opposite pair" size={38} opacity={ramp(hopSrc, 37.66, 37.74) * (1 - ramp(t, FV.run2Start - 0.25, FV.run2Start - 0.05))} />
      <Label x={960} y={1000} text="gas down, car pushed up" size={38} opacity={ramp(t, FV.run2Start + 0.8, FV.run2Start + 1.1) * (1 - ramp(t, FV.end - 1.0, FV.end - 0.6))} />
    </AbsoluteFill>
  );
};
