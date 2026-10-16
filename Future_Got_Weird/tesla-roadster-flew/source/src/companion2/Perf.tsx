// Performance: the stream's recorded 0-60 run (its own timer stops at 01.00) and its overhead replay, then a later
// launch with the gas blast. Labels: "Shown run: 1.00 s" on the recorded run; "Tesla's claimed best: 0.81 s" as
// Tesla's figure, never synced to a timer, so the footage isn't presented as proof of it.
import React from 'react';
import {AbsoluteFill, interpolate, Sequence} from 'remotion';
import {C, F} from '../theme';
import {Foot} from './Foot';
import {cue, E, FPS, Label, ramp, speechFree, Tag, useT} from './kit';

export const PERF = {start: 131.6, overhead: 138.0, live: 143.5, liveSlow: 146.3, end: 150.7};
const T = {
  harder: cue('harder', 'P17'), recorded: cue('recorded', 'P18'), oneSecond: cue('second', 'P18'), zero: cue('zero', 'P19'), nobody: cue('Nobody', 'P19'),
};

export const Perf: React.FC = () => {
  const t = useT(PERF.start);
  // event sound: ducked under every word, full in the pauses (ts = seconds into that shot; s0 = the shot's film start)
  const ev = (base: number, s0: number) => (ts: number) => base * (0.12 + 0.88 * speechFree(s0 + ts));
  const at = (a: number) => Math.round((a - PERF.start) * FPS);
  const claimIn = ramp(t, T.zero - 0.05, T.zero + 0.3, E.back);
  return (
    <AbsoluteFill>
      <Sequence from={0} durationInFrames={at(PERF.overhead)}>
        <Foot src="c2_rec_run.mp4" volume={ev(0.55, PERF.start)} />
        <Tag kind="footage" text="Tesla footage · the stream's recorded run" />
      </Sequence>
      <Sequence from={at(PERF.overhead)} durationInFrames={at(PERF.live) - at(PERF.overhead)}>
        <Foot src="c2_rec_overhead.mp4" muted />
        <Tag kind="footage" text="Tesla footage · recorded run, overhead replay (0.6×)" />
      </Sequence>
      <Sequence from={at(PERF.live)} durationInFrames={at(PERF.liveSlow) - at(PERF.live)}>
        <Foot src="c2_live_a.mp4" volume={ev(0.5, PERF.live)} />
      </Sequence>
      <Sequence from={at(PERF.liveSlow)} durationInFrames={at(PERF.end) - at(PERF.liveSlow)}>
        <Foot src="c2_live_b.mp4" muted />
      </Sequence>
      <Tag kind="footage" text={t < PERF.liveSlow ? 'Tesla footage · a later launch' : 'Tesla footage · a later launch (half speed)'} opacity={t >= PERF.live ? 1 : 0} />
      <Label x={960} y={110} text="Tesla says: more push than the tires can grip" size={40} bg={C.saffronLight} opacity={ramp(t, T.harder - 0.2, T.harder + 0.2) * (1 - ramp(t, PERF.overhead + 2.3, PERF.overhead + 2.6))} />
      <Label x={960} y={110} text="Shown run: 1.00 s" size={52} color={C.cream} bg="rgba(5,10,14,0.82)" border={C.cream} opacity={ramp(t, T.recorded - 0.1, T.recorded + 0.2) * (1 - ramp(t, PERF.live - 0.25, PERF.live))} sub={<span style={{opacity: ramp(t, T.oneSecond - 0.1, T.oneSecond + 0.2)}}>the stream's own timer, this recorded run</span>} />
      {/* Tesla's figure: a plate, not a timer */}
      <div style={{position: 'absolute', left: 0, width: 1920, top: 70, textAlign: 'center', opacity: Math.min(1, claimIn * 1.4) * (1 - ramp(t, PERF.end - 0.4, PERF.end)), transform: `scale(${0.9 + 0.1 * claimIn})`}}>
        <div style={{display: 'inline-block', background: 'rgba(5,10,14,0.78)', border: `3px solid ${C.saffron}`, borderRadius: 28, padding: '10px 40px 16px'}}>
          <div style={{fontFamily: F.display, fontWeight: 700, fontSize: 46, color: C.cream}}>Tesla's claimed best</div>
          <div style={{fontFamily: F.display, fontWeight: 700, fontSize: 130, lineHeight: 1, color: C.saffron}}>0.81<span style={{fontSize: 64}}> s</span></div>
          <div style={{fontFamily: F.body, fontWeight: 800, fontSize: 30, color: C.cream, opacity: ramp(t, T.nobody - 0.1, T.nobody + 0.3), marginTop: 6}}>Tesla's figure · not independently timed</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
